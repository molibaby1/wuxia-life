import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildParticipantInvocationReceiptInputs } from '../../scripts/evolution/evidence/participantReceipt';
import { publishDurableEvidenceCapsule, verifyDurableEvidenceCapsule } from '../../scripts/evolution/evidence/durableEvidenceCapsule';
import { sha256Hex } from '../../scripts/evolution/phase0/provenance';

async function write(root: string, path: string, value: string): Promise<void> {
  const target = join(root, path);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, value);
}

async function run(): Promise<void> {
  await testAllInvocationRolesHaveReceipts();
  await testReceiptHashIntegrity();
}

async function testAllInvocationRolesHaveReceipts(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-participant-receipt-roles-'));
  const sessionId = 'session-roles-000001';
  const evidence: Array<{
    logicalName: string;
    relativePath: string;
    sourcePath: string;
    visibility: 'PARTICIPANT_VISIBLE' | 'HUMAN_FORENSIC_ONLY';
    evidenceKind: string;
    sourceRef: string;
  }> = [];
  const add = async (sourceRef: string, value: string, visibility: 'PARTICIPANT_VISIBLE' | 'HUMAN_FORENSIC_ONLY' = 'HUMAN_FORENSIC_ONLY'): Promise<void> => {
    await write(root, sourceRef, value);
    evidence.push({
      logicalName: `session:${sourceRef}`,
      relativePath: `workflow/${sourceRef}`,
      sourcePath: join(root, sourceRef),
      visibility,
      evidenceKind: 'fixture',
      sourceRef,
    });
  };
  const invocation = async (rootRef: string, invocationRef: string, structuredFile: string, role: string): Promise<void> => {
    await add(`${rootRef}/participant-prompt.txt`, `${invocationRef} prompt\n`);
    await add(`${rootRef}/participant-binding.json`, '{}\n');
    await add(`${rootRef}/execution-trace.json`, '{}\n');
    await add(`${rootRef}/invocation.json`, JSON.stringify({
      ...(role === 'hypothesis' ? { hypothesisInvocationRef: invocationRef } : { invocationRef }),
      status: 'completed',
      authorityRefs: role === 'solution' || role === 'reviewer' ? ['docs/example.md'] : [],
      skillAssignments: role === 'solution' || role === 'reviewer'
        ? [{ identity: 'example', version: '1', canonicalPath: 'skills/example/SKILL.md' }]
        : [],
    }) + '\n');
    await add(`${rootRef}/${structuredFile}`, '{}\n');
    await add(`${rootRef}/raw-output.txt`, `${invocationRef} output\n`);
  };

  const feedbackRoot = `round-1/feedback-runs/${sessionId}`;
  await add(`${feedbackRoot}/participant-prompt.txt`, 'feedback prompt\n');
  await add(`${feedbackRoot}/participant-binding.json`, '{}\n');
  await add(`${feedbackRoot}/participant-execution-trace.json`, '{}\n');
  await add(`${feedbackRoot}/invocation.json`, JSON.stringify({ invocationRef: 'feedback-invocation-000001', status: 'completed' }) + '\n');
  await add(`${feedbackRoot}/observable-payload.json`, '{}\n', 'PARTICIPANT_VISIBLE');
  await add(`${feedbackRoot}/feedback.json`, '{}\n', 'PARTICIPANT_VISIBLE');
  await add(`${feedbackRoot}/raw-participant-response.txt`, 'feedback raw\n');
  await add(`${feedbackRoot}/internal/player-surface-source.json`, 'human only\n');

  const hypothesisRoot = `round-1/hypothesis-runs/${sessionId}`;
  await add(`${hypothesisRoot}/participant-prompt.txt`, 'hypothesis prompt\n');
  await add(`${hypothesisRoot}/participant-binding.json`, '{}\n');
  await add(`${hypothesisRoot}/participant-execution-trace.json`, '{}\n');
  await add(`${hypothesisRoot}/invocation.json`, JSON.stringify({ hypothesisInvocationRef: 'hypothesis-invocation-000001', status: 'completed' }) + '\n');
  await add(`${hypothesisRoot}/source-observable-payload.json`, '{}\n', 'PARTICIPANT_VISIBLE');
  await add(`${hypothesisRoot}/source-feedback.json`, '{}\n', 'PARTICIPANT_VISIBLE');
  await add(`${hypothesisRoot}/hypotheses.json`, '{}\n', 'PARTICIPANT_VISIBLE');
  await add(`${hypothesisRoot}/raw-participant-response.txt`, 'hypothesis raw\n');

  await add('round-1/source/observable-payload.json', '{}\n', 'PARTICIPANT_VISIBLE');
  await add('round-1/diagnostic/causal-attribution.json', '{}\n', 'PARTICIPANT_VISIBLE');
  await add('round-1/problem-package.json', JSON.stringify({
    source: {
      observablePayloadRef: 'source/observable-payload.json',
      externalFeedbackRef: `${feedbackRoot}/feedback.json`,
      improvementHypothesisRef: `${hypothesisRoot}/hypotheses.json`,
      diagnosticEvidenceRefs: ['diagnostic/causal-attribution.json'],
    },
  }) + '\n', 'PARTICIPANT_VISIBLE');
  await add('authority-snapshots/docs/example.md', 'authority snapshot\n');
  await add('skill-snapshots/skills/example/SKILL.md', 'skill snapshot\n');
  for (const round of [1, 2] as const) {
    await write(root, `round-${round}/authority-snapshots/docs/example.md`, 'authority snapshot\n');
    await add(`round-${round}/authority-snapshots/manifest.json`, JSON.stringify({ entries: [{ path: 'docs/example.md', sha256: sha256Hex('authority snapshot\n') }] }));
    await write(root, `round-${round}/skill-snapshots/skills/example/SKILL.md`, 'skill snapshot\n');
    await add(`round-${round}/skill-snapshots/manifest.json`, JSON.stringify({ entries: [{ canonicalPath: 'skills/example/SKILL.md', sha256: sha256Hex('skill snapshot\n') }] }));
  }

  await invocation('round-1/solution-agent', 'solution-invocation-000001', 'result.json', 'solution');
  await invocation('round-1/reviewer-agent', 'reviewer-invocation-000001', 'review.json', 'reviewer');
  await add('round-1/review-continuation-000001/continuation.json', '{}\n');
  await add('round-1/review-continuation-000001/revision-request.json', '{}\n');
  await invocation('round-1/review-continuation-000001/solution-revision', 'solution-invocation-000002', 'result.json', 'solution');
  await invocation('round-1/review-continuation-000001/reviewer-agent', 'reviewer-invocation-000002', 'review.json', 'reviewer');
  await invocation('configuration-execution', 'configuration-invocation-000001', 'result.json', 'configuration-execution');

  await add('round-2/source/observable-payload.json', '{"round":2}\n', 'PARTICIPANT_VISIBLE');
  await add('round-2/diagnostic/causal-attribution.json', '{"round":2}\n', 'PARTICIPANT_VISIBLE');
  await add('round-2/problem-package.json', JSON.stringify({
    source: {
      observablePayloadRef: 'source/observable-payload.json',
      diagnosticEvidenceRefs: ['diagnostic/causal-attribution.json'],
    },
  }) + '\n', 'PARTICIPANT_VISIBLE');
  await invocation('round-2/solution-agent', 'solution-invocation-000003', 'result.json', 'solution');
  await invocation('round-2/reviewer-agent', 'reviewer-invocation-000003', 'review.json', 'reviewer');

  const receipts = await buildParticipantInvocationReceiptInputs({ experimentRoot: root, evidence });
  assert.equal(receipts.length, 9);
  assert.deepEqual([...receipts.map(receipt => receipt.role)].sort(), [
    'feedback',
    'hypothesis',
    'solution',
    'reviewer',
    'solution',
    'reviewer',
    'configuration-execution',
    'solution',
    'reviewer',
  ].sort());
  for (const receipt of receipts) {
    assert.ok(receipt.promptLogicalName);
    assert.ok(receipt.bindingLogicalName);
    assert.ok(receipt.invocationLogicalName);
    assert.ok(receipt.executionTraceLogicalName);
    assert.ok(receipt.structuredResultLogicalName);
    assert.equal(receipt.failureLogicalName, null);
  }
  assert.equal(receipts.find(receipt => receipt.role === 'feedback')?.visibleEvidenceLogicalNames.some(name => name.includes('player-surface-source')), false);
  assert.equal(receipts.find(receipt => receipt.role === 'hypothesis')?.invocationRef, 'hypothesis-invocation-000001');
  assert.equal(receipts.find(receipt => receipt.role === 'solution' && receipt.round === 1)?.visibleEvidenceLogicalNames.some(name => name.includes('round-1/diagnostic/causal-attribution.json')), true);
  assert.equal(receipts.find(receipt => receipt.role === 'solution' && receipt.round === 1)?.visibleEvidenceLogicalNames.some(name => name.includes('round-2/')), false);
  assert.equal(receipts.find(receipt => receipt.role === 'solution' && receipt.round === 2)?.visibleEvidenceLogicalNames.some(name => name.includes('round-2/diagnostic/causal-attribution.json')), true);
  assert.equal(receipts.find(receipt => receipt.role === 'solution' && receipt.round === 2)?.visibleEvidenceLogicalNames.some(name => name.includes('round-1/')), false);
  assert.equal(receipts.find(receipt => receipt.role === 'solution' && receipt.round === 1)?.authorityLogicalNames.length, 1);
  assert.equal(receipts.find(receipt => receipt.role === 'solution' && receipt.round === 1)?.skillLogicalNames.length, 1);
  for (const receipt of receipts.filter(candidate => candidate.role === 'solution' || candidate.role === 'reviewer')) {
    assert.equal(receipt.authorityLogicalNames.length, 1);
    assert.equal(receipt.skillLogicalNames.length, 1);
  }

  const capsule = await publishDurableEvidenceCapsule({
    capsuleRoot: join(root, 'artifacts/evolution/run-evidence', sessionId),
    sessionId,
    sourceRunRef: sessionId,
    createdAt: '2026-09-14T00:00:00.000Z',
    repositoryIdentity: { branch: 'dev', headSha: 'a'.repeat(40) },
    workflowIdentity: { workflow: 'ordinary-auto-evolution' },
    evidence,
    participantReceipts: receipts,
  });
  const manifest = await verifyDurableEvidenceCapsule(capsule.capsuleRoot);
  assert.equal(manifest.participantReceipts.length, 9);
  assert.equal(manifest.participantReceipts.every(receipt => receipt.prompt.sha256.length === 64), true);
  const round1SolutionReceipt = manifest.participantReceipts.find(receipt => receipt.role === 'solution' && receipt.round === 1 && receipt.continuationRef === null)! as unknown as Record<string, unknown>;
  assert.ok(round1SolutionReceipt.authoritySnapshotManifest);
  assert.ok(round1SolutionReceipt.skillSnapshotManifest);
}

async function testReceiptHashIntegrity(): Promise<void> {
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
