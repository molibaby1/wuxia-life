import { lstat, mkdir, open, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateSolutionDecision, type SolutionDecisionV1 } from '../../src/evolution/solutionDecisionContract';
import {
  runReviewContinuation,
  type ReviewContinuationDependencies,
  type ReviewContinuationResult,
  type RunReviewContinuationInput,
} from './problemAgnosticSolution/runReviewContinuation';
import type { WorkspaceAgentParticipantOptions } from './problemAgnosticSolution/agentParticipant';
import {
  buildCandidateLaneFailureV2,
  parseCandidateLaneFailureV2,
  type CandidateLaneFailureV2,
} from './candidateLaneFailureContract';
import { canonicalJson } from './phase0/provenance';
import type { PreschoolAutonomousAuthoringContractPacketV1 } from './autonomousAuthoring/buildPreschoolContractPacket';

export interface RunCandidateReviewContinuationInput {
  candidateRef: string;
  hypothesisId: string;
  sourceIndex: number;
  candidateLaneRoot: string;
  baseDecisionPath: string;
  problemPackagePath: string;
  sourceFingerprintSha256: string;
  participant: WorkspaceAgentParticipantOptions;
  repositoryRoot?: string;
  humanFollowupRoot?: string;
  workflowInstanceRef?: string;
  sourceRunRef?: string;
  sourceProvenanceRoot?: string;
  autonomousAuthoringContractPacket?: PreschoolAutonomousAuthoringContractPacketV1;
  dependencies?: ReviewContinuationDependencies & {
    runCandidateContinuation?: (input: RunReviewContinuationInput) => Promise<ReviewContinuationResult>;
  };
}

export type CandidateReviewContinuationResult =
  | {
    status: 'not_requested';
    participantJobs: 0;
    effectiveDecisionPath: string;
  }
  | {
    status: 'completed';
    participantJobs: 1 | 2;
    continuationRef: 'review-continuation-000001';
    effectiveDecisionPath: string;
    effectiveDecision: SolutionDecisionV1;
    effectiveSolutionPath: string;
    effectiveReviewPath: string | null;
    autonomousAuthoringAdmissionPath: string | null;
  }
  | {
    status: 'participant_failure';
    participantJobs: 1 | 2;
    continuationRef: 'review-continuation-000001';
    failureRef: string;
    workflowOutcomeRef: 'workflow-outcome.json';
    failure: CandidateLaneFailureV2;
  };

async function writeCreateOnly(path: string, value: unknown): Promise<void> {
  await mkdir(resolve(path, '..'), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(`${canonicalJson(value)}\n`);
  } finally {
    await handle.close();
  }
}

async function readDecision(path: string): Promise<SolutionDecisionV1> {
  return validateSolutionDecision(JSON.parse(await readFile(path, 'utf8')) as unknown);
}

async function existingArtifactPath(root: string, relativePath: string): Promise<string | null> {
  const path = resolve(root, relativePath);
  try {
    const info = await lstat(path);
    if (!info.isFile()) throw new Error(`existing continuation artifact is not a file: ${relativePath}`);
    return path;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function existingContinuation(
  root: string,
  identity: { candidateRef: string; hypothesisId: string; sourceIndex: number },
): Promise<CandidateReviewContinuationResult | null> {
  const continuationPath = resolve(root, 'review-continuation-000001/continuation.json');
  try {
    await lstat(continuationPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  const continuation = JSON.parse(await readFile(continuationPath, 'utf8')) as {
    terminalStatus?: string;
    participantJobCount?: number;
    terminalRoute?: string;
  };
  if (continuation.terminalStatus === 'participant_failure') {
    const failure = parseCandidateLaneFailureV2(await readFile(resolve(root, 'workflow-outcome.json'), 'utf8'));
    if (
      failure.candidateRef !== identity.candidateRef
      || failure.hypothesisId !== identity.hypothesisId
      || failure.sourceIndex !== identity.sourceIndex
    ) {
      throw new Error('existing continuation failure identity does not match candidate continuation input');
    }
    if (continuation.participantJobCount !== undefined
      && continuation.participantJobCount !== failure.actualParticipantJobs) {
      throw new Error('existing continuation failure identity does not match candidate continuation input');
    }
    return {
      status: 'participant_failure',
      participantJobs: continuation.participantJobCount === 2 ? 2 : 1,
      continuationRef: 'review-continuation-000001',
      failureRef: 'review-continuation-000001/continuation.json',
      workflowOutcomeRef: 'workflow-outcome.json',
      failure,
    };
  }
  const decisionPath = resolve(root, 'review-continuation-000001/decision.json');
  const effectiveSolutionPath = await existingArtifactPath(root, 'review-continuation-000001/solution-revision/result.json');
  if (effectiveSolutionPath === null) throw new Error('completed continuation is missing its effective Solution artifact');
  return {
    status: 'completed',
    participantJobs: continuation.participantJobCount === 2 ? 2 : 1,
    continuationRef: 'review-continuation-000001',
    effectiveDecisionPath: decisionPath,
    effectiveDecision: await readDecision(decisionPath),
    effectiveSolutionPath,
    effectiveReviewPath: await existingArtifactPath(root, 'review-continuation-000001/reviewer-agent/review.json'),
    autonomousAuthoringAdmissionPath: await existingArtifactPath(root, 'review-continuation-000001/autonomous-authoring-admission.json'),
  };
}

export async function runCandidateReviewContinuation(
  input: RunCandidateReviewContinuationInput,
): Promise<CandidateReviewContinuationResult> {
  const baseDecision = await readDecision(input.baseDecisionPath);
  if (baseDecision.route !== 'DEFER_MORE_WORK_REQUESTED') {
    return { status: 'not_requested', participantJobs: 0, effectiveDecisionPath: input.baseDecisionPath };
  }
  const existing = await existingContinuation(input.candidateLaneRoot, input);
  if (existing) return existing;
  const packageValue = JSON.parse(await readFile(input.problemPackagePath, 'utf8')) as { source?: { runRef?: unknown } };
  const sourceRunRef = input.sourceRunRef ?? (typeof packageValue.source?.runRef === 'string' ? packageValue.source.runRef : '');
  if (!sourceRunRef) throw new Error('candidate continuation requires sourceRunRef');
  const continuationInput: RunReviewContinuationInput = {
    round: 1,
    repositoryRoot: resolve(input.repositoryRoot ?? process.cwd()),
    humanFollowupRoot: resolve(input.humanFollowupRoot ?? input.candidateLaneRoot),
    workflowInstanceRef: input.workflowInstanceRef ?? input.candidateRef,
    roundRoot: resolve(input.candidateLaneRoot),
    sourceRunRef,
    sourceFingerprintSha256: input.sourceFingerprintSha256,
    sourceProvenanceRoot: input.sourceProvenanceRoot,
    additionalWorkspaceArtifactRelativePaths: ['candidate-activation.json', 'problem-package.json'],
    autonomousAuthoringContractPacket: input.autonomousAuthoringContractPacket,
    participant: input.participant,
    retainHumanFollowupOnEscalate: false,
    dependencies: input.dependencies,
  };
  const result = await (input.dependencies?.runCandidateContinuation ?? runReviewContinuation)(continuationInput);
  if (result.status === 'participant_failure') {
    const failure = buildCandidateLaneFailureV2({
      candidateRef: input.candidateRef,
      hypothesisId: input.hypothesisId,
      sourceIndex: input.sourceIndex,
      stage: result.failureStage,
      actualParticipantJobs: result.participantJobs,
      failureOrigin: result.failure.origin,
      failureReason: result.failure.reason,
      participantErrorKind: result.failure.participantErrorKind,
      message: result.failure.message,
    });
    await writeCreateOnly(resolve(input.candidateLaneRoot, 'workflow-outcome.json'), failure);
    return {
      status: 'participant_failure',
      participantJobs: result.participantJobs,
      continuationRef: 'review-continuation-000001',
      failureRef: 'review-continuation-000001/continuation.json',
      workflowOutcomeRef: 'workflow-outcome.json',
      failure,
    };
  }
  return {
    status: 'completed',
    participantJobs: result.participantJobs,
    continuationRef: 'review-continuation-000001',
    effectiveDecisionPath: result.decisionPath,
    effectiveDecision: result.decision,
    effectiveSolutionPath: result.effectiveSolutionPath,
    effectiveReviewPath: result.effectiveReviewPath,
    autonomousAuthoringAdmissionPath: result.autonomousAuthoringAdmissionPath,
  };
}
