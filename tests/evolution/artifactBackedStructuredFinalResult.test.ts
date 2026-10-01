import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES,
  ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH,
  validateArtifactBackedStructuredFinalResultReceipt,
  renderArtifactBackedStructuredFinalResultInstructionsV1,
} from '../../src/evolution/artifactBackedStructuredFinalResultContract';
import {
  consumeArtifactBackedStructuredResult,
  prepareArtifactBackedStructuredResult,
} from '../../scripts/evolution/problemAgnosticSolution/artifactBackedStructuredResult';

const validReceipt = {
  schemaVersion: 'artifact-backed-structured-final-result-receipt-v1',
  bytes: 12,
  sha256: 'a'.repeat(64),
};

const RESERVED_PARENT = '.evolution-participant';

interface Fixture {
  root: string;
  workspaceRoot: string;
  destinationRoot: string;
  resultPath: string;
}

async function withFixture(run: (fixture: Fixture) => Promise<void>): Promise<void> {
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
