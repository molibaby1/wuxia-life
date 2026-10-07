import { lstat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import {
  BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
} from '../../../src/evolution/boundedFormalEventAuthoringContract';
import { HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT } from '../../../src/evolution/boundedFormalEventReferenceRequirement';
import {
  validateBoundedFormalEventProposalV2,
  validateBoundedFormalEventReviewAssessmentV2,
} from '../../../src/evolution/boundedFormalEventProposalContract';
import {
  referenceParticipantBindingLockSha256,
  resolveReferenceParticipantBindingFromLock,
  type ReferenceParticipantBindingLockV1,
} from '../operator/referenceParticipantBinding';
import {
  runStructuredParticipantExecution,
  type StructuredParticipantExecutionResult,
} from '../problemAgnosticSolution/runStructuredParticipantExecution';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import {
  consumeBoundedFormalEventParticipantGenerationManifest,
  validateFreshBoundedFormalEventParticipantGenerationManifest,
  type BoundedFormalEventParticipantGenerationManifestRefV1,
} from './boundedFormalEventParticipantGenerationAuthorization';
import {
  readBoundedFormalEventParticipantEvidence,
  renderBoundedFormalEventReviewPrompt,
  type BoundedFormalEventParticipantEvidenceV1,
} from './boundedFormalEventParticipantEvidence';
import type { BoundedFormalEventProposalParticipantOutput } from './runBoundedFormalEventProposalParticipant';

export interface BoundedFormalEventReviewParticipantInput {
  repositoryRoot: string;
  workspaceRoot: string;
  destinationRoot: string;
  invocationRef: string;
  bindingLock: ReferenceParticipantBindingLockV1;
  proposalParticipant: BoundedFormalEventProposalParticipantOutput;
  generationManifestRef: BoundedFormalEventParticipantGenerationManifestRefV1;
  evidence?: BoundedFormalEventParticipantEvidenceV1;
}

export interface BoundedFormalEventReviewParticipantOutput {
  ok: boolean;
  participantRef: string;
  invocationRef: string;
  bindingLockSha256: string;
  bindingLock: ReferenceParticipantBindingLockV1;
  generationManifestSha256: string;
  generationManifestConsumptionRef: string;
  promptSha256: string;
  requirementSha256: string;
  proposalSha256: string;
  review?: ReturnType<typeof validateBoundedFormalEventReviewAssessmentV2>;
  execution: StructuredParticipantExecutionResult<ReturnType<typeof validateBoundedFormalEventReviewAssessmentV2>>;
}

function participantRef(invocationRef: string): string {
  if (!invocationRef.trim() || invocationRef.length > 256 || /[\u0000-\u001f\u007f]/.test(invocationRef)) {
    throw new Error('Formal Event reviewer invocationRef is invalid');
  }
  return `bounded-formal-event-review:${invocationRef}`;
}

function assertIsolatedPath(repositoryRoot: string, candidateRoot: string, label: string): string {
  const repository = resolve(repositoryRoot);
  const candidate = resolve(candidateRoot);
  const path = relative(repository, candidate);
  if (path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path))) {
    throw new Error(`Formal Event reviewer ${label} must be outside the authoritative repository`);
  }
  return candidate;
}

function assertSeparateDestination(workspaceRoot: string, destinationRoot: string): string {
  const destination = resolve(destinationRoot);
  const path = relative(workspaceRoot, destination);
  if (path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path))) {
    throw new Error('Formal Event reviewer execution artifacts must be outside the Reviewer workspace');
  }
  return destination;
}

export async function runBoundedFormalEventReviewParticipant(
  input: BoundedFormalEventReviewParticipantInput,
  dependencies: {
    resolveBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
    executeStructured?: typeof runStructuredParticipantExecution;
    manifestDependencies?: Parameters<typeof validateFreshBoundedFormalEventParticipantGenerationManifest>[1];
    consumeManifest?: typeof consumeBoundedFormalEventParticipantGenerationManifest;
  } = {},
): Promise<BoundedFormalEventReviewParticipantOutput> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const workspaceRoot = assertIsolatedPath(repositoryRoot, input.workspaceRoot, 'workspace');
  const workspaceStat = await lstat(workspaceRoot);
  if (workspaceStat.isSymbolicLink() || !workspaceStat.isDirectory()) {
    throw new Error('Formal Event reviewer workspace must be a regular isolated directory');
  }
  const destinationRoot = assertSeparateDestination(workspaceRoot, input.destinationRoot);
  const evidence = input.evidence ?? await readBoundedFormalEventParticipantEvidence(repositoryRoot);
  if (!input.proposalParticipant.ok || !input.proposalParticipant.execution.ok || !input.proposalParticipant.proposal) {
    throw new Error('Formal Event Reviewer requires a validated Proposal Participant terminal result');
  }
  const proposal = validateBoundedFormalEventProposalV2(input.proposalParticipant.proposal, evidence.currentEventIds);
  if (canonicalJson(proposal.requirement) !== canonicalJson(HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT)) {
    throw new Error('Formal Event reviewer Requirement must exactly match the fixed Human-direct Requirement');
  }
  const ref = participantRef(input.invocationRef);
  if (ref === proposal.proposedBy) {
    throw new Error('Formal Event Reviewer must have a distinct invocation identity from the author');
  }
  const requirementSha256 = sha256Hex(canonicalJson(HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT));
  const proposalSha256 = sha256Hex(canonicalJson(proposal));
  const bindingLockSha256 = referenceParticipantBindingLockSha256(input.bindingLock);
  const resolveBindingFromLock = dependencies.resolveBindingFromLock ?? resolveReferenceParticipantBindingFromLock;
  await validateFreshBoundedFormalEventParticipantGenerationManifest({
    repositoryRoot,
    manifestRef: input.generationManifestRef,
    role: 'reviewer',
    invocationRef: input.invocationRef,
    bindingLock: input.bindingLock,
    evidence,
    proposalParticipant: input.proposalParticipant,
  }, dependencies.manifestDependencies ?? {
    resolveProposalBindingFromLock: resolveBindingFromLock,
    resolveReviewerBindingFromLock: resolveBindingFromLock,
  });
  const binding = await resolveBindingFromLock({
    repositoryRoot,
    lock: input.bindingLock,
  });
  const execute = dependencies.executeStructured ?? runStructuredParticipantExecution;
  const initialPrompt = renderBoundedFormalEventReviewPrompt({
    invocationRef: input.invocationRef,
    proposal,
    requirementSha256,
    proposalSha256,
    evidence,
  });
  const generationManifestConsumptionRef = await (dependencies.consumeManifest
    ?? consumeBoundedFormalEventParticipantGenerationManifest)({
    repositoryRoot,
    manifestRef: input.generationManifestRef,
    role: 'reviewer',
    invocationRef: input.invocationRef,
    bindingLockSha256,
  });
  const execution = await execute({
    invocationRef: input.invocationRef,
    role: 'reviewer',
    workspaceRoot,
    destinationRoot,
    initialPrompt,
    expectedRoleSchemaName: 'bounded-formal-event-review-assessment-v2',
    participant: binding.participant,
    retransmissionEnabled: true,
    validateSchema: value => validateBoundedFormalEventReviewAssessmentV2(value),
    validateAcceptedResult: async review => {
      if (review.contractId !== BOUNDED_FORMAL_EVENT_CONTRACT_ID
        || review.contractVersion !== BOUNDED_FORMAL_EVENT_CONTRACT_VERSION) {
        throw new Error('Formal Event review Contract identity changed after schema validation');
      }
      if (review.requirementSha256 !== requirementSha256 || review.proposalSha256 !== proposalSha256) {
        throw new Error('Formal Event review must bind the exact fixed Requirement and validated proposal SHA-256');
      }
      if (review.reviewerRef !== ref || review.reviewerRef === proposal.proposedBy) {
        throw new Error('Formal Event reviewerRef must match its unique invocation identity and differ from the author');
      }
    },
  });
  return {
    ok: execution.ok,
    participantRef: ref,
    invocationRef: input.invocationRef,
    bindingLockSha256,
    bindingLock: input.bindingLock,
    generationManifestSha256: input.generationManifestRef.manifestSha256,
    generationManifestConsumptionRef,
    promptSha256: sha256Hex(initialPrompt),
    requirementSha256,
    proposalSha256,
    ...(execution.ok ? { review: execution.value } : {}),
    execution,
  };
}
