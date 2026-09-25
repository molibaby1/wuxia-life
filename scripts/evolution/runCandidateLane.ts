import { copyFile, mkdir, open, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import type { ImprovementHypothesis } from '../../src/evolution/improvementHypothesisContract';
import { validateSolutionDecision, type SolutionDecisionV1 } from '../../src/evolution/solutionDecisionContract';
import type { ProblemPackage } from '../../src/evolution/problemPackageContract';
import {
  buildBoundedCausalAttribution,
  CAUSAL_ATTRIBUTION_RELATIVE_PATH,
} from './causalAttribution/buildBoundedCausalAttribution';
import { captureAuthoritativeFingerprint, prepareAgentWorkspace, assertAuthoritativeFingerprintUnchanged } from './problemAgnosticSolution/agentWorkspace';
import { buildProblemPackage } from './problemAgnosticSolution/buildProblemPackage';
import { buildHumanReviewPackage } from './problemAgnosticSolution/buildHumanReviewPackage';
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
import type { WorkspaceAgentParticipantOptions } from './problemAgnosticSolution/agentParticipant';
import {
  REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
  SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
} from './problemAgnosticSolution/solutionParticipantSkills';
import { assertRepoReferenceFile } from './problemAgnosticSolution/repoReference';
import { canonicalJson, sha256Hex } from './phase0/provenance';
import {
  buildCandidateLaneFailureV2,
  type CandidateLaneFailureV2,
} from './candidateLaneFailureContract';
import type { ParticipantFailureFacts } from './problemAgnosticSolution/participantFailureClassification';
import { buildPreschoolAutonomousAuthoringContractPacket } from './autonomousAuthoring/buildPreschoolContractPacket';

export interface RunCandidateLaneOptions {
  repositoryRoot: string;
  sourceRoot: string;
  laneRoot: string;
  poolId: string;
  candidateRef: string;
  candidate: ImprovementHypothesis;
  sourceIndex: number;
  hypothesisSetRef: string;
  hypothesisSetSha256: string;
  sourceRunRef: string;
  sourceExperimentRootHash: string;
  sourceFingerprintSha256: string;
  observablePayloadRef: string;
  externalFeedbackRef: string;
  improvementHypothesisRef: string;
  authorityRefs: string[];
  participant: WorkspaceAgentParticipantOptions;
  participantMode: 'deepseek' | 'local-subagent';
  dependencies?: CandidateLaneDependencies;
}

export interface CandidateLaneDependencies {
  runSolutionAgent?: (input: RunSolutionAgentInput) => Promise<SolutionAgentRunResult>;
  runSolutionReviewer?: (input: RunSolutionReviewerInput) => Promise<SolutionReviewerRunResult>;
  captureAuthoritativeFingerprint?: (repositoryRoot: string) => Promise<string>;
  assertAuthoritativeFingerprintUnchanged?: (repositoryRoot: string, expectedFingerprint: string) => Promise<void>;
}

export interface CompletedCandidateLaneResult {
  status: 'completed';
  candidateRef: string;
  hypothesisId: string;
  sourceIndex: number;
  candidateActivationPath: string;
  problemPackagePath: string;
  causalAttributionPath: string;
  decisionPath: string;
  baseDecisionPath: string;
  humanReviewPackagePath: string;
  actualParticipantJobs: 1 | 2;
  decision: SolutionDecisionV1;
  solutionInvocationRef: string;
  reviewerInvocationRef: string | null;
  problemPackage: ProblemPackage;
}

export interface ParticipantFailureCandidateLaneResult {
  status: 'participant_failure';
  candidateRef: string;
  hypothesisId: string;
  sourceIndex: number;
  workflowOutcomeRef: string;
  actualParticipantJobs: 1 | 2;
  failureStage: 'SOLUTION' | 'REVIEWER';
  failure: CandidateLaneFailureV2;
}

export type CandidateLaneResult = CompletedCandidateLaneResult | ParticipantFailureCandidateLaneResult;

async function writeCreateOnly(path: string, value: unknown): Promise<void> {
  await mkdir(resolve(path, '..'), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(`${canonicalJson(value)}\n`);
  } finally {
    await handle.close();
  }
}

function selectedOptionScope(
  solution: SolutionAgentRunResult,
  reviewer: SolutionReviewerRunResult | null,
): 'configuration' | 'program' | 'mixed' | 'uncertain' | null {
  if (!solution.ok || !reviewer?.ok || reviewer.review.acceptedOptionId === undefined) {
    return solution.ok ? solution.result.options[0]?.changeScope ?? null : null;
  }
  return solution.result.options.find(option => option.optionId === reviewer.review.acceptedOptionId)?.changeScope ?? null;
}

async function copySourceArtifact(sourceRoot: string, laneRoot: string, relativePath: string): Promise<void> {
  const source = join(sourceRoot, relativePath);
  const destination = join(laneRoot, relativePath);
  await mkdir(resolve(destination, '..'), { recursive: true });
  await copyFile(source, destination);
}

async function writeFailure(input: {
  laneRoot: string;
  candidateRef: string;
  hypothesisId: string;
  sourceIndex: number;
  stage: 'SOLUTION' | 'REVIEWER';
  actualParticipantJobs: 1 | 2;
  failure: ParticipantFailureFacts;
}): Promise<ParticipantFailureCandidateLaneResult> {
  const workflowOutcomeRef = 'workflow-outcome.json';
  const failure = buildCandidateLaneFailureV2({
    candidateRef: input.candidateRef,
    hypothesisId: input.hypothesisId,
    sourceIndex: input.sourceIndex,
    stage: input.stage,
    actualParticipantJobs: input.actualParticipantJobs,
    failureOrigin: input.failure.origin,
    failureReason: input.failure.reason,
    participantErrorKind: input.failure.participantErrorKind,
    message: input.failure.message,
  });
  await writeCreateOnly(join(input.laneRoot, workflowOutcomeRef), failure);
  return {
    status: 'participant_failure',
    candidateRef: input.candidateRef,
    hypothesisId: input.hypothesisId,
    sourceIndex: input.sourceIndex,
    workflowOutcomeRef,
    actualParticipantJobs: input.actualParticipantJobs,
    failureStage: input.stage,
    failure,
  };
}

export async function runCandidateLane(input: RunCandidateLaneOptions): Promise<CandidateLaneResult> {
  if (!input.candidateRef.endsWith(`/${input.candidate.hypothesisId}`)) throw new Error('candidateRef/hypothesis identity mismatch');
  if (!Number.isInteger(input.sourceIndex) || input.sourceIndex < 0) throw new Error('sourceIndex must be a non-negative integer');
  await mkdir(input.laneRoot, { recursive: true });
  const candidateActivationPath = join(input.laneRoot, 'candidate-activation.json');
  await writeCreateOnly(candidateActivationPath, {
    schemaVersion: 'candidate-activation-v1',
    candidateRef: input.candidateRef,
    poolId: input.poolId,
    hypothesisId: input.candidate.hypothesisId,
    sourceIndex: input.sourceIndex,
    hypothesisSha256: sha256Hex(canonicalJson(input.candidate)),
    hypothesisSetRef: input.hypothesisSetRef,
    hypothesisSetSha256: input.hypothesisSetSha256,
    sourceRunRef: input.sourceRunRef,
  });
  for (const authorityRef of input.authorityRefs) await assertRepoReferenceFile(input.repositoryRoot, authorityRef, 'authorityRef');
  const autonomousAuthoringContractPacket = await buildPreschoolAutonomousAuthoringContractPacket({
    repositoryRoot: input.repositoryRoot,
  });
  await writeCreateOnly(
    join(input.laneRoot, 'autonomous-authoring-contract-packet.json'),
    autonomousAuthoringContractPacket,
  );
  await copySourceArtifact(input.sourceRoot, input.laneRoot, input.observablePayloadRef);
  await copySourceArtifact(input.sourceRoot, input.laneRoot, input.externalFeedbackRef);
  await copySourceArtifact(input.sourceRoot, input.laneRoot, input.improvementHypothesisRef);
  const authoritativeFingerprint = await (input.dependencies?.captureAuthoritativeFingerprint ?? captureAuthoritativeFingerprint)(input.repositoryRoot);
  const assertFingerprintUnchanged = input.dependencies?.assertAuthoritativeFingerprintUnchanged
    ?? (input.dependencies?.captureAuthoritativeFingerprint === undefined
      ? assertAuthoritativeFingerprintUnchanged
      : async (repositoryRoot: string, expectedFingerprint: string) => {
        const actual = await input.dependencies!.captureAuthoritativeFingerprint!(repositoryRoot);
        if (actual !== expectedFingerprint) throw new Error(`authoritative repository fingerprint changed: expected ${expectedFingerprint}, got ${actual}`);
      });
  const causalAttributionPath = join(input.laneRoot, CAUSAL_ATTRIBUTION_RELATIVE_PATH);
  await buildBoundedCausalAttribution({
    sealedPhase0SourceRoot: join(input.sourceRoot, 'game-runs', input.sourceRunRef),
    sealedObservablePayloadPath: join(input.laneRoot, input.observablePayloadRef),
    activeCandidate: input.candidate,
    sourceRunRef: input.sourceRunRef,
    sourceExperimentRootHash: input.sourceExperimentRootHash,
    destinationPath: causalAttributionPath,
  });
  const problemPackagePath = join(input.laneRoot, 'problem-package.json');
  const problemPackage = await buildProblemPackage({
    activeCandidate: input.candidate,
    activeCandidateRef: input.candidateRef,
    activeCandidateSourceIndex: input.sourceIndex,
    runRef: input.sourceRunRef,
    observablePayloadRef: input.observablePayloadRef,
    externalFeedbackRef: input.externalFeedbackRef,
    improvementHypothesisRef: input.improvementHypothesisRef,
    diagnosticEvidenceRefs: [CAUSAL_ATTRIBUTION_RELATIVE_PATH],
    authorityRefs: input.authorityRefs,
    productSourceFingerprintSha256: authoritativeFingerprint,
    destinationPath: problemPackagePath,
  });
  const artifactRelativePaths = [
    input.observablePayloadRef,
    input.externalFeedbackRef,
    input.improvementHypothesisRef,
    CAUSAL_ATTRIBUTION_RELATIVE_PATH,
    'candidate-activation.json',
    'problem-package.json',
  ];
  const workspaceRoot = join(input.laneRoot, 'agent-workspaces');
  const solutionWorkspace = await prepareAgentWorkspace({
    authoritativeRoot: input.repositoryRoot,
    destinationRoot: workspaceRoot,
    jobKind: 'solution',
    artifactSourceRoot: input.laneRoot,
    artifactRelativePaths,
  });
  await assertFingerprintUnchanged(input.repositoryRoot, authoritativeFingerprint);
  const solutionRunner = input.dependencies?.runSolutionAgent ?? runSolutionAgent;
  const reviewerRunner = input.dependencies?.runSolutionReviewer ?? runSolutionReviewer;
  const solution = await solutionRunner({
    problemPackage,
    problemPackagePath,
    workspaceRoot: solutionWorkspace.workspaceRoot,
    repositoryRoot: input.repositoryRoot,
    artifactRoot: input.laneRoot,
    workspaceBaselineFingerprintSha256: solutionWorkspace.workspaceBaselineFingerprintSha256,
    invocationRef: `${input.candidate.hypothesisId}-solution-000001`,
    jobNumber: 1,
    destinationRoot: join(input.laneRoot, 'solution-agent'),
    skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
    autonomousAuthoringContractPacket,
    participant: input.participant,
  });
  await assertFingerprintUnchanged(input.repositoryRoot, authoritativeFingerprint);
  if (!solution.ok) {
    return writeFailure({
      laneRoot: input.laneRoot,
      candidateRef: input.candidateRef,
      hypothesisId: input.candidate.hypothesisId,
      sourceIndex: input.sourceIndex,
      stage: 'SOLUTION',
      actualParticipantJobs: 1,
      failure: solution.failure,
    });
  }
  let reviewer: SolutionReviewerRunResult | null = null;
  let reviewerWorkspace: Awaited<ReturnType<typeof prepareAgentWorkspace>> | null = null;
  if (solution.result.status === 'OPTIONS') {
    reviewerWorkspace = await prepareAgentWorkspace({
      authoritativeRoot: input.repositoryRoot,
      destinationRoot: workspaceRoot,
      jobKind: 'reviewer',
      artifactSourceRoot: input.laneRoot,
      artifactRelativePaths,
    });
    if (reviewerWorkspace.workspaceBaselineFingerprintSha256 !== solutionWorkspace.workspaceBaselineFingerprintSha256) throw new Error('solution and reviewer workspace baselines do not match');
    await assertFingerprintUnchanged(input.repositoryRoot, authoritativeFingerprint);
    reviewer = await reviewerRunner({
      problemPackage,
      problemPackagePath,
      solutionWork: solution.result,
      workspaceRoot: reviewerWorkspace.workspaceRoot,
      repositoryRoot: input.repositoryRoot,
      artifactRoot: input.laneRoot,
      workspaceBaselineFingerprintSha256: reviewerWorkspace.workspaceBaselineFingerprintSha256,
      invocationRef: `${input.candidate.hypothesisId}-reviewer-000001`,
      jobNumber: 2,
      destinationRoot: join(input.laneRoot, 'reviewer-agent'),
      skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
      autonomousAuthoringContractPacket,
      participant: input.participant,
    });
    await assertFingerprintUnchanged(input.repositoryRoot, authoritativeFingerprint);
    if (!reviewer.ok) {
      return writeFailure({
        laneRoot: input.laneRoot,
        candidateRef: input.candidateRef,
        hypothesisId: input.candidate.hypothesisId,
        sourceIndex: input.sourceIndex,
        stage: 'REVIEWER',
        actualParticipantJobs: 2,
        failure: reviewer.failure,
      });
    }
  }
  const decision = routeSolutionDecision({
    problemId: problemPackage.problemId,
    solutionStatus: solution.result.status,
    reviewerDecision: reviewer?.ok ? reviewer.review.decision : null,
    solutionScope: selectedOptionScope(solution, reviewer),
    reviewScope: reviewer?.ok ? reviewer.review.scopeAssessment ?? null : null,
    executionAuthorityAssessment: reviewer?.ok ? reviewer.review.executionAuthorityAssessment ?? null : null,
    permissions: problemPackage.permissions,
    budget: {
      actualParticipantJobs: reviewer ? 2 : 1,
      maxParticipantJobs: 4,
      retryCount: 0,
    },
  });
  const decisionPath = join(input.laneRoot, 'decision.json');
  await writeCreateOnly(decisionPath, decision);
  const problemPackageSha256 = sha256Hex(await readFile(problemPackagePath));
  const humanReviewPackagePath = await buildHumanReviewPackage({
    destinationPath: join(input.laneRoot, 'human-review-package.md'),
    sourceRunRef: input.sourceRunRef,
    sourceRunHash: input.sourceExperimentRootHash,
    feedbackInvocationRef: `source/${input.externalFeedbackRef}`,
    hypothesisInvocationRef: `source/${input.improvementHypothesisRef}`,
    selectedHypothesis: input.candidate,
    problemPackageSha256,
    solutionWorkspaceBaselineFingerprintSha256: solutionWorkspace.workspaceBaselineFingerprintSha256,
    reviewerWorkspaceBaselineFingerprintSha256: reviewerWorkspace?.workspaceBaselineFingerprintSha256 ?? null,
    solutionInvocationRef: `${input.candidate.hypothesisId}-solution-000001`,
    solutionResult: solution.result,
    reviewerInvocationRef: reviewer?.ok ? `${input.candidate.hypothesisId}-reviewer-000001` : null,
    reviewerResult: reviewer?.ok ? reviewer.review : null,
    decision,
    actualParticipantJobs: reviewer ? 2 : 1,
    architectureAudit: {
      newActivePathContainsDomainBranch: false,
      oldHypothesisInvestigationInvoked: false,
      oldModificationWorkInvoked: false,
      authoritativeRepoChangedByAgentJobs: false,
      solutionReviewerBaselineFingerprintsMatch: reviewerWorkspace === null || reviewerWorkspace.workspaceBaselineFingerprintSha256 === solutionWorkspace.workspaceBaselineFingerprintSha256,
      reviewerDerivedFromSolutionWorkspace: false,
      configGameplayExecutionPerformed: false,
    },
  });
  return {
    status: 'completed',
    candidateRef: input.candidateRef,
    hypothesisId: input.candidate.hypothesisId,
    sourceIndex: input.sourceIndex,
    candidateActivationPath,
    problemPackagePath,
    causalAttributionPath,
    decisionPath,
    baseDecisionPath: decisionPath,
    humanReviewPackagePath,
    actualParticipantJobs: reviewer ? 2 : 1,
    decision,
    solutionInvocationRef: `${input.candidate.hypothesisId}-solution-000001`,
    reviewerInvocationRef: reviewer?.ok ? `${input.candidate.hypothesisId}-reviewer-000001` : null,
    problemPackage,
  };
}
