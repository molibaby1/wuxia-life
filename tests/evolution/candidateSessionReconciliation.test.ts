import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCandidatePoolV1 } from '../../scripts/evolution/candidatePoolContract';
import { activateCandidate } from '../../scripts/evolution/candidatePoolState';
import { reconcileActiveCandidate } from '../../scripts/evolution/reconcileCandidateSession';
import { buildProblemPackage } from '../../scripts/evolution/problemAgnosticSolution/buildProblemPackage';
import { canonicalJson } from '../../scripts/evolution/phase0/provenance';

const hypothesis = { hypothesisId: 'hypothesis-000002', hypothesis: 'H2', observedBasis: 'Observed.', feedbackRefs: ['overallImpression'], evidenceRefs: [], unknowns: ['Unknown.'], productSignificance: 'Significant.' };
const decision = { schemaVersion: 'solution-decision-v1', problemId: 'problem-hypothesis-000002', route: 'DEFER', reasonCode: 'INSUFFICIENT_EVIDENCE', inputs: { solutionStatus: 'INSUFFICIENT_EVIDENCE', reviewerDecision: null, solutionScope: null, reviewScope: null, permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } } };

export async function runCandidateSessionReconciliationTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'candidate-reconcile-'));
  // The exact candidate reference is deterministic but opaque; locate it from the Pool.
  const basePool = buildCandidatePoolV1({ logicalSessionId: 's3', sourceEpochId: 'e', sourceRunRef: 'cohort-run-000001', sourceFingerprintSha256: 'a'.repeat(64), sealedSourceRef: 'source-epochs/source-epoch-000001', hypothesisSet: { artifactRef: 'hypotheses.json', hypotheses: [hypothesis] }, baseline: { branch: 'dev', headSha: 'b'.repeat(40), workingTreeFingerprint: 'c'.repeat(64), participantBinding: 'CODEX_CURRENT' } });
  const activePool = activateCandidate(basePool, basePool.candidates[0]!.candidateRef);
  const lane = join(root, 'lane');
  await mkdir(lane, { recursive: true });
  await writeFile(join(lane, 'candidate-activation.json'), canonicalJson({
    schemaVersion: 'candidate-activation-v1',
    candidateRef: activePool.candidates[0]!.candidateRef,
    poolId: activePool.poolId,
    hypothesisId: hypothesis.hypothesisId,
    sourceIndex: 0,
    hypothesisSha256: activePool.candidates[0]!.hypothesisSha256,
    hypothesisSetRef: activePool.hypothesisSet.artifactRef,
    hypothesisSetSha256: activePool.hypothesisSet.sha256,
    sourceRunRef: activePool.source.sourceRunRef,
  }));
  await buildProblemPackage({ activeCandidate: hypothesis, activeCandidateRef: activePool.candidates[0]!.candidateRef, activeCandidateSourceIndex: 0, runRef: 'cohort-run-000001', observablePayloadRef: 'source.json', externalFeedbackRef: 'feedback.json', improvementHypothesisRef: 'hypotheses.json', diagnosticEvidenceRefs: ['diagnostic.json'], authorityRefs: [], productSourceFingerprintSha256: 'a'.repeat(64), destinationPath: join(lane, 'problem-package.json') });
  await writeFile(join(lane, 'decision.json'), canonicalJson(decision));
  let participantCalls = 0;
  const poolPath = join(root, 'pool.json');
  await writeFile(poolPath, canonicalJson(activePool));
  const result = await reconcileActiveCandidate({ pool: activePool, candidateLaneRoot: lane, poolPath });
  assert.equal(result.status, 'RECONCILED');
  assert.equal(participantCalls, 0);
  const reconciledPool = JSON.parse(await readFile(poolPath, 'utf8')) as { candidates: Array<{ laneRef: string | null; baseDecisionRef: string | null; effectiveDecisionRef: string | null }> };
  assert.equal(reconciledPool.candidates[0]!.laneRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000002');
  assert.equal(reconciledPool.candidates[0]!.baseDecisionRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000002/decision.json');
  assert.equal(reconciledPool.candidates[0]!.effectiveDecisionRef, 'source-epochs/source-epoch-000001/candidates/hypothesis-000002/decision.json');
  const incomplete = await reconcileActiveCandidate({ pool: activePool, candidateLaneRoot: join(root, 'missing') });
  assert.equal(incomplete.status, 'INTERRUPTED');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCandidateSessionReconciliationTests().then(() => console.log('candidateSessionReconciliation.test.ts: ok')).catch(error => { console.error(error); process.exit(1); });
}
