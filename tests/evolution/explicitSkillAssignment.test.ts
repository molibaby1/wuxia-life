import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runSolutionAgent } from '../../scripts/evolution/problemAgnosticSolution/runSolutionAgent';
import { runSolutionReviewer } from '../../scripts/evolution/problemAgnosticSolution/runSolutionReviewer';
import { loadParticipantSkills } from '../../scripts/evolution/problemAgnosticSolution/solutionParticipantSkills';
import type { ProblemPackageV1 } from '../../src/evolution/problemPackageContract';
import type { SolutionWorkV1 } from '../../src/evolution/solutionWorkContract';

const problemPackage: ProblemPackageV1 = {
  schemaVersion: 'problem-package-v1',
  problemId: 'explicit-skill-assignment-problem',
  source: {
    runRef: 'source-run',
    observablePayloadRef: 'source/observable.json',
    externalFeedbackRef: 'source/feedback.json',
    improvementHypothesisRef: 'source/hypothesis.json',
  },
  problem: {
    hypothesisId: 'hypothesis-000001',
    statement: 'A bounded problem.',
    observedBasis: 'A bounded observation.',
    feedbackRefs: ['observations[0]'],
    evidenceRefs: ['entry-000001'],
    unknowns: ['An unknown.'],
    productSignificance: 'A bounded significance.',
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
  status: 'INSUFFICIENT_EVIDENCE',
  problemId: problemPackage.problemId,
  options: [],
  summary: 'No option is needed for this assignment test.',
  repoRefs: [],
  artifactRefs: [],
};

export async function runExplicitSkillAssignmentTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'explicit-skill-assignment-'));
  const workspaceRoot = join(root, 'workspace');
  const artifactRoot = join(root, 'artifacts');
  await mkdir(workspaceRoot, { recursive: true });
  await mkdir(artifactRoot, { recursive: true });
  const packagePath = join(root, 'problem-package.json');
  await writeFile(packagePath, JSON.stringify(problemPackage));

  let solutionPrompt = '';
  const solution = await runSolutionAgent({
    problemPackage,
    problemPackagePath: packagePath,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'b'.repeat(64),
    invocationRef: 'solution-skill-off',
    jobNumber: 1,
    destinationRoot: join(root, 'solution'),
    skillAssignments: [],
    participant: {
      executable: process.execPath,
      buildArgs: input => {
        solutionPrompt = input.prompt;
        return ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify(solutionWork))})`];
      },
    },
  });
  assert.equal(solution.ok, true);
  assert.doesNotMatch(solutionPrompt, /repository-grounded-investigation/);
  assert.deepEqual(JSON.parse(await readFile(join(root, 'solution/invocation.json'), 'utf8')).skillAssignments, []);

  let reviewerPrompt = '';
  const reviewer = await runSolutionReviewer({
    problemPackage,
    problemPackagePath: packagePath,
    solutionWork,
    workspaceRoot,
    artifactRoot,
    workspaceBaselineFingerprintSha256: 'c'.repeat(64),
    invocationRef: 'reviewer-skill-off',
    jobNumber: 2,
    destinationRoot: join(root, 'reviewer'),
    skillAssignments: [],
    participant: {
      executable: process.execPath,
      buildArgs: input => {
        reviewerPrompt = input.prompt;
        return ['-e', `process.stdout.write(${JSON.stringify(JSON.stringify({
          schemaVersion: 'solution-review-v1',
          problemId: problemPackage.problemId,
          decision: 'REJECT',
          assessment: 'No option was supplied.',
          repoRefs: [],
          artifactRefs: [],
          concerns: [],
        }))})`];
      },
    },
  });
  assert.equal(reviewer.ok, true, reviewer.ok ? undefined : reviewer.message);
  assert.doesNotMatch(reviewerPrompt, /repository-grounded-investigation/);
  assert.deepEqual(JSON.parse(await readFile(join(root, 'reviewer/invocation.json'), 'utf8')).skillAssignments, []);

  const skillPath = 'skills/repository-grounded-investigation/SKILL.md';
  const skillContent = 'bounded repository investigation method';
  await mkdir(join(workspaceRoot, 'skills/repository-grounded-investigation'), { recursive: true });
  await writeFile(join(workspaceRoot, skillPath), skillContent);
  const expectedContentSha256 = createHash('sha256').update(skillContent).digest('hex');
  const loaded = await loadParticipantSkills(workspaceRoot, [{
    identity: 'repository-grounded-investigation',
    version: '1',
    canonicalPath: skillPath,
    expectedContentSha256,
  }]);
  assert.equal(loaded[0]?.contentSha256, expectedContentSha256);
  await assert.rejects(
    () => loadParticipantSkills(workspaceRoot, [{
      identity: 'repository-grounded-investigation',
      version: '1',
      canonicalPath: skillPath,
      expectedContentSha256: '0'.repeat(64),
    }]),
    /content SHA-256 does not match expected provenance/,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExplicitSkillAssignmentTests()
    .then(() => console.log('explicitSkillAssignment.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
