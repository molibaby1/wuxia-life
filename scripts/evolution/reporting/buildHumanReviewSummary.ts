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
  mode: 'required' | 'optional';
  label: string;
  prompt: string;
}

export interface HumanReviewAction {
  title: string;
  steps: string[];
}

export interface HumanReviewSummary {
  conclusion: string;
  explanation: string[];
  recommendedAction: string;
  action: HumanReviewAction;
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
    mode: 'optional',
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
  const sessionRef = sessionIdentity(input.sessionExecution);
  const reportRef = reportPath(input.reportId);
  const prompt = [
    '请对 Auto Evolution 会话',
    `\`${sessionRef}\``,
    '执行只读 Human Review。',
    '',
    '我已上传当前 `project.zip`。',
    '',
    '请首先读取：',
    '',
    '- 本次 Run Report：',
    `  \`${reportRef}\``,
    '- Human Follow-up 当前状态：',
    '  `artifacts/evolution/human-follow-up/`',
    '',
    '第一步先确认该 finding 的 CURRENT disposition。',
    '',
    '如果已经：',
    '- CONVERTED',
    '- REJECTED',
    '- DEFERRED',
    '- 或其他已完成 disposition',
    '',
    '请不要重新开启审查。',
    '只说明当前状态、最终处理结果以及可追溯证据。',
    '',
    '如果仍是 ACTIVE：',
    '',
    '请审查：',
    '- player-visible evidence',
    '- Improvement Hypothesis',
    '- bounded causal attribution（若存在）',
    '- Solution',
    '- Reviewer',
    '- scope / concerns',
    '',
    '然后判断下一步应该：',
    '- READY_FOR_FORMAL_TASK',
    '- INVESTIGATE / MORE WORK',
    '- DEFER',
    '- REJECT',
    '或当前 authority 允许的等价 disposition。',
    '',
    '严格区分：',
    '1. repository / report 可证事实；',
    '2. Participant / Reviewer 判断；',
    '3. 你的推断。',
    '',
    '区分历史运行证据与当前 operational state：历史 Run Report 是不可变的执行历史，当前 HFL disposition 才是规范状态。',
    '',
    '不要修改仓库。',
    '不要直接实施代码或配置变更。',
  ].join('\n');
  return {
    target: 'ChatGPT',
    mode: 'required',
    label: '交给 ChatGPT 做只读 Human Review',
    prompt,
  };
}

function participantFailureHandoff(input: BuildHumanReviewSummaryInput): HumanReviewHandoff {
  return {
    target: 'ChatGPT',
    mode: 'optional',
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
    mode: 'optional',
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
    mode: 'optional',
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

function truncateMiddle(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}……`;
}

function skipNoProblemExplanation(audit: WorkflowDecisionAuditV1): string[] {
  // First-screen only: 2–4 short bullets. Full observations/assessment remain in the Decision Chain below.
  const assessment = audit.improvementHypothesis.noProblemAssessment;
  const headline = `External Feedback 已完成，记录 ${audit.externalFeedback.observations.length} 条观察；Improvement Hypothesis 已完成，形成改善假设：${audit.improvementHypothesis.hypothesisCount ?? '（未记录）'} 条。`;
  if (assessment.status === 'recorded') {
    return [
      headline,
      `未形成问题的判断：${truncateMiddle(assessment.rationale, 120)}`,
      'Selection 未选择 hypothesis；Solution / Reviewer 未运行。',
    ];
  }
  if (assessment.status === 'unavailable') {
    return [
      headline,
      '未形成问题的判断：历史 hypothesis contract 没有保留 noProblemAssessment，不能重建该判断依据。',
      'Selection 未选择 hypothesis；Solution / Reviewer 未运行。',
    ];
  }
  return [
    headline,
    '未形成问题的判断：当前 audit 没有保留该依据。',
    'Selection 未选择 hypothesis；Solution / Reviewer 未运行。',
  ];
}

function shortCompletedStages(audit: WorkflowDecisionAuditV1): string {
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
    ? 'Decision Audit 没有记录已完成的判断环节。'
    : `Decision Audit 已完成环节：${stages.join('、')}。`;
}

function legacySummary(input: BuildHumanReviewSummaryInput): HumanReviewSummary {
  return {
    conclusion: '这是历史报告。当前归档能够确认最终工作流状态，但没有保留 Decision Audit，因此无法从这份报告可靠解释为什么形成该结论。',
    explanation: [
      'Decision Audit unavailable：只能确认已归档的 terminal fact，不能重建历史 Participant 判断依据。',
      '特别是历史 SKIP，不能据此推断系统认为“没有问题”。',
    ],
    recommendedAction: '不要根据缺失的历史判断依据修改产品；如需复核，请提供当前 project.zip 和这份 Run Report 做只读审查。',
    action: {
      title: '如果你想复核这个判断',
      steps: [
        '不要根据缺失的历史判断依据修改产品。',
        '如需复核，上传当前 `project.zip`，并使用下面的提示词做只读审查。',
      ],
    },
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
        `产品工作流已经到达执行阶段，但 Host execution 被 scope verification 阻断，Host 停止原因是 ${session.stopReason}。`,
        '不要把它解释为产品方案被否决；也不能把上一轮“可进入配置执行”直接理解为已经准备好执行。',
        audit === undefined
          ? 'Decision Audit unavailable：执行事实可确认，但上一轮决策依据不能从该报告重建。'
          : shortCompletedStages(audit),
      ],
      recommendedAction: '不要继续通过重复 sampling 绕过范围判断；先只读审查执行集成边界与 scope verification。',
      action: {
        title: '下一步：只读调查执行集成边界',
        steps: [
          '产品工作流已经到达执行阶段，但 Host execution 被 scope verification 阻断；不要把它解释为产品方案被否决。',
          '上传当前 `project.zip` 给 ChatGPT，复制下面的提示词做只读集成诊断。',
          '不要通过重复 sampling 绕过范围判断。',
        ],
      },
      attention: 'execution_boundary',
      handoff: executionBoundaryHandoff(input),
    };
  }
  if (session?.execution.status === 'failed') {
    const audit = latestWorkflow.decisionAudit;
    return {
      conclusion: '本次受控执行失败，不能把上一轮的产品决策当作已完成执行。',
      explanation: [
        `产品工作流已经到达执行阶段，但 Host execution 失败，Host 停止原因是 ${session.stopReason}。`,
        '不要把它解释为产品方案被否决；执行集成失败与产品决策是两回事。',
        audit === undefined
          ? 'Decision Audit unavailable：执行事实可确认，但上一轮决策依据不能从该报告重建。'
          : shortCompletedStages(audit),
      ],
      recommendedAction: '当前不要继续执行修改；先只读调查执行集成边界与失败证据。',
      action: {
        title: '下一步：只读调查执行集成边界',
        steps: [
          '当前不要继续执行修改。',
          '上传当前 `project.zip` 给 ChatGPT，复制下面的提示词，围绕执行失败证据做只读集成诊断。',
          '不要为了绕过失败而重复执行。',
        ],
      },
      attention: 'execution_boundary',
      handoff: executionBoundaryHandoff(input),
    };
  }
  if (!hasAudit || latestWorkflow.decisionAudit === undefined) return legacySummary(input);
  if (failureWorkflow !== undefined) {
    return {
      conclusion: '本次运行没有形成可靠的产品结论。',
      explanation: [
        `失败阶段：${failureWorkflow.failedStage ?? '（未记录）'}；Participant 错误类型：${failureWorkflow.participantErrorKind ?? '（未记录）'}。`,
        '不能把这次失败解释为 SKIP 或“没有问题”。',
        '此前已完成的阶段仍可作为证据展示，完整判断链见下方的 Decision Chain。',
      ],
      recommendedAction: '不要根据本次运行修改产品，也不要自动重跑以获得偏好的结果；若同类失败重复出现，再调查 Participant / contract 稳定性。',
      action: {
        title: '当前不要修改产品',
        steps: [
          '不要根据本次运行修改产品，也不要把它解释为“没有问题”。',
          '不要自动重跑以获得偏好的结果。',
          '若同类失败重复出现，再上传当前 `project.zip` 并使用下面的提示词做只读调查。',
        ],
      },
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
      ],
      recommendedAction: '按会话执行与后续一轮的实际 evidence 做人工复核；无需为了制造更多轮次而重跑。',
      action: {
        title: '按实际 evidence 做人工复核',
        steps: [
          '按会话执行与后续一轮的实际 evidence 做人工复核。',
          '无需为了制造更多轮次而重跑。',
        ],
      },
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
      action: {
        title: '如果你想复核这个判断',
        steps: [
          '默认无需处理；不要为了得到 READY 而自动重跑。',
          '如果你不同意这个 SKIP，可以上传当前 `project.zip` 并复制下面的提示词，做只读决策审计。',
        ],
      },
      attention: 'none',
      handoff: skipAuditHandoff(input),
    };
  }
  if (route === 'SKIP' && reasonCode === 'REVIEW_ACCEPT_NO_ACTION') {
    return {
      conclusion: '本次进入了问题/改善假设审查，但 Reviewer 最终接受不采取行动。',
      explanation: [
        shortCompletedStages(audit),
        '这不同于“没有形成问题”：报告只说明 Reviewer 的 bounded decision，不判断该 Participant 是否正确。',
      ],
      recommendedAction: '当前无需执行修改；如不同意 Reviewer 的不行动结论，再做只读复核。',
      action: {
        title: '如果你想复核这个判断',
        steps: [
          '当前无需执行修改。',
          '如不同意 Reviewer 的不行动结论，上传当前 `project.zip` 并复制下面的提示词做只读复核。',
        ],
      },
      attention: 'none',
      handoff: evidenceGapHandoff(input),
    };
  }
  if (route === 'ESCALATE_HUMAN' || reasonCode === 'EXPLICIT_ESCALATION' || reasonCode === 'ACCEPTED_OUT_OF_SCOPE') {
    return {
      conclusion: '本次发现了需要 Human 判断的事项；AE 没有获得继续自动执行的授权。',
      explanation: [
        '这次运行在当时需要 Human review（run-time fact）；当前是否仍待审查，以 Human Follow-up 当前状态为准，历史报告本身不代表当前仍待审查。',
        ...(latestWorkflow.problemStatement === null ? [] : [`问题：${truncateMiddle(latestWorkflow.problemStatement, 120)}`]),
        `最终 route / reasonCode：${route ?? '（未记录）'} / ${reasonCode ?? '（未记录）'}；AE 没有继续自动执行的授权。`,
      ],
      recommendedAction: '上传 project.zip → 使用报告内 ChatGPT 审查提示词',
      action: {
        title: '下一步：交给 ChatGPT 做只读 Human Review',
        steps: [
          '上传当前 `project.zip` 给 ChatGPT。',
          '复制下面的提示词并发送。',
          '不需要另外复制整份 Run Report；报告和 retained evidence 已包含在项目包中。',
          '根据只读审查结果，再决定是否进入正式任务或采取其他 Human disposition。',
        ],
      },
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
        `实际 bounded reason：${reasonCode ?? route ?? '（未记录）'}。`,
        shortCompletedStages(audit),
      ],
      recommendedAction: '当前不具备执行条件，不应执行修改；先补足有界证据或做只读调查，不要把重复 AE run 作为默认补证据方式。',
      action: {
        title: '下一步：补证据或做只读调查',
        steps: [
          '当前不要实施修改。',
          '上传当前 `project.zip` 给 ChatGPT，复制下面的提示词，围绕所述证据缺口做只读调查。',
          '不要把重复 AE run 作为默认补证据方式。',
        ],
      },
      attention: 'evidence_gap',
      handoff: evidenceGapHandoff(input),
    };
  }
  if (route === 'READY_FOR_CONFIG_EXECUTION') {
    return {
      conclusion: '本次形成了通过 Reviewer 的配置范围候选，但执行仍需单独授权。',
      explanation: [shortCompletedStages(audit)],
      recommendedAction: '先确认是否授予单独的配置执行授权；不要把 READY 当作已执行或正确性结论。',
      action: {
        title: '下一步：确认单独执行授权',
        steps: [
          '先确认是否授予单独的配置执行授权。',
          '不要把 READY 当作已执行或正确性结论。',
        ],
      },
      attention: 'none',
      handoff: null,
    };
  }
  return {
    conclusion: '本次报告记录了工作流事实，但没有足够的 bounded Decision Audit 支持可靠的人类解释。',
    explanation: [completedJudgmentStages(audit)],
    recommendedAction: '当前不要执行修改；先只读检查报告中已保留的证据。',
    action: {
      title: '当前不要执行修改',
      steps: [
        '当前不要执行修改。',
        '先只读检查报告中已保留的证据；如需复核，上传当前 `project.zip` 并使用下面的提示词。',
      ],
    },
    attention: 'legacy',
    handoff: evidenceGapHandoff(input),
  };
}
