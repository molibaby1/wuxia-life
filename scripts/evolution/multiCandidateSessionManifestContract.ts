import type { CandidatePoolStatus, CandidateProcessingState } from './candidatePoolContract';

export const MULTI_CANDIDATE_SESSION_MANIFEST_SCHEMA_VERSION = 'multi-candidate-session-manifest-v1' as const;
export const MULTI_CANDIDATE_SESSION_SUMMARY_SCHEMA_VERSION = 'multi-candidate-session-summary-v1' as const;

export type LogicalSessionState = 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'INTERRUPTED' | 'FAILED';
export type SourceEpochLifecycle = 'ANALYSIS_PENDING' | 'POOL_ACTIVE' | 'POOL_EXHAUSTED' | 'SUPERSEDED' | 'INTERRUPTED';

export interface MultiCandidateSessionLimitsV1 {
  maxParticipantJobsPerHostSlice: 11;
  maxCandidateContinuations: 1;
  maxCandidateContinuationParticipantJobs: 2;
  maxCandidateLaneParticipantJobs: 4;
  maxExecutionParticipantJobs: 1;
  maxSourceTransitions: 1;
  semanticRetryCount: 0;
}
export interface CandidateCountsV1 {
  total: number;
  pending: number;
  active: number;
  completed: number;
  superseded: number;
  interrupted: number;
}

export interface SourceEpochSummaryV1 {
  sourceEpochRef: string;
  sourceRunRef: string;
  poolRef: string;
  poolStatus: CandidatePoolStatus;
  lifecycle: SourceEpochLifecycle;
  candidateCounts: CandidateCountsV1;
  dispositionCounts: Record<string, number>;
}

export interface HostSliceSummaryV1 {
  hostSliceId: string;
  startedAt: string;
  endedAt: string | null;
  participantJobs: number;
  state: 'PROCESSING' | 'PAUSED' | 'COMPLETED' | 'INTERRUPTED' | 'FAILED';
  reason: string | null;
}

export interface MultiCandidateSessionManifestV1 {
  schemaVersion: typeof MULTI_CANDIDATE_SESSION_MANIFEST_SCHEMA_VERSION;
  logicalSessionId: string;
  sessionState: LogicalSessionState;
  pauseOrStopReason: string | null;
  limits: MultiCandidateSessionLimitsV1;
  budgetAccounting: {
    participantJobs: number;
    hostSliceCount: number;
  };
  sourceEpochs: SourceEpochSummaryV1[];
  currentSourceEpochRef: string;
  hostSlices: HostSliceSummaryV1[];
  sourceTransitionCount: 0 | 1;
  failureRef: string | null;
}

export interface MultiCandidateSessionSummaryV1 {
  schemaVersion: typeof MULTI_CANDIDATE_SESSION_SUMMARY_SCHEMA_VERSION;
  logicalSessionId: string;
  sessionState: LogicalSessionState;
  pauseOrStopReason: string | null;
  currentSourceEpochRef: string;
  sourceEpochs: SourceEpochSummaryV1[];
  hostSlices: HostSliceSummaryV1[];
  sourceTransitionCount: 0 | 1;
  failureRef: string | null;
}

const SESSION_STATES: readonly LogicalSessionState[] = ['PROCESSING', 'PAUSED', 'COMPLETED', 'INTERRUPTED', 'FAILED'];
const SLICE_STATES: readonly HostSliceSummaryV1['state'][] = ['PROCESSING', 'PAUSED', 'COMPLETED', 'INTERRUPTED', 'FAILED'];
const POOL_STATES: readonly CandidatePoolStatus[] = ['PROCESSING', 'SOURCE_CHANGE_BARRIER', 'EXHAUSTED', 'SUPERSEDED', 'INTERRUPTED'];
const CANDIDATE_STATES: readonly CandidateProcessingState[] = ['PENDING', 'ACTIVE', 'COMPLETED', 'SOURCE_CHANGE_PENDING', 'INTERRUPTED', 'SUPERSEDED'];
type RecordValue = Record<string, unknown>;

function assertObject(value: unknown, label: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
}
function assertExactKeys(value: RecordValue, allowed: readonly string[], label: string): void {
  const set = new Set(allowed);
  for (const key of Object.keys(value)) if (!set.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
  for (const key of allowed) if (!(key in value)) throw new Error(`${label} is missing field: ${key}`);
}
function stringValue(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}
function nullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return stringValue(value, label);
}
function integer(value: unknown, label: string, max?: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || (max !== undefined && value > max)) {
    throw new Error(`${label} must be an integer from 0 to ${max ?? 'infinity'}`);
  }
  return value;
}
function enumValue<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== 'string' || !values.includes(value as T)) throw new Error(`${label} has invalid value: ${String(value)}`);
  return value as T;
}
function parseCounts(value: unknown, label: string): CandidateCountsV1 {
  assertObject(value, label);
  assertExactKeys(value, ['total', 'pending', 'active', 'completed', 'superseded', 'interrupted'], label);
  const counts = {
    total: integer(value.total, `${label}.total`),
    pending: integer(value.pending, `${label}.pending`),
    active: integer(value.active, `${label}.active`),
    completed: integer(value.completed, `${label}.completed`),
    superseded: integer(value.superseded, `${label}.superseded`),
    interrupted: integer(value.interrupted, `${label}.interrupted`),
  };
  if (counts.pending + counts.active + counts.completed + counts.superseded + counts.interrupted > counts.total) {
    throw new Error(`${label} state counts exceed total`);
  }
  return counts;
}
function parseDispositionCounts(value: unknown, label: string): Record<string, number> {
  assertObject(value, label);
  const result: Record<string, number> = {};
  for (const [key, count] of Object.entries(value)) result[stringValue(key, `${label} key`)] = integer(count, `${label}.${key}`);
  return result;
}
function parseSourceEpoch(value: unknown, index: number): SourceEpochSummaryV1 {
  const label = `sourceEpochs[${index}]`;
  assertObject(value, label);
  assertExactKeys(value, ['sourceEpochRef', 'sourceRunRef', 'poolRef', 'poolStatus', 'lifecycle', 'candidateCounts', 'dispositionCounts'], label);
  return {
    sourceEpochRef: stringValue(value.sourceEpochRef, `${label}.sourceEpochRef`),
    sourceRunRef: stringValue(value.sourceRunRef, `${label}.sourceRunRef`),
    poolRef: stringValue(value.poolRef, `${label}.poolRef`),
    poolStatus: enumValue(value.poolStatus, POOL_STATES, `${label}.poolStatus`),
    lifecycle: enumValue(value.lifecycle, ['ANALYSIS_PENDING', 'POOL_ACTIVE', 'POOL_EXHAUSTED', 'SUPERSEDED', 'INTERRUPTED'], `${label}.lifecycle`),
    candidateCounts: parseCounts(value.candidateCounts, `${label}.candidateCounts`),
    dispositionCounts: parseDispositionCounts(value.dispositionCounts, `${label}.dispositionCounts`),
  };
}
function parseSlice(value: unknown, index: number): HostSliceSummaryV1 {
  const label = `hostSlices[${index}]`;
  assertObject(value, label);
  assertExactKeys(value, ['hostSliceId', 'startedAt', 'endedAt', 'participantJobs', 'state', 'reason'], label);
  return {
    hostSliceId: stringValue(value.hostSliceId, `${label}.hostSliceId`),
    startedAt: stringValue(value.startedAt, `${label}.startedAt`),
    endedAt: nullableString(value.endedAt, `${label}.endedAt`),
    participantJobs: integer(value.participantJobs, `${label}.participantJobs`, 11),
    state: enumValue(value.state, SLICE_STATES, `${label}.state`),
    reason: nullableString(value.reason, `${label}.reason`),
  };
}

const DEFAULT_LIMITS: MultiCandidateSessionLimitsV1 = {
  maxParticipantJobsPerHostSlice: 11,
  maxCandidateContinuations: 1,
  maxCandidateContinuationParticipantJobs: 2,
  maxCandidateLaneParticipantJobs: 4,
  maxExecutionParticipantJobs: 1,
  maxSourceTransitions: 1,
  semanticRetryCount: 0,
};

function parseLimits(value: unknown): MultiCandidateSessionLimitsV1 {
  assertObject(value, 'session.limits');
  assertExactKeys(value, Object.keys(DEFAULT_LIMITS), 'session.limits');
  for (const [key, expected] of Object.entries(DEFAULT_LIMITS)) if (value[key] !== expected) throw new Error(`session.limits.${key} must be ${expected}`);
  return { ...DEFAULT_LIMITS };
}

export interface BuildMultiCandidateSessionManifestInput {
  logicalSessionId: string;
  sessionState: LogicalSessionState;
  currentSourceEpochRef: string;
  sourceEpochs: Array<Omit<SourceEpochSummaryV1, 'lifecycle'> & { lifecycle?: SourceEpochLifecycle }>;
  hostSlices: HostSliceSummaryV1[];
  sourceTransitionCount: 0 | 1;
  failureRef: string | null;
  pauseOrStopReason?: string | null;
  budgetAccounting?: { participantJobs: number; hostSliceCount?: number };
}

export function parseMultiCandidateSessionManifestV1(value: unknown): MultiCandidateSessionManifestV1 {
  assertObject(value, 'multi-candidate session manifest');
  assertExactKeys(value, ['schemaVersion', 'logicalSessionId', 'sessionState', 'pauseOrStopReason', 'limits', 'budgetAccounting', 'sourceEpochs', 'currentSourceEpochRef', 'hostSlices', 'sourceTransitionCount', 'failureRef'], 'multi-candidate session manifest');
  if (value.schemaVersion !== MULTI_CANDIDATE_SESSION_MANIFEST_SCHEMA_VERSION) throw new Error(`multi-candidate session manifest schemaVersion must be ${MULTI_CANDIDATE_SESSION_MANIFEST_SCHEMA_VERSION}`);
  if (!Array.isArray(value.sourceEpochs)) throw new Error('session.sourceEpochs must be an array');
  if (!Array.isArray(value.hostSlices)) throw new Error('session.hostSlices must be an array');
  assertObject(value.budgetAccounting, 'session.budgetAccounting');
  assertExactKeys(value.budgetAccounting, ['participantJobs', 'hostSliceCount'], 'session.budgetAccounting');
  const sourceEpochs = value.sourceEpochs.map(parseSourceEpoch);
  const hostSlices = value.hostSlices.map(parseSlice);
  const currentSourceEpochRef = stringValue(value.currentSourceEpochRef, 'session.currentSourceEpochRef');
  if (!sourceEpochs.some(epoch => epoch.sourceEpochRef === currentSourceEpochRef)) throw new Error('currentSourceEpochRef does not reference a source epoch');
  const sourceTransitionCount = value.sourceTransitionCount;
  if (sourceTransitionCount !== 0 && sourceTransitionCount !== 1) throw new Error('sourceTransitionCount must be 0 or 1');
  return {
    schemaVersion: MULTI_CANDIDATE_SESSION_MANIFEST_SCHEMA_VERSION,
    logicalSessionId: stringValue(value.logicalSessionId, 'session.logicalSessionId'),
    sessionState: enumValue(value.sessionState, SESSION_STATES, 'session.sessionState'),
    pauseOrStopReason: nullableString(value.pauseOrStopReason, 'session.pauseOrStopReason'),
    limits: parseLimits(value.limits),
    budgetAccounting: {
      participantJobs: integer(value.budgetAccounting.participantJobs, 'session.budgetAccounting.participantJobs'),
      hostSliceCount: integer(value.budgetAccounting.hostSliceCount, 'session.budgetAccounting.hostSliceCount'),
    },
    sourceEpochs,
    currentSourceEpochRef,
    hostSlices,
    sourceTransitionCount,
    failureRef: nullableString(value.failureRef, 'session.failureRef'),
  };
}

export function buildMultiCandidateSessionManifestV1(input: BuildMultiCandidateSessionManifestInput): MultiCandidateSessionManifestV1 {
  return parseMultiCandidateSessionManifestV1({
    schemaVersion: MULTI_CANDIDATE_SESSION_MANIFEST_SCHEMA_VERSION,
    logicalSessionId: input.logicalSessionId,
    sessionState: input.sessionState,
    pauseOrStopReason: input.pauseOrStopReason ?? null,
    limits: DEFAULT_LIMITS,
    budgetAccounting: {
      participantJobs: input.budgetAccounting?.participantJobs ?? 0,
      hostSliceCount: input.budgetAccounting?.hostSliceCount ?? input.hostSlices.length,
    },
    sourceEpochs: input.sourceEpochs.map(epoch => ({ ...epoch, lifecycle: epoch.lifecycle ?? 'POOL_ACTIVE' })),
    currentSourceEpochRef: input.currentSourceEpochRef,
    hostSlices: input.hostSlices,
    sourceTransitionCount: input.sourceTransitionCount,
    failureRef: input.failureRef,
  });
}

export function buildMultiCandidateSessionSummaryV1(manifest: MultiCandidateSessionManifestV1): MultiCandidateSessionSummaryV1 {
  const parsed = parseMultiCandidateSessionManifestV1(manifest);
  return {
    schemaVersion: MULTI_CANDIDATE_SESSION_SUMMARY_SCHEMA_VERSION,
    logicalSessionId: parsed.logicalSessionId,
    sessionState: parsed.sessionState,
    pauseOrStopReason: parsed.pauseOrStopReason,
    currentSourceEpochRef: parsed.currentSourceEpochRef,
    sourceEpochs: parsed.sourceEpochs.map(epoch => ({ ...epoch, candidateCounts: { ...epoch.candidateCounts }, dispositionCounts: { ...epoch.dispositionCounts } })),
    hostSlices: parsed.hostSlices.map(slice => ({ ...slice })),
    sourceTransitionCount: parsed.sourceTransitionCount,
    failureRef: parsed.failureRef,
  };
}
