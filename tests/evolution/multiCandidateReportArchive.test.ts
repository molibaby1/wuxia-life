import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCandidatePoolV1 } from '../../scripts/evolution/candidatePoolContract';
import { activateCandidate, completeCandidate, interruptCandidateLocally } from '../../scripts/evolution/candidatePoolState';
import { writeMultiCandidateSessionManifestAtomic } from '../../scripts/evolution/candidateSessionStore';
import { buildMultiCandidateSessionManifestV1 } from '../../scripts/evolution/multiCandidateSessionManifestContract';
import { archiveMultiCandidateSessionReport } from '../../scripts/evolution/reporting/archiveMultiCandidateSessionReport';
import { readMultiCandidateParticipantFailureDetails } from '../../scripts/evolution/reporting/buildMultiCandidateOperationalRunReport';
import { canonicalJson } from '../../scripts/evolution/phase0/provenance';

const decision = { schemaVersion: 'solution-decision-v1', problemId: 'problem-hypothesis-000001', route: 'SKIP', reasonCode: 'NO_PROPOSAL', inputs: { solutionStatus: 'NO_PROPOSAL', reviewerDecision: null, solutionScope: null, reviewScope: null, permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } } };

export async function runMultiCandidateReportArchiveTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'candidate-report-archive-'));
  const hypothesis = { hypothesisId: 'hypothesis-000001', hypothesis: 'H1', observedBasis: 'Observed.', feedbackRefs: ['feedback'], evidenceRefs: [], unknowns: ['Unknown.'], productSignificance: 'Significant.' };
  let pool = buildCandidatePoolV1({ logicalSessionId: 'logical-session-000001', sourceEpochId: 'source-epoch-000001', sourceRunRef: 'source-000001', sourceFingerprintSha256: 'a'.repeat(64), sealedSourceRef: 'source-epochs/source-epoch-000001', hypothesisSet: { artifactRef: 'hypothesis-runs/source-000001/hypotheses.json', hypotheses: [hypothesis] }, baseline: { branch: 'dev', headSha: 'b'.repeat(40), workingTreeFingerprint: 'c'.repeat(64), participantBinding: 'CODEX_CURRENT' } });
  pool = activateCandidate(pool, pool.candidates[0]!.candidateRef);
  pool = completeCandidate(pool, pool.candidates[0]!.candidateRef, { laneRef: 'source-epochs/source-epoch-000001/candidates/hypothesis-000001', baseDecisionRef: 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/decision.json', effectiveDecisionRef: 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/decision.json' });
  const sessionRoot = join(root, 'artifacts/evolution/sessions/logical-session-000001');
  const poolPath = join(sessionRoot, 'source-epochs/source-epoch-000001/candidate-pool.json');
  await mkdir(join(sessionRoot, 'source-epochs/source-epoch-000001/candidates/hypothesis-000001'), { recursive: true });
  await writeFile(poolPath, `${canonicalJson(pool)}\n`);
  await writeFile(join(sessionRoot, 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/decision.json'), `${canonicalJson(decision)}\n`);
  const manifest = (hostSlices: Array<{ hostSliceId: string; startedAt: string; endedAt: string; participantJobs: number; state: 'COMPLETED'; reason: null }>) => buildMultiCandidateSessionManifestV1({ logicalSessionId: 'logical-session-000001', sessionState: 'COMPLETED', pauseOrStopReason: null, sourceEpochs: [{ sourceEpochRef: 'source-epoch-000001', sourceRunRef: 'source-000001', poolRef: 'source-epochs/source-epoch-000001/candidate-pool.json', poolStatus: 'EXHAUSTED', lifecycle: 'POOL_EXHAUSTED', candidateCounts: { total: 1, pending: 0, active: 0, completed: 1, superseded: 0, interrupted: 0 }, dispositionCounts: { SKIP: 1 } }], currentSourceEpochRef: 'source-epoch-000001', hostSlices, sourceTransitionCount: 0, failureRef: null, repositoryBaseline: { branch: 'dev', headSha: 'b'.repeat(40), workingTreeFingerprint: 'c'.repeat(64) }, participantBindingId: 'CODEX_CURRENT' });
  await writeMultiCandidateSessionManifestAtomic(root, manifest([{ hostSliceId: 'host-slice-000001', startedAt: '2026-09-15T00:00:00.000Z', endedAt: '2026-09-15T00:01:00.000Z', participantJobs: 3, state: 'COMPLETED', reason: null }]));
  const first = await archiveMultiCandidateSessionReport({ repositoryRoot: root, logicalSessionId: 'logical-session-000001', hostSliceId: 'host-slice-000001', createdAt: '2026-09-15T00:01:00.000Z' });
  const firstBytes = await readFile(first.reportJsonPath, 'utf8');
  const replay = await archiveMultiCandidateSessionReport({ repositoryRoot: root, logicalSessionId: 'logical-session-000001', hostSliceId: 'host-slice-000001', createdAt: '2026-09-15T02:01:00.000Z' });
  assert.equal(replay.reportId, first.reportId);
  assert.equal(await readFile(replay.reportJsonPath, 'utf8'), firstBytes);
  await writeMultiCandidateSessionManifestAtomic(root, manifest([
    { hostSliceId: 'host-slice-000001', startedAt: '2026-09-15T00:00:00.000Z', endedAt: '2026-09-15T00:01:00.000Z', participantJobs: 3, state: 'COMPLETED', reason: null },
    { hostSliceId: 'host-slice-000002', startedAt: '2026-09-15T01:00:00.000Z', endedAt: '2026-09-15T01:01:00.000Z', participantJobs: 0, state: 'COMPLETED', reason: null },
  ]));
  const second = await archiveMultiCandidateSessionReport({ repositoryRoot: root, logicalSessionId: 'logical-session-000001', hostSliceId: 'host-slice-000002', createdAt: '2026-09-15T01:01:00.000Z' });
  assert.notEqual(first.reportId, second.reportId);
  assert.equal(await readFile(first.reportJsonPath, 'utf8'), firstBytes);
  const completedMarkdown = await readFile(first.reportMarkdownPath, 'utf8');
  assert.match(completedMarkdown, /Logical Session/);
  assert.doesNotMatch(completedMarkdown, /Participant Failure/);

  const failureRoot = await mkdtemp(join(tmpdir(), 'candidate-report-failure-'));
  const failureSessionId = 'logical-session-failure-000001';
  const failureSessionRoot = join(failureRoot, 'artifacts/evolution/sessions', failureSessionId);
  const failureCandidate = { ...hypothesis, hypothesisId: 'hypothesis-000002' };
  const completedCandidate = { ...hypothesis, hypothesisId: 'hypothesis-000003' };
  let failurePool = buildCandidatePoolV1({
    logicalSessionId: failureSessionId,
    sourceEpochId: 'source-epoch-000001',
    sourceRunRef: 'source-000001',
    sourceFingerprintSha256: 'd'.repeat(64),
    sealedSourceRef: 'source-epochs/source-epoch-000001',
    hypothesisSet: { artifactRef: 'hypothesis-runs/source-000001/hypotheses.json', hypotheses: [failureCandidate, completedCandidate] },
    baseline: { branch: 'dev', headSha: 'e'.repeat(40), workingTreeFingerprint: 'f'.repeat(64), participantBinding: 'CODEX_CURRENT' },
  });
  failurePool = activateCandidate(failurePool, failurePool.candidates[0]!.candidateRef);
  failurePool = interruptCandidateLocally(failurePool, failurePool.candidates[0]!.candidateRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000002/workflow-outcome.json');
  failurePool = activateCandidate(failurePool, failurePool.candidates[1]!.candidateRef);
  failurePool = completeCandidate(failurePool, failurePool.candidates[1]!.candidateRef, { laneRef: 'source-epochs/source-epoch-000001/candidates/hypothesis-000003', baseDecisionRef: 'source-epochs/source-epoch-000001/candidates/hypothesis-000003/decision.json', effectiveDecisionRef: 'source-epochs/source-epoch-000001/candidates/hypothesis-000003/decision.json' });
  const failureLaneRoot = join(failureSessionRoot, 'source-epochs/source-epoch-000001/candidates/hypothesis-000002');
  const completedLaneRoot = join(failureSessionRoot, 'source-epochs/source-epoch-000001/candidates/hypothesis-000003');
  await mkdir(join(failureLaneRoot, 'solution-agent'), { recursive: true });
  await mkdir(completedLaneRoot, { recursive: true });
  await writeFile(join(failureSessionRoot, 'source-epochs/source-epoch-000001/candidate-pool.json'), `${canonicalJson(failurePool)}\n`);
  await writeFile(join(failureLaneRoot, 'workflow-outcome.json'), JSON.stringify({
    schemaVersion: 'candidate-lane-failure-v2',
    candidateRef: failurePool.candidates[0]!.candidateRef,
    hypothesisId: 'hypothesis-000002',
    sourceIndex: 0,
    stage: 'SOLUTION',
    failureOrigin: 'OUTPUT_REFERENCE',
    failureReason: 'MISSING_TARGET',
    containment: 'CANDIDATE_LOCAL',
    participantErrorKind: null,
    message: 'repoRef does not exist: src/data/identity-year-events.json',
    actualParticipantJobs: 1,
    retryCount: 0,
  }) + '\n');
  await writeFile(join(completedLaneRoot, 'decision.json'), `${canonicalJson({ ...decision, problemId: 'problem-hypothesis-000003' })}\n`);
  await writeMultiCandidateSessionManifestAtomic(failureRoot, buildMultiCandidateSessionManifestV1({
    logicalSessionId: failureSessionId,
    sessionState: 'COMPLETED',
    pauseOrStopReason: null,
    sourceEpochs: [{ sourceEpochRef: 'source-epoch-000001', sourceRunRef: 'source-000001', poolRef: 'source-epochs/source-epoch-000001/candidate-pool.json', poolStatus: 'EXHAUSTED', lifecycle: 'POOL_EXHAUSTED', candidateCounts: { total: 2, pending: 0, active: 0, completed: 1, superseded: 0, interrupted: 1 }, dispositionCounts: { SKIP: 1 } }],
    currentSourceEpochRef: 'source-epoch-000001',
    hostSlices: [{ hostSliceId: 'host-slice-000001', startedAt: '2026-09-16T00:00:00.000Z', endedAt: '2026-09-16T00:01:00.000Z', participantJobs: 3, state: 'COMPLETED', reason: null }],
    sourceTransitionCount: 0,
    failureRef: null,
    repositoryBaseline: { branch: 'dev', headSha: 'e'.repeat(40), workingTreeFingerprint: 'f'.repeat(64) },
    participantBindingId: 'CODEX_CURRENT',
  }));
  const details = await readMultiCandidateParticipantFailureDetails({ repositoryRoot: failureRoot, logicalSessionId: failureSessionId });
  assert.deepEqual(details, [{
    candidateRef: failurePool.candidates[0]!.candidateRef,
    hypothesisId: 'hypothesis-000002',
    stage: 'SOLUTION',
    failureOrigin: 'OUTPUT_REFERENCE',
    failureReason: 'MISSING_TARGET',
    containment: 'CANDIDATE_LOCAL',
    message: 'repoRef does not exist: src/data/identity-year-events.json',
    evidenceRef: `artifacts/evolution/sessions/${failureSessionId}/source-epochs/source-epoch-000001/candidates/hypothesis-000002/workflow-outcome.json`,
    typedDetails: 'AVAILABLE',
  }]);
  const failureReport = await archiveMultiCandidateSessionReport({ repositoryRoot: failureRoot, logicalSessionId: failureSessionId, hostSliceId: 'host-slice-000001' });
  const failureMarkdown = await readFile(failureReport.reportMarkdownPath, 'utf8');
  assert.match(failureMarkdown, /Failure/);
  assert.match(failureMarkdown, /candidate=.*hypothesis-000002/);
  assert.match(failureMarkdown, /stage=SOLUTION/);
  assert.match(failureMarkdown, /failureOrigin=OUTPUT_REFERENCE/);
  assert.match(failureMarkdown, /failureReason=MISSING_TARGET/);
  assert.match(failureMarkdown, /containment=CANDIDATE_LOCAL/);
  assert.match(failureMarkdown, /message=repoRef does not exist: src\/data\/identity-year-events\.json/);
  assert.match(failureMarkdown, /evidence=artifacts\/evolution\/sessions\/.*workflow-outcome\.json/);

  await writeFile(join(failureLaneRoot, 'workflow-outcome.json'), JSON.stringify({
    schemaVersion: 'candidate-lane-failure-v1',
    candidateRef: failurePool.candidates[0]!.candidateRef,
    hypothesisId: 'hypothesis-000002',
    sourceIndex: 0,
    stage: 'SOLUTION',
    error: 'legacy failure text',
    actualParticipantJobs: 1,
    retryCount: 0,
  }) + '\n');
  const historicalDetails = await readMultiCandidateParticipantFailureDetails({ repositoryRoot: failureRoot, logicalSessionId: failureSessionId });
  assert.deepEqual(historicalDetails, [{
    candidateRef: failurePool.candidates[0]!.candidateRef,
    hypothesisId: 'hypothesis-000002',
    stage: 'typed details unavailable',
    failureOrigin: null,
    failureReason: null,
    containment: null,
    message: 'typed details unavailable',
    typedDetails: 'UNAVAILABLE',
    evidenceRef: `artifacts/evolution/sessions/${failureSessionId}/source-epochs/source-epoch-000001/candidates/hypothesis-000002/workflow-outcome.json`,
  }]);
}

if (import.meta.url === `file://${process.argv[1]}`) runMultiCandidateReportArchiveTests().then(() => console.log('multiCandidateReportArchive.test.ts: ok')).catch(error => { console.error(error); process.exit(1); });
