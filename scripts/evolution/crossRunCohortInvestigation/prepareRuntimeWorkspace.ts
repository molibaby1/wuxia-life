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
import {
  CANDIDATE_FAMILY_LIFE_SHA256,
  ORIGIN_FAMILY_LIFE_SHA256,
  SELECTED_BASELINE_COMMIT_SHA,
  validateCandidateManifest,
} from '../freshProblemTransfer/prepareWorkspace';
import { sha256Hex } from '../phase0/provenance';

export const COHORT_RUNTIME_OVERLAY_PATHS = [
  'src/core/activePlanning/ActionResultResolver.ts',
  'src/headless/playability/playerSurfaceCapture.ts',
  'src/headless/playability/runnerSteps.ts',
] as const;

/** Must match Fresh-Problem composition overlay hashes for the same three paths. */
export const COHORT_RUNTIME_OVERLAY_EXPECTED_SHA256 = [
  '59c96e0952ec0a441818ce1ec54910fc94ec3f4cafa83e90ec172231dbcf4e6e',
  'dda8f5718826f35fec6af37d9e5eb8e6d2bc899b4036ead01e7db473e28e2bde',
  '43b3959d70be77e4a80cc04de1c0306d84a9a9eb02214ccfeb986e3b2e40bde1',
] as const;

export const EXPECTED_PERSONAS_SHA256 =
  '04a857bf080a04ebf675373557aa4609fb7a26b9ddbee514eb50218483e5cee8';
export const EXPECTED_CANDIDATE_CATALOG_SHA256 =
  '2148a0a68c3df2cba2a05e20c72743637a212f8c5c0bceedcc1b47c97e14f3db';

const FAMILY_LIFE_PATH = 'src/data/lines/family-life.json';
const PERSONAS_PATH = 'src/p8/personas.ts';
const OVERLAY_SET = new Set<string>([FAMILY_LIFE_PATH, ...COHORT_RUNTIME_OVERLAY_PATHS]);
const MANIFEST_PATH = '.tmp/evolution/skeleton-007/phase-b/evidence/selected-baseline-manifest.json';
const CANDIDATE_WORKSPACE_PATH = '.tmp/evolution/skeleton-007/workspace-c';
const DEFAULT_DESTINATION =
  '.tmp/evolution/cross-run-cohort-investigation-evidence/runtime-workspace';
const DEFAULT_EVIDENCE =
  '.tmp/evolution/cross-run-cohort-investigation-evidence/evidence/cohort-runtime-composition.json';
const FRESH_COMPOSITION_PATH =
  '.tmp/evolution/fresh-problem-candidate-transfer/evidence/workspace-composition.json';

interface CandidateManifestEntry {
  path: string;
  objectKind: 'regular_file' | 'symlink';
  sha256: string;
}

export interface CohortRuntimeCompositionEvidence {
  schemaVersion: 'cohort-runtime-composition-v1';
  selectedBaselineCommitSha: string;
  selectedBaselineManifestSha256: string;
  candidateFamilyLifeSha256: string;
  originFamilyLifeSha256: string;
  sourceCandidateWorkspace: string;
  composedWorkspace: string;
  overlayPaths: string[];
  overlaySourceSha256: string[];
  overlayTargetSha256: string[];
  freshProblemOverlayHashAgreement: true;
  candidateManifestVerified: true;
  familyLifeStillCandidateC: true;
  personasSha256: string;
  unexpectedRuntimeDeltaCount: 0;
}

export interface PrepareCohortRuntimeWorkspaceOptions {
  repositoryRoot?: string;
  sourceCandidateWorkspace?: string;
  selectedBaselineManifestPath?: string;
  humanDecisionPath?: string;
  destinationWorkspace?: string;
  compositionEvidencePath?: string;
  freshProblemCompositionPath?: string;
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

async function hashManifestObject(
  path: string,
  objectKind: CandidateManifestEntry['objectKind'],
): Promise<string> {
  if (objectKind === 'symlink') return sha256Hex(await readlink(path));
  return hashFile(path);
}

function collectRuntimeHashes(
  root: string,
  base: string,
  current = '',
  result = new Map<string, string>(),
): Map<string, string> {
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

/** Candidate C vs root may differ only on family-life and the three approved overlays. */
export function validateCohortRuntimeDelta(
  candidateWorkspace: string,
  repositoryRoot: string,
): void {
  const candidate = new Map<string, string>();
  const repository = new Map<string, string>();
  for (const base of ['src', 'scripts/evolution']) {
    collectRuntimeHashes(candidateWorkspace, base, '', candidate);
    collectRuntimeHashes(repositoryRoot, base, '', repository);
  }
  const differences: string[] = [];
  for (const path of new Set([...candidate.keys(), ...repository.keys()])) {
    if (candidate.get(path) === repository.get(path) || OVERLAY_SET.has(path)) continue;
    // Investigation / MW tooling lives on root and is intentionally not overlaid.
    if (
      path.startsWith('scripts/evolution/hypothesisInvestigation/')
      || path.startsWith('scripts/evolution/modificationWork/')
      || path.startsWith('scripts/evolution/freshProblemTransfer/')
      || path.startsWith('scripts/evolution/crossRunCohortInvestigation/')
      || path === 'scripts/evolution/runHypothesisInvestigation.ts'
      || path === 'scripts/evolution/runModificationWork.ts'
      || path === 'scripts/evolution/runCrossRunCohortInvestigationExperiment.ts'
      || path.startsWith('src/evolution/')
    ) {
      continue;
    }
    differences.push(path);
  }
  if (differences.length > 0) {
    throw new Error(`unexpected runtime delta: ${differences.sort().join(', ')}`);
  }
}

async function copyCreateOnly(
  source: string,
  target: string,
  objectKind: CandidateManifestEntry['objectKind'],
): Promise<void> {
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

function requireFreshProblemOverlayAgreement(
  freshComposition: {
    overlayPaths: string[];
    overlaySourceSha256: string[];
  },
): void {
  for (let index = 0; index < COHORT_RUNTIME_OVERLAY_PATHS.length; index += 1) {
    const overlayPath = COHORT_RUNTIME_OVERLAY_PATHS[index]!;
    const expected = COHORT_RUNTIME_OVERLAY_EXPECTED_SHA256[index]!;
    const freshIndex = freshComposition.overlayPaths.indexOf(overlayPath);
    if (freshIndex < 0) {
      throw new Error(`Fresh-Problem composition missing overlay path: ${overlayPath}`);
    }
    const freshHash = freshComposition.overlaySourceSha256[freshIndex];
    if (freshHash !== expected) {
      throw new Error(
        `Fresh-Problem overlay hash mismatch for ${overlayPath}: expected ${expected}, got ${String(freshHash)}`,
      );
    }
  }
}

export async function prepareCohortRuntimeWorkspace(
  options: PrepareCohortRuntimeWorkspaceOptions = {},
): Promise<CohortRuntimeCompositionEvidence> {
  const repositoryRoot = resolve(options.repositoryRoot ?? process.cwd());
  const sourceCandidateWorkspace = resolve(
    options.sourceCandidateWorkspace ?? join(repositoryRoot, CANDIDATE_WORKSPACE_PATH),
  );
  const selectedBaselineManifestPath = resolve(
    options.selectedBaselineManifestPath ?? join(repositoryRoot, MANIFEST_PATH),
  );
  const humanDecisionPath = resolve(
    options.humanDecisionPath
      ?? join(repositoryRoot, '.tmp/evolution/skeleton-007/phase-b/evidence/human-decision.json'),
  );
  const destinationWorkspace = resolve(
    options.destinationWorkspace ?? join(repositoryRoot, DEFAULT_DESTINATION),
  );
  const compositionEvidencePath = resolve(
    options.compositionEvidencePath ?? join(repositoryRoot, DEFAULT_EVIDENCE),
  );
  const freshProblemCompositionPath = resolve(
    options.freshProblemCompositionPath ?? join(repositoryRoot, FRESH_COMPOSITION_PATH),
  );

  await assertAbsent(destinationWorkspace, 'cohort runtime workspace');
  await assertAbsent(compositionEvidencePath, 'cohort runtime composition evidence');

  const freshComposition = JSON.parse(
    await readFile(freshProblemCompositionPath, 'utf8'),
  ) as {
    overlayPaths: string[];
    overlaySourceSha256: string[];
  };
  requireFreshProblemOverlayAgreement(freshComposition);

  for (let index = 0; index < COHORT_RUNTIME_OVERLAY_PATHS.length; index += 1) {
    const overlayPath = COHORT_RUNTIME_OVERLAY_PATHS[index]!;
    const expected = COHORT_RUNTIME_OVERLAY_EXPECTED_SHA256[index]!;
    const actual = await hashFile(pathFor(repositoryRoot, overlayPath));
    if (actual !== expected) {
      throw new Error(
        `current root overlay hash changed for ${overlayPath}: expected ${expected}, got ${actual}`,
      );
    }
  }

  const verification = await validateCandidateManifest({
    manifestPath: selectedBaselineManifestPath,
    sourceWorkspace: sourceCandidateWorkspace,
    humanDecisionPath,
  });
  validateCohortRuntimeDelta(sourceCandidateWorkspace, repositoryRoot);

  const originFamilyLifeSha256 = await hashFile(join(repositoryRoot, FAMILY_LIFE_PATH));
  if (originFamilyLifeSha256 !== ORIGIN_FAMILY_LIFE_SHA256) {
    throw new Error('origin family-life hash does not match the sealed origin');
  }

  const rootPersonasSha256 = await hashFile(join(repositoryRoot, PERSONAS_PATH));
  if (rootPersonasSha256 !== EXPECTED_PERSONAS_SHA256) {
    throw new Error('root personas hash does not match the sealed P8 roster');
  }

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
  for (const overlayPath of COHORT_RUNTIME_OVERLAY_PATHS) {
    const source = pathFor(repositoryRoot, overlayPath);
    const stat = await lstat(source);
    if (!stat.isFile()) throw new Error(`overlay must be a regular file: ${overlayPath}`);
    await copyCreateOnly(source, pathFor(destinationWorkspace, overlayPath), 'regular_file');
  }

  const familyTarget = pathFor(destinationWorkspace, FAMILY_LIFE_PATH);
  if (await hashFile(familyTarget) !== CANDIDATE_FAMILY_LIFE_SHA256) {
    throw new Error('composed workspace family-life is not Candidate C');
  }
  const personasTargetSha256 = await hashFile(pathFor(destinationWorkspace, PERSONAS_PATH));
  if (personasTargetSha256 !== EXPECTED_PERSONAS_SHA256) {
    throw new Error('composed workspace personas hash does not match root P8 roster');
  }
  for (const entry of verification.manifest.entries) {
    if (OVERLAY_SET.has(entry.path) && entry.path !== FAMILY_LIFE_PATH) continue;
    const actual = await hashManifestObject(
      pathFor(destinationWorkspace, entry.path),
      entry.objectKind,
    );
    if (actual !== entry.sha256) throw new Error(`composed workspace mismatch: ${entry.path}`);
  }

  const overlaySourceSha256: string[] = [];
  const overlayTargetSha256: string[] = [];
  for (let index = 0; index < COHORT_RUNTIME_OVERLAY_PATHS.length; index += 1) {
    const overlayPath = COHORT_RUNTIME_OVERLAY_PATHS[index]!;
    const expected = COHORT_RUNTIME_OVERLAY_EXPECTED_SHA256[index]!;
    const sourceHash = await hashFile(pathFor(repositoryRoot, overlayPath));
    const targetHash = await hashFile(pathFor(destinationWorkspace, overlayPath));
    if (sourceHash !== expected || targetHash !== expected) {
      throw new Error(`overlay hash mismatch after composition: ${overlayPath}`);
    }
    overlaySourceSha256.push(sourceHash);
    overlayTargetSha256.push(targetHash);
  }

  if (verification.manifest.selectedBaselineCommitSha !== SELECTED_BASELINE_COMMIT_SHA) {
    throw new Error('selectedBaselineCommitSha does not match Candidate C');
  }

  const evidence: CohortRuntimeCompositionEvidence = {
    schemaVersion: 'cohort-runtime-composition-v1',
    selectedBaselineCommitSha: verification.manifest.selectedBaselineCommitSha,
    selectedBaselineManifestSha256: verification.manifestSha256,
    candidateFamilyLifeSha256: CANDIDATE_FAMILY_LIFE_SHA256,
    originFamilyLifeSha256,
    sourceCandidateWorkspace,
    composedWorkspace: destinationWorkspace,
    overlayPaths: [...COHORT_RUNTIME_OVERLAY_PATHS],
    overlaySourceSha256,
    overlayTargetSha256,
    freshProblemOverlayHashAgreement: true,
    candidateManifestVerified: true,
    familyLifeStillCandidateC: true,
    personasSha256: personasTargetSha256,
    unexpectedRuntimeDeltaCount: 0,
  };
  await writeCreateOnly(compositionEvidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}
