import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateSolutionDecision } from '../../src/evolution/solutionDecisionContract';
import type { ProblemAgnosticAgentSolutionLoopResult } from '../../scripts/evolution/runProblemAgnosticAgentSolutionLoop';
import {
  runMultiRoundExecutionValidation,
  type MultiRoundExecutionValidationDependencies,
} from '../../scripts/evolution/multiRoundExecutionValidation';

const participant = { executable: process.execPath, buildArgs: () => ['-e', ''] };

function normalRoundResult(actualParticipantJobs: number, experimentRoot: string): ProblemAgnosticAgentSolutionLoopResult {
  const decision = validateSolutionDecision({
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
      budget: { actualParticipantJobs, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
  return {
    status: 'completed',
    sourceRunRef: 'initial-run-000001',
    sourceExperimentRootHash: 'a'.repeat(64),
    sourceFingerprintSha256: 'b'.repeat(64),
    feedbackInvocationRef: 'feedback-000001',
    hypothesisInvocationRef: 'hypothesis-000001',
    problemPackagePath: null,
    decisionPath: join(experimentRoot, 'decision.json'),
    humanReviewPackagePath: join(experimentRoot, 'human-review-package.md'),
    actualParticipantJobs,
    decision,
    solutionInvocationRef: null,
    reviewerInvocationRef: null,
    oldInvestigationCalls: 0,
    oldModificationWorkCalls: 0,
    configGameplayExecutionCount: 0,
  };
}

async function writeInvocation(roundRoot: string, relativePath: string, schemaVersion: string): Promise<void> {
  const path = join(roundRoot, relativePath);
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, `${JSON.stringify({ schemaVersion, invocationRef: 'invocation-000001', status: 'completed' })}\n`);
}

async function runAccountingCase(
  name: string,
  runSingleRound: MultiRoundExecutionValidationDependencies['runSingleRound'],
): Promise<{
  round1ParticipantJobs: number;
  totalParticipantJobs: number;
  outcome: string;
  stopReason: string;
}> {
  const root = await mkdtemp(join(tmpdir(), `p2-accounting-${name}-`));
  const authoritativeRoot = join(root, 'authoritative');
  const evolutionWorkspace = join(root, 'evolution-workspace');
  await mkdir(authoritativeRoot, { recursive: true });
  await mkdir(evolutionWorkspace, { recursive: true });
  await writeFile(join(authoritativeRoot, 'product.txt'), 'product\n');
  const dependencies: MultiRoundExecutionValidationDependencies = {
    preflightInitialSource: async () => ({
      sourceRunRef: 'initial-run-000001',
      sourceRoot: join(root, 'sealed'),
      experimentRootHash: 'c'.repeat(64),
      observablePayloadHash: 'd'.repeat(64),
      sourceFingerprintSha256: 'e'.repeat(64),
    }),
    materializeEvolutionWorkspace: async () => ({
      workspaceRoot: evolutionWorkspace,
      workspaceBaselineFingerprintSha256: 'f'.repeat(64),
      manifestPath: join(evolutionWorkspace, '.agent-workspace-manifest.json'),
    }),
    runSingleRound,
  };
  const result = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-accounting-${name}-000001`,
    authoritativeRoot,
    initialSourceRoot: join(root, 'sealed'),
    experimentRoot: join(root, 'run'),
    participant,
    dependencies,
  });
  const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8')) as {
    budget: { round1ParticipantJobs: number; totalParticipantJobs: number };
  };
  return {
    round1ParticipantJobs: manifest.budget.round1ParticipantJobs,
    totalParticipantJobs: manifest.budget.totalParticipantJobs,
    outcome: result.outcome,
    stopReason: result.stopReason,
  };
}

export async function runNormalParticipantAccountingRegression(): Promise<void> {
  const budget = await runAccountingCase('normal', async round => {
    await writeInvocation(round.experimentRoot, 'feedback-runs/initial-run-000001/invocation.json', 'minimal-external-feedback-invocation-v1');
    await writeInvocation(round.experimentRoot, 'hypothesis-runs/initial-run-000001/invocation.json', 'improvement-hypothesis-invocation-v1');
    return normalRoundResult(3, round.experimentRoot);
  });
  assert.equal(budget.round1ParticipantJobs, 3);
  assert.equal(budget.totalParticipantJobs, 3);
  assert.equal(budget.outcome, 'NO_CROSS_ROUND_TRANSITION_OBSERVED');
  assert.equal(budget.stopReason, 'ROUND_1_TERMINAL_NOT_READY');
}

export async function runAbnormalParticipantAccountingRegression(): Promise<void> {
  const budget = await runAccountingCase('abnormal-after-two', async round => {
    await writeInvocation(round.experimentRoot, 'feedback-runs/initial-run-000001/invocation.json', 'minimal-external-feedback-invocation-v1');
    await writeInvocation(round.experimentRoot, 'hypothesis-runs/initial-run-000001/invocation.json', 'improvement-hypothesis-invocation-v1');
    throw new Error('EEXIST: simulated solution workspace materialization failure');
  });
  assert.equal(budget.round1ParticipantJobs, 2);
  assert.equal(budget.totalParticipantJobs, 2);
  assert.equal(budget.outcome, 'STOPPED');
  assert.match(budget.stopReason, /EEXIST/);
}

export async function runZeroParticipantAccountingRegression(): Promise<void> {
  const budget = await runAccountingCase('zero-before-invocation', async round => {
    await mkdir(join(round.experimentRoot, 'feedback-runs/initial-run-000001'), { recursive: true });
    await writeFile(join(round.experimentRoot, 'feedback-runs/initial-run-000001/raw-output.txt'), 'not an invocation');
    await mkdir(join(round.experimentRoot, 'hypothesis-runs/initial-run-000001'), { recursive: true });
    await writeFile(join(round.experimentRoot, 'hypothesis-runs/initial-run-000001/prompt.txt'), 'not an invocation');
    throw new Error('engineering failure before any Participant invocation');
  });
  assert.equal(budget.round1ParticipantJobs, 0);
  assert.equal(budget.totalParticipantJobs, 0);
  assert.equal(budget.outcome, 'STOPPED');
  assert.match(budget.stopReason, /before any Participant invocation/);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  Promise.resolve()
    .then(() => runNormalParticipantAccountingRegression())
    .then(() => runAbnormalParticipantAccountingRegression())
    .then(() => runZeroParticipantAccountingRegression())
    .then(() => console.log('p2-participant-accounting.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
