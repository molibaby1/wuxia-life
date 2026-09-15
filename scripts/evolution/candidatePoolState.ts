import {
  parseCandidatePoolV1,
  type CandidatePoolV1,
  type CandidateRecordV1,
  type CandidateProcessingState,
} from './candidatePoolContract';

function candidateIndex(pool: CandidatePoolV1, candidateRef: string): number {
  const index = pool.candidates.findIndex(candidate => candidate.candidateRef === candidateRef);
  if (index < 0) throw new Error(`candidate not found: ${candidateRef}`);
  return index;
}

function appendTransition(
  pool: CandidatePoolV1,
  candidateRef: string | null,
  fromState: CandidateProcessingState | null,
  toState: CandidateProcessingState | null,
  toPoolStatus: CandidatePoolV1['status'],
  reason: string,
): CandidatePoolV1 {
  const transitionId = `pool-transition-${String(pool.transitions.length + 1).padStart(6, '0')}`;
  return {
    ...pool,
    status: toPoolStatus,
    candidates: pool.candidates.map(candidate => ({ ...candidate })),
    transitions: [
      ...pool.transitions,
      {
        transitionId,
        candidateRef,
        fromState,
        toState,
        fromPoolStatus: pool.status,
        toPoolStatus,
        reason,
      },
    ],
  };
}

function updateCandidate(
  pool: CandidatePoolV1,
  candidateRef: string,
  expectedState: CandidateProcessingState,
  nextState: CandidateProcessingState,
  patch: Partial<CandidateRecordV1>,
  nextPoolStatus: CandidatePoolV1['status'],
  reason: string,
): CandidatePoolV1 {
  if (pool.status !== 'PROCESSING') throw new Error(`candidate pool is not processing: ${pool.status}`);
  const index = candidateIndex(pool, candidateRef);
  const current = pool.candidates[index]!;
  if (current.processingState !== expectedState) {
    throw new Error(`candidate ${candidateRef} must be ${expectedState}, got ${current.processingState}`);
  }
  const next = {
    ...current,
    ...patch,
    processingState: nextState,
  };
  const updated = {
    ...pool,
    candidates: pool.candidates.map((candidate, candidateIndexValue) => candidateIndexValue === index ? next : { ...candidate }),
  };
  return parseCandidatePoolV1(appendTransition(updated, candidateRef, expectedState, nextState, nextPoolStatus, reason));
}

export function nextPendingCandidate(pool: CandidatePoolV1): CandidateRecordV1 | null {
  const parsed = parseCandidatePoolV1(pool);
  if (parsed.status !== 'PROCESSING') return null;
  if (parsed.candidates.some(candidate => candidate.processingState === 'ACTIVE')) {
    throw new Error('candidate pool already has an ACTIVE candidate');
  }
  return parsed.candidates.find(candidate => candidate.processingState === 'PENDING') ?? null;
}

export function activateCandidate(pool: CandidatePoolV1, candidateRef: string): CandidatePoolV1 {
  return updateCandidate(pool, candidateRef, 'PENDING', 'ACTIVE', {}, 'PROCESSING', 'candidate activated in source order');
}

export function completeCandidate(
  pool: CandidatePoolV1,
  candidateRef: string,
  refs: { laneRef: string; baseDecisionRef: string; effectiveDecisionRef: string; humanFollowupRef?: string | null },
): CandidatePoolV1 {
  return updateCandidate(pool, candidateRef, 'ACTIVE', 'COMPLETED', {
    laneRef: refs.laneRef,
    baseDecisionRef: refs.baseDecisionRef,
    effectiveDecisionRef: refs.effectiveDecisionRef,
    humanFollowupRef: refs.humanFollowupRef ?? null,
  }, 'PROCESSING', 'candidate reached an ordinary terminal disposition');
}

export function markSourceChangePending(
  pool: CandidatePoolV1,
  candidateRef: string,
  refs: { laneRef: string; baseDecisionRef: string; effectiveDecisionRef: string; sourceTransitionRef: string },
): CandidatePoolV1 {
  return updateCandidate(pool, candidateRef, 'ACTIVE', 'SOURCE_CHANGE_PENDING', {
    laneRef: refs.laneRef,
    baseDecisionRef: refs.baseDecisionRef,
    effectiveDecisionRef: refs.effectiveDecisionRef,
    sourceTransitionRef: refs.sourceTransitionRef,
  }, 'SOURCE_CHANGE_BARRIER', 'candidate reached READY_FOR_CONFIG_EXECUTION source barrier');
}

export function interruptCandidate(
  pool: CandidatePoolV1,
  candidateRef: string,
  interruptionRef: string,
): CandidatePoolV1 {
  return updateCandidate(pool, candidateRef, 'ACTIVE', 'INTERRUPTED', { interruptionRef }, 'INTERRUPTED', 'candidate participant or host failure');
}

export function exhaustPoolIfComplete(pool: CandidatePoolV1): CandidatePoolV1 {
  const parsed = parseCandidatePoolV1(pool);
  if (parsed.status !== 'PROCESSING') return parsed;
  if (parsed.candidates.some(candidate => candidate.processingState === 'PENDING' || candidate.processingState === 'ACTIVE')) {
    return parsed;
  }
  return parseCandidatePoolV1(appendTransition(parsed, null, null, null, 'EXHAUSTED', 'all candidates have terminal processing state'));
}
