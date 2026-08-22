import { constants as fsConstants } from 'node:fs';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  validateProblemPackage,
  type ProblemPackageV1,
} from '../../../src/evolution/problemPackageContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import {
  captureAuthoritativeFingerprint,
  prepareAgentWorkspace,
  assertAuthoritativeFingerprintUnchanged,
  type PreparedAgentWorkspace,
} from './agentWorkspace';
import type { WorkspaceAgentParticipantOptions } from './agentParticipant';
import {
  runSolutionAgent,
  type RunSolutionAgentInput,
  type SolutionAgentRunResult,
} from './runSolutionAgent';
import {
  runSolutionReviewer,
  type RunSolutionReviewerInput,
  type SolutionReviewerRunResult,
} from './runSolutionReviewer';
import type { ParticipantSkillAssignment } from './solutionParticipantSkills';

export type SkillBehavioralCondition = 'off' | 'on';

export interface SkillConditionAssignments {
  off: readonly ParticipantSkillAssignment[];
  on: readonly ParticipantSkillAssignment[];
}

export interface SkillBehavioralValidationDependencies {
  runSolutionAgent?: (input: RunSolutionAgentInput) => Promise<SolutionAgentRunResult>;
  runSolutionReviewer?: (input: RunSolutionReviewerInput) => Promise<SolutionReviewerRunResult>;
}

export interface RunSkillBehavioralValidationOptions {
  repositoryRoot: string;
  experimentRoot: string;
  problemPackage: ProblemPackageV1;
  problemPackagePath: string;
  sourceRunRef: string;
  sourceExperimentRootHash: string;
  sourceFingerprintSha256: string;
  participant: WorkspaceAgentParticipantOptions;
  solutionSkillAssignments: SkillConditionAssignments;
  reviewerSkillAssignments: SkillConditionAssignments;
  dependencies?: SkillBehavioralValidationDependencies;
}

export interface SolutionConditionRun {
  condition: SkillBehavioralCondition;
  workspaceRoot: string;
  workspaceBaselineFingerprintSha256: string;
  invocationRef: string;
  run: SolutionAgentRunResult;
}

export interface ReviewerConditionRun {
  condition: SkillBehavioralCondition;
  workspaceRoot: string;
  workspaceBaselineFingerprintSha256: string;
  invocationRef: string;
  run: SolutionReviewerRunResult;
}

type SolutionConditionRuns = Partial<Record<SkillBehavioralCondition, SolutionConditionRun>>;
type ReviewerConditionRuns = Partial<Record<SkillBehavioralCondition, ReviewerConditionRun>>;

interface SkillBehavioralValidationBase {
  sourceRunRef: string;
  sourceExperimentRootHash: string;
  sourceFingerprintSha256: string;
  problemPackageSha256: string;
  actualParticipantJobs: number;
  maxParticipantJobs: 4;
  retryCount: 0;
  configGameplayExecutionCount: 0;
}

export interface SkillBehavioralValidationResultValid extends SkillBehavioralValidationBase {
  status: 'PROTOCOL_VALID';
  solution: {
    off: SolutionConditionRun;
    on: SolutionConditionRun;
  };
  reviewer: {
    off: ReviewerConditionRun;
    on: ReviewerConditionRun;
  };
}

export interface SkillBehavioralValidationResultStopped extends SkillBehavioralValidationBase {
  status: 'PROTOCOL_STOPPED';
  solution: SolutionConditionRuns;
  reviewer: ReviewerConditionRuns | null;
  stopReason?: string;
}

export type SkillBehavioralValidationResult =
  | SkillBehavioralValidationResultValid
  | SkillBehavioralValidationResultStopped;

async function copyProblemPackage(input: RunSkillBehavioralValidationOptions): Promise<{
  path: string;
  sha256: string;
}> {
  const destinationPath = join(resolve(input.experimentRoot), 'problem-package.json');
  await mkdir(resolve(input.experimentRoot), { recursive: true });
  await copyFile(input.problemPackagePath, destinationPath, fsConstants.COPYFILE_EXCL);
  const bytes = await readFile(destinationPath);
  const filePackage = validateProblemPackage(JSON.parse(bytes.toString('utf8')));
  if (canonicalJson(filePackage) !== canonicalJson(input.problemPackage)) {
    throw new Error('Problem Package bytes do not match the supplied validated package');
  }
  return { path: destinationPath, sha256: sha256Hex(bytes) };
}

function assertSourceBinding(input: RunSkillBehavioralValidationOptions): void {
  if (input.problemPackage.source.runRef !== input.sourceRunRef) {
    throw new Error(`Problem Package source runRef does not match fixed source: ${input.problemPackage.source.runRef}`);
  }
  if (!input.sourceExperimentRootHash || !input.sourceFingerprintSha256) {
    throw new Error('sealed source provenance must be explicitly supplied');
  }
}

async function prepareConditionWorkspace(input: {
  repositoryRoot: string;
  experimentRoot: string;
  role: 'solution' | 'reviewer';
  condition: SkillBehavioralCondition;
}): Promise<PreparedAgentWorkspace> {
  return prepareAgentWorkspace({
    authoritativeRoot: input.repositoryRoot,
    destinationRoot: join(input.experimentRoot, 'agent-workspaces', `${input.role}-${input.condition}`),
    jobKind: input.role,
  });
}

function protocolStopped(
  input: RunSkillBehavioralValidationOptions,
  packageSha256: string,
  actualParticipantJobs: number,
  solution: SolutionConditionRuns,
  stopReason: string,
  reviewer: ReviewerConditionRuns | null = null,
): SkillBehavioralValidationResultStopped {
  return {
    status: 'PROTOCOL_STOPPED',
    sourceRunRef: input.sourceRunRef,
    sourceExperimentRootHash: input.sourceExperimentRootHash,
    sourceFingerprintSha256: input.sourceFingerprintSha256,
    problemPackageSha256: packageSha256,
    actualParticipantJobs,
    maxParticipantJobs: 4,
    retryCount: 0,
    configGameplayExecutionCount: 0,
    solution,
    reviewer,
    stopReason,
  };
}

export async function runSkillBehavioralValidation(
  input: RunSkillBehavioralValidationOptions,
): Promise<SkillBehavioralValidationResult> {
  assertSourceBinding(input);
  const problemPackage = validateProblemPackage(input.problemPackage);
  const packageCopy = await copyProblemPackage(input);
  const authoritativeFingerprint = await captureAuthoritativeFingerprint(input.repositoryRoot);
  const dependencies = input.dependencies ?? {};
  const solutionRunner = dependencies.runSolutionAgent ?? runSolutionAgent;
  const reviewerRunner = dependencies.runSolutionReviewer ?? runSolutionReviewer;

  let solutionWorkspaces: Record<SkillBehavioralCondition, PreparedAgentWorkspace>;
  try {
    solutionWorkspaces = {
      off: await prepareConditionWorkspace({
        repositoryRoot: input.repositoryRoot,
        experimentRoot: input.experimentRoot,
        role: 'solution',
        condition: 'off',
      }),
      on: await prepareConditionWorkspace({
        repositoryRoot: input.repositoryRoot,
        experimentRoot: input.experimentRoot,
        role: 'solution',
        condition: 'on',
      }),
    };
  } catch (error) {
    return protocolStopped(input, packageCopy.sha256, 0, {}, `Solution workspace preparation failed: ${String(error)}`);
  }
  if (solutionWorkspaces.off.workspaceBaselineFingerprintSha256 !== solutionWorkspaces.on.workspaceBaselineFingerprintSha256) {
    return protocolStopped(input, packageCopy.sha256, 0, {}, 'Solution Skill-off and Skill-on workspace baselines do not match');
  }

  let actualParticipantJobs = 0;
  let solution: SolutionConditionRuns = {};
  const runSolutionCondition = async (
    condition: SkillBehavioralCondition,
    workspace: PreparedAgentWorkspace,
    invocationRef: string,
    jobNumber: number,
  ): Promise<SolutionConditionRun> => {
    actualParticipantJobs += 1;
    const run = await solutionRunner({
      problemPackage,
      problemPackagePath: packageCopy.path,
      workspaceRoot: workspace.workspaceRoot,
      artifactRoot: input.experimentRoot,
      workspaceBaselineFingerprintSha256: workspace.workspaceBaselineFingerprintSha256,
      invocationRef,
      jobNumber,
      destinationRoot: join(input.experimentRoot, `${invocationRef}`),
      skillAssignments: input.solutionSkillAssignments[condition],
      participant: input.participant,
    });
    await assertAuthoritativeFingerprintUnchanged(input.repositoryRoot, authoritativeFingerprint);
    return {
      condition,
      workspaceRoot: workspace.workspaceRoot,
      workspaceBaselineFingerprintSha256: workspace.workspaceBaselineFingerprintSha256,
      invocationRef,
      run,
    };
  };

  try {
    solution.off = await runSolutionCondition('off', solutionWorkspaces.off, 'skill-validation-solution-off-001', 1);
  } catch (error) {
    return protocolStopped(input, packageCopy.sha256, actualParticipantJobs, solution, `Skill-off Solution protocol failure: ${String(error)}`);
  }
  try {
    solution.on = await runSolutionCondition('on', solutionWorkspaces.on, 'skill-validation-solution-on-001', 2);
  } catch (error) {
    return protocolStopped(input, packageCopy.sha256, actualParticipantJobs, solution, `Skill-on Solution protocol failure: ${String(error)}`);
  }
  if (!solution.off || !solution.on) {
    return protocolStopped(input, packageCopy.sha256, actualParticipantJobs, solution, 'Solution pair did not complete valid outputs');
  }
  const completeSolution = { off: solution.off, on: solution.on };
  if (!completeSolution.off.run.ok) {
    return protocolStopped(input, packageCopy.sha256, actualParticipantJobs, completeSolution, 'Skill-off Solution job failed');
  }
  if (!completeSolution.on.run.ok) {
    return protocolStopped(input, packageCopy.sha256, actualParticipantJobs, completeSolution, 'Skill-on Solution job failed');
  }
  if (completeSolution.off.run.result.status !== 'OPTIONS') {
    return protocolStopped(input, packageCopy.sha256, actualParticipantJobs, completeSolution, 'Skill-off Solution did not produce a valid OPTIONS stimulus');
  }

  let reviewerWorkspaces: Record<SkillBehavioralCondition, PreparedAgentWorkspace>;
  try {
    reviewerWorkspaces = {
      off: await prepareConditionWorkspace({
        repositoryRoot: input.repositoryRoot,
        experimentRoot: input.experimentRoot,
        role: 'reviewer',
        condition: 'off',
      }),
      on: await prepareConditionWorkspace({
        repositoryRoot: input.repositoryRoot,
        experimentRoot: input.experimentRoot,
        role: 'reviewer',
        condition: 'on',
      }),
    };
  } catch (error) {
    return protocolStopped(input, packageCopy.sha256, actualParticipantJobs, completeSolution, `Reviewer workspace preparation failed: ${String(error)}`);
  }
  if (reviewerWorkspaces.off.workspaceBaselineFingerprintSha256 !== reviewerWorkspaces.on.workspaceBaselineFingerprintSha256) {
    return protocolStopped(input, packageCopy.sha256, actualParticipantJobs, completeSolution, 'Reviewer Skill-off and Skill-on workspace baselines do not match');
  }

  let reviewer: ReviewerConditionRuns = {};
  const runReviewerCondition = async (
    condition: SkillBehavioralCondition,
    workspace: PreparedAgentWorkspace,
    invocationRef: string,
    jobNumber: number,
  ): Promise<ReviewerConditionRun> => {
    actualParticipantJobs += 1;
    const run = await reviewerRunner({
      problemPackage,
      problemPackagePath: packageCopy.path,
      solutionWork: completeSolution.off.run.result,
      workspaceRoot: workspace.workspaceRoot,
      artifactRoot: input.experimentRoot,
      workspaceBaselineFingerprintSha256: workspace.workspaceBaselineFingerprintSha256,
      invocationRef,
      jobNumber,
      destinationRoot: join(input.experimentRoot, `${invocationRef}`),
      skillAssignments: input.reviewerSkillAssignments[condition],
      participant: input.participant,
    });
    await assertAuthoritativeFingerprintUnchanged(input.repositoryRoot, authoritativeFingerprint);
    return {
      condition,
      workspaceRoot: workspace.workspaceRoot,
      workspaceBaselineFingerprintSha256: workspace.workspaceBaselineFingerprintSha256,
      invocationRef,
      run,
    };
  };

  try {
    reviewer.off = await runReviewerCondition('off', reviewerWorkspaces.off, 'skill-validation-reviewer-off-001', 3);
  } catch (error) {
    return protocolStopped(input, packageCopy.sha256, actualParticipantJobs, completeSolution, `Skill-off Reviewer protocol failure: ${String(error)}`, reviewer);
  }
  try {
    reviewer.on = await runReviewerCondition('on', reviewerWorkspaces.on, 'skill-validation-reviewer-on-001', 4);
  } catch (error) {
    return protocolStopped(input, packageCopy.sha256, actualParticipantJobs, completeSolution, `Skill-on Reviewer protocol failure: ${String(error)}`, reviewer);
  }
  if (!reviewer.off || !reviewer.on) {
    return protocolStopped(input, packageCopy.sha256, actualParticipantJobs, completeSolution, 'Reviewer pair did not complete valid outputs', reviewer);
  }
  const completeReviewer = { off: reviewer.off, on: reviewer.on };
  if (!completeReviewer.off.run.ok || !completeReviewer.on.run.ok) {
    return protocolStopped(
      input,
      packageCopy.sha256,
      actualParticipantJobs,
      completeSolution,
      'Reviewer pair did not complete valid outputs',
      completeReviewer,
    );
  }

  return {
    status: 'PROTOCOL_VALID',
    sourceRunRef: input.sourceRunRef,
    sourceExperimentRootHash: input.sourceExperimentRootHash,
    sourceFingerprintSha256: input.sourceFingerprintSha256,
    problemPackageSha256: packageCopy.sha256,
    actualParticipantJobs,
    maxParticipantJobs: 4,
    retryCount: 0,
    configGameplayExecutionCount: 0,
    solution: completeSolution,
    reviewer: completeReviewer,
  };
}
