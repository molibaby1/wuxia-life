import assert from 'node:assert/strict';
import { lstat, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateProblemPackage } from '../../src/evolution/problemPackageContract';
import { validateSolutionDecision, type SolutionDecisionV1 } from '../../src/evolution/solutionDecisionContract';
import { validateSolutionWork } from '../../src/evolution/solutionWorkContract';
import {
  runProblemAgnosticAgentSolutionLoop,
  type ProblemAgnosticAgentSolutionLoopResult,
} from '../../scripts/evolution/runProblemAgnosticAgentSolutionLoop';
import {
  deriveAllowedWritePaths,
  snapshotWorkspace,
  verifyActualChangedFiles,
} from '../../scripts/evolution/executionScopeVerifier';
import {
  defaultVerifyWorkspace,
  runMultiRoundExecutionValidation,
  type MultiRoundExecutionValidationDependencies,
  type MultiRoundLoopInput,
} from '../../scripts/evolution/multiRoundExecutionValidation';
import {
  captureAuthoritativeFingerprint,
  prepareAgentWorkspace,
} from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import { emptyMatchingPlayerSurfaceArtifacts } from '../../scripts/evolution/causalAttribution/emptyMatchingPlayerSurfaceArtifacts';
import { sha256Hex } from '../../scripts/evolution/phase0/provenance';

const READY_PROBLEM_ID = 'problem-hypothesis-000001';
const CONFIG_PATH = 'src/data/lines/family-life.json';

function readyDecision(): SolutionDecisionV1 {
  return validateSolutionDecision({
    schemaVersion: 'solution-decision-v1',
    problemId: READY_PROBLEM_ID,
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
}

function readySolutionWork(): Record<string, unknown> {
  return {
    schemaVersion: 'solution-work-v1',
    status: 'OPTIONS',
    problemId: READY_PROBLEM_ID,
    options: [{
      optionId: 'option-000001',
      proposedChange: 'Add the missing stable configuration identifier.',
      rationale: 'The configuration file is the narrow source of the observed issue.',
      repoRefs: [`${CONFIG_PATH}:1-3`],
      artifactRefs: [],
      changeScope: 'configuration',
      expectedPlayerObservableDifference: 'The affected choice becomes executable.',
      risks: [],
      unknowns: [],
    }],
    recommendedOptionId: 'option-000001',
    summary: 'One bounded configuration option.',
    repoRefs: [CONFIG_PATH],
    artifactRefs: [],
  };
}

function readySolutionReview(): Record<string, unknown> {
  return {
    schemaVersion: 'solution-review-v1',
    problemId: READY_PROBLEM_ID,
    decision: 'ACCEPT_OPTION',
    acceptedOptionId: 'option-000001',
    scopeAssessment: 'config_only',
    assessment: 'The option is supported and stays inside the configuration boundary.',
    repoRefs: [],
    artifactRefs: [],
    concerns: [],
  };
}

function completedRound(input: {
  sourceRunRef: string;
  decision: SolutionDecisionV1;
  experimentRoot: string;
}): ProblemAgnosticAgentSolutionLoopResult {
  return {
    status: 'completed',
    sourceRunRef: input.sourceRunRef,
    sourceExperimentRootHash: 'source-root-hash',
    sourceFingerprintSha256: 'source-fingerprint-hash',
    feedbackInvocationRef: 'feedback-000001',
    hypothesisInvocationRef: 'hypothesis-000001',
    problemPackagePath: join(input.experimentRoot, 'problem-package.json'),
    decisionPath: join(input.experimentRoot, 'decision.json'),
    humanReviewPackagePath: join(input.experimentRoot, 'human-review-package.md'),
    actualParticipantJobs: input.decision.inputs.budget.actualParticipantJobs,
    decision: input.decision,
    solutionInvocationRef: 'solution-agent-000001',
    reviewerInvocationRef: 'solution-reviewer-000001',
    oldInvestigationCalls: 0,
    oldModificationWorkCalls: 0,
    configGameplayExecutionCount: 0,
  };
}

function skippedRound(input: {
  sourceRunRef: string;
  experimentRoot: string;
}): ProblemAgnosticAgentSolutionLoopResult {
  return completedRound({
    sourceRunRef: input.sourceRunRef,
    experimentRoot: input.experimentRoot,
    decision: validateSolutionDecision({
      schemaVersion: 'solution-decision-v1',
      problemId: 'problem-not-formed',
      route: 'SKIP',
      reasonCode: 'NO_PROPOSAL',
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
        budget: { actualParticipantJobs: 3, maxParticipantJobs: 4, retryCount: 0 },
      },
    }),
  });
}

async function writeReadyArtifacts(root: string): Promise<void> {
  const problemPackage = validateProblemPackage({
    schemaVersion: 'problem-package-v1',
    problemId: READY_PROBLEM_ID,
    source: {
      runRef: 'initial-run-000001',
      observablePayloadRef: 'source/observable-payload.json',
      externalFeedbackRef: 'feedback-runs/initial-run-000001/feedback.json',
      improvementHypothesisRef: 'hypothesis-runs/initial-run-000001/hypotheses.json',
    },
    problem: {
      hypothesisId: 'hypothesis-000001',
      statement: 'A bounded configuration issue was observed.',
      observedBasis: 'A sealed player-visible run.',
      feedbackRefs: ['overallImpression'],
      evidenceRefs: ['entry-000001'],
      unknowns: [],
      productSignificance: 'The configuration path is player-visible.',
    },
    authorityRefs: [],
    productSourceFingerprintSha256: 'a'.repeat(64),
    permissions: {
      authoritativeProductWrite: false,
      sandboxWrite: true,
      productExecution: false,
      codeExecution: false,
    },
  });
  await writeFile(join(root, 'problem-package.json'), `${JSON.stringify(problemPackage)}\n`);
  await mkdir(join(root, 'solution-agent'), { recursive: true });
  await mkdir(join(root, 'reviewer-agent'), { recursive: true });
  await writeFile(join(root, 'solution-agent/result.json'), `${JSON.stringify(readySolutionWork())}\n`);
  await writeFile(join(root, 'reviewer-agent/review.json'), `${JSON.stringify(readySolutionReview())}\n`);
}

async function createWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'p2-evolution-workspace-'));
  await mkdir(join(root, 'src/data/lines'), { recursive: true });
  await mkdir(join(root, 'src/core'), { recursive: true });
  await writeFile(join(root, CONFIG_PATH), '{"choices":[{"id":"old"}]}\n');
  await writeFile(join(root, 'src/core/runtime.ts'), 'export const runtime = true;\n');
  return root;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function runHumanFollowupPersistenceRegression(): Promise<void> {
  const authoritativeRoot = await createWorkspace();
  const evolutionWorkspaceRoot = await createWorkspace();
  const initialSourceRoot = await mkdtemp(join(tmpdir(), 'p2-human-followup-source-'));
  const matching = emptyMatchingPlayerSurfaceArtifacts();
  await writeJson(join(initialSourceRoot, 'internal/player-surface-source.json'), matching.surface);
  await mkdir(join(initialSourceRoot, 'reviewer-input'), { recursive: true });
  await writeFile(join(initialSourceRoot, 'reviewer-input/observable-payload.json'), matching.observableBytes);
  const outerRoot = await mkdtemp(join(tmpdir(), 'p2-human-followup-run-'));
  const multiRoundRunRef = 'p2-human-followup-000001';
  const calls: string[] = [];
  const authoritativeFingerprintBefore = await captureAuthoritativeFingerprint(authoritativeRoot);
  const observablePayloadHash = sha256Hex(matching.observableBytes);

  const result = await runMultiRoundExecutionValidation({
    multiRoundRunRef,
    authoritativeRoot,
    initialSourceRoot,
    experimentRoot: join(outerRoot, 'run'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    participantMode: 'local-subagent',
    dependencies: {
      preflightInitialSource: async () => ({
        sourceRunRef: 'initial-run-000001',
        sourceRoot: initialSourceRoot,
        experimentRootHash: 'a'.repeat(64),
        observablePayloadHash,
        sourceFingerprintSha256: 'c'.repeat(64),
      }),
      materializeEvolutionWorkspace: async () => ({
        workspaceRoot: evolutionWorkspaceRoot,
        workspaceBaselineFingerprintSha256: 'evolution-baseline',
        manifestPath: join(evolutionWorkspaceRoot, '.agent-workspace-manifest.json'),
      }),
      runSingleRound: async round => {
        calls.push(`round-${round.round}`);
        return runProblemAgnosticAgentSolutionLoop({
          repositoryRoot: round.repositoryRoot,
          humanFollowupRoot: round.humanFollowupRoot,
          workflowInstanceRef: round.workflowInstanceRef,
          fixedSourceRoot: round.fixedSourceRoot,
          experimentRoot: round.experimentRoot,
          workspaceAgentParticipant: round.participant,
          participantMode: round.participantMode,
          authorityRefs: [],
          dependencies: {
            preflightFixedSource: async () => ({
              sourceRunRef: 'initial-run-000001',
              sourceRoot: initialSourceRoot,
              experimentRootHash: 'a'.repeat(64),
              observablePayloadHash,
              sourceFingerprintSha256: 'c'.repeat(64),
            }),
            runExternalFeedback: async options => {
              await writeJson(join(options.outRoot!, 'feedback-runs/initial-run-000001/feedback.json'), { observed: true });
              return {
                runRef: options.runRef,
                invocationRef: 'feedback-000001',
                phase0RunPath: initialSourceRoot,
                feedbackDir: join(options.outRoot!, 'feedback-runs/initial-run-000001'),
                humanReportPath: join(options.outRoot!, 'feedback-runs/initial-run-000001/human-review.md'),
                observablePayloadHash: 'b'.repeat(64),
                experimentRootHash: 'a'.repeat(64),
              };
            },
            runImprovementHypothesis: async options => {
              await writeJson(join(options.outRoot!, 'hypothesis-runs/initial-run-000001/hypotheses.json'), {
                hypotheses: [{
                  hypothesis: 'A bounded observed problem.',
                  observedBasis: 'Observed in the fixed source.',
                  feedbackRefs: ['overallImpression'],
                  evidenceRefs: [],
                  unknowns: ['Cause remains unknown.'],
                  productSignificance: 'Human review may be useful.',
                }],
              });
              return {
                runRef: options.runRef,
                feedbackInvocationRef: 'feedback-000001',
                hypothesisInvocationRef: 'hypothesis-000001',
                hypothesisDir: join(options.outRoot!, 'hypothesis-runs/initial-run-000001'),
                humanReportPath: join(options.outRoot!, 'hypothesis-runs/initial-run-000001/human-review.md'),
                experimentRootHash: 'a'.repeat(64),
                observablePayloadHash: 'b'.repeat(64),
                feedbackHash: 'd'.repeat(64),
              };
            },
            runSolutionAgent: async job => {
              const solution = validateSolutionWork({
                schemaVersion: 'solution-work-v1',
                status: 'ESCALATE',
                problemId: 'problem-hypothesis-000001',
                options: [],
                summary: 'Human review is required.',
                repoRefs: [],
                artifactRefs: [],
              });
              await writeJson(join(job.destinationRoot, 'result.json'), solution);
              return {
                ok: true,
                result: solution,
                invocationPath: join(job.destinationRoot, 'invocation.json'),
                rawOutputPath: join(job.destinationRoot, 'raw-output.txt'),
                resultPath: join(job.destinationRoot, 'result.json'),
              };
            },
          },
        });
      },
      executeConfiguration: async () => {
        calls.push('execute');
        throw new Error('configuration execution must not run for Human escalation');
      },
    },
  });

  assert.equal(result.outcome, 'NO_CROSS_ROUND_TRANSITION_OBSERVED');
  assert.equal(result.stopReason, 'ROUND_1_TERMINAL_NOT_READY');
  assert.deepEqual(calls, ['round-1']);
  assert.equal(result.execution, null);
  assert.deepEqual(result.rounds.map(round => ({ round: round.round, terminalRoute: round.terminalRoute, nextAction: round.nextAction })), [
    { round: 1, terminalRoute: 'ESCALATE_HUMAN', nextAction: 'STOP' },
  ]);

  const authoritativeItemsRoot = join(authoritativeRoot, 'artifacts/evolution/human-follow-up/items');
  const authoritativeItems = await readdir(authoritativeItemsRoot);
  assert.equal(authoritativeItems.length, 1);
  const retainedItem = JSON.parse(await readFile(join(authoritativeItemsRoot, authoritativeItems[0]!, 'item.json'), 'utf8')) as {
    provenance: { workflowInstanceRef: string };
  };
  assert.equal(retainedItem.provenance.workflowInstanceRef, multiRoundRunRef);
  assert.equal(
    await pathExists(join(authoritativeItemsRoot, authoritativeItems[0]!, 'item.json')),
    true,
  );
  assert.equal(
    await pathExists(join(evolutionWorkspaceRoot, 'artifacts/evolution/human-follow-up/items')),
    false,
  );
  assert.equal(await captureAuthoritativeFingerprint(authoritativeRoot), authoritativeFingerprintBefore);
}

async function fixedDependencies(input: {
  workspaceRoot: string;
  roundResults: Array<'ready' | 'skip'>;
  calls: string[];
  rerunSourceRoot?: string;
}): Promise<MultiRoundExecutionValidationDependencies> {
  return {
    preflightInitialSource: async () => ({
      sourceRunRef: 'initial-run-000001',
      sourceRoot: '/sealed/initial-run-000001',
      experimentRootHash: 'initial-root-hash',
      observablePayloadHash: 'initial-observable-hash',
      sourceFingerprintSha256: 'initial-source-fingerprint',
    }),
    materializeEvolutionWorkspace: async () => ({
      workspaceRoot: input.workspaceRoot,
      workspaceBaselineFingerprintSha256: 'evolution-baseline',
      manifestPath: join(input.workspaceRoot, '.agent-workspace-manifest.json'),
    }),
    runSingleRound: async (round: MultiRoundLoopInput) => {
      input.calls.push(`round-${round.round}`);
      if (input.roundResults[round.round - 1] === 'ready') {
        await writeReadyArtifacts(round.experimentRoot);
        return completedRound({
          sourceRunRef: round.round === 1 ? 'initial-run-000001' : 'resulting-run-000001',
          decision: readyDecision(),
          experimentRoot: round.experimentRoot,
        });
      }
      return skippedRound({
        sourceRunRef: round.round === 1 ? 'initial-run-000001' : 'resulting-run-000001',
        experimentRoot: round.experimentRoot,
      });
    },
    executeConfiguration: async execution => {
      input.calls.push('execute');
      await writeFile(join(execution.workspaceRoot, CONFIG_PATH), '{"choices":[{"id":"new"}]}\n');
      return {
        schemaVersion: 'configuration-execution-result-v1',
        status: 'completed',
        changedFiles: [CONFIG_PATH],
        verificationResults: [],
        deviations: [],
      };
    },
    verifyWorkspace: async () => {
      input.calls.push('verify');
      return [
        { name: 'focused-configuration-validation', status: 'passed', details: 'ok' },
        { name: 'typecheck', status: 'passed', details: 'ok' },
      ];
    },
    rerunGame: async () => {
      input.calls.push('rerun');
      return {
        runRef: 'resulting-run-000001',
        outDir: input.rerunSourceRoot ?? '/sealed/resulting-run-000001',
        anchorPath: '/sealed/resulting-run-000001-anchor.json',
        observablePayloadHash: 'resulting-observable-hash',
        experimentRootHash: 'resulting-root-hash',
      };
    },
    validateSealedSource: async () => {
      input.calls.push('seal');
    },
  };
}

export async function runRound1NonReadyStopTest(): Promise<void> {
  const workspaceRoot = await createWorkspace();
  const calls: string[] = [];
  const dependencies = await fixedDependencies({ workspaceRoot, roundResults: ['skip'], calls });
  const root = await mkdtemp(join(tmpdir(), 'p2-non-ready-'));
  const result = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-non-ready-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    authoritativeRoot: workspaceRoot,
    initialSourceRoot: '/sealed/initial-run-000001',
    experimentRoot: join(root, 'run'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies,
  });
  assert.equal(result.outcome, 'NO_CROSS_ROUND_TRANSITION_OBSERVED');
  assert.equal(result.stopReason, 'ROUND_1_TERMINAL_NOT_READY');
  assert.deepEqual(calls, ['round-1']);
  const manifest = JSON.parse(await readFile(result.manifestPath, 'utf8')) as { rounds: Array<{ round: number; nextAction: string }> };
  assert.deepEqual(
    manifest.rounds.map(round => ({ round: round.round, nextAction: round.nextAction })),
    [{ round: 1, nextAction: 'STOP' }],
  );
}

export async function runScopeValidationTests(): Promise<void> {
  const workspaceRoot = await createWorkspace();
  const before = await snapshotWorkspace(workspaceRoot);
  await writeFile(join(workspaceRoot, CONFIG_PATH), '{"choices":[{"id":"allowed"}]}\n');
  const allowedAfter = await snapshotWorkspace(workspaceRoot);
  assert.deepEqual(
    verifyActualChangedFiles(before, allowedAfter, [CONFIG_PATH]),
    { status: 'passed', actualChangedFiles: [CONFIG_PATH], unauthorizedFiles: [] },
  );

  await writeFile(join(workspaceRoot, 'src/core/runtime.ts'), 'export const runtime = false;\n');
  const unauthorizedAfter = await snapshotWorkspace(workspaceRoot);
  const unauthorizedRuntime = verifyActualChangedFiles(before, unauthorizedAfter, [CONFIG_PATH]);
  assert.equal(unauthorizedRuntime.status, 'scope_violation');
  assert.ok(unauthorizedRuntime.unauthorizedFiles.includes('src/core/runtime.ts'));

  await writeFile(join(workspaceRoot, 'src/unauthorized.ts'), 'export const unauthorized = true;\n');
  const unauthorizedAddition = await snapshotWorkspace(workspaceRoot);
  const unauthorizedAdd = verifyActualChangedFiles(before, unauthorizedAddition, [CONFIG_PATH]);
  assert.equal(unauthorizedAdd.status, 'scope_violation');
  assert.ok(unauthorizedAdd.unauthorizedFiles.includes('src/unauthorized.ts'));

  // Primary regression from real operator smoke:
  // allowed config change + operational host metadata must not be a scope violation.
  const operationalRoot = await createWorkspace();
  const operationalBefore = await snapshotWorkspace(operationalRoot);
  await writeFile(join(operationalRoot, CONFIG_PATH), '{"choices":[{"id":"allowed-with-noise"}]}\n');
  await mkdir(join(operationalRoot, '.omx/logs'), { recursive: true });
  await writeFile(join(operationalRoot, '.omx/logs/omx-2026-09-03.jsonl'), 'host metadata\n');
  await mkdir(join(operationalRoot, '.tmp/evolution/noise'), { recursive: true });
  await writeFile(join(operationalRoot, '.tmp/evolution/noise/side-effect.txt'), 'tmp noise\n');
  await mkdir(join(operationalRoot, 'artifacts/evolution'), { recursive: true });
  await writeFile(join(operationalRoot, 'artifacts/evolution/index.md'), '# noise\n');
  await mkdir(join(operationalRoot, '.superpowers/plans'), { recursive: true });
  await writeFile(join(operationalRoot, '.superpowers/plans/noise.md'), 'noise\n');
  await mkdir(join(operationalRoot, 'agent_docs'), { recursive: true });
  await writeFile(join(operationalRoot, 'agent_docs/noise.md'), 'noise\n');
  const operationalAfter = await snapshotWorkspace(operationalRoot);
  assert.deepEqual(
    verifyActualChangedFiles(operationalBefore, operationalAfter, [CONFIG_PATH]),
    { status: 'passed', actualChangedFiles: [CONFIG_PATH], unauthorizedFiles: [] },
  );

  // public/reports/manifest.json remains authoritative unless explicitly allowed.
  const manifestRoot = await createWorkspace();
  await mkdir(join(manifestRoot, 'public/reports'), { recursive: true });
  await writeFile(join(manifestRoot, 'public/reports/manifest.json'), '{"reports":[]}\n');
  await writeFile(join(manifestRoot, 'public/reports/generated-report.json'), '{"generated":true}\n');
  const manifestBefore = await snapshotWorkspace(manifestRoot);
  await writeFile(join(manifestRoot, 'public/reports/manifest.json'), '{"reports":["changed"]}\n');
  await writeFile(join(manifestRoot, 'public/reports/generated-report.json'), '{"generated":false}\n');
  const manifestAfter = await snapshotWorkspace(manifestRoot);
  const manifestResult = verifyActualChangedFiles(manifestBefore, manifestAfter, [CONFIG_PATH]);
  assert.equal(manifestResult.status, 'scope_violation');
  assert.deepEqual(manifestResult.actualChangedFiles, ['public/reports/manifest.json']);
  assert.deepEqual(manifestResult.unauthorizedFiles, ['public/reports/manifest.json']);

  await assert.rejects(
    () => deriveAllowedWritePaths({
      workspaceRoot,
      solutionOption: {
        optionId: 'option-000001',
        proposedChange: 'unsafe',
        rationale: 'unsafe',
        repoRefs: ['src/core/runtime.ts'],
        artifactRefs: [],
        changeScope: 'configuration',
        expectedPlayerObservableDifference: 'unsafe',
        risks: [],
        unknowns: [],
      },
    }),
    /allowedWritePaths|configuration/i,
  );
}

export async function runFailureStopTest(failure: 'execution' | 'verification' | 'rerun'): Promise<void> {
    const label = `${failure} failure`;
    const workspaceRoot = await createWorkspace();
    const calls: string[] = [];
    const root = await mkdtemp(join(tmpdir(), `p2-${failure}-`));
    const base = await fixedDependencies({ workspaceRoot, roundResults: ['ready', 'skip'], calls });
    const dependencies: MultiRoundExecutionValidationDependencies = {
      ...base,
      executeConfiguration: async execution => {
        calls.push('execute');
        if (failure === 'execution') {
          return {
            schemaVersion: 'configuration-execution-result-v1',
            status: 'failed',
            changedFiles: [],
            verificationResults: [],
            deviations: ['participant failure'],
          };
        }
        await writeFile(join(execution.workspaceRoot, CONFIG_PATH), '{"choices":[{"id":"new"}]}\n');
        return {
          schemaVersion: 'configuration-execution-result-v1',
          status: 'completed',
          changedFiles: [CONFIG_PATH],
          verificationResults: [],
          deviations: [],
        };
      },
      verifyWorkspace: async () => {
        calls.push('verify');
        if (failure === 'verification') {
          return [{ name: 'typecheck', status: 'failed', details: 'expected failure' }];
        }
        return [{ name: 'typecheck', status: 'passed', details: 'ok' }];
      },
      rerunGame: async () => {
        calls.push('rerun');
        if (failure === 'rerun') throw new Error('rerun failed');
        return {
          runRef: 'resulting-run-000001',
          outDir: '/sealed/resulting-run-000001',
          anchorPath: '/sealed/resulting-run-000001-anchor.json',
          observablePayloadHash: 'observable',
          experimentRootHash: 'root',
        };
      },
    };
    const result = await runMultiRoundExecutionValidation({
      multiRoundRunRef: `p2-failure-${failure}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      authoritativeRoot: workspaceRoot,
      initialSourceRoot: '/sealed/initial-run-000001',
      experimentRoot: join(root, 'run'),
      participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
      dependencies,
    });
    assert.notEqual(result.stopReason, 'ROUND_2_COMPLETED', label);
    assert.equal(calls.includes('round-2'), false, label);
}

export async function runDefaultVerificationIsolationTest(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'p2-default-verification-'));
  const prepared = await prepareAgentWorkspace({
    authoritativeRoot: process.cwd(),
    destinationRoot: join(root, 'workspace'),
    jobKind: 'evolution',
  });
  const results = await defaultVerifyWorkspace({
    workspaceRoot: prepared.workspaceRoot,
    authoritativeRoot: process.cwd(),
  });
  assert.deepEqual(results.map(result => result.status), ['passed', 'passed', 'passed', 'passed']);
  await assert.rejects(() => lstat(join(prepared.workspaceRoot, 'node_modules')), /ENOENT/);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  Promise.resolve()
    .then(() => runRound1NonReadyStopTest())
    .then(() => runScopeValidationTests())
    .then(() => runFailureStopTest('execution'))
    .then(() => runFailureStopTest('verification'))
    .then(() => runFailureStopTest('rerun'))
    .then(() => runHumanFollowupPersistenceRegression())
    .then(() => runDefaultVerificationIsolationTest())
    .then(() => console.log('multiRoundExecutionValidation.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
