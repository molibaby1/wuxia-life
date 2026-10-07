import { readFile } from 'node:fs/promises';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import type { BoundedFormalEventParticipantEvidenceV1 } from './boundedFormalEventParticipantEvidence';
import {
  buildBoundedFormalEventTrialExecutionManifest,
  type BuildBoundedFormalEventTrialExecutionManifestResult,
} from './boundedFormalEventTrialAuthorization';
import {
  prepareBoundedFormalEventTrial,
  type BoundedFormalEventPreparationOutcome,
  type PrepareBoundedFormalEventTrialInput,
} from './prepareBoundedFormalEventTrial';
import {
  runBoundedFormalEventShadowTrial,
  type BoundedFormalEventShadowTrialRun,
} from './runBoundedFormalEventShadowTrial';

export interface RunBoundedFormalEventModelBackedTrialInput extends PrepareBoundedFormalEventTrialInput {
  shadowRoot: string;
  artifactRoot: string;
}

export type BoundedFormalEventModelBackedTrialResult =
  | {
      preparation: Exclude<BoundedFormalEventPreparationOutcome, { status: 'ELIGIBLE' }>;
      executionManifest: null;
    }
  | {
      preparation: Extract<BoundedFormalEventPreparationOutcome, { status: 'ELIGIBLE' }>;
      executionManifest: BuildBoundedFormalEventTrialExecutionManifestResult;
      shadowTrial: BoundedFormalEventShadowTrialRun;
    };

async function readPreparedParticipantEvidence(
  preparation: Extract<BoundedFormalEventPreparationOutcome, { status: 'ELIGIBLE' }>,
): Promise<BoundedFormalEventParticipantEvidenceV1> {
  const generationManifest = preparation.generationManifest;
  const generationManifestSha256 = generationManifest.canonicalSha256;
  if (generationManifest.manifestRef.manifestSha256 !== generationManifestSha256
    || preparation.proposal.generationManifestSha256 !== generationManifestSha256
    || preparation.reviewer.generationManifestSha256 !== generationManifestSha256) {
    throw new Error('Proposal and Reviewer did not consume the exact Host preflight manifest');
  }
  const generationInputBytes = await readFile(generationManifest.generationInputPath);
  if (sha256Hex(generationInputBytes) !== generationManifest.generationInputSha256
    || generationManifest.manifest.generationInputSha256 !== generationManifest.generationInputSha256) {
    throw new Error('Host preflight generation input no longer matches its manifest digest');
  }
  const generationInput = JSON.parse(generationInputBytes.toString('utf8')) as Record<string, unknown>;
  if (canonicalJson(generationInput) !== generationInputBytes.toString('utf8')
    || generationInput.schemaVersion !== 'bounded-formal-event-participant-generation-input-v1'
    || typeof generationInput.participantEvidence !== 'object'
    || generationInput.participantEvidence === null
    || Array.isArray(generationInput.participantEvidence)) {
    throw new Error('Host preflight generation input is not canonical or lacks Participant evidence');
  }
  return generationInput.participantEvidence as BoundedFormalEventParticipantEvidenceV1;
}

export async function runBoundedFormalEventModelBackedTrial(
  input: RunBoundedFormalEventModelBackedTrialInput,
  dependencies: {
    prepare?: typeof prepareBoundedFormalEventTrial;
    preparationDependencies?: Parameters<typeof prepareBoundedFormalEventTrial>[1];
    buildExecutionManifest?: typeof buildBoundedFormalEventTrialExecutionManifest;
    executionManifestDependencies?: Parameters<typeof buildBoundedFormalEventTrialExecutionManifest>[1];
    runShadowTrial?: typeof runBoundedFormalEventShadowTrial;
    shadowTrialDependencies?: Parameters<typeof runBoundedFormalEventShadowTrial>[1];
  } = {},
): Promise<BoundedFormalEventModelBackedTrialResult> {
  const preparation = await (dependencies.prepare ?? prepareBoundedFormalEventTrial)(
    input,
    dependencies.preparationDependencies,
  );
  if (preparation.status !== 'ELIGIBLE') {
    return { preparation, executionManifest: null };
  }
  if (!preparation.proposal.ok || !preparation.proposal.proposal
    || !preparation.reviewer.ok || !preparation.reviewer.review) {
    throw new Error('ELIGIBLE Formal Event preparation lacks validated Proposal or Reviewer output');
  }

  const participantEvidence = await readPreparedParticipantEvidence(preparation);
  const executionManifest = await (dependencies.buildExecutionManifest ?? buildBoundedFormalEventTrialExecutionManifest)({
    repositoryRoot: input.repositoryRoot,
    preparedAgainst: preparation.repository,
    participantEvidence,
    proposalParticipant: preparation.proposal,
    reviewerParticipant: preparation.reviewer,
    observedLifeStates: input.observedLifeStates,
    executionManifestPath: input.executionManifestPath,
  }, dependencies.executionManifestDependencies);
  if (canonicalJson(executionManifest.admission) !== canonicalJson(preparation.admission)) {
    throw new Error('Host Admission changed between eligible preparation and execution-manifest creation');
  }

  const shadowTrial = await (dependencies.runShadowTrial ?? runBoundedFormalEventShadowTrial)({
    authoritativeRoot: input.repositoryRoot,
    shadowRoot: input.shadowRoot,
    artifactRoot: input.artifactRoot,
    proposal: preparation.proposal.proposal,
    review: preparation.reviewer.review,
    observedLifeStates: input.observedLifeStates,
    executionManifestPath: executionManifest.manifestRef.executionManifestPath,
    executionManifestSha256: executionManifest.manifestRef.executionManifestSha256,
  }, dependencies.shadowTrialDependencies);
  return { preparation, executionManifest, shadowTrial };
}
