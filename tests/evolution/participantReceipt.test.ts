import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildParticipantInvocationReceiptInputs } from '../../scripts/evolution/evidence/participantReceipt';
import { publishDurableEvidenceCapsule, verifyDurableEvidenceCapsule } from '../../scripts/evolution/evidence/durableEvidenceCapsule';

async function write(root: string, path: string, value: string): Promise<void> {
  const target = join(root, path);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, value);
}

async function run(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-participant-receipt-'));
  const feedbackRoot = 'round-1/feedback-runs/source-run-000001';
  for (const [path, value] of [
    ['participant-prompt.txt', 'feedback prompt\n'],
    ['participant-binding.json', '{}\n'],
    ['participant-execution-trace.json', '{}\n'],
    ['invocation.json', JSON.stringify({ invocationRef: 'feedback-invocation-000001', status: 'completed' }) + '\n'],
    ['observable-payload.json', '{}\n'],
    ['raw-participant-response.txt', 'raw feedback\n'],
    ['feedback.json', '{}\n'],
  ] as const) await write(root, `${feedbackRoot}/${path}`, value);
  await write(root, `${feedbackRoot}/internal/player-surface-source.json`, 'human only\n');

  const evidence = [
    'participant-prompt.txt',
    'participant-binding.json',
    'participant-execution-trace.json',
    'invocation.json',
    'observable-payload.json',
    'raw-participant-response.txt',
    'feedback.json',
  ].map(file => ({
    logicalName: `session:${feedbackRoot}/${file}`,
    relativePath: `workflow/${feedbackRoot}/${file}`,
    sourcePath: join(root, feedbackRoot, file),
    visibility: file === 'observable-payload.json' ? 'PARTICIPANT_VISIBLE' as const : 'HUMAN_FORENSIC_ONLY' as const,
    evidenceKind: 'fixture',
    sourceRef: `${feedbackRoot}/${file}`,
  }));
  const receipts = await buildParticipantInvocationReceiptInputs({
    experimentRoot: root,
    evidence,
  });
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0]?.role, 'feedback');
  assert.deepEqual(receipts[0]?.visibleEvidenceLogicalNames, [
    `session:${feedbackRoot}/observable-payload.json`,
  ]);
  assert.equal(receipts[0]?.visibleEvidenceLogicalNames.some(name => name.includes('player-surface-source')), false);

  const capsule = await publishDurableEvidenceCapsule({
    capsuleRoot: join(root, 'artifacts/evolution/run-evidence/session-000001'),
    sessionId: 'session-000001',
    sourceRunRef: 'source-run-000001',
    createdAt: '2026-09-14T00:00:00.000Z',
    repositoryIdentity: { branch: 'dev', headSha: 'a'.repeat(40) },
    workflowIdentity: { workflow: 'ordinary-auto-evolution' },
    evidence,
    participantReceipts: receipts,
  });
  const manifest = JSON.parse(await readFile(join(capsule.capsuleRoot, 'manifest.json'), 'utf8')) as Record<string, unknown>;
  const firstReceipt = (manifest.participantReceipts as Array<Record<string, unknown>>)[0]!;
  (firstReceipt.prompt as Record<string, unknown>).sha256 = '0'.repeat(64);
  await writeFile(join(capsule.capsuleRoot, 'manifest.json'), JSON.stringify(manifest));
  await assert.rejects(() => verifyDurableEvidenceCapsule(capsule.capsuleRoot), /hash does not match|sha256/i);
}

run()
  .then(() => console.log('participantReceipt.test.ts: ok'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
