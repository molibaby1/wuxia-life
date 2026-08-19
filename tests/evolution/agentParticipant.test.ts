import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
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
};

export async function runAgentParticipantTests(): Promise<void> {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'agent-participant-'));
  let invocations = 0;
  const success = await runWorkspaceAgentJob(
    { ...input, workspaceRoot },
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
    { ...input, workspaceRoot, invocationRef: 'solution-000003' },
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
    { ...input, role: 'reviewer', workspaceRoot, invocationRef: 'reviewer-000001' },
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
    { ...input, workspaceRoot, invocationRef: 'solution-000002' },
    {
      executable: process.execPath,
      buildArgs: () => ['-e', 'process.stdout.write("partial"); process.stderr.write("failed"); process.exit(3);'],
    },
  );
  assert.equal(failure.ok, false);
  assert.equal(failure.ok ? undefined : failure.errorKind, 'process');
  assert.match(failure.ok ? '' : failure.message, /exited with code 3/);
  assert.equal(failure.ok ? undefined : failure.rawOutput, 'partial\n[stderr]\nfailed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAgentParticipantTests()
    .then(() => console.log('agentParticipant.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
