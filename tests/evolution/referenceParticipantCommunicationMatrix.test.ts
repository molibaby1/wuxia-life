import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type {
  ParticipantExecutionTraceV1,
  WorkspaceAgentJobResult,
  WorkspaceAgentParticipantOptions,
} from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import {
  buildSyntheticLargeEnvelopePayload,
  runReferenceParticipantCommunicationMatrix,
} from '../../scripts/evolution/contractConformance/referenceParticipantCommunicationMatrix';
import { parseReferenceParticipantCommunicationMatrixArgs } from '../../scripts/evolution/contractConformance/runReferenceParticipantCommunicationMatrix';
import {
  referenceParticipantBindingLockSha256,
  type ReferenceParticipantBindingLockV1,
} from '../../scripts/evolution/operator/referenceParticipantBinding';

const TEST_BINDING_LOCK: ReferenceParticipantBindingLockV1 = {
  schemaVersion: 'reference-participant-binding-lock-v1',
  bindingId: 'CODEX_CURRENT',
  provider: 'codex-local-subagent',
  executableRealPath: '/synthetic/codex/bin/codex',
  executableVersion: 'codex synthetic-1.0.0',
  modelConfigured: 'gpt-6-luna',
  reasoningEffort: 'max',
  ambientCodexConfigPath: '/synthetic/codex/config.toml',
  ambientCodexConfigSha256: 'a'.repeat(64),
  nativeEnvelopeAssistance: {
    enabled: true,
    schemaRef: 'scripts/evolution/operator/codexJsonObjectEnvelope.schema.json',
    schemaSha256: 'b'.repeat(64),
  },
};

function completed(rawOutput: string, opaqueId: string, terminalElapsedMs = 460): WorkspaceAgentJobResult {
  const executionTrace: ParticipantExecutionTraceV1 = {
    schemaVersion: 'participant-execution-trace-v1',
    invocation: { startedAt: '2026-09-30T00:00:00.000Z', timeoutMs: 1_800_000 },
    events: [
      { seq: 1, type: 'process_start', elapsedMs: 5 },
      { seq: 2, type: 'output_activity', elapsedMs: 125, stream: 'stdout', bytes: rawOutput.length },
      { seq: 3, type: 'process_close', elapsedMs: terminalElapsedMs - 10 },
    ],
    terminal: { outcome: 'completed', elapsedMs: terminalElapsedMs, lastObservableActivityElapsedMs: 125 },
  };
  return {
    ok: true,
    rawOutput,
    stderr: '',
    exitCode: 0,
    threadRef: { provider: 'codex-exec', opaqueId },
    executionTrace,
  };
}

async function testMatricesShareOneSealedBinding(root: string): Promise<void> {
  const evidenceRoot = join(root, 'matrix-evidence');
  const largePayload = buildSyntheticLargeEnvelopePayload();
  const largePayloadBytes = Buffer.byteLength(JSON.stringify(largePayload));
  assert.ok(largePayloadBytes >= 22 * 1024 && largePayloadBytes <= 26 * 1024);
  assert.ok(Array.isArray((largePayload as { nested?: unknown }).nested));

  let captureCount = 0;
  let initialCount = 0;
  let continuationCount = 0;
  const initialWorkspaces: string[] = [];
  const resolvedLockDigests: string[] = [];
  const participant: WorkspaceAgentParticipantOptions = {
    executable: 'fake-codex',
    buildArgs: () => [],
  };
  const result = await runReferenceParticipantCommunicationMatrix({
    repositoryRoot: process.cwd(),
    evidenceRoot,
    matrixRef: 'synthetic-matrix',
    model: 'gpt-6-luna',
    reasoningEffort: 'max',
    ambientCodexConfigPath: TEST_BINDING_LOCK.ambientCodexConfigPath,
  }, {
    captureBindingLock: async () => {
      captureCount += 1;
      return TEST_BINDING_LOCK;
    },
    resolveBindingLock: async ({ lock }) => {
      resolvedLockDigests.push(referenceParticipantBindingLockSha256(lock));
      assert.deepEqual(lock, TEST_BINDING_LOCK);
      return { participant } as never;
    },
    implementationSha: async () => 'c'.repeat(40),
    runWorkspaceAgentJob: async job => {
      initialCount += 1;
      initialWorkspaces.push(job.workspaceRoot);
      const payload = initialCount <= 3
        ? { matrix: 'A', trialId: job.invocationRef, result: 'ok' }
        : largePayload;
      return completed(JSON.stringify(payload), `thread-${String(initialCount).padStart(3, '0')}`);
    },
    runWorkspaceAgentContinuation: async (job, _participant, threadRef, timeoutMs) => {
      continuationCount += 1;
      assert.equal(threadRef.provider, 'codex-exec');
      assert.equal(threadRef.opaqueId, `thread-${String(6 + continuationCount).padStart(3, '0')}`);
      assert.equal(timeoutMs, 300_000);
      assert.match(job.prompt, /RE-EMIT ONLY/);
      return completed(JSON.stringify(largePayload), threadRef.opaqueId);
    },
  });

  const expectedLockSha256 = referenceParticipantBindingLockSha256(TEST_BINDING_LOCK);
  assert.equal(captureCount, 1);
  assert.equal(initialCount, 9);
  assert.equal(continuationCount, 3);
  assert.equal(new Set(initialWorkspaces).size, 9);
  assert.equal(resolvedLockDigests.length, 12);
  assert.ok(resolvedLockDigests.every(digest => digest === expectedLockSha256));
  assert.equal(result.bindingLockSha256, expectedLockSha256);
  assert.equal(result.implementationSha, 'c'.repeat(40));
  assert.equal(result.status, 'PASS');
  assert.equal(result.matrices.A.trials.length, 3);
  assert.equal(result.matrices.A.validationScope, 'NATIVE_ENVELOPE_ONLY');
  assert.ok(result.matrices.A.trials.every(trial => trial.runtimeOutcome === 'COMPLETED'
    && trial.hostEnvelopeValid
    && trial.payloadMatchedExactly));
  assert.equal(result.matrices.B.trials.length, 3);
  assert.ok(result.matrices.B.trials.every(trial => trial.payloadMatchedExactly && trial.hostEnvelopeValid));
  assert.equal(result.matrices.C.trials.length, 3);
  assert.ok(result.matrices.C.trials.every(trial => trial.withinProductionCeiling));
  assert.ok(result.matrices.C.trials.every(trial => trial.startupLatencyMs !== null
    && trial.firstOutputActivityLatencyMs !== null
    && trial.terminalCompletionLatencyMs !== null));
  assert.equal(new Set(result.matrices.C.trials.map(trial => trial.threadRef?.opaqueId)).size, 3);

  const persistedLock = JSON.parse(await readFile(join(evidenceRoot, 'binding-lock.json'), 'utf8')) as unknown;
  assert.deepEqual(persistedLock, TEST_BINDING_LOCK);
  const persistedResult = JSON.parse(await readFile(join(evidenceRoot, 'matrix.json'), 'utf8')) as typeof result;
  assert.deepEqual(persistedResult, result);
  await assert.rejects(
    runReferenceParticipantCommunicationMatrix({
      repositoryRoot: process.cwd(),
      evidenceRoot,
      matrixRef: 'synthetic-matrix',
      model: 'gpt-6-luna',
      reasoningEffort: 'max',
      ambientCodexConfigPath: TEST_BINDING_LOCK.ambientCodexConfigPath,
    }, {
      captureBindingLock: async () => {
        captureCount += 1;
        return TEST_BINDING_LOCK;
      },
    }),
    { code: 'EEXIST' },
  );
  assert.equal(captureCount, 1);
}

async function testGovernedHistoryContainment(root: string): Promise<void> {
  let captureCount = 0;
  await assert.rejects(runReferenceParticipantCommunicationMatrix({
    repositoryRoot: process.cwd(),
    evidenceRoot: resolve(process.cwd(), 'artifacts/evolution/autonomous-authoring/reference-trials/forbidden-matrix'),
    matrixRef: 'forbidden-matrix',
    model: 'gpt-6-luna',
    reasoningEffort: 'max',
    ambientCodexConfigPath: TEST_BINDING_LOCK.ambientCodexConfigPath,
  }, {
    captureBindingLock: async () => {
      captureCount += 1;
      return TEST_BINDING_LOCK;
    },
  }), /outside.*reference-trial|governed.*history/i);
  assert.equal(captureCount, 0);
}

async function testStopsAfterInvalidMatrixAEnvelope(root: string): Promise<void> {
  let initialCount = 0;
  let continuationCount = 0;
  const evidenceRoot = join(root, 'matrix-invalid-envelope');
  const result = await runReferenceParticipantCommunicationMatrix({
    repositoryRoot: process.cwd(),
    evidenceRoot,
    matrixRef: 'invalid-envelope',
    model: 'gpt-6-luna',
    reasoningEffort: 'max',
    ambientCodexConfigPath: TEST_BINDING_LOCK.ambientCodexConfigPath,
  }, {
    captureBindingLock: async () => TEST_BINDING_LOCK,
    resolveBindingLock: async () => ({
      participant: { executable: 'fake-codex', buildArgs: () => [] },
    }) as never,
    implementationSha: async () => 'd'.repeat(40),
    runWorkspaceAgentJob: async () => {
      initialCount += 1;
      return completed('prefix {"matrix":"A"} suffix', `invalid-thread-${initialCount}`);
    },
    runWorkspaceAgentContinuation: async () => {
      continuationCount += 1;
      return completed('{}', 'unexpected');
    },
  });
  assert.equal(initialCount, 3);
  assert.equal(continuationCount, 0);
  assert.equal(result.status, 'NATIVE_ENVELOPE_ASSISTANCE_UNRELIABLE');
  assert.equal(result.matrices.A.gatePassed, false);
  assert.equal(result.matrices.B.gatePassed, null);
  assert.equal(result.matrices.C.gatePassed, null);
  assert.ok(result.matrices.A.trials.every(trial => !trial.hostEnvelopeValid && !trial.hostRepairApplied));
  assert.match(await readFile(join(evidenceRoot, 'trials/A-01/terminal-payload.txt'), 'utf8'), /^prefix/);
}

async function testContinuationPastProductionCeilingRequiresReview(root: string): Promise<void> {
  let initialCount = 0;
  let continuationCount = 0;
  const largePayload = buildSyntheticLargeEnvelopePayload();
  const result = await runReferenceParticipantCommunicationMatrix({
    repositoryRoot: process.cwd(),
    evidenceRoot: join(root, 'matrix-slow-continuation'),
    matrixRef: 'slow-continuation',
    model: 'gpt-6-luna',
    reasoningEffort: 'max',
    ambientCodexConfigPath: TEST_BINDING_LOCK.ambientCodexConfigPath,
  }, {
    captureBindingLock: async () => TEST_BINDING_LOCK,
    resolveBindingLock: async () => ({
      participant: { executable: 'fake-codex', buildArgs: () => [] },
    }) as never,
    implementationSha: async () => 'e'.repeat(40),
    runWorkspaceAgentJob: async job => {
      initialCount += 1;
      const payload = job.invocationRef.startsWith('A-')
        ? { matrix: 'A', trialId: job.invocationRef, result: 'ok' }
        : largePayload;
      return completed(JSON.stringify(payload), `slow-thread-${initialCount}`);
    },
    runWorkspaceAgentContinuation: async (_job, _participant, threadRef, timeoutMs) => {
      continuationCount += 1;
      assert.equal(timeoutMs, 300_000);
      return completed(JSON.stringify(largePayload), threadRef.opaqueId, 60_001);
    },
  });
  assert.equal(initialCount, 9);
  assert.equal(continuationCount, 3);
  assert.equal(result.status, 'CONTINUATION_TIMEOUT_POLICY_REVIEW');
  assert.equal(result.matrices.C.gatePassed, false);
  assert.equal(result.matrices.C.timeoutPolicyReviewRequired, true);
  assert.ok(result.matrices.C.trials.every(trial => trial.withinObservationCeiling && !trial.withinProductionCeiling));
}

function testCliRequiresExplicitBindingAndHasNoLayerAOption(): void {
  const repositoryRoot = '/synthetic/repository';
  const parsed = parseReferenceParticipantCommunicationMatrixArgs([
    '--model', 'gpt-6-luna',
    '--reasoning-effort', 'max',
    '--ambient-codex-config', '/synthetic/codex/config.toml',
    '--evidence-root', '.tmp/evolution/reference-participant-communication',
    '--matrix-ref', 'matrix-001',
  ], repositoryRoot);
  assert.deepEqual(parsed, {
    help: false,
    input: {
      repositoryRoot,
      evidenceRoot: '/synthetic/repository/.tmp/evolution/reference-participant-communication/matrix-001',
      matrixRef: 'matrix-001',
      model: 'gpt-6-luna',
      reasoningEffort: 'max',
      ambientCodexConfigPath: '/synthetic/codex/config.toml',
    },
  });
  assert.throws(() => parseReferenceParticipantCommunicationMatrixArgs([
    '--model', 'gpt-6-luna',
    '--reasoning-effort', 'max',
    '--ambient-codex-config', '/synthetic/codex/config.toml',
    '--evidence-root', '.tmp/evolution/reference-participant-communication',
    '--matrix-ref', 'matrix-001',
    '--attempt-ref', 'attempt-000012',
  ], repositoryRoot), /unknown option/i);
  assert.throws(() => parseReferenceParticipantCommunicationMatrixArgs([
    '--reasoning-effort', 'max',
    '--ambient-codex-config', '/synthetic/codex/config.toml',
    '--evidence-root', '.tmp/evolution/reference-participant-communication',
    '--matrix-ref', 'matrix-001',
  ], repositoryRoot), /--model is required/i);
}

export async function runReferenceParticipantCommunicationMatrixTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'reference-communication-matrix-test-'));
  try {
    await testMatricesShareOneSealedBinding(root);
    await testGovernedHistoryContainment(root);
    await testStopsAfterInvalidMatrixAEnvelope(root);
    await testContinuationPastProductionCeilingRequiresReview(root);
    testCliRequiresExplicitBindingAndHasNoLayerAOption();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

if (process.argv[1]?.endsWith('referenceParticipantCommunicationMatrix.test.ts')) {
  runReferenceParticipantCommunicationMatrixTests().then(() => {
    process.stdout.write('referenceParticipantCommunicationMatrix.test.ts: ok\n');
  }).catch(error => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
