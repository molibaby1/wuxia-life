import { dirname, join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { validateProblemPackage } from '../../src/evolution/problemPackageContract';
import { validateSolutionReview } from '../../src/evolution/solutionReviewContract';
import { validateSolutionWork } from '../../src/evolution/solutionWorkContract';
import {
  runConfigurationExecutionParticipant,
  type ConfigurationExecutionParticipantResult,
} from './configurationExecutionParticipant';
import {
  defaultRerunGame,
  defaultVerifyWorkspace,
  type WorkspaceVerificationResult,
} from './multiRoundExecutionValidation';
import { runBoundedSourceTransition, type BoundedSourceTransitionResult } from './runBoundedSourceTransition';
import { prepareAgentWorkspace } from './problemAgnosticSolution/agentWorkspace';
import type { WorkspaceAgentParticipantOptions } from './problemAgnosticSolution/agentParticipant';
import { deriveAllowedWritePaths, snapshotWorkspace, verifyActualChangedFiles } from './executionScopeVerifier';

export interface RunCandidateBoundedSourceTransitionInput {
  authoritativeRoot: string;
  transitionRoot: string;
  sourceRoot: string;
  sourceRunRef: string;
  candidateLaneRoot: string;
  acceptedCandidateArtifacts: {
    problemPackagePath: string;
    solutionPath: string;
    reviewPath: string;
  };
  participant: WorkspaceAgentParticipantOptions;
}

function executionRef(sourceRunRef: string): string {
  return `configuration-execution-${sourceRunRef.slice(0, 32)}-000001`;
}

export async function runCandidateBoundedSourceTransition(
  input: RunCandidateBoundedSourceTransitionInput,
): Promise<BoundedSourceTransitionResult> {
  const problemPackage = validateProblemPackage(JSON.parse(await readFile(input.acceptedCandidateArtifacts.problemPackagePath, 'utf8')) as unknown);
  const solutionWork = validateSolutionWork(JSON.parse(await readFile(input.acceptedCandidateArtifacts.solutionPath, 'utf8')) as unknown);
  const solutionReview = validateSolutionReview(JSON.parse(await readFile(input.acceptedCandidateArtifacts.reviewPath, 'utf8')) as unknown);
  if (solutionWork.problemId !== problemPackage.problemId || solutionReview.problemId !== problemPackage.problemId) throw new Error('source transition artifacts have mismatched problem identity');
  if (solutionWork.status !== 'OPTIONS' || solutionReview.decision !== 'ACCEPT_OPTION' || solutionReview.acceptedOptionId === undefined) throw new Error('source transition requires an accepted Solution option');
  const option = solutionWork.options.find(candidate => candidate.optionId === solutionReview.acceptedOptionId);
  if (!option || option.changeScope !== 'configuration' || solutionReview.scopeAssessment !== 'config_only') throw new Error('source transition requires a configuration-only accepted option');
  const allowedWritePaths = await deriveAllowedWritePaths({ workspaceRoot: input.authoritativeRoot, solutionOption: option });
  const prepared = await prepareAgentWorkspace({
    authoritativeRoot: input.authoritativeRoot,
    destinationRoot: join(resolve(input.transitionRoot), 'evolution-workspace'),
    jobKind: 'evolution',
  });
  let scopeStatus: ReturnType<typeof verifyActualChangedFiles> | null = null;
  const result = await runBoundedSourceTransition({
    authoritativeRoot: input.authoritativeRoot,
    transitionRoot: input.transitionRoot,
    sourceRoot: input.sourceRoot,
    sourceRunRef: input.sourceRunRef,
    acceptedCandidateArtifacts: input.acceptedCandidateArtifacts,
    participant: input.participant,
    dependencies: {
      executeConfiguration: async () => {
        const before = await snapshotWorkspace(prepared.workspaceRoot);
        let execution: ConfigurationExecutionParticipantResult;
        try {
          execution = await runConfigurationExecutionParticipant({
            invocationRef: executionRef(input.sourceRunRef),
            destinationRoot: join(input.transitionRoot, 'configuration-execution'),
            workspaceRoot: prepared.workspaceRoot,
            problemPackagePath: input.acceptedCandidateArtifacts.problemPackagePath,
            problemPackage,
            solutionWork,
            solutionReview,
            acceptedOptionId: solutionReview.acceptedOptionId,
            allowedWritePaths,
            authorityRefs: problemPackage.authorityRefs,
            participant: input.participant,
          });
        } finally {
          const after = await snapshotWorkspace(prepared.workspaceRoot);
          scopeStatus = verifyActualChangedFiles(before, after, allowedWritePaths);
        }
        return {
          status: execution.status,
          changedFiles: scopeStatus.actualChangedFiles,
          verificationResults: execution.verificationResults,
          deviations: [
            ...execution.deviations,
            ...(scopeStatus.status === 'scope_violation' ? [`unauthorized files: ${scopeStatus.unauthorizedFiles.join(', ')}`] : []),
          ],
          executionRef: executionRef(input.sourceRunRef),
        };
      },
      verifyScope: async () => scopeStatus?.status === 'passed'
        ? { status: 'passed' as const }
        : { status: 'scope_violation' as const, unauthorizedFiles: scopeStatus?.unauthorizedFiles ?? [] },
      verifyDeterministic: async () => {
        const verification: WorkspaceVerificationResult[] = await defaultVerifyWorkspace({ workspaceRoot: prepared.workspaceRoot, authoritativeRoot: input.authoritativeRoot });
        const failed = verification.find(item => item.status !== 'passed');
        return failed === undefined ? { status: 'passed' as const } : { status: 'failed' as const, details: `${failed.name}: ${failed.details}` };
      },
      rerunSource: async () => {
        const rerun = await defaultRerunGame({
          workspaceRoot: prepared.workspaceRoot,
          previousSourceRoot: input.sourceRoot,
          outRoot: join(input.transitionRoot, 'game-runs'),
          anchorRoot: join(input.transitionRoot, 'run-anchors'),
          runRef: `${input.sourceRunRef.slice(0, 32)}-transition-000001`,
        });
        return { runRef: rerun.runRef, sourceRoot: rerun.outDir };
      },
      validateSealedSource: async value => {
        const rootHash = (await readFile(join(value.sourceRoot, 'experiment-root.sha256'), 'utf8')).trim();
        const { validatePhase0RunSeal } = await import('./phase0/provenance');
        await validatePhase0RunSeal(value.sourceRoot, rootHash);
      },
    },
  });
  return result;
}
