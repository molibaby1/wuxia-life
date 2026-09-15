import { copyFile, cp, lstat, mkdir, readFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { getP8PersonaById } from '../../src/p8/personas';
import {
  parseExternalFeedback,
  validateExternalFeedbackReferences,
  type ExternalFeedback,
} from '../../src/evolution/externalFeedbackContract';
import {
  parseStoredImprovementHypothesisSet,
  validateImprovementHypothesisReferences,
  type ImprovementHypothesis,
  type NoProblemAssessment,
} from '../../src/evolution/improvementHypothesisContract';
import type { WorkspaceAgentParticipantOptions } from './problemAgnosticSolution/agentParticipant';
import {
  captureAuthoritativeFingerprint,
} from './problemAgnosticSolution/agentWorkspace';
import {
  preflightFixedSource,
  type FixedSourcePreflight,
} from './runProblemAgnosticAgentSolutionLoop';
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

export interface CompletedSourceCandidateAnalysisResult {
  status: 'completed';
  sourceRunRef: string;
  sourceRoot: string;
  sourceExperimentRootHash: string;
  sourceFingerprintSha256: string;
  authoritativeFingerprintSha256: string;
  observablePayloadRef: 'source/observable-payload.json';
  externalFeedbackRef: string;
  improvementHypothesisRef: string;
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  hypotheses: ImprovementHypothesis[];
  noProblemAssessment: NoProblemAssessment | null;
  actualParticipantJobs: 2;
}

export interface SourceCandidateAnalysisFailureResult {
  status: 'participant_failure';
  sourceRunRef: string;
  sourceRoot: string;
  stage: 'EXTERNAL_FEEDBACK' | 'IMPROVEMENT_HYPOTHESIS';
  error: unknown;
  actualParticipantJobs: 1 | 2;
}

export type SourceCandidateAnalysisResult = CompletedSourceCandidateAnalysisResult | SourceCandidateAnalysisFailureResult;

export interface SourceCandidateAnalysisDependencies {
  preflightFixedSource?: (input: { repositoryRoot: string; fixedSourceRoot: string }) => Promise<FixedSourcePreflight>;
  runExternalFeedback?: (options: RunMinimalExternalFeedbackOptions) => Promise<RunMinimalExternalFeedbackResult>;
  runImprovementHypothesis?: (options: RunImprovementHypothesisOptions) => Promise<RunImprovementHypothesisResult>;
  captureAuthoritativeFingerprint?: (repositoryRoot: string) => Promise<string>;
}

export interface RunSourceCandidateAnalysisOptions {
  repositoryRoot?: string;
  fixedSourceRoot: string;
  experimentRoot?: string;
  apiKey?: string;
  participantMode?: 'deepseek' | 'local-subagent';
  workspaceAgentParticipant?: WorkspaceAgentParticipantOptions;
  dependencies?: SourceCandidateAnalysisDependencies;
}

const DEFAULT_EXPERIMENT_ROOT = '.tmp/evolution/source-candidate-analysis';

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

async function copyObservable(sourceRoot: string, experimentRoot: string): Promise<void> {
  const destination = join(experimentRoot, 'source/observable-payload.json');
  await mkdir(resolve(destination, '..'), { recursive: true });
  await copyFile(join(sourceRoot, 'reviewer-input/observable-payload.json'), destination);
}

async function copySealedSource(sourceRoot: string, experimentRoot: string, sourceRunRef: string): Promise<void> {
  const destination = join(experimentRoot, 'game-runs', sourceRunRef);
  await mkdir(resolve(destination, '..'), { recursive: true });
  await cp(sourceRoot, destination, { recursive: true, force: false, errorOnExist: true });
}

async function readValidatedSourceArtifacts(input: {
  experimentRoot: string;
  sourceRunRef: string;
}): Promise<{
  feedback: ExternalFeedback;
  hypotheses: ReturnType<typeof parseStoredImprovementHypothesisSet>;
}> {
  const feedback = parseExternalFeedback(await readFile(join(input.experimentRoot, `feedback-runs/${input.sourceRunRef}/feedback.json`), 'utf8'));
  const observablePayload = JSON.parse(await readFile(join(input.experimentRoot, 'source/observable-payload.json'), 'utf8')) as Parameters<typeof validateExternalFeedbackReferences>[1];
  validateExternalFeedbackReferences(feedback, observablePayload);
  const hypotheses = parseStoredImprovementHypothesisSet(await readFile(join(input.experimentRoot, `hypothesis-runs/${input.sourceRunRef}/hypotheses.json`), 'utf8'));
  validateImprovementHypothesisReferences(hypotheses, feedback, observablePayload);
  return { feedback, hypotheses };
}

export async function runSourceCandidateAnalysis(
  options: RunSourceCandidateAnalysisOptions,
): Promise<SourceCandidateAnalysisResult> {
  if (!options.fixedSourceRoot) throw new Error('fixedSourceRoot must be explicitly provided by the execution host');
  if (!options.workspaceAgentParticipant) throw new Error('workspaceAgentParticipant must be explicitly provided by the execution host');
  if (options.participantMode !== 'local-subagent' && !options.apiKey?.trim()) throw new Error('apiKey is required unless participantMode is local-subagent');
  const repositoryRoot = resolve(options.repositoryRoot ?? process.cwd());
  const fixedSourceRoot = resolve(options.fixedSourceRoot);
  const experimentRoot = resolve(options.experimentRoot ?? join(repositoryRoot, DEFAULT_EXPERIMENT_ROOT));
  if (await pathExists(experimentRoot)) throw new Error(`source candidate analysis root already exists: ${experimentRoot}`);
  await mkdir(experimentRoot, { recursive: true });
  const dependencies = options.dependencies ?? {};
  const preflight = await (dependencies.preflightFixedSource ?? preflightFixedSource)({ repositoryRoot, fixedSourceRoot });
  await copyObservable(preflight.sourceRoot, experimentRoot);
  const persona = getP8PersonaById('p8-martial-lin');
  if (!persona) throw new Error('fixed workflow participant persona is unavailable');
  const feedbackRunner = dependencies.runExternalFeedback ?? runMinimalExternalFeedback;
  const hypothesisRunner = dependencies.runImprovementHypothesis ?? runImprovementHypothesis;
  let feedback: RunMinimalExternalFeedbackResult;
  try {
    feedback = await feedbackRunner({
      runRef: preflight.sourceRunRef,
      sourceRunPath: preflight.sourceRoot,
      persona,
      seed: 0,
      endAge: 0,
      catalogVersion: 'sealed-cohort-source',
      outRoot: experimentRoot,
      apiKey: options.apiKey,
      ...(options.participantMode === 'local-subagent' ? { localParticipant: options.workspaceAgentParticipant } : {}),
    });
  } catch (error) {
    return {
      status: 'participant_failure',
      sourceRunRef: preflight.sourceRunRef,
      sourceRoot: preflight.sourceRoot,
      stage: 'EXTERNAL_FEEDBACK',
      error,
      actualParticipantJobs: 1,
    };
  }
  await copySealedSource(preflight.sourceRoot, experimentRoot, preflight.sourceRunRef);
  let hypothesis: RunImprovementHypothesisResult;
  try {
    hypothesis = await hypothesisRunner({
      runRef: preflight.sourceRunRef,
      sourceRoot: experimentRoot,
      outRoot: experimentRoot,
      apiKey: options.apiKey,
      ...(options.participantMode === 'local-subagent' ? { localParticipant: options.workspaceAgentParticipant } : {}),
    });
  } catch (error) {
    return {
      status: 'participant_failure',
      sourceRunRef: preflight.sourceRunRef,
      sourceRoot: preflight.sourceRoot,
      stage: 'IMPROVEMENT_HYPOTHESIS',
      error,
      actualParticipantJobs: 2,
    };
  }
  const artifacts = await readValidatedSourceArtifacts({ experimentRoot, sourceRunRef: preflight.sourceRunRef });
  const authoritativeFingerprintSha256 = await (dependencies.captureAuthoritativeFingerprint ?? captureAuthoritativeFingerprint)(repositoryRoot);
  return {
    status: 'completed',
    sourceRunRef: preflight.sourceRunRef,
    sourceRoot: preflight.sourceRoot,
    sourceExperimentRootHash: preflight.experimentRootHash,
    sourceFingerprintSha256: preflight.sourceFingerprintSha256,
    authoritativeFingerprintSha256,
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: `feedback-runs/${preflight.sourceRunRef}/feedback.json`,
    improvementHypothesisRef: `hypothesis-runs/${preflight.sourceRunRef}/hypotheses.json`,
    feedbackInvocationRef: feedback.invocationRef,
    hypothesisInvocationRef: hypothesis.hypothesisInvocationRef,
    hypotheses: artifacts.hypotheses.hypotheses,
    noProblemAssessment: artifacts.hypotheses.noProblemAssessment,
    actualParticipantJobs: 2,
  };
}
