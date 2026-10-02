import { mkdir, open } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { validateStructuredTerminalEnvelope } from '../../../src/evolution/structuredTerminalEnvelope';
import {
  ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH,
  validateArtifactBackedStructuredFinalResultReceipt,
} from '../../../src/evolution/artifactBackedStructuredFinalResultContract';
import {
  describeWorkspaceAgentInitialTimeout,
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
  isEnvelopeRetransmissionEnabledForRole,
  type EnvelopeRetransmissionObservation,
  type EnvelopeRetransmissionOutcome,
  renderEnvelopeRetransmissionRequestV1,
} from './envelopeRetransmission';
import {
  classifyWorkspaceAgentFailure,
  ParticipantOutputValidationError,
  type ParticipantFailureFacts,
  type ParticipantFailureReason,
} from './participantFailureClassification';
import { persistParticipantPromptAndBinding } from '../participantObservability';
import {
  consumeArtifactBackedStructuredResult,
  prepareArtifactBackedStructuredResult,
} from './artifactBackedStructuredResult';

export const PARTICIPANT_ENVELOPE_RETRANSMISSION_PROMPT_1_ARTIFACT =
  'participant-envelope-retransmission-prompt-1.txt' as const;

export type StructuredResultDeliveryMode =
  | { kind: 'TERMINAL_JSON' }
  | {
      kind: 'WORKSPACE_ARTIFACT_RECEIPT_V1';
      resultRelativePath: typeof ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH;
    };

export type StructuredParticipantExecutionResult<T> =
  | {
      ok: true;
      value: T;
      rawOutput: string;
      stderr: string;
      acceptedAttempt: 0 | 1;
      recovery: EnvelopeRetransmissionObservation;
      executionTrace: ParticipantExecutionTraceV1;
    }
  | {
      ok: false;
      errorKind: WorkspaceAgentJobFailure['errorKind'];
      message: string;
      failure: ParticipantFailureFacts;
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
  role: WorkspaceAgentJobInput['role'],
): 'CAPABILITY_UNAVAILABLE' | 'POLICY_DISABLED' {
  if (!retransmissionEnabled || !isEnvelopeRetransmissionEnabledForRole(role)) return 'POLICY_DISABLED';
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
  timeoutPolicy?: ParticipantExecutionTraceV1['invocation']['timeoutPolicy'];
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
  const attempt0LastStdout = input.attempt0Trace.terminal.lastStdoutActivityElapsedMs;
  const attempt1LastStdout = input.attempt1Trace?.terminal.lastStdoutActivityElapsedMs;
  const lastStdoutActivityElapsedMs = attempt1LastStdout === undefined
    ? attempt0LastStdout
    : Math.max(attempt0LastStdout ?? 0, attempt1LastStdout + attempt1Offset);

  return {
    schemaVersion: 'participant-execution-trace-v1',
    invocation: {
      startedAt: new Date(input.aggregateStartedWallClockMs).toISOString(),
      timeoutMs: input.timeoutMs,
      ...(input.timeoutPolicy === undefined ? {} : { timeoutPolicy: input.timeoutPolicy }),
    },
    events,
    terminal: {
      outcome: input.terminalOutcome,
      elapsedMs: Math.max(0, Math.round(performance.now() - input.aggregateStartedMonotonic)),
      ...(lastObservableActivityElapsedMs === undefined
        ? {}
        : { lastObservableActivityElapsedMs }),
      ...(lastStdoutActivityElapsedMs === undefined ? {} : { lastStdoutActivityElapsedMs }),
    },
  };
}

function runtimeFailureResult(
  job: Extract<WorkspaceAgentJobResult, { ok: false }>,
  input: {
    aggregateStartedWallClockMs: number;
    aggregateStartedMonotonic: number;
    timeoutMs: number;
    timeoutPolicy?: ParticipantExecutionTraceV1['invocation']['timeoutPolicy'];
    attempt0Trace: ParticipantExecutionTraceV1;
    attempt1Trace?: ParticipantExecutionTraceV1;
    attempt1ElapsedOffsetMs?: number;
    lifecycleEvents: Omit<ParticipantExecutionTraceEventV1, 'seq'>[];
    recovery: EnvelopeRetransmissionObservation;
    failure: ParticipantFailureFacts;
  },
): StructuredParticipantExecutionResult<never> {
  const terminalOutcome = job.errorKind === 'timeout'
    ? 'timeout'
    : 'process_error';
  return {
    ok: false,
    errorKind: job.errorKind,
    message: job.message,
    failure: input.failure,
    ...(job.rawOutput === undefined ? {} : { rawOutput: job.rawOutput }),
    recovery: input.recovery,
    executionTrace: composeExecutionTrace({
      aggregateStartedWallClockMs: input.aggregateStartedWallClockMs,
      aggregateStartedMonotonic: input.aggregateStartedMonotonic,
      timeoutMs: input.timeoutMs,
      timeoutPolicy: input.timeoutPolicy,
      attempt0Trace: input.attempt0Trace,
      attempt1Trace: input.attempt1Trace,
      attempt1ElapsedOffsetMs: input.attempt1ElapsedOffsetMs,
      lifecycleEvents: input.lifecycleEvents,
      terminalOutcome,
    }),
  };
}

function envelopeFailure(
  reason: 'EMPTY' | 'INVALID_JSON' | 'NON_OBJECT_ROOT',
  message: string,
): ParticipantFailureFacts {
  const reasonByEnvelope: Record<typeof reason, ParticipantFailureReason> = {
    EMPTY: 'EMPTY_ENVELOPE',
    INVALID_JSON: 'INVALID_JSON_ENVELOPE',
    NON_OBJECT_ROOT: 'NON_OBJECT_ENVELOPE',
  };
  return {
    origin: 'OUTPUT_ENVELOPE',
    reason: reasonByEnvelope[reason],
    participantErrorKind: 'invalid_output',
    message,
  };
}

function schemaFailure(error: unknown): ParticipantFailureFacts {
  return {
    origin: 'OUTPUT_SCHEMA',
    reason: 'ROLE_SCHEMA_INVALID',
    participantErrorKind: 'invalid_output',
    message: String(error),
  };
}

function acceptedResultFailure(error: unknown): ParticipantFailureFacts {
  if (error instanceof ParticipantOutputValidationError) return error.facts;
  return {
    origin: 'UNKNOWN',
    reason: 'UNCLASSIFIED',
    participantErrorKind: null,
    message: String(error),
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
  role: WorkspaceAgentJobInput['role'],
  participant: WorkspaceAgentParticipantOptions,
  threadRef: ParticipantThreadRef | undefined,
): boolean {
  if (!retransmissionEnabled || !isEnvelopeRetransmissionEnabledForRole(role)) return false;
  if (participant.sameThreadContinuation === undefined) return false;
  return threadRef !== undefined;
}

interface ArtifactBackedValidationEvidenceV1 {
  schemaVersion: 'artifact-backed-validation-v1';
  deliveryMode: 'WORKSPACE_ARTIFACT_RECEIPT_V1';
  fixedResultRef: typeof ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH;
  receiptValidationValid: boolean | null;
  expectedBytes: number | null;
  actualBytes: number | null;
  expectedSha256: string | null;
  actualSha256: string | null;
  artifactIntegrityValid: boolean | null;
  artifactEnvelopeValid: boolean | null;
  roleSchemaValidationAttempted: boolean;
  roleSchemaValid: boolean | null;
  acceptedResultAttempted: boolean;
  accepted: boolean | null;
  earliestFailureBoundary: string | null;
}

function artifactInfrastructureFailure(message: string): ParticipantFailureFacts {
  return {
    origin: 'HOST_INFRASTRUCTURE',
    reason: 'UNCLASSIFIED',
    participantErrorKind: null,
    message,
  };
}

function artifactConsumptionFailure(input: {
  error: unknown;
  receipt: { bytes: number; sha256: string };
  evidence: ArtifactBackedValidationEvidenceV1;
}): ParticipantFailureFacts {
  const message = String(input.error);
  input.evidence.expectedBytes = input.receipt.bytes;
  input.evidence.expectedSha256 = input.receipt.sha256;

  if (message.includes('artifact receipt byte length mismatch')) {
    input.evidence.artifactIntegrityValid = false;
    input.evidence.earliestFailureBoundary = 'ARTIFACT_INTEGRITY';
    const mismatch = message.match(/expected (\d+), actual (\d+)/);
    if (mismatch) input.evidence.actualBytes = Number(mismatch[2]);
    return artifactInfrastructureFailure(message);
  }
  if (message.includes('artifact receipt SHA-256 mismatch')) {
    input.evidence.artifactIntegrityValid = false;
    input.evidence.earliestFailureBoundary = 'ARTIFACT_INTEGRITY';
    const mismatch = message.match(/expected ([0-9a-f]{64}), actual ([0-9a-f]{64})/);
    if (mismatch) input.evidence.actualSha256 = mismatch[2];
    return artifactInfrastructureFailure(message);
  }
  if (message.includes('structured envelope failed')) {
    input.evidence.artifactIntegrityValid = true;
    input.evidence.artifactEnvelopeValid = false;
    input.evidence.actualBytes = input.receipt.bytes;
    input.evidence.actualSha256 = input.receipt.sha256;
    input.evidence.earliestFailureBoundary = 'ARTIFACT_ENVELOPE';
    const reason = message.includes('NON_OBJECT_ROOT')
      ? 'NON_OBJECT_ROOT'
      : message.includes('EMPTY')
        ? 'EMPTY'
        : 'INVALID_JSON';
    return envelopeFailure(reason, message);
  }
  if (message.includes('not strict UTF-8')) {
    input.evidence.artifactIntegrityValid = true;
    input.evidence.artifactEnvelopeValid = false;
    input.evidence.actualBytes = input.receipt.bytes;
    input.evidence.actualSha256 = input.receipt.sha256;
    input.evidence.earliestFailureBoundary = 'ARTIFACT_ENCODING';
    return envelopeFailure('INVALID_JSON', message);
  }
  input.evidence.artifactIntegrityValid = false;
  input.evidence.earliestFailureBoundary = message.includes('evidence destination')
    || message.includes('raw artifact evidence path')
    || message.includes('EEXIST')
    ? 'HOST_EVIDENCE_PERSISTENCE'
    : 'FIXED_RESULT_ARTIFACT';
  return artifactInfrastructureFailure(message);
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
  structuredResultDelivery?: StructuredResultDeliveryMode;
  validateSchema: (value: Record<string, unknown>) => T;
  validateAcceptedResult: (value: T) => Promise<void>;
}): Promise<StructuredParticipantExecutionResult<T>> {
  const deliveryMode = input.structuredResultDelivery ?? { kind: 'TERMINAL_JSON' as const };
  if (deliveryMode.kind === 'WORKSPACE_ARTIFACT_RECEIPT_V1') {
    if (input.role !== 'solution') throw new Error('artifact-backed structured result delivery is Solution-only');
    if (deliveryMode.resultRelativePath !== ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH) {
      throw new Error('artifact-backed structured result delivery requires the Host-fixed result path');
    }
  } else if (deliveryMode.kind !== 'TERMINAL_JSON') {
    throw new Error('unsupported structured result delivery mode');
  }

  await persistParticipantPromptAndBinding({
    destinationRoot: input.destinationRoot,
    prompt: input.initialPrompt,
    participant: input.participant,
  });
  const aggregateStartedWallClockMs = Date.now();
  const aggregateStartedMonotonic = performance.now();
  const initialTimeout = describeWorkspaceAgentInitialTimeout(input.role, input.participant.timeoutMs);
  const timeoutMs = initialTimeout.timeoutMs;
  const elapsedMs = (): number => Math.max(0, Math.round(performance.now() - aggregateStartedMonotonic));
  const lifecycleEvents: Omit<ParticipantExecutionTraceEventV1, 'seq'>[] = [];
  let recovery: EnvelopeRetransmissionObservation = notAttemptedRecovery();

  const traceContext = {
    aggregateStartedWallClockMs,
    aggregateStartedMonotonic,
    timeoutMs,
    timeoutPolicy: initialTimeout.timeoutPolicy,
  };

  const jobInput: WorkspaceAgentJobInput = {
    invocationRef: input.invocationRef,
    role: input.role,
    workspaceRoot: input.workspaceRoot,
    prompt: input.initialPrompt,
  };

  if (deliveryMode.kind === 'WORKSPACE_ARTIFACT_RECEIPT_V1') {
    const evidence: ArtifactBackedValidationEvidenceV1 = {
      schemaVersion: 'artifact-backed-validation-v1',
      deliveryMode: deliveryMode.kind,
      fixedResultRef: ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH,
      receiptValidationValid: null,
      expectedBytes: null,
      actualBytes: null,
      expectedSha256: null,
      actualSha256: null,
      artifactIntegrityValid: null,
      artifactEnvelopeValid: null,
      roleSchemaValidationAttempted: false,
      roleSchemaValid: null,
      acceptedResultAttempted: false,
      accepted: null,
      earliestFailureBoundary: null,
    };
    const persistArtifactEvidence = (): Promise<void> => writeCreateOnlyText(
      join(input.destinationRoot, 'artifact-backed-validation.json'),
      `${JSON.stringify(evidence, null, 2)}\n`,
    );

    try {
      await prepareArtifactBackedStructuredResult({ workspaceRoot: input.workspaceRoot });
    } catch (error) {
      evidence.earliestFailureBoundary = 'FIXED_RESULT_PATH_PREPARATION';
      await persistArtifactEvidence();
      const attempt0Trace: ParticipantExecutionTraceV1 = {
        schemaVersion: 'participant-execution-trace-v1',
        invocation: {
          startedAt: new Date(aggregateStartedWallClockMs).toISOString(),
          timeoutMs,
          ...(initialTimeout.timeoutPolicy === undefined ? {} : { timeoutPolicy: initialTimeout.timeoutPolicy }),
        },
        events: [],
        terminal: { outcome: 'process_error', elapsedMs: elapsedMs() },
      };
      return {
        ok: false,
        errorKind: 'invalid_output',
        message: String(error),
        failure: artifactInfrastructureFailure(String(error)),
        recovery: notAttemptedRecovery(),
        executionTrace: composeExecutionTrace({
          ...traceContext,
          attempt0Trace,
          lifecycleEvents,
          terminalOutcome: 'process_error',
        }),
      };
    }

    const artifactJobInput: WorkspaceAgentJobInput = {
      ...jobInput,
      providerStdoutArtifactPath: join(input.destinationRoot, 'provider-stdout.raw.txt'),
      providerStderrArtifactPath: join(input.destinationRoot, 'provider-stderr.raw.txt'),
    };
    const attempt0Job = await runWorkspaceAgentJob(artifactJobInput, input.participant);
    if (!attempt0Job.ok) {
      evidence.earliestFailureBoundary = attempt0Job.errorKind === 'invalid_output'
        || attempt0Job.errorKind === 'continuation'
        ? 'PROVIDER_PROTOCOL'
        : 'PARTICIPANT_RUNTIME';
      await persistArtifactEvidence();
      return runtimeFailureResult(attempt0Job, {
        ...traceContext,
        attempt0Trace: attempt0Job.executionTrace,
        lifecycleEvents,
        recovery: notAttemptedRecovery(),
        failure: classifyWorkspaceAgentFailure(attempt0Job),
      });
    }

    const rawReceipt = attempt0Job.rawOutput;
    await writeCreateOnlyText(join(input.destinationRoot, 'terminal-attempt-0.txt'), rawReceipt);
    let receiptEnvelopeValid: boolean | null = null;
    const addArtifactValidationTrace = (): void => {
      lifecycleEvents.push({
        type: 'participant_terminal_validation',
        elapsedMs: elapsedMs(),
        attempt: 0,
        envelopeValid: evidence.artifactEnvelopeValid ?? (receiptEnvelopeValid ?? false),
        schemaValidationAttempted: evidence.roleSchemaValidationAttempted,
        ...(evidence.roleSchemaValid === null ? {} : { schemaValid: evidence.roleSchemaValid }),
        accepted: evidence.accepted === true,
        detail: `artifact-backed validation; earliest failure boundary: ${evidence.earliestFailureBoundary ?? 'none'}`,
      });
    };
    const failArtifactValidation = async (
      message: string,
      failure: ParticipantFailureFacts,
    ): Promise<StructuredParticipantExecutionResult<T>> => {
      addArtifactValidationTrace();
      await persistArtifactEvidence();
      return {
        ok: false,
        errorKind: 'invalid_output',
        message,
        failure,
        rawOutput: rawReceipt,
        recovery: notAttemptedRecovery(),
        executionTrace: composeExecutionTrace({
          ...traceContext,
          attempt0Trace: attempt0Job.executionTrace,
          lifecycleEvents,
          terminalOutcome: 'completed',
        }),
      };
    };

    const receiptEnvelope = validateStructuredTerminalEnvelope(rawReceipt);
    receiptEnvelopeValid = receiptEnvelope.ok;
    if (!receiptEnvelope.ok) {
      evidence.receiptValidationValid = false;
      evidence.earliestFailureBoundary = 'TERMINAL_RECEIPT_ENVELOPE';
      const message = 'artifact-backed terminal receipt envelope validation failed';
      return failArtifactValidation(message, envelopeFailure(receiptEnvelope.reason, message));
    }

    let receipt: ReturnType<typeof validateArtifactBackedStructuredFinalResultReceipt>;
    try {
      receipt = validateArtifactBackedStructuredFinalResultReceipt(receiptEnvelope.parsedObject);
      evidence.receiptValidationValid = true;
    } catch (error) {
      evidence.receiptValidationValid = false;
      evidence.earliestFailureBoundary = 'TERMINAL_RECEIPT_SCHEMA';
      return failArtifactValidation(String(error), schemaFailure(error));
    }

    evidence.expectedBytes = receipt.bytes;
    evidence.expectedSha256 = receipt.sha256;
    let consumedResult;
    try {
      consumedResult = await consumeArtifactBackedStructuredResult({
        workspaceRoot: input.workspaceRoot,
        destinationRoot: input.destinationRoot,
        receipt,
      });
      evidence.actualBytes = consumedResult.bytes;
      evidence.actualSha256 = consumedResult.sha256;
      evidence.artifactIntegrityValid = true;
      evidence.artifactEnvelopeValid = true;
    } catch (error) {
      const failure = artifactConsumptionFailure({ error, receipt, evidence });
      return failArtifactValidation(String(error), failure);
    }

    evidence.roleSchemaValidationAttempted = true;
    let parsedValue: T;
    try {
      parsedValue = input.validateSchema(consumedResult.parsedObject);
      evidence.roleSchemaValid = true;
    } catch (error) {
      evidence.roleSchemaValid = false;
      evidence.earliestFailureBoundary = 'ROLE_SCHEMA';
      return failArtifactValidation(String(error), schemaFailure(error));
    }

    evidence.acceptedResultAttempted = true;
    try {
      await input.validateAcceptedResult(parsedValue);
      evidence.accepted = true;
    } catch (error) {
      evidence.accepted = false;
      evidence.earliestFailureBoundary = 'ACCEPTED_RESULT';
      return failArtifactValidation(String(error), acceptedResultFailure(error));
    }

    addArtifactValidationTrace();
    await persistArtifactEvidence();
    return {
      ok: true,
      value: parsedValue,
      rawOutput: rawReceipt,
      stderr: attempt0Job.stderr,
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
      failure: classifyWorkspaceAgentFailure(attempt0Job),
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

  let attempt0Failure:
    | {
        failureClass: 'ENVELOPE_FAILURE';
        failure: ParticipantFailureFacts;
        message: string;
      }
    | {
        failureClass: 'SCHEMA_FAILURE';
        failure: ParticipantFailureFacts;
        message: string;
        validationError: string;
      }
    | undefined;

  if (!attempt0Envelope.ok) {
    const message = 'structured terminal envelope validation failed';
    attempt0Failure = {
      failureClass: 'ENVELOPE_FAILURE',
      failure: envelopeFailure(attempt0Envelope.reason, message),
      message,
    };
  } else {
    let parsedValue!: T;
    try {
      parsedValue = input.validateSchema(attempt0Envelope.parsedObject);
    } catch (error) {
      const message = String(error);
      attempt0Failure = {
        failureClass: 'SCHEMA_FAILURE',
        failure: schemaFailure(error),
        message,
        validationError: message,
      };
    }

    if (attempt0Failure === undefined) {
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
          failure: acceptedResultFailure(error),
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
        stderr: attempt0Job.stderr,
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
  }

  const initialFailure = attempt0Failure!;
  const threadRef = attempt0Job.threadRef;
  const eligible = canRetransmit(input.retransmissionEnabled, input.role, input.participant, threadRef);
  lifecycleEvents.push({
    ...attempt0Validation,
    ...(initialFailure.failureClass === 'SCHEMA_FAILURE' ? { schemaValid: false } : {}),
    ...(eligible ? {} : {
      retransmissionEligible: false,
      retransmissionNotAttemptedReason: retransmissionNotAttemptedReason(
        input.retransmissionEnabled,
        input.role,
      ),
    }),
  });

  if (!eligible) {
    return {
      ok: false,
      errorKind: 'invalid_output',
      message: initialFailure.message,
      failure: initialFailure.failure,
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
    failureClass: initialFailure.failureClass,
    sameThread: true,
    timeoutMs: ENVELOPE_RETRANSMISSION_TIMEOUT_MS,
    participantCapability: 'SAME_THREAD_CONTINUATION',
  });

  const continuationPrompt = initialFailure.failureClass === 'SCHEMA_FAILURE'
    ? renderEnvelopeRetransmissionRequestV1({
        expectedRoleSchemaName: input.expectedRoleSchemaName,
        failureClass: 'SCHEMA_FAILURE',
        validationError: initialFailure.validationError,
      })
    : renderEnvelopeRetransmissionRequestV1({
        expectedRoleSchemaName: input.expectedRoleSchemaName,
        failureClass: 'ENVELOPE_FAILURE',
      });
  await writeCreateOnlyText(
    join(input.destinationRoot, PARTICIPANT_ENVELOPE_RETRANSMISSION_PROMPT_1_ARTIFACT),
    continuationPrompt,
  );
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
      failure: classifyWorkspaceAgentFailure(attempt1Job),
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
    const failure = envelopeFailure(
      attempt1Envelope.reason,
      'structured terminal envelope validation failed on retransmission',
    );
    return {
      ok: false,
      errorKind: 'invalid_output',
      message: 'structured terminal envelope validation failed on retransmission',
      failure,
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
      failure: schemaFailure(error),
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
      failure: acceptedResultFailure(error),
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
    stderr: attempt1Job.stderr,
    acceptedAttempt: 1,
    recovery,
    executionTrace: composeExecutionTrace(attempt1TraceInput),
  };
}
