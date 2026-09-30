import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { ParticipantExecutionTraceV1 } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import type { SolutionAgentRunResult } from '../../scripts/evolution/problemAgnosticSolution/runSolutionAgent';
import {
  classifyPreschoolReferenceSolutionCommunicationOutcome,
  runPreschoolReferenceSolutionCommunicationProbe,
} from '../../scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial';
import {
  parsePreschoolReferenceSolutionCommunicationProbeArgs,
  readCleanPreschoolReferenceProbeImplementationSha,
  readValidatedPreschoolReferenceProbeBindingLock,
} from '../../scripts/evolution/autonomousAuthoring/runPreschoolReferenceSolutionCommunicationProbe';
import { referenceParticipantBindingLockSha256 } from '../../scripts/evolution/operator/referenceParticipantBinding';
import type { ReferenceParticipantBindingLockV1 } from '../../scripts/evolution/operator/referenceParticipantBinding';

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

function executionTrace(validation?: {
  envelopeValid: boolean;
  schemaValidationAttempted: boolean;
  schemaValid?: boolean;
}): ParticipantExecutionTraceV1 {
  return {
    schemaVersion: 'participant-execution-trace-v1',
    invocation: { startedAt: '2026-09-30T00:00:00.000Z', timeoutMs: 1_800_000 },
    events: [
      { seq: 1, type: 'process_start', elapsedMs: 5 },
      { seq: 2, type: 'output_activity', elapsedMs: 125, stream: 'stdout', bytes: 120 },
      ...(validation === undefined ? [] : [{
        seq: 3,
        type: 'participant_terminal_validation' as const,
        elapsedMs: 200,
        attempt: 0 as const,
        ...validation,
      }]),
    ],
    terminal: {
      outcome: validation === undefined ? 'timeout' : 'completed',
      elapsedMs: validation === undefined ? 1_800_000 : 240,
      lastObservableActivityElapsedMs: 125,
    },
  };
}

function solutionResult(input: { ok: boolean; errorKind?: 'timeout' | 'invalid_output'; origin?: 'OUTPUT_ENVELOPE' | 'OUTPUT_SCHEMA'; reason?: 'INVALID_JSON_ENVELOPE' | 'ROLE_SCHEMA_INVALID' }): SolutionAgentRunResult {
  if (input.ok) {
    return {
      ok: true,
      result: {} as never,
      invocationPath: 'solution-agent/invocation.json',
      rawOutputPath: 'solution-agent/raw-output.txt',
      resultPath: 'solution-agent/result.json',
    };
  }
  return {
    ok: false,
    errorKind: input.errorKind ?? 'invalid_output',
    message: 'synthetic failure',
    failure: {
      origin: input.origin ?? 'OUTPUT_ENVELOPE',
      reason: input.reason ?? 'INVALID_JSON_ENVELOPE',
      participantErrorKind: input.errorKind ?? 'invalid_output',
      message: 'synthetic failure',
    },
    invocationPath: 'solution-agent/invocation.json',
    rawOutputPath: 'solution-agent/raw-output.txt',
    failurePath: 'solution-agent/failure.json',
  };
}

function testOutcomeClassification(): void {
  const valid = classifyPreschoolReferenceSolutionCommunicationOutcome({
    solution: solutionResult({ ok: true }),
    executionTrace: executionTrace({ envelopeValid: true, schemaValidationAttempted: true, schemaValid: true }),
  });
  assert.equal(valid.envelopeValid, true);
  assert.equal(valid.schemaValidationAttempted, true);
  assert.equal(valid.schemaValid, true);
  assert.equal(valid.reachedRoleSchemaValidation, true);

  const schemaFailure = classifyPreschoolReferenceSolutionCommunicationOutcome({
    solution: solutionResult({ ok: false, origin: 'OUTPUT_SCHEMA', reason: 'ROLE_SCHEMA_INVALID' }),
    executionTrace: executionTrace({ envelopeValid: true, schemaValidationAttempted: true, schemaValid: false }),
  });
  assert.equal(schemaFailure.envelopeValid, true);
  assert.equal(schemaFailure.schemaValidationAttempted, true);
  assert.equal(schemaFailure.schemaValid, false);
  assert.equal(schemaFailure.reachedRoleSchemaValidation, true);

  const envelopeFailure = classifyPreschoolReferenceSolutionCommunicationOutcome({
    solution: solutionResult({ ok: false }),
    executionTrace: executionTrace({ envelopeValid: false, schemaValidationAttempted: false }),
  });
  assert.equal(envelopeFailure.envelopeValid, false);
  assert.equal(envelopeFailure.schemaValidationAttempted, false);
  assert.equal(envelopeFailure.reachedRoleSchemaValidation, false);

  const timeout = classifyPreschoolReferenceSolutionCommunicationOutcome({
    solution: solutionResult({ ok: false, errorKind: 'timeout' }),
    executionTrace: executionTrace(),
  });
  assert.equal(timeout.envelopeValid, null);
  assert.equal(timeout.schemaValidationAttempted, false);
  assert.equal(timeout.reachedRoleSchemaValidation, false);
  assert.equal(timeout.status, 'INITIAL_TIMEOUT');
}

async function testGovernedDestinationRejectedBeforeBinding(): Promise<void> {
  let bindingCalls = 0;
  let solutionCalls = 0;
  const attemptTwelve = resolve(process.cwd(), 'artifacts/evolution/autonomous-authoring/reference-trials/preschool-pver-20260922231805-71297571/attempts/attempt-000012');
  await assert.rejects(runPreschoolReferenceSolutionCommunicationProbe({
    liveRepositoryRoot: process.cwd(),
    evidencePath: '/synthetic/accepted-evidence.json',
    observablePayloadPath: '/synthetic/observable-payload.json',
    responsibilityBriefPath: '/synthetic/reference-responsibility-brief.json',
    probeRef: 'containment-test',
    destinationRoot: resolve(attemptTwelve, 'probe-output'),
    participantBindingLock: TEST_BINDING_LOCK,
  }, {
    resolveReferenceParticipantBindingFromLock: async () => {
      bindingCalls += 1;
      throw new Error('must reject governed destination before resolving the lock');
    },
    runSolutionAgent: async () => {
      solutionCalls += 1;
      return solutionResult({ ok: true });
    },
  }), /outside.*governed reference-trial/i);
  assert.equal(bindingCalls, 0);
  assert.equal(solutionCalls, 0);
  await assert.rejects(access(attemptTwelve), { code: 'ENOENT' });
}

async function testSymlinkedGovernedDestinationRejectedBeforeBinding(): Promise<void> {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'preschool-reference-probe-containment-test-'));
  const governedRoot = resolve(process.cwd(), 'artifacts/evolution/autonomous-authoring/reference-trials');
  const governedAlias = join(temporaryRoot, 'reference-trials');
  await symlink(governedRoot, governedAlias, 'dir');
  let bindingCalls = 0;
  let solutionCalls = 0;
  try {
    await assert.rejects(runPreschoolReferenceSolutionCommunicationProbe({
      liveRepositoryRoot: process.cwd(),
      evidencePath: '/synthetic/accepted-evidence.json',
      observablePayloadPath: '/synthetic/observable-payload.json',
      responsibilityBriefPath: '/synthetic/reference-responsibility-brief.json',
      probeRef: 'symlink-containment-test',
      destinationRoot: join(governedAlias, 'communication-probe'),
      participantBindingLock: TEST_BINDING_LOCK,
    }, {
      resolveReferenceParticipantBindingFromLock: async () => {
        bindingCalls += 1;
        throw new Error('must reject governed destination before resolving the lock');
      },
      runSolutionAgent: async () => {
        solutionCalls += 1;
        return solutionResult({ ok: true });
      },
    }), /outside.*governed reference-trial/i);
    assert.equal(bindingCalls, 0);
    assert.equal(solutionCalls, 0);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

function testCliRequiresExactInputsAndBindingLock(): void {
  const parsed = parsePreschoolReferenceSolutionCommunicationProbeArgs([
    '--evidence', '/reference/accepted-evidence.json',
    '--observable-payload', '/reference/observable-payload.json',
    '--responsibility-brief', '/reference/reference-responsibility-brief.json',
    '--probe-ref', 'probe-001',
    '--binding-lock', '/matrix/binding-lock.json',
  ], '/synthetic/repository');
  assert.deepEqual(parsed, {
    help: false,
    input: {
      liveRepositoryRoot: '/synthetic/repository',
      evidencePath: '/reference/accepted-evidence.json',
      observablePayloadPath: '/reference/observable-payload.json',
      responsibilityBriefPath: '/reference/reference-responsibility-brief.json',
      probeRef: 'probe-001',
      destinationRoot: '/synthetic/repository/.tmp/evolution/preschool-reference-solution-communication-probes/probe-001',
      participantBindingLockPath: '/matrix/binding-lock.json',
    },
  });
  assert.throws(() => parsePreschoolReferenceSolutionCommunicationProbeArgs([
    '--evidence', '/reference/accepted-evidence.json',
    '--observable-payload', '/reference/observable-payload.json',
    '--responsibility-brief', '/reference/reference-responsibility-brief.json',
    '--probe-ref', 'probe-001',
    '--binding-lock', '/matrix/binding-lock.json',
    '--attempt-ref', 'attempt-000012',
  ], '/synthetic/repository'), /unknown option/i);
}

async function testCliRejectsDirtyTrackedImplementation(): Promise<void> {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'preschool-reference-probe-dirty-tree-test-'));
  try {
    execFileSync('git', ['-C', temporaryRoot, 'init', '--quiet']);
    execFileSync('git', ['-C', temporaryRoot, 'config', 'user.name', 'Probe Test']);
    execFileSync('git', ['-C', temporaryRoot, 'config', 'user.email', 'probe-test@example.invalid']);
    const sourcePath = join(temporaryRoot, 'implementation.ts');
    await writeFile(sourcePath, 'export const version = 1;\n');
    execFileSync('git', ['-C', temporaryRoot, 'add', 'implementation.ts']);
    execFileSync('git', ['-C', temporaryRoot, 'commit', '--quiet', '-m', 'base']);
    await writeFile(sourcePath, 'export const version = 2;\n');
    assert.throws(
      () => readCleanPreschoolReferenceProbeImplementationSha(temporaryRoot),
      /tracked implementation worktree must be clean/i,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function testCliRequiresPassingMatrixAndExactBindingLock(): Promise<void> {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'preschool-reference-probe-cli-test-'));
  const matrixRoot = join(temporaryRoot, 'matrix');
  const lockPath = join(matrixRoot, 'binding-lock.json');
  const matrixPath = join(matrixRoot, 'matrix.json');
  const implementationSha = 'c'.repeat(40);
  const lockSha256 = referenceParticipantBindingLockSha256(TEST_BINDING_LOCK);
  await mkdir(matrixRoot);
  await writeFile(lockPath, `${JSON.stringify(TEST_BINDING_LOCK, null, 2)}\n`);
  const matrix = {
    schemaVersion: 'reference-participant-communication-matrix-v2',
    implementationSha,
    bindingLockRef: 'binding-lock.json',
    bindingLockSha256: lockSha256,
    status: 'PASS',
    matrices: {
      A: { gatePassed: true },
      B: { gatePassed: true },
      C: {
        gatePassed: true,
        timeoutPolicyReviewRequired: false,
        policyClassification: 'SUPPORTED_60S',
      },
    },
  };
  try {
    await writeFile(matrixPath, `${JSON.stringify(matrix, null, 2)}\n`);
    assert.deepEqual(await readValidatedPreschoolReferenceProbeBindingLock({
      repositoryRoot: temporaryRoot,
      participantBindingLockPath: lockPath,
      currentImplementationSha: implementationSha,
    }), TEST_BINDING_LOCK);

    await writeFile(matrixPath, `${JSON.stringify({ ...matrix, schemaVersion: 'reference-participant-communication-matrix-v1' }, null, 2)}\n`);
    await assert.rejects(readValidatedPreschoolReferenceProbeBindingLock({
      repositoryRoot: temporaryRoot,
      participantBindingLockPath: lockPath,
      currentImplementationSha: implementationSha,
    }), /passing A-C matrix/i);

    await writeFile(matrixPath, `${JSON.stringify({
      ...matrix,
      matrices: {
        ...matrix.matrices,
        C: { gatePassed: true, timeoutPolicyReviewRequired: true, policyClassification: 'CONTINUATION_TIMEOUT_POLICY_REVIEW' },
      },
    }, null, 2)}\n`);
    await assert.rejects(readValidatedPreschoolReferenceProbeBindingLock({
      repositoryRoot: temporaryRoot,
      participantBindingLockPath: lockPath,
      currentImplementationSha: implementationSha,
    }), /passing A-C matrix/i);

    await writeFile(matrixPath, `${JSON.stringify({ ...matrix, bindingLockSha256: '0'.repeat(64) }, null, 2)}\n`);
    await assert.rejects(readValidatedPreschoolReferenceProbeBindingLock({
      repositoryRoot: temporaryRoot,
      participantBindingLockPath: lockPath,
      currentImplementationSha: implementationSha,
    }), /binding-lock SHA/i);

    await writeFile(matrixPath, `${JSON.stringify({
      ...matrix,
      status: 'CONTINUATION_TIMEOUT_POLICY_REVIEW',
      matrices: { ...matrix.matrices, C: { gatePassed: false } },
    }, null, 2)}\n`);
    await assert.rejects(readValidatedPreschoolReferenceProbeBindingLock({
      repositoryRoot: temporaryRoot,
      participantBindingLockPath: lockPath,
      currentImplementationSha: implementationSha,
    }), /passing A-C matrix/i);

    await writeFile(matrixPath, `${JSON.stringify(matrix, null, 2)}\n`);
    await assert.rejects(readValidatedPreschoolReferenceProbeBindingLock({
      repositoryRoot: temporaryRoot,
      participantBindingLockPath: lockPath,
      currentImplementationSha: 'd'.repeat(40),
    }), /current implementation SHA/i);

    const matrixUnderGovernedRoot = join(
      temporaryRoot,
      'artifacts/evolution/autonomous-authoring/reference-trials/matrix/binding-lock.json',
    );
    await mkdir(join(temporaryRoot, 'artifacts/evolution/autonomous-authoring/reference-trials/matrix'), { recursive: true });
    await writeFile(matrixUnderGovernedRoot, await readFile(lockPath));
    await assert.rejects(readValidatedPreschoolReferenceProbeBindingLock({
      repositoryRoot: temporaryRoot,
      participantBindingLockPath: matrixUnderGovernedRoot,
      currentImplementationSha: implementationSha,
    }), /outside governed reference-trial history/i);

    const governedMatrixRoot = join(temporaryRoot, 'artifacts/evolution/autonomous-authoring/reference-trials/matrix');
    const matrixAlias = join(temporaryRoot, 'matrix-alias');
    await mkdir(governedMatrixRoot, { recursive: true });
    await writeFile(join(governedMatrixRoot, 'binding-lock.json'), await readFile(lockPath));
    await writeFile(join(governedMatrixRoot, 'matrix.json'), `${JSON.stringify(matrix, null, 2)}\n`);
    await symlink(governedMatrixRoot, matrixAlias, 'dir');
    await assert.rejects(readValidatedPreschoolReferenceProbeBindingLock({
      repositoryRoot: temporaryRoot,
      participantBindingLockPath: join(matrixAlias, 'binding-lock.json'),
      currentImplementationSha: implementationSha,
    }), /outside governed reference-trial history/i);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function runPreschoolReferenceSolutionCommunicationProbeTests(): Promise<void> {
  testOutcomeClassification();
  await testGovernedDestinationRejectedBeforeBinding();
  await testSymlinkedGovernedDestinationRejectedBeforeBinding();
  testCliRequiresExactInputsAndBindingLock();
  await testCliRejectsDirtyTrackedImplementation();
  await testCliRequiresPassingMatrixAndExactBindingLock();
}

if (process.argv[1]?.endsWith('preschoolReferenceSolutionCommunicationProbe.test.ts')) {
  runPreschoolReferenceSolutionCommunicationProbeTests().then(() => {
    process.stdout.write('preschoolReferenceSolutionCommunicationProbe.test.ts: ok\n');
  }).catch(error => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
