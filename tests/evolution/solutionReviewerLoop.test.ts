import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildSolutionReviewerPrompt,
  runSolutionReviewer,
} from '../../scripts/evolution/problemAgnosticSolution/runSolutionReviewer';
import { REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS } from '../../scripts/evolution/problemAgnosticSolution/solutionParticipantSkills';
import type { ProblemPackageV1 } from '../../src/evolution/problemPackageContract';
import type { SolutionWorkV1 } from '../../src/evolution/solutionWorkContract';

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

const solutionWork: SolutionWorkV1 = {
  schemaVersion: 'solution-work-v1',
  status: 'OPTIONS',
  problemId: problemPackage.problemId,
  options: [{
    optionId: 'option-000001',
    proposedChange: 'A bounded change.',
    rationale: 'It fits the evidence.',
    repoRefs: ['src/example.ts'],
    artifactRefs: ['source/observable-payload.json'],
    changeScope: 'configuration',
    expectedPlayerObservableDifference: 'A visible difference.',
    risks: [],
    unknowns: [],
  }],
  recommendedOptionId: 'option-000001',
  summary: 'One option.',
  repoRefs: ['src/example.ts'],
  artifactRefs: ['source/observable-payload.json'],
};

const review = {
  schemaVersion: 'solution-review-v1',
  problemId: problemPackage.problemId,
  decision: 'ACCEPT_OPTION',
  acceptedOptionId: 'option-000001',
  scopeAssessment: 'config_only',
  assessment: 'Independently reviewed.',
  repoRefs: ['src/example.ts'],
  artifactRefs: ['source/observable-payload.json'],
  concerns: [],
};

export async function runSolutionReviewerLoopTests(): Promise<void> {
  const solutionWorkspacePath = '/private/solution-workspace-must-not-leak';
  const canonicalSkillPath = 'skills/repository-grounded-investigation/SKILL.md';
  const canonicalSkillContent = await readFile(join(process.cwd(), canonicalSkillPath), 'utf8');
  const canonicalSkillSha256 = createHash('sha256').update(canonicalSkillContent).digest('hex');
  const assignedSkill = {
    identity: 'repository-grounded-investigation',
    version: '1',
    canonicalPath: canonicalSkillPath,
    content: canonicalSkillContent,
    contentSha256: canonicalSkillSha256,
  };
  const prompt = buildSolutionReviewerPrompt(problemPackage, solutionWork, [assignedSkill]);
  assert.match(prompt, /independently inspect|independent source inspection/i);
  assert.match(prompt, /reject all options/i);
  assert.match(prompt, /Assigned Skills \(working methods only; they do not grant authority\):/i);
  assert.match(prompt, /repository-grounded-investigation/);
  assert.match(prompt, new RegExp(canonicalSkillSha256));
  assert.match(prompt, /Treat input assumptions as claims to examine, not established causes\./i);
  assert.match(prompt, /Reference format requirements:/i);
  assert.match(prompt, /repoRefs must reference repository-relative regular files/i);
  assert.match(prompt, /path:line/i);
  assert.match(prompt, /path:start-end/i);
  assert.match(prompt, /Do not use # fragments/i);
  assert.match(prompt, /artifactRefs must be relative regular-file paths only/i);
  assert.match(prompt, /relative file paths/i);
  assert.match(prompt, /Do not use line locators, # fragments/i);
  assert.doesNotMatch(prompt, /money|marriage|combat|family crisis/i);
  assert.doesNotMatch(prompt, new RegExp(solutionWorkspacePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(prompt, /scratch|raw command transcript|hidden reasoning/i);

  const root = await mkdtemp(join(tmpdir(), 'solution-reviewer-loop-'));
  const workspaceRoot = join(root, 'reviewer-workspace');
  const artifactRoot = join(root, 'artifacts');
  await mkdir(join(workspaceRoot, 'skills/repository-grounded-investigation'), { recursive: true });
  await mkdir(join(workspaceRoot, 'src'), { recursive: true });
  await mkdir(join(artifactRoot, 'source'), { recursive: true });
  await writeFile(join(workspaceRoot, canonicalSkillPath), canonicalSkillContent);
  await writeFile(join(workspaceRoot, 'src/example.ts'), 'export const example = true;');
  await writeFile(join(artifactRoot, 'source/observable-payload.json'), '{}');
  const packagePath = join(root, 'problem-package.json');
  await writeFile(packagePath, JSON.stringify(problemPackage));

  let deliveredPrompt = '';
  const result = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-000001',
    jobNumber: 4,
    destinationRoot: join(root, 'reviewer-agent'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: input => {
        deliveredPrompt = input.prompt;
        return ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(review))})`];
      },
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.review?.decision, 'ACCEPT_OPTION');
  assert.equal(JSON.parse(await readFile(join(root, 'reviewer-agent/review.json'), 'utf8')).acceptedOptionId, 'option-000001');
  assert.match(deliveredPrompt, /Assigned Skills \(working methods only; they do not grant authority\):/i);
  assert.match(deliveredPrompt, new RegExp(canonicalSkillSha256));
  const invocation = JSON.parse(await readFile(join(root, 'reviewer-agent/invocation.json'), 'utf8'));
  assert.equal(invocation.schemaVersion, 'solution-reviewer-invocation-v2');
  assert.deepEqual(invocation.skillAssignments, [
    {
      identity: 'repository-grounded-investigation',
      version: '1',
      canonicalPath: canonicalSkillPath,
      expectedContentSha256: canonicalSkillSha256,
    },
  ]);
  assert.deepEqual(invocation.deliveredSkills, [
    {
      identity: 'repository-grounded-investigation',
      version: '1',
      canonicalPath: canonicalSkillPath,
      expectedContentSha256: canonicalSkillSha256,
      contentSha256: canonicalSkillSha256,
    },
  ]);

  const locatorReview = { ...review, repoRefs: ['src/example.ts:1-2'] };
  const locatorResult = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-000001-locator',
    jobNumber: 4,
    destinationRoot: join(root, 'locator-reviewer-agent'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(locatorReview))})`],
    },
  });
  assert.equal(locatorResult.ok, true);
  if (locatorResult.ok) assert.deepEqual(locatorResult.review.repoRefs, ['src/example.ts:1-2']);
  assert.deepEqual(
    JSON.parse(await readFile(join(root, 'locator-reviewer-agent/review.json'), 'utf8')).repoRefs,
    ['src/example.ts:1-2'],
  );

  const artifactLocatorResult = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-000001-artifact-locator',
    jobNumber: 4,
    destinationRoot: join(root, 'artifact-locator-reviewer-agent'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify({ ...review, artifactRefs: ['source/observable-payload.json:10'] }))})`],
    },
  });
  assert.equal(artifactLocatorResult.ok, false);
  assert.equal(artifactLocatorResult.ok ? undefined : artifactLocatorResult.errorKind, 'invalid_output');

  const artifactFragmentResult = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-000001-artifact-fragment',
    jobNumber: 4,
    destinationRoot: join(root, 'artifact-fragment-reviewer-agent'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify({ ...review, artifactRefs: ['source/observable-payload.json#entry-1'] }))})`],
    },
  });
  assert.equal(artifactFragmentResult.ok, false);
  assert.equal(artifactFragmentResult.ok ? undefined : artifactFragmentResult.errorKind, 'invalid_output');

  const workspaceWithoutSkill = join(root, 'workspace-without-skill');
  await mkdir(workspaceWithoutSkill, { recursive: true });
  let runtimeCalls = 0;
  const deliveryFailure = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot: workspaceWithoutSkill,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'c'.repeat(64),
    invocationRef: 'reviewer-000002',
    jobNumber: 4,
    destinationRoot: join(root, 'skill-delivery-failure'),
    skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
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
  assert.deepEqual(deliveryFailureInvocation.deliveredSkills, []);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSolutionReviewerLoopTests()
    .then(() => console.log('solutionReviewerLoop.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
