import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { publishDurableEvidenceCapsule } from '../../scripts/evolution/evidence/durableEvidenceCapsule';

const execFile = promisify(execFileCallback);

async function exists(path: string): Promise<boolean> {
  try { await lstat(path); return true; } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }
}

export async function runPackageProjectCapsuleTests(): Promise<void> {
  const repositoryRoot = process.cwd();
  const evidenceRoot = join(repositoryRoot, 'artifacts/evolution/run-evidence');
  const indexPath = join(evidenceRoot, 'index.json');
  const metadataPath = join(evidenceRoot, 'evidence-package.json');
  const priorIndex = await exists(indexPath) ? await readFile(indexPath) : null;
  const priorMetadata = await exists(metadataPath) ? await readFile(metadataPath) : null;
  const sourceRoot = await mkdtemp('/tmp/wuxia-package-capsule-source-');
  const createdSessionIds: string[] = [];
  try {
    await mkdir(evidenceRoot, { recursive: true });
    for (let index = 1; index <= 6; index += 1) {
      const sessionId = `ordinary-run-20990101-00000${index}`;
      createdSessionIds.push(sessionId);
      const sourcePath = join(sourceRoot, `${index}.txt`);
      await writeFile(sourcePath, `${index}\n`);
      await publishDurableEvidenceCapsule({
        capsuleRoot: join(evidenceRoot, sessionId),
        sessionId,
        sourceRunRef: sessionId,
        createdAt: `2099-01-01T00:00:0${index}.000Z`,
        repositoryIdentity: { branch: 'dev', headSha: 'a'.repeat(40), workingTreeClean: true },
        workflowIdentity: { workflow: 'ordinary-auto-evolution' },
        evidence: [{ logicalName: `payload-${index}`, relativePath: `extensions/inputs/payload-${index}.txt`, sourcePath, visibility: 'HUMAN_FORENSIC_ONLY', evidenceKind: 'fixture', sourceRef: `source/${index}.txt` }],
      });
    }

    const runPackage = async (...args: string[]) => execFile('bash', ['package-project.sh', ...args], { cwd: repositoryRoot, maxBuffer: 2 ** 20 });
    const listing = async () => (await execFile('unzip', ['-Z1', 'project.zip'], { cwd: repositoryRoot })).stdout.split('\n').filter(Boolean);
    await runPackage();
    let entries = await listing();
    assert.ok(entries.some(entry => entry.endsWith('ordinary-run-20990101-000006/extensions/inputs/payload-6.txt')));
    assert.equal(entries.some(entry => entry.includes('ordinary-run-20990101-000001/')), false);
    assert.ok(entries.some(entry => entry.endsWith('evidence-package.json')));
    const recentMetadata = JSON.parse((await execFile('unzip', ['-p', 'project.zip', 'artifacts/evolution/run-evidence/evidence-package.json'], { cwd: repositoryRoot })).stdout) as { includedCapsuleCount: number; includedSessionIds: Array<{ sessionId: string; reason: string }> };
    assert.equal(recentMetadata.includedCapsuleCount, 5);
    assert.equal(recentMetadata.includedSessionIds.filter(item => item.reason === 'recent').length, 5);

    await runPackage('--include-capsule', 'ordinary-run-20990101-000001');
    entries = await listing();
    assert.ok(entries.some(entry => entry.includes('ordinary-run-20990101-000001/extensions/inputs/payload-1.txt')));
    const explicitMetadata = JSON.parse((await execFile('unzip', ['-p', 'project.zip', 'artifacts/evolution/run-evidence/evidence-package.json'], { cwd: repositoryRoot })).stdout) as { includedCapsuleCount: number; includedSessionIds: Array<{ sessionId: string; reason: string }> };
    assert.equal(explicitMetadata.includedCapsuleCount, 6);
    assert.equal(new Set(explicitMetadata.includedSessionIds.map(item => item.sessionId)).size, 6);
  } finally {
    for (const sessionId of createdSessionIds) await rm(join(evidenceRoot, sessionId), { recursive: true, force: true });
    await rm(sourceRoot, { recursive: true, force: true });
    if (priorIndex === null) await rm(indexPath, { force: true }); else await writeFile(indexPath, priorIndex);
    if (priorMetadata === null) await rm(metadataPath, { force: true }); else await writeFile(metadataPath, priorMetadata);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPackageProjectCapsuleTests()
    .then(() => console.log('packageProjectCapsule.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
