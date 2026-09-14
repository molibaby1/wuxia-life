import { join, resolve } from 'node:path';
import type { MultiRoundSessionSummary } from '../multiRoundRunManifestContract';
import { collectOrdinaryEvidence } from './ordinaryEvidenceCollector';
import { buildParticipantInvocationReceiptInputs } from './participantReceipt';
import { DURABLE_EVIDENCE_ROOT } from './durableEvidenceIndex';
import {
  promoteParticipantVisibleEvidence,
  publishDurableEvidenceCapsule,
  type DurableEvidenceCapsulePublishResult,
} from './durableEvidenceCapsule';

export interface RetainOrdinaryEvidenceInput {
  repositoryRoot: string;
  sessionRoot: string;
  experimentRoot: string;
  sessionId: string;
  sourceRunRef: string;
  sourceRunRefs: string[];
  repositoryIdentity: Record<string, unknown>;
  sessionExecution: MultiRoundSessionSummary;
  createdAt?: string;
}

export async function retainOrdinaryEvidenceCapsule(
  input: RetainOrdinaryEvidenceInput,
): Promise<DurableEvidenceCapsulePublishResult> {
  const evidence = await collectOrdinaryEvidence({
    repositoryRoot: input.repositoryRoot,
    sessionRoot: input.sessionRoot,
    experimentRoot: input.experimentRoot,
    sessionId: input.sessionId,
    sourceRunRefs: input.sourceRunRefs,
  });
  const participantReceipts = await buildParticipantInvocationReceiptInputs({
    experimentRoot: input.experimentRoot,
    evidence,
  });
  const receiptAlignedEvidence = promoteParticipantVisibleEvidence(evidence, participantReceipts);
  const configurationExecution = input.sessionExecution.execution.status !== 'not_started';
  const crossRoundTransition = input.sessionExecution.crossRoundTransitions > 0;
  const reviewContinuation = input.sessionExecution.schemaVersion === 'multi-round-session-summary-v2'
    ? input.sessionExecution.reviewContinuationCount > 0
    : false;
  const participantFailure = input.sessionExecution.stopReason.includes('PARTICIPANT_FAILURE');
  return publishDurableEvidenceCapsule({
    capsuleRoot: join(resolve(input.repositoryRoot), DURABLE_EVIDENCE_ROOT, input.sessionId),
    sessionId: input.sessionId,
    sourceRunRef: input.sourceRunRef,
    createdAt: input.createdAt ?? new Date().toISOString(),
    repositoryIdentity: input.repositoryIdentity,
    workflowIdentity: {
      workflow: 'ordinary-auto-evolution',
      sessionExecution: input.sessionExecution,
    },
    evidence: receiptAlignedEvidence,
    participantReceipts,
    importantEvents: {
      participantFailure,
      reviewContinuation,
      configurationExecution,
      crossRoundTransition,
    },
    extensions: {
      configurationExecution: {
        status: configurationExecution ? 'present' : 'not_applicable',
        refs: configurationExecution ? ['extensions/configuration-execution'] : [],
      },
      crossRoundTransition: {
        status: crossRoundTransition ? 'present' : 'not_applicable',
        refs: crossRoundTransition && input.sessionExecution.execution.resultingRunRef !== null
          ? [`source/${input.sessionExecution.execution.resultingRunRef}`]
          : [],
      },
    },
  });
}
