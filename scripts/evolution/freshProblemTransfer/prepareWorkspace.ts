import { constants as fsConstants, readFileSync, readdirSync } from 'node:fs';
import {
  copyFile,
  cp,
  lstat,
  mkdir,
  open,
  readFile,
  readlink,
  symlink,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { sha256Hex } from '../phase0/provenance';

export const SELECTED_BASELINE_COMMIT_SHA =
  '74fb4fb3179f3ddeec78e3a43232ece0fc6e420f';
export const CANDIDATE_FAMILY_LIFE_SHA256 =
  '3ef049dcf0ef77d47a0d2d6c1156488e678b8c4e54ead3c8e0b59dee794eb6c6';
export const ORIGIN_FAMILY_LIFE_SHA256 =
  'f511958f1953a35a6c266f40275f3e7b191912a61fbaf6f8655642536e79a6cb';
export const CANDIDATE_CATALOG_SHA256 =
  '2148a0a68c3df2cba2a05e20c72743637a212f8c5c0bceedcc1b47c97e14f3db';

export const OVERLAY_PATHS = [
  'src/core/activePlanning/ActionResultResolver.ts',
  'src/evolution/investigationHandoff.ts',
  'src/evolution/modificationWorkContract.ts',
  'src/headless/playability/playerSurfaceCapture.ts',
  'src/headless/playability/runnerSteps.ts',
  'scripts/evolution/hypothesisInvestigation/buildInvestigationEvidence.ts',
  'scripts/evolution/modificationWork/deepseekModificationWork.ts',
  'scripts/evolution/modificationWork/loadModificationWorkSource.ts',
  'scripts/evolution/runModificationWork.ts',
] as const;

const FAMILY_LIFE_PATH = 'src/data/lines/family-life.json';
const OVERLAY_SET = new Set<string>([FAMILY_LIFE_PATH, ...OVERLAY_PATHS]);
const MANIFEST_PATH = '.tmp/evolution/skeleton-007/phase-b/evidence/selected-baseline-manifest.json';
const CANDIDATE_WORKSPACE_PATH = '.tmp/evolution/skeleton-007/workspace-c';
const DEFAULT_DESTINATION = '.tmp/evolution/fresh-problem-candidate-transfer/workspace';
const DEFAULT_EVIDENCE = '.tmp/evolution/fresh-problem-candidate-transfer/evidence/workspace-composition.json';

interface CandidateManifestEntry {
  path: string;
  objectKind: 'regular_file' | 'symlink';
  sha256: string;
}

interface CandidateManifest {
  schemaVersion: string;
  selectedBaselineCommitSha: string;
  entryCount: number;
  equalsCandidateC: boolean;
  worktreeClean: boolean;
  familyLifeSha256: string;
  humanDecisionSha256: string;
  entries: CandidateManifestEntry[];
}

export interface CandidateManifestVerification {
  manifest: CandidateManifest;
  manifestSha256: string;
}

export interface ValidateCandidateManifestOptions {
  manifestPath: string;
  sourceWorkspace: string;
  humanDecisionPath: string;
}

export interface PrepareFreshProblemWorkspaceOptions {
  repositoryRoot?: string;
  sourceCandidateWorkspace?: string;
  selectedBaselineManifestPath?: string;
  humanDecisionPath?: string;
  destinationWorkspace?: string;
  compositionEvidencePath?: string;
}

export interface WorkspaceCompositionEvidence {
  schemaVersion: 'fresh-problem-workspace-composition-v1';
  selectedBaselineCommitSha: string;
  selectedBaselineManifestSha256: string;
  candidateFamilyLifeSha256: string;
  originFamilyLifeSha256: string;
  sourceCandidateWorkspace: string;
  composedWorkspace: string;
  overlayPaths: string[];
  overlaySourceSha256: string[];
  overlayTargetSha256: string[];
  candidateManifestVerified: true;
  familyLifeStillCandidateC: true;
  currentEvolutionToolingMatched: true;
  unexpectedRuntimeDeltaCount: 0;
}

function pathFor(root: string, relativePath: string): string {
  const target = resolve(root, relativePath);
  const escaped = relative(resolve(root), target);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${requireSep()}`) || isAbsolute(escaped)) {
    throw new Error(`unsafe relative path: ${relativePath}`);
  }
  return target;
}

function requireSep(): string {
  return process.platform === 'win32' ? '\\' : '/';
}

async function assertAbsent(path: string, label: string): Promise<void> {
  try {
    await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`${label} already exists: ${path}`);
}

async function hashFile(path: string): Promise<string> {
  return sha256Hex(await readFile(path));
}

async function hashManifestObject(path: string, objectKind: CandidateManifestEntry['objectKind']): Promise<string> {
  if (objectKind === 'symlink') return sha256Hex(await readlink(path));
  return hashFile(path);
}

function parseManifest(raw: string): CandidateManifest {
  const value = JSON.parse(raw) as Partial<CandidateManifest>;
  if (value.selectedBaselineCommitSha !== SELECTED_BASELINE_COMMIT_SHA) {
    throw new Error('selectedBaselineCommitSha does not match Candidate C');
  }
  if (value.equalsCandidateC !== true || value.worktreeClean !== true) {
    throw new Error('sealed Candidate C manifest is not accepted and clean');
  }
  if (value.familyLifeSha256 !== CANDIDATE_FAMILY_LIFE_SHA256) {
    throw new Error('sealed Candidate C family-life hash does not match');
  }
  if (!Array.isArray(value.entries) || value.entryCount !== value.entries.length) {
    throw new Error('Candidate manifest entryCount does not match entries');
  }
  if (!value.humanDecisionSha256) throw new Error('Candidate manifest is missing human decision hash');
  return value as CandidateManifest;
}

function assertEntryPath(relativePath: string): void {
  if (relativePath === 'node_modules') return;
  if (relativePath.startsWith('/') || relativePath.includes('..')) {
    throw new Error(`unsafe manifest path: ${relativePath}`);
  }
}

export async function validateCandidateManifest(
  options: ValidateCandidateManifestOptions,
): Promise<CandidateManifestVerification> {
  const raw = await readFile(options.manifestPath, 'utf8');
  const manifest = parseManifest(raw);
  if (await hashFile(options.humanDecisionPath) !== manifest.humanDecisionSha256) {
    throw new Error('human decision hash does not match Candidate manifest');
  }

  for (const entry of manifest.entries) {
    assertEntryPath(entry.path);
    const sourcePath = pathFor(options.sourceWorkspace, entry.path);
    let stat;
    try {
      stat = await lstat(sourcePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Candidate manifest entry is missing: ${entry.path}`);
      }
      throw error;
    }
    if (entry.objectKind === 'regular_file' && !stat.isFile()) {
      throw new Error(`Candidate manifest entry is not a regular file: ${entry.path}`);
    }
    if (entry.objectKind === 'symlink' && !stat.isSymbolicLink()) {
      throw new Error(`Candidate manifest entry is not a symlink: ${entry.path}`);
    }
    const actual = await hashManifestObject(sourcePath, entry.objectKind);
    if (actual !== entry.sha256) {
      throw new Error(`Candidate manifest hash mismatch: ${entry.path}`);
    }
  }

  const familyPath = pathFor(options.sourceWorkspace, FAMILY_LIFE_PATH);
  if (await hashFile(familyPath) !== CANDIDATE_FAMILY_LIFE_SHA256) {
    throw new Error('Candidate family-life hash does not match Candidate C');
  }

  return { manifest, manifestSha256: sha256Hex(raw) };
}

function collectRuntimeHashes(root: string, base: string, current = '', result = new Map<string, string>()): Map<string, string> {
  const directory = join(root, base, current);
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const relativePath = [base, current, entry.name].filter(Boolean).join('/');
    const target = join(root, relativePath);
    if (entry.name === '.DS_Store') continue;
    if (entry.isDirectory()) {
      collectRuntimeHashes(root, base, [current, entry.name].filter(Boolean).join('/'), result);
    } else if (entry.isFile()) {
      result.set(relativePath, sha256Hex(readFileSync(target)));
    }
  }
  return result;
}

export function validateRuntimeDelta(candidateWorkspace: string, repositoryRoot: string): void {
  const candidate = new Map<string, string>();
  const repository = new Map<string, string>();
  for (const base of ['src', 'scripts/evolution']) {
    collectRuntimeHashes(candidateWorkspace, base, '', candidate);
    collectRuntimeHashes(repositoryRoot, base, '', repository);
  }
  const differences: string[] = [];
  for (const path of new Set([...candidate.keys(), ...repository.keys()])) {
    if (
      candidate.get(path) === repository.get(path)
      || OVERLAY_SET.has(path)
      || path.startsWith('scripts/evolution/freshProblemTransfer/')
    ) continue;
    differences.push(path);
  }
  if (differences.length > 0) {
    throw new Error(`unexpected runtime delta: ${differences.sort().join(', ')}`);
  }
}

async function copyCreateOnly(source: string, target: string, objectKind: CandidateManifestEntry['objectKind']): Promise<void> {
  await mkdir(dirname(target), { recursive: true });
  if (objectKind === 'symlink') {
    await symlink(await readlink(source), target);
    return;
  }
  await copyFile(source, target, fsConstants.COPYFILE_EXCL);
}

async function writeCreateOnly(path: string, bytes: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(bytes);
  } finally {
    await handle.close();
  }
}

export async function prepareFreshProblemWorkspace(
  options: PrepareFreshProblemWorkspaceOptions = {},
): Promise<WorkspaceCompositionEvidence> {
  const repositoryRoot = resolve(options.repositoryRoot ?? process.cwd());
  const sourceCandidateWorkspace = resolve(
    options.sourceCandidateWorkspace ?? join(repositoryRoot, CANDIDATE_WORKSPACE_PATH),
  );
  const selectedBaselineManifestPath = resolve(
    options.selectedBaselineManifestPath ?? join(repositoryRoot, MANIFEST_PATH),
  );
  const humanDecisionPath = resolve(
    options.humanDecisionPath ?? join(repositoryRoot, '.tmp/evolution/skeleton-007/phase-b/evidence/human-decision.json'),
  );
  const destinationWorkspace = resolve(
    options.destinationWorkspace ?? join(repositoryRoot, DEFAULT_DESTINATION),
  );
  const compositionEvidencePath = resolve(
    options.compositionEvidencePath ?? join(repositoryRoot, DEFAULT_EVIDENCE),
  );

  await assertAbsent(destinationWorkspace, 'composed workspace');
  await assertAbsent(compositionEvidencePath, 'composition evidence');
  const verification = await validateCandidateManifest({
    manifestPath: selectedBaselineManifestPath,
    sourceWorkspace: sourceCandidateWorkspace,
    humanDecisionPath,
  });
  validateRuntimeDelta(sourceCandidateWorkspace, repositoryRoot);

  const originFamilyLifeSha256 = await hashFile(join(repositoryRoot, FAMILY_LIFE_PATH));
  if (originFamilyLifeSha256 !== ORIGIN_FAMILY_LIFE_SHA256) {
    throw new Error('origin family-life hash does not match the sealed origin');
  }

  const manifestEntries = new Map(verification.manifest.entries.map(entry => [entry.path, entry]));
  await mkdir(dirname(destinationWorkspace), { recursive: true });
  await mkdir(destinationWorkspace, { recursive: false });
  const sourceGit = join(sourceCandidateWorkspace, '.git');
  try {
    await lstat(sourceGit);
    await cp(sourceGit, join(destinationWorkspace, '.git'), {
      recursive: true,
      force: false,
      errorOnExist: true,
      verbatimSymlinks: true,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  for (const entry of verification.manifest.entries) {
    if (OVERLAY_SET.has(entry.path) && entry.path !== FAMILY_LIFE_PATH) continue;
    await copyCreateOnly(
      pathFor(sourceCandidateWorkspace, entry.path),
      pathFor(destinationWorkspace, entry.path),
      entry.objectKind,
    );
  }
  for (const overlayPath of OVERLAY_PATHS) {
    const source = pathFor(repositoryRoot, overlayPath);
    const stat = await lstat(source);
    if (!stat.isFile()) throw new Error(`overlay must be a regular file: ${overlayPath}`);
    await copyCreateOnly(source, pathFor(destinationWorkspace, overlayPath), 'regular_file');
  }

  const familyTarget = pathFor(destinationWorkspace, FAMILY_LIFE_PATH);
  if (await hashFile(familyTarget) !== CANDIDATE_FAMILY_LIFE_SHA256) {
    throw new Error('composed workspace family-life is not Candidate C');
  }
  for (const entry of verification.manifest.entries) {
    if (OVERLAY_SET.has(entry.path) && entry.path !== FAMILY_LIFE_PATH) continue;
    const actual = await hashManifestObject(pathFor(destinationWorkspace, entry.path), entry.objectKind);
    if (actual !== entry.sha256) throw new Error(`composed workspace mismatch: ${entry.path}`);
  }
  const overlaySourceSha256: string[] = [];
  const overlayTargetSha256: string[] = [];
  for (const overlayPath of OVERLAY_PATHS) {
    const sourceHash = await hashFile(pathFor(repositoryRoot, overlayPath));
    const targetHash = await hashFile(pathFor(destinationWorkspace, overlayPath));
    if (sourceHash !== targetHash) throw new Error(`overlay mismatch: ${overlayPath}`);
    overlaySourceSha256.push(sourceHash);
    overlayTargetSha256.push(targetHash);
  }
  if (!manifestEntries.has(FAMILY_LIFE_PATH)) throw new Error('Candidate manifest is missing family-life');

  const evidence: WorkspaceCompositionEvidence = {
    schemaVersion: 'fresh-problem-workspace-composition-v1',
    selectedBaselineCommitSha: verification.manifest.selectedBaselineCommitSha,
    selectedBaselineManifestSha256: verification.manifestSha256,
    candidateFamilyLifeSha256: CANDIDATE_FAMILY_LIFE_SHA256,
    originFamilyLifeSha256,
    sourceCandidateWorkspace,
    composedWorkspace: destinationWorkspace,
    overlayPaths: [...OVERLAY_PATHS],
    overlaySourceSha256,
    overlayTargetSha256,
    candidateManifestVerified: true,
    familyLifeStillCandidateC: true,
    currentEvolutionToolingMatched: true,
    unexpectedRuntimeDeltaCount: 0,
  };
  await writeCreateOnly(compositionEvidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}
