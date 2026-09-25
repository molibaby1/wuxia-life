import { mkdir, open } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import {
  captureWorkspaceSnapshot,
  prepareAgentWorkspace,
  type PreparedAgentWorkspace,
} from '../problemAgnosticSolution/agentWorkspace';
import type { ParticipantExecutionTraceV1, WorkspaceAgentParticipantOptions } from '../problemAgnosticSolution/agentParticipant';
import { runStructuredParticipantExecution } from '../problemAgnosticSolution/runStructuredParticipantExecution';
import { validateAutonomousAuthoringAdmission, type AutonomousAuthoringAdmissionV1 } from '../../../src/evolution/autonomousAuthoringAdmissionContract';
import { validateAutonomousAuthoringProposal } from '../../../src/evolution/autonomousAuthoringContract';
import {
  PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
  PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH,
  PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS,
} from '../../../src/evolution/preschoolSharedNeutralAuthoringContract';
import { validateSolutionReview, type SolutionReviewV1 } from '../../../src/evolution/solutionReviewContract';
import { validateSolutionWork, type SolutionWorkV1 } from '../../../src/evolution/solutionWorkContract';
import {
  validateShadowAuthoringExecutionParticipantResult,
  type ShadowAuthoringExecutionParticipantResultV1,
} from '../../../src/evolution/shadowAuthoringResultContract';
import { buildDeterministicPromotionPatch, compareWorkspaceSnapshots, type CanonicalWorkspaceChange } from './workspaceChangeSet';

export interface ShadowAuthoringExecutionRun {
  status: 'completed' | 'failed';
  invocationRef: string;
  artifactRoot: string;
  preparedWorkspace: PreparedAgentWorkspace;
  participantResult: ShadowAuthoringExecutionParticipantResultV1 | null;
  failure: string | null;
  rawOutput: string;
  stderr: string;
  executionTrace: ParticipantExecutionTraceV1;
  canonicalChanges: CanonicalWorkspaceChange[];
  promotionPatch: Buffer;
  promotionPatchSha256: string;
  authoritativeFingerprintBefore: string;
  authoritativeFingerprintAfter: string;
  proposalSha256: string;
  reviewSha256: string;
  admissionSha256: string;
  participantJobs: 1;
}

async function writeCreateOnly(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(content, 'utf8');
  } finally {
    await handle.close();
  }
}

async function writeCreateOnlyJson(path: string, value: unknown): Promise<void> {
  await writeCreateOnly(path, `${canonicalJson(value)}\n`);
}

function buildShadowAuthoringPrompt(cards: unknown): string {
  return [
    'Implement the accepted Preschool Shared-Neutral Authoring Cards exactly in this isolated shadow workspace.',
    'The Cards are accepted product content and are immutable. Do not edit, reinterpret, shorten, or replace any Card field.',
    '',
    'Accepted Cards:',
    canonicalJson(cards),
    '',
    'The only allowed write paths are exactly these three paths:',
    canonicalJson(PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS),
    '',
    `Append each Card's proposedEntry exactly to ${PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH}; preserve every existing catalog row and order.`,
    `Append a self-contained focused regression block at EOF of ${PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS[0]} for every proposed ID.`,
    `Append a self-contained focused regression block at EOF of ${PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS[1]} for every proposed ID.`,
    'Do not alter any accepted ID, title, text, origin tag, or age value.',
    'Do not modify any other file or path.',
    'Do not commit, push, or merge.',
    'Return one bare JSON object with schemaVersion, status, changedFiles, verificationCommandsRun, and deviations.',
    'The changedFiles field is diagnostic only. Host independently derives the canonical changed-file set.',
  ].join('\n');
}

function assertAcceptedAuthoring(input: {
  solution: SolutionWorkV1;
  review: SolutionReviewV1;
  admission: AutonomousAuthoringAdmissionV1;
}): {
  proposalSha256: string;
  reviewSha256: string;
  admissionSha256: string;
  cards: NonNullable<NonNullable<SolutionWorkV1['options'][number]['autonomousAuthoring']>['contractPayload']>['cards'];
} {
  const solution = validateSolutionWork(input.solution);
  const review = validateSolutionReview(input.review);
  const admission = validateAutonomousAuthoringAdmission(input.admission);
  if (solution.status !== 'OPTIONS' || review.decision !== 'ACCEPT_OPTION' || review.acceptedOptionId === undefined) {
    throw new Error('shadow authoring requires an accepted Solution option');
  }
  const option = solution.options.find(item => item.optionId === review.acceptedOptionId);
  if (!option?.autonomousAuthoring) throw new Error('accepted Solution option has no autonomous authoring proposal');
  if (option.changeScope !== 'program') throw new Error('autonomous authoring option must use program scope');
  const proposal = validateAutonomousAuthoringProposal(option.autonomousAuthoring);
  const assessment = review.autonomousAuthoringAssessment;
  if (
    proposal.applicabilityClaim !== 'APPLICABLE'
    || !assessment
    || assessment.contractId !== proposal.contractId
    || assessment.contractVersion !== proposal.contractVersion
    || assessment.applicabilityAssessment !== 'APPLICABLE'
    || assessment.conformance !== 'CONFORMING'
    || assessment.executionEnvelope !== 'WITHIN_ENVELOPE'
    || assessment.blockers.length !== 0
    || review.executionAuthorityAssessment !== 'WITHIN_CURRENT_AUTHORITY'
  ) {
    throw new Error('shadow authoring requires a conforming accepted authoring assessment and current authority');
  }
  if (
    admission.status !== 'ELIGIBLE'
    || admission.contractId !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID
    || admission.contractVersion !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION
  ) {
    throw new Error('shadow authoring requires current ELIGIBLE Host admission');
  }
  const proposalSha256 = sha256Hex(canonicalJson(proposal));
  const reviewSha256 = sha256Hex(canonicalJson(review));
  if (admission.proposalSha256 !== proposalSha256 || admission.reviewSha256 !== reviewSha256) {
    throw new Error('shadow authoring admission does not reference the accepted Solution and Review');
  }
  if (!proposal.contractPayload) throw new Error('accepted autonomous authoring proposal has no Cards');
  return {
    proposalSha256,
    reviewSha256,
    admissionSha256: sha256Hex(canonicalJson(admission)),
    cards: proposal.contractPayload.cards,
  };
}

export async function runShadowAuthoringExecution(input: {
  repositoryRoot: string;
  workspaceDestinationRoot: string;
  artifactRoot: string;
  invocationRef: string;
  solution: SolutionWorkV1;
  review: SolutionReviewV1;
  admission: AutonomousAuthoringAdmissionV1;
  participant: WorkspaceAgentParticipantOptions;
}): Promise<ShadowAuthoringExecutionRun> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const artifactRoot = resolve(input.artifactRoot);
  const accepted = assertAcceptedAuthoring(input);
  const before = await captureWorkspaceSnapshot(repositoryRoot);
  const preparedWorkspace = await prepareAgentWorkspace({
    authoritativeRoot: repositoryRoot,
    destinationRoot: input.workspaceDestinationRoot,
    jobKind: 'shadow-authoring',
  });
  if (preparedWorkspace.authoritativeFingerprintSha256 !== before.fingerprintSha256) {
    throw new Error('authoritative repository changed while preparing the shadow workspace');
  }
  await writeCreateOnlyJson(join(artifactRoot, 'invocation.json'), {
    schemaVersion: 'shadow-authoring-invocation-v1',
    invocationRef: input.invocationRef,
    contractId: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
    contractVersion: PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
    proposalSha256: accepted.proposalSha256,
    reviewSha256: accepted.reviewSha256,
    admissionSha256: accepted.admissionSha256,
    allowedWritePaths: PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS,
    authoritativeFingerprintSha256: before.fingerprintSha256,
  });

  const structured = await runStructuredParticipantExecution({
    invocationRef: input.invocationRef,
    role: 'configuration-execution',
    workspaceRoot: preparedWorkspace.workspaceRoot,
    destinationRoot: artifactRoot,
    initialPrompt: buildShadowAuthoringPrompt(accepted.cards),
    expectedRoleSchemaName: 'ShadowAuthoringExecutionParticipantResultV1',
    participant: input.participant,
    retransmissionEnabled: false,
    validateSchema: validateShadowAuthoringExecutionParticipantResult,
    validateAcceptedResult: async () => undefined,
  });
  const after = await captureWorkspaceSnapshot(repositoryRoot);
  const finalWorkspace = await captureWorkspaceSnapshot(preparedWorkspace.workspaceRoot);
  const canonicalChanges = compareWorkspaceSnapshots(before, finalWorkspace);
  const promotion = await buildDeterministicPromotionPatch({
    beforeRoot: repositoryRoot,
    afterRoot: preparedWorkspace.workspaceRoot,
    changes: canonicalChanges,
  });
  const authoritativeChanged = after.fingerprintSha256 !== before.fingerprintSha256;
  const participantResult = structured.ok ? structured.value : null;
  const failure = authoritativeChanged
    ? 'authoritative repository fingerprint changed during shadow execution'
    : !structured.ok
      ? structured.message
      : structured.value.status === 'failed'
        ? 'Shadow Executor reported failed status'
        : null;
  const rawOutput = structured.rawOutput ?? '';
  const stderr = structured.ok ? structured.stderr : '';
  await writeCreateOnly(join(artifactRoot, 'raw-output.txt'), rawOutput);
  await writeCreateOnlyJson(join(artifactRoot, 'execution-trace.json'), structured.executionTrace);
  if (participantResult) {
    await writeCreateOnlyJson(join(artifactRoot, 'executor-result.json'), participantResult);
  }
  if (stderr.length > 0) await writeCreateOnly(join(artifactRoot, 'stderr.txt'), stderr);

  return {
    status: failure === null ? 'completed' : 'failed',
    invocationRef: input.invocationRef,
    artifactRoot,
    preparedWorkspace,
    participantResult,
    failure,
    rawOutput,
    stderr,
    executionTrace: structured.executionTrace,
    canonicalChanges,
    promotionPatch: promotion.patch,
    promotionPatchSha256: promotion.patchSha256,
    authoritativeFingerprintBefore: before.fingerprintSha256,
    authoritativeFingerprintAfter: after.fingerprintSha256,
    proposalSha256: accepted.proposalSha256,
    reviewSha256: accepted.reviewSha256,
    admissionSha256: accepted.admissionSha256,
    participantJobs: 1,
  };
}
