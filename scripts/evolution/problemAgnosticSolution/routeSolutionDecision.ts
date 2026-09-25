import {
  validateSolutionDecision,
  type SolutionDecisionV1,
  type SolutionRoute,
  type SolutionDecisionReasonCode,
} from '../../../src/evolution/solutionDecisionContract';
import type {
  ExecutionAuthorityAssessment,
  SolutionReviewDecision,
  ReviewScopeAssessment,
} from '../../../src/evolution/solutionReviewContract';
import type { SolutionChangeScope, SolutionWorkStatus } from '../../../src/evolution/solutionWorkContract';
import type { AutonomousAuthoringAdmissionStatus } from '../../../src/evolution/autonomousAuthoringAdmissionContract';

export interface RouteSolutionDecisionInput {
  problemId: string;
  solutionStatus: SolutionWorkStatus;
  reviewerDecision: SolutionReviewDecision | null;
  solutionScope: SolutionChangeScope | null;
  reviewScope: ReviewScopeAssessment | null;
  executionAuthorityAssessment: ExecutionAuthorityAssessment | null;
  autonomousAuthoringRequested?: boolean;
  autonomousAuthoringAdmissionStatus?: AutonomousAuthoringAdmissionStatus | null;
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
    if (input.autonomousAuthoringRequested) {
      if (input.executionAuthorityAssessment === 'HUMAN_AUTHORITY_REQUIRED') {
        return { route: 'ESCALATE_HUMAN', reasonCode: 'ACCEPTED_REQUIRES_HUMAN_AUTHORITY' };
      }
      if (input.executionAuthorityAssessment !== 'WITHIN_CURRENT_AUTHORITY') {
        return { route: 'ESCALATE_HUMAN', reasonCode: 'EXECUTION_AUTHORITY_UNCERTAIN' };
      }
      switch (input.autonomousAuthoringAdmissionStatus ?? null) {
        case 'ELIGIBLE':
          return { route: 'READY_FOR_SHADOW_AUTHORING', reasonCode: 'ACCEPTED_AUTONOMOUS_AUTHORING_SCOPE' };
        case 'INSUFFICIENT_EVIDENCE':
          return { route: 'DEFER', reasonCode: 'AUTONOMOUS_AUTHORING_INSUFFICIENT_EVIDENCE' };
        case 'CONTRACT_CHANGE_REQUIRED':
          return { route: 'ESCALATE_HUMAN', reasonCode: 'AUTONOMOUS_AUTHORING_CONTRACT_CHANGE_REQUIRED' };
        case 'EXECUTION_ENVELOPE_EXCEEDED':
          return { route: 'ESCALATE_HUMAN', reasonCode: 'AUTONOMOUS_AUTHORING_EXECUTION_ENVELOPE_EXCEEDED' };
        case 'AUTHORITY_STALE':
          return { route: 'ESCALATE_HUMAN', reasonCode: 'AUTONOMOUS_AUTHORING_AUTHORITY_STALE' };
        case 'NOT_APPLICABLE':
        case null:
          return { route: 'ESCALATE_HUMAN', reasonCode: 'ACCEPTED_OUT_OF_SCOPE' };
      }
    }
    if (input.solutionScope === 'configuration' && input.reviewScope === 'config_only') {
      if (input.executionAuthorityAssessment === 'WITHIN_CURRENT_AUTHORITY') {
        return { route: 'READY_FOR_CONFIG_EXECUTION', reasonCode: 'ACCEPTED_CONFIGURATION_SCOPE' };
      }
      if (input.executionAuthorityAssessment === 'HUMAN_AUTHORITY_REQUIRED') {
        return { route: 'ESCALATE_HUMAN', reasonCode: 'ACCEPTED_REQUIRES_HUMAN_AUTHORITY' };
      }
      return { route: 'ESCALATE_HUMAN', reasonCode: 'EXECUTION_AUTHORITY_UNCERTAIN' };
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
      executionAuthorityAssessment: input.executionAuthorityAssessment,
      ...(input.autonomousAuthoringRequested !== undefined
        ? { autonomousAuthoringRequested: input.autonomousAuthoringRequested }
        : {}),
      ...(input.autonomousAuthoringAdmissionStatus !== undefined || input.autonomousAuthoringRequested === true
        ? { autonomousAuthoringAdmissionStatus: input.autonomousAuthoringAdmissionStatus ?? null }
        : {}),
      permissions: input.permissions,
      budget: input.budget,
    },
  });
}
