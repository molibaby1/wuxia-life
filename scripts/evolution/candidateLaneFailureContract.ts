import type {
  ParticipantFailureFacts,
  ParticipantFailureOrigin,
  ParticipantFailureReason,
} from './problemAgnosticSolution/participantFailureClassification';
import { VALID_REASON_BY_ORIGIN } from './problemAgnosticSolution/participantFailureClassification';

export type CandidateLaneFailureStage =
  | 'SOLUTION'
  | 'REVIEWER'
  | 'SOLUTION_REVISION'
  | 'RE_REVIEWER';

export type CandidateLaneFailureContainment =
  | 'CANDIDATE_LOCAL'
  | 'SESSION_FAIL_CLOSED';

export interface CandidateLaneFailureV2 {
  schemaVersion: 'candidate-lane-failure-v2';
  candidateRef: string;
  hypothesisId: string;
  sourceIndex: number;
  stage: CandidateLaneFailureStage;
  actualParticipantJobs: 1 | 2;
  retryCount: 0;
  failureOrigin: ParticipantFailureOrigin;
  failureReason: ParticipantFailureReason;
  containment: CandidateLaneFailureContainment;
  participantErrorKind: string | null;
  message: string;
}

const SCHEMA_VERSION = 'candidate-lane-failure-v2' as const;
const STAGES: readonly CandidateLaneFailureStage[] = [
  'SOLUTION',
  'REVIEWER',
  'SOLUTION_REVISION',
  'RE_REVIEWER',
];
const ORIGINS: readonly ParticipantFailureOrigin[] = Object.keys(VALID_REASON_BY_ORIGIN) as ParticipantFailureOrigin[];
const REASONS: readonly ParticipantFailureReason[] = [...new Set(Object.values(VALID_REASON_BY_ORIGIN).flat())];

const CANDIDATE_LOCAL_FAILURES = new Set<`${ParticipantFailureOrigin}:${ParticipantFailureReason}`>([
  'OUTPUT_ENVELOPE:EMPTY_ENVELOPE',
  'OUTPUT_ENVELOPE:INVALID_JSON_ENVELOPE',
  'OUTPUT_ENVELOPE:NON_OBJECT_ENVELOPE',
  'OUTPUT_SCHEMA:ROLE_SCHEMA_INVALID',
  'OUTPUT_INTERNAL_CONSISTENCY:OPTION_ID_MISMATCH',
  'OUTPUT_REFERENCE:MALFORMED_LOCATOR',
  'OUTPUT_REFERENCE:MISSING_TARGET',
  'OUTPUT_REFERENCE:NOT_REGULAR_FILE',
]);

type RecordValue = Record<string, unknown>;

function assertObject(value: unknown, label: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertExactKeys(value: RecordValue, allowed: readonly string[], label: string): void {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
  }
  for (const key of allowed) {
    if (!(key in value)) throw new Error(`${label} is missing field: ${key}`);
  }
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function integer(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

function enumValue<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new Error(`${label} has invalid value: ${String(value)}`);
  }
  return value as T;
}

function nullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return nonEmptyString(value, label);
}

function failurePair(origin: ParticipantFailureOrigin, reason: ParticipantFailureReason): string {
  return `${origin}:${reason}`;
}

function assertValidFailurePair(origin: ParticipantFailureOrigin, reason: ParticipantFailureReason): void {
  if (!VALID_REASON_BY_ORIGIN[origin].includes(reason)) {
    throw new Error(`invalid failure origin/reason combination: ${origin}/${reason}`);
  }
}

export function containmentForParticipantFailure(
  facts: Pick<ParticipantFailureFacts, 'origin' | 'reason'>,
): CandidateLaneFailureContainment {
  assertValidFailurePair(facts.origin, facts.reason);
  return CANDIDATE_LOCAL_FAILURES.has(failurePair(facts.origin, facts.reason))
    ? 'CANDIDATE_LOCAL'
    : 'SESSION_FAIL_CLOSED';
}

export function buildCandidateLaneFailureV2(input: Omit<CandidateLaneFailureV2,
  'schemaVersion' | 'retryCount' | 'containment'> & { retryCount?: 0 }
): CandidateLaneFailureV2 {
  const facts: ParticipantFailureFacts = {
    origin: input.failureOrigin,
    reason: input.failureReason,
    participantErrorKind: input.participantErrorKind,
    message: input.message,
  };
  return validateCandidateLaneFailureV2({
    schemaVersion: SCHEMA_VERSION,
    candidateRef: input.candidateRef,
    hypothesisId: input.hypothesisId,
    sourceIndex: input.sourceIndex,
    stage: input.stage,
    actualParticipantJobs: input.actualParticipantJobs,
    retryCount: input.retryCount ?? 0,
    failureOrigin: input.failureOrigin,
    failureReason: input.failureReason,
    containment: containmentForParticipantFailure(facts),
    participantErrorKind: input.participantErrorKind,
    message: input.message,
  });
}

export function validateCandidateLaneFailureV2(value: unknown): CandidateLaneFailureV2 {
  assertObject(value, 'candidate lane failure');
  assertExactKeys(value, [
    'schemaVersion',
    'candidateRef',
    'hypothesisId',
    'sourceIndex',
    'stage',
    'actualParticipantJobs',
    'retryCount',
    'failureOrigin',
    'failureReason',
    'containment',
    'participantErrorKind',
    'message',
  ], 'candidate lane failure');
  if (value.schemaVersion !== SCHEMA_VERSION) throw new Error('schemaVersion must be candidate-lane-failure-v2');
  const candidateRef = nonEmptyString(value.candidateRef, 'candidateRef');
  const hypothesisId = nonEmptyString(value.hypothesisId, 'hypothesisId');
  if (!candidateRef.endsWith(`/${hypothesisId}`) || candidateRef === `/${hypothesisId}`) {
    throw new Error('candidateRef and hypothesisId identity mismatch');
  }
  const sourceIndex = integer(value.sourceIndex, 'sourceIndex');
  const stage = enumValue(value.stage, STAGES, 'stage');
  if (value.actualParticipantJobs !== 1 && value.actualParticipantJobs !== 2) {
    throw new Error('actualParticipantJobs must be 1 or 2');
  }
  if (value.retryCount !== 0) throw new Error('retryCount must be 0');
  const failureOrigin = enumValue(value.failureOrigin, ORIGINS, 'failureOrigin');
  const failureReason = enumValue(value.failureReason, REASONS, 'failureReason');
  assertValidFailurePair(failureOrigin, failureReason);
  const containment = enumValue<CandidateLaneFailureContainment>(
    value.containment,
    ['CANDIDATE_LOCAL', 'SESSION_FAIL_CLOSED'],
    'containment',
  );
  const participantErrorKind = nullableString(value.participantErrorKind, 'participantErrorKind');
  const message = nonEmptyString(value.message, 'message');
  const expectedContainment = containmentForParticipantFailure({
    origin: failureOrigin,
    reason: failureReason,
    participantErrorKind,
    message,
  });
  if (containment !== expectedContainment) {
    throw new Error(`containment does not match failure origin/reason: expected ${expectedContainment}`);
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    candidateRef,
    hypothesisId,
    sourceIndex,
    stage,
    actualParticipantJobs: value.actualParticipantJobs,
    retryCount: 0,
    failureOrigin,
    failureReason,
    containment,
    participantErrorKind,
    message,
  };
}

export function parseCandidateLaneFailureV2(raw: string): CandidateLaneFailureV2 {
  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(`candidate-lane-failure-v2 must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return validateCandidateLaneFailureV2(value);
}
