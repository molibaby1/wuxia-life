import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  buildWorkflowContinuationAudit,
  type WorkflowContinuationAuditV1,
} from '../../scripts/evolution/reporting/buildWorkflowContinuationAudit';

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const hash = 'a'.repeat(64);

const baseSolution = {
  schemaVersion: 'solution-work-v1',
  status: 'OPTIONS',
  problemId: 'problem-hypothesis-000001',
  options: [{
    optionId: 'option-000001',
    proposedChange: 'base option',
    rationale: 'base rationale',
    repoRefs: ['src/example.ts'],
    artifactRefs: ['source/observable-payload.json'],
    changeScope: 'configuration',
    expectedPlayerObservableDifference: 'base difference',
    risks: ['base risk'],
    unknowns: ['base unknown'],
  }],
  recommendedOptionId: 'option-000001',
  summary: 'Base solution summary',
  repoRefs: ['src/example.ts'],
  artifactRefs: ['source/observable-payload.json'],
};

const baseReview = {
  schemaVersion: 'solution-review-v1',
  problemId: 'problem-hypothesis-000001',
  decision: 'REQUEST_MORE_WORK',
  acceptedOptionId: null,
  scopeAssessment: null,
  assessment: 'Base review assessment',
  repoRefs: ['src/example.ts'],
  artifactRefs: ['source/observable-payload.json'],
  concerns: ['Base reviewer concern'],
};

const revisionRequest = {
  schemaVersion: 'review-continuation-revision-request-v1',
  continuationId: 'review-continuation-000001',
  continuationOrdinal: 1,
  round: 1,
  sourceRunRef: 'ordinary-run-20260913-000001',
  problemPackageRef: 'problem-package.json',
  problemPackageSha256: hash,
  originalSolutionRef: 'solution-agent/result.json',
  originalSolutionSha256: hash,
  originalReviewRef: 'reviewer-agent/review.json',
  originalReviewSha256: hash,
  baseDecisionRef: 'decision.json',
  baseDecisionSha256: hash,
  workspaceBaselineFingerprintSha256: hash,
};

function continuation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 'review-continuation-v1',
    continuationId: 'review-continuation-000001',
    continuationOrdinal: 1,
    round: 1,
    parentWorkflowRef: 'round-1',
    sourceRunRef: 'ordinary-run-20260913-000001',
    startedAt: '2026-09-13T00:00:00.000Z',
    completedAt: '2026-09-13T00:01:00.000Z',
    baseDecisionRef: 'decision.json',
    baseDecisionSha256: hash,
    revisionRequestRef: 'review-continuation-000001/revision-request.json',
    revisionRequestSha256: hash,
    revisionStatus: 'OPTIONS',
    reReviewStatus: 'REQUEST_MORE_WORK',
    continuationDecisionRef: 'review-continuation-000001/decision.json',
    continuationDecisionSha256: hash,
    participantJobCount: 2,
    terminalStatus: 'completed',
    terminalRoute: 'DEFER_MORE_WORK_REQUESTED',
    ...overrides,
  };
}

async function createWorkflowRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'workflow-continuation-audit-'));
  await writeJson(join(root, 'solution-agent/result.json'), baseSolution);
  await writeJson(join(root, 'reviewer-agent/review.json'), baseReview);
  await writeJson(join(root, 'decision.json'), {
    schemaVersion: 'solution-decision-v1',
    problemId: 'problem-hypothesis-000001',
    route: 'DEFER_MORE_WORK_REQUESTED',
    reasonCode: 'REVIEW_REQUEST_MORE_WORK',
    inputs: {
      solutionStatus: 'OPTIONS',
      reviewerDecision: 'REQUEST_MORE_WORK',
      solutionScope: 'configuration',
      reviewScope: null,
      permissions: {
        authoritativeProductWrite: false,
        codeExecution: false,
        productExecution: false,
        sandboxWrite: true,
      },
      budget: { actualParticipantJobs: 4, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
  return root;
}

async function writeCompletedContinuation(root: string): Promise<void> {
  await writeJson(join(root, 'review-continuation-000001/revision-request.json'), revisionRequest);
  await writeJson(join(root, 'review-continuation-000001/solution-revision/result.json'), {
    ...baseSolution,
    summary: 'Revised solution summary',
    options: [{ ...baseSolution.options[0], proposedChange: 'revised option' }],
  });
  await writeJson(join(root, 'review-continuation-000001/reviewer-agent/review.json'), {
    ...baseReview,
    assessment: 'Fresh re-review assessment',
    concerns: ['Fresh re-review concern'],
  });
  await writeJson(join(root, 'review-continuation-000001/decision.json'), {
    schemaVersion: 'solution-decision-v1',
    problemId: 'problem-hypothesis-000001',
    route: 'DEFER_MORE_WORK_REQUESTED',
    reasonCode: 'REVIEW_REQUEST_MORE_WORK',
    inputs: {
      solutionStatus: 'OPTIONS',
      reviewerDecision: 'REQUEST_MORE_WORK',
      solutionScope: null,
      reviewScope: null,
      permissions: baseSolution.options[0] ? {
        authoritativeProductWrite: false,
        codeExecution: false,
        productExecution: false,
        sandboxWrite: true,
      } : null,
      budget: { actualParticipantJobs: 2, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
  await writeJson(join(root, 'review-continuation-000001/continuation.json'), continuation());
}

async function testNoContinuation(): Promise<void> {
  const root = await createWorkflowRoot();
  assert.equal(await buildWorkflowContinuationAudit({ workflowRoot: root }), null);
}

async function testHistoricalCompletedContinuation(): Promise<void> {
  const root = join(
    process.cwd(),
    'tests/fixtures/evolution/review-continuation/ordinary-run-20260913-000001/problem-agnostic-agent-solution-loop-instance-000001/round-1',
  );
  const audit = await buildWorkflowContinuationAudit({ workflowRoot: root });
  assert.ok(audit);
  assert.equal(audit.continuationRef, 'review-continuation-000001');
  assert.equal(audit.revisionRequest.status, 'completed');
  assert.equal(audit.revisedSolution.status, 'completed');
  assert.equal(audit.revisedSolution.summary, 'Revised configuration solution summary');
  assert.equal(audit.reReview.status, 'completed');
  assert.equal(audit.reReview.decision, 'REQUEST_MORE_WORK');
  assert.equal(audit.continuationDecision.route, 'DEFER_MORE_WORK_REQUESTED');
}

async function testRevisionTerminatesWithoutReReview(): Promise<void> {
  const root = await createWorkflowRoot();
  const { recommendedOptionId: _recommendedOptionId, ...solutionWithoutRecommendedOptionId } = baseSolution;
  await writeJson(join(root, 'review-continuation-000001/revision-request.json'), revisionRequest);
  await writeJson(join(root, 'review-continuation-000001/solution-revision/result.json'), {
    ...solutionWithoutRecommendedOptionId,
    status: 'ESCALATE',
    options: [],
    summary: 'Revised solution escalates to Human',
  });
  await writeJson(join(root, 'review-continuation-000001/decision.json'), {
    schemaVersion: 'solution-decision-v1',
    problemId: 'problem-hypothesis-000001',
    route: 'ESCALATE_HUMAN',
    reasonCode: 'EXPLICIT_ESCALATION',
    inputs: {
      solutionStatus: 'ESCALATE',
      reviewerDecision: null,
      solutionScope: null,
      reviewScope: null,
      permissions: {
        authoritativeProductWrite: false,
        codeExecution: false,
        productExecution: false,
        sandboxWrite: true,
      },
      budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
  await writeJson(join(root, 'review-continuation-000001/continuation.json'), continuation({
    revisionStatus: 'ESCALATE',
    reReviewStatus: 'not_run',
    continuationDecisionSha256: hash,
    participantJobCount: 1,
    terminalRoute: 'ESCALATE_HUMAN',
  }));
  const audit = await buildWorkflowContinuationAudit({ workflowRoot: root });
  assert.ok(audit);
  assert.equal(audit.revisedSolution.status, 'completed');
  assert.equal(audit.reReview.status, 'not_run');
  assert.equal(audit.reReview.decision, null);
  assert.equal(audit.continuationDecision.route, 'ESCALATE_HUMAN');
}

async function testShadowAuthoringRouteProjection(): Promise<void> {
  const root = await createWorkflowRoot();
  await writeCompletedContinuation(root);
  await writeJson(join(root, 'review-continuation-000001/decision.json'), {
    schemaVersion: 'solution-decision-v1',
    problemId: 'problem-hypothesis-000001',
    route: 'READY_FOR_SHADOW_AUTHORING',
    reasonCode: 'ACCEPTED_AUTONOMOUS_AUTHORING_SCOPE',
    inputs: {
      solutionStatus: 'OPTIONS',
      reviewerDecision: 'ACCEPT_OPTION',
      solutionScope: 'program',
      reviewScope: 'code_required',
      executionAuthorityAssessment: 'WITHIN_CURRENT_AUTHORITY',
      autonomousAuthoringRequested: true,
      autonomousAuthoringAdmissionStatus: 'ELIGIBLE',
      permissions: {
        authoritativeProductWrite: false,
        codeExecution: false,
        productExecution: false,
        sandboxWrite: true,
      },
      budget: { actualParticipantJobs: 4, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
  await writeJson(join(root, 'review-continuation-000001/continuation.json'), continuation({
    reReviewStatus: 'ACCEPT_OPTION',
    terminalRoute: 'READY_FOR_SHADOW_AUTHORING',
  }));
  const audit = await buildWorkflowContinuationAudit({ workflowRoot: root });
  assert.ok(audit);
  assert.equal(audit.continuationDecision.route, 'READY_FOR_SHADOW_AUTHORING');
  assert.equal(audit.continuationDecision.reasonCode, 'ACCEPTED_AUTONOMOUS_AUTHORING_SCOPE');
}

async function testContinuationParticipantFailure(): Promise<void> {
  const root = await createWorkflowRoot();
  await writeJson(join(root, 'review-continuation-000001/revision-request.json'), revisionRequest);
  await writeJson(join(root, 'review-continuation-000001/solution-revision/failure.json'), {
    schemaVersion: 'solution-agent-failure-v1',
    errorKind: 'process',
    message: 'participant failed',
  });
  await writeJson(join(root, 'review-continuation-000001/continuation.json'), continuation({
    revisionStatus: 'participant_failure',
    reReviewStatus: 'not_run',
    continuationDecisionRef: null,
    continuationDecisionSha256: null,
    participantJobCount: 1,
    terminalStatus: 'participant_failure',
    terminalRoute: 'PARTICIPANT_FAILURE',
  }));
  const audit = await buildWorkflowContinuationAudit({ workflowRoot: root });
  assert.ok(audit);
  assert.equal(audit.revisedSolution.status, 'participant_failure');
  assert.equal(audit.revisedSolution.solutionStatus, null);
  assert.equal(audit.reReview.status, 'not_run');
  assert.equal(audit.reReview.decision, null);
  assert.equal(audit.continuationDecision.status, 'participant_failure');
  assert.equal(audit.continuationDecision.route, null);

  const reviewerFailureRoot = await createWorkflowRoot();
  await writeJson(join(reviewerFailureRoot, 'review-continuation-000001/revision-request.json'), revisionRequest);
  await writeJson(join(reviewerFailureRoot, 'review-continuation-000001/solution-revision/result.json'), baseSolution);
  await writeJson(join(reviewerFailureRoot, 'review-continuation-000001/reviewer-agent/failure.json'), {
    schemaVersion: 'solution-reviewer-failure-v1',
    errorKind: 'process',
    message: 'reviewer failed',
  });
  await writeJson(join(reviewerFailureRoot, 'review-continuation-000001/continuation.json'), continuation({
    reReviewStatus: 'participant_failure',
    continuationDecisionRef: null,
    continuationDecisionSha256: null,
    terminalStatus: 'participant_failure',
    terminalRoute: 'PARTICIPANT_FAILURE',
  }));
  const reviewerFailureAudit = await buildWorkflowContinuationAudit({ workflowRoot: reviewerFailureRoot });
  assert.ok(reviewerFailureAudit);
  assert.equal(reviewerFailureAudit.revisedSolution.status, 'completed');
  assert.equal(reviewerFailureAudit.reReview.status, 'participant_failure');
  assert.equal(reviewerFailureAudit.reReview.decision, null);
}

export async function runWorkflowContinuationAuditTests(): Promise<void> {
  await testNoContinuation();
  await testHistoricalCompletedContinuation();
  await testRevisionTerminatesWithoutReReview();
  await testShadowAuthoringRouteProjection();
  await testContinuationParticipantFailure();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWorkflowContinuationAuditTests()
    .then(() => console.log('workflowContinuationAudit.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
