import { lstat, mkdir, open, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import {
  BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
} from '../../../src/evolution/boundedFormalEventAuthoringContract';
import { validateBoundedFormalEventProposalV2 } from '../../../src/evolution/boundedFormalEventProposalContract';
import { HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT } from '../../../src/evolution/boundedFormalEventReferenceRequirement';
import { validateAuthoringRequirementV1 } from '../../../src/evolution/authoringRequirementContract';
import {
  referenceParticipantBindingLockSha256,
  resolveReferenceParticipantBindingFromLock,
  type ReferenceParticipantBindingLockV1,
} from '../operator/referenceParticipantBinding';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import {
  assertBoundedFormalEventAuthorizationArtifactPath,
  captureBoundedFormalEventRepositorySnapshot,
  type BoundedFormalEventRepositorySnapshotV1,
} from './boundedFormalEventTrialAuthorization';
import {
  readBoundedFormalEventParticipantEvidence,
  renderBoundedFormalEventProposalPrompt,
  renderBoundedFormalEventReviewPromptTemplate,
  type BoundedFormalEventParticipantEvidenceV1,
} from './boundedFormalEventParticipantEvidence';
import type { BoundedFormalEventProposalParticipantOutput } from './runBoundedFormalEventProposalParticipant';

export const BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_INPUT_FILENAME = 'bounded-formal-event-participant-generation-input-v1.json' as const;
export const BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_CANDIDATE_SCHEMA = 'bounded-formal-event-participant-generation-authorization-candidate-v1' as const;
export const BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_MANIFEST_SCHEMA = 'bounded-formal-event-participant-generation-preflight-manifest-v1' as const;

export interface BoundedFormalEventParticipantGenerationInputV1 {
  schemaVersion: 'bounded-formal-event-participant-generation-input-v1';
  repository: BoundedFormalEventRepositorySnapshotV1;
  requirement: ReturnType<typeof validateAuthoringRequirementV1>;
  requirementSha256: string;
  contract: { contractId: typeof BOUNDED_FORMAL_EVENT_CONTRACT_ID; contractVersion: typeof BOUNDED_FORMAL_EVENT_CONTRACT_VERSION };
  participantEvidence: BoundedFormalEventParticipantEvidenceV1;
  participantEvidenceSha256: string;
  proposalParticipant: {
    invocationRef: string;
    participantRef: string;
    transportRole: 'solution';
    expectedRoleSchemaName: 'bounded-formal-event-proposal-v2';
    bindingLock: ReferenceParticipantBindingLockV1;
    bindingLockSha256: string;
    promptSha256: string;
  };
  reviewerParticipant: {
    invocationRef: string;
    participantRef: string;
    transportRole: 'reviewer';
    expectedRoleSchemaName: 'bounded-formal-event-review-assessment-v2';
    bindingLock: ReferenceParticipantBindingLockV1;
    bindingLockSha256: string;
    promptTemplateSha256: string;
    proposalInputRule: 'exact validated ProposalV2 from the authorized proposal invocation';
  };
  budget: {
    allowedParticipantJobs: 4;
    proposalMaximumJobs: 2;
    reviewerMaximumJobs: 2;
  };
}

export interface BoundedFormalEventParticipantGenerationAuthorizationCandidateV1 {
  schemaVersion: typeof BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_CANDIDATE_SCHEMA;
  approvalState: 'AWAITING_HUMAN_EXACT_SHA256_APPROVAL';
  generationInputRef: typeof BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_INPUT_FILENAME;
  generationInputSha256: string;
  repository: BoundedFormalEventRepositorySnapshotV1;
  requirementSha256: string;
  contract: { contractId: typeof BOUNDED_FORMAL_EVENT_CONTRACT_ID; contractVersion: typeof BOUNDED_FORMAL_EVENT_CONTRACT_VERSION };
  participantBindingLockSha256: { proposal: string; reviewer: string };
  proposalInvocationRef: string;
  proposalPromptSha256: string;
  reviewerInvocationRef: string;
  reviewerPromptTemplateSha256: string;
  budget: BoundedFormalEventParticipantGenerationInputV1['budget'];
}

export interface BuildBoundedFormalEventParticipantGenerationAuthorizationCandidateInput {
  repositoryRoot: string;
  proposalInvocationRef: string;
  proposalBindingLock: ReferenceParticipantBindingLockV1;
  reviewerInvocationRef: string;
  reviewerBindingLock: ReferenceParticipantBindingLockV1;
  candidatePath: string;
}

export interface BuildBoundedFormalEventParticipantGenerationAuthorizationCandidateResult {
  candidate: BoundedFormalEventParticipantGenerationAuthorizationCandidateV1;
  canonicalBytes: Buffer;
  canonicalSha256: string;
  generationInputPath: string;
  generationInputSha256: string;
}

export interface BoundedFormalEventParticipantGenerationManifestRefV1 {
  manifestPath: string;
  manifestSha256: string;
}

export interface BoundedFormalEventParticipantGenerationManifestV1 {
  schemaVersion: typeof BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_MANIFEST_SCHEMA;
  generationInputRef: typeof BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_INPUT_FILENAME;
  generationInputSha256: string;
  repository: BoundedFormalEventRepositorySnapshotV1;
  requirementSha256: string;
  contract: { contractId: typeof BOUNDED_FORMAL_EVENT_CONTRACT_ID; contractVersion: typeof BOUNDED_FORMAL_EVENT_CONTRACT_VERSION };
  participantBindingLockSha256: { proposal: string; reviewer: string };
  proposalInvocationRef: string;
  proposalPromptSha256: string;
  reviewerInvocationRef: string;
  reviewerPromptTemplateSha256: string;
  budget: BoundedFormalEventParticipantGenerationInputV1['budget'];
}

export interface BuildBoundedFormalEventParticipantGenerationManifestInput {
  repositoryRoot: string;
  proposalInvocationRef: string;
  proposalBindingLock: ReferenceParticipantBindingLockV1;
  reviewerInvocationRef: string;
  reviewerBindingLock: ReferenceParticipantBindingLockV1;
  manifestPath: string;
}

export interface BuildBoundedFormalEventParticipantGenerationManifestResult {
  manifest: BoundedFormalEventParticipantGenerationManifestV1;
  manifestRef: BoundedFormalEventParticipantGenerationManifestRefV1;
  canonicalBytes: Buffer;
  canonicalSha256: string;
  generationInputPath: string;
  generationInputSha256: string;
}

export interface BoundedFormalEventGenerationAuthorizationApprovalV1 {
  authorizationCandidatePath: string;
  humanApprovedSha256: string;
  humanAuthorizationRef: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertExactKeys(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  if (Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) {
    throw new Error(`${label} must contain exactly: ${keys.join(', ')}`);
  }
}

function assertSha256(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${label} must be a lowercase SHA-256`);
  }
}

function validateInvocationRef(value: string, label: string): string {
  if (!value.trim() || value.length > 256 || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`${label} is invalid`);
  }
  return value;
}

function participantRef(role: 'proposal' | 'reviewer', invocationRef: string): string {
  return role === 'proposal'
    ? `bounded-formal-event-proposal:${invocationRef}`
    : `bounded-formal-event-review:${invocationRef}`;
}

function generationInput(input: {
  repository: BoundedFormalEventRepositorySnapshotV1;
  evidence: BoundedFormalEventParticipantEvidenceV1;
  proposalInvocationRef: string;
  proposalBindingLock: ReferenceParticipantBindingLockV1;
  reviewerInvocationRef: string;
  reviewerBindingLock: ReferenceParticipantBindingLockV1;
}): BoundedFormalEventParticipantGenerationInputV1 {
  const requirement = validateAuthoringRequirementV1(HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT);
  const requirementSha256 = sha256Hex(canonicalJson(requirement));
  return {
    schemaVersion: 'bounded-formal-event-participant-generation-input-v1',
    repository: input.repository,
    requirement,
    requirementSha256,
    contract: { contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID, contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION },
    participantEvidence: input.evidence,
    participantEvidenceSha256: sha256Hex(canonicalJson(input.evidence)),
    proposalParticipant: {
      invocationRef: input.proposalInvocationRef,
      participantRef: participantRef('proposal', input.proposalInvocationRef),
      transportRole: 'solution',
      expectedRoleSchemaName: 'bounded-formal-event-proposal-v2',
      bindingLock: input.proposalBindingLock,
      bindingLockSha256: referenceParticipantBindingLockSha256(input.proposalBindingLock),
      promptSha256: sha256Hex(renderBoundedFormalEventProposalPrompt({
        invocationRef: input.proposalInvocationRef,
        evidence: input.evidence,
      })),
    },
    reviewerParticipant: {
      invocationRef: input.reviewerInvocationRef,
      participantRef: participantRef('reviewer', input.reviewerInvocationRef),
      transportRole: 'reviewer',
      expectedRoleSchemaName: 'bounded-formal-event-review-assessment-v2',
      bindingLock: input.reviewerBindingLock,
      bindingLockSha256: referenceParticipantBindingLockSha256(input.reviewerBindingLock),
      promptTemplateSha256: sha256Hex(renderBoundedFormalEventReviewPromptTemplate({
        invocationRef: input.reviewerInvocationRef,
        evidence: input.evidence,
      })),
      proposalInputRule: 'exact validated ProposalV2 from the same preflight-manifest proposal invocation',
    },
    budget: { allowedParticipantJobs: 4, proposalMaximumJobs: 2, reviewerMaximumJobs: 2 },
  };
}

function buildCandidate(
  input: BoundedFormalEventParticipantGenerationInputV1,
  generationInputSha256: string,
): BoundedFormalEventParticipantGenerationAuthorizationCandidateV1 {
  return {
    schemaVersion: BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_CANDIDATE_SCHEMA,
    approvalState: 'AWAITING_HUMAN_EXACT_SHA256_APPROVAL',
    generationInputRef: BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_INPUT_FILENAME,
    generationInputSha256,
    repository: input.repository,
    requirementSha256: input.requirementSha256,
    contract: input.contract,
    participantBindingLockSha256: {
      proposal: input.proposalParticipant.bindingLockSha256,
      reviewer: input.reviewerParticipant.bindingLockSha256,
    },
    proposalInvocationRef: input.proposalParticipant.invocationRef,
    proposalPromptSha256: input.proposalParticipant.promptSha256,
    reviewerInvocationRef: input.reviewerParticipant.invocationRef,
    reviewerPromptTemplateSha256: input.reviewerParticipant.promptTemplateSha256,
    budget: input.budget,
  };
}

function buildManifest(
  input: BoundedFormalEventParticipantGenerationInputV1,
  generationInputSha256: string,
): BoundedFormalEventParticipantGenerationManifestV1 {
  return {
    schemaVersion: BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_MANIFEST_SCHEMA,
    generationInputRef: BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_INPUT_FILENAME,
    generationInputSha256,
    repository: input.repository,
    requirementSha256: input.requirementSha256,
    contract: input.contract,
    participantBindingLockSha256: {
      proposal: input.proposalParticipant.bindingLockSha256,
      reviewer: input.reviewerParticipant.bindingLockSha256,
    },
    proposalInvocationRef: input.proposalParticipant.invocationRef,
    proposalPromptSha256: input.proposalParticipant.promptSha256,
    reviewerInvocationRef: input.reviewerParticipant.invocationRef,
    reviewerPromptTemplateSha256: input.reviewerParticipant.promptTemplateSha256,
    budget: input.budget,
  };
}

export async function buildBoundedFormalEventParticipantGenerationAuthorizationCandidate(
  input: BuildBoundedFormalEventParticipantGenerationAuthorizationCandidateInput,
  dependencies: {
    captureRepositorySnapshot?: typeof captureBoundedFormalEventRepositorySnapshot;
    readParticipantEvidence?: typeof readBoundedFormalEventParticipantEvidence;
    resolveProposalBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
    resolveReviewerBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
  } = {},
): Promise<BuildBoundedFormalEventParticipantGenerationAuthorizationCandidateResult> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const proposalInvocationRef = validateInvocationRef(input.proposalInvocationRef, 'Formal Event proposal invocationRef');
  const reviewerInvocationRef = validateInvocationRef(input.reviewerInvocationRef, 'Formal Event Reviewer invocationRef');
  if (proposalInvocationRef === reviewerInvocationRef) {
    throw new Error('Formal Event Proposal and Reviewer invocationRef values must differ');
  }
  const candidatePath = assertBoundedFormalEventAuthorizationArtifactPath(
    repositoryRoot,
    input.candidatePath,
    'Formal Event Gate A candidate',
  );
  const generationInputPath = join(dirname(candidatePath), BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_INPUT_FILENAME);
  if (basename(candidatePath) === BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_INPUT_FILENAME) {
    throw new Error('Gate A authorization candidate path must differ from its generation input packet path');
  }

  const captureSnapshot = dependencies.captureRepositorySnapshot ?? captureBoundedFormalEventRepositorySnapshot;
  const repository = await captureSnapshot(repositoryRoot);
  const evidence = await (dependencies.readParticipantEvidence ?? readBoundedFormalEventParticipantEvidence)(repositoryRoot);
  if (canonicalJson(await captureSnapshot(repositoryRoot)) !== canonicalJson(repository)) {
    throw new Error('Authoritative repository changed while Gate A Participant inputs were captured');
  }
  const generation = generationInput({
    repository,
    evidence,
    proposalInvocationRef,
    proposalBindingLock: input.proposalBindingLock,
    reviewerInvocationRef,
    reviewerBindingLock: input.reviewerBindingLock,
  });
  await (dependencies.resolveProposalBindingFromLock ?? resolveReferenceParticipantBindingFromLock)({
    repositoryRoot,
    lock: input.proposalBindingLock,
  });
  await (dependencies.resolveReviewerBindingFromLock ?? resolveReferenceParticipantBindingFromLock)({
    repositoryRoot,
    lock: input.reviewerBindingLock,
  });
  if (canonicalJson(await captureSnapshot(repositoryRoot)) !== canonicalJson(repository)) {
    throw new Error('Authoritative repository changed while Gate A binding locks were resolved');
  }

  const generationBytes = Buffer.from(canonicalJson(generation), 'utf8');
  const generationInputSha256 = sha256Hex(generationBytes);
  const candidate = buildCandidate(generation, generationInputSha256);
  const canonicalBytes = Buffer.from(canonicalJson(candidate), 'utf8');
  const canonicalSha256 = sha256Hex(canonicalBytes);
  await mkdir(dirname(generationInputPath), { recursive: true });
  await writeFile(generationInputPath, generationBytes, { flag: 'wx' });
  await writeFile(candidatePath, canonicalBytes, { flag: 'wx' });
  return { candidate, canonicalBytes, canonicalSha256, generationInputPath, generationInputSha256 };
}

async function readCanonicalRegularFile(path: string, label: string): Promise<Buffer> {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`${label} must be an existing regular file`);
  return readFile(path);
}

function validateGenerationInput(value: unknown): BoundedFormalEventParticipantGenerationInputV1 {
  if (!isRecord(value)) throw new Error('Gate A generation input must be an object');
  assertExactKeys(value, [
    'schemaVersion', 'repository', 'requirement', 'requirementSha256', 'contract', 'participantEvidence',
    'participantEvidenceSha256', 'proposalParticipant', 'reviewerParticipant', 'budget',
  ], 'Gate A generation input');
  if (value.schemaVersion !== 'bounded-formal-event-participant-generation-input-v1') {
    throw new Error('Gate A generation input schemaVersion is invalid');
  }
  if (!isRecord(value.repository)
    || value.repository.branch !== 'dev'
    || typeof value.repository.commitSha !== 'string'
    || !/^[a-f0-9]{40,64}$/.test(value.repository.commitSha)) {
    throw new Error('Gate A repository snapshot must identify a dev commit');
  }
  assertSha256(value.repository.authoritativeFingerprintSha256, 'Gate A repository fingerprint');
  const requirement = validateAuthoringRequirementV1(value.requirement);
  const requirementSha256 = sha256Hex(canonicalJson(requirement));
  if (canonicalJson(requirement) !== canonicalJson(HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT)
    || value.requirementSha256 !== requirementSha256) {
    throw new Error('Gate A Requirement is not the fixed Human-direct Requirement');
  }
  const contract = { contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID, contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION };
  if (canonicalJson(value.contract) !== canonicalJson(contract)) throw new Error('Gate A Contract identity is invalid');
  assertSha256(value.participantEvidenceSha256, 'Gate A participant evidence digest');
  if (!isRecord(value.participantEvidence)
    || value.participantEvidenceSha256 !== sha256Hex(canonicalJson(value.participantEvidence))) {
    throw new Error('Gate A participant evidence digest is invalid');
  }
  const evidence = value.participantEvidence as unknown as BoundedFormalEventParticipantEvidenceV1;
  if (!isRecord(value.proposalParticipant) || !isRecord(value.reviewerParticipant)) {
    throw new Error('Gate A role-specific Participant inputs are invalid');
  }
  assertExactKeys(value.proposalParticipant, [
    'invocationRef', 'participantRef', 'transportRole', 'expectedRoleSchemaName', 'bindingLock', 'bindingLockSha256', 'promptSha256',
  ], 'Gate A Proposal input');
  assertExactKeys(value.reviewerParticipant, [
    'invocationRef', 'participantRef', 'transportRole', 'expectedRoleSchemaName', 'bindingLock', 'bindingLockSha256',
    'promptTemplateSha256', 'proposalInputRule',
  ], 'Gate A Reviewer input');
  const proposalInvocationRef = validateInvocationRef(String(value.proposalParticipant.invocationRef), 'Gate A proposal invocationRef');
  const reviewerInvocationRef = validateInvocationRef(String(value.reviewerParticipant.invocationRef), 'Gate A reviewer invocationRef');
  if (proposalInvocationRef === reviewerInvocationRef
    || value.proposalParticipant.participantRef !== participantRef('proposal', proposalInvocationRef)
    || value.reviewerParticipant.participantRef !== participantRef('reviewer', reviewerInvocationRef)
    || value.proposalParticipant.transportRole !== 'solution'
    || value.proposalParticipant.expectedRoleSchemaName !== 'bounded-formal-event-proposal-v2'
    || value.reviewerParticipant.transportRole !== 'reviewer'
    || value.reviewerParticipant.expectedRoleSchemaName !== 'bounded-formal-event-review-assessment-v2'
    || value.reviewerParticipant.proposalInputRule !== 'exact validated ProposalV2 from the same preflight-manifest proposal invocation'
    || !isRecord(value.proposalParticipant.bindingLock)
    || !isRecord(value.reviewerParticipant.bindingLock)) {
    throw new Error('Gate A role identity or output Contract is invalid');
  }
  assertSha256(value.proposalParticipant.bindingLockSha256, 'Gate A proposal binding lock digest');
  assertSha256(value.proposalParticipant.promptSha256, 'Gate A proposal prompt digest');
  assertSha256(value.reviewerParticipant.bindingLockSha256, 'Gate A reviewer binding lock digest');
  assertSha256(value.reviewerParticipant.promptTemplateSha256, 'Gate A reviewer prompt-template digest');
  if (referenceParticipantBindingLockSha256(value.proposalParticipant.bindingLock as unknown as ReferenceParticipantBindingLockV1)
    !== value.proposalParticipant.bindingLockSha256
    || referenceParticipantBindingLockSha256(value.reviewerParticipant.bindingLock as unknown as ReferenceParticipantBindingLockV1)
    !== value.reviewerParticipant.bindingLockSha256) {
    throw new Error('Gate A role-specific binding lock digest does not match its locked data');
  }
  const expectedBudget = { allowedParticipantJobs: 4, proposalMaximumJobs: 2, reviewerMaximumJobs: 2 };
  if (canonicalJson(value.budget) !== canonicalJson(expectedBudget)) throw new Error('Gate A Participant job budget is invalid');
  const expectedGeneration = generationInput({
    repository: value.repository as unknown as BoundedFormalEventRepositorySnapshotV1,
    evidence,
    proposalInvocationRef,
    proposalBindingLock: value.proposalParticipant.bindingLock as unknown as ReferenceParticipantBindingLockV1,
    reviewerInvocationRef,
    reviewerBindingLock: value.reviewerParticipant.bindingLock as unknown as ReferenceParticipantBindingLockV1,
  });
  if (canonicalJson(expectedGeneration) !== canonicalJson(value)) {
    const changedFields = Object.keys(expectedGeneration).filter(key => canonicalJson(expectedGeneration[key]) !== canonicalJson(value[key]));
    const nestedFields = changedFields.flatMap(key => {
      const expected = expectedGeneration[key];
      const actual = value[key];
      if (!isRecord(expected) || !isRecord(actual)) return [key];
      return Object.keys(expected).filter(field => canonicalJson(expected[field]) !== canonicalJson(actual[field])).map(field => `${key}.${field}`);
    });
    throw new Error(`Gate A prompt, identity, lock, or budget provenance changed: ${nestedFields.join(', ')}`);
  }
  return value as unknown as BoundedFormalEventParticipantGenerationInputV1;
}

export async function validateFreshBoundedFormalEventParticipantGenerationAuthorization(input: {
  repositoryRoot: string;
  approval: BoundedFormalEventGenerationAuthorizationApprovalV1;
  role: 'proposal' | 'reviewer';
  invocationRef: string;
  bindingLock: ReferenceParticipantBindingLockV1;
  evidence: BoundedFormalEventParticipantEvidenceV1;
  proposalParticipant?: BoundedFormalEventProposalParticipantOutput;
}, dependencies: {
  captureRepositorySnapshot?: typeof captureBoundedFormalEventRepositorySnapshot;
  readParticipantEvidence?: typeof readBoundedFormalEventParticipantEvidence;
  resolveProposalBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
  resolveReviewerBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
} = {}): Promise<BoundedFormalEventParticipantGenerationAuthorizationCandidateV1> {
  if (!input.approval || typeof input.approval !== 'object') {
    throw new Error('Human-approved Gate A authorization is required before Participant execution');
  }
  assertSha256(input.approval.humanApprovedSha256, 'Human-approved Gate A SHA-256');
  if (typeof input.approval.humanAuthorizationRef !== 'string'
    || !input.approval.humanAuthorizationRef.trim()
    || input.approval.humanAuthorizationRef.length > 256
    || /[\u0000-\u001f\u007f]/.test(input.approval.humanAuthorizationRef)) {
    throw new Error('Human authorization reference must be a non-empty bounded identifier');
  }
  const candidatePath = resolve(input.approval.authorizationCandidatePath);
  const candidateBytes = await readCanonicalRegularFile(candidatePath, 'Gate A authorization candidate');
  if (sha256Hex(candidateBytes) !== input.approval.humanApprovedSha256) {
    throw new Error('Human-approved Gate A SHA-256 does not match the participant-generation authorization candidate');
  }
  if (candidateBytes.toString('utf8') !== canonicalJson(JSON.parse(candidateBytes.toString('utf8')) as unknown)) {
    throw new Error('Gate A authorization candidate must use canonical JSON bytes');
  }
  const candidateValue = JSON.parse(candidateBytes.toString('utf8')) as unknown;
  if (!isRecord(candidateValue)) throw new Error('Gate A authorization candidate must be an object');
  assertExactKeys(candidateValue, [
    'schemaVersion', 'approvalState', 'generationInputRef', 'generationInputSha256', 'repository',
    'requirementSha256', 'contract', 'participantBindingLockSha256', 'proposalInvocationRef',
    'proposalPromptSha256', 'reviewerInvocationRef', 'reviewerPromptTemplateSha256', 'budget',
  ], 'Gate A authorization candidate');
  if (candidateValue.schemaVersion !== BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_CANDIDATE_SCHEMA
    || candidateValue.approvalState !== 'AWAITING_HUMAN_EXACT_SHA256_APPROVAL'
    || candidateValue.generationInputRef !== BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_INPUT_FILENAME) {
    throw new Error('Gate A authorization candidate identity or approval state is invalid');
  }
  assertSha256(candidateValue.generationInputSha256, 'Gate A generation input digest');
  const inputPath = join(dirname(candidatePath), BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_INPUT_FILENAME);
  const inputBytes = await readCanonicalRegularFile(inputPath, 'Gate A generation input');
  if (sha256Hex(inputBytes) !== candidateValue.generationInputSha256) {
    throw new Error('Gate A generation input does not match its candidate digest');
  }
  const inputValue = JSON.parse(inputBytes.toString('utf8')) as unknown;
  const generation = validateGenerationInput(inputValue);
  if (inputBytes.toString('utf8') !== canonicalJson(inputValue)) throw new Error('Gate A generation input must use canonical JSON bytes');
  if (canonicalJson(buildCandidate(generation, candidateValue.generationInputSha256)) !== candidateBytes.toString('utf8')) {
    throw new Error('Gate A authorization candidate fields do not match its generation input');
  }

  const roleInput = input.role === 'proposal' ? generation.proposalParticipant : generation.reviewerParticipant;
  if (input.invocationRef !== roleInput.invocationRef
    || referenceParticipantBindingLockSha256(input.bindingLock) !== roleInput.bindingLockSha256
    || canonicalJson(input.evidence) !== canonicalJson(generation.participantEvidence)) {
    throw new Error(`Gate A ${input.role} invocation is not the exact approved Participant input`);
  }
  const currentPromptSha256 = input.role === 'proposal'
    ? sha256Hex(renderBoundedFormalEventProposalPrompt({
        invocationRef: input.invocationRef,
        evidence: input.evidence,
      }))
    : sha256Hex(renderBoundedFormalEventReviewPromptTemplate({
        invocationRef: input.invocationRef,
        evidence: input.evidence,
      }));
  const approvedPromptSha256 = input.role === 'proposal'
    ? generation.proposalParticipant.promptSha256
    : generation.reviewerParticipant.promptTemplateSha256;
  if (currentPromptSha256 !== approvedPromptSha256) {
    throw new Error(`Gate A ${input.role} prompt changed after authorization`);
  }
  if (input.role === 'reviewer') {
    const proposalParticipant = input.proposalParticipant;
    if (!proposalParticipant?.ok
      || !proposalParticipant.proposal
      || proposalParticipant.invocationRef !== generation.proposalParticipant.invocationRef
      || proposalParticipant.participantRef !== generation.proposalParticipant.participantRef
      || proposalParticipant.bindingLockSha256 !== generation.proposalParticipant.bindingLockSha256
      || proposalParticipant.generationAuthorizationSha256 !== input.approval.humanApprovedSha256
      || proposalParticipant.generationHumanAuthorizationRef !== input.approval.humanAuthorizationRef) {
      throw new Error('Gate A Reviewer input must be the accepted Proposal from this authorized Proposal invocation');
    }
  }

  const captureSnapshot = dependencies.captureRepositorySnapshot ?? captureBoundedFormalEventRepositorySnapshot;
  const currentRepository = await captureSnapshot(input.repositoryRoot);
  if (canonicalJson(currentRepository) !== canonicalJson(generation.repository)) {
    throw new Error('Gate A authorization is stale because the dev commit or authoritative repository fingerprint changed');
  }
  const currentEvidence = await (dependencies.readParticipantEvidence ?? readBoundedFormalEventParticipantEvidence)(resolve(input.repositoryRoot));
  if (canonicalJson(currentEvidence) !== canonicalJson(generation.participantEvidence)) {
    throw new Error('Gate A authorization is stale because canonical Event or schema evidence changed');
  }
  await (dependencies.resolveProposalBindingFromLock ?? resolveReferenceParticipantBindingFromLock)({
    repositoryRoot: resolve(input.repositoryRoot),
    lock: generation.proposalParticipant.bindingLock,
  });
  await (dependencies.resolveReviewerBindingFromLock ?? resolveReferenceParticipantBindingFromLock)({
    repositoryRoot: resolve(input.repositoryRoot),
    lock: generation.reviewerParticipant.bindingLock,
  });
  const repositoryAfterBindingResolution = await captureSnapshot(input.repositoryRoot);
  if (canonicalJson(repositoryAfterBindingResolution) !== canonicalJson(generation.repository)) {
    throw new Error('Gate A authorization became stale during fresh binding resolution');
  }
  return buildCandidate(generation, candidateValue.generationInputSha256);
}

export async function consumeBoundedFormalEventParticipantGenerationAuthorization(input: {
  repositoryRoot: string;
  authorizationCandidatePath: string;
  consumptionRoot?: string;
  generationAuthorizationSha256: string;
  humanAuthorizationRef: string;
  role: 'proposal' | 'reviewer';
  invocationRef: string;
  bindingLockSha256: string;
}): Promise<string> {
  assertSha256(input.generationAuthorizationSha256, 'Gate A authorization digest');
  assertSha256(input.bindingLockSha256, 'Gate A binding lock digest');
  assertBoundedFormalEventAuthorizationArtifactPath(
    input.repositoryRoot,
    input.authorizationCandidatePath,
    'Formal Event Gate A candidate',
  );
  const markerFilename = `bounded-formal-event-generation-consumed-${input.generationAuthorizationSha256}-${input.role}.json`;
  const consumptionRoot = resolve(input.consumptionRoot
    ?? join(resolve(input.repositoryRoot), '.tmp', 'evolution', 'bounded-formal-event-participant-generation-consumption'));
  await mkdir(consumptionRoot, { recursive: true });
  const markerPath = join(consumptionRoot, markerFilename);
  let markerHandle: Awaited<ReturnType<typeof open>>;
  try {
    markerHandle = await open(markerPath, 'wx', 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(`Gate A ${input.role} Participant authorization has already been consumed`);
    }
    throw error;
  }
  try {
    await markerHandle.writeFile(canonicalJson({
      schemaVersion: 'bounded-formal-event-participant-generation-consumption-v1',
      generationAuthorizationSha256: input.generationAuthorizationSha256,
      humanAuthorizationRef: input.humanAuthorizationRef,
      role: input.role,
      invocationRef: input.invocationRef,
      bindingLockSha256: input.bindingLockSha256,
      maximumParticipantJobs: 2,
    }));
  } finally {
    await markerHandle.close();
  }
  return markerFilename;
}

function validateParticipantGenerationManifest(value: unknown): BoundedFormalEventParticipantGenerationManifestV1 {
  if (!isRecord(value)) throw new Error('Gate A preflight manifest must be an object');
  assertExactKeys(value, [
    'schemaVersion', 'generationInputRef', 'generationInputSha256', 'repository', 'requirementSha256', 'contract',
    'participantBindingLockSha256', 'proposalInvocationRef', 'proposalPromptSha256', 'reviewerInvocationRef',
    'reviewerPromptTemplateSha256', 'budget',
  ], 'Gate A preflight manifest');
  if (value.schemaVersion !== BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_MANIFEST_SCHEMA
    || value.generationInputRef !== BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_INPUT_FILENAME) {
    throw new Error('Gate A preflight manifest identity is invalid');
  }
  assertSha256(value.generationInputSha256, 'Gate A generation input digest');
  assertSha256(value.requirementSha256, 'Gate A Requirement digest');
  assertSha256(value.proposalPromptSha256, 'Gate A Proposal prompt digest');
  assertSha256(value.reviewerPromptTemplateSha256, 'Gate A Reviewer prompt-template digest');
  if (!isRecord(value.repository)
    || value.repository.branch !== 'dev'
    || typeof value.repository.commitSha !== 'string'
    || !/^[a-f0-9]{40,64}$/.test(value.repository.commitSha)) {
    throw new Error('Gate A preflight manifest repository snapshot must identify a dev commit');
  }
  assertSha256(value.repository.authoritativeFingerprintSha256, 'Gate A repository fingerprint');
  const expectedContract = { contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID, contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION };
  if (canonicalJson(value.contract) !== canonicalJson(expectedContract)) {
    throw new Error('Gate A preflight manifest Contract identity is invalid');
  }
  if (!isRecord(value.participantBindingLockSha256)) {
    throw new Error('Gate A preflight manifest Participant binding digests are invalid');
  }
  assertExactKeys(value.participantBindingLockSha256, ['proposal', 'reviewer'], 'Gate A Participant binding digests');
  assertSha256(value.participantBindingLockSha256.proposal, 'Gate A Proposal binding lock digest');
  assertSha256(value.participantBindingLockSha256.reviewer, 'Gate A Reviewer binding lock digest');
  validateInvocationRef(String(value.proposalInvocationRef), 'Gate A Proposal invocationRef');
  validateInvocationRef(String(value.reviewerInvocationRef), 'Gate A Reviewer invocationRef');
  if (value.proposalInvocationRef === value.reviewerInvocationRef) {
    throw new Error('Gate A Proposal and Reviewer invocationRef values must differ');
  }
  const expectedBudget = { allowedParticipantJobs: 4, proposalMaximumJobs: 2, reviewerMaximumJobs: 2 };
  if (canonicalJson(value.budget) !== canonicalJson(expectedBudget)) {
    throw new Error('Gate A Participant job budget is invalid');
  }
  return value as unknown as BoundedFormalEventParticipantGenerationManifestV1;
}

export async function buildBoundedFormalEventParticipantGenerationManifest(
  input: BuildBoundedFormalEventParticipantGenerationManifestInput,
  dependencies: {
    captureRepositorySnapshot?: typeof captureBoundedFormalEventRepositorySnapshot;
    readParticipantEvidence?: typeof readBoundedFormalEventParticipantEvidence;
    resolveProposalBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
    resolveReviewerBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
  } = {},
): Promise<BuildBoundedFormalEventParticipantGenerationManifestResult> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const proposalInvocationRef = validateInvocationRef(input.proposalInvocationRef, 'Formal Event Proposal invocationRef');
  const reviewerInvocationRef = validateInvocationRef(input.reviewerInvocationRef, 'Formal Event Reviewer invocationRef');
  if (proposalInvocationRef === reviewerInvocationRef) {
    throw new Error('Formal Event Proposal and Reviewer invocationRef values must differ');
  }
  const manifestPath = assertBoundedFormalEventAuthorizationArtifactPath(
    repositoryRoot,
    input.manifestPath,
    'Formal Event Gate A preflight manifest',
  );
  const generationInputPath = join(dirname(manifestPath), BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_INPUT_FILENAME);
  if (basename(manifestPath) === BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_INPUT_FILENAME) {
    throw new Error('Gate A preflight manifest path must differ from its generation input packet path');
  }

  const captureSnapshot = dependencies.captureRepositorySnapshot ?? captureBoundedFormalEventRepositorySnapshot;
  const repository = await captureSnapshot(repositoryRoot);
  const evidence = await (dependencies.readParticipantEvidence ?? readBoundedFormalEventParticipantEvidence)(repositoryRoot);
  if (canonicalJson(await captureSnapshot(repositoryRoot)) !== canonicalJson(repository)) {
    throw new Error('Authoritative repository changed while Gate A Participant inputs were captured');
  }
  const generation = generationInput({
    repository,
    evidence,
    proposalInvocationRef,
    proposalBindingLock: input.proposalBindingLock,
    reviewerInvocationRef,
    reviewerBindingLock: input.reviewerBindingLock,
  });
  await (dependencies.resolveProposalBindingFromLock ?? resolveReferenceParticipantBindingFromLock)({
    repositoryRoot,
    lock: input.proposalBindingLock,
  });
  await (dependencies.resolveReviewerBindingFromLock ?? resolveReferenceParticipantBindingFromLock)({
    repositoryRoot,
    lock: input.reviewerBindingLock,
  });
  if (canonicalJson(await captureSnapshot(repositoryRoot)) !== canonicalJson(repository)) {
    throw new Error('Authoritative repository changed while Gate A binding locks were resolved');
  }

  const generationBytes = Buffer.from(canonicalJson(generation), 'utf8');
  const generationInputSha256 = sha256Hex(generationBytes);
  const manifest = buildManifest(generation, generationInputSha256);
  const canonicalBytes = Buffer.from(canonicalJson(manifest), 'utf8');
  const canonicalSha256 = sha256Hex(canonicalBytes);
  await mkdir(dirname(generationInputPath), { recursive: true });
  await writeFile(generationInputPath, generationBytes, { flag: 'wx' });
  await writeFile(manifestPath, canonicalBytes, { flag: 'wx' });
  return {
    manifest,
    manifestRef: { manifestPath, manifestSha256: canonicalSha256 },
    canonicalBytes,
    canonicalSha256,
    generationInputPath,
    generationInputSha256,
  };
}

export async function validateFreshBoundedFormalEventParticipantGenerationManifest(input: {
  repositoryRoot: string;
  manifestRef: BoundedFormalEventParticipantGenerationManifestRefV1;
  role: 'proposal' | 'reviewer';
  invocationRef: string;
  bindingLock: ReferenceParticipantBindingLockV1;
  evidence: BoundedFormalEventParticipantEvidenceV1;
  proposalParticipant?: unknown;
}, dependencies: {
  captureRepositorySnapshot?: typeof captureBoundedFormalEventRepositorySnapshot;
  readParticipantEvidence?: typeof readBoundedFormalEventParticipantEvidence;
  resolveProposalBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
  resolveReviewerBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
} = {}): Promise<BoundedFormalEventParticipantGenerationManifestV1> {
  assertSha256(input.manifestRef?.manifestSha256, 'Gate A preflight manifest SHA-256');
  const manifestPath = assertBoundedFormalEventAuthorizationArtifactPath(
    input.repositoryRoot,
    input.manifestRef.manifestPath,
    'Formal Event Gate A preflight manifest',
  );
  const manifestBytes = await readCanonicalRegularFile(manifestPath, 'Gate A preflight manifest');
  if (sha256Hex(manifestBytes) !== input.manifestRef.manifestSha256) {
    throw new Error('Gate A preflight manifest SHA-256 does not match its canonical bytes');
  }
  const manifestValue = JSON.parse(manifestBytes.toString('utf8')) as unknown;
  if (manifestBytes.toString('utf8') !== canonicalJson(manifestValue)) {
    throw new Error('Gate A preflight manifest must use canonical JSON bytes');
  }
  const manifest = validateParticipantGenerationManifest(manifestValue);
  const inputPath = join(dirname(manifestPath), BOUNDED_FORMAL_EVENT_PARTICIPANT_GENERATION_INPUT_FILENAME);
  const inputBytes = await readCanonicalRegularFile(inputPath, 'Gate A generation input');
  if (sha256Hex(inputBytes) !== manifest.generationInputSha256) {
    throw new Error('Gate A generation input does not match its preflight manifest digest');
  }
  const generationValue = JSON.parse(inputBytes.toString('utf8')) as unknown;
  if (inputBytes.toString('utf8') !== canonicalJson(generationValue)) {
    throw new Error('Gate A generation input must use canonical JSON bytes');
  }
  const generation = validateGenerationInput(generationValue);
  if (canonicalJson(buildManifest(generation, manifest.generationInputSha256)) !== manifestBytes.toString('utf8')) {
    throw new Error('Gate A preflight manifest fields do not match its generation input');
  }

  const roleInput = input.role === 'proposal' ? generation.proposalParticipant : generation.reviewerParticipant;
  if (input.invocationRef !== roleInput.invocationRef
    || referenceParticipantBindingLockSha256(input.bindingLock) !== roleInput.bindingLockSha256
    || canonicalJson(input.evidence) !== canonicalJson(generation.participantEvidence)) {
    throw new Error(`Gate A ${input.role} invocation is not the exact preflight-manifest Participant input`);
  }
  const currentPromptSha256 = input.role === 'proposal'
    ? sha256Hex(renderBoundedFormalEventProposalPrompt({ invocationRef: input.invocationRef, evidence: input.evidence }))
    : sha256Hex(renderBoundedFormalEventReviewPromptTemplate({ invocationRef: input.invocationRef, evidence: input.evidence }));
  const expectedPromptSha256 = input.role === 'proposal'
    ? generation.proposalParticipant.promptSha256
    : generation.reviewerParticipant.promptTemplateSha256;
  if (currentPromptSha256 !== expectedPromptSha256) {
    throw new Error(`Gate A ${input.role} prompt changed after preflight manifest creation`);
  }
  if (input.role === 'reviewer') {
    const proposalParticipant = input.proposalParticipant;
    if (!isRecord(proposalParticipant)
      || proposalParticipant.ok !== true
      || !isRecord(proposalParticipant.proposal)
      || proposalParticipant.invocationRef !== generation.proposalParticipant.invocationRef
      || proposalParticipant.participantRef !== generation.proposalParticipant.participantRef
      || proposalParticipant.bindingLockSha256 !== generation.proposalParticipant.bindingLockSha256
      || proposalParticipant.generationManifestSha256 !== input.manifestRef.manifestSha256
      || proposalParticipant.generationManifestConsumptionRef
        !== `bounded-formal-event-generation-manifest-consumed-${input.manifestRef.manifestSha256}-proposal.json`) {
      throw new Error('Gate A Reviewer input must be the validated Proposal from this preflight manifest invocation');
    }
    const proposal = validateBoundedFormalEventProposalV2(
      proposalParticipant.proposal,
      generation.participantEvidence.currentEventIds,
    );
    if (proposal.proposedBy !== generation.proposalParticipant.participantRef) {
      throw new Error('Gate A Reviewer input Proposal identity does not match its preflight invocation');
    }
  }

  const captureSnapshot = dependencies.captureRepositorySnapshot ?? captureBoundedFormalEventRepositorySnapshot;
  const currentRepository = await captureSnapshot(input.repositoryRoot);
  if (canonicalJson(currentRepository) !== canonicalJson(generation.repository)) {
    throw new Error('Gate A preflight manifest is stale because the dev commit or authoritative repository fingerprint changed');
  }
  const currentEvidence = await (dependencies.readParticipantEvidence ?? readBoundedFormalEventParticipantEvidence)(resolve(input.repositoryRoot));
  if (canonicalJson(currentEvidence) !== canonicalJson(generation.participantEvidence)) {
    throw new Error('Gate A preflight manifest is stale because canonical Event or schema evidence changed');
  }
  await (dependencies.resolveProposalBindingFromLock ?? resolveReferenceParticipantBindingFromLock)({
    repositoryRoot: resolve(input.repositoryRoot),
    lock: generation.proposalParticipant.bindingLock,
  });
  await (dependencies.resolveReviewerBindingFromLock ?? resolveReferenceParticipantBindingFromLock)({
    repositoryRoot: resolve(input.repositoryRoot),
    lock: generation.reviewerParticipant.bindingLock,
  });
  const repositoryAfterBindingResolution = await captureSnapshot(input.repositoryRoot);
  if (canonicalJson(repositoryAfterBindingResolution) !== canonicalJson(generation.repository)) {
    throw new Error('Gate A preflight manifest became stale during fresh binding resolution');
  }
  return manifest;
}

export async function consumeBoundedFormalEventParticipantGenerationManifest(input: {
  repositoryRoot: string;
  manifestRef: BoundedFormalEventParticipantGenerationManifestRefV1;
  consumptionRoot?: string;
  role: 'proposal' | 'reviewer';
  invocationRef: string;
  bindingLockSha256: string;
}): Promise<string> {
  assertSha256(input.manifestRef?.manifestSha256, 'Gate A preflight manifest digest');
  assertSha256(input.bindingLockSha256, 'Gate A binding lock digest');
  const manifestPath = assertBoundedFormalEventAuthorizationArtifactPath(
    input.repositoryRoot,
    input.manifestRef.manifestPath,
    'Formal Event Gate A preflight manifest',
  );
  const manifestBytes = await readCanonicalRegularFile(manifestPath, 'Gate A preflight manifest');
  if (sha256Hex(manifestBytes) !== input.manifestRef.manifestSha256
    || manifestBytes.toString('utf8') !== canonicalJson(JSON.parse(manifestBytes.toString('utf8')) as unknown)) {
    throw new Error('Gate A preflight manifest digest or canonical bytes are invalid');
  }
  const manifest = validateParticipantGenerationManifest(JSON.parse(manifestBytes.toString('utf8')) as unknown);
  const expectedInvocationRef = input.role === 'proposal' ? manifest.proposalInvocationRef : manifest.reviewerInvocationRef;
  const expectedBindingLockSha256 = manifest.participantBindingLockSha256[input.role];
  if (input.invocationRef !== expectedInvocationRef || input.bindingLockSha256 !== expectedBindingLockSha256) {
    throw new Error(`Gate A ${input.role} consumption does not match its preflight manifest role identity`);
  }
  const markerFilename = `bounded-formal-event-generation-manifest-consumed-${input.manifestRef.manifestSha256}-${input.role}.json`;
  const consumptionRoot = resolve(input.consumptionRoot
    ?? join(resolve(input.repositoryRoot), '.tmp', 'evolution', 'bounded-formal-event-participant-generation-consumption'));
  await mkdir(consumptionRoot, { recursive: true });
  const markerPath = join(consumptionRoot, markerFilename);
  let markerHandle: Awaited<ReturnType<typeof open>>;
  try {
    markerHandle = await open(markerPath, 'wx', 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(`Gate A ${input.role} Participant manifest has already been consumed`);
    }
    throw error;
  }
  try {
    await markerHandle.writeFile(canonicalJson({
      schemaVersion: 'bounded-formal-event-participant-generation-manifest-consumption-v1',
      generationManifestSha256: input.manifestRef.manifestSha256,
      role: input.role,
      invocationRef: input.invocationRef,
      bindingLockSha256: input.bindingLockSha256,
      maximumParticipantJobs: input.role === 'proposal'
        ? manifest.budget.proposalMaximumJobs
        : manifest.budget.reviewerMaximumJobs,
    }));
  } finally {
    await markerHandle.close();
  }
  return markerFilename;
}
