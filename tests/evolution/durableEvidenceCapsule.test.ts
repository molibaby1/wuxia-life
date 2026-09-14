import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  publishDurableEvidenceCapsule,
  verifyDurableEvidenceCapsule,
  type DurableEvidenceCapsuleInput,
} from '../../scripts/evolution/evidence/durableEvidenceCapsule';

async function fixtureInput(root: string, capsuleName = 'ordinary-run-000001'): Promise<DurableEvidenceCapsuleInput> {
  const sourceRoot = join(root, 'source');
  await mkdir(sourceRoot, { recursive: true });
  await writeFile(join(sourceRoot, 'zeta.txt'), 'zeta\n');
  await writeFile(join(sourceRoot, 'alpha.txt'), 'alpha\n');
  return {
    capsuleRoot: join(root, 'artifacts', capsuleName),
    sessionId: capsuleName,
    sourceRunRef: capsuleName,
    createdAt: '2026-09-13T00:00:00.000Z',
    repositoryIdentity: {
      branch: 'dev',
      headSha: '657155f09ca7272b758c7f562b1b0230c9f91ff0',
      workingTreeClean: true,
      workingTreeFingerprint: 'fingerprint-1',
    },
    workflowIdentity: {
      workflow: 'ordinary-auto-evolution',
      schemaVersion: 'ordinary-evolution-operator-result-v3',
    },
    evidence: [
      {
        logicalName: 'zeta',
        relativePath: 'objects/zeta.txt',
        sourcePath: join(sourceRoot, 'zeta.txt'),
        visibility: 'HUMAN_FORENSIC_ONLY',
        evidenceKind: 'fixture',
        sourceRef: 'source/zeta.txt',
      },
      {
        logicalName: 'alpha',
        relativePath: 'objects/alpha.txt',
        sourcePath: join(sourceRoot, 'alpha.txt'),
        visibility: 'PARTICIPANT_VISIBLE',
        evidenceKind: 'fixture',
        sourceRef: 'source/alpha.txt',
      },
    ],
  };
}

export async function runDurableEvidenceCapsuleTests(): Promise<void> {
  await testDeterministicManifestAndVerification();
  await testMissingAndTamperedEvidenceFailVerification();
  await testDuplicateIdentityAndMissingVisibilityFailClosed();
  await testStagingIsNotAValidFinalCapsule();
  await testFinalCapsuleIsCreateOnly();
  await testManifestRequiredFieldsFailClosed();
  await testRequiredReceiptRefsFailClosed();
  await testReceiptVisibilityMismatchFailsClosed();
}

async function testManifestRequiredFieldsFailClosed(): Promise<void> {
  for (const mutate of [
    (manifest: Record<string, unknown>) => delete (manifest.objects as Array<Record<string, unknown>>)[0]!.sourceRef,
    (manifest: Record<string, unknown>) => delete manifest.repositoryIdentity,
    (manifest: Record<string, unknown>) => delete manifest.workflowIdentity,
    (manifest: Record<string, unknown>) => delete manifest.participantReceipts,
    (manifest: Record<string, unknown>) => { manifest.repositoryIdentity = null; },
    (manifest: Record<string, unknown>) => { manifest.workflowIdentity = []; },
  ]) {
    const root = await mkdtemp(join(tmpdir(), 'wuxia-capsule-malformed-'));
    const result = await publishDurableEvidenceCapsule(await fixtureInput(root));
    const manifestPath = join(result.capsuleRoot, 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>;
    mutate(manifest);
    await writeFile(manifestPath, JSON.stringify(manifest));
    await assert.rejects(() => verifyDurableEvidenceCapsule(result.capsuleRoot), /sourceRef|repositoryIdentity|workflowIdentity|participantReceipts|object/i);
  }
}

async function testRequiredReceiptRefsFailClosed(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-capsule-receipt-null-'));
  const input = await fixtureInput(root);
  input.participantReceipts = [{
    invocationRef: 'feedback-invocation-000001',
    role: 'feedback',
    round: 1,
    continuationRef: null,
    promptLogicalName: 'alpha',
    bindingLogicalName: 'zeta',
    invocationLogicalName: 'alpha',
    rawOutputLogicalName: null,
    stderrLogicalName: null,
    executionTraceLogicalName: 'zeta',
    structuredResultLogicalName: 'alpha',
    failureLogicalName: null,
    visibleEvidenceLogicalNames: [],
    skillLogicalNames: [],
    authorityLogicalNames: [],
  }];
  const result = await publishDurableEvidenceCapsule(input);
  const manifestPath = join(result.capsuleRoot, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>;
  ((manifest.participantReceipts as Array<Record<string, unknown>>)[0]!).prompt = null;
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(() => verifyDurableEvidenceCapsule(result.capsuleRoot), /prompt.*required|prompt.*object|participantReceipts/i);
}

async function testReceiptVisibilityMismatchFailsClosed(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-capsule-receipt-visibility-'));
  const input = await fixtureInput(root);
  input.participantReceipts = [{
    invocationRef: 'feedback-invocation-000001',
    role: 'feedback',
    round: 1,
    continuationRef: null,
    promptLogicalName: 'alpha',
    bindingLogicalName: 'zeta',
    invocationLogicalName: 'alpha',
    rawOutputLogicalName: null,
    stderrLogicalName: null,
    executionTraceLogicalName: 'zeta',
    structuredResultLogicalName: 'alpha',
    failureLogicalName: null,
    visibleEvidenceLogicalNames: ['alpha'],
    skillLogicalNames: [],
    authorityLogicalNames: [],
  }];
  const result = await publishDurableEvidenceCapsule(input);
  const manifestPath = join(result.capsuleRoot, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>;
  const alpha = (manifest.objects as Array<Record<string, unknown>>).find(object => object.logicalName === 'alpha');
  assert.ok(alpha);
  alpha.visibility = 'HUMAN_FORENSIC_ONLY';
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(() => verifyDurableEvidenceCapsule(result.capsuleRoot), /visibility|PARTICIPANT_VISIBLE/i);
}

async function testDeterministicManifestAndVerification(): Promise<void> {
  const firstRoot = await mkdtemp(join(tmpdir(), 'wuxia-capsule-first-'));
  const secondRoot = await mkdtemp(join(tmpdir(), 'wuxia-capsule-second-'));
  const first = await publishDurableEvidenceCapsule(await fixtureInput(firstRoot));
  const second = await publishDurableEvidenceCapsule(await fixtureInput(secondRoot));

  assert.deepEqual(first.manifest, second.manifest);
  assert.equal(first.manifest.objects[0]?.logicalName, 'alpha');
  assert.equal(first.manifest.objects[1]?.logicalName, 'zeta');
  assert.equal(first.manifest.objects[0]?.visibility, 'PARTICIPANT_VISIBLE');
  assert.equal(first.manifest.objects[1]?.visibility, 'HUMAN_FORENSIC_ONLY');
  assert.equal(first.manifest.analysisCoreStatus, 'complete');
  assert.equal(first.manifest.importantEvents.configurationExecution, false);
  assert.equal(first.manifest.extensions.configurationExecution.status, 'not_applicable');
  assert.equal(first.manifest.objects[0]?.byteLength, Buffer.byteLength('alpha\n'));
  assert.equal(first.manifest.objects[1]?.byteLength, Buffer.byteLength('zeta\n'));
  assert.deepEqual(await verifyDurableEvidenceCapsule(first.capsuleRoot), first.manifest);
  assert.equal(await readFile(join(first.capsuleRoot, 'objects', 'alpha.txt'), 'utf8'), 'alpha\n');
}

async function testMissingAndTamperedEvidenceFailVerification(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-capsule-integrity-'));
  const result = await publishDurableEvidenceCapsule(await fixtureInput(root));
  await writeFile(join(result.capsuleRoot, 'objects', 'alpha.txt'), 'tampered\n');
  await assert.rejects(
    () => verifyDurableEvidenceCapsule(result.capsuleRoot),
    /sha256|hash|byte length/i,
  );

  const missingRoot = await mkdtemp(join(tmpdir(), 'wuxia-capsule-missing-'));
  const missing = await publishDurableEvidenceCapsule(await fixtureInput(missingRoot));
  await rm(join(missing.capsuleRoot, 'objects', 'zeta.txt'));
  await assert.rejects(
    () => verifyDurableEvidenceCapsule(missing.capsuleRoot),
    /missing|not found|declared/i,
  );
}

async function testDuplicateIdentityAndMissingVisibilityFailClosed(): Promise<void> {
  const duplicateRoot = await mkdtemp(join(tmpdir(), 'wuxia-capsule-duplicate-'));
  const duplicateInput = await fixtureInput(duplicateRoot);
  duplicateInput.evidence[1] = {
    ...duplicateInput.evidence[1]!,
    logicalName: duplicateInput.evidence[0]!.logicalName,
  };
  await assert.rejects(
    () => publishDurableEvidenceCapsule(duplicateInput),
    /duplicate.*logical|logical.*duplicate/i,
  );

  const visibilityRoot = await mkdtemp(join(tmpdir(), 'wuxia-capsule-visibility-'));
  const visibilityInput = await fixtureInput(visibilityRoot);
  (visibilityInput.evidence[0] as Record<string, unknown>).visibility = undefined;
  await assert.rejects(
    () => publishDurableEvidenceCapsule(visibilityInput),
    /visibility/i,
  );
}

async function testStagingIsNotAValidFinalCapsule(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-capsule-staging-'));
  const input = await fixtureInput(root);
  const stagingRoot = join(root, 'artifacts', '.staging-ordinary-run-000001-partial');
  await mkdir(join(stagingRoot, 'objects'), { recursive: true });
  await writeFile(join(stagingRoot, 'objects', 'alpha.txt'), 'alpha\n');
  await assert.rejects(
    () => verifyDurableEvidenceCapsule(stagingRoot),
    /manifest|capsule/i,
  );
  const result = await publishDurableEvidenceCapsule(input);
  assert.equal(result.capsuleRoot.endsWith('/ordinary-run-000001'), true);
  const entries = await readdir(join(root, 'artifacts'));
  assert.ok(entries.includes('ordinary-run-000001'));
}

async function testFinalCapsuleIsCreateOnly(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-capsule-create-only-'));
  const input = await fixtureInput(root);
  await publishDurableEvidenceCapsule(input);
  await writeFile(join(root, 'source', 'alpha.txt'), 'replacement\n');
  const replay = await publishDurableEvidenceCapsule(input);
  assert.equal(replay.reused, true);
  assert.equal(await readFile(join(input.capsuleRoot, 'objects', 'alpha.txt'), 'utf8'), 'alpha\n');
  await writeFile(join(input.capsuleRoot, 'manifest.json'), '{}\n');
  await assert.rejects(
    () => publishDurableEvidenceCapsule(input),
    /existing.*invalid|integrity|hash|manifest/i,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDurableEvidenceCapsuleTests()
    .then(() => console.log('durableEvidenceCapsule.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
