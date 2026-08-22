import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runSolutionAgent } from '../../scripts/evolution/problemAgnosticSolution/runSolutionAgent';
import { SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS } from '../../scripts/evolution/problemAgnosticSolution/solutionParticipantSkills';
import type { ProblemPackageV1 } from '../../src/evolution/problemPackageContract';

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
        return ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(solutionResult))})`];
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
  assert.equal(await readFile(join(root, 'solution-agent/raw-output.txt'), 'utf8'), JSON.stringify(solutionResult));
  const solutionTrace = JSON.parse(await readFile(join(root, 'solution-agent/execution-trace.json'), 'utf8'));
  assert.equal(solutionTrace.schemaVersion, 'participant-execution-trace-v1');
  assert.equal(solutionTrace.terminal.outcome, 'completed');
  assert.equal(solutionTrace.events[0].type, 'process_start');
  assert.equal(solutionTrace.events.at(-1).type, 'process_close');
  assert.equal(JSON.parse(await readFile(join(root, 'solution-agent/result.json'), 'utf8')).problemId, problemPackage.problemId);
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
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSolutionAgentLoopTests()
    .then(() => console.log('solutionAgentLoop.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
