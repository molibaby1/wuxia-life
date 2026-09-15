import type { ImprovementHypothesis } from '../../src/evolution/improvementHypothesisContract';
import { canonicalJson, sha256Hex } from './phase0/provenance';

export const CANDIDATE_POOL_SCHEMA_VERSION = 'candidate-pool-v1' as const;

export type CandidateProcessingState =
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'SOURCE_CHANGE_PENDING'
  | 'INTERRUPTED'
  | 'SUPERSEDED';

export type CandidatePoolStatus =
  | 'PROCESSING'
  | 'SOURCE_CHANGE_BARRIER'
  | 'EXHAUSTED'
  | 'SUPERSEDED'
  | 'INTERRUPTED';

export interface CandidateRecordV1 {
  candidateRef: string;
  hypothesisId: string;
  sourceIndex: number;
  hypothesisSha256: string;
  processingState: CandidateProcessingState;
  laneRef: string | null;
  baseDecisionRef: string | null;
  effectiveDecisionRef: string | null;
  humanFollowupRef: string | null;
  sourceTransitionRef: string | null;
  interruptionRef: string | null;
  supersededBySourceEpochRef: string | null;
}

export interface CandidatePoolTransitionV1 {
  transitionId: string;
  candidateRef: string | null;
  fromState: CandidateProcessingState | null;
  toState: CandidateProcessingState | null;
  fromPoolStatus: CandidatePoolStatus;
  toPoolStatus: CandidatePoolStatus;
  reason: string;
}

export interface CandidatePoolV1 {
  schemaVersion: typeof CANDIDATE_POOL_SCHEMA_VERSION;
  poolId: string;
  logicalSessionId: string;
  source: {
    sourceEpochId: string;
    sourceRunRef: string;
    sourceFingerprintSha256: string;
    sealedSourceRef: string;
  };
  hypothesisSet: {
    artifactRef: string;
    sha256: string;
    count: number;
  };
  baseline: {
    branch: string;
    headSha: string;
    workingTreeFingerprint: string;
    participantBinding: string;
  };
  status: CandidatePoolStatus;
  candidates: CandidateRecordV1[];
  transitions: CandidatePoolTransitionV1[];
}

export interface BuildCandidatePoolInput {
  logicalSessionId: string;
  sourceEpochId: string;
  sourceRunRef: string;
  sourceFingerprintSha256: string;
  sealedSourceRef: string;
  hypothesisSet: {
    artifactRef: string;
    sha256?: string;
    hypotheses: ImprovementHypothesis[];
  };
  baseline: CandidatePoolV1['baseline'];
}

const PROCESSING_STATES: readonly CandidateProcessingState[] = [
  'PENDING',
  'ACTIVE',
  'COMPLETED',
  'SOURCE_CHANGE_PENDING',
  'INTERRUPTED',
  'SUPERSEDED',
];
const POOL_STATUSES: readonly CandidatePoolStatus[] = [
  'PROCESSING',
  'SOURCE_CHANGE_BARRIER',
  'EXHAUSTED',
  'SUPERSEDED',
  'INTERRUPTED',
];
const SHA256 = /^[a-f0-9]{64}$/;

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

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function sha256(value: unknown, label: string): string {
  const result = nonEmptyString(value, label);
  if (!SHA256.test(result)) throw new Error(`${label} must be a SHA-256 hex string`);
  return result;
}

function integer(value: unknown, label: string, minimum = 0): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < minimum) {
    throw new Error(`${label} must be an integer >= ${minimum}`);
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

function parseCandidate(value: unknown, index: number): CandidateRecordV1 {
  assertObject(value, `candidates[${index}]`);
  assertExactKeys(value, [
    'candidateRef',
    'hypothesisId',
    'sourceIndex',
    'hypothesisSha256',
    'processingState',
    'laneRef',
    'baseDecisionRef',
    'effectiveDecisionRef',
    'humanFollowupRef',
    'sourceTransitionRef',
    'interruptionRef',
    'supersededBySourceEpochRef',
  ], `candidates[${index}]`);
  const sourceIndex = integer(value.sourceIndex, `candidates[${index}].sourceIndex`);
  const candidateRef = nonEmptyString(value.candidateRef, `candidates[${index}].candidateRef`);
  const hypothesisId = nonEmptyString(value.hypothesisId, `candidates[${index}].hypothesisId`);
  if (!candidateRef.endsWith(`/${hypothesisId}`)) {
    throw new Error(`candidates[${index}] candidateRef/hypothesis identity mismatch`);
  }
  const processingState = enumValue(value.processingState, PROCESSING_STATES, `candidates[${index}].processingState`);
  const candidate: CandidateRecordV1 = {
    candidateRef,
    hypothesisId,
    sourceIndex,
    hypothesisSha256: sha256(value.hypothesisSha256, `candidates[${index}].hypothesisSha256`),
    processingState,
    laneRef: nullableString(value.laneRef, `candidates[${index}].laneRef`),
    baseDecisionRef: nullableString(value.baseDecisionRef, `candidates[${index}].baseDecisionRef`),
    effectiveDecisionRef: nullableString(value.effectiveDecisionRef, `candidates[${index}].effectiveDecisionRef`),
    humanFollowupRef: nullableString(value.humanFollowupRef, `candidates[${index}].humanFollowupRef`),
    sourceTransitionRef: nullableString(value.sourceTransitionRef, `candidates[${index}].sourceTransitionRef`),
    interruptionRef: nullableString(value.interruptionRef, `candidates[${index}].interruptionRef`),
    supersededBySourceEpochRef: nullableString(value.supersededBySourceEpochRef, `candidates[${index}].supersededBySourceEpochRef`),
  };
  if ((processingState === 'COMPLETED' || processingState === 'SOURCE_CHANGE_PENDING') && candidate.effectiveDecisionRef === null) {
    throw new Error(`candidates[${index}] ${processingState} requires effectiveDecisionRef`);
  }
  if (processingState === 'SUPERSEDED' && candidate.supersededBySourceEpochRef === null) {
    throw new Error(`candidates[${index}] SUPERSEDED requires supersededBySourceEpochRef`);
  }
  if (processingState === 'INTERRUPTED' && candidate.interruptionRef === null) {
    throw new Error(`candidates[${index}] INTERRUPTED requires interruptionRef`);
  }
  return candidate;
}

function parseTransition(value: unknown, index: number): CandidatePoolTransitionV1 {
  assertObject(value, `transitions[${index}]`);
  assertExactKeys(value, [
    'transitionId',
    'candidateRef',
    'fromState',
    'toState',
    'fromPoolStatus',
    'toPoolStatus',
    'reason',
  ], `transitions[${index}]`);
  const fromState = value.fromState === null ? null : enumValue(value.fromState, PROCESSING_STATES, `transitions[${index}].fromState`);
  const toState = value.toState === null ? null : enumValue(value.toState, PROCESSING_STATES, `transitions[${index}].toState`);
  return {
    transitionId: nonEmptyString(value.transitionId, `transitions[${index}].transitionId`),
    candidateRef: value.candidateRef === null ? null : nonEmptyString(value.candidateRef, `transitions[${index}].candidateRef`),
    fromState,
    toState,
    fromPoolStatus: enumValue(value.fromPoolStatus, POOL_STATUSES, `transitions[${index}].fromPoolStatus`),
    toPoolStatus: enumValue(value.toPoolStatus, POOL_STATUSES, `transitions[${index}].toPoolStatus`),
    reason: nonEmptyString(value.reason, `transitions[${index}].reason`),
  };
}

export function parseCandidatePoolV1(value: unknown): CandidatePoolV1 {
  assertObject(value, 'candidate pool');
  assertExactKeys(value, [
    'schemaVersion',
    'poolId',
    'logicalSessionId',
    'source',
    'hypothesisSet',
    'baseline',
    'status',
    'candidates',
    'transitions',
  ], 'candidate pool');
  if (value.schemaVersion !== CANDIDATE_POOL_SCHEMA_VERSION) throw new Error(`candidate pool schemaVersion must be ${CANDIDATE_POOL_SCHEMA_VERSION}`);
  assertObject(value.source, 'candidate pool.source');
  assertExactKeys(value.source, ['sourceEpochId', 'sourceRunRef', 'sourceFingerprintSha256', 'sealedSourceRef'], 'candidate pool.source');
  assertObject(value.hypothesisSet, 'candidate pool.hypothesisSet');
  assertExactKeys(value.hypothesisSet, ['artifactRef', 'sha256', 'count'], 'candidate pool.hypothesisSet');
  assertObject(value.baseline, 'candidate pool.baseline');
  assertExactKeys(value.baseline, ['branch', 'headSha', 'workingTreeFingerprint', 'participantBinding'], 'candidate pool.baseline');
  if (!Array.isArray(value.candidates)) throw new Error('candidate pool.candidates must be an array');
  if (!Array.isArray(value.transitions)) throw new Error('candidate pool.transitions must be an array');
  const source = {
    sourceEpochId: nonEmptyString(value.source.sourceEpochId, 'candidate pool.source.sourceEpochId'),
    sourceRunRef: nonEmptyString(value.source.sourceRunRef, 'candidate pool.source.sourceRunRef'),
    sourceFingerprintSha256: sha256(value.source.sourceFingerprintSha256, 'candidate pool.source.sourceFingerprintSha256'),
    sealedSourceRef: nonEmptyString(value.source.sealedSourceRef, 'candidate pool.source.sealedSourceRef'),
  };
  const hypothesisSet = {
    artifactRef: nonEmptyString(value.hypothesisSet.artifactRef, 'candidate pool.hypothesisSet.artifactRef'),
    sha256: sha256(value.hypothesisSet.sha256, 'candidate pool.hypothesisSet.sha256'),
    count: integer(value.hypothesisSet.count, 'candidate pool.hypothesisSet.count'),
  };
  const baseline = {
    branch: nonEmptyString(value.baseline.branch, 'candidate pool.baseline.branch'),
    headSha: nonEmptyString(value.baseline.headSha, 'candidate pool.baseline.headSha'),
    workingTreeFingerprint: sha256(value.baseline.workingTreeFingerprint, 'candidate pool.baseline.workingTreeFingerprint'),
    participantBinding: nonEmptyString(value.baseline.participantBinding, 'candidate pool.baseline.participantBinding'),
  };
  const candidates = value.candidates.map(parseCandidate);
  if (hypothesisSet.count !== candidates.length) throw new Error('candidate pool hypothesis count does not match candidates');
  const seenIds = new Set<string>();
  const seenIndexes = new Set<number>();
  for (const [index, candidate] of candidates.entries()) {
    if (candidate.sourceIndex !== index) throw new Error('candidate sourceIndex/order mismatch');
    if (seenIds.has(candidate.hypothesisId)) throw new Error('duplicate hypothesisId');
    if (seenIndexes.has(candidate.sourceIndex)) throw new Error('duplicate sourceIndex');
    seenIds.add(candidate.hypothesisId);
    seenIndexes.add(candidate.sourceIndex);
  }
  const transitions = value.transitions.map(parseTransition);
  const status = enumValue(value.status, POOL_STATUSES, 'candidate pool.status');
  const active = candidates.filter(candidate => candidate.processingState === 'ACTIVE');
  if (active.length > 1) throw new Error('candidate pool cannot contain more than one ACTIVE candidate');
  if (status === 'EXHAUSTED' && candidates.some(candidate => candidate.processingState === 'PENDING' || candidate.processingState === 'ACTIVE')) {
    throw new Error('EXHAUSTED pool cannot contain PENDING or ACTIVE candidates');
  }
  if (status === 'SOURCE_CHANGE_BARRIER' && !candidates.some(candidate => candidate.processingState === 'SOURCE_CHANGE_PENDING')) {
    throw new Error('SOURCE_CHANGE_BARRIER requires a SOURCE_CHANGE_PENDING candidate');
  }
  if (status === 'INTERRUPTED' && !candidates.some(candidate => candidate.processingState === 'INTERRUPTED')) {
    throw new Error('INTERRUPTED pool requires an INTERRUPTED candidate');
  }
  return {
    schemaVersion: CANDIDATE_POOL_SCHEMA_VERSION,
    poolId: nonEmptyString(value.poolId, 'candidate pool.poolId'),
    logicalSessionId: nonEmptyString(value.logicalSessionId, 'candidate pool.logicalSessionId'),
    source,
    hypothesisSet,
    baseline,
    status,
    candidates,
    transitions,
  };
}

export function buildCandidatePoolV1(input: BuildCandidatePoolInput): CandidatePoolV1 {
  const hypothesisSetSha256 = input.hypothesisSet.sha256 ?? sha256Hex(canonicalJson(input.hypothesisSet.hypotheses));
  const poolIdentity = canonicalJson({
    logicalSessionId: input.logicalSessionId,
    sourceRunRef: input.sourceRunRef,
    sourceFingerprintSha256: input.sourceFingerprintSha256,
    hypothesisSetSha256,
  });
  const poolId = `candidate-pool-${sha256Hex(poolIdentity)}`;
  const pool: CandidatePoolV1 = {
    schemaVersion: CANDIDATE_POOL_SCHEMA_VERSION,
    poolId,
    logicalSessionId: input.logicalSessionId,
    source: {
      sourceEpochId: input.sourceEpochId,
      sourceRunRef: input.sourceRunRef,
      sourceFingerprintSha256: input.sourceFingerprintSha256,
      sealedSourceRef: input.sealedSourceRef,
    },
    hypothesisSet: {
      artifactRef: input.hypothesisSet.artifactRef,
      sha256: hypothesisSetSha256,
      count: input.hypothesisSet.hypotheses.length,
    },
    baseline: { ...input.baseline },
    status: 'PROCESSING',
    candidates: input.hypothesisSet.hypotheses.map((hypothesis, sourceIndex) => ({
      candidateRef: `${poolId}/${hypothesis.hypothesisId}`,
      hypothesisId: hypothesis.hypothesisId,
      sourceIndex,
      hypothesisSha256: sha256Hex(canonicalJson(hypothesis)),
      processingState: 'PENDING',
      laneRef: null,
      baseDecisionRef: null,
      effectiveDecisionRef: null,
      humanFollowupRef: null,
      sourceTransitionRef: null,
      interruptionRef: null,
      supersededBySourceEpochRef: null,
    })),
    transitions: [],
  };
  return parseCandidatePoolV1(pool);
}
