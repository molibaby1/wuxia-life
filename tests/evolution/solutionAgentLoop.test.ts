import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  type WorkspaceAgentJobInput,
  type WorkspaceAgentParticipantOptions,
} from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { runSolutionAgent } from '../../scripts/evolution/problemAgnosticSolution/runSolutionAgent';
import { SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS } from '../../scripts/evolution/problemAgnosticSolution/solutionParticipantSkills';
import type { ProblemPackageV1 } from '../../src/evolution/problemPackageContract';

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
    diagnostics?: { initial: string; continuation: string };
    onContinuationBuildArgs?: (job: WorkspaceAgentJobInput) => void;
  },
): WorkspaceAgentParticipantOptions {
  const threadRef = options?.threadRef ?? { provider: 'test-provider', opaqueId: 'thread-000001' };
  const participant: WorkspaceAgentParticipantOptions = {
    executable: process.execPath,
    buildArgs: () => [
      '-e',
      `process.stdout.write(process.argv[1]);${options?.diagnostics === undefined ? '' : ` process.stderr.write(${JSON.stringify(options.diagnostics.initial)})`}`,
      outputs.initial,
    ],
    interpretCompletedOutput: ({ stdout, expectedThreadRef }) => ({
      ok: true as const,
      rawOutput: stdout,
      threadRef: expectedThreadRef ?? threadRef,
    }),
    spawnProcess: options?.spawnProcess,
  };

  if (!options?.omitContinuation) {
    participant.sameThreadContinuation = {
      provider: threadRef.provider,
      buildArgs: job => {
        options?.onContinuationBuildArgs?.(job);
        return [
          '-e',
          `process.stdout.write(process.argv[1]);${options?.diagnostics === undefined ? '' : ` process.stderr.write(${JSON.stringify(options.diagnostics.continuation)})`}`,
          outputs.continuation,
        ];
      },
    };
  }

  return participant;
}

const problemPackage: ProblemPackageV1 = {
  schemaVersion: 'problem-package-v1',
  problemId: 'problem-000001',
  source: {
    runRef: 'cohort-run-000001',
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: 'source/feedback.json',
    improvementHypothesisRef: 'source/hypothesis.json',
  },
  problem: {
    hypothesisId: 'hypothesis-000001',
    statement: 'A generic fresh problem.',
    observedBasis: 'A generic observed basis.',
    feedbackRefs: ['observations[0]'],
    evidenceRefs: ['entry-000001'],
    unknowns: ['A generic unknown.'],
    productSignificance: 'A generic significance.',
  },
  authorityRefs: ['docs/product/auto-evolution-model.md'],
  productSourceFingerprintSha256: 'a'.repeat(64),
  permissions: {
    authoritativeProductWrite: false,
    sandboxWrite: true,
    productExecution: false,
    codeExecution: false,
  },
};

const solutionResult = {
  schemaVersion: 'solution-work-v1',
  status: 'OPTIONS',
  problemId: problemPackage.problemId,
  options: [{
    optionId: 'option-000001',
    proposedChange: 'Change a bounded setting.',
    rationale: 'It is supported by the available evidence.',
    repoRefs: ['src/example.ts'],
    artifactRefs: ['source/observable-payload.json'],
    changeScope: 'configuration',
    expectedPlayerObservableDifference: 'A visible difference.',
    risks: [],
    unknowns: ['A remaining unknown.'],
  }],
  recommendedOptionId: 'option-000001',
  summary: 'A bounded option.',
  repoRefs: ['src/example.ts'],
  artifactRefs: ['source/observable-payload.json'],
};

export async function runSolutionAgentLoopTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'solution-agent-loop-'));
  const workspaceRoot = join(root, 'workspace');
  const artifactRoot = join(root, 'artifacts');
  const canonicalSkillPath = 'skills/repository-grounded-investigation/SKILL.md';
  const canonicalSkillContent = await readFile(join(process.cwd(), canonicalSkillPath), 'utf8');
  const canonicalSkillSha256 = createHash('sha256').update(canonicalSkillContent).digest('hex');
  await mkdir(join(workspaceRoot, 'src'), { recursive: true });
  await mkdir(join(workspaceRoot, 'skills/repository-grounded-investigation'), { recursive: true });
  await mkdir(join(artifactRoot, 'source'), { recursive: true });
  await writeFile(join(workspaceRoot, 'src/example.ts'), 'export const example = true;');
  await writeFile(join(workspaceRoot, canonicalSkillPath), canonicalSkillContent);
  await writeFile(join(artifactRoot, 'source/observable-payload.json'), '{}');
  const packagePath = join(root, 'problem-package.json');
  await writeFile(packagePath, JSON.stringify(problemPackage));

  const capturedStderr = 'successful child diagnostic/tool output\n';
  let deliveredPrompt = '';
  const run = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-000001',
    jobNumber: 3,
    destinationRoot: join(root, 'solution-agent'),
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: input => {
        deliveredPrompt = input.prompt;
        return [
          '-e',
          `process.stdout.write(${JSON.stringify(JSON.stringify(solutionResult))}); process.stderr.write(${JSON.stringify(capturedStderr)})`,
        ];
      },
    },
  });
  assert.equal(run.ok, true);
  assert.equal(run.result?.status, 'OPTIONS');
  assert.match(deliveredPrompt, /Assigned Skills \(working methods only; they do not grant authority\):/i);
  assert.match(deliveredPrompt, /repository-grounded-investigation/);
  assert.match(deliveredPrompt, new RegExp(canonicalSkillSha256));
  assert.match(deliveredPrompt, /own investigation and solution reasoning/i);
  assert.match(deliveredPrompt, /disposable workspace/i);
  assert.match(deliveredPrompt, /zero to three options/i);
  assert.match(deliveredPrompt, /execution permission is separate/i);
  assert.match(deliveredPrompt, /stop broad exploration/i);
  assert.match(deliveredPrompt, /one bounded re-grounding/i);
  assert.match(deliveredPrompt, /time-budget escape hatch/i);
  assert.match(deliveredPrompt, /Reviewer can independently assess/i);
  assert.match(deliveredPrompt, /verify, distinguish, or materially update/i);
  assert.match(deliveredPrompt, /Reference format requirements:/i);
  assert.match(deliveredPrompt, /repoRefs must reference repository-relative regular files/i);
  assert.match(deliveredPrompt, /path:line/i);
  assert.match(deliveredPrompt, /path:start-end/i);
  assert.match(deliveredPrompt, /Do not use # fragments/i);
  assert.match(deliveredPrompt, /artifactRefs must be relative regular-file paths only/i);
  assert.match(deliveredPrompt, /relative file paths/i);
  assert.match(deliveredPrompt, /Do not use line locators, # fragments/i);
  assert.doesNotMatch(deliveredPrompt, /Read the repository and referenced artifacts yourself\./i);
  assert.equal(deliveredPrompt.split('Treat input assumptions as claims to examine, not established causes.').length - 1, 1);
  assert.doesNotMatch(deliveredPrompt, /money|marriage|combat|family crisis/i);
  assert.match(deliveredPrompt, /Structured Final Output Contract V1/);
  assert.match(deliveredPrompt, /exactly one valid JSON object/i);
  assert.match(deliveredPrompt, /SolutionWorkV1/);
  assert.match(deliveredPrompt, /bare JSON only/i);
  assert.match(deliveredPrompt, /Markdown\/code fences/i);
  assert.match(deliveredPrompt, /before or after the JSON object/i);
  assert.match(deliveredPrompt, /reject invalid output/i);
  assert.match(deliveredPrompt, /extract, normalize, or repair/i);
  assert.doesNotMatch(
    deliveredPrompt,
    /Write\/return only the structured SolutionWorkV1 result as the final job result\./i,
  );
  assert.equal(await readFile(join(root, 'solution-agent/raw-output.txt'), 'utf8'), JSON.stringify(solutionResult));
  assert.equal(await readFile(join(root, 'solution-agent/stderr.txt'), 'utf8'), capturedStderr);
  assert.equal(
    await readFile(join(root, 'solution-agent/terminal-attempt-0.txt'), 'utf8'),
    JSON.stringify(solutionResult),
  );
  await assert.rejects(
    () => readFile(join(root, 'solution-agent/terminal-attempt-1.txt'), 'utf8'),
    /ENOENT/,
  );
  const solutionTrace = JSON.parse(await readFile(join(root, 'solution-agent/execution-trace.json'), 'utf8'));
  assert.equal(solutionTrace.schemaVersion, 'participant-execution-trace-v1');
  assert.equal(solutionTrace.terminal.outcome, 'completed');
  assert.equal(solutionTrace.events[0].type, 'process_start');
  assert.equal(solutionTrace.events.at(-1).type, 'participant_terminal_validation');
  assert.doesNotMatch(JSON.stringify(solutionTrace), new RegExp(capturedStderr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const terminalValidations = solutionTrace.events.filter(
    (event: { type: string }) => event.type === 'participant_terminal_validation',
  );
  assert.equal(terminalValidations.length, 1);
  assert.equal(terminalValidations[0].attempt, 0);
  assert.equal(terminalValidations[0].envelopeValid, true);
  assert.equal(terminalValidations[0].schemaValid, true);
  assert.equal(terminalValidations[0].accepted, true);
  assert.deepEqual(JSON.parse(await readFile(join(root, 'solution-agent/result.json'), 'utf8')), solutionResult);
  const invocation = JSON.parse(await readFile(join(root, 'solution-agent/invocation.json'), 'utf8'));
  assert.equal(invocation.schemaVersion, 'solution-agent-invocation-v2');
  assert.equal(invocation.jobNumber, 3);
  assert.deepEqual(invocation.skillAssignments, [{
    identity: 'repository-grounded-investigation',
    version: '1',
    canonicalPath: canonicalSkillPath,
    expectedContentSha256: canonicalSkillSha256,
  }]);
  assert.deepEqual(invocation.deliveredSkills, [{
    identity: 'repository-grounded-investigation',
    version: '1',
    canonicalPath: canonicalSkillPath,
    expectedContentSha256: canonicalSkillSha256,
    contentSha256: canonicalSkillSha256,
  }]);

  const sidecarFailureRoot = join(root, 'sidecar-write-failure-agent');
  await mkdir(sidecarFailureRoot, { recursive: true });
  await mkdir(join(sidecarFailureRoot, 'stderr.txt'));
  const sidecarFailureRun = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-sidecar-write-failure-000001',
    jobNumber: 3,
    destinationRoot: sidecarFailureRoot,
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => [
        '-e',
        `process.stdout.write(${JSON.stringify(JSON.stringify(solutionResult))}); process.stderr.write(${JSON.stringify(capturedStderr)})`,
      ],
    },
  });
  assert.equal(sidecarFailureRun.ok, true);
  if (sidecarFailureRun.ok) assert.deepEqual(sidecarFailureRun.result, solutionResult);
  assert.equal(await readFile(join(sidecarFailureRoot, 'raw-output.txt'), 'utf8'), JSON.stringify(solutionResult));
  assert.deepEqual(JSON.parse(await readFile(join(sidecarFailureRoot, 'result.json'), 'utf8')), solutionResult);
  assert.equal(JSON.parse(await readFile(join(sidecarFailureRoot, 'invocation.json'), 'utf8')).status, 'completed');
  assert.equal(JSON.parse(await readFile(join(sidecarFailureRoot, 'execution-trace.json'), 'utf8')).schemaVersion, 'participant-execution-trace-v1');

  const locatorSolutionResult = {
    ...solutionResult,
    repoRefs: ['src/example.ts:1'],
    options: [{ ...solutionResult.options[0], repoRefs: ['src/example.ts:1-3'] }],
  };
  const locatorRun = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-000001-locator',
    jobNumber: 3,
    destinationRoot: join(root, 'locator-agent'),
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(locatorSolutionResult))})`],
    },
  });
  assert.equal(locatorRun.ok, true);
  if (locatorRun.ok) {
    assert.deepEqual(locatorRun.result.repoRefs, ['src/example.ts:1']);
    assert.deepEqual(locatorRun.result.options[0]?.repoRefs, ['src/example.ts:1-3']);
  }
  const storedLocatorResult = JSON.parse(await readFile(join(root, 'locator-agent/result.json'), 'utf8'));
  assert.deepEqual(storedLocatorResult.repoRefs, ['src/example.ts:1']);
  assert.deepEqual(storedLocatorResult.options[0].repoRefs, ['src/example.ts:1-3']);

  for (const [index, repoRef] of [
    '../outside.ts:1',
    '../outside.ts:1-2',
    '/absolute/path.ts:1',
    'src/example.ts:0',
    'src/example.ts:5-2',
    'src/example.ts#symbol',
  ].entries()) {
    const invalidLocator = await runSolutionAgent({
      problemPackage,
      problemPackagePath: packagePath,
      workspaceRoot,
      artifactRoot,
      workspaceBaselineFingerprintSha256: 'b'.repeat(64),
      invocationRef: `solution-000001-invalid-${index}`,
      jobNumber: 3,
      destinationRoot: join(root, `invalid-locator-${index}`),
      skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
      participant: {
        executable: process.execPath,
        buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify({ ...solutionResult, repoRefs: [repoRef] }))})`],
      },
    });
    assert.equal(invalidLocator.ok, false);
    assert.equal(invalidLocator.ok ? undefined : invalidLocator.errorKind, 'invalid_output');
  }

  const artifactLocator = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-000001-artifact-locator',
    jobNumber: 3,
    destinationRoot: join(root, 'artifact-locator-agent'),
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify({ ...solutionResult, artifactRefs: ['source/observable-payload.json:10'] }))})`],
    },
  });
  assert.equal(artifactLocator.ok, false);
  assert.equal(artifactLocator.ok ? undefined : artifactLocator.errorKind, 'invalid_output');

  const artifactFragment = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-000001-artifact-fragment',
    jobNumber: 3,
    destinationRoot: join(root, 'artifact-fragment-agent'),
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify({ ...solutionResult, artifactRefs: ['source/observable-payload.json#entry-1'] }))})`],
    },
  });
  assert.equal(artifactFragment.ok, false);
  assert.equal(artifactFragment.ok ? undefined : artifactFragment.errorKind, 'invalid_output');

  const invalid = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-000002',
    jobNumber: 3,
    destinationRoot: join(root, 'invalid-agent'),
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', 'process.stdout.write("not-json")'],
    },
  });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.ok ? undefined : invalid.errorKind, 'invalid_output');
  assert.equal(JSON.parse(await readFile(join(root, 'invalid-agent/invocation.json'), 'utf8')).status, 'failed');

  const workspaceWithoutSkill = join(root, 'workspace-without-skill');
  await mkdir(workspaceWithoutSkill, { recursive: true });
  let runtimeCalls = 0;
  const deliveryFailure = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot: workspaceWithoutSkill,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-000003',
    jobNumber: 3,
    destinationRoot: join(root, 'skill-delivery-failure'),
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => {
        runtimeCalls += 1;
        return ['-e', 'process.exit(1)'];
      },
    },
  });
  assert.equal(deliveryFailure.ok, false);
  assert.equal(deliveryFailure.ok ? undefined : deliveryFailure.errorKind, 'process');
  assert.equal(runtimeCalls, 0);
  const deliveryFailureInvocation = JSON.parse(
    await readFile(join(root, 'skill-delivery-failure/invocation.json'), 'utf8'),
  );
  assert.equal(deliveryFailureInvocation.status, 'failed');
  assert.deepEqual(deliveryFailureInvocation.skillAssignments, invocation.skillAssignments);
  assert.deepEqual(deliveryFailureInvocation.deliveredSkills, []);

  const recoveryRoot = join(root, 'recovery-agent');
  const attempt0Raw = `Here is the result:\n${JSON.stringify(solutionResult)}`;
  const attempt1Raw = JSON.stringify(solutionResult);
  const recoveryStderr = {
    initial: 'discarded initial diagnostic',
    continuation: 'accepted continuation diagnostic',
  };
  const recoveryCounter = { count: 0 };
  let continuationPrompt = '';
  const recoveryRun = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-recovery-000001',
    jobNumber: 3,
    destinationRoot: recoveryRoot,
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: createContinuationCapableParticipant(
      { initial: attempt0Raw, continuation: attempt1Raw },
      {
        spawnProcess: countingSpawn(recoveryCounter),
        diagnostics: recoveryStderr,
        onContinuationBuildArgs: job => {
          continuationPrompt = job.prompt;
        },
      },
    ),
  });
  assert.equal(recoveryRun.ok, true);
  assert.equal(recoveryCounter.count, 2);
  assert.equal(await readFile(join(recoveryRoot, 'stderr.txt'), 'utf8'), recoveryStderr.continuation);
  assert.equal(await readFile(join(recoveryRoot, 'raw-output.txt'), 'utf8'), attempt1Raw);
  assert.equal(await readFile(join(recoveryRoot, 'terminal-attempt-0.txt'), 'utf8'), attempt0Raw);
  assert.equal(await readFile(join(recoveryRoot, 'terminal-attempt-1.txt'), 'utf8'), attempt1Raw);
  assert.equal(JSON.parse(await readFile(join(recoveryRoot, 'result.json'), 'utf8')).problemId, problemPackage.problemId);
  assert.match(continuationPrompt, /ENVELOPE_FAILURE/);
  assert.match(continuationPrompt, /Re-emit the same Role result only/i);
  assert.match(continuationPrompt, /SolutionWorkV1/);
  assert.doesNotMatch(continuationPrompt, new RegExp(problemPackage.problem.statement));
  assert.doesNotMatch(continuationPrompt, /Here is the result:/);
  const recoveryTrace = JSON.parse(await readFile(join(recoveryRoot, 'execution-trace.json'), 'utf8'));
  const recoveryValidations = recoveryTrace.events.filter(
    (event: { type: string }) => event.type === 'participant_terminal_validation',
  );
  assert.equal(recoveryValidations.length, 2);
  assert.equal(recoveryValidations[0].attempt, 0);
  assert.equal(recoveryValidations[0].envelopeValid, false);
  assert.equal(recoveryValidations[1].attempt, 1);
  assert.equal(recoveryValidations[1].envelopeValid, true);
  assert.equal(recoveryValidations[1].schemaValid, true);
  assert.equal(recoveryValidations[1].accepted, true);
  assert.equal(
    recoveryTrace.events.filter((event: { type: string }) => event.type === 'participant_envelope_retransmission_requested').length,
    1,
  );
  assert.equal(
    recoveryTrace.events.filter((event: { type: string }) => event.type === 'participant_envelope_retransmission_completed').length,
    1,
  );
  assert.equal(recoveryTrace.events.filter((event: { type: string }) => event.type === 'participant_envelope_retransmission_completed')[0].runtimeOutcome, 'COMPLETED');

  const schemaFailureRoot = join(root, 'schema-failure-agent');
  const schemaFailureCounter = { count: 0 };
  const schemaInvalidPayload = JSON.stringify({
    schemaVersion: 'solution-work-v1',
    status: 'OPTIONS',
    problemId: problemPackage.problemId,
    unknownField: 'not-in-contract',
  });
  const schemaFailureRun = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-schema-failure-000001',
    jobNumber: 3,
    destinationRoot: schemaFailureRoot,
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: createContinuationCapableParticipant(
      { initial: schemaInvalidPayload, continuation: attempt1Raw },
      { spawnProcess: countingSpawn(schemaFailureCounter) },
    ),
  });
  assert.equal(schemaFailureRun.ok, false);
  assert.equal(schemaFailureRun.ok ? undefined : schemaFailureRun.errorKind, 'invalid_output');
  assert.equal(schemaFailureCounter.count, 1);
  await assert.rejects(
    () => readFile(join(schemaFailureRoot, 'terminal-attempt-1.txt'), 'utf8'),
    /ENOENT/,
  );
  const schemaFailureTrace = JSON.parse(await readFile(join(schemaFailureRoot, 'execution-trace.json'), 'utf8'));
  assert.equal(
    schemaFailureTrace.events.some((event: { type: string }) => event.type === 'participant_envelope_retransmission_requested'),
    false,
  );

  const doubleEnvelopeRoot = join(root, 'double-envelope-agent');
  const doubleEnvelopeCounter = { count: 0 };
  const doubleEnvelopeRun = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-double-envelope-000001',
    jobNumber: 3,
    destinationRoot: doubleEnvelopeRoot,
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: createContinuationCapableParticipant(
      { initial: attempt0Raw, continuation: attempt0Raw },
      { spawnProcess: countingSpawn(doubleEnvelopeCounter) },
    ),
  });
  assert.equal(doubleEnvelopeRun.ok, false);
  assert.equal(doubleEnvelopeRun.ok ? undefined : doubleEnvelopeRun.errorKind, 'invalid_output');
  assert.equal(doubleEnvelopeCounter.count, 2);
  await assert.rejects(
    () => readFile(join(doubleEnvelopeRoot, 'terminal-attempt-2.txt'), 'utf8'),
    /ENOENT/,
  );

  const attempt1SchemaInvalidRoot = join(root, 'attempt1-schema-invalid-agent');
  const attempt1SchemaInvalidCounter = { count: 0 };
  const attempt1SchemaInvalidRun = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-attempt1-schema-invalid-000001',
    jobNumber: 3,
    destinationRoot: attempt1SchemaInvalidRoot,
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: createContinuationCapableParticipant(
      { initial: attempt0Raw, continuation: '{"schemaVersion":"wrong-v1"}' },
      { spawnProcess: countingSpawn(attempt1SchemaInvalidCounter) },
    ),
  });
  assert.equal(attempt1SchemaInvalidRun.ok, false);
  assert.equal(attempt1SchemaInvalidRun.ok ? undefined : attempt1SchemaInvalidRun.errorKind, 'invalid_output');
  assert.equal(attempt1SchemaInvalidCounter.count, 2);
  await assert.rejects(
    () => readFile(join(attempt1SchemaInvalidRoot, 'terminal-attempt-2.txt'), 'utf8'),
    /ENOENT/,
  );

  const noCapabilityRoot = join(root, 'no-capability-agent');
  const noCapabilityCounter = { count: 0 };
  const noCapabilityRun = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-no-capability-000001',
    jobNumber: 3,
    destinationRoot: noCapabilityRoot,
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', 'process.stdout.write(process.argv[1]);', attempt0Raw],
      spawnProcess: countingSpawn(noCapabilityCounter),
    },
  });
  assert.equal(noCapabilityRun.ok, false);
  assert.equal(noCapabilityRun.ok ? undefined : noCapabilityRun.errorKind, 'invalid_output');
  assert.equal(noCapabilityCounter.count, 1);
  const noCapabilityTrace = JSON.parse(await readFile(join(noCapabilityRoot, 'execution-trace.json'), 'utf8'));
  assert.equal(
    noCapabilityTrace.events.some((event: { type: string }) => event.type === 'participant_envelope_retransmission_requested'),
    false,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSolutionAgentLoopTests()
    .then(() => console.log('solutionAgentLoop.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
