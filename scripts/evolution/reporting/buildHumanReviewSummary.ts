import type { MultiRoundSessionSummaryV1 } from '../multiRoundRunManifestContract';
import type { WorkflowSummary } from './buildOperationalRunReport';
import type { WorkflowDecisionAuditV1 } from './buildWorkflowDecisionAudit';

export type HumanReviewAttention =
  | 'none'
  | 'legacy'
  | 'participant_failure'
  | 'human_review'
  | 'evidence_gap'
  | 'execution_boundary';

export interface HumanReviewHandoff {
  target: 'ChatGPT';
  label: string;
  prompt: string;
}

export interface HumanReviewSummary {
  conclusion: string;
  explanation: string[];
  recommendedAction: string;
  attention: HumanReviewAttention;
  handoff: HumanReviewHandoff | null;
}

export interface BuildHumanReviewSummaryInput {
  sessionExecution?: MultiRoundSessionSummaryV1;
  workflows: Array<WorkflowSummary & { decisionAudit?: WorkflowDecisionAuditV1 }>;
  reportId?: string;
}

function auditOf(workflow: BuildHumanReviewSummaryInput['workflows'][number]): WorkflowDecisionAuditV1 | null {
  return workflow.decisionAudit ?? null;
}

function boundedReportId(reportId: string | undefined): string {
  return reportId !== undefined && /^[A-Za-z0-9._-]+$/.test(reportId) ? reportId : '<report-id>';
}

function reportPath(reportId: string | undefined): string {
  return `artifacts/evolution/run-reports/${boundedReportId(reportId)}/report.json`;
}

function sessionIdentity(sessionExecution: MultiRoundSessionSummaryV1 | undefined): string {
  return sessionExecution?.multiRoundRunRef ?? '（当前报告未提供会话 ID）';
}

function handoffPrompt(input: {
  reportId?: string;
  sessionExecution?: MultiRoundSessionSummaryV1;
  title: string;
  body: string[];
  finalOutput: string;
}): string {
  return [
    input.title,
    '',
    '身份：',
    `- Session：${sessionIdentity(input.sessionExecution)}`,
    `- Run Report：${reportPath(input.reportId)}`,
    '',
    '材料：',
    '- 当前 project.zip',
    `- 本次 Run Report：${reportPath(input.reportId)}`,
    ...input.body,
    '',
    '边界：只读审查；不要修改仓库，不生成实施任务，不调用 Auto Evolution，不自动创建 Human Follow-up。',
    '',
    '最终输出：',
    input.finalOutput,
  ].join('\n');
}

function skipAuditHandoff(input: BuildHumanReviewSummaryInput): HumanReviewHandoff {
  return {
    target: 'ChatGPT',
    label: '交给 ChatGPT 做只读决策审计',
    prompt: handoffPrompt({
      reportId: input.reportId,
      sessionExecution: input.sessionExecution,
      title: '请对本次 Auto Evolution 的 SKIP 做只读决策审计。',
      body: [
        '重点检查：',
        '1. External Feedback 实际观察到了什么；',
        '2. Improvement Hypothesis 为什么形成 0 条 hypothesis；',
        '3. noProblemAssessment 引用的 Feedback / player evidence 是否支持它；',
        '4. 是否存在被忽略、值得进一步调查的问题；',
        '5. 区分 repository/report 可证事实、Participant 判断、你的推断。',
      ],
      finalOutput: 'SKIP_JUDGMENT = SUPPORTED | QUESTIONABLE | INSUFFICIENT_EVIDENCE，并说明依据。',
    }),
  };
}

function humanFollowupHandoff(input: BuildHumanReviewSummaryInput): HumanReviewHandoff {
  return {
    target: 'ChatGPT',
    label: '交给 ChatGPT 做只读 Human Follow-up 审查',
    prompt: handoffPrompt({
      reportId: input.reportId,
      sessionExecution: input.sessionExecution,
      title: '请对本次 Auto Evolution 的 Human Follow-up 做只读审查。',
      body: [
        '请读取当前 project.zip 中的：',
        '- 本次 Run Report；',
        '- 对应 HFL retained evidence（如能从 `artifacts/evolution/human-follow-up/index.md` 唯一定位）。',
        '',
        '依次检查：player-visible evidence、hypothesis、bounded causal attribution（如有）、Solution、Reviewer、Human-review boundary。',
        '判断：问题是否成立、当前 evidence 是否足够、proposed scope 是否过大、下一步应该调查、延后、拒绝，还是进入正式任务。',
        '如果无法唯一定位具体 HFL item，请明确说明，不能猜测。',
      ],
      finalOutput: '请区分 repository/report 可证事实、Participant 判断、你的推断，并给出有界依据。',
    }),
  };
}

function participantFailureHandoff(input: BuildHumanReviewSummaryInput): HumanReviewHandoff {
  return {
    target: 'ChatGPT',
    label: '交给 ChatGPT 审查 Participant / contract failure',
    prompt: handoffPrompt({
      reportId: input.reportId,
      sessionExecution: input.sessionExecution,
      title: '请对本次 Auto Evolution 的 Participant / contract failure 做只读审查。',
      body: [
        '重点检查失败阶段、Participant error kind、已有 failure artifacts、输出契约与权限边界。',
        '不要把本次运行当作游戏产品质量结论，也不要猜测失败 Participant 的隐藏意图。',
      ],
      finalOutput: '说明失败是否可由现有 artifact 支持，以及最小的稳定性调查方向。',
    }),
  };
}

function evidenceGapHandoff(input: BuildHumanReviewSummaryInput): HumanReviewHandoff {
  return {
    target: 'ChatGPT',
    label: '交给 ChatGPT 审查证据缺口',
    prompt: handoffPrompt({
      reportId: input.reportId,
      sessionExecution: input.sessionExecution,
      title: '请对本次 Auto Evolution 的证据缺口做只读调查。',
      body: [
        '重点检查当前 bounded evidence 缺少什么、哪些已有引用可以支持下一步最小调查，以及哪些结论仍不能下。',
        '不要以重复 Auto Evolution sampling 作为默认补证据方式。',
      ],
      finalOutput: '区分已证实事实、Participant 判断与推断，并提出最小只读调查范围。',
    }),
  };
}

function executionBoundaryHandoff(input: BuildHumanReviewSummaryInput): HumanReviewHandoff {
  return {
    target: 'ChatGPT',
    label: '交给 ChatGPT 审查执行集成边界',
    prompt: handoffPrompt({
      reportId: input.reportId,
      sessionExecution: input.sessionExecution,
      title: '请对本次 Auto Evolution 的 execution integration boundary 做只读审查。',
      body: [
        '重点检查 session execution status、allowed scope、actual changed files、scope verification、verification 与 resulting run evidence。',
        '请把执行边界问题与产品决策分开审查；不要把上一轮 READY 解释成已执行，也不要修改仓库或自动重跑。',
      ],
      finalOutput: '说明执行停止/失败是否由当前 artifact 支持，以及最小的只读调查方向。',
    }),
  };
}

function completedJudgmentStages(audit: WorkflowDecisionAuditV1): string {
  const stages = [
    ['External Feedback', audit.externalFeedback.status],
    ['Improvement Hypothesis', audit.improvementHypothesis.status],
    ['Selection', audit.selection.status],
    ['Solution', audit.solution.status],
    ['Reviewer', audit.reviewer.status],
    ['Decision', audit.decision.status],
  ]
    .filter(([, status]) => status === 'completed' || status === 'selected')
    .map(([stage]) => stage);
  return stages.length === 0
    ? '当前 Decision Audit 没有记录已完成的判断环节。'
    : `Decision Audit 记录实际完成的判断环节：${stages.join('、')}。具体 Participant 身份未由该 bounded audit 保留。`;
}

function decisionValues(workflow: WorkflowSummary, audit: WorkflowDecisionAuditV1): {
  route: string | null;
  reasonCode: string | null;
} {
  return {
    route: audit.decision.route ?? workflow.terminalRoute,
    reasonCode: audit.decision.reasonCode ?? workflow.reason,
  };
}

function skipNoProblemExplanation(audit: WorkflowDecisionAuditV1): string[] {
  const assessment = audit.improvementHypothesis.noProblemAssessment;
  const lines = [
    `实际完成判断的环节：External Feedback ${audit.externalFeedback.status === 'completed' ? '已完成' : audit.externalFeedback.status}，记录 ${audit.externalFeedback.observations.length} 条观察；Improvement Hypothesis ${audit.improvementHypothesis.status === 'completed' ? '已完成' : audit.improvementHypothesis.status}，形成改善假设：${audit.improvementHypothesis.hypothesisCount ?? '（未记录）'} 条。`,
  ];
  if (audit.externalFeedback.overallImpression !== null) {
    lines.push(`External Feedback 总体感受：${audit.externalFeedback.overallImpression}`);
  }
  audit.externalFeedback.observations.forEach((observation, index) => {
    lines.push(`观察 ${index + 1}：${observation.feedback}；玩家证据：${observation.evidenceRefs.join(', ') || '（无）'}`);
  });
  if (assessment.status === 'recorded') {
    lines.push(`未形成问题的判断：${assessment.rationale}`);
    lines.push(`引用 Feedback：${assessment.feedbackRefs.join(', ')}`);
    lines.push(`玩家证据：${assessment.evidenceRefs.join(', ') || '（无）'}`);
  } else if (assessment.status === 'unavailable') {
    lines.push('未形成问题的判断：历史 hypothesis contract 没有保留 noProblemAssessment，因此不能重建该判断依据。');
  } else {
    lines.push(`未形成问题的判断：${assessment.status === 'missing' ? '当前 audit 没有保留该依据。' : '不适用。'}`);
  }
  lines.push('Selection：未选择 hypothesis。', 'Solution：未运行，原因是没有选中的 hypothesis。', 'Reviewer：未运行。');
  return lines;
}

function boundedDecisionChainExplanation(audit: WorkflowDecisionAuditV1): string[] {
  const lines = [completedJudgmentStages(audit)];
  for (const hypothesis of audit.improvementHypothesis.hypotheses) {
    lines.push(`Hypothesis：${hypothesis.hypothesis}；observedBasis：${hypothesis.observedBasis}；productSignificance：${hypothesis.productSignificance}；unknowns：${hypothesis.unknowns.join('、')}`);
  }
  if (audit.solution.summary !== null) lines.push(`Solution：${audit.solution.summary}`);
  if (audit.reviewer.assessment !== null) lines.push(`Reviewer assessment：${audit.reviewer.assessment}`);
  if (audit.reviewer.scopeAssessment !== null) lines.push(`Reviewer scope assessment：${audit.reviewer.scopeAssessment}`);
  if (audit.reviewer.concerns.length > 0) lines.push(`Reviewer concerns：${audit.reviewer.concerns.join('；')}`);
  return lines;
}

function legacySummary(input: BuildHumanReviewSummaryInput): HumanReviewSummary {
  return {
    conclusion: '这是历史报告。当前归档能够确认最终工作流状态，但没有保留 Decision Audit，因此无法从这份报告可靠解释为什么形成该结论。',
    explanation: [
      'Decision Audit unavailable：只能确认已归档的 terminal fact，不能重建历史 Participant 判断依据。',
      '特别是历史 SKIP，不能据此推断系统认为“没有问题”。',
    ],
    recommendedAction: '不要根据缺失的历史判断依据修改产品；如需复核，请提供当前 project.zip 和这份 Run Report 做只读审查。',
    attention: 'legacy',
    handoff: input.workflows.some(workflow => workflow.terminalRoute === 'SKIP') ? evidenceGapHandoff(input) : null,
  };
}

export function buildHumanReviewSummary(input: BuildHumanReviewSummaryInput): HumanReviewSummary {
  const latestWorkflow = input.workflows.at(-1) ?? null;
  const failureWorkflow = input.workflows.find(workflow => (
    workflow.status === 'PARTICIPANT_FAILURE'
    || workflow.reason === 'PARTICIPANT_FAILURE'
    || workflow.decisionAudit?.decision.reasonCode === 'PARTICIPANT_FAILURE'
  ));
  const hasAudit = input.workflows.some(workflow => workflow.decisionAudit !== undefined);
  const session = input.sessionExecution;
  if (latestWorkflow === null) return legacySummary(input);
  if (session?.execution.status === 'scope_violation') {
    const audit = latestWorkflow.decisionAudit;
    return {
      conclusion: '本次执行已尝试，但被范围校验停止；没有产生可接受的产品变更。',
      explanation: [
        `会话执行被范围校验停止，Host 停止原因是 ${session.stopReason}。`,
        '因此不能把上一轮“可进入配置执行”直接理解为已经准备好执行。',
        ...(audit === undefined
          ? ['Decision Audit unavailable：执行事实可确认，但上一轮决策依据不能从该报告重建。']
          : boundedDecisionChainExplanation(audit)),
      ],
      recommendedAction: '不要继续通过重复 sampling 绕过范围判断；先只读审查执行集成边界与 scope verification。',
      attention: 'execution_boundary',
      handoff: executionBoundaryHandoff(input),
    };
  }
  if (session?.execution.status === 'failed') {
    const audit = latestWorkflow.decisionAudit;
    return {
      conclusion: '本次受控执行失败，不能把上一轮的产品决策当作已完成执行。',
      explanation: [
        `会话执行失败，Host 停止原因是 ${session.stopReason}。`,
        ...(audit === undefined
          ? ['Decision Audit unavailable：执行事实可确认，但上一轮决策依据不能从该报告重建。']
          : boundedDecisionChainExplanation(audit)),
      ],
      recommendedAction: '当前不要继续执行修改；先只读调查执行集成边界与失败证据。',
      attention: 'execution_boundary',
      handoff: executionBoundaryHandoff(input),
    };
  }
  if (!hasAudit || latestWorkflow.decisionAudit === undefined) return legacySummary(input);
  if (failureWorkflow !== undefined) {
    const audit = failureWorkflow.decisionAudit ?? latestWorkflow.decisionAudit;
    return {
      conclusion: '本次运行没有形成可靠的产品结论。',
      explanation: [
        `失败阶段：${failureWorkflow.failedStage ?? '（未记录）'}。`,
        `Participant 错误类型：${failureWorkflow.participantErrorKind ?? '（未记录）'}。`,
        '此前已完成的阶段仍可作为证据展示，但不能把这次失败解释为 SKIP 或“没有问题”。',
        ...boundedDecisionChainExplanation(audit),
      ],
      recommendedAction: '不要根据本次运行修改产品，也不要自动重跑以获得偏好的结果；若同类失败重复出现，再调查 Participant / contract 稳定性。',
      attention: 'participant_failure',
      handoff: participantFailureHandoff(input),
    };
  }

  if (session?.execution.status === 'completed' && session.crossRoundTransitions === 1) {
    return {
      conclusion: '本次已完成受控配置执行，并已发生后续一轮运行。',
      explanation: [
        `会话执行已完成，实际变更：${session.execution.actualChangedFiles.join(', ') || '（无）'}。`,
        '已观察到跨轮 transition；这说明受控执行与后续一轮均已发生，不等同于自动正确性判断。',
        ...boundedDecisionChainExplanation(latestWorkflow.decisionAudit),
      ],
      recommendedAction: '按会话执行与后续一轮的实际 evidence 做人工复核；无需为了制造更多轮次而重跑。',
      attention: 'none',
      handoff: null,
    };
  }

  const audit = latestWorkflow.decisionAudit;
  if (audit.decision.status !== 'completed' || audit.decision.route === null || audit.decision.reasonCode === null) {
    return legacySummary(input);
  }
  const { route, reasonCode } = decisionValues(latestWorkflow, audit);
  if (route === 'SKIP' && reasonCode === 'NO_PROBLEM_FORMED') {
    return {
      conclusion: '本次没有形成足够依据支持的改善问题。',
      explanation: skipNoProblemExplanation(audit),
      recommendedAction: '无需处理，也不要为了得到 READY 而自动重跑。',
      attention: 'none',
      handoff: skipAuditHandoff(input),
    };
  }
  if (route === 'SKIP' && reasonCode === 'REVIEW_ACCEPT_NO_ACTION') {
    return {
      conclusion: '本次进入了问题/改善假设审查，但 Reviewer 最终接受不采取行动。',
      explanation: [
        ...boundedDecisionChainExplanation(audit),
        '这不同于“没有形成问题”：报告只说明 Reviewer 的 bounded decision，不判断该 Participant 是否正确。',
      ],
      recommendedAction: '当前无需执行修改；如不同意 Reviewer 的不行动结论，再做只读复核。',
      attention: 'none',
      handoff: evidenceGapHandoff(input),
    };
  }
  if (route === 'ESCALATE_HUMAN' || reasonCode === 'EXPLICIT_ESCALATION' || reasonCode === 'ACCEPTED_OUT_OF_SCOPE') {
    return {
      conclusion: '本次发现了需要 Human 判断的事项；AE 没有获得继续自动执行的授权。',
      explanation: [
        ...(latestWorkflow.problemStatement === null ? [] : [`问题：${latestWorkflow.problemStatement}`]),
        ...boundedDecisionChainExplanation(audit),
        `最终 reasonCode：${reasonCode ?? '（未记录）'}。`,
      ],
      recommendedAction: '停止继续通过重复 sampling 绕过该判断；先审 Human Follow-up：artifacts/evolution/human-follow-up/index.md。',
      attention: 'human_review',
      handoff: humanFollowupHandoff(input),
    };
  }
  if (
    route === 'DEFER'
    || route === 'DEFER_MORE_WORK_REQUESTED'
    || reasonCode === 'INSUFFICIENT_EVIDENCE'
    || reasonCode === 'NO_PROPOSAL'
    || reasonCode === 'REVIEW_REQUEST_MORE_WORK'
    || reasonCode === 'REVIEW_DEFERRED'
    || reasonCode === 'REVIEW_REJECTED'
  ) {
    return {
      conclusion: reasonCode === 'REVIEW_REJECTED'
        ? '本次提出的方案被 Reviewer 拒绝，未形成可执行修改。'
        : reasonCode === 'NO_PROPOSAL'
        ? '本次没有形成可执行方案。'
        : '本次暂不执行修改，当前证据或工作仍不足以继续。',
      explanation: [
        ...boundedDecisionChainExplanation(audit),
        `实际 bounded reason：${reasonCode ?? route ?? '（未记录）'}。`,
      ],
      recommendedAction: '当前不具备执行条件，不应执行修改；先补足有界证据或做只读调查，不要把重复 AE run 作为默认补证据方式。',
      attention: 'evidence_gap',
      handoff: evidenceGapHandoff(input),
    };
  }
  if (route === 'READY_FOR_CONFIG_EXECUTION') {
    return {
      conclusion: '本次形成了通过 Reviewer 的配置范围候选，但执行仍需单独授权。',
      explanation: boundedDecisionChainExplanation(audit),
      recommendedAction: '先确认是否授予单独的配置执行授权；不要把 READY 当作已执行或正确性结论。',
      attention: 'none',
      handoff: null,
    };
  }
  return {
    conclusion: '本次报告记录了工作流事实，但没有足够的 bounded Decision Audit 支持可靠的人类解释。',
    explanation: [completedJudgmentStages(audit)],
    recommendedAction: '当前不要执行修改；先只读检查报告中已保留的证据。',
    attention: 'legacy',
    handoff: evidenceGapHandoff(input),
  };
}
