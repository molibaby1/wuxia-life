import assert from 'node:assert/strict';
import {
  routeSolutionDecision,
  type RouteSolutionDecisionInput,
} from '../../scripts/evolution/problemAgnosticSolution/routeSolutionDecision';
import { validateSolutionDecision } from '../../src/evolution/solutionDecisionContract';

const base: RouteSolutionDecisionInput = {
  problemId: 'problem-000001',
  solutionStatus: 'OPTIONS',
  reviewerDecision: 'ACCEPT_OPTION',
  solutionScope: 'configuration',
  reviewScope: 'config_only',
  executionAuthorityAssessment: 'WITHIN_CURRENT_AUTHORITY',
  permissions: {
    authoritativeProductWrite: false,
    sandboxWrite: true,
    productExecution: false,
    codeExecution: false,
  },
  budget: { actualParticipantJobs: 4, maxParticipantJobs: 4, retryCount: 0 },
};

function route(input: Partial<RouteSolutionDecisionInput>) {
  return routeSolutionDecision({ ...base, ...input });
}

export function runSolutionDecisionRouterTests(): void {
  const humanAuthorityRequired = {
    ...base,
    executionAuthorityAssessment: 'HUMAN_AUTHORITY_REQUIRED',
  } as RouteSolutionDecisionInput;
  assert.equal(routeSolutionDecision(humanAuthorityRequired).route, 'ESCALATE_HUMAN');
  assert.equal(routeSolutionDecision(humanAuthorityRequired).reasonCode, 'ACCEPTED_REQUIRES_HUMAN_AUTHORITY');

  const authorityUncertain = {
    ...base,
    executionAuthorityAssessment: 'AUTHORITY_UNCERTAIN',
  } as RouteSolutionDecisionInput;
  assert.equal(routeSolutionDecision(authorityUncertain).route, 'ESCALATE_HUMAN');
  assert.equal(routeSolutionDecision(authorityUncertain).reasonCode, 'EXECUTION_AUTHORITY_UNCERTAIN');

  assert.equal(route({}).route, 'READY_FOR_CONFIG_EXECUTION');
  assert.equal(route({ solutionScope: 'program' }).route, 'ESCALATE_HUMAN');
  assert.equal(route({ solutionScope: 'configuration', reviewScope: 'mixed' }).route, 'ESCALATE_HUMAN');
  assert.equal(route({ solutionStatus: 'NO_PROPOSAL', reviewerDecision: null, solutionScope: null, reviewScope: null }).route, 'SKIP');
  assert.equal(route({ solutionStatus: 'INSUFFICIENT_EVIDENCE', reviewerDecision: null, solutionScope: null, reviewScope: null }).route, 'DEFER');
  assert.equal(route({ reviewerDecision: 'REJECT' }).route, 'SKIP');
  assert.equal(route({ reviewerDecision: 'REQUEST_MORE_WORK' }).route, 'DEFER_MORE_WORK_REQUESTED');
  assert.equal(route({ reviewerDecision: 'DEFER' }).route, 'DEFER');
  assert.equal(route({ reviewerDecision: 'ESCALATE' }).route, 'ESCALATE_HUMAN');
  assert.equal(route({ solutionStatus: 'ESCALATE', reviewerDecision: null, solutionScope: null, reviewScope: null }).route, 'ESCALATE_HUMAN');
  assert.equal(route({ reviewerDecision: 'ACCEPT_NO_ACTION' }).route, 'SKIP');

  const first = route({ problemId: 'problem-a', solutionText: 'different prose' } as Partial<RouteSolutionDecisionInput>);
  const second = route({ problemId: 'problem-b', solutionText: 'another domain-shaped prose' } as Partial<RouteSolutionDecisionInput>);
  assert.equal(first.route, second.route);
  assert.equal(first.reasonCode, second.reasonCode);

  const shadowEligible = route({
    solutionScope: 'program',
    reviewScope: 'code_required',
    autonomousAuthoringRequested: true,
    autonomousAuthoringAdmissionStatus: 'ELIGIBLE',
  } as unknown as Partial<RouteSolutionDecisionInput>);
  assert.equal(shadowEligible.route, 'READY_FOR_SHADOW_AUTHORING');
  assert.equal(shadowEligible.reasonCode, 'ACCEPTED_AUTONOMOUS_AUTHORING_SCOPE');
  assert.equal(shadowEligible.inputs.autonomousAuthoringRequested, true);
  assert.equal(shadowEligible.inputs.autonomousAuthoringAdmissionStatus, 'ELIGIBLE');
  assert.deepEqual(validateSolutionDecision(shadowEligible), shadowEligible);

  const admissionRoutes = [
    ['INSUFFICIENT_EVIDENCE', 'DEFER', 'AUTONOMOUS_AUTHORING_INSUFFICIENT_EVIDENCE'],
    ['CONTRACT_CHANGE_REQUIRED', 'ESCALATE_HUMAN', 'AUTONOMOUS_AUTHORING_CONTRACT_CHANGE_REQUIRED'],
    ['EXECUTION_ENVELOPE_EXCEEDED', 'ESCALATE_HUMAN', 'AUTONOMOUS_AUTHORING_EXECUTION_ENVELOPE_EXCEEDED'],
    ['AUTHORITY_STALE', 'ESCALATE_HUMAN', 'AUTONOMOUS_AUTHORING_AUTHORITY_STALE'],
  ] as const;
  for (const [status, expectedRoute, expectedReason] of admissionRoutes) {
    const decision = route({
      solutionScope: 'program',
      reviewScope: 'code_required',
      autonomousAuthoringRequested: true,
      autonomousAuthoringAdmissionStatus: status,
    } as unknown as Partial<RouteSolutionDecisionInput>);
    assert.equal(decision.route, expectedRoute);
    assert.equal(decision.reasonCode, expectedReason);
  }

  const notApplicable = route({
    solutionScope: 'program',
    reviewScope: 'code_required',
    autonomousAuthoringRequested: true,
    autonomousAuthoringAdmissionStatus: 'NOT_APPLICABLE',
  } as unknown as Partial<RouteSolutionDecisionInput>);
  assert.equal(notApplicable.route, 'ESCALATE_HUMAN');
  assert.equal(notApplicable.reasonCode, 'ACCEPTED_OUT_OF_SCOPE');

  const notApplicableConfiguration = route({
    autonomousAuthoringRequested: true,
    autonomousAuthoringAdmissionStatus: 'NOT_APPLICABLE',
  });
  assert.notEqual(notApplicableConfiguration.route, 'READY_FOR_CONFIG_EXECUTION');
  assert.equal(notApplicableConfiguration.route, 'ESCALATE_HUMAN');
  assert.equal(notApplicableConfiguration.reasonCode, 'ACCEPTED_OUT_OF_SCOPE');

  const missingAdmission = route({
    autonomousAuthoringRequested: true,
  } as unknown as Partial<RouteSolutionDecisionInput>);
  assert.notEqual(missingAdmission.route, 'READY_FOR_CONFIG_EXECUTION');
  assert.equal(missingAdmission.route, 'ESCALATE_HUMAN');

  const nullAdmission = route({
    autonomousAuthoringRequested: true,
    autonomousAuthoringAdmissionStatus: null,
  } as unknown as Partial<RouteSolutionDecisionInput>);
  assert.notEqual(nullAdmission.route, 'READY_FOR_CONFIG_EXECUTION');
  assert.equal(nullAdmission.route, 'ESCALATE_HUMAN');

  assert.throws(() => validateSolutionDecision({
    ...shadowEligible,
    inputs: { ...shadowEligible.inputs, autonomousAuthoringAdmissionStatus: null },
  }), /READY_FOR_SHADOW_AUTHORING.*requires/i);

  const ordinaryConfiguration = route({});
  assert.equal(ordinaryConfiguration.route, 'READY_FOR_CONFIG_EXECUTION');
  assert.equal(Object.hasOwn(ordinaryConfiguration.inputs, 'autonomousAuthoringRequested'), false);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSolutionDecisionRouterTests();
  console.log('solutionDecisionRouter.test.ts: ok');
}
