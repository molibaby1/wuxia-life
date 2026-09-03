import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  buildMultiRoundSessionSummary,
  discoverMultiRoundRunManifestPath,
  parseMultiRoundRunManifest,
  type MultiRoundRunManifestV1,
} from '../../scripts/evolution/multiRoundRunManifestContract';
import {
  computeOperationalRunReportId,
  computeOperationalRunReportIdV2,
  archiveOperationalRunReport,
} from '../../scripts/evolution/reporting/archiveOperationalRunReport';
import {
  parseOperationalRunReport,
  buildOperationalObservabilityIndex,
  OPERATIONAL_RUN_REPORT_SCHEMA_VERSION,
  OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V2,
} from '../../scripts/evolution/reporting/buildOperationalObservabilityIndex';
import { renderOperationalRunReportMarkdown } from '../../scripts/evolution/reporting/buildOperationalRunReport';
import { formatOrdinaryEvolutionOperatorSummary } from '../../scripts/evolution/operator/runOrdinaryEvolution';

function baseManifest(overrides: Partial<MultiRoundRunManifestV1> = {}): MultiRoundRunManifestV1 {
  return parseMultiRoundRunManifest({
    schemaVersion: 'multi-round-run-manifest-v1',
    multiRoundRunRef: 'ordinary-run-20260903-000001',
    initialSourceRunRef: 'ordinary-run-20260903-000001',
    limits: {
      maxAgentRounds: 2,
      maxCrossRoundTransitions: 1,
      maxRoundParticipantJobs: 4,
      maxExecutionParticipantJobs: 1,
      maxTotalParticipantJobs: 9,
      retryCount: 0,
    },
    rounds: [{
      round: 1,
      workflowRef: 'round-1',
      sourceRunRef: 'ordinary-run-20260903-000001',
      terminalRoute: 'READY_FOR_CONFIG_EXECUTION',
      executionRef: 'configuration-execution-000001',
      resultingRunRef: null,
      nextAction: 'CONFIGURATION_EXECUTION',
    }],
    execution: {
      executionRef: 'configuration-execution-000001',
      allowedWritePaths: ['src/data/lines/p9-remediation.json'],
      actualChangedFiles: ['.omx/logs/x.jsonl', 'src/data/lines/p9-remediation.json'],
      status: 'scope_violation',
      verificationResults: [],
      resultingRunRef: null,
    },
    budget: {
      round1ParticipantJobs: 4,
      executionParticipantJobs: 1,
      round2ParticipantJobs: 0,
      totalParticipantJobs: 5,
      retryCount: 0,
    },
    outcome: 'STOPPED',
    stopReason: 'EXECUTION_SCOPE_VIOLATION',
    ...overrides,
  });
}

export async function runMultiRoundSessionObservabilityTests(): Promise<void> {
  const smokeManifest = baseManifest();
  const smokeSummary = buildMultiRoundSessionSummary(smokeManifest);
  assert.equal(smokeSummary.stopReason, 'EXECUTION_SCOPE_VIOLATION');
  assert.equal(smokeSummary.outcome, 'STOPPED');
  assert.equal(smokeSummary.lastRoundTerminalRoute, 'READY_FOR_CONFIG_EXECUTION');
  assert.equal(smokeSummary.execution.status, 'scope_violation');
  assert.equal(smokeSummary.crossRoundTransitions, 0);

  const deferManifest = baseManifest({
    rounds: [{
      round: 1,
      workflowRef: 'round-1',
      sourceRunRef: 'ordinary-run-defer',
      terminalRoute: 'DEFER_MORE_WORK_REQUESTED',
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
    outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED',
    stopReason: 'ROUND_1_TERMINAL_NOT_READY',
  });
  const deferSummary = buildMultiRoundSessionSummary(deferManifest);
  assert.equal(deferSummary.stopReason, 'ROUND_1_TERMINAL_NOT_READY');
  assert.equal(deferSummary.lastRoundTerminalRoute, 'DEFER_MORE_WORK_REQUESTED');
  assert.equal(deferSummary.execution.status, 'not_started');

  const round2Manifest = baseManifest({
    rounds: [
      {
        round: 1,
        workflowRef: 'round-1',
        sourceRunRef: 'ordinary-run-r2',
        terminalRoute: 'READY_FOR_CONFIG_EXECUTION',
        executionRef: 'configuration-execution-000001',
        resultingRunRef: null,
        nextAction: 'CONFIGURATION_EXECUTION',
      },
      {
        round: 2,
        workflowRef: 'round-2',
        sourceRunRef: 'ordinary-run-r2-round-2',
        terminalRoute: 'NO_PROBLEM_FORMED',
        executionRef: 'configuration-execution-000001',
        resultingRunRef: 'ordinary-run-r2-round-2',
        nextAction: 'STOP',
      },
    ],
    execution: {
      executionRef: 'configuration-execution-000001',
      allowedWritePaths: ['src/data/lines/family-life.json'],
      actualChangedFiles: ['src/data/lines/family-life.json'],
      status: 'completed',
      verificationResults: [],
      resultingRunRef: 'ordinary-run-r2-round-2',
    },
    outcome: 'CROSS_ROUND_TRANSITION_OBSERVED',
    stopReason: 'ROUND_2_COMPLETED',
  });
  const round2Summary = buildMultiRoundSessionSummary(round2Manifest);
  assert.equal(round2Summary.crossRoundTransitions, 1);
  assert.equal(round2Summary.lastRoundTerminalRoute, 'NO_PROBLEM_FORMED');
  assert.equal(round2Summary.execution.resultingRunRef, 'ordinary-run-r2-round-2');

  const failureManifest = baseManifest({
    execution: {
      executionRef: 'configuration-execution-000001',
      allowedWritePaths: ['src/data/lines/family-life.json'],
      actualChangedFiles: [],
      status: 'failed',
      verificationResults: [],
      resultingRunRef: null,
    },
    stopReason: 'EXECUTION_PARTICIPANT_FAILURE',
    outcome: 'STOPPED',
  });
  assert.equal(buildMultiRoundSessionSummary(failureManifest).stopReason, 'EXECUTION_PARTICIPANT_FAILURE');

  {
    const root = await mkdtemp(join(tmpdir(), 'manifest-discover-'));
    assert.equal(await discoverMultiRoundRunManifestPath(root), null);
    await writeFile(join(root, 'run-manifest.json'), `${JSON.stringify(smokeManifest)}\n`);
    assert.equal(await discoverMultiRoundRunManifestPath(root), join(root, 'run-manifest.json'));
  }

  {
    const root = await mkdtemp(join(tmpdir(), 'manifest-ambiguous-'));
    await mkdir(join(root, 'a'), { recursive: true });
    await mkdir(join(root, 'b'), { recursive: true });
    await writeFile(join(root, 'a/run-manifest.json'), `${JSON.stringify(smokeManifest)}\n`);
    await writeFile(join(root, 'b/run-manifest.json'), `${JSON.stringify(deferManifest)}\n`);
    await assert.rejects(() => discoverMultiRoundRunManifestPath(root), /ambiguous multi-round session manifests/);
  }

  // Same workflows + different host stop → different v2 report ids.
  const workflows = [{
    identity: 'round-1',
    status: 'READY_FOR_CONFIG_EXECUTION',
    sourceRunRef: 'ordinary-run-20260903-000001',
    problemStatement: 'x',
    solutionStatus: 'OPTIONS',
    reviewerDecision: 'ACCEPT_OPTION',
    terminalRoute: 'READY_FOR_CONFIG_EXECUTION',
    reason: 'ACCEPTED_CONFIGURATION_SCOPE',
    failedStage: null,
    participantErrorKind: null,
    authoritativeModification: 'NO' as const,
    lastAvailableArtifact: null,
    artifactRefs: [],
    structuredTerminalDelivery: null,
  }];
  const idA = computeOperationalRunReportIdV2({
    sourceRoot: '.tmp/evolution/session',
    sessionExecution: smokeSummary,
    workflows,
  });
  const idB = computeOperationalRunReportIdV2({
    sourceRoot: '.tmp/evolution/session',
    sessionExecution: buildMultiRoundSessionSummary(failureManifest),
    workflows,
  });
  assert.notEqual(idA, idB);
  const legacyId = computeOperationalRunReportId({
    sourceRoot: '.tmp/evolution/session',
    workflows,
  });
  assert.match(legacyId, /^ae-report-[0-9a-f]{16}$/);

  const markdown = renderOperationalRunReportMarkdown({
    summaries: workflows,
    reportId: 'ae-report-test',
    createdAt: '2026-09-03T00:00:00.000Z',
    includeArtifactRetentionNote: true,
    sessionExecution: smokeSummary,
  });
  assert.match(markdown, /## 会话执行/);
  assert.match(markdown, /Host 停止原因：EXECUTION_SCOPE_VIOLATION/);
  assert.match(markdown, /最后一轮路由：READY_FOR_CONFIG_EXECUTION/);
  assert.match(markdown, /## 工作流 \/ 轮次详情/);
  assert.match(markdown, /本轮工作流已接受配置范围；后续情况见“会话执行”。/);
  assert.doesNotMatch(markdown, /已接受的配置工作可等待单独授权后执行/);

  // Operator/report session summary parity: same projection function.
  const operatorView = {
    schemaVersion: 'ordinary-evolution-operator-result-v2' as const,
    sessionId: smokeSummary.multiRoundRunRef,
    branch: 'dev',
    headSha: 'a'.repeat(40),
    participantBinding: 'CODEX_CURRENT' as const,
    sessionExecution: smokeSummary,
    authoritativeRootChanged: false,
    runReportId: null,
    runReportPath: null,
    humanFollowupActiveCount: 0,
    operationalIndexPath: 'artifacts/evolution/index.md',
    observabilityStatus: 'PASS' as const,
    observabilityError: null,
    sessionRoot: '.tmp/evolution/ordinary-run-20260903-000001',
    experimentRoot: '.tmp/evolution/ordinary-run-20260903-000001/problem-agnostic-agent-solution-loop-instance-000001',
  };
  const summaryText = formatOrdinaryEvolutionOperatorSummary(operatorView);
  assert.match(summaryText, /Host 停止原因：\nEXECUTION_SCOPE_VIOLATION/);
  assert.match(summaryText, /最后一轮路由：\nREADY_FOR_CONFIG_EXECUTION/);
  assert.match(summaryText, /执行状态：\nscope_violation/);
  assert.doesNotMatch(summaryText, /\noutcome:\nREADY_FOR_CONFIG_EXECUTION/);

  // Archive session root with child experiment manifest → v2.
  {
    const repositoryRoot = await mkdtemp(join(tmpdir(), 'session-archive-'));
    const sessionRoot = join(repositoryRoot, '.tmp/evolution/ordinary-run-session');
    const experimentRoot = join(sessionRoot, 'problem-agnostic-agent-solution-loop-instance-000001');
    await mkdir(join(experimentRoot, 'round-1'), { recursive: true });
    await writeFile(join(experimentRoot, 'run-manifest.json'), `${JSON.stringify(smokeManifest, null, 2)}\n`);
    await writeFile(join(experimentRoot, 'round-1/decision.json'), `${JSON.stringify({
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
    }, null, 2)}\n`);
    await writeFile(join(experimentRoot, 'round-1/problem-package.json'), `${JSON.stringify({
      schemaVersion: 'problem-package-v1',
      problemId: 'problem-hypothesis-000001',
      problem: { statement: 'leak' },
      source: { runRef: 'ordinary-run-20260903-000001' },
      permissions: {
        authoritativeProductWrite: false,
        codeExecution: false,
        productExecution: false,
        sandboxWrite: true,
      },
    }, null, 2)}\n`);

    const archived = await archiveOperationalRunReport({
      repositoryRoot,
      root: '.tmp/evolution/ordinary-run-session',
    });
    assert.equal(archived.schemaVersion, OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V2);
    const report = parseOperationalRunReport(
      await (await import('node:fs/promises')).readFile(archived.reportJsonPath, 'utf8'),
      archived.reportId,
    );
    assert.equal(report.schemaVersion, OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V2);
    if (report.schemaVersion !== OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V2) throw new Error('expected v2');
    assert.deepEqual(report.sessionExecution, smokeSummary);

    const indexMarkdown = await (await import('node:fs/promises')).readFile(
      join(repositoryRoot, 'artifacts/evolution/run-reports/index.md'),
      'utf8',
    );
    assert.match(indexMarkdown, /EXECUTION_SCOPE_VIOLATION/);
    assert.match(indexMarkdown, /scope_violation/);
    // READY may appear as workflow route, but session stop column is EXECUTION_SCOPE_VIOLATION.
    assert.match(indexMarkdown, /\| [^|]* \| [^|]* \| EXECUTION_SCOPE_VIOLATION \|/);
  }

  // Mixed v1/v2 index.
  {
    const repositoryRoot = await mkdtemp(join(tmpdir(), 'mixed-index-'));
    const reportsRoot = join(repositoryRoot, 'artifacts/evolution/run-reports');
    await mkdir(join(reportsRoot, 'ae-report-aaaaaaaaaaaaaaaa'), { recursive: true });
    await writeFile(join(reportsRoot, 'ae-report-aaaaaaaaaaaaaaaa/report.json'), `${JSON.stringify({
      schemaVersion: OPERATIONAL_RUN_REPORT_SCHEMA_VERSION,
      reportId: 'ae-report-aaaaaaaaaaaaaaaa',
      createdAt: '2026-09-01T00:00:00.000Z',
      sourceRoot: '.tmp/evolution/legacy',
      workflowCount: 1,
      workflows,
    }, null, 2)}\n`);
    await mkdir(join(reportsRoot, 'ae-report-bbbbbbbbbbbbbbbb'), { recursive: true });
    await writeFile(join(reportsRoot, 'ae-report-bbbbbbbbbbbbbbbb/report.json'), `${JSON.stringify({
      schemaVersion: OPERATIONAL_RUN_REPORT_SCHEMA_VERSION_V2,
      reportId: 'ae-report-bbbbbbbbbbbbbbbb',
      createdAt: '2026-09-02T00:00:00.000Z',
      sourceRoot: '.tmp/evolution/session',
      sessionExecution: smokeSummary,
      workflowCount: 1,
      workflows,
    }, null, 2)}\n`);
    await buildOperationalObservabilityIndex({ repositoryRoot });
    const indexMarkdown = await (await import('node:fs/promises')).readFile(
      join(reportsRoot, 'index.md'),
      'utf8',
    );
    assert.match(indexMarkdown, /（仅工作流）/);
    assert.match(indexMarkdown, /EXECUTION_SCOPE_VIOLATION/);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMultiRoundSessionObservabilityTests()
    .then(() => console.log('multiRoundSessionObservability.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
