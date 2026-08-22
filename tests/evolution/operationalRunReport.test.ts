import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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

export async function runOperationalRunReportTests(): Promise<void> {
  await testReadyForConfigExecution();
  await testNestedRoundOne();
  await testProblemPackageOnlyIsNotWorkflow();
  await testTerminalWorkflowSignatures();
  await testNestedRoundPair();
  await testIncompleteNestedWorkflow();
  await testFalsePositiveDirectories();
  await testParticipantFailure();
  await testIncompleteHistoricalAttempt();
  await testWorkflowRecursionStopsAtRoot();
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
  assert.match(report, /Terminal outcome: NOT RECORDED/);
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
  assert.match(report, /Terminal outcome: NOT RECORDED/);
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
  assert.match(report, /Terminal outcome: NOT RECORDED/);
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

if (import.meta.url === `file://${process.argv[1]}`) {
  runOperationalRunReportTests()
    .then(() => console.log('operationalRunReport.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
