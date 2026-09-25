import assert from 'node:assert/strict';
import {
  parseReviewContinuation,
  parseReviewContinuationRevisionRequest,
  validateReviewContinuation,
  validateReviewContinuationRevisionRequest,
} from '../../src/evolution/reviewContinuationContract';

const SHA = 'a'.repeat(64);

function revisionRequest(): Record<string, unknown> {
  return {
    schemaVersion: 'review-continuation-revision-request-v1',
    continuationId: 'review-continuation-000001',
    continuationOrdinal: 1,
    round: 1,
    sourceRunRef: 'ordinary-run-20260910-000006',
    problemPackageRef: 'problem-package.json',
    problemPackageSha256: SHA,
    originalSolutionRef: 'solution-agent/result.json',
    originalSolutionSha256: SHA,
    originalReviewRef: 'reviewer-agent/review.json',
    originalReviewSha256: SHA,
    baseDecisionRef: 'decision.json',
    baseDecisionSha256: SHA,
    workspaceBaselineFingerprintSha256: SHA,
  };
}

function continuation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 'review-continuation-v1',
    continuationId: 'review-continuation-000001',
    continuationOrdinal: 1,
    round: 1,
    parentWorkflowRef: 'round-1',
    sourceRunRef: 'ordinary-run-20260910-000006',
    startedAt: '2026-09-12T00:00:00.000Z',
    completedAt: '2026-09-12T00:01:00.000Z',
    baseDecisionRef: 'decision.json',
    baseDecisionSha256: SHA,
    revisionRequestRef: 'review-continuation-000001/revision-request.json',
    revisionRequestSha256: SHA,
    revisionStatus: 'OPTIONS',
    reReviewStatus: 'ACCEPT_OPTION',
    continuationDecisionRef: 'review-continuation-000001/decision.json',
    continuationDecisionSha256: SHA,
    participantJobCount: 2,
    terminalStatus: 'completed',
    terminalRoute: 'READY_FOR_CONFIG_EXECUTION',
    ...overrides,
  };
}

export function runReviewContinuationContractTests(): void {
  const request = validateReviewContinuationRevisionRequest(revisionRequest());
  assert.equal(request.continuationId, 'review-continuation-000001');
  assert.deepEqual(parseReviewContinuationRevisionRequest(`${JSON.stringify(revisionRequest())}\n`), request);

  const completed = validateReviewContinuation(continuation());
  assert.equal(completed.participantJobCount, 2);
  assert.deepEqual(parseReviewContinuation(JSON.stringify(continuation())), completed);
  assert.equal(
    validateReviewContinuation(continuation({ terminalRoute: 'READY_FOR_SHADOW_AUTHORING' })).terminalRoute,
    'READY_FOR_SHADOW_AUTHORING',
  );

  assert.throws(
    () => validateReviewContinuationRevisionRequest({ ...revisionRequest(), unexpected: true }),
    /contains unknown field: unexpected/,
  );
  assert.throws(
    () => validateReviewContinuationRevisionRequest({ ...revisionRequest(), problemPackageSha256: 'not-a-sha' }),
    /problemPackageSha256 must be a SHA-256 hex string/,
  );
  assert.throws(
    () => validateReviewContinuationRevisionRequest({ ...revisionRequest(), continuationId: 'review-continuation-000002' }),
    /continuationId must be review-continuation-000001/,
  );
  assert.throws(
    () => validateReviewContinuationRevisionRequest({ ...revisionRequest(), continuationOrdinal: 2 }),
    /continuationOrdinal must be 1/,
  );

  assert.throws(
    () => validateReviewContinuation({ ...continuation(), participantJobCount: 0 }),
    /participantJobCount must be 1 or 2/,
  );
  assert.throws(
    () => validateReviewContinuation({ ...continuation(), participantJobCount: 3 }),
    /participantJobCount must be 1 or 2/,
  );
  assert.throws(
    () => validateReviewContinuation({
      ...continuation(),
      revisionStatus: 'NO_PROPOSAL',
      reReviewStatus: 'not_run',
      continuationDecisionRef: null,
      continuationDecisionSha256: null,
      participantJobCount: 1,
      terminalRoute: 'DEFER',
    }),
    /completed continuation requires continuation decision reference and hash/,
  );
  assert.throws(
    () => validateReviewContinuation({ ...continuation(), reReviewStatus: 'not_run' }),
    /reReviewStatus not_run is invalid for an OPTIONS revision/,
  );
  assert.throws(
    () => validateReviewContinuation({ ...continuation(), reReviewStatus: 'ACCEPT_OPTION', participantJobCount: 1 }),
    /reReviewStatus requires participantJobCount 2/,
  );
  assert.throws(
    () => validateReviewContinuation({
      ...continuation(),
      revisionStatus: 'INSUFFICIENT_EVIDENCE',
      reReviewStatus: 'not_run',
      participantJobCount: 2,
    }),
    /reReviewStatus not_run requires participantJobCount 1/,
  );
  assert.throws(
    () => validateReviewContinuation({ ...continuation(), terminalRoute: 'PARTICIPANT_FAILURE' }),
    /completed continuation terminalRoute must be a SolutionRoute/,
  );

  const failure = validateReviewContinuation(continuation({
    revisionStatus: 'participant_failure',
    reReviewStatus: 'not_run',
    continuationDecisionRef: null,
    continuationDecisionSha256: null,
    participantJobCount: 1,
    terminalStatus: 'participant_failure',
    terminalRoute: 'PARTICIPANT_FAILURE',
  }));
  assert.equal(failure.terminalStatus, 'participant_failure');
  assert.equal(failure.continuationDecisionRef, null);
  assert.equal(failure.continuationDecisionSha256, null);

  assert.throws(
    () => validateReviewContinuation({ ...continuation(), terminalStatus: 'participant_failure' }),
    /participant_failure continuation requires null decision reference and hash/,
  );
  assert.throws(
    () => validateReviewContinuation({
      ...continuation(),
      terminalStatus: 'participant_failure',
      terminalRoute: 'DEFER',
      revisionStatus: 'participant_failure',
      reReviewStatus: 'not_run',
      continuationDecisionRef: null,
      continuationDecisionSha256: null,
      participantJobCount: 1,
    }),
    /participant_failure continuation terminalRoute must be PARTICIPANT_FAILURE/,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    runReviewContinuationContractTests();
    console.log('reviewContinuationContract.test.ts: ok');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
