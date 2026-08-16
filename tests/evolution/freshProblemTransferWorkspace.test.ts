import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  OVERLAY_PATHS,
  prepareFreshProblemWorkspace,
  validateCandidateManifest,
  validateRuntimeDelta,
} from '../../scripts/evolution/freshProblemTransfer/prepareWorkspace';
import { sha256Hex } from '../../scripts/evolution/phase0/provenance';

const SELECTED_BASELINE_SHA = '74fb4fb3179f3ddeec78e3a43232ece0fc6e420f';
const HUMAN_DECISION = 'accepted-candidate';
const FAMILY_LIFE_PATH = 'src/data/lines/family-life.json';

interface Fixture {
  root: string;
  candidate: string;
  repository: string;
  destination: string;
  manifestPath: string;
  humanDecisionPath: string;
  evidencePath: string;
  familyBytes: string;
}

async function put(root: string, relativePath: string, bytes: string): Promise<void> {
  const target = join(root, relativePath);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, bytes);
}

async function createFixture(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), 'fresh-problem-transfer-workspace-'));
  const candidate = join(root, 'candidate');
  const repository = join(root, 'repository');
  const destination = join(root, 'destination');
  const manifestPath = join(root, 'selected-baseline-manifest.json');
  const humanDecisionPath = join(root, 'human-decision.json');
  const evidencePath = join(root, 'evidence', 'workspace-composition.json');
  const familyBytes = await readFile(
    '.tmp/evolution/skeleton-007/workspace-c/src/data/lines/family-life.json',
    'utf8',
  );
  const originFamilyBytes = await readFile(FAMILY_LIFE_PATH, 'utf8');

  await put(candidate, FAMILY_LIFE_PATH, familyBytes);
  await put(repository, FAMILY_LIFE_PATH, originFamilyBytes);
  await put(candidate, 'README.md', 'candidate readme');
  await put(repository, 'README.md', 'candidate readme');
  await put(candidate, 'src/evolution/unchanged.ts', 'unchanged');
  await put(repository, 'src/evolution/unchanged.ts', 'unchanged');
  await put(candidate, 'scripts/evolution/unchanged.ts', 'unchanged');
  await put(repository, 'scripts/evolution/unchanged.ts', 'unchanged');

  for (const overlayPath of OVERLAY_PATHS) {
    if (overlayPath === 'src/evolution/investigationHandoff.ts') {
      await put(repository, overlayPath, 'current tooling');
      continue;
    }
    await put(candidate, overlayPath, 'candidate tooling');
    await put(repository, overlayPath, 'current tooling');
  }

  const entries = [
    FAMILY_LIFE_PATH,
    'README.md',
    'src/evolution/unchanged.ts',
    'scripts/evolution/unchanged.ts',
    ...OVERLAY_PATHS.filter(path => path !== 'src/evolution/investigationHandoff.ts'),
  ].map(path => ({
    path,
    objectKind: 'regular_file' as const,
    sha256: sha256Hex(requireBytes(candidate, path)),
  }));
  await writeFile(humanDecisionPath, HUMAN_DECISION);
  await writeFile(manifestPath, JSON.stringify({
    schemaVersion: 'skeleton-007-phase-b-selected-baseline-manifest-v1',
    selectedBaselineCommitSha: SELECTED_BASELINE_SHA,
    entryCount: entries.length,
    equalsCandidateC: true,
    worktreeClean: true,
    familyLifeSha256: sha256Hex(familyBytes),
    humanDecisionSha256: sha256Hex(HUMAN_DECISION),
    entries,
  }));

  return {
    root,
    candidate,
    repository,
    destination,
    manifestPath,
    humanDecisionPath,
    evidencePath,
    familyBytes,
  };
}

function requireBytes(root: string, relativePath: string): Uint8Array {
  return readFileSync(join(root, relativePath));
}

export async function runFreshProblemTransferWorkspaceTests(): Promise<void> {
  // A: the complete sealed manifest is checked before composition.
  {
    const fixture = await createFixture();
    await assert.doesNotReject(() => validateCandidateManifest({
      manifestPath: fixture.manifestPath,
      sourceWorkspace: fixture.candidate,
      humanDecisionPath: fixture.humanDecisionPath,
    }));
  }

  // B: a tampered ordinary file fails before the destination is created.
  {
    const fixture = await createFixture();
    await writeFile(join(fixture.candidate, 'README.md'), 'tampered');
    await assert.rejects(
      () => prepareFreshProblemWorkspace({
        repositoryRoot: fixture.repository,
        sourceCandidateWorkspace: fixture.candidate,
        selectedBaselineManifestPath: fixture.manifestPath,
        humanDecisionPath: fixture.humanDecisionPath,
        destinationWorkspace: fixture.destination,
        compositionEvidencePath: fixture.evidencePath,
      }),
      /manifest|README\.md|hash/i,
    );
    assert.equal(await pathExists(fixture.destination), false);
  }

  // C and F: Candidate family-life must match the manifest and survive overlay.
  {
    const fixture = await createFixture();
    await writeFile(join(fixture.candidate, FAMILY_LIFE_PATH), 'wrong candidate');
    await assert.rejects(
      () => validateCandidateManifest({
        manifestPath: fixture.manifestPath,
        sourceWorkspace: fixture.candidate,
        humanDecisionPath: fixture.humanDecisionPath,
      }),
      /family-life|hash/i,
    );

    const cleanFixture = await createFixture();
    await prepareFreshProblemWorkspace({
      repositoryRoot: cleanFixture.repository,
      sourceCandidateWorkspace: cleanFixture.candidate,
      selectedBaselineManifestPath: cleanFixture.manifestPath,
      humanDecisionPath: cleanFixture.humanDecisionPath,
      destinationWorkspace: cleanFixture.destination,
      compositionEvidencePath: cleanFixture.evidencePath,
    });
    assert.equal(
      sha256Hex(await readFile(join(cleanFixture.destination, FAMILY_LIFE_PATH))),
      sha256Hex(cleanFixture.familyBytes),
    );
  }

  // D: exactly the nine accepted overlay paths are allowed.
  assert.equal(OVERLAY_PATHS.length, 9);

  // E, G and H: runtime deltas are accepted only for the allowlist.
  {
    const fixture = await createFixture();
    assert.doesNotThrow(() => validateRuntimeDelta(fixture.candidate, fixture.repository));
    await put(fixture.repository, 'src/evolution/tenth-runtime-path.ts', 'unexpected');
    assert.throws(
      () => validateRuntimeDelta(fixture.candidate, fixture.repository),
      /unexpected runtime delta|tenth-runtime-path/i,
    );
  }

  // I: an existing destination fails before any mutation.
  {
    const fixture = await createFixture();
    await mkdir(fixture.destination, { recursive: true });
    await writeFile(join(fixture.destination, 'marker'), 'preserve');
    await assert.rejects(
      () => prepareFreshProblemWorkspace({
        repositoryRoot: fixture.repository,
        sourceCandidateWorkspace: fixture.candidate,
        selectedBaselineManifestPath: fixture.manifestPath,
        humanDecisionPath: fixture.humanDecisionPath,
        destinationWorkspace: fixture.destination,
        compositionEvidencePath: fixture.evidencePath,
      }),
      /already exists/i,
    );
    assert.equal(await readFile(join(fixture.destination, 'marker'), 'utf8'), 'preserve');
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ENOENT';
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFreshProblemTransferWorkspaceTests()
    .then(() => console.log('freshProblemTransferWorkspace.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
