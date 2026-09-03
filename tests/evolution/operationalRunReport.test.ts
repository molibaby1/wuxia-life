import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { archiveOperationalRunReport } from '../../scripts/evolution/reporting/archiveOperationalRunReport';
import { buildOperationalObservabilityIndex } from '../../scripts/evolution/reporting/buildOperationalObservabilityIndex';
import { buildOperationalRunReport } from '../../scripts/evolution/reporting/buildOperationalRunReport';

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function createRoot(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'operational-run-report-'));
}

async function createProblemPackage(root: string): Promise<void> {
  await writeJson(join(root, 'problem-package.json'), {
    schemaVersion: 'problem-package-v1',
    problemId: 'problem-hypothesis-000001',
    problem: {
      statement: 'The late-game workflow repeats too much content.',
    },
    source: { runRef: 'source-run-000001' },
    permissions: {
      authoritativeProductWrite: false,
      codeExecution: false,
      productExecution: false,
      sandboxWrite: true,
    },
  });
}

function createExecutionTrace(events: Record<string, unknown>[]): Record<string, unknown> {
  return {
    schemaVersion: 'participant-execution-trace-v1',
    invocation: {
      startedAt: '2026-08-24T00:00:00.000Z',
      timeoutMs: 120_000,
    },
    events: events.map((event, index) => ({ seq: index, ...event })),
    terminal: {
      outcome: 'completed',
      elapsedMs: 1000,
    },
  };
}

function recoveredExecutionTrace(): Record<string, unknown> {
  return createExecutionTrace([
    { type: 'process_start', elapsedMs: 0, attempt: 0 },
    {
      type: 'participant_terminal_validation',
      elapsedMs: 100,
      attempt: 0,
      envelopeValid: false,
      schemaValidationAttempted: false,
      accepted: false,
      envelopeFailureReason: 'INVALID_JSON',
    },
    {
      type: 'participant_envelope_retransmission_requested',
      elapsedMs: 101,
      retransmissionAttempt: 1,
      failureClass: 'ENVELOPE_FAILURE',
      sameThread: true,
      timeoutMs: 60_000,
      participantCapability: 'SAME_THREAD_CONTINUATION',
    },
    {
      type: 'participant_envelope_retransmission_completed',
      elapsedMs: 500,
      retransmissionAttempt: 1,
      runtimeOutcome: 'COMPLETED',
    },
    {
      type: 'participant_terminal_validation',
      elapsedMs: 501,
      attempt: 1,
      envelopeValid: true,
      schemaValidationAttempted: true,
      schemaValid: true,
      accepted: true,
    },
  ]);
}

function failClosedExecutionTrace(): Record<string, unknown> {
  return createExecutionTrace([
    { type: 'process_start', elapsedMs: 0, attempt: 0 },
    {
      type: 'participant_terminal_validation',
      elapsedMs: 100,
      attempt: 0,
      envelopeValid: false,
      schemaValidationAttempted: false,
      accepted: false,
      envelopeFailureReason: 'INVALID_JSON',
    },
    {
      type: 'participant_envelope_retransmission_requested',
      elapsedMs: 101,
      retransmissionAttempt: 1,
      failureClass: 'ENVELOPE_FAILURE',
      sameThread: true,
      timeoutMs: 60_000,
      participantCapability: 'SAME_THREAD_CONTINUATION',
    },
    {
      type: 'participant_envelope_retransmission_completed',
      elapsedMs: 500,
      retransmissionAttempt: 1,
      runtimeOutcome: 'COMPLETED',
    },
    {
      type: 'participant_terminal_validation',
      elapsedMs: 501,
      attempt: 1,
      envelopeValid: true,
      schemaValidationAttempted: true,
      schemaValid: false,
      accepted: false,
    },
  ]);
}

function firstPassSuccessExecutionTrace(): Record<string, unknown> {
  return createExecutionTrace([
    { type: 'process_start', elapsedMs: 0, attempt: 0 },
    {
      type: 'participant_terminal_validation',
      elapsedMs: 100,
      attempt: 0,
      envelopeValid: true,
      schemaValidationAttempted: true,
      schemaValid: true,
      accepted: true,
    },
  ]);
}

async function createEarlyParticipantFailureWorkflow(input: {
  root: string;
  stage: 'EXTERNAL_FEEDBACK' | 'IMPROVEMENT_HYPOTHESIS';
  runRef: string;
  invocationRef: string;
}): Promise<void> {
  const directory = input.stage === 'EXTERNAL_FEEDBACK' ? 'feedback-runs' : 'hypothesis-runs';
  const invocationPath = join(directory, input.runRef, 'invocation.json');
  await writeJson(join(input.root, 'source/observable-payload.json'), { entries: [] });
  await writeJson(join(input.root, invocationPath), {
    schemaVersion: input.stage === 'EXTERNAL_FEEDBACK'
      ? 'minimal-external-feedback-invocation-v1'
      : 'improvement-hypothesis-invocation-v1',
    runRef: input.runRef,
    ...(input.stage === 'EXTERNAL_FEEDBACK'
      ? { invocationRef: input.invocationRef }
      : {
        feedbackInvocationRef: `${input.runRef}-feedback-001`,
        hypothesisInvocationRef: input.invocationRef,
      }),
    status: 'failed',
  });
  await writeJson(join(input.root, 'workflow-outcome.json'), {
    schemaVersion: 'participant-failure-outcome-v1',
    outcome: 'PARTICIPANT_FAILURE',
    failedStage: input.stage,
    participantJobNumber: input.stage === 'EXTERNAL_FEEDBACK' ? 1 : 2,
    route: 'DEFER',
    participantErrorKind: 'timeout',
    failureArtifactRefs: [invocationPath],
    budget: {
      actualParticipantJobs: input.stage === 'EXTERNAL_FEEDBACK' ? 1 : 2,
      maxParticipantJobs: 4,
      retryCount: 0,
    },
  });
}

export async function runOperationalRunReportTests(): Promise<void> {
  await testReadyForConfigExecution();
  await testNestedRoundOne();
  await testProblemPackageOnlyIsNotWorkflow();
  await testTerminalWorkflowSignatures();
  await testNestedRoundPair();
  await testIncompleteNestedWorkflow();
  await testFalsePositiveDirectories();
  await testParticipantFailure();
  await testEarlyFeedbackParticipantFailure();
  await testEarlyHypothesisParticipantFailure();
  await testMalformedOrMissingFailureInvocation();
  await testUnsafeFailureArtifactReference();
  await testIncompleteHistoricalAttempt();
  await testWorkflowRecursionStopsAtRoot();
  await testRecoveredStructuredTerminalDelivery();
  await testFailClosedStructuredTerminalDelivery();
  await testRetransmissionSucceededDespiteAcceptanceRejection();
  await testStructuredTerminalDeliveryAggregates();
  await testArchiveCreationAndIndexes();
  await testArchiveStableIdentity();
  await testArchiveChangedSummaryNewIdentity();
  await testArchiveJsonMarkdownParity();
  await testArchiveMultipleWorkflows();
  await testObservabilityIndexRebuild();
  await testInvalidReportSidecarFailsClosed();
  await testArchiveDoesNotMutateHumanFollowup();
  await testArchiveDoesNotCopyRawArtifacts();
}

async function testReadyForConfigExecution(): Promise<void> {
  const scanRoot = await createRoot();
  const runRoot = join(scanRoot, 'problem-agnostic-agent-solution-loop-instance-012');
  await createProblemPackage(runRoot);
  await writeJson(join(runRoot, 'solution-agent/result.json'), { status: 'OPTIONS' });
  await writeJson(join(runRoot, 'reviewer-agent/review.json'), { decision: 'ACCEPT_OPTION' });
  await writeJson(join(runRoot, 'decision.json'), {
    route: 'READY_FOR_CONFIG_EXECUTION',
    reasonCode: 'ACCEPTED_CONFIGURATION_SCOPE',
  });
  await writeJson(join(runRoot, 'source/observable-payload.json'), { entries: [] });

  const outputPath = join(scanRoot, 'report.md');
  const result = await buildOperationalRunReport({ root: scanRoot, outputPath });
  const report = await readFile(result.reportPath, 'utf8');

  assert.equal(result.workflowCount, 1);
  assert.match(report, /Observed workflow runs: 1/);
  assert.match(report, /problem-agnostic-agent-solution-loop-instance-012/);
  assert.match(report, /Source run ref: source-run-000001/);
  assert.match(report, /Problem statement: The late-game workflow repeats too much content\./);
  assert.match(report, /Solution status \/ result kind: OPTIONS/);
  assert.match(report, /Reviewer decision: ACCEPT_OPTION/);
  assert.match(report, /Terminal route \/ workflow outcome: READY_FOR_CONFIG_EXECUTION/);
  assert.match(report, /Reason: ACCEPTED_CONFIGURATION_SCOPE/);
  assert.match(report, /Accepted configuration work is ready for separately authorized execution\./);
  assert.match(report, /Authoritative modification in this workflow: NO/);
  assert.doesNotMatch(report, /configuration has been modified|问题已解决|raw-output\.txt|human-review-package\.md/);
}

async function testParticipantFailure(): Promise<void> {
  const scanRoot = await createRoot();
  const runRoot = join(scanRoot, 'problem-agnostic-agent-solution-loop-instance-008');
  await createProblemPackage(runRoot);
  await writeJson(join(runRoot, 'workflow-outcome.json'), {
    schemaVersion: 'participant-failure-outcome-v1',
    outcome: 'PARTICIPANT_FAILURE',
    failedStage: 'SOLUTION',
    participantJobNumber: 3,
    route: 'DEFER',
    participantErrorKind: 'invalid_output',
    failureArtifactRefs: ['solution-agent/failure.json'],
    budget: { actualParticipantJobs: 3, maxParticipantJobs: 4, retryCount: 0 },
  });
  await writeJson(join(runRoot, 'solution-agent/failure.json'), {
    schemaVersion: 'solution-agent-failure-v1',
    errorKind: 'invalid_output',
  });

  const outputPath = join(scanRoot, 'report.md');
  const report = await readFile((await buildOperationalRunReport({ root: scanRoot, outputPath })).reportPath, 'utf8');

  assert.match(report, /Status: PARTICIPANT_FAILURE/);
  assert.match(report, /Terminal route \/ workflow outcome: DEFER/);
  assert.match(report, /Failed stage: SOLUTION/);
  assert.match(report, /Participant error kind: invalid_output/);
  assert.match(report, /Authoritative modification in this workflow: NO/);
}

async function testEarlyFeedbackParticipantFailure(): Promise<void> {
  const scanRoot = await createRoot();
  const runRoot = join(scanRoot, 'round-1');
  await createEarlyParticipantFailureWorkflow({
    root: runRoot,
    stage: 'EXTERNAL_FEEDBACK',
    runRef: 'early-feedback-run-000001',
    invocationRef: 'early-feedback-run-000001-deepseek-player-feedback-001',
  });

  const outputPath = join(scanRoot, 'report.md');
  const report = await readFile((await buildOperationalRunReport({ root: scanRoot, outputPath })).reportPath, 'utf8');

  assert.match(report, /Status: PARTICIPANT_FAILURE/);
  assert.match(report, /Source run ref: early-feedback-run-000001/);
  assert.match(report, /Terminal route \/ workflow outcome: DEFER/);
  assert.match(report, /Failed stage: EXTERNAL_FEEDBACK/);
  assert.match(report, /Participant error kind: timeout/);
  assert.match(report, /Authoritative modification in this workflow: NO/);
}

async function testEarlyHypothesisParticipantFailure(): Promise<void> {
  const scanRoot = await createRoot();
  const runRoot = join(scanRoot, 'round-1');
  await createEarlyParticipantFailureWorkflow({
    root: runRoot,
    stage: 'IMPROVEMENT_HYPOTHESIS',
    runRef: 'early-hypothesis-run-000001',
    invocationRef: 'early-hypothesis-run-000001-deepseek-improvement-hypothesis-001',
  });

  const outputPath = join(scanRoot, 'report.md');
  const report = await readFile((await buildOperationalRunReport({ root: scanRoot, outputPath })).reportPath, 'utf8');

  assert.match(report, /Status: PARTICIPANT_FAILURE/);
  assert.match(report, /Source run ref: early-hypothesis-run-000001/);
  assert.match(report, /Terminal route \/ workflow outcome: DEFER/);
  assert.match(report, /Failed stage: IMPROVEMENT_HYPOTHESIS/);
  assert.match(report, /Participant error kind: timeout/);
  assert.match(report, /Authoritative modification in this workflow: NO/);
}

async function testMalformedOrMissingFailureInvocation(): Promise<void> {
  const scanRoot = await createRoot();
  const malformedRoot = join(scanRoot, 'malformed');
  const missingRoot = join(scanRoot, 'missing');
  await writeJson(join(malformedRoot, 'source/observable-payload.json'), { entries: [] });
  await mkdir(join(malformedRoot, 'feedback-runs', 'malformed-run-000001'), { recursive: true });
  await writeFile(
    join(malformedRoot, 'feedback-runs', 'malformed-run-000001', 'invocation.json'),
    '{not-json',
    'utf8',
  );
  await writeJson(join(malformedRoot, 'workflow-outcome.json'), {
    outcome: 'PARTICIPANT_FAILURE',
    failedStage: 'EXTERNAL_FEEDBACK',
    route: 'DEFER',
    participantErrorKind: 'timeout',
    failureArtifactRefs: ['feedback-runs/malformed-run-000001/invocation.json'],
  });
  await writeJson(join(missingRoot, 'source/observable-payload.json'), { entries: [] });
  await writeJson(join(missingRoot, 'workflow-outcome.json'), {
    outcome: 'PARTICIPANT_FAILURE',
    failedStage: 'IMPROVEMENT_HYPOTHESIS',
    route: 'DEFER',
    participantErrorKind: 'timeout',
    failureArtifactRefs: ['hypothesis-runs/missing-run-000001/invocation.json'],
  });

  const outputPath = join(scanRoot, 'report.md');
  const result = await buildOperationalRunReport({ root: scanRoot, outputPath });
  const report = await readFile(result.reportPath, 'utf8');

  assert.equal(result.workflowCount, 2);
  assert.doesNotMatch(report, /Source run ref:/);
  assert.match(report, /Authoritative modification in this workflow: NO/g);
}

async function testUnsafeFailureArtifactReference(): Promise<void> {
  const scanRoot = await createRoot();
  const outsideRoot = await createRoot();
  const outsideInvocation = join(outsideRoot, 'invocation.json');
  await writeJson(outsideInvocation, {
    runRef: 'unsafe-source-run-000001',
    status: 'failed',
  });

  const parentReferenceRoot = join(scanRoot, 'parent-reference');
  await writeJson(join(parentReferenceRoot, 'source/observable-payload.json'), { entries: [] });
  await writeJson(join(parentReferenceRoot, 'workflow-outcome.json'), {
    outcome: 'PARTICIPANT_FAILURE',
    failedStage: 'EXTERNAL_FEEDBACK',
    route: 'DEFER',
    participantErrorKind: 'timeout',
    failureArtifactRefs: [relative(parentReferenceRoot, outsideInvocation)],
  });

  const absoluteReferenceRoot = join(scanRoot, 'absolute-reference');
  await writeJson(join(absoluteReferenceRoot, 'source/observable-payload.json'), { entries: [] });
  await writeJson(join(absoluteReferenceRoot, 'workflow-outcome.json'), {
    outcome: 'PARTICIPANT_FAILURE',
    failedStage: 'EXTERNAL_FEEDBACK',
    route: 'DEFER',
    participantErrorKind: 'timeout',
    failureArtifactRefs: [outsideInvocation],
  });

  const outputPath = join(scanRoot, 'report.md');
  const result = await buildOperationalRunReport({ root: scanRoot, outputPath });
  const report = await readFile(result.reportPath, 'utf8');

  assert.equal(result.workflowCount, 2);
  assert.doesNotMatch(report, /Source run ref:/);
  assert.doesNotMatch(report, /unsafe-source-run-000001/);
  assert.match(report, /Authoritative modification in this workflow: NO/g);
}

async function testNestedRoundOne(): Promise<void> {
  const scanRoot = await createRoot();
  const runRoot = join(scanRoot, 'p2-run', 'round-1');
  await createProblemPackage(runRoot);
  await writeJson(join(runRoot, 'source/observable-payload.json'), { entries: [] });

  const outputPath = join(scanRoot, 'report.md');
  const result = await buildOperationalRunReport({ root: scanRoot, outputPath });
  const report = await readFile(result.reportPath, 'utf8');

  assert.equal(result.workflowCount, 1);
  assert.match(report, /## 1\. p2-run\/round-1/);
  assert.match(report, /Status: INCOMPLETE/);
  assert.match(report, /Terminal route \/ workflow outcome: NOT RECORDED/);
}

async function testProblemPackageOnlyIsNotWorkflow(): Promise<void> {
  const scanRoot = await createRoot();
  const packageRoot = join(scanRoot, 'first-skill-behavioral-validation-package-000001');
  await createProblemPackage(packageRoot);

  const outputPath = join(scanRoot, 'report.md');
  const result = await buildOperationalRunReport({ root: scanRoot, outputPath });
  const report = await readFile(result.reportPath, 'utf8');

  assert.equal(result.workflowCount, 0);
  assert.match(report, /Observed workflow runs: 0/);
  assert.doesNotMatch(report, /first-skill-behavioral-validation-package-000001/);
}

async function testTerminalWorkflowSignatures(): Promise<void> {
  const scanRoot = await createRoot();
  await writeJson(join(scanRoot, 'terminal-decision', 'decision.json'), { route: 'DEFER' });
  await writeJson(join(scanRoot, 'terminal-outcome', 'workflow-outcome.json'), { outcome: 'STOP' });

  const outputPath = join(scanRoot, 'report.md');
  const result = await buildOperationalRunReport({ root: scanRoot, outputPath });
  const report = await readFile(result.reportPath, 'utf8');

  assert.equal(result.workflowCount, 2);
  assert.match(report, /terminal-decision/);
  assert.match(report, /terminal-outcome/);
}

async function testNestedRoundPair(): Promise<void> {
  const scanRoot = await createRoot();
  await writeJson(join(scanRoot, 'p2-run', 'round-1', 'decision.json'), { route: 'DEFER' });
  await writeJson(join(scanRoot, 'p2-run', 'round-2', 'decision.json'), { route: 'SKIP' });

  const outputPath = join(scanRoot, 'report.md');
  const result = await buildOperationalRunReport({ root: scanRoot, outputPath });
  const report = await readFile(result.reportPath, 'utf8');

  assert.equal(result.workflowCount, 2);
  assert.match(report, /## 1\. p2-run\/round-1/);
  assert.match(report, /## 2\. p2-run\/round-2/);
}

async function testIncompleteNestedWorkflow(): Promise<void> {
  const scanRoot = await createRoot();
  const runRoot = join(scanRoot, 'p2-run', 'round-1');
  await createProblemPackage(runRoot);
  await writeJson(join(runRoot, 'source/observable-payload.json'), { entries: [] });
  await writeJson(join(runRoot, 'feedback-runs', 'participant-1', 'invocation.json'), {});
  await writeJson(join(runRoot, 'hypothesis-runs', 'hypothesis-1', 'invocation.json'), {});

  const outputPath = join(scanRoot, 'report.md');
  const result = await buildOperationalRunReport({ root: scanRoot, outputPath });
  const report = await readFile(result.reportPath, 'utf8');

  assert.equal(result.workflowCount, 1);
  assert.match(report, /## 1\. p2-run\/round-1/);
  assert.match(report, /Status: INCOMPLETE/);
  assert.match(report, /Terminal route \/ workflow outcome: NOT RECORDED/);
  assert.match(report, /Problem statement: The late-game workflow repeats too much content\./);
  assert.doesNotMatch(report, /ENGINEERING_DEFECT|PARTICIPANT_FAILURE|SYSTEM_FAILURE/);
}

async function testFalsePositiveDirectories(): Promise<void> {
  const scanRoot = await createRoot();
  await writeJson(join(scanRoot, 'host-diagnostics', 'manifest.json'), {});
  await writeJson(join(scanRoot, 'game-runs', 'run-a', 'experiment-root.json'), {});
  await writeJson(join(scanRoot, 'agent-workspaces', 'workspace-a', '.agent-workspace-manifest.json'), {});
  await writeJson(join(scanRoot, 'configuration-execution', 'invocation.json'), {});
  await writeJson(join(scanRoot, 'reports', 'result.json'), {});

  const outputPath = join(scanRoot, 'report.md');
  const result = await buildOperationalRunReport({ root: scanRoot, outputPath });
  const report = await readFile(result.reportPath, 'utf8');

  assert.equal(result.workflowCount, 0);
  assert.match(report, /Observed workflow runs: 0/);
}

async function testIncompleteHistoricalAttempt(): Promise<void> {
  const scanRoot = await createRoot();
  const runRoot = join(scanRoot, 'problem-agnostic-agent-solution-loop-instance-009');
  await writeJson(join(runRoot, 'source/observable-payload.json'), { entries: [] });
  await mkdir(join(scanRoot, 'problem-agnostic-agent-solution-loop-instance-009-host-diagnostics'), { recursive: true });

  const outputPath = join(scanRoot, 'report.md');
  const result = await buildOperationalRunReport({ root: scanRoot, outputPath });
  const report = await readFile(result.reportPath, 'utf8');

  assert.equal(result.workflowCount, 1);
  assert.match(report, /Status: INCOMPLETE/);
  assert.match(report, /Terminal route \/ workflow outcome: NOT RECORDED/);
  assert.match(report, /Last available artifact: source\/observable-payload\.json/);
  assert.doesNotMatch(report, /PARTICIPANT_FAILURE|SYSTEM_FAILURE|Agent crashed|Human aborted/);
}

async function testWorkflowRecursionStopsAtRoot(): Promise<void> {
  const scanRoot = await createRoot();
  const runRoot = join(scanRoot, 'p2-run', 'round-1');
  await writeJson(join(runRoot, 'problem-package.json'), { problem: { statement: 'nested workflow' } });
  await writeJson(join(runRoot, 'source/observable-payload.json'), { entries: [] });
  await writeJson(join(runRoot, 'child', 'decision.json'), { route: 'DEFER' });

  const outputPath = join(scanRoot, 'report.md');
  const result = await buildOperationalRunReport({ root: scanRoot, outputPath });
  const report = await readFile(result.reportPath, 'utf8');

  assert.equal(result.workflowCount, 1);
  assert.match(report, /## 1\. p2-run\/round-1/);
  assert.doesNotMatch(report, /p2-run\/round-1\/child/);
}

async function createStructuredTerminalWorkflow(input: {
  scanRoot: string;
  identity: string;
  executionTrace: Record<string, unknown>;
  includeResult?: boolean;
}): Promise<void> {
  const runRoot = join(input.scanRoot, input.identity);
  await createProblemPackage(runRoot);
  await writeJson(join(runRoot, 'source/observable-payload.json'), { entries: [] });
  if (input.includeResult !== false) {
    await writeJson(join(runRoot, 'solution-agent/result.json'), { status: 'OPTIONS' });
  }
  await writeJson(join(runRoot, 'solution-agent/execution-trace.json'), input.executionTrace);
}

async function testRecoveredStructuredTerminalDelivery(): Promise<void> {
  const scanRoot = await createRoot();
  await createStructuredTerminalWorkflow({
    scanRoot,
    identity: 'recovered-run',
    executionTrace: recoveredExecutionTrace(),
  });

  const outputPath = join(scanRoot, 'report.md');
  const report = await readFile((await buildOperationalRunReport({ root: scanRoot, outputPath })).reportPath, 'utf8');

  assert.match(report, /Structured terminal delivery/);
  assert.match(report, /First attempt: ENVELOPE_FAILURE/);
  assert.match(report, /Bounded retransmission: SUCCEEDED/);
  assert.match(report, /Final structured output: VALID/);
  assert.match(report, /solution-agent\/execution-trace\.json/);
  assert.doesNotMatch(report, /terminal-attempt-/);
}

async function testFailClosedStructuredTerminalDelivery(): Promise<void> {
  const scanRoot = await createRoot();
  await createStructuredTerminalWorkflow({
    scanRoot,
    identity: 'fail-closed-run',
    executionTrace: failClosedExecutionTrace(),
    includeResult: false,
  });
  await writeJson(join(scanRoot, 'fail-closed-run', 'workflow-outcome.json'), {
    outcome: 'PARTICIPANT_FAILURE',
    failedStage: 'SOLUTION',
    route: 'DEFER',
    participantErrorKind: 'invalid_output',
  });

  const outputPath = join(scanRoot, 'report.md');
  const report = await readFile((await buildOperationalRunReport({ root: scanRoot, outputPath })).reportPath, 'utf8');

  assert.match(report, /First attempt: ENVELOPE_FAILURE/);
  assert.match(report, /Bounded retransmission: SCHEMA_FAILURE/);
  assert.match(report, /Final structured output: FAILED/);
}

function acceptanceRejectedAfterRetransmissionTrace(): Record<string, unknown> {
  return createExecutionTrace([
    { type: 'process_start', elapsedMs: 0, attempt: 0 },
    {
      type: 'participant_terminal_validation',
      elapsedMs: 100,
      attempt: 0,
      envelopeValid: false,
      schemaValidationAttempted: false,
      accepted: false,
      envelopeFailureReason: 'INVALID_JSON',
    },
    {
      type: 'participant_envelope_retransmission_requested',
      elapsedMs: 101,
      retransmissionAttempt: 1,
      failureClass: 'ENVELOPE_FAILURE',
      sameThread: true,
      timeoutMs: 60_000,
      participantCapability: 'SAME_THREAD_CONTINUATION',
    },
    {
      type: 'participant_envelope_retransmission_completed',
      elapsedMs: 500,
      retransmissionAttempt: 1,
      runtimeOutcome: 'COMPLETED',
    },
    {
      type: 'participant_terminal_validation',
      elapsedMs: 501,
      attempt: 1,
      envelopeValid: true,
      schemaValidationAttempted: true,
      schemaValid: true,
      accepted: false,
    },
  ]);
}

async function testRetransmissionSucceededDespiteAcceptanceRejection(): Promise<void> {
  const scanRoot = await createRoot();
  await createStructuredTerminalWorkflow({
    scanRoot,
    identity: 'acceptance-rejected-run',
    executionTrace: acceptanceRejectedAfterRetransmissionTrace(),
    includeResult: false,
  });

  const outputPath = join(scanRoot, 'report.md');
  const report = await readFile((await buildOperationalRunReport({ root: scanRoot, outputPath })).reportPath, 'utf8');

  assert.match(report, /Bounded retransmission: SUCCEEDED/);
  assert.match(report, /Final structured output: FAILED/);
}

async function testStructuredTerminalDeliveryAggregates(): Promise<void> {
  const scanRoot = await createRoot();
  await createStructuredTerminalWorkflow({
    scanRoot,
    identity: 'first-pass-success',
    executionTrace: firstPassSuccessExecutionTrace(),
  });
  await createStructuredTerminalWorkflow({
    scanRoot,
    identity: 'recovered-success',
    executionTrace: recoveredExecutionTrace(),
  });
  await createStructuredTerminalWorkflow({
    scanRoot,
    identity: 'fail-closed-schema',
    executionTrace: failClosedExecutionTrace(),
    includeResult: false,
  });

  const outputPath = join(scanRoot, 'report.md');
  const result = await buildOperationalRunReport({ root: scanRoot, outputPath });
  const report = await readFile(result.reportPath, 'utf8');

  assert.equal(result.workflowCount, 3);
  assert.match(report, /First-pass structured-output successes: 1/);
  assert.match(report, /First-pass envelope failures: 2/);
  assert.match(report, /Retransmissions attempted: 2/);
  assert.match(report, /Retransmissions succeeded: 1/);
  assert.match(report, /Final structured-output successes: 2/);
}

async function createArchiveFixtureRepository(): Promise<{
  repositoryRoot: string;
  sessionRoot: string;
  sessionRelative: string;
}> {
  const repositoryRoot = await createRoot();
  const sessionRoot = join(repositoryRoot, '.tmp', 'evolution', 'archive-session');
  const runRoot = join(sessionRoot, 'problem-agnostic-agent-solution-loop-instance-012');
  await createProblemPackage(runRoot);
  await writeJson(join(runRoot, 'solution-agent/result.json'), { status: 'OPTIONS' });
  await writeJson(join(runRoot, 'reviewer-agent/review.json'), { decision: 'ACCEPT_OPTION' });
  await writeJson(join(runRoot, 'decision.json'), {
    route: 'READY_FOR_CONFIG_EXECUTION',
    reasonCode: 'ACCEPTED_CONFIGURATION_SCOPE',
  });
  await writeJson(join(runRoot, 'source/observable-payload.json'), { entries: [] });
  return {
    repositoryRoot,
    sessionRoot,
    sessionRelative: '.tmp/evolution/archive-session',
  };
}

async function testArchiveCreationAndIndexes(): Promise<void> {
  const fixture = await createArchiveFixtureRepository();
  const result = await archiveOperationalRunReport({
    repositoryRoot: fixture.repositoryRoot,
    root: fixture.sessionRelative,
  });

  assert.match(result.reportId, /^ae-report-[a-f0-9]{16}$/);
  assert.equal(result.workflowCount, 1);
  const reportJson = JSON.parse(await readFile(result.reportJsonPath, 'utf8')) as Record<string, unknown>;
  const reportMarkdown = await readFile(result.reportMarkdownPath, 'utf8');
  const runReportsIndex = await readFile(result.runReportsIndexPath, 'utf8');
  const topIndex = await readFile(result.topLevelIndexPath, 'utf8');

  assert.equal(reportJson.schemaVersion, 'auto-evolution-operational-run-report-v1');
  assert.equal(reportJson.reportId, result.reportId);
  assert.equal(reportJson.sourceRoot, fixture.sessionRelative);
  assert.match(reportMarkdown, new RegExp(`Report ID: ${result.reportId}`));
  assert.match(reportMarkdown, /Observed workflow runs: 1/);
  assert.match(reportMarkdown, /Artifact reference retention/);
  assert.match(runReportsIndex, /total reports: 1/);
  assert.match(runReportsIndex, new RegExp(`${result.reportId}/report\\.md`));
  assert.match(topIndex, /# Auto Evolution Operational Index/);
  assert.match(topIndex, /total: 1/);
  assert.match(topIndex, /run-reports\/index\.md/);
  assert.match(topIndex, /human-follow-up/);
}

async function testArchiveStableIdentity(): Promise<void> {
  const fixture = await createArchiveFixtureRepository();
  const first = await archiveOperationalRunReport({
    repositoryRoot: fixture.repositoryRoot,
    root: fixture.sessionRelative,
  });
  const second = await archiveOperationalRunReport({
    repositoryRoot: fixture.repositoryRoot,
    root: fixture.sessionRelative,
  });

  assert.equal(second.reportId, first.reportId);
  assert.equal(second.createdAt, first.createdAt);
  assert.equal(second.reusedCreatedAt, true);
  const entries = await readdir(join(fixture.repositoryRoot, 'artifacts/evolution/run-reports'), { withFileTypes: true });
  assert.equal(entries.filter(entry => entry.isDirectory()).length, 1);
}

async function testArchiveChangedSummaryNewIdentity(): Promise<void> {
  const fixture = await createArchiveFixtureRepository();
  const first = await archiveOperationalRunReport({
    repositoryRoot: fixture.repositoryRoot,
    root: fixture.sessionRelative,
  });
  await writeJson(
    join(fixture.sessionRoot, 'problem-agnostic-agent-solution-loop-instance-012', 'decision.json'),
    {
      route: 'DEFER',
      reasonCode: 'REVIEW_REJECTED',
    },
  );
  const second = await archiveOperationalRunReport({
    repositoryRoot: fixture.repositoryRoot,
    root: fixture.sessionRelative,
  });

  assert.notEqual(second.reportId, first.reportId);
  const entries = await readdir(join(fixture.repositoryRoot, 'artifacts/evolution/run-reports'), { withFileTypes: true });
  assert.equal(entries.filter(entry => entry.isDirectory()).length, 2);
}

async function testArchiveJsonMarkdownParity(): Promise<void> {
  const fixture = await createArchiveFixtureRepository();
  const result = await archiveOperationalRunReport({
    repositoryRoot: fixture.repositoryRoot,
    root: fixture.sessionRelative,
  });
  const report = JSON.parse(await readFile(result.reportJsonPath, 'utf8')) as {
    workflows: Array<{
      problemStatement: string | null;
      status: string;
      reviewerDecision: string | null;
      terminalRoute: string | null;
      reason: string | null;
      failedStage: string | null;
      participantErrorKind: string | null;
    }>;
  };
  const markdown = await readFile(result.reportMarkdownPath, 'utf8');
  const workflow = report.workflows[0];
  assert.ok(workflow);
  assert.match(markdown, new RegExp(`Problem statement: ${workflow.problemStatement}`));
  assert.match(markdown, new RegExp(`Status: ${workflow.status}`));
  assert.match(markdown, new RegExp(`Reviewer decision: ${workflow.reviewerDecision}`));
  assert.match(markdown, new RegExp(`Terminal route / workflow outcome: ${workflow.terminalRoute}`));
  assert.match(markdown, new RegExp(`Reason: ${workflow.reason}`));
}

async function testArchiveMultipleWorkflows(): Promise<void> {
  const repositoryRoot = await createRoot();
  const sessionRelative = '.tmp/evolution/multi-round-session';
  await writeJson(join(repositoryRoot, sessionRelative, 'p2-run', 'round-1', 'decision.json'), {
    route: 'DEFER',
    reasonCode: 'INSUFFICIENT_EVIDENCE',
  });
  await writeJson(join(repositoryRoot, sessionRelative, 'p2-run', 'round-2', 'decision.json'), {
    route: 'SKIP',
    reasonCode: 'NO_PROPOSAL',
  });

  const result = await archiveOperationalRunReport({
    repositoryRoot,
    root: sessionRelative,
  });
  const report = JSON.parse(await readFile(result.reportJsonPath, 'utf8')) as {
    workflowCount: number;
    workflows: Array<{ identity: string }>;
  };
  assert.equal(result.workflowCount, 2);
  assert.equal(report.workflowCount, 2);
  assert.deepEqual(report.workflows.map(workflow => workflow.identity), [
    'p2-run/round-1',
    'p2-run/round-2',
  ]);
}

async function testObservabilityIndexRebuild(): Promise<void> {
  const fixture = await createArchiveFixtureRepository();
  const archived = await archiveOperationalRunReport({
    repositoryRoot: fixture.repositoryRoot,
    root: fixture.sessionRelative,
  });
  await rm(archived.runReportsIndexPath, { force: true });
  await rm(archived.topLevelIndexPath, { force: true });

  const rebuilt = await buildOperationalObservabilityIndex({ repositoryRoot: fixture.repositoryRoot });
  const runReportsIndex = await readFile(rebuilt.runReportsIndexPath, 'utf8');
  const topIndex = await readFile(rebuilt.topLevelIndexPath, 'utf8');
  assert.match(runReportsIndex, /total reports: 1/);
  assert.match(runReportsIndex, new RegExp(archived.reportId));
  assert.match(topIndex, /total: 1/);
  assert.match(topIndex, new RegExp(archived.reportId));
}

async function testInvalidReportSidecarFailsClosed(): Promise<void> {
  const fixture = await createArchiveFixtureRepository();
  await archiveOperationalRunReport({
    repositoryRoot: fixture.repositoryRoot,
    root: fixture.sessionRelative,
  });

  const badSchemaDir = join(fixture.repositoryRoot, 'artifacts/evolution/run-reports', 'ae-report-badschema000');
  await mkdir(badSchemaDir, { recursive: true });
  await writeJson(join(badSchemaDir, 'report.json'), {
    schemaVersion: 'wrong-schema',
    reportId: 'ae-report-badschema000',
    createdAt: '2026-01-01T00:00:00.000Z',
    sourceRoot: '.tmp/evolution/x',
    workflowCount: 0,
    workflows: [],
  });
  await assert.rejects(
    () => buildOperationalObservabilityIndex({ repositoryRoot: fixture.repositoryRoot }),
    /wrong schemaVersion/,
  );
  await rm(badSchemaDir, { recursive: true, force: true });

  const mismatchDir = join(fixture.repositoryRoot, 'artifacts/evolution/run-reports', 'ae-report-mismatch0000');
  await mkdir(mismatchDir, { recursive: true });
  await writeJson(join(mismatchDir, 'report.json'), {
    schemaVersion: 'auto-evolution-operational-run-report-v1',
    reportId: 'ae-report-otherid000000',
    createdAt: '2026-01-01T00:00:00.000Z',
    sourceRoot: '.tmp/evolution/x',
    workflowCount: 0,
    workflows: [],
  });
  await assert.rejects(
    () => buildOperationalObservabilityIndex({ repositoryRoot: fixture.repositoryRoot }),
    /directory\/reportId mismatch/,
  );
  await rm(mismatchDir, { recursive: true, force: true });

  const malformedDir = join(fixture.repositoryRoot, 'artifacts/evolution/run-reports', 'ae-report-malformed000');
  await mkdir(malformedDir, { recursive: true });
  await writeFile(join(malformedDir, 'report.json'), '{not-json', 'utf8');
  await assert.rejects(
    () => buildOperationalObservabilityIndex({ repositoryRoot: fixture.repositoryRoot }),
    /invalid operational run report JSON/,
  );
}

async function testArchiveDoesNotMutateHumanFollowup(): Promise<void> {
  const fixture = await createArchiveFixtureRepository();
  const itemDir = join(fixture.repositoryRoot, 'artifacts/evolution/human-follow-up/items', 'item-preserve');
  await mkdir(itemDir, { recursive: true });
  await writeFile(join(itemDir, 'item.json'), '{"keep":true}\n', 'utf8');
  const before = await readFile(join(itemDir, 'item.json'), 'utf8');

  await archiveOperationalRunReport({
    repositoryRoot: fixture.repositoryRoot,
    root: fixture.sessionRelative,
  });
  await buildOperationalObservabilityIndex({ repositoryRoot: fixture.repositoryRoot });

  const after = await readFile(join(itemDir, 'item.json'), 'utf8');
  assert.equal(after, before);
  const itemEntries = await readdir(join(fixture.repositoryRoot, 'artifacts/evolution/human-follow-up/items'));
  assert.deepEqual(itemEntries, ['item-preserve']);
}

async function testArchiveDoesNotCopyRawArtifacts(): Promise<void> {
  const fixture = await createArchiveFixtureRepository();
  const result = await archiveOperationalRunReport({
    repositoryRoot: fixture.repositoryRoot,
    root: fixture.sessionRelative,
  });
  const reportEntries = await readdir(result.reportDirectory);
  assert.deepEqual(reportEntries.sort(), ['report.json', 'report.md']);
  await assert.rejects(() => stat(join(result.reportDirectory, 'solution-agent/result.json')));
  await assert.rejects(() => stat(join(result.reportDirectory, 'reviewer-agent/review.json')));
  await assert.rejects(() => stat(join(result.reportDirectory, 'decision.json')));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runOperationalRunReportTests()
    .then(() => console.log('operationalRunReport.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
