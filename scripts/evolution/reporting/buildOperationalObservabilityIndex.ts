import { access, lstat, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { WorkflowSummary } from './buildOperationalRunReport';
import {
  parseWorkflowDecisionAudit,
  type AuditedWorkflowSummary,
} from './buildWorkflowDecisionAudit';
import {
  MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION,
  type MultiRoundSessionSummaryV1,
} from '../multiRoundRunManifestContract';
import { buildHumanReviewSummary, type HumanReviewSummary } from './buildHumanReviewSummary';

export const OPERATIONAL_RUN_REPORT_SCHEMA_VERSION = 'auto-evolution-operational-run-report-v1';
export const OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V2 = 'auto-evolution-operational-run-report-v2';
export const OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V3 = 'auto-evolution-operational-run-report-v3';
export const RUN_REPORTS_ROOT = 'artifacts/evolution/run-reports';
export const EVOLUTION_OPERATIONAL_INDEX_PATH = 'artifacts/evolution/index.md';
export const HUMAN_FOLLOWUP_INDEX_PATH = 'artifacts/evolution/human-follow-up/index.md';

export interface OperationalRunReportV1 {
  schemaVersion: typeof OPERATIONAL_RUN_REPORT_SCHEMA_VERSION;
  reportId: string;
  createdAt: string;
  sourceRoot: string;
  workflowCount: number;
  workflows: WorkflowSummary[];
}

export interface OperationalRunReportV2 {
  schemaVersion: typeof OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V2;
  reportId: string;
  createdAt: string;
  sourceRoot: string;
  sessionExecution: MultiRoundSessionSummaryV1;
  workflowCount: number;
  workflows: WorkflowSummary[];
}

export interface OperationalRunReportV3 {
  schemaVersion: typeof OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V3;
  reportId: string;
  createdAt: string;
  sourceRoot: string;
  sessionExecution: MultiRoundSessionSummaryV1;
  workflowCount: number;
  workflows: AuditedWorkflowSummary[];
}

export type OperationalRunReport = OperationalRunReportV1 | OperationalRunReportV2 | OperationalRunReportV3;

export interface BuildOperationalObservabilityIndexInput {
  repositoryRoot: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function tryLstat(path: string): Promise<Awaited<ReturnType<typeof lstat>> | null> {
  try {
    return await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function markdownCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\r', ' ').replaceAll('\n', ' ');
}

function parseSessionExecution(value: unknown, reportId: string): MultiRoundSessionSummaryV1 {
  if (!isRecord(value)) {
    throw new Error(`missing sessionExecution for ${reportId}`);
  }
  if (value.schemaVersion !== MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION) {
    throw new Error(`invalid sessionExecution.schemaVersion for ${reportId}`);
  }
  if (typeof value.multiRoundRunRef !== 'string' || value.multiRoundRunRef.length === 0) {
    throw new Error(`invalid sessionExecution.multiRoundRunRef for ${reportId}`);
  }
  if (typeof value.stopReason !== 'string' || value.stopReason.length === 0) {
    throw new Error(`invalid sessionExecution.stopReason for ${reportId}`);
  }
  if (
    value.outcome !== 'CROSS_ROUND_TRANSITION_OBSERVED'
    && value.outcome !== 'NO_CROSS_ROUND_TRANSITION_OBSERVED'
    && value.outcome !== 'STOPPED'
  ) {
    throw new Error(`invalid sessionExecution.outcome for ${reportId}`);
  }
  if (typeof value.roundCount !== 'number' || !Number.isInteger(value.roundCount)) {
    throw new Error(`invalid sessionExecution.roundCount for ${reportId}`);
  }
  if (value.crossRoundTransitions !== 0 && value.crossRoundTransitions !== 1) {
    throw new Error(`invalid sessionExecution.crossRoundTransitions for ${reportId}`);
  }
  if (!(value.lastRoundTerminalRoute === null || typeof value.lastRoundTerminalRoute === 'string')) {
    throw new Error(`invalid sessionExecution.lastRoundTerminalRoute for ${reportId}`);
  }
  if (!isRecord(value.execution)) {
    throw new Error(`invalid sessionExecution.execution for ${reportId}`);
  }
  const execution = value.execution;
  if (typeof execution.executionRef !== 'string') {
    throw new Error(`invalid sessionExecution.execution.executionRef for ${reportId}`);
  }
  if (
    execution.status !== 'completed'
    && execution.status !== 'failed'
    && execution.status !== 'scope_violation'
    && execution.status !== 'not_started'
  ) {
    throw new Error(`invalid sessionExecution.execution.status for ${reportId}`);
  }
  if (!Array.isArray(execution.actualChangedFiles) || execution.actualChangedFiles.some(entry => typeof entry !== 'string')) {
    throw new Error(`invalid sessionExecution.execution.actualChangedFiles for ${reportId}`);
  }
  if (!(execution.resultingRunRef === null || typeof execution.resultingRunRef === 'string')) {
    throw new Error(`invalid sessionExecution.execution.resultingRunRef for ${reportId}`);
  }
  return value as MultiRoundSessionSummaryV1;
}

export function parseOperationalRunReport(raw: string, expectedReportId: string): OperationalRunReport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(`invalid operational run report JSON for ${expectedReportId}: ${String(error)}`);
  }
  if (!isRecord(parsed)) {
    throw new Error(`invalid operational run report shape for ${expectedReportId}`);
  }
  if (
    parsed.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION
    && parsed.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V2
    && parsed.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V3
  ) {
    throw new Error(
      `wrong schemaVersion for ${expectedReportId}: expected ${OPERATIONAL_RUN_REPORT_SCHEMA_VERSION}, ${OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V2}, or ${OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V3}, got ${String(parsed.schemaVersion)}`,
    );
  }
  if (typeof parsed.reportId !== 'string' || parsed.reportId.length === 0) {
    throw new Error(`missing reportId for ${expectedReportId}`);
  }
  if (parsed.reportId !== expectedReportId) {
    throw new Error(`directory/reportId mismatch: directory=${expectedReportId} reportId=${parsed.reportId}`);
  }
  if (typeof parsed.createdAt !== 'string' || parsed.createdAt.length === 0) {
    throw new Error(`missing createdAt for ${expectedReportId}`);
  }
  if (typeof parsed.sourceRoot !== 'string' || parsed.sourceRoot.length === 0) {
    throw new Error(`missing sourceRoot for ${expectedReportId}`);
  }
  if (typeof parsed.workflowCount !== 'number' || !Number.isInteger(parsed.workflowCount)) {
    throw new Error(`invalid workflowCount for ${expectedReportId}`);
  }
  if (!Array.isArray(parsed.workflows)) {
    throw new Error(`missing workflows for ${expectedReportId}`);
  }
  if (parsed.workflows.length !== parsed.workflowCount) {
    throw new Error(`workflowCount mismatch for ${expectedReportId}`);
  }

  if (parsed.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION) {
    return parsed as OperationalRunReportV1;
  }

  const sessionExecution = parseSessionExecution(parsed.sessionExecution, expectedReportId);
  if (parsed.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V2) {
    return { ...(parsed as OperationalRunReportV2), sessionExecution };
  }

  return {
    ...(parsed as OperationalRunReportV3),
    sessionExecution,
    workflows: parsed.workflows.map((workflow, index) => {
      if (!isRecord(workflow)) throw new Error(`invalid workflow ${index} for ${expectedReportId}`);
      return {
        ...workflow,
        decisionAudit: parseWorkflowDecisionAudit(workflow.decisionAudit, `workflows[${index}].decisionAudit`),
      } as AuditedWorkflowSummary;
    }),
  };
}

async function loadArchivedReports(repositoryRoot: string): Promise<OperationalRunReport[]> {
  const reportsRoot = join(repositoryRoot, RUN_REPORTS_ROOT);
  const rootStat = await tryLstat(reportsRoot);
  if (!rootStat) return [];
  if (!rootStat.isDirectory()) throw new Error(`run-reports root must be a directory: ${RUN_REPORTS_ROOT}`);

  const reports: OperationalRunReport[] = [];
  const entries = (await readdir(reportsRoot, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const reportJsonPath = join(reportsRoot, entry.name, 'report.json');
    const reportStat = await tryLstat(reportJsonPath);
    if (!reportStat || !reportStat.isFile()) {
      throw new Error(`archived run report is missing report.json: ${entry.name}`);
    }
    const report = parseOperationalRunReport(await readFile(reportJsonPath, 'utf8'), entry.name);
    reports.push(report);
  }
  return reports;
}

function workflowRouteSummary(workflows: WorkflowSummary[]): string {
  if (workflows.length === 0) return '（无）';
  return workflows.map(workflow => workflow.terminalRoute ?? workflow.status).join(', ');
}

function sourceRunSummary(workflows: WorkflowSummary[]): string {
  const refs = workflows
    .map(workflow => workflow.sourceRunRef)
    .filter((value): value is string => value !== null);
  if (refs.length === 0) return '（无）';
  return [...new Set(refs)].join(', ');
}

function renderRunReportsIndex(reports: OperationalRunReport[]): string {
  const sorted = [...reports].sort((left, right) => (
    right.createdAt.localeCompare(left.createdAt) || left.reportId.localeCompare(right.reportId)
  ));
  const lines = [
    '# Auto Evolution 运行报告',
    '',
    `- 报告总数：${sorted.length}`,
    '',
    '| 创建时间 | 报告 | 会话停止原因 | 多轮结果 | 执行状态 | 工作流路由 | Source Run | 人类结论 | 建议动作 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  if (sorted.length === 0) {
    lines.push('| *（无）* |  |  |  |  |  |  |');
  } else {
    for (const report of sorted) {
      const sessionStop = report.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION
        ? report.sessionExecution.stopReason
        : '（仅工作流）';
      const multiRoundOutcome = report.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION
        ? report.sessionExecution.outcome
        : '—';
      const execution = report.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION
        ? report.sessionExecution.execution.status
        : '—';
      const human = buildHumanReviewSummary({
        workflows: report.workflows,
        reportId: report.reportId,
        ...(report.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION ? {} : { sessionExecution: report.sessionExecution }),
      });
      lines.push(
        `| ${markdownCell(report.createdAt)} | [${markdownCell(report.reportId)}](${report.reportId}/report.md) | ${markdownCell(sessionStop)} | ${markdownCell(multiRoundOutcome)} | ${markdownCell(execution)} | ${markdownCell(workflowRouteSummary(report.workflows))} | ${markdownCell(sourceRunSummary(report.workflows))} | ${markdownCell(human.conclusion)} | ${markdownCell(human.recommendedAction)} |`,
      );
    }
  }
  lines.push(
    '',
    '本索引由归档的 `report.json` sidecar 生成，是可观测性历史，不是 Human backlog 的规范状态。',
    'V1 行仅包含工作流信息；V2 行展示会话执行事实；V3 行展示会话执行事实与有界决策审计。人类结论与建议动作均来自共享 Human Review projection。',
    '',
  );
  return lines.join('\n');
}

function renderTopLevelIndex(input: {
  reportCount: number;
  latestReport: OperationalRunReport | null;
  latestHumanReview: HumanReviewSummary | null;
  humanFollowupIndexPresent: boolean;
}): string {
  const latestLine = input.latestReport === null
    ? '- 最新：*（无）*'
    : `- 最新：[${input.latestReport.reportId}](run-reports/${input.latestReport.reportId}/report.md)（${input.latestReport.createdAt}）`;
  const humanFollowupLine = input.humanFollowupIndexPresent
    ? '- 打开 [human-follow-up/index.md](human-follow-up/index.md)'
    : '- human-follow-up/index.md 尚未生成（运行 `npm run evolution:human-followup:inbox`）';
  const humanGuidance = input.latestHumanReview === null
    ? ['- 一句话人类结论：*（无）*', '- 建议动作：*（无）*']
    : [
      `- 一句话人类结论：${input.latestHumanReview.conclusion}`,
      `- 建议动作：${input.latestHumanReview.recommendedAction}`,
    ];

  return [
    '# Auto Evolution 运行索引',
    '',
    '## 运行报告',
    '',
    `- 总数：${input.reportCount}`,
    latestLine,
    ...humanGuidance,
    '- 打开 [run-reports/index.md](run-reports/index.md)',
    '',
    '## Human Follow-up',
    '',
    humanFollowupLine,
    '',
    '运行报告是生成式可观测性历史；V3 report.json 保留 bounded Decision Audit，Human Follow-up 只保留正式 HFL item 的 operational state。',
    '',
  ].join('\n');
}

export async function buildOperationalObservabilityIndex(
  input: BuildOperationalObservabilityIndexInput,
): Promise<{
  runReportsIndexPath: string;
  topLevelIndexPath: string;
  reportCount: number;
}> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const reports = await loadArchivedReports(repositoryRoot);
  const sortedForLatest = [...reports].sort((left, right) => (
    right.createdAt.localeCompare(left.createdAt) || left.reportId.localeCompare(right.reportId)
  ));

  const runReportsIndexPath = join(repositoryRoot, RUN_REPORTS_ROOT, 'index.md');
  const topLevelIndexPath = join(repositoryRoot, EVOLUTION_OPERATIONAL_INDEX_PATH);
  const latestReport = sortedForLatest[0] ?? null;
  const latestHumanReview = latestReport === null
    ? null
    : buildHumanReviewSummary({
      workflows: latestReport.workflows,
      reportId: latestReport.reportId,
      ...(latestReport.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION ? {} : { sessionExecution: latestReport.sessionExecution }),
    });
  await mkdir(join(repositoryRoot, RUN_REPORTS_ROOT), { recursive: true });
  await mkdir(join(repositoryRoot, 'artifacts/evolution'), { recursive: true });
  await writeFile(runReportsIndexPath, renderRunReportsIndex(reports), 'utf8');
  await writeFile(
    topLevelIndexPath,
    renderTopLevelIndex({
      reportCount: reports.length,
      latestReport,
      latestHumanReview,
      humanFollowupIndexPresent: await pathExists(join(repositoryRoot, HUMAN_FOLLOWUP_INDEX_PATH)),
    }),
    'utf8',
  );

  return {
    runReportsIndexPath,
    topLevelIndexPath,
    reportCount: reports.length,
  };
}

function parseCliArgs(args: string[]): BuildOperationalObservabilityIndexInput {
  let repositoryRoot = process.cwd();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--root') {
      const value = args[++index];
      if (!value) throw new Error('--root requires a value');
      repositoryRoot = value;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return { repositoryRoot };
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  buildOperationalObservabilityIndex(parseCliArgs(process.argv.slice(2)))
    .then(result => {
      console.log(`Indexed ${result.reportCount} archived run report(s)`);
      console.log(`Wrote ${result.runReportsIndexPath}`);
      console.log(`Wrote ${result.topLevelIndexPath}`);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
