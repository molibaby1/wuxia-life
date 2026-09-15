import assert from 'node:assert/strict';
import {
  buildCandidatePoolV1,
  parseCandidatePoolV1,
  type CandidatePoolV1,
} from '../../scripts/evolution/candidatePoolContract';
import { completeCandidate, activateCandidate, nextPendingCandidate, markSourceChangePending, exhaustPoolIfComplete } from '../../scripts/evolution/candidatePoolState';

const hypotheses = [
  {
    hypothesisId: 'hypothesis-000001',
    hypothesis: 'First candidate.',
    observedBasis: 'Observed first.',
    feedbackRefs: ['overallImpression'],
    evidenceRefs: ['entry-000001'],
    unknowns: ['Cause one.'],
    productSignificance: 'Significant one.',
  },
  {
    hypothesisId: 'hypothesis-000002',
    hypothesis: 'Second candidate.',
    observedBasis: 'Observed second.',
    feedbackRefs: ['observations[0]'],
    evidenceRefs: ['entry-000002'],
    unknowns: ['Cause two.'],
    productSignificance: 'Significant two.',
  },
];

function buildPool(): CandidatePoolV1 {
  return buildCandidatePoolV1({
    logicalSessionId: 'logical-session-000001',
    sourceEpochId: 'source-epoch-000001',
    sourceRunRef: 'cohort-run-000001',
    sourceFingerprintSha256: 'a'.repeat(64),
    sealedSourceRef: 'sources/cohort-run-000001',
    hypothesisSet: {
      artifactRef: 'hypothesis-runs/cohort-run-000001/hypotheses.json',
      hypotheses,
    },
    baseline: {
      branch: 'dev',
      headSha: 'b'.repeat(40),
      workingTreeFingerprint: 'c'.repeat(64),
      participantBinding: 'CODEX_CURRENT',
    },
  });
}

export async function runCandidatePoolContractTests(): Promise<void> {
  const pool = buildPool();
  assert.equal(pool.schemaVersion, 'candidate-pool-v1');
  assert.deepEqual(pool.candidates.map(candidate => candidate.hypothesisId), [
    'hypothesis-000001',
    'hypothesis-000002',
  ]);
  assert.deepEqual(pool.candidates.map(candidate => candidate.sourceIndex), [0, 1]);
  assert.equal(pool.candidates[1]!.processingState, 'PENDING');
  assert.deepEqual(parseCandidatePoolV1(pool).candidates, pool.candidates);

  assert.throws(() => parseCandidatePoolV1({
    ...pool,
    candidates: [
      { ...pool.candidates[0]!, sourceIndex: 1 },
      { ...pool.candidates[1]!, sourceIndex: 0 },
    ],
  }), /sourceIndex|order/i);
  assert.throws(() => parseCandidatePoolV1({
    ...pool,
    candidates: [
      { ...pool.candidates[0]!, processingState: 'ACTIVE' },
      { ...pool.candidates[1]!, processingState: 'ACTIVE' },
    ],
  }), /ACTIVE/i);
  assert.throws(() => parseCandidatePoolV1({
    ...pool,
    candidates: [{ ...pool.candidates[0]!, processingState: 'COMPLETED' }, pool.candidates[1]!],
  }), /effectiveDecisionRef/i);
  assert.throws(() => parseCandidatePoolV1({
    ...pool,
    candidates: [{ ...pool.candidates[0]!, processingState: 'SOURCE_CHANGE_PENDING' }, pool.candidates[1]!],
  }), /effectiveDecisionRef/i);
  assert.throws(() => parseCandidatePoolV1({
    ...pool,
    candidates: [{ ...pool.candidates[0]!, processingState: 'SUPERSEDED' }, pool.candidates[1]!],
  }), /supersededBySourceEpochRef/i);
  assert.throws(() => parseCandidatePoolV1({
    ...pool,
    status: 'EXHAUSTED',
  }), /PENDING|EXHAUSTED/i);
  assert.throws(() => parseCandidatePoolV1({
    ...pool,
    candidates: [{ ...pool.candidates[0]!, candidateRef: 'wrong/hypothesis-000009' }, pool.candidates[1]!],
  }), /candidateRef|identity/i);

  const first = nextPendingCandidate(pool)!;
  assert.equal(first.hypothesisId, 'hypothesis-000001');
  const active = activateCandidate(pool, first.candidateRef);
  assert.equal(active.candidates.filter(candidate => candidate.processingState === 'ACTIVE').length, 1);
  const completed = completeCandidate(active, first.candidateRef, {
    laneRef: 'candidates/hypothesis-000001',
    baseDecisionRef: 'candidates/hypothesis-000001/decision.json',
    effectiveDecisionRef: 'candidates/hypothesis-000001/decision.json',
  });
  assert.equal(nextPendingCandidate(completed)!.hypothesisId, 'hypothesis-000002');
  const secondActive = activateCandidate(completed, completed.candidates[1]!.candidateRef);
  const barrier = markSourceChangePending(secondActive, secondActive.candidates[1]!.candidateRef, {
    laneRef: 'candidates/hypothesis-000002',
    baseDecisionRef: 'candidates/hypothesis-000002/decision.json',
    effectiveDecisionRef: 'candidates/hypothesis-000002/decision.json',
    sourceTransitionRef: 'source-transition-000001',
  });
  assert.equal(barrier.status, 'SOURCE_CHANGE_BARRIER');
  assert.equal(nextPendingCandidate(barrier), null);
  const secondCompleted = completeCandidate(
    activateCandidate(completed, completed.candidates[1]!.candidateRef),
    completed.candidates[1]!.candidateRef,
    {
      laneRef: 'candidates/hypothesis-000002',
      baseDecisionRef: 'candidates/hypothesis-000002/decision.json',
      effectiveDecisionRef: 'candidates/hypothesis-000002/decision.json',
    },
  );
  const exhausted = exhaustPoolIfComplete(secondCompleted);
  assert.equal(exhausted.status, 'EXHAUSTED');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCandidatePoolContractTests()
    .then(() => console.log('candidatePoolContract.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
