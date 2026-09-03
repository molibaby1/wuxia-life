import { readFile, readdir, lstat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export const MULTI_ROUND_RUN_MANIFEST_SCHEMA_VERSION = 'multi-round-run-manifest-v1' as const;
export const MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION = 'multi-round-session-summary-v1' as const;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
export function parseMultiRoundRunManifest(raw: unknown): MultiRoundRunManifestV1 {
  if (!isRecord(raw)) {
    throw new Error('invalid multi-round run manifest: must be an object');
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

export async function readMultiRoundRunManifest(manifestPath: string): Promise<MultiRoundRunManifestV1> {
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
  manifest: MultiRoundRunManifestV1,
): MultiRoundSessionSummaryV1 {
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
  summary: MultiRoundSessionSummaryV1,
): Record<string, unknown> {
  return {
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
}
