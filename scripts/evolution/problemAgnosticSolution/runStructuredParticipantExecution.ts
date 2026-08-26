import { mkdir, open } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { validateStructuredTerminalEnvelope } from '../../../src/evolution/structuredTerminalEnvelope';
import {
  DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS,
  runWorkspaceAgentContinuation,
  runWorkspaceAgentJob,
  type ParticipantExecutionTraceEventV1,
  type ParticipantExecutionTraceV1,
  type ParticipantThreadRef,
  type WorkspaceAgentJobFailure,
  type WorkspaceAgentJobInput,
  type WorkspaceAgentJobResult,
  type WorkspaceAgentParticipantOptions,
} from './agentParticipant';
import {
  ENVELOPE_RETRANSMISSION_TIMEOUT_MS,
  type EnvelopeRetransmissionObservation,
  type EnvelopeRetransmissionOutcome,
  renderEnvelopeRetransmissionRequestV1,
} from './envelopeRetransmission';

export type StructuredParticipantExecutionResult<T> =
  | {
      ok: true;
      value: T;
      rawOutput: string;
      acceptedAttempt: 0 | 1;
      recovery: EnvelopeRetransmissionObservation;
      executionTrace: ParticipantExecutionTraceV1;
    }
  | {
      ok: false;
      errorKind: WorkspaceAgentJobFailure['errorKind'];
      message: string;
      rawOutput?: string;
      recovery: EnvelopeRetransmissionObservation;
      executionTrace: ParticipantExecutionTraceV1;
    };

async function writeCreateOnlyText(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(content);
  } finally {
    await handle.close();
  }
}

function notAttemptedRecovery(): EnvelopeRetransmissionObservation {
  return { eligible: false, attempted: false, outcome: 'NOT_ATTEMPTED' };
}

function retransmissionNotAttemptedReason(
  retransmissionEnabled: boolean,
  participant: WorkspaceAgentParticipantOptions,
  threadRef: ParticipantThreadRef | undefined,
): 'CAPABILITY_UNAVAILABLE' | 'POLICY_DISABLED' {
  if (!retransmissionEnabled) return 'POLICY_DISABLED';
  return 'CAPABILITY_UNAVAILABLE';
}

function annotateAttemptEvents(
  events: ParticipantExecutionTraceEventV1[],
  attempt: 0 | 1,
  elapsedOffsetMs: number,
): ParticipantExecutionTraceEventV1[] {
  return events.map(event => ({
    ...event,
    attempt,
    elapsedMs: event.elapsedMs + elapsedOffsetMs,
  }));
}

function composeExecutionTrace(input: {
  aggregateStartedWallClockMs: number;
  aggregateStartedMonotonic: number;
  timeoutMs: number;
  attempt0Trace: ParticipantExecutionTraceV1;
  attempt1Trace?: ParticipantExecutionTraceV1;
  attempt1ElapsedOffsetMs?: number;
  lifecycleEvents: Omit<ParticipantExecutionTraceEventV1, 'seq'>[];
  terminalOutcome: ParticipantExecutionTraceV1['terminal']['outcome'];
}): ParticipantExecutionTraceV1 {
  const attempt1Offset = input.attempt1ElapsedOffsetMs ?? 0;
  const processEvents = [
    ...annotateAttemptEvents(input.attempt0Trace.events, 0, 0),
    ...(input.attempt1Trace === undefined
      ? []
      : annotateAttemptEvents(input.attempt1Trace.events, 1, attempt1Offset)),
  ];

  const unsorted = [...processEvents, ...input.lifecycleEvents];
  unsorted.sort((left, right) => left.elapsedMs - right.elapsedMs);
  const events = unsorted.map((event, index) => ({ ...event, seq: index }));

  const attempt0Last = input.attempt0Trace.terminal.lastObservableActivityElapsedMs;
  const attempt1Last = input.attempt1Trace?.terminal.lastObservableActivityElapsedMs;
  const lastObservableActivityElapsedMs = attempt1Last === undefined
    ? attempt0Last
    : Math.max(attempt0Last ?? 0, attempt1Last + attempt1Offset);

  return {
    schemaVersion: 'participant-execution-trace-v1',
    invocation: {
      startedAt: new Date(input.aggregateStartedWallClockMs).toISOString(),
      timeoutMs: input.timeoutMs,
    },
    events,
    terminal: {
      outcome: input.terminalOutcome,
      elapsedMs: Math.max(0, Math.round(performance.now() - input.aggregateStartedMonotonic)),
      ...(lastObservableActivityElapsedMs === undefined
        ? {}
        : { lastObservableActivityElapsedMs }),
    },
  };
}

function runtimeFailureResult(
  job: Extract<WorkspaceAgentJobResult, { ok: false }>,
  input: {
    aggregateStartedWallClockMs: number;
    aggregateStartedMonotonic: number;
    timeoutMs: number;
    attempt0Trace: ParticipantExecutionTraceV1;
    attempt1Trace?: ParticipantExecutionTraceV1;
    attempt1ElapsedOffsetMs?: number;
    lifecycleEvents: Omit<ParticipantExecutionTraceEventV1, 'seq'>[];
    recovery: EnvelopeRetransmissionObservation;
  },
): StructuredParticipantExecutionResult<never> {
  const terminalOutcome = job.errorKind === 'timeout'
    ? 'timeout'
    : 'process_error';
  return {
    ok: false,
    errorKind: job.errorKind,
    message: job.message,
    ...(job.rawOutput === undefined ? {} : { rawOutput: job.rawOutput }),
    recovery: input.recovery,
    executionTrace: composeExecutionTrace({
      aggregateStartedWallClockMs: input.aggregateStartedWallClockMs,
      aggregateStartedMonotonic: input.aggregateStartedMonotonic,
      timeoutMs: input.timeoutMs,
      attempt0Trace: input.attempt0Trace,
      attempt1Trace: input.attempt1Trace,
      attempt1ElapsedOffsetMs: input.attempt1ElapsedOffsetMs,
      lifecycleEvents: input.lifecycleEvents,
      terminalOutcome,
    }),
  };
}

function mapContinuationRuntimeOutcome(
  job: Extract<WorkspaceAgentJobResult, { ok: false }>,
): EnvelopeRetransmissionOutcome {
  if (job.errorKind === 'timeout') return 'TIMEOUT';
  if (job.errorKind === 'continuation') return 'CONTINUATION_FAILURE';
  return 'RUNTIME_FAILURE';
}

function canRetransmit(
  retransmissionEnabled: boolean,
  participant: WorkspaceAgentParticipantOptions,
  threadRef: ParticipantThreadRef | undefined,
): boolean {
  if (!retransmissionEnabled) return false;
  if (participant.sameThreadContinuation === undefined) return false;
  return threadRef !== undefined;
}

export async function runStructuredParticipantExecution<T>(input: {
  invocationRef: string;
  role: WorkspaceAgentJobInput['role'];
  workspaceRoot: string;
  destinationRoot: string;
  initialPrompt: string;
  expectedRoleSchemaName: string;
  participant: WorkspaceAgentParticipantOptions;
  retransmissionEnabled: boolean;
  validateSchema: (value: Record<string, unknown>) => T;
  validateAcceptedResult: (value: T) => Promise<void>;
}): Promise<StructuredParticipantExecutionResult<T>> {
  const aggregateStartedWallClockMs = Date.now();
  const aggregateStartedMonotonic = performance.now();
  const timeoutMs = input.participant.timeoutMs ?? DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS;
  const elapsedMs = (): number => Math.max(0, Math.round(performance.now() - aggregateStartedMonotonic));
  const lifecycleEvents: Omit<ParticipantExecutionTraceEventV1, 'seq'>[] = [];
  let recovery: EnvelopeRetransmissionObservation = notAttemptedRecovery();

  const traceContext = {
    aggregateStartedWallClockMs,
    aggregateStartedMonotonic,
    timeoutMs,
  };

  const jobInput: WorkspaceAgentJobInput = {
    invocationRef: input.invocationRef,
    role: input.role,
    workspaceRoot: input.workspaceRoot,
    prompt: input.initialPrompt,
  };

  const attempt0Job = await runWorkspaceAgentJob(jobInput, input.participant);
  if (!attempt0Job.ok) {
    if (attempt0Job.rawOutput !== undefined) {
      await writeCreateOnlyText(
        join(input.destinationRoot, 'terminal-attempt-0.txt'),
        attempt0Job.rawOutput,
      );
    }
    return runtimeFailureResult(attempt0Job, {
      ...traceContext,
      attempt0Trace: attempt0Job.executionTrace,
      lifecycleEvents,
      recovery: notAttemptedRecovery(),
    });
  }

  const attempt0Raw = attempt0Job.rawOutput;
  await writeCreateOnlyText(
    join(input.destinationRoot, 'terminal-attempt-0.txt'),
    attempt0Raw,
  );

  const attempt0Envelope = validateStructuredTerminalEnvelope(attempt0Raw);
  const attempt0Validation: Omit<ParticipantExecutionTraceEventV1, 'seq'> = {
    type: 'participant_terminal_validation',
    elapsedMs: elapsedMs(),
    attempt: 0,
    envelopeValid: attempt0Envelope.ok,
    schemaValidationAttempted: attempt0Envelope.ok,
    accepted: false,
    ...(attempt0Envelope.ok ? {} : { envelopeFailureReason: attempt0Envelope.reason }),
  };

  if (attempt0Envelope.ok) {
    let schemaValid = false;
    let parsedValue: T | undefined;
    try {
      parsedValue = input.validateSchema(attempt0Envelope.parsedObject);
      schemaValid = true;
    } catch (error) {
      lifecycleEvents.push({
        ...attempt0Validation,
        schemaValid: false,
      });
      return {
        ok: false,
        errorKind: 'invalid_output',
        message: String(error),
        rawOutput: attempt0Raw,
        recovery: notAttemptedRecovery(),
        executionTrace: composeExecutionTrace({
          ...traceContext,
          attempt0Trace: attempt0Job.executionTrace,
          lifecycleEvents,
          terminalOutcome: 'completed',
        }),
      };
    }

    try {
      await input.validateAcceptedResult(parsedValue);
    } catch (error) {
      lifecycleEvents.push({
        ...attempt0Validation,
        schemaValid: true,
        accepted: false,
      });
      return {
        ok: false,
        errorKind: 'invalid_output',
        message: String(error),
        rawOutput: attempt0Raw,
        recovery: notAttemptedRecovery(),
        executionTrace: composeExecutionTrace({
          ...traceContext,
          attempt0Trace: attempt0Job.executionTrace,
          lifecycleEvents,
          terminalOutcome: 'completed',
        }),
      };
    }

    lifecycleEvents.push({
      ...attempt0Validation,
      schemaValid: true,
      accepted: true,
    });
    return {
      ok: true,
      value: parsedValue,
      rawOutput: attempt0Raw,
      acceptedAttempt: 0,
      recovery: notAttemptedRecovery(),
      executionTrace: composeExecutionTrace({
        ...traceContext,
        attempt0Trace: attempt0Job.executionTrace,
        lifecycleEvents,
        terminalOutcome: 'completed',
      }),
    };
  }

  const threadRef = attempt0Job.threadRef;
  const eligible = canRetransmit(input.retransmissionEnabled, input.participant, threadRef);
  lifecycleEvents.push({
    ...attempt0Validation,
    ...(eligible ? {} : {
      retransmissionEligible: false,
      retransmissionNotAttemptedReason: retransmissionNotAttemptedReason(
        input.retransmissionEnabled,
        input.participant,
        threadRef,
      ),
    }),
  });

  if (!eligible) {
    return {
      ok: false,
      errorKind: 'invalid_output',
      message: 'structured terminal envelope validation failed',
      rawOutput: attempt0Raw,
      recovery: notAttemptedRecovery(),
      executionTrace: composeExecutionTrace({
        ...traceContext,
        attempt0Trace: attempt0Job.executionTrace,
        lifecycleEvents,
        terminalOutcome: 'completed',
      }),
    };
  }

  recovery = { eligible: true, attempted: true, outcome: 'NOT_ATTEMPTED' };

  lifecycleEvents.push({
    type: 'participant_envelope_retransmission_requested',
    elapsedMs: elapsedMs(),
    retransmissionAttempt: 1,
    failureClass: 'ENVELOPE_FAILURE',
    sameThread: true,
    timeoutMs: ENVELOPE_RETRANSMISSION_TIMEOUT_MS,
    participantCapability: 'SAME_THREAD_CONTINUATION',
  });

  const continuationPrompt = renderEnvelopeRetransmissionRequestV1({
    expectedRoleSchemaName: input.expectedRoleSchemaName,
  });
  const continuationStartedMonotonic = performance.now();
  const attempt1ElapsedOffsetMs = Math.round(continuationStartedMonotonic - aggregateStartedMonotonic);
  const attempt1Job = await runWorkspaceAgentContinuation(
    {
      ...jobInput,
      prompt: continuationPrompt,
    },
    input.participant,
    threadRef!,
    ENVELOPE_RETRANSMISSION_TIMEOUT_MS,
  );

  const continuationRuntimeOutcome = attempt1Job.ok
    ? 'COMPLETED' as const
    : (() => {
        const outcome = mapContinuationRuntimeOutcome(attempt1Job);
        if (outcome === 'TIMEOUT') return 'TIMEOUT' as const;
        if (outcome === 'CONTINUATION_FAILURE') return 'CONTINUATION_FAILURE' as const;
        return 'RUNTIME_FAILURE' as const;
      })();

  lifecycleEvents.push({
    type: 'participant_envelope_retransmission_completed',
    elapsedMs: elapsedMs(),
    retransmissionAttempt: 1,
    runtimeOutcome: continuationRuntimeOutcome,
  });

  if (!attempt1Job.ok) {
    recovery = {
      eligible: true,
      attempted: true,
      outcome: mapContinuationRuntimeOutcome(attempt1Job),
    };
    return runtimeFailureResult(attempt1Job, {
      ...traceContext,
      attempt0Trace: attempt0Job.executionTrace,
      attempt1Trace: attempt1Job.executionTrace,
      attempt1ElapsedOffsetMs,
      lifecycleEvents,
      recovery,
    });
  }

  const attempt1Raw = attempt1Job.rawOutput;
  await writeCreateOnlyText(
    join(input.destinationRoot, 'terminal-attempt-1.txt'),
    attempt1Raw,
  );

  const attempt1Envelope = validateStructuredTerminalEnvelope(attempt1Raw);
  const attempt1Validation: Omit<ParticipantExecutionTraceEventV1, 'seq'> = {
    type: 'participant_terminal_validation',
    elapsedMs: elapsedMs(),
    attempt: 1,
    envelopeValid: attempt1Envelope.ok,
    schemaValidationAttempted: attempt1Envelope.ok,
    accepted: false,
    ...(attempt1Envelope.ok ? {} : { envelopeFailureReason: attempt1Envelope.reason }),
  };

  const attempt1TraceInput = {
    ...traceContext,
    attempt0Trace: attempt0Job.executionTrace,
    attempt1Trace: attempt1Job.executionTrace,
    attempt1ElapsedOffsetMs,
    lifecycleEvents,
    terminalOutcome: 'completed' as const,
  };

  if (!attempt1Envelope.ok) {
    lifecycleEvents.push(attempt1Validation);
    recovery = { eligible: true, attempted: true, outcome: 'ENVELOPE_FAILURE' };
    return {
      ok: false,
      errorKind: 'invalid_output',
      message: 'structured terminal envelope validation failed on retransmission',
      rawOutput: attempt1Raw,
      recovery,
      executionTrace: composeExecutionTrace(attempt1TraceInput),
    };
  }

  let parsedValue: T;
  try {
    parsedValue = input.validateSchema(attempt1Envelope.parsedObject);
  } catch (error) {
    lifecycleEvents.push({
      ...attempt1Validation,
      schemaValid: false,
    });
    recovery = { eligible: true, attempted: true, outcome: 'SCHEMA_FAILURE' };
    return {
      ok: false,
      errorKind: 'invalid_output',
      message: String(error),
      rawOutput: attempt1Raw,
      recovery,
      executionTrace: composeExecutionTrace(attempt1TraceInput),
    };
  }

  try {
    await input.validateAcceptedResult(parsedValue);
  } catch (error) {
    lifecycleEvents.push({
      ...attempt1Validation,
      schemaValid: true,
      accepted: false,
    });
    recovery = { eligible: true, attempted: true, outcome: 'SUCCEEDED' };
    return {
      ok: false,
      errorKind: 'invalid_output',
      message: String(error),
      rawOutput: attempt1Raw,
      recovery,
      executionTrace: composeExecutionTrace(attempt1TraceInput),
    };
  }

  lifecycleEvents.push({
    ...attempt1Validation,
    schemaValid: true,
    accepted: true,
  });
  recovery = { eligible: true, attempted: true, outcome: 'SUCCEEDED' };
  return {
    ok: true,
    value: parsedValue,
    rawOutput: attempt1Raw,
    acceptedAttempt: 1,
    recovery,
    executionTrace: composeExecutionTrace(attempt1TraceInput),
  };
}
