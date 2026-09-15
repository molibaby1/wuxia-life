import { access, lstat, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { WorkflowSummary } from './buildOperationalRunReport';
import {
  parseWorkflowDecisionAudit,
  type AuditedWorkflowSummary,
} from './buildWorkflowDecisionAudit';
import {
  parseWorkflowContinuationAudit,
  type AuditedWorkflowContinuationSummary,
} from './buildWorkflowContinuationAudit';
import {
  MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION,
  MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION_V2,
  type MultiRoundSessionSummary,
  type MultiRoundSessionSummaryV1,
  type MultiRoundSessionSummaryV2,
} from '../multiRoundRunManifestContract';
import {
  MULTI_CANDIDATE_SESSION_SUMMARY_SCHEMA_VERSION,
  type LogicalSessionState,
  type MultiCandidateSessionSummaryV1,
} from '../multiCandidateSessionManifestContract';
import type { CandidateProcessingState } from '../candidatePoolContract';
import { buildHumanReviewSummary, type HumanReviewSummary } from './buildHumanReviewSummary';
import {
  parseWorkspaceStateProvenanceProjection,
  type WorkspaceStateProvenanceProjection,
} from '../workspaceStateProvenance';

export const OPERATIONAL_RUN_REPORT_SCHEMA_VERSION = 'auto-evolution-operational-run-report-v1';
export const OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V2 = 'auto-evolution-operational-run-report-v2';
export const OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V3 = 'auto-evolution-operational-run-report-v3';
export const OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V4 = 'auto-evolution-operational-run-report-v4';
export const OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V5 = 'auto-evolution-operational-run-report-v5';
export const OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V6 = 'auto-evolution-operational-run-report-v6';
export const OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7 = 'operational-run-report-v7' as const;
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

export interface OperationalRunReportV4 {
  schemaVersion: typeof OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V4;
  reportId: string;
  createdAt: string;
  sourceRoot: string;
  sessionExecution: MultiRoundSessionSummaryV1;
  workspaceProvenance: WorkspaceStateProvenanceProjection;
  workflowCount: number;
  workflows: AuditedWorkflowSummary[];
}

export interface OperationalRunReportV5 {
  schemaVersion: typeof OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V5;
  reportId: string;
  createdAt: string;
  sourceRoot: string;
  sessionExecution: MultiRoundSessionSummaryV2;
  workspaceProvenance: WorkspaceStateProvenanceProjection;
  workflowCount: number;
  workflows: AuditedWorkflowSummary[];
}

export interface OperationalRunReportV6 {
  schemaVersion: typeof OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V6;
  reportId: string;
  createdAt: string;
  sourceRoot: string;
  sessionExecution: MultiRoundSessionSummaryV2;
  workspaceProvenance: WorkspaceStateProvenanceProjection;
  workflowCount: number;
  workflows: AuditedWorkflowContinuationSummary[];
  durableEvidenceCapsulePath?: string | null;
  durableEvidenceStatus?: 'PASS' | 'FAILED' | 'NOT_ATTEMPTED';
}

export interface CandidateDispositionSummaryV1 {
  candidateRef: string;
  hypothesisId: string;
  sourceIndex: number;
  processingState: CandidateProcessingState;
  effectiveRoute: string | null;
  effectiveReasonCode: string | null;
  effectiveDecisionRef: string | null;
  humanFollowupRef: string | null;
  supersededBySourceEpochRef: string | null;
  interruptionRef: string | null;
}

export interface OperationalRunReportV7 {
  schemaVersion: typeof OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7;
  reportId: string;
  createdAt: string;
  logicalSessionId: string;
  hostSliceId: string;
  sessionStateAtSnapshot: LogicalSessionState;
  sessionExecution: MultiCandidateSessionSummaryV1;
  candidates: CandidateDispositionSummaryV1[];
  recoverableSessionStateRef: string;
  terminalForensicEvidenceRef: string | null;
}

export type OperationalRunReport = OperationalRunReportV1 | OperationalRunReportV2 | OperationalRunReportV3 | OperationalRunReportV4 | OperationalRunReportV5 | OperationalRunReportV6 | OperationalRunReportV7;

export interface BuildOperationalObservabilityIndexInput {
  repositoryRoot: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertExactKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) if (!allowedSet.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
  for (const key of allowed) if (!(key in value)) throw new Error(`${label} is missing field: ${key}`);
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function nullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  return nonEmptyString(value, label);
}

function parseMultiCandidateSessionSummary(value: unknown, reportId: string): MultiCandidateSessionSummaryV1 {
  if (!isRecord(value)) throw new Error(`invalid sessionExecution for ${reportId}`);
  assertExactKeys(value, ['schemaVersion', 'logicalSessionId', 'sessionState', 'pauseOrStopReason', 'currentSourceEpochRef', 'sourceEpochs', 'hostSlices', 'sourceTransitionCount', 'failureRef'], `sessionExecution for ${reportId}`);
  if (value.schemaVersion !== MULTI_CANDIDATE_SESSION_SUMMARY_SCHEMA_VERSION) throw new Error(`invalid multi-candidate sessionExecution schemaVersion for ${reportId}`);
  const sessionStates: readonly LogicalSessionState[] = ['PROCESSING', 'PAUSED', 'COMPLETED', 'INTERRUPTED', 'FAILED'];
  if (typeof value.sessionState !== 'string' || !sessionStates.includes(value.sessionState as LogicalSessionState)) throw new Error(`invalid sessionExecution.sessionState for ${reportId}`);
  if (!Array.isArray(value.sourceEpochs) || !Array.isArray(value.hostSlices)) throw new Error(`invalid multi-candidate session arrays for ${reportId}`);
  if (value.sourceTransitionCount !== 0 && value.sourceTransitionCount !== 1) throw new Error(`invalid sessionExecution.sourceTransitionCount for ${reportId}`);
  return value as MultiCandidateSessionSummaryV1;
}

function parseOperationalRunReportV7(value: Record<string, unknown>, expectedReportId: string): OperationalRunReportV7 {
  assertExactKeys(value, ['schemaVersion', 'reportId', 'createdAt', 'logicalSessionId', 'hostSliceId', 'sessionStateAtSnapshot', 'sessionExecution', 'candidates', 'recoverableSessionStateRef', 'terminalForensicEvidenceRef'], `operational run report v7 for ${expectedReportId}`);
  const logicalSessionId = nonEmptyString(value.logicalSessionId, `logicalSessionId for ${expectedReportId}`);
  const hostSliceId = nonEmptyString(value.hostSliceId, `hostSliceId for ${expectedReportId}`);
  const sessionStates: readonly LogicalSessionState[] = ['PROCESSING', 'PAUSED', 'COMPLETED', 'INTERRUPTED', 'FAILED'];
  if (typeof value.sessionStateAtSnapshot !== 'string' || !sessionStates.includes(value.sessionStateAtSnapshot as LogicalSessionState)) throw new Error(`invalid sessionStateAtSnapshot for ${expectedReportId}`);
  if (!Array.isArray(value.candidates)) throw new Error(`candidates must be an array for ${expectedReportId}`);
  const candidateStates: readonly CandidateProcessingState[] = ['PENDING', 'ACTIVE', 'COMPLETED', 'SOURCE_CHANGE_PENDING', 'INTERRUPTED', 'SUPERSEDED'];
  const candidates = value.candidates.map((candidate, index) => {
    if (!isRecord(candidate)) throw new Error(`invalid candidate ${index} for ${expectedReportId}`);
    const label = `candidates[${index}]`;
    assertExactKeys(candidate, ['candidateRef', 'hypothesisId', 'sourceIndex', 'processingState', 'effectiveRoute', 'effectiveReasonCode', 'effectiveDecisionRef', 'humanFollowupRef', 'supersededBySourceEpochRef', 'interruptionRef'], label);
    if (typeof candidate.sourceIndex !== 'number' || !Number.isInteger(candidate.sourceIndex) || candidate.sourceIndex < 0) throw new Error(`${label}.sourceIndex must be a non-negative integer`);
    if (typeof candidate.processingState !== 'string' || !candidateStates.includes(candidate.processingState as CandidateProcessingState)) throw new Error(`${label}.processingState is invalid`);
    return {
      candidateRef: nonEmptyString(candidate.candidateRef, `${label}.candidateRef`),
      hypothesisId: nonEmptyString(candidate.hypothesisId, `${label}.hypothesisId`),
      sourceIndex: candidate.sourceIndex,
      processingState: candidate.processingState as CandidateProcessingState,
      effectiveRoute: nullableString(candidate.effectiveRoute, `${label}.effectiveRoute`),
      effectiveReasonCode: nullableString(candidate.effectiveReasonCode, `${label}.effectiveReasonCode`),
      effectiveDecisionRef: nullableString(candidate.effectiveDecisionRef, `${label}.effectiveDecisionRef`),
      humanFollowupRef: nullableString(candidate.humanFollowupRef, `${label}.humanFollowupRef`),
      supersededBySourceEpochRef: nullableString(candidate.supersededBySourceEpochRef, `${label}.supersededBySourceEpochRef`),
      interruptionRef: nullableString(candidate.interruptionRef, `${label}.interruptionRef`),
    };
  });
  return {
    schemaVersion: OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7,
    reportId: nonEmptyString(value.reportId, `reportId for ${expectedReportId}`),
    createdAt: nonEmptyString(value.createdAt, `createdAt for ${expectedReportId}`),
    logicalSessionId,
    hostSliceId,
    sessionStateAtSnapshot: value.sessionStateAtSnapshot as LogicalSessionState,
    sessionExecution: parseMultiCandidateSessionSummary(value.sessionExecution, expectedReportId),
    candidates,
    recoverableSessionStateRef: nonEmptyString(value.recoverableSessionStateRef, `recoverableSessionStateRef for ${expectedReportId}`),
    terminalForensicEvidenceRef: nullableString(value.terminalForensicEvidenceRef, `terminalForensicEvidenceRef for ${expectedReportId}`),
  };
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

function parseSessionExecution(
  value: unknown,
  reportId: string,
  expectedSchema: typeof MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION | typeof MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION_V2,
): MultiRoundSessionSummary {
  if (!isRecord(value)) {
    throw new Error(`missing sessionExecution for ${reportId}`);
  }
  if (
    value.schemaVersion !== MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION
    && value.schemaVersion !== MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION_V2
  ) {
    throw new Error(`invalid sessionExecution.schemaVersion for ${reportId}`);
  }
  if (value.schemaVersion !== expectedSchema) {
    throw new Error(`sessionExecution schemaVersion does not match report schema for ${reportId}: expected ${expectedSchema}`);
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
  if (value.schemaVersion === MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION) {
    return value as MultiRoundSessionSummaryV1;
  }
  if (!Array.isArray(value.rounds) || value.rounds.length !== value.roundCount) {
    throw new Error(`invalid sessionExecution.rounds for ${reportId}`);
  }
  for (const [index, round] of value.rounds.entries()) {
    if (!isRecord(round) || (round.round !== 1 && round.round !== 2)) {
      throw new Error(`invalid sessionExecution.rounds[${index}] for ${reportId}`);
    }
    for (const field of ['baseTerminalRoute', 'baseReasonCode', 'continuationRef', 'effectiveTerminalRoute', 'effectiveReasonCode']) {
      if (!(round[field] === null || typeof round[field] === 'string')) {
        throw new Error(`invalid sessionExecution.rounds[${index}].${field} for ${reportId}`);
      }
    }
  }
  if (value.reviewContinuationCount !== 0 && value.reviewContinuationCount !== 1) {
    throw new Error(`invalid sessionExecution.reviewContinuationCount for ${reportId}`);
  }
  if (
    typeof value.reviewContinuationParticipantJobs !== 'number'
    || !Number.isInteger(value.reviewContinuationParticipantJobs)
    || value.reviewContinuationParticipantJobs < 0
    || value.reviewContinuationParticipantJobs > 2
  ) {
    throw new Error(`invalid sessionExecution.reviewContinuationParticipantJobs for ${reportId}`);
  }
  return value as MultiRoundSessionSummaryV2;
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
    && parsed.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V4
    && parsed.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V5
    && parsed.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V6
    && parsed.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7
  ) {
    throw new Error(
      `wrong schemaVersion for ${expectedReportId}: expected ${OPERATIONAL_RUN_REPORT_SCHEMA_VERSION}, ${OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V2}, ${OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V3}, ${OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V4}, ${OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V5}, ${OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V6}, or ${OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7}, got ${String(parsed.schemaVersion)}`,
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
  if (parsed.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7) {
    return parseOperationalRunReportV7(parsed, expectedReportId);
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

  const sessionExecution = parseSessionExecution(
    parsed.sessionExecution,
    expectedReportId,
    parsed.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V5
      || parsed.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V6
      ? MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION_V2
      : MULTI_ROUND_SESSION_SUMMARY_SCHEMA_VERSION,
  );
  if (parsed.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V2) {
    return { ...(parsed as OperationalRunReportV2), sessionExecution };
  }

  const workflows = parsed.workflows.map((workflow, index) => {
    if (!isRecord(workflow)) throw new Error(`invalid workflow ${index} for ${expectedReportId}`);
    return {
      ...workflow,
      decisionAudit: parseWorkflowDecisionAudit(workflow.decisionAudit, `workflows[${index}].decisionAudit`),
    } as AuditedWorkflowSummary;
  });
  if (parsed.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V3) {
    return { ...(parsed as OperationalRunReportV3), sessionExecution, workflows };
  }
  if (parsed.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V4) {
    return {
      ...(parsed as OperationalRunReportV4),
      sessionExecution,
      workspaceProvenance: parseWorkspaceStateProvenanceProjection(parsed.workspaceProvenance),
      workflows,
    };
  }
  if (parsed.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V6) {
    return {
      ...(parsed as OperationalRunReportV6),
      sessionExecution,
      workspaceProvenance: parseWorkspaceStateProvenanceProjection(parsed.workspaceProvenance),
      workflows: workflows.map((workflow, index) => ({
        ...workflow,
        continuationAudit: parsed.workflows[index] && isRecord(parsed.workflows[index]) && parsed.workflows[index].continuationAudit === null
          ? null
          : parseWorkflowContinuationAudit(
            parsed.workflows[index] && isRecord(parsed.workflows[index]) ? parsed.workflows[index].continuationAudit : undefined,
            `workflows[${index}].continuationAudit`,
          ),
      })),
    };
  }
  return {
    ...(parsed as OperationalRunReportV5),
    sessionExecution,
    workspaceProvenance: parseWorkspaceStateProvenanceProjection(parsed.workspaceProvenance),
    workflows,
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

function sessionRouteSummary(report: OperationalRunReport): string {
  if (report.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7) {
    return `candidate dispositions: ${report.candidates.length}`;
  }
  if (report.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V5 && report.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V6) {
    return workflowRouteSummary(report.workflows);
  }
  const lastRound = report.sessionExecution.rounds.at(-1);
  if (lastRound === undefined) return workflowRouteSummary(report.workflows);
  return [
    `base route: ${lastRound.baseTerminalRoute ?? '（无）'}`,
    `review continuation: ${lastRound.continuationRef ?? '（无）'}`,
    `effective route: ${lastRound.effectiveTerminalRoute ?? '（无）'}`,
  ].join('; ');
}

function sourceRunSummary(workflows: WorkflowSummary[]): string {
  const refs = workflows
    .map(workflow => workflow.sourceRunRef)
    .filter((value): value is string => value !== null);
  if (refs.length === 0) return '（无）';
  return [...new Set(refs)].join(', ');
}

function logicalSessionCount(reports: OperationalRunReport[]): number {
  const v7Sessions = new Set(
    reports
      .filter((report): report is OperationalRunReportV7 => report.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7)
      .map(report => report.logicalSessionId),
  );
  const legacyReportCount = reports.filter(report => report.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7).length;
  return v7Sessions.size + legacyReportCount;
}

function renderRunReportsIndex(reports: OperationalRunReport[]): string {
  const sorted = [...reports].sort((left, right) => (
    right.createdAt.localeCompare(left.createdAt) || left.reportId.localeCompare(right.reportId)
  ));
  const v7Groups = new Map<string, OperationalRunReportV7[]>();
  for (const report of sorted) {
    if (report.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7) continue;
    const snapshots = v7Groups.get(report.logicalSessionId) ?? [];
    snapshots.push(report);
    v7Groups.set(report.logicalSessionId, snapshots);
  }
  const lines = [
    '# Auto Evolution 运行报告',
    '',
    `- 报告总数：${sorted.length}`,
    `- Logical Session 总数：${logicalSessionCount(sorted)}`,
    `- Report snapshot 总数：${sorted.length}`,
    '',
    '| 创建时间 | 报告 | 会话停止原因 | 多轮结果 | 执行状态 | 工作流路由 | Source Run | 人类结论 | 建议动作 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  if (sorted.length === 0) {
    lines.push('| *（无）* |  |  |  |  |  |  |');
  } else {
    const renderedV7Sessions = new Set<string>();
    for (const report of sorted) {
      if (report.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7) {
        if (renderedV7Sessions.has(report.logicalSessionId)) continue;
        renderedV7Sessions.add(report.logicalSessionId);
        const snapshots = v7Groups.get(report.logicalSessionId) ?? [report];
        const latest = snapshots[0] ?? report;
        const counts = latest.candidates.reduce((result, candidate) => {
          result[candidate.processingState] = (result[candidate.processingState] ?? 0) + 1;
          return result;
        }, {} as Record<string, number>);
        const history = snapshots.slice(1).map(snapshot => snapshot.reportId).join(', ');
        lines.push(
          `| ${markdownCell(latest.createdAt)} | [${markdownCell(latest.reportId)}](${latest.reportId}/report.md) | ${markdownCell(latest.sessionStateAtSnapshot)} | v7 snapshots: ${snapshots.length} | ${markdownCell(latest.sessionStateAtSnapshot)} | ${markdownCell(sessionRouteSummary(latest))} | ${markdownCell(latest.sessionExecution.currentSourceEpochRef)} | ${markdownCell(latest.logicalSessionId)} | v7: ${counts.COMPLETED ?? 0} completed, ${counts.PENDING ?? 0} pending; ${history === '' ? '（无历史 snapshot）' : `history: ${markdownCell(history)}`} |`,
        );
        continue;
      }
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
        `| ${markdownCell(report.createdAt)} | [${markdownCell(report.reportId)}](${report.reportId}/report.md) | ${markdownCell(sessionStop)} | ${markdownCell(multiRoundOutcome)} | ${markdownCell(execution)} | ${markdownCell(sessionRouteSummary(report))} | ${markdownCell(sourceRunSummary(report.workflows))} | ${markdownCell(human.conclusion)} | ${markdownCell(human.recommendedAction)} |`,
      );
    }
  }
  lines.push(
    '',
    '本索引由归档的 `report.json` sidecar 生成，是可观测性历史，不是 Human backlog 的规范状态。',
    'V1 行仅包含工作流信息；V2 行展示会话执行事实；V3 行展示会话执行事实与有界决策审计；V4 额外保留 Host-observed workspace provenance；V5 保留 bounded review-continuation session semantics；V6 = V5 + continuation audit projection。人类结论与建议动作均来自共享 Human Review projection。',
    '',
  );
  return lines.join('\n');
}

function renderTopLevelIndex(input: {
  reportCount: number;
  logicalSessionCount: number;
  reportSnapshotCount: number;
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
    `- Logical Session 总数：${input.logicalSessionCount}`,
    `- Report snapshot 总数：${input.reportSnapshotCount}`,
    latestLine,
    ...humanGuidance,
    '- 打开 [run-reports/index.md](run-reports/index.md)',
    '',
    '## Human Follow-up',
    '',
    humanFollowupLine,
    '',
    '运行报告是生成式可观测性历史；V3/V4 report.json 保留 bounded Decision Audit，V4 额外保留 Host-observed workspace provenance，V5 保留 bounded review-continuation session semantics，V6 额外保留 continuation audit projection；Durable Evidence Capsule 单独保留 bounded forensic execution evidence；Human Follow-up 只保留正式 HFL item 的 operational state。',
    '',
  ].join('\n');
}

export async function buildOperationalObservabilityIndex(
  input: BuildOperationalObservabilityIndexInput,
): Promise<{
  runReportsIndexPath: string;
  topLevelIndexPath: string;
  reportCount: number;
  logicalSessionCount: number;
  reportSnapshotCount: number;
}> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const reports = await loadArchivedReports(repositoryRoot);
  const sortedForLatest = [...reports].sort((left, right) => (
    right.createdAt.localeCompare(left.createdAt) || left.reportId.localeCompare(right.reportId)
  ));

  const runReportsIndexPath = join(repositoryRoot, RUN_REPORTS_ROOT, 'index.md');
  const topLevelIndexPath = join(repositoryRoot, EVOLUTION_OPERATIONAL_INDEX_PATH);
  const latestReport = sortedForLatest[0] ?? null;
  const latestHumanReview = latestReport === null || latestReport.schemaVersion === OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V7
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
      reportCount: logicalSessionCount(reports),
      logicalSessionCount: logicalSessionCount(reports),
      reportSnapshotCount: reports.length,
      latestReport,
      latestHumanReview,
      humanFollowupIndexPresent: await pathExists(join(repositoryRoot, HUMAN_FOLLOWUP_INDEX_PATH)),
    }),
    'utf8',
  );

  return {
    runReportsIndexPath,
    topLevelIndexPath,
    reportCount: logicalSessionCount(reports),
    logicalSessionCount: logicalSessionCount(reports),
    reportSnapshotCount: reports.length,
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
