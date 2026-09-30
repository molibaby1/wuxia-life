import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type {
  ParticipantExecutionTraceV1,
  WorkspaceAgentJobResult,
  WorkspaceAgentParticipantOptions,
} from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import {
  buildSyntheticLargeEnvelopePayload,
  validateSyntheticLargeEnvelopePayload,
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

function withPaddingLength(payload: Record<string, unknown>, recordIndex: number, length: number): Record<string, unknown> {
  const copy = structuredClone(payload);
  const records = copy.nested as Array<{ children: Array<{ payload: { padding: string } }> }>;
  records[recordIndex]!.children[0]!.payload.padding = 'x'.repeat(length);
  return copy;
}

function withChangedChecksum(payload: Record<string, unknown>, recordIndex = 0): Record<string, unknown> {
  const copy = structuredClone(payload);
  const records = copy.nested as Array<{ children: Array<{ payload: { checksumMarker: string } }> }>;
  records[recordIndex]!.children[0]!.payload.checksumMarker = 'changed-checksum';
  return copy;
}

function testSyntheticLargePayloadStructuralValidator(): void {
  const payload = buildSyntheticLargeEnvelopePayload();
  const exact = validateSyntheticLargeEnvelopePayload(payload);
  assert.equal(exact.ok, true);
  assert.ok(exact.measuredBytes >= 22 * 1024 && exact.measuredBytes <= 26 * 1024);

  const fillerLengthChanged = withPaddingLength(payload, 0, 891);
  const changedFiller = validateSyntheticLargeEnvelopePayload(fillerLengthChanged);
  assert.equal(changedFiller.ok, true);
  assert.notEqual(changedFiller.measuredBytes, exact.measuredBytes);

  const invalidPayloads: Array<[string, Record<string, unknown>]> = [];
  const missingRecord = structuredClone(payload);
  (missingRecord.nested as unknown[]).pop();
  invalidPayloads.push(['missing record', missingRecord]);

  const changedNode = structuredClone(payload);
  ((changedNode.nested as Array<{ nodeId: string }>)[0]!).nodeId = 'wrong-node';
  invalidPayloads.push(['changed nodeId', changedNode]);

  const changedAncestry = structuredClone(payload);
  ((changedAncestry.nested as Array<{ ancestry: Array<{ label: string }> }>)[0]!).ancestry[1]!.label = 'wrong-ancestry';
  invalidPayloads.push(['changed ancestry', changedAncestry]);

  const changedValues = structuredClone(payload);
  ((changedValues.nested as Array<{ values: { ordinal: number } }>)[0]!).values.ordinal = 99;
  invalidPayloads.push(['changed values', changedValues]);

  const changedChildId = structuredClone(payload);
  ((changedChildId.nested as Array<{ children: Array<{ id: string }> }>)[0]!).children[0]!.id = 'wrong-child';
  invalidPayloads.push(['changed child id', changedChildId]);
  invalidPayloads.push(['changed checksumMarker', withChangedChecksum(payload)]);

  const missingStructuralKey = structuredClone(payload);
  delete ((missingStructuralKey.nested as Array<{ values: Record<string, unknown> }>)[0]!).values.ordinal;
  invalidPayloads.push(['missing structural key', missingStructuralKey]);

  const extraStructuralKey = structuredClone(payload);
  (extraStructuralKey.nested as Array<Record<string, unknown>>)[0]!.unexpected = true;
  invalidPayloads.push(['extra structural key', extraStructuralKey]);

  const invalidPaddingType = structuredClone(payload);
  ((invalidPaddingType.nested as Array<{ children: Array<{ payload: Record<string, unknown> }> }>)[0]!).children[0]!.payload.padding = 7;
  invalidPayloads.push(['non-string padding', invalidPaddingType]);

  const invalidPaddingContent = withPaddingLength(payload, 0, 891);
  ((invalidPaddingContent.nested as Array<{ children: Array<{ payload: Record<string, unknown> }> }>)[0]!).children[0]!.payload.padding = 'x y';
  invalidPayloads.push(['non-x padding', invalidPaddingContent]);

  const emptyPadding = withPaddingLength(payload, 0, 0);
  invalidPayloads.push(['empty padding', emptyPadding]);

  const undersized = structuredClone(payload);
  for (const record of undersized.nested as Array<{ children: Array<{ payload: { padding: string } }> }>) {
    record.children[0]!.payload.padding = 'x';
  }
  invalidPayloads.push(['serialized object below size band', undersized]);

  const oversized = structuredClone(payload);
  for (const record of oversized.nested as Array<{ children: Array<{ payload: { padding: string } }> }>) {
    record.children[0]!.payload.padding = 'x'.repeat(1_500);
  }
  invalidPayloads.push(['serialized object above size band', oversized]);

  for (const [label, actual] of invalidPayloads) {
    assert.equal(validateSyntheticLargeEnvelopePayload(actual).ok, false, label);
  }
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
        : job.invocationRef.startsWith('B-')
          ? withPaddingLength(largePayload, initialCount - 4, 891 + initialCount)
          : largePayload;
      return completed(JSON.stringify(payload), `thread-${String(initialCount).padStart(3, '0')}`);
    },
    runWorkspaceAgentContinuation: async (job, _participant, threadRef, timeoutMs) => {
      continuationCount += 1;
      assert.equal(threadRef.provider, 'codex-exec');
      assert.equal(threadRef.opaqueId, `thread-${String(6 + continuationCount).padStart(3, '0')}`);
      assert.equal(timeoutMs, 300_000);
      assert.match(job.prompt, /RE-EMIT ONLY/);
      assert.match(job.prompt, /padding.*transport filler/i);
      return completed(JSON.stringify(withPaddingLength(largePayload, continuationCount - 1, 910)), threadRef.opaqueId);
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
  assert.equal(result.status, 'PASS', JSON.stringify(result.matrices.C));
  assert.equal(result.schemaVersion, 'reference-participant-communication-matrix-v2');
  assert.equal(result.matrices.A.trials.length, 3);
  assert.equal(result.matrices.A.validationScope, 'NATIVE_ENVELOPE_ONLY');
  assert.ok(result.matrices.A.trials.every(trial => trial.runtimeOutcome === 'COMPLETED'
    && trial.hostEnvelopeValid
    && trial.payloadMatchedExactly));
  assert.equal(result.matrices.B.trials.length, 3);
  assert.ok(result.matrices.B.trials.every(trial => trial.payloadStructureValid
    && trial.hostEnvelopeValid
    && trial.payloadMeasuredBytes !== undefined
    && trial.payloadMeasuredBytes >= 22 * 1024
    && trial.payloadMeasuredBytes <= 26 * 1024));
  assert.ok(result.matrices.B.trials.every(trial => trial.payloadMatchedExactly === false));
  assert.equal(result.matrices.C.trials.length, 3);
  assert.ok(result.matrices.C.trials.every(trial => trial.withinProductionCeiling
    && trial.initialPayloadStructureValid
    && trial.continuationPayloadStructureValid
    && trial.threadIdentityValid
    && trial.payloadMatchedExactly === false));
  assert.equal(result.matrices.C.policyClassification, 'SUPPORTED_60S');
  assert.ok(result.matrices.C.trials.every(trial => trial.startupLatencyMs !== null
    && trial.firstOutputActivityLatencyMs !== null
    && trial.terminalCompletionLatencyMs !== null));
  assert.equal(new Set(result.matrices.C.trials.map(trial => trial.threadRef?.opaqueId)).size, 3);

  const persistedLock = JSON.parse(await readFile(join(evidenceRoot, 'binding-lock.json'), 'utf8')) as unknown;
  assert.deepEqual(persistedLock, TEST_BINDING_LOCK);
  const persistedResult = JSON.parse(await readFile(join(evidenceRoot, 'matrix.json'), 'utf8')) as typeof result;
  assert.deepEqual(persistedResult, result);
  assert.ok(result.matrices.C.trials.every(trial => trial.withinObservationCeiling));
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
      implementationSha: async () => 'c'.repeat(40),
    }),
    { code: 'EEXIST' },
  );
  assert.equal(captureCount, 1);
}

async function testMatrixBRejectsStructuralMutation(root: string): Promise<void> {
  let initialCount = 0;
  let continuationCount = 0;
  const largePayload = buildSyntheticLargeEnvelopePayload();
  const evidenceRoot = join(root, 'matrix-invalid-structure');
  const result = await runReferenceParticipantCommunicationMatrix({
    repositoryRoot: process.cwd(),
    evidenceRoot,
    matrixRef: 'invalid-structure',
    model: 'gpt-6-luna',
    reasoningEffort: 'max',
    ambientCodexConfigPath: TEST_BINDING_LOCK.ambientCodexConfigPath,
  }, {
    captureBindingLock: async () => TEST_BINDING_LOCK,
    resolveBindingLock: async () => ({ participant: { executable: 'fake-codex', buildArgs: () => [] } }) as never,
    implementationSha: async () => 'f'.repeat(40),
    runWorkspaceAgentJob: async job => {
      initialCount += 1;
      const payload = initialCount <= 3
        ? { matrix: 'A', trialId: job.invocationRef, result: 'ok' }
        : job.invocationRef === 'B-02' ? withChangedChecksum(largePayload) : largePayload;
      const elapsedMs = job.invocationRef === 'B-03' ? 1_800_001 : 460;
      return completed(JSON.stringify(payload), `structure-thread-${initialCount}`, elapsedMs);
    },
    runWorkspaceAgentContinuation: async () => {
      continuationCount += 1;
      return completed(JSON.stringify(largePayload), `unexpected-${continuationCount}`);
    },
  });

  assert.equal(initialCount, 6);
  assert.equal(continuationCount, 0);
  assert.equal(result.status, 'MATRIX_B_FAILED');
  assert.equal(result.matrices.B.gatePassed, false);
  assert.equal(result.matrices.B.trials[1]!.hostEnvelopeValid, true);
  assert.equal(result.matrices.B.trials[1]!.payloadStructureValid, false);
  assert.notEqual(result.matrices.B.trials[1]!.payloadMeasuredBytes, undefined);
  assert.equal(result.matrices.B.trials[2]!.payloadStructureValid, true);
  assert.equal(result.matrices.B.trials[2]!.elapsedMs, 1_800_001);
  assert.equal(result.matrices.C.gatePassed, null);
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

async function testSymlinkedGovernedHistoryContainment(root: string): Promise<void> {
  const repositoryRoot = join(root, 'matrix-symlink-repository');
  const governedRoot = join(repositoryRoot, 'artifacts/evolution/autonomous-authoring/reference-trials');
  const evidenceAlias = join(root, 'matrix-evidence-alias');
  await mkdir(governedRoot, { recursive: true });
  await symlink(governedRoot, evidenceAlias, 'dir');
  const evidenceRoot = join(evidenceAlias, 'forbidden-matrix');
  let captureCount = 0;
  let errorMessage = '';
  try {
    await runReferenceParticipantCommunicationMatrix({
      repositoryRoot,
      evidenceRoot,
      matrixRef: 'forbidden-symlink-matrix',
      model: 'gpt-6-luna',
      reasoningEffort: 'max',
      ambientCodexConfigPath: TEST_BINDING_LOCK.ambientCodexConfigPath,
    }, {
      captureBindingLock: async () => {
        captureCount += 1;
        return TEST_BINDING_LOCK;
      },
    });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }
  assert.match(errorMessage, /outside.*reference-trial|governed.*history/i);
  assert.equal(captureCount, 0);
  await assert.rejects(readFile(join(governedRoot, 'forbidden-matrix/binding-lock.json')), { code: 'ENOENT' });
}

async function testDirtyTrackedImplementationRejectedBeforeMatrix(root: string): Promise<void> {
  const repositoryRoot = join(root, 'matrix-dirty-implementation-repository');
  await mkdir(repositoryRoot, { recursive: true });
  execFileSync('git', ['-C', repositoryRoot, 'init', '--quiet']);
  execFileSync('git', ['-C', repositoryRoot, 'config', 'user.name', 'Matrix Test']);
  execFileSync('git', ['-C', repositoryRoot, 'config', 'user.email', 'matrix-test@example.invalid']);
  const sourcePath = join(repositoryRoot, 'implementation.ts');
  await writeFile(sourcePath, 'export const version = 1;\n');
  execFileSync('git', ['-C', repositoryRoot, 'add', 'implementation.ts']);
  execFileSync('git', ['-C', repositoryRoot, 'commit', '--quiet', '-m', 'base']);
  await writeFile(sourcePath, 'export const version = 2;\n');

  const evidenceRoot = join(root, 'matrix-dirty-implementation-evidence');
  let captureCount = 0;
  await assert.rejects(runReferenceParticipantCommunicationMatrix({
    repositoryRoot,
    evidenceRoot,
    matrixRef: 'dirty-implementation',
    model: 'gpt-6-luna',
    reasoningEffort: 'max',
    ambientCodexConfigPath: TEST_BINDING_LOCK.ambientCodexConfigPath,
  }, {
    captureBindingLock: async () => {
      captureCount += 1;
      return TEST_BINDING_LOCK;
    },
  }), /tracked implementation worktree must be clean/i);
  assert.equal(captureCount, 0);
  await assert.rejects(readFile(join(evidenceRoot, 'binding-lock.json')), { code: 'ENOENT' });
}

async function testImplementationShaRecheckedAfterMatrix(root: string): Promise<void> {
  const repositoryRoot = join(root, 'matrix-changed-implementation-repository');
  await mkdir(repositoryRoot, { recursive: true });
  execFileSync('git', ['-C', repositoryRoot, 'init', '--quiet']);
  execFileSync('git', ['-C', repositoryRoot, 'config', 'user.name', 'Matrix Test']);
  execFileSync('git', ['-C', repositoryRoot, 'config', 'user.email', 'matrix-test@example.invalid']);
  const sourcePath = join(repositoryRoot, 'implementation.ts');
  await writeFile(sourcePath, 'export const version = 1;\n');
  execFileSync('git', ['-C', repositoryRoot, 'add', 'implementation.ts']);
  execFileSync('git', ['-C', repositoryRoot, 'commit', '--quiet', '-m', 'base']);
  const initialSha = execFileSync('git', ['-C', repositoryRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const largePayload = buildSyntheticLargeEnvelopePayload();
  let initialCount = 0;
  let continuationCount = 0;
  const participant: WorkspaceAgentParticipantOptions = { executable: 'fake-codex', buildArgs: () => [] };

  const result = await runReferenceParticipantCommunicationMatrix({
    repositoryRoot,
    evidenceRoot: join(root, 'matrix-changed-implementation-evidence'),
    matrixRef: 'changed-implementation',
    model: 'gpt-6-luna',
    reasoningEffort: 'max',
    ambientCodexConfigPath: TEST_BINDING_LOCK.ambientCodexConfigPath,
  }, {
    captureBindingLock: async () => TEST_BINDING_LOCK,
    resolveBindingLock: async () => ({ participant }) as never,
    runWorkspaceAgentJob: async job => {
      initialCount += 1;
      const payload = initialCount <= 3
        ? { matrix: 'A', trialId: job.invocationRef, result: 'ok' }
        : largePayload;
      return completed(JSON.stringify(payload), `matrix-thread-${initialCount}`);
    },
    runWorkspaceAgentContinuation: async (_job, _participant, threadRef) => {
      continuationCount += 1;
      if (continuationCount === 3) {
        await writeFile(sourcePath, 'export const version = 2;\n');
        execFileSync('git', ['-C', repositoryRoot, 'add', 'implementation.ts']);
        execFileSync('git', ['-C', repositoryRoot, 'commit', '--quiet', '-m', 'change during matrix']);
      }
      return completed(JSON.stringify(largePayload), threadRef.opaqueId);
    },
  });

  assert.equal(result.implementationSha, initialSha);
  assert.equal(result.status, 'RUNNER_FAILURE');
  assert.match(result.stopReason ?? '', /implementation SHA changed during communication matrix/i);
  const persisted = JSON.parse(await readFile(
    join(root, 'matrix-changed-implementation-evidence', 'matrix.json'), 'utf8',
  )) as typeof result;
  assert.deepEqual(persisted, result);
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
      const latency = continuationCount === 1 ? 60_001 : 59_000;
      return completed(JSON.stringify(largePayload), threadRef.opaqueId, latency);
    },
  });
  assert.equal(initialCount, 9);
  assert.equal(continuationCount, 3);
  assert.equal(result.status, 'CONTINUATION_TIMEOUT_POLICY_REVIEW');
  assert.equal(result.matrices.C.gatePassed, false);
  assert.equal(result.matrices.C.timeoutPolicyReviewRequired, true);
  assert.equal(result.matrices.C.policyClassification, 'CONTINUATION_TIMEOUT_POLICY_REVIEW');
  assert.ok(result.matrices.C.trials[0]!.withinObservationCeiling && !result.matrices.C.trials[0]!.withinProductionCeiling);
  assert.ok(result.matrices.C.trials.slice(1).every(trial => trial.withinObservationCeiling && trial.withinProductionCeiling));
}

async function testContinuationBeyondObservationCeilingIsUnreliable(root: string): Promise<void> {
  let initialCount = 0;
  const largePayload = buildSyntheticLargeEnvelopePayload();
  const result = await runReferenceParticipantCommunicationMatrix({
    repositoryRoot: process.cwd(),
    evidenceRoot: join(root, 'matrix-beyond-observation'),
    matrixRef: 'beyond-observation',
    model: 'gpt-6-luna',
    reasoningEffort: 'max',
    ambientCodexConfigPath: TEST_BINDING_LOCK.ambientCodexConfigPath,
  }, {
    captureBindingLock: async () => TEST_BINDING_LOCK,
    resolveBindingLock: async () => ({ participant: { executable: 'fake-codex', buildArgs: () => [] } }) as never,
    implementationSha: async () => 'g'.repeat(40),
    runWorkspaceAgentJob: async job => {
      initialCount += 1;
      return completed(job.invocationRef.startsWith('A-')
        ? JSON.stringify({ matrix: 'A', trialId: job.invocationRef, result: 'ok' })
        : JSON.stringify(largePayload), `observation-thread-${initialCount}`);
    },
    runWorkspaceAgentContinuation: async (_job, _participant, threadRef, timeoutMs) => {
      assert.equal(timeoutMs, 300_000);
      return completed(JSON.stringify(largePayload), threadRef.opaqueId, 300_001);
    },
  });

  assert.equal(result.status, 'CONTINUATION_UNRELIABLE');
  assert.equal(result.matrices.C.timeoutPolicyReviewRequired, false);
  assert.equal(result.matrices.C.policyClassification, 'CONTINUATION_UNRELIABLE');
  assert.ok(result.matrices.C.trials.every(trial => !trial.withinObservationCeiling));
}

async function testContinuationStructuralMutationIsUnreliable(root: string): Promise<void> {
  let initialCount = 0;
  let continuationCount = 0;
  const largePayload = buildSyntheticLargeEnvelopePayload();
  const result = await runReferenceParticipantCommunicationMatrix({
    repositoryRoot: process.cwd(),
    evidenceRoot: join(root, 'matrix-continuation-structure'),
    matrixRef: 'continuation-structure',
    model: 'gpt-6-luna',
    reasoningEffort: 'max',
    ambientCodexConfigPath: TEST_BINDING_LOCK.ambientCodexConfigPath,
  }, {
    captureBindingLock: async () => TEST_BINDING_LOCK,
    resolveBindingLock: async () => ({ participant: { executable: 'fake-codex', buildArgs: () => [] } }) as never,
    implementationSha: async () => 'h'.repeat(40),
    runWorkspaceAgentJob: async job => {
      initialCount += 1;
      return completed(job.invocationRef.startsWith('A-')
        ? JSON.stringify({ matrix: 'A', trialId: job.invocationRef, result: 'ok' })
        : JSON.stringify(largePayload), `semantic-thread-${initialCount}`);
    },
    runWorkspaceAgentContinuation: async (_job, _participant, threadRef) => {
      continuationCount += 1;
      const payload = continuationCount === 1 ? withChangedChecksum(largePayload) : largePayload;
      return completed(JSON.stringify(payload), threadRef.opaqueId);
    },
  });

  assert.equal(result.status, 'CONTINUATION_UNRELIABLE');
  assert.equal(result.matrices.C.trials[0]!.continuationHostEnvelopeValid, true);
  assert.equal(result.matrices.C.trials[0]!.continuationPayloadStructureValid, false);
  assert.equal(result.matrices.C.policyClassification, 'CONTINUATION_UNRELIABLE');
}

async function testContinuationThreadIdentityMustMatch(root: string): Promise<void> {
  let initialCount = 0;
  let continuationCount = 0;
  const largePayload = buildSyntheticLargeEnvelopePayload();
  const result = await runReferenceParticipantCommunicationMatrix({
    repositoryRoot: process.cwd(),
    evidenceRoot: join(root, 'matrix-thread-identity'),
    matrixRef: 'thread-identity',
    model: 'gpt-6-luna',
    reasoningEffort: 'max',
    ambientCodexConfigPath: TEST_BINDING_LOCK.ambientCodexConfigPath,
  }, {
    captureBindingLock: async () => TEST_BINDING_LOCK,
    resolveBindingLock: async () => ({ participant: { executable: 'fake-codex', buildArgs: () => [] } }) as never,
    implementationSha: async () => 'i'.repeat(40),
    runWorkspaceAgentJob: async job => {
      initialCount += 1;
      return completed(job.invocationRef.startsWith('A-')
        ? JSON.stringify({ matrix: 'A', trialId: job.invocationRef, result: 'ok' })
        : JSON.stringify(largePayload), `identity-thread-${initialCount}`);
    },
    runWorkspaceAgentContinuation: async (_job, _participant, threadRef) => {
      continuationCount += 1;
      return completed(JSON.stringify(largePayload), continuationCount === 1
        ? `${threadRef.opaqueId}-changed`
        : threadRef.opaqueId);
    },
  });

  assert.equal(result.status, 'CONTINUATION_UNRELIABLE');
  assert.equal(result.matrices.C.trials[0]!.continuationRuntimeOutcome, 'THREAD_IDENTITY_FAILURE');
  assert.equal(result.matrices.C.trials[0]!.threadIdentityValid, false);
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
    testSyntheticLargePayloadStructuralValidator();
    await testMatricesShareOneSealedBinding(root);
    await testGovernedHistoryContainment(root);
    await testSymlinkedGovernedHistoryContainment(root);
    await testDirtyTrackedImplementationRejectedBeforeMatrix(root);
    await testImplementationShaRecheckedAfterMatrix(root);
    await testStopsAfterInvalidMatrixAEnvelope(root);
    await testMatrixBRejectsStructuralMutation(root);
    await testContinuationPastProductionCeilingRequiresReview(root);
    await testContinuationBeyondObservationCeilingIsUnreliable(root);
    await testContinuationStructuralMutationIsUnreliable(root);
    await testContinuationThreadIdentityMustMatch(root);
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
