import { lstat, mkdir, mkdtemp, open, readFile, rm } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import {
  validateReviewContinuation,
  type ReviewContinuationV1,
} from '../../../src/evolution/reviewContinuationContract';
import {
  validateSolutionDecision,
  type SolutionDecisionReasonCode,
  type SolutionDecisionV1,
  type SolutionRoute,
} from '../../../src/evolution/solutionDecisionContract';
import {
  validateProblemPackage,
  type ProblemPackage,
} from '../../../src/evolution/problemPackageContract';
import {
  validateSolutionReview,
  type SolutionReviewV1,
} from '../../../src/evolution/solutionReviewContract';
import {
  validateSolutionWork,
  type SolutionWorkV1,
} from '../../../src/evolution/solutionWorkContract';
import {
  canonicalJson,
  sha256Hex,
  validatePhase0RunRef,
} from '../phase0/provenance';
import {
  assertAuthoritativeFingerprintUnchanged,
  captureAuthoritativeFingerprint,
  prepareAgentWorkspace,
  type PreparedAgentWorkspace,
} from './agentWorkspace';
import {
  runSolutionRevisionAgent,
  type RunSolutionRevisionInput,
  type SolutionAgentRunResult,
} from './runSolutionAgent';
import {
  runSolutionReReviewer,
  type RunSolutionReReviewerInput,
  type SolutionReviewerRunResult,
} from './runSolutionReviewer';
import {
  REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
  SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
} from './solutionParticipantSkills';
import type { WorkspaceAgentParticipantOptions } from './agentParticipant';
import { routeSolutionDecision } from './routeSolutionDecision';
import {
  retainHumanFollowupWorkItem,
  type HumanFollowupContinuationEvidence,
  type RetainedHumanFollowupWorkItem,
} from '../humanFollowup/retainHumanFollowupWorkItem';

const CONTINUATION_ID = 'review-continuation-000001' as const;
const REVISION_INVOCATION_REF = 'solution-revision-000001' as const;
const REREVIEW_INVOCATION_REF = 'solution-rereviewer-000001' as const;

export interface ReviewContinuationDependencies {
  runSolutionRevision?: typeof runSolutionRevisionAgent;
  runSolutionReReviewer?: typeof runSolutionReReviewer;
  retainHumanFollowup?: typeof retainHumanFollowupWorkItem;
  now?: () => string;
}

export interface RunReviewContinuationInput {
  round: 1 | 2;
  repositoryRoot: string;
  humanFollowupRoot: string;
  workflowInstanceRef: string;
  roundRoot: string;
  sourceRunRef: string;
  sourceFingerprintSha256: string;
  participant: WorkspaceAgentParticipantOptions;
  retainHumanFollowupOnEscalate?: boolean;
  dependencies?: ReviewContinuationDependencies;
}

export type ReviewContinuationResult =
  | {
    status: 'completed';
    continuationRef: typeof CONTINUATION_ID;
    participantJobs: 1 | 2;
    terminalRoute: SolutionRoute;
    terminalReasonCode: SolutionDecisionReasonCode;
    decision: SolutionDecisionV1;
    decisionPath: string;
    effectiveSolutionPath: string;
    effectiveReviewPath: string | null;
  }
  | {
    status: 'participant_failure';
    continuationRef: typeof CONTINUATION_ID;
    participantJobs: 1 | 2;
    terminalRoute: 'PARTICIPANT_FAILURE';
    terminalReasonCode: null;
    decision: null;
    decisionPath: null;
    effectiveSolutionPath: string | null;
    effectiveReviewPath: string | null;
  };

interface BaseArtifacts {
  problemPackage: ProblemPackage;
  problemPackagePath: string;
  solution: SolutionWorkV1;
  solutionPath: string;
  review: SolutionReviewV1;
  reviewPath: string;
  decision: SolutionDecisionV1;
  decisionPath: string;
  problemPackageSha256: string;
  solutionSha256: string;
  reviewSha256: string;
  decisionSha256: string;
  workspaceBaselineFingerprintSha256: string;
}

interface ContinuationWorkspaces {
  continuationRoot: string;
  revisionDestinationRoot: string;
  revisionWorkspace: PreparedAgentWorkspace;
  rereviewDestinationRoot: string;
  rereviewWorkspace: PreparedAgentWorkspace | null;
}

function assertSha256(value: string, label: string): string {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(`${label} must be a SHA-256 hex string`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readJson(path: string, label: string): Promise<unknown> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (error) {
    throw new Error(`unable to read ${label}: ${String(error)}`);
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}

async function assertRegularFile(path: string, label: string): Promise<void> {
  const stat = await lstat(path);
  if (!stat.isFile()) throw new Error(`${label} must be a regular file`);
}

async function readInvocationBaseline(path: string, label: string): Promise<string> {
  const invocation = await readJson(path, label);
  if (!isRecord(invocation) || typeof invocation.workspaceBaselineFingerprintSha256 !== 'string') {
    throw new Error(`${label} must contain workspaceBaselineFingerprintSha256`);
  }
  return assertSha256(invocation.workspaceBaselineFingerprintSha256, `${label}.workspaceBaselineFingerprintSha256`);
}

async function hashFile(path: string): Promise<string> {
  return sha256Hex(await readFile(path));
}

async function assertSourceFingerprint(
  roundRoot: string,
  sourceRunRef: string,
  expectedFingerprint: string,
): Promise<void> {
  const sourceFingerprintPath = join(roundRoot, 'game-runs', sourceRunRef, 'provenance/source-fingerprint.json');
  await assertRegularFile(sourceFingerprintPath, 'source provenance fingerprint');
  const actualFingerprint = await hashFile(sourceFingerprintPath);
  if (actualFingerprint !== expectedFingerprint) {
    throw new Error(
      `source provenance fingerprint changed: expected ${expectedFingerprint}, got ${actualFingerprint}`,
    );
  }
}

function artifactPaths(problemPackage: ProblemPackage): string[] {
  return [
    problemPackage.source.observablePayloadRef,
    problemPackage.source.externalFeedbackRef,
    problemPackage.source.improvementHypothesisRef,
    ...(problemPackage.schemaVersion === 'problem-package-v2'
      ? problemPackage.source.diagnosticEvidenceRefs
      : []),
  ];
}

async function readBaseArtifacts(input: RunReviewContinuationInput): Promise<BaseArtifacts> {
  const roundRoot = resolve(input.roundRoot);
  const problemPackagePath = join(roundRoot, 'problem-package.json');
  const solutionPath = join(roundRoot, 'solution-agent/result.json');
  const reviewPath = join(roundRoot, 'reviewer-agent/review.json');
  const decisionPath = join(roundRoot, 'decision.json');
  const solutionInvocationPath = join(roundRoot, 'solution-agent/invocation.json');
  const reviewerInvocationPath = join(roundRoot, 'reviewer-agent/invocation.json');
  await Promise.all([
    assertRegularFile(problemPackagePath, 'base problem package'),
    assertRegularFile(solutionPath, 'base Solution'),
    assertRegularFile(reviewPath, 'base Reviewer review'),
    assertRegularFile(decisionPath, 'base decision'),
    assertRegularFile(solutionInvocationPath, 'base Solution invocation'),
    assertRegularFile(reviewerInvocationPath, 'base Reviewer invocation'),
  ]);

  const problemPackage = validateProblemPackage(await readJson(problemPackagePath, 'base problem package'));
  const solution = validateSolutionWork(await readJson(solutionPath, 'base Solution'));
  const review = validateSolutionReview(await readJson(reviewPath, 'base Reviewer review'));
  const decision = validateSolutionDecision(await readJson(decisionPath, 'base decision'));
  const solutionBaseline = await readInvocationBaseline(solutionInvocationPath, 'base Solution invocation');
  const reviewerBaseline = await readInvocationBaseline(reviewerInvocationPath, 'base Reviewer invocation');

  if (problemPackage.source.runRef !== input.sourceRunRef) {
    throw new Error('base Problem Package source runRef does not match sourceRunRef');
  }
  if (solution.status !== 'OPTIONS') throw new Error('continuation requires base Solution status OPTIONS');
  if (review.decision !== 'REQUEST_MORE_WORK') throw new Error('continuation requires base Reviewer decision REQUEST_MORE_WORK');
  if (decision.route !== 'DEFER_MORE_WORK_REQUESTED' || decision.reasonCode !== 'REVIEW_REQUEST_MORE_WORK') {
    throw new Error('continuation requires base decision DEFER_MORE_WORK_REQUESTED / REVIEW_REQUEST_MORE_WORK');
  }
  if (solution.problemId !== problemPackage.problemId || review.problemId !== problemPackage.problemId || decision.problemId !== problemPackage.problemId) {
    throw new Error('base continuation artifacts must share the Problem Package problemId');
  }
  if (solutionBaseline !== reviewerBaseline) throw new Error('base Solution and Reviewer workspace baselines do not match');

  return {
    problemPackage,
    problemPackagePath,
    solution,
    solutionPath,
    review,
    reviewPath,
    decision,
    decisionPath,
    problemPackageSha256: await hashFile(problemPackagePath),
    solutionSha256: await hashFile(solutionPath),
    reviewSha256: await hashFile(reviewPath),
    decisionSha256: await hashFile(decisionPath),
    workspaceBaselineFingerprintSha256: solutionBaseline,
  };
}

async function prepareFreshBaselineWorkspaces(
  input: RunReviewContinuationInput,
  base: BaseArtifacts,
  destinationRoot: string,
): Promise<{ solution: PreparedAgentWorkspace; reviewer: PreparedAgentWorkspace }> {
  const sourceArtifacts = artifactPaths(base.problemPackage);
  const solution = await prepareAgentWorkspace({
    authoritativeRoot: input.repositoryRoot,
    destinationRoot: join(destinationRoot, 'solution'),
    jobKind: 'solution',
    artifactSourceRoot: input.roundRoot,
    artifactRelativePaths: sourceArtifacts,
  });
  const reviewer = await prepareAgentWorkspace({
    authoritativeRoot: input.repositoryRoot,
    destinationRoot: join(destinationRoot, 'reviewer'),
    jobKind: 'reviewer',
    artifactSourceRoot: input.roundRoot,
    artifactRelativePaths: sourceArtifacts,
  });
  if (
    solution.workspaceBaselineFingerprintSha256 !== base.workspaceBaselineFingerprintSha256
    || reviewer.workspaceBaselineFingerprintSha256 !== base.workspaceBaselineFingerprintSha256
    || solution.workspaceBaselineFingerprintSha256 !== reviewer.workspaceBaselineFingerprintSha256
  ) {
    throw new Error('fresh continuation workspace baseline does not match the base round baseline');
  }
  return { solution, reviewer };
}

async function preflightFreshBaseline(
  input: RunReviewContinuationInput,
  base: BaseArtifacts,
): Promise<void> {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'review-continuation-preflight-'));
  try {
    await prepareFreshBaselineWorkspaces(input, base, temporaryRoot);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function writeCreateOnly(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(`${canonicalJson(value)}\n`);
  } finally {
    await handle.close();
  }
}

function buildRevisionRequest(input: RunReviewContinuationInput, base: BaseArtifacts) {
  return {
    schemaVersion: 'review-continuation-revision-request-v1' as const,
    continuationId: CONTINUATION_ID,
    continuationOrdinal: 1 as const,
    round: input.round,
    sourceRunRef: input.sourceRunRef,
    problemPackageRef: 'problem-package.json' as const,
    problemPackageSha256: base.problemPackageSha256,
    originalSolutionRef: 'solution-agent/result.json' as const,
    originalSolutionSha256: base.solutionSha256,
    originalReviewRef: 'reviewer-agent/review.json' as const,
    originalReviewSha256: base.reviewSha256,
    baseDecisionRef: 'decision.json' as const,
    baseDecisionSha256: base.decisionSha256,
    workspaceBaselineFingerprintSha256: base.workspaceBaselineFingerprintSha256,
  };
}

function selectedOptionScope(solution: SolutionWorkV1, review: SolutionReviewV1): SolutionWorkV1['options'][number]['changeScope'] | null {
  if (review.decision !== 'ACCEPT_OPTION') return null;
  const option = solution.options.find(candidate => candidate.optionId === review.acceptedOptionId);
  if (!option) throw new Error(`re-review acceptedOptionId does not exist in revised SolutionWork: ${review.acceptedOptionId}`);
  return option.changeScope;
}

function participantFailureResult(
  participantJobs: 1 | 2,
): ReviewContinuationResult {
  return {
    status: 'participant_failure',
    continuationRef: CONTINUATION_ID,
    participantJobs,
    terminalRoute: 'PARTICIPANT_FAILURE',
    terminalReasonCode: null,
    decision: null,
    decisionPath: null,
    effectiveSolutionPath: null,
    effectiveReviewPath: null,
  };
}

async function participantRunnerThrowResult(
  destinationRoot: string,
  role: 'solution' | 'reviewer',
  error: unknown,
): Promise<SolutionAgentRunResult | SolutionReviewerRunResult> {
  const failurePath = join(destinationRoot, 'failure.json');
  await writeCreateOnly(failurePath, {
    schemaVersion: role === 'solution' ? 'solution-agent-failure-v1' : 'solution-reviewer-failure-v1',
    errorKind: 'process',
    message: `participant runner threw: ${String(error)}`,
  });
  if (role === 'solution') {
    return {
      ok: false,
      errorKind: 'process',
      message: `participant runner threw: ${String(error)}`,
      invocationPath: join(destinationRoot, 'invocation.json'),
      rawOutputPath: join(destinationRoot, 'raw-output.txt'),
      failurePath,
    };
  }
  return {
    ok: false,
    errorKind: 'process',
    message: `participant runner threw: ${String(error)}`,
    invocationPath: join(destinationRoot, 'invocation.json'),
    rawOutputPath: join(destinationRoot, 'raw-output.txt'),
    failurePath,
  };
}

function continuationEvidencePaths(
  revision: SolutionAgentRunResult,
  reviewer: SolutionReviewerRunResult | null,
): string[] {
  return [
    'review-continuation-000001/revision-request.json',
    revision.ok
      ? 'review-continuation-000001/solution-revision/result.json'
      : 'review-continuation-000001/solution-revision/failure.json',
    ...(reviewer === null
      ? []
      : [reviewer.ok
        ? 'review-continuation-000001/reviewer-agent/review.json'
        : 'review-continuation-000001/reviewer-agent/failure.json']),
    'review-continuation-000001/decision.json',
    'review-continuation-000001/continuation.json',
  ];
}

function buildContinuation(
  input: RunReviewContinuationInput,
  base: BaseArtifacts,
  startedAt: string,
  revision: SolutionAgentRunResult,
  reviewer: SolutionReviewerRunResult | null,
  decision: SolutionDecisionV1 | null,
  revisionRequestSha256: string,
  continuationDecisionSha256: string | null,
): ReviewContinuationV1 {
  const revisionStatus: ReviewContinuationV1['revisionStatus'] = revision.ok ? revision.result.status : 'participant_failure';
  const reReviewStatus: ReviewContinuationV1['reReviewStatus'] = reviewer === null
    ? 'not_run'
    : reviewer.ok ? reviewer.review.decision : 'participant_failure';
  const terminalStatus = decision === null ? 'participant_failure' as const : 'completed' as const;
  return validateReviewContinuation({
    schemaVersion: 'review-continuation-v1',
    continuationId: CONTINUATION_ID,
    continuationOrdinal: 1,
    round: input.round,
    parentWorkflowRef: `round-${input.round}`,
    sourceRunRef: input.sourceRunRef,
    startedAt,
    completedAt: (input.dependencies?.now ?? (() => new Date().toISOString()))(),
    baseDecisionRef: 'decision.json',
    baseDecisionSha256: base.decisionSha256,
    revisionRequestRef: 'review-continuation-000001/revision-request.json',
    revisionRequestSha256,
    revisionStatus,
    reReviewStatus,
    continuationDecisionRef: decision === null ? null : 'review-continuation-000001/decision.json',
    continuationDecisionSha256,
    participantJobCount: reviewer === null ? 1 : 2,
    terminalStatus,
    terminalRoute: decision?.route ?? 'PARTICIPANT_FAILURE',
  });
}

async function writeParticipantFailureContinuation(
  input: RunReviewContinuationInput,
  base: BaseArtifacts,
  startedAt: string,
  revision: SolutionAgentRunResult,
  reviewer: SolutionReviewerRunResult | null,
  revisionRequestSha256: string,
): Promise<void> {
  const continuationRoot = join(resolve(input.roundRoot), CONTINUATION_ID);
  const continuationPath = join(continuationRoot, 'continuation.json');
  const continuation = buildContinuation(input, base, startedAt, revision, reviewer, null, revisionRequestSha256, null);
  await writeCreateOnly(continuationPath, continuation);
}

export async function runReviewContinuation(
  input: RunReviewContinuationInput,
): Promise<ReviewContinuationResult> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const roundRoot = resolve(input.roundRoot);
  validatePhase0RunRef(input.sourceRunRef);
  assertSha256(input.sourceFingerprintSha256, 'sourceFingerprintSha256');
  await assertSourceFingerprint(roundRoot, input.sourceRunRef, input.sourceFingerprintSha256);
  const base = await readBaseArtifacts(input);
  await preflightFreshBaseline(input, base);
  const authoritativeFingerprint = await captureAuthoritativeFingerprint(repositoryRoot);
  const continuationRoot = join(roundRoot, CONTINUATION_ID);
  const workspacesRoot = join(continuationRoot, 'agent-workspaces');
  const revisionDestinationRoot = join(continuationRoot, 'solution-revision');
  const rereviewDestinationRoot = join(continuationRoot, 'reviewer-agent');
  const actualBaseline = await prepareFreshBaselineWorkspaces(input, base, workspacesRoot);
  await assertAuthoritativeFingerprintUnchanged(repositoryRoot, authoritativeFingerprint);

  const revisionRequest = buildRevisionRequest(input, base);
  const revisionRequestPath = join(continuationRoot, 'revision-request.json');
  await writeCreateOnly(revisionRequestPath, revisionRequest);
  const revisionRequestSha256 = await hashFile(revisionRequestPath);
  const startedAt = (input.dependencies?.now ?? (() => new Date().toISOString()))();
  const revisionRunner = input.dependencies?.runSolutionRevision ?? runSolutionRevisionAgent;
  const revisionInput: RunSolutionRevisionInput = {
    problemPackage: base.problemPackage,
    problemPackagePath: base.problemPackagePath,
    workspaceRoot: actualBaseline.solution.workspaceRoot,
    artifactRoot: roundRoot,
    workspaceBaselineFingerprintSha256: actualBaseline.solution.workspaceBaselineFingerprintSha256,
    invocationRef: REVISION_INVOCATION_REF,
    jobNumber: 1,
    destinationRoot: revisionDestinationRoot,
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant: input.participant,
    originalSolutionWork: base.solution,
    originalReview: base.review,
  };
  let revision: SolutionAgentRunResult;
  try {
    revision = await revisionRunner(revisionInput);
  } catch (error) {
    await assertAuthoritativeFingerprintUnchanged(repositoryRoot, authoritativeFingerprint);
    revision = await participantRunnerThrowResult(revisionDestinationRoot, 'solution', error) as SolutionAgentRunResult;
    await writeParticipantFailureContinuation(input, base, startedAt, revision, null, revisionRequestSha256);
    return participantFailureResult(1);
  }
  await assertAuthoritativeFingerprintUnchanged(repositoryRoot, authoritativeFingerprint);
  if (!revision.ok) {
    await writeParticipantFailureContinuation(input, base, startedAt, revision, null, revisionRequestSha256);
    return participantFailureResult(1);
  }

  let reviewer: SolutionReviewerRunResult | null = null;
  let reviewerWorkspace: PreparedAgentWorkspace | null = null;
  if (revision.result.status === 'OPTIONS') {
    reviewerWorkspace = actualBaseline.reviewer;
    await mkdir(rereviewDestinationRoot, { recursive: true });
    const reviewerRunner = input.dependencies?.runSolutionReReviewer ?? runSolutionReReviewer;
    const reviewerInput: RunSolutionReReviewerInput = {
      problemPackage: base.problemPackage,
      problemPackagePath: base.problemPackagePath,
      solutionWork: revision.result,
      workspaceRoot: reviewerWorkspace.workspaceRoot,
      artifactRoot: roundRoot,
      workspaceBaselineFingerprintSha256: reviewerWorkspace.workspaceBaselineFingerprintSha256,
      invocationRef: REREVIEW_INVOCATION_REF,
      jobNumber: 2,
      destinationRoot: rereviewDestinationRoot,
      skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
      participant: input.participant,
      originalSolutionWork: base.solution,
      originalReview: base.review,
    };
    try {
      reviewer = await reviewerRunner(reviewerInput);
    } catch (error) {
      await assertAuthoritativeFingerprintUnchanged(repositoryRoot, authoritativeFingerprint);
      reviewer = await participantRunnerThrowResult(rereviewDestinationRoot, 'reviewer', error) as SolutionReviewerRunResult;
      await writeParticipantFailureContinuation(input, base, startedAt, revision, reviewer, revisionRequestSha256);
      return participantFailureResult(2);
    }
    await assertAuthoritativeFingerprintUnchanged(repositoryRoot, authoritativeFingerprint);
    if (!reviewer.ok) {
      await writeParticipantFailureContinuation(input, base, startedAt, revision, reviewer, revisionRequestSha256);
      return participantFailureResult(2);
    }
  }

  const decision = routeSolutionDecision({
    problemId: base.problemPackage.problemId,
    solutionStatus: revision.result.status,
    reviewerDecision: reviewer?.ok ? reviewer.review.decision : null,
    solutionScope: reviewer?.ok ? selectedOptionScope(revision.result, reviewer.review) : null,
    reviewScope: reviewer?.ok ? reviewer.review.scopeAssessment ?? null : null,
    permissions: base.problemPackage.permissions,
    budget: { actualParticipantJobs: reviewer === null ? 1 : 2, maxParticipantJobs: 4, retryCount: 0 },
  });
  const decisionPath = join(continuationRoot, 'decision.json');
  await writeCreateOnly(decisionPath, decision);
  const continuationDecisionSha256 = await hashFile(decisionPath);
  const continuation = buildContinuation(
    input,
    base,
    startedAt,
    revision,
    reviewer,
    decision,
    revisionRequestSha256,
    continuationDecisionSha256,
  );
  const continuationPath = join(continuationRoot, 'continuation.json');
  await writeCreateOnly(continuationPath, continuation);

  if (decision.route === 'ESCALATE_HUMAN' && input.retainHumanFollowupOnEscalate !== false) {
    const retain = input.dependencies?.retainHumanFollowup ?? retainHumanFollowupWorkItem;
    const continuationEvidence: HumanFollowupContinuationEvidence = {
      effectiveDecisionPath: 'review-continuation-000001/decision.json',
      continuationRelativePaths: continuationEvidencePaths(revision, reviewer),
    };
    await retain({
      repositoryRoot: input.humanFollowupRoot,
      workflowRoot: roundRoot,
      workflowInstanceRef: input.workflowInstanceRef,
      sourceRunRef: input.sourceRunRef,
      sourceFingerprintSha256: input.sourceFingerprintSha256,
      problemPackagePath: base.problemPackagePath,
      decisionPath,
      continuation: continuationEvidence,
    });
  }
  return {
    status: 'completed',
    continuationRef: CONTINUATION_ID,
    participantJobs: reviewer === null ? 1 : 2,
    terminalRoute: decision.route,
    terminalReasonCode: decision.reasonCode,
    decision,
    decisionPath,
    effectiveSolutionPath: revision.resultPath,
    effectiveReviewPath: reviewer?.ok ? reviewer.reviewPath : null,
  };
}
