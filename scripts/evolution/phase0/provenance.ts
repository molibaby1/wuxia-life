import { createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  copyFile,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  readlink,
} from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { RuntimeEventCatalog } from '../../../src/core/RuntimeEventCatalog';
import type { EventDefinition } from '../../../src/types/eventTypes';

export interface Phase0SourceFingerprintEntry {
  path: string;
  status: string;
  sourcePath?: string;
  objectKind?: 'regular_file' | 'symlink';
  sha256?: string;
  deleted?: true;
}

export interface Phase0SourceFingerprint {
  schemaVersion: 'phase0-source-fingerprint-v1';
  headSha: string;
  branch: string;
  worktreeEntries: Phase0SourceFingerprintEntry[];
}

export interface Phase0CatalogInput {
  schemaVersion: 'phase0-catalog-input-v1';
  events: EventDefinition[];
}

export interface ExperimentEnvelopeV1 {
  envelopeVersion: 'phase0-experiment-envelope-v1';
  runRef: string;
  sourceFingerprint: string;
  configFingerprint: string;
  seedRef: string;
  personaRef: string;
  policyRef: string;
  policyVisibilityBoundary: 'uses_hidden_oracle';
  endAge: number;
  armRef: null;
  observablePayloadHash: string;
}

export interface CreateExperimentEnvelopeInput {
  runRef: string;
  sourceFingerprint: string;
  configFingerprint: string;
  seedRef: string;
  personaRef: string;
  policyRef: string;
  endAge: number;
  observablePayloadHash: string;
}

export function sha256Hex(bytes: string | Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(source).sort()) {
    const child = source[key];
    if (child !== undefined) result[key] = canonicalize(child);
  }
  return result;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function gitText(repoRoot: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function gitBuffer(repoRoot: string, args: string[]): Buffer {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'buffer',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function splitNul(buffer: Buffer): Buffer[] {
  if (buffer.length === 0) return [];
  if (buffer[buffer.length - 1] !== 0) {
    throw new Error('malformed porcelain output: missing final NUL');
  }
  const fields: Buffer[] = [];
  let start = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    if (buffer[index] !== 0) continue;
    fields.push(buffer.subarray(start, index));
    start = index + 1;
  }
  if (fields.at(-1)?.length === 0) fields.pop();
  return fields;
}

function decodeGitPath(pathBytes: Buffer): string {
  const decoded = pathBytes.toString('utf8');
  if (!Buffer.from(decoded, 'utf8').equals(pathBytes)) {
    throw new Error('git path is not valid UTF-8; refusing lossy provenance');
  }
  if (!decoded) throw new Error('git path must not be empty');
  return decoded;
}

function normalizeRepoPath(repoRoot: string, gitPath: string): { path: string; absolutePath: string } {
  if (isAbsolute(gitPath)) throw new Error(`git path must be repository-relative: ${gitPath}`);
  const root = resolve(repoRoot);
  const absolutePath = resolve(root, gitPath);
  const relativePath = relative(root, absolutePath);
  if (!relativePath || relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new Error(`git path escapes repository root: ${gitPath}`);
  }
  return {
    path: relativePath.split(sep).join('/'),
    absolutePath,
  };
}

interface PorcelainRecord {
  status: string;
  path: string;
  sourcePath?: string;
}

function parsePorcelainV1Z(repoRoot: string, output: Buffer): PorcelainRecord[] {
  const fields = splitNul(output);
  const records: PorcelainRecord[] = [];
  let index = 0;
  while (index < fields.length) {
    const record = fields[index++];
    if (!record || record.length < 4 || record[2] !== 0x20) {
      throw new Error('malformed porcelain record');
    }
    const status = record.subarray(0, 2).toString('ascii');
    const path = normalizeRepoPath(repoRoot, decodeGitPath(record.subarray(3))).path;
    const isRenameOrCopy = status.includes('R') || status.includes('C');
    let sourcePath: string | undefined;
    if (isRenameOrCopy) {
      const source = fields[index++];
      if (!source) throw new Error(`malformed rename/copy porcelain record for ${path}`);
      sourcePath = normalizeRepoPath(repoRoot, decodeGitPath(source)).path;
    }
    records.push({ status, path, ...(sourcePath ? { sourcePath } : {}) });
  }
  return records;
}

async function hashWorktreeObject(
  repoRoot: string,
  record: PorcelainRecord,
): Promise<Phase0SourceFingerprintEntry> {
  const normalized = normalizeRepoPath(repoRoot, record.path);
  const isDeleted = record.status.includes('D');
  if (isDeleted) {
    return {
      path: normalized.path,
      status: record.status,
      ...(record.sourcePath ? { sourcePath: record.sourcePath } : {}),
      deleted: true,
    };
  }

  let stat;
  try {
    stat = await lstat(normalized.absolutePath);
  } catch (error) {
    throw new Error(`unable to inspect dirty worktree path ${record.path}: ${String(error)}`);
  }

  if (stat.isFile()) {
    return {
      path: normalized.path,
      status: record.status,
      ...(record.sourcePath ? { sourcePath: record.sourcePath } : {}),
      objectKind: 'regular_file',
      sha256: sha256Hex(await readFile(normalized.absolutePath)),
    };
  }

  if (stat.isSymbolicLink()) {
    const target = await readlink(normalized.absolutePath, { encoding: 'buffer' });
    return {
      path: normalized.path,
      status: record.status,
      ...(record.sourcePath ? { sourcePath: record.sourcePath } : {}),
      objectKind: 'symlink',
      sha256: sha256Hex(target),
    };
  }

  throw new Error(`unsupported dirty worktree object at ${record.path}; refusing incomplete fingerprint`);
}

export async function captureWorktreeSourceFingerprint(
  repoRoot = process.cwd(),
): Promise<Phase0SourceFingerprint> {
  const root = resolve(repoRoot);
  const headSha = gitText(root, ['rev-parse', 'HEAD']);
  const branch = gitText(root, ['branch', '--show-current']);
  const statusOutput = gitBuffer(root, [
    'status',
    '--porcelain=v1',
    '-z',
    '--untracked-files=all',
  ]);
  const records = parsePorcelainV1Z(root, statusOutput);
  const worktreeEntries = await Promise.all(records.map(record => hashWorktreeObject(root, record)));
  worktreeEntries.sort((left, right) =>
    left.path.localeCompare(right.path) || (left.sourcePath ?? '').localeCompare(right.sourcePath ?? ''));

  return {
    schemaVersion: 'phase0-source-fingerprint-v1',
    headSha,
    branch,
    worktreeEntries,
  };
}

export function captureCatalogInput(catalog: RuntimeEventCatalog): Phase0CatalogInput {
  const events = catalog.getAllEvents()
    .map(event => JSON.parse(JSON.stringify(event)) as EventDefinition)
    .sort((left, right) => left.id.localeCompare(right.id));
  return {
    schemaVersion: 'phase0-catalog-input-v1',
    events,
  };
}

export function createExperimentEnvelope(
  input: CreateExperimentEnvelopeInput,
): ExperimentEnvelopeV1 {
  return {
    envelopeVersion: 'phase0-experiment-envelope-v1',
    runRef: input.runRef,
    sourceFingerprint: input.sourceFingerprint,
    configFingerprint: input.configFingerprint,
    seedRef: input.seedRef,
    personaRef: input.personaRef,
    policyRef: input.policyRef,
    policyVisibilityBoundary: 'uses_hidden_oracle',
    endAge: input.endAge,
    armRef: null,
    observablePayloadHash: input.observablePayloadHash,
  };
}


export const PHASE0_REQUIRED_SEALED_ARTIFACTS = [
  'inputs/run-input.json',
  'inputs/persona.json',
  'inputs/catalog.json',
  'provenance/source-fingerprint.json',
  'internal/player-surface-source.json',
  'reviewer-input/observable-payload.json',
  'provenance/experiment-envelope.json',
  'provenance/phase0-run-data-access-manifest.json',
] as const;

export interface ExperimentRootManifestV1 {
  rootVersion: 'experiment-root-v1';
  runRef: string;
  artifacts: Array<{ path: string; sha256: string }>;
}

export interface Phase0RunAnchorRecordV1 {
  schemaVersion: 'phase0-run-anchor-v1';
  runRef: string;
  experimentRootHash: string;
  status: 'generated_awaiting_human';
  timestamp: string;
  actorRef: string;
}

const PHASE0_RUN_REF_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

export function validatePhase0RunRef(runRef: string): string {
  if (!PHASE0_RUN_REF_PATTERN.test(runRef)) {
    throw new Error(`invalid Phase 0 runRef: ${runRef}`);
  }
  return runRef;
}

export function resolvePhase0RunPath(root: string, runRef: string): string {
  validatePhase0RunRef(runRef);
  const resolvedRoot = resolve(root);
  const child = resolve(resolvedRoot, runRef);
  if (dirname(child) !== resolvedRoot || basename(child) !== runRef) {
    throw new Error(`Phase 0 runRef escapes configured root: ${runRef}`);
  }
  return child;
}

export function resolvePhase0AnchorPath(root: string, runRef: string): string {
  validatePhase0RunRef(runRef);
  const resolvedRoot = resolve(root);
  const child = resolve(resolvedRoot, `${runRef}.json`);
  if (dirname(child) !== resolvedRoot || basename(child) !== `${runRef}.json`) {
    throw new Error(`Phase 0 anchor path escapes configured root: ${runRef}`);
  }
  return child;
}

function resolveArtifactPath(root: string, artifactPath: string): string {
  if (!artifactPath || isAbsolute(artifactPath)) {
    throw new Error(`invalid artifact path: ${artifactPath}`);
  }
  const resolvedRoot = resolve(root);
  const child = resolve(resolvedRoot, artifactPath);
  const rel = relative(resolvedRoot, child);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`artifact path escapes run root: ${artifactPath}`);
  }
  return child;
}

async function writeCreateOnly(path: string, bytes: string | Uint8Array): Promise<void> {
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(bytes);
  } finally {
    await handle.close();
  }
}

export async function sealPhase0Run(
  outDir: string,
  runRef: string,
): Promise<{ experimentRootHash: string; manifest: ExperimentRootManifestV1 }> {
  validatePhase0RunRef(runRef);
  const root = resolve(outDir);
  const artifacts: ExperimentRootManifestV1['artifacts'] = [];
  for (const artifactPath of [...PHASE0_REQUIRED_SEALED_ARTIFACTS].sort()) {
    const absolutePath = resolveArtifactPath(root, artifactPath);
    const stat = await lstat(absolutePath);
    if (!stat.isFile()) {
      throw new Error(`sealed artifact must be a regular file: ${artifactPath}`);
    }
    artifacts.push({
      path: artifactPath,
      sha256: sha256Hex(await readFile(absolutePath)),
    });
  }

  const manifest: ExperimentRootManifestV1 = {
    rootVersion: 'experiment-root-v1',
    runRef,
    artifacts,
  };
  const manifestBytes = canonicalJson(manifest);
  const experimentRootHash = sha256Hex(Buffer.from(manifestBytes, 'utf8'));
  await writeCreateOnly(join(root, 'experiment-root.json'), manifestBytes);
  await writeCreateOnly(join(root, 'experiment-root.sha256'), experimentRootHash);
  return { experimentRootHash, manifest };
}

export async function validatePhase0RunSeal(
  outDir: string,
  expectedRootHash: string,
): Promise<void> {
  const root = resolve(outDir);
  const manifestText = await readFile(join(root, 'experiment-root.json'), 'utf8');
  const manifest = JSON.parse(manifestText) as ExperimentRootManifestV1;
  const canonicalManifest = canonicalJson(manifest);
  if (manifestText !== canonicalManifest) {
    throw new Error('experiment root manifest is not canonical');
  }
  const actualRootHash = sha256Hex(Buffer.from(canonicalManifest, 'utf8'));
  if (actualRootHash !== expectedRootHash) {
    throw new Error(`experiment root hash mismatch: expected ${expectedRootHash}, got ${actualRootHash}`);
  }
  const recordedRootHash = await readFile(join(root, 'experiment-root.sha256'), 'utf8');
  if (recordedRootHash !== expectedRootHash) {
    throw new Error('experiment root hash file mismatch');
  }

  const artifactPaths = manifest.artifacts.map(artifact => artifact.path);
  if (new Set(artifactPaths).size !== artifactPaths.length) {
    throw new Error('experiment root manifest contains duplicate artifact paths');
  }
  const sortedPaths = [...artifactPaths].sort();
  if (canonicalJson(artifactPaths) !== canonicalJson(sortedPaths)) {
    throw new Error('experiment root manifest artifacts are not path-sorted');
  }

  for (const artifact of manifest.artifacts) {
    const absolutePath = resolveArtifactPath(root, artifact.path);
    const stat = await lstat(absolutePath);
    if (!stat.isFile()) throw new Error(`sealed artifact is not a regular file: ${artifact.path}`);
    const actual = sha256Hex(await readFile(absolutePath));
    if (actual !== artifact.sha256) {
      throw new Error(`artifact hash mismatch: ${artifact.path}`);
    }
  }
}

async function copyTreeNoReplace(sourceDir: string, destinationDir: string): Promise<void> {
  const entries = await readdir(sourceDir, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const source = join(sourceDir, entry.name);
    const destination = join(destinationDir, entry.name);
    if (entry.isDirectory()) {
      await mkdir(destination, { recursive: false });
      await copyTreeNoReplace(source, destination);
      continue;
    }
    if (entry.isFile()) {
      await copyFile(source, destination, fsConstants.COPYFILE_EXCL);
      continue;
    }
    throw new Error(`unsupported staging object during publication: ${source}`);
  }
}

export async function publishPhase0RunNoReplace(
  stagingDir: string,
  finalRunPath: string,
  expectedRootHash: string,
): Promise<void> {
  const staging = resolve(stagingDir);
  const finalPath = resolve(finalRunPath);
  validatePhase0RunRef(basename(finalPath));
  await validatePhase0RunSeal(staging, expectedRootHash);
  await mkdir(dirname(finalPath), { recursive: true });

  try {
    await mkdir(finalPath, { recursive: false });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EEXIST') {
      throw new Error(`Phase 0 final run target already exists; no-replace publication refused: ${finalPath}`);
    }
    throw error;
  }

  await copyTreeNoReplace(staging, finalPath);
  await validatePhase0RunSeal(finalPath, expectedRootHash);
}

export async function writePhase0RunAnchor(
  anchorRoot: string,
  record: Phase0RunAnchorRecordV1,
): Promise<string> {
  validatePhase0RunRef(record.runRef);
  const resolvedRoot = resolve(anchorRoot);
  await mkdir(resolvedRoot, { recursive: true });
  const anchorPath = resolvePhase0AnchorPath(resolvedRoot, record.runRef);
  try {
    await writeCreateOnly(anchorPath, canonicalJson(record));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EEXIST') {
      throw new Error(`Phase 0 anchor already exists: ${anchorPath}`);
    }
    throw error;
  }
  return anchorPath;
}
