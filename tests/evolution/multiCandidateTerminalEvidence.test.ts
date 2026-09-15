import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildMultiCandidateSessionManifestV1 } from '../../scripts/evolution/multiCandidateSessionManifestContract';
import { writeMultiCandidateSessionManifestAtomic } from '../../scripts/evolution/candidateSessionStore';
import { retainMultiCandidateSessionEvidence } from '../../scripts/evolution/evidence/retainMultiCandidateSessionEvidence';
import { verifyDurableEvidenceCapsule } from '../../scripts/evolution/evidence/durableEvidenceCapsule';

async function createSession(root: string, sessionState: 'PAUSED' | 'COMPLETED' | 'FAILED' | 'INTERRUPTED') {
  const logicalSessionId = `logical-session-${sessionState.toLowerCase()}`;
  const sessionRoot = join(root, 'artifacts/evolution/sessions', logicalSessionId);
  const sourceEpochRoot = join(sessionRoot, 'source-epochs/source-epoch-000001');
  await mkdir(join(sourceEpochRoot, 'source-analysis'), { recursive: true });
  await mkdir(join(sourceEpochRoot, 'candidates/hypothesis-000001'), { recursive: true });
  await mkdir(join(sessionRoot, 'source-transitions'), { recursive: true });
  await writeFile(join(sourceEpochRoot, 'source-anchor.json'), '{"schemaVersion":"source-epoch-anchor-v1"}\n');
  await writeFile(join(sourceEpochRoot, 'source-analysis/analysis.json'), '{"analysis":true}\n');
  await writeFile(join(sourceEpochRoot, 'candidates/hypothesis-000001/decision.json'), '{"route":"SKIP"}\n');
  await writeFile(join(sourceEpochRoot, 'candidates/hypothesis-000001/continuation.json'), '{"continuation":true}\n');
  await writeFile(join(sessionRoot, 'source-transitions/transition.json'), '{"transition":true}\n');
  const manifest = buildMultiCandidateSessionManifestV1({
    logicalSessionId,
    sessionState,
    pauseOrStopReason: sessionState === 'PAUSED' ? 'HOST_SLICE_BUDGET' : sessionState === 'FAILED' ? 'PARTICIPANT_FAILURE' : null,
    sourceEpochs: [{
      sourceEpochRef: 'source-epoch-000001',
      sourceRunRef: 'source-run-000001',
      poolRef: 'source-epochs/source-epoch-000001/candidate-pool.json',
      poolStatus: sessionState === 'COMPLETED' ? 'EXHAUSTED' : 'PROCESSING',
      lifecycle: sessionState === 'COMPLETED' ? 'POOL_EXHAUSTED' : 'POOL_ACTIVE',
      candidateCounts: { total: 1, pending: sessionState === 'PAUSED' ? 1 : 0, active: 0, completed: sessionState === 'COMPLETED' ? 1 : 0, superseded: 0, interrupted: sessionState === 'INTERRUPTED' ? 1 : 0 },
      dispositionCounts: sessionState === 'COMPLETED' ? { SKIP: 1 } : {},
    }],
    currentSourceEpochRef: 'source-epoch-000001',
    hostSlices: [{ hostSliceId: 'host-slice-000001', startedAt: '2026-09-15T00:00:00.000Z', endedAt: '2026-09-15T00:01:00.000Z', participantJobs: 2, state: sessionState, reason: sessionState === 'PAUSED' ? 'HOST_SLICE_BUDGET' : null }],
    sourceTransitionCount: 0,
    failureRef: sessionState === 'FAILED' ? 'failure.json' : null,
    repositoryBaseline: { branch: 'dev', headSha: 'a'.repeat(40), workingTreeFingerprint: 'b'.repeat(64) },
    participantBindingId: 'CODEX_CURRENT',
  });
  await writeMultiCandidateSessionManifestAtomic(root, manifest);
  return { logicalSessionId, sessionRoot };
}

export async function runMultiCandidateTerminalEvidenceTests(): Promise<void> {
  const pausedRoot = await mkdtemp(join(tmpdir(), 'candidate-terminal-paused-'));
  const paused = await createSession(pausedRoot, 'PAUSED');
  const pausedResult = await retainMultiCandidateSessionEvidence({ repositoryRoot: pausedRoot, logicalSessionId: paused.logicalSessionId, createdAt: '2026-09-15T00:01:00.000Z' });
  assert.equal(pausedResult.status, 'NOT_APPLICABLE');
  assert.equal(pausedResult.capsuleRoot, null);
  assert.deepEqual(await readdir(join(pausedRoot, 'artifacts/evolution/run-evidence')).catch(() => []), []);

  for (const state of ['COMPLETED', 'FAILED', 'INTERRUPTED'] as const) {
    const root = await mkdtemp(join(tmpdir(), `candidate-terminal-${state.toLowerCase()}-`));
    const session = await createSession(root, state);
    const first = await retainMultiCandidateSessionEvidence({ repositoryRoot: root, logicalSessionId: session.logicalSessionId, createdAt: '2026-09-15T00:01:00.000Z' });
    assert.equal(first.status, 'PUBLISHED');
    assert.ok(first.capsuleRoot);
    const manifest = await verifyDurableEvidenceCapsule(first.capsuleRoot!);
    assert.ok(manifest.objects.some(object => object.sourceRef.endsWith('session-manifest.json')));
    assert.ok(manifest.objects.some(object => object.sourceRef.endsWith('source-anchor.json')));
    assert.ok(manifest.objects.some(object => object.sourceRef.endsWith('source-analysis/analysis.json')));
    assert.ok(manifest.objects.some(object => object.sourceRef.endsWith('decision.json')));
    assert.ok(manifest.objects.some(object => object.sourceRef.endsWith('continuation.json')));
    assert.ok(manifest.objects.some(object => object.sourceRef.endsWith('source-transitions/transition.json')));
    const before = await readFile(join(first.capsuleRoot!, 'manifest.json'), 'utf8');
    const second = await retainMultiCandidateSessionEvidence({ repositoryRoot: root, logicalSessionId: session.logicalSessionId, createdAt: '2026-09-15T00:02:00.000Z' });
    assert.equal(second.status, 'PUBLISHED');
    assert.equal(second.reused, true);
    assert.equal(await readFile(join(first.capsuleRoot!, 'manifest.json'), 'utf8'), before);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMultiCandidateTerminalEvidenceTests().then(() => console.log('multiCandidateTerminalEvidence.test.ts: ok')).catch(error => { console.error(error); process.exit(1); });
}
