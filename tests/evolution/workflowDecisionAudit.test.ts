import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildWorkflowDecisionAudit } from '../../scripts/evolution/reporting/buildWorkflowDecisionAudit';
import { archiveOperationalRunReport } from '../../scripts/evolution/reporting/archiveOperationalRunReport';
import { OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V3, parseOperationalRunReport } from '../../scripts/evolution/reporting/buildOperationalObservabilityIndex';

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const observablePayload = {
  transcriptVersion: 'player-observable-v1',
  surfaceId: 'headless-api-player-v1',
  transcriptId: 'audit-transcript-000001',
  entries: [
    { entryId: 'entry-000001', kind: 'story_event', title: '第一段', body: '可见经历一。' },
    { entryId: 'entry-000002', kind: 'story_event', title: '第二段', body: '可见经历二。' },
  ],
};

const feedback = {
  overallImpression: '整体体验没有形成稳定的问题信号。',
  observations: [
    { feedback: '第一段与第二段的差异仍然明显。', evidenceRefs: ['entry-000001'] },
    { feedback: '没有观察到足以支持产品问题的重复模式。', evidenceRefs: ['entry-000002'] },
  ],
};

const skipHypothesis = {
  schemaVersion: 'improvement-hypothesis-set-v2',
  hypotheses: [],
  noProblemAssessment: {
    rationale: '现有反馈只支持一次性体验描述，证据不足以形成值得进一步调查的产品问题假设。',
    feedbackRefs: ['overallImpression', 'observations[0]'],
    evidenceRefs: ['entry-000001'],
  },
};

async function createSkipWorkflow(repositoryRoot?: string): Promise<string> {
  const root = repositoryRoot === undefined
    ? await mkdtemp(join(tmpdir(), 'workflow-decision-audit-skip-'))
    : join(repositoryRoot, '.tmp/evolution/decision-audit-session');
  await mkdir(root, { recursive: true });
  await writeJson(join(root, 'problem-package.json'), { source: { runRef: 'audit-run-000001' } });
  await writeJson(join(root, 'source/observable-payload.json'), observablePayload);
  await writeJson(join(root, 'feedback-runs/audit-run-000001/feedback.json'), feedback);
  await writeJson(join(root, 'hypothesis-runs/audit-run-000001/hypotheses.json'), skipHypothesis);
  await writeJson(join(root, 'decision.json'), {
    schemaVersion: 'solution-decision-v1',
    problemId: 'problem-not-formed',
    route: 'SKIP',
    reasonCode: 'NO_PROBLEM_FORMED',
    inputs: {
      solutionStatus: 'NO_PROPOSAL',
      reviewerDecision: null,
      solutionScope: null,
      reviewScope: null,
      permissions: {
        authoritativeProductWrite: false,
        sandboxWrite: true,
        productExecution: false,
        codeExecution: false,
      },
      budget: { actualParticipantJobs: 2, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
  await writeFile(join(root, 'raw-provider-response.txt'), 'hidden provider transcript', 'utf8');
  return root;
}

async function createParticipantFailureWorkflow(stage: 'EXTERNAL_FEEDBACK' | 'IMPROVEMENT_HYPOTHESIS'): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'workflow-decision-audit-failure-'));
  await writeJson(join(root, 'source/observable-payload.json'), observablePayload);
  if (stage === 'IMPROVEMENT_HYPOTHESIS') {
    await writeJson(join(root, 'problem-package.json'), { source: { runRef: 'audit-run-000002' } });
    await writeJson(join(root, 'feedback-runs/audit-run-000002/feedback.json'), feedback);
  }
  await writeJson(join(root, 'workflow-outcome.json'), {
    outcome: 'PARTICIPANT_FAILURE',
    failedStage: stage,
    route: 'DEFER',
    participantErrorKind: 'timeout',
  });
  return root;
}

async function createNonSkipWorkflow(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'workflow-decision-audit-chain-'));
  await writeJson(join(root, 'problem-package.json'), { source: { runRef: 'audit-run-000003' } });
  await writeJson(join(root, 'source/observable-payload.json'), observablePayload);
  await writeJson(join(root, 'feedback-runs/audit-run-000003/feedback.json'), feedback);
  await writeJson(join(root, 'hypothesis-runs/audit-run-000003/hypotheses.json'), {
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [{
      hypothesis: '可能存在一个值得进一步调查的体验问题。',
      observedBasis: '反馈提供了可引用的玩家可见依据。',
      feedbackRefs: ['observations[0]'],
      evidenceRefs: ['entry-000001'],
      unknowns: ['尚不知道是否跨 run 普遍存在。'],
      productSignificance: '可能影响体验差异感。',
    }],
    noProblemAssessment: null,
  });
  await writeJson(join(root, 'selection/selected-hypothesis.json'), {
    selectedHypothesisId: 'hypothesis-000001',
  });
  await writeJson(join(root, 'solution-agent/result.json'), {
    schemaVersion: 'solution-work-v1',
    status: 'OPTIONS',
    problemId: 'problem-hypothesis-000001',
    options: [{
      optionId: 'option-000001',
      proposedChange: '提出一项有界配置方向。',
      rationale: '与问题证据一致。',
      repoRefs: ['src/example.ts'],
      artifactRefs: ['source/observable-payload.json'],
      changeScope: 'configuration',
      expectedPlayerObservableDifference: '玩家可见差异更清晰。',
      risks: ['需要进一步验证。'],
      unknowns: ['长期影响未知。'],
    }],
    recommendedOptionId: 'option-000001',
    summary: '形成一个配置范围内的候选方案。',
    repoRefs: ['src/example.ts'],
    artifactRefs: ['source/observable-payload.json'],
  });
  await writeJson(join(root, 'reviewer-agent/review.json'), {
    schemaVersion: 'solution-review-v1',
    problemId: 'problem-hypothesis-000001',
    decision: 'ACCEPT_OPTION',
    acceptedOptionId: 'option-000001',
    scopeAssessment: 'config_only',
    assessment: '方案范围可控。',
    repoRefs: ['src/example.ts'],
    artifactRefs: ['source/observable-payload.json'],
    concerns: ['仍需人工确认。'],
  });
  await writeJson(join(root, 'decision.json'), {
    schemaVersion: 'solution-decision-v1',
    problemId: 'problem-hypothesis-000001',
    route: 'READY_FOR_CONFIG_EXECUTION',
    reasonCode: 'ACCEPTED_CONFIGURATION_SCOPE',
    inputs: {
      solutionStatus: 'OPTIONS',
      reviewerDecision: 'ACCEPT_OPTION',
      solutionScope: 'configuration',
      reviewScope: 'config_only',
      permissions: {
        authoritativeProductWrite: false,
        sandboxWrite: true,
        productExecution: false,
        codeExecution: false,
      },
      budget: { actualParticipantJobs: 4, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
  return root;
}

export async function runWorkflowDecisionAuditTests(): Promise<void> {
  const skipRoot = await createSkipWorkflow();
  const skipAudit = await buildWorkflowDecisionAudit({ workflowRoot: skipRoot });
  assert.equal(skipAudit.schemaVersion, 'ae-workflow-decision-audit-v1');
  assert.equal(skipAudit.externalFeedback.status, 'completed');
  assert.deepEqual(skipAudit.externalFeedback.observations, feedback.observations);
  assert.equal(skipAudit.improvementHypothesis.status, 'completed');
  assert.equal(skipAudit.improvementHypothesis.hypothesisCount, 0);
  assert.deepEqual(skipAudit.improvementHypothesis.noProblemAssessment, {
    status: 'recorded',
    ...skipHypothesis.noProblemAssessment,
  });
  assert.equal(skipAudit.selection.status, 'none');
  assert.equal(skipAudit.solution.status, 'not_run');
  assert.equal(skipAudit.reviewer.status, 'not_run');
  assert.equal(skipAudit.decision.route, 'SKIP');
  assert.equal(skipAudit.decision.reasonCode, 'NO_PROBLEM_FORMED');
  assert.doesNotMatch(JSON.stringify(skipAudit), /hidden provider transcript/);

  await writeJson(join(skipRoot, 'hypothesis-runs/audit-run-000001/hypotheses.json'), { hypotheses: [] });
  const legacyAudit = await buildWorkflowDecisionAudit({ workflowRoot: skipRoot });
  assert.deepEqual(legacyAudit.improvementHypothesis.noProblemAssessment, {
    status: 'unavailable',
    reason: 'legacy_contract',
  });
  await writeJson(join(skipRoot, 'hypothesis-runs/audit-run-000001/hypotheses.json'), skipHypothesis);

  const externalFailure = await buildWorkflowDecisionAudit({
    workflowRoot: await createParticipantFailureWorkflow('EXTERNAL_FEEDBACK'),
  });
  assert.equal(externalFailure.externalFeedback.status, 'failed');
  assert.equal(externalFailure.improvementHypothesis.status, 'not_run');
  assert.equal(externalFailure.selection.status, 'not_run');
  assert.equal(externalFailure.solution.status, 'not_run');
  assert.equal(externalFailure.reviewer.status, 'not_run');

  const hypothesisFailure = await buildWorkflowDecisionAudit({
    workflowRoot: await createParticipantFailureWorkflow('IMPROVEMENT_HYPOTHESIS'),
  });
  assert.equal(hypothesisFailure.externalFeedback.status, 'completed');
  assert.equal(hypothesisFailure.improvementHypothesis.status, 'failed');
  assert.equal(hypothesisFailure.improvementHypothesis.noProblemAssessment.status, 'missing');
  assert.equal(hypothesisFailure.selection.status, 'not_run');
  assert.equal(hypothesisFailure.solution.status, 'not_run');
  assert.equal(hypothesisFailure.reviewer.status, 'not_run');

  const normalRoot = await createNonSkipWorkflow();
  const normalAudit = await buildWorkflowDecisionAudit({ workflowRoot: normalRoot });
  assert.equal(normalAudit.improvementHypothesis.noProblemAssessment.status, 'not_applicable');
  assert.equal(normalAudit.selection.status, 'selected');
  assert.equal(normalAudit.selection.selectedHypothesisId, 'hypothesis-000001');
  assert.equal(normalAudit.solution.status, 'completed');
  assert.equal(normalAudit.solution.options[0]?.optionId, 'option-000001');
  assert.equal(normalAudit.reviewer.status, 'completed');
  assert.equal(normalAudit.reviewer.decision, 'ACCEPT_OPTION');
  assert.equal(normalAudit.decision.route, 'READY_FOR_CONFIG_EXECUTION');

  await writeJson(join(normalRoot, 'workflow-outcome.json'), {
    outcome: 'PARTICIPANT_FAILURE',
    failedStage: 'SOLUTION',
    route: 'DEFER',
    participantErrorKind: 'timeout',
  });
  const solutionFailure = await buildWorkflowDecisionAudit({ workflowRoot: normalRoot });
  assert.equal(solutionFailure.selection.status, 'selected');
  assert.equal(solutionFailure.solution.status, 'failed');
  assert.equal(solutionFailure.reviewer.status, 'not_run');

  await writeJson(join(normalRoot, 'workflow-outcome.json'), {
    outcome: 'PARTICIPANT_FAILURE',
    failedStage: 'REVIEWER',
    route: 'DEFER',
    participantErrorKind: 'timeout',
  });
  const reviewerFailure = await buildWorkflowDecisionAudit({ workflowRoot: normalRoot });
  assert.equal(reviewerFailure.solution.status, 'completed');
  assert.equal(reviewerFailure.reviewer.status, 'failed');

  const repositoryRoot = await mkdtemp(join(tmpdir(), 'workflow-decision-audit-repository-'));
  const sessionRoot = await createSkipWorkflow(repositoryRoot);
  await writeJson(join(sessionRoot, 'run-manifest.json'), {
    schemaVersion: 'multi-round-run-manifest-v1',
    multiRoundRunRef: 'ordinary-run-20260904-000001',
    initialSourceRunRef: 'ordinary-run-20260904-000001',
    limits: {
      maxAgentRounds: 1,
      maxCrossRoundTransitions: 0,
      maxRoundParticipantJobs: 4,
      maxExecutionParticipantJobs: 0,
      maxTotalParticipantJobs: 4,
      retryCount: 0,
    },
    rounds: [{
      round: 1,
      workflowRef: 'decision-audit-session',
      sourceRunRef: 'audit-run-000001',
      terminalRoute: 'SKIP',
      executionRef: null,
      resultingRunRef: null,
      nextAction: 'STOP',
    }],
    execution: {
      executionRef: 'configuration-execution-000001',
      allowedWritePaths: [],
      actualChangedFiles: [],
      status: 'not_started',
      verificationResults: [],
      resultingRunRef: null,
    },
    budget: {
      round1ParticipantJobs: 2,
      executionParticipantJobs: 0,
      round2ParticipantJobs: 0,
      totalParticipantJobs: 2,
      retryCount: 0,
    },
    outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED',
    stopReason: 'ROUND_1_TERMINAL_NOT_READY',
  });
  const firstArchive = await archiveOperationalRunReport({
    repositoryRoot,
    root: '.tmp/evolution/decision-audit-session',
  });
  assert.equal(firstArchive.schemaVersion, OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V3);
  const archived = parseOperationalRunReport(
    await readFile(firstArchive.reportJsonPath, 'utf8'),
    firstArchive.reportId,
  );
  assert.equal(archived.schemaVersion, OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V3);
  assert.equal(archived.workflows[0]?.decisionAudit.improvementHypothesis.hypothesisCount, 0);
  assert.equal(archived.workflows[0]?.decisionAudit.decision.reasonCode, 'NO_PROBLEM_FORMED');
  assert.match(await readFile(firstArchive.reportMarkdownPath, 'utf8'), /### 决策审计/);

  const withoutAudit = JSON.parse(await readFile(firstArchive.reportJsonPath, 'utf8')) as {
    workflows: Array<Record<string, unknown>>;
  };
  delete withoutAudit.workflows[0]?.decisionAudit;
  assert.throws(
    () => parseOperationalRunReport(JSON.stringify(withoutAudit), firstArchive.reportId),
    /decisionAudit/i,
  );

  await writeJson(join(sessionRoot, 'hypothesis-runs/audit-run-000001/hypotheses.json'), {
    ...skipHypothesis,
    noProblemAssessment: {
      ...skipHypothesis.noProblemAssessment,
      rationale: '同一份材料仍不足以形成稳定的问题假设，但本次审计理由已变化。',
      evidenceRefs: ['entry-000002'],
    },
  });
  const secondArchive = await archiveOperationalRunReport({
    repositoryRoot,
    root: '.tmp/evolution/decision-audit-session',
  });
  assert.notEqual(secondArchive.reportId, firstArchive.reportId);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWorkflowDecisionAuditTests()
    .then(() => console.log('workflowDecisionAudit.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
