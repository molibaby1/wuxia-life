import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
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

async function main(): Promise<void> {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'p2-success-workspace-'));
  const authoritativeRoot = await mkdtemp(join(tmpdir(), 'p2-success-authoritative-'));
  await mkdir(join(workspaceRoot, 'src/data/lines'), { recursive: true });
  await mkdir(join(workspaceRoot, 'src/core'), { recursive: true });
  await writeFile(join(workspaceRoot, configPath), '{"choices":[{"id":"old"}]}\n');
  await writeFile(join(workspaceRoot, 'src/core/runtime.ts'), 'export const runtime = true;\n');
  await mkdir(join(authoritativeRoot, 'src/data/lines'), { recursive: true });
  await mkdir(join(authoritativeRoot, 'src/core'), { recursive: true });
  await writeFile(join(authoritativeRoot, configPath), '{"choices":[{"id":"old"}]}\n');
  await writeFile(join(authoritativeRoot, 'src/core/runtime.ts'), 'export const runtime = true;\n');
  const root = await mkdtemp(join(tmpdir(), 'p2-success-path-'));
  const calls: string[] = [];
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
      await writeFile(join(execution.workspaceRoot, configPath), '{"choices":[{"id":"new"}]}\n');
      return { schemaVersion: 'configuration-execution-result-v1', status: 'completed', changedFiles: [configPath], verificationResults: [], deviations: [] };
    },
    verifyWorkspace: async () => { calls.push('verify'); return [{ name: 'focused', status: 'passed', details: 'ok' }, { name: 'typecheck', status: 'passed', details: 'ok' }]; },
    rerunGame: async () => { calls.push('rerun'); return { runRef: 'resulting-run-000001', outDir: '/sealed/resulting', anchorPath: '/sealed/resulting-anchor.json', observablePayloadHash: 'g'.repeat(64), experimentRootHash: 'h'.repeat(64) }; },
    validateSealedSource: async () => { calls.push('seal'); },
  };
  const result = await runMultiRoundExecutionValidation({ multiRoundRunRef: `p2-success-${Date.now()}`, authoritativeRoot, initialSourceRoot: '/sealed/initial', experimentRoot: join(root, 'run'), participant: { executable: process.execPath, buildArgs: () => ['-e', ''] }, dependencies });
  assert.equal(result.outcome, 'CROSS_ROUND_TRANSITION_OBSERVED', result.stopReason);
  assert.equal(result.stopReason, 'ROUND_2_COMPLETED');
  assert.deepEqual(calls, ['round-1', 'execute', 'verify', 'rerun', 'seal', 'round-2']);
  assert.equal(result.rounds[1]?.sourceRunRef, 'resulting-run-000001');
  console.log('p2-success-path.test.ts: ok');
}

main().catch(error => { console.error(error); process.exit(1); });
