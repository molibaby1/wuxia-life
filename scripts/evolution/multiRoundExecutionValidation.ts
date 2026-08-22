import { execFile } from 'node:child_process';
import { cp, lstat, mkdir, open, readFile, readdir, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getP8PersonaById } from '../../src/p8/personas';
import {
  validateProblemPackage,
  type ProblemPackageV1,
} from '../../src/evolution/problemPackageContract';
import {
  validateSolutionReview,
  type SolutionReviewV1,
} from '../../src/evolution/solutionReviewContract';
import {
  validateSolutionWork,
  type SolutionOptionV1,
  type SolutionWorkV1,
} from '../../src/evolution/solutionWorkContract';
import {
  validatePhase0RunRef,
  validatePhase0RunSeal,
  canonicalJson,
  type Phase0SourceFingerprint,
} from './phase0/provenance';
import {
  preflightFixedSource,
  runProblemAgnosticAgentSolutionLoop,
  type FixedSourcePreflight,
  type ProblemAgnosticAgentSolutionLoopResult,
  type RunProblemAgnosticAgentSolutionLoopOptions,
} from './runProblemAgnosticAgentSolutionLoop';
import {
  assertAuthoritativeFingerprintUnchanged,
  captureAuthoritativeFingerprint,
  prepareAgentWorkspace,
  type PreparedAgentWorkspace,
} from './problemAgnosticSolution/agentWorkspace';
import type { WorkspaceAgentParticipantOptions } from './problemAgnosticSolution/agentParticipant';
import {
  runConfigurationExecutionParticipant,
  type ConfigurationExecutionInput,
  type ConfigurationExecutionParticipantResult,
} from './configurationExecutionParticipant';
import {
  deriveAllowedWritePaths,
  snapshotWorkspace,
  verifyActualChangedFiles,
  type ScopeVerificationResult,
  type WorkspaceSnapshot,
} from './executionScopeVerifier';

const execFileAsync = promisify(execFile);
const MAX_ROUNDS = 2 as const;
const MAX_TRANSITIONS = 1 as const;
const MAX_ROUND_PARTICIPANT_JOBS = 4 as const;
const MAX_EXECUTION_PARTICIPANT_JOBS = 1 as const;
const MAX_TOTAL_PARTICIPANT_JOBS = 9 as const;

export interface MutableEvolutionWorkspace {
  workspaceRoot: string;
  workspaceBaselineFingerprintSha256: string;
  manifestPath: string;
}

export interface MultiRoundLoopInput {
  round: 1 | 2;
  repositoryRoot: string;
  fixedSourceRoot: string;
  experimentRoot: string;
  participant: WorkspaceAgentParticipantOptions;
  participantMode?: RunProblemAgnosticAgentSolutionLoopOptions['participantMode'];
  apiKey?: string;
  authorityRefs?: string[];
}

export interface WorkspaceVerificationResult {
  name: string;
  status: 'passed' | 'failed';
  details: string;
}

export interface Phase0RerunResult {
  runRef: string;
  outDir: string;
  anchorPath: string;
  observablePayloadHash: string;
  experimentRootHash: string;
}

export interface MultiRoundExecutionValidationDependencies {
  preflightInitialSource?: (input: { repositoryRoot: string; fixedSourceRoot: string }) => Promise<FixedSourcePreflight>;
  materializeEvolutionWorkspace?: (input: {
    authoritativeRoot: string;
    destinationRoot: string;
  }) => Promise<MutableEvolutionWorkspace>;
  runSingleRound?: (input: MultiRoundLoopInput) => Promise<ProblemAgnosticAgentSolutionLoopResult>;
  executeConfiguration?: (input: ConfigurationExecutionInput) => Promise<ConfigurationExecutionParticipantResult>;
  verifyWorkspace?: (input: { workspaceRoot: string; authoritativeRoot: string }) => Promise<WorkspaceVerificationResult[]>;
  rerunGame?: (input: {
    workspaceRoot: string;
    previousSourceRoot: string;
    outRoot: string;
    anchorRoot: string;
    runRef: string;
  }) => Promise<Phase0RerunResult>;
  validateSealedSource?: (result: Phase0RerunResult) => Promise<void>;
}

export interface MultiRoundExecutionValidationInput {
  multiRoundRunRef: string;
  authoritativeRoot: string;
  initialSourceRoot: string;
  experimentRoot: string;
  participant: WorkspaceAgentParticipantOptions;
  participantMode?: RunProblemAgnosticAgentSolutionLoopOptions['participantMode'];
  apiKey?: string;
  authorityRefs?: string[];
  dependencies?: MultiRoundExecutionValidationDependencies;
}

export interface RoundManifestEntry {
  round: 1 | 2;
  workflowRef: string;
  sourceRunRef: string;
  terminalRoute: string | null;
  executionRef: string | null;
  resultingRunRef: string | null;
  nextAction: 'CONFIGURATION_EXECUTION' | 'ROUND_2' | 'STOP';
}

export interface MultiRoundRunManifestV1 {
  schemaVersion: 'multi-round-run-manifest-v1';
  multiRoundRunRef: string;
  initialSourceRunRef: string;
  limits: {
    maxAgentRounds: 2;
    maxCrossRoundTransitions: 1;
    maxRoundParticipantJobs: 4;
    maxExecutionParticipantJobs: 1;
    maxTotalParticipantJobs: 9;
    retryCount: 0;
  };
  rounds: RoundManifestEntry[];
  execution: {
    executionRef: string;
    allowedWritePaths: string[];
    actualChangedFiles: string[];
    status: 'completed' | 'failed' | 'scope_violation' | 'not_started';
    verificationResults: WorkspaceVerificationResult[];
    resultingRunRef: string | null;
  };
  budget: {
    round1ParticipantJobs: number;
    executionParticipantJobs: number;
    round2ParticipantJobs: number;
    totalParticipantJobs: number;
    retryCount: 0;
  };
  outcome: 'CROSS_ROUND_TRANSITION_OBSERVED' | 'NO_CROSS_ROUND_TRANSITION_OBSERVED' | 'STOPPED';
  stopReason: string;
}

export interface MultiRoundExecutionValidationResult {
  status: 'stopped';
  outcome: MultiRoundRunManifestV1['outcome'];
  stopReason: string;
  manifestPath: string;
  rounds: RoundManifestEntry[];
  execution: MultiRoundRunManifestV1['execution'] | null;
  actualParticipantJobs: number;
  crossRoundTransitions: 0 | 1;
}

async function assertAbsent(path: string, label: string): Promise<void> {
  try {
    await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`${label} already exists: ${path}`);
}

async function writeCreateOnly(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(`${canonicalJson(value)}\n`);
  } finally {
    await handle.close();
  }
}

function terminalRoute(result: ProblemAgnosticAgentSolutionLoopResult): string {
  return result.status === 'participant_failure' ? 'PARTICIPANT_FAILURE' : result.decision.route;
}

function isReady(result: ProblemAgnosticAgentSolutionLoopResult): result is Extract<ProblemAgnosticAgentSolutionLoopResult, { status: 'completed' }> {
  return result.status === 'completed' && result.decision.route === 'READY_FOR_CONFIG_EXECUTION';
}

function defaultRunSingleRound(input: MultiRoundLoopInput): Promise<ProblemAgnosticAgentSolutionLoopResult> {
  return runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: input.repositoryRoot,
    fixedSourceRoot: input.fixedSourceRoot,
    experimentRoot: input.experimentRoot,
    workspaceAgentParticipant: input.participant,
    ...(input.participantMode !== undefined ? { participantMode: input.participantMode } : {}),
    ...(input.apiKey !== undefined ? { apiKey: input.apiKey } : {}),
    ...(input.authorityRefs !== undefined ? { authorityRefs: input.authorityRefs } : {}),
  });
}

async function defaultMaterializeEvolutionWorkspace(input: {
  authoritativeRoot: string;
  destinationRoot: string;
}): Promise<MutableEvolutionWorkspace> {
  const prepared: PreparedAgentWorkspace = await prepareAgentWorkspace({
    authoritativeRoot: input.authoritativeRoot,
    destinationRoot: input.destinationRoot,
    jobKind: 'evolution',
  });
  return prepared;
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

const ROUND_INVOCATION_DIRECTORIES = [
  { directory: 'feedback-runs', schemaVersion: 'minimal-external-feedback-invocation-v1' },
  { directory: 'hypothesis-runs', schemaVersion: 'improvement-hypothesis-invocation-v1' },
] as const;

const ROUND_INVOCATION_FILES = [
  { path: 'solution-agent/invocation.json', schemaVersion: 'solution-agent-invocation-v2' },
  { path: 'reviewer-agent/invocation.json', schemaVersion: 'solution-reviewer-invocation-v2' },
] as const;

async function isStructuredInvocation(path: string, schemaVersion: string): Promise<boolean> {
  try {
    const stat = await lstat(path);
    if (!stat.isFile()) return false;
    const value = JSON.parse(await readFile(path, 'utf8')) as { schemaVersion?: unknown };
    return value.schemaVersion === schemaVersion;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' || error instanceof SyntaxError) return false;
    throw error;
  }
}

async function countStructuredInvocationsInDirectory(
  roundRoot: string,
  directory: string,
  schemaVersion: string,
): Promise<number> {
  const root = join(roundRoot, directory);
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0;
    throw error;
  }
  let count = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (await isStructuredInvocation(join(root, entry.name, 'invocation.json'), schemaVersion)) count += 1;
  }
  return count;
}

async function countStructuredParticipantInvocationArtifacts(roundRoot: string): Promise<number> {
  let count = 0;
  for (const entry of ROUND_INVOCATION_DIRECTORIES) {
    count += await countStructuredInvocationsInDirectory(roundRoot, entry.directory, entry.schemaVersion);
  }
  for (const entry of ROUND_INVOCATION_FILES) {
    if (await isStructuredInvocation(join(roundRoot, entry.path), entry.schemaVersion)) count += 1;
  }
  return count;
}

async function readAcceptedExecutionInput(
  roundRoot: string,
  workspaceRoot: string,
  result: Extract<ProblemAgnosticAgentSolutionLoopResult, { status: 'completed' }>,
  allowedWritePaths: string[],
  participant: WorkspaceAgentParticipantOptions,
): Promise<ConfigurationExecutionInput> {
  const problemPackagePath = join(roundRoot, 'problem-package.json');
  const solutionPath = join(roundRoot, 'solution-agent/result.json');
  const reviewPath = join(roundRoot, 'reviewer-agent/review.json');
  const problemPackage = validateProblemPackage(await readJson(problemPackagePath));
  const solutionWork = validateSolutionWork(await readJson(solutionPath));
  const solutionReview = validateSolutionReview(await readJson(reviewPath));
  if (result.decision.problemId !== problemPackage.problemId || solutionWork.problemId !== problemPackage.problemId || solutionReview.problemId !== problemPackage.problemId) {
    throw new Error('Solution and Review problem IDs do not match the accepted Problem Package');
  }
  if (solutionWork.status !== 'OPTIONS' || solutionReview.decision !== 'ACCEPT_OPTION') {
    throw new Error('READY_FOR_CONFIG_EXECUTION requires OPTIONS and ACCEPT_OPTION artifacts');
  }
  if (solutionReview.acceptedOptionId === undefined) throw new Error('acceptedOptionId is missing');
  const selectedOption = solutionWork.options.find(option => option.optionId === solutionReview.acceptedOptionId);
  if (!selectedOption) throw new Error('acceptedOptionId does not identify a Solution option');
  if (selectedOption.changeScope !== 'configuration' || solutionReview.scopeAssessment !== 'config_only') {
    throw new Error('accepted configuration work has a non-configuration scope');
  }
  return {
    invocationRef: 'configuration-execution-000001',
    destinationRoot: join(dirname(roundRoot), 'configuration-execution'),
    workspaceRoot,
    problemPackagePath,
    problemPackage,
    solutionWork,
    solutionReview,
    acceptedOptionId: solutionReview.acceptedOptionId,
    allowedWritePaths,
    authorityRefs: problemPackage.authorityRefs,
    participant,
  };
}

function selectedOption(solutionWork: SolutionWorkV1, acceptedOptionId: string): SolutionOptionV1 {
  const option = solutionWork.options.find(candidate => candidate.optionId === acceptedOptionId);
  if (!option) throw new Error(`acceptedOptionId does not identify a Solution option: ${acceptedOptionId}`);
  return option;
}

async function defaultExecuteConfiguration(input: ConfigurationExecutionInput): Promise<ConfigurationExecutionParticipantResult> {
  return runConfigurationExecutionParticipant(input);
}

async function runCommand(input: {
  name: string;
  executable: string;
  args: string[];
  cwd: string;
}): Promise<WorkspaceVerificationResult> {
  try {
    const result = await execFileAsync(input.executable, input.args, { cwd: input.cwd, maxBuffer: 8 * 1024 * 1024 });
    return { name: input.name, status: 'passed', details: `${result.stdout}${result.stderr}`.trim() || 'ok' };
  } catch (error) {
    const failure = error as { stdout?: string; stderr?: string; message?: string };
    return {
      name: input.name,
      status: 'failed',
      details: `${failure.stdout ?? ''}${failure.stderr ?? ''}${failure.message ?? ''}`.trim(),
    };
  }
}

async function withVerificationDependencies<T>(input: {
  workspaceRoot: string;
  authoritativeRoot: string;
  run: () => Promise<T>;
}): Promise<T> {
  const dependencySource = join(resolve(input.authoritativeRoot), 'node_modules');
  const dependencyDestination = join(resolve(input.workspaceRoot), 'node_modules');
  await assertAbsent(dependencyDestination, 'isolated verification dependency root');
  try {
    await cp(dependencySource, dependencyDestination, { recursive: true, verbatimSymlinks: true });
    return await input.run();
  } finally {
    await rm(dependencyDestination, { recursive: true, force: true });
  }
}

export async function defaultVerifyWorkspace(input: {
  workspaceRoot: string;
  authoritativeRoot: string;
}): Promise<WorkspaceVerificationResult[]> {
  const toolRoot = resolve(input.authoritativeRoot);
  const tsx = join(toolRoot, 'node_modules/.bin/tsx');
  const vueTsc = join(toolRoot, 'node_modules/.bin/vue-tsc');
  const tsc = join(toolRoot, 'node_modules/.bin/tsc');
  return withVerificationDependencies({
    workspaceRoot: input.workspaceRoot,
    authoritativeRoot: input.authoritativeRoot,
    run: async () => [
      await runCommand({
        name: 'focused-contract-validation',
        executable: tsx,
        args: ['tests/contracts/runContractTests.ts'],
        cwd: input.workspaceRoot,
      }),
      await runCommand({
        name: 'typecheck-app',
        executable: vueTsc,
        args: ['--noEmit', '-p', 'tsconfig.app.json', '--pretty', 'false'],
        cwd: input.workspaceRoot,
      }),
      await runCommand({
        name: 'typecheck-node',
        executable: tsc,
        args: ['--noEmit', '-p', 'tsconfig.node.json', '--pretty', 'false'],
        cwd: input.workspaceRoot,
      }),
      await runCommand({
        name: 'typecheck-p6b',
        executable: tsc,
        args: ['--noEmit', '-p', 'tsconfig.p6b.json', '--pretty', 'false'],
        cwd: input.workspaceRoot,
      }),
    ],
  });
}

async function isolatedSourceFingerprint(root: string): Promise<Phase0SourceFingerprint> {
  const snapshot = await snapshotWorkspace(root);
  return {
    schemaVersion: 'phase0-source-fingerprint-v1',
    headSha: 'isolated-evolution-workspace',
    branch: 'isolated-evolution-workspace',
    worktreeEntries: snapshot.entries.map(entry => ({
      path: entry.path,
      status: 'isolated',
      objectKind: entry.objectKind,
      sha256: entry.sha256,
    })),
  };
}

async function defaultRerunGame(input: {
  workspaceRoot: string;
  previousSourceRoot: string;
  outRoot: string;
  anchorRoot: string;
  runRef: string;
}): Promise<Phase0RerunResult> {
  const runInput = await readJson(join(input.previousSourceRoot, 'inputs/run-input.json')) as {
    seed?: number;
    endAge?: number;
    catalogVersion?: string;
    maxSteps?: number;
  };
  const personaInput = await readJson(join(input.previousSourceRoot, 'inputs/persona.json')) as { id?: string };
  if (!Number.isSafeInteger(runInput.seed) || !Number.isSafeInteger(runInput.endAge) || typeof runInput.catalogVersion !== 'string' || !Number.isSafeInteger(runInput.maxSteps)) {
    throw new Error('sealed source run input is incomplete');
  }
  if (typeof personaInput.id !== 'string') throw new Error('sealed source persona id is missing');
  const persona = getP8PersonaById(personaInput.id);
  if (!persona) throw new Error(`sealed source persona is unavailable: ${personaInput.id}`);
  const phase0ModulePath = join(input.workspaceRoot, 'scripts/evolution/phase0/runPhase0.ts');
  const phase0 = await import(`${pathToFileURL(phase0ModulePath).href}?p2=${encodeURIComponent(input.runRef)}`) as {
    runPhase0: (options: {
      runRef: string;
      outRoot: string;
      anchorRoot: string;
      persona: typeof persona;
      seed: number;
      endAge: number;
      catalogVersion: string;
      maxSteps: number;
      sourceFingerprint: Phase0SourceFingerprint;
    }) => Promise<Phase0RerunResult>;
  };
  const previousCwd = process.cwd();
  process.chdir(input.workspaceRoot);
  try {
    return await phase0.runPhase0({
      runRef: validatePhase0RunRef(input.runRef),
      outRoot: resolve(input.outRoot),
      anchorRoot: resolve(input.anchorRoot),
      persona,
      seed: runInput.seed,
      endAge: runInput.endAge,
      catalogVersion: runInput.catalogVersion,
      maxSteps: runInput.maxSteps,
      sourceFingerprint: await isolatedSourceFingerprint(input.workspaceRoot),
    });
  } finally {
    process.chdir(previousCwd);
  }
}

function emptyExecution(): MultiRoundRunManifestV1['execution'] {
  return {
    executionRef: 'configuration-execution-000001',
    allowedWritePaths: [],
    actualChangedFiles: [],
    status: 'not_started',
    verificationResults: [],
    resultingRunRef: null,
  };
}

function roundManifest(input: {
  round: 1 | 2;
  root: string;
  sourceRunRef: string;
  terminalRoute: string | null;
  nextAction: RoundManifestEntry['nextAction'];
  executionRef?: string | null;
  resultingRunRef?: string | null;
}): RoundManifestEntry {
  return {
    round: input.round,
    workflowRef: input.root,
    sourceRunRef: input.sourceRunRef,
    terminalRoute: input.terminalRoute,
    executionRef: input.executionRef ?? null,
    resultingRunRef: input.resultingRunRef ?? null,
    nextAction: input.nextAction,
  };
}

function resultFromManifest(input: {
  manifestPath: string;
  manifest: MultiRoundRunManifestV1;
}): MultiRoundExecutionValidationResult {
  return {
    status: 'stopped',
    outcome: input.manifest.outcome,
    stopReason: input.manifest.stopReason,
    manifestPath: input.manifestPath,
    rounds: input.manifest.rounds,
    execution: input.manifest.execution.status === 'not_started' ? null : input.manifest.execution,
    actualParticipantJobs: input.manifest.budget.totalParticipantJobs,
    crossRoundTransitions: input.manifest.rounds.some(round => round.round === 2) ? 1 : 0,
  };
}

export async function runMultiRoundExecutionValidation(
  input: MultiRoundExecutionValidationInput,
): Promise<MultiRoundExecutionValidationResult> {
  validatePhase0RunRef(input.multiRoundRunRef);
  const experimentRoot = resolve(input.experimentRoot);
  await assertAbsent(experimentRoot, 'multi-round experiment root');
  await mkdir(experimentRoot, { recursive: true });
  const dependencies = input.dependencies ?? {};
  const preflight = await (dependencies.preflightInitialSource ?? preflightFixedSource)({
    repositoryRoot: resolve(input.authoritativeRoot),
    fixedSourceRoot: resolve(input.initialSourceRoot),
  });
  const authoritativeFingerprint = await captureAuthoritativeFingerprint(input.authoritativeRoot);
  const manifestPath = join(experimentRoot, 'run-manifest.json');
  const rounds: RoundManifestEntry[] = [];
  const execution = emptyExecution();
  let round1ParticipantJobs = 0;
  let round2ParticipantJobs = 0;
  let executionParticipantJobs = 0;
  let outcome: MultiRoundRunManifestV1['outcome'] = 'STOPPED';
  let stopReason = 'UNEXPECTED_STOP';
  let evolutionWorkspace: MutableEvolutionWorkspace | null = null;

  try {
    evolutionWorkspace = await (dependencies.materializeEvolutionWorkspace ?? defaultMaterializeEvolutionWorkspace)({
      authoritativeRoot: resolve(input.authoritativeRoot),
      destinationRoot: join(experimentRoot, 'evolution-workspace'),
    });
    const runSingleRound = dependencies.runSingleRound ?? defaultRunSingleRound;
    const round1Root = join(experimentRoot, 'round-1');
    let round1: ProblemAgnosticAgentSolutionLoopResult;
    try {
      round1 = await runSingleRound({
        round: 1,
        repositoryRoot: evolutionWorkspace.workspaceRoot,
        fixedSourceRoot: resolve(input.initialSourceRoot),
        experimentRoot: round1Root,
        participant: input.participant,
        ...(input.participantMode !== undefined ? { participantMode: input.participantMode } : {}),
        ...(input.apiKey !== undefined ? { apiKey: input.apiKey } : {}),
        ...(input.authorityRefs !== undefined ? { authorityRefs: input.authorityRefs } : {}),
      });
    } catch (error) {
      round1ParticipantJobs = await countStructuredParticipantInvocationArtifacts(round1Root);
      throw error;
    }
    round1ParticipantJobs = round1.actualParticipantJobs;
    if (round1ParticipantJobs > MAX_ROUND_PARTICIPANT_JOBS) {
      stopReason = 'PARTICIPANT_BUDGET_EXCEEDED';
      rounds.push(roundManifest({ round: 1, root: 'round-1', sourceRunRef: preflight.sourceRunRef, terminalRoute: terminalRoute(round1), nextAction: 'STOP' }));
    } else if (!isReady(round1)) {
      outcome = 'NO_CROSS_ROUND_TRANSITION_OBSERVED';
      stopReason = 'ROUND_1_TERMINAL_NOT_READY';
      rounds.push(roundManifest({ round: 1, root: 'round-1', sourceRunRef: preflight.sourceRunRef, terminalRoute: terminalRoute(round1), nextAction: 'STOP' }));
    } else {
      rounds.push(roundManifest({
        round: 1,
        root: 'round-1',
        sourceRunRef: preflight.sourceRunRef,
        terminalRoute: round1.decision.route,
        nextAction: 'CONFIGURATION_EXECUTION',
        executionRef: execution.executionRef,
      }));
      const solutionWork = validateSolutionWork(await readJson(join(round1Root, 'solution-agent/result.json')));
      const solutionReview = validateSolutionReview(await readJson(join(round1Root, 'reviewer-agent/review.json')));
      const acceptedOption = selectedOption(solutionWork, solutionReview.acceptedOptionId ?? '');
      const allowedWritePaths = await deriveAllowedWritePaths({
        workspaceRoot: evolutionWorkspace.workspaceRoot,
        solutionOption: acceptedOption,
      });
      const executionInput = await readAcceptedExecutionInput(round1Root, evolutionWorkspace.workspaceRoot, round1, allowedWritePaths, input.participant);
      const before = await snapshotWorkspace(evolutionWorkspace.workspaceRoot);
      let executionResult: ConfigurationExecutionParticipantResult;
      try {
        executionResult = await (dependencies.executeConfiguration ?? defaultExecuteConfiguration)(executionInput);
      } catch (error) {
        executionResult = {
          schemaVersion: 'configuration-execution-result-v1',
          status: 'failed',
          changedFiles: [],
          verificationResults: [],
          deviations: [String(error)],
          invocationPath: executionInput.destinationRoot,
          rawOutputPath: executionInput.destinationRoot,
          resultPath: null,
          failurePath: null,
        };
      }
      executionParticipantJobs = MAX_EXECUTION_PARTICIPANT_JOBS;
      const after = await snapshotWorkspace(evolutionWorkspace.workspaceRoot);
      const scope: ScopeVerificationResult = verifyActualChangedFiles(before, after, allowedWritePaths);
      execution.allowedWritePaths = allowedWritePaths;
      execution.actualChangedFiles = scope.actualChangedFiles;
      let authoritativeRepositoryChanged = false;
      try {
        await assertAuthoritativeFingerprintUnchanged(input.authoritativeRoot, authoritativeFingerprint);
      } catch {
        authoritativeRepositoryChanged = true;
      }
      if (authoritativeRepositoryChanged) {
        execution.status = 'failed';
        stopReason = 'AUTHORITATIVE_REPOSITORY_CHANGED';
        rounds[0] = { ...rounds[0]!, nextAction: 'STOP' };
      } else if (scope.status === 'scope_violation') {
        execution.status = 'scope_violation';
        stopReason = 'EXECUTION_SCOPE_VIOLATION';
      } else if (executionResult.status !== 'completed') {
        execution.status = 'failed';
        stopReason = 'EXECUTION_PARTICIPANT_FAILURE';
      } else if (scope.actualChangedFiles.length === 0) {
        execution.status = 'completed';
        stopReason = 'NO_CONFIGURATION_CHANGE';
        rounds[0] = { ...rounds[0]!, nextAction: 'STOP' };
      } else {
        execution.status = 'completed';
        const verification = await (dependencies.verifyWorkspace ?? defaultVerifyWorkspace)({
          workspaceRoot: evolutionWorkspace.workspaceRoot,
          authoritativeRoot: resolve(input.authoritativeRoot),
        });
        execution.verificationResults = verification;
        if (verification.some(item => item.status !== 'passed')) {
          stopReason = 'DETERMINISTIC_VERIFICATION_FAILURE';
        } else {
          try {
            const resultingRunRef = `${input.multiRoundRunRef}-round-2-run-000001`;
            const rerun = await (dependencies.rerunGame ?? defaultRerunGame)({
              workspaceRoot: evolutionWorkspace.workspaceRoot,
              previousSourceRoot: resolve(input.initialSourceRoot),
              outRoot: join(experimentRoot, 'game-runs'),
              anchorRoot: join(experimentRoot, 'run-anchors'),
              runRef: resultingRunRef,
            });
            await (dependencies.validateSealedSource ?? (async result => {
              await validatePhase0RunSeal(result.outDir, result.experimentRootHash);
            }))(rerun);
            execution.resultingRunRef = rerun.runRef;
            rounds[0] = {
              ...rounds[0]!,
              resultingRunRef: rerun.runRef,
              nextAction: 'ROUND_2',
            };
            const round2Root = join(experimentRoot, 'round-2');
            let round2: ProblemAgnosticAgentSolutionLoopResult;
            try {
              round2 = await runSingleRound({
                round: 2,
                repositoryRoot: evolutionWorkspace.workspaceRoot,
                fixedSourceRoot: rerun.outDir,
                experimentRoot: round2Root,
                participant: input.participant,
                ...(input.participantMode !== undefined ? { participantMode: input.participantMode } : {}),
                ...(input.apiKey !== undefined ? { apiKey: input.apiKey } : {}),
                ...(input.authorityRefs !== undefined ? { authorityRefs: input.authorityRefs } : {}),
              });
            } catch (error) {
              round2ParticipantJobs = await countStructuredParticipantInvocationArtifacts(round2Root);
              throw error;
            }
            round2ParticipantJobs = round2.actualParticipantJobs;
            if (round2ParticipantJobs > MAX_ROUND_PARTICIPANT_JOBS) {
              stopReason = 'PARTICIPANT_BUDGET_EXCEEDED';
            } else {
              rounds.push(roundManifest({
                round: 2,
                root: 'round-2',
                sourceRunRef: rerun.runRef,
                terminalRoute: terminalRoute(round2),
                nextAction: 'STOP',
                resultingRunRef: null,
              }));
              outcome = 'CROSS_ROUND_TRANSITION_OBSERVED';
              stopReason = 'ROUND_2_COMPLETED';
            }
          } catch (error) {
            execution.status = 'failed';
            stopReason = String(error).includes('experiment root') || String(error).includes('seal')
              ? 'SEALED_SOURCE_VALIDATION_FAILURE'
              : 'REAL_GAME_RERUN_FAILURE';
          }
        }
      }
    }
  } catch (error) {
    stopReason = stopReason === 'UNEXPECTED_STOP' ? String(error) : stopReason;
  }

  const totalParticipantJobs = round1ParticipantJobs + executionParticipantJobs + round2ParticipantJobs;
  if (totalParticipantJobs > MAX_TOTAL_PARTICIPANT_JOBS) {
    stopReason = 'PARTICIPANT_BUDGET_EXCEEDED';
    outcome = 'STOPPED';
  }
  try {
    await assertAuthoritativeFingerprintUnchanged(input.authoritativeRoot, authoritativeFingerprint);
  } catch {
    if (execution.status === 'completed') execution.status = 'failed';
    outcome = 'STOPPED';
    stopReason = 'AUTHORITATIVE_REPOSITORY_CHANGED';
  }
  const manifest: MultiRoundRunManifestV1 = {
    schemaVersion: 'multi-round-run-manifest-v1',
    multiRoundRunRef: input.multiRoundRunRef,
    initialSourceRunRef: preflight.sourceRunRef,
    limits: {
      maxAgentRounds: MAX_ROUNDS,
      maxCrossRoundTransitions: MAX_TRANSITIONS,
      maxRoundParticipantJobs: MAX_ROUND_PARTICIPANT_JOBS,
      maxExecutionParticipantJobs: MAX_EXECUTION_PARTICIPANT_JOBS,
      maxTotalParticipantJobs: MAX_TOTAL_PARTICIPANT_JOBS,
      retryCount: 0,
    },
    rounds,
    execution,
    budget: {
      round1ParticipantJobs,
      executionParticipantJobs,
      round2ParticipantJobs,
      totalParticipantJobs,
      retryCount: 0,
    },
    outcome,
    stopReason,
  };
  await writeCreateOnly(manifestPath, manifest);
  return resultFromManifest({ manifestPath, manifest });
}
