import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { getP8PersonaById } from '../../src/p8/personas';
import { validateProblemPackage } from '../../src/evolution/problemPackageContract';
import { validateSolutionDecision, type SolutionDecisionV1 } from '../../src/evolution/solutionDecisionContract';
import { captureWorktreeSourceFingerprint, validatePhase0RunSeal } from '../../scripts/evolution/phase0/provenance';
import { runPhase0 } from '../../scripts/evolution/phase0/runPhase0';
import type { ProblemAgnosticAgentSolutionLoopResult } from '../../scripts/evolution/runProblemAgnosticAgentSolutionLoop';
import { prepareAgentWorkspace } from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import {
  runMultiRoundExecutionValidation,
  type MultiRoundExecutionValidationDependencies,
  type MultiRoundLoopInput,
} from '../../scripts/evolution/multiRoundExecutionValidation';

const CONFIG_PATH = 'src/data/lines/family-life.json';
const PROBLEM_ID = 'problem-hypothesis-000001';
const PERSONA_ID = 'p8-martial-lin';
const SEED = 812;
const END_AGE = 0;
const CATALOG_VERSION = '1.0.0';
const MAX_STEPS = 20;

function readyDecision(): SolutionDecisionV1 {
  return validateSolutionDecision({
    schemaVersion: 'solution-decision-v1',
    problemId: PROBLEM_ID,
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

function roundResult(sourceRunRef: string, experimentRoot: string, decision: SolutionDecisionV1): ProblemAgnosticAgentSolutionLoopResult {
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

async function writeReadyRoundArtifacts(root: string): Promise<void> {
  const problemPackage = validateProblemPackage({
    schemaVersion: 'problem-package-v1',
    problemId: PROBLEM_ID,
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
    schemaVersion: 'solution-work-v1', status: 'OPTIONS', problemId: PROBLEM_ID,
    options: [{ optionId: 'option-000001', proposedChange: 'Change one data file.', rationale: 'The data file is the bounded source.', repoRefs: [`${CONFIG_PATH}:1-2`], artifactRefs: [], changeScope: 'configuration', expectedPlayerObservableDifference: 'The data is executable.', risks: [], unknowns: [] }],
    recommendedOptionId: 'option-000001', summary: 'One configuration option.', repoRefs: [CONFIG_PATH], artifactRefs: [],
  })}\n`);
  await writeFile(join(root, 'reviewer-agent/review.json'), `${JSON.stringify({
    schemaVersion: 'solution-review-v1', problemId: PROBLEM_ID, decision: 'ACCEPT_OPTION', acceptedOptionId: 'option-000001', scopeAssessment: 'config_only', assessment: 'Accepted.', repoRefs: [], artifactRefs: [], concerns: [],
  })}\n`);
}

async function main(): Promise<void> {
  const repositoryRoot = resolve(process.cwd());
  const persona = getP8PersonaById(PERSONA_ID);
  assert.ok(persona);
  const root = await mkdtemp(join(tmpdir(), 'p2-real-rerun-'));
  const initial = await runPhase0({
    runRef: 'p2-real-initial-run-000001',
    outRoot: join(root, 'initial', 'game-runs'),
    anchorRoot: join(root, 'initial', 'run-anchors'),
    persona,
    seed: SEED,
    endAge: END_AGE,
    catalogVersion: CATALOG_VERSION,
    maxSteps: MAX_STEPS,
    sourceFingerprint: await captureWorktreeSourceFingerprint(repositoryRoot),
  });
  await validatePhase0RunSeal(initial.outDir, initial.experimentRootHash);

  const roundInputs: Array<{ round: 1 | 2; fixedSourceRoot: string }> = [];
  const calls: string[] = [];
  let evolutionWorkspaceRoot = '';
  let mutatedCatalogEventId = '';
  const dependencies: MultiRoundExecutionValidationDependencies = {
    materializeEvolutionWorkspace: async input => {
      const prepared = await prepareAgentWorkspace({
        authoritativeRoot: input.authoritativeRoot,
        destinationRoot: input.destinationRoot,
        jobKind: 'evolution',
      });
      await symlink(join(repositoryRoot, 'node_modules'), join(prepared.workspaceRoot, 'node_modules'));
      evolutionWorkspaceRoot = prepared.workspaceRoot;
      return prepared;
    },
    runSingleRound: async (round: MultiRoundLoopInput) => {
      calls.push(`round-${round.round}`);
      roundInputs.push({ round: round.round, fixedSourceRoot: round.fixedSourceRoot });
      if (round.round === 1) {
        await writeReadyRoundArtifacts(round.experimentRoot);
        return roundResult('p2-real-initial-run-000001', round.experimentRoot, readyDecision());
      }
      const skipDecision = validateSolutionDecision({
        schemaVersion: 'solution-decision-v1', problemId: 'problem-not-formed', route: 'SKIP', reasonCode: 'NO_PROPOSAL',
        inputs: { solutionStatus: 'NO_PROPOSAL', reviewerDecision: null, solutionScope: null, reviewScope: null, permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 3, maxParticipantJobs: 4, retryCount: 0 } },
      });
      return roundResult('p2-real-rerun-round-2-run-000001', round.experimentRoot, skipDecision);
    },
    executeConfiguration: async execution => {
      calls.push('execute');
      const configFile = join(execution.workspaceRoot, CONFIG_PATH);
      const events = JSON.parse(await readFile(configFile, 'utf8')) as Array<Record<string, unknown>>;
      const firstEvent = events[0];
      assert.ok(firstEvent);
      assert.equal(typeof firstEvent.id, 'string');
      assert.ok(String(firstEvent.id).length > 0);
      mutatedCatalogEventId = String(firstEvent.id);
      firstEvent.description = `${String(firstEvent.description)} [p2 deterministic rerun]`;
      await writeFile(configFile, `${JSON.stringify(events, null, 2)}\n`);
      return { schemaVersion: 'configuration-execution-result-v1', status: 'completed', changedFiles: [CONFIG_PATH], verificationResults: [], deviations: [] };
    },
    verifyWorkspace: async () => {
      calls.push('verify');
      return [{ name: 'deterministic-fake-verification', status: 'passed', details: 'deterministic test dependency' }];
    },
  };

  const result = await runMultiRoundExecutionValidation({
    multiRoundRunRef: 'p2-real-rerun-000001',
    authoritativeRoot: repositoryRoot,
    initialSourceRoot: initial.outDir,
    experimentRoot: join(root, 'multi-round'),
    participant: { executable: process.execPath, buildArgs: () => ['-e', ''] },
    dependencies,
  });

  assert.equal(result.outcome, 'CROSS_ROUND_TRANSITION_OBSERVED');
  assert.equal(result.stopReason, 'ROUND_2_COMPLETED');
  assert.equal(result.crossRoundTransitions, 1);
  assert.deepEqual(calls, ['round-1', 'execute', 'verify', 'round-2']);
  assert.equal(roundInputs[0]?.fixedSourceRoot, initial.outDir);
  assert.equal(result.execution?.resultingRunRef, 'p2-real-rerun-000001-round-2-run-000001');
  assert.equal(roundInputs[1]?.fixedSourceRoot, join(root, 'multi-round', 'game-runs', result.execution?.resultingRunRef ?? ''));
  assert.equal(result.rounds[1]?.sourceRunRef, result.execution?.resultingRunRef);

  const rerunOutDir = roundInputs[1]?.fixedSourceRoot;
  assert.ok(rerunOutDir);
  const rerunInput = JSON.parse(await readFile(join(rerunOutDir, 'inputs/run-input.json'), 'utf8')) as { seed: number; endAge: number; catalogVersion: string; maxSteps: number };
  const initialInput = JSON.parse(await readFile(join(initial.outDir, 'inputs/run-input.json'), 'utf8')) as typeof rerunInput;
  assert.deepEqual(
    { seed: rerunInput.seed, endAge: rerunInput.endAge, catalogVersion: rerunInput.catalogVersion, maxSteps: rerunInput.maxSteps },
    { seed: SEED, endAge: END_AGE, catalogVersion: CATALOG_VERSION, maxSteps: MAX_STEPS },
  );
  assert.deepEqual(
    { seed: initialInput.seed, endAge: initialInput.endAge, catalogVersion: initialInput.catalogVersion, maxSteps: initialInput.maxSteps },
    { seed: rerunInput.seed, endAge: rerunInput.endAge, catalogVersion: rerunInput.catalogVersion, maxSteps: rerunInput.maxSteps },
  );
  const rerunPersona = JSON.parse(await readFile(join(rerunOutDir, 'inputs/persona.json'), 'utf8')) as { id: string };
  assert.equal(rerunPersona.id, PERSONA_ID);

  const rerunCatalog = JSON.parse(await readFile(join(rerunOutDir, 'inputs/catalog.json'), 'utf8')) as { events: Array<{ id: string; description?: string }> };
  // Prove the scenario-mutated config event (not a hardcoded Family product id) reached the sealed rerun catalog.
  assert.ok(mutatedCatalogEventId);
  const mutatedCatalogEvent = rerunCatalog.events.find(event => event.id === mutatedCatalogEventId);
  assert.ok(mutatedCatalogEvent, `sealed rerun catalog missing mutated event ${mutatedCatalogEventId}`);
  assert.match(mutatedCatalogEvent.description ?? '', /p2 deterministic rerun/);
  const sourceFingerprint = JSON.parse(await readFile(join(rerunOutDir, 'provenance/source-fingerprint.json'), 'utf8')) as { headSha: string; branch: string; worktreeEntries: Array<{ path: string; objectKind?: string; sha256?: string }> };
  assert.equal(sourceFingerprint.headSha, 'isolated-evolution-workspace');
  assert.equal(sourceFingerprint.branch, 'isolated-evolution-workspace');
  const configFingerprintEntry = sourceFingerprint.worktreeEntries.find(entry => entry.path === CONFIG_PATH);
  assert.equal(configFingerprintEntry?.objectKind, 'regular_file');
  assert.ok(configFingerprintEntry?.sha256);
  const workspaceSnapshot = await import('../../scripts/evolution/executionScopeVerifier');
  const workspaceConfigEntry = (await workspaceSnapshot.snapshotWorkspace(evolutionWorkspaceRoot)).entries.find(entry => entry.path === CONFIG_PATH);
  assert.equal(configFingerprintEntry?.sha256, workspaceConfigEntry?.sha256);

  const rerunRootHash = (await readFile(join(rerunOutDir, 'experiment-root.sha256'), 'utf8')).trim();
  await validatePhase0RunSeal(rerunOutDir, rerunRootHash);
  const rerunManifest = JSON.parse(await readFile(join(rerunOutDir, 'experiment-root.json'), 'utf8')) as { runRef: string };
  assert.equal(rerunManifest.runRef, result.execution?.resultingRunRef);
  console.log('p2-real-rerun.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
