import { execFileSync, spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { performance } from 'node:perf_hooks';
import {
  runWorkspaceAgentContinuation,
  runWorkspaceAgentJob,
  type ParticipantExecutionTraceV1,
  type ParticipantThreadRef,
  type WorkspaceAgentJobInput,
  type WorkspaceAgentJobResult,
  type WorkspaceAgentParticipantOptions,
} from '../problemAgnosticSolution/agentParticipant';
import {
  captureReferenceParticipantBindingLock,
  referenceParticipantBindingLockSha256,
  resolveReferenceParticipantBindingFromLock,
  type ReferenceParticipantBindingLockV1,
} from '../operator/referenceParticipantBinding';
import { validateStructuredTerminalEnvelope } from '../../../src/evolution/structuredTerminalEnvelope';

export const REFERENCE_COMMUNICATION_PRODUCTION_RETRANSMISSION_TIMEOUT_MS = 60_000;
export const REFERENCE_COMMUNICATION_OBSERVATION_TIMEOUT_MS = 300_000;
const REFERENCE_COMMUNICATION_INITIAL_TIMEOUT_MS = 1_800_000;
const SYNTHETIC_LARGE_PAYLOAD_MIN_BYTES = 22 * 1024;
const SYNTHETIC_LARGE_PAYLOAD_MAX_BYTES = 26 * 1024;

type RuntimeOutcome = 'COMPLETED' | 'TIMEOUT' | 'PROCESS_FAILURE' | 'INVALID_OUTPUT' | 'CONTINUATION_FAILURE';

export interface ReferenceCommunicationTrialEvidenceV2 {
  trialId: string;
  bindingLockSha256: string;
  schemaSha256: string;
  runtimeOutcome: RuntimeOutcome;
  elapsedMs: number | null;
  lastObservableActivityElapsedMs: number | null;
  hostEnvelopeValid: boolean;
  hostEnvelopeFailureReason?: string;
  hostRepairApplied: false;
  terminalPayloadRef: string;
  executionTraceRef: string;
  payloadMatchedExactly?: boolean;
  payloadStructureValid?: boolean;
  payloadMeasuredBytes?: number;
  payloadStructureFailureReason?: string;
  threadRef?: ParticipantThreadRef;
}

export interface ReferenceCommunicationContinuationTrialEvidenceV2 {
  trialId: string;
  bindingLockSha256: string;
  schemaSha256: string;
  initialRuntimeOutcome: RuntimeOutcome;
  initialHostEnvelopeValid: boolean;
  initialPayloadMatchedExactly: boolean;
  initialPayloadStructureValid: boolean;
  initialPayloadMeasuredBytes: number | null;
  initialStructureFailureReason?: string;
  continuationRuntimeOutcome: RuntimeOutcome | 'NOT_RUN' | 'THREAD_IDENTITY_UNAVAILABLE' | 'THREAD_IDENTITY_FAILURE';
  continuationHostEnvelopeValid: boolean;
  continuationPayloadStructureValid: boolean;
  continuationPayloadMeasuredBytes: number | null;
  continuationStructureFailureReason?: string;
  hostRepairApplied: false;
  initialElapsedMs: number | null;
  startupLatencyMs: number | null;
  firstOutputActivityLatencyMs: number | null;
  terminalCompletionLatencyMs: number | null;
  lastObservableActivityElapsedMs: number | null;
  withinProductionCeiling: boolean;
  withinObservationCeiling: boolean;
  payloadMatchedExactly: boolean;
  threadIdentityValid: boolean;
  initialTerminalPayloadRef: string;
  initialExecutionTraceRef: string;
  continuationTerminalPayloadRef: string;
  continuationExecutionTraceRef: string;
  threadRef?: ParticipantThreadRef;
  continuationFailureReason?: string;
}

export interface ReferenceParticipantCommunicationMatrixEvidenceV2 {
  schemaVersion: 'reference-participant-communication-matrix-v2';
  matrixRef: string;
  implementationSha: string;
  bindingLockRef: 'binding-lock.json';
  bindingLockSha256: string;
  executableRealPath: string;
  executableVersion: string;
  model: string;
  reasoningEffort: string;
  ambientCodexConfigSha256: string | 'ABSENT';
  nativeEnvelopeSchemaSha256: string;
  productionInitialTimeoutMs: 1_800_000;
  productionRetransmissionTimeoutMs: 60_000;
  maxProductionRetransmissions: 1;
  continuationObservationTimeoutMs: 300_000;
  status: 'PASS' | 'NATIVE_ENVELOPE_ASSISTANCE_UNRELIABLE' | 'MATRIX_B_FAILED' | 'CONTINUATION_TIMEOUT_POLICY_REVIEW' | 'CONTINUATION_UNRELIABLE' | 'BINDING_DRIFT' | 'RUNNER_FAILURE';
  stopReason?: string;
  matrices: {
    A: {
      validationScope: 'NATIVE_ENVELOPE_ONLY';
      gatePassed: boolean;
      trials: ReferenceCommunicationTrialEvidenceV2[];
    };
    B: {
      gatePassed: boolean | null;
      expectedPayloadBytes: number;
      trials: ReferenceCommunicationTrialEvidenceV2[];
    };
    C: {
      gatePassed: boolean | null;
      timeoutPolicyReviewRequired: boolean;
      policyClassification: 'SUPPORTED_60S' | 'CONTINUATION_TIMEOUT_POLICY_REVIEW' | 'CONTINUATION_UNRELIABLE' | null;
      trials: ReferenceCommunicationContinuationTrialEvidenceV2[];
    };
  };
}

export interface SyntheticLargeEnvelopePayloadValidation {
  ok: boolean;
  measuredBytes: number;
  reason?: string;
}

export interface RunReferenceParticipantCommunicationMatrixInput {
  repositoryRoot: string;
  evidenceRoot: string;
  matrixRef: string;
  model: string;
  reasoningEffort: string;
  ambientCodexConfigPath: string;
}

export interface ReferenceParticipantCommunicationMatrixDependencies {
  captureBindingLock?: typeof captureReferenceParticipantBindingLock;
  resolveBindingLock?: typeof resolveReferenceParticipantBindingFromLock;
  runWorkspaceAgentJob?: typeof runWorkspaceAgentJob;
  runWorkspaceAgentContinuation?: typeof runWorkspaceAgentContinuation;
  implementationSha?: (repositoryRoot: string) => Promise<string> | string;
}

class ReferenceParticipantBindingDriftError extends Error {}

function nonEmpty(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`${label} must be non-empty.`);
}

function validateMatrixRef(matrixRef: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(matrixRef) || /^attempt-[0-9]{6}$/.test(matrixRef)) {
    throw new Error('Matrix reference is invalid.');
  }
}

function realpathWithMissingSuffix(path: string): string {
  let cursor = resolve(path);
  const missingSuffix: string[] = [];
  while (true) {
    try {
      return resolve(realpathSync(cursor), ...missingSuffix);
    } catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') throw error;
      const parent = dirname(cursor);
      if (parent === cursor) throw error;
      missingSuffix.unshift(basename(cursor));
      cursor = parent;
    }
  }
}

function assertEvidenceRootOutsideGovernedHistory(repositoryRoot: string, evidenceRoot: string): void {
  const governedRoot = realpathWithMissingSuffix(resolve(repositoryRoot, 'artifacts/evolution/autonomous-authoring/reference-trials'));
  const relativePath = relative(governedRoot, realpathWithMissingSuffix(evidenceRoot));
  if (relativePath === '' || (relativePath !== '..' && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath))) {
    throw new Error('Communication matrix evidence root must be outside governed reference-trial history.');
  }
}

function assertTrackedImplementationWorktreeClean(repositoryRoot: string): void {
  const result = spawnSync('git', ['-C', repositoryRoot, 'diff', '--quiet', 'HEAD', '--'], { encoding: 'utf8' });
  if (result.error) throw new Error(`Could not verify tracked implementation worktree: ${result.error.message}`);
  if (result.status === 1) throw new Error('Tracked implementation worktree must be clean before communication validation.');
  if (result.status !== 0) throw new Error(`Could not verify tracked implementation worktree: ${result.stderr}`);
}

function createImplementationShaReader(repositoryRoot: string): string {
  assertTrackedImplementationWorktreeClean(repositoryRoot);
  return execFileSync('git', ['-C', repositoryRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
}

function runtimeOutcome(job: WorkspaceAgentJobResult): RuntimeOutcome {
  if (job.ok) return 'COMPLETED';
  if (job.errorKind === 'timeout') return 'TIMEOUT';
  if (job.errorKind === 'invalid_output') return 'INVALID_OUTPUT';
  if (job.errorKind === 'continuation') return 'CONTINUATION_FAILURE';
  return 'PROCESS_FAILURE';
}

async function resolveLockedParticipant(
  resolveBindingLock: typeof resolveReferenceParticipantBindingFromLock,
  repositoryRoot: string,
  lock: ReferenceParticipantBindingLockV1,
): ReturnType<typeof resolveReferenceParticipantBindingFromLock> {
  try {
    return await resolveBindingLock({ repositoryRoot, lock });
  } catch (error) {
    throw new ReferenceParticipantBindingDriftError(error instanceof Error ? error.message : String(error));
  }
}

function envelope(job: WorkspaceAgentJobResult): {
  valid: boolean;
  parsedObject?: Record<string, unknown>;
  reason?: string;
} {
  if (!job.ok) return { valid: false, reason: `runtime outcome ${runtimeOutcome(job)}` };
  const result = validateStructuredTerminalEnvelope(job.rawOutput);
  return result.ok
    ? { valid: true, parsedObject: result.parsedObject }
    : { valid: false, reason: result.reason };
}

function rawOutput(job: WorkspaceAgentJobResult): string {
  return job.ok ? job.rawOutput : job.rawOutput ?? '';
}

function trace(job: WorkspaceAgentJobResult): ParticipantExecutionTraceV1 {
  return job.executionTrace;
}

function threadRefsMatch(actual: ParticipantThreadRef | undefined, expected: ParticipantThreadRef): boolean {
  return actual !== undefined && actual.provider === expected.provider && actual.opaqueId === expected.opaqueId;
}

async function writeTextCreateOnly(path: string, value: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, value, { flag: 'wx' });
}

async function writeJsonCreateOnly(path: string, value: unknown): Promise<void> {
  await writeTextCreateOnly(path, `${JSON.stringify(value, null, 2)}\n`);
}

function outputTiming(job: WorkspaceAgentJobResult): {
  startupLatencyMs: number | null;
  firstOutputActivityLatencyMs: number | null;
  terminalCompletionLatencyMs: number | null;
  lastObservableActivityElapsedMs: number | null;
} {
  const executionTrace = trace(job);
  return {
    startupLatencyMs: executionTrace.events.find(event => event.type === 'process_start')?.elapsedMs ?? null,
    firstOutputActivityLatencyMs: executionTrace.events.find(event => event.type === 'output_activity')?.elapsedMs ?? null,
    terminalCompletionLatencyMs: executionTrace.terminal.outcome === 'completed'
      ? executionTrace.terminal.elapsedMs
      : null,
    lastObservableActivityElapsedMs: executionTrace.terminal.lastObservableActivityElapsedMs ?? null,
  };
}

function envelopeEvidence(input: {
  trialId: string;
  bindingLockSha256: string;
  schemaSha256: string;
  job: WorkspaceAgentJobResult;
  payloadMatchedExactly?: boolean;
  terminalPayloadRef: string;
  executionTraceRef: string;
}): ReferenceCommunicationTrialEvidenceV2 {
  const result = envelope(input.job);
  return {
    trialId: input.trialId,
    bindingLockSha256: input.bindingLockSha256,
    schemaSha256: input.schemaSha256,
    runtimeOutcome: runtimeOutcome(input.job),
    elapsedMs: trace(input.job).terminal.elapsedMs,
    lastObservableActivityElapsedMs: trace(input.job).terminal.lastObservableActivityElapsedMs ?? null,
    hostEnvelopeValid: result.valid,
    ...(result.reason === undefined ? {} : { hostEnvelopeFailureReason: result.reason }),
    hostRepairApplied: false,
    terminalPayloadRef: input.terminalPayloadRef,
    executionTraceRef: input.executionTraceRef,
    ...(input.payloadMatchedExactly === undefined ? {} : { payloadMatchedExactly: input.payloadMatchedExactly }),
    ...(input.job.ok && input.job.threadRef !== undefined ? { threadRef: input.job.threadRef } : {}),
  };
}

export function buildSyntheticLargeEnvelopePayload(): Record<string, unknown> {
  return {
    schemaVersion: 'reference-communication-large-object-v1',
    header: {
      purpose: 'serialization-only',
      recordCount: 20,
      depth: 4,
      marker: 'no repository reasoning required',
    },
    nested: Array.from({ length: 20 }, (_, index) => ({
      nodeId: `node-${String(index + 1).padStart(2, '0')}`,
      ancestry: [
        { level: 0, label: 'root' },
        { level: 1, label: `branch-${index % 4}` },
        { level: 2, label: `group-${index % 7}` },
        { level: 3, label: `leaf-${index}` },
      ],
      values: {
        ordinal: index + 1,
        active: index % 2 === 0,
        samples: [index, index + 1, index + 2, index + 3],
        measurements: { low: index / 10, mid: index / 5, high: index / 2 },
      },
      children: [{
        id: `child-${String(index + 1).padStart(2, '0')}`,
        payload: { padding: 'x'.repeat(890), checksumMarker: `fixed-${index}` },
      }],
    })),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: unknown, expectedKeys: readonly string[]): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const actualKeys = Object.keys(value);
  return actualKeys.length === expectedKeys.length && expectedKeys.every(key => Object.hasOwn(value, key));
}

export function validateSyntheticLargeEnvelopePayload(
  actual: Record<string, unknown>,
): SyntheticLargeEnvelopePayloadValidation {
  let measuredBytes = 0;
  try {
    const serialized = JSON.stringify(actual);
    if (serialized === undefined) return { ok: false, measuredBytes, reason: 'Payload cannot be serialized as JSON.' };
    measuredBytes = Buffer.byteLength(serialized);
  } catch (error) {
    return {
      ok: false,
      measuredBytes,
      reason: `Payload cannot be serialized as JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const fail = (reason: string): SyntheticLargeEnvelopePayloadValidation => ({ ok: false, measuredBytes, reason });
  if (!hasExactKeys(actual, ['schemaVersion', 'header', 'nested'])) return fail('Top-level keys are missing or unexpected.');
  if (actual.schemaVersion !== 'reference-communication-large-object-v1') return fail('Top-level schemaVersion changed.');
  if (!hasExactKeys(actual.header, ['purpose', 'recordCount', 'depth', 'marker'])
    || actual.header.purpose !== 'serialization-only'
    || actual.header.recordCount !== 20
    || actual.header.depth !== 4
    || actual.header.marker !== 'no repository reasoning required') {
    return fail('Top-level header semantics or keys changed.');
  }
  if (!Array.isArray(actual.nested) || actual.nested.length !== 20) return fail('Payload must contain exactly 20 records.');

  for (let index = 0; index < actual.nested.length; index += 1) {
    const record = actual.nested[index];
    if (!hasExactKeys(record, ['nodeId', 'ancestry', 'values', 'children'])) return fail(`Record ${index + 1} keys are missing or unexpected.`);
    if (record.nodeId !== `node-${String(index + 1).padStart(2, '0')}`) return fail(`Record ${index + 1} nodeId changed.`);

    const ancestry = record.ancestry;
    const expectedAncestry = [
      { level: 0, label: 'root' },
      { level: 1, label: `branch-${index % 4}` },
      { level: 2, label: `group-${index % 7}` },
      { level: 3, label: `leaf-${index}` },
    ];
    if (!Array.isArray(ancestry) || ancestry.length !== expectedAncestry.length
      || ancestry.some((item, ancestryIndex) => !hasExactKeys(item, ['level', 'label'])
        || item.level !== expectedAncestry[ancestryIndex]!.level
        || item.label !== expectedAncestry[ancestryIndex]!.label)) {
      return fail(`Record ${index + 1} ancestry changed.`);
    }

    const values = record.values;
    if (!hasExactKeys(values, ['ordinal', 'active', 'samples', 'measurements'])
      || values.ordinal !== index + 1
      || values.active !== (index % 2 === 0)
      || !Array.isArray(values.samples)
      || values.samples.length !== 4
      || values.samples.some((sample, sampleIndex) => sample !== index + sampleIndex)) {
      return fail(`Record ${index + 1} values or keys changed.`);
    }
    const measurements = values.measurements;
    if (!hasExactKeys(measurements, ['low', 'mid', 'high'])
      || measurements.low !== index / 10
      || measurements.mid !== index / 5
      || measurements.high !== index / 2) {
      return fail(`Record ${index + 1} measurements or keys changed.`);
    }

    if (!Array.isArray(record.children) || record.children.length !== 1) return fail(`Record ${index + 1} must contain exactly one child.`);
    const child = record.children[0];
    if (!hasExactKeys(child, ['id', 'payload']) || child.id !== `child-${String(index + 1).padStart(2, '0')}`) {
      return fail(`Record ${index + 1} child identity or keys changed.`);
    }
    const childPayload = child.payload;
    if (!hasExactKeys(childPayload, ['padding', 'checksumMarker'])
      || typeof childPayload.padding !== 'string'
      || !/^x+$/.test(childPayload.padding)
      || childPayload.checksumMarker !== `fixed-${index}`) {
      return fail(`Record ${index + 1} padding, checksumMarker, or child payload keys changed.`);
    }
  }

  if (measuredBytes < SYNTHETIC_LARGE_PAYLOAD_MIN_BYTES || measuredBytes > SYNTHETIC_LARGE_PAYLOAD_MAX_BYTES) {
    return fail(`Serialized payload size ${measuredBytes} is outside 22-26 KiB.`);
  }
  return { ok: true, measuredBytes };
}

function initialPrompt(trialId: string, payload: Record<string, unknown>): string {
  return `Return the complete JSON object for ${trialId}, preserving every correctness-bearing field and structural key. Emit only the JSON object, with no prose or Markdown. The bulk padding string is non-semantic transport filler: keep it a non-empty string containing only x characters, but its exact character count is not semantic. Keep the serialized object between 22 and 26 KiB.\n${JSON.stringify(payload)}`;
}

async function runInitialTrial(input: {
  trialId: string;
  prompt: string;
  expectedPayload?: Record<string, unknown>;
  workspacePrefix: string;
  trialDirectory: string;
  evidenceRoot: string;
  validateSyntheticLargeStructure?: boolean;
  bindingLock: ReferenceParticipantBindingLockV1;
  bindingLockSha256: string;
  repositoryRoot: string;
  resolveBindingLock: typeof resolveReferenceParticipantBindingFromLock;
  runJob: typeof runWorkspaceAgentJob;
}): Promise<{ evidence: ReferenceCommunicationTrialEvidenceV2; job: WorkspaceAgentJobResult }> {
  const workspaceRoot = await mkdtemp(join(tmpdir(), input.workspacePrefix));
  const promptRef = join(input.trialDirectory, 'prompt.txt');
  const payloadRef = join(input.trialDirectory, 'terminal-payload.txt');
  const traceRef = join(input.trialDirectory, 'execution-trace.json');
  await writeTextCreateOnly(promptRef, `${input.prompt}\n`);
  try {
    const binding = await resolveLockedParticipant(input.resolveBindingLock, input.repositoryRoot, input.bindingLock);
    const jobInput: WorkspaceAgentJobInput = {
      invocationRef: input.trialId,
      role: 'solution',
      workspaceRoot,
      prompt: input.prompt,
    };
    const started = performance.now();
    const job = await input.runJob(jobInput, binding.participant);
    const elapsedMs = Math.max(0, Math.round(performance.now() - started));
    const result = envelope(job);
    const payloadMatchedExactly = input.expectedPayload === undefined
      ? undefined
      : result.valid && result.parsedObject !== undefined && isDeepStrictEqual(result.parsedObject, input.expectedPayload);
    const evidence = envelopeEvidence({
      trialId: input.trialId,
      bindingLockSha256: input.bindingLockSha256,
      schemaSha256: input.bindingLock.nativeEnvelopeAssistance.schemaSha256,
      job,
      payloadMatchedExactly,
      terminalPayloadRef: relative(input.evidenceRoot, payloadRef),
      executionTraceRef: relative(input.evidenceRoot, traceRef),
    });
    if (input.validateSyntheticLargeStructure && result.valid && result.parsedObject !== undefined) {
      const structure = validateSyntheticLargeEnvelopePayload(result.parsedObject);
      evidence.payloadStructureValid = structure.ok;
      evidence.payloadMeasuredBytes = structure.measuredBytes;
      if (structure.reason !== undefined) evidence.payloadStructureFailureReason = structure.reason;
    }
    evidence.elapsedMs = job.executionTrace.terminal.elapsedMs ?? elapsedMs;
    await writeTextCreateOnly(payloadRef, rawOutput(job));
    await writeJsonCreateOnly(traceRef, job.executionTrace);
    await writeJsonCreateOnly(join(input.trialDirectory, 'trial.json'), evidence);
    return { evidence, job };
  } finally {
    await rm(workspaceRoot, { recursive: true, force: true });
  }
}

function defaultInputValidation(input: RunReferenceParticipantCommunicationMatrixInput): {
  repositoryRoot: string;
  evidenceRoot: string;
} {
  nonEmpty(input.repositoryRoot, 'Repository root');
  nonEmpty(input.evidenceRoot, 'Evidence root');
  nonEmpty(input.matrixRef, 'Matrix reference');
  nonEmpty(input.model, 'Model');
  nonEmpty(input.reasoningEffort, 'Reasoning effort');
  nonEmpty(input.ambientCodexConfigPath, 'Ambient Codex config path');
  validateMatrixRef(input.matrixRef);
  const repositoryRoot = resolve(input.repositoryRoot);
  const evidenceRoot = isAbsolute(input.evidenceRoot)
    ? resolve(input.evidenceRoot)
    : resolve(repositoryRoot, input.evidenceRoot);
  assertEvidenceRootOutsideGovernedHistory(repositoryRoot, evidenceRoot);
  return { repositoryRoot, evidenceRoot };
}

export async function runReferenceParticipantCommunicationMatrix(
  input: RunReferenceParticipantCommunicationMatrixInput,
  dependencies: ReferenceParticipantCommunicationMatrixDependencies = {},
): Promise<ReferenceParticipantCommunicationMatrixEvidenceV2> {
  const { repositoryRoot, evidenceRoot } = defaultInputValidation(input);
  if (dependencies.implementationSha === undefined) assertTrackedImplementationWorktreeClean(repositoryRoot);
  const captureBindingLock = dependencies.captureBindingLock ?? captureReferenceParticipantBindingLock;
  const resolveBindingLock = dependencies.resolveBindingLock ?? resolveReferenceParticipantBindingFromLock;
  const runJob = dependencies.runWorkspaceAgentJob ?? runWorkspaceAgentJob;
  const runContinuation = dependencies.runWorkspaceAgentContinuation ?? runWorkspaceAgentContinuation;
  const readImplementationSha = dependencies.implementationSha ?? createImplementationShaReader;

  await mkdir(dirname(evidenceRoot), { recursive: true });
  await mkdir(evidenceRoot, { recursive: false });

  const bindingLock = await captureBindingLock({
    repositoryRoot,
    bindingId: 'CODEX_CURRENT',
    model: input.model,
    reasoningEffort: input.reasoningEffort,
    ambientCodexConfigPath: input.ambientCodexConfigPath,
  });
  if (bindingLock.modelConfigured !== input.model
    || bindingLock.reasoningEffort !== input.reasoningEffort
    || resolve(bindingLock.ambientCodexConfigPath) !== resolve(input.ambientCodexConfigPath)) {
    throw new Error('Captured Participant binding does not match the explicit model, reasoning effort, and config path.');
  }
  const bindingLockSha256 = referenceParticipantBindingLockSha256(bindingLock);
  const schemaSha256 = bindingLock.nativeEnvelopeAssistance.schemaSha256;
  await writeJsonCreateOnly(join(evidenceRoot, 'binding-lock.json'), bindingLock);

  const implementationSha = await readImplementationSha(repositoryRoot);
  const evidence: ReferenceParticipantCommunicationMatrixEvidenceV2 = {
    schemaVersion: 'reference-participant-communication-matrix-v2',
    matrixRef: input.matrixRef,
    implementationSha,
    bindingLockRef: 'binding-lock.json',
    bindingLockSha256,
    executableRealPath: bindingLock.executableRealPath,
    executableVersion: bindingLock.executableVersion,
    model: bindingLock.modelConfigured,
    reasoningEffort: bindingLock.reasoningEffort,
    ambientCodexConfigSha256: bindingLock.ambientCodexConfigSha256,
    nativeEnvelopeSchemaSha256: schemaSha256,
    productionInitialTimeoutMs: REFERENCE_COMMUNICATION_INITIAL_TIMEOUT_MS,
    productionRetransmissionTimeoutMs: REFERENCE_COMMUNICATION_PRODUCTION_RETRANSMISSION_TIMEOUT_MS,
    maxProductionRetransmissions: 1,
    continuationObservationTimeoutMs: REFERENCE_COMMUNICATION_OBSERVATION_TIMEOUT_MS,
    status: 'PASS',
    matrices: {
      A: { validationScope: 'NATIVE_ENVELOPE_ONLY', gatePassed: false, trials: [] },
      B: { gatePassed: null, expectedPayloadBytes: 0, trials: [] },
      C: { gatePassed: null, timeoutPolicyReviewRequired: false, policyClassification: null, trials: [] },
    },
  };

  const finish = async (): Promise<ReferenceParticipantCommunicationMatrixEvidenceV2> => {
    try {
      const finalImplementationSha = await readImplementationSha(repositoryRoot);
      if (finalImplementationSha !== implementationSha) {
        throw new Error('Implementation SHA changed during communication matrix.');
      }
    } catch (error) {
      evidence.status = 'RUNNER_FAILURE';
      evidence.stopReason = error instanceof Error ? error.message : String(error);
    }
    await writeJsonCreateOnly(join(evidenceRoot, 'matrix.json'), evidence);
    return evidence;
  };

  const largePayload = buildSyntheticLargeEnvelopePayload();
  const largePayloadBytes = Buffer.byteLength(JSON.stringify(largePayload));
  evidence.matrices.B.expectedPayloadBytes = largePayloadBytes;
  if (largePayloadBytes < SYNTHETIC_LARGE_PAYLOAD_MIN_BYTES || largePayloadBytes > SYNTHETIC_LARGE_PAYLOAD_MAX_BYTES) {
    evidence.status = 'MATRIX_B_FAILED';
    evidence.stopReason = `Synthetic large object size ${largePayloadBytes} is outside 22-26 KiB.`;
    return finish();
  }
  await mkdir(join(evidenceRoot, 'trials'), { recursive: false });

  const runTrial = async (
    trialId: string,
    prompt: string,
    expectedPayload?: Record<string, unknown>,
    validateSyntheticLargeStructure = false,
  ) => {
    const trialDirectory = join(evidenceRoot, 'trials', trialId);
    await mkdir(trialDirectory, { recursive: false });
    return runInitialTrial({
      trialId,
      prompt,
      ...(expectedPayload === undefined ? {} : { expectedPayload }),
      validateSyntheticLargeStructure,
      workspacePrefix: `ref-comm-${trialId}-`,
      trialDirectory,
      evidenceRoot,
      bindingLock,
      bindingLockSha256,
      repositoryRoot,
      resolveBindingLock,
      runJob,
    });
  };

  try {
    for (let index = 1; index <= 3; index += 1) {
      const trialId = `A-${String(index).padStart(2, '0')}`;
      const expected = { matrix: 'A', trialId, result: 'ok' };
      const { evidence: trialEvidence } = await runTrial(
        trialId,
        `Return exactly this JSON object and nothing else: ${JSON.stringify(expected)}`,
        expected,
      );
      evidence.matrices.A.trials.push(trialEvidence);
    }
    evidence.matrices.A.gatePassed = evidence.matrices.A.trials.length === 3
      && evidence.matrices.A.trials.every(trial => trial.runtimeOutcome === 'COMPLETED'
        && trial.hostEnvelopeValid
        && trial.elapsedMs !== null
        && trial.elapsedMs <= REFERENCE_COMMUNICATION_INITIAL_TIMEOUT_MS);
    await writeJsonCreateOnly(join(evidenceRoot, 'matrix-A.json'), evidence.matrices.A);
    if (!evidence.matrices.A.gatePassed) {
      evidence.status = 'NATIVE_ENVELOPE_ASSISTANCE_UNRELIABLE';
      evidence.stopReason = 'Matrix A did not achieve 3/3 process completion and Host envelope validity.';
      return finish();
    }

    for (let index = 1; index <= 3; index += 1) {
      const trialId = `B-${String(index).padStart(2, '0')}`;
      const { evidence: trialEvidence } = await runTrial(trialId, initialPrompt(trialId, largePayload), largePayload, true);
      evidence.matrices.B.trials.push(trialEvidence);
    }
    evidence.matrices.B.gatePassed = evidence.matrices.B.trials.length === 3
      && evidence.matrices.B.trials.every(trial => trial.runtimeOutcome === 'COMPLETED'
        && trial.elapsedMs !== null
        && trial.elapsedMs <= REFERENCE_COMMUNICATION_INITIAL_TIMEOUT_MS
        && trial.hostEnvelopeValid
        && trial.payloadStructureValid === true
        && trial.payloadMeasuredBytes !== undefined
        && trial.payloadMeasuredBytes >= SYNTHETIC_LARGE_PAYLOAD_MIN_BYTES
        && trial.payloadMeasuredBytes <= SYNTHETIC_LARGE_PAYLOAD_MAX_BYTES
        && !trial.hostRepairApplied);
    await writeJsonCreateOnly(join(evidenceRoot, 'matrix-B.json'), evidence.matrices.B);
    if (!evidence.matrices.B.gatePassed) {
      evidence.status = 'MATRIX_B_FAILED';
      evidence.stopReason = 'Matrix B did not achieve 3/3 completion, envelope validity, valid large-object structure, and no Host repair.';
      return finish();
    }

    for (let index = 1; index <= 3; index += 1) {
      const trialId = `C-${String(index).padStart(2, '0')}`;
      const trialDirectory = join(evidenceRoot, 'trials', trialId);
      await mkdir(trialDirectory, { recursive: false });
      const initial = await runInitialTrial({
        trialId: `${trialId}-initial`,
        prompt: initialPrompt(`${trialId}-initial`, largePayload),
        expectedPayload: largePayload,
        validateSyntheticLargeStructure: true,
        workspacePrefix: `ref-comm-${trialId}-`,
        trialDirectory,
        evidenceRoot,
        bindingLock,
        bindingLockSha256,
        repositoryRoot,
        resolveBindingLock,
        runJob,
      });
      const initialEnvelope = envelope(initial.job);
      const initialStructureValid = initial.evidence.payloadStructureValid === true;
      const initialElapsedMs = initial.job.executionTrace.terminal.elapsedMs;
      const initialStructureFailureReason = initial.evidence.payloadStructureFailureReason;
      const initialFields = {
        initialRuntimeOutcome: runtimeOutcome(initial.job),
        initialHostEnvelopeValid: initialEnvelope.valid,
        initialPayloadMatchedExactly: initial.evidence.payloadMatchedExactly === true,
        initialPayloadStructureValid: initialStructureValid,
        initialPayloadMeasuredBytes: initial.evidence.payloadMeasuredBytes ?? null,
        ...(initialStructureFailureReason === undefined ? {} : { initialStructureFailureReason }),
        initialElapsedMs,
        initialTerminalPayloadRef: initial.evidence.terminalPayloadRef,
        initialExecutionTraceRef: initial.evidence.executionTraceRef,
      };
      let continuationOutcome: ReferenceCommunicationContinuationTrialEvidenceV2['continuationRuntimeOutcome'] = 'NOT_RUN';
      let continuationEnvelopeValid = false;
      let continuationStructureValid = false;
      let continuationMeasuredBytes: number | null = null;
      let continuationStructureFailureReason: string | undefined;
      let continuationMatchedExactly = false;
      let threadIdentityValid = false;
      let continuationFailureReason: string | undefined;
      let continuationJob: WorkspaceAgentJobResult;
      const initialThreadRef = initial.job.threadRef;
      if (initial.job.ok
        && initialEnvelope.valid
        && initialStructureValid
        && initialElapsedMs !== null
        && initialElapsedMs <= REFERENCE_COMMUNICATION_INITIAL_TIMEOUT_MS
        && initialThreadRef !== undefined) {
        const binding = await resolveLockedParticipant(resolveBindingLock, repositoryRoot, bindingLock);
        try {
          const continuationPrompt = 'RE-EMIT ONLY: Return the complete JSON object from the previous completed turn, preserving every correctness-bearing field and structural key. The bulk padding string is non-semantic transport filler: keep it a non-empty string containing only x characters, but its exact character count is not semantic. Keep the serialized object between 22 and 26 KiB. Emit only the JSON object, with no prose or Markdown.';
          await writeTextCreateOnly(join(trialDirectory, 'continuation-prompt.txt'), `${continuationPrompt}\n`);
          const continuationWorkspaceRoot = await mkdtemp(join(tmpdir(), `ref-comm-${trialId}-resume-`));
          const continuationInput: WorkspaceAgentJobInput = {
            invocationRef: `${trialId}-continuation`,
            role: 'solution',
            workspaceRoot: continuationWorkspaceRoot,
            prompt: continuationPrompt,
          };
          try {
            continuationJob = await runContinuation(
              continuationInput,
              binding.participant,
              initialThreadRef,
              REFERENCE_COMMUNICATION_OBSERVATION_TIMEOUT_MS,
            );
          } finally {
            await rm(continuationWorkspaceRoot, { recursive: true, force: true });
          }
          const continuationResult = envelope(continuationJob);
          continuationOutcome = runtimeOutcome(continuationJob);
          continuationEnvelopeValid = continuationResult.valid;
          const structureResult = continuationResult.valid && continuationResult.parsedObject !== undefined
            ? validateSyntheticLargeEnvelopePayload(continuationResult.parsedObject)
            : undefined;
          continuationStructureValid = structureResult?.ok === true;
          continuationMeasuredBytes = structureResult?.measuredBytes ?? null;
          continuationStructureFailureReason = structureResult?.reason;
          continuationMatchedExactly = continuationResult.valid
            && continuationResult.parsedObject !== undefined
            && isDeepStrictEqual(continuationResult.parsedObject, largePayload);
          threadIdentityValid = threadRefsMatch(continuationJob.ok ? continuationJob.threadRef : undefined, initialThreadRef);
          if (continuationJob.ok && !threadIdentityValid) {
            continuationOutcome = continuationJob.threadRef === undefined
              ? 'THREAD_IDENTITY_UNAVAILABLE'
              : 'THREAD_IDENTITY_FAILURE';
          }
          if (!threadIdentityValid) {
            continuationFailureReason = continuationJob.threadRef === undefined
              ? 'Continuation did not retain the initial thread identity.'
              : 'Continuation returned a thread identity different from the initial thread.';
          } else if (!continuationResult.valid) {
            continuationFailureReason = continuationResult.reason;
          } else if (structureResult?.reason !== undefined) {
            continuationFailureReason = structureResult.reason;
          }
          const timing = outputTiming(continuationJob);
          const continuationPayloadRef = join(trialDirectory, 'continuation-terminal-payload.txt');
          const continuationTraceRef = join(trialDirectory, 'continuation-execution-trace.json');
          await writeTextCreateOnly(continuationPayloadRef, rawOutput(continuationJob));
          await writeJsonCreateOnly(continuationTraceRef, continuationJob.executionTrace);
          const withinObservation = timing.terminalCompletionLatencyMs !== null
            && timing.terminalCompletionLatencyMs <= REFERENCE_COMMUNICATION_OBSERVATION_TIMEOUT_MS;
          evidence.matrices.C.trials.push({
            trialId,
            bindingLockSha256,
            schemaSha256,
            ...initialFields,
            continuationRuntimeOutcome: continuationOutcome,
            continuationHostEnvelopeValid: continuationEnvelopeValid,
            continuationPayloadStructureValid: continuationStructureValid,
            continuationPayloadMeasuredBytes: continuationMeasuredBytes,
            ...(continuationStructureFailureReason === undefined ? {} : { continuationStructureFailureReason }),
            hostRepairApplied: false,
            ...timing,
            withinProductionCeiling: timing.terminalCompletionLatencyMs !== null
              && timing.terminalCompletionLatencyMs <= REFERENCE_COMMUNICATION_PRODUCTION_RETRANSMISSION_TIMEOUT_MS,
            withinObservationCeiling: withinObservation,
            payloadMatchedExactly: continuationMatchedExactly,
            threadIdentityValid,
            continuationTerminalPayloadRef: relative(evidenceRoot, continuationPayloadRef),
            continuationExecutionTraceRef: relative(evidenceRoot, continuationTraceRef),
            threadRef: initialThreadRef,
            ...(continuationFailureReason === undefined ? {} : { continuationFailureReason }),
          });
        } catch (error) {
          continuationFailureReason = error instanceof Error ? error.message : String(error);
          evidence.matrices.C.trials.push({
            trialId,
            bindingLockSha256,
            schemaSha256,
            ...initialFields,
            continuationRuntimeOutcome: 'CONTINUATION_FAILURE',
            continuationHostEnvelopeValid: false,
            continuationPayloadStructureValid: false,
            continuationPayloadMeasuredBytes: null,
            hostRepairApplied: false,
            startupLatencyMs: null,
            firstOutputActivityLatencyMs: null,
            terminalCompletionLatencyMs: null,
            lastObservableActivityElapsedMs: null,
            withinProductionCeiling: false,
            withinObservationCeiling: false,
            payloadMatchedExactly: false,
            threadIdentityValid: false,
            continuationTerminalPayloadRef: relative(evidenceRoot, join(trialDirectory, 'continuation-terminal-payload.txt')),
            continuationExecutionTraceRef: relative(evidenceRoot, join(trialDirectory, 'continuation-execution-trace.json')),
            threadRef: initialThreadRef,
            continuationFailureReason,
          });
        }
      } else {
        const identityUnavailable = initial.job.ok
          && initialEnvelope.valid
          && initialStructureValid
          && initialThreadRef === undefined;
        evidence.matrices.C.trials.push({
          trialId,
          bindingLockSha256,
          schemaSha256,
          ...initialFields,
          continuationRuntimeOutcome: identityUnavailable
            ? 'THREAD_IDENTITY_UNAVAILABLE'
            : 'NOT_RUN',
          continuationHostEnvelopeValid: false,
          continuationPayloadStructureValid: false,
          continuationPayloadMeasuredBytes: null,
          hostRepairApplied: false,
          startupLatencyMs: null,
          firstOutputActivityLatencyMs: null,
          terminalCompletionLatencyMs: null,
          lastObservableActivityElapsedMs: initial.job.executionTrace.terminal.lastObservableActivityElapsedMs ?? null,
          withinProductionCeiling: false,
          withinObservationCeiling: false,
          payloadMatchedExactly: false,
          threadIdentityValid: false,
          continuationTerminalPayloadRef: relative(evidenceRoot, join(trialDirectory, 'continuation-terminal-payload.txt')),
          continuationExecutionTraceRef: relative(evidenceRoot, join(trialDirectory, 'continuation-execution-trace.json')),
          ...(initialThreadRef === undefined ? {} : { threadRef: initialThreadRef }),
          continuationFailureReason: identityUnavailable
            ? 'Completed initial thread did not provide a thread identity.'
            : initialStructureFailureReason
              ?? initialEnvelope.reason
              ?? (initialElapsedMs !== null && initialElapsedMs > REFERENCE_COMMUNICATION_INITIAL_TIMEOUT_MS
                ? 'Initial large-object trial exceeded the 1,800,000ms hard timeout.'
                : 'Initial large-object trial did not complete with a valid Host envelope and structure.'),
        });
      }
    }
    const continuationTrials = evidence.matrices.C.trials;
    const continuationUnreliable = continuationTrials.length !== 3 || continuationTrials.some(trial =>
      trial.initialRuntimeOutcome !== 'COMPLETED'
      || !trial.initialHostEnvelopeValid
      || !trial.initialPayloadStructureValid
      || trial.initialElapsedMs === null
      || trial.initialElapsedMs > REFERENCE_COMMUNICATION_INITIAL_TIMEOUT_MS
      || trial.continuationRuntimeOutcome !== 'COMPLETED'
      || !trial.continuationHostEnvelopeValid
      || !trial.continuationPayloadStructureValid
      || !trial.threadIdentityValid
      || trial.hostRepairApplied
      || !trial.withinObservationCeiling);
    const validSlowContinuation = continuationTrials.some(trial =>
      trial.continuationRuntimeOutcome === 'COMPLETED'
      && trial.continuationHostEnvelopeValid
      && trial.continuationPayloadStructureValid
      && trial.threadIdentityValid
      && trial.terminalCompletionLatencyMs !== null
      && trial.terminalCompletionLatencyMs > REFERENCE_COMMUNICATION_PRODUCTION_RETRANSMISSION_TIMEOUT_MS
      && trial.terminalCompletionLatencyMs <= REFERENCE_COMMUNICATION_OBSERVATION_TIMEOUT_MS);
    evidence.matrices.C.policyClassification = continuationUnreliable
      ? 'CONTINUATION_UNRELIABLE'
      : validSlowContinuation
        ? 'CONTINUATION_TIMEOUT_POLICY_REVIEW'
        : 'SUPPORTED_60S';
    evidence.matrices.C.timeoutPolicyReviewRequired = evidence.matrices.C.policyClassification === 'CONTINUATION_TIMEOUT_POLICY_REVIEW';
    evidence.matrices.C.gatePassed = evidence.matrices.C.policyClassification === 'SUPPORTED_60S';
    await writeJsonCreateOnly(join(evidenceRoot, 'matrix-C.json'), evidence.matrices.C);
    if (!evidence.matrices.C.gatePassed) {
      if (evidence.matrices.C.policyClassification === 'CONTINUATION_TIMEOUT_POLICY_REVIEW') {
        evidence.status = 'CONTINUATION_TIMEOUT_POLICY_REVIEW';
        evidence.stopReason = 'At least one structurally valid continuation completed after the 60-second production ceiling and within the 300-second observation ceiling.';
      } else {
        evidence.status = 'CONTINUATION_UNRELIABLE';
        evidence.stopReason = 'Matrix C initial delivery or continuation failed runtime, thread identity, envelope, structural, or observation-ceiling validation.';
      }
    }
  } catch (error) {
    evidence.status = error instanceof ReferenceParticipantBindingDriftError ? 'BINDING_DRIFT' : 'RUNNER_FAILURE';
    evidence.stopReason = error instanceof Error ? error.message : String(error);
  }

  return finish();
}
