import assert from 'node:assert/strict';
import { validateSolutionDecision, type SolutionDecisionV1 } from '../../src/evolution/solutionDecisionContract';
import { buildCandidatePoolV1 } from '../../scripts/evolution/candidatePoolContract';
import { runSourceCandidatePool } from '../../scripts/evolution/runSourceCandidatePool';

const hypotheses = [
  { hypothesisId: 'hypothesis-000001', hypothesis: 'H1', observedBasis: 'B1', feedbackRefs: ['overallImpression'], evidenceRefs: [], unknowns: ['U1'], productSignificance: 'P1' },
  { hypothesisId: 'hypothesis-000002', hypothesis: 'H2', observedBasis: 'B2', feedbackRefs: ['overallImpression'], evidenceRefs: [], unknowns: ['U2'], productSignificance: 'P2' },
  { hypothesisId: 'hypothesis-000003', hypothesis: 'H3', observedBasis: 'B3', feedbackRefs: ['overallImpression'], evidenceRefs: [], unknowns: ['U3'], productSignificance: 'P3' },
];

function decision(route: SolutionDecisionV1['route']): SolutionDecisionV1 {
  const byRoute: Record<SolutionDecisionV1['route'], { solutionStatus: 'NO_PROPOSAL' | 'INSUFFICIENT_EVIDENCE' | 'ESCALATE'; reasonCode: SolutionDecisionV1['reasonCode'] }> = {
    SKIP: { solutionStatus: 'NO_PROPOSAL', reasonCode: 'NO_PROPOSAL' },
    DEFER: { solutionStatus: 'INSUFFICIENT_EVIDENCE', reasonCode: 'INSUFFICIENT_EVIDENCE' },
    ESCALATE_HUMAN: { solutionStatus: 'ESCALATE', reasonCode: 'EXPLICIT_ESCALATION' },
    DEFER_MORE_WORK_REQUESTED: { solutionStatus: 'INSUFFICIENT_EVIDENCE', reasonCode: 'INSUFFICIENT_EVIDENCE' },
    READY_FOR_CONFIG_EXECUTION: { solutionStatus: 'NO_PROPOSAL', reasonCode: 'NO_PROPOSAL' },
  };
  const selected = byRoute[route];
  if (route === 'READY_FOR_CONFIG_EXECUTION') throw new Error('fixture does not build READY decisions');
  return validateSolutionDecision({
    schemaVersion: 'solution-decision-v1',
    problemId: 'problem-fixture',
    route,
    reasonCode: selected.reasonCode,
    inputs: {
      solutionStatus: selected.solutionStatus,
      reviewerDecision: null,
      solutionScope: null,
      reviewScope: null,
      permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false },
      budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
}

const sourceAnalysis = {
  status: 'completed' as const,
  sourceRunRef: 'cohort-run-000001',
  sourceRoot: '/tmp/source',
  sourceExperimentRootHash: 'a'.repeat(64),
  sourceFingerprintSha256: 'b'.repeat(64),
  authoritativeFingerprintSha256: 'c'.repeat(64),
  observablePayloadRef: 'source/observable-payload.json' as const,
  externalFeedbackRef: 'feedback-runs/cohort-run-000001/feedback.json',
  improvementHypothesisRef: 'hypothesis-runs/cohort-run-000001/hypotheses.json',
  feedbackInvocationRef: 'feedback-000001',
  hypothesisInvocationRef: 'hypothesis-000001',
  hypotheses,
  noProblemAssessment: null,
  actualParticipantJobs: 2 as const,
};

export async function runSourceCandidatePoolTests(): Promise<void> {
  const pool = buildCandidatePoolV1({
    logicalSessionId: 'logical-session-000001',
    sourceEpochId: 'source-epoch-000001',
    sourceRunRef: sourceAnalysis.sourceRunRef,
    sourceFingerprintSha256: sourceAnalysis.sourceFingerprintSha256,
    sealedSourceRef: 'sources/cohort-run-000001',
    hypothesisSet: { artifactRef: sourceAnalysis.improvementHypothesisRef, hypotheses },
    baseline: { branch: 'dev', headSha: 'd'.repeat(40), workingTreeFingerprint: 'e'.repeat(64), participantBinding: 'CODEX_CURRENT' },
  });
  const order: string[] = [];
  const result = await runSourceCandidatePool({
    sourceAnalysis,
    pool,
    candidateLaneRunner: async ({ candidate }) => {
      order.push(candidate.hypothesisId);
      const route = candidate.hypothesisId === 'hypothesis-000001' ? 'SKIP' : candidate.hypothesisId === 'hypothesis-000002' ? 'DEFER' : 'ESCALATE_HUMAN';
      return {
        status: 'completed',
        candidateRef: candidate.candidateRef,
        hypothesisId: candidate.hypothesisId,
        sourceIndex: candidate.sourceIndex,
        candidateActivationPath: `candidates/${candidate.hypothesisId}/candidate-activation.json`,
        problemPackagePath: `candidates/${candidate.hypothesisId}/problem-package.json`,
        causalAttributionPath: `candidates/${candidate.hypothesisId}/diagnostic/causal-attribution.json`,
        decisionPath: `candidates/${candidate.hypothesisId}/decision.json`,
        baseDecisionPath: `candidates/${candidate.hypothesisId}/decision.json`,
        humanReviewPackagePath: `candidates/${candidate.hypothesisId}/human-review-package.md`,
        actualParticipantJobs: 1 as const,
        decision: decision(route),
        solutionInvocationRef: `${candidate.hypothesisId}-solution-000001`,
        reviewerInvocationRef: null,
        problemPackage: {} as never,
      };
    },
  });
  assert.deepEqual(order, ['hypothesis-000001', 'hypothesis-000002', 'hypothesis-000003']);
  assert.equal(result.pool.status, 'EXHAUSTED');
  assert.deepEqual(result.pool.candidates.map(candidate => candidate.processingState), ['COMPLETED', 'COMPLETED', 'COMPLETED']);
  assert.equal(result.participantJobs, 5);
  assert.equal('overallRoute' in result, false);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSourceCandidatePoolTests()
    .then(() => console.log('sourceCandidatePool.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
