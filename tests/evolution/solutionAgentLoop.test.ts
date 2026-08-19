import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSolutionAgentPrompt, runSolutionAgent } from '../../scripts/evolution/problemAgnosticSolution/runSolutionAgent';
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
  const prompt = buildSolutionAgentPrompt(problemPackage);
  assert.match(prompt, /own investigation and solution reasoning/i);
  assert.match(prompt, /disposable workspace/i);
  assert.match(prompt, /zero to three options/i);
  assert.match(prompt, /execution permission is separate/i);
  assert.match(prompt, /Reference format requirements:/i);
  assert.match(prompt, /repoRefs must reference repository-relative regular files/i);
  assert.match(prompt, /path:line/i);
  assert.match(prompt, /path:start-end/i);
  assert.match(prompt, /Do not use # fragments/i);
  assert.match(prompt, /artifactRefs must be relative regular-file paths only/i);
  assert.match(prompt, /relative file paths/i);
  assert.match(prompt, /Do not use line locators, # fragments/i);
  assert.doesNotMatch(prompt, /money|marriage|combat|family crisis/i);

  const root = await mkdtemp(join(tmpdir(), 'solution-agent-loop-'));
  const workspaceRoot = join(root, 'workspace');
  const artifactRoot = join(root, 'artifacts');
  await mkdir(join(workspaceRoot, 'src'), { recursive: true });
  await mkdir(join(artifactRoot, 'source'), { recursive: true });
  await writeFile(join(workspaceRoot, 'src/example.ts'), 'export const example = true;');
  await writeFile(join(artifactRoot, 'source/observable-payload.json'), '{}');
  const packagePath = join(root, 'problem-package.json');
  await writeFile(packagePath, JSON.stringify(problemPackage));

  const run = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-000001',
    jobNumber: 3,
    destinationRoot: join(root, 'solution-agent'),
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(solutionResult))})`],
    },
  });
  assert.equal(run.ok, true);
  assert.equal(run.result?.status, 'OPTIONS');
  assert.equal(await readFile(join(root, 'solution-agent/raw-output.txt'), 'utf8'), JSON.stringify(solutionResult));
  assert.equal(JSON.parse(await readFile(join(root, 'solution-agent/result.json'), 'utf8')).problemId, problemPackage.problemId);
  assert.equal(JSON.parse(await readFile(join(root, 'solution-agent/invocation.json'), 'utf8')).jobNumber, 3);

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
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', 'process.stdout.write("not-json")'],
    },
  });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.ok ? undefined : invalid.errorKind, 'invalid_output');
  assert.equal(JSON.parse(await readFile(join(root, 'invalid-agent/invocation.json'), 'utf8')).status, 'failed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSolutionAgentLoopTests()
    .then(() => console.log('solutionAgentLoop.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
