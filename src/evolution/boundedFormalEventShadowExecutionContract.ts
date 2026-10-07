import {
  BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS,
  BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
} from './boundedFormalEventAuthoringContract';

export interface BoundedFormalEventShadowExecutionV1 {
  schemaVersion: 'bounded-formal-event-shadow-execution-v1';
  contractId: typeof BOUNDED_FORMAL_EVENT_CONTRACT_ID;
  contractVersion: typeof BOUNDED_FORMAL_EVENT_CONTRACT_VERSION;
  status: 'EXECUTED';
  requirementSha256: string;
  proposalSha256: string;
  reviewSha256: string;
  admissionSha256: string;
  eventId: string;
  candidateEventSha256: string;
  authoritativeFingerprintBefore: string;
  authoritativeFingerprintAfter: string;
  shadowBaselineFingerprint: string;
  shadowFingerprintAfter: string;
  canonicalChangedFileRefs: string[];
  focusedTestExitCode: 0;
  participantJobs: 0;
}

type RecordValue = Record<string, unknown>;

function assertObject(value: unknown): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('bounded Formal Event shadow execution result must be an object');
  }
}

function assertExactKeys(value: RecordValue, keys: readonly string[]): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`bounded Formal Event execution result contains unknown field: ${key}`);
  }
  for (const key of keys) {
    if (!(key in value)) throw new Error(`bounded Formal Event execution result is missing field: ${key}`);
  }
}

function digest(value: unknown, path: string): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${path} must be a lowercase SHA-256 digest`);
  }
  return value;
}

export function validateBoundedFormalEventShadowExecutionV1(
  value: unknown,
): BoundedFormalEventShadowExecutionV1 {
  assertObject(value);
  assertExactKeys(value, [
    'schemaVersion', 'contractId', 'contractVersion', 'status', 'requirementSha256', 'proposalSha256',
    'reviewSha256', 'admissionSha256', 'eventId', 'candidateEventSha256', 'authoritativeFingerprintBefore',
    'authoritativeFingerprintAfter', 'shadowBaselineFingerprint', 'shadowFingerprintAfter',
    'canonicalChangedFileRefs', 'focusedTestExitCode', 'participantJobs',
  ]);
  if (value.schemaVersion !== 'bounded-formal-event-shadow-execution-v1') {
    throw new Error('bounded Formal Event shadow execution schemaVersion is invalid');
  }
  if (value.contractId !== BOUNDED_FORMAL_EVENT_CONTRACT_ID || value.contractVersion !== BOUNDED_FORMAL_EVENT_CONTRACT_VERSION) {
    throw new Error('bounded Formal Event shadow execution Contract identity is invalid');
  }
  if (value.status !== 'EXECUTED') throw new Error('bounded Formal Event shadow execution status is invalid');
  if (typeof value.eventId !== 'string' || !/^[a-z][a-z0-9_]*$/.test(value.eventId)) {
    throw new Error('bounded Formal Event shadow execution eventId is invalid');
  }
  if (!Array.isArray(value.canonicalChangedFileRefs) || value.canonicalChangedFileRefs.some(path => typeof path !== 'string')) {
    throw new Error('bounded Formal Event shadow execution changed paths are invalid');
  }
  const expectedPaths = [...BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS].sort();
  if (JSON.stringify([...value.canonicalChangedFileRefs].sort()) !== JSON.stringify(expectedPaths)) {
    throw new Error('bounded Formal Event shadow execution changed paths exceed the exact family write surface');
  }
  if (value.focusedTestExitCode !== 0) throw new Error('bounded Formal Event shadow focused test must pass');
  if (value.participantJobs !== 0) throw new Error('deterministic bounded Formal Event execution requires zero Participant jobs');
  const authoritativeFingerprintBefore = digest(value.authoritativeFingerprintBefore, 'execution.authoritativeFingerprintBefore');
  const authoritativeFingerprintAfter = digest(value.authoritativeFingerprintAfter, 'execution.authoritativeFingerprintAfter');
  const shadowBaselineFingerprint = digest(value.shadowBaselineFingerprint, 'execution.shadowBaselineFingerprint');
  if (authoritativeFingerprintBefore !== authoritativeFingerprintAfter || shadowBaselineFingerprint !== authoritativeFingerprintBefore) {
    throw new Error('bounded Formal Event shadow execution requires an unchanged authoritative baseline');
  }
  return {
    schemaVersion: 'bounded-formal-event-shadow-execution-v1',
    contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
    contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    status: 'EXECUTED',
    requirementSha256: digest(value.requirementSha256, 'execution.requirementSha256'),
    proposalSha256: digest(value.proposalSha256, 'execution.proposalSha256'),
    reviewSha256: digest(value.reviewSha256, 'execution.reviewSha256'),
    admissionSha256: digest(value.admissionSha256, 'execution.admissionSha256'),
    eventId: value.eventId,
    candidateEventSha256: digest(value.candidateEventSha256, 'execution.candidateEventSha256'),
    authoritativeFingerprintBefore,
    authoritativeFingerprintAfter,
    shadowBaselineFingerprint,
    shadowFingerprintAfter: digest(value.shadowFingerprintAfter, 'execution.shadowFingerprintAfter'),
    canonicalChangedFileRefs: [...value.canonicalChangedFileRefs] as string[],
    focusedTestExitCode: 0,
    participantJobs: 0,
  };
}
