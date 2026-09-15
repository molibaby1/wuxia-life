import { lstat, open, readFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { validateProblemPackage } from '../../src/evolution/problemPackageContract';
import { validateSolutionDecision } from '../../src/evolution/solutionDecisionContract';
import { canonicalJson } from './phase0/provenance';
import { completeCandidate, interruptCandidate, markSourceChangePending } from './candidatePoolState';
import type { CandidatePoolV1 } from './candidatePoolContract';

export type CandidateReconciliationResult =
  | { status: 'NO_ACTIVE_CANDIDATE' }
  | { status: 'RECONCILED'; candidateRef: string; decisionPath: string }
  | { status: 'INTERRUPTED'; candidateRef: string; interruptionRef: string };

export interface ReconcileActiveCandidateInput {
  pool: CandidatePoolV1;
  candidateLaneRoot: string;
  poolPath?: string;
  laneRef?: string;
}

async function exists(path: string): Promise<boolean> {
  try { await lstat(path); return true; } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }
}

async function writeAtomic(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.reconcile-${process.pid}-${Date.now()}`;
  const handle = await open(temp, 'wx');
  try { await handle.writeFile(`${canonicalJson(value)}\n`); } finally { await handle.close(); }
  await import('node:fs/promises').then(fs => fs.rename(temp, path));
}

export async function reconcileActiveCandidate(input: ReconcileActiveCandidateInput): Promise<CandidateReconciliationResult> {
  const active = input.pool.candidates.find(candidate => candidate.processingState === 'ACTIVE');
  if (!active) return { status: 'NO_ACTIVE_CANDIDATE' };
  const baseDecisionPath = join(resolve(input.candidateLaneRoot), 'decision.json');
  const continuationDecisionPath = join(resolve(input.candidateLaneRoot), 'review-continuation-000001/decision.json');
  const effectivePath = await exists(continuationDecisionPath) ? continuationDecisionPath : baseDecisionPath;
  const packagePath = join(resolve(input.candidateLaneRoot), 'problem-package.json');
  const activationPath = join(resolve(input.candidateLaneRoot), 'candidate-activation.json');
  const interruptionRef = 'reconciliation/incomplete-terminal-artifacts.json';
  if (!await exists(effectivePath) || !await exists(packagePath) || !await exists(activationPath)) {
    const next = interruptCandidate(input.pool, active.candidateRef, interruptionRef);
    if (input.poolPath) await writeAtomic(input.poolPath, next);
    return { status: 'INTERRUPTED', candidateRef: active.candidateRef, interruptionRef };
  }
  try {
    const problemPackage = validateProblemPackage(JSON.parse(await readFile(packagePath, 'utf8')) as unknown);
    const decision = validateSolutionDecision(JSON.parse(await readFile(effectivePath, 'utf8')) as unknown);
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
    const laneRef = input.laneRef ?? input.candidateLaneRoot;
    const next = decision.route === 'READY_FOR_CONFIG_EXECUTION'
      ? markSourceChangePending(input.pool, active.candidateRef, { laneRef, baseDecisionRef: `${laneRef}/decision.json`, effectiveDecisionRef: `${laneRef}/${effectivePath.slice(resolve(input.candidateLaneRoot).length + 1)}`, sourceTransitionRef: `source-transition/${active.hypothesisId}` })
      : completeCandidate(input.pool, active.candidateRef, { laneRef, baseDecisionRef: `${laneRef}/decision.json`, effectiveDecisionRef: `${laneRef}/${effectivePath.slice(resolve(input.candidateLaneRoot).length + 1)}` });
    if (input.poolPath) await writeAtomic(input.poolPath, next);
    return { status: 'RECONCILED', candidateRef: active.candidateRef, decisionPath: effectivePath };
  } catch {
    const next = interruptCandidate(input.pool, active.candidateRef, interruptionRef);
    if (input.poolPath) await writeAtomic(input.poolPath, next);
    return { status: 'INTERRUPTED', candidateRef: active.candidateRef, interruptionRef };
  }
}
