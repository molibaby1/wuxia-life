import assert from 'node:assert/strict';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  PARTICIPANT_ABSOLUTE_TIMEOUT_MS,
  type WorkspaceAgentJobInput,
  type WorkspaceAgentParticipantOptions,
} from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import {
  isEnvelopeRetransmissionEnabledForRole,
  renderEnvelopeRetransmissionRequestV1,
} from '../../scripts/evolution/problemAgnosticSolution/envelopeRetransmission';
import { runStructuredParticipantExecution } from '../../scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution';

const validateFixture = (value: Record<string, unknown>) => {
  assert.equal(value.schemaVersion, 'fixture-v1');
  return value;
};

function countingSpawn(counter: { count: number }): typeof spawn {
  return ((...args: Parameters<typeof spawn>) => {
    counter.count += 1;
    return spawn(...args);
  }) as typeof spawn;
}

function createContinuationCapableParticipant(
  outputs: { initial: string; continuation: string },
  options?: {
    threadRef?: { provider: string; opaqueId: string };
    spawnProcess?: typeof spawn;
    timeoutMs?: number;
    omitContinuation?: boolean;
    continuationProvider?: string;
    env?: Record<string, string>;
  },
): WorkspaceAgentParticipantOptions {
  const threadRef = options?.threadRef ?? { provider: 'test-provider', opaqueId: 'thread-000001' };
  const participant: WorkspaceAgentParticipantOptions = {
    executable: process.execPath,
    timeoutMs: options?.timeoutMs,
    buildArgs: () => ['-e', 'process.stdout.write(process.argv[1]);', outputs.initial],
    interpretCompletedOutput: ({ stdout, expectedThreadRef }) => ({
      ok: true as const,
      rawOutput: stdout,
      threadRef: expectedThreadRef ?? threadRef,
    }),
    spawnProcess: options?.spawnProcess,
    ...(options?.env === undefined ? {} : { env: options.env }),
  };

  if (!options?.omitContinuation) {
    participant.sameThreadContinuation = {
      provider: options?.continuationProvider ?? threadRef.provider,
      buildArgs: (_job: WorkspaceAgentJobInput, ref) => [
        '-e',
        'process.stdout.write(process.argv[1]);',
        outputs.continuation,
      ],
    };
  }

  return participant;
}

function createHangingSpawn(counter: { count: number }): typeof spawn {
  return ((...args: Parameters<typeof spawn>) => {
    counter.count += 1;
    if (counter.count === 1) {
      return spawn(...args);
    }
    const fakeChild = new EventEmitter() as ChildProcessWithoutNullStreams;
    fakeChild.stdout = new EventEmitter() as ChildProcessWithoutNullStreams['stdout'];
    fakeChild.stderr = new EventEmitter() as ChildProcessWithoutNullStreams['stderr'];
    fakeChild.kill = () => {};
    setImmediate(() => fakeChild.emit('spawn'));
    return fakeChild;
  }) as typeof spawn;
}

function eventElapsed(trace: { events: Array<{ type: string; elapsedMs: number; attempt?: number }> }, type: string, attempt?: number): number {
  const event = trace.events.find(e => e.type === type && (attempt === undefined || e.attempt === attempt));
  assert.ok(event, `missing event ${type}`);
  return event.elapsedMs;
}

async function runExecution(
  destinationRoot: string,
  participant: WorkspaceAgentParticipantOptions,
  options?: {
    role?: WorkspaceAgentJobInput['role'];
    initialPrompt?: string;
    retransmissionEnabled?: boolean;
    validateSchema?: (value: Record<string, unknown>) => Record<string, unknown>;
    validateAcceptedResult?: (value: Record<string, unknown>) => Promise<void>;
  },
) {
  return runStructuredParticipantExecution({
    invocationRef: 'fixture-invocation',
    role: options?.role ?? 'solution',
    workspaceRoot: destinationRoot,
    destinationRoot,
    initialPrompt: options?.initialPrompt ?? 'Return fixture output.',
    expectedRoleSchemaName: 'SolutionWorkV1',
    participant,
    retransmissionEnabled: options?.retransmissionEnabled ?? true,
    validateSchema: options?.validateSchema ?? validateFixture,
    validateAcceptedResult: options?.validateAcceptedResult ?? (async () => {}),
  });
}

export async function runEnvelopeRetransmissionTests(): Promise<void> {
  assert.equal(isEnvelopeRetransmissionEnabledForRole('solution'), true);
  assert.equal(isEnvelopeRetransmissionEnabledForRole('reviewer'), true);
  assert.equal(isEnvelopeRetransmissionEnabledForRole('configuration-execution'), true);
  assert.equal(isEnvelopeRetransmissionEnabledForRole('feedback'), false);
  assert.equal(isEnvelopeRetransmissionEnabledForRole('hypothesis'), false);

  const prompt = renderEnvelopeRetransmissionRequestV1({
    expectedRoleSchemaName: 'SolutionWorkV1',
  });

  assert.match(prompt, /ENVELOPE_FAILURE/);
  assert.match(prompt, /Re-emit the same Role result only/i);
  assert.match(prompt, /Do not perform new reasoning or investigation/i);
  assert.match(prompt, /SolutionWorkV1/);
  assert.match(prompt, /Structured Final Output Contract V1/);
  assert.match(prompt, /bare JSON/i);
  assert.doesNotMatch(prompt, /previous payload:/i);
  assert.doesNotMatch(prompt, /remove the prefix/i);

  const destinationRoot = await mkdtemp(join(tmpdir(), 'envelope-retransmission-'));
  const happyPathCounter = { count: 0 };
  const happyPath = await runExecution(destinationRoot, {
    executable: process.execPath,
    buildArgs: () => ['-e', 'process.stdout.write(JSON.stringify({ schemaVersion: "fixture-v1" }));'],
    spawnProcess: countingSpawn(happyPathCounter),
  });

  assert.equal(happyPath.ok, true);
  if (happyPath.ok) {
    assert.equal(happyPath.acceptedAttempt, 0);
    assert.deepEqual(happyPath.recovery, {
      eligible: false,
      attempted: false,
      outcome: 'NOT_ATTEMPTED',
    });
  }
  assert.equal(happyPathCounter.count, 1);
  assert.equal(
    await readFile(join(destinationRoot, 'terminal-attempt-0.txt'), 'utf8'),
    '{"schemaVersion":"fixture-v1"}',
  );
  await assert.rejects(
    () => readFile(join(destinationRoot, 'terminal-attempt-1.txt'), 'utf8'),
    /ENOENT/,
  );

  const recoveryRoot = await mkdtemp(join(tmpdir(), 'envelope-retransmission-recovery-'));
  const attempt0Raw = 'Here is the result:\n{"schemaVersion":"fixture-v1"}';
  const attempt1Raw = '{"schemaVersion":"fixture-v1"}';
  const recoveryCounter = { count: 0 };
  let continuationPrompt = '';
  const recoveryParticipant = createContinuationCapableParticipant(
    { initial: attempt0Raw, continuation: attempt1Raw },
    { spawnProcess: countingSpawn(recoveryCounter) },
  );
  recoveryParticipant.sameThreadContinuation = {
    provider: 'test-provider',
    buildArgs: job => {
      continuationPrompt = job.prompt;
      return ['-e', 'process.stdout.write(process.argv[1]);', attempt1Raw];
    },
  };

  const recovery = await runExecution(recoveryRoot, recoveryParticipant);
  assert.equal(recovery.ok, true);
  if (recovery.ok) {
    assert.equal(recovery.acceptedAttempt, 1);
    assert.equal(recovery.rawOutput, attempt1Raw);
    assert.deepEqual(recovery.recovery, {
      eligible: true,
      attempted: true,
      outcome: 'SUCCEEDED',
    });
  }
  assert.equal(recoveryCounter.count, 2);
  assert.equal(await readFile(join(recoveryRoot, 'terminal-attempt-0.txt'), 'utf8'), attempt0Raw);
  assert.equal(await readFile(join(recoveryRoot, 'terminal-attempt-1.txt'), 'utf8'), attempt1Raw);
  assert.match(continuationPrompt, /ENVELOPE_FAILURE/);
  assert.match(continuationPrompt, /SolutionWorkV1/);
  assert.doesNotMatch(continuationPrompt, /Here is the result:/);

  const requestEvent = recovery.executionTrace.events.find(
    event => event.type === 'participant_envelope_retransmission_requested',
  );
  assert.ok(requestEvent);
  assert.equal(requestEvent.timeoutMs, PARTICIPANT_ABSOLUTE_TIMEOUT_MS);
  assert.deepEqual(requestEvent.timeoutPolicy, {
    kind: 'PARTICIPANT_ACTIVITY_AWARE_V1',
    evaluationStartMs: 1_800_000,
    stdoutInactivityMs: 600_000,
    absoluteCapMs: 2_700_000,
  });

  const startedAtMs = Date.parse(recovery.executionTrace.invocation.startedAt);
  assert.ok(Number.isFinite(startedAtMs));
  assert.ok(startedAtMs > Date.now() - 60_000);
  assert.ok(startedAtMs <= Date.now() + 1_000);

  const attempt0ValidationElapsed = eventElapsed(recovery.executionTrace, 'participant_terminal_validation', 0);
  const retransmissionRequestedElapsed = eventElapsed(recovery.executionTrace, 'participant_envelope_retransmission_requested');
  const attempt1ProcessStartElapsed = eventElapsed(recovery.executionTrace, 'process_start', 1);
  const retransmissionCompletedElapsed = eventElapsed(recovery.executionTrace, 'participant_envelope_retransmission_completed');
  const attempt1ValidationElapsed = eventElapsed(recovery.executionTrace, 'participant_terminal_validation', 1);
  assert.ok(attempt0ValidationElapsed <= retransmissionRequestedElapsed);
  assert.ok(retransmissionRequestedElapsed <= attempt1ProcessStartElapsed);
  assert.ok(attempt1ProcessStartElapsed <= retransmissionCompletedElapsed);
  assert.ok(retransmissionCompletedElapsed <= attempt1ValidationElapsed);
  assert.ok(recovery.executionTrace.events.every((event, index, events) => (
    index === 0 || event.seq > events[index - 1]!.seq
  )));

  const envOverrideRoot = await mkdtemp(join(tmpdir(), 'envelope-retransmission-env-override-'));
  const envOverrideCounter = { count: 0 };
  const envOverride = await runExecution(envOverrideRoot, createContinuationCapableParticipant(
    { initial: attempt0Raw, continuation: attempt1Raw },
    {
      env: { WX_RETRANSMISSION_TIMEOUT_MS: '50' },
      spawnProcess: countingSpawn(envOverrideCounter),
    },
  ));
  assert.equal(envOverride.ok, true);
  const envOverrideRequest = envOverride.executionTrace.events.find(
    event => event.type === 'participant_envelope_retransmission_requested',
  );
  assert.ok(envOverrideRequest);
  assert.equal(envOverrideRequest.timeoutMs, PARTICIPANT_ABSOLUTE_TIMEOUT_MS);
  assert.deepEqual(envOverrideRequest.timeoutPolicy, requestEvent.timeoutPolicy);

  const schemaInvalidRoot = await mkdtemp(join(tmpdir(), 'envelope-retransmission-schema0-'));
  const schemaInvalidCounter = { count: 0 };
  const schemaInvalid = await runExecution(schemaInvalidRoot, {
    executable: process.execPath,
    buildArgs: () => ['-e', 'process.stdout.write(JSON.stringify({ schemaVersion: "wrong-v1" }));'],
    spawnProcess: countingSpawn(schemaInvalidCounter),
  });
  assert.equal(schemaInvalid.ok, false);
  if (!schemaInvalid.ok) {
    assert.equal(schemaInvalid.errorKind, 'invalid_output');
    assert.equal(schemaInvalid.failure.origin, 'OUTPUT_SCHEMA');
    assert.equal(schemaInvalid.failure.reason, 'ROLE_SCHEMA_INVALID');
    assert.equal(schemaInvalid.failure.participantErrorKind, 'invalid_output');
    assert.match(schemaInvalid.failure.message, /wrong-v1/);
  }
  assert.equal(schemaInvalidCounter.count, 1);
  assert.equal(schemaInvalid.recovery.outcome, 'NOT_ATTEMPTED');
  await assert.rejects(
    () => readFile(join(schemaInvalidRoot, 'terminal-attempt-1.txt'), 'utf8'),
    /ENOENT/,
  );
  assert.equal(
    schemaInvalid.executionTrace.events.some(event => event.type === 'participant_envelope_retransmission_requested'),
    false,
  );

  const scopeSchemaError = 'payload.cards[0].scopeCheck must be CONTRACT_PRESERVING';
  const schemaValidPayload = {
    schemaVersion: 'fixture-v1',
    summary: 'One unchanged role result.',
    cards: [{ id: 'card-1', title: 'Same authored card', scopeCheck: 'CONTRACT_PRESERVING' }],
  };
  const schemaInvalidPayload = {
    ...schemaValidPayload,
    cards: [{ ...schemaValidPayload.cards[0], scopeCheck: 'This card preserves the contract.' }],
  };
  const schemaValidRaw = JSON.stringify(schemaValidPayload);
  const schemaInvalidRaw = JSON.stringify(schemaInvalidPayload);
  const validateScopeSchema = (value: Record<string, unknown>) => {
    const firstCard = Array.isArray(value.cards) ? value.cards[0] : undefined;
    const scopeCheck = typeof firstCard === 'object' && firstCard !== null
      ? (firstCard as Record<string, unknown>).scopeCheck
      : undefined;
    if (scopeCheck !== 'CONTRACT_PRESERVING') throw new Error(scopeSchemaError);
    return value;
  };

  const schemaRecoveryRoot = await mkdtemp(join(tmpdir(), 'schema-retransmission-recovery-'));
  const schemaRecoveryCounter = { count: 0 };
  let schemaContinuationPrompt = '';
  let continuationThreadRef: { provider: string; opaqueId: string } | undefined;
  const schemaRecoveryParticipant = createContinuationCapableParticipant(
    { initial: schemaInvalidRaw, continuation: schemaValidRaw },
    { spawnProcess: countingSpawn(schemaRecoveryCounter) },
  );
  schemaRecoveryParticipant.sameThreadContinuation = {
    provider: 'test-provider',
    buildArgs: (job, threadRef) => {
      schemaContinuationPrompt = job.prompt;
      continuationThreadRef = threadRef;
      return ['-e', 'process.stdout.write(process.argv[1]);', schemaValidRaw];
    },
  };
  const schemaRecovery = await runExecution(schemaRecoveryRoot, schemaRecoveryParticipant, {
    validateSchema: validateScopeSchema,
  });
  assert.equal(schemaRecovery.ok, true, JSON.stringify(schemaRecovery));
  if (schemaRecovery.ok) {
    assert.equal(schemaRecovery.acceptedAttempt, 1);
    assert.equal(schemaRecovery.rawOutput, schemaValidRaw);
    assert.equal(schemaRecovery.recovery.outcome, 'SUCCEEDED');
    assert.equal(schemaRecovery.value.summary, schemaValidPayload.summary);
    assert.deepEqual(schemaRecovery.value.cards, schemaValidPayload.cards);
  }
  assert.equal(schemaRecoveryCounter.count, 2);
  assert.deepEqual(continuationThreadRef, { provider: 'test-provider', opaqueId: 'thread-000001' });
  assert.equal(await readFile(join(schemaRecoveryRoot, 'terminal-attempt-0.txt'), 'utf8'), schemaInvalidRaw);
  assert.equal(await readFile(join(schemaRecoveryRoot, 'terminal-attempt-1.txt'), 'utf8'), schemaValidRaw);
  assert.equal(
    await readFile(join(schemaRecoveryRoot, 'participant-envelope-retransmission-prompt-1.txt'), 'utf8'),
    schemaContinuationPrompt,
  );
  assert.match(schemaContinuationPrompt, /previous terminal payload was valid JSON and a valid JSON object envelope/i);
  assert.match(schemaContinuationPrompt, /Failure class: SCHEMA_FAILURE/);
  assert.ok(schemaContinuationPrompt.includes(`Host schema validation error (exact JSON string): "Error: ${scopeSchemaError}"`));
  assert.match(schemaContinuationPrompt, /Re-emit the same Role result only/i);
  assert.match(schemaContinuationPrompt, /Do not perform new reasoning or investigation/i);
  assert.match(schemaContinuationPrompt, /Do not change the semantic content/i);
  assert.match(schemaContinuationPrompt, /Do not alter, weaken, or route around the Contract/i);
  assert.match(schemaContinuationPrompt, /Structured Final Output Contract V1/);
  const schemaAttempt0Validation = schemaRecovery.executionTrace.events.find(
    event => event.type === 'participant_terminal_validation' && event.attempt === 0,
  );
  assert.ok(schemaAttempt0Validation);
  assert.equal(schemaAttempt0Validation.envelopeValid, true);
  assert.equal(schemaAttempt0Validation.schemaValid, false);
  const schemaRetransmissionRequest = schemaRecovery.executionTrace.events.find(
    event => event.type === 'participant_envelope_retransmission_requested',
  );
  assert.ok(schemaRetransmissionRequest);
  assert.equal(schemaRetransmissionRequest.failureClass, 'SCHEMA_FAILURE');
  assert.equal(
    schemaRecovery.executionTrace.events.filter(event => event.type === 'participant_envelope_retransmission_requested').length,
    1,
  );
  assert.equal(
    schemaRecovery.executionTrace.events.filter(event => event.type === 'participant_terminal_validation' && event.attempt === 1).length,
    1,
  );
  const schemaAttempt0ValidationIndex = schemaRecovery.executionTrace.events.findIndex(
    event => event.type === 'participant_terminal_validation' && event.attempt === 0,
  );
  const schemaRetransmissionRequestIndex = schemaRecovery.executionTrace.events.findIndex(
    event => event.type === 'participant_envelope_retransmission_requested',
  );
  const schemaAttempt1StartIndex = schemaRecovery.executionTrace.events.findIndex(
    event => event.type === 'process_start' && event.attempt === 1,
  );
  const schemaRetransmissionCompletionIndex = schemaRecovery.executionTrace.events.findIndex(
    event => event.type === 'participant_envelope_retransmission_completed',
  );
  const schemaAttempt1ValidationIndex = schemaRecovery.executionTrace.events.findIndex(
    event => event.type === 'participant_terminal_validation' && event.attempt === 1,
  );
  assert.ok(schemaAttempt0ValidationIndex < schemaRetransmissionRequestIndex);
  assert.ok(schemaRetransmissionRequestIndex < schemaAttempt1StartIndex);
  assert.ok(schemaAttempt1StartIndex < schemaRetransmissionCompletionIndex);
  assert.ok(schemaRetransmissionCompletionIndex < schemaAttempt1ValidationIndex);
  await assert.rejects(
    () => readFile(join(schemaRecoveryRoot, 'terminal-attempt-2.txt'), 'utf8'),
    /ENOENT/,
  );

  const schemaRetryFailureRoot = await mkdtemp(join(tmpdir(), 'schema-retransmission-invalid-attempt1-'));
  const schemaRetryFailureCounter = { count: 0 };
  const schemaRetryFailure = await runExecution(
    schemaRetryFailureRoot,
    createContinuationCapableParticipant(
      { initial: schemaInvalidRaw, continuation: schemaInvalidRaw },
      { spawnProcess: countingSpawn(schemaRetryFailureCounter) },
    ),
    { validateSchema: validateScopeSchema },
  );
  assert.equal(schemaRetryFailure.ok, false);
  if (!schemaRetryFailure.ok) {
    assert.equal(schemaRetryFailure.failure.origin, 'OUTPUT_SCHEMA');
    assert.equal(schemaRetryFailure.failure.message, `Error: ${scopeSchemaError}`);
    assert.equal(schemaRetryFailure.recovery.outcome, 'SCHEMA_FAILURE');
  }
  assert.equal(schemaRetryFailureCounter.count, 2);
  assert.equal(
    schemaRetryFailure.executionTrace.events.filter(event => event.type === 'participant_envelope_retransmission_requested').length,
    1,
  );
  await assert.rejects(
    () => readFile(join(schemaRetryFailureRoot, 'terminal-attempt-2.txt'), 'utf8'),
    /ENOENT/,
  );

  const reviewerSchemaFailureRoot = await mkdtemp(join(tmpdir(), 'schema-retransmission-reviewer-'));
  const reviewerSchemaFailureCounter = { count: 0 };
  const reviewerSchemaFailure = await runExecution(
    reviewerSchemaFailureRoot,
    createContinuationCapableParticipant(
      { initial: schemaInvalidRaw, continuation: schemaValidRaw },
      { spawnProcess: countingSpawn(reviewerSchemaFailureCounter) },
    ),
    { role: 'reviewer', retransmissionEnabled: false, validateSchema: validateScopeSchema },
  );
  assert.equal(reviewerSchemaFailure.ok, false);
  assert.equal(reviewerSchemaFailureCounter.count, 1);
  assert.equal(reviewerSchemaFailure.recovery.outcome, 'NOT_ATTEMPTED');
  assert.equal(
    reviewerSchemaFailure.executionTrace.events.some(event => event.type === 'participant_envelope_retransmission_requested'),
    false,
  );

  const schemaTimeoutRoot = await mkdtemp(join(tmpdir(), 'schema-retransmission-timeout-'));
  const schemaTimeoutCounter = { count: 0 };
  const schemaTimeout = await runExecution(
    schemaTimeoutRoot,
    createContinuationCapableParticipant(
      { initial: schemaInvalidRaw, continuation: schemaValidRaw },
      { spawnProcess: createHangingSpawn(schemaTimeoutCounter), timeoutMs: 1_000 },
    ),
    { validateSchema: validateScopeSchema },
  );
  assert.equal(schemaTimeout.ok, false);
  if (!schemaTimeout.ok) assert.equal(schemaTimeout.errorKind, 'timeout');
  assert.equal(schemaTimeoutCounter.count, 2);
  assert.equal(schemaTimeout.recovery.outcome, 'TIMEOUT');

  const schemaContinuationFailureRoot = await mkdtemp(join(tmpdir(), 'schema-retransmission-continuation-failure-'));
  const schemaContinuationFailure = await runExecution(
    schemaContinuationFailureRoot,
    createContinuationCapableParticipant(
      { initial: schemaInvalidRaw, continuation: schemaValidRaw },
      { continuationProvider: 'other-provider' },
    ),
    { validateSchema: validateScopeSchema },
  );
  assert.equal(schemaContinuationFailure.ok, false);
  if (!schemaContinuationFailure.ok) assert.equal(schemaContinuationFailure.errorKind, 'continuation');
  assert.equal(schemaContinuationFailure.recovery.outcome, 'CONTINUATION_FAILURE');
  assert.equal(
    schemaContinuationFailure.executionTrace.events.filter(event => event.type === 'participant_envelope_retransmission_requested').length,
    1,
  );

  const doubleEnvelopeRoot = await mkdtemp(join(tmpdir(), 'envelope-retransmission-double-envelope-'));
  const doubleEnvelopeCounter = { count: 0 };
  const invalidEnvelope = attempt0Raw;
  const doubleEnvelope = await runExecution(doubleEnvelopeRoot, {
    ...createContinuationCapableParticipant(
      { initial: invalidEnvelope, continuation: invalidEnvelope },
      { spawnProcess: countingSpawn(doubleEnvelopeCounter) },
    ),
  });
  assert.equal(doubleEnvelope.ok, false);
  if (!doubleEnvelope.ok) {
    assert.equal(doubleEnvelope.errorKind, 'invalid_output');
  }
  assert.equal(doubleEnvelopeCounter.count, 2);
  assert.deepEqual(doubleEnvelope.recovery, {
    eligible: true,
    attempted: true,
    outcome: 'ENVELOPE_FAILURE',
  });
  assert.equal(await readFile(join(doubleEnvelopeRoot, 'terminal-attempt-0.txt'), 'utf8'), invalidEnvelope);
  assert.equal(await readFile(join(doubleEnvelopeRoot, 'terminal-attempt-1.txt'), 'utf8'), invalidEnvelope);

  const attempt1SchemaInvalidRoot = await mkdtemp(join(tmpdir(), 'envelope-retransmission-schema1-'));
  const attempt1SchemaInvalidCounter = { count: 0 };
  const attempt1SchemaInvalid = await runExecution(attempt1SchemaInvalidRoot, {
    ...createContinuationCapableParticipant(
      { initial: attempt0Raw, continuation: '{"schemaVersion":"wrong-v1"}' },
      { spawnProcess: countingSpawn(attempt1SchemaInvalidCounter) },
    ),
    sameThreadContinuation: {
      provider: 'test-provider',
      buildArgs: () => ['-e', 'process.stdout.write(JSON.stringify({ schemaVersion: "wrong-v1" }));'],
    },
  });
  assert.equal(attempt1SchemaInvalid.ok, false);
  if (!attempt1SchemaInvalid.ok) {
    assert.equal(attempt1SchemaInvalid.errorKind, 'invalid_output');
    assert.equal(attempt1SchemaInvalid.failure.origin, 'OUTPUT_SCHEMA');
    assert.equal(attempt1SchemaInvalid.failure.reason, 'ROLE_SCHEMA_INVALID');
    assert.equal(attempt1SchemaInvalid.failure.participantErrorKind, 'invalid_output');
    assert.match(attempt1SchemaInvalid.failure.message, /wrong-v1/);
  }
  assert.equal(attempt1SchemaInvalidCounter.count, 2);
  assert.deepEqual(attempt1SchemaInvalid.recovery, {
    eligible: true,
    attempted: true,
    outcome: 'SCHEMA_FAILURE',
  });

  const noCapabilityRoot = await mkdtemp(join(tmpdir(), 'envelope-retransmission-no-capability-'));
  const noCapabilityCounter = { count: 0 };
  const noCapability = await runExecution(noCapabilityRoot, {
    executable: process.execPath,
    buildArgs: () => ['-e', 'process.stdout.write(process.argv[1]);', attempt0Raw],
    spawnProcess: countingSpawn(noCapabilityCounter),
  });
  assert.equal(noCapability.ok, false);
  if (!noCapability.ok) {
    assert.equal(noCapability.errorKind, 'invalid_output');
  }
  assert.equal(noCapabilityCounter.count, 1);
  assert.equal(noCapability.recovery.outcome, 'NOT_ATTEMPTED');
  assert.equal(
    noCapability.executionTrace.events.some(event => event.type === 'participant_envelope_retransmission_requested'),
    false,
  );
  const noCapabilityValidation = noCapability.executionTrace.events.find(
    event => event.type === 'participant_terminal_validation' && event.attempt === 0,
  );
  assert.ok(noCapabilityValidation);
  assert.equal(noCapabilityValidation.retransmissionEligible, false);
  assert.equal(noCapabilityValidation.retransmissionNotAttemptedReason, 'CAPABILITY_UNAVAILABLE');

  const timeoutRoot = await mkdtemp(join(tmpdir(), 'envelope-retransmission-timeout-'));
  const timeoutCounter = { count: 0 };
  const timeoutResult = await runExecution(timeoutRoot, createContinuationCapableParticipant(
    { initial: attempt0Raw, continuation: attempt1Raw },
    { spawnProcess: createHangingSpawn(timeoutCounter), timeoutMs: 1_000 },
  ));
  assert.equal(timeoutResult.ok, false);
  if (!timeoutResult.ok) {
    assert.equal(timeoutResult.errorKind, 'timeout');
    assert.deepEqual(timeoutResult.failure, {
      origin: 'PARTICIPANT_RUNTIME',
      reason: 'TIMEOUT',
      participantErrorKind: 'timeout',
      message: 'workspace Agent job timed out after 1000ms',
    });
  }
  assert.equal(timeoutCounter.count, 2);
  const timeoutRequest = timeoutResult.executionTrace.events.find(
    event => event.type === 'participant_envelope_retransmission_requested',
  );
  assert.ok(timeoutRequest);
  assert.equal(timeoutRequest.timeoutMs, 1_000);
  assert.equal(timeoutRequest.timeoutPolicy, undefined);
  assert.deepEqual(timeoutResult.recovery, {
    eligible: true,
    attempted: true,
    outcome: 'TIMEOUT',
  });

  const acceptedResultAfterCorrectionRoot = await mkdtemp(join(tmpdir(), 'envelope-retransmission-accepted-result-after-correction-'));
  const acceptedResultAfterCorrectionCounter = { count: 0 };
  let acceptedResultAfterCorrectionCalls = 0;
  const acceptedResultAfterCorrection = await runExecution(
    acceptedResultAfterCorrectionRoot,
    createContinuationCapableParticipant(
      { initial: attempt0Raw, continuation: attempt1Raw },
      { spawnProcess: countingSpawn(acceptedResultAfterCorrectionCounter) },
    ),
    {
      validateAcceptedResult: async () => {
        acceptedResultAfterCorrectionCalls += 1;
        throw new Error('accepted result rejected after structural correction');
      },
    },
  );
  assert.equal(acceptedResultAfterCorrection.ok, false);
  if (!acceptedResultAfterCorrection.ok) {
    assert.equal(acceptedResultAfterCorrection.errorKind, 'invalid_output');
    assert.equal(acceptedResultAfterCorrection.failure.origin, 'UNKNOWN');
  }
  assert.equal(acceptedResultAfterCorrectionCalls, 1);
  assert.equal(acceptedResultAfterCorrectionCounter.count, 2);
  assert.equal(acceptedResultAfterCorrection.recovery.outcome, 'SUCCEEDED');
  assert.equal(
    acceptedResultAfterCorrection.executionTrace.events.filter(
      event => event.type === 'participant_envelope_retransmission_requested',
    ).length,
    1,
  );
  assert.equal(
    acceptedResultAfterCorrection.executionTrace.events.filter(
      event => event.type === 'participant_terminal_validation' && event.attempt === 1,
    ).length,
    1,
  );
  await assert.rejects(
    () => readFile(join(acceptedResultAfterCorrectionRoot, 'terminal-attempt-2.txt'), 'utf8'),
    /ENOENT/,
  );

  const continuationFailureRoot = await mkdtemp(join(tmpdir(), 'envelope-retransmission-continuation-failure-'));
  const continuationFailureCounter = { count: 0 };
  const continuationFailure = await runExecution(continuationFailureRoot, createContinuationCapableParticipant(
    { initial: attempt0Raw, continuation: attempt1Raw },
    {
      continuationProvider: 'other-provider',
      spawnProcess: countingSpawn(continuationFailureCounter),
    },
  ));
  assert.equal(continuationFailure.ok, false);
  if (!continuationFailure.ok) {
    assert.equal(continuationFailure.errorKind, 'continuation');
    assert.deepEqual(continuationFailure.failure, {
      origin: 'PROVIDER_PROTOCOL',
      reason: 'CONTINUATION_PROTOCOL_FAILURE',
      participantErrorKind: 'continuation',
      message: 'workspace Agent continuation provider mismatch for fixture-invocation',
    });
  }
  assert.equal(continuationFailureCounter.count, 1);
  assert.deepEqual(continuationFailure.recovery, {
    eligible: true,
    attempted: true,
    outcome: 'CONTINUATION_FAILURE',
  });

  const initialTimeoutRoot = await mkdtemp(join(tmpdir(), 'envelope-initial-timeout-'));
  const initialTimeout = await runExecution(initialTimeoutRoot, {
    executable: process.execPath,
    timeoutMs: 20,
    buildArgs: () => ['-e', 'setInterval(() => {}, 1000)'],
  });
  assert.equal(initialTimeout.ok, false);
  if (!initialTimeout.ok) {
    assert.equal(initialTimeout.errorKind, 'timeout');
    assert.equal(initialTimeout.failure.origin, 'PARTICIPANT_RUNTIME');
    assert.equal(initialTimeout.failure.reason, 'TIMEOUT');
  }

  const providerProtocolRoot = await mkdtemp(join(tmpdir(), 'envelope-provider-protocol-'));
  const providerProtocol = await runExecution(providerProtocolRoot, {
    executable: process.execPath,
    buildArgs: () => ['-e', 'process.stdout.write(JSON.stringify({ schemaVersion: "fixture-v1" }));'],
    interpretCompletedOutput: () => ({
      ok: false as const,
      errorKind: 'invalid_output' as const,
      message: 'provider rejected completed output',
    }),
  });
  assert.equal(providerProtocol.ok, false);
  if (!providerProtocol.ok) {
    assert.deepEqual(providerProtocol.failure, {
      origin: 'PROVIDER_PROTOCOL',
      reason: 'PROVIDER_PROTOCOL_FAILURE',
      participantErrorKind: 'invalid_output',
      message: 'provider rejected completed output',
    });
  }

  const emptyEnvelopeRoot = await mkdtemp(join(tmpdir(), 'envelope-empty-'));
  const emptyEnvelope = await runExecution(emptyEnvelopeRoot, {
    executable: process.execPath,
    buildArgs: () => ['-e', ''],
  });
  assert.equal(emptyEnvelope.ok, false);
  if (!emptyEnvelope.ok) {
    assert.deepEqual(emptyEnvelope.failure, {
      origin: 'OUTPUT_ENVELOPE',
      reason: 'EMPTY_ENVELOPE',
      participantErrorKind: 'invalid_output',
      message: 'structured terminal envelope validation failed',
    });
  }

  const invalidJsonAfterRetransmissionRoot = await mkdtemp(join(tmpdir(), 'envelope-invalid-json-after-retransmission-'));
  const invalidJsonAfterRetransmission = await runExecution(
    invalidJsonAfterRetransmissionRoot,
    createContinuationCapableParticipant(
      { initial: attempt0Raw, continuation: 'not-json' },
    ),
  );
  assert.equal(invalidJsonAfterRetransmission.ok, false);
  if (!invalidJsonAfterRetransmission.ok) {
    assert.deepEqual(invalidJsonAfterRetransmission.failure, {
      origin: 'OUTPUT_ENVELOPE',
      reason: 'INVALID_JSON_ENVELOPE',
      participantErrorKind: 'invalid_output',
      message: 'structured terminal envelope validation failed on retransmission',
    });
  }

  const unknownAcceptedResultRoot = await mkdtemp(join(tmpdir(), 'envelope-unknown-accepted-result-'));
  const unknownAcceptedResultCounter = { count: 0 };
  const unknownAcceptedResult = await runExecution(unknownAcceptedResultRoot, {
    ...createContinuationCapableParticipant(
      { initial: attempt1Raw, continuation: attempt1Raw },
      { spawnProcess: countingSpawn(unknownAcceptedResultCounter) },
    ),
  }, {
    validateAcceptedResult: async () => {
      throw new Error('unexpected acceptance failure');
    },
  });
  assert.equal(unknownAcceptedResult.ok, false);
  if (!unknownAcceptedResult.ok) {
    assert.deepEqual(unknownAcceptedResult.failure, {
      origin: 'UNKNOWN',
      reason: 'UNCLASSIFIED',
      participantErrorKind: null,
      message: 'Error: unexpected acceptance failure',
    });
  }
  assert.equal(unknownAcceptedResultCounter.count, 1);
  assert.equal(
    unknownAcceptedResult.executionTrace.events.some(event => event.type === 'participant_envelope_retransmission_requested'),
    false,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runEnvelopeRetransmissionTests()
    .then(() => console.log('envelopeRetransmission.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
