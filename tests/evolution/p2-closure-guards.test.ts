import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateProblemPackage } from '../../src/evolution/problemPackageContract';
import { validateSolutionDecision, type SolutionDecisionV1 } from '../../src/evolution/solutionDecisionContract';
import type { ProblemAgnosticAgentSolutionLoopResult } from '../../scripts/evolution/runProblemAgnosticAgentSolutionLoop';
import {
  runMultiRoundExecutionValidation,
  type MultiRoundExecutionValidationDependencies,
  type MultiRoundLoopInput,
} from '../../scripts/evolution/multiRoundExecutionValidation';

const configPath = 'src/data/lines/family-life.json';
const problemId = 'problem-hypothesis-000001';

function readyDecision(): SolutionDecisionV1 {
  return validateSolutionDecision({
    schemaVersion: 'solution-decision-v1',
    problemId,
    route: 'READY_FOR_CONFIG_EXECUTION',
    reasonCode: 'ACCEPTED_CONFIGURATION_SCOPE',
    inputs: {
      solutionStatus: 'OPTIONS',
      reviewerDecision: 'ACCEPT_OPTION',
      solutionScope: 'configuration',
      reviewScope: 'config_only',
      permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false },
      budget: { actualParticipantJobs: 4, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
}

function completedRound(sourceRunRef: string, experimentRoot: string, decision: SolutionDecisionV1): ProblemAgnosticAgentSolutionLoopResult {
  return {
    status: 'completed',
    sourceRunRef,
    sourceExperimentRootHash: 'a'.repeat(64),
    sourceFingerprintSha256: 'b'.repeat(64),
    feedbackInvocationRef: 'feedback-000001',
    hypothesisInvocationRef: 'hypothesis-000001',
    problemPackagePath: join(experimentRoot, 'problem-package.json'),
    decisionPath: join(experimentRoot, 'decision.json'),
    humanReviewPackagePath: join(experimentRoot, 'human-review-package.md'),
    actualParticipantJobs: decision.inputs.budget.actualParticipantJobs,
    decision,
    solutionInvocationRef: 'solution-agent-000001',
    reviewerInvocationRef: 'solution-reviewer-000001',
    oldInvestigationCalls: 0,
    oldModificationWorkCalls: 0,
    configGameplayExecutionCount: 0,
  };
}

async function writeRoundArtifacts(root: string): Promise<void> {
  const problemPackage = validateProblemPackage({
    schemaVersion: 'problem-package-v1',
    problemId,
    source: { runRef: 'initial-run-000001', observablePayloadRef: 'source/payload.json', externalFeedbackRef: 'feedback.json', improvementHypothesisRef: 'hypotheses.json' },
    problem: { hypothesisId: 'hypothesis-000001', statement: 'A bounded configuration issue.', observedBasis: 'A sealed run.', feedbackRefs: ['feedback'], evidenceRefs: ['entry-000001'], unknowns: [], productSignificance: 'Configuration is player-visible.' },
    authorityRefs: [],
    productSourceFingerprintSha256: 'a'.repeat(64),
    permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false },
  });
  await mkdir(join(root, 'solution-agent'), { recursive: true });
  await mkdir(join(root, 'reviewer-agent'), { recursive: true });
  await writeFile(join(root, 'problem-package.json'), `${JSON.stringify(problemPackage)}\n`);
  await writeFile(join(root, 'solution-agent/result.json'), `${JSON.stringify({
    schemaVersion: 'solution-work-v1', status: 'OPTIONS', problemId,
    options: [{ optionId: 'option-000001', proposedChange: 'Change one data file.', rationale: 'The data file is the bounded source.', repoRefs: [`${configPath}:1-2`], artifactRefs: [], changeScope: 'configuration', expectedPlayerObservableDifference: 'The data is executable.', risks: [], unknowns: [] }],
    recommendedOptionId: 'option-000001', summary: 'One configuration option.', repoRefs: [configPath], artifactRefs: [],
  })}\n`);
  await writeFile(join(root, 'reviewer-agent/review.json'), `${JSON.stringify({
    schemaVersion: 'solution-review-v1', problemId, decision: 'ACCEPT_OPTION', acceptedOptionId: 'option-000001', scopeAssessment: 'config_only', assessment: 'Accepted.', repoRefs: [], artifactRefs: [], concerns: [],
  })}\n`);
}

async function createWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'p2-closure-workspace-'));
  await mkdir(join(root, 'src/data/lines'), { recursive: true });
  await mkdir(join(root, 'src/core'), { recursive: true });
  await writeFile(join(root, configPath), '{"choices":[{"id":"old"}]}\n');
  await writeFile(join(root, 'src/core/runtime.ts'), 'export const runtime = true;\n');
  return root;
}

async function runGuardScenario(input: {
  writeWorkspace: boolean;
  writeAuthoritative: boolean;
}): Promise<{ result: Awaited<ReturnType<typeof runMultiRoundExecutionValidation>>; calls: string[] }> {
  const workspaceRoot = await createWorkspace();
  const authoritativeRoot = await createWorkspace();
  const calls: string[] = [];
  const root = await mkdtemp(join(tmpdir(), 'p2-closure-guard-run-'));
  const dependencies: MultiRoundExecutionValidationDependencies = {
    preflightInitialSource: async () => ({ sourceRunRef: 'initial-run-000001', sourceRoot: '/sealed/initial', experimentRootHash: 'c'.repeat(64), observablePayloadHash: 'd'.repeat(64), sourceFingerprintSha256: 'e'.repeat(64) }),
    materializeEvolutionWorkspace: async () => ({ workspaceRoot, workspaceBaselineFingerprintSha256: 'f'.repeat(64), manifestPath: join(workspaceRoot, 'manifest.json') }),
    runSingleRound: async (round: MultiRoundLoopInput) => {
      calls.push(`round-${round.round}`);
      if (round.round === 1) await writeRoundArtifacts(round.experimentRoot);
      const decision = round.round === 1 ? readyDecision() : validateSolutionDecision({
        schemaVersion: 'solution-decision-v1', problemId: 'problem-not-formed', route: 'SKIP', reasonCode: 'NO_PROPOSAL',
        inputs: { solutionStatus: 'NO_PROPOSAL', reviewerDecision: null, solutionScope: null, reviewScope: null, permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 3, maxParticipantJobs: 4, retryCount: 0 } },
      });
      return completedRound(round.round === 1 ? 'initial-run-000001' : 'resulting-run-000001', round.experimentRoot, decision);
    },
    executeConfiguration: async execution => {
      calls.push('execute');
      if (input.writeWorkspace) await writeFile(join(execution.workspaceRoot, configPath), '{"choices":[{"id":"new"}]}\n');
      if (input.writeAuthoritative) await writeFile(join(authoritativeRoot, 'src/core/runtime.ts'), 'export const runtime = false;\n');
      return { schemaVersion: 'configuration-execution-result-v1', status: 'completed', changedFiles: [configPath], verificationResults: [], deviations: [] };
    },
    verifyWorkspace: async () => { calls.push('verify'); return [{ name: 'focused', status: 'passed', details: 'ok' }]; },
    rerunGame: async () => { calls.push('rerun'); return { runRef: 'resulting-run-000001', outDir: '/sealed/resulting', anchorPath: '/sealed/resulting-anchor.json', observablePayloadHash: 'g'.repeat(64), experimentRootHash: 'h'.repeat(64) }; },
    validateSealedSource: async () => { calls.push('seal'); },
  };
  const result = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-closure-guard-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    authoritativeRoot,
    initialSourceRoot: '/sealed/initial',
    experimentRoot: join(root, 'run'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies,
  });
  return { result, calls };
}

async function main(): Promise<void> {
  const noOp = await runGuardScenario({ writeWorkspace: false, writeAuthoritative: false });
  assert.equal(noOp.result.outcome, 'STOPPED');
  assert.equal(noOp.result.stopReason, 'NO_CONFIGURATION_CHANGE');
  assert.equal(noOp.result.crossRoundTransitions, 0);
  assert.deepEqual(noOp.calls, ['round-1', 'execute']);
  assert.equal(noOp.result.execution?.actualChangedFiles.length, 0);
  assert.equal(noOp.result.rounds[0]?.nextAction, 'STOP');

  const authoritativeMutation = await runGuardScenario({ writeWorkspace: true, writeAuthoritative: true });
  assert.equal(authoritativeMutation.result.outcome, 'STOPPED');
  assert.equal(authoritativeMutation.result.stopReason, 'AUTHORITATIVE_REPOSITORY_CHANGED');
  assert.equal(authoritativeMutation.result.crossRoundTransitions, 0);
  assert.deepEqual(authoritativeMutation.calls, ['round-1', 'execute']);
  assert.deepEqual(authoritativeMutation.result.execution?.actualChangedFiles, [configPath]);
  assert.equal(authoritativeMutation.result.rounds[0]?.nextAction, 'STOP');

  const noOpManifest = JSON.parse(await readFile(noOp.result.manifestPath, 'utf8')) as { outcome: string; stopReason: string };
  assert.equal(noOpManifest.outcome, 'STOPPED');
  assert.equal(noOpManifest.stopReason, 'NO_CONFIGURATION_CHANGE');
  console.log('p2-closure-guards.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
