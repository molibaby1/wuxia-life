import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createEvidenceOnlyWorkspace,
  runLocalEvidenceOnlyParticipant,
} from '../../scripts/evolution/localEvidenceOnlyParticipant';

export async function runLocalEvidenceOnlyParticipantTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'local-evidence-only-participant-'));
  const sourceRoot = join(root, 'repository');
  const workspaceRoot = join(root, 'evidence-workspace');
  await mkdir(join(sourceRoot, 'src'), { recursive: true });
  await readFile(join(sourceRoot, 'src/canary.ts')).catch(async () => {
    await import('node:fs/promises').then(({ writeFile }) => writeFile(
      join(sourceRoot, 'src/canary.ts'),
      'export const sourceSecret = "must-not-be-copied";\n',
    ));
  });

  const manifest = await createEvidenceOnlyWorkspace({
    workspaceRoot,
    files: {
      'input/observable-payload.json': '{"entries":[]}',
    },
  });
  assert.deepEqual(manifest.files, ['input/observable-payload.json']);
  assert.match(manifest.manifestSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(
    JSON.parse(await readFile(manifest.manifestPath, 'utf8')),
    {
      schemaVersion: 'evidence-only-workspace-manifest-v1',
      files: [{ path: 'input/observable-payload.json', sha256: 'd801aa1fb7ddcc330a5e3173372ea6af4a3d08ec58074478e85aa5603e926658' }],
    },
  );
  assert.equal(await readFile(join(workspaceRoot, 'input/observable-payload.json'), 'utf8'), '{"entries":[]}');
  await assert.rejects(() => readFile(join(workspaceRoot, 'src/canary.ts')));

  let capturedWorkspaceRoot = '';
  const result = await runLocalEvidenceOnlyParticipant({
    invocationRef: 'local-evidence-only-000001',
    role: 'feedback',
    workspaceRoot,
    prompt: 'return the structured result',
    participant: {
      executable: process.execPath,
      buildArgs: input => {
        capturedWorkspaceRoot = input.workspaceRoot;
        return ['-e', `process.stdout.write(${JSON.stringify('{"overallImpression":"ok","observations":[]}' )})`];
      },
    },
  });

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.rawParticipantResponse, '{"overallImpression":"ok","observations":[]}');
  assert.equal(capturedWorkspaceRoot, workspaceRoot);
  await assert.rejects(() => readFile(join(root, 'execution-trace.json')));

  await assert.rejects(
    () => createEvidenceOnlyWorkspace({
      workspaceRoot: join(root, 'invalid-workspace'),
      files: { '../escape.txt': 'must fail' },
    }),
    /relative file path|escapes workspace/i,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runLocalEvidenceOnlyParticipantTests()
    .then(() => console.log('localEvidenceOnlyParticipant.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
