import {
  validateSolutionDecision,
  type SolutionDecisionV1,
  type SolutionRoute,
  type SolutionDecisionReasonCode,
} from '../../../src/evolution/solutionDecisionContract';
import type { SolutionReviewDecision, ReviewScopeAssessment } from '../../../src/evolution/solutionReviewContract';
import type { SolutionChangeScope, SolutionWorkStatus } from '../../../src/evolution/solutionWorkContract';

export interface RouteSolutionDecisionInput {
  problemId: string;
  solutionStatus: SolutionWorkStatus;
  reviewerDecision: SolutionReviewDecision | null;
  solutionScope: SolutionChangeScope | null;
  reviewScope: ReviewScopeAssessment | null;
  permissions: SolutionDecisionV1['inputs']['permissions'];
  budget: SolutionDecisionV1['inputs']['budget'];
}

function routeForSolution(input: RouteSolutionDecisionInput): {
  route: SolutionRoute;
  reasonCode: SolutionDecisionReasonCode;
} | undefined {
  if (input.solutionStatus === 'NO_PROPOSAL') return { route: 'SKIP', reasonCode: 'NO_PROPOSAL' };
  if (input.solutionStatus === 'INSUFFICIENT_EVIDENCE') return { route: 'DEFER', reasonCode: 'INSUFFICIENT_EVIDENCE' };
  if (input.solutionStatus === 'ESCALATE') return { route: 'ESCALATE_HUMAN', reasonCode: 'EXPLICIT_ESCALATION' };
  return undefined;
}

function routeForReview(input: RouteSolutionDecisionInput): {
  route: SolutionRoute;
  reasonCode: SolutionDecisionReasonCode;
} {
  if (input.reviewerDecision === 'ACCEPT_OPTION') {
    if (input.solutionScope === 'configuration' && input.reviewScope === 'config_only') {
      return { route: 'READY_FOR_CONFIG_EXECUTION', reasonCode: 'ACCEPTED_CONFIGURATION_SCOPE' };
    }
    return { route: 'ESCALATE_HUMAN', reasonCode: 'ACCEPTED_OUT_OF_SCOPE' };
  }
  if (input.reviewerDecision === 'ACCEPT_NO_ACTION') return { route: 'SKIP', reasonCode: 'REVIEW_ACCEPT_NO_ACTION' };
  if (input.reviewerDecision === 'REJECT') return { route: 'SKIP', reasonCode: 'REVIEW_REJECTED' };
  if (input.reviewerDecision === 'REQUEST_MORE_WORK') return { route: 'DEFER_MORE_WORK_REQUESTED', reasonCode: 'REVIEW_REQUEST_MORE_WORK' };
  if (input.reviewerDecision === 'DEFER') return { route: 'DEFER', reasonCode: 'REVIEW_DEFERRED' };
  if (input.reviewerDecision === 'ESCALATE') return { route: 'ESCALATE_HUMAN', reasonCode: 'EXPLICIT_ESCALATION' };
  return { route: 'ESCALATE_HUMAN', reasonCode: 'PARTICIPANT_FAILURE' };
}

export function routeSolutionDecision(input: RouteSolutionDecisionInput): SolutionDecisionV1 {
  const routed = routeForSolution(input) ?? routeForReview(input);
  return validateSolutionDecision({
    schemaVersion: 'solution-decision-v1',
    problemId: input.problemId,
    route: routed.route,
    reasonCode: routed.reasonCode,
    inputs: {
      solutionStatus: input.solutionStatus,
      reviewerDecision: input.reviewerDecision,
      solutionScope: input.solutionScope,
      reviewScope: input.reviewScope,
      permissions: input.permissions,
      budget: input.budget,
    },
  });
}
