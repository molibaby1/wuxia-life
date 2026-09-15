import assert from 'node:assert/strict';
import { buildMultiCandidateHumanReviewSummary } from '../../scripts/evolution/reporting/buildHumanReviewSummary';

function candidate(input: Partial<Parameters<typeof buildMultiCandidateHumanReviewSummary>[0]['candidates'][number]> = {}) {
  return {
    candidateRef: 'source-epoch-000001/candidates/hypothesis-000001',
    hypothesisId: 'hypothesis-000001',
    sourceIndex: 0,
    processingState: 'COMPLETED' as const,
    effectiveRoute: 'SKIP',
    effectiveReasonCode: 'NO_PROBLEM_FORMED',
    effectiveDecisionRef: 'decision.json',
    humanFollowupRef: null,
    supersededBySourceEpochRef: null,
    interruptionRef: null,
    ...input,
  };
}

function input(overrides: Partial<Parameters<typeof buildMultiCandidateHumanReviewSummary>[0]> = {}) {
  return {
    logicalSessionId: 'logical-session-000001',
    sessionState: 'PAUSED' as const,
    pauseOrStopReason: 'HOST_SLICE_BUDGET',
    candidates: [
      candidate(),
      candidate({ candidateRef: 'source-epoch-000001/candidates/hypothesis-000002', hypothesisId: 'hypothesis-000002', sourceIndex: 1, effectiveRoute: 'DEFER', effectiveReasonCode: 'INSUFFICIENT_EVIDENCE' }),
      candidate({ candidateRef: 'source-epoch-000001/candidates/hypothesis-000003', hypothesisId: 'hypothesis-000003', sourceIndex: 2, effectiveRoute: 'ESCALATE_HUMAN', effectiveReasonCode: 'EXPLICIT_ESCALATION', humanFollowupRef: 'human-follow-up/item-000003.json' }),
      candidate({ candidateRef: 'source-epoch-000001/candidates/hypothesis-000004', hypothesisId: 'hypothesis-000004', sourceIndex: 3, processingState: 'PENDING', effectiveRoute: null, effectiveReasonCode: null, effectiveDecisionRef: null }),
    ],
    ...overrides,
  };
}

export function runMultiCandidateHumanReviewSummaryTests(): void {
  const mixed = buildMultiCandidateHumanReviewSummary(input());
  assert.equal(mixed.logicalSessionId, 'logical-session-000001');
  assert.equal(mixed.sessionState, 'PAUSED');
  assert.equal(mixed.actions.filter(action => action.kind === 'RESUME_SESSION').length, 1);
  assert.equal(mixed.actions.find(action => action.kind === 'RESUME_SESSION')?.blocksResume, false);
  const review = mixed.actions.find(action => action.kind === 'REVIEW_HUMAN_FOLLOWUP');
  assert.ok(review);
  assert.equal(review.candidateRef, 'source-epoch-000001/candidates/hypothesis-000003');
  assert.equal(review.humanFollowupRef, 'human-follow-up/item-000003.json');
  assert.equal(review.blocksResume, false);
  assert.equal(mixed.actions.some(action => action.kind === 'AWAIT_EXECUTION_AUTHORITY'), false);
  assert.equal('recommendedAction' in mixed, false);
  assert.equal(mixed.actions.some(action => action.reason.includes('winner')), false);

  const failed = buildMultiCandidateHumanReviewSummary(input({ sessionState: 'FAILED', pauseOrStopReason: 'PARTICIPANT_FAILURE' }));
  const investigation = failed.actions.find(action => action.kind === 'INVESTIGATE_HOST_FAILURE');
  assert.ok(investigation);
  assert.equal(investigation.blocksResume, true);
  assert.equal(failed.actions.some(action => action.kind === 'RESUME_SESSION'), false);

  const sourceChange = buildMultiCandidateHumanReviewSummary(input({ pauseOrStopReason: 'SOURCE_CHANGE_LIMIT_REACHED' }));
  const authority = sourceChange.actions.find(action => action.kind === 'AWAIT_EXECUTION_AUTHORITY');
  assert.ok(authority);
  assert.equal(authority.blocksResume, true);
  assert.match(authority.reason, /authority|授权/i);
  assert.equal(sourceChange.actions.some(action => action.kind === 'RESUME_SESSION'), false);

  const completed = buildMultiCandidateHumanReviewSummary(input({ sessionState: 'COMPLETED', pauseOrStopReason: null, candidates: [candidate(), candidate({ effectiveRoute: 'DEFER', effectiveReasonCode: 'INSUFFICIENT_EVIDENCE' })] }));
  assert.equal(completed.actions.some(action => action.kind === 'RESUME_SESSION'), false);
  assert.equal(completed.actions.some(action => action.kind === 'REVIEW_HUMAN_FOLLOWUP'), false);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMultiCandidateHumanReviewSummaryTests();
  console.log('multiCandidateHumanReviewSummary.test.ts: ok');
}
