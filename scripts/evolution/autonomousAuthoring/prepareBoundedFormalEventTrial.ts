import { isAbsolute, relative, resolve, sep } from 'node:path';
import { HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT } from '../../../src/evolution/boundedFormalEventReferenceRequirement';
import type { ReferenceParticipantBindingLockV1 } from '../operator/referenceParticipantBinding';
import { canonicalJson } from '../phase0/provenance';
import {
  evaluateBoundedFormalEventAdmission,
} from './evaluateBoundedFormalEventAdmission';
import {
  captureBoundedFormalEventRepositorySnapshot,
  buildBoundedFormalEventTrialAuthorizationCandidate,
  type BuildBoundedFormalEventTrialAuthorizationCandidateResult,
  type BoundedFormalEventRepositorySnapshotV1,
} from './boundedFormalEventTrialAuthorization';
import {
  readBoundedFormalEventParticipantEvidence,
} from './boundedFormalEventParticipantEvidence';
import type { BoundedFormalEventParticipantEvidenceV1 } from './boundedFormalEventParticipantEvidence';
import type { BoundedFormalEventGenerationAuthorizationApprovalV1 } from './boundedFormalEventParticipantGenerationAuthorization';
import {
  runBoundedFormalEventProposalParticipant,
  type BoundedFormalEventProposalParticipantOutput,
} from './runBoundedFormalEventProposalParticipant';
import {
  runBoundedFormalEventReviewParticipant,
  type BoundedFormalEventReviewParticipantOutput,
} from './runBoundedFormalEventReviewParticipant';

export interface PrepareBoundedFormalEventTrialInput {
  repositoryRoot: string;
  proposalWorkspaceRoot: string;
  proposalDestinationRoot: string;
  proposalInvocationRef: string;
  proposalBindingLock: ReferenceParticipantBindingLockV1;
  reviewerWorkspaceRoot: string;
  reviewerDestinationRoot: string;
  reviewerInvocationRef: string;
  reviewerBindingLock: ReferenceParticipantBindingLockV1;
  observedLifeStates: { trainingHabit: number; businessHabit: number };
  generationAuthorization: BoundedFormalEventGenerationAuthorizationApprovalV1;
  authorizationCandidatePath: string;
}

export type BoundedFormalEventPreparationOutcome =
  | {
      status: 'PREPARATION_FAILED';
      repository: BoundedFormalEventRepositorySnapshotV1;
      proposal: BoundedFormalEventProposalParticipantOutput;
      reviewer: null;
      admission: null;
      authorizationCandidate: null;
    }
  | {
      status: 'NOT_ELIGIBLE';
      repository: BoundedFormalEventRepositorySnapshotV1;
      proposal: BoundedFormalEventProposalParticipantOutput;
      reviewer: BoundedFormalEventReviewParticipantOutput;
      admission: Awaited<ReturnType<typeof evaluateBoundedFormalEventAdmission>>;
      authorizationCandidate: null;
    }
  | {
      status: 'ELIGIBLE';
      repository: BoundedFormalEventRepositorySnapshotV1;
      proposal: BoundedFormalEventProposalParticipantOutput;
      reviewer: BoundedFormalEventReviewParticipantOutput;
      admission: Awaited<ReturnType<typeof evaluateBoundedFormalEventAdmission>>;
      authorizationCandidate: BuildBoundedFormalEventTrialAuthorizationCandidateResult;
    };

function isWithin(parentRoot: string, candidatePath: string): boolean {
  const path = relative(parentRoot, candidatePath);
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

function assertDistinctParticipantRoots(input: PrepareBoundedFormalEventTrialInput): void {
  const roots = [
    ['proposal workspace', resolve(input.proposalWorkspaceRoot)],
    ['proposal observability destination', resolve(input.proposalDestinationRoot)],
    ['reviewer workspace', resolve(input.reviewerWorkspaceRoot)],
    ['reviewer observability destination', resolve(input.reviewerDestinationRoot)],
  ] as const;
  for (let index = 0; index < roots.length; index += 1) {
    const [name, root] = roots[index]!;
    for (const [otherName, otherRoot] of roots.slice(index + 1)) {
      if (root === otherRoot || isWithin(root, otherRoot) || isWithin(otherRoot, root)) {
        throw new Error(`Formal Event ${name} and ${otherName} must use separate roots`);
      }
    }
  }
  if (input.proposalInvocationRef === input.reviewerInvocationRef) {
    throw new Error('Formal Event proposal and Reviewer invocationRef values must differ');
  }
}

export async function prepareBoundedFormalEventTrial(
  input: PrepareBoundedFormalEventTrialInput,
  dependencies: {
    captureRepositorySnapshot?: typeof captureBoundedFormalEventRepositorySnapshot;
    readParticipantEvidence?: typeof readBoundedFormalEventParticipantEvidence;
    runProposal?: typeof runBoundedFormalEventProposalParticipant;
    runReviewer?: typeof runBoundedFormalEventReviewParticipant;
    evaluateAdmission?: typeof evaluateBoundedFormalEventAdmission;
    buildAuthorizationCandidate?: typeof buildBoundedFormalEventTrialAuthorizationCandidate;
    proposalDependencies?: Parameters<typeof runBoundedFormalEventProposalParticipant>[1];
    reviewerDependencies?: Parameters<typeof runBoundedFormalEventReviewParticipant>[1];
    candidateDependencies?: Parameters<typeof buildBoundedFormalEventTrialAuthorizationCandidate>[1];
  } = {},
): Promise<BoundedFormalEventPreparationOutcome> {
  const repositoryRoot = resolve(input.repositoryRoot);
  assertDistinctParticipantRoots(input);
  const captureSnapshot = dependencies.captureRepositorySnapshot ?? captureBoundedFormalEventRepositorySnapshot;
  const repository = await captureSnapshot(repositoryRoot);
  const evidence = await (dependencies.readParticipantEvidence ?? readBoundedFormalEventParticipantEvidence)(repositoryRoot);
  if (canonicalJson(await captureSnapshot(repositoryRoot)) !== canonicalJson(repository)) {
    throw new Error('Authoritative repository changed while Formal Event Participant evidence was captured');
  }
  const requirement = HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT;
  const proposal = await (dependencies.runProposal ?? runBoundedFormalEventProposalParticipant)({
    repositoryRoot,
    workspaceRoot: input.proposalWorkspaceRoot,
    destinationRoot: input.proposalDestinationRoot,
    invocationRef: input.proposalInvocationRef,
    bindingLock: input.proposalBindingLock,
    generationAuthorization: input.generationAuthorization,
    evidence,
  }, dependencies.proposalDependencies);
  if (!proposal.ok || !proposal.proposal) {
    return {
      status: 'PREPARATION_FAILED',
      repository,
      proposal,
      reviewer: null,
      admission: null,
      authorizationCandidate: null,
    };
  }
  const reviewer = await (dependencies.runReviewer ?? runBoundedFormalEventReviewParticipant)({
    repositoryRoot,
    workspaceRoot: input.reviewerWorkspaceRoot,
    destinationRoot: input.reviewerDestinationRoot,
    invocationRef: input.reviewerInvocationRef,
    bindingLock: input.reviewerBindingLock,
    proposalParticipant: proposal,
    generationAuthorization: input.generationAuthorization,
    evidence,
  }, dependencies.reviewerDependencies);
  if (!reviewer.ok || !reviewer.review) {
    const admission = await (dependencies.evaluateAdmission ?? evaluateBoundedFormalEventAdmission)({
      repositoryRoot,
      requirement,
      proposal: proposal.proposal,
      observedLifeStates: input.observedLifeStates,
    });
    return {
      status: 'NOT_ELIGIBLE',
      repository,
      proposal,
      reviewer,
      admission,
      authorizationCandidate: null,
    };
  }
  const admission = await (dependencies.evaluateAdmission ?? evaluateBoundedFormalEventAdmission)({
    repositoryRoot,
    requirement,
    proposal: proposal.proposal,
    review: reviewer.review,
    observedLifeStates: input.observedLifeStates,
  });
  if (admission.status !== 'ELIGIBLE') {
    return {
      status: 'NOT_ELIGIBLE',
      repository,
      proposal,
      reviewer,
      admission,
      authorizationCandidate: null,
    };
  }
  const authorizationCandidate = await (dependencies.buildAuthorizationCandidate ?? buildBoundedFormalEventTrialAuthorizationCandidate)({
    repositoryRoot,
    preparedAgainst: repository,
    participantEvidence: evidence,
    proposalParticipant: proposal,
    reviewerParticipant: reviewer,
    observedLifeStates: input.observedLifeStates,
    candidatePath: input.authorizationCandidatePath,
  }, dependencies.candidateDependencies);
  return {
    status: 'ELIGIBLE',
    repository,
    proposal,
    reviewer,
    admission: authorizationCandidate.admission,
    authorizationCandidate,
  };
}
