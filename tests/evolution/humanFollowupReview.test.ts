import assert from 'node:assert/strict';
import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { retainHumanFollowupWorkItem } from '../../scripts/evolution/humanFollowup/retainHumanFollowupWorkItem';
import { reviewHumanFollowupWorkItem } from '../../scripts/evolution/humanFollowup/reviewHumanFollowupWorkItem';
import { validateProblemPackage } from '../../src/evolution/problemPackageContract';
import { validateSolutionDecision } from '../../src/evolution/solutionDecisionContract';

const sourceRunRef = 'cohort-run-000001';
const authorityRefs = ['docs/product/auto-evolution-model.md'];

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function createItemFixture(): Promise<{
  repositoryRoot: string;
  itemId: string;
  itemPath: string;
}> {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'human-followup-review-'));
  const workflowRoot = join(repositoryRoot, '.tmp/evolution/workflow');
  const problemPackage = validateProblemPackage({
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
      statement: 'A problem requiring explicit Human disposition.',
      observedBasis: 'Observed in a sealed run.',
      feedbackRefs: ['overallImpression'],
      evidenceRefs: ['entry-000001'],
      unknowns: ['The cause remains unknown.'],
      productSignificance: 'The result may affect the player experience.',
    },
    authorityRefs,
    productSourceFingerprintSha256: 'a'.repeat(64),
    permissions: {
      authoritativeProductWrite: false,
      sandboxWrite: true,
      productExecution: false,
      codeExecution: false,
    },
  });
  const decision = validateSolutionDecision({
    schemaVersion: 'solution-decision-v1',
    problemId: problemPackage.problemId,
    route: 'ESCALATE_HUMAN',
    reasonCode: 'EXPLICIT_ESCALATION',
    inputs: {
      solutionStatus: 'ESCALATE',
      reviewerDecision: null,
      solutionScope: null,
      reviewScope: null,
      permissions: {
        authoritativeProductWrite: false,
        sandboxWrite: true,
        productExecution: false,
        codeExecution: false,
      },
      budget: { actualParticipantJobs: 3, maxParticipantJobs: 4, retryCount: 0 },
    },
  });
  await writeJson(join(workflowRoot, 'problem-package.json'), problemPackage);
  await writeJson(join(workflowRoot, 'source/observable-payload.json'), { observed: true });
  await writeJson(join(workflowRoot, `feedback-runs/${sourceRunRef}/feedback.json`), { overallImpression: 'Review needed.' });
  await writeJson(join(workflowRoot, `hypothesis-runs/${sourceRunRef}/hypotheses.json`), { hypotheses: [] });
  await writeJson(join(workflowRoot, 'selection/selected-hypothesis.json'), { selectedHypothesisId: 'hypothesis-000001' });
  await writeJson(join(workflowRoot, 'solution-agent/result.json'), { status: 'ESCALATE' });
  await writeJson(join(workflowRoot, 'decision.json'), decision);
  const retained = await retainHumanFollowupWorkItem({
    repositoryRoot,
    workflowRoot,
    workflowInstanceRef: 'workflow-instance-review-000001',
    sourceRunRef,
    sourceFingerprintSha256: 'b'.repeat(64),
    problemPackagePath: join(workflowRoot, 'problem-package.json'),
    decisionPath: join(workflowRoot, 'decision.json'),
  });
  return { repositoryRoot, itemId: retained.item.itemId, itemPath: retained.itemPath };
}

async function review(
  fixture: Awaited<ReturnType<typeof createItemFixture>>,
  toStatus: Parameters<typeof reviewHumanFollowupWorkItem>[0]['toStatus'],
  note = `Move to ${toStatus}.`,
  formalTaskRef?: string,
) {
  return reviewHumanFollowupWorkItem({
    repositoryRoot: fixture.repositoryRoot,
    itemId: fixture.itemId,
    toStatus,
    note,
    ...(formalTaskRef === undefined ? {} : { formalTaskRef }),
    now: () => '2026-08-29T01:02:03.000Z',
  });
}

export async function runHumanFollowupReviewTests(): Promise<void> {
  const fixture = await createItemFixture();
  const first = await review(fixture, 'INVESTIGATING', 'Investigate the retained evidence.');
  assert.equal(first.status, 'INVESTIGATING');
  assert.equal(first.reviewHistory.length, 1);
  assert.deepEqual(first.reviewHistory[0], {
    reviewedAt: '2026-08-29T01:02:03.000Z',
    fromStatus: 'OPEN',
    toStatus: 'INVESTIGATING',
    note: 'Investigate the retained evidence.',
  });
  const second = await review(fixture, 'DEFERRED');
  assert.equal(second.reviewHistory.length, 2);
  assert.equal(second.reviewHistory[0]?.toStatus, 'INVESTIGATING');
  assert.equal(second.updatedAt, '2026-08-29T01:02:03.000Z');

  const readyFixture = await createItemFixture();
  const ready = await review(readyFixture, 'READY_FOR_FORMAL_TASK');
  const converted = await review(readyFixture, 'CONVERTED', 'Create the existing formal task.', 'formal-task-000001');
  assert.equal(ready.status, 'READY_FOR_FORMAL_TASK');
  assert.equal(converted.status, 'CONVERTED');
  assert.equal(converted.formalTaskRef, 'formal-task-000001');
  assert.equal(converted.reviewHistory.length, 2);

  const transitionPaths: Array<Array<Parameters<typeof reviewHumanFollowupWorkItem>[0]['toStatus']>> = [
    ['DEFERRED', 'OPEN', 'REJECTED'],
    ['DEFERRED', 'INVESTIGATING', 'READY_FOR_FORMAL_TASK', 'DEFERRED', 'REJECTED'],
    ['READY_FOR_FORMAL_TASK', 'DEFERRED', 'INVESTIGATING', 'REJECTED'],
  ];
  for (const path of transitionPaths) {
    const pathFixture = await createItemFixture();
    for (const toStatus of path) await review(pathFixture, toStatus);
  }

  const conversionFixture = await createItemFixture();
  await review(conversionFixture, 'READY_FOR_FORMAL_TASK');
  const beforeConversionFailure = await readFile(conversionFixture.itemPath);
  await assert.rejects(() => review(conversionFixture, 'CONVERTED'), /formalTaskRef/i);
  assert.deepEqual(await readFile(conversionFixture.itemPath), beforeConversionFailure);

  const invalidTransitionFixture = await createItemFixture();
  const beforeInvalidTransition = await readFile(invalidTransitionFixture.itemPath);
  await assert.rejects(() => review(invalidTransitionFixture, 'CONVERTED', 'No conversion yet.', 'formal-task-000002'), /transition|formalTaskRef/i);
  assert.deepEqual(await readFile(invalidTransitionFixture.itemPath), beforeInvalidTransition);

  const invalidReferenceFixture = await createItemFixture();
  const beforeInvalidReference = await readFile(invalidReferenceFixture.itemPath);
  await assert.rejects(() => review(invalidReferenceFixture, 'INVESTIGATING', 'Reference is not allowed.', 'formal-task-000003'), /formalTaskRef/i);
  assert.deepEqual(await readFile(invalidReferenceFixture.itemPath), beforeInvalidReference);

  const malformedFixture = await createItemFixture();
  await writeFile(malformedFixture.itemPath, '{}\n');
  await assert.rejects(() => review(malformedFixture, 'INVESTIGATING'), /invalid|missing/i);

  const invalidIdFixture = await createItemFixture();
  await assert.rejects(
    () => reviewHumanFollowupWorkItem({
      repositoryRoot: invalidIdFixture.repositoryRoot,
      itemId: '../escape',
      toStatus: 'INVESTIGATING',
      note: 'Must not write outside the item root.',
    }),
    /itemId/i,
  );

  const evidenceCorruptFixture = await createItemFixture();
  const evidencePath = join(dirname(evidenceCorruptFixture.itemPath), 'evidence', 'decision.json');
  await writeFile(evidencePath, 'tampered\n');
  const beforeEvidenceFailure = await readFile(evidenceCorruptFixture.itemPath);
  await assert.rejects(() => review(evidenceCorruptFixture, 'INVESTIGATING'), /evidence|hash/i);
  assert.deepEqual(await readFile(evidenceCorruptFixture.itemPath), beforeEvidenceFailure);
  assert.equal(await lstat(evidencePath).then(stat => stat.isFile()), true);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHumanFollowupReviewTests()
    .then(() => console.log('humanFollowupReview.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
