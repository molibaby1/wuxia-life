import { mkdir, readdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { validatePhase0RunRef } from '../phase0/provenance';
import {
  buildMultiRoundSessionSummary,
  discoverMultiRoundRunManifestPath,
  readMultiRoundRunManifest,
  type MultiRoundSessionSummaryV1,
} from '../multiRoundRunManifestContract';
import {
  attachWorkflowDecisionAudits,
  collectWorkflowDecisionAudits,
  type WorkflowDecisionAuditV1,
} from './buildWorkflowDecisionAudit';
import { buildHumanReviewSummary } from './buildHumanReviewSummary';

const WORKFLOW_DIRECTORY_PREFIX = 'problem-agnostic-agent-solution-loop-instance-';
const DEFAULT_ROOT = '.tmp/evolution';
const DEFAULT_OUTPUT_PATH = 'artifacts/reports/auto-evolution-run-report.md';
const TERMINAL_WORKFLOW_SIGNATURE_ARTIFACTS = [
  'decision.json',
  'workflow-outcome.json',
] as const;

const STRUCTURED_ARTIFACTS = [
  'problem-package.json',
  'source/observable-payload.json',
  'selection/selected-hypothesis.json',
  'solution-agent/invocation.json',
  'solution-agent/result.json',
  'solution-agent/failure.json',
  'solution-agent/execution-trace.json',
  'reviewer-agent/invocation.json',
  'reviewer-agent/review.json',
  'reviewer-agent/failure.json',
  'decision.json',
  'workflow-outcome.json',
] as const;

const EXECUTION_TRACE_PATH = 'solution-agent/execution-trace.json';

type FirstAttemptClassification = 'VALID' | 'ENVELOPE_FAILURE' | 'SCHEMA_FAILURE';
type RetransmissionOutcome =
  | 'NOT_ATTEMPTED'
  | 'SUCCEEDED'
  | 'TIMEOUT'
  | 'CONTINUATION_FAILURE'
  | 'RUNTIME_FAILURE'
  | 'ENVELOPE_FAILURE'
  | 'SCHEMA_FAILURE';
type FinalStructuredOutput = 'VALID' | 'FAILED';

export interface StructuredTerminalDeliverySummary {
  firstAttempt: FirstAttemptClassification | null;
  retransmission: RetransmissionOutcome | null;
  finalStructuredOutput: FinalStructuredOutput | null;
}

type JsonRecord = Record<string, unknown>;

export interface BuildOperationalRunReportInput {
  root: string;
  outputPath: string;
}

export interface BuildOperationalRunReportResult {
  reportPath: string;
  workflowCount: number;
}

export interface WorkflowSummary {
  identity: string;
  status: string;
  sourceRunRef: string | null;
  problemStatement: string | null;
  solutionStatus: string | null;
  reviewerDecision: string | null;
  terminalRoute: string | null;
  reason: string | null;
  failedStage: string | null;
  participantErrorKind: string | null;
  authoritativeModification: 'NO' | 'UNAVAILABLE';
  lastAvailableArtifact: string | null;
  artifactRefs: string[];
  structuredTerminalDelivery: StructuredTerminalDeliverySummary | null;
  decisionAudit?: WorkflowDecisionAuditV1;
}

export interface RenderOperationalRunReportInput {
  summaries: WorkflowSummary[];
  reportId?: string;
  createdAt?: string;
  includeArtifactRetentionNote?: boolean;
  sessionExecution?: MultiRoundSessionSummaryV1;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function nestedRecord(value: unknown, key: string): JsonRecord | null {
  if (!isRecord(value)) return null;
  return isRecord(value[key]) ? value[key] : null;
}

async function readStructuredArtifact(path: string): Promise<JsonRecord | null> {
  try {
    const artifact = JSON.parse(await readFile(path, 'utf8')) as unknown;
    return isRecord(artifact) ? artifact : null;
  } catch {
    return null;
  }
}

async function readSafeReferencedInvocation(root: string, reference: unknown): Promise<JsonRecord | null> {
  if (typeof reference !== 'string' || reference.length === 0 || reference.includes('\\') || isAbsolute(reference)) {
    return null;
  }

  const resolvedRoot = resolve(root);
  const candidate = resolve(resolvedRoot, reference);
  const relativeCandidate = relative(resolvedRoot, candidate);
  if (
    !relativeCandidate
    || relativeCandidate === '..'
    || relativeCandidate.startsWith(`..${sep}`)
    || isAbsolute(relativeCandidate)
    || basename(candidate) !== 'invocation.json'
  ) {
    return null;
  }

  try {
    const realRoot = await realpath(resolvedRoot);
    const realCandidate = await realpath(candidate);
    const realRelativeCandidate = relative(realRoot, realCandidate);
    if (
      !realRelativeCandidate
      || realRelativeCandidate === '..'
      || realRelativeCandidate.startsWith(`..${sep}`)
      || isAbsolute(realRelativeCandidate)
      || !(await stat(realCandidate)).isFile()
    ) {
      return null;
    }
    return readStructuredArtifact(realCandidate);
  } catch {
    return null;
  }
}

async function sourceRunRefFromParticipantFailure(
  root: string,
  workflowOutcome: JsonRecord | null,
): Promise<string | null> {
  if (workflowOutcome?.outcome !== 'PARTICIPANT_FAILURE' || !Array.isArray(workflowOutcome.failureArtifactRefs)) {
    return null;
  }

  for (const reference of workflowOutcome.failureArtifactRefs) {
    const invocation = await readSafeReferencedInvocation(root, reference);
    if (invocation?.status !== 'failed') continue;
    const runRef = stringValue(invocation.runRef);
    if (runRef === null) continue;
    try {
      return validatePhase0RunRef(runRef);
    } catch {
      // Invalid persisted provenance is not a source ref.
    }
  }
  return null;
}

async function existingArtifactRefs(root: string): Promise<string[]> {
  const refs: string[] = [];
  for (const reference of STRUCTURED_ARTIFACTS) {
    try {
      const artifactPath = join(root, reference);
      if ((await stat(artifactPath)).isFile()) refs.push(reference);
    } catch {
      // Missing artifacts are part of the observable workflow state.
    }
  }
  return refs;
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

async function isWorkflowRoot(root: string): Promise<boolean> {
  for (const artifact of TERMINAL_WORKFLOW_SIGNATURE_ARTIFACTS) {
    if (await isFile(join(root, artifact))) return true;
  }

  const hasSourceArtifact = await isFile(join(root, 'source/observable-payload.json'));
  if (await isFile(join(root, 'problem-package.json')) && hasSourceArtifact) return true;

  return basename(root).startsWith(WORKFLOW_DIRECTORY_PREFIX) && hasSourceArtifact;
}

async function discoverWorkflowRoots(root: string): Promise<string[]> {
  const resolvedRoot = resolve(root);
  const workflowRoots: string[] = [];

  async function visit(directory: string): Promise<void> {
    if (await isWorkflowRoot(directory)) {
      workflowRoots.push(directory);
      return;
    }

    const entries = (await readdir(directory, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
    for (const entry of entries) {
      await visit(join(directory, entry.name));
    }
  }

  await visit(resolvedRoot);
  return workflowRoots;
}

function displayWorkflowIdentity(scanRoot: string, workflowRoot: string): string {
  const stableRelativePath = relative(resolve(scanRoot), workflowRoot).split(sep).join('/');
  return stableRelativePath || basename(workflowRoot);
}

function isAttempt(value: unknown): value is 0 | 1 {
  return value === 0 || value === 1;
}

function terminalValidationEvents(trace: JsonRecord): JsonRecord[] {
  if (!Array.isArray(trace.events)) return [];
  return trace.events.filter(event => (
    isRecord(event)
    && event.type === 'participant_terminal_validation'
    && isAttempt(event.attempt)
  ));
}

function retransmissionRequested(trace: JsonRecord): boolean {
  if (!Array.isArray(trace.events)) return false;
  return trace.events.some(event => (
    isRecord(event) && event.type === 'participant_envelope_retransmission_requested'
  ));
}

function retransmissionCompletedEvent(trace: JsonRecord): JsonRecord | null {
  if (!Array.isArray(trace.events)) return null;
  for (const event of trace.events) {
    if (isRecord(event) && event.type === 'participant_envelope_retransmission_completed') {
      return event;
    }
  }
  return null;
}

function classifyFirstAttempt(validation: JsonRecord | undefined): FirstAttemptClassification | null {
  if (validation === undefined) return null;
  if (validation.envelopeValid === false) return 'ENVELOPE_FAILURE';
  if (validation.schemaValid === false) return 'SCHEMA_FAILURE';
  if (validation.envelopeValid === true && validation.schemaValid === true) return 'VALID';
  return null;
}

function mapRuntimeOutcome(
  runtimeOutcome: unknown,
): 'TIMEOUT' | 'CONTINUATION_FAILURE' | 'RUNTIME_FAILURE' | null {
  if (runtimeOutcome === 'TIMEOUT') return 'TIMEOUT';
  if (runtimeOutcome === 'CONTINUATION_FAILURE') return 'CONTINUATION_FAILURE';
  if (runtimeOutcome === 'RUNTIME_FAILURE') return 'RUNTIME_FAILURE';
  return null;
}

function deriveRetransmissionOutcome(
  trace: JsonRecord,
  attempt1Validation: JsonRecord | undefined,
): RetransmissionOutcome {
  if (!retransmissionRequested(trace)) return 'NOT_ATTEMPTED';

  const completed = retransmissionCompletedEvent(trace);
  if (completed === null) return 'NOT_ATTEMPTED';

  if (completed.runtimeOutcome !== 'COMPLETED') {
    return mapRuntimeOutcome(completed.runtimeOutcome) ?? 'RUNTIME_FAILURE';
  }

  if (attempt1Validation === undefined) return 'RUNTIME_FAILURE';
  if (attempt1Validation.envelopeValid === false) return 'ENVELOPE_FAILURE';
  if (attempt1Validation.schemaValid === false) return 'SCHEMA_FAILURE';
  if (attempt1Validation.envelopeValid === true && attempt1Validation.schemaValid === true) {
    return 'SUCCEEDED';
  }
  return 'RUNTIME_FAILURE';
}

function deriveFinalStructuredOutput(validations: JsonRecord[]): FinalStructuredOutput | null {
  if (validations.some(validation => validation.accepted === true)) return 'VALID';
  if (validations.length > 0) return 'FAILED';
  return null;
}

function summarizeStructuredTerminalDelivery(trace: JsonRecord | null): StructuredTerminalDeliverySummary | null {
  if (trace === null || trace.schemaVersion !== 'participant-execution-trace-v1') return null;

  const validations = terminalValidationEvents(trace);
  if (validations.length === 0) return null;

  const attempt0Validation = validations.find(validation => validation.attempt === 0);
  const attempt1Validation = validations.find(validation => validation.attempt === 1);
  const firstAttempt = classifyFirstAttempt(attempt0Validation);
  const retransmission = deriveRetransmissionOutcome(trace, attempt1Validation);
  const finalStructuredOutput = deriveFinalStructuredOutput(validations);

  if (firstAttempt === null && retransmission === 'NOT_ATTEMPTED' && finalStructuredOutput === null) {
    return null;
  }

  return {
    firstAttempt,
    retransmission,
    finalStructuredOutput,
  };
}

interface StructuredTerminalAggregateCounts {
  firstPassStructuredOutputSuccesses: number;
  firstPassEnvelopeFailures: number;
  retransmissionsAttempted: number;
  retransmissionsSucceeded: number;
  finalStructuredOutputSuccesses: number;
}

function aggregateStructuredTerminalDelivery(
  summaries: WorkflowSummary[],
): StructuredTerminalAggregateCounts | null {
  const observed = summaries
    .map(summary => summary.structuredTerminalDelivery)
    .filter((summary): summary is StructuredTerminalDeliverySummary => summary !== null);
  if (observed.length === 0) return null;

  return {
    firstPassStructuredOutputSuccesses: observed.filter(summary => (
      summary.firstAttempt === 'VALID' && summary.finalStructuredOutput === 'VALID'
    )).length,
    firstPassEnvelopeFailures: observed.filter(summary => summary.firstAttempt === 'ENVELOPE_FAILURE').length,
    retransmissionsAttempted: observed.filter(summary => (
      summary.retransmission !== null && summary.retransmission !== 'NOT_ATTEMPTED'
    )).length,
    retransmissionsSucceeded: observed.filter(summary => summary.retransmission === 'SUCCEEDED').length,
    finalStructuredOutputSuccesses: observed.filter(summary => summary.finalStructuredOutput === 'VALID').length,
  };
}

async function summarizeWorkflow(root: string, identity: string): Promise<WorkflowSummary> {
  const problemPackage = await readStructuredArtifact(join(root, 'problem-package.json'));
  const solution = await readStructuredArtifact(join(root, 'solution-agent/result.json'));
  const reviewer = await readStructuredArtifact(join(root, 'reviewer-agent/review.json'));
  const decision = await readStructuredArtifact(join(root, 'decision.json'));
  const workflowOutcome = await readStructuredArtifact(join(root, 'workflow-outcome.json'));
  const artifactRefs = await existingArtifactRefs(root);
  const problem = nestedRecord(problemPackage, 'problem');
  const source = nestedRecord(problemPackage, 'source');
  const permissions = nestedRecord(problemPackage, 'permissions');
  const decisionInputs = nestedRecord(decision, 'inputs');

  const outcome = stringValue(workflowOutcome?.outcome);
  const route = stringValue(workflowOutcome?.route) ?? stringValue(decision?.route);
  const status = outcome ?? route ?? 'INCOMPLETE';
  const authoritativeModification = outcome === 'PARTICIPANT_FAILURE'
    ? 'NO'
    : permissions?.authoritativeProductWrite === false
    && permissions.productExecution === false
      ? 'NO'
      : 'UNAVAILABLE';
  const fallbackSourceRunRef = await sourceRunRefFromParticipantFailure(root, workflowOutcome);
  const executionTrace = await readStructuredArtifact(join(root, EXECUTION_TRACE_PATH));
  const structuredTerminalDelivery = summarizeStructuredTerminalDelivery(executionTrace);

  return {
    identity,
    status,
    sourceRunRef: stringValue(source?.runRef) ?? fallbackSourceRunRef,
    problemStatement: stringValue(problem?.statement),
    solutionStatus: stringValue(solution?.status) ?? stringValue(solution?.kind),
    reviewerDecision: stringValue(reviewer?.decision) ?? stringValue(decisionInputs?.reviewerDecision),
    terminalRoute: route,
    reason: stringValue(decision?.reasonCode),
    failedStage: stringValue(workflowOutcome?.failedStage),
    participantErrorKind: stringValue(workflowOutcome?.participantErrorKind),
    authoritativeModification,
    lastAvailableArtifact: artifactRefs.at(-1) ?? null,
    artifactRefs,
    structuredTerminalDelivery,
  };
}

/** One source of workflow summarization truth for legacy aggregate and archived reports. */
export async function collectWorkflowSummaries(root: string): Promise<WorkflowSummary[]> {
  const workflowRoots = await discoverWorkflowRoots(root);
  return Promise.all(workflowRoots.map(workflowRoot => (
    summarizeWorkflow(workflowRoot, displayWorkflowIdentity(root, workflowRoot))
  )));
}

function renderOptionalLine(label: string, value: string | null): string[] {
  return value === null ? [] : [`- ${label}：${value}`];
}

function renderDecisionAudit(audit: WorkflowDecisionAuditV1): string[] {
  const assessment = audit.improvementHypothesis.noProblemAssessment;
  const lines = ['', '### 决策审计 / 判断链', '', '#### External Feedback', '', `- 状态：${audit.externalFeedback.status}`];
  if (audit.externalFeedback.overallImpression !== null) {
    lines.push(`- 总体感受：${audit.externalFeedback.overallImpression}`);
  }
  audit.externalFeedback.observations.forEach((observation, index) => {
    lines.push(`- 观察 ${index + 1}：${observation.feedback}`);
    lines.push(`  - 玩家证据：${observation.evidenceRefs.join(', ') || '（无）'}`);
  });
  lines.push('', '#### Improvement Hypothesis', '', `- 状态：${audit.improvementHypothesis.status}`, `- 形成改善假设：${audit.improvementHypothesis.hypothesisCount ?? '（无）'} 条`);
  audit.improvementHypothesis.hypotheses.forEach((hypothesis, index) => {
    lines.push(
      `- 假设 ${index + 1}：${hypothesis.hypothesis}`,
      `  - observedBasis：${hypothesis.observedBasis}`,
      `  - productSignificance：${hypothesis.productSignificance}`,
      `  - unknowns：${hypothesis.unknowns.join('；')}`,
      `  - Feedback refs：${hypothesis.feedbackRefs.join(', ')}`,
      `  - 玩家证据：${hypothesis.evidenceRefs.join(', ') || '（无）'}`,
    );
  });
  if (assessment.status === 'recorded') {
    lines.push(
      `- 未形成问题的判断：${assessment.rationale}`,
      `  - 引用 Feedback：${assessment.feedbackRefs.join(', ')}`,
      `  - 玩家证据：${assessment.evidenceRefs.join(', ') || '（无）'}`,
    );
  } else {
    lines.push(`- 未形成问题的判断：${assessment.status === 'unavailable' ? 'legacy-unavailable（历史契约未保留）' : assessment.status}`);
  }
  lines.push('', '#### Selection', '', `- 状态：${audit.selection.status}`);
  lines.push(audit.selection.status === 'selected'
    ? `- 已选择 hypothesis：${audit.selection.selectedHypothesisId}`
    : '- 未选择 hypothesis。');
  lines.push('', '#### Solution', '', `- 状态：${audit.solution.status}`);
  if (audit.solution.summary !== null) lines.push(`- summary：${audit.solution.summary}`);
  if (audit.solution.options.length > 0) {
    audit.solution.options.forEach(option => {
      lines.push(`- 方案 ${option.optionId}：${option.proposedChange}；理由：${option.rationale}；范围：${option.changeScope}`);
    });
  } else {
    lines.push('- 未运行或未形成方案。');
  }
  lines.push('', '#### Reviewer', '', `- 状态：${audit.reviewer.status}`);
  if (audit.reviewer.decision !== null) lines.push(`- decision：${audit.reviewer.decision}`);
  if (audit.reviewer.assessment !== null) lines.push(`- assessment：${audit.reviewer.assessment}`);
  if (audit.reviewer.scopeAssessment !== null) lines.push(`- scope assessment：${audit.reviewer.scopeAssessment}`);
  if (audit.reviewer.concerns.length > 0) lines.push(`- concerns：${audit.reviewer.concerns.join('；')}`);
  lines.push('', '#### Decision', '', `- ${audit.decision.route ?? '（无）'} / ${audit.decision.reasonCode ?? '（无）'}`);
  return lines;
}

function renderWorkflow(
  summary: WorkflowSummary,
  index: number,
  sessionExecution: MultiRoundSessionSummaryV1 | undefined,
): string[] {
  const lines = [
    `## ${index}. ${summary.identity}`,
    '',
    `- 状态：${summary.status}`,
    ...renderOptionalLine('Source Run', summary.sourceRunRef),
    ...renderOptionalLine('问题描述', summary.problemStatement),
    ...renderOptionalLine('解决方案状态 / 结果类型', summary.solutionStatus),
    ...renderOptionalLine('审核决策', summary.reviewerDecision),
  ];

  if (summary.terminalRoute === null) {
    lines.push('- 终止路由 / 工作流结果：未记录');
  } else {
    lines.push(`- 终止路由 / 工作流结果：${summary.terminalRoute}`);
  }
  lines.push(...renderOptionalLine('原因', summary.reason));
  lines.push(...renderOptionalLine('失败阶段', summary.failedStage));
  lines.push(...renderOptionalLine('Participant 错误类型', summary.participantErrorKind));
  lines.push(`- 本工作流产生权威变更：${summary.authoritativeModification}`);

  if (summary.decisionAudit !== undefined) {
    lines.push(...renderDecisionAudit(summary.decisionAudit));
  }

  if (summary.structuredTerminalDelivery !== null) {
    lines.push('', '### 结构化终止交付', '');
    if (summary.structuredTerminalDelivery.firstAttempt !== null) {
      lines.push(`- 首次尝试：${summary.structuredTerminalDelivery.firstAttempt}`);
    }
    if (summary.structuredTerminalDelivery.retransmission !== null) {
      lines.push(`- 有界重传：${summary.structuredTerminalDelivery.retransmission}`);
    }
    if (summary.structuredTerminalDelivery.finalStructuredOutput !== null) {
      lines.push(`- 最终结构化输出：${summary.structuredTerminalDelivery.finalStructuredOutput}`);
    }
  }

  if (summary.status === 'READY_FOR_CONFIG_EXECUTION') {
    if (sessionExecution && sessionExecution.execution.status !== 'not_started') {
      lines.push(
        '- 本轮工作流已接受配置范围；后续情况见“会话执行”。',
      );
    } else {
      lines.push('- 已接受的配置工作可等待单独授权后执行。');
    }
  }
  if (summary.status === 'INCOMPLETE') {
    lines.push(...renderOptionalLine('最后可用 Artifact', summary.lastAvailableArtifact));
  }

  lines.push('', '### 相关 Artifact 引用', '');
  if (summary.artifactRefs.length === 0) {
    lines.push('- 不可用');
  } else {
    lines.push(...summary.artifactRefs.map(reference => `- ${reference}`));
  }
  lines.push('');
  return lines;
}

function renderSessionExecutionSection(summary: MultiRoundSessionSummaryV1): string[] {
  const changed = summary.execution.actualChangedFiles.length === 0
    ? '（无）'
    : summary.execution.actualChangedFiles.join(', ');
  return [
    '## 会话执行',
    '',
    `- 多轮运行：${summary.multiRoundRunRef}`,
    `- Host 停止原因：${summary.stopReason}`,
    `- 多轮执行结果：${summary.outcome}`,
    `- 跨轮次数：${summary.crossRoundTransitions}`,
    `- 最后一轮路由：${summary.lastRoundTerminalRoute ?? '（无）'}`,
    `- 执行状态：${summary.execution.status}`,
    `- 实际执行变更：${changed}`,
    `- 结果运行：${summary.execution.resultingRunRef ?? '（无）'}`,
    '',
  ];
}

export function renderOperationalRunReportMarkdown(input: RenderOperationalRunReportInput): string {
  const { summaries } = input;
  const aggregateCounts = aggregateStructuredTerminalDelivery(summaries);
  const humanReview = buildHumanReviewSummary({
    workflows: summaries,
    ...(input.reportId === undefined ? {} : { reportId: input.reportId }),
    ...(input.sessionExecution === undefined ? {} : { sessionExecution: input.sessionExecution }),
  });
  const headerLines = [
    '# Auto Evolution 运行报告',
    '',
    '## 一眼结论',
    '',
    humanReview.conclusion,
    '',
    ...humanReview.explanation.map(line => `- ${line}`),
    '',
    `## ${humanReview.action.title}`,
    '',
    ...(humanReview.handoff?.mode === 'required'
      ? ['这一步需要你处理。', '']
      : humanReview.handoff !== null
        ? ['这一步可选。', '']
        : []),
    ...humanReview.action.steps.map((step, index) => `${index + 1}. ${step}`),
  ];
  if (humanReview.handoff !== null) {
    headerLines.push('', humanReview.handoff.label, '', '```text', humanReview.handoff.prompt, '```');
  }
  if (humanReview.attention === 'human_review') {
    headerLines.push(
      '',
      '系统证据（审计引用，不是前置学习材料）：',
      '',
      '- Human Follow-up index: artifacts/evolution/human-follow-up/index.md',
      ...(input.reportId === undefined
        ? []
        : [`- Run Report: artifacts/evolution/run-reports/${input.reportId}/report.json`]),
    );
  }

  const isArchivedView = input.reportId !== undefined || input.createdAt !== undefined
    || input.includeArtifactRetentionNote === true;
  if (isArchivedView) {
    if (input.reportId !== undefined) {
      headerLines.push(`- 报告 ID：${input.reportId}`);
    }
    if (input.createdAt !== undefined) {
      headerLines.push(`- 创建时间：${input.createdAt}`);
    }
    headerLines.push(`- 工作流数量：${summaries.length}`);
    if (input.includeArtifactRetentionNote === true) {
      headerLines.push(
        '',
        '## 证据引用与保留',
        '',
        '以下 Artifact 引用指向原始执行位置（通常位于 `.tmp/evolution/**`）。',
        '这些原始工作流 Artifact 不受 retention 保护，可能被清理，也不会复制到此归档中。',
        'V3 report.json 本身保留已验证的 bounded Decision Audit；V1/V2 不含该审计时会明确标记不可重建，SKIP 不依赖 Human Follow-up 才可审计。',
        'Human Follow-up retention 只保留正式创建 HFL item 的 route 所需 operational state。',
      );
    }
  } else {
    headerLines.push(`- 工作流数量：${summaries.length}`);
  }

  if (input.sessionExecution) {
    headerLines.push('', ...renderSessionExecutionSection(input.sessionExecution));
    headerLines.push('## 工作流 / 轮次详情', '');
  }

  if (aggregateCounts !== null) {
    headerLines.push(
      '',
      '## 结构化终止交付汇总',
      '',
      `- 首次结构化输出成功：${aggregateCounts.firstPassStructuredOutputSuccesses}`,
      `- 首次封装失败：${aggregateCounts.firstPassEnvelopeFailures}`,
      `- 已尝试重传：${aggregateCounts.retransmissionsAttempted}`,
      `- 重传成功：${aggregateCounts.retransmissionsSucceeded}`,
      `- 最终结构化输出成功：${aggregateCounts.finalStructuredOutputSuccesses}`,
    );
  }

  return [
    ...headerLines,
    '',
    ...summaries.flatMap((summary, index) => renderWorkflow(summary, index + 1, input.sessionExecution)),
  ].join('\n');
}

export interface ArchivedOperationalRunReportForMarkdown {
  reportId: string;
  createdAt: string;
  workflows: WorkflowSummary[];
  sessionExecution?: MultiRoundSessionSummaryV1 | null;
}

export function renderOperationalRunReportMarkdownFromReport(
  report: ArchivedOperationalRunReportForMarkdown,
): string {
  return renderOperationalRunReportMarkdown({
    summaries: report.workflows,
    reportId: report.reportId,
    createdAt: report.createdAt,
    includeArtifactRetentionNote: true,
    ...(report.sessionExecution == null ? {} : { sessionExecution: report.sessionExecution }),
  });
}

function renderReport(summaries: WorkflowSummary[], sessionExecution?: MultiRoundSessionSummaryV1): string {
  return renderOperationalRunReportMarkdown({ summaries, sessionExecution });
}

export async function buildOperationalRunReport(
  input: BuildOperationalRunReportInput,
): Promise<BuildOperationalRunReportResult> {
  const summaries = await collectWorkflowSummaries(input.root);
  const manifestPath = await discoverMultiRoundRunManifestPath(input.root);
  const sessionExecution = manifestPath === null
    ? undefined
    : buildMultiRoundSessionSummary(await readMultiRoundRunManifest(manifestPath));
  const reportSummaries = sessionExecution === undefined
    ? summaries
    : attachWorkflowDecisionAudits(
      summaries,
      await collectWorkflowDecisionAudits(input.root),
    );
  const report = renderReport(reportSummaries, sessionExecution);
  await mkdir(dirname(resolve(input.outputPath)), { recursive: true });
  await writeFile(input.outputPath, report, 'utf8');
  return { reportPath: input.outputPath, workflowCount: summaries.length };
}

function parseArgs(args: string[]): BuildOperationalRunReportInput {
  let root = DEFAULT_ROOT;
  let outputPath = DEFAULT_OUTPUT_PATH;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--root' || argument === '--output') {
      const value = args[index + 1];
      if (!value) throw new Error(`${argument} requires a path`);
      if (argument === '--root') root = value;
      else outputPath = value;
      index += 1;
      continue;
    }
    throw new Error(`unknown argument: ${argument}`);
  }
  return { root, outputPath };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildOperationalRunReport(parseArgs(process.argv.slice(2)))
    .then(result => {
      console.log(`Observed workflow runs: ${result.workflowCount}`);
      console.log(`Wrote ${result.reportPath}`);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
