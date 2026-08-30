import { randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import { copyFile, cp, lstat, mkdir, open, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { getP8PersonaById } from '../../src/p8/personas';
import {
  validateSolutionDecision,
  type SolutionDecisionV1,
} from '../../src/evolution/solutionDecisionContract';
import type { ImprovementHypothesis } from '../../src/evolution/improvementHypothesisContract';
import {
  runMinimalExternalFeedback,
  type RunMinimalExternalFeedbackOptions,
  type RunMinimalExternalFeedbackResult,
} from './runMinimalExternalFeedback';
import {
  runImprovementHypothesis,
  type RunImprovementHypothesisOptions,
  type RunImprovementHypothesisResult,
} from './runImprovementHypothesis';
import { selectFirstHypothesis } from './freshProblemTransfer/selectFirstHypothesis';
import {
  canonicalJson,
  sha256Hex,
  validatePhase0RunRef,
  validatePhase0RunSeal,
} from './phase0/provenance';
import {
  captureAuthoritativeFingerprint,
  prepareAgentWorkspace,
  assertAuthoritativeFingerprintUnchanged,
  type PreparedAgentWorkspace,
} from './problemAgnosticSolution/agentWorkspace';
import { buildProblemPackage } from './problemAgnosticSolution/buildProblemPackage';
import { assertRepoReferenceFile } from './problemAgnosticSolution/repoReference';
import {
  runSolutionAgent,
  type RunSolutionAgentInput,
  type SolutionAgentRunResult,
} from './problemAgnosticSolution/runSolutionAgent';
import {
  runSolutionReviewer,
  type RunSolutionReviewerInput,
  type SolutionReviewerRunResult,
} from './problemAgnosticSolution/runSolutionReviewer';
import { routeSolutionDecision } from './problemAgnosticSolution/routeSolutionDecision';
import { buildHumanReviewPackage } from './problemAgnosticSolution/buildHumanReviewPackage';
import { retainHumanFollowupWorkItem } from './humanFollowup/retainHumanFollowupWorkItem';
import type { WorkspaceAgentParticipantOptions } from './problemAgnosticSolution/agentParticipant';
import {
  buildParticipantFailureOutcome,
  proveLegacyParticipantFailure,
} from './problemAgnosticSolution/participantFailureRouting';
import type { ParticipantFailureOutcomeV1, ParticipantFailureStage } from '../../src/evolution/participantFailureOutcomeContract';
import { pathToFileURL } from 'node:url';
import type { ProblemPackageV1 } from '../../src/evolution/problemPackageContract';
import {
  REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
  SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
} from './problemAgnosticSolution/solutionParticipantSkills';

export const DEFAULT_EXPERIMENT_ROOT = '.tmp/evolution/problem-agnostic-agent-solution-loop';

export interface FixedSourcePreflight {
  sourceRunRef: string;
  sourceRoot: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  sourceFingerprintSha256: string;
}

export interface ProblemAgnosticLoopDependencies {
  preflightFixedSource?: (input: { repositoryRoot: string; fixedSourceRoot: string }) => Promise<FixedSourcePreflight>;
  runExternalFeedback?: (options: RunMinimalExternalFeedbackOptions) => Promise<RunMinimalExternalFeedbackResult>;
  runImprovementHypothesis?: (options: RunImprovementHypothesisOptions) => Promise<RunImprovementHypothesisResult>;
  runSolutionAgent?: (input: RunSolutionAgentInput) => Promise<SolutionAgentRunResult>;
  runSolutionReviewer?: (input: RunSolutionReviewerInput) => Promise<SolutionReviewerRunResult>;
}

export interface RunProblemAgnosticAgentSolutionLoopOptions {
  repositoryRoot?: string;
  humanFollowupRoot?: string;
  workflowInstanceRef?: string;
  fixedSourceRoot: string;
  experimentRoot?: string;
  apiKey?: string;
  participantMode?: 'deepseek' | 'local-subagent';
  workspaceAgentParticipant?: WorkspaceAgentParticipantOptions;
  authorityRefs?: string[];
  dependencies?: ProblemAgnosticLoopDependencies;
}

interface CompletedProblemAgnosticAgentSolutionLoopResult {
  status: 'completed';
  sourceRunRef: string;
  sourceExperimentRootHash: string;
  sourceFingerprintSha256: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  selectedHypothesis?: ImprovementHypothesis;
  problemPackagePath: string | null;
  decisionPath: string;
  humanReviewPackagePath: string;
  actualParticipantJobs: number;
  decision: SolutionDecisionV1;
  solutionInvocationRef: string | null;
  reviewerInvocationRef: string | null;
  oldInvestigationCalls: 0;
  oldModificationWorkCalls: 0;
  configGameplayExecutionCount: 0;
}

interface ParticipantFailureProblemAgnosticAgentSolutionLoopResult {
  status: 'participant_failure';
  sourceRunRef: string;
  workflowOutcomePath: string;
  outcome: ParticipantFailureOutcomeV1;
  actualParticipantJobs: number;
  decisionPath: null;
  problemPackagePath: string | null;
  solutionInvocationRef: null;
  reviewerInvocationRef: null;
  oldInvestigationCalls: 0;
  oldModificationWorkCalls: 0;
  configGameplayExecutionCount: 0;
}

export type ProblemAgnosticAgentSolutionLoopResult =
  | CompletedProblemAgnosticAgentSolutionLoopResult
  | ParticipantFailureProblemAgnosticAgentSolutionLoopResult;

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
  await mkdir(resolve(path, '..'), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(`${canonicalJson(value)}\n`);
  } finally {
    await handle.close();
  }
}

async function writeParticipantFailureOutcome(input: {
  repositoryRoot: string;
  experimentRoot: string;
  sourceRunRef: string;
  stage: ParticipantFailureStage;
  participantErrorKind: string;
  failureArtifactRefs: string[];
  problemPackagePath: string | null;
}): Promise<ParticipantFailureProblemAgnosticAgentSolutionLoopResult> {
  const outcome = await buildParticipantFailureOutcome(input);
  const workflowOutcomePath = join(input.experimentRoot, 'workflow-outcome.json');
  await writeCreateOnly(workflowOutcomePath, outcome);
  return {
    status: 'participant_failure',
    sourceRunRef: input.sourceRunRef,
    workflowOutcomePath,
    outcome,
    actualParticipantJobs: outcome.budget.actualParticipantJobs,
    decisionPath: null,
    problemPackagePath: input.problemPackagePath,
    solutionInvocationRef: null,
    reviewerInvocationRef: null,
    oldInvestigationCalls: 0,
    oldModificationWorkCalls: 0,
    configGameplayExecutionCount: 0,
  };
}

export async function preflightFixedSource(input: {
  repositoryRoot: string;
  fixedSourceRoot: string;
}): Promise<FixedSourcePreflight> {
  const sourceRoot = resolve(input.fixedSourceRoot);
  const expectedRootHash = (await readFile(join(sourceRoot, 'experiment-root.sha256'), 'utf8')).trim();
  await validatePhase0RunSeal(sourceRoot, expectedRootHash);
  const manifest = JSON.parse(await readFile(join(sourceRoot, 'experiment-root.json'), 'utf8')) as { runRef?: string };
  const sourceRunRef = validatePhase0RunRef(typeof manifest.runRef === 'string' ? manifest.runRef : '');
  const observablePayload = await readFile(join(sourceRoot, 'reviewer-input/observable-payload.json'));
  const sourceFingerprint = await readFile(join(sourceRoot, 'provenance/source-fingerprint.json'));
  return {
    sourceRunRef,
    sourceRoot,
    experimentRootHash: expectedRootHash,
    observablePayloadHash: sha256Hex(observablePayload),
    sourceFingerprintSha256: sha256Hex(sourceFingerprint),
  };
}

function noProblemDecision(actualParticipantJobs: number): SolutionDecisionV1 {
  return validateSolutionDecision({
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
}

async function copyFreshObservable(sourceRoot: string, experimentRoot: string): Promise<void> {
  const source = join(sourceRoot, 'reviewer-input/observable-payload.json');
  const destination = join(experimentRoot, 'source/observable-payload.json');
  await mkdir(resolve(destination, '..'), { recursive: true });
  await copyFile(source, destination, fsConstants.COPYFILE_EXCL);
}

async function copySealedPhase0Source(
  sourceRoot: string,
  experimentRoot: string,
  sourceRunRef: string,
): Promise<void> {
  const destination = join(experimentRoot, 'game-runs', sourceRunRef);
  await mkdir(resolve(destination, '..'), { recursive: true });
  await cp(sourceRoot, destination, { recursive: true, force: false, errorOnExist: true });
}

function selectedOptionScope(
  solution: SolutionAgentRunResult,
  reviewer: SolutionReviewerRunResult,
): 'configuration' | 'program' | 'mixed' | 'uncertain' | null {
  if (!solution.ok || !reviewer.ok || reviewer.review.acceptedOptionId === undefined) return solution.ok
    ? solution.result.options[0]?.changeScope ?? null
    : null;
  return solution.result.options.find(option => option.optionId === reviewer.review.acceptedOptionId)?.changeScope ?? null;
}

export async function runProblemAgnosticAgentSolutionLoop(
  options: RunProblemAgnosticAgentSolutionLoopOptions,
): Promise<ProblemAgnosticAgentSolutionLoopResult> {
  if (!options.fixedSourceRoot) {
    throw new Error('fixedSourceRoot must be explicitly provided by the execution host');
  }
  const participant = options.workspaceAgentParticipant;
  if (!participant) {
    throw new Error('workspaceAgentParticipant must be explicitly provided by the execution host');
  }
  if (options.participantMode !== 'local-subagent' && !options.apiKey?.trim()) {
    throw new Error('apiKey is required unless participantMode is local-subagent');
  }
  const repositoryRoot = resolve(options.repositoryRoot ?? process.cwd());
  const fixedSourceRoot = resolve(options.fixedSourceRoot);
  const experimentRoot = resolve(options.experimentRoot ?? join(repositoryRoot, DEFAULT_EXPERIMENT_ROOT));
  const humanFollowupRoot = resolve(options.humanFollowupRoot ?? repositoryRoot);
  const workflowRef = relative(repositoryRoot, experimentRoot).split(sep).join('/') || 'repository-root-workflow';
  const workflowInstanceRef = options.workflowInstanceRef
    ?? `workflow-${randomUUID()}`;
  await assertAbsent(experimentRoot, 'problem-agnostic experiment root');
  await mkdir(experimentRoot, { recursive: true });
  const dependencies = options.dependencies ?? {};
  const preflight = await (dependencies.preflightFixedSource ?? preflightFixedSource)({ repositoryRoot, fixedSourceRoot });
  const sourceRunRef = preflight.sourceRunRef;
  await copyFreshObservable(preflight.sourceRoot, experimentRoot);

  const feedbackRunner = dependencies.runExternalFeedback ?? runMinimalExternalFeedback;
  const hypothesisRunner = dependencies.runImprovementHypothesis ?? runImprovementHypothesis;
  const persona = getP8PersonaById('p8-martial-lin');
  if (!persona) throw new Error('fixed workflow participant persona is unavailable');
  let feedback: RunMinimalExternalFeedbackResult;
  try {
    feedback = await feedbackRunner({
      runRef: sourceRunRef,
      sourceRunPath: preflight.sourceRoot,
      persona,
      seed: 0,
      endAge: 0,
      catalogVersion: 'sealed-cohort-source',
      outRoot: experimentRoot,
      apiKey: options.apiKey,
      ...(options.participantMode === 'local-subagent' ? { localParticipant: participant } : {}),
    });
  } catch (error) {
    const provenFailure = await proveLegacyParticipantFailure({
      experimentRoot,
      stage: 'EXTERNAL_FEEDBACK',
      runRef: sourceRunRef,
    });
    if (!provenFailure) throw error;
    return writeParticipantFailureOutcome({
      repositoryRoot,
      experimentRoot,
      sourceRunRef,
      stage: 'EXTERNAL_FEEDBACK',
      participantErrorKind: provenFailure.participantErrorKind,
      failureArtifactRefs: provenFailure.failureArtifactRefs,
      problemPackagePath: null,
    });
  }
  await copySealedPhase0Source(preflight.sourceRoot, experimentRoot, sourceRunRef);
  let hypothesis: RunImprovementHypothesisResult;
  try {
    hypothesis = await hypothesisRunner({
      runRef: sourceRunRef,
      sourceRoot: experimentRoot,
      outRoot: experimentRoot,
      apiKey: options.apiKey,
      ...(options.participantMode === 'local-subagent' ? { localParticipant: participant } : {}),
    });
  } catch (error) {
    const provenFailure = await proveLegacyParticipantFailure({
      experimentRoot,
      stage: 'IMPROVEMENT_HYPOTHESIS',
      runRef: sourceRunRef,
    });
    if (!provenFailure) throw error;
    return writeParticipantFailureOutcome({
      repositoryRoot,
      experimentRoot,
      sourceRunRef,
      stage: 'IMPROVEMENT_HYPOTHESIS',
      participantErrorKind: provenFailure.participantErrorKind,
      failureArtifactRefs: provenFailure.failureArtifactRefs,
      problemPackagePath: null,
    });
  }
  const selectionPath = join(experimentRoot, 'selection/selected-hypothesis.json');
  const selection = await selectFirstHypothesis({
    sourceHypothesesPath: join(hypothesis.hypothesisDir, 'hypotheses.json'),
    destinationPath: selectionPath,
  });

  const authorityRefs = options.authorityRefs ?? [
    'docs/product/player-model.md',
    'docs/product/auto-evolution-model.md',
    'docs/governance/project-convergence.md',
    'docs/governance/product-decisions.md',
    'docs/governance/current-product-stage.md',
    'docs/governance/ai-collaboration-workflow.md',
  ];
  const decisionPath = join(experimentRoot, 'decision.json');
  if (!selection) {
    const decision = noProblemDecision(2);
    await writeCreateOnly(decisionPath, decision);
    const humanReviewPackagePath = await buildHumanReviewPackage({
      destinationPath: join(experimentRoot, 'human-review-package.md'),
      sourceRunRef,
      sourceRunHash: preflight.experimentRootHash,
      feedbackInvocationRef: feedback.invocationRef,
      hypothesisInvocationRef: hypothesis.hypothesisInvocationRef,
      selectedHypothesis: null,
      problemPackageSha256: null,
      solutionWorkspaceBaselineFingerprintSha256: null,
      reviewerWorkspaceBaselineFingerprintSha256: null,
      solutionInvocationRef: null,
      solutionResult: null,
      reviewerInvocationRef: null,
      reviewerResult: null,
      decision,
      actualParticipantJobs: 2,
      architectureAudit: {
        newActivePathContainsDomainBranch: false,
        oldHypothesisInvestigationInvoked: false,
        oldModificationWorkInvoked: false,
        authoritativeRepoChangedByAgentJobs: false,
        solutionReviewerBaselineFingerprintsMatch: true,
        reviewerDerivedFromSolutionWorkspace: false,
        configGameplayExecutionPerformed: false,
      },
    });
    return {
      status: 'completed',
      sourceRunRef,
      sourceExperimentRootHash: preflight.experimentRootHash,
      sourceFingerprintSha256: preflight.sourceFingerprintSha256,
      feedbackInvocationRef: feedback.invocationRef,
      hypothesisInvocationRef: hypothesis.hypothesisInvocationRef,
      problemPackagePath: null,
      decisionPath,
      humanReviewPackagePath,
      actualParticipantJobs: 2,
      decision,
      solutionInvocationRef: null,
      reviewerInvocationRef: null,
      oldInvestigationCalls: 0,
      oldModificationWorkCalls: 0,
      configGameplayExecutionCount: 0,
    };
  }

  for (const authorityRef of authorityRefs) {
    try {
      await assertRepoReferenceFile(repositoryRoot, authorityRef, 'authorityRef');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`invalid authorityRef: ${authorityRef}: ${message}`);
    }
  }
  const authoritativeFingerprint = await captureAuthoritativeFingerprint(repositoryRoot);
  const problemPackagePath = join(experimentRoot, 'problem-package.json');
  const problemPackage = await buildProblemPackage({
    selectedHypothesisPath: selectionPath,
    runRef: sourceRunRef,
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: `feedback-runs/${sourceRunRef}/feedback.json`,
    improvementHypothesisRef: `hypothesis-runs/${sourceRunRef}/hypotheses.json`,
    authorityRefs,
    productSourceFingerprintSha256: authoritativeFingerprint,
    destinationPath: problemPackagePath,
  });
  const sourceArtifact = { artifactSourceRoot: experimentRoot, artifactRelativePaths: ['source/observable-payload.json'] };
  const workspacesRoot = join(experimentRoot, 'agent-workspaces');
  const solutionWorkspace = await prepareAgentWorkspace({
    authoritativeRoot: repositoryRoot,
    destinationRoot: workspacesRoot,
    jobKind: 'solution',
    ...sourceArtifact,
  });
  await assertAuthoritativeFingerprintUnchanged(repositoryRoot, authoritativeFingerprint);

  const solutionRunner = dependencies.runSolutionAgent ?? runSolutionAgent;
  const reviewerRunner = dependencies.runSolutionReviewer ?? runSolutionReviewer;
  const solution = await solutionRunner({
    problemPackage,
    problemPackagePath,
    workspaceRoot: solutionWorkspace.workspaceRoot,
    artifactRoot: experimentRoot,
    workspaceBaselineFingerprintSha256: solutionWorkspace.workspaceBaselineFingerprintSha256,
    invocationRef: 'solution-agent-000001',
    jobNumber: 3,
    destinationRoot: join(experimentRoot, 'solution-agent'),
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    participant,
  });
  await assertAuthoritativeFingerprintUnchanged(repositoryRoot, authoritativeFingerprint);
  if (!solution.ok) {
    return writeParticipantFailureOutcome({
      repositoryRoot,
      experimentRoot,
      sourceRunRef,
      stage: 'SOLUTION',
      participantErrorKind: solution.errorKind,
      failureArtifactRefs: [solution.invocationPath, solution.rawOutputPath, solution.failurePath],
      problemPackagePath,
    });
  }

  let reviewer: SolutionReviewerRunResult | null = null;
  let reviewerWorkspace: PreparedAgentWorkspace | null = null;
  if (solution.result.status === 'OPTIONS') {
    reviewerWorkspace = await prepareAgentWorkspace({
      authoritativeRoot: repositoryRoot,
      destinationRoot: workspacesRoot,
      jobKind: 'reviewer',
      ...sourceArtifact,
    });
    if (solutionWorkspace.workspaceBaselineFingerprintSha256 !== reviewerWorkspace.workspaceBaselineFingerprintSha256) {
      throw new Error('solution and reviewer workspace baselines do not match');
    }
    await assertAuthoritativeFingerprintUnchanged(repositoryRoot, authoritativeFingerprint);
    reviewer = await reviewerRunner({
      problemPackage,
      problemPackagePath,
      solutionWork: solution.result,
      workspaceRoot: reviewerWorkspace.workspaceRoot,
      artifactRoot: experimentRoot,
      workspaceBaselineFingerprintSha256: reviewerWorkspace.workspaceBaselineFingerprintSha256,
      invocationRef: 'solution-reviewer-000001',
      jobNumber: 4,
      destinationRoot: join(experimentRoot, 'reviewer-agent'),
      skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
      participant,
    });
    await assertAuthoritativeFingerprintUnchanged(repositoryRoot, authoritativeFingerprint);
    if (!reviewer.ok) {
      return writeParticipantFailureOutcome({
        repositoryRoot,
        experimentRoot,
        sourceRunRef,
        stage: 'REVIEWER',
        participantErrorKind: reviewer.errorKind,
        failureArtifactRefs: [reviewer.invocationPath, reviewer.rawOutputPath, reviewer.failurePath],
        problemPackagePath,
      });
    }
  }

  const solutionStatus = solution.result.status;
  const reviewerDecision = reviewer?.ok ? reviewer.review.decision : null;
  const decision = routeSolutionDecision({
    problemId: problemPackage.problemId,
    solutionStatus,
    reviewerDecision,
    solutionScope: selectedOptionScope(solution, reviewer ?? { ok: false } as SolutionReviewerRunResult),
    reviewScope: reviewer?.ok ? reviewer.review.scopeAssessment ?? null : null,
    permissions: problemPackage.permissions,
    budget: { actualParticipantJobs: reviewer ? 4 : 3, maxParticipantJobs: 4, retryCount: 0 },
  });
  await writeCreateOnly(decisionPath, decision);
  const problemPackageSha256 = sha256Hex(await readFile(problemPackagePath));
  const humanReviewPackagePath = await buildHumanReviewPackage({
    destinationPath: join(experimentRoot, 'human-review-package.md'),
    sourceRunRef,
    sourceRunHash: preflight.experimentRootHash,
    feedbackInvocationRef: feedback.invocationRef,
    hypothesisInvocationRef: hypothesis.hypothesisInvocationRef,
    selectedHypothesis: selection.selectedHypothesis,
    problemPackageSha256,
    solutionWorkspaceBaselineFingerprintSha256: solutionWorkspace.workspaceBaselineFingerprintSha256,
    reviewerWorkspaceBaselineFingerprintSha256: reviewerWorkspace?.workspaceBaselineFingerprintSha256 ?? null,
    solutionInvocationRef: 'solution-agent-000001',
    solutionResult: solution.result,
    reviewerInvocationRef: reviewer?.ok ? 'solution-reviewer-000001' : null,
    reviewerResult: reviewer?.ok ? reviewer.review : null,
    decision,
    actualParticipantJobs: reviewer ? 4 : 3,
    architectureAudit: {
      newActivePathContainsDomainBranch: false,
      oldHypothesisInvestigationInvoked: false,
      oldModificationWorkInvoked: false,
      authoritativeRepoChangedByAgentJobs: false,
      solutionReviewerBaselineFingerprintsMatch: reviewerWorkspace === null
        || solutionWorkspace.workspaceBaselineFingerprintSha256 === reviewerWorkspace.workspaceBaselineFingerprintSha256,
      reviewerDerivedFromSolutionWorkspace: false,
      configGameplayExecutionPerformed: false,
    },
  });
  if (decision.route === 'ESCALATE_HUMAN') {
    await retainHumanFollowupWorkItem({
      repositoryRoot: humanFollowupRoot,
      workflowRoot: experimentRoot,
      workflowInstanceRef,
      sourceRunRef,
      sourceFingerprintSha256: preflight.sourceFingerprintSha256,
      problemPackagePath,
      decisionPath,
    });
  }
  return {
    status: 'completed',
    sourceRunRef,
    sourceExperimentRootHash: preflight.experimentRootHash,
    sourceFingerprintSha256: preflight.sourceFingerprintSha256,
    feedbackInvocationRef: feedback.invocationRef,
    hypothesisInvocationRef: hypothesis.hypothesisInvocationRef,
    selectedHypothesis: selection.selectedHypothesis,
    problemPackagePath,
    decisionPath,
    humanReviewPackagePath,
    actualParticipantJobs: reviewer ? 4 : 3,
    decision,
    solutionInvocationRef: 'solution-agent-000001',
    reviewerInvocationRef: reviewer?.ok ? 'solution-reviewer-000001' : null,
    oldInvestigationCalls: 0,
    oldModificationWorkCalls: 0,
    configGameplayExecutionCount: 0,
  };
}

async function main(): Promise<void> {
  throw new Error('direct CLI execution requires an explicit workspaceAgentParticipant binding from the execution host');
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
