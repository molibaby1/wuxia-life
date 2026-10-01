import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ParticipantExecutionTraceV1, WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import {
  buildSyntheticLargeEnvelopePayload,
  validateSyntheticLargeEnvelopePayload,
} from '../../scripts/evolution/contractConformance/referenceParticipantCommunicationMatrix';
import {
  REFERENCE_ARTIFACT_BACKED_OBSERVATION_TIMEOUT_MS,
  runReferenceArtifactBackedCommunicationMatrix,
} from '../../scripts/evolution/contractConformance/referenceArtifactBackedCommunicationMatrix';
import { parseReferenceArtifactBackedCommunicationMatrixArgs } from '../../scripts/evolution/contractConformance/runReferenceArtifactBackedCommunicationMatrix';
import {
  artifactBackedReferenceParticipantBindingLockSha256,
  type ArtifactBackedReferenceParticipantBindingLockV2,
} from '../../scripts/evolution/operator/referenceParticipantBinding';
import type { StructuredParticipantExecutionResult } from '../../scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution';

const receiptSchemaSha = 'a'.repeat(64);
const TEST_BINDING_LOCK: ArtifactBackedReferenceParticipantBindingLockV2 = {
  schemaVersion: 'reference-participant-binding-lock-v2',
  bindingId: 'CODEX_CURRENT',
  provider: 'codex-local-subagent',
  executableRealPath: '/synthetic/codex/bin/codex',
  executableVersion: 'codex synthetic-1.0.0',
  modelConfigured: 'gpt-6-luna',
  reasoningEffort: 'max',
  ambientCodexConfigPath: '/synthetic/codex/config.toml',
  ambientCodexConfigSha256: 'b'.repeat(64),
  structuredResultDelivery: {
    kind: 'WORKSPACE_ARTIFACT_RECEIPT_V1',
    resultRelativePath: '.evolution-participant/final-result.json',
    receiptSchemaRef: 'scripts/evolution/operator/codexArtifactBackedReceipt.schema.json',
    receiptSchemaSha256: receiptSchemaSha,
  },
};

const executionTrace: ParticipantExecutionTraceV1 = {
  schemaVersion: 'participant-execution-trace-v1',
  invocation: { startedAt: '2026-10-01T00:00:00.000Z', timeoutMs: REFERENCE_ARTIFACT_BACKED_OBSERVATION_TIMEOUT_MS },
  events: [{ seq: 1, type: 'process_start', elapsedMs: 1 }],
  terminal: { outcome: 'completed', elapsedMs: 450, lastObservableActivityElapsedMs: 100 },
};

function completed(value: Record<string, unknown>): StructuredParticipantExecutionResult<Record<string, unknown>> {
  return {
    ok: true,
    value,
    rawOutput: JSON.stringify({ schemaVersion: 'artifact-backed-structured-final-result-receipt-v1', bytes: 0, sha256: 'c'.repeat(64) }),
    stderr: '',
    acceptedAttempt: 0,
    recovery: { eligible: false, attempted: false, outcome: 'NOT_ATTEMPTED' },
    executionTrace,
  };
}

async function gitFixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'artifact-backed-matrix-git-'));
  execFileSync('git', ['init', '-q', root]);
  execFileSync('git', ['-C', root, 'config', 'user.email', 'synthetic@example.invalid']);
  execFileSync('git', ['-C', root, 'config', 'user.name', 'Synthetic']);
  await writeFile(join(root, 'tracked.txt'), 'clean\n');
  execFileSync('git', ['-C', root, 'add', 'tracked.txt']);
  execFileSync('git', ['-C', root, 'commit', '-qm', 'fixture']);
  return root;
}

export async function runReferenceArtifactBackedCommunicationMatrixTests(): Promise<void> {
  const root = await gitFixture();
  try {
    const evidenceRoot = join(root, '.tmp/evolution/reference-artifact-backed-communication/synthetic-matrix');
    const workspaces: string[] = [];
    const invocations: Array<Record<string, unknown>> = [];
    let captureCount = 0;
    let resolveCount = 0;
    const payload = buildSyntheticLargeEnvelopePayload();
    const participant: WorkspaceAgentParticipantOptions = { executable: '/synthetic/codex', buildArgs: () => [] };
    const runStructured = async (input: Record<string, unknown>) => {
      invocations.push(input);
      const workspaceRoot = input.workspaceRoot as string;
      workspaces.push(workspaceRoot);
      const destinationRoot = input.destinationRoot as string;
      const artifactBytes = Buffer.from(JSON.stringify(payload));
      const artifactSha256 = createHash('sha256').update(artifactBytes).digest('hex');
      const rawReceipt = JSON.stringify({
        schemaVersion: 'artifact-backed-structured-final-result-receipt-v1',
        bytes: artifactBytes.length,
        sha256: artifactSha256,
      });
      await writeFile(join(destinationRoot, 'terminal-attempt-0.txt'), rawReceipt);
      await writeFile(join(destinationRoot, 'structured-result-artifact.raw.json'), artifactBytes);
      await writeFile(join(destinationRoot, 'artifact-backed-validation.json'), JSON.stringify({
        receiptValidationValid: true,
        artifactIntegrityValid: true,
        artifactEnvelopeValid: true,
        roleSchemaValidationAttempted: true,
        roleSchemaValid: true,
        actualBytes: artifactBytes.length,
        actualSha256: artifactSha256,
      }));
      return { ...completed(payload), rawOutput: rawReceipt };
    };

    const result = await runReferenceArtifactBackedCommunicationMatrix({
      repositoryRoot: root,
      evidenceRoot,
      matrixRef: 'synthetic-matrix',
      model: TEST_BINDING_LOCK.modelConfigured,
      reasoningEffort: TEST_BINDING_LOCK.reasoningEffort,
      ambientCodexConfigPath: TEST_BINDING_LOCK.ambientCodexConfigPath,
    }, {
      captureBindingLock: async () => { captureCount += 1; return TEST_BINDING_LOCK; },
      resolveBindingLock: async ({ lock }) => { resolveCount += 1; assert.deepEqual(lock, TEST_BINDING_LOCK); return { participant }; },
      runStructuredParticipantExecution: runStructured as never,
    });

    assert.equal(captureCount, 1);
    assert.equal(resolveCount, 3);
    assert.equal(result.schemaVersion, 'reference-artifact-backed-communication-matrix-v1');
    assert.equal(result.status, 'PASS');
    assert.equal(result.trials.length, 3);
    assert.deepEqual(result.trials.map(trial => trial.status), ['PASS', 'PASS', 'PASS']);
    assert.equal(new Set(workspaces).size, 3);
    assert.ok(invocations.every(call => call.role === 'solution'
      && call.retransmissionEnabled === false
      && (call.participant as WorkspaceAgentParticipantOptions).timeoutMs === 300_000
      && (call.participant as WorkspaceAgentParticipantOptions).executable === participant.executable
      && (call.structuredResultDelivery as { kind?: string }).kind === 'WORKSPACE_ARTIFACT_RECEIPT_V1'));
    assert.ok(invocations.every(call => /final-result\.json/.test(String(call.initialPrompt))
      && /receipt/.test(String(call.initialPrompt))));
    assert.ok(invocations.every(call => String(call.initialPrompt).includes(JSON.stringify(payload))));
    assert.ok(invocations.every(call => /terminal output must contain only the small JSON receipt/i.test(String(call.initialPrompt))));
    assert.equal((result as { observationCeilingMs?: number }).observationCeilingMs, 300_000);

    const lock = JSON.parse(await readFile(join(evidenceRoot, 'binding-lock.json'), 'utf8')) as ArtifactBackedReferenceParticipantBindingLockV2;
    assert.deepEqual(lock, TEST_BINDING_LOCK);
    assert.equal(result.bindingLockSha256, artifactBackedReferenceParticipantBindingLockSha256(lock));
    assert.equal(result.implementationSha, execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim());
    const matrixJson = JSON.parse(await readFile(join(evidenceRoot, 'matrix.json'), 'utf8')) as Record<string, unknown>;
    assert.equal(matrixJson.status, 'PASS');
    for (const trial of result.trials) {
      for (const reference of [trial.terminalReceiptRef, trial.resultArtifactRef, trial.validationRef, trial.traceRef]) {
        assert.equal(typeof reference, 'string');
        await readFile(join(evidenceRoot, reference!));
      }
      assert.equal(trial.artifactBytes, Buffer.byteLength(JSON.stringify(payload)));
      assert.match(trial.artifactSha256!, /^[0-9a-f]{64}$/);
    }
    const evidenceFiles = await readdir(evidenceRoot, { recursive: true });
    assert.ok(evidenceFiles.every(path => !path.includes('attempt-000012') && !path.includes('promotion')));
    assert.equal(validateSyntheticLargeEnvelopePayload(payload).ok, true);

    const dirtyRoot = await mkdtemp(join(tmpdir(), 'artifact-backed-matrix-dirty-'));
    try {
      execFileSync('git', ['init', '-q', dirtyRoot]);
      execFileSync('git', ['-C', dirtyRoot, 'config', 'user.email', 'synthetic@example.invalid']);
      execFileSync('git', ['-C', dirtyRoot, 'config', 'user.name', 'Synthetic']);
      await writeFile(join(dirtyRoot, 'tracked.txt'), 'clean\n');
      execFileSync('git', ['-C', dirtyRoot, 'add', 'tracked.txt']);
      execFileSync('git', ['-C', dirtyRoot, 'commit', '-qm', 'fixture']);
      await writeFile(join(dirtyRoot, 'tracked.txt'), 'dirty\n');
      await assert.rejects(runReferenceArtifactBackedCommunicationMatrix({
        repositoryRoot: dirtyRoot,
        evidenceRoot: join(dirtyRoot, '.tmp/matrix'),
        matrixRef: 'dirty-matrix',
        model: 'model',
        reasoningEffort: 'max',
        ambientCodexConfigPath: '/synthetic/config',
      }), /Tracked implementation worktree must be clean/);
    } finally {
      await rm(dirtyRoot, { recursive: true, force: true });
    }

    await assert.rejects(runReferenceArtifactBackedCommunicationMatrix({
      repositoryRoot: root,
      evidenceRoot: join(root, 'artifacts/evolution/autonomous-authoring/reference-trials/synthetic'),
      matrixRef: 'invalid-history',
      model: 'model',
      reasoningEffort: 'max',
      ambientCodexConfigPath: '/synthetic/config',
    }), /outside governed reference-trial history/);
    const governedRoot = join(root, 'artifacts/evolution/autonomous-authoring/reference-trials');
    await mkdir(governedRoot, { recursive: true });
    const symlinkAlias = join(root, 'history-alias');
    await symlink(governedRoot, symlinkAlias);
    await assert.rejects(runReferenceArtifactBackedCommunicationMatrix({
      repositoryRoot: root,
      evidenceRoot: join(symlinkAlias, 'matrix'),
      matrixRef: 'symlink-history',
      model: 'model',
      reasoningEffort: 'max',
      ambientCodexConfigPath: '/synthetic/config',
    }), /outside governed reference-trial history/);

    assert.equal(parseReferenceArtifactBackedCommunicationMatrixArgs([
      '--model', 'model', '--reasoning-effort', 'max', '--ambient-codex-config', '/tmp/config', '--matrix-ref', 'pilot-01',
    ], root).help, false);
    assert.throws(() => parseReferenceArtifactBackedCommunicationMatrixArgs([
      '--model', 'model', '--reasoning-effort', 'max', '--ambient-codex-config', '/tmp/config', '--matrix-ref', 'attempt-000012',
    ], root));
    assert.throws(() => parseReferenceArtifactBackedCommunicationMatrixArgs([
      '--model', 'model', '--reasoning-effort', 'max', '--ambient-codex-config', '', '--matrix-ref', 'pilot-02',
    ], root), /non-empty value/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

runReferenceArtifactBackedCommunicationMatrixTests()
  .then(() => process.stdout.write('reference artifact-backed communication matrix tests passed\n'))
  .catch(error => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
