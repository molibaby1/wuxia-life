import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, readlink, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES,
  ARTIFACT_BACKED_STRUCTURED_RESULT_PREFLIGHT_COMMAND,
  ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH,
  validateArtifactBackedStructuredFinalResultReceipt,
  renderArtifactBackedStructuredFinalResultInstructionsV1,
} from '../../src/evolution/artifactBackedStructuredFinalResultContract';
import {
  consumeArtifactBackedStructuredResult,
  prepareArtifactBackedStructuredResult,
} from '../../scripts/evolution/problemAgnosticSolution/artifactBackedStructuredResult';
import { validateSolutionWork } from '../../src/evolution/solutionWorkContract';
import { AUTONOMOUS_AUTHORING_PROPOSAL_FIXTURE } from './autonomousAuthoringContracts.test';

const validReceipt = {
  schemaVersion: 'artifact-backed-structured-final-result-receipt-v1',
  bytes: 12,
  sha256: 'a'.repeat(64),
};

const RESERVED_PARENT = '.evolution-participant';
const PREFLIGHT_RELATIVE_PATH = ARTIFACT_BACKED_STRUCTURED_RESULT_PREFLIGHT_COMMAND;
const PREFLIGHT_PASS_MARKER = 'ROLE_SCHEMA_PREFLIGHT_PASS';
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const HOST_TSX_PATH = join(REPOSITORY_ROOT, 'node_modules', '.bin', 'tsx');
const PREFLIGHT_CLI_PATH = join(
  REPOSITORY_ROOT,
  'scripts',
  'evolution',
  'problemAgnosticSolution',
  'preflightSolutionWorkArtifact.ts',
);

interface Fixture {
  root: string;
  workspaceRoot: string;
  destinationRoot: string;
  resultPath: string;
}

async function withFixture(
  run: (fixture: Fixture) => Promise<void>,
  options: { esmPackageScope?: boolean } = {},
): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'artifact-backed-result-'));
  const canonicalRoot = await realpath(root);
  const fixture: Fixture = {
    root,
    workspaceRoot: join(canonicalRoot, 'workspace'),
    destinationRoot: join(canonicalRoot, 'evidence'),
    resultPath: join(canonicalRoot, 'workspace', ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH),
  };
  await mkdir(fixture.workspaceRoot);
  await mkdir(fixture.destinationRoot);
  if (options.esmPackageScope) {
    await writeFile(join(fixture.workspaceRoot, 'package.json'), JSON.stringify({ type: 'module' }));
  }
  try {
    await run(fixture);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function receiptFor(rawBytes: Buffer) {
  return {
    schemaVersion: 'artifact-backed-structured-final-result-receipt-v1' as const,
    bytes: rawBytes.byteLength,
    sha256: createHash('sha256').update(rawBytes).digest('hex'),
  };
}

function validSolutionWorkFixture(): Record<string, unknown> {
  return {
    schemaVersion: 'solution-work-v1',
    status: 'OPTIONS',
    problemId: 'problem-000001',
    options: [{
      optionId: 'option-000001',
      proposedChange: 'Add one bounded content proposal.',
      rationale: 'It addresses the observed gap.',
      repoRefs: [],
      artifactRefs: [],
      changeScope: 'program',
      expectedPlayerObservableDifference: 'The result includes a suitable childhood scene.',
      risks: [],
      unknowns: [],
      autonomousAuthoring: structuredClone(AUTONOMOUS_AUTHORING_PROPOSAL_FIXTURE),
    }],
    recommendedOptionId: 'option-000001',
    summary: 'One bounded proposal.',
    repoRefs: [],
    artifactRefs: [],
  };
}

function setContractPayloadSchemaVersion(value: Record<string, unknown>, schemaVersion: string): void {
  const options = value.options as Array<Record<string, unknown>>;
  const proposal = options[0]!.autonomousAuthoring as Record<string, unknown>;
  const payload = proposal.contractPayload as Record<string, unknown>;
  payload.schemaVersion = schemaVersion;
}

function runPreflightCli(workspaceRoot: string, args: string[] = []) {
  return spawnSync(HOST_TSX_PATH, [PREFLIGHT_CLI_PATH, ...args], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });
}

async function assertMissing(path: string): Promise<void> {
  await assert.rejects(lstat(path), { code: 'ENOENT' });
}

export async function runArtifactBackedStructuredFinalResultTests(): Promise<void> {
  assert.equal(ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH, '.evolution-participant/final-result.json');
  assert.equal(ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES, 1_048_576);

  assert.deepEqual(validateArtifactBackedStructuredFinalResultReceipt(validReceipt), validReceipt);

  for (const invalid of [
    { ...validReceipt, extra: true },
    { schemaVersion: validReceipt.schemaVersion, bytes: validReceipt.bytes },
    { ...validReceipt, schemaVersion: 'other-v1' },
    { ...validReceipt, bytes: -1 },
    { ...validReceipt, bytes: 1.5 },
    { ...validReceipt, bytes: '12' },
    { ...validReceipt, bytes: ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES + 1 },
    { ...validReceipt, sha256: 'A'.repeat(64) },
    { ...validReceipt, sha256: 'a'.repeat(63) },
    { ...validReceipt, sha256: 'a'.repeat(65) },
    { ...validReceipt, sha256: 'g'.repeat(64) },
  ]) {
    assert.throws(() => validateArtifactBackedStructuredFinalResultReceipt(invalid));
  }

  const instructions = renderArtifactBackedStructuredFinalResultInstructionsV1({
    roleSchemaName: 'ExampleRoleV1',
  });
  assert.match(instructions, /\.evolution-participant\/final-result\.json/);
  assert.match(instructions, /complete ExampleRoleV1/);
  assert.match(instructions, /artifact/i);
  assert.match(instructions, /terminal output must contain only the small JSON receipt/i);
  assert.match(instructions, /schemaVersion: "artifact-backed-structured-final-result-receipt-v1"/);
  assert.match(instructions, /bytes: exact artifact byte length as a non-negative integer/);
  assert.match(instructions, /sha256: exact artifact SHA-256 as 64 lowercase hexadecimal characters/);
  assert.match(instructions, /reject rather than repair/i);
  assert.doesNotMatch(instructions, /preflight-solution-work|ROLE_SCHEMA_PREFLIGHT/);

  await withFixture(async ({ workspaceRoot, resultPath }) => {
    await prepareArtifactBackedStructuredResult({ workspaceRoot });
    const validBytes = Buffer.from(`${JSON.stringify(validSolutionWorkFixture())}\n`, 'utf8');
    await writeFile(resultPath, validBytes);
    const launcherPath = join(workspaceRoot, PREFLIGHT_RELATIVE_PATH);
    const launched = spawnSync(launcherPath, [], { cwd: workspaceRoot, encoding: 'utf8' });
    assert.equal(launched.status, 0, launched.stderr);
    assert.equal(launched.stdout, `${PREFLIGHT_PASS_MARKER}\n`);
    assert.equal(launched.stderr, '');
  }, { esmPackageScope: true });

  await withFixture(async ({ workspaceRoot, resultPath }) => {
    const invalidValue = validSolutionWorkFixture();
    setContractPayloadSchemaVersion(invalidValue, 'preschool-autonomous-authoring-payload-v1');
    const invalidBytes = Buffer.from(`${JSON.stringify(invalidValue)}\n`, 'utf8');
    await prepareArtifactBackedStructuredResult({ workspaceRoot });
    await writeFile(resultPath, invalidBytes);
    const launcherPath = join(workspaceRoot, PREFLIGHT_RELATIVE_PATH);

    let authoritativeError = '';
    try {
      validateSolutionWork(JSON.parse(invalidBytes.toString('utf8')));
    } catch (error) {
      authoritativeError = error instanceof Error ? error.message : String(error);
    }
    assert.notEqual(authoritativeError, '', 'the authoritative Role validator must reject the regression fixture');

    const beforeSha256 = createHash('sha256').update(await readFile(resultPath)).digest('hex');
    const failed = spawnSync(launcherPath, [], { cwd: workspaceRoot, encoding: 'utf8' });
    assert.equal(failed.status, 1);
    assert.equal(failed.stdout, '');
    assert.match(failed.stderr, new RegExp(authoritativeError.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const afterFailureBytes = await readFile(resultPath);
    assert.equal(createHash('sha256').update(afterFailureBytes).digest('hex'), beforeSha256);
    assert.deepEqual(afterFailureBytes, invalidBytes);

    const correctedValue = structuredClone(invalidValue);
    setContractPayloadSchemaVersion(
      correctedValue,
      'preschool-shared-neutral-passive-authoring-payload-v1',
    );
    const correctedBytes = Buffer.from(`${JSON.stringify(correctedValue)}\n`, 'utf8');
    await writeFile(resultPath, correctedBytes);
    const correctedSha256 = createHash('sha256').update(await readFile(resultPath)).digest('hex');
    const passed = spawnSync(launcherPath, [], { cwd: workspaceRoot, encoding: 'utf8' });
    assert.equal(passed.status, 0);
    assert.equal(passed.stdout, `${PREFLIGHT_PASS_MARKER}\n`);
    assert.equal(passed.stderr, '');
    const afterPassBytes = await readFile(resultPath);
    assert.equal(createHash('sha256').update(afterPassBytes).digest('hex'), correctedSha256);
    assert.deepEqual(afterPassBytes, correctedBytes);

    const alternativePath = join(workspaceRoot, 'alternative-result.json');
    await writeFile(alternativePath, correctedBytes);
    const arbitraryPath = runPreflightCli(workspaceRoot, [alternativePath]);
    assert.notEqual(arbitraryPath.status, 0);
    assert.doesNotMatch(arbitraryPath.stdout, new RegExp(PREFLIGHT_PASS_MARKER));
    assert.match(arbitraryPath.stderr, /does not accept arguments/i);
  }, { esmPackageScope: true });

  const preflightInstructions = renderArtifactBackedStructuredFinalResultInstructionsV1({
    roleSchemaName: 'SolutionWorkV1',
    preflightCommand: PREFLIGHT_RELATIVE_PATH,
  });
  assert.ok(preflightInstructions.indexOf(ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH)
    < preflightInstructions.indexOf(`./${PREFLIGHT_RELATIVE_PATH}`));
  assert.ok(preflightInstructions.indexOf(`./${PREFLIGHT_RELATIVE_PATH}`)
    < preflightInstructions.indexOf("compute the artifact's exact byte length and SHA-256"));
  assert.match(preflightInstructions, /non-zero|nonzero/i);
  assert.match(preflightInstructions, /PASS/);
  assert.match(preflightInstructions, /same (?:Solution )?turn|current turn/i);
  assert.match(preflightInstructions, /do not modify.*after.*PASS/i);

  await withFixture(async ({ workspaceRoot, resultPath }) => {
    const prepared = await prepareArtifactBackedStructuredResult({ workspaceRoot });
    assert.equal(prepared.resultPath, resultPath);
    const launcherPath = join(workspaceRoot, PREFLIGHT_RELATIVE_PATH);
    const launcherStat = await lstat(launcherPath);
    assert.ok(launcherStat.isFile());
    assert.notEqual(launcherStat.mode & 0o111, 0, 'preflight launcher must be executable');
    const launcherSource = await readFile(launcherPath, 'utf8');
    assert.ok(launcherSource.includes(HOST_TSX_PATH));
    assert.ok(launcherSource.includes(PREFLIGHT_CLI_PATH));
    assert.ok(!launcherSource.includes(workspaceRoot));

    const validBytes = Buffer.from(`${JSON.stringify(validSolutionWorkFixture())}\n`, 'utf8');
    await writeFile(resultPath, validBytes);
    const beforeSha256 = createHash('sha256').update(await readFile(resultPath)).digest('hex');
    const launched = spawnSync(launcherPath, [], { cwd: workspaceRoot, encoding: 'utf8' });
    assert.equal(launched.status, 0, launched.stderr);
    assert.equal(launched.stdout, `${PREFLIGHT_PASS_MARKER}\n`);
    assert.equal(createHash('sha256').update(await readFile(resultPath)).digest('hex'), beforeSha256);
  });

  await withFixture(async ({ workspaceRoot }) => {
    const launcherPath = join(workspaceRoot, PREFLIGHT_RELATIVE_PATH);
    await mkdir(join(workspaceRoot, RESERVED_PARENT));
    await writeFile(launcherPath, 'preserve-existing-launcher');
    await assert.rejects(
      prepareArtifactBackedStructuredResult({ workspaceRoot }),
      /already exists|EEXIST/i,
    );
    assert.equal(await readFile(launcherPath, 'utf8'), 'preserve-existing-launcher');
  });

  await withFixture(async ({ root, workspaceRoot }) => {
    const launcherPath = join(workspaceRoot, PREFLIGHT_RELATIVE_PATH);
    const targetPath = join(root, 'existing-launcher-target');
    await mkdir(join(workspaceRoot, RESERVED_PARENT));
    await writeFile(targetPath, 'preserve-symlink-target');
    await symlink(targetPath, launcherPath);
    await assert.rejects(
      prepareArtifactBackedStructuredResult({ workspaceRoot }),
      /already exists|EEXIST/i,
    );
    assert.equal(await readFile(targetPath, 'utf8'), 'preserve-symlink-target');
    assert.equal(await readlink(launcherPath), targetPath);
  });

  await withFixture(async ({ workspaceRoot, resultPath }) => {
    const prepared = await prepareArtifactBackedStructuredResult({ workspaceRoot });
    assert.equal(prepared.resultPath, resultPath);
    await lstat(join(workspaceRoot, RESERVED_PARENT));
    await assertMissing(resultPath);
  });

  await withFixture(async ({ workspaceRoot, resultPath }) => {
    await mkdir(join(workspaceRoot, RESERVED_PARENT));
    await writeFile(resultPath, '{"stale":true}');
    await assert.rejects(
      prepareArtifactBackedStructuredResult({ workspaceRoot }),
      /already exists/i,
    );
  });

  await withFixture(async ({ root, workspaceRoot }) => {
    const outsideParent = join(root, 'outside-parent');
    await mkdir(outsideParent);
    await symlink(outsideParent, join(workspaceRoot, RESERVED_PARENT), 'dir');
    await assert.rejects(
      prepareArtifactBackedStructuredResult({ workspaceRoot }),
      /symlink|directory/i,
    );
  });

  await withFixture(async ({ root, workspaceRoot, resultPath }) => {
    await mkdir(join(workspaceRoot, RESERVED_PARENT));
    const outsideFile = join(root, 'outside-result.json');
    await writeFile(outsideFile, '{}');
    await symlink(outsideFile, resultPath);
    await assert.rejects(
      prepareArtifactBackedStructuredResult({ workspaceRoot }),
      /already exists|symlink/i,
    );
  });

  await withFixture(async ({ workspaceRoot }) => {
    await writeFile(join(workspaceRoot, 'unrelated.json'), '{}');
    await prepareArtifactBackedStructuredResult({ workspaceRoot });
  });

  await withFixture(async ({ workspaceRoot, destinationRoot, resultPath }) => {
    const rawBytes = Buffer.from('{\n  "status": "OPTIONS",\n  "options": []\n}\n', 'utf8');
    await mkdir(join(workspaceRoot, RESERVED_PARENT));
    await writeFile(resultPath, rawBytes);
    const consumed = await consumeArtifactBackedStructuredResult({
      workspaceRoot,
      destinationRoot,
      receipt: receiptFor(rawBytes),
    });
    assert.deepEqual(consumed.rawBytes, rawBytes);
    assert.equal(consumed.rawText, rawBytes.toString('utf8'));
    assert.equal(consumed.bytes, rawBytes.byteLength);
    assert.equal(consumed.sha256, receiptFor(rawBytes).sha256);
    assert.deepEqual(consumed.parsedObject, { status: 'OPTIONS', options: [] });
    assert.deepEqual(await readFile(join(destinationRoot, 'structured-result-artifact.raw.json')), rawBytes);
  });

  await withFixture(async ({ workspaceRoot, destinationRoot, resultPath }) => {
    await mkdir(join(workspaceRoot, RESERVED_PARENT));
    await writeFile(join(workspaceRoot, 'alternative-result.json'), '{"alternative":true}');
    await assert.rejects(
      consumeArtifactBackedStructuredResult({
        workspaceRoot,
        destinationRoot,
        receipt: receiptFor(Buffer.from('{}')),
      }),
      /missing|does not exist/i,
    );
    await assertMissing(resultPath);
    await assertMissing(join(destinationRoot, 'structured-result-artifact.raw.json'));
  });

  await withFixture(async ({ root, workspaceRoot, destinationRoot, resultPath }) => {
    const outsideParent = join(root, 'outside-parent');
    await mkdir(outsideParent);
    await symlink(outsideParent, join(workspaceRoot, RESERVED_PARENT), 'dir');
    await writeFile(join(outsideParent, 'final-result.json'), '{}');
    await assert.rejects(
      consumeArtifactBackedStructuredResult({ workspaceRoot, destinationRoot, receipt: receiptFor(Buffer.from('{}')) }),
      /symlink|directory/i,
    );
    await assertMissing(join(destinationRoot, 'structured-result-artifact.raw.json'));
  });

  await withFixture(async ({ root, workspaceRoot, destinationRoot, resultPath }) => {
    await mkdir(join(workspaceRoot, RESERVED_PARENT));
    const outsideFile = join(root, 'outside-result.json');
    await writeFile(outsideFile, '{}');
    await symlink(outsideFile, resultPath);
    await assert.rejects(
      consumeArtifactBackedStructuredResult({ workspaceRoot, destinationRoot, receipt: receiptFor(Buffer.from('{}')) }),
      /symlink|regular file/i,
    );
  });

  await withFixture(async ({ workspaceRoot, destinationRoot, resultPath }) => {
    await mkdir(join(workspaceRoot, RESERVED_PARENT));
    await mkdir(resultPath);
    await assert.rejects(
      consumeArtifactBackedStructuredResult({ workspaceRoot, destinationRoot, receipt: receiptFor(Buffer.from('{}')) }),
      /regular file/i,
    );
  });

  await withFixture(async ({ workspaceRoot, destinationRoot, resultPath }) => {
    await mkdir(join(workspaceRoot, RESERVED_PARENT));
    await writeFile(resultPath, Buffer.alloc(ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES + 1, 0x20));
    await assert.rejects(
      consumeArtifactBackedStructuredResult({ workspaceRoot, destinationRoot, receipt: receiptFor(Buffer.from('{}')) }),
      /exceeds.*1,048,576/i,
    );
    await assertMissing(join(destinationRoot, 'structured-result-artifact.raw.json'));
  });

  await withFixture(async ({ workspaceRoot, destinationRoot, resultPath }) => {
    const rawBytes = Buffer.from('{"a":1}');
    await mkdir(join(workspaceRoot, RESERVED_PARENT));
    await writeFile(resultPath, rawBytes);
    await assert.rejects(
      consumeArtifactBackedStructuredResult({ workspaceRoot, destinationRoot, receipt: { ...receiptFor(rawBytes), bytes: rawBytes.length + 1 } }),
      /byte length|bytes mismatch/i,
    );
  });

  await withFixture(async ({ workspaceRoot, destinationRoot, resultPath }) => {
    const rawBytes = Buffer.from('{"a":1}');
    await mkdir(join(workspaceRoot, RESERVED_PARENT));
    await writeFile(resultPath, rawBytes);
    await assert.rejects(
      consumeArtifactBackedStructuredResult({ workspaceRoot, destinationRoot, receipt: { ...receiptFor(rawBytes), sha256: 'b'.repeat(64) } }),
      /sha-?256|hash mismatch/i,
    );
  });

  await withFixture(async ({ workspaceRoot, destinationRoot, resultPath }) => {
    const rawBytes = Buffer.from([0x7b, 0x22, 0x61, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]);
    await mkdir(join(workspaceRoot, RESERVED_PARENT));
    await writeFile(resultPath, rawBytes);
    await assert.rejects(
      consumeArtifactBackedStructuredResult({ workspaceRoot, destinationRoot, receipt: receiptFor(rawBytes) }),
      /UTF-8/i,
    );
    assert.deepEqual(await readFile(join(destinationRoot, 'structured-result-artifact.raw.json')), rawBytes);
  });

  for (const rawText of [
    '{"a":',
    '[]',
    '"scalar"',
    '```json\n{"a":1}\n```',
    'result: {"a":1}',
  ]) {
    await withFixture(async ({ workspaceRoot, destinationRoot, resultPath }) => {
      const rawBytes = Buffer.from(rawText, 'utf8');
      await mkdir(join(workspaceRoot, RESERVED_PARENT));
      await writeFile(resultPath, rawBytes);
      await assert.rejects(
        consumeArtifactBackedStructuredResult({ workspaceRoot, destinationRoot, receipt: receiptFor(rawBytes) }),
        /envelope|JSON|object/i,
      );
    });
  }

  await withFixture(async ({ workspaceRoot, destinationRoot, resultPath }) => {
    const rawBytes = Buffer.from('{"a":1}');
    const copiedPath = join(destinationRoot, 'structured-result-artifact.raw.json');
    await mkdir(join(workspaceRoot, RESERVED_PARENT));
    await writeFile(resultPath, rawBytes);
    await writeFile(copiedPath, 'preserve');
    await assert.rejects(
      consumeArtifactBackedStructuredResult({ workspaceRoot, destinationRoot, receipt: receiptFor(rawBytes) }),
      /create|exist|EEXIST/i,
    );
    assert.equal(await readFile(copiedPath, 'utf8'), 'preserve');
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runArtifactBackedStructuredFinalResultTests()
    .then(() => console.log('artifactBackedStructuredFinalResult.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
