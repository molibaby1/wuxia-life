import { lstat, mkdir, open, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { canonicalJson } from '../phase0/provenance';
import { buildOperationalObservabilityIndex, RUN_REPORTS_ROOT } from './buildOperationalObservabilityIndex';
import { buildMultiCandidateOperationalRunReport } from './buildMultiCandidateOperationalRunReport';
import { parseOperationalRunReport, type OperationalRunReportV7 } from './buildOperationalObservabilityIndex';

export interface ArchiveMultiCandidateSessionReportInput {
  repositoryRoot: string;
  logicalSessionId: string;
  hostSliceId: string;
  terminalForensicEvidenceRef?: string | null;
  createdAt?: string;
}

export interface ArchiveMultiCandidateSessionReportResult {
  reportId: string;
  reportDirectory: string;
  reportJsonPath: string;
  reportMarkdownPath: string;
  logicalSessionId: string;
  hostSliceId: string;
  createdAt: string;
}

function markdownCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\r', ' ').replaceAll('\n', ' ');
}

export function renderMultiCandidateOperationalRunReportMarkdown(report: OperationalRunReportV7): string {
  const counts = report.candidates.reduce((result, candidate) => {
    result[candidate.processingState] = (result[candidate.processingState] ?? 0) + 1;
    return result;
  }, {} as Record<string, number>);
  const dispositionCounts = report.candidates.reduce((result, candidate) => {
    if (candidate.effectiveRoute !== null) result[candidate.effectiveRoute] = (result[candidate.effectiveRoute] ?? 0) + 1;
    return result;
  }, {} as Record<string, number>);
  const lines = [
    '# Auto Evolution Multi-candidate Run Report',
    '',
    `- Logical Session：${markdownCell(report.logicalSessionId)}`,
    `- Host Slice：${markdownCell(report.hostSliceId)}`,
    `- Session state：${markdownCell(report.sessionStateAtSnapshot)}`,
    `- Pause/stop reason：${markdownCell(report.sessionExecution.pauseOrStopReason ?? '（无）')}`,
    `- Current Source Epoch：${markdownCell(report.sessionExecution.currentSourceEpochRef)}`,
    `- Source transition count：${report.sessionExecution.sourceTransitionCount}`,
    `- Recoverable session state：${markdownCell(report.recoverableSessionStateRef)}`,
    `- Terminal forensic evidence：${markdownCell(report.terminalForensicEvidenceRef ?? '（无）')}`,
    '',
    `- Candidate counts：total=${report.candidates.length}, completed=${counts.COMPLETED ?? 0}, pending=${counts.PENDING ?? 0}, active=${counts.ACTIVE ?? 0}, superseded=${counts.SUPERSEDED ?? 0}, interrupted=${counts.INTERRUPTED ?? 0}`,
    `- Disposition counts：${Object.entries(dispositionCounts).map(([key, value]) => `${key}=${value}`).join(', ') || '（无）'}`,
    '',
    '| sourceIndex | candidate | hypothesis | processing state | effective route | reasonCode | HFL |',
    '| ---: | --- | --- | --- | --- | --- | --- |',
  ];
  if (report.candidates.length === 0) lines.push('| （无） |  |  |  |  |  |  |');
  for (const candidate of report.candidates) {
    lines.push(`| ${candidate.sourceIndex} | ${markdownCell(candidate.candidateRef)} | ${markdownCell(candidate.hypothesisId)} | ${candidate.processingState} | ${markdownCell(candidate.effectiveRoute ?? '（无）')} | ${markdownCell(candidate.effectiveReasonCode ?? '（无）')} | ${markdownCell(candidate.humanFollowupRef ?? '（无）')} |`);
  }
  lines.push('', '本报告是单个 Host Slice 的 immutable observability snapshot；不合成 overall route、dominant route 或 last-candidate conclusion。', '');
  return `${lines.join('\n')}\n`;
}

async function writeCreateOnly(path: string, bytes: string): Promise<void> {
  await mkdir(resolve(path, '..'), { recursive: true });
  const handle = await open(path, 'wx');
  try { await handle.writeFile(bytes); } finally { await handle.close(); }
}

export async function archiveMultiCandidateSessionReport(
  input: ArchiveMultiCandidateSessionReportInput,
): Promise<ArchiveMultiCandidateSessionReportResult> {
  const report = await buildMultiCandidateOperationalRunReport(input);
  const reportDirectory = join(resolve(input.repositoryRoot), RUN_REPORTS_ROOT, report.reportId);
  const reportJsonPath = join(reportDirectory, 'report.json');
  const reportMarkdownPath = join(reportDirectory, 'report.md');
  const reportBytes = `${canonicalJson(report)}\n`;
  const markdown = renderMultiCandidateOperationalRunReportMarkdown(report);
  try {
    const existing = parseOperationalRunReport(await readFile(reportJsonPath, 'utf8'), report.reportId);
    if (existing.schemaVersion !== 'operational-run-report-v7' || canonicalJson(existing) !== canonicalJson(report)) throw new Error(`immutable multi-candidate report identity collision: ${report.reportId}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await writeCreateOnly(reportJsonPath, reportBytes);
      await writeCreateOnly(reportMarkdownPath, markdown);
    } else {
      throw error;
    }
  }
  await buildOperationalObservabilityIndex({ repositoryRoot: input.repositoryRoot });
  return {
    reportId: report.reportId,
    reportDirectory,
    reportJsonPath,
    reportMarkdownPath,
    logicalSessionId: report.logicalSessionId,
    hostSliceId: report.hostSliceId,
    createdAt: report.createdAt,
  };
}
