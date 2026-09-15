import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildOperationalObservabilityIndex } from '../../scripts/evolution/reporting/buildOperationalObservabilityIndex';

async function writeReport(root: string, reportId: string, value: unknown): Promise<void> {
  const directory = join(root, 'artifacts/evolution/run-reports', reportId);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'report.json'), `${JSON.stringify(value)}\n`, 'utf8');
}

function v7(reportId: string, logicalSessionId: string, hostSliceId: string, createdAt: string, candidates: unknown[] = []) {
  return {
    schemaVersion: 'operational-run-report-v7',
    reportId,
    createdAt,
    logicalSessionId,
    hostSliceId,
    sessionStateAtSnapshot: 'PAUSED',
    sessionExecution: {
      schemaVersion: 'multi-candidate-session-summary-v1',
      logicalSessionId,
      sessionState: 'PAUSED',
      pauseOrStopReason: 'HOST_SLICE_BUDGET',
      currentSourceEpochRef: 'source-epoch-000001',
      sourceEpochs: [],
      hostSlices: [],
      sourceTransitionCount: 0,
      failureRef: null,
    },
    candidates,
    recoverableSessionStateRef: `artifacts/evolution/sessions/${logicalSessionId}/session-manifest.json`,
    terminalForensicEvidenceRef: null,
  };
}

export async function runMultiCandidateOperationalIndexTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'candidate-operational-index-'));
  await writeReport(root, 'candidate-report-a1', v7('candidate-report-a1', 'logical-session-a', 'host-slice-000001', '2026-09-15T00:01:00.000Z'));
  await writeReport(root, 'candidate-report-a2', v7('candidate-report-a2', 'logical-session-a', 'host-slice-000002', '2026-09-15T00:02:00.000Z', [
    { candidateRef: 'source-epoch-000001/candidates/hypothesis-000001', hypothesisId: 'hypothesis-000001', sourceIndex: 0, processingState: 'PENDING', effectiveRoute: null, effectiveReasonCode: null, effectiveDecisionRef: null, humanFollowupRef: 'human-follow-up/item-000001.json', supersededBySourceEpochRef: null, interruptionRef: null },
  ]));
  await writeReport(root, 'candidate-report-b1', v7('candidate-report-b1', 'logical-session-b', 'host-slice-000001', '2026-09-15T00:02:00.000Z'));
  await writeReport(root, 'legacy-report-v1', {
    schemaVersion: 'auto-evolution-operational-run-report-v1',
    reportId: 'legacy-report-v1',
    createdAt: '2026-09-15T00:00:00.000Z',
    sourceRoot: '.tmp/evolution/legacy',
    workflowCount: 0,
    workflows: [],
  });

  const result = await buildOperationalObservabilityIndex({ repositoryRoot: root });
  assert.equal(result.reportSnapshotCount, 4);
  assert.equal(result.logicalSessionCount, 3);
  const index = await readFile(result.runReportsIndexPath, 'utf8');
  assert.equal((index.match(/logical-session-a/g) ?? []).length, 1);
  assert.match(index, /candidate-report-a2/);
  assert.match(index, /history: candidate-report-a1/);
  assert.match(index, /legacy-report-v1/);
  assert.match(index, /RESUME_SESSION/);
  assert.match(index, /REVIEW_HUMAN_FOLLOWUP/);
  const top = await readFile(result.topLevelIndexPath, 'utf8');
  assert.match(top, /Logical Session 总数：3/);
  assert.match(top, /Report snapshot 总数：4/);
  assert.match(top, /RESUME_SESSION/);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMultiCandidateOperationalIndexTests().then(() => console.log('multiCandidateOperationalIndex.test.ts: ok')).catch(error => { console.error(error); process.exit(1); });
}
