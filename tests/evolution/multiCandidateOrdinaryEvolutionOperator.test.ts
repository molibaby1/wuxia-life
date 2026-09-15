import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildMultiCandidateSessionManifestV1 } from '../../scripts/evolution/multiCandidateSessionManifestContract';
import {
  runMultiCandidateOrdinaryEvolution,
  type MultiCandidateOrdinaryEvolutionDependencies,
} from '../../scripts/evolution/operator/runMultiCandidateOrdinaryEvolution';
import { writeMultiCandidateSessionManifestAtomic } from '../../scripts/evolution/candidateSessionStore';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';

const participant: WorkspaceAgentParticipantOptions = { executable: 'test-participant', buildArgs: () => [] };
const baseline = { branch: 'dev', headSha: 'a'.repeat(40), workingTreeFingerprint: 'b'.repeat(64) };

function manifest(logicalSessionId: string, participantBindingId = 'CODEX_CURRENT') {
  return buildMultiCandidateSessionManifestV1({
    logicalSessionId,
    sessionState: 'PAUSED',
    pauseOrStopReason: 'HOST_SLICE_BUDGET',
    sourceEpochs: [{ sourceEpochRef: 'source-epoch-000001', sourceRunRef: 'source-000001', poolRef: null, poolStatus: 'PROCESSING', lifecycle: 'ANALYSIS_PENDING', candidateCounts: { total: 0, pending: 0, active: 0, completed: 0, superseded: 0, interrupted: 0 }, dispositionCounts: {} }],
    currentSourceEpochRef: 'source-epoch-000001',
    hostSlices: [{ hostSliceId: 'host-slice-000001', startedAt: '2026-09-15T00:00:00.000Z', endedAt: '2026-09-15T00:01:00.000Z', participantJobs: 2, state: 'PAUSED', reason: 'HOST_SLICE_BUDGET' }],
    sourceTransitionCount: 0,
    failureRef: null,
    repositoryBaseline: baseline,
    participantBindingId,
    budgetAccounting: { participantJobs: 2, hostSliceCount: 1 },
  });
}

export async function runMultiCandidateOrdinaryEvolutionOperatorTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'candidate-operator-'));
  const sourceRoot = join(root, 'source');
  await mkdir(sourceRoot, { recursive: true });
  let allocated = 0;
  let phase0Calls = 0;
  let participantCalls = 0;
  const dependencies: MultiCandidateOrdinaryEvolutionDependencies = {
    preflightGit: async () => ({ ...baseline, statusShort: '', clean: true }),
    resolveBinding: async () => ({ bindingId: 'CODEX_CURRENT', provider: 'codex-local-subagent', executable: 'test-participant', executableVersion: 'test', participant, participantMode: 'local-subagent' }),
    allocateSessionId: async () => { allocated += 1; return 'ordinary-run-20260915-000001'; },
    runPhase0Source: async () => { phase0Calls += 1; return { sourceRoot, sourceRunRef: 'source-000001' }; },
    runSessionSlice: async input => {
      participantCalls += 1;
      await writeMultiCandidateSessionManifestAtomic(root, manifest(input.logicalSessionId));
      return { logicalSessionId: input.logicalSessionId, hostSliceId: input.hostSliceId, sessionState: 'PAUSED', reason: 'HOST_SLICE_BUDGET', participantJobs: 2, currentSourceEpochRef: 'source-epoch-000001', manifestPath: join(root, 'artifacts/evolution/sessions', input.logicalSessionId, 'session-manifest.json'), sourceTransitionCount: 0 };
    },
  };

  const started = await runMultiCandidateOrdinaryEvolution({ repositoryRoot: root, operation: { mode: 'START_NEW_SESSION' }, dependencies });
  assert.equal(started.logicalSessionId, 'ordinary-run-20260915-000001');
  assert.equal(started.hostSliceId, 'host-slice-000001');
  assert.equal(allocated, 1);
  assert.equal(phase0Calls, 1);
  assert.equal(participantCalls, 1);

  const resumed = await runMultiCandidateOrdinaryEvolution({ repositoryRoot: root, operation: { mode: 'RESUME_SESSION', logicalSessionId: started.logicalSessionId }, dependencies });
  assert.equal(resumed.hostSliceId, 'host-slice-000002');
  assert.equal(allocated, 1);
  assert.equal(phase0Calls, 1);
  assert.equal(participantCalls, 2);

  await assert.rejects(
    () => runMultiCandidateOrdinaryEvolution({ repositoryRoot: root, operation: { mode: 'RESUME_SESSION', logicalSessionId: 'ordinary-run-20260915-999999' }, dependencies }),
    /session manifest|ENOENT|resume/i,
  );

  const wrongBindingRoot = await mkdtemp(join(tmpdir(), 'candidate-operator-binding-'));
  await writeMultiCandidateSessionManifestAtomic(wrongBindingRoot, manifest('ordinary-run-20260915-000002', 'OTHER_BINDING'));
  let wrongBindingParticipantCalls = 0;
  await assert.rejects(
    () => runMultiCandidateOrdinaryEvolution({ repositoryRoot: wrongBindingRoot, operation: { mode: 'RESUME_SESSION', logicalSessionId: 'ordinary-run-20260915-000002' }, dependencies: { ...dependencies, runSessionSlice: async input => { wrongBindingParticipantCalls += 1; return dependencies.runSessionSlice!(input); } } }),
    /participant binding mismatch/i,
  );
  assert.equal(wrongBindingParticipantCalls, 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMultiCandidateOrdinaryEvolutionOperatorTests().then(() => console.log('multiCandidateOrdinaryEvolutionOperator.test.ts: ok')).catch(error => { console.error(error); process.exit(1); });
}
