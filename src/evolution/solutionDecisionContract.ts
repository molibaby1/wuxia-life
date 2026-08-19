import type { SolutionReviewDecision, ReviewScopeAssessment } from './solutionReviewContract';
import type { SolutionChangeScope, SolutionWorkStatus } from './solutionWorkContract';

export type SolutionRoute =
  | 'READY_FOR_CONFIG_EXECUTION'
  | 'SKIP'
  | 'DEFER'
  | 'DEFER_MORE_WORK_REQUESTED'
  | 'ESCALATE_HUMAN';

export type SolutionDecisionReasonCode =
  | 'ACCEPTED_CONFIGURATION_SCOPE'
  | 'ACCEPTED_OUT_OF_SCOPE'
  | 'NO_PROBLEM_FORMED'
  | 'NO_PROPOSAL'
  | 'INSUFFICIENT_EVIDENCE'
  | 'REVIEW_REJECTED'
  | 'REVIEW_ACCEPT_NO_ACTION'
  | 'REVIEW_REQUEST_MORE_WORK'
  | 'REVIEW_DEFERRED'
  | 'EXPLICIT_ESCALATION'
  | 'PARTICIPANT_FAILURE';

export interface SolutionDecisionV1 {
  schemaVersion: 'solution-decision-v1';
  problemId: string;
  route: SolutionRoute;
  reasonCode: SolutionDecisionReasonCode;
  inputs: {
    solutionStatus: SolutionWorkStatus;
    reviewerDecision: SolutionReviewDecision | null;
    solutionScope: SolutionChangeScope | null;
    reviewScope: ReviewScopeAssessment | null;
    permissions: {
      authoritativeProductWrite: false;
      sandboxWrite: true;
      productExecution: false;
      codeExecution: false;
    };
    budget: {
      actualParticipantJobs: number;
      maxParticipantJobs: 4;
      retryCount: 0;
    };
  };
}

const ROOT_KEYS = ['schemaVersion', 'problemId', 'route', 'reasonCode', 'inputs'] as const;
const INPUT_KEYS = ['solutionStatus', 'reviewerDecision', 'solutionScope', 'reviewScope', 'permissions', 'budget'] as const;
const PERMISSION_KEYS = ['authoritativeProductWrite', 'sandboxWrite', 'productExecution', 'codeExecution'] as const;
const BUDGET_KEYS = ['actualParticipantJobs', 'maxParticipantJobs', 'retryCount'] as const;
const ROUTES: readonly SolutionRoute[] = [
  'READY_FOR_CONFIG_EXECUTION',
  'SKIP',
  'DEFER',
  'DEFER_MORE_WORK_REQUESTED',
  'ESCALATE_HUMAN',
];
const REASONS: readonly SolutionDecisionReasonCode[] = [
  'ACCEPTED_CONFIGURATION_SCOPE',
  'ACCEPTED_OUT_OF_SCOPE',
  'NO_PROBLEM_FORMED',
  'NO_PROPOSAL',
  'INSUFFICIENT_EVIDENCE',
  'REVIEW_REJECTED',
  'REVIEW_ACCEPT_NO_ACTION',
  'REVIEW_REQUEST_MORE_WORK',
  'REVIEW_DEFERRED',
  'EXPLICIT_ESCALATION',
  'PARTICIPANT_FAILURE',
];
const SOLUTION_STATUSES: readonly SolutionWorkStatus[] = ['OPTIONS', 'NO_PROPOSAL', 'INSUFFICIENT_EVIDENCE', 'ESCALATE'];
const REVIEW_DECISIONS: readonly (SolutionReviewDecision | null)[] = [
  null,
  'ACCEPT_OPTION',
  'ACCEPT_NO_ACTION',
  'REJECT',
  'REQUEST_MORE_WORK',
  'DEFER',
  'ESCALATE',
];
const SOLUTION_SCOPES: readonly (SolutionChangeScope | null)[] = [null, 'configuration', 'program', 'mixed', 'uncertain'];
const REVIEW_SCOPES: readonly (ReviewScopeAssessment | null)[] = [null, 'config_only', 'code_required', 'mixed', 'uncertain'];
type RecordValue = Record<string, unknown>;

function assertObject(value: unknown, label: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function assertExactKeys(value: RecordValue, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
  }
  for (const key of allowed) {
    if (!(key in value)) throw new Error(`${label} is missing field: ${key}`);
  }
}

function nonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${path} must be a non-empty string`);
  return value;
}

function enumValue<T extends string>(value: unknown, values: readonly T[], path: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) throw new Error(`${path} has invalid value: ${String(value)}`);
  return value as T;
}

function nullableEnumValue<T extends string>(value: unknown, values: readonly (T | null)[], path: string): T | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !values.includes(value as T)) throw new Error(`${path} has invalid value: ${String(value)}`);
  return value as T;
}

function fixedBoolean<T extends boolean>(value: unknown, expected: T, path: string): T {
  if (value !== expected) throw new Error(`${path} must be ${String(expected)}`);
  return expected;
}

function assertReasonRoute(reasonCode: SolutionDecisionReasonCode, route: SolutionRoute): void {
  const expectedRoutes: Record<SolutionDecisionReasonCode, SolutionRoute> = {
    ACCEPTED_CONFIGURATION_SCOPE: 'READY_FOR_CONFIG_EXECUTION',
    ACCEPTED_OUT_OF_SCOPE: 'ESCALATE_HUMAN',
    NO_PROBLEM_FORMED: 'SKIP',
    NO_PROPOSAL: 'SKIP',
    INSUFFICIENT_EVIDENCE: 'DEFER',
    REVIEW_REJECTED: 'SKIP',
    REVIEW_ACCEPT_NO_ACTION: 'SKIP',
    REVIEW_REQUEST_MORE_WORK: 'DEFER_MORE_WORK_REQUESTED',
    REVIEW_DEFERRED: 'DEFER',
    EXPLICIT_ESCALATION: 'ESCALATE_HUMAN',
    PARTICIPANT_FAILURE: 'ESCALATE_HUMAN',
  };
  if (expectedRoutes[reasonCode] !== route) {
    throw new Error(`solution decision route ${route} does not match reasonCode ${reasonCode}`);
  }
}

export function validateSolutionDecision(value: unknown): SolutionDecisionV1 {
  assertObject(value, 'solution decision');
  assertExactKeys(value, ROOT_KEYS, 'solution decision');
  if (value.schemaVersion !== 'solution-decision-v1') throw new Error('solution decision schemaVersion must be solution-decision-v1');
  const route = enumValue(value.route, ROUTES, 'solution decision.route');
  const reasonCode = enumValue(value.reasonCode, REASONS, 'solution decision.reasonCode');
  assertReasonRoute(reasonCode, route);
  assertObject(value.inputs, 'solution decision.inputs');
  assertExactKeys(value.inputs, INPUT_KEYS, 'solution decision.inputs');
  const solutionStatus = enumValue(value.inputs.solutionStatus, SOLUTION_STATUSES, 'solution decision.inputs.solutionStatus');
  const reviewerDecision = nullableEnumValue(value.inputs.reviewerDecision, REVIEW_DECISIONS, 'solution decision.inputs.reviewerDecision');
  const solutionScope = nullableEnumValue(value.inputs.solutionScope, SOLUTION_SCOPES, 'solution decision.inputs.solutionScope');
  const reviewScope = nullableEnumValue(value.inputs.reviewScope, REVIEW_SCOPES, 'solution decision.inputs.reviewScope');

  assertObject(value.inputs.permissions, 'solution decision.inputs.permissions');
  assertExactKeys(value.inputs.permissions, PERMISSION_KEYS, 'solution decision.inputs.permissions');
  const permissions = {
    authoritativeProductWrite: fixedBoolean(value.inputs.permissions.authoritativeProductWrite, false, 'solution decision.inputs.permissions.authoritativeProductWrite'),
    sandboxWrite: fixedBoolean(value.inputs.permissions.sandboxWrite, true, 'solution decision.inputs.permissions.sandboxWrite'),
    productExecution: fixedBoolean(value.inputs.permissions.productExecution, false, 'solution decision.inputs.permissions.productExecution'),
    codeExecution: fixedBoolean(value.inputs.permissions.codeExecution, false, 'solution decision.inputs.permissions.codeExecution'),
  } as const;

  assertObject(value.inputs.budget, 'solution decision.inputs.budget');
  assertExactKeys(value.inputs.budget, BUDGET_KEYS, 'solution decision.inputs.budget');
  const actualParticipantJobs = value.inputs.budget.actualParticipantJobs;
  if (typeof actualParticipantJobs !== 'number' || !Number.isInteger(actualParticipantJobs) || actualParticipantJobs < 0 || actualParticipantJobs > 4) {
    throw new Error('solution decision.inputs.budget.actualParticipantJobs must be an integer from 0 to 4');
  }
  if (value.inputs.budget.maxParticipantJobs !== 4) throw new Error('solution decision.inputs.budget.maxParticipantJobs must be 4');
  if (value.inputs.budget.retryCount !== 0) throw new Error('solution decision.inputs.budget.retryCount must be 0');
  const budget = {
    actualParticipantJobs,
    maxParticipantJobs: 4 as const,
    retryCount: 0 as const,
  };

  if (route === 'READY_FOR_CONFIG_EXECUTION' && (
    solutionStatus !== 'OPTIONS'
    || reviewerDecision !== 'ACCEPT_OPTION'
    || solutionScope !== 'configuration'
    || reviewScope !== 'config_only'
  )) {
    throw new Error('READY_FOR_CONFIG_EXECUTION requires accepted configuration-only scopes');
  }

  return {
    schemaVersion: 'solution-decision-v1',
    problemId: nonEmptyString(value.problemId, 'solution decision.problemId'),
    route,
    reasonCode,
    inputs: {
      solutionStatus,
      reviewerDecision,
      solutionScope,
      reviewScope,
      permissions,
      budget,
    },
  };
}

export function parseSolutionDecision(raw: string): SolutionDecisionV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('solution decision must be valid JSON');
  }
  return validateSolutionDecision(parsed);
}
