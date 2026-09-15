import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildProblemPackage } from '../../scripts/evolution/problemAgnosticSolution/buildProblemPackage';
import { retainHumanFollowupWorkItem } from '../../scripts/evolution/humanFollowup/retainHumanFollowupWorkItem';
import { canonicalJson } from '../../scripts/evolution/phase0/provenance';

const candidate = {
  hypothesisId: 'hypothesis-000002', hypothesis: 'Candidate requires human authority.', observedBasis: 'Observed.', feedbackRefs: ['overallImpression'], evidenceRefs: [], unknowns: ['Authority choice.'], productSignificance: 'Significant.',
};

export async function runCandidateHumanFollowupRetentionTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'candidate-hfl-'));
  const laneRoot = join(root, 'candidate-lane');
  for (const path of ['source/observable-payload.json', 'feedback-runs/cohort-run-000001/feedback.json', 'hypothesis-runs/cohort-run-000001/hypotheses.json', 'diagnostic/causal-attribution.json', 'solution-agent/result.json']) {
    await mkdir(join(laneRoot, path, '..'), { recursive: true });
    await writeFile(join(laneRoot, path), '{}');
  }
  await writeFile(join(laneRoot, 'hypothesis-runs/cohort-run-000001/hypotheses.json'), JSON.stringify({ hypotheses: [candidate] }));
  await writeFile(join(laneRoot, 'candidate-activation.json'), canonicalJson({ schemaVersion: 'candidate-activation-v1', candidateRef: 'pool/hypothesis-000002', hypothesisId: candidate.hypothesisId }));
  const packagePath = join(laneRoot, 'problem-package.json');
  await buildProblemPackage({
    activeCandidate: candidate,
    activeCandidateRef: 'pool/hypothesis-000002',
    activeCandidateSourceIndex: 1,
    runRef: 'cohort-run-000001',
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: 'feedback-runs/cohort-run-000001/feedback.json',
    improvementHypothesisRef: 'hypothesis-runs/cohort-run-000001/hypotheses.json',
    diagnosticEvidenceRefs: ['diagnostic/causal-attribution.json'],
    authorityRefs: ['docs/product/auto-evolution-model.md'],
    productSourceFingerprintSha256: 'a'.repeat(64),
    destinationPath: packagePath,
  });
  const decisionPath = join(laneRoot, 'decision.json');
  await writeFile(decisionPath, canonicalJson({
    schemaVersion: 'solution-decision-v1', problemId: 'problem-hypothesis-000002', route: 'ESCALATE_HUMAN', reasonCode: 'EXPLICIT_ESCALATION',
    inputs: { solutionStatus: 'ESCALATE', reviewerDecision: null, solutionScope: null, reviewScope: null, permissions: { authoritativeProductWrite: false, sandboxWrite: true, productExecution: false, codeExecution: false }, budget: { actualParticipantJobs: 1, maxParticipantJobs: 4, retryCount: 0 } },
  }));
  const first = await retainHumanFollowupWorkItem({
    repositoryRoot: root, workflowRoot: laneRoot, workflowInstanceRef: 'candidate-h1', sourceRunRef: 'cohort-run-000001', sourceFingerprintSha256: 'b'.repeat(64), problemPackagePath: packagePath, decisionPath,
    candidateProvenance: { mode: 'candidate-activation-v1', candidateActivationPath: 'candidate-activation.json', hypothesisSetPath: 'hypothesis-runs/cohort-run-000001/hypotheses.json' },
  });
  assert.equal(first.created, true);
  assert.equal(first.item.evidence.some(entry => entry.relativePath === 'selection/selected-hypothesis.json'), false);
  assert.equal(first.item.evidence.some(entry => entry.relativePath === 'candidate-activation.json'), true);
  const second = await retainHumanFollowupWorkItem({
    repositoryRoot: root, workflowRoot: laneRoot, workflowInstanceRef: 'candidate-h2', sourceRunRef: 'cohort-run-000001', sourceFingerprintSha256: 'b'.repeat(64), problemPackagePath: packagePath, decisionPath,
    candidateProvenance: { mode: 'candidate-activation-v1', candidateActivationPath: 'candidate-activation.json', hypothesisSetPath: 'hypothesis-runs/cohort-run-000001/hypotheses.json' },
  });
  assert.notEqual(first.item.itemId, second.item.itemId);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCandidateHumanFollowupRetentionTests()
    .then(() => console.log('candidateHumanFollowupRetention.test.ts: ok'))
    .catch(error => { console.error(error); process.exit(1); });
}
