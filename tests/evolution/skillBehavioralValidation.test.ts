import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  runSkillBehavioralValidation,
  type SkillBehavioralValidationDependencies,
} from '../../scripts/evolution/problemAgnosticSolution/runSkillBehavioralValidation';
import type { ProblemPackageV1 } from '../../src/evolution/problemPackageContract';
import type { SolutionAgentRunResult } from '../../scripts/evolution/problemAgnosticSolution/runSolutionAgent';
import type { SolutionReviewerRunResult } from '../../scripts/evolution/problemAgnosticSolution/runSolutionReviewer';
import type { WorkspaceAgentParticipantOptions } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';

const problemPackage: ProblemPackageV1 = {
  schemaVersion: 'problem-package-v1',
  problemId: 'skill-behavioral-problem',
  source: {
    runRef: 'fresh-run-000001',
    observablePayloadRef: 'source/observable.json',
    externalFeedbackRef: 'source/feedback.json',
    improvementHypothesisRef: 'source/hypothesis.json',
  },
  problem: {
    hypothesisId: 'hypothesis-000001',
    statement: 'A fixed problem for paired comparison.',
    observedBasis: 'A fixed player-observable basis.',
    feedbackRefs: ['observations[0]'],
    evidenceRefs: ['entry-000001'],
    unknowns: ['Cause remains unknown.'],
    productSignificance: 'The fixed problem is useful for bounded validation.',
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
  schemaVersion: 'solution-work-v1' as const,
  status: 'OPTIONS' as const,
  problemId: problemPackage.problemId,
  options: [{
    optionId: 'option-000001',
    proposedChange: 'A bounded option.',
    rationale: 'It is grounded in the supplied package.',
    repoRefs: [],
    artifactRefs: [],
    changeScope: 'configuration' as const,
    expectedPlayerObservableDifference: 'A bounded player-visible difference.',
    risks: [],
    unknowns: [],
  }],
  recommendedOptionId: 'option-000001',
  summary: 'One bounded option.',
  repoRefs: [],
  artifactRefs: [],
};

const reviewerResult = {
  schemaVersion: 'solution-review-v1' as const,
  problemId: problemPackage.problemId,
  decision: 'ACCEPT_NO_ACTION' as const,
  assessment: 'The paired test result is reviewable.',
  repoRefs: [],
  artifactRefs: [],
  concerns: [],
};

const participant: WorkspaceAgentParticipantOptions = {
  executable: 'injected-only',
  buildArgs: () => [],
  model: 'fixed-model',
  reasoningEffort: 'fixed-reasoning',
  timeoutMs: 1000,
};

export async function runSkillBehavioralValidationTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'skill-behavioral-validation-'));
  const repositoryRoot = join(root, 'repository');
  const experimentRoot = join(root, 'experiment');
  await mkdir(join(repositoryRoot, 'src'), { recursive: true });
  await mkdir(join(repositoryRoot, 'skills/repository-grounded-investigation'), { recursive: true });
  await writeFile(join(repositoryRoot, 'src/example.ts'), 'export const example = true;');
  const skillContent = 'bounded repository investigation method';
  const skillPath = 'skills/repository-grounded-investigation/SKILL.md';
  await writeFile(join(repositoryRoot, skillPath), skillContent);
  const packagePath = join(root, 'problem-package.json');
  await writeFile(packagePath, JSON.stringify(problemPackage));
  const skillAssignment = {
    identity: 'repository-grounded-investigation',
    version: '1',
    canonicalPath: skillPath,
    expectedContentSha256: createHash('sha256').update(skillContent).digest('hex'),
  };

  const solutionInputs: Array<{ condition: string; workspaceRoot: string; packageSha: string; skillCount: number }> = [];
  const reviewerInputs: Array<{ condition: string; workspaceRoot: string; solutionWork: unknown; skillCount: number }> = [];
  const dependencies: SkillBehavioralValidationDependencies = {
    runSolutionAgent: async input => {
      solutionInputs.push({
        condition: input.skillAssignments.length === 0 ? 'off' : 'on',
        workspaceRoot: input.workspaceRoot,
        packageSha: await readFile(input.problemPackagePath, 'utf8'),
        skillCount: input.skillAssignments.length,
      });
      return {
        ok: true,
        result: solutionResult,
        invocationPath: join(input.destinationRoot, 'invocation.json'),
        rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
        resultPath: join(input.destinationRoot, 'result.json'),
      } satisfies SolutionAgentRunResult;
    },
    runSolutionReviewer: async input => {
      reviewerInputs.push({
        condition: input.skillAssignments.length === 0 ? 'off' : 'on',
        workspaceRoot: input.workspaceRoot,
        solutionWork: input.solutionWork,
        skillCount: input.skillAssignments.length,
      });
      return {
        ok: true,
        review: reviewerResult,
        invocationPath: join(input.destinationRoot, 'invocation.json'),
        rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
        reviewPath: join(input.destinationRoot, 'review.json'),
      } satisfies SolutionReviewerRunResult;
    },
  };

  const result = await runSkillBehavioralValidation({
    repositoryRoot,
    experimentRoot,
    problemPackage,
    problemPackagePath: packagePath,
    sourceRunRef: 'fresh-run-000001',
    sourceExperimentRootHash: 'source-root-hash',
    sourceFingerprintSha256: 'source-fingerprint',
    participant,
    solutionSkillAssignments: { off: [], on: [skillAssignment] },
    reviewerSkillAssignments: { off: [], on: [skillAssignment] },
    dependencies,
  });

  assert.equal(result.status, 'PROTOCOL_VALID');
  assert.equal(result.actualParticipantJobs, 4);
  assert.equal(result.retryCount, 0);
  assert.equal(result.configGameplayExecutionCount, 0);
  assert.deepEqual(solutionInputs.map(input => input.condition), ['off', 'on']);
  assert.deepEqual(reviewerInputs.map(input => input.condition), ['off', 'on']);
  assert.equal(solutionInputs[0]?.packageSha, solutionInputs[1]?.packageSha);
  assert.notEqual(solutionInputs[0]?.workspaceRoot, solutionInputs[1]?.workspaceRoot);
  assert.notEqual(reviewerInputs[0]?.workspaceRoot, reviewerInputs[1]?.workspaceRoot);
  assert.deepEqual(reviewerInputs[0]?.solutionWork, solutionResult);
  assert.deepEqual(reviewerInputs[1]?.solutionWork, solutionResult);
  assert.equal(result.solution.off.workspaceBaselineFingerprintSha256, result.solution.on.workspaceBaselineFingerprintSha256);
  assert.equal(result.reviewer?.off.workspaceBaselineFingerprintSha256, result.reviewer?.on.workspaceBaselineFingerprintSha256);
  assert.equal(await readFile(join(experimentRoot, 'problem-package.json'), 'utf8'), await readFile(packagePath, 'utf8'));

  let reviewerCalls = 0;
  const stopped = await runSkillBehavioralValidation({
    repositoryRoot,
    experimentRoot: join(root, 'stopped-experiment'),
    problemPackage,
    problemPackagePath: packagePath,
    sourceRunRef: 'fresh-run-000001',
    sourceExperimentRootHash: 'source-root-hash',
    sourceFingerprintSha256: 'source-fingerprint',
    participant,
    solutionSkillAssignments: { off: [], on: [skillAssignment] },
    reviewerSkillAssignments: { off: [], on: [skillAssignment] },
    dependencies: {
      runSolutionAgent: async input => ({
        ok: true,
        result: input.skillAssignments.length === 0
          ? { ...solutionResult, status: 'INSUFFICIENT_EVIDENCE', options: [], recommendedOptionId: undefined }
          : solutionResult,
        invocationPath: join(input.destinationRoot, 'invocation.json'),
        rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
        resultPath: join(input.destinationRoot, 'result.json'),
      } satisfies SolutionAgentRunResult),
      runSolutionReviewer: async () => {
        reviewerCalls += 1;
        throw new Error('Reviewer must not run when Skill-off Solution is not OPTIONS');
      },
    },
  });
  assert.equal(stopped.status, 'PROTOCOL_STOPPED');
  assert.equal(stopped.actualParticipantJobs, 2);
  assert.equal(stopped.reviewer, null);
  assert.equal(reviewerCalls, 0);
  assert.match(stopped.stopReason ?? '', /Skill-off Solution did not produce a valid OPTIONS stimulus/);

  const provenanceStopRoot = await mkdtemp(join(tmpdir(), 'skill-behavioral-provenance-stop-'));
  const provenanceRepositoryRoot = join(provenanceStopRoot, 'repository');
  await mkdir(join(provenanceRepositoryRoot, 'src'), { recursive: true });
  await writeFile(join(provenanceRepositoryRoot, 'src/example.ts'), 'export const example = true;');
  const provenanceStopped = await runSkillBehavioralValidation({
    repositoryRoot: provenanceRepositoryRoot,
    experimentRoot: join(provenanceStopRoot, 'experiment'),
    problemPackage,
    problemPackagePath: packagePath,
    sourceRunRef: 'fresh-run-000001',
    sourceExperimentRootHash: 'source-root-hash',
    sourceFingerprintSha256: 'source-fingerprint',
    participant,
    solutionSkillAssignments: { off: [], on: [skillAssignment] },
    reviewerSkillAssignments: { off: [], on: [skillAssignment] },
    dependencies: {
      runSolutionAgent: async input => {
        await writeFile(join(provenanceRepositoryRoot, 'src/unauthorized.ts'), 'export const unauthorized = true;');
        return {
          ok: true,
          result: solutionResult,
          invocationPath: join(input.destinationRoot, 'invocation.json'),
          rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
          resultPath: join(input.destinationRoot, 'result.json'),
        } satisfies SolutionAgentRunResult;
      },
    },
  });
  assert.equal(provenanceStopped.status, 'PROTOCOL_STOPPED');
  assert.equal(provenanceStopped.actualParticipantJobs, 1);
  assert.deepEqual(provenanceStopped.solution, {});
  assert.equal(provenanceStopped.reviewer, null);
  assert.match(provenanceStopped.stopReason ?? '', /authoritative repository fingerprint changed/);

  const reviewerFailure = await runSkillBehavioralValidation({
    repositoryRoot,
    experimentRoot: join(root, 'reviewer-failure-experiment'),
    problemPackage,
    problemPackagePath: packagePath,
    sourceRunRef: 'fresh-run-000001',
    sourceExperimentRootHash: 'source-root-hash',
    sourceFingerprintSha256: 'source-fingerprint',
    participant,
    solutionSkillAssignments: { off: [], on: [skillAssignment] },
    reviewerSkillAssignments: { off: [], on: [skillAssignment] },
    dependencies: {
      runSolutionAgent: async input => ({
        ok: true,
        result: solutionResult,
        invocationPath: join(input.destinationRoot, 'invocation.json'),
        rawOutputPath: join(input.destinationRoot, 'raw-output.txt'),
        resultPath: join(input.destinationRoot, 'result.json'),
      } satisfies SolutionAgentRunResult),
      runSolutionReviewer: async () => {
        throw new Error('reviewer host failure');
      },
    },
  });
  assert.equal(reviewerFailure.status, 'PROTOCOL_STOPPED');
  assert.equal(reviewerFailure.actualParticipantJobs, 3);
  assert.deepEqual(Object.keys(reviewerFailure.solution).sort(), ['off', 'on']);
  assert.deepEqual(reviewerFailure.reviewer, {});
  assert.match(reviewerFailure.stopReason ?? '', /reviewer host failure/);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSkillBehavioralValidationTests()
    .then(() => console.log('skillBehavioralValidation.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
