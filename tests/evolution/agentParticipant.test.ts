import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import {
  runWorkspaceAgentJob,
  type WorkspaceAgentJobInput,
} from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';
import { parseSolutionWork } from '../../src/evolution/solutionWorkContract';
import { parseSolutionReview } from '../../src/evolution/solutionReviewContract';

const input: WorkspaceAgentJobInput = {
  invocationRef: 'solution-000001',
  role: 'solution',
  workspaceRoot: '',
  prompt: 'Return structured output.',
  traceArtifactPath: '',
};

export async function runAgentParticipantTests(): Promise<void> {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'agent-participant-'));
  const traceInput = (invocationRef: string): WorkspaceAgentJobInput & { traceArtifactPath: string } => ({
    ...input,
    invocationRef,
    workspaceRoot,
    traceArtifactPath: join(workspaceRoot, `${invocationRef}-execution-trace.json`),
  });
  let invocations = 0;
  const success = await runWorkspaceAgentJob(
    traceInput(input.invocationRef),
    {
      executable: process.execPath,
      buildArgs: job => [
        '-e',
        'process.stdout.write(JSON.stringify({ cwd: process.cwd(), prompt: process.argv[1] }));',
        job.prompt,
      ],
      spawnProcess: ((...args: Parameters<typeof spawn>) => {
        invocations += 1;
        return spawn(...args);
      }) as typeof spawn,
    },
  );
  assert.equal(success.ok, true);
  assert.equal(invocations, 1);
  assert.match(success.ok ? success.rawOutput : '', new RegExp(workspaceRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const completedTrace = JSON.parse(await readFile(traceInput(input.invocationRef).traceArtifactPath, 'utf8'));
  assert.equal(completedTrace.schemaVersion, 'participant-execution-trace-v1');
  assert.deepEqual(completedTrace.events.map((event: { seq: number }) => event.seq), [0, 1, 2]);
  assert.deepEqual(completedTrace.events.map((event: { type: string }) => event.type), [
    'process_start',
    'output_activity',
    'process_close',
  ]);
  assert.equal(completedTrace.terminal.outcome, 'completed');
  assert.equal(completedTrace.terminal.lastObservableActivityElapsedMs, completedTrace.events[1].elapsedMs);
  assert.ok(completedTrace.terminal.elapsedMs >= completedTrace.events[1].elapsedMs);
  assert.ok(completedTrace.events.every((event: { elapsedMs: number }, index: number, events: Array<{ elapsedMs: number }>) => (
    index === 0 || event.elapsedMs >= events[index - 1]!.elapsedMs
  )));

  const noOutput = await runWorkspaceAgentJob(
    traceInput('solution-no-output'),
    {
      executable: process.execPath,
      buildArgs: () => ['-e', 'process.exit(0)'],
    },
  );
  assert.equal(noOutput.ok, true);
  const noOutputTrace = JSON.parse(await readFile(traceInput('solution-no-output').traceArtifactPath, 'utf8'));
  assert.deepEqual(noOutputTrace.events.map((event: { type: string }) => event.type), ['process_start', 'process_close']);
  assert.equal(noOutputTrace.terminal.outcome, 'completed');
  assert.equal('lastObservableActivityElapsedMs' in noOutputTrace.terminal, false);

  const buildArgsFailure = await runWorkspaceAgentJob(
    traceInput('solution-build-args-failure'),
    {
      executable: process.execPath,
      buildArgs: () => {
        throw new Error('build args failed');
      },
    },
  );
  assert.equal(buildArgsFailure.ok, false);
  assert.equal(buildArgsFailure.ok ? undefined : buildArgsFailure.errorKind, 'process');
  const buildArgsFailureTrace = JSON.parse(await readFile(traceInput('solution-build-args-failure').traceArtifactPath, 'utf8'));
  assert.deepEqual(buildArgsFailureTrace.events, []);
  assert.equal(buildArgsFailureTrace.terminal.outcome, 'process_error');

  const spawnFailure = await runWorkspaceAgentJob(
    traceInput('solution-spawn-failure'),
    {
      executable: process.execPath,
      buildArgs: () => [],
      spawnProcess: (() => {
        throw new Error('spawn failed');
      }) as typeof spawn,
    },
  );
  assert.equal(spawnFailure.ok, false);
  assert.equal(spawnFailure.ok ? undefined : spawnFailure.errorKind, 'process');
  const spawnFailureTrace = JSON.parse(await readFile(traceInput('solution-spawn-failure').traceArtifactPath, 'utf8'));
  assert.deepEqual(spawnFailureTrace.events, []);
  assert.equal(spawnFailureTrace.terminal.outcome, 'process_error');

  const solutionWork = {
    schemaVersion: 'solution-work-v1',
    status: 'OPTIONS',
    problemId: 'problem-000001',
    options: [{
      optionId: 'option-000001',
      proposedChange: 'Change one authorized setting.',
      rationale: 'It addresses the observed issue.',
      repoRefs: ['src/example.ts'],
      artifactRefs: ['source/observable-payload.json'],
      changeScope: 'configuration',
      expectedPlayerObservableDifference: 'The next run differs visibly.',
      risks: [],
      unknowns: ['Whether the setting is sufficient.'],
    }],
    recommendedOptionId: 'option-000001',
    summary: 'One option.',
    repoRefs: ['src/example.ts'],
    artifactRefs: ['source/observable-payload.json'],
  } as const;
  const solutionOutput = JSON.stringify(solutionWork);
  const solutionWithDiagnostics = await runWorkspaceAgentJob(
    traceInput('solution-000003'),
    {
      executable: process.execPath,
      buildArgs: () => [
        '-e',
        'process.stdout.write(process.argv[1]); process.stderr.write(process.argv[2]);',
        solutionOutput,
        'success diagnostic',
      ],
    },
  );
  assert.equal(solutionWithDiagnostics.ok, true);
  assert.equal(solutionWithDiagnostics.ok ? solutionWithDiagnostics.rawOutput : undefined, solutionOutput);
  assert.deepEqual(solutionWithDiagnostics.ok ? parseSolutionWork(solutionWithDiagnostics.rawOutput) : undefined, solutionWork);

  const solutionReview = {
    schemaVersion: 'solution-review-v1',
    problemId: 'problem-000001',
    decision: 'ACCEPT_OPTION',
    acceptedOptionId: 'option-000001',
    scopeAssessment: 'config_only',
    assessment: 'The option is bounded.',
    repoRefs: ['src/example.ts'],
    artifactRefs: ['source/observable-payload.json'],
    concerns: [],
  } as const;
  const reviewerOutput = JSON.stringify(solutionReview);
  const reviewerWithDiagnostics = await runWorkspaceAgentJob(
    {
      invocationRef: 'reviewer-000001',
      role: 'reviewer',
      workspaceRoot,
      prompt: 'Return structured output.',
    },
    {
      executable: process.execPath,
      buildArgs: () => [
        '-e',
        'process.stdout.write(process.argv[1]); process.stderr.write(process.argv[2]);',
        reviewerOutput,
        'reviewer diagnostic',
      ],
    },
  );
  assert.equal(reviewerWithDiagnostics.ok, true);
  assert.equal(reviewerWithDiagnostics.ok ? reviewerWithDiagnostics.rawOutput : undefined, reviewerOutput);
  assert.deepEqual(reviewerWithDiagnostics.ok ? parseSolutionReview(reviewerWithDiagnostics.rawOutput) : undefined, solutionReview);

  const failure = await runWorkspaceAgentJob(
    traceInput('solution-000002'),
    {
      executable: process.execPath,
      buildArgs: () => ['-e', 'process.stdout.write("partial"); process.stderr.write("failed"); process.exit(3);'],
    },
  );
  assert.equal(failure.ok, false);
  assert.equal(failure.ok ? undefined : failure.errorKind, 'process');
  assert.match(failure.ok ? '' : failure.message, /exited with code 3/);
  assert.equal(failure.ok ? undefined : failure.rawOutput, 'partial\n[stderr]\nfailed');
  const failureTrace = JSON.parse(await readFile(traceInput('solution-000002').traceArtifactPath, 'utf8'));
  assert.equal(failureTrace.terminal.outcome, 'process_error');
  assert.equal(failureTrace.events.at(-1)?.type, 'process_close');

  const timeout = await runWorkspaceAgentJob(
    traceInput('solution-timeout'),
    {
      executable: process.execPath,
      timeoutMs: 250,
      buildArgs: () => ['-e', 'process.stdout.write("tick"); setInterval(() => process.stdout.write("tick"), 10);'],
    },
  );
  assert.equal(timeout.ok, false);
  assert.equal(timeout.ok ? undefined : timeout.errorKind, 'timeout');
  const timeoutTrace = JSON.parse(await readFile(traceInput('solution-timeout').traceArtifactPath, 'utf8'));
  assert.equal(timeoutTrace.terminal.outcome, 'timeout');
  assert.ok(timeoutTrace.terminal.elapsedMs >= 200);
  assert.ok(timeoutTrace.terminal.lastObservableActivityElapsedMs !== undefined);
  assert.ok(timeoutTrace.terminal.lastObservableActivityElapsedMs <= timeoutTrace.terminal.elapsedMs);
  assert.equal(timeoutTrace.events.at(-1)?.type, 'timeout');

  const largeOutput = await runWorkspaceAgentJob(
    traceInput('solution-large-output'),
    {
      executable: process.execPath,
      buildArgs: () => ['-e', 'for (let index = 0; index < 1000; index += 1) process.stdout.write("x");'],
    },
  );
  assert.equal(largeOutput.ok, true);
  const largeOutputTrace = JSON.parse(await readFile(traceInput('solution-large-output').traceArtifactPath, 'utf8'));
  const largeOutputEvents = largeOutputTrace.events.filter((event: { type: string }) => event.type === 'output_activity');
  assert.ok(largeOutputEvents.length < 100);
  assert.equal(largeOutputEvents.reduce((total: number, event: { bytes?: number }) => total + (event.bytes ?? 0), 0), 1000);
  assert.equal(
    largeOutputTrace.terminal.lastObservableActivityElapsedMs,
    largeOutputEvents.at(-1)?.elapsedMs,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAgentParticipantTests()
    .then(() => console.log('agentParticipant.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
