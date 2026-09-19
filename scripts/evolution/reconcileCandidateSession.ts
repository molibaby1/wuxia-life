import { lstat, open, readFile, mkdir, rename } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { validateProblemPackage } from '../../src/evolution/problemPackageContract';
import { validateSolutionDecision } from '../../src/evolution/solutionDecisionContract';
import { canonicalJson } from './phase0/provenance';
import { parseCandidateLaneFailureV2 } from './candidateLaneFailureContract';
import { completeCandidate, exhaustPoolIfComplete, interruptCandidate, interruptCandidateLocally, markSourceChangePending } from './candidatePoolState';
import type { CandidatePoolV1 } from './candidatePoolContract';
import {
  deriveHumanFollowupContinuationEvidence,
  retainHumanFollowupWorkItem,
} from './humanFollowup/retainHumanFollowupWorkItem';

export type CandidateReconciliationResult =
  | { status: 'NO_ACTIVE_CANDIDATE' }
  | { status: 'RECONCILED'; candidateRef: string; decisionPath: string }
  | { status: 'INTERRUPTED'; candidateRef: string; interruptionRef: string }
  | { status: 'CANDIDATE_LOCAL_FAILURE_RECONCILED'; candidateRef: string; interruptionRef: string; poolStatus: 'PROCESSING' | 'EXHAUSTED' };

export interface ReconcileActiveCandidateInput {
  pool: CandidatePoolV1;
  candidateLaneRoot: string;
  poolPath?: string;
  laneRef?: string;
  repositoryRoot?: string;
  dependencies?: {
    retainHumanFollowup?: typeof retainHumanFollowupWorkItem;
  };
}

function durableCandidateArtifactRef(input: { laneRef: string; candidateLaneRoot: string; artifactPath: string }): string {
  if (isAbsolute(input.laneRef) || input.laneRef.includes('\\')) throw new Error(`candidate lane reference must be relative: ${input.laneRef}`);
  const laneRoot = resolve(input.candidateLaneRoot);
  const artifact = isAbsolute(input.artifactPath) ? resolve(input.artifactPath) : resolve(laneRoot, input.artifactPath);
  const child = relative(laneRoot, artifact).split(sep).join('/');
  if (!child || child === '..' || child.startsWith('../') || isAbsolute(child)) throw new Error(`candidate artifact must be inside candidate lane: ${input.artifactPath}`);
  return `${input.laneRef}/${child}`;
}

async function exists(path: string): Promise<boolean> {
  try { await lstat(path); return true; } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }
}

async function writeAtomic(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.reconcile-${process.pid}-${Date.now()}`;
  const handle = await open(temp, 'wx');
  try { await handle.writeFile(`${canonicalJson(value)}\n`); } finally { await handle.close(); }
  await rename(temp, path);
}

export async function reconcileActiveCandidate(input: ReconcileActiveCandidateInput): Promise<CandidateReconciliationResult> {
  const active = input.pool.candidates.find(candidate => candidate.processingState === 'ACTIVE');
  if (!active) return { status: 'NO_ACTIVE_CANDIDATE' };
  const baseDecisionPath = join(resolve(input.candidateLaneRoot), 'decision.json');
  const continuationDecisionPath = join(resolve(input.candidateLaneRoot), 'review-continuation-000001/decision.json');
  const effectivePath = await exists(continuationDecisionPath) ? continuationDecisionPath : baseDecisionPath;
  const workflowOutcomePath = join(resolve(input.candidateLaneRoot), 'workflow-outcome.json');
  const packagePath = join(resolve(input.candidateLaneRoot), 'problem-package.json');
  const activationPath = join(resolve(input.candidateLaneRoot), 'candidate-activation.json');
  const interruptionRef = 'reconciliation/incomplete-terminal-artifacts.json';

  if (await exists(workflowOutcomePath)) {
    try {
      const failure = parseCandidateLaneFailureV2(await readFile(workflowOutcomePath, 'utf8'));
      if (failure.candidateRef !== active.candidateRef
        || failure.hypothesisId !== active.hypothesisId
        || failure.sourceIndex !== active.sourceIndex) throw new Error('candidate lane failure identity mismatch');
      const baseDecisionExists = await exists(baseDecisionPath);
      const continuationDecisionExists = await exists(continuationDecisionPath);
      if (baseDecisionExists) {
        const baseDecision = validateSolutionDecision(JSON.parse(await readFile(baseDecisionPath, 'utf8')) as unknown);
        if (baseDecision.route !== 'DEFER_MORE_WORK_REQUESTED' || continuationDecisionExists) throw new Error('candidate lane failure contradicts a terminal decision');
      } else if (continuationDecisionExists) {
        throw new Error('candidate continuation decision exists without a base continuation request');
      }
      if (failure.containment === 'CANDIDATE_LOCAL') {
        const laneRef = input.laneRef ?? `${input.pool.source.sealedSourceRef}/candidates/${active.hypothesisId}`;
        const localInterruptionRef = durableCandidateArtifactRef({ laneRef, candidateLaneRoot: input.candidateLaneRoot, artifactPath: workflowOutcomePath });
        const next = exhaustPoolIfComplete(interruptCandidateLocally(input.pool, active.candidateRef, localInterruptionRef));
        if (input.poolPath) await writeAtomic(input.poolPath, next);
        return { status: 'CANDIDATE_LOCAL_FAILURE_RECONCILED', candidateRef: active.candidateRef, interruptionRef: localInterruptionRef, poolStatus: next.status === 'EXHAUSTED' ? 'EXHAUSTED' : 'PROCESSING' };
      }
    } catch {
      const next = interruptCandidate(input.pool, active.candidateRef, interruptionRef);
      if (input.poolPath) await writeAtomic(input.poolPath, next);
      return { status: 'INTERRUPTED', candidateRef: active.candidateRef, interruptionRef };
    }
    const next = interruptCandidate(input.pool, active.candidateRef, interruptionRef);
    if (input.poolPath) await writeAtomic(input.poolPath, next);
    return { status: 'INTERRUPTED', candidateRef: active.candidateRef, interruptionRef };
  }

  if (!await exists(effectivePath) || !await exists(packagePath) || !await exists(activationPath)) {
    const next = interruptCandidate(input.pool, active.candidateRef, interruptionRef);
    if (input.poolPath) await writeAtomic(input.poolPath, next);
    return { status: 'INTERRUPTED', candidateRef: active.candidateRef, interruptionRef };
  }
  let decision: ReturnType<typeof validateSolutionDecision>;
  try {
    const problemPackage = validateProblemPackage(JSON.parse(await readFile(packagePath, 'utf8')) as unknown);
    decision = validateSolutionDecision(JSON.parse(await readFile(effectivePath, 'utf8')) as unknown);
    const activation = JSON.parse(await readFile(activationPath, 'utf8')) as Record<string, unknown>;
    const activationKeys = ['schemaVersion', 'candidateRef', 'poolId', 'hypothesisId', 'sourceIndex', 'hypothesisSha256', 'hypothesisSetRef', 'hypothesisSetSha256', 'sourceRunRef'];
    if (activationKeys.some(key => !(key in activation)) || Object.keys(activation).some(key => !activationKeys.includes(key))) throw new Error('candidate activation artifact shape mismatch');
    if (activation.schemaVersion !== 'candidate-activation-v1'
      || activation.candidateRef !== active.candidateRef
      || activation.poolId !== input.pool.poolId
      || activation.hypothesisId !== active.hypothesisId
      || activation.sourceIndex !== active.sourceIndex
      || activation.hypothesisSha256 !== active.hypothesisSha256
      || activation.hypothesisSetRef !== input.pool.hypothesisSet.artifactRef
      || activation.hypothesisSetSha256 !== input.pool.hypothesisSet.sha256
      || activation.sourceRunRef !== input.pool.source.sourceRunRef) throw new Error('candidate activation identity mismatch');
    if (problemPackage.problem.hypothesisId !== active.hypothesisId
      || problemPackage.source.runRef !== input.pool.source.sourceRunRef
      || problemPackage.source.improvementHypothesisRef !== input.pool.hypothesisSet.artifactRef
      || decision.problemId !== problemPackage.problemId) throw new Error('terminal artifact identity mismatch');
    const baseDecision = validateSolutionDecision(JSON.parse(await readFile(baseDecisionPath, 'utf8')) as unknown);
    if (baseDecision.route === 'DEFER_MORE_WORK_REQUESTED' && !await exists(continuationDecisionPath)) throw new Error('candidate continuation terminal decision is missing');
    if (await exists(continuationDecisionPath) && baseDecision.route !== 'DEFER_MORE_WORK_REQUESTED') throw new Error('candidate continuation exists without a base continuation request');
  } catch {
    const next = interruptCandidate(input.pool, active.candidateRef, interruptionRef);
    if (input.poolPath) await writeAtomic(input.poolPath, next);
    return { status: 'INTERRUPTED', candidateRef: active.candidateRef, interruptionRef };
  }
  let humanFollowupRef: string | null = null;
  if (decision.route === 'ESCALATE_HUMAN') {
    if (!input.repositoryRoot) throw new Error('repositoryRoot is required to retain Human follow-up for an effective ESCALATE_HUMAN decision');
    const continuationEvidence = await deriveHumanFollowupContinuationEvidence(input.candidateLaneRoot, effectivePath);
    const retain = input.dependencies?.retainHumanFollowup ?? retainHumanFollowupWorkItem;
    const retained = await retain({
      repositoryRoot: input.repositoryRoot,
      workflowRoot: resolve(input.candidateLaneRoot),
      workflowInstanceRef: `${input.pool.logicalSessionId}/${active.hypothesisId}`,
      sourceRunRef: input.pool.source.sourceRunRef,
      sourceFingerprintSha256: input.pool.source.sourceFingerprintSha256,
      problemPackagePath: packagePath,
      decisionPath: effectivePath,
      ...(continuationEvidence ? { continuation: continuationEvidence } : {}),
      candidateProvenance: {
        mode: 'candidate-activation-v1',
        candidateActivationPath: 'candidate-activation.json',
        hypothesisSetPath: input.pool.hypothesisSet.artifactRef,
      },
    });
    humanFollowupRef = relative(resolve(input.repositoryRoot), retained.itemPath).split(sep).join('/');
  }
  const laneRef = input.laneRef ?? `${input.pool.source.sealedSourceRef}/candidates/${active.hypothesisId}`;
  const next = decision.route === 'READY_FOR_CONFIG_EXECUTION'
    ? markSourceChangePending(input.pool, active.candidateRef, { laneRef, baseDecisionRef: durableCandidateArtifactRef({ laneRef, candidateLaneRoot: input.candidateLaneRoot, artifactPath: baseDecisionPath }), effectiveDecisionRef: durableCandidateArtifactRef({ laneRef, candidateLaneRoot: input.candidateLaneRoot, artifactPath: effectivePath }), sourceTransitionRef: `source-transitions/${active.hypothesisId}` })
    : completeCandidate(input.pool, active.candidateRef, { laneRef, baseDecisionRef: durableCandidateArtifactRef({ laneRef, candidateLaneRoot: input.candidateLaneRoot, artifactPath: baseDecisionPath }), effectiveDecisionRef: durableCandidateArtifactRef({ laneRef, candidateLaneRoot: input.candidateLaneRoot, artifactPath: effectivePath }), humanFollowupRef });
  if (input.poolPath) await writeAtomic(input.poolPath, next);
  return { status: 'RECONCILED', candidateRef: active.candidateRef, decisionPath: effectivePath };
}
