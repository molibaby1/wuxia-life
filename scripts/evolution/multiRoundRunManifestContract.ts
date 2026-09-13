import { readFile, readdir, lstat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export const MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION = 'multi-round-run-manifest-v1' as const;
export const MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION = 'multi-round-session-summary-v1' as const;
export const MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION_V2 = 'multi-round-run-manifest-v2' as const;
export const MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION_V2 = 'multi-round-session-summary-v2' as const;
export const RUN_MANIFEST_FILE_NAME = 'run-manifest.json' as const;

export interface MultiRoundVerificationResultV1 {
  name: string;
  status: 'passed' | 'failed';
  details: string;
}

export interface RoundManifestEntry {
  round: 1 | 2;
  workflowRef: string;
  sourceRunRef: string;
  terminalRoute: string | null;
  executionRef: string | null;
  resultingRunRef: string | null;
  nextAction: 'CONFIGURATION_EXECUTION' | 'ROUND_2' | 'STOP';
}

export interface RoundManifestEntryV2 {
  round: 1 | 2;
  workflowRef: string;
  sourceRunRef: string;
  baseTerminalRoute: string | null;
  baseReasonCode: string | null;
  continuationRef: string | null;
  effectiveTerminalRoute: string | null;
  effectiveReasonCode: string | null;
  executionRef: string | null;
  resultingRunRef: string | null;
  nextAction: 'CONFIGURATION_EXECUTION' | 'ROUND_2' | 'STOP';
}

export interface ReviewContinuationManifestEntryV2 {
  round: 1 | 2;
  continuationRef: string;
  participantJobs: 1 | 2;
  terminalStatus: 'completed' | 'participant_failure';
  terminalRoute: string;
  decisionRef: string | null;
}

export interface MultiRoundRunManifestV1 {
  schemaVersion: typeof MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION;
  multiRoundRunRef: string;
  initialSourceRunRef: string;
  limits: {
    maxAgentRounds: 2;
    maxCrossRoundTransitions: 1;
    maxRoundParticipantJobs: 4;
    maxExecutionParticipantJobs: 1;
    maxTotalParticipantJobs: 9;
    retryCount: 0;
  };
  rounds: RoundManifestEntry[];
  execution: {
    executionRef: string;
    allowedWritePaths: string[];
    actualChangedFiles: string[];
    status: 'completed' | 'failed' | 'scope_violation' | 'not_started';
    verificationResults: MultiRoundVerificationResultV1[];
    resultingRunRef: string | null;
  };
  budget: {
    round1ParticipantJobs: number;
    executionParticipantJobs: number;
    round2ParticipantJobs: number;
    totalParticipantJobs: number;
    retryCount: 0;
  };
  outcome: 'CROSS_ROUND_TRANSITION_OBSERVED' | 'NO_CROSS_ROUND_TRANSITION_OBSERVED' | 'STOPPED';
  stopReason: string;
}

export interface MultiRoundSessionSummaryV1 {
  schemaVersion: typeof MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION;
  multiRoundRunRef: string;
  outcome: MultiRoundRunManifestV1['outcome'];
  stopReason: string;
  roundCount: number;
  crossRoundTransitions: 0 | 1;
  lastRoundTerminalRoute: string | null;
  execution: {
    executionRef: string;
    status: MultiRoundRunManifestV1['execution']['status'];
    actualChangedFiles: string[];
    resultingRunRef: string | null;
  };
}

export interface MultiRoundRunManifestV2 {
  schemaVersion: typeof MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION_V2;
  multiRoundRunRef: string;
  initialSourceRunRef: string;
  limits: {
    maxAgentRounds: 2;
    maxCrossRoundTransitions: 1;
    maxRoundParticipantJobs: 4;
    maxReviewContinuations: 1;
    maxReviewContinuationParticipantJobs: 2;
    maxExecutionParticipantJobs: 1;
    maxTotalParticipantJobs: 11;
    retryCount: 0;
  };
  rounds: RoundManifestEntryV2[];
  reviewContinuations: ReviewContinuationManifestEntryV2[];
  execution: MultiRoundRunManifestV1['execution'];
  budget: {
    round1ParticipantJobs: number;
    reviewContinuationParticipantJobs: number;
    executionParticipantJobs: number;
    round2ParticipantJobs: number;
    totalParticipantJobs: number;
    retryCount: 0;
  };
  outcome: MultiRoundRunManifestV1['outcome'];
  stopReason: string;
}

export interface MultiRoundSessionSummaryV2 {
  schemaVersion: typeof MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION_V2;
  multiRoundRunRef: string;
  outcome: MultiRoundRunManifestV2['outcome'];
  stopReason: string;
  roundCount: number;
  crossRoundTransitions: 0 | 1;
  rounds: Array<{
    round: 1 | 2;
    baseTerminalRoute: string | null;
    baseReasonCode: string | null;
    continuationRef: string | null;
    effectiveTerminalRoute: string | null;
    effectiveReasonCode: string | null;
  }>;
  reviewContinuationCount: 0 | 1;
  reviewContinuationParticipantJobs: number;
  lastRoundTerminalRoute: string | null;
  execution: {
    executionRef: string;
    status: MultiRoundRunManifestV2['execution']['status'];
    actualChangedFiles: string[];
    resultingRunRef: string | null;
  };
}

export type MultiRoundRunManifest = MultiRoundRunManifestV1 | MultiRoundRunManifestV2;
export type MultiRoundSessionSummary = MultiRoundSessionSummaryV1 | MultiRoundSessionSummaryV2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type RecordValue = Record<string, unknown>;

function assertExactKeys(value: RecordValue, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
  }
  for (const key of allowed) {
    if (!(key in value)) throw new Error(`${label} is missing field: ${key}`);
  }
}

function requireString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`invalid multi-round run manifest: ${label} must be a non-empty string`);
  }
  return value;
}

function requireStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string')) {
    throw new Error(`invalid multi-round run manifest: ${label} must be a string array`);
  }
  return value as string[];
}

function parseRoundEntry(value: unknown, index: number): RoundManifestEntry {
  if (!isRecord(value)) {
    throw new Error(`invalid multi-round run manifest: rounds[${index}] must be an object`);
  }
  const round = value.round;
  if (round !== 1 && round !== 2) {
    throw new Error(`invalid multi-round run manifest: rounds[${index}].round must be 1 or 2`);
  }
  const nextAction = value.nextAction;
  if (
    nextAction !== 'CONFIGURATION_EXECUTION'
    && nextAction !== 'ROUND_2'
    && nextAction !== 'STOP'
  ) {
    throw new Error(`invalid multi-round run manifest: rounds[${index}].nextAction is unsupported`);
  }
  const terminalRoute = value.terminalRoute;
  if (!(terminalRoute === null || typeof terminalRoute === 'string')) {
    throw new Error(`invalid multi-round run manifest: rounds[${index}].terminalRoute must be string|null`);
  }
  const executionRef = value.executionRef;
  if (!(executionRef === null || typeof executionRef === 'string')) {
    throw new Error(`invalid multi-round run manifest: rounds[${index}].executionRef must be string|null`);
  }
  const resultingRunRef = value.resultingRunRef;
  if (!(resultingRunRef === null || typeof resultingRunRef === 'string')) {
    throw new Error(`invalid multi-round run manifest: rounds[${index}].resultingRunRef must be string|null`);
  }
  return {
    round,
    workflowRef: requireString(value, 'workflowRef', `rounds[${index}].workflowRef`),
    sourceRunRef: requireString(value, 'sourceRunRef', `rounds[${index}].sourceRunRef`),
    terminalRoute,
    executionRef,
    resultingRunRef,
    nextAction,
  };
}

const V2_LIMIT_KEYS = [
  'maxAgentRounds',
  'maxCrossRoundTransitions',
  'maxRoundParticipantJobs',
  'maxReviewContinuations',
  'maxReviewContinuationParticipantJobs',
  'maxExecutionParticipantJobs',
  'maxTotalParticipantJobs',
  'retryCount',
] as const;
const V2_BUDGET_KEYS = [
  'round1ParticipantJobs',
  'reviewContinuationParticipantJobs',
  'executionParticipantJobs',
  'round2ParticipantJobs',
  'totalParticipantJobs',
  'retryCount',
] as const;
const V2_ROUND_KEYS = [
  'round',
  'workflowRef',
  'sourceRunRef',
  'baseTerminalRoute',
  'baseReasonCode',
  'continuationRef',
  'effectiveTerminalRoute',
  'effectiveReasonCode',
  'executionRef',
  'resultingRunRef',
  'nextAction',
] as const;
const V2_CONTINUATION_KEYS = [
  'round',
  'continuationRef',
  'participantJobs',
  'terminalStatus',
  'terminalRoute',
  'decisionRef',
] as const;
const V2_ROOT_KEYS = [
  'schemaVersion',
  'multiRoundRunRef',
  'initialSourceRunRef',
  'limits',
  'rounds',
  'reviewContinuations',
  'execution',
  'budget',
  'outcome',
  'stopReason',
] as const;

function nullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return requireString({ value }, 'value', label);
}

function fixedNumber(value: unknown, expected: number, label: string): number {
  if (value !== expected) throw new Error(`invalid multi-round run manifest: ${label} must be ${expected}`);
  return expected;
}

function boundedInteger(value: unknown, min: number, max: number, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`invalid multi-round run manifest: ${label} must be an integer from ${min} to ${max}`);
  }
  return value;
}

function parseV2Limits(value: unknown): MultiRoundRunManifestV2['limits'] {
  if (!isRecord(value)) throw new Error('invalid multi-round run manifest: limits must be an object');
  assertExactKeys(value, V2_LIMIT_KEYS, 'multi-round run manifest.limits');
  fixedNumber(value.maxAgentRounds, 2, 'limits.maxAgentRounds');
  fixedNumber(value.maxCrossRoundTransitions, 1, 'limits.maxCrossRoundTransitions');
  fixedNumber(value.maxRoundParticipantJobs, 4, 'limits.maxRoundParticipantJobs');
  fixedNumber(value.maxReviewContinuations, 1, 'limits.maxReviewContinuations');
  fixedNumber(value.maxReviewContinuationParticipantJobs, 2, 'limits.maxReviewContinuationParticipantJobs');
  fixedNumber(value.maxExecutionParticipantJobs, 1, 'limits.maxExecutionParticipantJobs');
  fixedNumber(value.maxTotalParticipantJobs, 11, 'limits.maxTotalParticipantJobs');
  fixedNumber(value.retryCount, 0, 'limits.retryCount');
  return {
    maxAgentRounds: 2,
    maxCrossRoundTransitions: 1,
    maxRoundParticipantJobs: 4,
    maxReviewContinuations: 1,
    maxReviewContinuationParticipantJobs: 2,
    maxExecutionParticipantJobs: 1,
    maxTotalParticipantJobs: 11,
    retryCount: 0,
  };
}

function parseV2Budget(value: unknown): MultiRoundRunManifestV2['budget'] {
  if (!isRecord(value)) throw new Error('invalid multi-round run manifest: budget must be an object');
  assertExactKeys(value, V2_BUDGET_KEYS, 'multi-round run manifest.budget');
  const round1ParticipantJobs = boundedInteger(value.round1ParticipantJobs, 0, 4, 'budget.round1ParticipantJobs');
  const reviewContinuationParticipantJobs = boundedInteger(value.reviewContinuationParticipantJobs, 0, 2, 'budget.reviewContinuationParticipantJobs');
  const executionParticipantJobs = boundedInteger(value.executionParticipantJobs, 0, 1, 'budget.executionParticipantJobs');
  const round2ParticipantJobs = boundedInteger(value.round2ParticipantJobs, 0, 4, 'budget.round2ParticipantJobs');
  const totalParticipantJobs = boundedInteger(value.totalParticipantJobs, 0, 11, 'budget.totalParticipantJobs');
  fixedNumber(value.retryCount, 0, 'budget.retryCount');
  if (totalParticipantJobs !== round1ParticipantJobs + reviewContinuationParticipantJobs + executionParticipantJobs + round2ParticipantJobs) {
    throw new Error('invalid multi-round run manifest: budget.totalParticipantJobs must equal component counts');
  }
  return {
    round1ParticipantJobs,
    reviewContinuationParticipantJobs,
    executionParticipantJobs,
    round2ParticipantJobs,
    totalParticipantJobs,
    retryCount: 0,
  };
}

function parseV2RoundEntry(value: unknown, index: number): RoundManifestEntryV2 {
  if (!isRecord(value)) throw new Error(`invalid multi-round run manifest: rounds[${index}] must be an object`);
  assertExactKeys(value, V2_ROUND_KEYS, `multi-round run manifest.rounds[${index}]`);
  if (value.round !== 1 && value.round !== 2) throw new Error(`invalid multi-round run manifest: rounds[${index}].round must be 1 or 2`);
  const nextAction = value.nextAction;
  if (nextAction !== 'CONFIGURATION_EXECUTION' && nextAction !== 'ROUND_2' && nextAction !== 'STOP') {
    throw new Error(`invalid multi-round run manifest: rounds[${index}].nextAction is unsupported`);
  }
  const continuationRef = nullableString(value.continuationRef, `rounds[${index}].continuationRef`);
  return {
    round: value.round,
    workflowRef: requireString(value, 'workflowRef', `rounds[${index}].workflowRef`),
    sourceRunRef: requireString(value, 'sourceRunRef', `rounds[${index}].sourceRunRef`),
    baseTerminalRoute: nullableString(value.baseTerminalRoute, `rounds[${index}].baseTerminalRoute`),
    baseReasonCode: nullableString(value.baseReasonCode, `rounds[${index}].baseReasonCode`),
    continuationRef,
    effectiveTerminalRoute: nullableString(value.effectiveTerminalRoute, `rounds[${index}].effectiveTerminalRoute`),
    effectiveReasonCode: nullableString(value.effectiveReasonCode, `rounds[${index}].effectiveReasonCode`),
    executionRef: nullableString(value.executionRef, `rounds[${index}].executionRef`),
    resultingRunRef: nullableString(value.resultingRunRef, `rounds[${index}].resultingRunRef`),
    nextAction,
  };
}

function parseV2ContinuationEntry(value: unknown, index: number): ReviewContinuationManifestEntryV2 {
  if (!isRecord(value)) throw new Error(`invalid multi-round run manifest: reviewContinuations[${index}] must be an object`);
  assertExactKeys(value, V2_CONTINUATION_KEYS, `multi-round run manifest.reviewContinuations[${index}]`);
  if (value.round !== 1 && value.round !== 2) throw new Error(`invalid multi-round run manifest: reviewContinuations[${index}].round must be 1 or 2`);
  const participantJobs = value.participantJobs;
  if (participantJobs !== 1 && participantJobs !== 2) {
    throw new Error(`invalid multi-round run manifest: reviewContinuations[${index}].participantJobs must be 1 or 2`);
  }
  const terminalStatus = value.terminalStatus;
  if (terminalStatus !== 'completed' && terminalStatus !== 'participant_failure') {
    throw new Error(`invalid multi-round run manifest: reviewContinuations[${index}].terminalStatus is unsupported`);
  }
  const decisionRef = nullableString(value.decisionRef, `reviewContinuations[${index}].decisionRef`);
  if ((terminalStatus === 'completed') !== (decisionRef !== null)) {
    throw new Error(`invalid multi-round run manifest: reviewContinuations[${index}].decisionRef does not match terminalStatus`);
  }
  return {
    round: value.round,
    continuationRef: requireString(value, 'continuationRef', `reviewContinuations[${index}].continuationRef`),
    participantJobs,
    terminalStatus,
    terminalRoute: requireString(value, 'terminalRoute', `reviewContinuations[${index}].terminalRoute`),
    decisionRef,
  };
}

function parseMultiRoundRunManifestV2(raw: RecordValue): MultiRoundRunManifestV2 {
  assertExactKeys(raw, V2_ROOT_KEYS, 'multi-round run manifest');
  if (raw.schemaVersion !== MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION_V2) {
    throw new Error(`invalid multi-round run manifest: expected schemaVersion ${MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION_V2}`);
  }
  const outcome = raw.outcome;
  if (outcome !== 'CROSS_ROUND_TRANSITION_OBSERVED' && outcome !== 'NO_CROSS_ROUND_TRANSITION_OBSERVED' && outcome !== 'STOPPED') {
    throw new Error('invalid multi-round run manifest: outcome is unsupported');
  }
  if (!Array.isArray(raw.rounds) || raw.rounds.length === 0) {
    throw new Error('invalid multi-round run manifest: rounds must be a non-empty array');
  }
  if (!Array.isArray(raw.reviewContinuations)) {
    throw new Error('invalid multi-round run manifest: reviewContinuations must be an array');
  }
  if (raw.reviewContinuations.length > 1) {
    throw new Error('invalid multi-round run manifest: reviewContinuations must contain at most one entry');
  }
  const rounds = raw.rounds.map(parseV2RoundEntry);
  const reviewContinuations = raw.reviewContinuations.map(parseV2ContinuationEntry);
  const continuationRefs = new Set(reviewContinuations.map(entry => entry.continuationRef));
  if (reviewContinuations.length === 1) {
    const continuation = reviewContinuations[0]!;
    if (continuation.continuationRef !== 'review-continuation-000001') {
      throw new Error(
        'invalid multi-round run manifest: reviewContinuations[0].continuationRef must be review-continuation-000001',
      );
    }
  }
  for (const [index, round] of rounds.entries()) {
    if (round.continuationRef !== null && !continuationRefs.has(round.continuationRef)) {
      throw new Error(`invalid multi-round run manifest: rounds[${index}].continuationRef must reference reviewContinuations`);
    }
    if (round.continuationRef !== null) {
      const continuation = reviewContinuations.find(entry => entry.continuationRef === round.continuationRef)!;
      if (continuation.round !== round.round) {
        throw new Error(`invalid multi-round run manifest: reviewContinuations[0].round must equal rounds[${index}].round`);
      }
      if (round.baseTerminalRoute !== 'DEFER_MORE_WORK_REQUESTED') {
        throw new Error(`invalid multi-round run manifest: rounds[${index}].baseTerminalRoute must be DEFER_MORE_WORK_REQUESTED for a continuation`);
      }
      if (round.effectiveTerminalRoute !== continuation.terminalRoute) {
        throw new Error(`invalid multi-round run manifest: rounds[${index}].effectiveTerminalRoute must equal reviewContinuations[0].terminalRoute`);
      }
    }
  }
  if (reviewContinuations.length === 1 && !rounds.some(round => round.continuationRef === reviewContinuations[0]!.continuationRef)) {
    throw new Error('invalid multi-round run manifest: reviewContinuations[0] must be referenced by a round');
  }
  if (reviewContinuations.length === 1) {
    const continuation = reviewContinuations[0]!;
    if (continuation.terminalStatus === 'completed' && continuation.decisionRef !== 'review-continuation-000001/decision.json') {
      throw new Error(
        'invalid multi-round run manifest: reviewContinuations[0].decisionRef must be review-continuation-000001/decision.json for completed continuation',
      );
    }
    if (continuation.terminalStatus === 'participant_failure' && continuation.terminalRoute !== 'PARTICIPANT_FAILURE') {
      throw new Error(
        'invalid multi-round run manifest: reviewContinuations[0].terminalRoute must be PARTICIPANT_FAILURE for participant_failure',
      );
    }
  }
  const limits = parseV2Limits(raw.limits);
  const budget = parseV2Budget(raw.budget);
  if (budget.reviewContinuationParticipantJobs > 0 && reviewContinuations.length !== 1) {
    throw new Error('invalid multi-round run manifest: continuation budget requires one reviewContinuations entry');
  }
  if (budget.reviewContinuationParticipantJobs === 0 && reviewContinuations.length !== 0) {
    throw new Error('invalid multi-round run manifest: reviewContinuations require continuation budget');
  }
  if (reviewContinuations.length === 1 && budget.reviewContinuationParticipantJobs !== reviewContinuations[0]!.participantJobs) {
    throw new Error('invalid multi-round run manifest: continuation budget does not match reviewContinuations');
  }
  return {
    schemaVersion: MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION_V2,
    multiRoundRunRef: requireString(raw, 'multiRoundRunRef', 'multiRoundRunRef'),
    initialSourceRunRef: requireString(raw, 'initialSourceRunRef', 'initialSourceRunRef'),
    limits,
    rounds,
    reviewContinuations,
    execution: parseExecution(raw.execution),
    budget,
    outcome,
    stopReason: requireString(raw, 'stopReason', 'stopReason'),
  };
}

function parseExecution(value: unknown): MultiRoundRunManifestV1['execution'] {
  if (!isRecord(value)) {
    throw new Error('invalid multi-round run manifest: execution must be an object');
  }
  const status = value.status;
  if (
    status !== 'completed'
    && status !== 'failed'
    && status !== 'scope_violation'
    && status !== 'not_started'
  ) {
    throw new Error('invalid multi-round run manifest: execution.status is unsupported');
  }
  const resultingRunRef = value.resultingRunRef;
  if (!(resultingRunRef === null || typeof resultingRunRef === 'string')) {
    throw new Error('invalid multi-round run manifest: execution.resultingRunRef must be string|null');
  }
  if (!Array.isArray(value.verificationResults)) {
    throw new Error('invalid multi-round run manifest: execution.verificationResults must be an array');
  }
  return {
    executionRef: requireString(value, 'executionRef', 'execution.executionRef'),
    allowedWritePaths: requireStringArray(value.allowedWritePaths, 'execution.allowedWritePaths'),
    actualChangedFiles: requireStringArray(value.actualChangedFiles, 'execution.actualChangedFiles'),
    status,
    verificationResults: value.verificationResults as MultiRoundVerificationResultV1[],
    resultingRunRef,
  };
}

/**
 * Fail-closed parser for multi-round-run-manifest-v1.
 * Validates fields required by session observability.
 */
export function parseMultiRoundRunManifest(raw: unknown): MultiRoundRunManifest {
  if (!isRecord(raw)) {
    throw new Error('invalid multi-round run manifest: must be an object');
  }
  if (raw.schemaVersion === MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION_V2) {
    return parseMultiRoundRunManifestV2(raw);
  }
  if (raw.schemaVersion !== MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION) {
    throw new Error(
      `invalid multi-round run manifest: expected schemaVersion ${MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION}, got ${String(raw.schemaVersion)}`,
    );
  }
  const outcome = raw.outcome;
  if (
    outcome !== 'CROSS_ROUND_TRANSITION_OBSERVED'
    && outcome !== 'NO_CROSS_ROUND_TRANSITION_OBSERVED'
    && outcome !== 'STOPPED'
  ) {
    throw new Error('invalid multi-round run manifest: outcome is unsupported');
  }
  if (!Array.isArray(raw.rounds) || raw.rounds.length === 0) {
    throw new Error('invalid multi-round run manifest: rounds must be a non-empty array');
  }
  if (!isRecord(raw.limits) || !isRecord(raw.budget)) {
    throw new Error('invalid multi-round run manifest: limits and budget are required');
  }

  return {
    schemaVersion: MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION,
    multiRoundRunRef: requireString(raw, 'multiRoundRunRef', 'multiRoundRunRef'),
    initialSourceRunRef: requireString(raw, 'initialSourceRunRef', 'initialSourceRunRef'),
    limits: raw.limits as MultiRoundRunManifestV1['limits'],
    rounds: raw.rounds.map(parseRoundEntry),
    execution: parseExecution(raw.execution),
    budget: raw.budget as MultiRoundRunManifestV1['budget'],
    outcome,
    stopReason: requireString(raw, 'stopReason', 'stopReason'),
  };
}

export async function readMultiRoundRunManifest(manifestPath: string): Promise<MultiRoundRunManifest> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(manifestPath, 'utf8')) as unknown;
  } catch (error) {
    throw new Error(`unable to read multi-round run manifest at ${manifestPath}: ${String(error)}`);
  }
  return parseMultiRoundRunManifest(parsed);
}

/**
 * Pure projection of validated multi-round run-manifest.json into session observability facts.
 * Does not synthesize a single terminalOutcome.
 */
export function buildMultiRoundSessionSummary(
  manifest: MultiRoundRunManifest,
): MultiRoundSessionSummary {
  if (manifest.schemaVersion === MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION_V2) {
    const lastRound = manifest.rounds[manifest.rounds.length - 1];
    return {
      schemaVersion: MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION_V2,
      multiRoundRunRef: manifest.multiRoundRunRef,
      outcome: manifest.outcome,
      stopReason: manifest.stopReason,
      roundCount: manifest.rounds.length,
      crossRoundTransitions: manifest.rounds.some(round => round.round === 2) ? 1 : 0,
      rounds: manifest.rounds.map(round => ({
        round: round.round,
        baseTerminalRoute: round.baseTerminalRoute,
        baseReasonCode: round.baseReasonCode,
        continuationRef: round.continuationRef,
        effectiveTerminalRoute: round.effectiveTerminalRoute,
        effectiveReasonCode: round.effectiveReasonCode,
      })),
      reviewContinuationCount: manifest.reviewContinuations.length === 1 ? 1 : 0,
      reviewContinuationParticipantJobs: manifest.budget.reviewContinuationParticipantJobs,
      lastRoundTerminalRoute: lastRound?.effectiveTerminalRoute ?? null,
      execution: {
        executionRef: manifest.execution.executionRef,
        status: manifest.execution.status,
        actualChangedFiles: [...manifest.execution.actualChangedFiles],
        resultingRunRef: manifest.execution.resultingRunRef,
      },
    };
  }
  const lastRound = manifest.rounds[manifest.rounds.length - 1];
  return {
    schemaVersion: MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION,
    multiRoundRunRef: manifest.multiRoundRunRef,
    outcome: manifest.outcome,
    stopReason: manifest.stopReason,
    roundCount: manifest.rounds.length,
    crossRoundTransitions: manifest.rounds.some(round => round.round === 2) ? 1 : 0,
    lastRoundTerminalRoute: lastRound?.terminalRoute ?? null,
    execution: {
      executionRef: manifest.execution.executionRef,
      status: manifest.execution.status,
      actualChangedFiles: [...manifest.execution.actualChangedFiles],
      resultingRunRef: manifest.execution.resultingRunRef,
    },
  };
}

/**
 * Bounded session-manifest discovery for archive roots.
 * - 0 → null (legacy workflow-only)
 * - 1 → absolute path
 * - >1 → fail closed (no guessing)
 */
export async function discoverMultiRoundRunManifestPath(
  archiveRoot: string,
): Promise<string | null> {
  const root = resolve(archiveRoot);
  const direct = join(root, RUN_MANIFEST_FILE_NAME);
  try {
    const directStat = await lstat(direct);
    if (directStat.isFile()) return direct;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  const found: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = join(root, entry.name, RUN_MANIFEST_FILE_NAME);
    try {
      const stat = await lstat(candidate);
      if (stat.isFile()) found.push(candidate);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  if (found.length === 0) return null;
  if (found.length > 1) {
    throw new Error(
      `ambiguous multi-round session manifests under archive root (${found.length}): ${found.join(', ')}`,
    );
  }
  return found[0]!;
}

/** Durable session semantics for content-addressed report identity (no createdAt / absolute paths). */
export function durableMultiRoundSessionSemantics(
  summary: MultiRoundSessionSummary,
): Record<string, unknown> {
  const base = {
    schemaVersion: summary.schemaVersion,
    multiRoundRunRef: summary.multiRoundRunRef,
    outcome: summary.outcome,
    stopReason: summary.stopReason,
    roundCount: summary.roundCount,
    crossRoundTransitions: summary.crossRoundTransitions,
    lastRoundTerminalRoute: summary.lastRoundTerminalRoute,
    execution: {
      executionRef: summary.execution.executionRef,
      status: summary.execution.status,
      actualChangedFiles: summary.execution.actualChangedFiles,
      resultingRunRef: summary.execution.resultingRunRef,
    },
  };
  if (summary.schemaVersion === MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION) return base;
  return {
    ...base,
    rounds: summary.rounds,
    reviewContinuationCount: summary.reviewContinuationCount,
    reviewContinuationParticipantJobs: summary.reviewContinuationParticipantJobs,
  };
}
