import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runLocalEvidenceOnlyParticipant } from '../../scripts/evolution/localEvidenceOnlyParticipant';
import { runSolutionReviewer } from '../../scripts/evolution/problemAgnosticSolution/runSolutionReviewer';
import type { ProblemPackageV1 } from '../../src/evolution/problemPackageContract';
import type { SolutionReviewV1 } from '../../src/evolution/solutionReviewContract';
import type { SolutionWorkV1 } from '../../src/evolution/solutionWorkContract';

const problemPackage: ProblemPackageV1 = {
  schemaVersion: 'problem-package-v1',
  problemId: 'problem-observability-isolation',
  source: {
    runRef: 'source-run-000001',
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: 'source/feedback.json',
    improvementHypothesisRef: 'source/hypothesis.json',
  },
  problem: {
    hypothesisId: 'hypothesis-000001',
    statement: 'bounded problem',
    observedBasis: 'bounded evidence',
    feedbackRefs: [],
    evidenceRefs: [],
    unknowns: [],
    productSignificance: 'bounded significance',
  },
  authorityRefs: [],
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
    proposedChange: 'bounded change',
    rationale: 'bounded rationale',
    repoRefs: ['src/example.ts'],
    artifactRefs: ['source/observable-payload.json'],
    changeScope: 'configuration',
    expectedPlayerObservableDifference: 'bounded difference',
    risks: [],
    unknowns: [],
  }],
  recommendedOptionId: 'option-000001',
  summary: 'bounded solution',
  repoRefs: ['src/example.ts'],
  artifactRefs: ['source/observable-payload.json'],
};

const review: SolutionReviewV1 = {
  schemaVersion: 'solution-review-v1',
  problemId: problemPackage.problemId,
  decision: 'ACCEPT_OPTION',
  acceptedOptionId: 'option-000001',
  scopeAssessment: 'config_only',
  assessment: 'accepted',
  repoRefs: ['src/example.ts'],
  artifactRefs: ['source/observable-payload.json'],
  concerns: [],
};

async function run(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-observability-isolation-'));
  const workspaceRoot = join(root, 'workspace');
  await mkdir(join(workspaceRoot, 'input'), { recursive: true });
  await writeFile(join(workspaceRoot, 'input/value.txt'), 'input\n');

  const localObservabilityRoot = join(root, 'local-observability');
  await mkdir(localObservabilityRoot, { recursive: true });
  await mkdir(join(localObservabilityRoot, 'participant-prompt.txt'));
  const local = await runLocalEvidenceOnlyParticipant({
    invocationRef: 'feedback-invocation-000001',
    role: 'feedback',
    workspaceRoot,
    prompt: 'return observable result',
    observabilityRoot: localObservabilityRoot,
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', 'process.stdout.write("ok")'],
    },
  });
  assert.deepEqual(local, { ok: true, rawParticipantResponse: 'ok', stderr: '' });

  const artifactRoot = join(root, 'artifacts');
  await mkdir(join(artifactRoot, 'source'), { recursive: true });
  await writeFile(join(artifactRoot, 'source/observable-payload.json'), '{}\n');
  await writeFile(join(artifactRoot, 'source/feedback.json'), '{}\n');
  await writeFile(join(artifactRoot, 'source/hypothesis.json'), '{}\n');
  await mkdir(join(workspaceRoot, 'src'), { recursive: true });
  await writeFile(join(workspaceRoot, 'src/example.ts'), 'export const example = true;\n');
  const problemPackagePath = join(root, 'problem-package.json');
  await writeFile(problemPackagePath, JSON.stringify(problemPackage));
  const reviewerRoot = join(root, 'reviewer-agent');
  await mkdir(reviewerRoot, { recursive: true });
  await mkdir(join(reviewerRoot, 'participant-prompt.txt'));
  const reviewer = await runSolutionReviewer({
    problemPackage,
    problemPackagePath,
    solutionWork,
    workspaceRoot,
    repositoryRoot: workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'reviewer-invocation-000001',
    jobNumber: 1,
    destinationRoot: reviewerRoot,
    skillAssignments: [],
    participant: {
      executable: process.execPath,
      buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(review))})`],
    },
  });
  assert.equal(reviewer.ok, true);
  assert.equal(reviewer.review.decision, 'ACCEPT_OPTION');
}

run()
  .then(() => console.log('observabilitySemanticIsolation.test.ts: ok'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
