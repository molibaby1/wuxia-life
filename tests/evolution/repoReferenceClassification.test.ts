import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assertArtifactReferenceFile,
  assertRepoReferenceFileAgainstAuthoritative,
  repoReferenceFs,
} from '../../scripts/evolution/problemAgnosticSolution/repoReference';
import { ParticipantOutputValidationError } from '../../scripts/evolution/problemAgnosticSolution/participantFailureClassification';

type ExpectedFailure = {
  origin: string;
  reason: string;
};

async function assertClassifiedFailure(
  operation: Promise<void>,
  expected: ExpectedFailure,
): Promise<void> {
  let error: unknown;
  await assert.rejects(operation, candidate => {
    error = candidate;
    return true;
  });
  assert.equal(error instanceof ParticipantOutputValidationError, true);
  assert.equal((error as ParticipantOutputValidationError).facts.origin, expected.origin);
  assert.equal((error as ParticipantOutputValidationError).facts.reason, expected.reason);
}

export async function runRepoReferenceClassificationTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'repo-reference-classification-'));
  const authoritativeRoot = join(root, 'authoritative');
  const workspaceRoot = join(root, 'workspace');
  const artifactRoot = join(root, 'artifact');
  await Promise.all([
    mkdir(authoritativeRoot, { recursive: true }),
    mkdir(workspaceRoot, { recursive: true }),
    mkdir(artifactRoot, { recursive: true }),
  ]);

  await assertClassifiedFailure(
    assertRepoReferenceFileAgainstAuthoritative({
      workspaceRoot,
      authoritativeRoot,
      reference: 'src/missing.ts',
      label: 'repoRef',
    }),
    { origin: 'OUTPUT_REFERENCE', reason: 'MISSING_TARGET' },
  );

  await mkdir(join(authoritativeRoot, 'src'), { recursive: true });
  await writeFile(join(authoritativeRoot, 'src/authoritative.ts'), 'export const authoritative = true;');
  await assertClassifiedFailure(
    assertRepoReferenceFileAgainstAuthoritative({
      workspaceRoot,
      authoritativeRoot,
      reference: 'src/authoritative.ts',
      label: 'repoRef',
    }),
    { origin: 'HOST_INFRASTRUCTURE', reason: 'WORKSPACE_MATERIALIZATION_MISMATCH' },
  );

  await mkdir(join(authoritativeRoot, 'src/directory'), { recursive: true });
  await mkdir(join(workspaceRoot, 'src/directory'), { recursive: true });
  await assertClassifiedFailure(
    assertRepoReferenceFileAgainstAuthoritative({
      workspaceRoot,
      authoritativeRoot,
      reference: 'src/directory',
      label: 'repoRef',
    }),
    { origin: 'OUTPUT_REFERENCE', reason: 'NOT_REGULAR_FILE' },
  );

  await assertClassifiedFailure(
    assertRepoReferenceFileAgainstAuthoritative({
      workspaceRoot,
      authoritativeRoot,
      reference: 'src/a.ts:0',
      label: 'repoRef',
    }),
    { origin: 'OUTPUT_REFERENCE', reason: 'MALFORMED_LOCATOR' },
  );

  await assertClassifiedFailure(
    assertRepoReferenceFileAgainstAuthoritative({
      workspaceRoot,
      authoritativeRoot,
      reference: join(root, 'absolute.ts'),
      label: 'repoRef',
    }),
    { origin: 'OUTPUT_REFERENCE', reason: 'ABSOLUTE_PATH' },
  );

  await assertClassifiedFailure(
    assertRepoReferenceFileAgainstAuthoritative({
      workspaceRoot,
      authoritativeRoot,
      reference: '../outside',
      label: 'repoRef',
    }),
    { origin: 'OUTPUT_REFERENCE', reason: 'ESCAPES_ALLOWED_ROOT' },
  );

  const injectedReference = 'src/injected.ts';
  const injectedTarget = join(authoritativeRoot, injectedReference);
  const originalLstat = repoReferenceFs.lstat;
  repoReferenceFs.lstat = (async target => {
    if (String(target) === injectedTarget) {
      const error = new Error('injected lstat failure') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      throw error;
    }
    return originalLstat(target);
  }) as typeof repoReferenceFs.lstat;
  try {
    await assertClassifiedFailure(
      assertRepoReferenceFileAgainstAuthoritative({
        workspaceRoot,
        authoritativeRoot,
        reference: injectedReference,
        label: 'repoRef',
      }),
      { origin: 'OUTPUT_REFERENCE', reason: 'IO_ERROR' },
    );
  } finally {
    repoReferenceFs.lstat = originalLstat;
  }

  await writeFile(join(artifactRoot, 'reports.json'), '{}');
  await assertArtifactReferenceFile({
    artifactRoot,
    workspaceRoot,
    authoritativeRoot,
    reference: 'reports.json',
    label: 'artifactRef',
  });

  await writeFile(join(authoritativeRoot, 'src/fallback.ts'), 'export const fallback = true;');
  await mkdir(join(workspaceRoot, 'src'), { recursive: true });
  await writeFile(join(workspaceRoot, 'src/fallback.ts'), 'export const fallback = true;');
  await assertArtifactReferenceFile({
    artifactRoot,
    workspaceRoot,
    authoritativeRoot,
    reference: 'src/fallback.ts',
    label: 'artifactRef',
  });

  await assertClassifiedFailure(
    assertArtifactReferenceFile({
      artifactRoot,
      workspaceRoot,
      authoritativeRoot,
      reference: 'src/absent-everywhere.ts',
      label: 'artifactRef',
    }),
    { origin: 'OUTPUT_REFERENCE', reason: 'MISSING_TARGET' },
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRepoReferenceClassificationTests()
    .then(() => console.log('repoReferenceClassification.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
