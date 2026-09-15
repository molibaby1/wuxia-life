import { open, lstat, mkdir, readFile, readdir, rename } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  canonicalJson,
  sha256Hex,
  validatePhase0RunSeal,
} from './phase0/provenance';
import {
  parseMultiCandidateSessionManifestV1,
  type MultiCandidateSessionManifestV1,
} from './multiCandidateSessionManifestContract';

export const CANDIDATE_SESSION_ROOT = 'artifacts/evolution/sessions' as const;

export interface CandidateSessionLocation {
  sessionRoot: string;
  manifestPath: string;
}

export interface RetainedSourceEpochAnchor {
  sourceEpochRef: string;
  manifestRef: string;
  sourceRunRef: string;
  sourceFingerprintSha256: string;
  sourceExperimentRootHash: string;
}

interface SourceAnchorEntry {
  path: string;
  sha256: string;
  objectRef: string;
}

interface SourceAnchorManifest {
  schemaVersion: 'source-epoch-anchor-v1';
  sourceEpochRef: string;
  sourceRunRef: string;
  sourceFingerprintSha256: string;
  sourceExperimentRootHash: string;
  entries: SourceAnchorEntry[];
}

function safeId(value: string, label: string): string {
  if (!/^[A-Za-z0-9._-]+$/.test(value) || value === '.' || value === '..') throw new Error(`${label} is unsafe: ${value}`);
  return value;
}

function safeRelativePath(root: string, value: string, label: string): string {
  if (!value || isAbsolute(value)) throw new Error(`${label} must be a safe relative path: ${value}`);
  const normalized = value.split(sep).join('/');
  const target = resolve(root, normalized);
  const escaped = relative(resolve(root), target);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) throw new Error(`${label} escapes root: ${value}`);
  return normalized;
}

async function writeCreateOnly(path: string, bytes: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(bytes);
  } finally {
    await handle.close();
  }
}

async function writeImmutable(path: string, bytes: string | Uint8Array): Promise<void> {
  try {
    const existing = await readFile(path);
    const next = Buffer.from(bytes);
    if (!existing.equals(next)) throw new Error(`immutable artifact already exists with different bytes: ${path}`);
    return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  await writeCreateOnly(path, bytes);
}

export function resolveCandidateSessionLocation(repositoryRoot: string, logicalSessionId: string): CandidateSessionLocation {
  const safeSessionId = safeId(logicalSessionId, 'logicalSessionId');
  const sessionRoot = resolve(repositoryRoot, CANDIDATE_SESSION_ROOT, safeSessionId);
  return { sessionRoot, manifestPath: join(sessionRoot, 'session-manifest.json') };
}

export async function writeMultiCandidateSessionManifestAtomic(
  repositoryRoot: string,
  manifest: MultiCandidateSessionManifestV1,
): Promise<void> {
  const parsed = parseMultiCandidateSessionManifestV1(manifest);
  const location = resolveCandidateSessionLocation(repositoryRoot, parsed.logicalSessionId);
  await mkdir(location.sessionRoot, { recursive: true });
  const bytes = `${canonicalJson(parsed)}\n`;
  const tempPath = join(location.sessionRoot, `.session-manifest-${process.pid}-${Date.now()}.tmp`);
  await writeCreateOnly(tempPath, bytes);
  await rename(tempPath, location.manifestPath);
}

export async function readDurableMultiCandidateSessionManifest(
  repositoryRoot: string,
  logicalSessionId: string,
): Promise<MultiCandidateSessionManifestV1> {
  const location = resolveCandidateSessionLocation(repositoryRoot, logicalSessionId);
  return parseMultiCandidateSessionManifestV1(JSON.parse(await readFile(location.manifestPath, 'utf8')) as unknown);
}

async function collectFiles(root: string, current = ''): Promise<string[]> {
  const directory = resolve(root, current || '.');
  const entries = await readdir(directory, { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relativePath = current ? join(current, entry.name) : entry.name;
    const normalized = relativePath.split(sep).join('/');
    const absolutePath = resolve(root, normalized);
    if (entry.isDirectory()) result.push(...await collectFiles(root, normalized));
    else if (entry.isFile()) result.push(normalized);
    else throw new Error(`source anchor refuses symlink or unsupported object: ${absolutePath}`);
  }
  return result;
}

async function copyCreateOnlyTree(sourceRoot: string, destinationRoot: string, current = ''): Promise<void> {
  const directory = resolve(sourceRoot, current || '.');
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name))) {
    const relativePath = current ? join(current, entry.name) : entry.name;
    const sourcePath = resolve(sourceRoot, relativePath);
    const destinationPath = resolve(destinationRoot, relativePath);
    if (entry.isDirectory()) {
      await mkdir(destinationPath, { recursive: true });
      await copyCreateOnlyTree(sourceRoot, destinationRoot, relativePath);
    } else if (entry.isFile()) {
      await writeCreateOnly(destinationPath, await readFile(sourcePath));
    } else {
      throw new Error(`durable artifact materialization refuses non-file: ${relativePath}`);
    }
  }
}

function sourceAnchorRoot(repositoryRoot: string, logicalSessionId: string, sourceEpochRef: string): string {
  const location = resolveCandidateSessionLocation(repositoryRoot, logicalSessionId);
  return join(location.sessionRoot, 'source-epochs', safeId(sourceEpochRef, 'sourceEpochRef'));
}

export async function retainSourceEpochAnchor(input: {
  repositoryRoot: string;
  logicalSessionId: string;
  sourceEpochRef: string;
  sourceRoot: string;
  sourceRunRef: string;
  sourceFingerprintSha256: string;
  sourceExperimentRootHash: string;
}): Promise<RetainedSourceEpochAnchor> {
  await validatePhase0RunSeal(input.sourceRoot, input.sourceExperimentRootHash);
  const anchorRoot = sourceAnchorRoot(input.repositoryRoot, input.logicalSessionId, input.sourceEpochRef);
  const objectRoot = join(anchorRoot, 'objects');
  const entries: SourceAnchorEntry[] = [];
  for (const path of await collectFiles(input.sourceRoot)) {
    const bytes = await readFile(join(input.sourceRoot, path));
    const hash = sha256Hex(bytes);
    const objectRef = `objects/${hash}`;
    await writeImmutable(join(anchorRoot, objectRef), bytes);
    entries.push({ path, sha256: hash, objectRef });
  }
  entries.sort((left, right) => left.path.localeCompare(right.path));
  const manifest: SourceAnchorManifest = {
    schemaVersion: 'source-epoch-anchor-v1',
    sourceEpochRef: input.sourceEpochRef,
    sourceRunRef: input.sourceRunRef,
    sourceFingerprintSha256: input.sourceFingerprintSha256,
    sourceExperimentRootHash: input.sourceExperimentRootHash,
    entries,
  };
  const manifestPath = join(anchorRoot, 'source-anchor.json');
  const bytes = `${canonicalJson(manifest)}\n`;
  await writeImmutable(manifestPath, bytes);
  void objectRoot;
  return {
    sourceEpochRef: input.sourceEpochRef,
    manifestRef: `source-epochs/${input.sourceEpochRef}/source-anchor.json`,
    sourceRunRef: input.sourceRunRef,
    sourceFingerprintSha256: input.sourceFingerprintSha256,
    sourceExperimentRootHash: input.sourceExperimentRootHash,
  };
}

export async function materializeSourceEpochAnchor(input: {
  repositoryRoot: string;
  logicalSessionId: string;
  sourceEpochRef: string;
  destinationRoot?: string;
  hostSliceId?: string;
}): Promise<{ sourceRoot: string }> {
  const anchorRoot = sourceAnchorRoot(input.repositoryRoot, input.logicalSessionId, input.sourceEpochRef);
  const manifest = JSON.parse(await readFile(join(anchorRoot, 'source-anchor.json'), 'utf8')) as SourceAnchorManifest;
  if (manifest.schemaVersion !== 'source-epoch-anchor-v1') throw new Error('unsupported source anchor schema');
  const sourceRoot = resolve(input.destinationRoot ?? join(input.repositoryRoot, '.tmp/evolution', input.logicalSessionId, input.hostSliceId ?? 'materialize', input.sourceEpochRef));
  await mkdir(sourceRoot, { recursive: true });
  for (const entry of manifest.entries) {
    const safePath = safeRelativePath(sourceRoot, entry.path, 'source anchor entry path');
    const bytes = await readFile(join(anchorRoot, entry.objectRef));
    if (sha256Hex(bytes) !== entry.sha256) throw new Error(`source anchor object hash mismatch: ${entry.path}`);
    await writeCreateOnly(join(sourceRoot, safePath), bytes);
  }
  await validatePhase0RunSeal(sourceRoot, manifest.sourceExperimentRootHash);
  return {
    sourceRoot,
    sourceRunRef: manifest.sourceRunRef,
    sourceFingerprintSha256: manifest.sourceFingerprintSha256,
    sourceExperimentRootHash: manifest.sourceExperimentRootHash,
  };
}

export async function materializeSourceAnalysisArtifacts(input: {
  repositoryRoot: string;
  logicalSessionId: string;
  sourceEpochRef: string;
  sourceRoot: string;
  sourceRunRef: string;
  destinationRoot?: string;
  hostSliceId?: string;
}): Promise<{ analysisRoot: string }> {
  const anchorRoot = sourceAnchorRoot(input.repositoryRoot, input.logicalSessionId, input.sourceEpochRef);
  const retainedRoot = join(anchorRoot, 'source-analysis');
  const analysisRoot = resolve(input.destinationRoot ?? join(input.repositoryRoot, '.tmp/evolution', input.logicalSessionId, input.hostSliceId ?? 'materialize', input.sourceEpochRef, 'analysis'));
  await lstat(retainedRoot);
  await mkdir(analysisRoot, { recursive: true });
  await copyCreateOnlyTree(retainedRoot, analysisRoot);
  await copyCreateOnlyTree(input.sourceRoot, join(analysisRoot, 'game-runs', input.sourceRunRef));
  return { analysisRoot };
}

export async function materializeCandidateLaneArtifacts(input: {
  repositoryRoot: string;
  logicalSessionId: string;
  sourceEpochRef: string;
  candidateRef: string;
  destinationRoot: string;
}): Promise<{ laneRoot: string }> {
  const candidateName = basename(input.candidateRef);
  safeId(candidateName, 'candidateRef');
  const durableRoot = join(sourceAnchorRoot(input.repositoryRoot, input.logicalSessionId, input.sourceEpochRef), 'candidates', candidateName);
  await lstat(durableRoot);
  const laneRoot = resolve(input.destinationRoot);
  await mkdir(laneRoot, { recursive: true });
  await copyCreateOnlyTree(durableRoot, laneRoot);
  return { laneRoot };
}

async function retainArtifacts(input: {
  repositoryRoot: string;
  logicalSessionId: string;
  sourceEpochRef: string;
  sourceRoot: string;
  relativePaths: string[];
  destinationPrefix: string;
}): Promise<void> {
  const destinationRoot = join(sourceAnchorRoot(input.repositoryRoot, input.logicalSessionId, input.sourceEpochRef), input.destinationPrefix);
  for (const path of input.relativePaths) {
    const safePath = safeRelativePath(input.sourceRoot, path, 'retained artifact path');
    const bytes = await readFile(join(input.sourceRoot, safePath));
    await writeImmutable(join(destinationRoot, safePath), bytes);
  }
}

export function retainSourceAnalysisArtifacts(input: {
  repositoryRoot: string;
  logicalSessionId: string;
  sourceEpochRef: string;
  sourceRoot: string;
  relativePaths: string[];
}): Promise<void> {
  return retainArtifacts({ ...input, destinationPrefix: 'source-analysis' });
}

export function retainCandidateLaneArtifacts(input: {
  repositoryRoot: string;
  logicalSessionId: string;
  sourceEpochRef: string;
  sourceRoot: string;
  candidateRef: string;
  relativePaths: string[];
}): Promise<void> {
  const candidateName = basename(input.candidateRef);
  safeId(candidateName, 'candidateRef');
  return retainArtifacts({ ...input, destinationPrefix: join('candidates', candidateName) });
}
