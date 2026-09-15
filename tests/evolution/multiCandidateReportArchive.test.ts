import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildCandidatePoolV1 } from '../../scripts/evolution/candidatePoolContract';
import { activateCandidate, completeCandidate } from '../../scripts/evolution/candidatePoolState';
import { writeMultiCandidateSessionManifestAtomic } from '../../scripts/evolution/candidateSessionStore';
import { buildMultiCandidateSessionManifestV1 } from '../../scripts/evolution/multiCandidateSessionManifestContract';
import { archiveMultiCandidateSessionReport } from '../../scripts/evolution/reporting/archiveMultiCandidateSessionReport';
import { canonicalJson } from '../../scripts/evolution/phase0/provenance';

const decision = { schemaVersion: 'solution-decision-v1', problemId: 'problem-hypothesis-000001', route: 'SKIP', reasonCode: 'NO_PROPOSAL', inputs: { solutionStatus: 'NO_PROPOSAL', reviewerDecision: null, solutionScope: null, reviewScope: null, permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } } };

export async function runMultiCandidateReportArchiveTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'candidate-report-archive-'));
  const hypothesis = { hypothesisId: 'hypothesis-000001', hypothesis: 'H1', observedBasis: 'Observed.', feedbackRefs: ['feedback'], evidenceRefs: [], unknowns: ['Unknown.'], productSignificance: 'Significant.' };
  let pool = buildCandidatePoolV1({ logicalSessionId: 'logical-session-000001', sourceEpochId: 'source-epoch-000001', sourceRunRef: 'source-000001', sourceFingerprintSha256: 'a'.repeat(64), sealedSourceRef: 'source-epochs/source-epoch-000001', hypothesisSet: { artifactRef: 'hypothesis-runs/source-000001/hypotheses.json', hypotheses: [hypothesis] }, baseline: { branch: 'dev', headSha: 'b'.repeat(40), workingTreeFingerprint: 'c'.repeat(64), participantBinding: 'CODEX_CURRENT' } });
  pool = activateCandidate(pool, pool.candidates[0]!.candidateRef);
  pool = completeCandidate(pool, pool.candidates[0]!.candidateRef, { laneRef: 'source-epochs/source-epoch-000001/candidates/hypothesis-000001', baseDecisionRef: 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/decision.json', effectiveDecisionRef: 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/decision.json' });
  const sessionRoot = join(root, 'artifacts/evolution/sessions/logical-session-000001');
  const poolPath = join(sessionRoot, 'source-epochs/source-epoch-000001/candidate-pool.json');
  await mkdir(join(sessionRoot, 'source-epochs/source-epoch-000001/candidates/hypothesis-000001'), { recursive: true });
  await writeFile(poolPath, `${canonicalJson(pool)}\n`);
  await writeFile(join(sessionRoot, 'source-epochs/source-epoch-000001/candidates/hypothesis-000001/decision.json'), `${canonicalJson(decision)}\n`);
  const manifest = (hostSlices: Array<{ hostSliceId: string; startedAt: string; endedAt: string; participantJobs: number; state: 'COMPLETED'; reason: null }>) => buildMultiCandidateSessionManifestV1({ logicalSessionId: 'logical-session-000001', sessionState: 'COMPLETED', pauseOrStopReason: null, sourceEpochs: [{ sourceEpochRef: 'source-epoch-000001', sourceRunRef: 'source-000001', poolRef: 'source-epochs/source-epoch-000001/candidate-pool.json', poolStatus: 'EXHAUSTED', lifecycle: 'POOL_EXHAUSTED', candidateCounts: { total: 1, pending: 0, active: 0, completed: 1, superseded: 0, interrupted: 0 }, dispositionCounts: { SKIP: 1 } }], currentSourceEpochRef: 'source-epoch-000001', hostSlices, sourceTransitionCount: 0, failureRef: null, repositoryBaseline: { branch: 'dev', headSha: 'b'.repeat(40), workingTreeFingerprint: 'c'.repeat(64) }, participantBindingId: 'CODEX_CURRENT' });
  await writeMultiCandidateSessionManifestAtomic(root, manifest([{ hostSliceId: 'host-slice-000001', startedAt: '2026-09-15T00:00:00.000Z', endedAt: '2026-09-15T00:01:00.000Z', participantJobs: 3, state: 'COMPLETED', reason: null }]));
  const first = await archiveMultiCandidateSessionReport({ repositoryRoot: root, logicalSessionId: 'logical-session-000001', hostSliceId: 'host-slice-000001', createdAt: '2026-09-15T00:01:00.000Z' });
  const firstBytes = await readFile(first.reportJsonPath, 'utf8');
  await writeMultiCandidateSessionManifestAtomic(root, manifest([
    { hostSliceId: 'host-slice-000001', startedAt: '2026-09-15T00:00:00.000Z', endedAt: '2026-09-15T00:01:00.000Z', participantJobs: 3, state: 'COMPLETED', reason: null },
    { hostSliceId: 'host-slice-000002', startedAt: '2026-09-15T01:00:00.000Z', endedAt: '2026-09-15T01:01:00.000Z', participantJobs: 0, state: 'COMPLETED', reason: null },
  ]));
  const second = await archiveMultiCandidateSessionReport({ repositoryRoot: root, logicalSessionId: 'logical-session-000001', hostSliceId: 'host-slice-000002', createdAt: '2026-09-15T01:01:00.000Z' });
  assert.notEqual(first.reportId, second.reportId);
  assert.equal(await readFile(first.reportJsonPath, 'utf8'), firstBytes);
  assert.match(await readFile(first.reportMarkdownPath, 'utf8'), /Logical Session/);
}

if (import.meta.url === `file://${process.argv[1]}`) runMultiCandidateReportArchiveTests().then(() => console.log('multiCandidateReportArchive.test.ts: ok')).catch(error => { console.error(error); process.exit(1); });
