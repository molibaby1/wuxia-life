import {
  PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
  PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES,
} from './preschoolSharedNeutralAuthoringContract';

export type AutonomousAuthoringAdmissionStatus =
  | 'ELIGIBLE'
  | 'NOT_APPLICABLE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CONTRACT_CHANGE_REQUIRED'
  | 'EXECUTION_ENVELOPE_EXCEEDED'
  | 'AUTHORITY_STALE';

export interface PreschoolCapacityBeatEvidenceV1 {
  sequence: number;
  age: 4 | 5 | 6 | 7;
  selectedEntryId: string;
  kind: 'AUTHORED' | 'GAP';
  legalUnconsumedCountBeforeSelection: number;
}

export interface PreschoolCapacityEvidenceV1 {
  schemaVersion: 'preschool-capacity-evidence-v1';
  runRef: string;
  evidenceMode: 'STRUCTURAL_EXHAUSTION' | 'SEMANTIC_VARIETY';
  canonicalOriginTag: 'scholar' | 'martial' | 'merchant' | 'frontier';
  preConsumedEntryIds: string[];
  beats: PreschoolCapacityBeatEvidenceV1[];
  demandBeats: number;
  authoredBeats: number;
  gapBeats: number;
  foreignOriginLeakCount: number;
  duplicateAuthoredCount: number;
}

export interface AutonomousAuthoringAdmissionV1 {
  schemaVersion: 'autonomous-authoring-admission-v1';
  contractId: typeof PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID;
  contractVersion: typeof PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION;
  status: AutonomousAuthoringAdmissionStatus;
  proposalSha256: string;
  reviewSha256: string;
  sourceRunRef: string;
  authorityRefs: string[];
  allowedWritePaths: string[];
  maxNewEntries: typeof PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES;
  capacityEvidence: PreschoolCapacityEvidenceV1 | null;
  reasons: string[];
}

type RecordValue = Record<string, unknown>;

const STATUSES: readonly AutonomousAuthoringAdmissionStatus[] = [
  'ELIGIBLE',
  'NOT_APPLICABLE',
  'INSUFFICIENT_EVIDENCE',
  'CONTRACT_CHANGE_REQUIRED',
  'EXECUTION_ENVELOPE_EXCEEDED',
  'AUTHORITY_STALE',
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

function count(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${path} must be a non-negative integer`);
  }
  return value;
}

function age(value: unknown, path: string): 4 | 5 | 6 | 7 {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 4 || value > 7) {
    throw new Error(`${path} must be an integer from 4 through 7`);
  }
  return value as 4 | 5 | 6 | 7;
}

export function validatePreschoolCapacityEvidence(value: unknown): PreschoolCapacityEvidenceV1 {
  assertObject(value, 'preschool capacity evidence');
  assertExactKeys(value, [
    'schemaVersion',
    'runRef',
    'evidenceMode',
    'canonicalOriginTag',
    'preConsumedEntryIds',
    'beats',
    'demandBeats',
    'authoredBeats',
    'gapBeats',
    'foreignOriginLeakCount',
    'duplicateAuthoredCount',
  ], 'preschool capacity evidence');
  if (value.schemaVersion !== 'preschool-capacity-evidence-v1') {
    throw new Error('preschool capacity evidence schemaVersion is invalid');
  }
  if (value.evidenceMode !== 'STRUCTURAL_EXHAUSTION' && value.evidenceMode !== 'SEMANTIC_VARIETY') {
    throw new Error('preschool capacity evidence evidenceMode is invalid');
  }
  const origins = ['scholar', 'martial', 'merchant', 'frontier'] as const;
  if (typeof value.canonicalOriginTag !== 'string' || !origins.includes(value.canonicalOriginTag as typeof origins[number])) {
    throw new Error('preschool capacity evidence canonicalOriginTag is invalid');
  }
  if (!Array.isArray(value.beats)) throw new Error('preschool capacity evidence beats must be an array');
  const beats = value.beats.map((beat, index): PreschoolCapacityBeatEvidenceV1 => {
    const path = `preschool capacity evidence.beats[${index}]`;
    assertObject(beat, path);
    assertExactKeys(beat, [
      'sequence',
      'age',
      'selectedEntryId',
      'kind',
      'legalUnconsumedCountBeforeSelection',
    ], path);
    const sequence = count(beat.sequence, `${path}.sequence`);
    if (sequence === 0) throw new Error(`${path}.sequence must be positive`);
    if (beat.kind !== 'AUTHORED' && beat.kind !== 'GAP') throw new Error(`${path}.kind is invalid`);
    return {
      sequence,
      age: age(beat.age, `${path}.age`),
      selectedEntryId: nonEmptyString(beat.selectedEntryId, `${path}.selectedEntryId`),
      kind: beat.kind,
      legalUnconsumedCountBeforeSelection: count(
        beat.legalUnconsumedCountBeforeSelection,
        `${path}.legalUnconsumedCountBeforeSelection`,
      ),
    };
  });
  for (let index = 1; index < beats.length; index += 1) {
    if (beats[index]!.sequence <= beats[index - 1]!.sequence) {
      throw new Error('preschool capacity evidence beat sequences must increase');
    }
  }
  const preConsumedEntryIds = stringArray(value.preConsumedEntryIds, 'preschool capacity evidence.preConsumedEntryIds');
  if (new Set(preConsumedEntryIds).size !== preConsumedEntryIds.length) {
    throw new Error('preschool capacity evidence preConsumedEntryIds must be unique');
  }
  const demandBeats = count(value.demandBeats, 'preschool capacity evidence.demandBeats');
  if (demandBeats === 0) throw new Error('preschool capacity evidence requires at least one demand beat');
  const authoredBeats = count(value.authoredBeats, 'preschool capacity evidence.authoredBeats');
  const gapBeats = count(value.gapBeats, 'preschool capacity evidence.gapBeats');
  if (demandBeats !== beats.length || authoredBeats + gapBeats !== demandBeats) {
    throw new Error('preschool capacity evidence beat counts do not match beats');
  }
  if (authoredBeats !== beats.filter(beat => beat.kind === 'AUTHORED').length
    || gapBeats !== beats.filter(beat => beat.kind === 'GAP').length) {
    throw new Error('preschool capacity evidence authored/gap counts do not match beats');
  }
  return {
    schemaVersion: 'preschool-capacity-evidence-v1',
    runRef: nonEmptyString(value.runRef, 'preschool capacity evidence.runRef'),
    evidenceMode: value.evidenceMode,
    canonicalOriginTag: value.canonicalOriginTag as PreschoolCapacityEvidenceV1['canonicalOriginTag'],
    preConsumedEntryIds,
    beats,
    demandBeats,
    authoredBeats,
    gapBeats,
    foreignOriginLeakCount: count(value.foreignOriginLeakCount, 'preschool capacity evidence.foreignOriginLeakCount'),
    duplicateAuthoredCount: count(value.duplicateAuthoredCount, 'preschool capacity evidence.duplicateAuthoredCount'),
  };
}

export function validateAutonomousAuthoringAdmission(value: unknown): AutonomousAuthoringAdmissionV1 {
  assertObject(value, 'autonomous authoring admission');
  assertExactKeys(value, [
    'schemaVersion',
    'contractId',
    'contractVersion',
    'status',
    'proposalSha256',
    'reviewSha256',
    'sourceRunRef',
    'authorityRefs',
    'allowedWritePaths',
    'maxNewEntries',
    'capacityEvidence',
    'reasons',
  ], 'autonomous authoring admission');
  if (value.schemaVersion !== 'autonomous-authoring-admission-v1') {
    throw new Error('autonomous authoring admission schemaVersion is invalid');
  }
  if (value.contractId !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID) {
    throw new Error(`autonomous authoring admission contractId must be ${PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID}`);
  }
  if (value.contractVersion !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION) {
    throw new Error(`autonomous authoring admission contractVersion must be ${PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION}`);
  }
  if (typeof value.status !== 'string' || !STATUSES.includes(value.status as AutonomousAuthoringAdmissionStatus)) {
    throw new Error('autonomous authoring admission status is invalid');
  }
  const proposalSha256 = nonEmptyString(value.proposalSha256, 'autonomous authoring admission.proposalSha256');
  const reviewSha256 = nonEmptyString(value.reviewSha256, 'autonomous authoring admission.reviewSha256');
  if (!/^[a-f0-9]{64}$/.test(proposalSha256)) throw new Error('autonomous authoring admission proposalSha256 must be a SHA-256 hex string');
  if (!/^[a-f0-9]{64}$/.test(reviewSha256)) throw new Error('autonomous authoring admission reviewSha256 must be a SHA-256 hex string');
  const allowedWritePaths = stringArray(value.allowedWritePaths, 'autonomous authoring admission.allowedWritePaths');
  if (JSON.stringify(allowedWritePaths) !== JSON.stringify(PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS)) {
    throw new Error('autonomous authoring admission allowedWritePaths must match the preschool Contract');
  }
  if (value.maxNewEntries !== PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES) {
    throw new Error(`autonomous authoring admission maxNewEntries must be ${PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES}`);
  }
  const capacityEvidence = value.capacityEvidence === null
    ? null
    : validatePreschoolCapacityEvidence(value.capacityEvidence);
  const sourceRunRef = nonEmptyString(value.sourceRunRef, 'autonomous authoring admission.sourceRunRef');
  if (capacityEvidence !== null && capacityEvidence.runRef !== sourceRunRef) {
    throw new Error('autonomous authoring admission sourceRunRef must match capacity evidence');
  }
  if (value.status === 'ELIGIBLE' && capacityEvidence === null) {
    throw new Error('ELIGIBLE admission requires capacity evidence');
  }
  return {
    schemaVersion: 'autonomous-authoring-admission-v1',
    contractId: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
    contractVersion: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
    status: value.status as AutonomousAuthoringAdmissionStatus,
    proposalSha256,
    reviewSha256,
    sourceRunRef,
    authorityRefs: stringArray(value.authorityRefs, 'autonomous authoring admission.authorityRefs'),
    allowedWritePaths,
    maxNewEntries: PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES,
    capacityEvidence,
    reasons: stringArray(value.reasons, 'autonomous authoring admission.reasons'),
  };
}
