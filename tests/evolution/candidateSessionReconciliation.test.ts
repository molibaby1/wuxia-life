import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCandidatePoolV1, parseCandidatePoolV1 } from '../../scripts/evolution/candidatePoolContract';
import { activateCandidate } from '../../scripts/evolution/candidatePoolState';
import { reconcileActiveCandidate } from '../../scripts/evolution/reconcileCandidateSession';
import { buildProblemPackage } from '../../scripts/evolution/problemAgnosticSolution/buildProblemPackage';
import { canonicalJson } from '../../scripts/evolution/phase0/provenance';
import { buildCandidateLaneFailureV2 } from '../../scripts/evolution/candidateLaneFailureContract';

const hypothesis = { hypothesisId: 'hypothesis-000002', hypothesis: 'H2', observedBasis: 'Observed.', feedbackRefs: ['overallImpression'], evidenceRefs: [], unknowns: ['Unknown.'], productSignificance: 'Significant.' };
const secondHypothesis = { hypothesisId: 'hypothesis-000003', hypothesis: 'H3', observedBasis: 'Observed.', feedbackRefs: ['overallImpression'], evidenceRefs: [], unknowns: ['Unknown.'], productSignificance: 'Significant.' };
const decision = { schemaVersion: 'solution-decision-v1', problemId: 'problem-hypothesis-000002', route: 'DEFER', reasonCode: 'INSUFFICIENT_EVIDENCE', inputs: { solutionStatus: 'INSUFFICIENT_EVIDENCE', reviewerDecision: null, solutionScope: null, reviewScope: null, permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } } };

function activePoolFor(hypotheses: Array<typeof hypothesis>): ReturnType<typeof activateCandidate> {
  const pool = buildCandidatePoolV1({ logicalSessionId: 's3', sourceEpochId: 'e', sourceRunRef: 'cohort-run-000001', sourceFingerprintSha256: 'a'.repeat(64), sealedSourceRef: 'source-epochs/source-epoch-000001', hypothesisSet: { artifactRef: 'hypotheses.json', hypotheses }, baseline: { branch: 'dev', headSha: 'b'.repeat(40), workingTreeFingerprint: 'c'.repeat(64), participantBinding: 'CODEX_CURRENT' } });
  return activateCandidate(pool, pool.candidates[0]!.candidateRef);
}

function localFailure(candidate: { candidateRef: string; hypothesisId: string; sourceIndex: number }) {
  return buildCandidateLaneFailureV2({
    candidateRef: candidate.candidateRef,
    hypothesisId: candidate.hypothesisId,
    sourceIndex: candidate.sourceIndex,
    stage: 'SOLUTION',
    actualParticipantJobs: 1,
    failureOrigin: 'OUTPUT_REFERENCE',
    failureReason: 'MISSING_TARGET',
    participantErrorKind: 'invalid_output',
    message: 'candidate-local output reference is missing',
  });
}

function failClosedFailure(candidate: { candidateRef: string; hypothesisId: string; sourceIndex: number }) {
  return buildCandidateLaneFailureV2({
    candidateRef: candidate.candidateRef,
    hypothesisId: candidate.hypothesisId,
    sourceIndex: candidate.sourceIndex,
    stage: 'SOLUTION',
    actualParticipantJobs: 1,
    failureOrigin: 'PARTICIPANT_RUNTIME',
    failureReason: 'TIMEOUT',
    participantErrorKind: 'timeout',
    message: 'participant timed out',
  });
}

async function writeWorkflowOutcome(laneRoot: string, value: unknown): Promise<void> {
  await mkdir(laneRoot, { recursive: true });
  await writeFile(join(laneRoot, 'workflow-outcome.json'), JSON.stringify(value));
}

async function readPool(path: string) {
  return parseCandidatePoolV1(JSON.parse(await readFile(path, 'utf8')) as unknown);
}

export async function runCandidateSessionReconciliationTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'candidate-reconcile-'));
  // The exact candidate reference is deterministic but opaque; locate it from the Pool.
  const basePool = buildCandidatePoolV1({ logicalSessionId: 's3', sourceEpochId: 'e', sourceRunRef: 'cohort-run-000001', sourceFingerprintSha256: 'a'.repeat(64), sealedSourceRef: 'source-epochs/source-epoch-000001', hypothesisSet: { artifactRef: 'hypotheses.json', hypotheses: [hypothesis] }, baseline: { branch: 'dev', headSha: 'b'.repeat(40), workingTreeFingerprint: 'c'.repeat(64), participantBinding: 'CODEX_CURRENT' } });
  const activePool = activateCandidate(basePool, basePool.candidates[0]!.candidateRef);
  const lane = join(root, 'lane');
  await mkdir(lane, { recursive: true });
  await writeFile(join(lane, 'candidate-activation.json'), canonicalJson({
    schemaVersion: 'candidate-activation-v1',
    candidateRef: activePool.candidates[0]!.candidateRef,
    poolId: activePool.poolId,
    hypothesisId: hypothesis.hypothesisId,
    sourceIndex: 0,
    hypothesisSha256: activePool.candidates[0]!.hypothesisSha256,
    hypothesisSetRef: activePool.hypothesisSet.artifactRef,
    hypothesisSetSha256: activePool.hypothesisSet.sha256,
    sourceRunRef: activePool.source.sourceRunRef,
  }));
  await buildProblemPackage({ activeCandidate: hypothesis, activeCandidateRef: activePool.candidates[0]!.candidateRef, activeCandidateSourceIndex: 0, runRef: 'cohort-run-000001', observablePayloadRef: 'source.json', externalFeedbackRef: 'feedback.json', improvementHypothesisRef: 'hypotheses.json', diagnosticEvidenceRefs: ['diagnostic.json'], authorityRefs: [], productSourceFingerprintSha256: 'a'.repeat(64), destinationPath: join(lane, 'problem-package.json') });
  await writeFile(join(lane, 'decision.json'), canonicalJson(decision));
  let participantCalls = 0;
  const poolPath = join(root, 'pool.json');
  await writeFile(poolPath, canonicalJson(activePool));
  const result = await reconcileActiveCandidate({ pool: activePool, candidateLaneRoot: lane, poolPath });
  assert.equal(result.status, 'RECONCILED');
  assert.equal(participantCalls, 0);
  const reconciledPool = JSON.parse(await readFile(poolPath, 'utf8')) as { candidates: Array<{ laneRef: string | null; baseDecisionRef: string | null; effectiveDecisionRef: string | null }> };
  assert.equal(reconciledPool.candidates[0]!.laneRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000002');
  assert.equal(reconciledPool.candidates[0]!.baseDecisionRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000002/decision.json');
  assert.equal(reconciledPool.candidates[0]!.effectiveDecisionRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000002/decision.json');
  const incomplete = await reconcileActiveCandidate({ pool: activePool, candidateLaneRoot: join(root, 'missing') });
  assert.equal(incomplete.status, 'INTERRUPTED');

  const localPool = activePoolFor([hypothesis, secondHypothesis]);
  const localCandidate = localPool.candidates[0]!;
  const localLane = join(root, 'local-lane');
  await writeWorkflowOutcome(localLane, localFailure(localCandidate));
  const localPoolPath = join(root, 'local-pool.json');
  await writeFile(localPoolPath, canonicalJson(localPool));
  const localResult = await reconcileActiveCandidate({
    pool: localPool,
    candidateLaneRoot: localLane,
    poolPath: localPoolPath,
    laneRef: 'source-epochs/source-epoch-000001/candidates/hypothesis-000002',
  });
  assert.equal(localResult.status, 'CANDIDATE_LOCAL_FAILURE_RECONCILED');
  if (localResult.status === 'CANDIDATE_LOCAL_FAILURE_RECONCILED') {
    assert.equal(localResult.poolStatus, 'PROCESSING');
    assert.equal(localResult.interruptionRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000002/workflow-outcome.json');
  }
  const localAfter = await readPool(localPoolPath);
  assert.equal(localAfter.status, 'PROCESSING');
  assert.deepEqual(localAfter.candidates.map(candidate => candidate.processingState), ['INTERRUPTED', 'PENDING']);

  const exhaustedPool = activePoolFor([hypothesis]);
  const exhaustedLane = join(root, 'exhausted-lane');
  await writeWorkflowOutcome(exhaustedLane, localFailure(exhaustedPool.candidates[0]!));
  const exhaustedPoolPath = join(root, 'exhausted-pool.json');
  await writeFile(exhaustedPoolPath, canonicalJson(exhaustedPool));
  const exhaustedResult = await reconcileActiveCandidate({ pool: exhaustedPool, candidateLaneRoot: exhaustedLane, poolPath: exhaustedPoolPath });
  assert.equal(exhaustedResult.status, 'CANDIDATE_LOCAL_FAILURE_RECONCILED');
  if (exhaustedResult.status === 'CANDIDATE_LOCAL_FAILURE_RECONCILED') assert.equal(exhaustedResult.poolStatus, 'EXHAUSTED');
  const exhaustedAfter = await readPool(exhaustedPoolPath);
  assert.equal(exhaustedAfter.status, 'EXHAUSTED');
  assert.equal(exhaustedAfter.candidates[0]!.processingState, 'INTERRUPTED');

  const failClosedPool = activePoolFor([hypothesis]);
  const failClosedLane = join(root, 'fail-closed-lane');
  await writeWorkflowOutcome(failClosedLane, failClosedFailure(failClosedPool.candidates[0]!));
  const failClosedPoolPath = join(root, 'fail-closed-pool.json');
  await writeFile(failClosedPoolPath, canonicalJson(failClosedPool));
  const failClosedResult = await reconcileActiveCandidate({ pool: failClosedPool, candidateLaneRoot: failClosedLane, poolPath: failClosedPoolPath });
  assert.equal(failClosedResult.status, 'INTERRUPTED');
  assert.equal((await readPool(failClosedPoolPath)).status, 'INTERRUPTED');

  const historicalPool = activePoolFor([hypothesis]);
  const historicalLane = join(root, 'historical-lane');
  await writeWorkflowOutcome(historicalLane, {
    schemaVersion: 'candidate-lane-failure-v1',
    candidateRef: historicalPool.candidates[0]!.candidateRef,
    errorKind: 'invalid_output',
    message: 'looks candidate local but is historical evidence',
  });
  const historicalPoolPath = join(root, 'historical-pool.json');
  await writeFile(historicalPoolPath, canonicalJson(historicalPool));
  const historicalResult = await reconcileActiveCandidate({ pool: historicalPool, candidateLaneRoot: historicalLane, poolPath: historicalPoolPath });
  assert.equal(historicalResult.status, 'INTERRUPTED');
  assert.equal((await readPool(historicalPoolPath)).status, 'INTERRUPTED');

  const malformedPool = activePoolFor([hypothesis]);
  const malformedLane = join(root, 'malformed-lane');
  const malformed = localFailure(malformedPool.candidates[0]!);
  await writeWorkflowOutcome(malformedLane, { ...malformed, containment: 'CANDIDATE_LOCAL', extra: 'malformed' });
  const malformedPoolPath = join(root, 'malformed-pool.json');
  await writeFile(malformedPoolPath, canonicalJson(malformedPool));
  const malformedResult = await reconcileActiveCandidate({ pool: malformedPool, candidateLaneRoot: malformedLane, poolPath: malformedPoolPath });
  assert.equal(malformedResult.status, 'INTERRUPTED');
  assert.equal((await readPool(malformedPoolPath)).status, 'INTERRUPTED');

  const identityPool = activePoolFor([hypothesis]);
  const identityLane = join(root, 'identity-lane');
  const mismatched = localFailure(identityPool.candidates[0]!);
  await writeWorkflowOutcome(identityLane, { ...mismatched, candidateRef: `${identityPool.candidates[0]!.candidateRef.slice(0, -identityPool.candidates[0]!.hypothesisId.length)}other-hypothesis`, hypothesisId: 'other-hypothesis' });
  const identityPoolPath = join(root, 'identity-pool.json');
  await writeFile(identityPoolPath, canonicalJson(identityPool));
  const identityResult = await reconcileActiveCandidate({ pool: identityPool, candidateLaneRoot: identityLane, poolPath: identityPoolPath });
  assert.equal(identityResult.status, 'INTERRUPTED');
  assert.equal((await readPool(identityPoolPath)).status, 'INTERRUPTED');

  const contradictoryPool = activePoolFor([hypothesis]);
  const contradictoryLane = join(root, 'contradictory-lane');
  await writeWorkflowOutcome(contradictoryLane, localFailure(contradictoryPool.candidates[0]!));
  await writeFile(join(contradictoryLane, 'decision.json'), canonicalJson(decision));
  const contradictoryPoolPath = join(root, 'contradictory-pool.json');
  await writeFile(contradictoryPoolPath, canonicalJson(contradictoryPool));
  const contradictoryResult = await reconcileActiveCandidate({ pool: contradictoryPool, candidateLaneRoot: contradictoryLane, poolPath: contradictoryPoolPath });
  assert.equal(contradictoryResult.status, 'INTERRUPTED');
  assert.equal((await readPool(contradictoryPoolPath)).status, 'INTERRUPTED');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCandidateSessionReconciliationTests().then(() => console.log('candidateSessionReconciliation.test.ts: ok')).catch(error => { console.error(error); process.exit(1); });
}
