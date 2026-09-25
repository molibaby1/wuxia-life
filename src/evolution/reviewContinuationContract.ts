import type { SolutionRoute } from './solutionDecisionContract';

export interface ReviewContinuationRevisionRequestV1 {
  schemaVersion: 'review-continuation-revision-request-v1';
  continuationId: 'review-continuation-000001';
  continuationOrdinal: 1;
  round: 1 | 2;
  sourceRunRef: string;
  problemPackageRef: 'problem-package.json';
  problemPackageSha256: string;
  originalSolutionRef: 'solution-agent/result.json';
  originalSolutionSha256: string;
  originalReviewRef: 'reviewer-agent/review.json';
  originalReviewSha256: string;
  baseDecisionRef: 'decision.json';
  baseDecisionSha256: string;
  workspaceBaselineFingerprintSha256: string;
}

export interface ReviewContinuationV1 {
  schemaVersion: 'review-continuation-v1';
  continuationId: 'review-continuation-000001';
  continuationOrdinal: 1;
  round: 1 | 2;
  parentWorkflowRef: 'round-1' | 'round-2';
  sourceRunRef: string;
  startedAt: string;
  completedAt: string;
  baseDecisionRef: 'decision.json';
  baseDecisionSha256: string;
  revisionRequestRef: 'review-continuation-000001/revision-request.json';
  revisionRequestSha256: string;
  revisionStatus: 'OPTIONS' | 'NO_PROPOSAL' | 'INSUFFICIENT_EVIDENCE' | 'ESCALATE' | 'participant_failure';
  reReviewStatus: 'not_run' | 'ACCEPT_OPTION' | 'ACCEPT_NO_ACTION' | 'REJECT' | 'REQUEST_MORE_WORK' | 'DEFER' | 'ESCALATE' | 'participant_failure';
  continuationDecisionRef: 'review-continuation-000001/decision.json' | null;
  continuationDecisionSha256: string | null;
  participantJobCount: 1 | 2;
  terminalStatus: 'completed' | 'participant_failure';
  terminalRoute: SolutionRoute | 'PARTICIPANT_FAILURE';
}

const REVISION_STATUSES: readonly ReviewContinuationV1['revisionStatus'][] = [
  'OPTIONS',
  'NO_PROPOSAL',
  'INSUFFICIENT_EVIDENCE',
  'ESCALATE',
  'participant_failure',
];
const RE_REVIEW_STATUSES: readonly ReviewContinuationV1['reReviewStatus'][] = [
  'not_run',
  'ACCEPT_OPTION',
  'ACCEPT_NO_ACTION',
  'REJECT',
  'REQUEST_MORE_WORK',
  'DEFER',
  'ESCALATE',
  'participant_failure',
];
const SOLUTION_ROUTES: readonly SolutionRoute[] = [
  'READY_FOR_CONFIG_EXECUTION',
  'READY_FOR_SHADOW_AUTHORING',
  'SKIP',
  'DEFER',
  'DEFER_MORE_WORK_REQUESTED',
  'ESCALATE_HUMAN',
];
const REVISION_REQUEST_KEYS = [
  'schemaVersion',
  'continuationId',
  'continuationOrdinal',
  'round',
  'sourceRunRef',
  'problemPackageRef',
  'problemPackageSha256',
  'originalSolutionRef',
  'originalSolutionSha256',
  'originalReviewRef',
  'originalReviewSha256',
  'baseDecisionRef',
  'baseDecisionSha256',
  'workspaceBaselineFingerprintSha256',
] as const;
const CONTINUATION_KEYS = [
  'schemaVersion',
  'continuationId',
  'continuationOrdinal',
  'round',
  'parentWorkflowRef',
  'sourceRunRef',
  'startedAt',
  'completedAt',
  'baseDecisionRef',
  'baseDecisionSha256',
  'revisionRequestRef',
  'revisionRequestSha256',
  'revisionStatus',
  'reReviewStatus',
  'continuationDecisionRef',
  'continuationDecisionSha256',
  'participantJobCount',
  'terminalStatus',
  'terminalRoute',
] as const;
type RecordValue = Record<string, unknown>;

function assertObject(value: unknown, label: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
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
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value;
}

function sha256(value: unknown, path: string): string {
  const result = nonEmptyString(value, path);
  if (!/^[a-f0-9]{64}$/.test(result)) throw new Error(`${path} must be a SHA-256 hex string`);
  return result;
}

function isoTimestamp(value: unknown, path: string): string {
  const result = nonEmptyString(value, path);
  try {
    if (new Date(result).toISOString() !== result) throw new Error('not canonical');
  } catch {
    throw new Error(`${path} must be a canonical ISO timestamp`);
  }
  return result;
}

function enumValue<T extends string>(value: unknown, values: readonly T[], path: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new Error(`${path} has invalid value: ${String(value)}`);
  }
  return value as T;
}

function fixedValue<T extends string>(value: unknown, expected: T, path: string): T {
  if (value !== expected) throw new Error(`${path} must be ${expected}`);
  return expected;
}

function nullableSha256(value: unknown, path: string): string | null {
  return value === null ? null : sha256(value, path);
}

export function validateReviewContinuationRevisionRequest(value: unknown): ReviewContinuationRevisionRequestV1 {
  assertObject(value, 'review continuation revision request');
  assertExactKeys(value, REVISION_REQUEST_KEYS, 'review continuation revision request');
  if (value.schemaVersion !== 'review-continuation-revision-request-v1') {
    throw new Error('review continuation revision request schemaVersion must be review-continuation-revision-request-v1');
  }
  fixedValue(value.continuationId, 'review-continuation-000001', 'review continuation revision request.continuationId');
  if (value.continuationOrdinal !== 1) {
    throw new Error('review continuation revision request.continuationOrdinal must be 1');
  }
  if (value.round !== 1 && value.round !== 2) {
    throw new Error('review continuation revision request.round must be 1 or 2');
  }
  fixedValue(value.problemPackageRef, 'problem-package.json', 'review continuation revision request.problemPackageRef');
  fixedValue(value.originalSolutionRef, 'solution-agent/result.json', 'review continuation revision request.originalSolutionRef');
  fixedValue(value.originalReviewRef, 'reviewer-agent/review.json', 'review continuation revision request.originalReviewRef');
  fixedValue(value.baseDecisionRef, 'decision.json', 'review continuation revision request.baseDecisionRef');
  return {
    schemaVersion: 'review-continuation-revision-request-v1',
    continuationId: 'review-continuation-000001',
    continuationOrdinal: 1,
    round: value.round,
    sourceRunRef: nonEmptyString(value.sourceRunRef, 'review continuation revision request.sourceRunRef'),
    problemPackageRef: 'problem-package.json',
    problemPackageSha256: sha256(value.problemPackageSha256, 'review continuation revision request.problemPackageSha256'),
    originalSolutionRef: 'solution-agent/result.json',
    originalSolutionSha256: sha256(value.originalSolutionSha256, 'review continuation revision request.originalSolutionSha256'),
    originalReviewRef: 'reviewer-agent/review.json',
    originalReviewSha256: sha256(value.originalReviewSha256, 'review continuation revision request.originalReviewSha256'),
    baseDecisionRef: 'decision.json',
    baseDecisionSha256: sha256(value.baseDecisionSha256, 'review continuation revision request.baseDecisionSha256'),
    workspaceBaselineFingerprintSha256: sha256(value.workspaceBaselineFingerprintSha256, 'review continuation revision request.workspaceBaselineFingerprintSha256'),
  };
}

export function parseReviewContinuationRevisionRequest(raw: string): ReviewContinuationRevisionRequestV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('review continuation revision request must be valid JSON');
  }
  return validateReviewContinuationRevisionRequest(parsed);
}

export function validateReviewContinuation(value: unknown): ReviewContinuationV1 {
  assertObject(value, 'review continuation');
  assertExactKeys(value, CONTINUATION_KEYS, 'review continuation');
  if (value.schemaVersion !== 'review-continuation-v1') {
    throw new Error('review continuation schemaVersion must be review-continuation-v1');
  }
  fixedValue(value.continuationId, 'review-continuation-000001', 'review continuation.continuationId');
  if (value.continuationOrdinal !== 1) throw new Error('review continuation.continuationOrdinal must be 1');
  if (value.round !== 1 && value.round !== 2) throw new Error('review continuation.round must be 1 or 2');
  const parentWorkflowRef = enumValue(value.parentWorkflowRef, ['round-1', 'round-2'] as const, 'review continuation.parentWorkflowRef');
  if (parentWorkflowRef !== `round-${value.round}`) {
    throw new Error('review continuation.parentWorkflowRef must match round');
  }
  fixedValue(value.baseDecisionRef, 'decision.json', 'review continuation.baseDecisionRef');
  fixedValue(value.revisionRequestRef, 'review-continuation-000001/revision-request.json', 'review continuation.revisionRequestRef');
  const revisionStatus = enumValue(value.revisionStatus, REVISION_STATUSES, 'review continuation.revisionStatus');
  const reReviewStatus = enumValue(value.reReviewStatus, RE_REVIEW_STATUSES, 'review continuation.reReviewStatus');
  const terminalStatus = enumValue(value.terminalStatus, ['completed', 'participant_failure'] as const, 'review continuation.terminalStatus');
  if (value.participantJobCount !== 1 && value.participantJobCount !== 2) {
    throw new Error('review continuation.participantJobCount must be 1 or 2');
  }
  if (reReviewStatus !== 'not_run' && value.participantJobCount !== 2) {
    throw new Error('reReviewStatus requires participantJobCount 2');
  }
  if (revisionStatus === 'OPTIONS' && reReviewStatus === 'not_run') {
    throw new Error('reReviewStatus not_run is invalid for an OPTIONS revision');
  }
  if (revisionStatus !== 'OPTIONS' && reReviewStatus !== 'not_run') {
    throw new Error('reReviewStatus must be not_run when revision does not return OPTIONS');
  }
  if (reReviewStatus === 'not_run' && value.participantJobCount !== 1) {
    throw new Error('reReviewStatus not_run requires participantJobCount 1');
  }

  const continuationDecisionRef = value.continuationDecisionRef === null
    ? null
    : fixedValue(value.continuationDecisionRef, 'review-continuation-000001/decision.json', 'review continuation.continuationDecisionRef');
  const continuationDecisionSha256 = nullableSha256(value.continuationDecisionSha256, 'review continuation.continuationDecisionSha256');
  const participantFailure = revisionStatus === 'participant_failure' || reReviewStatus === 'participant_failure';
  if (terminalStatus === 'completed') {
    if (participantFailure || continuationDecisionRef === null || continuationDecisionSha256 === null) {
      throw new Error('completed continuation requires continuation decision reference and hash');
    }
    if (typeof value.terminalRoute !== 'string' || !SOLUTION_ROUTES.includes(value.terminalRoute as SolutionRoute)) {
      throw new Error('completed continuation terminalRoute must be a SolutionRoute');
    }
  } else {
    if (!participantFailure || continuationDecisionRef !== null || continuationDecisionSha256 !== null) {
      throw new Error('participant_failure continuation requires null decision reference and hash');
    }
    if (value.terminalRoute !== 'PARTICIPANT_FAILURE') {
      throw new Error('participant_failure continuation terminalRoute must be PARTICIPANT_FAILURE');
    }
  }

  return {
    schemaVersion: 'review-continuation-v1',
    continuationId: 'review-continuation-000001',
    continuationOrdinal: 1,
    round: value.round,
    parentWorkflowRef,
    sourceRunRef: nonEmptyString(value.sourceRunRef, 'review continuation.sourceRunRef'),
    startedAt: isoTimestamp(value.startedAt, 'review continuation.startedAt'),
    completedAt: isoTimestamp(value.completedAt, 'review continuation.completedAt'),
    baseDecisionRef: 'decision.json',
    baseDecisionSha256: sha256(value.baseDecisionSha256, 'review continuation.baseDecisionSha256'),
    revisionRequestRef: 'review-continuation-000001/revision-request.json',
    revisionRequestSha256: sha256(value.revisionRequestSha256, 'review continuation.revisionRequestSha256'),
    revisionStatus,
    reReviewStatus,
    continuationDecisionRef,
    continuationDecisionSha256,
    participantJobCount: value.participantJobCount,
    terminalStatus,
    terminalRoute: value.terminalRoute as ReviewContinuationV1['terminalRoute'],
  };
}

export function parseReviewContinuation(raw: string): ReviewContinuationV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('review continuation must be valid JSON');
  }
  return validateReviewContinuation(parsed);
}
