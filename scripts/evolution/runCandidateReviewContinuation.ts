import { lstat, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateSolutionDecision, type SolutionDecisionV1 } from '../../src/evolution/solutionDecisionContract';
import {
  runReviewContinuation,
  type ReviewContinuationDependencies,
  type ReviewContinuationResult,
  type RunReviewContinuationInput,
} from './problemAgnosticSolution/runReviewContinuation';
import type { WorkspaceAgentParticipantOptions } from './problemAgnosticSolution/agentParticipant';

export interface RunCandidateReviewContinuationInput {
  candidateRef: string;
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
  }
  | {
    status: 'participant_failure';
    participantJobs: 1 | 2;
    continuationRef: 'review-continuation-000001';
    failureRef: string;
  };

async function readDecision(path: string): Promise<SolutionDecisionV1> {
  return validateSolutionDecision(JSON.parse(await readFile(path, 'utf8')) as unknown);
}

async function existingContinuation(root: string): Promise<CandidateReviewContinuationResult | null> {
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
    return {
      status: 'participant_failure',
      participantJobs: continuation.participantJobCount === 2 ? 2 : 1,
      continuationRef: 'review-continuation-000001',
      failureRef: 'review-continuation-000001/continuation.json',
    };
  }
  const decisionPath = resolve(root, 'review-continuation-000001/decision.json');
  return {
    status: 'completed',
    participantJobs: continuation.participantJobCount === 2 ? 2 : 1,
    continuationRef: 'review-continuation-000001',
    effectiveDecisionPath: decisionPath,
    effectiveDecision: await readDecision(decisionPath),
  };
}

export async function runCandidateReviewContinuation(
  input: RunCandidateReviewContinuationInput,
): Promise<CandidateReviewContinuationResult> {
  const baseDecision = await readDecision(input.baseDecisionPath);
  if (baseDecision.route !== 'DEFER_MORE_WORK_REQUESTED') {
    return { status: 'not_requested', participantJobs: 0, effectiveDecisionPath: input.baseDecisionPath };
  }
  const existing = await existingContinuation(input.candidateLaneRoot);
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
    participant: input.participant,
    retainHumanFollowupOnEscalate: false,
    dependencies: input.dependencies,
  };
  const result = await (input.dependencies?.runCandidateContinuation ?? runReviewContinuation)(continuationInput);
  if (result.status === 'participant_failure') {
    return {
      status: 'participant_failure',
      participantJobs: result.participantJobs,
      continuationRef: 'review-continuation-000001',
      failureRef: 'review-continuation-000001/continuation.json',
    };
  }
  return {
    status: 'completed',
    participantJobs: result.participantJobs,
    continuationRef: 'review-continuation-000001',
    effectiveDecisionPath: result.decisionPath,
    effectiveDecision: result.decision,
  };
}
