import assert from 'node:assert/strict';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sha256Hex } from '../../scripts/evolution/phase0/provenance';
import { buildHumanFollowupInbox } from '../../scripts/evolution/humanFollowup/buildHumanFollowupInbox';
import { validateHumanFollowupWorkItem, type HumanFollowupStatus, type HumanFollowupWorkItemV1 } from '../../src/evolution/humanFollowupWorkItemContract';

const statuses: HumanFollowupStatus[] = [
  'OPEN',
  'INVESTIGATING',
  'DEFERRED',
  'REJECTED',
  'READY_FOR_FORMAL_TASK',
  'CONVERTED',
];

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function itemFor(status: HumanFollowupStatus, index: number): HumanFollowupWorkItemV1 {
  const identitySha256 = sha256Hex(`identity-${index}`);
  const reviewHistory = status === 'OPEN'
    ? []
    : status === 'CONVERTED'
      ? [
        { reviewedAt: '2026-08-29T00:01:00.000Z', fromStatus: 'OPEN' as const, toStatus: 'READY_FOR_FORMAL_TASK' as const, note: 'Ready.' },
        { reviewedAt: '2026-08-29T00:02:00.000Z', fromStatus: 'READY_FOR_FORMAL_TASK' as const, toStatus: 'CONVERTED' as const, note: 'Converted.' },
      ]
      : [{ reviewedAt: '2026-08-29T00:01:00.000Z', fromStatus: 'OPEN' as const, toStatus: status as Exclude<HumanFollowupStatus, 'OPEN' | 'CONVERTED'>, note: `Moved to ${status}.` }];
  return validateHumanFollowupWorkItem({
    schemaVersion: 'human-follow-up-work-item-v1',
    itemId: `item-${identitySha256}`,
    identitySha256,
    createdAt: `2026-08-29T00:0${index}:00.000Z`,
    updatedAt: `2026-08-29T00:0${index}:00.000Z`,
    status,
    problem: {
      hypothesisId: `hypothesis-${String(index).padStart(6, '0')}`,
      statement: `Problem statement ${index}.`,
      observedBasis: 'Observed in a sealed run.',
      feedbackRefs: ['overallImpression'],
      evidenceRefs: [`entry-${index}`],
      unknowns: ['Cause remains unknown.'],
      productSignificance: 'Human review may be useful.',
    },
    trigger: { route: 'ESCALATE_HUMAN', reasonCode: index % 2 === 0 ? 'EXPLICIT_ESCALATION' : 'ACCEPTED_OUT_OF_SCOPE' },
    provenance: {
      sourceRunRef: `cohort-run-${String(index).padStart(6, '0')}`,
      workflowInstanceRef: `workflow-instance-${index}`,
      workflowRef: '.tmp/evolution/workflow',
      decisionSha256: 'b'.repeat(64),
      sourceFingerprintSha256: 'c'.repeat(64),
      productSourceFingerprintSha256: 'd'.repeat(64),
    },
    evidence: [{ relativePath: 'decision.json', sha256: sha256Hex(`decision-${index}`) }],
    reviewHistory,
    formalTaskRef: status === 'CONVERTED' ? `formal-task-${index}` : null,
  });
}

async function createInboxFixture(): Promise<{ root: string; indexPath: string; itemPaths: string[] }> {
  const root = await mkdtemp(join(tmpdir(), 'human-followup-inbox-'));
  const itemsRoot = join(root, 'artifacts/evolution/human-follow-up/items');
  const itemPaths: string[] = [];
  for (const [index, status] of statuses.entries()) {
    const item = itemFor(status, index + 1);
    const itemDirectory = join(itemsRoot, item.itemId);
    const evidencePath = join(itemDirectory, 'evidence/decision.json');
    await mkdir(join(itemDirectory, 'evidence'), { recursive: true });
    await writeFile(evidencePath, `decision-${index + 1}`);
    const itemPath = join(itemDirectory, 'item.json');
    await writeJson(itemPath, item);
    itemPaths.push(itemPath);
  }
  return { root, indexPath: join(root, 'artifacts/evolution/human-follow-up/index.md'), itemPaths };
}

export async function runHumanFollowupInboxTests(): Promise<void> {
  const fixture = await createInboxFixture();
  const firstPath = await buildHumanFollowupInbox({ repositoryRoot: fixture.root });
  assert.equal(firstPath, fixture.indexPath);
  const firstBytes = await readFile(firstPath, 'utf8');
  assert.match(firstBytes, /active: 3/);
  assert.match(firstBytes, /deferred: 1/);
  assert.match(firstBytes, /rejected: 1/);
  assert.match(firstBytes, /converted: 1/);
  assert.match(firstBytes, /total: 6/);
  assert.match(firstBytes, /Problem statement 1/);
  assert.match(firstBytes, /EXPLICIT_ESCALATION/);
  assert.match(firstBytes, /cohort-run-000001/);
  assert.match(firstBytes, /2026-08-29T00:01:00.000Z/);
  assert.equal((firstBytes.match(/\| OPEN \|/g) ?? []).length, 1);
  assert.equal((firstBytes.match(/\| INVESTIGATING \|/g) ?? []).length, 1);
  assert.equal((firstBytes.match(/\| READY_FOR_FORMAL_TASK \|/g) ?? []).length, 1);
  assert.equal((firstBytes.match(/\| DEFERRED \|/g) ?? []).length, 0);
  assert.equal((firstBytes.match(/\| REJECTED \|/g) ?? []).length, 0);
  assert.equal((firstBytes.match(/\| CONVERTED \|/g) ?? []).length, 0);

  await rm(firstPath);
  const secondPath = await buildHumanFollowupInbox({ repositoryRoot: fixture.root });
  assert.equal(await readFile(secondPath, 'utf8'), firstBytes);

  const malformed = await createInboxFixture();
  await writeFile(malformed.itemPaths[0]!, '{}\n');
  await assert.rejects(() => buildHumanFollowupInbox({ repositoryRoot: malformed.root }), /invalid|missing/i);

  const tampered = await createInboxFixture();
  await writeFile(join(tampered.root, 'artifacts/evolution/human-follow-up/items', 'item-' + sha256Hex('identity-1'), 'evidence/decision.json'), 'tampered');
  await assert.rejects(() => buildHumanFollowupInbox({ repositoryRoot: tampered.root }), /hash|evidence/i);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHumanFollowupInboxTests()
    .then(() => console.log('humanFollowupInbox.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
