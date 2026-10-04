export interface DeterministicEvolutionSuite {
  name: string;
  entry: string;
  boundary: string;
}

export const DETERMINISTIC_EVOLUTION_SUITES = [
  { name: 'candidatePoolContract', entry: 'tests/evolution/candidatePoolContract.test.ts', boundary: 'state-contract' },
  { name: 'candidateSessionStore', entry: 'tests/evolution/candidateSessionStore.test.ts', boundary: 'durable-storage' },
  { name: 'candidateSliceBudget', entry: 'tests/evolution/candidateSliceBudget.test.ts', boundary: 'session-orchestration' },
  { name: 'multiCandidateSessionManifestContract', entry: 'tests/evolution/multiCandidateSessionManifestContract.test.ts', boundary: 'durable-storage' },
  { name: 'candidateLaneFailureContract', entry: 'tests/evolution/candidateLaneFailureContract.test.ts', boundary: 'candidate-lane' },
  { name: 'sourceCandidateAnalysis', entry: 'tests/evolution/sourceCandidateAnalysis.test.ts', boundary: 'source-analysis' },
  { name: 'sourceCandidatePool', entry: 'tests/evolution/sourceCandidatePool.test.ts', boundary: 'source-analysis' },
  { name: 'candidateLane', entry: 'tests/evolution/candidateLane.test.ts', boundary: 'candidate-lane' },
  { name: 'candidateReviewContinuation', entry: 'tests/evolution/candidateReviewContinuation.test.ts', boundary: 'solution-review' },
  { name: 'candidateSessionReconciliation', entry: 'tests/evolution/candidateSessionReconciliation.test.ts', boundary: 'durable-storage' },
  { name: 'participantHardTimeoutPolicyV1', entry: 'tests/evolution/participantHardTimeoutPolicyV1.test.ts', boundary: 'participant-transport' },
  { name: 'participantFailureOutcomeContract', entry: 'tests/evolution/participantFailureOutcomeContract.test.ts', boundary: 'participant-transport' },
  { name: 'participantFailureRouting', entry: 'tests/evolution/participantFailureRouting.test.ts', boundary: 'participant-transport' },
  { name: 'structuredTerminalEnvelope', entry: 'tests/evolution/structuredTerminalEnvelope.test.ts', boundary: 'participant-transport' },
  { name: 'envelopeRetransmission', entry: 'tests/evolution/envelopeRetransmission.test.ts', boundary: 'participant-transport' },
  { name: 'referenceParticipantBinding', entry: 'tests/evolution/referenceParticipantBinding.test.ts', boundary: 'participant-transport' },
  { name: 'problemAgnosticSolutionContracts', entry: 'tests/evolution/problemAgnosticSolutionContracts.test.ts', boundary: 'solution-review' },
  { name: 'solutionAgentLoop', entry: 'tests/evolution/solutionAgentLoop.test.ts', boundary: 'solution-review' },
  { name: 'solutionReviewerLoop', entry: 'tests/evolution/solutionReviewerLoop.test.ts', boundary: 'solution-review' },
  { name: 'solutionDecisionRouter', entry: 'tests/evolution/solutionDecisionRouter.test.ts', boundary: 'solution-review' },
  { name: 'autonomousAuthoringContracts', entry: 'tests/evolution/autonomousAuthoringContracts.test.ts', boundary: 'autonomous-authoring' },
  { name: 'preschoolAutonomousAuthoringAdmission', entry: 'tests/evolution/preschoolAutonomousAuthoringAdmission.test.ts', boundary: 'autonomous-authoring' },
  { name: 'shadowAuthoringExecution', entry: 'tests/evolution/shadowAuthoringExecution.test.ts', boundary: 'autonomous-authoring' },
  { name: 'preschoolShadowAuthoringVerification', entry: 'tests/evolution/preschoolShadowAuthoringVerification.test.ts', boundary: 'autonomous-authoring' },
  { name: 'preschoolAutonomousAuthoringReferenceTrial', entry: 'tests/evolution/preschoolAutonomousAuthoringReferenceTrial.test.ts', boundary: 'autonomous-authoring' },
  { name: 'multiCandidateSessionSlice', entry: 'tests/evolution/multiCandidateSessionSlice.test.ts', boundary: 'session-orchestration' },
  { name: 'multiCandidateOrdinaryEvolutionOperator', entry: 'tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts', boundary: 'operator' },
  { name: 'ordinaryEvolutionOperator', entry: 'tests/evolution/ordinaryEvolutionOperator.test.ts', boundary: 'operator' },
] as const satisfies readonly DeterministicEvolutionSuite[];
