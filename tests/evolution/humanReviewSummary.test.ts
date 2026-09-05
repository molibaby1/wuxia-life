import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { MultiRoundSessionSummaryV1 } from '../../scripts/evolution/multiRoundRunManifestContract';
import type { WorkflowSummary } from '../../scripts/evolution/reporting/buildOperationalRunReport';
import type { WorkflowDecisionAuditV1 } from '../../scripts/evolution/reporting/buildWorkflowDecisionAudit';
import { buildHumanReviewSummary } from '../../scripts/evolution/reporting/buildHumanReviewSummary';
import { renderOperationalRunReportMarkdown } from '../../scripts/evolution/reporting/buildOperationalRunReport';
import { buildOperationalObservabilityIndex } from '../../scripts/evolution/reporting/buildOperationalObservabilityIndex';
import { refreshArchivedOperationalRunReports } from '../../scripts/evolution/reporting/refreshArchivedOperationalRunReports';

const session = (overrides: Partial<MultiRoundSessionSummaryV1> = {}): MultiRoundSessionSummaryV1 => ({
  schemaVersion: 'multi-round-session-summary-v1',
  multiRoundRunRef: 'multi-round-000001',
  outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED',
  stopReason: 'ROUND_1_TERMINAL_NOT_READY',
  roundCount: 1,
  crossRoundTransitions: 0,
  lastRoundTerminalRoute: 'SKIP',
  execution: {
    executionRef: 'execution-000001',
    status: 'not_started',
    actualChangedFiles: [],
    resultingRunRef: null,
  },
  ...overrides,
});

const audit = (overrides: Partial<WorkflowDecisionAuditV1> = {}): WorkflowDecisionAuditV1 => ({
  schemaVersion: 'ae-workflow-decision-audit-v1',
  externalFeedback: {
    status: 'completed',
    artifactRef: 'feedback-runs/source-000001/feedback.json',
    overallImpression: '整体体验没有形成稳定的问题信号。',
    observations: [{ feedback: '没有观察到足以支持产品问题的重复模式。', evidenceRefs: ['entry-000001'] }],
  },
  improvementHypothesis: {
    status: 'completed',
    artifactRef: 'hypothesis-runs/source-000001/hypotheses.json',
    hypothesisCount: 0,
    hypotheses: [],
    noProblemAssessment: {
      status: 'recorded',
      rationale: '现有反馈只支持一次性体验描述，证据不足以形成值得进一步调查的问题假设。',
      feedbackRefs: ['observations[0]'],
      evidenceRefs: ['entry-000001'],
    },
  },
  selection: { status: 'none', artifactRef: null, selectedHypothesisId: null },
  solution: {
    status: 'not_run',
    artifactRef: null,
    solutionStatus: null,
    summary: null,
    recommendedOptionId: null,
    options: [],
  },
  reviewer: {
    status: 'not_run',
    artifactRef: null,
    decision: null,
    assessment: null,
    acceptedOptionId: null,
    scopeAssessment: null,
    concerns: [],
  },
  decision: {
    status: 'completed',
    artifactRef: 'decision.json',
    route: 'SKIP',
    reasonCode: 'NO_PROBLEM_FORMED',
  },
  ...overrides,
});

const workflow = (overrides: Partial<WorkflowSummary> = {}, decisionAudit?: WorkflowDecisionAuditV1): WorkflowSummary & { decisionAudit?: WorkflowDecisionAuditV1 } => ({
  identity: 'round-1',
  status: 'SKIP',
  sourceRunRef: 'source-000001',
  problemStatement: '待观察的体验问题',
  solutionStatus: 'NO_PROPOSAL',
  reviewerDecision: null,
  terminalRoute: 'SKIP',
  reason: 'NO_PROBLEM_FORMED',
  failedStage: null,
  participantErrorKind: null,
  authoritativeModification: 'NO',
  lastAvailableArtifact: 'decision.json',
  artifactRefs: ['decision.json'],
  structuredTerminalDelivery: null,
  ...(decisionAudit === undefined ? {} : { decisionAudit }),
  ...overrides,
});

function testSkipProjection(): void {
  const result = buildHumanReviewSummary({
    reportId: 'ae-report-test',
    sessionExecution: session(),
    workflows: [workflow({}, audit())],
  });
  assert.match(result.conclusion, /没有形成足够依据支持的改善问题/);
  assert.match(result.recommendedAction, /无需处理/);
  assert.match(result.recommendedAction, /不要.*READY|READY.*重跑/);
  // C. SKIP: ChatGPT audit remains optional.
  assert.equal(result.handoff?.mode, 'optional');
  assert.ok(result.explanation.length >= 1 && result.explanation.length <= 4);
  assert.ok(result.handoff);
  assert.match(result.handoff?.prompt ?? '', /project\.zip/);
  assert.match(result.handoff?.prompt ?? '', /artifacts\/evolution\/run-reports\/ae-report-test\/report\.json/);
  assert.match(result.handoff?.prompt ?? '', /只读/);
  assert.doesNotMatch(result.handoff?.prompt ?? '', /\/Users\//);
}

function testFailureAndSessionOverrides(): void {
  const failure = buildHumanReviewSummary({
    reportId: 'ae-report-failure',
    workflows: [workflow({
      status: 'PARTICIPANT_FAILURE',
      terminalRoute: 'DEFER',
      reason: 'PARTICIPANT_FAILURE',
      failedStage: 'IMPROVEMENT_HYPOTHESIS',
      participantErrorKind: 'timeout',
    }, audit({ decision: { status: 'completed', artifactRef: 'decision.json', route: 'ESCALATE_HUMAN', reasonCode: 'PARTICIPANT_FAILURE' } }))],
  });
  assert.match(failure.conclusion, /没有形成可靠的产品结论/);
  assert.match(failure.explanation.join('\n'), /IMPROVEMENT_HYPOTHESIS|失败阶段/);
  assert.match(failure.explanation.join('\n'), /timeout/);
  assert.doesNotMatch(failure.conclusion, /没有形成足够依据/);
  // D. PARTICIPANT_FAILURE: no "no problem" implication, no blind rerun.
  assert.doesNotMatch(failure.recommendedAction, /没有问题/);
  assert.match(failure.recommendedAction, /不要.*修改产品/);
  assert.match(failure.recommendedAction, /不要.*重跑/);
  assert.ok(failure.explanation.length <= 4);
  assert.equal(failure.handoff?.mode, 'optional');

  const scopeViolation = buildHumanReviewSummary({
    sessionExecution: session({
      stopReason: 'EXECUTION_SCOPE_VIOLATION',
      lastRoundTerminalRoute: 'READY_FOR_CONFIG_EXECUTION',
      execution: { executionRef: 'execution-000001', status: 'scope_violation', actualChangedFiles: [], resultingRunRef: null },
    }),
    workflows: [workflow({ status: 'READY_FOR_CONFIG_EXECUTION', terminalRoute: 'READY_FOR_CONFIG_EXECUTION', reason: 'ACCEPTED_CONFIGURATION_SCOPE' }, audit({ decision: { status: 'completed', artifactRef: 'decision.json', route: 'READY_FOR_CONFIG_EXECUTION', reasonCode: 'ACCEPTED_CONFIGURATION_SCOPE' } }))],
  });
  assert.match(scopeViolation.conclusion, /范围校验停止/);
  assert.doesNotMatch(scopeViolation.conclusion, /准备好执行配置/);
  // F. scope_violation: execution integration failure distinguished from product rejection.
  assert.match(scopeViolation.explanation.join('\n').length > 0 ? scopeViolation.explanation.join('\n') : scopeViolation.conclusion, /范围|执行/);
  assert.match(scopeViolation.recommendedAction, /不要.*绕过/);
  assert.doesNotMatch(scopeViolation.conclusion, /产品方案被否决/);
  assert.ok(scopeViolation.explanation.length <= 4);
}

function testLegacyAndReasonDistinctions(): void {
  const legacy = buildHumanReviewSummary({
    workflows: [workflow({ terminalRoute: 'SKIP', reason: 'NO_PROBLEM_FORMED' })],
  });
  assert.match(legacy.conclusion, /历史报告/);
  assert.match(legacy.explanation.join('\n'), /Decision Audit/);
  assert.match(legacy.explanation.join('\n'), /不能重建|不能.*解释/);
  assert.doesNotMatch(legacy.explanation.join('\n'), /因为没有问题/);

  const noAction = buildHumanReviewSummary({
    workflows: [workflow({ reason: 'REVIEW_ACCEPT_NO_ACTION' }, audit({ decision: { status: 'completed', artifactRef: 'decision.json', route: 'SKIP', reasonCode: 'REVIEW_ACCEPT_NO_ACTION' }, reviewer: { status: 'completed', artifactRef: 'reviewer-agent/review.json', decision: 'ACCEPT_NO_ACTION', assessment: '当前不采取行动。', acceptedOptionId: null, scopeAssessment: null, concerns: [] } }))],
  });
  assert.match(noAction.conclusion, /接受不采取行动/);
  assert.doesNotMatch(noAction.conclusion, /没有形成足够依据/);

  const escalate = buildHumanReviewSummary({
    reportId: 'ae-report-escalate',
    workflows: [workflow({ reason: 'EXPLICIT_ESCALATION', terminalRoute: 'ESCALATE_HUMAN' }, audit({ decision: { status: 'completed', artifactRef: 'decision.json', route: 'ESCALATE_HUMAN', reasonCode: 'EXPLICIT_ESCALATION' } }))],
  });
  assert.match(escalate.conclusion, /需要 Human 判断/);
  // A. ESCALATE required handoff: physical Human action, not internal workflow state.
  assert.equal(escalate.handoff?.mode, 'required');
  assert.match(escalate.action.title, /交给 ChatGPT.*只读/);
  assert.ok(escalate.action.steps.some(step => step.includes('project.zip')));
  assert.ok(escalate.action.steps.some(step => step.includes('提示词')));
  assert.ok(escalate.action.steps.join('\n').includes('不需要') && escalate.action.steps.join('\n').includes('Run Report'));
  assert.match(escalate.recommendedAction, /project\.zip/);
  assert.doesNotMatch(escalate.recommendedAction, /先审 Human Follow-up/);
  assert.match(escalate.handoff?.prompt ?? '', /只读/);
  // B. Historical/current safety: prompt checks CURRENT disposition first, never reopens converted items.
  assert.match(escalate.handoff?.prompt ?? '', /CURRENT|当前.*状态|disposition/);
  assert.match(escalate.handoff?.prompt ?? '', /CONVERTED/);
  assert.match(escalate.handoff?.prompt ?? '', /不要.*重新开启|不要.*重开|do NOT reopen/i);
  assert.doesNotMatch(escalate.conclusion, /现在仍待审查/);
  assert.doesNotMatch(escalate.recommendedAction, /现在仍待审查/);
  // G. First-screen density: short bounded key reasons.
  assert.ok(escalate.explanation.length >= 1 && escalate.explanation.length <= 4);

  const defer = buildHumanReviewSummary({
    workflows: [workflow({ reason: 'INSUFFICIENT_EVIDENCE', terminalRoute: 'DEFER' }, audit({ decision: { status: 'completed', artifactRef: 'decision.json', route: 'DEFER', reasonCode: 'INSUFFICIENT_EVIDENCE' } }))],
  });
  assert.match(defer.conclusion, /暂不执行修改/);
  assert.match(defer.explanation.join('\n'), /INSUFFICIENT_EVIDENCE/);
  assert.match(defer.recommendedAction, /不应执行修改/);
  assert.match(defer.recommendedAction, /只读调查/);
  // E. DEFER: concrete investigation action, no blind resampling.
  assert.ok(defer.action.steps.join('\n').includes('project.zip') || defer.action.steps.join('\n').includes('只读'));
  assert.match(defer.recommendedAction, /不要.*重复|而不是重复/);
  assert.ok(defer.explanation.length <= 4);
  assert.equal(defer.handoff?.mode, 'optional');
}

function testCrossRoundCompletion(): void {
  const result = buildHumanReviewSummary({
    sessionExecution: session({
      outcome: 'CROSS_ROUND_TRANSITION_OBSERVED',
      roundCount: 2,
      crossRoundTransitions: 1,
      stopReason: 'ROUND_2_TERMINAL_NOT_READY',
      execution: { executionRef: 'execution-000001', status: 'completed', actualChangedFiles: ['src/config.ts'], resultingRunRef: 'source-000002' },
    }),
    workflows: [workflow({ status: 'READY_FOR_CONFIG_EXECUTION', terminalRoute: 'READY_FOR_CONFIG_EXECUTION', reason: 'ACCEPTED_CONFIGURATION_SCOPE' }, audit({ decision: { status: 'completed', artifactRef: 'decision.json', route: 'READY_FOR_CONFIG_EXECUTION', reasonCode: 'ACCEPTED_CONFIGURATION_SCOPE' } }))],
  });
  assert.match(result.conclusion, /受控.*执行/);
  assert.match(result.conclusion, /后续一轮/);
  assert.equal(result.handoff, null);
}

async function testSurfacesConsumeProjection(): Promise<void> {
  const auditedWorkflow = workflow({}, audit());
  const summary = buildHumanReviewSummary({
    reportId: 'ae-report-test',
    sessionExecution: session(),
    workflows: [auditedWorkflow],
  });
  const report = renderOperationalRunReportMarkdown({
    reportId: 'ae-report-test',
    createdAt: '2026-09-04T00:00:00.000Z',
    sessionExecution: session(),
    summaries: [auditedWorkflow],
  });
  assert.ok(report.indexOf('## 一眼结论') < report.indexOf('## 会话执行'));
  // G. First-screen density: short bullets up top, full audit preserved below.
  assert.match(report, /### 决策审计 \/ 判断链/);
  // H. Shared projection: report consumes the same action semantics (no duplicate tables).
  assert.match(report, new RegExp(summary.action.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 20)));
  assert.doesNotMatch(report, /如需进一步复核/);

  const repositoryRoot = await mkdtemp(join(tmpdir(), 'human-review-index-'));
  const reportDirectory = join(repositoryRoot, 'artifacts/evolution/run-reports/ae-report-test');
  await mkdir(reportDirectory, { recursive: true });
  await writeFile(join(reportDirectory, 'report.json'), `${JSON.stringify({
    schemaVersion: 'auto-evolution-operational-run-report-v3',
    reportId: 'ae-report-test',
    createdAt: '2026-09-04T00:00:00.000Z',
    sourceRoot: '.tmp/evolution/session',
    sessionExecution: session(),
    workflowCount: 1,
    workflows: [auditedWorkflow],
  }, null, 2)}\n`);
  const indexPaths = await buildOperationalObservabilityIndex({ repositoryRoot });
  const index = await readFile(indexPaths.runReportsIndexPath, 'utf8');
  const topLevel = await readFile(indexPaths.topLevelIndexPath, 'utf8');
  assert.match(index, /没有形成足够依据支持的改善问题/);
  assert.match(index, /无需处理，也不要为了得到 READY 而自动重跑/);
  assert.match(topLevel, /一句话人类结论：本次没有形成足够依据支持的改善问题/);
  assert.match(topLevel, /建议动作：无需处理/);

  const reportJsonBefore = await readFile(join(reportDirectory, 'report.json'), 'utf8');
  await writeFile(join(reportDirectory, 'report.md'), '# stale markdown\n');
  const refreshed = await refreshArchivedOperationalRunReports({ repositoryRoot });
  assert.equal(refreshed.refreshedCount, 1);
  assert.equal(await readFile(join(reportDirectory, 'report.json'), 'utf8'), reportJsonBefore);
  assert.match(await readFile(join(reportDirectory, 'report.md'), 'utf8'), /## 一眼结论/);
}

function testEscalateSurfaceAndMachineInvariance(): void {
  const escalateAudit = audit({ decision: { status: 'completed', artifactRef: 'decision.json', route: 'ESCALATE_HUMAN', reasonCode: 'EXPLICIT_ESCALATION' } });
  const escalateWorkflow = workflow({ reason: 'EXPLICIT_ESCALATION', terminalRoute: 'ESCALATE_HUMAN', problemStatement: '测试问题陈述' }, escalateAudit);
  const before = JSON.stringify(escalateWorkflow);
  const summary = buildHumanReviewSummary({
    reportId: 'ae-report-escalate-surface',
    sessionExecution: session({ multiRoundRunRef: 'ordinary-run-20260904-000005' }),
    workflows: [escalateWorkflow],
  });
  // I. machine invariance: projection does not mutate input.
  assert.equal(JSON.stringify(escalateWorkflow), before);
  const report = renderOperationalRunReportMarkdown({
    reportId: 'ae-report-escalate-surface',
    createdAt: '2026-09-04T00:00:00.000Z',
    sessionExecution: session({ multiRoundRunRef: 'ordinary-run-20260904-000005' }),
    summaries: [escalateWorkflow],
  });
  // Required handoff uses primary heading, never "如需进一步复核".
  assert.match(report, /## 下一步：交给 ChatGPT 做只读/);
  assert.doesNotMatch(report, /如需进一步复核/);
  assert.match(report, /上传当前 `project\.zip` 给 ChatGPT/);
  assert.match(report, /复制下面的提示词/);
  assert.match(report, /不需要另外复制整份 Run Report/);
  // HFL appears only as audit evidence after the handoff, not as the primary instruction.
  const handoffPos = report.indexOf('下一步：交给 ChatGPT');
  const hflPos = report.indexOf('human-follow-up/index.md');
  assert.ok(handoffPos >= 0 && hflPos > handoffPos);
  // Prompt carries historical/current safety semantics with repo-relative identifiers.
  assert.match(report, /CURRENT disposition/);
  assert.match(report, /CONVERTED/);
  assert.match(report, /artifacts\/evolution\/run-reports\/ae-report-escalate-surface\/report\.json/);
  assert.match(report, /artifacts\/evolution\/human-follow-up\//);
  assert.doesNotMatch(report, /\/Users\//);
}

testSkipProjection();
testFailureAndSessionOverrides();
testLegacyAndReasonDistinctions();
testCrossRoundCompletion();
testEscalateSurfaceAndMachineInvariance();
await testSurfacesConsumeProjection();

console.log('humanReviewSummary.test.ts: ok');
