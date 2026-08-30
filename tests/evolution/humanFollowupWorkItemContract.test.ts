import assert from 'node:assert/strict';
import {
  canTransitionHumanFollowupStatus,
  validateHumanFollowupWorkItem,
  type HumanFollowupWorkItemV1,
} from '../../src/evolution/humanFollowupWorkItemContract';

const validItem: HumanFollowupWorkItemV1 = {
  schemaVersion: 'human-follow-up-work-item-v1',
  itemId: `item-${'a'.repeat(64)}`,
  identitySha256: 'a'.repeat(64),
  createdAt: '2026-08-29T00:00:00.000Z',
  updatedAt: '2026-08-29T00:00:00.000Z',
  status: 'OPEN',
  problem: {
    hypothesisId: 'hypothesis-000001',
    statement: 'A retained problem.',
    observedBasis: 'Observed in a sealed run.',
    feedbackRefs: ['overallImpression'],
    evidenceRefs: ['entry-000001'],
    unknowns: ['Cause remains unknown.'],
    productSignificance: 'Human review may be useful.',
  },
  trigger: { route: 'ESCALATE_HUMAN', reasonCode: 'EXPLICIT_ESCALATION' },
  provenance: {
    sourceRunRef: 'cohort-run-000001',
    workflowInstanceRef: 'workflow-instance-000001',
    workflowRef: '.tmp/evolution/problem-agnostic-agent-solution-loop',
    decisionSha256: 'b'.repeat(64),
    sourceFingerprintSha256: 'c'.repeat(64),
    productSourceFingerprintSha256: 'd'.repeat(64),
  },
  evidence: [{ relativePath: 'decision.json', sha256: 'e'.repeat(64) }],
  reviewHistory: [],
  formalTaskRef: null,
};

function cloneItem(): HumanFollowupWorkItemV1 {
  return JSON.parse(JSON.stringify(validItem)) as HumanFollowupWorkItemV1;
}

export function runHumanFollowupWorkItemContractTests(): void {
  assert.deepEqual(validateHumanFollowupWorkItem(cloneItem()), validItem);

  for (const status of [
    'OPEN',
    'INVESTIGATING',
    'DEFERRED',
    'REJECTED',
    'READY_FOR_FORMAL_TASK',
  ] as const) {
    const item = cloneItem();
    item.status = status;
    if (status !== 'OPEN') {
      item.reviewHistory = [{
        reviewedAt: '2026-08-29T00:01:00.000Z',
        fromStatus: 'OPEN',
        toStatus: status,
        note: `Moved to ${status}.`,
      }];
    }
    assert.equal(validateHumanFollowupWorkItem(item).status, status);
  }

  const converted = cloneItem();
  converted.status = 'CONVERTED';
  converted.formalTaskRef = 'formal-task-000001';
  converted.reviewHistory = [
    {
      reviewedAt: '2026-08-29T00:01:00.000Z',
      fromStatus: 'OPEN',
      toStatus: 'READY_FOR_FORMAL_TASK',
      note: 'Ready for existing formal workflow.',
    },
    {
      reviewedAt: '2026-08-29T00:02:00.000Z',
      fromStatus: 'READY_FOR_FORMAL_TASK',
      toStatus: 'CONVERTED',
      note: 'Existing formal task created.',
    },
  ];
  assert.equal(validateHumanFollowupWorkItem(converted).status, 'CONVERTED');

  assert.throws(
    () => validateHumanFollowupWorkItem({ ...cloneItem(), status: 'UNKNOWN' }),
    /status.*invalid/i,
  );
  assert.throws(
    () => validateHumanFollowupWorkItem({
      ...cloneItem(),
      trigger: { route: 'ESCALATE_HUMAN', reasonCode: 'PARTICIPANT_FAILURE' },
    }),
    /reasonCode.*invalid/i,
  );
  assert.throws(
    () => validateHumanFollowupWorkItem({ ...cloneItem(), itemId: 'item-invalid' }),
    /itemId/i,
  );
  assert.throws(
    () => validateHumanFollowupWorkItem({ ...cloneItem(), identitySha256: 'not-a-sha' }),
    /identitySha256/i,
  );
  assert.throws(
    () => validateHumanFollowupWorkItem({
      ...cloneItem(),
      evidence: [{ relativePath: '../decision.json', sha256: 'e'.repeat(64) }],
    }),
    /relative path/i,
  );
  assert.throws(
    () => validateHumanFollowupWorkItem({
      ...cloneItem(),
      evidence: [{ relativePath: 'decision.json' }],
    }),
    /sha256/i,
  );
  assert.throws(
    () => validateHumanFollowupWorkItem({
      ...cloneItem(),
      status: 'CONVERTED',
    }),
    /formalTaskRef|review history/i,
  );
  assert.throws(
    () => validateHumanFollowupWorkItem({ ...cloneItem(), status: 'DEFERRED' }),
    /review history|OPEN/i,
  );
  assert.throws(
    () => validateHumanFollowupWorkItem({
      ...cloneItem(),
      unexpected: true,
    }),
    /unknown field.*unexpected/i,
  );

  const invalidHistory = cloneItem();
  invalidHistory.status = 'INVESTIGATING';
  invalidHistory.reviewHistory = [{
    reviewedAt: '2026-08-29T00:01:00.000Z',
    fromStatus: 'OPEN',
    toStatus: 'DEFERRED',
    note: 'The persisted final status disagrees with history.',
  }];
  assert.throws(
    () => validateHumanFollowupWorkItem(invalidHistory),
    /history|status transition/i,
  );

  assert.equal(canTransitionHumanFollowupStatus('OPEN', 'INVESTIGATING'), true);
  assert.equal(canTransitionHumanFollowupStatus('OPEN', 'READY_FOR_FORMAL_TASK'), true);
  assert.equal(canTransitionHumanFollowupStatus('OPEN', 'OPEN'), false);
  assert.equal(canTransitionHumanFollowupStatus('INVESTIGATING', 'OPEN'), false);
  assert.equal(canTransitionHumanFollowupStatus('DEFERRED', 'OPEN'), true);
  assert.equal(canTransitionHumanFollowupStatus('READY_FOR_FORMAL_TASK', 'CONVERTED'), true);
  assert.equal(canTransitionHumanFollowupStatus('CONVERTED', 'OPEN'), false);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    runHumanFollowupWorkItemContractTests();
    console.log('humanFollowupWorkItemContract.test.ts: ok');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
