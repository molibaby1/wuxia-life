import { lstat, mkdir, open, readFile, readdir } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  buildCandidatePoolV1,
  parseCandidatePoolV1,
  type CandidatePoolV1,
} from './candidatePoolContract';
import {
  activateCandidate,
  completeCandidate,
  exhaustPoolIfComplete,
  interruptCandidate,
  markSourceChangePending,
  nextPendingCandidate,
  supersedePendingCandidates,
} from './candidatePoolState';
import {
  canAdmitCandidate,
  consumeHostSliceJobs,
  createHostSliceBudget,
  requiredCandidateAdmissionJobs,
  type HostSliceBudgetV1,
} from './candidateSliceBudget';
import {
  materializeSourceEpochAnchor,
  materializeSourceAnalysisArtifacts,
  materializeCandidateLaneArtifacts,
  readDurableMultiCandidateSessionManifest,
  retainCandidateLaneArtifacts,
  retainSourceAnalysisArtifacts,
  retainSourceEpochAnchor,
  resolveCandidateSessionLocation,
  writeMultiCandidateSessionManifestAtomic,
} from './candidateSessionStore';
import {
  buildMultiCandidateSessionManifestV1,
  parseMultiCandidateSessionManifestV1,
  type HostSliceSummaryV1,
  type LogicalSessionState,
  type MultiCandidateSessionManifestV1,
  type SourceEpochSummaryV1,
} from './multiCandidateSessionManifestContract';
import {
  runSourceCandidateAnalysis,
  type CompletedSourceCandidateAnalysisResult,
  type RunSourceCandidateAnalysisOptions,
} from './runSourceCandidateAnalysis';
import {
  runCandidateLane,
  type CandidateLaneResult,
} from './runCandidateLane';
import {
  runCandidateReviewContinuation,
  type CandidateReviewContinuationResult,
} from './runCandidateReviewContinuation';
import { retainHumanFollowupWorkItem, type RetainedHumanFollowupWorkItem } from './humanFollowup/retainHumanFollowupWorkItem';
import { runBoundedSourceTransition, type BoundedSourceTransitionResult } from './runBoundedSourceTransition';
import { runCandidateBoundedSourceTransition } from './runCandidateBoundedSourceTransition';
import { reconcileActiveCandidate } from './reconcileCandidateSession';
import type { WorkspaceAgentParticipantOptions } from './problemAgnosticSolution/agentParticipant';
import { parseExternalFeedback } from '../../src/evolution/externalFeedbackContract';
import { parseStoredImprovementHypothesisSet } from '../../src/evolution/improvementHypothesisContract';
import { captureAuthoritativeFingerprint } from './problemAgnosticSolution/agentWorkspace';
import { sha256Hex } from './phase0/provenance';

export interface RunMultiCandidateSessionSliceInput {
  mode: 'START_NEW_SESSION' | 'RESUME_SESSION';
  repositoryRoot: string;
  logicalSessionId: string;
  hostSliceId: string;
  participantBindingId: string;
  participant: WorkspaceAgentParticipantOptions;
  repositoryBaseline: { branch: string; headSha: string; workingTreeFingerprint: string };
  initialSourceRoot?: string;
  authorityRefs?: string[];
  dependencies?: MultiCandidateSessionSliceDependencies;
}

export interface MultiCandidateSessionSliceResult {
  logicalSessionId: string;
  hostSliceId: string;
  sessionState: LogicalSessionState;
  reason: string | null;
  participantJobs: number;
  currentSourceEpochRef: string;
  manifestPath: string;
  sourceTransitionCount: 0 | 1;
}

export interface CandidateSessionSliceLaneInput {
  pool: CandidatePoolV1;
  candidate: CandidatePoolV1['candidates'][number];
  sourceAnalysis: CompletedSourceCandidateAnalysisResult;
  laneRoot: string;
}

export interface MultiCandidateSessionSliceDependencies {
  now?: () => string;
  runSourceAnalysis?: (input: { sourceRoot: string; sourceEpochRef: string; analysisRoot: string }) => Promise<CompletedSourceCandidateAnalysisResult>;
  loadSourceAnalysis?: (input: { sourceEpochRef: string; sourceRoot: string; analysisRoot: string }) => Promise<CompletedSourceCandidateAnalysisResult>;
  runCandidateLane?: (input: CandidateSessionSliceLaneInput) => Promise<CandidateLaneResult>;
  runCandidateContinuation?: (input: { candidate: CandidatePoolV1['candidates'][number]; sourceAnalysis: CompletedSourceCandidateAnalysisResult; laneRoot: string; baseDecisionPath: string; problemPackagePath: string }) => Promise<CandidateReviewContinuationResult>;
  retainHumanFollowup?: typeof retainHumanFollowupWorkItem;
  runSourceTransition?: (input: { candidate: CandidatePoolV1['candidates'][number]; laneResult: Extract<CandidateLaneResult, { status: 'completed' }>; sourceAnalysis: CompletedSourceCandidateAnalysisResult; transitionRoot: string; candidateLaneRoot: string; effectiveDecisionPath: string }) => Promise<BoundedSourceTransitionResult>;
}

const DEFAULT_AUTHORITY_REFS = [
  'docs/product/player-model.md',
  'docs/product/auto-evolution-model.md',
  'docs/governance/project-convergence.md',
  'docs/governance/product-decisions.md',
  'docs/governance/current-product-stage.md',
  'docs/governance/ai-collaboration-workflow.md',
];

async function writeAtomicJson(path: string, value: unknown): Promise<void> {
  await mkdir(resolve(path, '..'), { recursive: true });
  const temp = `${path}.tmp-${process.pid}-${Date.now()}`;
  const handle = await open(temp, 'wx');
  try { await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`); } finally { await handle.close(); }
  await import('node:fs/promises').then(fs => fs.rename(temp, path));
}

async function writeCreateOnly(path: string, value: unknown): Promise<void> {
  await mkdir(resolve(path, '..'), { recursive: true });
  const handle = await open(path, 'wx');
  try { await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`); } finally { await handle.close(); }
}

async function exists(path: string): Promise<boolean> {
  try { await lstat(path); return true; } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }
}

function poolPath(repositoryRoot: string, logicalSessionId: string, sourceEpochRef: string): string {
  return join(resolveCandidateSessionLocation(repositoryRoot, logicalSessionId).sessionRoot, 'source-epochs', sourceEpochRef, 'candidate-pool.json');
}

function candidateCounts(pool: CandidatePoolV1) {
  return {
    total: pool.candidates.length,
    pending: pool.candidates.filter(candidate => candidate.processingState === 'PENDING').length,
    active: pool.candidates.filter(candidate => candidate.processingState === 'ACTIVE').length,
    completed: pool.candidates.filter(candidate => candidate.processingState === 'COMPLETED' || candidate.processingState === 'SOURCE_CHANGE_PENDING').length,
    superseded: pool.candidates.filter(candidate => candidate.processingState === 'SUPERSEDED').length,
    interrupted: pool.candidates.filter(candidate => candidate.processingState === 'INTERRUPTED').length,
  };
}

function summaryForPool(pool: CandidatePoolV1, sourceEpochRef: string, poolRef: string, previous?: SourceEpochSummaryV1): SourceEpochSummaryV1 {
  return {
    sourceEpochRef,
    sourceRunRef: pool.source.sourceRunRef,
    poolRef,
    poolStatus: pool.status,
    lifecycle: pool.status === 'EXHAUSTED' ? 'POOL_EXHAUSTED' : pool.status === 'SUPERSEDED' ? 'SUPERSEDED' : pool.status === 'INTERRUPTED' ? 'INTERRUPTED' : 'POOL_ACTIVE',
    candidateCounts: candidateCounts(pool),
    dispositionCounts: previous?.dispositionCounts ?? {},
  };
}

function buildManifest(input: {
  existing?: MultiCandidateSessionManifestV1;
  logicalSessionId: string;
  sessionState: LogicalSessionState;
  reason: string | null;
  sourceEpochs: SourceEpochSummaryV1[];
  currentSourceEpochRef: string;
  hostSlices: HostSliceSummaryV1[];
  sourceTransitionCount: 0 | 1;
  repositoryBaseline: RunMultiCandidateSessionSliceInput['repositoryBaseline'];
  participantBindingId: string;
  participantJobs: number;
}): MultiCandidateSessionManifestV1 {
  return buildMultiCandidateSessionManifestV1({
    logicalSessionId: input.logicalSessionId,
    sessionState: input.sessionState,
    pauseOrStopReason: input.reason,
    sourceEpochs: input.sourceEpochs,
    currentSourceEpochRef: input.currentSourceEpochRef,
    hostSlices: input.hostSlices,
    sourceTransitionCount: input.sourceTransitionCount,
    failureRef: input.existing?.failureRef ?? null,
    repositoryBaseline: input.repositoryBaseline,
    participantBindingId: input.participantBindingId,
    budgetAccounting: {
      participantJobs: input.existing?.budgetAccounting.participantJobs ?? 0,
      hostSliceCount: input.hostSlices.length,
    },
  });
}

async function persistPool(path: string, pool: CandidatePoolV1): Promise<void> {
  await writeAtomicJson(path, pool);
}

async function defaultSourceAnalysis(input: RunMultiCandidateSessionSliceInput, sourceRoot: string, analysisRoot: string, sourceEpochRef: string): Promise<CompletedSourceCandidateAnalysisResult> {
  const options: RunSourceCandidateAnalysisOptions = {
    repositoryRoot: input.repositoryRoot,
    fixedSourceRoot: sourceRoot,
    experimentRoot: analysisRoot,
    workspaceAgentParticipant: input.participant,
    participantMode: 'local-subagent',
    authorityRefs: input.authorityRefs,
  } as RunSourceCandidateAnalysisOptions;
  const result = await runSourceCandidateAnalysis(options);
  if (result.status !== 'completed') throw new Error(`source analysis failed at ${result.stage}`);
  void sourceEpochRef;
  return result;
}

async function defaultLoadSourceAnalysis(input: RunMultiCandidateSessionSliceInput, value: { sourceEpochRef: string; sourceRoot: string; analysisRoot: string }): Promise<CompletedSourceCandidateAnalysisResult> {
  const sourceManifest = JSON.parse(await readFile(join(value.sourceRoot, 'experiment-root.json'), 'utf8')) as { runRef?: unknown };
  if (typeof sourceManifest.runRef !== 'string') throw new Error('durable source anchor runRef is missing');
  const retained = await materializeSourceAnalysisArtifacts({
    repositoryRoot: input.repositoryRoot,
    logicalSessionId: input.logicalSessionId,
    sourceEpochRef: value.sourceEpochRef,
    sourceRoot: value.sourceRoot,
    sourceRunRef: sourceManifest.runRef,
    destinationRoot: value.analysisRoot,
    hostSliceId: input.hostSliceId,
  });
  const sourceRunRef = sourceManifest.runRef;
  const feedbackRef = `feedback-runs/${sourceRunRef}/feedback.json`;
  const hypothesisRef = `hypothesis-runs/${sourceRunRef}/hypotheses.json`;
  const feedback = parseExternalFeedback(await readFile(join(retained.analysisRoot, feedbackRef), 'utf8'));
  const hypothesisSet = parseStoredImprovementHypothesisSet(await readFile(join(retained.analysisRoot, hypothesisRef), 'utf8'));
  const feedbackInvocation = JSON.parse(await readFile(join(retained.analysisRoot, `feedback-runs/${sourceRunRef}/invocation.json`), 'utf8')) as { invocationRef?: unknown };
  const hypothesisInvocation = JSON.parse(await readFile(join(retained.analysisRoot, `hypothesis-runs/${sourceRunRef}/invocation.json`), 'utf8')) as { invocationRef?: unknown };
  if (typeof feedbackInvocation.invocationRef !== 'string' || typeof hypothesisInvocation.invocationRef !== 'string') throw new Error('durable source analysis invocation refs are missing');
  const sourceFingerprint = await readFile(join(value.sourceRoot, 'provenance/source-fingerprint.json'));
  const experimentRootHash = (await readFile(join(value.sourceRoot, 'experiment-root.sha256'), 'utf8')).trim();
  return {
    status: 'completed',
    sourceRunRef,
    sourceRoot: value.sourceRoot,
    analysisRoot: retained.analysisRoot,
    sourceExperimentRootHash: experimentRootHash,
    sourceFingerprintSha256: sha256Hex(sourceFingerprint),
    authoritativeFingerprintSha256: await captureAuthoritativeFingerprint(input.repositoryRoot),
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: feedbackRef,
    improvementHypothesisRef: hypothesisRef,
    feedbackInvocationRef: feedbackInvocation.invocationRef,
    hypothesisInvocationRef: hypothesisInvocation.invocationRef,
    hypotheses: hypothesisSet.hypotheses,
    noProblemAssessment: hypothesisSet.noProblemAssessment,
    actualParticipantJobs: 2,
  };
}

async function defaultLane(input: CandidateSessionSliceLaneInput, parent: RunMultiCandidateSessionSliceInput): Promise<CandidateLaneResult> {
  const refs = parent.authorityRefs ?? DEFAULT_AUTHORITY_REFS;
  return runCandidateLane({
    repositoryRoot: parent.repositoryRoot,
    sourceRoot: input.sourceAnalysis.analysisRoot ?? input.sourceAnalysis.sourceRoot,
    laneRoot: input.laneRoot,
    poolId: input.pool.poolId,
    candidateRef: input.candidate.candidateRef,
    candidate: input.sourceAnalysis.hypotheses[input.candidate.sourceIndex]!,
    sourceIndex: input.candidate.sourceIndex,
    hypothesisSetRef: input.pool.hypothesisSet.artifactRef,
    hypothesisSetSha256: input.pool.hypothesisSet.sha256,
    sourceRunRef: input.pool.source.sourceRunRef,
    sourceExperimentRootHash: input.sourceAnalysis.sourceExperimentRootHash,
    sourceFingerprintSha256: input.pool.source.sourceFingerprintSha256,
    observablePayloadRef: input.sourceAnalysis.observablePayloadRef,
    externalFeedbackRef: input.sourceAnalysis.externalFeedbackRef,
    improvementHypothesisRef: input.sourceAnalysis.improvementHypothesisRef,
    authorityRefs: refs,
    participant: parent.participant,
    participantMode: 'local-subagent',
  });
}

async function analysisArtifacts(root: string, sourceRunRef: string): Promise<string[]> {
  const candidates = [
    'source/observable-payload.json',
    `feedback-runs/${sourceRunRef}/feedback.json`,
    `hypothesis-runs/${sourceRunRef}/hypotheses.json`,
    `feedback-runs/${sourceRunRef}/invocation.json`,
    `hypothesis-runs/${sourceRunRef}/invocation.json`,
  ];
  const present: string[] = [];
  for (const path of candidates) if (await exists(join(root, path))) present.push(path);
  return present;
}

async function candidateLaneArtifacts(root: string, current = ''): Promise<string[]> {
  if (current === '' && !(await exists(root))) return [];
  const entries = await readdir(resolve(root, current || '.'), { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.name === '.DS_Store' || entry.name === 'agent-workspaces') continue;
    const relativePath = current ? join(current, entry.name) : entry.name;
    if (entry.isDirectory()) result.push(...await candidateLaneArtifacts(root, relativePath));
    else if (entry.isFile()) result.push(relativePath.split('/').join('/'));
    else throw new Error(`candidate lane evidence must be a regular file: ${relativePath}`);
  }
  return result;
}

function durableLaneRef(sourceEpochRef: string, hypothesisId: string): string {
  return `source-epochs/${sourceEpochRef}/candidates/${hypothesisId}`;
}

function durableCandidateArtifactRef(input: {
  sourceEpochRef: string;
  hypothesisId: string;
  candidateLaneRoot: string;
  artifactPath: string;
}): string {
  const laneRoot = resolve(input.candidateLaneRoot);
  const artifact = isAbsolute(input.artifactPath) ? resolve(input.artifactPath) : resolve(laneRoot, input.artifactPath);
  const child = relative(laneRoot, artifact).split(sep).join('/');
  if (!child || child === '..' || child.startsWith('../') || isAbsolute(child)) {
    throw new Error(`candidate artifact must be inside candidate lane: ${input.artifactPath}`);
  }
  return `${durableLaneRef(input.sourceEpochRef, input.hypothesisId)}/${child}`;
}

export async function runMultiCandidateSessionSlice(input: RunMultiCandidateSessionSliceInput): Promise<MultiCandidateSessionSliceResult> {
  const now = input.dependencies?.now ?? (() => new Date().toISOString());
  const authorityRefs = input.authorityRefs ?? DEFAULT_AUTHORITY_REFS;
  const location = resolveCandidateSessionLocation(input.repositoryRoot, input.logicalSessionId);
  let manifest: MultiCandidateSessionManifestV1 | undefined;
  let sourceEpochs: SourceEpochSummaryV1[] = [];
  let sourceTransitionCount: 0 | 1 = 0;
  let currentSourceEpochRef = 'source-epoch-000001';
  let sessionState: LogicalSessionState = 'PROCESSING';
  let reason: string | null = null;
  if (input.mode === 'RESUME_SESSION') {
    manifest = await readDurableMultiCandidateSessionManifest(input.repositoryRoot, input.logicalSessionId);
    if (manifest.repositoryBaseline.branch !== input.repositoryBaseline.branch || manifest.repositoryBaseline.headSha !== input.repositoryBaseline.headSha || manifest.repositoryBaseline.workingTreeFingerprint !== input.repositoryBaseline.workingTreeFingerprint) throw new Error('resume repository baseline mismatch');
    if (manifest.participantBindingId !== input.participantBindingId) throw new Error('resume participant binding mismatch');
    currentSourceEpochRef = manifest.currentSourceEpochRef;
    sourceEpochs = manifest.sourceEpochs.map(epoch => ({ ...epoch, candidateCounts: { ...epoch.candidateCounts }, dispositionCounts: { ...epoch.dispositionCounts } }));
    sourceTransitionCount = manifest.sourceTransitionCount;
  } else {
    if (!input.initialSourceRoot) throw new Error('START_NEW_SESSION requires initialSourceRoot');
    if (await exists(location.manifestPath)) throw new Error(`Logical Session already exists: ${input.logicalSessionId}`);
    sourceEpochs = [{ sourceEpochRef: currentSourceEpochRef, sourceRunRef: 'pending', poolRef: null, poolStatus: 'PROCESSING', lifecycle: 'ANALYSIS_PENDING', candidateCounts: { total: 0, pending: 0, active: 0, completed: 0, superseded: 0, interrupted: 0 }, dispositionCounts: {} }];
    manifest = buildManifest({ logicalSessionId: input.logicalSessionId, sessionState, reason, sourceEpochs, currentSourceEpochRef, hostSlices: [{ hostSliceId: input.hostSliceId, startedAt: now(), endedAt: null, participantJobs: 0, state: 'PROCESSING', reason: null }], sourceTransitionCount, repositoryBaseline: input.repositoryBaseline, participantBindingId: input.participantBindingId, participantJobs: 0 });
    await writeMultiCandidateSessionManifestAtomic(input.repositoryRoot, manifest);
  }
  let slice: HostSliceSummaryV1 = { hostSliceId: input.hostSliceId, startedAt: now(), endedAt: null, participantJobs: 0, state: 'PROCESSING', reason: null };
  const priorSlices = (manifest?.hostSlices ?? []).filter(item => item.hostSliceId !== input.hostSliceId);
  const sessionRoot = location.sessionRoot;
  const sourceSummary = sourceEpochs.find(epoch => epoch.sourceEpochRef === currentSourceEpochRef)!;
  let analysisRoot: string;
  let analysis: CompletedSourceCandidateAnalysisResult;
  const sourceNeedsFreshAnalysis = sourceSummary.lifecycle === 'ANALYSIS_PENDING' || sourceSummary.poolRef === null;
  if (input.mode === 'START_NEW_SESSION' || sourceNeedsFreshAnalysis) {
    const sourceRoot = input.initialSourceRoot ?? (await materializeSourceEpochAnchor({ repositoryRoot: input.repositoryRoot, logicalSessionId: input.logicalSessionId, sourceEpochRef: currentSourceEpochRef, hostSliceId: input.hostSliceId })).sourceRoot;
    analysisRoot = join(input.repositoryRoot, '.tmp/evolution', input.logicalSessionId, input.hostSliceId, currentSourceEpochRef, 'analysis');
    analysis = sourceNeedsFreshAnalysis
      ? await (input.dependencies?.runSourceAnalysis ?? (value => defaultSourceAnalysis(input, value.sourceRoot, value.analysisRoot, value.sourceEpochRef)))({ sourceRoot, sourceEpochRef: currentSourceEpochRef, analysisRoot })
      : await (input.dependencies?.loadSourceAnalysis ?? (value => defaultLoadSourceAnalysis(input, value)))({ sourceEpochRef: currentSourceEpochRef, sourceRoot, analysisRoot });
    const sourceFingerprintPath = join(sourceRoot, 'provenance/source-fingerprint.json');
    const sourceFingerprintSha256 = analysis.sourceFingerprintSha256;
    if (input.mode === 'START_NEW_SESSION') {
      await retainSourceEpochAnchor({ repositoryRoot: input.repositoryRoot, logicalSessionId: input.logicalSessionId, sourceEpochRef: currentSourceEpochRef, sourceRoot, sourceRunRef: analysis.sourceRunRef, sourceFingerprintSha256, sourceExperimentRootHash: analysis.sourceExperimentRootHash });
    }
    const pool = buildCandidatePoolV1({ logicalSessionId: input.logicalSessionId, sourceEpochId: currentSourceEpochRef, sourceRunRef: analysis.sourceRunRef, sourceFingerprintSha256, sealedSourceRef: `source-epochs/${currentSourceEpochRef}`, hypothesisSet: { artifactRef: analysis.improvementHypothesisRef, hypotheses: analysis.hypotheses }, baseline: { branch: input.repositoryBaseline.branch, headSha: input.repositoryBaseline.headSha, workingTreeFingerprint: input.repositoryBaseline.workingTreeFingerprint, participantBinding: input.participantBindingId } });
    const durablePoolPath = poolPath(input.repositoryRoot, input.logicalSessionId, currentSourceEpochRef);
    await writeCreateOnly(durablePoolPath, pool);
    const present = await analysisArtifacts(analysis.analysisRoot ?? analysisRoot, analysis.sourceRunRef);
    if (present.length > 0) await retainSourceAnalysisArtifacts({ repositoryRoot: input.repositoryRoot, logicalSessionId: input.logicalSessionId, sourceEpochRef: currentSourceEpochRef, sourceRoot: analysis.analysisRoot ?? analysisRoot, relativePaths: present });
    sourceEpochs = sourceEpochs.map(epoch => epoch.sourceEpochRef === currentSourceEpochRef ? summaryForPool(pool, currentSourceEpochRef, relative(sessionRoot, durablePoolPath).split('/').join('/'), { ...epoch, sourceRunRef: pool.source.sourceRunRef }) : epoch);
    manifest = buildManifest({ logicalSessionId: input.logicalSessionId, sessionState, reason, sourceEpochs, currentSourceEpochRef, hostSlices: [...priorSlices, slice], sourceTransitionCount, repositoryBaseline: input.repositoryBaseline, participantBindingId: input.participantBindingId, participantJobs: 2 });
    await writeMultiCandidateSessionManifestAtomic(input.repositoryRoot, manifest);
    analysisRoot = analysis.analysisRoot ?? analysisRoot;
  } else {
    analysisRoot = join(input.repositoryRoot, '.tmp/evolution', input.logicalSessionId, input.hostSliceId, currentSourceEpochRef, 'analysis');
    const materialized = await materializeSourceEpochAnchor({ repositoryRoot: input.repositoryRoot, logicalSessionId: input.logicalSessionId, sourceEpochRef: currentSourceEpochRef, hostSliceId: input.hostSliceId });
    analysis = await (input.dependencies?.loadSourceAnalysis ?? (value => defaultLoadSourceAnalysis(input, value)))({ sourceEpochRef: currentSourceEpochRef, sourceRoot: materialized.sourceRoot, analysisRoot });
  }
  const durablePoolPath = sourceEpochs.find(epoch => epoch.sourceEpochRef === currentSourceEpochRef)?.poolRef;
  if (!durablePoolPath) throw new Error('current Source Epoch has no durable Candidate Pool');
  let pool = parseCandidatePoolV1(JSON.parse(await readFile(join(sessionRoot, durablePoolPath), 'utf8')) as unknown);
  if (pool.status === 'EXHAUSTED') {
    sessionState = 'COMPLETED';
    reason = null;
  } else if (pool.status === 'INTERRUPTED') {
    sessionState = 'INTERRUPTED';
    reason = 'CANDIDATE_POOL_INTERRUPTED';
  }
  if (input.mode === 'RESUME_SESSION' && pool.candidates.some(candidate => candidate.processingState === 'ACTIVE')) {
    const active = pool.candidates.find(candidate => candidate.processingState === 'ACTIVE')!;
    const durableLaneRoot = join(analysisRoot, 'candidates', active.hypothesisId);
    if (!(await exists(durableLaneRoot))) {
      await materializeCandidateLaneArtifacts({
        repositoryRoot: input.repositoryRoot,
        logicalSessionId: input.logicalSessionId,
        sourceEpochRef: currentSourceEpochRef,
        candidateRef: active.candidateRef,
        destinationRoot: durableLaneRoot,
      });
    }
    const reconciliation = await reconcileActiveCandidate({
      pool,
      candidateLaneRoot: durableLaneRoot,
      poolPath: join(sessionRoot, durablePoolPath),
      laneRef: durableLaneRef(currentSourceEpochRef, active.hypothesisId),
    });
    if (reconciliation.status === 'INTERRUPTED') {
      pool = parseCandidatePoolV1(JSON.parse(await readFile(join(sessionRoot, durablePoolPath), 'utf8')) as unknown);
      sessionState = 'INTERRUPTED';
      reason = 'INCOMPLETE_TERMINAL_ARTIFACTS';
    } else if (reconciliation.status === 'RECONCILED') {
      pool = parseCandidatePoolV1(JSON.parse(await readFile(join(sessionRoot, durablePoolPath), 'utf8')) as unknown);
    }
  }
  let budget: HostSliceBudgetV1 = createHostSliceBudget();
  budget = consumeHostSliceJobs(budget, input.mode === 'START_NEW_SESSION' || sourceSummary.lifecycle === 'ANALYSIS_PENDING' ? 2 : 0);
  while (pool.status === 'PROCESSING' && sessionState === 'PROCESSING') {
    if (!canAdmitCandidate({ budget, sourceTransitionAvailable: sourceTransitionCount === 0 })) {
      sessionState = 'PAUSED'; reason = 'HOST_SLICE_BUDGET'; slice = { ...slice, state: 'PAUSED', reason, endedAt: now(), participantJobs: budget.usedParticipantJobs };
      break;
    }
    const pending = nextPendingCandidate(pool);
    if (!pending) { pool = exhaustPoolIfComplete(pool); await persistPool(join(sessionRoot, durablePoolPath), pool); sessionState = 'COMPLETED'; slice = { ...slice, state: 'COMPLETED', endedAt: now(), participantJobs: budget.usedParticipantJobs }; break; }
    pool = activateCandidate(pool, pending.candidateRef);
    await persistPool(join(sessionRoot, durablePoolPath), pool);
    const laneRoot = join(analysisRoot, 'candidates', pending.hypothesisId);
    const retainLaneArtifacts = async (): Promise<void> => {
      const laneEvidence = await candidateLaneArtifacts(laneRoot);
      if (laneEvidence.length === 0) return;
      await retainCandidateLaneArtifacts({
        repositoryRoot: input.repositoryRoot,
        logicalSessionId: input.logicalSessionId,
        sourceEpochRef: currentSourceEpochRef,
        sourceRoot: laneRoot,
        candidateRef: pending.candidateRef,
        relativePaths: laneEvidence,
      });
    };
    let laneResult: CandidateLaneResult;
    try {
      laneResult = await (input.dependencies?.runCandidateLane ?? (value => defaultLane(value, input)))({ pool, candidate: pending, sourceAnalysis: analysis, laneRoot });
    } catch (error) {
      pool = interruptCandidate(pool, pending.candidateRef, `candidate-failure/${pending.hypothesisId}`);
      await persistPool(join(sessionRoot, durablePoolPath), pool);
      sessionState = 'FAILED'; reason = String(error); slice = { ...slice, state: 'FAILED', reason, endedAt: now(), participantJobs: budget.usedParticipantJobs }; break;
    }
    budget = consumeHostSliceJobs(budget, laneResult.actualParticipantJobs);
    slice = { ...slice, participantJobs: budget.usedParticipantJobs };
    await retainLaneArtifacts();
    if (laneResult.status === 'participant_failure') {
      pool = interruptCandidate(pool, pending.candidateRef, laneResult.workflowOutcomeRef);
      await persistPool(join(sessionRoot, durablePoolPath), pool);
      sessionState = 'FAILED'; reason = 'PARTICIPANT_FAILURE'; slice = { ...slice, state: 'FAILED', reason, endedAt: now() }; break;
    }
    let effectiveDecision = laneResult.decision;
    let effectiveDecisionPath = laneResult.decisionPath;
    let continuation: CandidateReviewContinuationResult | null = null;
    if (laneResult.decision.route === 'DEFER_MORE_WORK_REQUESTED') {
      const continuationRunner = input.dependencies?.runCandidateContinuation ?? ((value: {
        candidate: CandidatePoolV1['candidates'][number];
        sourceAnalysis: CompletedSourceCandidateAnalysisResult;
        laneRoot: string;
        baseDecisionPath: string;
        problemPackagePath: string;
      }) => runCandidateReviewContinuation({
        candidateRef: value.candidate.candidateRef,
        candidateLaneRoot: value.laneRoot,
        baseDecisionPath: value.baseDecisionPath,
        problemPackagePath: value.problemPackagePath,
        sourceFingerprintSha256: pool.source.sourceFingerprintSha256,
        participant: input.participant,
        repositoryRoot: input.repositoryRoot,
      }));
      continuation = await continuationRunner({ candidate: pending, sourceAnalysis: analysis, laneRoot, baseDecisionPath: laneResult.baseDecisionPath, problemPackagePath: laneResult.problemPackagePath });
      budget = consumeHostSliceJobs(budget, continuation.participantJobs);
      slice = { ...slice, participantJobs: budget.usedParticipantJobs };
      if (continuation.status === 'participant_failure') { pool = interruptCandidate(pool, pending.candidateRef, continuation.failureRef); await persistPool(join(sessionRoot, durablePoolPath), pool); sessionState = 'FAILED'; reason = 'PARTICIPANT_FAILURE'; slice = { ...slice, state: 'FAILED', reason, endedAt: now() }; break; }
      if (continuation.status === 'completed') { effectiveDecision = continuation.effectiveDecision; effectiveDecisionPath = continuation.effectiveDecisionPath; }
      await retainLaneArtifacts();
    }
    if (effectiveDecision.route === 'READY_FOR_CONFIG_EXECUTION') {
      pool = markSourceChangePending(pool, pending.candidateRef, { laneRef: durableLaneRef(currentSourceEpochRef, pending.hypothesisId), baseDecisionRef: durableCandidateArtifactRef({ sourceEpochRef: currentSourceEpochRef, hypothesisId: pending.hypothesisId, candidateLaneRoot: laneRoot, artifactPath: laneResult.baseDecisionPath }), effectiveDecisionRef: durableCandidateArtifactRef({ sourceEpochRef: currentSourceEpochRef, hypothesisId: pending.hypothesisId, candidateLaneRoot: laneRoot, artifactPath: effectiveDecisionPath }), sourceTransitionRef: `source-transitions/${pending.hypothesisId}` });
      await persistPool(join(sessionRoot, durablePoolPath), pool);
      if (sourceTransitionCount === 1) { sessionState = 'PAUSED'; reason = 'SOURCE_CHANGE_LIMIT_REACHED'; slice = { ...slice, state: 'PAUSED', reason, endedAt: now() }; break; }
      if (budget.remainingParticipantJobs < 1) { sessionState = 'PAUSED'; reason = 'HOST_SLICE_BUDGET'; slice = { ...slice, state: 'PAUSED', reason, endedAt: now(), participantJobs: budget.usedParticipantJobs }; break; }
      const candidateLaneRoot = laneRoot;
      const effectiveArtifactRoot = dirname(effectiveDecisionPath);
      let transition: BoundedSourceTransitionResult;
      try {
        const transitionRunner = input.dependencies?.runSourceTransition ?? (value => runCandidateBoundedSourceTransition({
          authoritativeRoot: input.repositoryRoot,
          transitionRoot: value.transitionRoot,
          sourceRoot: analysis.sourceRoot,
          sourceRunRef: analysis.sourceRunRef,
          candidateLaneRoot: value.candidateLaneRoot,
          acceptedCandidateArtifacts: {
            problemPackagePath: value.laneResult.problemPackagePath,
            solutionPath: join(effectiveArtifactRoot, 'solution-agent/result.json'),
            reviewPath: join(effectiveArtifactRoot, 'reviewer-agent/review.json'),
          },
          participant: input.participant,
        }));
        transition = await transitionRunner({ candidate: pending, laneResult, sourceAnalysis: analysis, transitionRoot: join(sessionRoot, 'source-transitions', pending.hypothesisId), candidateLaneRoot, effectiveDecisionPath });
      } catch (error) {
        sessionState = 'FAILED';
        reason = `SOURCE_TRANSITION_FAILED: ${String(error)}`;
        slice = { ...slice, state: 'FAILED', reason, endedAt: now(), participantJobs: budget.usedParticipantJobs };
        break;
      }
      budget = consumeHostSliceJobs(budget, transition.participantJobs);
      if (transition.status !== 'succeeded') { sessionState = 'FAILED'; reason = transition.failureReason; slice = { ...slice, state: 'FAILED', reason, endedAt: now(), participantJobs: budget.usedParticipantJobs }; break; }
      const newSourceEpochRef = 'source-epoch-000002';
      try {
        const resultingSourceFingerprint = await readFile(join(transition.resultingSourceRoot, 'provenance/source-fingerprint.json'));
        const resultingSourceExperimentRootHash = (await readFile(join(transition.resultingSourceRoot, 'experiment-root.sha256'), 'utf8')).trim();
        await retainSourceEpochAnchor({
          repositoryRoot: input.repositoryRoot,
          logicalSessionId: input.logicalSessionId,
          sourceEpochRef: newSourceEpochRef,
          sourceRoot: transition.resultingSourceRoot,
          sourceRunRef: transition.resultingRunRef,
          sourceFingerprintSha256: sha256Hex(resultingSourceFingerprint),
          sourceExperimentRootHash: resultingSourceExperimentRootHash,
        });
      } catch (error) {
        sessionState = 'FAILED';
        reason = `SOURCE_B_ANCHOR_FAILED: ${String(error)}`;
        slice = { ...slice, state: 'FAILED', reason, endedAt: now(), participantJobs: budget.usedParticipantJobs };
        break;
      }
      sourceTransitionCount = 1;
      pool = supersedePendingCandidates(pool, newSourceEpochRef);
      await persistPool(join(sessionRoot, durablePoolPath), pool);
      sourceEpochs = sourceEpochs.map(epoch => epoch.sourceEpochRef === currentSourceEpochRef ? { ...epoch, poolStatus: 'SUPERSEDED', lifecycle: 'SUPERSEDED', candidateCounts: candidateCounts(pool) } : epoch);
      sourceEpochs.push({ sourceEpochRef: newSourceEpochRef, sourceRunRef: transition.resultingRunRef, poolRef: null, poolStatus: 'PROCESSING', lifecycle: 'ANALYSIS_PENDING', candidateCounts: { total: 0, pending: 0, active: 0, completed: 0, superseded: 0, interrupted: 0 }, dispositionCounts: {} });
      currentSourceEpochRef = newSourceEpochRef; sessionState = 'PAUSED'; reason = 'SOURCE_B_ANALYSIS_PENDING'; slice = { ...slice, state: 'PAUSED', reason, endedAt: now(), participantJobs: budget.usedParticipantJobs }; break;
    }
    let humanFollowupRef: string | null = null;
    if (laneResult.status === 'completed' && effectiveDecision.route === 'ESCALATE_HUMAN') {
      const retain = input.dependencies?.retainHumanFollowup ?? retainHumanFollowupWorkItem;
      const candidate = analysis.hypotheses[pending.sourceIndex]!;
      const hfl: RetainedHumanFollowupWorkItem = await retain({ repositoryRoot: input.repositoryRoot, workflowRoot: laneRoot, workflowInstanceRef: `${input.logicalSessionId}/${candidate.hypothesisId}`, sourceRunRef: pool.source.sourceRunRef, sourceFingerprintSha256: pool.source.sourceFingerprintSha256, problemPackagePath: laneResult.problemPackagePath, decisionPath: effectiveDecisionPath, candidateProvenance: { mode: 'candidate-activation-v1', candidateActivationPath: 'candidate-activation.json', hypothesisSetPath: analysis.improvementHypothesisRef } });
      humanFollowupRef = relative(input.repositoryRoot, hfl.itemPath).split('/').join('/');
    }
    pool = completeCandidate(pool, pending.candidateRef, { laneRef: durableLaneRef(currentSourceEpochRef, pending.hypothesisId), baseDecisionRef: durableCandidateArtifactRef({ sourceEpochRef: currentSourceEpochRef, hypothesisId: pending.hypothesisId, candidateLaneRoot: laneRoot, artifactPath: laneResult.baseDecisionPath }), effectiveDecisionRef: durableCandidateArtifactRef({ sourceEpochRef: currentSourceEpochRef, hypothesisId: pending.hypothesisId, candidateLaneRoot: laneRoot, artifactPath: effectiveDecisionPath }), humanFollowupRef });
    await persistPool(join(sessionRoot, durablePoolPath), pool);
    if (pool.candidates.every(candidate => candidate.processingState !== 'PENDING')) { pool = exhaustPoolIfComplete(pool); await persistPool(join(sessionRoot, durablePoolPath), pool); sessionState = 'COMPLETED'; slice = { ...slice, state: 'COMPLETED', endedAt: now(), participantJobs: budget.usedParticipantJobs }; break; }
  }
  if (slice.endedAt === null) slice = { ...slice, state: sessionState === 'PROCESSING' ? 'COMPLETED' : sessionState, reason, endedAt: now(), participantJobs: budget.usedParticipantJobs };
  const updatedSourceEpochs = sourceEpochs.map(epoch => epoch.sourceEpochRef === currentSourceEpochRef && epoch.poolRef !== null ? summaryForPool(pool, currentSourceEpochRef, epoch.poolRef, epoch) : epoch);
  const finalManifest = buildManifest({ existing: manifest, logicalSessionId: input.logicalSessionId, sessionState, reason, sourceEpochs: updatedSourceEpochs, currentSourceEpochRef, hostSlices: [...priorSlices, slice], sourceTransitionCount, repositoryBaseline: input.repositoryBaseline, participantBindingId: input.participantBindingId, participantJobs: budget.usedParticipantJobs });
  await writeMultiCandidateSessionManifestAtomic(input.repositoryRoot, finalManifest);
  return { logicalSessionId: input.logicalSessionId, hostSliceId: input.hostSliceId, sessionState, reason, participantJobs: budget.usedParticipantJobs, currentSourceEpochRef, manifestPath: location.manifestPath, sourceTransitionCount };
}
