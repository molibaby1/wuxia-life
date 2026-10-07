import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT } from '../../../src/evolution/boundedFormalEventReferenceRequirement';
import type { ReferenceParticipantBindingLockV1 } from '../operator/referenceParticipantBinding';
import { canonicalJson } from '../phase0/provenance';
import {
  evaluateBoundedFormalEventAdmission,
} from './evaluateBoundedFormalEventAdmission';
import {
  captureBoundedFormalEventRepositorySnapshot,
  type BoundedFormalEventRepositorySnapshotV1,
} from './boundedFormalEventTrialAuthorization';
import {
  readBoundedFormalEventParticipantEvidence,
} from './boundedFormalEventParticipantEvidence';
import type { BoundedFormalEventParticipantEvidenceV1 } from './boundedFormalEventParticipantEvidence';
import {
  buildBoundedFormalEventParticipantGenerationManifest,
  type BuildBoundedFormalEventParticipantGenerationManifestResult,
} from './boundedFormalEventParticipantGenerationAuthorization';
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
  preflightManifestPath: string;
  executionManifestPath: string;
}

export type BoundedFormalEventPreparationOutcome =
  | {
      status: 'PREPARATION_FAILED';
      repository: BoundedFormalEventRepositorySnapshotV1;
      proposal: BoundedFormalEventProposalParticipantOutput;
      reviewer: null;
      admission: null;
      generationManifest: BuildBoundedFormalEventParticipantGenerationManifestResult;
    }
  | {
      status: 'NOT_ELIGIBLE';
      repository: BoundedFormalEventRepositorySnapshotV1;
      proposal: BoundedFormalEventProposalParticipantOutput;
      reviewer: BoundedFormalEventReviewParticipantOutput;
      admission: Awaited<ReturnType<typeof evaluateBoundedFormalEventAdmission>>;
      generationManifest: BuildBoundedFormalEventParticipantGenerationManifestResult;
    }
  | {
      status: 'ELIGIBLE';
      repository: BoundedFormalEventRepositorySnapshotV1;
      proposal: BoundedFormalEventProposalParticipantOutput;
      reviewer: BoundedFormalEventReviewParticipantOutput;
      admission: Awaited<ReturnType<typeof evaluateBoundedFormalEventAdmission>>;
      generationManifest: BuildBoundedFormalEventParticipantGenerationManifestResult;
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
    buildGenerationManifest?: typeof buildBoundedFormalEventParticipantGenerationManifest;
    proposalDependencies?: Parameters<typeof runBoundedFormalEventProposalParticipant>[1];
    reviewerDependencies?: Parameters<typeof runBoundedFormalEventReviewParticipant>[1];
    manifestDependencies?: Parameters<typeof buildBoundedFormalEventParticipantGenerationManifest>[1];
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
  const readEvidence = dependencies.readParticipantEvidence ?? readBoundedFormalEventParticipantEvidence;
  const generationManifest = await (dependencies.buildGenerationManifest ?? buildBoundedFormalEventParticipantGenerationManifest)({
    repositoryRoot,
    proposalInvocationRef: input.proposalInvocationRef,
    proposalBindingLock: input.proposalBindingLock,
    reviewerInvocationRef: input.reviewerInvocationRef,
    reviewerBindingLock: input.reviewerBindingLock,
    manifestPath: input.preflightManifestPath,
  }, {
    captureRepositorySnapshot: dependencies.manifestDependencies?.captureRepositorySnapshot ?? captureSnapshot,
    readParticipantEvidence: dependencies.manifestDependencies?.readParticipantEvidence ?? readEvidence,
    ...dependencies.manifestDependencies,
  });
  const generationInput = JSON.parse(await readFile(generationManifest.generationInputPath, 'utf8')) as {
    participantEvidence?: unknown;
  };
  if (canonicalJson(generationManifest.manifest.repository) !== canonicalJson(repository)
    || canonicalJson(generationInput.participantEvidence) !== canonicalJson(evidence)) {
    throw new Error('Authoritative repository or evidence changed while the Formal Event preflight manifest was built');
  }
  const requirement = HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT;
  const proposal = await (dependencies.runProposal ?? runBoundedFormalEventProposalParticipant)({
    repositoryRoot,
    workspaceRoot: input.proposalWorkspaceRoot,
    destinationRoot: input.proposalDestinationRoot,
    invocationRef: input.proposalInvocationRef,
    bindingLock: input.proposalBindingLock,
    generationManifestRef: generationManifest.manifestRef,
    evidence,
  }, dependencies.proposalDependencies);
  if (!proposal.ok || !proposal.proposal) {
    return {
      status: 'PREPARATION_FAILED',
      repository,
      proposal,
      reviewer: null,
      admission: null,
      generationManifest,
    };
  }
  const reviewer = await (dependencies.runReviewer ?? runBoundedFormalEventReviewParticipant)({
    repositoryRoot,
    workspaceRoot: input.reviewerWorkspaceRoot,
    destinationRoot: input.reviewerDestinationRoot,
    invocationRef: input.reviewerInvocationRef,
    bindingLock: input.reviewerBindingLock,
    proposalParticipant: proposal,
    generationManifestRef: generationManifest.manifestRef,
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
      generationManifest,
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
      generationManifest,
    };
  }
  return {
    status: 'ELIGIBLE',
    repository,
    proposal,
    reviewer,
    admission,
    generationManifest,
  };
}
