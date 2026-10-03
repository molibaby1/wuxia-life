import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import {
  ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES,
  ARTIFACT_BACKED_STRUCTURED_RESULT_PREFLIGHT_COMMAND,
  ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH,
} from '../../src/evolution/artifactBackedStructuredFinalResultContract';
import { validateSolutionWork } from '../../src/evolution/solutionWorkContract';
import {
  runStructuredParticipantExecution,
  type StructuredParticipantExecutionResult,
} from '../../scripts/evolution/problemAgnosticSolution/runStructuredParticipantExecution';
import {
  PARTICIPANT_ABSOLUTE_TIMEOUT_MS,
  runWorkspaceAgentContinuation,
  runWorkspaceAgentJob,
  type WorkspaceAgentJobInput,
  type WorkspaceAgentParticipantOptions,
} from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { ENVELOPE_RETRANSMISSION_TIMEOUT_MS } from '../../scripts/evolution/problemAgnosticSolution/envelopeRetransmission';

const RECEIPT_SCHEMA_VERSION = 'artifact-backed-structured-final-result-receipt-v1';

interface Fixture {
  root: string;
  workspaceRoot: string;
  destinationRoot: string;
}

async function withFixture(run: (fixture: Fixture) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'artifact-backed-participant-'));
  const fixture = {
    root,
    workspaceRoot: join(root, 'workspace'),
    destinationRoot: join(root, 'evidence'),
  };
  await mkdir(fixture.workspaceRoot);
  await mkdir(fixture.destinationRoot);
  try {
    await run(fixture);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function receiptFor(bytes: Buffer, overrides: { bytes?: number; sha256?: string } = {}): string {
  return JSON.stringify({
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    bytes: overrides.bytes ?? bytes.byteLength,
    sha256: overrides.sha256 ?? sha256(bytes),
  });
}

function participantFor(input: {
  terminalOutput: string;
  artifactBytes?: Buffer;
  artifactKind?: 'file' | 'missing' | 'symlink' | 'directory' | 'oversize';
  outsidePath?: string;
  preflightLauncherPath?: string;
  stderr?: string;
  onContinuation?: () => void;
}): WorkspaceAgentParticipantOptions {
  const artifactRelativePath = ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH;
  const artifactBytesBase64 = input.artifactBytes?.toString('base64');
  const writeArtifact = input.artifactKind === 'missing'
    ? ''
    : input.artifactKind === 'symlink'
      ? `fs.symlinkSync(${JSON.stringify(input.outsidePath)}, artifactPath);`
      : input.artifactKind === 'directory'
        ? 'fs.mkdirSync(artifactPath);'
        : input.artifactKind === 'oversize'
          ? `fs.writeFileSync(artifactPath, Buffer.alloc(${ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES + 1}, 0x20));`
        : `fs.writeFileSync(artifactPath, Buffer.from(${JSON.stringify(artifactBytesBase64 ?? '')}, 'base64'));`;
  const preflight = input.preflightLauncherPath === undefined
    ? []
    : [
      "const childProcess = require('node:child_process');",
      `const preflight = childProcess.spawnSync(${JSON.stringify(input.preflightLauncherPath)}, [], { encoding: 'utf8' });`,
      "if (preflight.status !== 0 || preflight.stdout !== 'ROLE_SCHEMA_PREFLIGHT_PASS\\n') throw new Error('Role-schema preflight failed: ' + preflight.stderr);",
    ];
  const script = [
    "const fs = require('node:fs');",
    "const path = require('node:path');",
    `const artifactPath = path.resolve(${JSON.stringify(artifactRelativePath)});`,
    'fs.mkdirSync(path.dirname(artifactPath), { recursive: true });',
    writeArtifact,
    ...preflight,
    `process.stdout.write(${JSON.stringify(input.terminalOutput)});`,
    `process.stderr.write(${JSON.stringify(input.stderr ?? 'provider stderr')});`,
  ].join('\n');
  return {
    executable: process.execPath,
    buildArgs: () => ['-e', script],
    spawnProcess: spawn,
    interpretCompletedOutput: ({ stdout, expectedThreadRef }) => ({
      ok: true,
      rawOutput: stdout,
      threadRef: expectedThreadRef ?? { provider: 'test-provider', opaqueId: 'thread-000001' },
    }),
    sameThreadContinuation: {
      provider: 'test-provider',
      buildArgs: () => {
        input.onContinuation?.();
        return ['-e', 'process.stdout.write("{}")'];
      },
    },
  };
}

function executionInput(input: {
  workspaceRoot: string;
  destinationRoot: string;
  participant: WorkspaceAgentParticipantOptions;
  structuredResultDelivery?: { kind: 'TERMINAL_JSON' } | {
    kind: 'WORKSPACE_ARTIFACT_RECEIPT_V1';
    resultRelativePath: typeof ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH;
  };
  validateSchema?: (value: Record<string, unknown>) => Record<string, unknown>;
  validateAcceptedResult?: (value: Record<string, unknown>) => Promise<void>;
}) {
  return {
    invocationRef: 'artifact-backed-test-000001',
    role: 'solution' as const,
    workspaceRoot: input.workspaceRoot,
    destinationRoot: input.destinationRoot,
    initialPrompt: 'Return one structured result.',
    expectedRoleSchemaName: 'ExampleRoleV1',
    participant: input.participant,
    retransmissionEnabled: true,
    ...(input.structuredResultDelivery === undefined
      ? {}
      : { structuredResultDelivery: input.structuredResultDelivery }),
    validateSchema: input.validateSchema ?? (value => value),
    validateAcceptedResult: input.validateAcceptedResult ?? (async () => undefined),
  };
}

async function artifactExecution(input: {
  workspaceRoot: string;
  destinationRoot: string;
  participant: WorkspaceAgentParticipantOptions;
  validateSchema?: (value: Record<string, unknown>) => Record<string, unknown>;
  validateAcceptedResult?: (value: Record<string, unknown>) => Promise<void>;
}): Promise<StructuredParticipantExecutionResult<Record<string, unknown>>> {
  return runStructuredParticipantExecution({
    ...executionInput(input),
    structuredResultDelivery: {
      kind: 'WORKSPACE_ARTIFACT_RECEIPT_V1',
      resultRelativePath: ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH,
    },
  });
}

export async function runArtifactBackedStructuredParticipantExecutionTests(): Promise<void> {
  const validObject = { value: 'accepted-result' };
  const validBytes = Buffer.from(JSON.stringify(validObject));
  const validReceipt = receiptFor(validBytes);

  await withFixture(async ({ workspaceRoot, destinationRoot }) => {
    let continuationCalls = 0;
    let schemaCalls = 0;
    let acceptedCalls = 0;
    const participant = participantFor({ terminalOutput: validReceipt, artifactBytes: validBytes });
    participant.bindingMetadata = { structuredResultDeliveryMode: 'WORKSPACE_ARTIFACT_RECEIPT_V1' };
    const result = await artifactExecution({
      workspaceRoot,
      destinationRoot,
      participant: {
        ...participant,
        sameThreadContinuation: {
          provider: 'test-provider',
          buildArgs: () => {
            continuationCalls += 1;
            return ['-e', 'process.stdout.write("{}")'];
          },
        },
      },
      validateSchema: value => {
        schemaCalls += 1;
        assert.deepEqual(value, validObject);
        return value;
      },
      validateAcceptedResult: async value => {
        acceptedCalls += 1;
        assert.deepEqual(value, validObject);
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.executionTrace.invocation.timeoutMs, 2_700_000);
    assert.deepEqual(result.executionTrace.invocation.timeoutPolicy, {
      kind: 'PARTICIPANT_ACTIVITY_AWARE_V1',
      evaluationStartMs: 1_800_000,
      stdoutInactivityMs: 600_000,
      absoluteCapMs: 2_700_000,
    });
    assert.deepEqual(result.ok ? result.value : undefined, validObject);
    assert.equal(result.ok ? result.acceptedAttempt : undefined, 0);
    assert.deepEqual(result.recovery, { eligible: false, attempted: false, outcome: 'NOT_ATTEMPTED' });
    assert.equal(schemaCalls, 1);
    assert.equal(acceptedCalls, 1);
    assert.equal(continuationCalls, 0);
    assert.equal(await readFile(join(destinationRoot, 'terminal-attempt-0.txt'), 'utf8'), validReceipt);
    assert.deepEqual(
      await readFile(join(destinationRoot, 'structured-result-artifact.raw.json')),
      validBytes,
    );
    assert.equal(await readFile(join(destinationRoot, 'provider-stdout.raw.txt'), 'utf8'), validReceipt);
    assert.equal(await readFile(join(destinationRoot, 'provider-stderr.raw.txt'), 'utf8'), 'provider stderr');
    const validation = JSON.parse(await readFile(join(destinationRoot, 'artifact-backed-validation.json'), 'utf8')) as Record<string, unknown>;
    assert.equal(validation.receiptValidationValid, true);
    assert.equal(validation.artifactIntegrityValid, true);
    assert.equal(validation.artifactEnvelopeValid, true);
    assert.equal(validation.roleSchemaValidationAttempted, true);
    assert.equal(validation.roleSchemaValid, true);
    assert.equal(validation.acceptedResultAttempted, true);
    assert.equal(validation.accepted, true);
    assert.equal(validation.earliestFailureBoundary, null);
    assert.doesNotMatch(JSON.stringify(validation), /accepted-result|value/);
    await assert.rejects(
      readFile(join(destinationRoot, 'participant-envelope-retransmission-prompt-1.txt')),
      /ENOENT/,
    );
  });

  await withFixture(async ({ workspaceRoot, destinationRoot }) => {
    const validSolutionWork = {
      schemaVersion: 'solution-work-v1',
      status: 'OPTIONS',
      problemId: 'problem-000001',
      options: [{
        optionId: 'option-000001',
        proposedChange: 'A bounded proposal.',
        rationale: 'It addresses the observed gap.',
        repoRefs: [],
        artifactRefs: [],
        changeScope: 'program',
        expectedPlayerObservableDifference: 'A suitable scene is available.',
        risks: [],
        unknowns: [],
      }],
      recommendedOptionId: 'option-000001',
      summary: 'A bounded proposal.',
      repoRefs: [],
      artifactRefs: [],
    };
    const artifactBytes = Buffer.from(JSON.stringify(validSolutionWork));
    const receipt = receiptFor(artifactBytes);
    const launcherPath = join(workspaceRoot, ARTIFACT_BACKED_STRUCTURED_RESULT_PREFLIGHT_COMMAND);
    let schemaCalls = 0;
    let continuationCalls = 0;
    const participant = participantFor({
      terminalOutput: receipt,
      artifactBytes,
      preflightLauncherPath: launcherPath,
      onContinuation: () => { continuationCalls += 1; },
    });
    participant.bindingMetadata = { structuredResultDeliveryMode: 'WORKSPACE_ARTIFACT_RECEIPT_V1' };

    const result = await artifactExecution({
      workspaceRoot,
      destinationRoot,
      participant,
      validateSchema: value => {
        schemaCalls += 1;
        return validateSolutionWork(value) as unknown as Record<string, unknown>;
      },
    });

    assert.equal(result.ok, true);
    assert.equal(result.ok ? result.acceptedAttempt : undefined, 0);
    assert.deepEqual(result.recovery, { eligible: false, attempted: false, outcome: 'NOT_ATTEMPTED' });
    assert.equal(schemaCalls, 1, 'Host must independently run its Role validator after Participant preflight PASS');
    assert.equal(continuationCalls, 0);
    assert.deepEqual(result.ok ? result.value : undefined, validSolutionWork);
    assert.deepEqual(Object.keys(JSON.parse(receipt)), ['schemaVersion', 'bytes', 'sha256']);
  });

  await withFixture(async ({ workspaceRoot, destinationRoot }) => {
    const result = await runStructuredParticipantExecution(executionInput({
      workspaceRoot,
      destinationRoot,
      participant: participantFor({ terminalOutput: JSON.stringify(validObject) }),
    }));
    assert.equal(result.ok, true);
    assert.deepEqual(result.ok ? result.value : undefined, validObject);
    assert.equal(result.ok ? result.acceptedAttempt : undefined, 0);
  });

  await withFixture(async ({ workspaceRoot, destinationRoot }) => {
    let continuationCalls = 0;
    const participant = participantFor({
      terminalOutput: 'prose',
      onContinuation: () => { continuationCalls += 1; },
    });
    participant.interpretCompletedOutput = ({ stdout, expectedThreadRef }) => ({
      ok: true,
      rawOutput: expectedThreadRef === undefined ? stdout : JSON.stringify(validObject),
      threadRef: expectedThreadRef ?? { provider: 'test-provider', opaqueId: 'thread-000002' },
    });
    const result = await runStructuredParticipantExecution(executionInput({
      workspaceRoot,
      destinationRoot,
      participant,
      structuredResultDelivery: { kind: 'TERMINAL_JSON' },
    }));
    assert.equal(result.ok, true);
    assert.equal(continuationCalls, 1);
    assert.equal(result.recovery.attempted, true);
    assert.equal(result.ok ? result.acceptedAttempt : undefined, 1);
    const retransmissionEvent = result.executionTrace.events.find(
      event => event.type === 'participant_envelope_retransmission_requested',
    );
    assert.equal(retransmissionEvent?.sameThread, true);
    assert.equal(retransmissionEvent?.timeoutMs, ENVELOPE_RETRANSMISSION_TIMEOUT_MS);
    assert.equal(ENVELOPE_RETRANSMISSION_TIMEOUT_MS, 60_000);
  });

  const invalidCases: Array<{
    name: string;
    terminalOutput: string;
    artifactBytes?: Buffer;
    artifactKind?: 'file' | 'missing' | 'symlink' | 'directory' | 'oversize';
    boundary: string;
    schemaAttempted: boolean;
    acceptedAttempted: boolean;
    receiptValid: boolean;
    integrityValid: boolean | null;
    artifactEnvelopeValid: boolean | null;
  }> = [];
  const emptyObjectBytes = Buffer.from('{}');
  invalidCases.push(
    {
      name: 'invalid-receipt-json', terminalOutput: 'prose', boundary: 'TERMINAL_RECEIPT_ENVELOPE',
      schemaAttempted: false, acceptedAttempted: false, receiptValid: false,
      integrityValid: null, artifactEnvelopeValid: null,
    },
    {
      name: 'invalid-receipt-shape', terminalOutput: '{}', boundary: 'TERMINAL_RECEIPT_SCHEMA',
      schemaAttempted: false, acceptedAttempted: false, receiptValid: false,
      integrityValid: null, artifactEnvelopeValid: null,
    },
    {
      name: 'missing-artifact', terminalOutput: receiptFor(emptyObjectBytes), artifactKind: 'missing',
      boundary: 'FIXED_RESULT_ARTIFACT', schemaAttempted: false, acceptedAttempted: false, receiptValid: true,
      integrityValid: false, artifactEnvelopeValid: null,
    },
    {
      name: 'non-regular-artifact', terminalOutput: receiptFor(emptyObjectBytes), artifactKind: 'directory',
      boundary: 'FIXED_RESULT_ARTIFACT', schemaAttempted: false, acceptedAttempted: false, receiptValid: true,
      integrityValid: false, artifactEnvelopeValid: null,
    },
    {
      name: 'oversized-artifact', terminalOutput: receiptFor(Buffer.alloc(0)), artifactKind: 'oversize',
      boundary: 'FIXED_RESULT_ARTIFACT', schemaAttempted: false, acceptedAttempted: false, receiptValid: true,
      integrityValid: false, artifactEnvelopeValid: null,
    },
    {
      name: 'byte-mismatch', terminalOutput: receiptFor(emptyObjectBytes, { bytes: 1 }), artifactBytes: emptyObjectBytes,
      boundary: 'ARTIFACT_INTEGRITY', schemaAttempted: false, acceptedAttempted: false, receiptValid: true,
      integrityValid: false, artifactEnvelopeValid: null,
    },
    {
      name: 'sha-mismatch', terminalOutput: receiptFor(emptyObjectBytes, { sha256: 'a'.repeat(64) }), artifactBytes: emptyObjectBytes,
      boundary: 'ARTIFACT_INTEGRITY', schemaAttempted: false, acceptedAttempted: false, receiptValid: true,
      integrityValid: false, artifactEnvelopeValid: null,
    },
    {
      name: 'invalid-artifact-json', terminalOutput: receiptFor(Buffer.from('not json')), artifactBytes: Buffer.from('not json'),
      boundary: 'ARTIFACT_ENVELOPE', schemaAttempted: false, acceptedAttempted: false, receiptValid: true,
      integrityValid: true, artifactEnvelopeValid: false,
    },
    {
      name: 'role-schema-failure', terminalOutput: receiptFor(emptyObjectBytes), artifactBytes: emptyObjectBytes,
      boundary: 'ROLE_SCHEMA', schemaAttempted: true, acceptedAttempted: false, receiptValid: true,
      integrityValid: true, artifactEnvelopeValid: true,
    },
    {
      name: 'accepted-result-failure', terminalOutput: receiptFor(emptyObjectBytes), artifactBytes: emptyObjectBytes,
      boundary: 'ACCEPTED_RESULT', schemaAttempted: true, acceptedAttempted: true, receiptValid: true,
      integrityValid: true, artifactEnvelopeValid: true,
    },
  );

  for (const testCase of invalidCases) {
    await withFixture(async ({ root, workspaceRoot, destinationRoot }) => {
      let continuationCalls = 0;
      let schemaCalls = 0;
      let acceptedCalls = 0;
      const outsidePath = join(root, 'outside-artifact.json');
      if (testCase.artifactKind === 'symlink') await writeFile(outsidePath, '{}');
      const participant = participantFor({
        terminalOutput: testCase.terminalOutput,
        artifactBytes: testCase.artifactBytes,
        artifactKind: testCase.artifactKind,
        outsidePath,
        onContinuation: () => { continuationCalls += 1; },
      });
      const result = await artifactExecution({
        workspaceRoot,
        destinationRoot,
        participant,
        validateSchema: value => {
          schemaCalls += 1;
          if (testCase.name === 'role-schema-failure') {
            return validateSolutionWork(value) as unknown as Record<string, unknown>;
          }
          return value;
        },
        validateAcceptedResult: async () => {
          acceptedCalls += 1;
          if (testCase.name === 'accepted-result-failure') throw new Error('accepted result rejected');
        },
      });

      assert.equal(result.ok, false, testCase.name);
      assert.equal(schemaCalls > 0, testCase.schemaAttempted, testCase.name);
      assert.equal(acceptedCalls > 0, testCase.acceptedAttempted, testCase.name);
      assert.equal(continuationCalls, 0, testCase.name);
      assert.deepEqual(result.recovery, { eligible: false, attempted: false, outcome: 'NOT_ATTEMPTED' });
      const evidence = JSON.parse(await readFile(join(destinationRoot, 'artifact-backed-validation.json'), 'utf8')) as Record<string, unknown>;
      assert.equal(evidence.earliestFailureBoundary, testCase.boundary, testCase.name);
      assert.equal(evidence.receiptValidationValid, testCase.receiptValid, testCase.name);
      assert.equal(evidence.artifactIntegrityValid, testCase.integrityValid, testCase.name);
      assert.equal(evidence.artifactEnvelopeValid, testCase.artifactEnvelopeValid, testCase.name);
      assert.equal(evidence.roleSchemaValidationAttempted, testCase.schemaAttempted, testCase.name);
      assert.equal(evidence.acceptedResultAttempted, testCase.acceptedAttempted, testCase.name);
      await assert.rejects(
        readFile(join(destinationRoot, 'participant-envelope-retransmission-prompt-1.txt')),
        /ENOENT/,
        testCase.name,
      );
    });
  }

  await withFixture(async ({ root, workspaceRoot, destinationRoot }) => {
    const outsidePath = join(root, 'outside-artifact.json');
    await writeFile(outsidePath, '{}');
    let continuationCalls = 0;
    const result = await artifactExecution({
      workspaceRoot,
      destinationRoot,
      participant: participantFor({
        terminalOutput: receiptFor(emptyObjectBytes),
        artifactKind: 'symlink',
        outsidePath,
        onContinuation: () => { continuationCalls += 1; },
      }),
    });
    assert.equal(result.ok, false);
    assert.equal(continuationCalls, 0);
    const evidence = JSON.parse(await readFile(join(destinationRoot, 'artifact-backed-validation.json'), 'utf8')) as Record<string, unknown>;
    assert.equal(evidence.earliestFailureBoundary, 'FIXED_RESULT_ARTIFACT');
  });

  await withFixture(async ({ workspaceRoot, destinationRoot }) => {
    const stdoutPath = join(destinationRoot, 'timeout-provider-stdout.raw.txt');
    const stderrPath = join(destinationRoot, 'timeout-provider-stderr.raw.txt');
    const job: WorkspaceAgentJobInput = {
      invocationRef: 'artifact-stream-timeout-000001',
      role: 'solution',
      workspaceRoot,
      prompt: 'capture streams before timeout',
      providerStdoutArtifactPath: stdoutPath,
      providerStderrArtifactPath: stderrPath,
    };
    const result = await runWorkspaceAgentJob(job, {
      executable: process.execPath,
      timeoutMs: 1_200,
      buildArgs: () => [
        '-e',
        'process.stdout.write("timeout stdout");process.stderr.write("timeout stderr");setTimeout(()=>{},5000)',
      ],
    });
    assert.equal(result.ok, false);
    assert.equal(result.ok ? undefined : result.errorKind, 'timeout');
    assert.equal(await readFile(stdoutPath, 'utf8'), 'timeout stdout');
    assert.equal(await readFile(stderrPath, 'utf8'), 'timeout stderr');
  });

  await withFixture(async ({ workspaceRoot }) => {
    const policy = {
      kind: 'PARTICIPANT_ACTIVITY_AWARE_V1' as const,
      evaluationStartMs: 400,
      stdoutInactivityMs: 900,
      absoluteCapMs: 2_000,
    };
    const job: WorkspaceAgentJobInput = {
      invocationRef: 'solution-active-stdout-before-deadline',
      role: 'solution',
      workspaceRoot,
      prompt: 'short timeout policy test',
    };
    const delayedStdoutScript = 'setTimeout(()=>process.stdout.write("active"),150);setTimeout(()=>process.exit(0),650)';
    const fixedBaseline = await runWorkspaceAgentJob(job, {
      executable: process.execPath,
      timeoutMs: policy.evaluationStartMs,
      buildArgs: () => ['-e', delayedStdoutScript],
    });
    assert.equal(fixedBaseline.ok, false, 'the old fixed cutoff stops this same execution before stdout');
    assert.equal(fixedBaseline.ok ? undefined : fixedBaseline.errorKind, 'timeout');

    const result = await runWorkspaceAgentJob(job, {
      executable: process.execPath,
      buildArgs: () => ['-e', delayedStdoutScript],
    }, policy);

    assert.equal(result.ok, true, 'stdout before the evaluation point must keep Solution alive beyond the old fixed cutoff');
    assert.equal(result.executionTrace.events.some(event => event.type === 'timeout'), false);
  });

  await withFixture(async ({ workspaceRoot }) => {
    const policy = {
      kind: 'PARTICIPANT_ACTIVITY_AWARE_V1' as const,
      evaluationStartMs: 180,
      stdoutInactivityMs: 420,
      absoluteCapMs: 1_500,
    };
    const result = await runWorkspaceAgentJob({
      invocationRef: 'solution-stdout-inactivity',
      role: 'solution',
      workspaceRoot,
      prompt: 'short timeout policy test',
    }, {
      executable: process.execPath,
      buildArgs: () => ['-e', 'setTimeout(()=>{},5000)'],
    }, policy);

    assert.equal(result.ok, false);
    assert.equal(result.ok ? undefined : result.errorKind, 'timeout');
    assert.equal(
      result.executionTrace.events.find(event => event.type === 'timeout')?.detail,
      'PARTICIPANT_STDOUT_INACTIVITY',
    );
  });

  await withFixture(async ({ workspaceRoot }) => {
    const policy = {
      kind: 'PARTICIPANT_ACTIVITY_AWARE_V1' as const,
      evaluationStartMs: 180,
      stdoutInactivityMs: 420,
      absoluteCapMs: 1_500,
    };
    const result = await runWorkspaceAgentJob({
      invocationRef: 'solution-stderr-does-not-refresh',
      role: 'solution',
      workspaceRoot,
      prompt: 'short timeout policy test',
    }, {
      executable: process.execPath,
      buildArgs: () => ['-e', 'setInterval(()=>process.stderr.write("still active\\n"),60)'],
    }, policy);

    assert.equal(result.ok, false);
    assert.equal(result.ok ? undefined : result.errorKind, 'timeout');
    assert.equal(
      result.executionTrace.events.find(event => event.type === 'timeout')?.detail,
      'PARTICIPANT_STDOUT_INACTIVITY',
    );
    assert.equal(result.executionTrace.events.some(event => event.type === 'output_activity' && event.stream === 'stderr'), true);
  });

  await withFixture(async ({ workspaceRoot }) => {
    const policy = {
      kind: 'PARTICIPANT_ACTIVITY_AWARE_V1' as const,
      evaluationStartMs: 180,
      stdoutInactivityMs: 500,
      absoluteCapMs: 1_600,
    };
    const result = await runWorkspaceAgentJob({
      invocationRef: 'solution-absolute-cap',
      role: 'solution',
      workspaceRoot,
      prompt: 'short timeout policy test',
    }, {
      executable: process.execPath,
      buildArgs: () => ['-e', 'setInterval(()=>process.stdout.write("active\\n"),50)'],
    }, policy);

    assert.equal(result.ok, false);
    assert.equal(result.ok ? undefined : result.errorKind, 'timeout');
    assert.equal(
      result.executionTrace.events.find(event => event.type === 'timeout')?.detail,
      'PARTICIPANT_ABSOLUTE_CAP',
    );
  });

  await withFixture(async ({ workspaceRoot }) => {
    const defaultReviewer = await runWorkspaceAgentJob({
      invocationRef: 'reviewer-default-timeout-policy',
      role: 'reviewer',
      workspaceRoot,
      prompt: 'short fixed timeout default test',
    }, {
      executable: process.execPath,
      buildArgs: () => ['-e', 'process.stdout.write("completed")'],
    });
    assert.equal(defaultReviewer.ok, true);
    assert.equal(defaultReviewer.executionTrace.invocation.timeoutMs, PARTICIPANT_ABSOLUTE_TIMEOUT_MS);
    assert.deepEqual(defaultReviewer.executionTrace.invocation.timeoutPolicy, {
      kind: 'PARTICIPANT_ACTIVITY_AWARE_V1',
      evaluationStartMs: 1_800_000,
      stdoutInactivityMs: 600_000,
      absoluteCapMs: 2_700_000,
    });

    const result = await runWorkspaceAgentJob({
      invocationRef: 'reviewer-fixed-timeout',
      role: 'reviewer',
      workspaceRoot,
      prompt: 'short fixed timeout test',
    }, {
      executable: process.execPath,
      timeoutMs: 400,
      buildArgs: () => ['-e', 'setInterval(()=>process.stdout.write("active\\n"),50)'],
    });

    assert.equal(result.ok, false);
    assert.equal(result.ok ? undefined : result.errorKind, 'timeout');
    assert.equal(result.executionTrace.invocation.timeoutMs, 400);
    assert.equal(result.executionTrace.invocation.timeoutPolicy, undefined);
    assert.equal(result.executionTrace.events.find(event => event.type === 'timeout')?.detail, undefined);
  });

  await withFixture(async ({ workspaceRoot }) => {
    const job: WorkspaceAgentJobInput = {
      invocationRef: 'solution-retransmission-fixed-timeout',
      role: 'solution',
      workspaceRoot,
      prompt: 'short fixed retransmission timeout test',
    };
    const result = await runWorkspaceAgentContinuation(job, {
      executable: process.execPath,
      buildArgs: () => [],
      sameThreadContinuation: {
        provider: 'test-provider',
        buildArgs: () => ['-e', 'setInterval(()=>process.stdout.write("active\\n"),50)'],
      },
    }, { provider: 'test-provider', opaqueId: 'thread-000003' }, 400);

    assert.equal(result.ok, false);
    assert.equal(result.ok ? undefined : result.errorKind, 'timeout');
    assert.equal(result.executionTrace.invocation.timeoutMs, 400);
    assert.equal(result.executionTrace.invocation.timeoutPolicy, undefined);
    assert.equal(result.executionTrace.events.find(event => event.type === 'timeout')?.detail, undefined);
  });

  await withFixture(async ({ workspaceRoot, destinationRoot }) => {
    const participant = participantFor({ terminalOutput: validReceipt, artifactBytes: validBytes });
    participant.interpretCompletedOutput = () => ({
      ok: false,
      errorKind: 'invalid_output',
      message: 'provider stream did not contain a terminal receipt',
    });
    const result = await artifactExecution({ workspaceRoot, destinationRoot, participant });
    assert.equal(result.ok, false);
    assert.equal(result.ok ? undefined : result.failure.origin, 'PROVIDER_PROTOCOL');
    const evidence = JSON.parse(await readFile(join(destinationRoot, 'artifact-backed-validation.json'), 'utf8')) as Record<string, unknown>;
    assert.equal(evidence.earliestFailureBoundary, 'PROVIDER_PROTOCOL');
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runArtifactBackedStructuredParticipantExecutionTests()
    .then(() => console.log('artifactBackedStructuredParticipantExecution.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
