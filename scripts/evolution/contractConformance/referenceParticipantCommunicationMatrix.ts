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

type RuntimeOutcome = 'COMPLETED' | 'TIMEOUT' | 'PROCESS_FAILURE' | 'INVALID_OUTPUT' | 'CONTINUATION_FAILURE';

export interface ReferenceCommunicationTrialEvidenceV1 {
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
  threadRef?: ParticipantThreadRef;
}

export interface ReferenceCommunicationContinuationTrialEvidenceV1 {
  trialId: string;
  bindingLockSha256: string;
  schemaSha256: string;
  initialRuntimeOutcome: RuntimeOutcome;
  initialHostEnvelopeValid: boolean;
  initialPayloadMatchedExactly: boolean;
  continuationRuntimeOutcome: RuntimeOutcome | 'NOT_RUN' | 'THREAD_IDENTITY_UNAVAILABLE';
  continuationHostEnvelopeValid: boolean;
  hostRepairApplied: false;
  initialElapsedMs: number | null;
  startupLatencyMs: number | null;
  firstOutputActivityLatencyMs: number | null;
  terminalCompletionLatencyMs: number | null;
  lastObservableActivityElapsedMs: number | null;
  withinProductionCeiling: boolean;
  withinObservationCeiling: boolean;
  payloadMatchedExactly: boolean;
  initialTerminalPayloadRef: string;
  initialExecutionTraceRef: string;
  continuationTerminalPayloadRef: string;
  continuationExecutionTraceRef: string;
  threadRef?: ParticipantThreadRef;
  continuationFailureReason?: string;
}

export interface ReferenceParticipantCommunicationMatrixEvidenceV1 {
  schemaVersion: 'reference-participant-communication-matrix-v1';
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
      trials: ReferenceCommunicationTrialEvidenceV1[];
    };
    B: {
      gatePassed: boolean | null;
      expectedPayloadBytes: number;
      trials: ReferenceCommunicationTrialEvidenceV1[];
    };
    C: {
      gatePassed: boolean | null;
      timeoutPolicyReviewRequired: boolean;
      trials: ReferenceCommunicationContinuationTrialEvidenceV1[];
    };
  };
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
}): ReferenceCommunicationTrialEvidenceV1 {
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

function initialPrompt(trialId: string, payload: Record<string, unknown>): string {
  return `Return the following complete JSON object exactly as supplied. Emit only the JSON object, with no prose or Markdown.\n${JSON.stringify(payload)}`;
}

async function runInitialTrial(input: {
  trialId: string;
  prompt: string;
  expectedPayload?: Record<string, unknown>;
  workspacePrefix: string;
  trialDirectory: string;
  evidenceRoot: string;
  bindingLock: ReferenceParticipantBindingLockV1;
  bindingLockSha256: string;
  repositoryRoot: string;
  resolveBindingLock: typeof resolveReferenceParticipantBindingFromLock;
  runJob: typeof runWorkspaceAgentJob;
}): Promise<{ evidence: ReferenceCommunicationTrialEvidenceV1; job: WorkspaceAgentJobResult }> {
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
): Promise<ReferenceParticipantCommunicationMatrixEvidenceV1> {
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
  const evidence: ReferenceParticipantCommunicationMatrixEvidenceV1 = {
    schemaVersion: 'reference-participant-communication-matrix-v1',
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
    productionInitialTimeoutMs: 1_800_000,
    productionRetransmissionTimeoutMs: REFERENCE_COMMUNICATION_PRODUCTION_RETRANSMISSION_TIMEOUT_MS,
    maxProductionRetransmissions: 1,
    continuationObservationTimeoutMs: REFERENCE_COMMUNICATION_OBSERVATION_TIMEOUT_MS,
    status: 'PASS',
    matrices: {
      A: { validationScope: 'NATIVE_ENVELOPE_ONLY', gatePassed: false, trials: [] },
      B: { gatePassed: null, expectedPayloadBytes: 0, trials: [] },
      C: { gatePassed: null, timeoutPolicyReviewRequired: false, trials: [] },
    },
  };

  const finish = async (): Promise<ReferenceParticipantCommunicationMatrixEvidenceV1> => {
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
  if (largePayloadBytes < 22 * 1024 || largePayloadBytes > 26 * 1024) {
    evidence.status = 'MATRIX_B_FAILED';
    evidence.stopReason = `Synthetic large object size ${largePayloadBytes} is outside 22-26 KiB.`;
    return finish();
  }
  await mkdir(join(evidenceRoot, 'trials'), { recursive: false });

  const runTrial = async (trialId: string, prompt: string, expectedPayload?: Record<string, unknown>) => {
    const trialDirectory = join(evidenceRoot, 'trials', trialId);
    await mkdir(trialDirectory, { recursive: false });
    return runInitialTrial({
      trialId,
      prompt,
      ...(expectedPayload === undefined ? {} : { expectedPayload }),
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
        && trial.payloadMatchedExactly === true);
    await writeJsonCreateOnly(join(evidenceRoot, 'matrix-A.json'), evidence.matrices.A);
    if (!evidence.matrices.A.gatePassed) {
      evidence.status = 'NATIVE_ENVELOPE_ASSISTANCE_UNRELIABLE';
      evidence.stopReason = 'Matrix A did not achieve 3/3 process completion and Host envelope validity.';
      return finish();
    }

    for (let index = 1; index <= 3; index += 1) {
      const trialId = `B-${String(index).padStart(2, '0')}`;
      const { evidence: trialEvidence } = await runTrial(trialId, initialPrompt(trialId, largePayload), largePayload);
      evidence.matrices.B.trials.push(trialEvidence);
    }
    evidence.matrices.B.gatePassed = evidence.matrices.B.trials.length === 3
      && evidence.matrices.B.trials.every(trial => trial.runtimeOutcome === 'COMPLETED'
        && trial.hostEnvelopeValid
        && trial.payloadMatchedExactly === true);
    await writeJsonCreateOnly(join(evidenceRoot, 'matrix-B.json'), evidence.matrices.B);
    if (!evidence.matrices.B.gatePassed) {
      evidence.status = 'MATRIX_B_FAILED';
      evidence.stopReason = 'Matrix B did not achieve 3/3 completion, envelope validity, and exact payload equality.';
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
      let continuationOutcome: ReferenceCommunicationContinuationTrialEvidenceV1['continuationRuntimeOutcome'] = 'NOT_RUN';
      let continuationEnvelopeValid = false;
      let continuationMatchedExactly = false;
      let continuationFailureReason: string | undefined;
      let continuationJob: WorkspaceAgentJobResult | undefined;
      if (initial.job.ok && initialEnvelope.valid && initial.job.threadRef !== undefined) {
        const binding = await resolveLockedParticipant(resolveBindingLock, repositoryRoot, bindingLock);
        try {
          const continuationPrompt = 'RE-EMIT ONLY: Return the exact complete JSON object from your previous completed turn. Emit only the JSON object, with no prose or Markdown.';
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
              initial.job.threadRef,
              REFERENCE_COMMUNICATION_OBSERVATION_TIMEOUT_MS,
            );
          } finally {
            await rm(continuationWorkspaceRoot, { recursive: true, force: true });
          }
          const continuationResult = envelope(continuationJob);
          continuationOutcome = runtimeOutcome(continuationJob);
          continuationEnvelopeValid = continuationResult.valid;
          continuationMatchedExactly = continuationResult.valid
            && continuationResult.parsedObject !== undefined
            && isDeepStrictEqual(continuationResult.parsedObject, largePayload);
          if (!continuationResult.valid) continuationFailureReason = continuationResult.reason;
          const timing = outputTiming(continuationJob);
          const continuationPayloadRef = join(trialDirectory, 'continuation-terminal-payload.txt');
          const continuationTraceRef = join(trialDirectory, 'continuation-execution-trace.json');
          await writeTextCreateOnly(continuationPayloadRef, rawOutput(continuationJob));
          await writeJsonCreateOnly(continuationTraceRef, continuationJob.executionTrace);
          const withinObservation = continuationJob.ok
            && timing.terminalCompletionLatencyMs !== null
            && timing.terminalCompletionLatencyMs <= REFERENCE_COMMUNICATION_OBSERVATION_TIMEOUT_MS;
          evidence.matrices.C.trials.push({
            trialId,
            bindingLockSha256,
            schemaSha256,
            initialRuntimeOutcome: runtimeOutcome(initial.job),
            initialHostEnvelopeValid: initialEnvelope.valid,
            initialPayloadMatchedExactly: initial.evidence.payloadMatchedExactly === true,
            continuationRuntimeOutcome: continuationOutcome,
            continuationHostEnvelopeValid: continuationEnvelopeValid,
            hostRepairApplied: false,
            initialElapsedMs: initial.job.executionTrace.terminal.elapsedMs,
            ...timing,
            withinProductionCeiling: timing.terminalCompletionLatencyMs !== null
              && timing.terminalCompletionLatencyMs <= REFERENCE_COMMUNICATION_PRODUCTION_RETRANSMISSION_TIMEOUT_MS,
            withinObservationCeiling: withinObservation,
            payloadMatchedExactly: continuationMatchedExactly,
            initialTerminalPayloadRef: initial.evidence.terminalPayloadRef,
            initialExecutionTraceRef: initial.evidence.executionTraceRef,
            continuationTerminalPayloadRef: relative(evidenceRoot, continuationPayloadRef),
            continuationExecutionTraceRef: relative(evidenceRoot, continuationTraceRef),
            threadRef: initial.job.threadRef,
            ...(continuationFailureReason === undefined ? {} : { continuationFailureReason }),
          });
        } catch (error) {
          continuationFailureReason = error instanceof Error ? error.message : String(error);
          evidence.matrices.C.trials.push({
            trialId,
            bindingLockSha256,
            schemaSha256,
            initialRuntimeOutcome: runtimeOutcome(initial.job),
            initialHostEnvelopeValid: initialEnvelope.valid,
            initialPayloadMatchedExactly: initial.evidence.payloadMatchedExactly === true,
            continuationRuntimeOutcome: 'CONTINUATION_FAILURE',
            continuationHostEnvelopeValid: false,
            hostRepairApplied: false,
            initialElapsedMs: initial.job.executionTrace.terminal.elapsedMs,
            startupLatencyMs: null,
            firstOutputActivityLatencyMs: null,
            terminalCompletionLatencyMs: null,
            lastObservableActivityElapsedMs: null,
            withinProductionCeiling: false,
            withinObservationCeiling: false,
            payloadMatchedExactly: false,
            initialTerminalPayloadRef: initial.evidence.terminalPayloadRef,
            initialExecutionTraceRef: initial.evidence.executionTraceRef,
            continuationTerminalPayloadRef: relative(evidenceRoot, join(trialDirectory, 'continuation-terminal-payload.txt')),
            continuationExecutionTraceRef: relative(evidenceRoot, join(trialDirectory, 'continuation-execution-trace.json')),
            threadRef: initial.job.threadRef,
            continuationFailureReason,
          });
        }
      } else {
        evidence.matrices.C.trials.push({
          trialId,
          bindingLockSha256,
          schemaSha256,
          initialRuntimeOutcome: runtimeOutcome(initial.job),
          initialHostEnvelopeValid: initialEnvelope.valid,
          initialPayloadMatchedExactly: initial.evidence.payloadMatchedExactly === true,
          continuationRuntimeOutcome: initial.job.ok && initial.job.threadRef === undefined
            ? 'THREAD_IDENTITY_UNAVAILABLE'
            : 'NOT_RUN',
          continuationHostEnvelopeValid: false,
          hostRepairApplied: false,
          initialElapsedMs: initial.job.executionTrace.terminal.elapsedMs,
          startupLatencyMs: null,
          firstOutputActivityLatencyMs: null,
          terminalCompletionLatencyMs: null,
          lastObservableActivityElapsedMs: initial.job.executionTrace.terminal.lastObservableActivityElapsedMs ?? null,
          withinProductionCeiling: false,
          withinObservationCeiling: false,
          payloadMatchedExactly: false,
          initialTerminalPayloadRef: initial.evidence.terminalPayloadRef,
          initialExecutionTraceRef: initial.evidence.executionTraceRef,
          continuationTerminalPayloadRef: relative(evidenceRoot, join(trialDirectory, 'continuation-terminal-payload.txt')),
          continuationExecutionTraceRef: relative(evidenceRoot, join(trialDirectory, 'continuation-execution-trace.json')),
          ...(initial.job.ok && initial.job.threadRef !== undefined ? { threadRef: initial.job.threadRef } : {}),
          continuationFailureReason: initial.job.ok
            ? 'Completed initial thread did not provide a thread identity.'
            : 'Initial large-object trial did not complete with a valid Host envelope.',
        });
      }
    }
    evidence.matrices.C.timeoutPolicyReviewRequired = evidence.matrices.C.trials.some(trial =>
      trial.terminalCompletionLatencyMs !== null
      && trial.terminalCompletionLatencyMs > REFERENCE_COMMUNICATION_PRODUCTION_RETRANSMISSION_TIMEOUT_MS
      && trial.terminalCompletionLatencyMs <= REFERENCE_COMMUNICATION_OBSERVATION_TIMEOUT_MS);
    evidence.matrices.C.gatePassed = evidence.matrices.C.trials.length === 3
      && evidence.matrices.C.trials.every(trial => trial.initialRuntimeOutcome === 'COMPLETED'
        && trial.initialHostEnvelopeValid
        && trial.initialPayloadMatchedExactly
        && trial.continuationRuntimeOutcome === 'COMPLETED'
        && trial.continuationHostEnvelopeValid
        && trial.payloadMatchedExactly
        && trial.withinProductionCeiling);
    await writeJsonCreateOnly(join(evidenceRoot, 'matrix-C.json'), evidence.matrices.C);
    if (!evidence.matrices.C.gatePassed) {
      if (evidence.matrices.C.timeoutPolicyReviewRequired) {
        evidence.status = 'CONTINUATION_TIMEOUT_POLICY_REVIEW';
        evidence.stopReason = 'At least one continuation completed after the 60-second production ceiling.';
      } else {
        evidence.status = 'CONTINUATION_UNRELIABLE';
        evidence.stopReason = 'Matrix C continuation runtime, identity, envelope, or payload validation failed.';
      }
    }
  } catch (error) {
    evidence.status = error instanceof ReferenceParticipantBindingDriftError ? 'BINDING_DRIFT' : 'RUNNER_FAILURE';
    evidence.stopReason = error instanceof Error ? error.message : String(error);
  }

  return finish();
}
