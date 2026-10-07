import {
  BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
  validateBoundedFormalEventPayload,
  type BoundedFormalEventPayloadV1,
} from './boundedFormalEventAuthoringContract';
import { validateAuthoringRequirementV1, type AuthoringRequirementV1 } from './authoringRequirementContract';

export type BoundedFormalEventApplicabilityClaimV2 =
  | 'APPLICABLE'
  | 'NOT_APPLICABLE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CONTRACT_CHANGE_REQUIRED';

export interface BoundedFormalEventProposalV2 {
  schemaVersion: 'autonomous-authoring-proposal-v2';
  contractId: typeof BOUNDED_FORMAL_EVENT_CONTRACT_ID;
  contractVersion: typeof BOUNDED_FORMAL_EVENT_CONTRACT_VERSION;
  requirement: AuthoringRequirementV1;
  proposedBy: string;
  applicabilityClaim: BoundedFormalEventApplicabilityClaimV2;
  contractPayload: BoundedFormalEventPayloadV1 | null;
}

export type BoundedFormalEventReviewDecisionV2 = 'ACCEPT' | 'REJECT' | 'REQUEST_MORE_WORK' | 'DEFER' | 'ESCALATE';

export interface BoundedFormalEventReviewAssessmentV2 {
  schemaVersion: 'autonomous-authoring-review-assessment-v2';
  contractId: typeof BOUNDED_FORMAL_EVENT_CONTRACT_ID;
  contractVersion: typeof BOUNDED_FORMAL_EVENT_CONTRACT_VERSION;
  requirementSha256: string;
  proposalSha256: string;
  reviewerRef: string;
  decision: BoundedFormalEventReviewDecisionV2;
  applicabilityAssessment: BoundedFormalEventApplicabilityClaimV2;
  conformance: 'CONFORMING' | 'NON_CONFORMING' | 'AMBIGUOUS';
  executionEnvelope: 'WITHIN_ENVELOPE' | 'EXECUTION_ENVELOPE_EXCEEDED' | 'UNKNOWN';
  requirementCoverage: 'COVERED' | 'NOT_COVERED' | 'UNCERTAIN';
  pastPresentFutureAssessment: 'COHERENT' | 'INCOHERENT' | 'UNCERTAIN';
  assessment: string;
  blockers: string[];
}

type RecordValue = Record<string, unknown>;

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

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value.map((item, index) => nonEmptyString(item, `${path}[${index}]`));
}

function sha256(value: unknown, path: string): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${path} must be a SHA-256 hex string`);
  }
  return value;
}

function enumValue<T extends string>(value: unknown, values: readonly T[], path: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) throw new Error(`${path} has an invalid value`);
  return value as T;
}

const APPLICABILITY: readonly BoundedFormalEventApplicabilityClaimV2[] = [
  'APPLICABLE', 'NOT_APPLICABLE', 'INSUFFICIENT_EVIDENCE', 'CONTRACT_CHANGE_REQUIRED',
];

export function validateBoundedFormalEventProposalV2(
  value: unknown,
  existingEventIds: readonly string[] = [],
): BoundedFormalEventProposalV2 {
  assertObject(value, 'bounded Formal Event proposal v2');
  assertExactKeys(value, [
    'schemaVersion', 'contractId', 'contractVersion', 'requirement', 'proposedBy', 'applicabilityClaim', 'contractPayload',
  ], 'bounded Formal Event proposal v2');
  if (value.schemaVersion !== 'autonomous-authoring-proposal-v2') {
    throw new Error('bounded Formal Event proposal schemaVersion must be autonomous-authoring-proposal-v2');
  }
  if (value.contractId !== BOUNDED_FORMAL_EVENT_CONTRACT_ID) {
    throw new Error(`bounded Formal Event proposal contractId must be ${BOUNDED_FORMAL_EVENT_CONTRACT_ID}`);
  }
  if (value.contractVersion !== BOUNDED_FORMAL_EVENT_CONTRACT_VERSION) {
    throw new Error(`bounded Formal Event proposal contractVersion must be ${BOUNDED_FORMAL_EVENT_CONTRACT_VERSION}`);
  }
  const requirement = validateAuthoringRequirementV1(value.requirement);
  if (requirement.target !== 'FORMAL_EVENT') throw new Error('bounded Formal Event proposal requires a FORMAL_EVENT Requirement');
  const applicabilityClaim = enumValue(value.applicabilityClaim, APPLICABILITY, 'bounded Formal Event proposal.applicabilityClaim');
  let contractPayload: BoundedFormalEventPayloadV1 | null;
  if (applicabilityClaim === 'APPLICABLE') {
    if (value.contractPayload === null || value.contractPayload === undefined) {
      throw new Error('APPLICABLE bounded Formal Event proposal requires contractPayload');
    }
    contractPayload = validateBoundedFormalEventPayload(value.contractPayload, requirement, existingEventIds);
  } else {
    if (value.contractPayload !== null) {
      throw new Error(`${applicabilityClaim} bounded Formal Event proposal requires contractPayload to be null`);
    }
    contractPayload = null;
  }
  return {
    schemaVersion: 'autonomous-authoring-proposal-v2',
    contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
    contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    requirement,
    proposedBy: nonEmptyString(value.proposedBy, 'bounded Formal Event proposal.proposedBy'),
    applicabilityClaim,
    contractPayload,
  };
}

export function validateBoundedFormalEventReviewAssessmentV2(value: unknown): BoundedFormalEventReviewAssessmentV2 {
  assertObject(value, 'bounded Formal Event review assessment v2');
  assertExactKeys(value, [
    'schemaVersion', 'contractId', 'contractVersion', 'requirementSha256', 'proposalSha256', 'reviewerRef',
    'decision', 'applicabilityAssessment', 'conformance', 'executionEnvelope', 'requirementCoverage',
    'pastPresentFutureAssessment', 'assessment', 'blockers',
  ], 'bounded Formal Event review assessment v2');
  if (value.schemaVersion !== 'autonomous-authoring-review-assessment-v2') {
    throw new Error('bounded Formal Event review schemaVersion must be autonomous-authoring-review-assessment-v2');
  }
  if (value.contractId !== BOUNDED_FORMAL_EVENT_CONTRACT_ID) {
    throw new Error(`bounded Formal Event review contractId must be ${BOUNDED_FORMAL_EVENT_CONTRACT_ID}`);
  }
  if (value.contractVersion !== BOUNDED_FORMAL_EVENT_CONTRACT_VERSION) {
    throw new Error(`bounded Formal Event review contractVersion must be ${BOUNDED_FORMAL_EVENT_CONTRACT_VERSION}`);
  }
  return {
    schemaVersion: 'autonomous-authoring-review-assessment-v2',
    contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
    contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    requirementSha256: sha256(value.requirementSha256, 'bounded Formal Event review.requirementSha256'),
    proposalSha256: sha256(value.proposalSha256, 'bounded Formal Event review.proposalSha256'),
    reviewerRef: nonEmptyString(value.reviewerRef, 'bounded Formal Event review.reviewerRef'),
    decision: enumValue(value.decision, ['ACCEPT', 'REJECT', 'REQUEST_MORE_WORK', 'DEFER', 'ESCALATE'], 'bounded Formal Event review.decision'),
    applicabilityAssessment: enumValue(value.applicabilityAssessment, APPLICABILITY, 'bounded Formal Event review.applicabilityAssessment'),
    conformance: enumValue(value.conformance, ['CONFORMING', 'NON_CONFORMING', 'AMBIGUOUS'], 'bounded Formal Event review.conformance'),
    executionEnvelope: enumValue(value.executionEnvelope, ['WITHIN_ENVELOPE', 'EXECUTION_ENVELOPE_EXCEEDED', 'UNKNOWN'], 'bounded Formal Event review.executionEnvelope'),
    requirementCoverage: enumValue(value.requirementCoverage, ['COVERED', 'NOT_COVERED', 'UNCERTAIN'], 'bounded Formal Event review.requirementCoverage'),
    pastPresentFutureAssessment: enumValue(value.pastPresentFutureAssessment, ['COHERENT', 'INCOHERENT', 'UNCERTAIN'], 'bounded Formal Event review.pastPresentFutureAssessment'),
    assessment: nonEmptyString(value.assessment, 'bounded Formal Event review.assessment'),
    blockers: stringArray(value.blockers, 'bounded Formal Event review.blockers'),
  };
}
