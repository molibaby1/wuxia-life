import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildDurableEvidenceIndex, selectDurableEvidenceCapsules } from '../../scripts/evolution/evidence/durableEvidenceIndex';
import { publishDurableEvidenceCapsule } from '../../scripts/evolution/evidence/durableEvidenceCapsule';
import { verifyPackagedEvidence } from '../../scripts/evolution/evidence/verifyPackagedEvidence';

export async function runDurableEvidencePackagingTests(): Promise<void> {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'wuxia-evidence-package-'));
  const sourceRoot = join(repositoryRoot, 'source');
  await mkdir(sourceRoot, { recursive: true });
  const capsules = [];
  for (let index = 1; index <= 6; index += 1) {
    const sessionId = `ordinary-run-20260913-00000${index}`;
    const sourcePath = join(sourceRoot, `${index}.txt`);
    await writeFile(sourcePath, `${index}\n`);
    capsules.push(await publishDurableEvidenceCapsule({
      capsuleRoot: join(repositoryRoot, 'artifacts/evolution/run-evidence', sessionId),
      sessionId,
      sourceRunRef: sessionId,
      createdAt: `2026-09-13T00:00:0${index}.000Z`,
      repositoryIdentity: { branch: 'dev', headSha: 'a'.repeat(40), workingTreeClean: true },
      workflowIdentity: { workflow: 'ordinary-auto-evolution' },
      evidence: [{
        logicalName: `payload-${index}`,
        relativePath: `extensions/inputs/payload-${index}.txt`,
        sourcePath,
        visibility: 'HUMAN_FORENSIC_ONLY',
        evidenceKind: 'fixture',
        sourceRef: `source/${index}.txt`,
      }],
    }));
  }

  const built = await buildDurableEvidenceIndex({ repositoryRoot, generatedAt: '2026-09-13T01:00:00.000Z' });
  assert.equal(built.index.capsuleCount, 6);
  assert.deepEqual(built.index.capsules.slice(0, 2).map(item => item.sessionId), [
    'ordinary-run-20260913-000006',
    'ordinary-run-20260913-000005',
  ]);
  assert.deepEqual(JSON.parse(await readFile(built.indexPath, 'utf8')), built.index);

  const selected = selectDurableEvidenceCapsules({
    capsules,
    explicitSessionIds: ['ordinary-run-20260913-000001', 'ordinary-run-20260913-000006'],
  });
  assert.equal(selected.length, 6);
  assert.equal(selected.filter(item => item.reason === 'explicit').length, 1);
  assert.equal(new Set(selected.map(item => item.manifest.sessionId)).size, selected.length);
  await testPackagedMetadataExactSet();
}

async function testPackagedMetadataExactSet(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-evidence-package-metadata-'));
  const sourceRoot = join(root, 'source');
  await mkdir(sourceRoot, { recursive: true });
  const published = [];
  for (const index of [1, 2]) {
    const sessionId = `ordinary-run-20260914-00000${index}`;
    const sourcePath = join(sourceRoot, `${index}.txt`);
    await writeFile(sourcePath, `${index}\n`);
    published.push(await publishDurableEvidenceCapsule({
      capsuleRoot: join(root, 'artifacts/evolution/run-evidence', sessionId),
      sessionId,
      sourceRunRef: sessionId,
      createdAt: `2026-09-14T00:00:0${index}.000Z`,
      repositoryIdentity: { branch: 'dev', headSha: 'a'.repeat(40) },
      workflowIdentity: { workflow: 'ordinary-auto-evolution' },
      evidence: [{ logicalName: `payload-${index}`, relativePath: `objects/${index}.txt`, sourcePath, visibility: 'HUMAN_FORENSIC_ONLY', evidenceKind: 'fixture', sourceRef: `source/${index}.txt` }],
    }));
  }
  const bytes = async (path: string): Promise<number> => {
    const { readdir, stat } = await import('node:fs/promises');
    let total = 0;
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      total += entry.isDirectory() ? await bytes(child) : (await stat(child)).size;
    }
    return total;
  };
  const firstBytes = await bytes(published[0]!.capsuleRoot);
  await writeFile(join(root, 'artifacts/evolution/run-evidence/evidence-package.json'), JSON.stringify({
    schemaVersion: 'durable-evidence-package-v1',
    defaultRecentCount: 5,
    locallyKnownCapsuleCount: 2,
    includedCapsuleCount: 2,
    includedSessionIds: [
      { sessionId: published[0]!.manifest.sessionId, reason: 'recent' },
      { sessionId: 'ordinary-run-missing', reason: 'explicit' },
    ],
    includedEvidenceBytes: firstBytes,
  }));
  await assert.rejects(() => verifyPackagedEvidence(root), /ordinary-run-missing/);

  await writeFile(join(root, 'artifacts/evolution/run-evidence/evidence-package.json'), JSON.stringify({
    schemaVersion: 'durable-evidence-package-v1',
    defaultRecentCount: 5,
    locallyKnownCapsuleCount: 2,
    includedCapsuleCount: 1,
    includedSessionIds: [{ sessionId: published[0]!.manifest.sessionId, reason: 'recent' }],
    includedEvidenceBytes: firstBytes,
  }));
  await assert.rejects(() => verifyPackagedEvidence(root), /unexpected|not declared|exact.*set|000002/i);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDurableEvidencePackagingTests()
    .then(() => console.log('durableEvidencePackaging.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
