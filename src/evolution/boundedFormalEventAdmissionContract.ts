import {
  BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS,
  BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
  BOUNDED_FORMAL_EVENT_MAX_NEW_EVENTS,
  type BoundedFormalEventOutOfContractRequirementV1,
  type BoundedFormalEventApplicabilityV1,
  type BoundedFormalEventPredicateEvidenceV1,
} from './boundedFormalEventAuthoringContract';

export type BoundedFormalEventAdmissionStatusV2 =
  | 'ELIGIBLE'
  | 'NOT_APPLICABLE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CONTRACT_CHANGE_REQUIRED'
  | 'EXECUTION_ENVELOPE_EXCEEDED'
  | 'REVIEW_REJECTED'
  | 'AUTHORITY_STALE';

export interface BoundedFormalEventAdmissionV2 {
  schemaVersion: 'autonomous-authoring-admission-v2';
  contractId: typeof BOUNDED_FORMAL_EVENT_CONTRACT_ID;
  contractVersion: typeof BOUNDED_FORMAL_EVENT_CONTRACT_VERSION;
  status: BoundedFormalEventAdmissionStatusV2;
  requirementSha256: string;
  proposalSha256: string;
  reviewSha256: string | null;
  proposedBy: string;
  reviewerRef: string | null;
  authoritativeFingerprintBefore: string;
  allowedWritePaths: typeof BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS;
  maxNewEvents: typeof BOUNDED_FORMAL_EVENT_MAX_NEW_EVENTS;
  applicability: BoundedFormalEventApplicabilityV1;
  predicateEvidence: BoundedFormalEventPredicateEvidenceV1;
  reasons: string[];
}

type RecordValue = Record<string, unknown>;

const STATUSES: readonly BoundedFormalEventAdmissionStatusV2[] = [
  'ELIGIBLE',
  'NOT_APPLICABLE',
  'INSUFFICIENT_EVIDENCE',
  'CONTRACT_CHANGE_REQUIRED',
  'EXECUTION_ENVELOPE_EXCEEDED',
  'REVIEW_REJECTED',
  'AUTHORITY_STALE',
];

function assertObject(value: unknown, path: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${path} must be an object`);
}

function assertExactKeys(value: RecordValue, keys: readonly string[], path: string): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${path} contains unknown field: ${key}`);
  }
  for (const key of keys) {
    if (!(key in value)) throw new Error(`${path} is missing field: ${key}`);
  }
}

function nonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`${path} must be a non-empty string`);
  return value;
}

function nullableString(value: unknown, path: string): string | null {
  return value === null ? null : nonEmptyString(value, path);
}

function hash(value: unknown, path: string): string {
  const result = nonEmptyString(value, path);
  if (!/^[a-f0-9]{64}$/.test(result)) throw new Error(`${path} must be a SHA-256 hex string`);
  return result;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value.map((item, index) => nonEmptyString(item, `${path}[${index}]`));
}

function validatePredicateEvidence(value: unknown): BoundedFormalEventPredicateEvidenceV1 {
  assertObject(value, 'bounded Formal Event admission.predicateEvidence');
  assertExactKeys(value, ['status', 'thresholds', 'evidenceRefs', 'expressions', 'reasons'], 'bounded Formal Event admission.predicateEvidence');
  if (value.status !== 'SUPPORTED' && value.status !== 'INSUFFICIENT_EVIDENCE') {
    throw new Error('bounded Formal Event admission.predicateEvidence.status is invalid');
  }
  let thresholds: BoundedFormalEventPredicateEvidenceV1['thresholds'] = null;
  if (value.thresholds !== null) {
    assertObject(value.thresholds, 'bounded Formal Event admission.predicateEvidence.thresholds');
    assertExactKeys(value.thresholds, ['trainingHabit', 'businessHabit'], 'bounded Formal Event admission.predicateEvidence.thresholds');
    if (value.thresholds.trainingHabit !== 2 || value.thresholds.businessHabit !== 2) {
      throw new Error('bounded Formal Event admission predicate thresholds must match the recorded P22 precedent');
    }
    thresholds = { trainingHabit: 2, businessHabit: 2 };
  }
  if ((value.status === 'SUPPORTED') !== (thresholds !== null)) {
    throw new Error('bounded Formal Event predicate evidence status and thresholds disagree');
  }
  return {
    status: value.status,
    thresholds,
    evidenceRefs: stringArray(value.evidenceRefs, 'bounded Formal Event admission.predicateEvidence.evidenceRefs'),
    expressions: stringArray(value.expressions, 'bounded Formal Event admission.predicateEvidence.expressions'),
    reasons: stringArray(value.reasons, 'bounded Formal Event admission.predicateEvidence.reasons'),
  };
}

function validateApplicability(value: unknown): BoundedFormalEventApplicabilityV1 {
  assertObject(value, 'bounded Formal Event admission.applicability');
  assertExactKeys(value, ['status', 'evidence', 'requirementBoundaryEvidence', 'observedLifeStates', 'reasons'], 'bounded Formal Event admission.applicability');
  if (!['APPLICABLE', 'NOT_APPLICABLE', 'INSUFFICIENT_EVIDENCE', 'CONTRACT_CHANGE_REQUIRED'].includes(String(value.status))) {
    throw new Error('bounded Formal Event admission.applicability.status is invalid');
  }
  const evidence = validatePredicateEvidence(value.evidence);
  let requirementBoundaryEvidence: BoundedFormalEventApplicabilityV1['requirementBoundaryEvidence'] = null;
  if (value.requirementBoundaryEvidence !== null) {
    assertObject(value.requirementBoundaryEvidence, 'bounded Formal Event admission.applicability.requirementBoundaryEvidence');
    assertExactKeys(
      value.requirementBoundaryEvidence,
      ['requirementId', 'sourceRef', 'requiredCapability'],
      'bounded Formal Event admission.applicability.requirementBoundaryEvidence',
    );
    const requiredCapability = value.requirementBoundaryEvidence.requiredCapability;
    const capabilities: readonly BoundedFormalEventOutOfContractRequirementV1[] = [
      'PERSISTENT_PERSON',
      'NEW_RUNTIME_OR_SCHEMA',
      'SECOND_EVENT',
    ];
    if (typeof requiredCapability !== 'string' || !capabilities.includes(requiredCapability as BoundedFormalEventOutOfContractRequirementV1)) {
      throw new Error('bounded Formal Event admission requirementBoundaryEvidence.requiredCapability is invalid');
    }
    requirementBoundaryEvidence = {
      requirementId: nonEmptyString(value.requirementBoundaryEvidence.requirementId, 'bounded Formal Event admission.applicability.requirementBoundaryEvidence.requirementId'),
      sourceRef: nonEmptyString(value.requirementBoundaryEvidence.sourceRef, 'bounded Formal Event admission.applicability.requirementBoundaryEvidence.sourceRef'),
      requiredCapability: requiredCapability as BoundedFormalEventOutOfContractRequirementV1,
    };
  }
  if ((value.status === 'CONTRACT_CHANGE_REQUIRED') !== (requirementBoundaryEvidence !== null)) {
    throw new Error('bounded Formal Event applicability status and Requirement boundary evidence disagree');
  }
  let observedLifeStates: BoundedFormalEventApplicabilityV1['observedLifeStates'] = null;
  if (value.observedLifeStates !== null) {
    assertObject(value.observedLifeStates, 'bounded Formal Event admission.applicability.observedLifeStates');
    assertExactKeys(value.observedLifeStates, ['trainingHabit', 'businessHabit'], 'bounded Formal Event admission.applicability.observedLifeStates');
    const trainingHabit = value.observedLifeStates.trainingHabit;
    const businessHabit = value.observedLifeStates.businessHabit;
    if (
      typeof trainingHabit !== 'number' || !Number.isInteger(trainingHabit) || trainingHabit < 0 || trainingHabit > 5
      || typeof businessHabit !== 'number' || !Number.isInteger(businessHabit) || businessHabit < 0 || businessHabit > 5
    ) {
      throw new Error('bounded Formal Event admission observed Habit values are invalid');
    }
    observedLifeStates = { trainingHabit, businessHabit };
  }
  return {
    status: value.status as BoundedFormalEventApplicabilityV1['status'],
    evidence,
    requirementBoundaryEvidence,
    observedLifeStates,
    reasons: stringArray(value.reasons, 'bounded Formal Event admission.applicability.reasons'),
  };
}

export function validateBoundedFormalEventAdmissionV2(value: unknown): BoundedFormalEventAdmissionV2 {
  assertObject(value, 'bounded Formal Event admission v2');
  assertExactKeys(value, [
    'schemaVersion', 'contractId', 'contractVersion', 'status', 'requirementSha256', 'proposalSha256', 'reviewSha256',
    'proposedBy', 'reviewerRef', 'authoritativeFingerprintBefore', 'allowedWritePaths', 'maxNewEvents', 'applicability',
    'predicateEvidence', 'reasons',
  ], 'bounded Formal Event admission v2');
  if (value.schemaVersion !== 'autonomous-authoring-admission-v2') {
    throw new Error('bounded Formal Event admission schemaVersion must be autonomous-authoring-admission-v2');
  }
  if (value.contractId !== BOUNDED_FORMAL_EVENT_CONTRACT_ID) {
    throw new Error(`bounded Formal Event admission contractId must be ${BOUNDED_FORMAL_EVENT_CONTRACT_ID}`);
  }
  if (value.contractVersion !== BOUNDED_FORMAL_EVENT_CONTRACT_VERSION) {
    throw new Error(`bounded Formal Event admission contractVersion must be ${BOUNDED_FORMAL_EVENT_CONTRACT_VERSION}`);
  }
  if (typeof value.status !== 'string' || !STATUSES.includes(value.status as BoundedFormalEventAdmissionStatusV2)) {
    throw new Error('bounded Formal Event admission status is invalid');
  }
  if (!Array.isArray(value.allowedWritePaths) || JSON.stringify(value.allowedWritePaths) !== JSON.stringify(BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS)) {
    throw new Error('bounded Formal Event admission allowedWritePaths must match the exact family write surface');
  }
  if (value.maxNewEvents !== BOUNDED_FORMAL_EVENT_MAX_NEW_EVENTS) {
    throw new Error('bounded Formal Event admission maxNewEvents must be exactly one');
  }
  const applicability = validateApplicability(value.applicability);
  const predicateEvidence = validatePredicateEvidence(value.predicateEvidence);
  if (JSON.stringify(applicability.evidence) !== JSON.stringify(predicateEvidence)) {
    throw new Error('bounded Formal Event admission applicability evidence must match predicateEvidence');
  }
  const result: BoundedFormalEventAdmissionV2 = {
    schemaVersion: 'autonomous-authoring-admission-v2',
    contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
    contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    status: value.status as BoundedFormalEventAdmissionStatusV2,
    requirementSha256: hash(value.requirementSha256, 'bounded Formal Event admission.requirementSha256'),
    proposalSha256: hash(value.proposalSha256, 'bounded Formal Event admission.proposalSha256'),
    reviewSha256: value.reviewSha256 === null ? null : hash(value.reviewSha256, 'bounded Formal Event admission.reviewSha256'),
    proposedBy: nonEmptyString(value.proposedBy, 'bounded Formal Event admission.proposedBy'),
    reviewerRef: nullableString(value.reviewerRef, 'bounded Formal Event admission.reviewerRef'),
    authoritativeFingerprintBefore: hash(value.authoritativeFingerprintBefore, 'bounded Formal Event admission.authoritativeFingerprintBefore'),
    allowedWritePaths: BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS,
    maxNewEvents: BOUNDED_FORMAL_EVENT_MAX_NEW_EVENTS,
    applicability,
    predicateEvidence,
    reasons: stringArray(value.reasons, 'bounded Formal Event admission.reasons'),
  };
  if (result.status === 'ELIGIBLE') {
    if (result.reviewSha256 === null || result.reviewerRef === null) throw new Error('ELIGIBLE admission requires independent review provenance');
    if (result.applicability.status !== 'APPLICABLE') throw new Error('ELIGIBLE admission requires Host applicability');
    if (result.predicateEvidence.status !== 'SUPPORTED') throw new Error('ELIGIBLE admission requires supported predicate evidence');
  }
  return result;
}
