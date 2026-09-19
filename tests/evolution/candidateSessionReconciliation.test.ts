import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCandidatePoolV1, parseCandidatePoolV1 } from '../../scripts/evolution/candidatePoolContract';
import { activateCandidate } from '../../scripts/evolution/candidatePoolState';
import { reconcileActiveCandidate } from '../../scripts/evolution/reconcileCandidateSession';
import { buildProblemPackage } from '../../scripts/evolution/problemAgnosticSolution/buildProblemPackage';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';
import { validateSolutionDecision } from '../../src/evolution/solutionDecisionContract';
import { buildCandidateLaneFailureV2 } from '../../scripts/evolution/candidateLaneFailureContract';

const hypothesis = { hypothesisId: 'hypothesis-000002', hypothesis: 'H2', observedBasis: 'Observed.', feedbackRefs: ['overallImpression'], evidenceRefs: [], unknowns: ['Unknown.'], productSignificance: 'Significant.' };
const secondHypothesis = { hypothesisId: 'hypothesis-000003', hypothesis: 'H3', observedBasis: 'Observed.', feedbackRefs: ['overallImpression'], evidenceRefs: [], unknowns: ['Unknown.'], productSignificance: 'Significant.' };
const decision = { schemaVersion: 'solution-decision-v1', problemId: 'problem-hypothesis-000002', route: 'DEFER', reasonCode: 'INSUFFICIENT_EVIDENCE', inputs: { solutionStatus: 'INSUFFICIENT_EVIDENCE', reviewerDecision: null, solutionScope: null, reviewScope: null, permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } } };
const continuationBaseDecision = { schemaVersion: 'solution-decision-v1', problemId: 'problem-hypothesis-000002', route: 'DEFER_MORE_WORK_REQUESTED', reasonCode: 'REVIEW_REQUEST_MORE_WORK', inputs: { solutionStatus: 'OPTIONS', reviewerDecision: 'REQUEST_MORE_WORK', solutionScope: 'configuration', reviewScope: 'config_only', permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } } };

function activePoolFor(hypotheses: Array<typeof hypothesis>): ReturnType<typeof activateCandidate> {
  const pool = buildCandidatePoolV1({ logicalSessionId: 's3', sourceEpochId: 'e', sourceRunRef: 'cohort-run-000001', sourceFingerprintSha256: 'a'.repeat(64), sealedSourceRef: 'source-epochs/source-epoch-000001', hypothesisSet: { artifactRef: 'hypotheses.json', hypotheses }, baseline: { branch: 'dev', headSha: 'b'.repeat(40), workingTreeFingerprint: 'c'.repeat(64), participantBinding: 'CODEX_CURRENT' } });
  return activateCandidate(pool, pool.candidates[0]!.candidateRef);
}

function localFailure(candidate: { candidateRef: string; hypothesisId: string; sourceIndex: number }, stage: 'SOLUTION' | 'SOLUTION_REVISION' = 'SOLUTION') {
  return buildCandidateLaneFailureV2({
    candidateRef: candidate.candidateRef,
    hypothesisId: candidate.hypothesisId,
    sourceIndex: candidate.sourceIndex,
    stage,
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

  const continuationPool = activePoolFor([hypothesis, secondHypothesis]);
  const continuationLane = join(root, 'continuation-lane');
  await writeWorkflowOutcome(continuationLane, localFailure(continuationPool.candidates[0]!, 'SOLUTION_REVISION'));
  await writeFile(join(continuationLane, 'decision.json'), canonicalJson(continuationBaseDecision));
  const continuationPoolPath = join(root, 'continuation-pool.json');
  await writeFile(continuationPoolPath, canonicalJson(continuationPool));
  const continuationResult = await reconcileActiveCandidate({ pool: continuationPool, candidateLaneRoot: continuationLane, poolPath: continuationPoolPath });
  assert.equal(continuationResult.status, 'CANDIDATE_LOCAL_FAILURE_RECONCILED');
  assert.equal((await readPool(continuationPoolPath)).status, 'PROCESSING');
  assert.deepEqual((await readPool(continuationPoolPath)).candidates.map(candidate => candidate.processingState), ['INTERRUPTED', 'PENDING']);

  const contradictoryPool = activePoolFor([hypothesis]);
  const contradictoryLane = join(root, 'contradictory-lane');
  await writeWorkflowOutcome(contradictoryLane, localFailure(contradictoryPool.candidates[0]!));
  await writeFile(join(contradictoryLane, 'decision.json'), canonicalJson(decision));
  const contradictoryPoolPath = join(root, 'contradictory-pool.json');
  await writeFile(contradictoryPoolPath, canonicalJson(contradictoryPool));
  const contradictoryResult = await reconcileActiveCandidate({ pool: contradictoryPool, candidateLaneRoot: contradictoryLane, poolPath: contradictoryPoolPath });
  assert.equal(contradictoryResult.status, 'INTERRUPTED');
  assert.equal((await readPool(contradictoryPoolPath)).status, 'INTERRUPTED');

  const escalationDecision = validateSolutionDecision({
    ...continuationBaseDecision,
    route: 'ESCALATE_HUMAN',
    reasonCode: 'EXPLICIT_ESCALATION',
    inputs: { ...continuationBaseDecision.inputs, reviewerDecision: 'ESCALATE' },
  });
  const crashPool = activePoolFor([hypothesis, secondHypothesis]);
  const crashCandidate = crashPool.candidates[0]!;
  const crashLane = join(root, 'continuation-escalate-lane');
  await mkdir(crashLane, { recursive: true });
  for (const relativePath of [
    'source/observable-payload.json',
    'feedback-runs/cohort-run-000001/feedback.json',
    'diagnostic/causal-attribution.json',
    'solution-agent/result.json',
    'reviewer-agent/review.json',
    'review-continuation-000001/revision-request.json',
    'review-continuation-000001/solution-revision/result.json',
    'review-continuation-000001/reviewer-agent/review.json',
    'review-continuation-000001/continuation.json',
  ]) {
    await mkdir(join(crashLane, relativePath, '..'), { recursive: true });
    await writeFile(join(crashLane, relativePath), '{}\n');
  }
  await writeFile(join(crashLane, 'hypotheses.json'), `${canonicalJson({ hypotheses: [hypothesis] })}\n`);
  await writeFile(join(crashLane, 'candidate-activation.json'), canonicalJson({
    schemaVersion: 'candidate-activation-v1',
    candidateRef: crashCandidate.candidateRef,
    poolId: crashPool.poolId,
    hypothesisId: hypothesis.hypothesisId,
    sourceIndex: 0,
    hypothesisSha256: crashCandidate.hypothesisSha256,
    hypothesisSetRef: crashPool.hypothesisSet.artifactRef,
    hypothesisSetSha256: crashPool.hypothesisSet.sha256,
    sourceRunRef: crashPool.source.sourceRunRef,
  }));
  await buildProblemPackage({
    activeCandidate: hypothesis,
    activeCandidateRef: crashCandidate.candidateRef,
    activeCandidateSourceIndex: 0,
    runRef: 'cohort-run-000001',
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: 'feedback-runs/cohort-run-000001/feedback.json',
    improvementHypothesisRef: crashPool.hypothesisSet.artifactRef,
    diagnosticEvidenceRefs: ['diagnostic/causal-attribution.json'],
    authorityRefs: ['docs/product/auto-evolution-model.md'],
    productSourceFingerprintSha256: 'a'.repeat(64),
    destinationPath: join(crashLane, 'problem-package.json'),
  });
  await writeFile(join(crashLane, 'decision.json'), canonicalJson(continuationBaseDecision));
  await writeFile(join(crashLane, 'review-continuation-000001/decision.json'), canonicalJson(escalationDecision));
  const crashPoolPath = join(root, 'continuation-escalate-pool.json');
  await writeFile(crashPoolPath, canonicalJson(crashPool));
  let reconciliationParticipantCalls = 0;
  const crashResult = await reconcileActiveCandidate({
    pool: crashPool,
    candidateLaneRoot: crashLane,
    poolPath: crashPoolPath,
    repositoryRoot: root,
  });
  assert.equal(reconciliationParticipantCalls, 0);
  assert.equal(crashResult.status, 'RECONCILED');
  const crashAfter = await readPool(crashPoolPath);
  assert.equal(crashAfter.status, 'PROCESSING');
  assert.deepEqual(crashAfter.candidates.map(candidate => candidate.processingState), ['COMPLETED', 'PENDING']);
  const humanFollowupRef = crashAfter.candidates[0]!.humanFollowupRef;
  assert.equal(humanFollowupRef, `artifacts/evolution/human-follow-up/items/item-${sha256Hex(canonicalJson({ workflowInstanceRef: `${crashPool.logicalSessionId}/${hypothesis.hypothesisId}`, sourceRunRef: crashPool.source.sourceRunRef, decisionSha256: sha256Hex(canonicalJson(escalationDecision)) }))}/item.json`);
  const retained = JSON.parse(await readFile(join(root, humanFollowupRef!), 'utf8')) as { trigger: { route: string }; provenance: { decisionSha256: string }; evidence: Array<{ relativePath: string }> };
  assert.equal(retained.trigger.route, 'ESCALATE_HUMAN');
  assert.equal(retained.provenance.decisionSha256, sha256Hex(canonicalJson(escalationDecision)));
  assert.equal(retained.evidence.some(entry => entry.relativePath === 'review-continuation-000001/decision.json'), true);
  assert.equal(retained.evidence.some(entry => entry.relativePath === 'selection/selected-hypothesis.json'), false);

  const retentionFailurePoolPath = join(root, 'continuation-escalate-retention-failure-pool.json');
  await writeFile(retentionFailurePoolPath, canonicalJson(crashPool));
  let retentionFailureParticipantCalls = 0;
  await assert.rejects(
    () => reconcileActiveCandidate({
      pool: crashPool,
      candidateLaneRoot: crashLane,
      poolPath: retentionFailurePoolPath,
      repositoryRoot: root,
      dependencies: {
        retainHumanFollowup: async () => {
          throw new Error('injected HFL retention failure');
        },
      },
    }),
    /injected HFL retention failure/,
  );
  assert.equal(retentionFailureParticipantCalls, 0);
  const retentionFailureAfter = await readPool(retentionFailurePoolPath);
  assert.equal(retentionFailureAfter.status, 'PROCESSING');
  assert.equal(retentionFailureAfter.candidates[0]!.processingState, 'ACTIVE');
  assert.notEqual(retentionFailureAfter.candidates[0]!.processingState, 'COMPLETED');
  assert.notEqual(retentionFailureAfter.candidates[0]!.processingState, 'INTERRUPTED');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCandidateSessionReconciliationTests().then(() => console.log('candidateSessionReconciliation.test.ts: ok')).catch(error => { console.error(error); process.exit(1); });
}
