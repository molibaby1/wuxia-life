import {
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
  validatePreschoolSharedNeutralPayload,
  type PreschoolSharedNeutralAuthoringPayloadV1,
} from './preschoolSharedNeutralAuthoringContract';

export type AutonomousAuthoringApplicability =
  | 'APPLICABLE'
  | 'NOT_APPLICABLE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CONTRACT_CHANGE_REQUIRED';

export type AutonomousAuthoringConformance =
  | 'CONFORMING'
  | 'NON_CONFORMING'
  | 'AMBIGUOUS';

export type AutonomousAuthoringExecutionEnvelope =
  | 'WITHIN_ENVELOPE'
  | 'EXECUTION_ENVELOPE_EXCEEDED'
  | 'UNKNOWN';

export interface AutonomousAuthoringResponsibilityV1 {
  responsibilityId: string;
  primaryLifeFunction: string;
  playerVisibleNeed: string;
  evidenceRefs: string[];
}

export interface AutonomousAuthoringProposalV1 {
  schemaVersion: 'autonomous-authoring-proposal-v1';
  contractId: string;
  contractVersion: number;
  gapClassification: 'CONTENT_GAP';
  gapSubtype: 'CONTENT_CAPACITY_GAP';
  applicabilityClaim: AutonomousAuthoringApplicability;
  authorityRefs: string[];
  sourceEvidenceRefs: string[];
  responsibilities: AutonomousAuthoringResponsibilityV1[];
  contractPayload: PreschoolSharedNeutralAuthoringPayloadV1 | null;
}

export interface AutonomousAuthoringReviewAssessmentV1 {
  schemaVersion: 'autonomous-authoring-review-assessment-v1';
  contractId: string;
  contractVersion: number;
  applicabilityAssessment: AutonomousAuthoringApplicability;
  conformance: AutonomousAuthoringConformance;
  executionEnvelope: AutonomousAuthoringExecutionEnvelope;
  assessment: string;
  blockers: string[];
}

type RecordValue = Record<string, unknown>;

const APPLICABILITY: readonly AutonomousAuthoringApplicability[] = [
  'APPLICABLE',
  'NOT_APPLICABLE',
  'INSUFFICIENT_EVIDENCE',
  'CONTRACT_CHANGE_REQUIRED',
];
const CONFORMANCE: readonly AutonomousAuthoringConformance[] = [
  'CONFORMING',
  'NON_CONFORMING',
  'AMBIGUOUS',
];
const EXECUTION_ENVELOPE: readonly AutonomousAuthoringExecutionEnvelope[] = [
  'WITHIN_ENVELOPE',
  'EXECUTION_ENVELOPE_EXCEEDED',
  'UNKNOWN',
];

function assertObject(value: unknown, path: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
}

function assertExactKeys(value: RecordValue, required: readonly string[], path: string): void {
  const allowed = new Set(required);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${path} contains unknown field: ${key}`);
  }
  for (const key of required) {
    if (!(key in value)) throw new Error(`${path} is missing field: ${key}`);
  }
}

function nonEmptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  value.forEach((item, index) => nonEmptyString(item, `${path}[${index}]`));
  return [...value] as string[];
}

function contractVersion(value: unknown, contractId: string): 1 {
  if (contractId !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID) {
    throw new Error(`unknown autonomous authoring contract: ${contractId}`);
  }
  if (value !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION) {
    throw new Error(`autonomous authoring contractVersion must be ${PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION}`);
  }
  return PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new Error(`${path} has invalid value: ${String(value)}`);
  }
  return value as T;
}

function parseResponsibility(value: unknown, index: number): AutonomousAuthoringResponsibilityV1 {
  const path = `autonomous authoring proposal.responsibilities[${index}]`;
  assertObject(value, path);
  assertExactKeys(value, [
    'responsibilityId',
    'primaryLifeFunction',
    'playerVisibleNeed',
    'evidenceRefs',
  ], path);
  const expectedId = `responsibility-${String(index + 1).padStart(6, '0')}`;
  if (value.responsibilityId !== expectedId) {
    throw new Error(`${path}.responsibilityId must be ${expectedId} in participant order`);
  }
  return {
    responsibilityId: expectedId,
    primaryLifeFunction: nonEmptyString(value.primaryLifeFunction, `${path}.primaryLifeFunction`),
    playerVisibleNeed: nonEmptyString(value.playerVisibleNeed, `${path}.playerVisibleNeed`),
    evidenceRefs: stringArray(value.evidenceRefs, `${path}.evidenceRefs`),
  };
}

export function validateAutonomousAuthoringProposal(value: unknown): AutonomousAuthoringProposalV1 {
  assertObject(value, 'autonomous authoring proposal');
  assertExactKeys(value, [
    'schemaVersion',
    'contractId',
    'contractVersion',
    'gapClassification',
    'gapSubtype',
    'applicabilityClaim',
    'authorityRefs',
    'sourceEvidenceRefs',
    'responsibilities',
    'contractPayload',
  ], 'autonomous authoring proposal');
  if (value.schemaVersion !== 'autonomous-authoring-proposal-v1') {
    throw new Error('autonomous authoring proposal schemaVersion must be autonomous-authoring-proposal-v1');
  }
  const id = nonEmptyString(value.contractId, 'autonomous authoring proposal.contractId');
  const version = contractVersion(value.contractVersion, id);
  if (value.gapClassification !== 'CONTENT_GAP') {
    throw new Error('autonomous authoring proposal.gapClassification must be CONTENT_GAP');
  }
  if (value.gapSubtype !== 'CONTENT_CAPACITY_GAP') {
    throw new Error('autonomous authoring proposal.gapSubtype must be CONTENT_CAPACITY_GAP');
  }
  const applicabilityClaim = enumValue(
    value.applicabilityClaim,
    APPLICABILITY,
    'autonomous authoring proposal.applicabilityClaim',
  );
  if (!Array.isArray(value.responsibilities)) {
    throw new Error('autonomous authoring proposal.responsibilities must be an array');
  }
  const responsibilities = value.responsibilities.map(parseResponsibility);
  const authorityRefs = stringArray(value.authorityRefs, 'autonomous authoring proposal.authorityRefs');
  const sourceEvidenceRefs = stringArray(value.sourceEvidenceRefs, 'autonomous authoring proposal.sourceEvidenceRefs');

  let contractPayload: PreschoolSharedNeutralAuthoringPayloadV1 | null;
  if (applicabilityClaim === 'APPLICABLE') {
    if (responsibilities.length === 0) {
      throw new Error('APPLICABLE requires at least one responsibility');
    }
    if (responsibilities.length > 8) {
      if (value.contractPayload !== null) {
        throw new Error('APPLICABLE above the execution envelope requires contractPayload to be null');
      }
      contractPayload = null;
    } else {
      if (value.contractPayload === null || value.contractPayload === undefined) {
        throw new Error('APPLICABLE requires a non-null contractPayload');
      }
      contractPayload = validatePreschoolSharedNeutralPayload(value.contractPayload, responsibilities);
    }
  } else {
    if (responsibilities.length !== 0) {
      throw new Error(`${applicabilityClaim} requires empty responsibilities`);
    }
    if (value.contractPayload !== null) {
      throw new Error(`${applicabilityClaim} requires contractPayload to be null`);
    }
    contractPayload = null;
  }

  return {
    schemaVersion: 'autonomous-authoring-proposal-v1',
    contractId: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
    contractVersion: version,
    gapClassification: 'CONTENT_GAP',
    gapSubtype: 'CONTENT_CAPACITY_GAP',
    applicabilityClaim,
    authorityRefs,
    sourceEvidenceRefs,
    responsibilities,
    contractPayload,
  };
}

export function validateAutonomousAuthoringReviewAssessment(
  value: unknown,
): AutonomousAuthoringReviewAssessmentV1 {
  assertObject(value, 'autonomous authoring review assessment');
  assertExactKeys(value, [
    'schemaVersion',
    'contractId',
    'contractVersion',
    'applicabilityAssessment',
    'conformance',
    'executionEnvelope',
    'assessment',
    'blockers',
  ], 'autonomous authoring review assessment');
  if (value.schemaVersion !== 'autonomous-authoring-review-assessment-v1') {
    throw new Error('autonomous authoring review assessment schemaVersion must be autonomous-authoring-review-assessment-v1');
  }
  const id = nonEmptyString(value.contractId, 'autonomous authoring review assessment.contractId');
  const version = contractVersion(value.contractVersion, id);
  return {
    schemaVersion: 'autonomous-authoring-review-assessment-v1',
    contractId: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
    contractVersion: version,
    applicabilityAssessment: enumValue(
      value.applicabilityAssessment,
      APPLICABILITY,
      'autonomous authoring review assessment.applicabilityAssessment',
    ),
    conformance: enumValue(value.conformance, CONFORMANCE, 'autonomous authoring review assessment.conformance'),
    executionEnvelope: enumValue(
      value.executionEnvelope,
      EXECUTION_ENVELOPE,
      'autonomous authoring review assessment.executionEnvelope',
    ),
    assessment: nonEmptyString(value.assessment, 'autonomous authoring review assessment.assessment'),
    blockers: stringArray(value.blockers, 'autonomous authoring review assessment.blockers'),
  };
}
