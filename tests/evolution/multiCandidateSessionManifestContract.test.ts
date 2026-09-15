import assert from 'node:assert/strict';
import {
  buildMultiCandidateSessionManifestV1,
  buildMultiCandidateSessionSummaryV1,
  parseMultiCandidateSessionManifestV1,
  type MultiCandidateSessionManifestV1,
} from '../../scripts/evolution/multiCandidateSessionManifestContract';

function buildManifest(): MultiCandidateSessionManifestV1 {
  return buildMultiCandidateSessionManifestV1({
    logicalSessionId: 'logical-session-000001',
    sessionState: 'PAUSED',
    currentSourceEpochRef: 'source-epoch-000001',
    sourceEpochs: [{
      sourceEpochRef: 'source-epoch-000001',
      sourceRunRef: 'cohort-run-000001',
      poolRef: 'candidate-pool-000001',
      poolStatus: 'PROCESSING',
      candidateCounts: {
        total: 2,
        pending: 0,
        active: 0,
        completed: 2,
        superseded: 0,
        interrupted: 0,
      },
      dispositionCounts: { SKIP: 2 },
    }],
    hostSlices: [{
      hostSliceId: 'host-slice-000001',
      startedAt: '2026-09-15T00:00:00.000Z',
      endedAt: null,
      participantJobs: 4,
      state: 'PAUSED',
      reason: 'HOST_SLICE_BUDGET',
    }],
    sourceTransitionCount: 0,
    failureRef: null,
  });
}

export async function runMultiCandidateSessionManifestContractTests(): Promise<void> {
  const manifest = buildManifest();
  const summary = buildMultiCandidateSessionSummaryV1(manifest);
  assert.equal(summary.sessionState, 'PAUSED');
  assert.equal(summary.sourceEpochs[0]!.candidateCounts.completed, 2);
  assert.equal('lastRoundTerminalRoute' in summary, false);
  assert.equal('overallRoute' in summary, false);
  assert.equal('dominantRoute' in summary, false);
  assert.deepEqual(parseMultiCandidateSessionManifestV1(manifest), manifest);

  assert.throws(() => parseMultiCandidateSessionManifestV1({
    ...manifest,
    sourceTransitionCount: 2,
  }), /sourceTransitionCount/i);
  assert.throws(() => parseMultiCandidateSessionManifestV1({
    ...manifest,
    currentSourceEpochRef: 'missing-source',
  }), /currentSourceEpochRef/i);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMultiCandidateSessionManifestContractTests()
    .then(() => console.log('multiCandidateSessionManifestContract.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
