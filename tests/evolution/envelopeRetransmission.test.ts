import assert from 'node:assert/strict';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type WorkspaceAgentJobInput,
  type WorkspaceAgentParticipantOptions,
} from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import {
  ENVELOPE_RETRANSMISSION_TIMEOUT_MS,
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
    omitContinuation?: boolean;
    continuationProvider?: string;
    env?: Record<string, string>;
  },
): WorkspaceAgentParticipantOptions {
  const threadRef = options?.threadRef ?? { provider: 'test-provider', opaqueId: 'thread-000001' };
  const participant: WorkspaceAgentParticipantOptions = {
    executable: process.execPath,
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

function withScaledContinuationTimeout<T>(fn: () => Promise<T>): Promise<T> {
  const originalSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = ((handler, timeoutMs, ...args) => {
    const scaled = timeoutMs === ENVELOPE_RETRANSMISSION_TIMEOUT_MS ? 50 : timeoutMs;
    return originalSetTimeout(handler, scaled, ...args);
  }) as typeof setTimeout;
  return fn().finally(() => {
    globalThis.setTimeout = originalSetTimeout;
  });
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
    initialPrompt?: string;
    validateSchema?: (value: Record<string, unknown>) => Record<string, unknown>;
    validateAcceptedResult?: (value: Record<string, unknown>) => Promise<void>;
  },
) {
  return runStructuredParticipantExecution({
    invocationRef: 'fixture-invocation',
    role: 'solution',
    workspaceRoot: destinationRoot,
    destinationRoot,
    initialPrompt: options?.initialPrompt ?? 'Return fixture output.',
    expectedRoleSchemaName: 'SolutionWorkV1',
    participant,
    retransmissionEnabled: true,
    validateSchema: options?.validateSchema ?? validateFixture,
    validateAcceptedResult: options?.validateAcceptedResult ?? (async () => {}),
  });
}

export async function runEnvelopeRetransmissionTests(): Promise<void> {
  assert.equal(ENVELOPE_RETRANSMISSION_TIMEOUT_MS, 60_000);

  assert.equal(isEnvelopeRetransmissionEnabledForRole('solution'), true);
  assert.equal(isEnvelopeRetransmissionEnabledForRole('reviewer'), false);
  assert.equal(isEnvelopeRetransmissionEnabledForRole('configuration-execution'), false);

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
  assert.equal(requestEvent.timeoutMs, ENVELOPE_RETRANSMISSION_TIMEOUT_MS);

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
  assert.equal(envOverrideRequest.timeoutMs, ENVELOPE_RETRANSMISSION_TIMEOUT_MS);

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
  const timeoutResult = await withScaledContinuationTimeout(() => runExecution(timeoutRoot, createContinuationCapableParticipant(
    { initial: attempt0Raw, continuation: attempt1Raw },
    { spawnProcess: createHangingSpawn(timeoutCounter) },
  )));
  assert.equal(timeoutResult.ok, false);
  if (!timeoutResult.ok) {
    assert.equal(timeoutResult.errorKind, 'timeout');
  }
  assert.equal(timeoutCounter.count, 2);
  assert.deepEqual(timeoutResult.recovery, {
    eligible: true,
    attempted: true,
    outcome: 'TIMEOUT',
  });

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
  }
  assert.equal(continuationFailureCounter.count, 1);
  assert.deepEqual(continuationFailure.recovery, {
    eligible: true,
    attempted: true,
    outcome: 'CONTINUATION_FAILURE',
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runEnvelopeRetransmissionTests()
    .then(() => console.log('envelopeRetransmission.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
