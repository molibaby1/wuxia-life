import assert from 'node:assert/strict';
import { parseOperationalRunReport, OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7 } from '../../scripts/evolution/reporting/buildOperationalObservabilityIndex';

const sessionExecution = {
  schemaVersion: 'multi-candidate-session-summary-v1',
  logicalSessionId: 'logical-session-000001',
  sessionState: 'PAUSED',
  pauseOrStopReason: 'HOST_SLICE_BUDGET',
  currentSourceEpochRef: 'source-epoch-000001',
  sourceEpochs: [{ sourceEpochRef: 'source-epoch-000001', sourceRunRef: 'source-000001', poolRef: 'source-epochs/source-epoch-000001/candidate-pool.json', poolStatus: 'PROCESSING', lifecycle: 'POOL_ACTIVE', candidateCounts: { total: 2, pending: 1, active: 0, completed: 1, superseded: 0, interrupted: 0 }, dispositionCounts: { SKIP: 1 } }],
  hostSlices: [{ hostSliceId: 'host-slice-000001', startedAt: '2026-09-15T00:00:00.000Z', endedAt: '2026-09-15T00:01:00.000Z', participantJobs: 6, state: 'PAUSED', reason: 'HOST_SLICE_BUDGET' }],
  sourceTransitionCount: 0,
  failureRef: null,
};

const candidate = {
  candidateRef: 'candidate-pool-abc/hypothesis-000001',
  hypothesisId: 'hypothesis-000001',
  sourceIndex: 0,
  processingState: 'COMPLETED',
  effectiveRoute: 'SKIP',
  effectiveReasonCode: 'NO_PROPOSAL',
  effectiveDecisionRef: 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/decision.json',
  humanFollowupRef: null,
  supersededBySourceEpochRef: null,
  interruptionRef: null,
};

export function runMultiCandidateOperationalRunReportTests(): void {
  const report = {
    schemaVersion: OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7,
    reportId: 'report-v7-000001',
    createdAt: '2026-09-15T00:01:00.000Z',
    logicalSessionId: 'logical-session-000001',
    hostSliceId: 'host-slice-000001',
    sessionStateAtSnapshot: 'PAUSED',
    sessionExecution,
    candidates: [candidate],
    recoverableSessionStateRef: 'artifacts/evolution/sessions/logical-session-000001/session-manifest.json',
    terminalForensicEvidenceRef: null,
  };
  const parsed = parseOperationalRunReport(JSON.stringify(report), report.reportId);
  assert.equal(parsed.schemaVersion, OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7);
  if (parsed.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7) {
    assert.equal(parsed.logicalSessionId, report.logicalSessionId);
    assert.equal(parsed.hostSliceId, report.hostSliceId);
    assert.equal(parsed.candidates[0]!.hypothesisId, 'hypothesis-000001');
    assert.equal(parsed.terminalForensicEvidenceRef, null);
    assert.equal('overallRoute' in parsed, false);
    assert.equal('lastRoundTerminalRoute' in parsed, false);
  }
  assert.throws(() => parseOperationalRunReport(JSON.stringify({ ...report, overallRoute: 'SKIP' }), report.reportId), /unknown field|overallRoute|v7/);
  assert.throws(() => parseOperationalRunReport(JSON.stringify({ ...report, logicalSessionId: '' }), report.reportId), /logicalSessionId/);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try { runMultiCandidateOperationalRunReportTests(); console.log('multiCandidateOperationalRunReport.test.ts: ok'); } catch (error) { console.error(error); process.exit(1); }
}
