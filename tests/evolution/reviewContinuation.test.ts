import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  runReviewContinuation,
  type ReviewContinuationDependencies,
} from '../../scripts/evolution/problemAgnosticSolution/runReviewContinuation';
import { runCandidateReviewContinuation } from '../../scripts/evolution/runCandidateReviewContinuation';
import {
  prepareAgentWorkspace,
  captureAuthoritativeFingerprint,
} from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import {
  type RunSolutionRevisionInput,
  type SolutionAgentRunResult,
} from '../../scripts/evolution/problemAgnosticSolution/runSolutionAgent';
import {
  type RunSolutionReReviewerInput,
  type SolutionReviewerRunResult,
} from '../../scripts/evolution/problemAgnosticSolution/runSolutionReviewer';
import type { RetainHumanFollowupWorkItemInput, RetainedHumanFollowupWorkItem } from '../../scripts/evolution/humanFollowup/retainHumanFollowupWorkItem';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';
import { validateProblemPackage, type ProblemPackageV1 } from '../../src/evolution/problemPackageContract';
import { validateSolutionDecision, type SolutionDecisionV1 } from '../../src/evolution/solutionDecisionContract';
import { validateSolutionReview, type SolutionReviewV1 } from '../../src/evolution/solutionReviewContract';
import { validateSolutionWork, type SolutionWorkV1 } from '../../src/evolution/solutionWorkContract';

const SOURCE_RUN_REF = 'cohort-run-000001';
const PROBLEM_ID = 'problem-000001';
const SOURCE_ARTIFACTS = [
  'source/observable-payload.json',
  'feedback-runs/cohort-run-000001/feedback.json',
  'hypothesis-runs/cohort-run-000001/hypotheses.json',
];

function baseProblemPackage(problemId = PROBLEM_ID): ProblemPackageV1 {
  return validateProblemPackage({
    schemaVersion: 'problem-package-v1',
    problemId,
    source: {
      runRef: SOURCE_RUN_REF,
      observablePayloadRef: SOURCE_ARTIFACTS[0],
      externalFeedbackRef: SOURCE_ARTIFACTS[1],
      improvementHypothesisRef: SOURCE_ARTIFACTS[2],
    },
    problem: {
      hypothesisId: 'hypothesis-000001',
      statement: 'A bounded observed problem.',
      observedBasis: 'Observed in the fixed source.',
      feedbackRefs: ['overallImpression'],
      evidenceRefs: ['entry-000001'],
      unknowns: ['A bounded unknown.'],
      productSignificance: 'A bounded significance.',
    },
    authorityRefs: [],
    productSourceFingerprintSha256: 'a'.repeat(64),
    permissions: {
      authoritativeProductWrite: false,
      sandboxWrite: true,
      productExecution: false,
      codeExecution: false,
    },
  });
}

function solutionWork(status: SolutionWorkV1['status']): SolutionWorkV1 {
  if (status !== 'OPTIONS') {
    return validateSolutionWork({
      schemaVersion: 'solution-work-v1',
      status,
      problemId: PROBLEM_ID,
      options: [],
      summary: `${status} result.`,
      repoRefs: [],
      artifactRefs: [],
    });
  }
  return validateSolutionWork({
    schemaVersion: 'solution-work-v1',
    status,
    problemId: PROBLEM_ID,
    options: [{
      optionId: 'option-000001',
      proposedChange: 'Make one bounded configuration change.',
      rationale: 'The fixed evidence supports this option.',
      repoRefs: [],
      artifactRefs: [],
      changeScope: 'configuration',
      expectedPlayerObservableDifference: 'The bounded behavior becomes available.',
      risks: [],
      unknowns: [],
    }],
    recommendedOptionId: 'option-000001',
    summary: 'One bounded option.',
    repoRefs: [],
    artifactRefs: [],
  });
}

function baseReview(decision: SolutionReviewV1['decision'] = 'REQUEST_MORE_WORK'): SolutionReviewV1 {
  if (decision === 'ACCEPT_OPTION') {
    return validateSolutionReview({
      schemaVersion: 'solution-review-v1',
      problemId: PROBLEM_ID,
      decision,
      acceptedOptionId: 'option-000001',
      scopeAssessment: 'config_only',
      assessment: 'The bounded option is acceptable.',
      repoRefs: [],
      artifactRefs: [],
      concerns: [],
    });
  }
  return validateSolutionReview({
    schemaVersion: 'solution-review-v1',
    problemId: PROBLEM_ID,
    decision,
    assessment: 'One bounded follow-up is required.',
    repoRefs: [],
    artifactRefs: [],
    concerns: ['Confirm the bounded configuration path.'],
  });
}

function moreWorkDecision(): SolutionDecisionV1 {
  return validateSolutionDecision({
    schemaVersion: 'solution-decision-v1',
    problemId: PROBLEM_ID,
    route: 'DEFER_MORE_WORK_REQUESTED',
    reasonCode: 'REVIEW_REQUEST_MORE_WORK',
    inputs: {
      solutionStatus: 'OPTIONS',
      reviewerDecision: 'REQUEST_MORE_WORK',
      solutionScope: 'configuration',
      reviewScope: 'config_only',
      permissions: {
        authoritativeProductWrite: false,
        sandboxWrite: true,
        productExecution: false,
        codeExecution: false,
      },
      budget: { actualParticipantJobs: 4, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${canonicalJson(value)}\n`);
}

async function createFixture(): Promise<{
  root: string;
  repositoryRoot: string;
  roundRoot: string;
  problemPackage: ProblemPackageV1;
  problemPackagePath: string;
  baseSolution: SolutionWorkV1;
  baseReview: SolutionReviewV1;
  baseDecision: SolutionDecisionV1;
  baselineFingerprint: string;
  authoritativeFingerprint: string;
  sourceFingerprintSha256: string;
}> {
  const root = await mkdtemp(join(tmpdir(), 'review-continuation-'));
  const repositoryRoot = join(root, 'repository');
  const roundRoot = join(root, 'round-1');
  await mkdir(join(repositoryRoot, 'src'), { recursive: true });
  await writeFile(join(repositoryRoot, 'src/runtime.ts'), 'export const runtime = true;\n');
  for (const artifact of SOURCE_ARTIFACTS) await writeJson(join(roundRoot, artifact), { artifact });

  const problemPackage = baseProblemPackage();
  const problemPackagePath = join(roundRoot, 'problem-package.json');
  const baseSolution = solutionWork('OPTIONS');
  const baseReviewResult = baseReview();
  const baseDecision = moreWorkDecision();
  const sourceFingerprintPath = join(roundRoot, 'game-runs', SOURCE_RUN_REF, 'provenance/source-fingerprint.json');
  const sourceFingerprintValue = {
    schemaVersion: 'phase0-source-fingerprint-v1',
    headSha: 'fixed-source-head',
    branch: 'fixed-source-branch',
    worktreeEntries: [],
  };
  await writeJson(problemPackagePath, problemPackage);
  await writeJson(join(roundRoot, 'solution-agent/result.json'), baseSolution);
  await writeJson(join(roundRoot, 'reviewer-agent/review.json'), baseReviewResult);
  await writeJson(join(roundRoot, 'decision.json'), baseDecision);
  await writeJson(sourceFingerprintPath, sourceFingerprintValue);

  const baselineDestination = join(root, 'base-workspaces');
  const solutionWorkspace = await prepareAgentWorkspace({
    authoritativeRoot: repositoryRoot,
    destinationRoot: baselineDestination,
    jobKind: 'solution',
    artifactSourceRoot: roundRoot,
    artifactRelativePaths: SOURCE_ARTIFACTS,
  });
  const reviewerWorkspace = await prepareAgentWorkspace({
    authoritativeRoot: repositoryRoot,
    destinationRoot: join(root, 'base-reviewer-workspaces'),
    jobKind: 'reviewer',
    artifactSourceRoot: roundRoot,
    artifactRelativePaths: SOURCE_ARTIFACTS,
  });
  assert.equal(solutionWorkspace.workspaceBaselineFingerprintSha256, reviewerWorkspace.workspaceBaselineFingerprintSha256);
  await writeJson(join(roundRoot, 'solution-agent/invocation.json'), {
    schemaVersion: 'solution-agent-invocation-v2',
    workspaceBaselineFingerprintSha256: solutionWorkspace.workspaceBaselineFingerprintSha256,
  });
  await writeJson(join(roundRoot, 'reviewer-agent/invocation.json'), {
    schemaVersion: 'solution-reviewer-invocation-v2',
    workspaceBaselineFingerprintSha256: reviewerWorkspace.workspaceBaselineFingerprintSha256,
  });
  return {
    root,
    repositoryRoot,
    roundRoot,
    problemPackage,
    problemPackagePath,
    baseSolution,
    baseReview: baseReviewResult,
    baseDecision,
    baselineFingerprint: solutionWorkspace.workspaceBaselineFingerprintSha256,
    authoritativeFingerprint: await captureAuthoritativeFingerprint(repositoryRoot),
    sourceFingerprintSha256: sha256Hex(await readFile(sourceFingerprintPath)),
  };
}

function participant(): { executable: string; buildArgs: () => string[] } {
  return { executable: process.execPath, buildArgs: () => ['-e', ''] };
}

function resultPaths(destinationRoot: string): { invocationPath: string; rawOutputPath: string; resultPath: string } {
  return {
    invocationPath: join(destinationRoot, 'invocation.json'),
    rawOutputPath: join(destinationRoot, 'raw-output.txt'),
    resultPath: join(destinationRoot, 'result.json'),
  };
}

function reviewerResultPaths(destinationRoot: string): { invocationPath: string; rawOutputPath: string; reviewPath: string } {
  return {
    invocationPath: join(destinationRoot, 'invocation.json'),
    rawOutputPath: join(destinationRoot, 'raw-output.txt'),
    reviewPath: join(destinationRoot, 'review.json'),
  };
}

function failurePaths(destinationRoot: string): { invocationPath: string; rawOutputPath: string; failurePath: string } {
  return {
    invocationPath: join(destinationRoot, 'invocation.json'),
    rawOutputPath: join(destinationRoot, 'raw-output.txt'),
    failurePath: join(destinationRoot, 'failure.json'),
  };
}

function fakeRevisionRunner(
  status: SolutionWorkV1['status'],
  calls: { revision: number; rereview: number },
  seen?: { revision?: RunSolutionRevisionInput; rereview?: RunSolutionReReviewerInput },
): NonNullable<ReviewContinuationDependencies['runSolutionRevision']> {
  return async input => {
    calls.revision += 1;
    if (seen) seen.revision = input;
    const result = solutionWork(status);
    const paths = resultPaths(input.destinationRoot);
    await writeJson(paths.invocationPath, {
      schemaVersion: 'solution-agent-invocation-v2',
      invocationRef: input.invocationRef,
      workspaceBaselineFingerprintSha256: input.workspaceBaselineFingerprintSha256,
      status: 'completed',
    });
    await writeFile(paths.rawOutputPath, `${canonicalJson(result)}\n`);
    await writeJson(paths.resultPath, result);
    return { ok: true, result, ...paths };
  };
}

function fakeReviewerRunner(
  decision: SolutionReviewV1['decision'],
  calls: { revision: number; rereview: number },
  seen?: { revision?: RunSolutionRevisionInput; rereview?: RunSolutionReReviewerInput },
): NonNullable<ReviewContinuationDependencies['runSolutionReReviewer']> {
  return async input => {
    calls.rereview += 1;
    if (seen) seen.rereview = input;
    const review = baseReview(decision);
    const paths = reviewerResultPaths(input.destinationRoot);
    await writeJson(paths.invocationPath, {
      schemaVersion: 'solution-reviewer-invocation-v2',
      invocationRef: input.invocationRef,
      workspaceBaselineFingerprintSha256: input.workspaceBaselineFingerprintSha256,
      status: 'completed',
    });
    await writeFile(paths.rawOutputPath, `${canonicalJson(review)}\n`);
    await writeJson(paths.reviewPath, review);
    return { ok: true, review, ...paths };
  };
}

function failureRevisionRunner(
  calls: { revision: number; rereview: number },
): NonNullable<ReviewContinuationDependencies['runSolutionRevision']> {
  return async input => {
    calls.revision += 1;
    const paths = failurePaths(input.destinationRoot);
    return {
      ok: false,
      errorKind: 'timeout',
      message: 'revision timed out',
      ...paths,
    };
  };
}

function failureReviewerRunner(
  calls: { revision: number; rereview: number },
): NonNullable<ReviewContinuationDependencies['runSolutionReReviewer']> {
  return async input => {
    calls.rereview += 1;
    const paths = failurePaths(input.destinationRoot);
    return {
      ok: false,
      errorKind: 'process',
      message: 're-review failed',
      ...paths,
    };
  };
}

async function runContinuation(
  fixture: Awaited<ReturnType<typeof createFixture>>,
  dependencies: ReviewContinuationDependencies,
  options: { retainHumanFollowupOnEscalate?: boolean } = {},
) {
  return runReviewContinuation({
    round: 1,
    repositoryRoot: fixture.repositoryRoot,
    humanFollowupRoot: join(fixture.root, 'hfl-root'),
    workflowInstanceRef: 'workflow-instance-000001',
    roundRoot: fixture.roundRoot,
    sourceRunRef: SOURCE_RUN_REF,
    sourceFingerprintSha256: fixture.sourceFingerprintSha256,
    participant: participant(),
    ...options,
    dependencies,
  });
}

async function assertPreflightRejected(
  mutate: (fixture: Awaited<ReturnType<typeof createFixture>>) => Promise<void>,
): Promise<void> {
  const fixture = await createFixture();
  await mutate(fixture);
  const calls = { revision: 0, rereview: 0 };
  await assert.rejects(
    () => runContinuation(fixture, {
      runSolutionRevision: fakeRevisionRunner('OPTIONS', calls),
      runSolutionReReviewer: fakeReviewerRunner('ACCEPT_OPTION', calls),
    }),
  );
  assert.deepEqual(calls, { revision: 0, rereview: 0 });
  assert.equal(
    await fileExists(join(fixture.roundRoot, 'review-continuation-000001/revision-request.json')),
    false,
  );
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

export async function runReviewContinuationTests(): Promise<void> {
  await assertPreflightRejected(async fixture => {
    await writeJson(join(fixture.roundRoot, 'solution-agent/result.json'), solutionWork('NO_PROPOSAL'));
  });
  await assertPreflightRejected(async fixture => {
    await writeJson(join(fixture.roundRoot, 'reviewer-agent/review.json'), baseReview('ACCEPT_NO_ACTION'));
  });
  await assertPreflightRejected(async fixture => {
    await writeJson(join(fixture.roundRoot, 'decision.json'), validateSolutionDecision({
      ...moreWorkDecision(),
      route: 'DEFER',
      reasonCode: 'INSUFFICIENT_EVIDENCE',
      inputs: { ...moreWorkDecision().inputs, solutionStatus: 'INSUFFICIENT_EVIDENCE', reviewerDecision: null, solutionScope: null, reviewScope: null },
    }));
  });
  await assertPreflightRejected(async fixture => {
    await writeJson(join(fixture.roundRoot, 'solution-agent/result.json'), { ...fixture.baseSolution, problemId: 'other-problem' });
  });
  await assertPreflightRejected(async fixture => {
    await writeJson(join(fixture.roundRoot, 'reviewer-agent/invocation.json'), {
      schemaVersion: 'solution-reviewer-invocation-v2',
      workspaceBaselineFingerprintSha256: 'c'.repeat(64),
    });
  });
  await assertPreflightRejected(async fixture => {
    await writeFile(join(fixture.repositoryRoot, 'src/runtime.ts'), 'export const runtime = false;\n');
  });
  await assertPreflightRejected(async fixture => {
    await writeFile(
      join(fixture.roundRoot, 'game-runs', SOURCE_RUN_REF, 'provenance/source-fingerprint.json'),
      'tampered source provenance\n',
    );
  });

  const insufficient = await createFixture();
  const insufficientCalls = { revision: 0, rereview: 0 };
  const insufficientResult = await runContinuation(insufficient, {
    runSolutionRevision: fakeRevisionRunner('INSUFFICIENT_EVIDENCE', insufficientCalls),
    runSolutionReReviewer: fakeReviewerRunner('ACCEPT_OPTION', insufficientCalls),
  });
  assert.equal(insufficientResult.status, 'completed');
  assert.equal(insufficientResult.terminalRoute, 'DEFER');
  assert.equal(insufficientResult.participantJobs, 1);
  assert.deepEqual(insufficientCalls, { revision: 1, rereview: 0 });

  const escalation = await createFixture();
  const escalationCalls = { revision: 0, rereview: 0 };
  const retained: RetainHumanFollowupWorkItemInput[] = [];
  const escalationResult = await runContinuation(escalation, {
    runSolutionRevision: fakeRevisionRunner('ESCALATE', escalationCalls),
    runSolutionReReviewer: fakeReviewerRunner('ACCEPT_OPTION', escalationCalls),
    retainHumanFollowup: async input => {
      retained.push(input);
      return { itemPath: 'item.json', item: {} as RetainedHumanFollowupWorkItem['item'], created: true };
    },
  });
  assert.equal(escalationResult.status, 'completed');
  assert.equal(escalationResult.terminalRoute, 'ESCALATE_HUMAN');
  assert.equal(escalationResult.participantJobs, 1);
  assert.equal(retained.length, 1);
  assert.equal(retained[0]!.continuation?.effectiveDecisionPath, 'review-continuation-000001/decision.json');

  const candidateOwnedEscalation = await createFixture();
  const candidateOwnedCalls = { revision: 0, rereview: 0 };
  const candidateOwnedRetained: RetainHumanFollowupWorkItemInput[] = [];
  const candidateOwnedResult = await runContinuation(candidateOwnedEscalation, {
    runSolutionRevision: fakeRevisionRunner('ESCALATE', candidateOwnedCalls),
    runSolutionReReviewer: fakeReviewerRunner('ACCEPT_OPTION', candidateOwnedCalls),
    retainHumanFollowup: async input => {
      candidateOwnedRetained.push(input);
      return { itemPath: 'item.json', item: {} as RetainedHumanFollowupWorkItem['item'], created: true };
    },
  }, { retainHumanFollowupOnEscalate: false });
  assert.equal(candidateOwnedResult.status, 'completed');
  assert.equal(candidateOwnedResult.terminalRoute, 'ESCALATE_HUMAN');
  assert.equal(candidateOwnedRetained.length, 0);

  const adapterFixture = await createFixture();
  let adapterRetentionFlag: boolean | undefined;
  const adapterDecision = validateSolutionDecision({
    schemaVersion: 'solution-decision-v1',
    problemId: adapterFixture.baseDecision.problemId,
    route: 'ESCALATE_HUMAN',
    reasonCode: 'EXPLICIT_ESCALATION',
    inputs: {
      solutionStatus: 'OPTIONS',
      reviewerDecision: 'ESCALATE',
      solutionScope: 'configuration',
      reviewScope: 'config_only',
      permissions: adapterFixture.baseDecision.inputs.permissions,
      budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
  const adapterResult = await runCandidateReviewContinuation({
    candidateRef: 'candidate-pool-000001/hypothesis-000001',
    candidateLaneRoot: adapterFixture.roundRoot,
    baseDecisionPath: adapterFixture.roundRoot + '/decision.json',
    problemPackagePath: adapterFixture.problemPackagePath,
    sourceFingerprintSha256: adapterFixture.sourceFingerprintSha256,
    participant: participant(),
    repositoryRoot: adapterFixture.repositoryRoot,
    dependencies: {
      runCandidateContinuation: async input => {
        adapterRetentionFlag = input.retainHumanFollowupOnEscalate;
        return {
          status: 'completed',
          continuationRef: 'review-continuation-000001',
          participantJobs: 1,
          terminalRoute: 'ESCALATE_HUMAN',
          terminalReasonCode: adapterDecision.reasonCode,
          decision: adapterDecision,
          decisionPath: adapterFixture.roundRoot + '/review-continuation-000001/decision.json',
          effectiveSolutionPath: null,
          effectiveReviewPath: null,
        };
      },
    },
  });
  assert.equal(adapterResult.status, 'completed');
  assert.equal(adapterRetentionFlag, false);

  const accepted = await createFixture();
  const acceptedCalls = { revision: 0, rereview: 0 };
  const acceptedSeen: { revision?: RunSolutionRevisionInput; rereview?: RunSolutionReReviewerInput } = {};
  const acceptedResult = await runContinuation(accepted, {
    runSolutionRevision: fakeRevisionRunner('OPTIONS', acceptedCalls, acceptedSeen),
    runSolutionReReviewer: fakeReviewerRunner('ACCEPT_OPTION', acceptedCalls, acceptedSeen),
  });
  assert.equal(acceptedResult.status, 'completed');
  assert.equal(acceptedResult.terminalRoute, 'READY_FOR_CONFIG_EXECUTION');
  assert.equal(acceptedResult.participantJobs, 2);
  assert.deepEqual(acceptedCalls, { revision: 1, rereview: 1 });
  assert.equal(acceptedSeen.revision?.invocationRef, 'solution-revision-000001');
  assert.equal(acceptedSeen.rereview?.invocationRef, 'solution-rereviewer-000001');
  assert.deepEqual(acceptedSeen.rereview?.originalSolutionWork, accepted.baseSolution);
  assert.deepEqual(acceptedSeen.rereview?.originalReview, accepted.baseReview);
  assert.deepEqual(acceptedSeen.rereview?.solutionWork, solutionWork('OPTIONS'));
  assert.equal(acceptedResult.effectiveSolutionPath, join(accepted.roundRoot, 'review-continuation-000001/solution-revision/result.json'));
  assert.equal(acceptedResult.effectiveReviewPath, join(accepted.roundRoot, 'review-continuation-000001/reviewer-agent/review.json'));

  const secondRequest = await createFixture();
  const secondRequestCalls = { revision: 0, rereview: 0 };
  const secondRequestResult = await runContinuation(secondRequest, {
    runSolutionRevision: fakeRevisionRunner('OPTIONS', secondRequestCalls),
    runSolutionReReviewer: fakeReviewerRunner('REQUEST_MORE_WORK', secondRequestCalls),
  });
  assert.equal(secondRequestResult.status, 'completed');
  assert.equal(secondRequestResult.terminalRoute, 'DEFER_MORE_WORK_REQUESTED');
  assert.equal(secondRequestResult.participantJobs, 2);
  assert.deepEqual(secondRequestCalls, { revision: 1, rereview: 1 });

  const revisionFailure = await createFixture();
  const revisionFailureCalls = { revision: 0, rereview: 0 };
  const revisionFailureResult = await runContinuation(revisionFailure, {
    runSolutionRevision: failureRevisionRunner(revisionFailureCalls),
    runSolutionReReviewer: failureReviewerRunner(revisionFailureCalls),
  });
  assert.equal(revisionFailureResult.status, 'participant_failure');
  assert.equal(revisionFailureResult.terminalRoute, 'PARTICIPANT_FAILURE');
  assert.equal(revisionFailureResult.participantJobs, 1);
  assert.deepEqual(revisionFailureCalls, { revision: 1, rereview: 0 });
  assert.equal(revisionFailureResult.decision, null);

  const thrownRevision = await createFixture();
  const thrownRevisionResult = await runContinuation(thrownRevision, {
    runSolutionRevision: async () => {
      throw new Error('revision runner threw');
    },
  });
  assert.equal(thrownRevisionResult.status, 'participant_failure');
  assert.equal(thrownRevisionResult.participantJobs, 1);
  assert.equal(thrownRevisionResult.decision, null);
  assert.equal(
    await fileExists(join(thrownRevision.roundRoot, 'review-continuation-000001/solution-revision/failure.json')),
    true,
  );
  assert.equal(
    await fileExists(join(thrownRevision.roundRoot, 'review-continuation-000001/continuation.json')),
    true,
  );
  assert.equal(
    await fileExists(join(thrownRevision.roundRoot, 'review-continuation-000001/decision.json')),
    false,
  );

  const rereviewFailure = await createFixture();
  const rereviewFailureCalls = { revision: 0, rereview: 0 };
  const rereviewFailureResult = await runContinuation(rereviewFailure, {
    runSolutionRevision: fakeRevisionRunner('OPTIONS', rereviewFailureCalls),
    runSolutionReReviewer: failureReviewerRunner(rereviewFailureCalls),
  });
  assert.equal(rereviewFailureResult.status, 'participant_failure');
  assert.equal(rereviewFailureResult.terminalRoute, 'PARTICIPANT_FAILURE');
  assert.equal(rereviewFailureResult.participantJobs, 2);
  assert.deepEqual(rereviewFailureCalls, { revision: 1, rereview: 1 });

  const continuationJson = JSON.parse(await readFile(join(accepted.roundRoot, 'review-continuation-000001/continuation.json'), 'utf8')) as {
    participantJobCount: number;
    continuationDecisionRef: string | null;
  };
  assert.equal(continuationJson.participantJobCount, 2);
  assert.equal(continuationJson.continuationDecisionRef, 'review-continuation-000001/decision.json');
  assert.equal(await captureAuthoritativeFingerprint(accepted.repositoryRoot), accepted.authoritativeFingerprint);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runReviewContinuationTests()
    .then(() => console.log('reviewContinuation.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
