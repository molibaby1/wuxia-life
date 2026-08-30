import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import {
  canonicalJson,
  sha256Hex,
} from '../../scripts/evolution/phase0/provenance';
import { retainHumanFollowupWorkItem } from '../../scripts/evolution/humanFollowup/retainHumanFollowupWorkItem';
import { validateProblemPackage, type ProblemPackageV1 } from '../../src/evolution/problemPackageContract';
import { validateSolutionDecision, type SolutionDecisionV1 } from '../../src/evolution/solutionDecisionContract';
import { validateHumanFollowupWorkItem } from '../../src/evolution/humanFollowupWorkItemContract';

const sourceRunRef = 'cohort-run-000001';
const sourceFingerprintSha256 = 'c'.repeat(64);

const problemPackage: ProblemPackageV1 = validateProblemPackage({
  schemaVersion: 'problem-package-v1',
  problemId: 'problem-000001',
  source: {
    runRef: sourceRunRef,
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: `feedback-runs/${sourceRunRef}/feedback.json`,
    improvementHypothesisRef: `hypothesis-runs/${sourceRunRef}/hypotheses.json`,
  },
  problem: {
    hypothesisId: 'hypothesis-000001',
    statement: 'A retained problem statement.',
    observedBasis: 'Observed in the sealed source.',
    feedbackRefs: ['overallImpression'],
    evidenceRefs: ['entry-000001'],
    unknowns: ['Cause remains unknown.'],
    productSignificance: 'Human review may be useful.',
  },
  authorityRefs: ['docs/product/auto-evolution-model.md'],
  productSourceFingerprintSha256: 'd'.repeat(64),
  permissions: {
    authoritativeProductWrite: false,
    sandboxWrite: true,
    productExecution: false,
    codeExecution: false,
  },
});

function createDecision(reasonCode: 'EXPLICIT_ESCALATION' | 'ACCEPTED_OUT_OF_SCOPE'): SolutionDecisionV1 {
  return validateSolutionDecision({
    schemaVersion: 'solution-decision-v1',
    problemId: problemPackage.problemId,
    route: 'ESCALATE_HUMAN',
    reasonCode,
    inputs: {
      solutionStatus: 'OPTIONS',
      reviewerDecision: 'ACCEPT_OPTION',
      solutionScope: 'program',
      reviewScope: 'code_required',
      permissions: {
        authoritativeProductWrite: false,
        sandboxWrite: true,
        productExecution: false,
        codeExecution: false,
      },
      budget: { actualParticipantJobs: 4, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function createFixture(input: {
  reasonCode?: 'EXPLICIT_ESCALATION' | 'ACCEPTED_OUT_OF_SCOPE';
  reviewer?: boolean;
  repositoryRoot?: string;
  workflowDirectory?: string;
  workflowInstanceRef?: string;
} = {}): Promise<{
  repositoryRoot: string;
  workflowRoot: string;
  workflowInstanceRef: string;
  problemPackagePath: string;
  decisionPath: string;
  decision: SolutionDecisionV1;
}> {
  const repositoryRoot = input.repositoryRoot ?? await mkdtemp(join(tmpdir(), 'human-followup-retention-'));
  const workflowRoot = join(repositoryRoot, input.workflowDirectory ?? '.tmp/evolution/problem-agnostic-agent-solution-loop');
  const decision = createDecision(input.reasonCode ?? 'EXPLICIT_ESCALATION');
  const problemPackagePath = join(workflowRoot, 'problem-package.json');
  const decisionPath = join(workflowRoot, 'decision.json');
  await writeJson(problemPackagePath, problemPackage);
  await writeJson(join(workflowRoot, 'source/observable-payload.json'), { playerSurface: 'observed' });
  await writeJson(join(workflowRoot, `feedback-runs/${sourceRunRef}/feedback.json`), { overallImpression: 'Needs review.' });
  await writeJson(join(workflowRoot, `hypothesis-runs/${sourceRunRef}/hypotheses.json`), { hypotheses: [problemPackage.problem] });
  await writeJson(join(workflowRoot, 'selection/selected-hypothesis.json'), { selectedHypothesis: problemPackage.problem });
  await writeJson(join(workflowRoot, 'solution-agent/result.json'), { status: 'OPTIONS', options: [{ optionId: 'option-000001' }] });
  if (input.reviewer ?? true) {
    await writeJson(join(workflowRoot, 'reviewer-agent/review.json'), { decision: 'ACCEPT_OPTION', scopeAssessment: 'code_required' });
  }
  await writeJson(decisionPath, decision);
  return {
    repositoryRoot,
    workflowRoot,
    workflowInstanceRef: input.workflowInstanceRef ?? 'workflow-instance-000001',
    problemPackagePath,
    decisionPath,
    decision,
  };
}

function expectedItemId(
  decision: SolutionDecisionV1,
  workflowInstanceRef = 'workflow-instance-000001',
): string {
  const decisionSha256 = sha256Hex(canonicalJson(decision));
  const identitySha256 = sha256Hex(canonicalJson({ workflowInstanceRef, sourceRunRef, decisionSha256 }));
  return `item-${identitySha256}`;
}

async function retain(fixture: Awaited<ReturnType<typeof createFixture>>) {
  return retainHumanFollowupWorkItem({
    repositoryRoot: fixture.repositoryRoot,
    workflowRoot: fixture.workflowRoot,
    workflowInstanceRef: fixture.workflowInstanceRef,
    sourceRunRef,
    sourceFingerprintSha256,
    problemPackagePath: fixture.problemPackagePath,
    decisionPath: fixture.decisionPath,
  });
}

export async function runHumanFollowupRetentionTests(): Promise<void> {
  const fixture = await createFixture();
  const first = await retain(fixture);
  assert.equal(first.created, true);
  assert.equal(first.item.status, 'OPEN');
  assert.equal(first.item.itemId, expectedItemId(fixture.decision));
  assert.equal(first.item.provenance.workflowRef, '.tmp/evolution/problem-agnostic-agent-solution-loop');

  const expectedEvidence = [
    'problem-package.json',
    'source/observable-payload.json',
    `feedback-runs/${sourceRunRef}/feedback.json`,
    `hypothesis-runs/${sourceRunRef}/hypotheses.json`,
    'selection/selected-hypothesis.json',
    'solution-agent/result.json',
    'reviewer-agent/review.json',
    'decision.json',
  ];
  assert.deepEqual(first.item.evidence.map(entry => entry.relativePath), expectedEvidence);
  for (const entry of first.item.evidence) {
    const retainedPath = join(dirname(first.itemPath), 'evidence', entry.relativePath);
    assert.equal((await lstat(retainedPath)).isFile(), true);
    assert.equal(sha256Hex(await readFile(retainedPath)), entry.sha256);
  }
  assert.deepEqual(validateHumanFollowupWorkItem(JSON.parse(await readFile(first.itemPath, 'utf8'))), first.item);

  const duplicate = await retain(fixture);
  assert.equal(duplicate.created, false);
  assert.equal(duplicate.itemPath, first.itemPath);
  assert.equal(duplicate.item.itemId, first.item.itemId);
  assert.deepEqual(await readdir(join(fixture.repositoryRoot, 'artifacts/evolution/human-follow-up/items')), [first.item.itemId]);

  await rm(fixture.workflowRoot, { recursive: true, force: true });
  assert.deepEqual(validateHumanFollowupWorkItem(JSON.parse(await readFile(first.itemPath, 'utf8'))), first.item);

  const outOfScopeFixture = await createFixture({ reasonCode: 'ACCEPTED_OUT_OF_SCOPE', reviewer: false });
  const outOfScope = await retain(outOfScopeFixture);
  assert.equal(outOfScope.created, true);
  assert.equal(outOfScope.item.trigger.reasonCode, 'ACCEPTED_OUT_OF_SCOPE');

  const sharedRepositoryRoot = await mkdtemp(join(tmpdir(), 'human-followup-independent-workflows-'));
  const workflowA = await createFixture({
    repositoryRoot: sharedRepositoryRoot,
    workflowDirectory: '.tmp/evolution/workflow-a',
    workflowInstanceRef: 'workflow-instance-a',
  });
  const workflowB = await createFixture({
    repositoryRoot: sharedRepositoryRoot,
    workflowDirectory: '.tmp/evolution/workflow-b',
    workflowInstanceRef: 'workflow-instance-b',
  });
  const retainedA = await retain(workflowA);
  const duplicateA = await retain(workflowA);
  const retainedB = await retain(workflowB);
  assert.equal(retainedA.item.itemId, expectedItemId(workflowA.decision, 'workflow-instance-a'));
  assert.equal(duplicateA.created, false);
  assert.equal(retainedB.item.itemId, expectedItemId(workflowB.decision, 'workflow-instance-b'));
  assert.notEqual(retainedA.item.itemId, retainedB.item.itemId);
  assert.equal(retainedA.item.provenance.workflowInstanceRef, 'workflow-instance-a');
  assert.equal(retainedB.item.provenance.workflowInstanceRef, 'workflow-instance-b');
  assert.deepEqual(
    (await readdir(join(sharedRepositoryRoot, 'artifacts/evolution/human-follow-up/items'))).sort(),
    [retainedA.item.itemId, retainedB.item.itemId].sort(),
  );

  const nonEscalationFixture = await createFixture();
  const nonEscalationDecision = validateSolutionDecision({
    ...nonEscalationFixture.decision,
    route: 'SKIP',
    reasonCode: 'REVIEW_REJECTED',
  });
  await writeJson(nonEscalationFixture.decisionPath, nonEscalationDecision);
  await assert.rejects(() => retain(nonEscalationFixture), /ESCALATE_HUMAN/);

  const missingEvidenceFixture = await createFixture();
  await rm(join(missingEvidenceFixture.workflowRoot, 'selection/selected-hypothesis.json'));
  await assert.rejects(() => retain(missingEvidenceFixture), /required evidence|selected-hypothesis/i);
  assert.deepEqual(
    await readdir(join(missingEvidenceFixture.repositoryRoot, 'artifacts/evolution/human-follow-up/items')),
    [],
  );

  const nonFileFixture = await createFixture();
  await rm(join(nonFileFixture.workflowRoot, 'solution-agent/result.json'));
  await mkdir(join(nonFileFixture.workflowRoot, 'solution-agent/result.json'), { recursive: true });
  await assert.rejects(() => retain(nonFileFixture), /required evidence|regular file/i);

  const corruptFixture = await createFixture();
  const corrupt = await retain(corruptFixture);
  const corruptItem = JSON.parse(await readFile(corrupt.itemPath, 'utf8')) as Record<string, unknown>;
  corruptItem.status = 'UNKNOWN';
  await writeJson(corrupt.itemPath, corruptItem);
  await assert.rejects(() => retain(corruptFixture), /invalid|status/i);

  const malformedFinalFixture = await createFixture();
  const malformedFinalPath = join(
    malformedFinalFixture.repositoryRoot,
    'artifacts/evolution/human-follow-up/items',
    expectedItemId(malformedFinalFixture.decision),
  );
  await mkdir(malformedFinalPath, { recursive: true });
  await assert.rejects(() => retain(malformedFinalFixture), /item\.json|malformed|canonical/i);

  const stagingFixture = await createFixture();
  const itemsRoot = join(stagingFixture.repositoryRoot, 'artifacts/evolution/human-follow-up/items');
  await mkdir(join(itemsRoot, '.staging-sentinel'), { recursive: true });
  await assert.rejects(() => retain(stagingFixture), /staging/i);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHumanFollowupRetentionTests()
    .then(() => console.log('humanFollowupRetention.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
