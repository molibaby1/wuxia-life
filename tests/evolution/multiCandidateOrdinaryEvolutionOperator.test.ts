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
import { formatOrdinaryEvolutionOperatorSummary } from '../../scripts/evolution/operator/runOrdinaryEvolution';
import { writeMultiCandidateSessionManifestAtomic } from '../../scripts/evolution/candidateSessionStore';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';

const participant: WorkspaceAgentParticipantOptions = { executable: 'test-participant', buildArgs: () => [] };
const baseline = { branch: 'dev', headSha: 'a'.repeat(40), workingTreeFingerprint: 'b'.repeat(64) };

function manifest(
  logicalSessionId: string,
  participantBindingId = 'CODEX_CURRENT',
  hostSliceId = 'host-slice-000001',
  sessionState: 'PAUSED' | 'COMPLETED' | 'FAILED' | 'INTERRUPTED' | 'PROCESSING' = 'PAUSED',
  pauseOrStopReason?: string | null,
  hostSliceState: 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'INTERRUPTED' | 'FAILED' = sessionState,
  endedAt: string | null = '2026-09-15T00:01:00.000Z',
) {
  const reason = pauseOrStopReason ?? (sessionState === 'PAUSED' ? 'HOST_SLICE_BUDGET' : null);
  return buildMultiCandidateSessionManifestV1({
    logicalSessionId,
    sessionState,
    pauseOrStopReason: reason,
    sourceEpochs: [{ sourceEpochRef: 'source-epoch-000001', sourceRunRef: 'source-000001', poolRef: null, poolStatus: sessionState === 'COMPLETED' ? 'EXHAUSTED' : 'PROCESSING', lifecycle: sessionState === 'COMPLETED' ? 'POOL_EXHAUSTED' : 'ANALYSIS_PENDING', candidateCounts: { total: 0, pending: 0, active: 0, completed: 0, superseded: 0, interrupted: 0 }, dispositionCounts: {} }],
    currentSourceEpochRef: 'source-epoch-000001',
    hostSlices: [{ hostSliceId, startedAt: '2026-09-15T00:00:00.000Z', endedAt, participantJobs: 2, state: hostSliceState, reason }],
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
  const sidecarEvents: string[] = [];
  const dependencies: MultiCandidateOrdinaryEvolutionDependencies = {
    preflightGit: async () => ({ ...baseline, statusShort: '', clean: true }),
    resolveBinding: async () => ({ bindingId: 'CODEX_CURRENT', provider: 'codex-local-subagent', executable: 'test-participant', executableVersion: 'test', participant, participantMode: 'local-subagent' }),
    allocateSessionId: async () => { allocated += 1; return 'ordinary-run-20260915-000001'; },
    runPhase0Source: async () => { phase0Calls += 1; return { sourceRoot, sourceRunRef: 'source-000001' }; },
    runSessionSlice: async input => {
      participantCalls += 1;
      await writeMultiCandidateSessionManifestAtomic(root, manifest(input.logicalSessionId, 'CODEX_CURRENT', input.hostSliceId));
      return { logicalSessionId: input.logicalSessionId, hostSliceId: input.hostSliceId, sessionState: 'PAUSED', reason: 'HOST_SLICE_BUDGET', participantJobs: 2, currentSourceEpochRef: 'source-epoch-000001', manifestPath: join(root, 'artifacts/evolution/sessions', input.logicalSessionId, 'session-manifest.json'), sourceTransitionCount: 0 };
    },
    retainTerminalEvidence: async () => { sidecarEvents.push('evidence'); return { status: 'NOT_APPLICABLE', capsuleRoot: null, manifest: null, reused: false }; },
    archiveReport: async input => { sidecarEvents.push('report'); return { reportId: 'candidate-report-000001', reportDirectory: join(root, 'artifacts/evolution/run-reports/candidate-report-000001'), reportJsonPath: join(root, 'artifacts/evolution/run-reports/candidate-report-000001/report.json'), reportMarkdownPath: join(root, 'artifacts/evolution/run-reports/candidate-report-000001/report.md'), logicalSessionId: input.logicalSessionId, hostSliceId: input.hostSliceId, createdAt: '2026-09-15T00:01:00.000Z' }; },
    refreshHumanFollowupInbox: async () => { sidecarEvents.push('hfl'); return { inboxPath: 'artifacts/evolution/human-follow-up/index.md', activeCount: 0 }; },
    refreshOperationalIndex: async () => { sidecarEvents.push('index'); return { runReportsIndexPath: 'artifacts/evolution/run-reports/index.md', topLevelIndexPath: 'artifacts/evolution/index.md', reportCount: 1, logicalSessionCount: 1, reportSnapshotCount: 1 }; },
  };

  const started = await runMultiCandidateOrdinaryEvolution({ repositoryRoot: root, operation: { mode: 'START_NEW_SESSION' }, dependencies });
  assert.equal(started.logicalSessionId, 'ordinary-run-20260915-000001');
  assert.equal(started.hostSliceId, 'host-slice-000001');
  assert.equal(allocated, 1);
  assert.equal(phase0Calls, 1);
  assert.equal(participantCalls, 1);
  assert.deepEqual(sidecarEvents, ['evidence', 'report', 'hfl', 'index']);
  assert.equal(started.reportSnapshotRef, 'artifacts/evolution/run-reports/candidate-report-000001/report.json');
  assert.equal(started.terminalForensicEvidenceRef, null);

  const resumed = await runMultiCandidateOrdinaryEvolution({ repositoryRoot: root, operation: { mode: 'RESUME_SESSION', logicalSessionId: started.logicalSessionId }, dependencies });
  assert.equal(resumed.hostSliceId, 'host-slice-000002');
  assert.equal(allocated, 1);
  assert.equal(phase0Calls, 1);
  assert.equal(participantCalls, 2);
  assert.deepEqual(sidecarEvents, ['evidence', 'report', 'hfl', 'index', 'evidence', 'report', 'hfl', 'index']);

  const terminalSummary = formatOrdinaryEvolutionOperatorSummary({
    ...started,
    participantFailureDetails: [{
      candidateRef: 'candidate-pool-abc/hypothesis-000002',
      hypothesisId: 'hypothesis-000002',
      stage: 'SOLUTION',
      failureOrigin: 'OUTPUT_REFERENCE',
      failureReason: 'MISSING_TARGET',
      containment: 'CANDIDATE_LOCAL',
      message: 'repoRef does not exist: src/data/identity-year-events.json',
      typedDetails: 'AVAILABLE',
      evidenceRef: 'artifacts/evolution/sessions/ordinary-run-20260915-000001/workflow-outcome.json',
    }],
  } as never);
  assert.match(terminalSummary, /candidate=candidate-pool-abc\/hypothesis-000002/);
  assert.match(terminalSummary, /failureOrigin=OUTPUT_REFERENCE/);
  assert.match(terminalSummary, /failureReason=MISSING_TARGET/);
  assert.match(terminalSummary, /containment=CANDIDATE_LOCAL/);

  for (const state of ['COMPLETED', 'FAILED', 'INTERRUPTED'] as const) {
    const forbiddenRoot = await mkdtemp(join(tmpdir(), `candidate-operator-${state.toLowerCase()}-`));
    await writeMultiCandidateSessionManifestAtomic(forbiddenRoot, manifest(`ordinary-run-${state.toLowerCase()}`, 'CODEX_CURRENT', 'host-slice-000001', state));
    let forbiddenRunCalls = 0;
    await assert.rejects(
      () => runMultiCandidateOrdinaryEvolution({
        repositoryRoot: forbiddenRoot,
        operation: { mode: 'RESUME_SESSION', logicalSessionId: `ordinary-run-${state.toLowerCase()}` },
        dependencies: { ...dependencies, runSessionSlice: async input => { forbiddenRunCalls += 1; return dependencies.runSessionSlice!(input); } },
      }),
      /not resumable|resume/i,
    );
    assert.equal(forbiddenRunCalls, 0);
  }

  const sourceChangeLimitRoot = await mkdtemp(join(tmpdir(), 'candidate-operator-source-change-limit-'));
  await writeMultiCandidateSessionManifestAtomic(sourceChangeLimitRoot, manifest('ordinary-run-source-change-limit', 'CODEX_CURRENT', 'host-slice-000001', 'PAUSED', 'SOURCE_CHANGE_LIMIT_REACHED'));
  let sourceChangeLimitRunCalls = 0;
  await assert.rejects(
    () => runMultiCandidateOrdinaryEvolution({
      repositoryRoot: sourceChangeLimitRoot,
      operation: { mode: 'RESUME_SESSION', logicalSessionId: 'ordinary-run-source-change-limit' },
      dependencies: { ...dependencies, runSessionSlice: async input => { sourceChangeLimitRunCalls += 1; return dependencies.runSessionSlice!(input); } },
    }),
    /not resumable|source-change authority|resume/i,
  );
  assert.equal(sourceChangeLimitRunCalls, 0);

  const finishedProcessingRoot = await mkdtemp(join(tmpdir(), 'candidate-operator-finished-processing-'));
  await writeMultiCandidateSessionManifestAtomic(finishedProcessingRoot, manifest('ordinary-run-finished-processing', 'CODEX_CURRENT', 'host-slice-000001', 'PROCESSING', null, 'COMPLETED'));
  let finishedProcessingRunCalls = 0;
  await assert.rejects(
    () => runMultiCandidateOrdinaryEvolution({
      repositoryRoot: finishedProcessingRoot,
      operation: { mode: 'RESUME_SESSION', logicalSessionId: 'ordinary-run-finished-processing' },
      dependencies: { ...dependencies, runSessionSlice: async input => { finishedProcessingRunCalls += 1; return dependencies.runSessionSlice!(input); } },
    }),
    /not resumable|resume/i,
  );
  assert.equal(finishedProcessingRunCalls, 0);

  const crashRoot = await mkdtemp(join(tmpdir(), 'candidate-operator-crash-reconcile-'));
  await writeMultiCandidateSessionManifestAtomic(crashRoot, manifest('ordinary-run-crash-reconcile', 'CODEX_CURRENT', 'host-slice-000001', 'PROCESSING', null, 'PROCESSING', null));
  let crashReconcileRunCalls = 0;
  await runMultiCandidateOrdinaryEvolution({
    repositoryRoot: crashRoot,
    operation: { mode: 'RESUME_SESSION', logicalSessionId: 'ordinary-run-crash-reconcile' },
    dependencies: { ...dependencies, runSessionSlice: async input => { crashReconcileRunCalls += 1; return dependencies.runSessionSlice!(input); } },
  });
  assert.equal(crashReconcileRunCalls, 1);

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
