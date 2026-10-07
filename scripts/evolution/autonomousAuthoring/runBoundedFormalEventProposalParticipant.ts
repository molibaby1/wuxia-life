import { lstat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import {
  BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
} from '../../../src/evolution/boundedFormalEventAuthoringContract';
import { HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT } from '../../../src/evolution/boundedFormalEventReferenceRequirement';
import { validateBoundedFormalEventProposalV2 } from '../../../src/evolution/boundedFormalEventProposalContract';
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
  consumeBoundedFormalEventParticipantGenerationAuthorization,
  validateFreshBoundedFormalEventParticipantGenerationAuthorization,
  type BoundedFormalEventGenerationAuthorizationApprovalV1,
} from './boundedFormalEventParticipantGenerationAuthorization';
import {
  readBoundedFormalEventParticipantEvidence,
  renderBoundedFormalEventProposalPrompt,
  type BoundedFormalEventParticipantEvidenceV1,
} from './boundedFormalEventParticipantEvidence';

export interface BoundedFormalEventProposalParticipantInput {
  repositoryRoot: string;
  workspaceRoot: string;
  destinationRoot: string;
  invocationRef: string;
  bindingLock: ReferenceParticipantBindingLockV1;
  generationAuthorization: BoundedFormalEventGenerationAuthorizationApprovalV1;
  evidence?: BoundedFormalEventParticipantEvidenceV1;
}

export interface BoundedFormalEventProposalParticipantOutput {
  ok: boolean;
  participantRef: string;
  invocationRef: string;
  bindingLockSha256: string;
  bindingLock: ReferenceParticipantBindingLockV1;
  generationAuthorizationSha256: string;
  generationHumanAuthorizationRef: string;
  generationAuthorizationConsumptionRef: string;
  promptSha256: string;
  proposal?: ReturnType<typeof validateBoundedFormalEventProposalV2>;
  execution: StructuredParticipantExecutionResult<ReturnType<typeof validateBoundedFormalEventProposalV2>>;
}

function participantRef(invocationRef: string): string {
  if (!invocationRef.trim() || invocationRef.length > 256 || /[\u0000-\u001f\u007f]/.test(invocationRef)) {
    throw new Error('Formal Event proposal invocationRef is invalid');
  }
  return `bounded-formal-event-proposal:${invocationRef}`;
}

function assertIsolatedWorkspace(repositoryRoot: string, workspaceRoot: string): string {
  const repository = resolve(repositoryRoot);
  const workspace = resolve(workspaceRoot);
  const path = relative(repository, workspace);
  if (path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path))) {
    throw new Error('Formal Event proposal Participant workspace must be outside the authoritative repository');
  }
  return workspace;
}

function assertSeparateDestination(workspaceRoot: string, destinationRoot: string): string {
  const destination = resolve(destinationRoot);
  const path = relative(workspaceRoot, destination);
  if (path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path))) {
    throw new Error('Formal Event proposal execution artifacts must be outside the Participant workspace');
  }
  return destination;
}

export async function runBoundedFormalEventProposalParticipant(
  input: BoundedFormalEventProposalParticipantInput,
  dependencies: {
    resolveBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
    executeStructured?: typeof runStructuredParticipantExecution;
    authorizationDependencies?: Parameters<typeof validateFreshBoundedFormalEventParticipantGenerationAuthorization>[1];
    consumeAuthorization?: typeof consumeBoundedFormalEventParticipantGenerationAuthorization;
  } = {},
): Promise<BoundedFormalEventProposalParticipantOutput> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const workspaceRoot = assertIsolatedWorkspace(repositoryRoot, input.workspaceRoot);
  const stat = await lstat(workspaceRoot);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error('Formal Event proposal Participant workspace must be a regular isolated directory');
  }
  const destinationRoot = assertSeparateDestination(workspaceRoot, input.destinationRoot);
  const evidence = input.evidence ?? await readBoundedFormalEventParticipantEvidence(repositoryRoot);
  const ref = participantRef(input.invocationRef);
  const bindingLockSha256 = referenceParticipantBindingLockSha256(input.bindingLock);
  const resolveBindingFromLock = dependencies.resolveBindingFromLock ?? resolveReferenceParticipantBindingFromLock;
  await validateFreshBoundedFormalEventParticipantGenerationAuthorization({
    repositoryRoot,
    approval: input.generationAuthorization,
    role: 'proposal',
    invocationRef: input.invocationRef,
    bindingLock: input.bindingLock,
    evidence,
  }, dependencies.authorizationDependencies ?? {
    resolveProposalBindingFromLock: resolveBindingFromLock,
    resolveReviewerBindingFromLock: resolveBindingFromLock,
  });
  const binding = await resolveBindingFromLock({
    repositoryRoot,
    lock: input.bindingLock,
  });
  const execute = dependencies.executeStructured ?? runStructuredParticipantExecution;
  const initialPrompt = renderBoundedFormalEventProposalPrompt({ invocationRef: input.invocationRef, evidence });
  const generationAuthorizationConsumptionRef = await (dependencies.consumeAuthorization
    ?? consumeBoundedFormalEventParticipantGenerationAuthorization)({
    repositoryRoot,
    authorizationCandidatePath: input.generationAuthorization.authorizationCandidatePath,
    generationAuthorizationSha256: input.generationAuthorization.humanApprovedSha256,
    humanAuthorizationRef: input.generationAuthorization.humanAuthorizationRef,
    role: 'proposal',
    invocationRef: input.invocationRef,
    bindingLockSha256,
  });
  const execution = await execute({
    invocationRef: input.invocationRef,
    role: 'solution',
    workspaceRoot,
    destinationRoot,
    initialPrompt,
    expectedRoleSchemaName: 'bounded-formal-event-proposal-v2',
    participant: binding.participant,
    retransmissionEnabled: true,
    validateSchema: value => validateBoundedFormalEventProposalV2(value, evidence.currentEventIds),
    validateAcceptedResult: async proposal => {
      if (canonicalJson(proposal.requirement) !== canonicalJson(HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT)) {
        throw new Error('Formal Event proposal Requirement must exactly match the fixed Human-direct Requirement');
      }
      if (proposal.contractId !== BOUNDED_FORMAL_EVENT_CONTRACT_ID
        || proposal.contractVersion !== BOUNDED_FORMAL_EVENT_CONTRACT_VERSION) {
        throw new Error('Formal Event proposal Contract identity changed after schema validation');
      }
      if (proposal.proposedBy !== ref) {
        throw new Error('Formal Event proposal proposedBy must match its unique Host invocation identity');
      }
    },
  });
  return {
    ok: execution.ok,
    participantRef: ref,
    invocationRef: input.invocationRef,
    bindingLockSha256,
    bindingLock: input.bindingLock,
    generationAuthorizationSha256: input.generationAuthorization.humanApprovedSha256,
    generationHumanAuthorizationRef: input.generationAuthorization.humanAuthorizationRef,
    generationAuthorizationConsumptionRef,
    promptSha256: sha256Hex(initialPrompt),
    ...(execution.ok ? { proposal: execution.value } : {}),
    execution,
  };
}
