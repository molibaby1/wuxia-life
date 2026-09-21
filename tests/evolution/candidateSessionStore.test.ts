import assert from 'node:assert/strict';
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { captureAuthoritativeFingerprint } from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import { sealPhase0Run } from '../../scripts/evolution/phase0/provenance';
import {
  materializeSourceEpochAnchor,
  materializeSourceAnalysisArtifacts,
  readDurableMultiCandidateSessionManifest,
  retainCandidateLaneArtifacts,
  retainSourceAnalysisArtifacts,
  retainSourceEpochAnchor,
  resolveCandidateSessionLocation,
  writeMultiCandidateSessionManifestAtomic,
} from '../../scripts/evolution/candidateSessionStore';
import { buildMultiCandidateSessionManifestV1 } from '../../scripts/evolution/multiCandidateSessionManifestContract';

async function makeSealedSource(root: string): Promise<{ sourceRoot: string; rootHash: string }> {
  const sourceRoot = join(root, 'sealed-source');
  const required = [
    'inputs/run-input.json',
    'inputs/persona.json',
    'inputs/catalog.json',
    'provenance/source-fingerprint.json',
    'internal/player-surface-source.json',
    'reviewer-input/observable-payload.json',
    'provenance/experiment-envelope.json',
    'provenance/phase0-run-data-access-manifest.json',
  ];
  for (const path of required) {
    await mkdir(join(sourceRoot, path, '..'), { recursive: true });
    await writeFile(join(sourceRoot, path), `fixture:${path}\n`);
  }
  const sealed = await sealPhase0Run(sourceRoot, 'cohort-run-000001');
  return { sourceRoot, rootHash: sealed.experimentRootHash };
}

export async function runCandidateSessionStoreTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'candidate-session-store-'));
  const source = await makeSealedSource(root);
  const sessionId = 'logical-session-000001';
  const before = await captureAuthoritativeFingerprint(root);
  const anchor = await retainSourceEpochAnchor({
    repositoryRoot: root,
    logicalSessionId: sessionId,
    sourceEpochRef: 'source-epoch-000001',
    sourceRoot: source.sourceRoot,
    sourceRunRef: 'cohort-run-000001',
    sourceFingerprintSha256: 'a'.repeat(64),
    sourceExperimentRootHash: source.rootHash,
  });
  const after = await captureAuthoritativeFingerprint(root);
  assert.equal(after, before);
  assert.equal(anchor.manifestRef, 'source-epochs/source-epoch-000001/source-anchor.json');

  await retainSourceAnalysisArtifacts({
    repositoryRoot: root,
    logicalSessionId: sessionId,
    sourceEpochRef: 'source-epoch-000001',
    sourceRoot: source.sourceRoot,
    relativePaths: ['reviewer-input/observable-payload.json'],
  });

  const materialized = await materializeSourceEpochAnchor({
    repositoryRoot: root,
    logicalSessionId: sessionId,
    sourceEpochRef: 'source-epoch-000001',
    hostSliceId: 'host-slice-000001',
  });
  assert.equal(materialized.sourceRoot, join(root, '.tmp/evolution', sessionId, 'host-slice-000001', 'source-epoch-000001', 'source'));
  assert.equal(await readFile(join(materialized.sourceRoot, 'experiment-root.sha256'), 'utf8'), source.rootHash);

  const materializedAnalysis = await materializeSourceAnalysisArtifacts({
    repositoryRoot: root,
    logicalSessionId: sessionId,
    sourceEpochRef: 'source-epoch-000001',
    sourceRoot: materialized.sourceRoot,
    sourceRunRef: 'cohort-run-000001',
    hostSliceId: 'host-slice-000001',
  });
  assert.ok(relative(materialized.sourceRoot, materializedAnalysis.analysisRoot).startsWith('..'));
  assert.ok(relative(materializedAnalysis.analysisRoot, materialized.sourceRoot).startsWith('..'));
  assert.ok(await readFile(join(materializedAnalysis.analysisRoot, 'game-runs', 'cohort-run-000001', 'experiment-root.json'), 'utf8'));
  await assert.rejects(
    () => lstat(join(materialized.sourceRoot, 'analysis', 'game-runs', 'cohort-run-000001', 'analysis')),
    { code: 'ENOENT' },
  );
  await assert.rejects(
    () => materializeSourceAnalysisArtifacts({
      repositoryRoot: root,
      logicalSessionId: sessionId,
      sourceEpochRef: 'source-epoch-000001',
      sourceRoot: materialized.sourceRoot,
      sourceRunRef: 'cohort-run-000001',
      destinationRoot: join(materialized.sourceRoot, 'nested-analysis'),
      hostSliceId: 'host-slice-000001',
    }),
    /copy destination must not be inside source tree/,
  );

  await retainCandidateLaneArtifacts({
    repositoryRoot: root,
    logicalSessionId: sessionId,
    sourceEpochRef: 'source-epoch-000001',
    sourceRoot: source.sourceRoot,
    candidateRef: 'candidate-pool-000001/hypothesis-000001',
    relativePaths: ['provenance/experiment-envelope.json'],
  });
  await assert.rejects(
    () => retainSourceAnalysisArtifacts({
      repositoryRoot: root,
      logicalSessionId: sessionId,
      sourceEpochRef: 'source-epoch-000001',
      sourceRoot: source.sourceRoot,
      relativePaths: ['../../outside.txt'],
    }),
    /safe relative|escapes/,
  );

  const manifest = buildMultiCandidateSessionManifestV1({
    logicalSessionId: sessionId,
    sessionState: 'PAUSED',
    currentSourceEpochRef: 'source-epoch-000001',
    sourceEpochs: [{
      sourceEpochRef: 'source-epoch-000001',
      sourceRunRef: 'cohort-run-000001',
      poolRef: 'candidate-pool-000001',
      poolStatus: 'PROCESSING',
      candidateCounts: { total: 1, pending: 1, active: 0, completed: 0, superseded: 0, interrupted: 0 },
      dispositionCounts: {},
    }],
    hostSlices: [{ hostSliceId: 'host-slice-000001', startedAt: '2026-09-15T00:00:00.000Z', endedAt: null, participantJobs: 2, state: 'PAUSED', reason: 'HOST_SLICE_BUDGET' }],
    sourceTransitionCount: 0,
    failureRef: null,
  });
  await writeMultiCandidateSessionManifestAtomic(root, manifest);
  assert.deepEqual(await readDurableMultiCandidateSessionManifest(root, sessionId), manifest);
  const location = resolveCandidateSessionLocation(root, sessionId);
  assert.equal((await readFile(location.manifestPath, 'utf8')).endsWith('\n'), true);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCandidateSessionStoreTests()
    .then(() => console.log('candidateSessionStore.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
