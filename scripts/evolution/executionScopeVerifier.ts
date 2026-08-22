import { lstat, readFile, readlink, readdir } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { SolutionOptionV1 } from '../../src/evolution/solutionWorkContract';
import { parseRepoReference } from './problemAgnosticSolution/repoReference';
import { sha256Hex } from './phase0/provenance';

export interface WorkspaceSnapshotEntry {
  path: string;
  objectKind: 'regular_file' | 'symlink';
  sha256: string;
}

export interface WorkspaceSnapshot {
  entries: WorkspaceSnapshotEntry[];
}

export interface ScopeVerificationResult {
  status: 'passed' | 'scope_violation';
  actualChangedFiles: string[];
  unauthorizedFiles: string[];
}

function normalized(path: string): string {
  return path.split(sep).join('/');
}

function safePath(root: string, reference: string): string {
  const resolvedRoot = resolve(root);
  if (reference === '.' || reference === '') return resolvedRoot;
  const target = resolve(resolvedRoot, reference);
  const escaped = relative(resolvedRoot, target);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
    throw new Error(`path escapes workspace: ${reference}`);
  }
  return target;
}

async function collectSnapshotEntries(root: string, current = ''): Promise<WorkspaceSnapshotEntry[]> {
  const directory = safePath(root, current || '.');
  const entries = await readdir(directory, { withFileTypes: true });
  const result: WorkspaceSnapshotEntry[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relativePath = normalized(current ? join(current, entry.name) : entry.name);
    const absolutePath = safePath(root, relativePath);
    if (entry.isDirectory()) {
      result.push(...await collectSnapshotEntries(root, relativePath));
    } else if (entry.isFile()) {
      result.push({ path: relativePath, objectKind: 'regular_file', sha256: sha256Hex(await readFile(absolutePath)) });
    } else if (entry.isSymbolicLink()) {
      result.push({
        path: relativePath,
        objectKind: 'symlink',
        sha256: sha256Hex(await readlink(absolutePath, { encoding: 'buffer' })),
      });
    } else {
      throw new Error(`unsupported workspace object: ${relativePath}`);
    }
  }
  return result;
}

export async function snapshotWorkspace(root: string): Promise<WorkspaceSnapshot> {
  return { entries: await collectSnapshotEntries(resolve(root)) };
}

function entryKey(entry: WorkspaceSnapshotEntry): string {
  return `${entry.objectKind}:${entry.sha256}`;
}

export function verifyActualChangedFiles(
  before: WorkspaceSnapshot,
  after: WorkspaceSnapshot,
  allowedWritePaths: string[],
): ScopeVerificationResult {
  const beforeByPath = new Map(before.entries.map(entry => [entry.path, entry]));
  const afterByPath = new Map(after.entries.map(entry => [entry.path, entry]));
  const allPaths = [...new Set([...beforeByPath.keys(), ...afterByPath.keys()])].sort();
  const actualChangedFiles = allPaths.filter(path => {
    const previous = beforeByPath.get(path);
    const current = afterByPath.get(path);
    return previous === undefined || current === undefined || entryKey(previous) !== entryKey(current);
  });
  const allowed = new Set(allowedWritePaths.map(normalized));
  const unauthorizedFiles = actualChangedFiles.filter(path => !allowed.has(path));
  return {
    status: unauthorizedFiles.length === 0 ? 'passed' : 'scope_violation',
    actualChangedFiles,
    unauthorizedFiles,
  };
}

export async function deriveAllowedWritePaths(input: {
  workspaceRoot: string;
  solutionOption: SolutionOptionV1;
}): Promise<string[]> {
  const paths = new Set<string>();
  for (const reference of input.solutionOption.repoRefs) {
    const locator = parseRepoReference(reference);
    if (!locator.path || isAbsolute(locator.path)) {
      throw new Error(`allowedWritePaths requires safe relative repoRefs: ${reference}`);
    }
    const normalizedPath = normalized(locator.path);
    if (normalizedPath.split('/').some(segment => segment === '..' || segment === '.')) {
      throw new Error(`allowedWritePaths rejects unsafe repoRef: ${reference}`);
    }
    if (!normalizedPath.startsWith('src/data/') || !normalizedPath.endsWith('.json')) continue;
    const target = safePath(input.workspaceRoot, normalizedPath);
    const stat = await lstat(target);
    if (!stat.isFile()) throw new Error(`allowedWritePaths target must be a regular file: ${normalizedPath}`);
    paths.add(normalizedPath);
  }
  if (paths.size === 0) {
    throw new Error('unable to determine configuration allowedWritePaths from accepted option repoRefs');
  }
  return [...paths].sort();
}
