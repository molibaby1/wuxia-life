import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildHumanReviewPackage } from '../../scripts/evolution/problemAgnosticSolution/buildHumanReviewPackage';
import type { SolutionDecisionV1 } from '../../src/evolution/solutionDecisionContract';

const decision: SolutionDecisionV1 = {
  schemaVersion: 'solution-decision-v1',
  problemId: 'problem-000001',
  route: 'SKIP',
  reasonCode: 'NO_PROPOSAL',
  inputs: {
    solutionStatus: 'NO_PROPOSAL',
    reviewerDecision: null,
    solutionScope: null,
    reviewScope: null,
    permissions: {
      authoritativeProductWrite: false,
      sandboxWrite: true,
      productExecution: false,
      codeExecution: false,
    },
    budget: { actualParticipantJobs: 2, maxParticipantJobs: 4, retryCount: 0 },
  },
};

export async function runProblemAgnosticHumanReviewTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'problem-agnostic-human-review-'));
  const destinationPath = join(root, 'human-review-package.md');
  await buildHumanReviewPackage({
    destinationPath,
    sourceRunRef: 'cohort-run-000001',
    sourceRunHash: 'source-hash',
    feedbackInvocationRef: 'feedback-000001',
    hypothesisInvocationRef: 'hypothesis-000001',
    selectedHypothesis: null,
    problemPackageSha256: 'package-hash',
    solutionWorkspaceBaselineFingerprintSha256: 'solution-baseline',
    reviewerWorkspaceBaselineFingerprintSha256: 'reviewer-baseline',
    solutionInvocationRef: null,
    solutionResult: null,
    reviewerInvocationRef: null,
    reviewerResult: null,
    decision,
    actualParticipantJobs: 2,
    architectureAudit: {
      newActivePathContainsDomainBranch: false,
      oldHypothesisInvestigationInvoked: false,
      oldModificationWorkInvoked: false,
      authoritativeRepoChangedByAgentJobs: false,
      solutionReviewerBaselineFingerprintsMatch: true,
      reviewerDerivedFromSolutionWorkspace: false,
      configGameplayExecutionPerformed: false,
    },
  });
  const report = await readFile(destinationPath, 'utf8');
  assert.match(report, /cohort-run-000001/);
  assert.match(report, /NO_PROBLEM_FORMED|NO_PROPOSAL/);
  assert.match(report, /new active path contains domain branch = false/);
  assert.match(report, /ORCHESTRATION_AGNOSTIC \/ ORCHESTRATION_NOT_AGNOSTIC/);
  assert.match(report, /AGENT_OWNS_REASONING \/ AGENT_DOES_NOT_OWN_REASONING/);
  assert.match(report, /INDEPENDENT_REVIEW_AND_BOUNDARY \/ INDEPENDENT_REVIEW_OR_BOUNDARY_FAILED/);
  assert.doesNotMatch(report, /Human outcome:|Human decision:.*ORCHESTRATION_AGNOSTIC/);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runProblemAgnosticHumanReviewTests()
    .then(() => console.log('problemAgnosticHumanReview.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
