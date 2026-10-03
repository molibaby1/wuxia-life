import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdir, open } from 'node:fs/promises';
import { dirname } from 'node:path';
import { performance } from 'node:perf_hooks';
import { canonicalJson } from '../phase0/provenance';
import type { StructuredTerminalEnvelopeFailureReason } from '../../../src/evolution/structuredTerminalEnvelope';

const OUTPUT_ACTIVITY_WINDOW_MS = 100;

/** Participant abnormal-safety watchdog values; these are not execution budgets. */
export const PARTICIPANT_TIMEOUT_EVALUATION_START_MS = 1_800_000;
export const PARTICIPANT_STDOUT_INACTIVITY_TIMEOUT_MS = 600_000;
export const PARTICIPANT_ABSOLUTE_TIMEOUT_MS = 2_700_000;

type WorkspaceAgentTimeoutPolicy =
  | { kind: 'FIXED'; timeoutMs: number }
  | {
      kind: 'PARTICIPANT_ACTIVITY_AWARE_V1';
      evaluationStartMs: number;
      stdoutInactivityMs: number;
      absoluteCapMs: number;
    };

export interface ParticipantActivityAwareTimeoutPolicyTraceV1 {
  kind: 'PARTICIPANT_ACTIVITY_AWARE_V1';
  evaluationStartMs: number;
  stdoutInactivityMs: number;
  absoluteCapMs: number;
}

const PARTICIPANT_INITIAL_TIMEOUT_POLICY: WorkspaceAgentTimeoutPolicy = {
  kind: 'PARTICIPANT_ACTIVITY_AWARE_V1',
  evaluationStartMs: PARTICIPANT_TIMEOUT_EVALUATION_START_MS,
  stdoutInactivityMs: PARTICIPANT_STDOUT_INACTIVITY_TIMEOUT_MS,
  absoluteCapMs: PARTICIPANT_ABSOLUTE_TIMEOUT_MS,
};

function resolveWorkspaceAgentInitialTimeoutPolicy(
  _role: WorkspaceAgentJobInput['role'],
  explicitTimeoutMs?: number,
): WorkspaceAgentTimeoutPolicy {
  if (explicitTimeoutMs !== undefined) return { kind: 'FIXED', timeoutMs: explicitTimeoutMs };
  return PARTICIPANT_INITIAL_TIMEOUT_POLICY;
}

function timeoutPolicyLimitMs(policy: WorkspaceAgentTimeoutPolicy): number {
  return policy.kind === 'FIXED' ? policy.timeoutMs : policy.absoluteCapMs;
}

function timeoutPolicyTraceMetadata(
  policy: WorkspaceAgentTimeoutPolicy,
): ParticipantActivityAwareTimeoutPolicyTraceV1 | undefined {
  return policy.kind === 'PARTICIPANT_ACTIVITY_AWARE_V1'
    ? {
        kind: policy.kind,
        evaluationStartMs: policy.evaluationStartMs,
        stdoutInactivityMs: policy.stdoutInactivityMs,
        absoluteCapMs: policy.absoluteCapMs,
      }
    : undefined;
}

export function describeWorkspaceAgentInitialTimeout(
  role: WorkspaceAgentJobInput['role'],
  explicitTimeoutMs?: number,
): { timeoutMs: number; timeoutPolicy?: ParticipantActivityAwareTimeoutPolicyTraceV1 } {
  const policy = resolveWorkspaceAgentInitialTimeoutPolicy(role, explicitTimeoutMs);
  const timeoutPolicy = timeoutPolicyTraceMetadata(policy);
  return {
    timeoutMs: timeoutPolicyLimitMs(policy),
    ...(timeoutPolicy === undefined ? {} : { timeoutPolicy }),
  };
}

export type ParticipantExecutionTraceEventType =
  | 'process_start'
  | 'output_activity'
  | 'process_close'
  | 'timeout'
  | 'participant_terminal_validation'
  | 'participant_envelope_retransmission_requested'
  | 'participant_envelope_retransmission_completed';

export interface ParticipantExecutionTraceEventV1 {
  seq: number;
  type: ParticipantExecutionTraceEventType;
  elapsedMs: number;
  stream?: 'stdout' | 'stderr';
  bytes?: number;
  activityKind?: string;
  detail?: string;
  attempt?: 0 | 1;
  envelopeValid?: boolean;
  envelopeFailureReason?: StructuredTerminalEnvelopeFailureReason;
  schemaValidationAttempted?: boolean;
  schemaValid?: boolean;
  accepted?: boolean;
  retransmissionAttempt?: 1;
  failureClass?: 'ENVELOPE_FAILURE' | 'SCHEMA_FAILURE';
  sameThread?: boolean;
  timeoutMs?: number;
  participantCapability?: 'SAME_THREAD_CONTINUATION';
  runtimeOutcome?: 'COMPLETED' | 'TIMEOUT' | 'CONTINUATION_FAILURE' | 'RUNTIME_FAILURE';
  retransmissionEligible?: boolean;
  retransmissionNotAttemptedReason?: 'CAPABILITY_UNAVAILABLE' | 'POLICY_DISABLED';
}

export interface ParticipantExecutionTraceV1 {
  schemaVersion: 'participant-execution-trace-v1';
  invocation: {
    startedAt: string;
    timeoutMs: number;
    timeoutPolicy?: SolutionActivityAwareTimeoutPolicyTraceV1;
  };
  events: ParticipantExecutionTraceEventV1[];
  terminal: {
    outcome: 'completed' | 'timeout' | 'process_error';
    elapsedMs: number;
    lastObservableActivityElapsedMs?: number;
    lastStdoutActivityElapsedMs?: number;
  };
}

export interface WorkspaceAgentJobInput {
  invocationRef: string;
  role: 'solution' | 'reviewer' | 'feedback' | 'hypothesis' | 'configuration-execution';
  workspaceRoot: string;
  prompt: string;
  traceArtifactPath?: string;
  providerStdoutArtifactPath?: string;
  providerStderrArtifactPath?: string;
}

export interface ParticipantThreadRef {
  provider: string;
  opaqueId: string;
}

export type WorkspaceAgentOutputInterpretation =
  | {
      ok: true;
      rawOutput: string;
      threadRef?: ParticipantThreadRef;
    }
  | {
      ok: false;
      errorKind: 'invalid_output' | 'continuation';
      message: string;
    };

export interface WorkspaceAgentSameThreadContinuation {
  provider: string;
  buildArgs: (
    input: WorkspaceAgentJobInput,
    threadRef: ParticipantThreadRef,
  ) => string[];
}

export interface WorkspaceAgentCompletedOutputInput {
  job: WorkspaceAgentJobInput;
  stdout: string;
  stderr: string;
  expectedThreadRef?: ParticipantThreadRef;
}

export interface WorkspaceAgentJobSuccess {
  ok: true;
  rawOutput: string;
  stderr: string;
  exitCode: 0;
  threadRef?: ParticipantThreadRef;
  executionTrace: ParticipantExecutionTraceV1;
}

export interface WorkspaceAgentJobFailure {
  ok: false;
  errorKind: 'runtime_unavailable' | 'process' | 'timeout' | 'invalid_output' | 'continuation';
  message: string;
  rawOutput?: string;
  exitCode?: number;
  executionTrace: ParticipantExecutionTraceV1;
}

export type WorkspaceAgentJobResult = WorkspaceAgentJobSuccess | WorkspaceAgentJobFailure;

export interface WorkspaceAgentParticipantOptions {
  executable: string;
  buildArgs: (input: WorkspaceAgentJobInput) => string[];
  model?: string;
  reasoningEffort?: string;
  /** Observability-only Host-visible binding facts; never used by buildArgs/process execution. */
  bindingMetadata?: {
    bindingId?: string;
    executableVersion?: string;
    ambientCodexConfigSha256?: string | 'ABSENT';
    nativeEnvelopeSchemaSha256?: string;
    structuredResultDeliveryMode?: 'WORKSPACE_ARTIFACT_RECEIPT_V1';
    nativeReceiptSchemaSha256?: string;
  };
  spawnProcess?: typeof spawn;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
  interpretCompletedOutput?: (
    input: WorkspaceAgentCompletedOutputInput,
  ) => WorkspaceAgentOutputInterpretation;
  sameThreadContinuation?: WorkspaceAgentSameThreadContinuation;
}

function combinedOutput(stdout: string, stderr: string): string {
  return stderr.length > 0 ? `${stdout}\n[stderr]\n${stderr}` : stdout;
}

async function writeCreateOnly(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(`${canonicalJson(value)}\n`);
  } finally {
    await handle.close();
  }
}

async function writeCreateOnlyBuffer(path: string, value: Buffer): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(value);
  } finally {
    await handle.close();
  }
}

function chunkByteLength(chunk: unknown): number {
  if (typeof chunk === 'string') return Buffer.byteLength(chunk);
  if (chunk instanceof Uint8Array) return chunk.byteLength;
  return Buffer.byteLength(String(chunk));
}

async function runWorkspaceAgentProcess(
  input: WorkspaceAgentJobInput,
  options: WorkspaceAgentParticipantOptions,
  execution: {
    timeoutPolicy: WorkspaceAgentTimeoutPolicy;
    buildArgs: () => string[];
    expectedThreadRef?: ParticipantThreadRef;
  },
): Promise<WorkspaceAgentJobResult> {
  const spawnProcess = options.spawnProcess ?? spawn;
  const { timeoutPolicy, buildArgs, expectedThreadRef } = execution;
  const timeoutMs = timeoutPolicyLimitMs(timeoutPolicy);
  const timeoutPolicyMetadata = timeoutPolicyTraceMetadata(timeoutPolicy);

  return new Promise(resolveResult => {
    const startedAt = performance.now();
    const trace: ParticipantExecutionTraceV1 = {
      schemaVersion: 'participant-execution-trace-v1',
      invocation: {
        startedAt: new Date().toISOString(),
        timeoutMs,
        ...(timeoutPolicyMetadata === undefined ? {} : { timeoutPolicy: timeoutPolicyMetadata }),
      },
      events: [],
      terminal: {
        outcome: 'process_error',
        elapsedMs: 0,
      },
    };
    let sequence = 0;
    let lastObservableActivityElapsedMs: number | undefined;
    let lastStdoutActivityElapsedMs: number | undefined;
    let lastOutputEventElapsedMs: number | undefined;
    let activityFlushTimer: NodeJS.Timeout | undefined;
    let rescheduleActivityAwareTimeout: (() => void) | undefined;
    const pendingActivity = new Map<'stdout' | 'stderr', { bytes: number; elapsedMs: number }>();
    const elapsedMs = (): number => Math.max(0, Math.round(performance.now() - startedAt));
    const record = (event: Omit<ParticipantExecutionTraceEventV1, 'seq'>): void => {
      trace.events.push({ seq: sequence, ...event });
      sequence += 1;
    };
    const flushPendingActivity = (): void => {
      if (activityFlushTimer !== undefined) {
        clearTimeout(activityFlushTimer);
        activityFlushTimer = undefined;
      }
      const entries = [...pendingActivity.entries()].sort(([leftStream, left], [rightStream, right]) => (
        left.elapsedMs - right.elapsedMs
        || (leftStream === 'stdout' ? -1 : rightStream === 'stdout' ? 1 : 0)
      ));
      for (const [stream, pending] of entries) {
        record({
          type: 'output_activity',
          elapsedMs: pending.elapsedMs,
          stream,
          bytes: pending.bytes,
        });
        pendingActivity.delete(stream);
        lastOutputEventElapsedMs = pending.elapsedMs;
      }
    };
    const scheduleActivityFlush = (): void => {
      if (activityFlushTimer !== undefined || pendingActivity.size === 0) return;
      const delay = lastOutputEventElapsedMs === undefined
        ? 0
        : Math.max(0, OUTPUT_ACTIVITY_WINDOW_MS - (elapsedMs() - lastOutputEventElapsedMs));
      activityFlushTimer = setTimeout(() => {
        activityFlushTimer = undefined;
        flushPendingActivity();
        scheduleActivityFlush();
      }, delay);
    };
    const observeOutput = (stream: 'stdout' | 'stderr', chunk: unknown): void => {
      const bytes = chunkByteLength(chunk);
      if (bytes <= 0) return;
      const observedAt = elapsedMs();
      const current = pendingActivity.get(stream);
      pendingActivity.set(stream, {
        bytes: (current?.bytes ?? 0) + bytes,
        elapsedMs: observedAt,
      });
      lastObservableActivityElapsedMs = observedAt;
      if (stream === 'stdout') {
        lastStdoutActivityElapsedMs = observedAt;
        rescheduleActivityAwareTimeout?.();
      }
      if (lastOutputEventElapsedMs === undefined || observedAt - lastOutputEventElapsedMs >= OUTPUT_ACTIVITY_WINDOW_MS) {
        flushPendingActivity();
      } else {
        scheduleActivityFlush();
      }
    };
    const persistTrace = async (outcome: ParticipantExecutionTraceV1['terminal']['outcome']): Promise<void> => {
      flushPendingActivity();
      const terminalElapsedMs = elapsedMs();
      trace.terminal = {
        outcome,
        elapsedMs: terminalElapsedMs,
        ...(lastObservableActivityElapsedMs === undefined ? {} : { lastObservableActivityElapsedMs }),
        ...(lastStdoutActivityElapsedMs === undefined ? {} : { lastStdoutActivityElapsedMs }),
      };
      if (input.traceArtifactPath !== undefined) {
        try {
          await writeCreateOnly(input.traceArtifactPath, trace);
        } catch {
          // Execution trace is a sidecar artifact; preserve the existing job result if its write fails.
        }
      }
    };
    let child: ChildProcessWithoutNullStreams;
    let processStarted = false;
    let args: string[];
    let settled = false;
    let timeoutTriggered = false;
    let timeoutTimer: NodeJS.Timeout | undefined;
    let stdout = '';
    let stderr = '';
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    const persistProviderStreams = async (): Promise<void> => {
      const streams = [
        [input.providerStdoutArtifactPath, stdoutChunks],
        [input.providerStderrArtifactPath, stderrChunks],
      ] as const;
      await Promise.all(streams.map(async ([path, chunks]) => {
        if (path === undefined) return;
        try {
          await writeCreateOnlyBuffer(path, Buffer.concat(chunks));
        } catch {
          // Raw provider streams are sidecar evidence and do not change job interpretation.
        }
      }));
    };
    const finish = async (result: Omit<WorkspaceAgentJobResult, 'executionTrace'>, outcome: ParticipantExecutionTraceV1['terminal']['outcome']): Promise<void> => {
      if (settled) return;
      settled = true;
      if (timeoutTimer !== undefined) clearTimeout(timeoutTimer);
      flushPendingActivity();
      await persistProviderStreams();
      await persistTrace(outcome);
      resolveResult({ ...result, executionTrace: trace } as WorkspaceAgentJobResult);
    };
    const terminateForTimeout = (detail?: string): void => {
      if (settled || timeoutTriggered) return;
      timeoutTriggered = true;
      if (timeoutTimer !== undefined) {
        clearTimeout(timeoutTimer);
        timeoutTimer = undefined;
      }
      const timeoutElapsedMs = elapsedMs();
      child.kill('SIGTERM');
      flushPendingActivity();
      record({ type: 'timeout', elapsedMs: timeoutElapsedMs, ...(detail === undefined ? {} : { detail }) });
      void finish({
        ok: false,
        errorKind: 'timeout',
        message: detail === undefined
          ? `workspace Agent job timed out after ${timeoutMs}ms`
          : `workspace Agent job timed out under PARTICIPANT_ACTIVITY_AWARE_V1: ${detail}`,
        rawOutput: combinedOutput(stdout, stderr),
      }, 'timeout');
    };
    const scheduleActivityAwareTimeout = (): void => {
      if (timeoutPolicy.kind !== 'PARTICIPANT_ACTIVITY_AWARE_V1' || settled || timeoutTriggered) return;
      if (timeoutTimer !== undefined) clearTimeout(timeoutTimer);

      const currentElapsedMs = elapsedMs();
      if (currentElapsedMs >= timeoutPolicy.absoluteCapMs) {
        terminateForTimeout('PARTICIPANT_ABSOLUTE_CAP');
        return;
      }

      let nextDeadlineMs: number;
      if (currentElapsedMs < timeoutPolicy.evaluationStartMs) {
        nextDeadlineMs = timeoutPolicy.evaluationStartMs;
      } else {
        const lastStdoutMs = lastStdoutActivityElapsedMs ?? 0;
        const inactivityDeadlineMs = Math.max(
          timeoutPolicy.evaluationStartMs,
          lastStdoutMs + timeoutPolicy.stdoutInactivityMs,
        );
        if (currentElapsedMs >= inactivityDeadlineMs) {
          terminateForTimeout('PARTICIPANT_STDOUT_INACTIVITY');
          return;
        }
        nextDeadlineMs = inactivityDeadlineMs;
      }

      timeoutTimer = setTimeout(
        scheduleActivityAwareTimeout,
        Math.max(1, Math.min(nextDeadlineMs, timeoutPolicy.absoluteCapMs) - currentElapsedMs),
      );
    };
    try {
      args = buildArgs();
      child = spawnProcess(options.executable, args, {
        cwd: input.workspaceRoot,
        env: { ...process.env, ...options.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      }) as ChildProcessWithoutNullStreams;
    } catch (error) {
      void finish({
        ok: false,
        errorKind: 'process',
        message: `unable to start workspace Agent job ${input.invocationRef}: ${String(error)}`,
      }, 'process_error');
      return;
    }

    child.stdout.on('data', chunk => {
      stdoutChunks.push(Buffer.isBuffer(chunk) ? Buffer.from(chunk) : Buffer.from(String(chunk)));
      stdout += String(chunk);
      observeOutput('stdout', chunk);
    });
    child.stderr.on('data', chunk => {
      stderrChunks.push(Buffer.isBuffer(chunk) ? Buffer.from(chunk) : Buffer.from(String(chunk)));
      stderr += String(chunk);
      observeOutput('stderr', chunk);
    });
    child.on('error', error => {
      const errorCode = (error as NodeJS.ErrnoException).code;
      void finish({
        ok: false,
        errorKind: errorCode === 'ENOENT' ? 'runtime_unavailable' : 'process',
        message: errorCode === 'ENOENT'
          ? `workspace Agent runtime is unavailable: ${options.executable}`
          : `workspace Agent job failed to start: ${String(error)}`,
        rawOutput: combinedOutput(stdout, stderr),
      }, 'process_error');
    });
    child.once('spawn', () => {
      processStarted = true;
      record({ type: 'process_start', elapsedMs: elapsedMs() });
    });
    child.on('close', code => {
      if (settled) return;
      flushPendingActivity();
      const closeElapsedMs = elapsedMs();
      if (processStarted) record({ type: 'process_close', elapsedMs: closeElapsedMs });
      if (code === 0) {
        if (options.interpretCompletedOutput === undefined) {
          void finish({ ok: true, rawOutput: stdout, stderr, exitCode: 0 }, 'completed');
          return;
        }
        const interpretation = options.interpretCompletedOutput({
          job: input,
          stdout,
          stderr,
          expectedThreadRef,
        });
        if (!interpretation.ok) {
          void finish({
            ok: false,
            errorKind: interpretation.errorKind,
            message: interpretation.message,
            rawOutput: stdout,
          }, 'completed');
          return;
        }
        void finish({
          ok: true,
          rawOutput: interpretation.rawOutput,
          stderr,
          exitCode: 0,
          ...(interpretation.threadRef === undefined ? {} : { threadRef: interpretation.threadRef }),
        }, 'completed');
        return;
      }
      const rawOutput = combinedOutput(stdout, stderr);
      void finish({
        ok: false,
        errorKind: 'process',
        message: `workspace Agent job exited with code ${String(code)}`,
        rawOutput,
        ...(typeof code === 'number' ? { exitCode: code } : {}),
      }, 'process_error');
    });

    if (timeoutPolicy.kind === 'FIXED') {
      timeoutTimer = setTimeout(() => terminateForTimeout(), timeoutPolicy.timeoutMs);
    } else {
      rescheduleActivityAwareTimeout = scheduleActivityAwareTimeout;
      scheduleActivityAwareTimeout();
    }
  });
}

export async function runWorkspaceAgentJob(
  input: WorkspaceAgentJobInput,
  options: WorkspaceAgentParticipantOptions,
  /** Host-only deterministic scheduler seam; production callers use the Role-derived policy. */
  timeoutPolicyOverride?: WorkspaceAgentTimeoutPolicy,
): Promise<WorkspaceAgentJobResult> {
  const timeoutPolicy = options.timeoutMs === undefined
    ? timeoutPolicyOverride ?? resolveWorkspaceAgentInitialTimeoutPolicy(input.role)
    : { kind: 'FIXED' as const, timeoutMs: options.timeoutMs };
  return runWorkspaceAgentProcess(input, options, {
    timeoutPolicy,
    buildArgs: () => options.buildArgs(input),
  });
}

export async function runWorkspaceAgentContinuation(
  input: WorkspaceAgentJobInput,
  options: WorkspaceAgentParticipantOptions,
  threadRef: ParticipantThreadRef,
  timeoutMs?: number,
  /** Host-only deterministic scheduler seam; production callers use the Role-derived policy. */
  timeoutPolicyOverride?: WorkspaceAgentTimeoutPolicy,
): Promise<WorkspaceAgentJobResult> {
  const continuation = options.sameThreadContinuation;
  const timeoutPolicy = timeoutMs !== undefined
    ? { kind: 'FIXED' as const, timeoutMs }
    : options.timeoutMs !== undefined
      ? { kind: 'FIXED' as const, timeoutMs: options.timeoutMs }
      : timeoutPolicyOverride ?? resolveWorkspaceAgentInitialTimeoutPolicy(input.role);
  const effectiveTimeoutMs = timeoutPolicyLimitMs(timeoutPolicy);
  const timeoutPolicyMetadata = timeoutPolicyTraceMetadata(timeoutPolicy);
  if (continuation === undefined || continuation.provider !== threadRef.provider) {
    const trace: ParticipantExecutionTraceV1 = {
      schemaVersion: 'participant-execution-trace-v1',
      invocation: {
        startedAt: new Date().toISOString(),
        timeoutMs: effectiveTimeoutMs,
        ...(timeoutPolicyMetadata === undefined ? {} : { timeoutPolicy: timeoutPolicyMetadata }),
      },
      events: [],
      terminal: {
        outcome: 'process_error',
        elapsedMs: 0,
      },
    };
    return {
      ok: false,
      errorKind: 'continuation',
      message: `workspace Agent continuation provider mismatch for ${input.invocationRef}`,
      executionTrace: trace,
    };
  }
  return runWorkspaceAgentProcess(input, options, {
    timeoutPolicy,
    buildArgs: () => continuation.buildArgs(input, threadRef),
    expectedThreadRef: threadRef,
  });
}
