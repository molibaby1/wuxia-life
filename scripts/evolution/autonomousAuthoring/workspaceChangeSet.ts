import { spawnSync } from 'node:child_process';
import { copyFile, lstat, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { sha256Hex } from '../phase0/provenance';
import type {
  WorkspaceSnapshot,
  WorkspaceSnapshotEntry,
} from '../problemAgnosticSolution/agentWorkspace';

export interface CanonicalWorkspaceChange {
  path: string;
  changeType: 'ADDED' | 'MODIFIED' | 'DELETED';
  beforeSha256: string | null;
  afterSha256: string | null;
}

export interface DeterministicPromotionPatch {
  patch: Buffer;
  patchSha256: string;
}

function snapshotEntries(snapshot: WorkspaceSnapshot, label: string): Map<string, WorkspaceSnapshotEntry> {
  const entries = new Map<string, WorkspaceSnapshotEntry>();
  for (const entry of snapshot.entries) {
    if (entries.has(entry.path)) throw new Error(`${label} snapshot contains duplicate path: ${entry.path}`);
    entries.set(entry.path, entry);
  }
  return entries;
}

export function compareWorkspaceSnapshots(
  before: WorkspaceSnapshot,
  after: WorkspaceSnapshot,
): CanonicalWorkspaceChange[] {
  const beforeEntries = snapshotEntries(before, 'before');
  const afterEntries = snapshotEntries(after, 'after');
  const paths = [...new Set([...beforeEntries.keys(), ...afterEntries.keys()])].sort();
  const changes: CanonicalWorkspaceChange[] = [];
  for (const path of paths) {
    const beforeEntry = beforeEntries.get(path);
    const afterEntry = afterEntries.get(path);
    if (beforeEntry === undefined) {
      changes.push({ path, changeType: 'ADDED', beforeSha256: null, afterSha256: afterEntry!.sha256 });
    } else if (afterEntry === undefined) {
      changes.push({ path, changeType: 'DELETED', beforeSha256: beforeEntry.sha256, afterSha256: null });
    } else if (
      beforeEntry.objectKind !== afterEntry.objectKind
      || beforeEntry.sha256 !== afterEntry.sha256
    ) {
      changes.push({
        path,
        changeType: 'MODIFIED',
        beforeSha256: beforeEntry.sha256,
        afterSha256: afterEntry.sha256,
      });
    }
  }
  return changes;
}

function validateRelativePath(path: string): string[] {
  if (!path || isAbsolute(path) || path.includes('\\')) {
    throw new Error(`workspace change path must be normalized and relative: ${path}`);
  }
  const segments = path.split('/');
  if (segments.some(segment => segment.length === 0 || segment === '.' || segment === '..')) {
    throw new Error(`workspace change path is invalid: ${path}`);
  }
  return segments;
}

async function regularFilePath(root: string, path: string): Promise<string | null> {
  const segments = validateRelativePath(path);
  let current = resolve(root);
  for (const [index, segment] of segments.entries()) {
    current = join(current, segment);
    let stat;
    try {
      stat = await lstat(current);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error(`promotion patch input must be a regular file: ${path}`);
    if (index < segments.length - 1 && !stat.isDirectory()) {
      throw new Error(`promotion patch parent must be a directory: ${path}`);
    }
    if (index === segments.length - 1 && !stat.isFile()) {
      throw new Error(`promotion patch input must be a regular file: ${path}`);
    }
  }
  return current;
}

async function copyChangedPath(
  sourceRoot: string,
  patchRoot: string,
  relativePath: string,
): Promise<void> {
  const source = await regularFilePath(sourceRoot, relativePath);
  if (source === null) return;
  const destination = resolve(patchRoot, ...validateRelativePath(relativePath));
  const escaped = relative(resolve(patchRoot), destination);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
    throw new Error(`promotion patch path escapes temporary root: ${relativePath}`);
  }
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

function rewritePatchRoots(patch: Buffer): Buffer {
  if (patch.length === 0) return patch;
  const lines = patch.toString('utf8').split('\n');
  const rewritten = lines.map(line => {
    if (line.startsWith('diff --git a/')) {
      return line
        .replace(/^diff --git a\/(?:before|after)\//, 'diff --git a/')
        .replace(/ b\/(?:before|after)\//, ' b/');
    }
    if (line.startsWith('--- ')) return line.replace(/^--- (?:a\/)?(?:before|after)\//, '--- a/');
    if (line.startsWith('+++ ')) return line.replace(/^\+\+\+ (?:b\/)?(?:before|after)\//, '+++ b/');
    if (line.startsWith('Binary files ')) {
      return line
        .replace(/^Binary files (?:a\/)?(?:before|after)\//, 'Binary files a/')
        .replace(/ and (?:b\/)?(?:before|after)\//, ' and b/');
    }
    return line;
  }).join('\n');
  const normalized = rewritten.endsWith('\n') ? rewritten : `${rewritten}\n`;
  if (/(?:a|b)\/(?:before|after)\//.test(normalized)) {
    throw new Error('promotion patch contains an unrevised temporary root');
  }
  return Buffer.from(normalized, 'utf8');
}

export async function buildDeterministicPromotionPatch(input: {
  beforeRoot: string;
  afterRoot: string;
  changes: CanonicalWorkspaceChange[];
}): Promise<DeterministicPromotionPatch> {
  if (input.changes.length === 0) {
    const patch = Buffer.alloc(0);
    return { patch, patchSha256: sha256Hex(patch) };
  }
  const changes = [...input.changes].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'shadow-authoring-patch-'));
  try {
    const beforeRoot = join(temporaryRoot, 'before');
    const afterRoot = join(temporaryRoot, 'after');
    await mkdir(beforeRoot);
    await mkdir(afterRoot);
    for (const change of changes) {
      await copyChangedPath(input.beforeRoot, beforeRoot, change.path);
      await copyChangedPath(input.afterRoot, afterRoot, change.path);
    }
    const result = spawnSync(
      'git',
      ['diff', '--no-index', '--binary', '--no-ext-diff', '--no-renames', 'before', 'after'],
      { cwd: temporaryRoot, encoding: 'buffer', maxBuffer: 32 * 1024 * 1024 },
    );
    if (result.error) throw new Error(`promotion patch generation failed: ${result.error.message}`);
    if (result.status !== 0 && result.status !== 1) {
      throw new Error(`promotion patch generation failed with git exit ${String(result.status)}: ${result.stderr.toString('utf8')}`);
    }
    const patch = rewritePatchRoots(result.stdout);
    return { patch, patchSha256: sha256Hex(patch) };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}
