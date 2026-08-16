import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { access, mkdtemp, mkdir, readFile, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  canonicalJson,
  captureCatalogInput,
  captureWorktreeSourceFingerprint,
  createExperimentEnvelope,
  publishPhase0RunNoReplace,
  sealPhase0Run,
  validatePhase0RunRef,
  validatePhase0RunSeal,
  writePhase0RunAnchor,
  sha256Hex,
} from '../../scripts/evolution/phase0/provenance';
import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog';
import type { EventDefinition } from '../../src/types/eventTypes';

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

async function makeRepo(): Promise<string> {
  const repo = await mkdtemp(join(tmpdir(), 'phase0-provenance-'));
  git(repo, 'init', '-q');
  git(repo, 'config', 'user.email', 'phase0@example.test');
  git(repo, 'config', 'user.name', 'Phase Zero');
  await writeFile(join(repo, 'tracked.txt'), 'baseline');
  git(repo, 'add', 'tracked.txt');
  git(repo, 'commit', '-qm', 'baseline');
  return repo;
}


async function writeRequiredPhase0Artifacts(root: string): Promise<void> {
  const files: Record<string, string> = {
    'inputs/run-input.json': '{"run":"input"}',
    'inputs/persona.json': '{"persona":"input"}',
    'inputs/catalog.json': '{"catalog":"input"}',
    'provenance/source-fingerprint.json': '{"source":"fingerprint"}',
    'internal/player-surface-source.json': '{"surface":"source"}',
    'reviewer-input/observable-payload.json': '{"observable":"payload"}',
    'provenance/experiment-envelope.json': '{"envelope":"internal"}',
    'provenance/phase0-run-data-access-manifest.json': '{"acl":"phase0"}',
  };
  for (const [relativePath, contents] of Object.entries(files)) {
    const absolutePath = join(root, relativePath);
    await mkdir(join(absolutePath, '..'), { recursive: true });
    await writeFile(absolutePath, contents);
  }
}

export async function runPhase0ProvenanceTests(): Promise<void> {
  const repo = await makeRepo();
  try {
    const clean = await captureWorktreeSourceFingerprint(repo);
    assert.equal(clean.headSha, git(repo, 'rev-parse', 'HEAD'));
    assert.equal(clean.worktreeEntries.length, 0);

    await writeFile(join(repo, 'tracked.txt'), 'modified');
    const modified = await captureWorktreeSourceFingerprint(repo);
    assert.equal(modified.worktreeEntries.length, 1);
    assert.equal(modified.worktreeEntries[0]?.objectKind, 'regular_file');
    assert.equal(modified.worktreeEntries[0]?.sha256, sha256Hex(Buffer.from('modified')));

    await mkdir(join(repo, 'src/evolution/nested'), { recursive: true });
    await writeFile(join(repo, 'src/evolution/a.ts'), 'export const a = 1;');
    await writeFile(join(repo, 'src/evolution/nested/b.ts'), 'export const b = 1;');
    const nestedOne = await captureWorktreeSourceFingerprint(repo);
    const nestedPaths = nestedOne.worktreeEntries.map(entry => entry.path);
    assert.ok(nestedPaths.includes('src/evolution/a.ts'));
    assert.ok(nestedPaths.includes('src/evolution/nested/b.ts'));
    assert.equal(nestedPaths.includes('src/evolution/'), false);

    const beforeNestedHash = sha256Hex(Buffer.from(canonicalJson(nestedOne)));
    await writeFile(join(repo, 'src/evolution/nested/b.ts'), 'export const b = 2;');
    const nestedTwo = await captureWorktreeSourceFingerprint(repo);
    const afterNestedHash = sha256Hex(Buffer.from(canonicalJson(nestedTwo)));
    assert.notEqual(beforeNestedHash, afterNestedHash);

    await rm(join(repo, 'tracked.txt'));
    const deleted = await captureWorktreeSourceFingerprint(repo);
    const deletedEntry = deleted.worktreeEntries.find(entry => entry.path === 'tracked.txt');
    assert.equal(deletedEntry?.deleted, true);

    git(repo, 'checkout', '--', 'tracked.txt');
    git(repo, 'mv', 'tracked.txt', 'renamed file.txt');
    const renamed = await captureWorktreeSourceFingerprint(repo);
    const renamedEntry = renamed.worktreeEntries.find(entry => entry.path === 'renamed file.txt');
    assert.equal(renamedEntry?.sourcePath, 'tracked.txt');
    assert.ok(renamedEntry?.status.includes('R'));

    await writeFile(join(repo, 'target.txt'), 'target-one');
    await symlink('target.txt', join(repo, 'link.txt'));
    const symlinkOne = await captureWorktreeSourceFingerprint(repo);
    const linkOne = symlinkOne.worktreeEntries.find(entry => entry.path === 'link.txt');
    assert.equal(linkOne?.objectKind, 'symlink');
    assert.equal(linkOne?.sha256, sha256Hex(Buffer.from('target.txt')));
    await writeFile(join(repo, 'target.txt'), 'target-two');
    const symlinkTwo = await captureWorktreeSourceFingerprint(repo);
    const linkTwo = symlinkTwo.worktreeEntries.find(entry => entry.path === 'link.txt');
    assert.equal(linkTwo?.sha256, linkOne?.sha256);

    const rawLinkTarget = Buffer.from([0x72, 0x61, 0x77, 0x80]);
    await symlink(rawLinkTarget, join(repo, 'raw-link.txt'));
    const rawLinkFingerprint = await captureWorktreeSourceFingerprint(repo);
    const rawLinkEntry = rawLinkFingerprint.worktreeEntries.find(entry => entry.path === 'raw-link.txt');
    assert.equal(rawLinkEntry?.objectKind, 'symlink');
    assert.equal(rawLinkEntry?.sha256, sha256Hex(rawLinkTarget), 'symlink target bytes must be hashed losslessly');

    const fifoTracked = join(repo, 'fifo-tracked.txt');
    await writeFile(fifoTracked, 'regular');
    git(repo, 'add', 'fifo-tracked.txt');
    git(repo, 'commit', '-qm', 'add fifo subject');
    await unlink(fifoTracked);
    execFileSync('mkfifo', [fifoTracked]);
    try {
      await assert.rejects(
        () => captureWorktreeSourceFingerprint(repo),
        /unsupported dirty worktree object/,
      );
    } finally {
      await unlink(fifoTracked);
    }

    assert.equal(validatePhase0RunRef('phase0-observable-review-001'), 'phase0-observable-review-001');
    for (const unsafe of ['../escape', 'phase0_review', 'Phase0', '.', '..', 'phase0 test', 'a/b', 'a\\b']) {
      assert.throws(() => validatePhase0RunRef(unsafe), /runRef/i);
    }

    const evidenceRoot = await mkdtemp(join(tmpdir(), 'phase0-seal-'));
    try {
      const staging = join(evidenceRoot, 'staging');
      await mkdir(staging);
      await writeRequiredPhase0Artifacts(staging);
      const sealed = await sealPhase0Run(staging, 'phase0-seal-test');
      assert.equal(sealed.manifest.artifacts.length, 8);
      assert.deepEqual(
        sealed.manifest.artifacts.map(item => item.path),
        [...sealed.manifest.artifacts.map(item => item.path)].sort(),
      );
      await validatePhase0RunSeal(staging, sealed.experimentRootHash);

      await writeFile(join(staging, 'inputs/run-input.json'), '{"tampered":true}');
      await assert.rejects(
        () => validatePhase0RunSeal(staging, sealed.experimentRootHash),
        /hash mismatch/i,
      );
      await writeFile(join(staging, 'inputs/run-input.json'), '{"run":"input"}');
      await validatePhase0RunSeal(staging, sealed.experimentRootHash);

      const raceTarget = join(evidenceRoot, 'runs', 'phase0-race-test');
      await mkdir(raceTarget, { recursive: true });
      await writeFile(join(raceTarget, 'sentinel.txt'), 'do-not-touch');
      const sentinelBefore = await readFile(join(raceTarget, 'sentinel.txt'));
      await assert.rejects(
        () => publishPhase0RunNoReplace(staging, raceTarget, sealed.experimentRootHash),
        /exist|no-replace/i,
      );
      assert.deepEqual(await readFile(join(raceTarget, 'sentinel.txt')), sentinelBefore);
      await access(join(staging, 'experiment-root.json'));

      const finalRun = join(evidenceRoot, 'runs', 'phase0-success-test');
      await publishPhase0RunNoReplace(staging, finalRun, sealed.experimentRootHash);
      await validatePhase0RunSeal(finalRun, sealed.experimentRootHash);
      await access(join(staging, 'experiment-root.json'));

      const anchorRoot = join(evidenceRoot, 'anchors');
      const anchorPath = await writePhase0RunAnchor(anchorRoot, {
        schemaVersion: 'phase0-run-anchor-v1',
        runRef: 'phase0-success-test',
        experimentRootHash: sealed.experimentRootHash,
        status: 'generated_awaiting_human',
        timestamp: '2026-08-13T00:00:00.000Z',
        actorRef: 'phase0-test',
      });
      assert.equal(anchorPath.startsWith(finalRun), false);
      const anchor = JSON.parse(await readFile(anchorPath, 'utf8')) as Record<string, unknown>;
      assert.equal(anchor.runRef, 'phase0-success-test');
      assert.equal(anchor.experimentRootHash, sealed.experimentRootHash);
      await assert.rejects(
        () => writePhase0RunAnchor(anchorRoot, {
          schemaVersion: 'phase0-run-anchor-v1',
          runRef: 'phase0-success-test',
          experimentRootHash: sealed.experimentRootHash,
          status: 'generated_awaiting_human',
          timestamp: '2026-08-13T00:00:01.000Z',
          actorRef: 'phase0-test',
        }),
        /exist/i,
      );
    } finally {
      await rm(evidenceRoot, { recursive: true, force: true });
    }

    const fakeEvents = [
      { id: 'b-event', weight: 2, content: { title: 'B', text: 'two' } },
      { id: 'a-event', weight: 1, content: { title: 'A', text: 'one' } },
    ] as unknown as EventDefinition[];
    const catalog: RuntimeEventCatalog = {
      getAllEvents: () => fakeEvents,
      getEventsByAge: () => fakeEvents,
      getEventById: id => fakeEvents.find(event => event.id === id),
      getWeightForAge: event => event.weight ?? 0,
    };
    const capturedCatalog = captureCatalogInput(catalog);
    assert.deepEqual(capturedCatalog.events.map(event => event.id), ['a-event', 'b-event']);
    fakeEvents[0]!.content!.title = 'MUTATED';
    assert.equal(capturedCatalog.events[1]?.content?.title, 'B');

    const envelope = createExperimentEnvelope({
      runRef: 'phase0-test-001',
      sourceFingerprint: sha256Hex(Buffer.from(canonicalJson(clean))),
      configFingerprint: sha256Hex(Buffer.from(canonicalJson(capturedCatalog))),
      seedRef: 'sha256:seed',
      personaRef: 'sha256:persona',
      policyRef: 'sha256:policy',
      endAge: 30,
      observablePayloadHash: 'sha256:payload',
    });
    assert.equal(envelope.policyVisibilityBoundary, 'uses_hidden_oracle');
    assert.equal(envelope.armRef, null);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runPhase0ProvenanceTests();
  console.log('phase0Provenance.test.ts: ok');
}
