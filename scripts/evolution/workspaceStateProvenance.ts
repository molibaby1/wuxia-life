import { readFile } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { captureAuthoritativeFingerprint } from './problemAgnosticSolution/agentWorkspace';

export const WORKSPACE_STATE_PROVENANCE_SCHEMA_VERSION = 'workspace-state-provenance-v1' as const;
export const WORKSPACE_STATE_FINGERPRINT_METHOD = 'evolution-authority-surface-sha256-v1' as const;

export type WorkspaceStateCaptureStatus = 'available' | 'unavailable';
export type WorkspaceStateContinuity = 'MATCH' | 'MISMATCH' | 'UNKNOWN';

export type WorkspaceStateConsistencyWarning =
  | 'START_CAPTURE_UNAVAILABLE'
  | 'START_BASELINE_FINGERPRINT_NOT_COMPARABLE'
  | 'START_BASELINE_MISMATCH'
  | 'EXECUTION_BEFORE_CAPTURE_UNAVAILABLE'
  | 'EXECUTION_AFTER_CAPTURE_UNAVAILABLE'
  | 'ACTUAL_CHANGED_FILES_WITH_UNCHANGED_FINGERPRINT'
  | 'FINGERPRINT_CHANGED_WITHOUT_ACTUAL_CHANGED_FILES'
  | 'END_CAPTURE_UNAVAILABLE';

export interface WorkspaceStateCapture {
  status: WorkspaceStateCaptureStatus;
  fingerprintSha256: string | null;
}

export interface WorkspaceExecutionBoundary {
  before: WorkspaceStateCapture;
  after: WorkspaceStateCapture;
}

export interface WorkspaceStateProvenanceV1 {
  schemaVersion: typeof WORKSPACE_STATE_PROVENANCE_SCHEMA_VERSION;
  fingerprintMethod: typeof WORKSPACE_STATE_FINGERPRINT_METHOD;
  workspaceRootRef: string;
  start: WorkspaceStateCapture;
  executionBoundary: WorkspaceExecutionBoundary | null;
  end: WorkspaceStateCapture;
  consistencyWarnings: WorkspaceStateConsistencyWarning[];
}

export interface WorkspaceStateProvenanceProjection extends WorkspaceStateProvenanceV1 {
  predecessorRef: string | null;
  continuity: WorkspaceStateContinuity;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSha256Fingerprint(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
}

export function isComparableWorkspaceFingerprint(value: unknown): value is string {
  return isSha256Fingerprint(value);
}

function invalid(label: string): never {
  throw new Error(`invalid workspace state provenance: ${label}`);
}

function parseCapture(value: unknown, label: string): WorkspaceStateCapture {
  if (!isRecord(value)) invalid(`${label} must be an object`);
  if (value.status === 'available') {
    if (!isSha256Fingerprint(value.fingerprintSha256)) invalid(`${label}.fingerprintSha256 must be a SHA-256 hex string`);
    return { status: 'available', fingerprintSha256: value.fingerprintSha256 };
  }
  if (value.status === 'unavailable' && value.fingerprintSha256 === null) {
    return { status: 'unavailable', fingerprintSha256: null };
  }
  invalid(`${label} has an unsupported status or fingerprint`);
}

const WARNING_VALUES: readonly WorkspaceStateConsistencyWarning[] = [
  'START_CAPTURE_UNAVAILABLE',
  'START_BASELINE_FINGERPRINT_NOT_COMPARABLE',
  'START_BASELINE_MISMATCH',
  'EXECUTION_BEFORE_CAPTURE_UNAVAILABLE',
  'EXECUTION_AFTER_CAPTURE_UNAVAILABLE',
  'ACTUAL_CHANGED_FILES_WITH_UNCHANGED_FINGERPRINT',
  'FINGERPRINT_CHANGED_WITHOUT_ACTUAL_CHANGED_FILES',
  'END_CAPTURE_UNAVAILABLE',
];

function isWarning(value: unknown): value is WorkspaceStateConsistencyWarning {
  return typeof value === 'string' && WARNING_VALUES.includes(value as WorkspaceStateConsistencyWarning);
}

function parseSessionRelativeReference(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || isAbsolute(value) || value.includes('\\')) {
    invalid(`${label} must be a non-absolute session-relative path`);
  }
  const parts = value.split('/');
  if (parts.some(part => part === '..' || part.length === 0)) {
    invalid(`${label} must not escape its experiment root`);
  }
  return value;
}

export function parseWorkspaceStateProvenance(raw: unknown): WorkspaceStateProvenanceV1 {
  if (!isRecord(raw)) invalid('must be an object');
  if (raw.schemaVersion !== WORKSPACE_STATE_PROVENANCE_SCHEMA_VERSION) {
    invalid(`expected schemaVersion ${WORKSPACE_STATE_PROVENANCE_SCHEMA_VERSION}`);
  }
  if (raw.fingerprintMethod !== WORKSPACE_STATE_FINGERPRINT_METHOD) {
    invalid(`expected fingerprintMethod ${WORKSPACE_STATE_FINGERPRINT_METHOD}`);
  }
  if (!Array.isArray(raw.consistencyWarnings) || raw.consistencyWarnings.some(warning => !isWarning(warning))) {
    invalid('consistencyWarnings must contain supported warning values');
  }
  let executionBoundary: WorkspaceExecutionBoundary | null = null;
  if (raw.executionBoundary !== null) {
    if (!isRecord(raw.executionBoundary)) invalid('executionBoundary must be an object or null');
    executionBoundary = {
      before: parseCapture(raw.executionBoundary.before, 'executionBoundary.before'),
      after: parseCapture(raw.executionBoundary.after, 'executionBoundary.after'),
    };
  }
  return {
    schemaVersion: WORKSPACE_STATE_PROVENANCE_SCHEMA_VERSION,
    fingerprintMethod: WORKSPACE_STATE_FINGERPRINT_METHOD,
    workspaceRootRef: parseSessionRelativeReference(raw.workspaceRootRef, 'workspaceRootRef'),
    start: parseCapture(raw.start, 'start'),
    executionBoundary,
    end: parseCapture(raw.end, 'end'),
    consistencyWarnings: [...raw.consistencyWarnings] as WorkspaceStateConsistencyWarning[],
  };
}

export async function readWorkspaceStateProvenance(path: string): Promise<WorkspaceStateProvenanceV1> {
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(path, 'utf8')) as unknown;
  } catch (error) {
    throw new Error(`unable to read workspace state provenance at ${path}: ${String(error)}`);
  }
  return parseWorkspaceStateProvenance(raw);
}

export async function captureWorkspaceState(workspaceRoot: string): Promise<WorkspaceStateCapture> {
  const fingerprintSha256 = await captureAuthoritativeFingerprint(workspaceRoot);
  if (!isSha256Fingerprint(fingerprintSha256)) {
    throw new Error('workspace fingerprint capture did not return a SHA-256 hex string');
  }
  return { status: 'available', fingerprintSha256 };
}

export function unavailableWorkspaceState(): WorkspaceStateCapture {
  return { status: 'unavailable', fingerprintSha256: null };
}

export function workspaceStateConsistencyWarnings(input: {
  before: WorkspaceStateCapture;
  after: WorkspaceStateCapture;
  actualChangedFiles: string[];
}): WorkspaceStateConsistencyWarning[] {
  if (input.before.status !== 'available' || input.after.status !== 'available') return [];
  const warnings: WorkspaceStateConsistencyWarning[] = [];
  const sameFingerprint = input.before.fingerprintSha256 === input.after.fingerprintSha256;
  if (input.actualChangedFiles.length > 0 && sameFingerprint) {
    warnings.push('ACTUAL_CHANGED_FILES_WITH_UNCHANGED_FINGERPRINT');
  }
  if (input.actualChangedFiles.length === 0 && !sameFingerprint) {
    warnings.push('FINGERPRINT_CHANGED_WITHOUT_ACTUAL_CHANGED_FILES');
  }
  return warnings;
}

export function compareWorkspaceStateContinuity(
  previousEnd: WorkspaceStateCapture | null,
  currentStart: WorkspaceStateCapture,
  previousFingerprintMethod: string | null,
  currentFingerprintMethod: string,
): WorkspaceStateContinuity {
  if (
    previousEnd === null
    || previousEnd.status !== 'available'
    || currentStart.status !== 'available'
    || previousFingerprintMethod === null
    || previousFingerprintMethod !== currentFingerprintMethod
  ) {
    return 'UNKNOWN';
  }
  return previousEnd.fingerprintSha256 === currentStart.fingerprintSha256 ? 'MATCH' : 'MISMATCH';
}

export function projectWorkspaceStateProvenance(
  provenance: WorkspaceStateProvenanceV1,
  input: {
    predecessorRef?: string | null;
    previousEnd?: WorkspaceStateCapture | null;
    previousFingerprintMethod?: string | null;
  } = {},
): WorkspaceStateProvenanceProjection {
  const predecessorRef = input.predecessorRef === undefined || input.predecessorRef === null
    ? null
    : parseSessionRelativeReference(input.predecessorRef, 'predecessorRef');
  return {
    ...provenance,
    start: { ...provenance.start },
    executionBoundary: provenance.executionBoundary === null
      ? null
      : {
        before: { ...provenance.executionBoundary.before },
        after: { ...provenance.executionBoundary.after },
      },
    end: { ...provenance.end },
    consistencyWarnings: [...provenance.consistencyWarnings],
    predecessorRef,
    continuity: compareWorkspaceStateContinuity(
      input.previousEnd ?? null,
      provenance.start,
      input.previousFingerprintMethod ?? null,
      provenance.fingerprintMethod,
    ),
  };
}

export function parseWorkspaceStateProvenanceProjection(raw: unknown): WorkspaceStateProvenanceProjection {
  if (!isRecord(raw)) invalid('projection must be an object');
  const provenance = parseWorkspaceStateProvenance(raw);
  const predecessorRef = raw.predecessorRef === null
    ? null
    : parseSessionRelativeReference(raw.predecessorRef, 'predecessorRef');
  if (raw.continuity !== 'MATCH' && raw.continuity !== 'MISMATCH' && raw.continuity !== 'UNKNOWN') {
    invalid('continuity is unsupported');
  }
  return {
    ...provenance,
    predecessorRef,
    continuity: raw.continuity,
  };
}

export function durableWorkspaceStateProvenanceSemantics(
  provenance: WorkspaceStateProvenanceProjection,
): Record<string, unknown> {
  return {
    schemaVersion: provenance.schemaVersion,
    fingerprintMethod: provenance.fingerprintMethod,
    workspaceRootRef: provenance.workspaceRootRef,
    start: provenance.start,
    executionBoundary: provenance.executionBoundary,
    end: provenance.end,
    consistencyWarnings: provenance.consistencyWarnings,
    predecessorRef: provenance.predecessorRef,
    continuity: provenance.continuity,
  };
}
