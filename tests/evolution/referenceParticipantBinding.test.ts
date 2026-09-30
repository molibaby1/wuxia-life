import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  captureReferenceParticipantBindingLock,
  referenceParticipantBindingLockSha256,
  resolveReferenceParticipantBindingFromLock,
} from '../../scripts/evolution/operator/referenceParticipantBinding';
import { resolveOperatorParticipantBinding } from '../../scripts/evolution/operator/resolveParticipantBinding';
import { buildParticipantBindingReceipt } from '../../scripts/evolution/participantObservability';
import { sha256Hex } from '../../scripts/evolution/phase0/provenance';

const SCHEMA_REF = 'scripts/evolution/operator/codexJsonObjectEnvelope.schema.json';
const SCHEMA = '{\n  "type": "object"\n}\n';

async function createCodexFixture(root: string, version: string): Promise<{
  binRoot: string;
  symlinkPath: string;
  targetPath: string;
}> {
  const binRoot = join(root, 'bin');
  const realRoot = join(root, 'real');
  const symlinkPath = join(binRoot, 'codex');
  const targetPath = join(realRoot, 'codex');
  await mkdir(binRoot, { recursive: true });
  await mkdir(realRoot, { recursive: true });
  await writeFile(targetPath, `#!/bin/sh\nprintf '%s\\n' ${JSON.stringify(version)}\n`);
  await chmod(targetPath, 0o755);
  await symlink(targetPath, symlinkPath);
  return { binRoot, symlinkPath, targetPath };
}

export async function runReferenceParticipantBindingTests(): Promise<void> {
  const originalPath = process.env.PATH;
  const root = await mkdtemp(join(tmpdir(), 'reference-participant-binding-'));
  try {
    const repositoryRoot = join(root, 'repository');
    const configPath = join(root, 'config.toml');
    await mkdir(join(repositoryRoot, 'scripts/evolution/operator'), { recursive: true });
    await writeFile(join(repositoryRoot, SCHEMA_REF), SCHEMA);
    await writeFile(configPath, 'model = "ambient-secret-is-not-copied"\n');
    const executable = await createCodexFixture(root, 'codex 1.2.3');
    process.env.PATH = `${executable.binRoot}:/usr/bin:/bin`;

    const lock = await captureReferenceParticipantBindingLock({
      repositoryRoot,
      bindingId: 'CODEX_CURRENT',
      model: 'gpt-6-luna',
      reasoningEffort: 'max',
      ambientCodexConfigPath: configPath,
    });

    assert.equal(lock.schemaVersion, 'reference-participant-binding-lock-v1');
    assert.equal(lock.bindingId, 'CODEX_CURRENT');
    assert.equal(lock.provider, 'codex-local-subagent');
    assert.equal(lock.executableRealPath, await realpath(executable.targetPath));
    assert.notEqual(lock.executableRealPath, executable.symlinkPath);
    assert.equal(lock.executableVersion, 'codex 1.2.3');
    assert.equal(lock.modelConfigured, 'gpt-6-luna');
    assert.equal(lock.reasoningEffort, 'max');
    assert.equal(lock.ambientCodexConfigPath, configPath);
    assert.equal(lock.ambientCodexConfigSha256, sha256Hex(await readFile(configPath)));
    assert.deepEqual(lock.nativeEnvelopeAssistance, {
      enabled: true,
      schemaRef: SCHEMA_REF,
      schemaSha256: sha256Hex(SCHEMA),
    });
    assert.equal(
      referenceParticipantBindingLockSha256(lock),
      referenceParticipantBindingLockSha256({
        ...Object.fromEntries(Object.entries(lock).reverse()),
        nativeEnvelopeAssistance: {
          schemaSha256: lock.nativeEnvelopeAssistance.schemaSha256,
          schemaRef: lock.nativeEnvelopeAssistance.schemaRef,
          enabled: true,
        },
      } as typeof lock),
    );

    const resolved = await resolveReferenceParticipantBindingFromLock({ repositoryRoot, lock });
    assert.equal(resolved.executable, await realpath(executable.targetPath));
    assert.equal(resolved.executableVersion, 'codex 1.2.3');
    assert.equal(resolved.participant.model, 'gpt-6-luna');
    assert.equal(resolved.participant.reasoningEffort, 'max');
    assert.equal(resolved.participant.bindingMetadata?.ambientCodexConfigSha256, lock.ambientCodexConfigSha256);
    assert.equal(resolved.participant.bindingMetadata?.nativeEnvelopeSchemaSha256, lock.nativeEnvelopeAssistance.schemaSha256);
    const receipt = buildParticipantBindingReceipt(resolved.participant);
    assert.equal(receipt.modelConfigured, 'gpt-6-luna');
    assert.equal(receipt.modelResolution, 'EXPLICIT');
    assert.equal(receipt.reasoningEffort, 'max');
    assert.equal(receipt.ambientCodexConfigSha256, lock.ambientCodexConfigSha256);
    assert.equal(receipt.nativeEnvelopeSchemaSha256, lock.nativeEnvelopeAssistance.schemaSha256);

    const alternate = await createCodexFixture(join(root, 'alternate'), 'codex 1.2.3');
    await unlink(executable.symlinkPath);
    await symlink(alternate.targetPath, executable.symlinkPath);
    await assert.rejects(
      resolveReferenceParticipantBindingFromLock({ repositoryRoot, lock }),
      /executable real path drift/,
    );
    await unlink(executable.symlinkPath);
    await symlink(executable.targetPath, executable.symlinkPath);

    await writeFile(configPath, 'model = "changed"\n');
    await assert.rejects(
      resolveReferenceParticipantBindingFromLock({ repositoryRoot, lock }),
      /ambient Codex config drift/,
    );
    await writeFile(configPath, 'model = "ambient-secret-is-not-copied"\n');

    await writeFile(executable.targetPath, '#!/bin/sh\nprintf "%s\\n" "codex 1.2.4"\n');
    await chmod(executable.targetPath, 0o755);
    await assert.rejects(
      resolveReferenceParticipantBindingFromLock({ repositoryRoot, lock }),
      /executable version drift/,
    );
    await writeFile(executable.targetPath, `#!/bin/sh\nprintf '%s\\n' ${JSON.stringify('codex 1.2.3')}\n`);
    await chmod(executable.targetPath, 0o755);

    await writeFile(join(repositoryRoot, SCHEMA_REF), '{\n "type": "object"\n}\n');
    await assert.rejects(
      resolveReferenceParticipantBindingFromLock({ repositoryRoot, lock }),
      /native envelope schema drift/,
    );
    await writeFile(join(repositoryRoot, SCHEMA_REF), SCHEMA);

    await rm(configPath);
    await assert.rejects(
      resolveReferenceParticipantBindingFromLock({ repositoryRoot, lock }),
      /ambient Codex config drift/,
    );

    const absentConfigPath = join(root, 'absent-config.toml');
    const absentLock = await captureReferenceParticipantBindingLock({
      repositoryRoot,
      bindingId: 'CODEX_CURRENT',
      model: 'gpt-6-luna',
      reasoningEffort: 'max',
      ambientCodexConfigPath: absentConfigPath,
    });
    assert.equal(absentLock.ambientCodexConfigSha256, 'ABSENT');
    await resolveReferenceParticipantBindingFromLock({ repositoryRoot, lock: absentLock });
    await writeFile(absentConfigPath, 'new config\n');
    await assert.rejects(
      resolveReferenceParticipantBindingFromLock({ repositoryRoot, lock: absentLock }),
      /ambient Codex config drift/,
    );

    const ordinary = await resolveOperatorParticipantBinding();
    assert.equal(ordinary.participant.model, undefined);
    assert.equal(ordinary.participant.reasoningEffort, undefined);
    assert.deepEqual(ordinary.participant.bindingMetadata, {
      bindingId: 'CODEX_CURRENT',
      executableVersion: 'codex 1.2.3',
    });
    const ordinaryReceipt = buildParticipantBindingReceipt(ordinary.participant);
    assert.equal(Object.hasOwn(ordinaryReceipt, 'ambientCodexConfigSha256'), false);
    assert.equal(Object.hasOwn(ordinaryReceipt, 'nativeEnvelopeSchemaSha256'), false);
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
    await rm(root, { recursive: true, force: true });
  }

  await assert.rejects(
    captureReferenceParticipantBindingLock({
      repositoryRoot: root,
      bindingId: 'CODEX_CURRENT',
      model: '',
      reasoningEffort: 'max',
      ambientCodexConfigPath: join(root, 'config.toml'),
    }),
    /model must be non-empty/,
  );
  await assert.rejects(
    captureReferenceParticipantBindingLock({
      repositoryRoot: root,
      bindingId: 'CODEX_CURRENT',
      model: 'gpt-6-luna',
      reasoningEffort: '  ',
      ambientCodexConfigPath: join(root, 'config.toml'),
    }),
    /reasoning effort must be non-empty/,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runReferenceParticipantBindingTests()
    .then(() => console.log('referenceParticipantBinding.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
