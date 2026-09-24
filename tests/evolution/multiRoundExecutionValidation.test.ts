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
import type { ReviewContinuationResult } from '../../scripts/evolution/problemAgnosticSolution/runReviewContinuation';
import {
  captureAuthoritativeFingerprint,
  prepareAgentWorkspace,
} from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import {
  captureWorkspaceState,
  parseWorkspaceStateProvenance,
} from '../../scripts/evolution/workspaceStateProvenance';
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
      executionAuthorityAssessment: 'WITHIN_CURRENT_AUTHORITY',
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
    executionAuthorityAssessment: 'WITHIN_CURRENT_AUTHORITY',
    assessment: 'The option is supported and stays inside the configuration boundary.',
    repoRefs: [],
    artifactRefs: [],
    concerns: [],
  };
}

function moreWorkDecision(): SolutionDecisionV1 {
  return validateSolutionDecision({
    schemaVersion: 'solution-decision-v1',
    problemId: READY_PROBLEM_ID,
    route: 'DEFER_MORE_WORK_REQUESTED',
    reasonCode: 'REVIEW_REQUEST_MORE_WORK',
    inputs: {
      solutionStatus: 'OPTIONS',
      reviewerDecision: 'REQUEST_MORE_WORK',
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

async function writeMoreWorkArtifacts(root: string): Promise<void> {
  await writeReadyArtifacts(root);
  await writeJson(join(root, 'reviewer-agent/review.json'), {
    schemaVersion: 'solution-review-v1',
    problemId: READY_PROBLEM_ID,
    decision: 'REQUEST_MORE_WORK',
    assessment: 'One bounded follow-up is required.',
    repoRefs: [],
    artifactRefs: [],
    concerns: ['Confirm the concrete configuration path.'],
  });
  await writeJson(join(root, 'decision.json'), moreWorkDecision());
}

async function writeContinuationArtifacts(roundRoot: string): Promise<{ solutionPath: string; reviewPath: string; decisionPath: string }> {
  const continuationRoot = join(roundRoot, 'review-continuation-000001');
  const solutionPath = join(continuationRoot, 'solution-revision/result.json');
  const reviewPath = join(continuationRoot, 'reviewer-agent/review.json');
  const decisionPath = join(continuationRoot, 'decision.json');
  await writeJson(solutionPath, readySolutionWork());
  await writeJson(reviewPath, readySolutionReview());
  await writeJson(decisionPath, readyDecision());
  return { solutionPath, reviewPath, decisionPath };
}

function continuationResult(
  route: 'DEFER' | 'READY_FOR_CONFIG_EXECUTION',
  paths: { solutionPath: string; reviewPath: string; decisionPath: string },
): Extract<ReviewContinuationResult, { status: 'completed' }> {
  return {
    status: 'completed',
    continuationRef: 'review-continuation-000001',
    participantJobs: route === 'DEFER' ? 1 : 2,
    terminalRoute: route,
    terminalReasonCode: route === 'DEFER' ? 'INSUFFICIENT_EVIDENCE' : 'ACCEPTED_CONFIGURATION_SCOPE',
    decision: route === 'DEFER'
      ? validateSolutionDecision({
        schemaVersion: 'solution-decision-v1',
        problemId: READY_PROBLEM_ID,
        route: 'DEFER',
        reasonCode: 'INSUFFICIENT_EVIDENCE',
        inputs: {
          solutionStatus: 'INSUFFICIENT_EVIDENCE',
          reviewerDecision: null,
          solutionScope: null,
          reviewScope: null,
          permissions: {
            authoritativeProductWrite: false,
            sandboxWrite: true,
            productExecution: false,
            codeExecution: false,
          },
          budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 },
        },
      })
      : readyDecision(),
    decisionPath: paths.decisionPath,
    effectiveSolutionPath: paths.solutionPath,
    effectiveReviewPath: route === 'DEFER' ? null : paths.reviewPath,
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

function participantFailureRound(input: {
  sourceRunRef: string;
  experimentRoot: string;
}): ProblemAgnosticAgentSolutionLoopResult {
  return {
    status: 'participant_failure',
    sourceRunRef: input.sourceRunRef,
    workflowOutcomePath: join(input.experimentRoot, 'workflow-outcome.json'),
    outcome: {
      schemaVersion: 'participant-failure-outcome-v1',
      outcome: 'PARTICIPANT_FAILURE',
      failedStage: 'REVIEWER',
      participantJobNumber: 4,
      route: 'DEFER',
      participantErrorKind: 'deterministic test failure',
      failureArtifactRefs: ['reviewer-agent/invocation.json'],
      budget: { actualParticipantJobs: 4, maxParticipantJobs: 4, retryCount: 0 },
    },
    actualParticipantJobs: 4,
    decisionPath: null,
    problemPackagePath: null,
    solutionInvocationRef: null,
    reviewerInvocationRef: null,
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
  await mkdir(root, { recursive: true });
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
  const provenance = parseWorkspaceStateProvenance(JSON.parse(await readFile(join(root, 'run/workspace-state-provenance.json'), 'utf8')));
  assert.equal(provenance.start.status, 'available');
  assert.equal(provenance.end.status, 'available');
  assert.equal(provenance.start.fingerprintSha256, provenance.end.fingerprintSha256);
  assert.equal(provenance.executionBoundary, null);
}

export async function runWorkspaceStateLifecycleTest(): Promise<void> {
  const authoritativeRoot = await createWorkspace();
  const workspaceRoot = await createWorkspace();
  const calls: string[] = [];
  const root = await mkdtemp(join(tmpdir(), 'p2-provenance-lifecycle-'));
  const base = await fixedDependencies({ workspaceRoot, roundResults: ['ready', 'skip'], calls });
  const dependencies: MultiRoundExecutionValidationDependencies = {
    ...base,
    captureWorkspaceState: async workspace => {
      calls.push('capture');
      return captureWorkspaceState(workspace);
    },
  };
  const result = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-provenance-lifecycle-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    authoritativeRoot,
    initialSourceRoot: '/sealed/initial-run-000001',
    experimentRoot: join(root, 'run'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies,
  });
  assert.equal(result.stopReason, 'ROUND_2_COMPLETED');
  assert.deepEqual(calls.slice(0, 4), ['capture', 'round-1', 'capture', 'execute']);
  const provenance = parseWorkspaceStateProvenance(JSON.parse(await readFile(join(root, 'run/workspace-state-provenance.json'), 'utf8')));
  assert.equal(provenance.start.status, 'available');
  assert.equal(provenance.executionBoundary?.before.status, 'available');
  assert.equal(provenance.executionBoundary?.after.status, 'available');
  assert.notEqual(provenance.executionBoundary?.before.fingerprintSha256, provenance.executionBoundary?.after.fingerprintSha256);
  assert.equal(provenance.end.fingerprintSha256, provenance.executionBoundary?.after.fingerprintSha256);
  assert.deepEqual(provenance.consistencyWarnings, ['START_BASELINE_FINGERPRINT_NOT_COMPARABLE']);
}

export async function runConfigurationEvidenceCaptureFailureIsolationTest(): Promise<void> {
  const run = async (captureFails: boolean): Promise<{
    result: Awaited<ReturnType<typeof runMultiRoundExecutionValidation>>;
    calls: string[];
  }> => {
    const authoritativeRoot = await createWorkspace();
    const workspaceRoot = await createWorkspace();
    const calls: string[] = [];
    const root = await mkdtemp(join(tmpdir(), `p2-configuration-evidence-${captureFails ? 'failure' : 'control'}-`));
    const base = await fixedDependencies({ workspaceRoot, roundResults: ['ready', 'skip'], calls });
    const dependencies: MultiRoundExecutionValidationDependencies = {
      ...base,
      ...(captureFails ? {
        captureConfigurationBeforeEvidence: async () => { throw new Error('before evidence unavailable'); },
        captureConfigurationAfterEvidence: async () => { throw new Error('after evidence unavailable'); },
      } : {}),
    };
    const result = await runMultiRoundExecutionValidation({
      multiRoundRunRef: `p2-configuration-evidence-${captureFails ? 'failure' : 'control'}-${Date.now()}`,
      authoritativeRoot,
      initialSourceRoot: '/sealed/initial-run-000001',
      experimentRoot: join(root, 'run'),
      participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
      dependencies,
    });
    return { result, calls };
  };

  const control = await run(false);
  const captureFailure = await run(true);
  assert.equal(captureFailure.result.outcome, control.result.outcome);
  assert.equal(captureFailure.result.stopReason, control.result.stopReason);
  assert.deepEqual(captureFailure.result.execution, control.result.execution);
  assert.equal(captureFailure.result.actualParticipantJobs, control.result.actualParticipantJobs);
  assert.deepEqual(captureFailure.calls, control.calls);
}

export async function runWorkspaceStateFailureLifecycleTests(): Promise<void> {
  const run = async (input: {
    name: string;
    executeConfiguration: MultiRoundExecutionValidationDependencies['executeConfiguration'];
  }): Promise<Awaited<ReturnType<typeof runMultiRoundExecutionValidation>>> => {
    const authoritativeRoot = await createWorkspace();
    const workspaceRoot = await createWorkspace();
    const calls: string[] = [];
    const root = await mkdtemp(join(tmpdir(), `p2-provenance-${input.name}-`));
    const base = await fixedDependencies({ workspaceRoot, roundResults: ['ready', 'skip'], calls });
    const result = await runMultiRoundExecutionValidation({
      multiRoundRunRef: `p2-prov-${input.name.slice(0, 20)}-${Date.now()}`,
      authoritativeRoot,
      initialSourceRoot: '/sealed/initial-run-000001',
      experimentRoot: join(root, 'run'),
      participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
      dependencies: { ...base, executeConfiguration: input.executeConfiguration },
    });
    const provenance = parseWorkspaceStateProvenance(JSON.parse(await readFile(join(root, 'run/workspace-state-provenance.json'), 'utf8')));
    assert.equal(provenance.executionBoundary?.before.status, 'available');
    assert.equal(provenance.executionBoundary?.after.status, 'available');
    assert.notEqual(provenance.executionBoundary?.before.fingerprintSha256, provenance.executionBoundary?.after.fingerprintSha256);
    assert.equal(provenance.end.fingerprintSha256, provenance.executionBoundary?.after.fingerprintSha256);
    return result;
  };

  const executionFailure = await run({
    name: 'execution-failure-after-mutation',
    executeConfiguration: async execution => {
      await writeFile(join(execution.workspaceRoot, CONFIG_PATH), '{"choices":[{"id":"failed"}]}\n');
      return {
        schemaVersion: 'configuration-execution-result-v1',
        status: 'failed',
        changedFiles: [CONFIG_PATH],
        verificationResults: [],
        deviations: ['participant failure after mutation'],
      };
    },
  });
  assert.equal(executionFailure.stopReason, 'EXECUTION_PARTICIPANT_FAILURE');

  const scopeViolation = await run({
    name: 'scope-violation',
    executeConfiguration: async execution => {
      await writeFile(join(execution.workspaceRoot, CONFIG_PATH), '{"choices":[{"id":"allowed"}]}\n');
      await writeFile(join(execution.workspaceRoot, 'src/core/runtime.ts'), 'export const runtime = false;\n');
      return {
        schemaVersion: 'configuration-execution-result-v1',
        status: 'completed',
        changedFiles: [CONFIG_PATH, 'src/core/runtime.ts'],
        verificationResults: [],
        deviations: [],
      };
    },
  });
  assert.equal(scopeViolation.stopReason, 'EXECUTION_SCOPE_VIOLATION');

  const noChangeAuthoritativeRoot = await createWorkspace();
  const noChangeWorkspaceRoot = await createWorkspace();
  const noChangeRoot = await mkdtemp(join(tmpdir(), 'p2-provenance-no-change-'));
  const noChangeBase = await fixedDependencies({ workspaceRoot: noChangeWorkspaceRoot, roundResults: ['ready', 'skip'], calls: [] });
  const noChange = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-prov-nochange-${Date.now()}`,
    authoritativeRoot: noChangeAuthoritativeRoot,
    initialSourceRoot: '/sealed/initial-run-000001',
    experimentRoot: join(noChangeRoot, 'run'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies: {
      ...noChangeBase,
      executeConfiguration: async () => ({
        schemaVersion: 'configuration-execution-result-v1',
        status: 'completed',
        changedFiles: [],
        verificationResults: [],
        deviations: [],
      }),
    },
  });
  assert.equal(noChange.stopReason, 'NO_CONFIGURATION_CHANGE');
  const noChangeProvenance = parseWorkspaceStateProvenance(JSON.parse(await readFile(join(noChangeRoot, 'run/workspace-state-provenance.json'), 'utf8')));
  assert.equal(noChangeProvenance.executionBoundary?.before.fingerprintSha256, noChangeProvenance.executionBoundary?.after.fingerprintSha256);
  assert.equal(noChangeProvenance.end.fingerprintSha256, noChangeProvenance.executionBoundary?.after.fingerprintSha256);
}

export async function runWorkspaceStateEndCaptureFailureTest(): Promise<void> {
  const authoritativeRoot = await createWorkspace();
  const workspaceRoot = await createWorkspace();
  const root = await mkdtemp(join(tmpdir(), 'p2-provenance-end-failure-'));
  let captureCount = 0;
  const result = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-prov-end-${Date.now()}`,
    authoritativeRoot,
    initialSourceRoot: '/sealed/initial-run-000001',
    experimentRoot: join(root, 'run'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies: {
      ...(await fixedDependencies({ workspaceRoot, roundResults: ['skip'], calls: [] })),
      captureWorkspaceState: async workspace => {
        captureCount += 1;
        if (captureCount === 2) throw new Error('end capture unavailable');
        return captureWorkspaceState(workspace);
      },
    },
  });
  assert.equal(result.stopReason, 'ROUND_1_TERMINAL_NOT_READY');
  const provenance = parseWorkspaceStateProvenance(JSON.parse(await readFile(join(root, 'run/workspace-state-provenance.json'), 'utf8')));
  assert.equal(provenance.start.status, 'available');
  assert.equal(provenance.end.status, 'unavailable');
  assert.ok(provenance.consistencyWarnings.includes('END_CAPTURE_UNAVAILABLE'));
}

export async function runWorkspaceStateStartFailureTests(): Promise<void> {
  const workspaceRoot = await createWorkspace();
  const root = await mkdtemp(join(tmpdir(), 'p2-provenance-start-failure-'));
  const calls: string[] = [];
  const base = await fixedDependencies({ workspaceRoot, roundResults: ['skip'], calls });
  const mismatchDependencies: MultiRoundExecutionValidationDependencies = {
    ...base,
    materializeEvolutionWorkspace: async () => ({
      workspaceRoot,
      workspaceBaselineFingerprintSha256: '0'.repeat(64),
      manifestPath: join(workspaceRoot, '.agent-workspace-manifest.json'),
    }),
  };
  const mismatch = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-provenance-baseline-mismatch-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    authoritativeRoot: workspaceRoot,
    initialSourceRoot: '/sealed/initial-run-000001',
    experimentRoot: join(root, 'mismatch'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies: mismatchDependencies,
  });
  assert.equal(mismatch.stopReason, 'WORKSPACE_BASELINE_MISMATCH');
  assert.deepEqual(calls, []);

  let captureCount = 0;
  const captureFailure = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-provenance-start-capture-failure-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    authoritativeRoot: workspaceRoot,
    initialSourceRoot: '/sealed/initial-run-000001',
    experimentRoot: join(root, 'capture-failure'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies: {
      ...base,
      captureWorkspaceState: async workspace => {
        captureCount += 1;
        if (captureCount === 1) throw new Error('start capture unavailable');
        return captureWorkspaceState(workspace);
      },
    },
  });
  assert.equal(captureFailure.stopReason, 'WORKSPACE_START_STATE_CAPTURE_FAILURE');
  assert.deepEqual(calls, []);
  const provenance = parseWorkspaceStateProvenance(JSON.parse(await readFile(join(root, 'capture-failure/workspace-state-provenance.json'), 'utf8')));
  assert.equal(provenance.start.status, 'unavailable');
  assert.equal(provenance.end.status, 'available');
  assert.ok(provenance.consistencyWarnings.includes('START_CAPTURE_UNAVAILABLE'));
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

async function requestContinuationDependencies(input: {
  workspaceRoot: string;
  root: string;
  calls: string[];
  round1: 'more' | 'ready' | 'escalate' | 'defer' | 'participant_failure';
  round2?: 'more' | 'ready' | 'skip' | 'participant_failure';
  continuation: (round: 1 | 2, roundRoot: string) => Promise<ReviewContinuationResult>;
}): Promise<MultiRoundExecutionValidationDependencies> {
  const evolutionWorkspaceRoot = await createWorkspace();
  const base = await fixedDependencies({
    workspaceRoot: evolutionWorkspaceRoot,
    roundResults: ['skip', 'skip'],
    calls: input.calls,
  });
  return {
    ...base,
    runSingleRound: async round => {
      input.calls.push(`round-${round.round}`);
      const outcome = round.round === 1 ? input.round1 : input.round2 ?? 'skip';
      if (outcome === 'participant_failure') {
        return participantFailureRound({
          sourceRunRef: round.round === 1 ? 'initial-run-000001' : 'resulting-run-000001',
          experimentRoot: round.experimentRoot,
        });
      }
      if (outcome === 'more') {
        await writeMoreWorkArtifacts(round.experimentRoot);
        return completedRound({
          sourceRunRef: round.round === 1 ? 'initial-run-000001' : 'resulting-run-000001',
          decision: moreWorkDecision(),
          experimentRoot: round.experimentRoot,
        });
      }
      if (outcome === 'ready') {
        await writeReadyArtifacts(round.experimentRoot);
        return completedRound({
          sourceRunRef: round.round === 1 ? 'initial-run-000001' : 'resulting-run-000001',
          decision: readyDecision(),
          experimentRoot: round.experimentRoot,
        });
      }
      if (outcome === 'escalate') {
        return completedRound({
          sourceRunRef: 'initial-run-000001',
          decision: validateSolutionDecision({
            schemaVersion: 'solution-decision-v1',
            problemId: READY_PROBLEM_ID,
            route: 'ESCALATE_HUMAN',
            reasonCode: 'EXPLICIT_ESCALATION',
            inputs: {
              solutionStatus: 'ESCALATE',
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
          experimentRoot: round.experimentRoot,
        });
      }
      return completedRound({
        sourceRunRef: 'initial-run-000001',
        decision: validateSolutionDecision({
          schemaVersion: 'solution-decision-v1',
          problemId: READY_PROBLEM_ID,
          route: 'DEFER',
          reasonCode: 'INSUFFICIENT_EVIDENCE',
          inputs: {
            solutionStatus: 'INSUFFICIENT_EVIDENCE',
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
        experimentRoot: round.experimentRoot,
      });
    },
    runReviewContinuation: async continuation => input.continuation(continuation.round, continuation.roundRoot),
  };
}

export async function runBaseParticipantFailureStopTests(): Promise<void> {
  const round1Workspace = await createWorkspace();
  const round1Root = await mkdtemp(join(tmpdir(), 'p2-base-participant-failure-round1-'));
  const round1Calls: string[] = [];
  const round1 = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-base-participant-failure-round1-${Date.now()}`,
    authoritativeRoot: round1Workspace,
    initialSourceRoot: '/sealed/initial-run-000001',
    experimentRoot: join(round1Root, 'run'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies: await requestContinuationDependencies({
      workspaceRoot: round1Workspace,
      root: round1Root,
      calls: round1Calls,
      round1: 'participant_failure',
      continuation: async () => {
        throw new Error('base participant failure must not invoke continuation');
      },
    }),
  });
  const round1Manifest = JSON.parse(await readFile(round1.manifestPath, 'utf8')) as {
    rounds: Array<{ continuationRef: string | null }>;
    reviewContinuations: unknown[];
  };
  assert.equal(round1.rounds[0]!.continuationRef, null);
  assert.equal(round1Manifest.rounds[0]!.continuationRef, null);
  assert.equal(round1Manifest.reviewContinuations.length, 0);
  assert.equal(round1.stopReason, 'ROUND_1_TERMINAL_NOT_READY');
  assert.notEqual(round1.stopReason, 'REVIEW_CONTINUATION_PARTICIPANT_FAILURE');
  assert.deepEqual(round1Calls, ['round-1']);

  const round2Workspace = await createWorkspace();
  const round2Root = await mkdtemp(join(tmpdir(), 'p2-base-participant-failure-round2-'));
  const round2Calls: string[] = [];
  const round2 = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-base-participant-failure-round2-${Date.now()}`,
    authoritativeRoot: round2Workspace,
    initialSourceRoot: '/sealed/initial-run-000001',
    experimentRoot: join(round2Root, 'run'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies: await requestContinuationDependencies({
      workspaceRoot: round2Workspace,
      root: round2Root,
      calls: round2Calls,
      round1: 'ready',
      round2: 'participant_failure',
      continuation: async () => {
        throw new Error('base participant failure must not invoke continuation');
      },
    }),
  });
  assert.equal(round2.rounds[1]!.continuationRef, null);
  assert.equal(round2.stopReason, 'ROUND_2_COMPLETED');
  assert.notEqual(round2.stopReason, 'REVIEW_CONTINUATION_PARTICIPANT_FAILURE');
  assert.deepEqual(round2Calls, ['round-1', 'execute', 'verify', 'rerun', 'seal', 'round-2']);
}

export async function runBoundedReviewContinuationHostTests(): Promise<void> {
  const deferredWorkspace = await createWorkspace();
  const deferredRoot = await mkdtemp(join(tmpdir(), 'p2-continuation-defer-'));
  const deferredCalls: string[] = [];
  let deferredContinuationCalls = 0;
  const deferredDependencies = await requestContinuationDependencies({
    workspaceRoot: deferredWorkspace,
    root: deferredRoot,
    calls: deferredCalls,
    round1: 'more',
    continuation: async (_round, roundRoot) => {
      deferredContinuationCalls += 1;
      return continuationResult('DEFER', await writeContinuationArtifacts(roundRoot));
    },
  });
  const deferred = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-continuation-defer-${Date.now()}`,
    authoritativeRoot: deferredWorkspace,
    initialSourceRoot: '/sealed/initial-run-000001',
    experimentRoot: join(deferredRoot, 'run'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies: deferredDependencies,
  });
  assert.equal(deferredContinuationCalls, 1);
  assert.deepEqual(deferredCalls, ['round-1']);
  assert.equal(deferred.execution, null);
  assert.deepEqual(deferred.rounds.map(round => ({
    base: round.baseTerminalRoute,
    effective: round.effectiveTerminalRoute,
    continuation: round.continuationRef,
    nextAction: round.nextAction,
  })), [{
    base: 'DEFER_MORE_WORK_REQUESTED',
    effective: 'DEFER',
    continuation: 'review-continuation-000001',
    nextAction: 'STOP',
  }]);
  const deferredManifest = JSON.parse(await readFile(deferred.manifestPath, 'utf8')) as {
    schemaVersion: string;
    budget: { reviewContinuationParticipantJobs: number; totalParticipantJobs: number };
  };
  assert.equal(deferredManifest.schemaVersion, 'multi-round-run-manifest-v2');
  assert.equal(deferredManifest.budget.reviewContinuationParticipantJobs, 1);
  assert.equal(deferredManifest.budget.totalParticipantJobs, 5);

  const readyWorkspace = await createWorkspace();
  const readyRoot = await mkdtemp(join(tmpdir(), 'p2-continuation-ready-'));
  const readyCalls: string[] = [];
  let executionSolutionSummary = '';
  const readyDependencies = await requestContinuationDependencies({
    workspaceRoot: readyWorkspace,
    root: readyRoot,
    calls: readyCalls,
    round1: 'more',
    round2: 'skip',
    continuation: async (_round, roundRoot) => continuationResult('READY_FOR_CONFIG_EXECUTION', await writeContinuationArtifacts(roundRoot)),
  });
  readyDependencies.executeConfiguration = async execution => {
    readyCalls.push('execute');
    executionSolutionSummary = execution.solutionWork.summary;
    await writeFile(join(execution.workspaceRoot, CONFIG_PATH), '{"choices":[{"id":"continued"}]}\n');
    return {
      schemaVersion: 'configuration-execution-result-v1',
      status: 'completed',
      changedFiles: [CONFIG_PATH],
      verificationResults: [],
      deviations: [],
    };
  };
  const ready = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-continuation-ready-${Date.now()}`,
    authoritativeRoot: readyWorkspace,
    initialSourceRoot: '/sealed/initial-run-000001',
    experimentRoot: join(readyRoot, 'run'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies: readyDependencies,
  });
  assert.equal(executionSolutionSummary, 'One bounded configuration option.');
  assert.ok(readyCalls.includes('execute'));
  assert.equal(ready.rounds[0]!.effectiveTerminalRoute, 'READY_FOR_CONFIG_EXECUTION');
  assert.equal(ready.rounds[0]!.baseTerminalRoute, 'DEFER_MORE_WORK_REQUESTED');

  for (const baseRoute of ['escalate', 'defer'] as const) {
    const workspace = await createWorkspace();
    const root = await mkdtemp(join(tmpdir(), `p2-continuation-${baseRoute}-`));
    const calls: string[] = [];
    let continuationCalls = 0;
    const dependencies = await requestContinuationDependencies({
      workspaceRoot: workspace,
      root,
      calls,
      round1: baseRoute,
      continuation: async () => {
        continuationCalls += 1;
        throw new Error('continuation must not run');
      },
    });
    const result = await runMultiRoundExecutionValidation({
      multiRoundRunRef: `p2-continuation-base-${baseRoute}-${Date.now()}`,
      authoritativeRoot: workspace,
      initialSourceRoot: '/sealed/initial-run-000001',
      experimentRoot: join(root, 'run'),
      participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
      dependencies,
    });
    assert.equal(continuationCalls, 0);
    assert.equal(result.rounds[0]!.baseTerminalRoute, baseRoute === 'escalate' ? 'ESCALATE_HUMAN' : 'DEFER');
  }

  const failureWorkspace = await createWorkspace();
  const failureRoot = await mkdtemp(join(tmpdir(), 'p2-continuation-failure-'));
  const failureCalls: string[] = [];
  const failureDependencies = await requestContinuationDependencies({
    workspaceRoot: failureWorkspace,
    root: failureRoot,
    calls: failureCalls,
    round1: 'more',
    continuation: async () => ({
      status: 'participant_failure',
      continuationRef: 'review-continuation-000001',
      participantJobs: 1,
      terminalRoute: 'PARTICIPANT_FAILURE',
      terminalReasonCode: null,
      decision: null,
      decisionPath: null,
      effectiveSolutionPath: null,
      effectiveReviewPath: null,
    }),
  });
  const failure = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-continuation-failure-${Date.now()}`,
    authoritativeRoot: failureWorkspace,
    initialSourceRoot: '/sealed/initial-run-000001',
    experimentRoot: join(failureRoot, 'run'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies: failureDependencies,
  });
  assert.equal(failure.stopReason, 'REVIEW_CONTINUATION_PARTICIPANT_FAILURE');
  assert.equal(failure.execution, null);

  const tokenUsedWorkspace = await createWorkspace();
  const tokenUsedRoot = await mkdtemp(join(tmpdir(), 'p2-continuation-token-used-'));
  const tokenUsedCalls: string[] = [];
  const tokenUsedRounds: number[] = [];
  const tokenUsedDependencies = await requestContinuationDependencies({
    workspaceRoot: tokenUsedWorkspace,
    root: tokenUsedRoot,
    calls: tokenUsedCalls,
    round1: 'more',
    round2: 'more',
    continuation: async (round, roundRoot) => {
      tokenUsedRounds.push(round);
      return continuationResult('READY_FOR_CONFIG_EXECUTION', await writeContinuationArtifacts(roundRoot));
    },
  });
  const tokenUsed = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-continuation-token-used-${Date.now()}`,
    authoritativeRoot: tokenUsedWorkspace,
    initialSourceRoot: '/sealed/initial-run-000001',
    experimentRoot: join(tokenUsedRoot, 'run'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies: tokenUsedDependencies,
  });
  assert.deepEqual(tokenUsedRounds, [1]);
  assert.equal(tokenUsed.actualParticipantJobs, 11, JSON.stringify({ calls: tokenUsedCalls, rounds: tokenUsed.rounds }));
  assert.equal(tokenUsed.rounds[1]!.continuationRef, null);
  assert.equal(tokenUsed.rounds[1]!.effectiveTerminalRoute, 'DEFER_MORE_WORK_REQUESTED');

  const tokenAvailableWorkspace = await createWorkspace();
  const tokenAvailableRoot = await mkdtemp(join(tmpdir(), 'p2-continuation-token-available-'));
  const tokenAvailableCalls: string[] = [];
  const tokenAvailableRounds: number[] = [];
  const tokenAvailableDependencies = await requestContinuationDependencies({
    workspaceRoot: tokenAvailableWorkspace,
    root: tokenAvailableRoot,
    calls: tokenAvailableCalls,
    round1: 'ready',
    round2: 'more',
    continuation: async (round, roundRoot) => {
      tokenAvailableRounds.push(round);
      return continuationResult('DEFER', await writeContinuationArtifacts(roundRoot));
    },
  });
  const tokenAvailable = await runMultiRoundExecutionValidation({
    multiRoundRunRef: `p2-continuation-token-available-${Date.now()}`,
    authoritativeRoot: tokenAvailableWorkspace,
    initialSourceRoot: '/sealed/initial-run-000001',
    experimentRoot: join(tokenAvailableRoot, 'run'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies: tokenAvailableDependencies,
  });
  assert.deepEqual(tokenAvailableRounds, [2]);
  assert.ok(tokenAvailable.actualParticipantJobs <= 11);
  assert.equal(tokenAvailable.rounds[1]!.continuationRef, 'review-continuation-000001');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  Promise.resolve()
    .then(() => runRound1NonReadyStopTest())
    .then(() => runWorkspaceStateLifecycleTest())
    .then(() => runConfigurationEvidenceCaptureFailureIsolationTest())
    .then(() => runWorkspaceStateFailureLifecycleTests())
    .then(() => runWorkspaceStateStartFailureTests())
    .then(() => runWorkspaceStateEndCaptureFailureTest())
    .then(() => runScopeValidationTests())
    .then(() => runFailureStopTest('execution'))
    .then(() => runFailureStopTest('verification'))
    .then(() => runFailureStopTest('rerun'))
    .then(() => runHumanFollowupPersistenceRegression())
    .then(() => runDefaultVerificationIsolationTest())
    .then(() => runBaseParticipantFailureStopTests())
    .then(() => runBoundedReviewContinuationHostTests())
    .then(() => console.log('multiRoundExecutionValidation.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
