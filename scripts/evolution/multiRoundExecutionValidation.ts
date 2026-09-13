import { execFile } from 'node:child_process';
import { cp, lstat, mkdir, open, readFile, readdir, rm } from 'node:fs/promises';
import { promisify } from 'node:util';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getP8PersonaById } from '../../src/p8/personas';
import {
  validateProblemPackage,
  type ProblemPackage,
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
import {
  type MultiRoundRunManifestV1,
  type MultiRoundRunManifestV2,
  type MultiRoundVerificationResultV1,
  type RoundManifestEntry,
  type RoundManifestEntryV2,
  type ReviewContinuationManifestEntryV2,
} from './multiRoundRunManifestContract';
import {
  runReviewContinuation,
  type ReviewContinuationResult,
  type RunReviewContinuationInput,
} from './problemAgnosticSolution/runReviewContinuation';
import {
  captureWorkspaceState,
  isComparableWorkspaceFingerprint,
  WORKSPACE_STATE_FINGERPRINT_METHOD,
  WORKSPACE_STATE_PROVENANCE_SCHEMA_VERSION,
  unavailableWorkspaceState,
  workspaceStateConsistencyWarnings,
  type WorkspaceStateConsistencyWarning,
  type WorkspaceStateProvenanceV1,
  type WorkspaceStateCapture,
} from './workspaceStateProvenance';

export type {
  MultiRoundRunManifestV1,
  MultiRoundRunManifestV2,
  RoundManifestEntry,
  RoundManifestEntryV2,
} from './multiRoundRunManifestContract';

export type WorkspaceVerificationResult = MultiRoundVerificationResultV1;

const execFileAsync = promisify(execFile);
const MAX_ROUNDS = 2 as const;
const MAX_TRANSITIONS = 1 as const;
const MAX_ROUND_PARTICIPANT_JOBS = 4 as const;
const MAX_REVIEW_CONTINUATIONS = 1 as const;
const MAX_REVIEW_CONTINUATION_PARTICIPANT_JOBS = 2 as const;
const MAX_EXECUTION_PARTICIPANT_JOBS = 1 as const;
const MAX_TOTAL_PARTICIPANT_JOBS = 11 as const;

type HostRoundManifestEntry = RoundManifestEntryV2 & { terminalRoute: string | null };

interface EffectiveRoundResolution {
  baseResult: ProblemAgnosticAgentSolutionLoopResult;
  baseRoute: string;
  baseReasonCode: string | null;
  effectiveRoute: string;
  effectiveReasonCode: string | null;
  continuation: ReviewContinuationResult | null;
  participantJobs: number;
  acceptedArtifacts: null | {
    problemPackagePath: string;
    solutionPath: string;
    reviewPath: string;
  };
}

export interface MutableEvolutionWorkspace {
  workspaceRoot: string;
  workspaceBaselineFingerprintSha256: string;
  manifestPath: string;
}

export interface MultiRoundLoopInput {
  round: 1 | 2;
  repositoryRoot: string;
  humanFollowupRoot: string;
  workflowInstanceRef: string;
  fixedSourceRoot: string;
  experimentRoot: string;
  participant: WorkspaceAgentParticipantOptions;
  participantMode?: RunProblemAgnosticAgentSolutionLoopOptions['participantMode'];
  apiKey?: string;
  authorityRefs?: string[];
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
  captureWorkspaceState?: (workspaceRoot: string) => Promise<WorkspaceStateCapture>;
  runReviewContinuation?: (input: RunReviewContinuationInput) => Promise<ReviewContinuationResult>;
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

export interface MultiRoundExecutionValidationResult {
  status: 'stopped';
  outcome: MultiRoundRunManifestV1['outcome'];
  stopReason: string;
  manifestPath: string;
  rounds: HostRoundManifestEntry[];
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

function defaultRunSingleRound(input: MultiRoundLoopInput): Promise<ProblemAgnosticAgentSolutionLoopResult> {
  return runProblemAgnosticAgentSolutionLoop({
    repositoryRoot: input.repositoryRoot,
    humanFollowupRoot: input.humanFollowupRoot,
    workflowInstanceRef: input.workflowInstanceRef,
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
  artifactPaths: {
    problemPackagePath: string;
    solutionPath: string;
    reviewPath: string;
  },
): Promise<ConfigurationExecutionInput> {
  const problemPackagePath = artifactPaths.problemPackagePath;
  const problemPackage = validateProblemPackage(await readJson(problemPackagePath));
  const solutionWork = validateSolutionWork(await readJson(artifactPaths.solutionPath));
  const solutionReview = validateSolutionReview(await readJson(artifactPaths.reviewPath));
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

function roundManifestV2(input: {
  round: 1 | 2;
  root: string;
  sourceRunRef: string;
  baseTerminalRoute: string | null;
  baseReasonCode: string | null;
  continuationRef: string | null;
  effectiveTerminalRoute: string | null;
  effectiveReasonCode: string | null;
  nextAction: RoundManifestEntry['nextAction'];
  executionRef?: string | null;
  resultingRunRef?: string | null;
}): RoundManifestEntryV2 {
  return {
    round: input.round,
    workflowRef: input.root,
    sourceRunRef: input.sourceRunRef,
    baseTerminalRoute: input.baseTerminalRoute,
    baseReasonCode: input.baseReasonCode,
    continuationRef: input.continuationRef,
    effectiveTerminalRoute: input.effectiveTerminalRoute,
    effectiveReasonCode: input.effectiveReasonCode,
    executionRef: input.executionRef ?? null,
    resultingRunRef: input.resultingRunRef ?? null,
    nextAction: input.nextAction,
  };
}

function continuationManifestEntry(
  continuation: ReviewContinuationResult,
  round: 1 | 2,
): ReviewContinuationManifestEntryV2 {
  return {
    round,
    continuationRef: continuation.continuationRef,
    participantJobs: continuation.participantJobs,
    terminalStatus: continuation.status === 'completed' ? 'completed' : 'participant_failure',
    terminalRoute: continuation.terminalRoute,
    decisionRef: continuation.status === 'completed'
      ? 'review-continuation-000001/decision.json'
      : null,
  };
}

function addProvenanceWarning(
  provenance: WorkspaceStateProvenanceV1,
  warning: WorkspaceStateConsistencyWarning,
): void {
  if (!provenance.consistencyWarnings.includes(warning)) provenance.consistencyWarnings.push(warning);
}

async function captureWorkspaceStateBestEffort(
  capture: (workspaceRoot: string) => Promise<WorkspaceStateCapture>,
  workspaceRoot: string,
): Promise<{ state: WorkspaceStateCapture; failed: boolean }> {
  try {
    return { state: await capture(workspaceRoot), failed: false };
  } catch {
    return { state: unavailableWorkspaceState(), failed: true };
  }
}

function workspaceRootReference(experimentRoot: string, workspaceRoot: string): string {
  const candidate = relative(resolve(experimentRoot), resolve(workspaceRoot)).split(sep).join('/');
  // The production materializer places the workspace below experimentRoot. The
  // stable fallback keeps dependency-injected test workspaces non-absolute and
  // does not leak a machine-specific temporary path into durable evidence.
  return candidate.length > 0 && !candidate.startsWith('../') && candidate !== '..'
    ? candidate
    : 'evolution-workspace/evolution';
}

function resultFromManifest(input: {
  manifestPath: string;
  manifest: MultiRoundRunManifestV2;
}): MultiRoundExecutionValidationResult {
  return {
    status: 'stopped',
    outcome: input.manifest.outcome,
    stopReason: input.manifest.stopReason,
    manifestPath: input.manifestPath,
    rounds: input.manifest.rounds.map(round => ({
      ...round,
      terminalRoute: round.effectiveTerminalRoute,
    })),
    execution: input.manifest.execution.status === 'not_started' ? null : input.manifest.execution,
    actualParticipantJobs: input.manifest.budget.totalParticipantJobs,
    crossRoundTransitions: input.manifest.rounds.some(round => round.round === 2) ? 1 : 0,
  };
}

async function resolveEffectiveRound(input: {
  round: 1 | 2;
  roundRoot: string;
  baseResult: ProblemAgnosticAgentSolutionLoopResult;
  repositoryRoot: string;
  humanFollowupRoot: string;
  workflowInstanceRef: string;
  participant: WorkspaceAgentParticipantOptions;
  sourceFingerprintSha256: string;
  reviewContinuationCount: 0 | 1;
  runReviewContinuation: (input: RunReviewContinuationInput) => Promise<ReviewContinuationResult>;
}): Promise<EffectiveRoundResolution> {
  const baseRoute = terminalRoute(input.baseResult);
  const baseReasonCode = input.baseResult.status === 'completed' ? input.baseResult.decision.reasonCode : null;
  let continuation: ReviewContinuationResult | null = null;
  if (
    input.baseResult.status === 'completed'
    && input.baseResult.decision.route === 'DEFER_MORE_WORK_REQUESTED'
    && input.reviewContinuationCount === 0
  ) {
    continuation = await input.runReviewContinuation({
      round: input.round,
      repositoryRoot: input.repositoryRoot,
      humanFollowupRoot: input.humanFollowupRoot,
      workflowInstanceRef: input.workflowInstanceRef,
      roundRoot: input.roundRoot,
      sourceRunRef: input.baseResult.sourceRunRef,
      sourceFingerprintSha256: input.sourceFingerprintSha256,
      participant: input.participant,
    });
  }
  const effectiveRoute = continuation?.terminalRoute ?? baseRoute;
  const effectiveReasonCode = continuation?.terminalReasonCode ?? baseReasonCode;
  const participantJobs = input.baseResult.actualParticipantJobs + (continuation?.participantJobs ?? 0);
  let acceptedArtifacts: EffectiveRoundResolution['acceptedArtifacts'] = null;
  if (effectiveRoute === 'READY_FOR_CONFIG_EXECUTION') {
    if (continuation?.status === 'completed') {
      if (continuation.effectiveReviewPath === null) throw new Error('continuation READY_FOR_CONFIG_EXECUTION is missing an effective Reviewer artifact');
      acceptedArtifacts = {
        problemPackagePath: join(input.roundRoot, 'problem-package.json'),
        solutionPath: continuation.effectiveSolutionPath,
        reviewPath: continuation.effectiveReviewPath,
      };
    } else {
      acceptedArtifacts = {
        problemPackagePath: join(input.roundRoot, 'problem-package.json'),
        solutionPath: join(input.roundRoot, 'solution-agent/result.json'),
        reviewPath: join(input.roundRoot, 'reviewer-agent/review.json'),
      };
    }
  }
  return {
    baseResult: input.baseResult,
    baseRoute,
    baseReasonCode,
    effectiveRoute,
    effectiveReasonCode,
    continuation,
    participantJobs,
    acceptedArtifacts,
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
  const rounds: RoundManifestEntryV2[] = [];
  const reviewContinuations: ReviewContinuationManifestEntryV2[] = [];
  const execution = emptyExecution();
  let round1ParticipantJobs = 0;
  let reviewContinuationParticipantJobs = 0;
  let round2ParticipantJobs = 0;
  let executionParticipantJobs = 0;
  let outcome: MultiRoundRunManifestV1['outcome'] = 'STOPPED';
  let stopReason = 'UNEXPECTED_STOP';
  let evolutionWorkspace: MutableEvolutionWorkspace | null = null;
  const workspaceStateProvenance: WorkspaceStateProvenanceV1 = {
    schemaVersion: WORKSPACE_STATE_PROVENANCE_SCHEMA_VERSION,
    fingerprintMethod: WORKSPACE_STATE_FINGERPRINT_METHOD,
    workspaceRootRef: 'evolution-workspace/evolution',
    start: unavailableWorkspaceState(),
    executionBoundary: null,
    end: unavailableWorkspaceState(),
    consistencyWarnings: [],
  };
  const captureState = dependencies.captureWorkspaceState ?? captureWorkspaceState;
  const runReviewContinuationDependency = dependencies.runReviewContinuation ?? runReviewContinuation;

  try {
    evolutionWorkspace = await (dependencies.materializeEvolutionWorkspace ?? defaultMaterializeEvolutionWorkspace)({
      authoritativeRoot: resolve(input.authoritativeRoot),
      destinationRoot: join(experimentRoot, 'evolution-workspace'),
    });
    workspaceStateProvenance.workspaceRootRef = workspaceRootReference(
      experimentRoot,
      evolutionWorkspace.workspaceRoot,
    );
    const startCapture = await captureWorkspaceStateBestEffort(captureState, evolutionWorkspace.workspaceRoot);
    workspaceStateProvenance.start = startCapture.state;
    let canEnterRound1 = true;
    if (startCapture.failed || startCapture.state.status !== 'available') {
      addProvenanceWarning(workspaceStateProvenance, 'START_CAPTURE_UNAVAILABLE');
      stopReason = 'WORKSPACE_START_STATE_CAPTURE_FAILURE';
      canEnterRound1 = false;
    } else if (isComparableWorkspaceFingerprint(evolutionWorkspace.workspaceBaselineFingerprintSha256)) {
      if (startCapture.state.fingerprintSha256 !== evolutionWorkspace.workspaceBaselineFingerprintSha256) {
        addProvenanceWarning(workspaceStateProvenance, 'START_BASELINE_MISMATCH');
        stopReason = 'WORKSPACE_BASELINE_MISMATCH';
        canEnterRound1 = false;
      }
    } else {
      addProvenanceWarning(workspaceStateProvenance, 'START_BASELINE_FINGERPRINT_NOT_COMPARABLE');
    }

    if (canEnterRound1) {
      const runSingleRound = dependencies.runSingleRound ?? defaultRunSingleRound;
      const round1Root = join(experimentRoot, 'round-1');
      let round1: ProblemAgnosticAgentSolutionLoopResult;
      try {
        round1 = await runSingleRound({
          round: 1,
          repositoryRoot: evolutionWorkspace.workspaceRoot,
          humanFollowupRoot: resolve(input.authoritativeRoot),
          workflowInstanceRef: input.multiRoundRunRef,
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
        rounds.push(roundManifestV2({
          round: 1,
          root: 'round-1',
          sourceRunRef: preflight.sourceRunRef,
          baseTerminalRoute: terminalRoute(round1),
          baseReasonCode: round1.status === 'completed' ? round1.decision.reasonCode : null,
          continuationRef: null,
          effectiveTerminalRoute: terminalRoute(round1),
          effectiveReasonCode: round1.status === 'completed' ? round1.decision.reasonCode : null,
          nextAction: 'STOP',
        }));
      } else {
        const resolution = await resolveEffectiveRound({
          round: 1,
          roundRoot: round1Root,
          baseResult: round1,
          repositoryRoot: evolutionWorkspace.workspaceRoot,
          humanFollowupRoot: resolve(input.authoritativeRoot),
          workflowInstanceRef: input.multiRoundRunRef,
          participant: input.participant,
          sourceFingerprintSha256: round1.sourceFingerprintSha256,
          reviewContinuationCount: reviewContinuations.length === 1 ? 1 : 0,
          runReviewContinuation: runReviewContinuationDependency,
        });
        if (resolution.continuation !== null) {
          reviewContinuationParticipantJobs = resolution.continuation.participantJobs;
          reviewContinuations.push(continuationManifestEntry(resolution.continuation, 1));
        }
        if (resolution.effectiveRoute !== 'READY_FOR_CONFIG_EXECUTION') {
          outcome = 'NO_CROSS_ROUND_TRANSITION_OBSERVED';
          stopReason = resolution.continuation?.status === 'participant_failure'
            ? 'REVIEW_CONTINUATION_PARTICIPANT_FAILURE'
            : 'ROUND_1_TERMINAL_NOT_READY';
          rounds.push(roundManifestV2({
            round: 1,
            root: 'round-1',
            sourceRunRef: preflight.sourceRunRef,
            baseTerminalRoute: resolution.baseRoute,
            baseReasonCode: resolution.baseReasonCode,
            continuationRef: resolution.continuation?.continuationRef ?? null,
            effectiveTerminalRoute: resolution.effectiveRoute,
            effectiveReasonCode: resolution.effectiveReasonCode,
            nextAction: 'STOP',
          }));
        } else {
          if (resolution.acceptedArtifacts === null) throw new Error('READY_FOR_CONFIG_EXECUTION is missing accepted artifacts');
          rounds.push(roundManifestV2({
            round: 1,
            root: 'round-1',
            sourceRunRef: preflight.sourceRunRef,
            baseTerminalRoute: resolution.baseRoute,
            baseReasonCode: resolution.baseReasonCode,
            continuationRef: resolution.continuation?.continuationRef ?? null,
            effectiveTerminalRoute: resolution.effectiveRoute,
            effectiveReasonCode: resolution.effectiveReasonCode,
            nextAction: 'CONFIGURATION_EXECUTION',
            executionRef: execution.executionRef,
          }));
          const solutionWork = validateSolutionWork(await readJson(resolution.acceptedArtifacts.solutionPath));
          const solutionReview = validateSolutionReview(await readJson(resolution.acceptedArtifacts.reviewPath));
        const acceptedOption = selectedOption(solutionWork, solutionReview.acceptedOptionId ?? '');
        const allowedWritePaths = await deriveAllowedWritePaths({
          workspaceRoot: evolutionWorkspace.workspaceRoot,
          solutionOption: acceptedOption,
        });
          const executionInput = await readAcceptedExecutionInput(
            round1Root,
            evolutionWorkspace.workspaceRoot,
            round1,
            allowedWritePaths,
            input.participant,
            resolution.acceptedArtifacts,
          );
        const beforeStateCapture = await captureWorkspaceStateBestEffort(captureState, evolutionWorkspace.workspaceRoot);
        workspaceStateProvenance.executionBoundary = {
          before: beforeStateCapture.state,
          after: unavailableWorkspaceState(),
        };
        if (beforeStateCapture.failed || beforeStateCapture.state.status !== 'available') {
          addProvenanceWarning(workspaceStateProvenance, 'EXECUTION_BEFORE_CAPTURE_UNAVAILABLE');
        }
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
        const afterStateCapture = await captureWorkspaceStateBestEffort(captureState, evolutionWorkspace.workspaceRoot);
        workspaceStateProvenance.executionBoundary.after = afterStateCapture.state;
        if (afterStateCapture.failed || afterStateCapture.state.status !== 'available') {
          addProvenanceWarning(workspaceStateProvenance, 'EXECUTION_AFTER_CAPTURE_UNAVAILABLE');
        }
        const scope: ScopeVerificationResult = verifyActualChangedFiles(before, after, allowedWritePaths);
        execution.allowedWritePaths = allowedWritePaths;
        execution.actualChangedFiles = scope.actualChangedFiles;
        for (const warning of workspaceStateConsistencyWarnings({
          before: workspaceStateProvenance.executionBoundary.before,
          after: workspaceStateProvenance.executionBoundary.after,
          actualChangedFiles: execution.actualChangedFiles,
        })) {
          addProvenanceWarning(workspaceStateProvenance, warning);
        }
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
                  humanFollowupRoot: resolve(input.authoritativeRoot),
                  workflowInstanceRef: input.multiRoundRunRef,
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
                const resolution = await resolveEffectiveRound({
                  round: 2,
                  roundRoot: round2Root,
                  baseResult: round2,
                  repositoryRoot: evolutionWorkspace.workspaceRoot,
                  humanFollowupRoot: resolve(input.authoritativeRoot),
                  workflowInstanceRef: input.multiRoundRunRef,
                  participant: input.participant,
                  sourceFingerprintSha256: round2.sourceFingerprintSha256,
                  reviewContinuationCount: reviewContinuations.length === 1 ? 1 : 0,
                  runReviewContinuation: runReviewContinuationDependency,
                });
                if (resolution.continuation !== null) {
                  reviewContinuationParticipantJobs += resolution.continuation.participantJobs;
                  reviewContinuations.push(continuationManifestEntry(resolution.continuation, 2));
                }
                rounds.push(roundManifestV2({
                  round: 2,
                  root: 'round-2',
                  sourceRunRef: rerun.runRef,
                  baseTerminalRoute: resolution.baseRoute,
                  baseReasonCode: resolution.baseReasonCode,
                  continuationRef: resolution.continuation?.continuationRef ?? null,
                  effectiveTerminalRoute: resolution.effectiveRoute,
                  effectiveReasonCode: resolution.effectiveReasonCode,
                  nextAction: 'STOP',
                  resultingRunRef: null,
                }));
                outcome = 'CROSS_ROUND_TRANSITION_OBSERVED';
                stopReason = resolution.continuation?.status === 'participant_failure'
                  ? 'REVIEW_CONTINUATION_PARTICIPANT_FAILURE'
                  : 'ROUND_2_COMPLETED';
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
    }
    }
  } catch (error) {
    stopReason = stopReason === 'UNEXPECTED_STOP' ? String(error) : stopReason;
  }

  const totalParticipantJobs = round1ParticipantJobs + reviewContinuationParticipantJobs + executionParticipantJobs + round2ParticipantJobs;
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
  if (evolutionWorkspace !== null) {
    const endCapture = await captureWorkspaceStateBestEffort(captureState, evolutionWorkspace.workspaceRoot);
    workspaceStateProvenance.end = endCapture.state;
    if (endCapture.failed || endCapture.state.status !== 'available') {
      addProvenanceWarning(workspaceStateProvenance, 'END_CAPTURE_UNAVAILABLE');
    }
  }
  const manifest: MultiRoundRunManifestV2 = {
    schemaVersion: 'multi-round-run-manifest-v2',
    multiRoundRunRef: input.multiRoundRunRef,
    initialSourceRunRef: preflight.sourceRunRef,
    limits: {
      maxAgentRounds: MAX_ROUNDS,
      maxCrossRoundTransitions: MAX_TRANSITIONS,
      maxRoundParticipantJobs: MAX_ROUND_PARTICIPANT_JOBS,
      maxReviewContinuations: MAX_REVIEW_CONTINUATIONS,
      maxReviewContinuationParticipantJobs: MAX_REVIEW_CONTINUATION_PARTICIPANT_JOBS,
      maxExecutionParticipantJobs: MAX_EXECUTION_PARTICIPANT_JOBS,
      maxTotalParticipantJobs: MAX_TOTAL_PARTICIPANT_JOBS,
      retryCount: 0,
    },
    rounds,
    reviewContinuations,
    execution,
    budget: {
      round1ParticipantJobs,
      reviewContinuationParticipantJobs,
      executionParticipantJobs,
      round2ParticipantJobs,
      totalParticipantJobs,
      retryCount: 0,
    },
    outcome,
    stopReason,
  };
  await writeCreateOnly(join(experimentRoot, 'workspace-state-provenance.json'), workspaceStateProvenance);
  await writeCreateOnly(manifestPath, manifest);
  return resultFromManifest({ manifestPath, manifest });
}
