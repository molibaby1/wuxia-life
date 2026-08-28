import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdir, open } from 'node:fs/promises';
import { dirname } from 'node:path';
import { performance } from 'node:perf_hooks';
import { canonicalJson } from '../phase0/provenance';
import type { StructuredTerminalEnvelopeFailureReason } from '../../../src/evolution/structuredTerminalEnvelope';

const OUTPUT_ACTIVITY_WINDOW_MS = 100;

export const DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS = 240_000;

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
  failureClass?: 'ENVELOPE_FAILURE';
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
  };
  events: ParticipantExecutionTraceEventV1[];
  terminal: {
    outcome: 'completed' | 'timeout' | 'process_error';
    elapsedMs: number;
    lastObservableActivityElapsedMs?: number;
  };
}

export interface WorkspaceAgentJobInput {
  invocationRef: string;
  role: 'solution' | 'reviewer' | 'feedback' | 'hypothesis' | 'configuration-execution';
  workspaceRoot: string;
  prompt: string;
  traceArtifactPath?: string;
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

function chunkByteLength(chunk: unknown): number {
  if (typeof chunk === 'string') return Buffer.byteLength(chunk);
  if (chunk instanceof Uint8Array) return chunk.byteLength;
  return Buffer.byteLength(String(chunk));
}

async function runWorkspaceAgentProcess(
  input: WorkspaceAgentJobInput,
  options: WorkspaceAgentParticipantOptions,
  execution: {
    timeoutMs: number;
    buildArgs: () => string[];
    expectedThreadRef?: ParticipantThreadRef;
  },
): Promise<WorkspaceAgentJobResult> {
  const spawnProcess = options.spawnProcess ?? spawn;
  const { timeoutMs, buildArgs, expectedThreadRef } = execution;

  return new Promise(resolveResult => {
    const startedAt = performance.now();
    const trace: ParticipantExecutionTraceV1 = {
      schemaVersion: 'participant-execution-trace-v1',
      invocation: {
        startedAt: new Date().toISOString(),
        timeoutMs,
      },
      events: [],
      terminal: {
        outcome: 'process_error',
        elapsedMs: 0,
      },
    };
    let sequence = 0;
    let lastObservableActivityElapsedMs: number | undefined;
    let lastOutputEventElapsedMs: number | undefined;
    let activityFlushTimer: NodeJS.Timeout | undefined;
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
    let timeoutTimer: NodeJS.Timeout | undefined;
    const finish = async (result: Omit<WorkspaceAgentJobResult, 'executionTrace'>, outcome: ParticipantExecutionTraceV1['terminal']['outcome']): Promise<void> => {
      if (settled) return;
      settled = true;
      if (timeoutTimer !== undefined) clearTimeout(timeoutTimer);
      await persistTrace(outcome);
      resolveResult({ ...result, executionTrace: trace } as WorkspaceAgentJobResult);
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

    let stdout = '';
    let stderr = '';
    timeoutTimer = setTimeout(() => {
      const timeoutElapsedMs = elapsedMs();
      child.kill('SIGTERM');
      flushPendingActivity();
      record({ type: 'timeout', elapsedMs: timeoutElapsedMs });
      void finish({
        ok: false,
        errorKind: 'timeout',
        message: `workspace Agent job timed out after ${timeoutMs}ms`,
        rawOutput: combinedOutput(stdout, stderr),
      }, 'timeout');
    }, timeoutMs);

    child.stdout.on('data', chunk => {
      stdout += String(chunk);
      observeOutput('stdout', chunk);
    });
    child.stderr.on('data', chunk => {
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
  });
}

export async function runWorkspaceAgentJob(
  input: WorkspaceAgentJobInput,
  options: WorkspaceAgentParticipantOptions,
): Promise<WorkspaceAgentJobResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS;
  return runWorkspaceAgentProcess(input, options, {
    timeoutMs,
    buildArgs: () => options.buildArgs(input),
  });
}

export async function runWorkspaceAgentContinuation(
  input: WorkspaceAgentJobInput,
  options: WorkspaceAgentParticipantOptions,
  threadRef: ParticipantThreadRef,
  timeoutMs: number,
): Promise<WorkspaceAgentJobResult> {
  const continuation = options.sameThreadContinuation;
  if (continuation === undefined || continuation.provider !== threadRef.provider) {
    const trace: ParticipantExecutionTraceV1 = {
      schemaVersion: 'participant-execution-trace-v1',
      invocation: {
        startedAt: new Date().toISOString(),
        timeoutMs,
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
    timeoutMs,
    buildArgs: () => continuation.buildArgs(input, threadRef),
    expectedThreadRef: threadRef,
  });
}
