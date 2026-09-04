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
  assert.ok(result.explanation.some(line => line.includes('External Feedback') && line.includes('1')));
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
  assert.match(failure.explanation.join('\n'), /IMPROVEMENT_HYPOTHESIS/);
  assert.match(failure.explanation.join('\n'), /timeout/);
  assert.doesNotMatch(failure.conclusion, /没有形成足够依据/);

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
  assert.match(escalate.recommendedAction, /artifacts\/evolution\/human-follow-up\/index\.md/);
  assert.match(escalate.handoff?.prompt ?? '', /Human Follow-up/);
  assert.match(escalate.handoff?.prompt ?? '', /只读/);

  const defer = buildHumanReviewSummary({
    workflows: [workflow({ reason: 'INSUFFICIENT_EVIDENCE', terminalRoute: 'DEFER' }, audit({ decision: { status: 'completed', artifactRef: 'decision.json', route: 'DEFER', reasonCode: 'INSUFFICIENT_EVIDENCE' } }))],
  });
  assert.match(defer.conclusion, /暂不执行修改/);
  assert.match(defer.explanation.join('\n'), /INSUFFICIENT_EVIDENCE/);
  assert.match(defer.recommendedAction, /不应执行修改/);
  assert.match(defer.recommendedAction, /只读调查/);
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
  const report = renderOperationalRunReportMarkdown({
    reportId: 'ae-report-test',
    createdAt: '2026-09-04T00:00:00.000Z',
    sessionExecution: session(),
    summaries: [auditedWorkflow],
  });
  assert.ok(report.indexOf('## 一眼结论') < report.indexOf('## 会话执行'));
  assert.match(report, /现有反馈只支持一次性体验描述/);
  assert.match(report, /没有观察到足以支持产品问题的重复模式/);
  assert.match(report, /### 决策审计 \/ 判断链/);

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

testSkipProjection();
testFailureAndSessionOverrides();
testLegacyAndReasonDistinctions();
testCrossRoundCompletion();
await testSurfacesConsumeProjection();

console.log('humanReviewSummary.test.ts: ok');
