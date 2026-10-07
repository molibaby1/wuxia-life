import { execFile } from 'node:child_process';
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS,
  BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
  BOUNDED_FORMAL_EVENT_MAX_NEW_EVENTS,
} from '../../../src/evolution/boundedFormalEventAuthoringContract';
import { HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT } from '../../../src/evolution/boundedFormalEventReferenceRequirement';
import { validateAuthoringRequirementV1 } from '../../../src/evolution/authoringRequirementContract';
import {
  validateBoundedFormalEventProposalV2,
  validateBoundedFormalEventReviewAssessmentV2,
} from '../../../src/evolution/boundedFormalEventProposalContract';
import { EventLoader } from '../../../src/core/EventLoader';
import {
  referenceParticipantBindingLockSha256,
  resolveReferenceParticipantBindingFromLock,
  type ReferenceParticipantBindingLockV1,
} from '../operator/referenceParticipantBinding';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import { captureAuthoritativeFingerprint } from '../problemAgnosticSolution/agentWorkspace';
import {
  evaluateBoundedFormalEventAdmission,
} from './evaluateBoundedFormalEventAdmission';
import type { BoundedFormalEventParticipantEvidenceV1 } from './boundedFormalEventParticipantEvidence';
import { readBoundedFormalEventParticipantEvidence } from './boundedFormalEventParticipantEvidence';
import type { BoundedFormalEventProposalParticipantOutput } from './runBoundedFormalEventProposalParticipant';
import type { BoundedFormalEventReviewParticipantOutput } from './runBoundedFormalEventReviewParticipant';

const execFileAsync = promisify(execFile);

export const BOUNDED_FORMAL_EVENT_PREPARATION_PACKET_FILENAME = 'bounded-formal-event-preparation-input-v1.json' as const;
export const BOUNDED_FORMAL_EVENT_TRIAL_EXECUTION_MANIFEST_SCHEMA = 'bounded-formal-event-trial-execution-manifest-v1' as const;
export const BOUNDED_FORMAL_EVENT_TRIAL_RUNNER_REF = 'scripts/evolution/autonomousAuthoring/runBoundedFormalEventShadowTrial.ts' as const;

export interface BoundedFormalEventRepositorySnapshotV1 {
  branch: 'dev';
  commitSha: string;
  authoritativeFingerprintSha256: string;
}

interface BoundedFormalEventParticipantProvenanceV1 {
  invocationRef: string;
  participantRef: string;
  transportRole: 'solution' | 'reviewer';
  bindingLock: ReferenceParticipantBindingLockV1;
  bindingLockSha256: string;
  generationManifestSha256: string;
  generationManifestConsumptionRef: string;
  promptSha256: string;
  rawOutputSha256: string;
  acceptedAttempt: 0 | 1;
  recovery: unknown;
  executionTrace: unknown;
}

export interface BoundedFormalEventPreparationInputPacketV1 {
  schemaVersion: 'bounded-formal-event-preparation-input-v1';
  repository: BoundedFormalEventRepositorySnapshotV1;
  requirement: ReturnType<typeof validateAuthoringRequirementV1>;
  requirementSha256: string;
  contract: { contractId: typeof BOUNDED_FORMAL_EVENT_CONTRACT_ID; contractVersion: typeof BOUNDED_FORMAL_EVENT_CONTRACT_VERSION };
  observedLifeStates: { trainingHabit: number; businessHabit: number };
  participantEvidence: BoundedFormalEventParticipantEvidenceV1;
  participantEvidenceSha256: string;
  proposalParticipant: BoundedFormalEventParticipantProvenanceV1;
  proposal: ReturnType<typeof validateBoundedFormalEventProposalV2>;
  proposalSha256: string;
  reviewerParticipant: BoundedFormalEventParticipantProvenanceV1;
  review: ReturnType<typeof validateBoundedFormalEventReviewAssessmentV2>;
  reviewSha256: string;
  admission: Awaited<ReturnType<typeof evaluateBoundedFormalEventAdmission>>;
  admissionSha256: string;
}

export interface BoundedFormalEventTrialExecutionManifestV1 {
  schemaVersion: typeof BOUNDED_FORMAL_EVENT_TRIAL_EXECUTION_MANIFEST_SCHEMA;
  preparationInputRef: typeof BOUNDED_FORMAL_EVENT_PREPARATION_PACKET_FILENAME;
  preparationInputSha256: string;
  repository: BoundedFormalEventRepositorySnapshotV1;
  requirementSha256: string;
  contract: { contractId: typeof BOUNDED_FORMAL_EVENT_CONTRACT_ID; contractVersion: typeof BOUNDED_FORMAL_EVENT_CONTRACT_VERSION };
  participantBindingLockSha256: { proposal: string; reviewer: string };
  trial: {
    intendedRunner: typeof BOUNDED_FORMAL_EVENT_TRIAL_RUNNER_REF;
    allowedParticipantJobs: 0;
    allowedWritePaths: typeof BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS;
    maxNewEvents: typeof BOUNDED_FORMAL_EVENT_MAX_NEW_EVENTS;
    expectedArtifacts: readonly ['verification.json', 'focused-test.log', 'result.json'];
    shadowWorkspace: 'isolated outside authoritative repository';
    artifactRoot: 'outside shadow workspace; if inside repository, under artifacts/ or .tmp/evolution/';
  };
}

export interface BoundedFormalEventTrialExecutionManifestRefV1 {
  executionManifestPath: string;
  executionManifestSha256: string;
}

export interface BuildBoundedFormalEventTrialExecutionManifestInput {
  repositoryRoot: string;
  preparedAgainst: BoundedFormalEventRepositorySnapshotV1;
  participantEvidence: BoundedFormalEventParticipantEvidenceV1;
  proposalParticipant: BoundedFormalEventProposalParticipantOutput;
  reviewerParticipant: BoundedFormalEventReviewParticipantOutput;
  observedLifeStates: { trainingHabit: number; businessHabit: number };
  executionManifestPath: string;
}

export interface BuildBoundedFormalEventTrialExecutionManifestResult {
  manifest: BoundedFormalEventTrialExecutionManifestV1;
  manifestRef: BoundedFormalEventTrialExecutionManifestRefV1;
  canonicalSha256: string;
  canonicalBytes: Buffer;
  preparationInputPath: string;
  preparationInputSha256: string;
  admission: BoundedFormalEventPreparationInputPacketV1['admission'];
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
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw new Error(`${label} must be a lowercase SHA-256`);
}

export async function captureBoundedFormalEventRepositorySnapshot(
  repositoryRoot: string,
): Promise<BoundedFormalEventRepositorySnapshotV1> {
  const root = resolve(repositoryRoot);
  const [branchOutput, commitOutput, authoritativeFingerprintSha256] = await Promise.all([
    execFileAsync('git', ['branch', '--show-current'], { cwd: root }),
    execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: root }),
    captureAuthoritativeFingerprint(root),
  ]);
  const branch = branchOutput.stdout.trim();
  const commitSha = commitOutput.stdout.trim();
  if (branch !== 'dev') throw new Error(`Bounded Formal Event preparation requires current branch dev, got ${branch || '(detached)'}`);
  if (!/^[a-f0-9]{40,64}$/.test(commitSha)) throw new Error('Current Git HEAD is not a valid commit SHA');
  return { branch: 'dev', commitSha, authoritativeFingerprintSha256 };
}

export function assertBoundedFormalEventAuthorizationArtifactPath(
  repositoryRoot: string,
  candidatePath: string,
  label: string,
): string {
  const root = resolve(repositoryRoot);
  const path = resolve(candidatePath);
  const relativePath = relative(root, path);
  const insideRepository = relativePath === ''
    || (relativePath !== '..' && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath));
  if (insideRepository) {
    const segments = relativePath.split(sep);
    const isExcludedArtifactPath = segments[0] === 'artifacts'
      || (segments[0] === '.tmp' && segments[1] === 'evolution');
    if (!isExcludedArtifactPath) {
      throw new Error(`${label} must be outside the authoritative repository or under artifacts/ or .tmp/evolution/`);
    }
  }
  return path;
}

function participantProvenance(
  role: 'solution' | 'reviewer',
  output: BoundedFormalEventProposalParticipantOutput | BoundedFormalEventReviewParticipantOutput,
): BoundedFormalEventParticipantProvenanceV1 {
  if (!output.ok || !output.execution.ok) throw new Error(`Formal Event ${role} Participant did not return a validated terminal result`);
  if (output.execution.rawOutput.length === 0) throw new Error(`Formal Event ${role} Participant terminal output is empty`);
  return {
    invocationRef: output.invocationRef,
    participantRef: output.participantRef,
    transportRole: role,
    bindingLock: output.bindingLock,
    bindingLockSha256: output.bindingLockSha256,
    generationManifestSha256: output.generationManifestSha256,
    generationManifestConsumptionRef: output.generationManifestConsumptionRef,
    promptSha256: output.promptSha256,
    rawOutputSha256: sha256Hex(output.execution.rawOutput),
    acceptedAttempt: output.execution.acceptedAttempt,
    recovery: output.execution.recovery,
    executionTrace: output.execution.executionTrace,
  };
}

function buildPreparationPacket(input: {
  repository: BoundedFormalEventRepositorySnapshotV1;
  participantEvidence: BoundedFormalEventParticipantEvidenceV1;
  proposalParticipant: BoundedFormalEventProposalParticipantOutput;
  reviewerParticipant: BoundedFormalEventReviewParticipantOutput;
  observedLifeStates: { trainingHabit: number; businessHabit: number };
  admission: Awaited<ReturnType<typeof evaluateBoundedFormalEventAdmission>>;
}): BoundedFormalEventPreparationInputPacketV1 {
  const requirement = validateAuthoringRequirementV1(HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT);
  const existingEventIds = input.participantEvidence.currentEventIds;
  const proposal = validateBoundedFormalEventProposalV2(input.proposalParticipant.proposal, existingEventIds);
  const review = validateBoundedFormalEventReviewAssessmentV2(input.reviewerParticipant.review);
  const requirementSha256 = sha256Hex(canonicalJson(requirement));
  const proposalSha256 = sha256Hex(canonicalJson(proposal));
  const reviewSha256 = sha256Hex(canonicalJson(review));
  const proposalParticipant = participantProvenance('solution', input.proposalParticipant);
  const reviewerParticipant = participantProvenance('reviewer', input.reviewerParticipant);
  if (proposalParticipant.invocationRef === reviewerParticipant.invocationRef
    || proposalParticipant.participantRef === reviewerParticipant.participantRef) {
    throw new Error('Formal Event proposal and review must use distinct invocation identities');
  }
  if (proposalParticipant.generationManifestSha256 !== reviewerParticipant.generationManifestSha256) {
    throw new Error('Formal Event Proposal and Reviewer must share the same exact preflight manifest provenance');
  }
  if (proposal.proposedBy !== proposalParticipant.participantRef || review.reviewerRef !== reviewerParticipant.participantRef) {
    throw new Error('Formal Event Participant output identity does not match its Host invocation identity');
  }
  if (review.requirementSha256 !== requirementSha256 || review.proposalSha256 !== proposalSha256) {
    throw new Error('Formal Event review does not bind the exact Requirement and proposal');
  }
  if (input.admission.status !== 'ELIGIBLE'
    || input.admission.requirementSha256 !== requirementSha256
    || input.admission.proposalSha256 !== proposalSha256
    || input.admission.reviewSha256 !== reviewSha256
    || input.admission.authoritativeFingerprintBefore !== input.repository.authoritativeFingerprintSha256) {
    throw new Error('Formal Event Host admission is not eligible for this exact preparation snapshot');
  }
  const packetWithoutAdmissionHash = {
    schemaVersion: 'bounded-formal-event-preparation-input-v1' as const,
    repository: input.repository,
    requirement,
    requirementSha256,
    contract: { contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID, contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION },
    observedLifeStates: input.observedLifeStates,
    participantEvidence: input.participantEvidence,
    participantEvidenceSha256: sha256Hex(canonicalJson(input.participantEvidence)),
    proposalParticipant,
    proposal,
    proposalSha256,
    reviewerParticipant,
    review,
    reviewSha256,
    admission: input.admission,
  };
  return {
    ...packetWithoutAdmissionHash,
    admissionSha256: sha256Hex(canonicalJson(input.admission)),
  };
}

function buildExecutionManifest(
  packet: BoundedFormalEventPreparationInputPacketV1,
  preparationInputSha256: string,
): BoundedFormalEventTrialExecutionManifestV1 {
  return {
    schemaVersion: BOUNDED_FORMAL_EVENT_TRIAL_EXECUTION_MANIFEST_SCHEMA,
    preparationInputRef: BOUNDED_FORMAL_EVENT_PREPARATION_PACKET_FILENAME,
    preparationInputSha256,
    repository: packet.repository,
    requirementSha256: packet.requirementSha256,
    contract: packet.contract,
    participantBindingLockSha256: {
      proposal: packet.proposalParticipant.bindingLockSha256,
      reviewer: packet.reviewerParticipant.bindingLockSha256,
    },
    trial: {
      intendedRunner: BOUNDED_FORMAL_EVENT_TRIAL_RUNNER_REF,
      allowedParticipantJobs: 0,
      allowedWritePaths: BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS,
      maxNewEvents: BOUNDED_FORMAL_EVENT_MAX_NEW_EVENTS,
      expectedArtifacts: ['verification.json', 'focused-test.log', 'result.json'],
      shadowWorkspace: 'isolated outside authoritative repository',
      artifactRoot: 'outside shadow workspace; if inside repository, under artifacts/ or .tmp/evolution/',
    },
  };
}

export async function buildBoundedFormalEventTrialExecutionManifest(
  input: BuildBoundedFormalEventTrialExecutionManifestInput,
  dependencies: {
    captureRepositorySnapshot?: typeof captureBoundedFormalEventRepositorySnapshot;
    resolveProposalBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
    resolveReviewerBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
    evaluateAdmission?: typeof evaluateBoundedFormalEventAdmission;
    readParticipantEvidence?: typeof readBoundedFormalEventParticipantEvidence;
  } = {},
): Promise<BuildBoundedFormalEventTrialExecutionManifestResult> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const executionManifestPath = assertBoundedFormalEventAuthorizationArtifactPath(
    repositoryRoot,
    input.executionManifestPath,
    'Formal Event execution manifest',
  );
  const preparationInputPath = join(dirname(executionManifestPath), BOUNDED_FORMAL_EVENT_PREPARATION_PACKET_FILENAME);
  if (basename(executionManifestPath) === BOUNDED_FORMAL_EVENT_PREPARATION_PACKET_FILENAME) {
    throw new Error('Execution manifest path must differ from the preparation input packet path');
  }
  const captureSnapshot = dependencies.captureRepositorySnapshot ?? captureBoundedFormalEventRepositorySnapshot;
  const before = await captureSnapshot(repositoryRoot);
  if (canonicalJson(before) !== canonicalJson(input.preparedAgainst)) {
    throw new Error('Authoritative repository changed after the Participant preparation inputs were formed');
  }
  const currentEvidence = await (dependencies.readParticipantEvidence ?? readBoundedFormalEventParticipantEvidence)(repositoryRoot);
  if (canonicalJson(currentEvidence) !== canonicalJson(input.participantEvidence)) {
    throw new Error('Formal Event Participant evidence changed after authoring inputs were formed');
  }

  const proposalLockSha = referenceParticipantBindingLockSha256(input.proposalParticipant.bindingLock);
  const reviewerLockSha = referenceParticipantBindingLockSha256(input.reviewerParticipant.bindingLock);
  if (proposalLockSha !== input.proposalParticipant.bindingLockSha256
    || reviewerLockSha !== input.reviewerParticipant.bindingLockSha256) {
    throw new Error('Formal Event role-specific binding lock digest does not match its Participant record');
  }
  await (dependencies.resolveProposalBindingFromLock ?? resolveReferenceParticipantBindingFromLock)({
    repositoryRoot,
    lock: input.proposalParticipant.bindingLock,
  });
  await (dependencies.resolveReviewerBindingFromLock ?? resolveReferenceParticipantBindingFromLock)({
    repositoryRoot,
    lock: input.reviewerParticipant.bindingLock,
  });

  const proposal = validateBoundedFormalEventProposalV2(
    input.proposalParticipant.proposal,
    input.participantEvidence.currentEventIds,
  );
  const review = validateBoundedFormalEventReviewAssessmentV2(input.reviewerParticipant.review);
  const admission = await (dependencies.evaluateAdmission ?? evaluateBoundedFormalEventAdmission)({
    repositoryRoot,
    requirement: HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    proposal,
    review,
    observedLifeStates: input.observedLifeStates,
  });
  const after = await captureSnapshot(repositoryRoot);
  if (canonicalJson(before) !== canonicalJson(after)) {
    throw new Error('Authoritative repository changed while the Formal Event execution manifest was prepared');
  }
  if (admission.status !== 'ELIGIBLE') throw new Error(`Formal Event execution manifest requires ELIGIBLE admission, got ${admission.status}`);

  const packet = buildPreparationPacket({
    repository: before,
    participantEvidence: input.participantEvidence,
    proposalParticipant: input.proposalParticipant,
    reviewerParticipant: input.reviewerParticipant,
    observedLifeStates: input.observedLifeStates,
    admission,
  });
  const packetBytes = Buffer.from(canonicalJson(packet), 'utf8');
  const preparationInputSha256 = sha256Hex(packetBytes);
  const manifest = buildExecutionManifest(packet, preparationInputSha256);
  const canonicalBytes = Buffer.from(canonicalJson(manifest), 'utf8');
  const canonicalSha256 = sha256Hex(canonicalBytes);

  await mkdir(dirname(preparationInputPath), { recursive: true });
  await writeFile(preparationInputPath, packetBytes, { flag: 'wx' });
  await writeFile(executionManifestPath, canonicalBytes, { flag: 'wx' });
  return {
    manifest,
    manifestRef: { executionManifestPath, executionManifestSha256: canonicalSha256 },
    canonicalSha256,
    canonicalBytes,
    preparationInputPath,
    preparationInputSha256,
    admission,
  };
}

function validateRepositorySnapshot(value: unknown): BoundedFormalEventRepositorySnapshotV1 {
  if (!isRecord(value)) throw new Error('Execution preparation repository snapshot must be an object');
  assertExactKeys(value, ['branch', 'commitSha', 'authoritativeFingerprintSha256'], 'Repository snapshot');
  if (value.branch !== 'dev' || typeof value.commitSha !== 'string' || !/^[a-f0-9]{40,64}$/.test(value.commitSha)) {
    throw new Error('Authorization preparation repository snapshot is not for a dev commit');
  }
  assertSha256(value.authoritativeFingerprintSha256, 'Repository authoritative fingerprint');
  return value as unknown as BoundedFormalEventRepositorySnapshotV1;
}

function validateParticipantProvenance(value: unknown, role: 'solution' | 'reviewer'): BoundedFormalEventParticipantProvenanceV1 {
  if (!isRecord(value)) throw new Error(`Execution preparation ${role} provenance must be an object`);
  assertExactKeys(value, [
    'invocationRef', 'participantRef', 'transportRole', 'bindingLock', 'bindingLockSha256',
    'generationManifestSha256', 'generationManifestConsumptionRef',
    'promptSha256', 'rawOutputSha256',
    'acceptedAttempt', 'recovery', 'executionTrace',
  ], `${role} Participant provenance`);
  if (typeof value.invocationRef !== 'string' || !value.invocationRef.trim()
    || typeof value.participantRef !== 'string' || !value.participantRef.trim()
    || value.transportRole !== role
    || (value.acceptedAttempt !== 0 && value.acceptedAttempt !== 1)
    || typeof value.generationManifestConsumptionRef !== 'string'
    || !isRecord(value.bindingLock)) {
    throw new Error(`${role} Participant provenance identity is invalid`);
  }
  assertSha256(value.bindingLockSha256, `${role} binding lock digest`);
  assertSha256(value.generationManifestSha256, `${role} generation manifest digest`);
  const generationRole = role === 'solution' ? 'proposal' : 'reviewer';
  const expectedConsumptionRef = `bounded-formal-event-generation-manifest-consumed-${value.generationManifestSha256}-${generationRole}.json`;
  if (value.generationManifestConsumptionRef !== expectedConsumptionRef) {
    throw new Error(`${role} Participant generation manifest consumption provenance is invalid`);
  }
  assertSha256(value.promptSha256, `${role} prompt digest`);
  assertSha256(value.rawOutputSha256, `${role} raw output digest`);
  const lock = value.bindingLock as unknown as ReferenceParticipantBindingLockV1;
  if (referenceParticipantBindingLockSha256(lock) !== value.bindingLockSha256) {
    throw new Error(`${role} binding lock digest does not match the locked data`);
  }
  if (!isRecord(value.executionTrace) || value.executionTrace.schemaVersion !== 'participant-execution-trace-v1') {
    throw new Error(`${role} Participant execution trace is invalid`);
  }
  return value as unknown as BoundedFormalEventParticipantProvenanceV1;
}

async function readCanonicalRegularFile(path: string, label: string): Promise<Buffer> {
  const stat = await lstat(path);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`${label} must be an existing regular file`);
  return readFile(path);
}

function validatePreparationPacket(value: unknown): BoundedFormalEventPreparationInputPacketV1 {
  if (!isRecord(value)) throw new Error('Execution preparation input must be an object');
  assertExactKeys(value, [
    'schemaVersion', 'repository', 'requirement', 'requirementSha256', 'contract', 'observedLifeStates',
    'participantEvidence', 'participantEvidenceSha256', 'proposalParticipant', 'proposal', 'proposalSha256',
    'reviewerParticipant', 'review', 'reviewSha256', 'admission', 'admissionSha256',
  ], 'Execution preparation input');
  if (value.schemaVersion !== 'bounded-formal-event-preparation-input-v1') {
    throw new Error('Execution preparation input schemaVersion is invalid');
  }
  const repository = validateRepositorySnapshot(value.repository);
  const requirement = validateAuthoringRequirementV1(value.requirement);
  const requirementSha256 = sha256Hex(canonicalJson(requirement));
  if (canonicalJson(requirement) !== canonicalJson(HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT)
    || value.requirementSha256 !== requirementSha256) {
    throw new Error('Execution preparation Requirement is not the fixed Human-direct Requirement');
  }
  if (!isRecord(value.contract)
    || canonicalJson(value.contract) !== canonicalJson({
      contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
      contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    })) {
    throw new Error('Execution preparation Contract identity is invalid');
  }
  if (!isRecord(value.observedLifeStates)
    || Object.keys(value.observedLifeStates).length !== 2
    || typeof value.observedLifeStates.trainingHabit !== 'number'
    || !Number.isInteger(value.observedLifeStates.trainingHabit)
    || typeof value.observedLifeStates.businessHabit !== 'number'
    || !Number.isInteger(value.observedLifeStates.businessHabit)) {
    throw new Error('Execution preparation observed Life States are invalid');
  }
  assertSha256(value.participantEvidenceSha256, 'Participant evidence digest');
  if (!isRecord(value.participantEvidence)
    || value.participantEvidenceSha256 !== sha256Hex(canonicalJson(value.participantEvidence))) {
    throw new Error('Execution preparation Participant evidence digest is invalid');
  }
  const proposalParticipant = validateParticipantProvenance(value.proposalParticipant, 'solution');
  const reviewerParticipant = validateParticipantProvenance(value.reviewerParticipant, 'reviewer');
  if (proposalParticipant.invocationRef === reviewerParticipant.invocationRef
    || proposalParticipant.participantRef === reviewerParticipant.participantRef) {
    throw new Error('Execution preparation reused the author invocation for Reviewer');
  }
  if (proposalParticipant.generationManifestSha256 !== reviewerParticipant.generationManifestSha256) {
    throw new Error('Execution preparation does not retain one shared exact Gate A preflight manifest');
  }
  const eventIds = Array.isArray(value.participantEvidence.currentEventIds)
    ? value.participantEvidence.currentEventIds.filter((id): id is string => typeof id === 'string')
    : [];
  const proposal = validateBoundedFormalEventProposalV2(value.proposal, eventIds);
  const review = validateBoundedFormalEventReviewAssessmentV2(value.review);
  const proposalSha256 = sha256Hex(canonicalJson(proposal));
  const reviewSha256 = sha256Hex(canonicalJson(review));
  if (value.proposalSha256 !== proposalSha256 || value.reviewSha256 !== reviewSha256
    || proposal.proposedBy !== proposalParticipant.participantRef
    || review.reviewerRef !== reviewerParticipant.participantRef
    || review.reviewerRef === proposal.proposedBy
    || review.requirementSha256 !== requirementSha256
    || review.proposalSha256 !== proposalSha256) {
    throw new Error('Execution preparation proposal or independent review provenance is invalid');
  }
  assertSha256(value.admissionSha256, 'Admission digest');
  if (!isRecord(value.admission) || value.admissionSha256 !== sha256Hex(canonicalJson(value.admission))) {
    throw new Error('Execution preparation admission digest is invalid');
  }
  return {
    schemaVersion: 'bounded-formal-event-preparation-input-v1',
    repository,
    requirement,
    requirementSha256,
    contract: { contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID, contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION },
    observedLifeStates: value.observedLifeStates as { trainingHabit: number; businessHabit: number },
    participantEvidence: value.participantEvidence as unknown as BoundedFormalEventParticipantEvidenceV1,
    participantEvidenceSha256: value.participantEvidenceSha256,
    proposalParticipant,
    proposal,
    proposalSha256,
    reviewerParticipant,
    review,
    reviewSha256,
    admission: value.admission as unknown as BoundedFormalEventPreparationInputPacketV1['admission'],
    admissionSha256: value.admissionSha256,
  };
}

export async function validateFreshBoundedFormalEventTrialExecutionManifest(input: {
  repositoryRoot: string;
  executionManifestPath: string;
  executionManifestSha256: string;
  proposal: unknown;
  review: unknown;
  observedLifeStates: { trainingHabit?: unknown; businessHabit?: unknown } | null;
  participantJobs?: 0 | 1;
}, dependencies: {
  captureRepositorySnapshot?: typeof captureBoundedFormalEventRepositorySnapshot;
  resolveProposalBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
  resolveReviewerBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
  evaluateAdmission?: typeof evaluateBoundedFormalEventAdmission;
  readParticipantEvidence?: typeof readBoundedFormalEventParticipantEvidence;
} = {}): Promise<BoundedFormalEventTrialExecutionManifestV1> {
  assertSha256(input.executionManifestSha256, 'Execution manifest SHA-256');
  if (typeof input.executionManifestPath !== 'string' || input.executionManifestPath.trim().length === 0) {
    throw new Error('Execution manifest path must be a non-empty path');
  }
  const executionManifestPath = assertBoundedFormalEventAuthorizationArtifactPath(
    input.repositoryRoot,
    input.executionManifestPath,
    'Formal Event execution manifest',
  );
  const manifestBytes = await readCanonicalRegularFile(executionManifestPath, 'Execution manifest');
  if (sha256Hex(manifestBytes) !== input.executionManifestSha256) {
    throw new Error('Execution manifest digest does not match its canonical bytes');
  }
  let manifestValue: unknown;
  try {
    manifestValue = JSON.parse(manifestBytes.toString('utf8')) as unknown;
  } catch (error) {
    throw new Error(`Execution manifest is not valid JSON: ${String(error)}`);
  }
  if (!isRecord(manifestValue)) throw new Error('Execution manifest must be a JSON object');
  assertExactKeys(manifestValue, [
    'schemaVersion', 'preparationInputRef', 'preparationInputSha256', 'repository',
    'requirementSha256', 'contract', 'participantBindingLockSha256', 'trial',
  ], 'Execution manifest');
  if (manifestValue.schemaVersion !== BOUNDED_FORMAL_EVENT_TRIAL_EXECUTION_MANIFEST_SCHEMA
    || manifestValue.preparationInputRef !== BOUNDED_FORMAL_EVENT_PREPARATION_PACKET_FILENAME) {
    throw new Error('Execution manifest identity is invalid');
  }
  assertSha256(manifestValue.preparationInputSha256, 'Preparation input digest');
  const packetPath = join(dirname(executionManifestPath), BOUNDED_FORMAL_EVENT_PREPARATION_PACKET_FILENAME);
  const packetBytes = await readCanonicalRegularFile(packetPath, 'Execution preparation input');
  if (sha256Hex(packetBytes) !== manifestValue.preparationInputSha256) {
    throw new Error('Execution preparation input does not match the manifest digest');
  }
  let packetValue: unknown;
  try {
    packetValue = JSON.parse(packetBytes.toString('utf8')) as unknown;
  } catch (error) {
    throw new Error(`Execution preparation input is not valid JSON: ${String(error)}`);
  }
  const packet = validatePreparationPacket(packetValue);
  if (canonicalJson(packetValue) !== packetBytes.toString('utf8')) {
    throw new Error('Execution preparation input must use canonical JSON bytes');
  }
  if (canonicalJson(manifestValue) !== manifestBytes.toString('utf8')) {
    throw new Error('Execution manifest must use canonical JSON bytes');
  }

  const captureSnapshot = dependencies.captureRepositorySnapshot ?? captureBoundedFormalEventRepositorySnapshot;
  const currentRepository = await captureSnapshot(input.repositoryRoot);
  if (canonicalJson(currentRepository) !== canonicalJson(packet.repository)
    || canonicalJson(manifestValue.repository) !== canonicalJson(packet.repository)) {
    throw new Error('Execution manifest is stale because the dev commit or authoritative repository fingerprint changed');
  }
  if (manifestValue.requirementSha256 !== packet.requirementSha256
    || canonicalJson(manifestValue.contract) !== canonicalJson(packet.contract)) {
    throw new Error('Execution manifest is stale because the Requirement or Contract identity changed');
  }
  if ((input.participantJobs ?? 0) !== 0) {
    throw new Error('Execution manifest permits zero Participant jobs during deterministic shadow execution');
  }
  if (!isRecord(manifestValue.participantBindingLockSha256)
    || canonicalJson(manifestValue.participantBindingLockSha256) !== canonicalJson({
      proposal: packet.proposalParticipant.bindingLockSha256,
      reviewer: packet.reviewerParticipant.bindingLockSha256,
    })) {
    throw new Error('Execution manifest Participant binding provenance does not match its preparation packet');
  }

  const existingEventIds = EventLoader.getInstance().getAllEvents().map(event => event.id);
  const proposal = validateBoundedFormalEventProposalV2(input.proposal, existingEventIds);
  const review = validateBoundedFormalEventReviewAssessmentV2(input.review);
  if (canonicalJson(proposal) !== canonicalJson(packet.proposal)
    || canonicalJson(review) !== canonicalJson(packet.review)
    || canonicalJson(input.observedLifeStates) !== canonicalJson(packet.observedLifeStates)) {
    throw new Error('Execution manifest is stale because proposal, review, or observed Life States changed');
  }
  const currentEvidence = await (dependencies.readParticipantEvidence ?? readBoundedFormalEventParticipantEvidence)(resolve(input.repositoryRoot));
  if (canonicalJson(currentEvidence) !== canonicalJson(packet.participantEvidence)) {
    throw new Error('Execution manifest is stale because current canonical Event or schema evidence changed');
  }
  await (dependencies.resolveProposalBindingFromLock ?? resolveReferenceParticipantBindingFromLock)({
    repositoryRoot: resolve(input.repositoryRoot),
    lock: packet.proposalParticipant.bindingLock,
  });
  await (dependencies.resolveReviewerBindingFromLock ?? resolveReferenceParticipantBindingFromLock)({
    repositoryRoot: resolve(input.repositoryRoot),
    lock: packet.reviewerParticipant.bindingLock,
  });
  const admission = await (dependencies.evaluateAdmission ?? evaluateBoundedFormalEventAdmission)({
    repositoryRoot: resolve(input.repositoryRoot),
    requirement: HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    proposal,
    review,
    observedLifeStates: input.observedLifeStates,
  });
  if (admission.status !== 'ELIGIBLE' || canonicalJson(admission) !== canonicalJson(packet.admission)) {
    throw new Error('Execution manifest is stale because Host admission no longer returns the exact ELIGIBLE result');
  }
  const repositoryAfterPreflight = await captureSnapshot(input.repositoryRoot);
  if (canonicalJson(repositoryAfterPreflight) !== canonicalJson(packet.repository)) {
    throw new Error('Execution manifest became stale during fresh validation');
  }
  const expectedManifest = buildExecutionManifest(packet, manifestValue.preparationInputSha256 as string);
  if (canonicalJson(expectedManifest) !== manifestBytes.toString('utf8')) {
    throw new Error('Execution manifest trial scope or write boundaries are invalid');
  }
  return expectedManifest;
}
