import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  captureConfigurationAfterEvidence,
  captureConfigurationBeforeEvidence,
} from '../../scripts/evolution/evidence/configurationEvidence';
import { publishDurableEvidenceCapsule, verifyDurableEvidenceCapsule } from '../../scripts/evolution/evidence/durableEvidenceCapsule';

export async function runConfigurationEvidenceTests(): Promise<void> {
  await testBeforeAndAfterCaptureIsTemporal();
  await testNoOpAndUnauthorizedPathAreRepresented();
}

async function testBeforeAndAfterCaptureIsTemporal(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-config-evidence-'));
  const workspaceRoot = join(root, 'workspace');
  const destinationRoot = join(root, 'execution');
  await mkdir(workspaceRoot, { recursive: true });
  const file = join(workspaceRoot, 'src/data/example.json');
  await mkdir(join(workspaceRoot, 'src/data'), { recursive: true });
  await writeFile(file, 'A');

  await captureConfigurationBeforeEvidence({
    workspaceRoot,
    destinationRoot,
    allowedWritePaths: ['src/data/example.json'],
  });
  await writeFile(file, 'B');
  await captureConfigurationAfterEvidence({
    workspaceRoot,
    destinationRoot,
    actualChangedFiles: ['src/data/example.json'],
  });

  assert.equal(await readFile(join(destinationRoot, 'before', 'src/data/example.json'), 'utf8'), 'A');
  assert.equal(await readFile(join(destinationRoot, 'after', 'src/data/example.json'), 'utf8'), 'B');
  assert.equal(await readFile(file, 'utf8'), 'B');
  assert.equal(JSON.parse(await readFile(join(destinationRoot, 'before-manifest.json'), 'utf8')).entries[0].sha256.length, 64);
  assert.equal(JSON.parse(await readFile(join(destinationRoot, 'after-manifest.json'), 'utf8')).entries[0].byteLength, 1);

  const capsule = await publishDurableEvidenceCapsule({
    capsuleRoot: join(root, 'artifacts/evolution/run-evidence/config-temporal-000001'),
    sessionId: 'config-temporal-000001',
    sourceRunRef: 'config-temporal-000001',
    createdAt: '2026-09-13T00:00:00.000Z',
    repositoryIdentity: { branch: 'dev', headSha: 'a'.repeat(40), workingTreeClean: true },
    workflowIdentity: { workflow: 'ordinary-auto-evolution' },
    evidence: [
      { logicalName: 'configuration-before', relativePath: 'extensions/configuration-execution/before/src/data/example.json', sourcePath: join(destinationRoot, 'before/src/data/example.json'), visibility: 'HUMAN_FORENSIC_ONLY', evidenceKind: 'configuration_before', sourceRef: 'configuration-execution/before/src/data/example.json' },
      { logicalName: 'configuration-after', relativePath: 'extensions/configuration-execution/after/src/data/example.json', sourcePath: join(destinationRoot, 'after/src/data/example.json'), visibility: 'HUMAN_FORENSIC_ONLY', evidenceKind: 'configuration_after', sourceRef: 'configuration-execution/after/src/data/example.json' },
      { logicalName: 'configuration-before-manifest', relativePath: 'extensions/configuration-execution/before-manifest.json', sourcePath: join(destinationRoot, 'before-manifest.json'), visibility: 'HUMAN_FORENSIC_ONLY', evidenceKind: 'configuration_execution', sourceRef: 'configuration-execution/before-manifest.json' },
      { logicalName: 'configuration-after-manifest', relativePath: 'extensions/configuration-execution/after-manifest.json', sourcePath: join(destinationRoot, 'after-manifest.json'), visibility: 'HUMAN_FORENSIC_ONLY', evidenceKind: 'configuration_execution', sourceRef: 'configuration-execution/after-manifest.json' },
    ],
    importantEvents: { participantFailure: false, reviewContinuation: false, configurationExecution: true, crossRoundTransition: false },
    extensions: { configurationExecution: { status: 'present', refs: ['extensions/configuration-execution'] }, crossRoundTransition: { status: 'not_applicable', refs: [] } },
  });
  await verifyDurableEvidenceCapsule(capsule.capsuleRoot);
  assert.equal(await readFile(join(capsule.capsuleRoot, 'extensions/configuration-execution/before/src/data/example.json'), 'utf8'), 'A');
  assert.equal(await readFile(join(capsule.capsuleRoot, 'extensions/configuration-execution/after/src/data/example.json'), 'utf8'), 'B');
}

async function testNoOpAndUnauthorizedPathAreRepresented(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-config-evidence-boundary-'));
  const workspaceRoot = join(root, 'workspace');
  const destinationRoot = join(root, 'execution');
  await mkdir(join(workspaceRoot, 'src/data'), { recursive: true });
  await mkdir(join(workspaceRoot, 'docs'), { recursive: true });
  await writeFile(join(workspaceRoot, 'src/data/example.json'), 'same');
  await writeFile(join(workspaceRoot, 'docs/unauthorized.md'), 'changed');

  await captureConfigurationBeforeEvidence({
    workspaceRoot,
    destinationRoot,
    allowedWritePaths: ['src/data/example.json'],
  });
  await captureConfigurationAfterEvidence({
    workspaceRoot,
    destinationRoot,
    actualChangedFiles: ['docs/unauthorized.md'],
  });
  const after = JSON.parse(await readFile(join(destinationRoot, 'after-manifest.json'), 'utf8')) as {
    entries: Array<{ path: string; status: string }>;
  };
  assert.deepEqual(after.entries.map(entry => [entry.path, entry.status]), [['docs/unauthorized.md', 'present']]);
  assert.equal((await stat(join(destinationRoot, 'after/docs/unauthorized.md'))).isFile(), true);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runConfigurationEvidenceTests()
    .then(() => console.log('configurationEvidence.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
