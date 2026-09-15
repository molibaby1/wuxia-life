import { join, resolve } from 'node:path';
import {
  buildCandidatePoolV1,
  type BuildCandidatePoolInput,
  type CandidatePoolV1,
} from './candidatePoolContract';
import {
  activateCandidate,
  completeCandidate,
  exhaustPoolIfComplete,
  interruptCandidate,
  markSourceChangePending,
  nextPendingCandidate,
} from './candidatePoolState';
import type { CompletedSourceCandidateAnalysisResult } from './runSourceCandidateAnalysis';
import {
  runCandidateLane,
  type CandidateLaneResult,
  type RunCandidateLaneOptions,
} from './runCandidateLane';
import type { WorkspaceAgentParticipantOptions } from './problemAgnosticSolution/agentParticipant';

export interface RunSourceCandidatePoolResult {
  sourceAnalysis: CompletedSourceCandidateAnalysisResult;
  pool: CandidatePoolV1;
  laneResults: CandidateLaneResult[];
  participantJobs: number;
  stopKind: 'POOL_EXHAUSTED' | 'SOURCE_CHANGE_BARRIER' | 'PARTICIPANT_FAILURE';
}

export interface CandidatePoolLaneInput {
  pool: CandidatePoolV1;
  candidate: CandidatePoolV1['candidates'][number];
}

export interface RunSourceCandidatePoolOptions {
  sourceAnalysis: CompletedSourceCandidateAnalysisResult;
  logicalSessionId?: string;
  sourceEpochId?: string;
  sealedSourceRef?: string;
  baseline?: CandidatePoolV1['baseline'];
  pool?: CandidatePoolV1;
  initialPool?: CandidatePoolV1;
  laneRoot?: string;
  authorityRefs?: string[];
  participant?: WorkspaceAgentParticipantOptions;
  participantMode?: 'deepseek' | 'local-subagent';
  repositoryRoot?: string;
  candidateLaneRunner?: (input: CandidatePoolLaneInput) => Promise<CandidateLaneResult>;
  runCandidateLane?: (input: CandidatePoolLaneInput) => Promise<CandidateLaneResult>;
}

function buildInitialPool(options: RunSourceCandidatePoolOptions): CandidatePoolV1 {
  const supplied = options.pool ?? options.initialPool;
  if (supplied) return supplied;
  if (!options.logicalSessionId || !options.sourceEpochId || !options.sealedSourceRef || !options.baseline) {
    throw new Error('candidate pool requires an initial Pool or logicalSessionId/sourceEpochId/sealedSourceRef/baseline');
  }
  const input: BuildCandidatePoolInput = {
    logicalSessionId: options.logicalSessionId,
    sourceEpochId: options.sourceEpochId,
    sourceRunRef: options.sourceAnalysis.sourceRunRef,
    sourceFingerprintSha256: options.sourceAnalysis.sourceFingerprintSha256,
    sealedSourceRef: options.sealedSourceRef,
    hypothesisSet: {
      artifactRef: options.sourceAnalysis.improvementHypothesisRef,
      sha256: undefined,
      hypotheses: options.sourceAnalysis.hypotheses,
    },
    baseline: options.baseline,
  };
  return buildCandidatePoolV1(input);
}

function defaultCandidateLaneRunner(options: RunSourceCandidatePoolOptions, pool: CandidatePoolV1) {
  const repositoryRoot = resolve(options.repositoryRoot ?? process.cwd());
  if (!options.participant || !options.laneRoot || !options.authorityRefs || !options.participantMode) {
    throw new Error('default candidate lane runner requires repositoryRoot, laneRoot, authorityRefs, participant, and participantMode');
  }
  return async ({ candidate }: CandidatePoolLaneInput): Promise<CandidateLaneResult> => {
    const laneOptions: RunCandidateLaneOptions = {
      repositoryRoot,
      sourceRoot: options.laneRoot!,
      laneRoot: join(options.laneRoot!, 'candidates', candidate.hypothesisId),
      poolId: pool.poolId,
      candidateRef: candidate.candidateRef,
      candidate: options.sourceAnalysis.hypotheses[candidate.sourceIndex]!,
      sourceIndex: candidate.sourceIndex,
      hypothesisSetRef: pool.hypothesisSet.artifactRef,
      hypothesisSetSha256: pool.hypothesisSet.sha256,
      sourceRunRef: pool.source.sourceRunRef,
      sourceExperimentRootHash: options.sourceAnalysis.sourceExperimentRootHash,
      sourceFingerprintSha256: pool.source.sourceFingerprintSha256,
      observablePayloadRef: options.sourceAnalysis.observablePayloadRef,
      externalFeedbackRef: options.sourceAnalysis.externalFeedbackRef,
      improvementHypothesisRef: options.sourceAnalysis.improvementHypothesisRef,
      authorityRefs: options.authorityRefs!,
      participant: options.participant!,
      participantMode: options.participantMode!,
    };
    return runCandidateLane(laneOptions);
  };
}

export async function runSourceCandidatePool(options: RunSourceCandidatePoolOptions): Promise<RunSourceCandidatePoolResult> {
  const poolInitial = buildInitialPool(options);
  let pool = poolInitial;
  const laneResults: CandidateLaneResult[] = [];
  let participantJobs = options.sourceAnalysis.actualParticipantJobs;
  const injectedRunner = options.candidateLaneRunner ?? options.runCandidateLane;
  const laneRunner = injectedRunner ?? defaultCandidateLaneRunner(options, pool);
  while (pool.status === 'PROCESSING') {
    const pending = nextPendingCandidate(pool);
    if (pending === null) {
      pool = exhaustPoolIfComplete(pool);
      break;
    }
    pool = activateCandidate(pool, pending.candidateRef);
    const candidate = pool.candidates.find(item => item.candidateRef === pending.candidateRef)!;
    const result = await laneRunner({ pool, candidate });
    laneResults.push(result);
    participantJobs += result.actualParticipantJobs;
    if (result.status === 'participant_failure') {
      pool = interruptCandidate(pool, candidate.candidateRef, result.workflowOutcomeRef);
      break;
    }
    if (result.decision.route === 'READY_FOR_CONFIG_EXECUTION') {
      pool = markSourceChangePending(pool, candidate.candidateRef, {
        laneRef: `candidates/${candidate.hypothesisId}`,
        baseDecisionRef: result.baseDecisionPath,
        effectiveDecisionRef: result.decisionPath,
        sourceTransitionRef: `source-transition-pending/${candidate.hypothesisId}`,
      });
      break;
    }
    pool = completeCandidate(pool, candidate.candidateRef, {
      laneRef: `candidates/${candidate.hypothesisId}`,
      baseDecisionRef: result.baseDecisionPath,
      effectiveDecisionRef: result.decisionPath,
      humanFollowupRef: null,
    });
  }
  const stopKind = pool.status === 'EXHAUSTED'
    ? 'POOL_EXHAUSTED'
    : pool.status === 'SOURCE_CHANGE_BARRIER'
      ? 'SOURCE_CHANGE_BARRIER'
      : 'PARTICIPANT_FAILURE';
  return { sourceAnalysis: options.sourceAnalysis, pool, laneResults, participantJobs, stopKind };
}
