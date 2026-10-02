import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, realpath, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  artifactBackedReferenceParticipantBindingLockSha256,
  captureArtifactBackedReferenceParticipantBindingLock,
  captureReferenceParticipantBindingLock,
  referenceParticipantBindingLockSha256,
  resolveArtifactBackedReferenceParticipantBindingFromLock,
  resolveReferenceParticipantBindingFromLock,
} from '../../scripts/evolution/operator/referenceParticipantBinding';
import { resolveOperatorParticipantBinding } from '../../scripts/evolution/operator/resolveParticipantBinding';
import { buildParticipantBindingReceipt } from '../../scripts/evolution/participantObservability';
import { sha256Hex } from '../../scripts/evolution/phase0/provenance';

const SCHEMA_REF = 'scripts/evolution/operator/codexJsonObjectEnvelope.schema.json';
const ARTIFACT_RECEIPT_SCHEMA_REF = 'scripts/evolution/operator/codexArtifactBackedReceipt.schema.json';
const ARTIFACT_RESULT_PATH = '.evolution-participant/final-result.json';
const JSON_VALUE_SCHEMA = {
  anyOf: [
    { type: 'string' },
    { type: 'number' },
    { type: 'boolean' },
    { type: 'null' },
    { type: 'array', items: { $ref: '#/$defs/jsonValue' } },
    {
      type: 'object',
      properties: {},
      patternProperties: { '.*': { $ref: '#/$defs/jsonValue' } },
      required: [],
      additionalProperties: false,
    },
  ],
};
const SCHEMA_OBJECT = {
  $defs: { jsonValue: JSON_VALUE_SCHEMA },
  type: 'object',
  properties: {},
  patternProperties: { '.*': { $ref: '#/$defs/jsonValue' } },
  required: [],
  additionalProperties: false,
};
const SCHEMA = `${JSON.stringify(SCHEMA_OBJECT, null, 2)}\n`;

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
    const repositorySchema = JSON.parse(await readFile(join(process.cwd(), SCHEMA_REF), 'utf8')) as unknown;
    assert.deepEqual(repositorySchema, SCHEMA_OBJECT);
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
    const solutionJob = {
      invocationRef: 'reference-solution-000001',
      role: 'solution' as const,
      workspaceRoot: repositoryRoot,
      prompt: 'Return a JSON object.',
    };
    const initialArgs = resolved.participant.buildArgs(solutionJob);
    assert.ok(initialArgs.includes('--json'));
    assert.ok(initialArgs.includes('-m'));
    assert.equal(initialArgs[initialArgs.indexOf('-m') + 1], lock.modelConfigured);
    assert.ok(initialArgs.includes('-c'));
    assert.ok(initialArgs.includes(`model_reasoning_effort=${JSON.stringify(lock.reasoningEffort)}`));
    assert.ok(initialArgs.includes('--output-schema'));
    assert.equal(initialArgs[initialArgs.indexOf('--output-schema') + 1], join(repositoryRoot, SCHEMA_REF));
    const resumeArgs = resolved.participant.sameThreadContinuation?.buildArgs(
      solutionJob,
      { provider: 'codex-exec', opaqueId: '01234567-89ab-cdef-0123-456789abcdef' },
    );
    assert.ok(resumeArgs?.includes('resume'));
    assert.ok(resumeArgs?.includes('--json'));
    assert.ok(resumeArgs?.includes('-m'));
    assert.equal(resumeArgs?.[resumeArgs.indexOf('-m') + 1], lock.modelConfigured);
    assert.ok(resumeArgs?.includes(`model_reasoning_effort=${JSON.stringify(lock.reasoningEffort)}`));
    assert.ok(resumeArgs?.includes('--output-schema'));
    assert.equal(resumeArgs?.[resumeArgs.indexOf('--output-schema') + 1], join(repositoryRoot, SCHEMA_REF));
    const reviewerArgs = resolved.participant.buildArgs({ ...solutionJob, role: 'reviewer' });
    assert.equal(reviewerArgs.includes('--output-schema'), false);
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

    await writeFile(join(repositoryRoot, SCHEMA_REF), `${SCHEMA}\n`);
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

    await writeFile(configPath, 'model = "ambient-secret-is-not-copied"\n');
    const artifactSchemaPath = join(repositoryRoot, ARTIFACT_RECEIPT_SCHEMA_REF);
    const artifactSchemaBytes = await readFile(join(process.cwd(), ARTIFACT_RECEIPT_SCHEMA_REF));
    await writeFile(artifactSchemaPath, artifactSchemaBytes);
    const artifactSchema = JSON.parse(artifactSchemaBytes.toString('utf8')) as {
      type?: unknown;
      properties?: Record<string, Record<string, unknown>>;
      required?: unknown;
      additionalProperties?: unknown;
    };
    assert.equal(artifactSchema.type, 'object');
    assert.deepEqual(Object.keys(artifactSchema.properties ?? {}).sort(), ['bytes', 'schemaVersion', 'sha256']);
    assert.deepEqual(artifactSchema.required, ['schemaVersion', 'bytes', 'sha256']);
    assert.equal(artifactSchema.additionalProperties, false);
    assert.deepEqual(artifactSchema.properties?.schemaVersion, {
      type: 'string',
      enum: ['artifact-backed-structured-final-result-receipt-v1'],
    });
    assert.deepEqual(artifactSchema.properties?.bytes?.type, 'integer');
    assert.deepEqual(artifactSchema.properties?.sha256, {
      type: 'string',
      pattern: '^[0-9a-f]{64}$',
    });
    assert.doesNotMatch(artifactSchemaBytes.toString('utf8'), /SolutionWorkV1|AutonomousAuthoring|Card/);

    const artifactLock = await captureArtifactBackedReferenceParticipantBindingLock({
      repositoryRoot,
      bindingId: 'CODEX_CURRENT',
      model: 'gpt-6-luna',
      reasoningEffort: 'max',
      ambientCodexConfigPath: configPath,
    });
    assert.equal(artifactLock.schemaVersion, 'reference-participant-binding-lock-v2');
    assert.equal(artifactLock.bindingId, 'CODEX_CURRENT');
    assert.equal(artifactLock.provider, 'codex-local-subagent');
    assert.equal(artifactLock.executableRealPath, await realpath(executable.targetPath));
    assert.equal(artifactLock.executableVersion, 'codex 1.2.3');
    assert.equal(artifactLock.modelConfigured, 'gpt-6-luna');
    assert.equal(artifactLock.reasoningEffort, 'max');
    assert.equal(artifactLock.ambientCodexConfigPath, configPath);
    assert.equal(artifactLock.ambientCodexConfigSha256, sha256Hex(await readFile(configPath)));
    assert.deepEqual(artifactLock.structuredResultDelivery, {
      kind: 'WORKSPACE_ARTIFACT_RECEIPT_V1',
      resultRelativePath: ARTIFACT_RESULT_PATH,
      receiptSchemaRef: ARTIFACT_RECEIPT_SCHEMA_REF,
      receiptSchemaSha256: sha256Hex(artifactSchemaBytes),
    });
    assert.equal(
      artifactBackedReferenceParticipantBindingLockSha256(artifactLock),
      artifactBackedReferenceParticipantBindingLockSha256({
        ...Object.fromEntries(Object.entries(artifactLock).reverse()),
        structuredResultDelivery: {
          receiptSchemaSha256: artifactLock.structuredResultDelivery.receiptSchemaSha256,
          receiptSchemaRef: artifactLock.structuredResultDelivery.receiptSchemaRef,
          resultRelativePath: artifactLock.structuredResultDelivery.resultRelativePath,
          kind: artifactLock.structuredResultDelivery.kind,
        },
      } as typeof artifactLock),
    );

    const artifactResolved = await resolveArtifactBackedReferenceParticipantBindingFromLock({
      repositoryRoot,
      lock: artifactLock,
    });
    assert.equal(artifactResolved.executable, await realpath(executable.targetPath));
    assert.equal(artifactResolved.participant.model, 'gpt-6-luna');
    assert.equal(artifactResolved.participant.reasoningEffort, 'max');
    assert.equal(artifactResolved.participant.bindingMetadata?.ambientCodexConfigSha256, artifactLock.ambientCodexConfigSha256);
    assert.equal(artifactResolved.participant.bindingMetadata?.structuredResultDeliveryMode, 'WORKSPACE_ARTIFACT_RECEIPT_V1');
    assert.equal(artifactResolved.participant.bindingMetadata?.nativeReceiptSchemaSha256, artifactLock.structuredResultDelivery.receiptSchemaSha256);
    const artifactReceipt = buildParticipantBindingReceipt(artifactResolved.participant);
    assert.equal(artifactReceipt.structuredResultDeliveryMode, 'WORKSPACE_ARTIFACT_RECEIPT_V1');
    assert.equal(artifactReceipt.nativeReceiptSchemaSha256, artifactLock.structuredResultDelivery.receiptSchemaSha256);
    assert.equal(Object.hasOwn(artifactReceipt, 'nativeEnvelopeSchemaSha256'), false);
    const artifactSolutionArgs = artifactResolved.participant.buildArgs(solutionJob);
    assert.ok(artifactSolutionArgs.includes('--output-schema'));
    assert.equal(artifactSolutionArgs[artifactSolutionArgs.indexOf('--output-schema') + 1], artifactSchemaPath);
    const artifactReviewerArgs = artifactResolved.participant.buildArgs({ ...solutionJob, role: 'reviewer' });
    assert.equal(artifactReviewerArgs.includes('--output-schema'), false);
    assert.equal(Object.hasOwn(artifactResolved.participant, 'sameThreadContinuation'), false);

    for (const sha256Schema of [
      { type: 'string' },
      { type: 'string', pattern: '^[A-Fa-f0-9]{64}$' },
    ]) {
      const invalidSha256SchemaBytes = Buffer.from(JSON.stringify({
        ...artifactSchema,
        properties: {
          ...artifactSchema.properties,
          sha256: sha256Schema,
        },
      }));
      await writeFile(artifactSchemaPath, invalidSha256SchemaBytes);
      await assert.rejects(
        captureArtifactBackedReferenceParticipantBindingLock({
          repositoryRoot,
          bindingId: 'CODEX_CURRENT',
          model: 'gpt-6-luna',
          reasoningEffort: 'max',
          ambientCodexConfigPath: configPath,
        }),
        /receipt schema must contain only the transport receipt fields/,
      );
      await assert.rejects(
        resolveArtifactBackedReferenceParticipantBindingFromLock({ repositoryRoot, lock: artifactLock }),
        /receipt schema must contain only the transport receipt fields/,
      );
    }
    await writeFile(artifactSchemaPath, artifactSchemaBytes);

    const unconstrainedArtifactSchemaBytes = Buffer.from(JSON.stringify({
      ...artifactSchema,
      properties: {
        ...artifactSchema.properties,
        schemaVersion: { type: 'string' },
      },
    }));
    await writeFile(artifactSchemaPath, unconstrainedArtifactSchemaBytes);
    await assert.rejects(
      captureArtifactBackedReferenceParticipantBindingLock({
        repositoryRoot,
        bindingId: 'CODEX_CURRENT',
        model: 'gpt-6-luna',
        reasoningEffort: 'max',
        ambientCodexConfigPath: configPath,
      }),
      /receipt schema must contain only the transport receipt fields/,
    );
    await assert.rejects(
      resolveArtifactBackedReferenceParticipantBindingFromLock({ repositoryRoot, lock: artifactLock }),
      /receipt schema must contain only the transport receipt fields/,
    );
    await writeFile(artifactSchemaPath, artifactSchemaBytes);

    await writeFile(configPath, 'model = "changed"\n');
    await assert.rejects(
      resolveArtifactBackedReferenceParticipantBindingFromLock({ repositoryRoot, lock: artifactLock }),
      /ambient Codex config drift/,
    );
    await writeFile(configPath, 'model = "ambient-secret-is-not-copied"\n');

    await writeFile(artifactSchemaPath, `${artifactSchemaBytes.toString('utf8')}\n`);
    await assert.rejects(
      resolveArtifactBackedReferenceParticipantBindingFromLock({ repositoryRoot, lock: artifactLock }),
      /receipt schema drift/,
    );
    await writeFile(artifactSchemaPath, artifactSchemaBytes);

    const alternateArtifactExecutable = await createCodexFixture(join(root, 'alternate-artifact'), 'codex 1.2.3');
    await unlink(executable.symlinkPath);
    await symlink(alternateArtifactExecutable.targetPath, executable.symlinkPath);
    await assert.rejects(
      resolveArtifactBackedReferenceParticipantBindingFromLock({ repositoryRoot, lock: artifactLock }),
      /executable real path drift/,
    );
    await unlink(executable.symlinkPath);
    await symlink(executable.targetPath, executable.symlinkPath);

    await writeFile(executable.targetPath, '#!/bin/sh\nprintf "%s\\n" "codex 1.2.4"\n');
    await chmod(executable.targetPath, 0o755);
    await assert.rejects(
      resolveArtifactBackedReferenceParticipantBindingFromLock({ repositoryRoot, lock: artifactLock }),
      /executable version drift/,
    );
    await writeFile(executable.targetPath, `#!/bin/sh\nprintf '%s\\n' ${JSON.stringify('codex 1.2.3')}\n`);
    await chmod(executable.targetPath, 0o755);

    await assert.rejects(
      resolveArtifactBackedReferenceParticipantBindingFromLock({
        repositoryRoot,
        lock: {
          ...artifactLock,
          structuredResultDelivery: {
            ...artifactLock.structuredResultDelivery,
            resultRelativePath: 'other.json',
          },
        },
      }),
      /invalid reference Participant binding lock/,
    );
    await assert.rejects(
      resolveArtifactBackedReferenceParticipantBindingFromLock({
        repositoryRoot,
        lock: {
          ...artifactLock,
          structuredResultDelivery: {
            ...artifactLock.structuredResultDelivery,
            receiptSchemaRef: SCHEMA_REF,
          },
        } as unknown as typeof artifactLock,
      }),
      /invalid reference Participant binding lock/,
    );
    await assert.rejects(
      resolveArtifactBackedReferenceParticipantBindingFromLock({
        repositoryRoot,
        lock: {
          ...artifactLock,
          structuredResultDelivery: {
            ...artifactLock.structuredResultDelivery,
            kind: 'TERMINAL_JSON',
          },
        } as unknown as typeof artifactLock,
      }),
      /invalid reference Participant binding lock/,
    );

    const ordinary = await resolveOperatorParticipantBinding();
    assert.equal(ordinary.participant.model, undefined);
    assert.equal(ordinary.participant.reasoningEffort, undefined);
    assert.equal(ordinary.participant.timeoutMs, undefined);
    assert.deepEqual(ordinary.participant.bindingMetadata, {
      bindingId: 'CODEX_CURRENT',
      executableVersion: 'codex 1.2.3',
    });
    assert.deepEqual(ordinary.participant.buildArgs(solutionJob), [
      '--sandbox', 'workspace-write',
      '--ask-for-approval', 'never',
      'exec', '--json', '--skip-git-repo-check', '--color', 'never', solutionJob.prompt,
    ]);
    const ordinaryReceipt = buildParticipantBindingReceipt(ordinary.participant);
    assert.equal(Object.hasOwn(ordinaryReceipt, 'ambientCodexConfigSha256'), false);
    assert.equal(Object.hasOwn(ordinaryReceipt, 'nativeEnvelopeSchemaSha256'), false);
    assert.equal(Object.hasOwn(ordinaryReceipt, 'timeoutMs'), false);
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
