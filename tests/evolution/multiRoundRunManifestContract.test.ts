import assert from 'node:assert/strict';
import {
  buildMultiRoundSessionSummary,
  parseMultiRoundRunManifest,
  type MultiRoundRunManifestV2,
} from '../../scripts/evolution/multiRoundRunManifestContract';

const SHA = 'b'.repeat(64);

function v1Manifest(): Record<string, unknown> {
  return {
    schemaVersion: 'multi-round-run-manifest-v1',
    multiRoundRunRef: 'ordinary-run-20260910-000006',
    initialSourceRunRef: 'ordinary-run-20260910-000006',
    limits: {
      maxAgentRounds: 2,
      maxCrossRoundTransitions: 1,
      maxRoundParticipantJobs: 4,
      maxExecutionParticipantJobs: 1,
      maxTotalParticipantJobs: 9,
      retryCount: 0,
    },
    rounds: [{
      round: 1,
      workflowRef: 'round-1',
      sourceRunRef: 'ordinary-run-20260910-000006',
      terminalRoute: 'DEFER_MORE_WORK_REQUESTED',
      executionRef: null,
      resultingRunRef: null,
      nextAction: 'STOP',
    }],
    execution: {
      executionRef: 'configuration-execution-000001',
      allowedWritePaths: [],
      actualChangedFiles: [],
      status: 'not_started',
      verificationResults: [],
      resultingRunRef: null,
    },
    budget: {
      round1ParticipantJobs: 4,
      executionParticipantJobs: 0,
      round2ParticipantJobs: 0,
      totalParticipantJobs: 4,
      retryCount: 0,
    },
    outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED',
    stopReason: 'ROUND_1_TERMINAL_NOT_READY',
  };
}

function continuationEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    round: 1,
    continuationRef: 'review-continuation-000001',
    participantJobs: 1,
    terminalStatus: 'completed',
    terminalRoute: 'DEFER',
    decisionRef: 'review-continuation-000001/decision.json',
    ...overrides,
  };
}

function v2Manifest(overrides: Record<string, unknown> = {}): MultiRoundRunManifestV2 {
  return {
    schemaVersion: 'multi-round-run-manifest-v2',
    multiRoundRunRef: 'ordinary-run-20260910-000006',
    initialSourceRunRef: 'ordinary-run-20260910-000006',
    limits: {
      maxAgentRounds: 2,
      maxCrossRoundTransitions: 1,
      maxRoundParticipantJobs: 4,
      maxReviewContinuations: 1,
      maxReviewContinuationParticipantJobs: 2,
      maxExecutionParticipantJobs: 1,
      maxTotalParticipantJobs: 11,
      retryCount: 0,
    },
    rounds: [{
      round: 1,
      workflowRef: 'round-1',
      sourceRunRef: 'ordinary-run-20260910-000006',
      baseTerminalRoute: 'DEFER_MORE_WORK_REQUESTED',
      baseReasonCode: 'REVIEW_REQUEST_MORE_WORK',
      continuationRef: null,
      effectiveTerminalRoute: 'DEFER_MORE_WORK_REQUESTED',
      effectiveReasonCode: 'REVIEW_REQUEST_MORE_WORK',
      executionRef: null,
      resultingRunRef: null,
      nextAction: 'STOP',
    }],
    reviewContinuations: [],
    execution: {
      executionRef: 'configuration-execution-000001',
      allowedWritePaths: [],
      actualChangedFiles: [],
      status: 'not_started',
      verificationResults: [],
      resultingRunRef: null,
    },
    budget: {
      round1ParticipantJobs: 4,
      reviewContinuationParticipantJobs: 0,
      executionParticipantJobs: 0,
      round2ParticipantJobs: 0,
      totalParticipantJobs: 4,
      retryCount: 0,
    },
    outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED',
    stopReason: 'ROUND_1_TERMINAL_NOT_READY',
    ...overrides,
  };
}

function v2WithContinuation(overrides: Record<string, unknown> = {}): MultiRoundRunManifestV2 {
  return v2Manifest({
    rounds: [{
      round: 1,
      workflowRef: 'round-1',
      sourceRunRef: 'ordinary-run-20260910-000006',
      baseTerminalRoute: 'DEFER_MORE_WORK_REQUESTED',
      baseReasonCode: 'REVIEW_REQUEST_MORE_WORK',
      continuationRef: 'review-continuation-000001',
      effectiveTerminalRoute: 'DEFER',
      effectiveReasonCode: 'INSUFFICIENT_EVIDENCE',
      executionRef: null,
      resultingRunRef: null,
      nextAction: 'STOP',
    }],
    reviewContinuations: [continuationEntry()],
    budget: {
      round1ParticipantJobs: 4,
      reviewContinuationParticipantJobs: 1,
      executionParticipantJobs: 0,
      round2ParticipantJobs: 0,
      totalParticipantJobs: 5,
      retryCount: 0,
    },
    ...overrides,
  });
}

export function runMultiRoundRunManifestContractTests(): void {
  const historical = parseMultiRoundRunManifest(v1Manifest());
  assert.equal(historical.schemaVersion, 'multi-round-run-manifest-v1');
  assert.equal(buildMultiRoundSessionSummary(historical).schemaVersion, 'multi-round-session-summary-v1');

  const noContinuation = parseMultiRoundRunManifest(v2Manifest());
  assert.equal(noContinuation.schemaVersion, 'multi-round-run-manifest-v2');
  const withContinuation = parseMultiRoundRunManifest(v2WithContinuation());
  const summary = buildMultiRoundSessionSummary(withContinuation);
  assert.equal(summary.schemaVersion, 'multi-round-session-summary-v2');
  assert.equal(summary.reviewContinuationCount, 1);
  assert.equal(summary.reviewContinuationParticipantJobs, 1);
  assert.equal(summary.lastRoundTerminalRoute, 'DEFER');
  assert.deepEqual(summary.rounds, [{
    round: 1,
    baseTerminalRoute: 'DEFER_MORE_WORK_REQUESTED',
    baseReasonCode: 'REVIEW_REQUEST_MORE_WORK',
    continuationRef: 'review-continuation-000001',
    effectiveTerminalRoute: 'DEFER',
    effectiveReasonCode: 'INSUFFICIENT_EVIDENCE',
  }]);

  assert.throws(
    () => parseMultiRoundRunManifest(v2WithContinuation({
      reviewContinuations: [continuationEntry(), continuationEntry({ round: 2 })],
    })),
    /reviewContinuations must contain at most one entry/,
  );
  assert.throws(
    () => parseMultiRoundRunManifest(v2WithContinuation({
      reviewContinuations: [continuationEntry({ participantJobs: 3 })],
    })),
    /participantJobs must be 1 or 2/,
  );
  assert.throws(
    () => parseMultiRoundRunManifest(v2Manifest({
      budget: {
        round1ParticipantJobs: 4,
        reviewContinuationParticipantJobs: 2,
        executionParticipantJobs: 1,
        round2ParticipantJobs: 4,
        totalParticipantJobs: 12,
        retryCount: 0,
      },
    })),
    /budget\.totalParticipantJobs/,
  );
  assert.throws(
    () => parseMultiRoundRunManifest(v2Manifest({
      rounds: [{
        round: 1,
        workflowRef: 'round-1',
        sourceRunRef: 'ordinary-run-20260910-000006',
        baseTerminalRoute: 'DEFER_MORE_WORK_REQUESTED',
        baseReasonCode: 'REVIEW_REQUEST_MORE_WORK',
        continuationRef: 'review-continuation-000001',
        effectiveTerminalRoute: 'DEFER',
        effectiveReasonCode: 'INSUFFICIENT_EVIDENCE',
        executionRef: null,
        resultingRunRef: null,
        nextAction: 'STOP',
      }],
    })),
    /rounds\[0\]\.continuationRef must reference reviewContinuations/,
  );

  assert.throws(
    () => parseMultiRoundRunManifest(v2WithContinuation({
      rounds: [{ ...v2WithContinuation().rounds[0], continuationRef: 'review-continuation-000002' }],
      reviewContinuations: [continuationEntry({ continuationRef: 'review-continuation-000002' })],
    })),
    /reviewContinuations\[0\]\.continuationRef must be review-continuation-000001/,
  );
  assert.throws(
    () => parseMultiRoundRunManifest(v2WithContinuation({
      reviewContinuations: [continuationEntry({ round: 2 })],
    })),
    /reviewContinuations\[0\]\.round must equal rounds\[0\]\.round/,
  );
  assert.throws(
    () => parseMultiRoundRunManifest(v2WithContinuation({
      rounds: [{ ...v2WithContinuation().rounds[0], baseTerminalRoute: 'DEFER' }],
    })),
    /rounds\[0\]\.baseTerminalRoute must be DEFER_MORE_WORK_REQUESTED for a continuation/,
  );
  assert.throws(
    () => parseMultiRoundRunManifest(v2WithContinuation({
      rounds: [{ ...v2WithContinuation().rounds[0], effectiveTerminalRoute: 'STOP' }],
    })),
    /rounds\[0\]\.effectiveTerminalRoute must equal reviewContinuations\[0\]\.terminalRoute/,
  );
  assert.throws(
    () => parseMultiRoundRunManifest(v2WithContinuation({
      reviewContinuations: [continuationEntry({ decisionRef: 'review-continuation-000002/decision.json' })],
    })),
    /reviewContinuations\[0\]\.decisionRef must be review-continuation-000001\/decision\.json for completed continuation/,
  );
  assert.throws(
    () => parseMultiRoundRunManifest(v2WithContinuation({
      reviewContinuations: [continuationEntry({
        terminalStatus: 'participant_failure',
        terminalRoute: 'DEFER',
        decisionRef: null,
      })],
    })),
    /reviewContinuations\[0\]\.terminalRoute must be PARTICIPANT_FAILURE for participant_failure/,
  );

  assert.equal(SHA.length, 64);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    runMultiRoundRunManifestContractTests();
    console.log('multiRoundRunManifestContract.test.ts: ok');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
