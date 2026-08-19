import { createHash } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import {
  copyFile,
  lstat,
  mkdir,
  open,
  readFile,
  readlink,
  readdir,
  symlink,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { canonicalJson, sha256Hex } from '../phase0/provenance';

const EXPERIMENT_ROOT = '.tmp/evolution/problem-agnostic-agent-solution-loop';

export interface PrepareAgentWorkspaceInput {
  authoritativeRoot: string;
  destinationRoot: string;
  jobKind: 'solution' | 'reviewer';
  artifactSourceRoot?: string;
  artifactRelativePaths?: string[];
}

interface ManifestEntry {
  path: string;
  objectKind: 'regular_file' | 'symlink';
  sha256: string;
}

interface WorkspaceManifest {
  schemaVersion: 'agent-workspace-manifest-v1';
  jobKind: PrepareAgentWorkspaceInput['jobKind'];
  authoritativeFingerprintSha256: string;
  workspaceBaselineFingerprintSha256: string;
  entries: ManifestEntry[];
}

export interface PreparedAgentWorkspace {
  workspaceRoot: string;
  authoritativeFingerprintSha256: string;
  workspaceBaselineFingerprintSha256: string;
  manifestPath: string;
}

function normalized(relativePath: string): string {
  return relativePath.split(sep).join('/');
}

function isExcluded(relativePath: string): boolean {
  const path = normalized(relativePath);
  if (!path) return false;
  if (path === EXPERIMENT_ROOT || path.startsWith(`${EXPERIMENT_ROOT}/`)) return true;
  if (
    path.startsWith('public/reports/')
    && path !== 'public/reports/manifest.json'
    && (path.endsWith('.html') || path.endsWith('.json'))
  ) return true;
  if (path === '.tmp/evolution' || path.startsWith('.tmp/evolution/')) return true;
  return path.split('/').some(part =>
    part === '.git'
    || part === '.omx'
    || part === '.superpowers'
    || part === 'artifacts'
    || part === 'agent_docs'
    || part === '.tmp'
    || part === 'node_modules'
    || part === 'dist'
    || part === '.env'
    || part.startsWith('.env.'));
}

function safePath(root: string, relativePath: string): string {
  const resolvedRoot = resolve(root);
  if (relativePath === '.' || relativePath === '') return resolvedRoot;
  const target = resolve(resolvedRoot, relativePath);
  const escaped = relative(resolvedRoot, target);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
    throw new Error(`path escapes workspace: ${relativePath}`);
  }
  return target;
}

async function collectEntries(root: string, current = ''): Promise<ManifestEntry[]> {
  const directory = safePath(root, current || '.');
  const entries = await readdir(directory, { withFileTypes: true });
  const result: ManifestEntry[] = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relativePath = normalized(current ? join(current, entry.name) : entry.name);
    if (entry.name === '.DS_Store' || isExcluded(relativePath)) continue;
    const absolutePath = safePath(root, relativePath);
    if (entry.isDirectory()) {
      result.push(...await collectEntries(root, relativePath));
    } else if (entry.isFile()) {
      result.push({
        path: relativePath,
        objectKind: 'regular_file',
        sha256: sha256Hex(await readFile(absolutePath)),
      });
    } else if (entry.isSymbolicLink()) {
      result.push({
        path: relativePath,
        objectKind: 'symlink',
        sha256: sha256Hex(await readlink(absolutePath, { encoding: 'buffer' })),
      });
    } else {
      throw new Error(`unsupported source object: ${relativePath}`);
    }
  }
  return result;
}

async function fingerprint(root: string): Promise<{ hash: string; entries: ManifestEntry[] }> {
  const entries = await collectEntries(root);
  return { hash: createHash('sha256').update(canonicalJson(entries)).digest('hex'), entries };
}

async function assertSafeSymlink(root: string, linkPath: string, linkText: string): Promise<void> {
  if (isAbsolute(linkText)) throw new Error(`absolute symlink is not allowed: ${linkPath}`);
  const target = resolve(dirname(linkPath), linkText);
  const escaped = relative(resolve(root), target);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
    throw new Error(`symlink escapes workspace: ${linkPath}`);
  }
}

async function copyTree(sourceRoot: string, destinationRoot: string, current = ''): Promise<void> {
  const sourceDirectory = safePath(sourceRoot, current || '.');
  const entries = await readdir(sourceDirectory, { withFileTypes: true });
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relativePath = normalized(current ? join(current, entry.name) : entry.name);
    if (entry.name === '.DS_Store' || isExcluded(relativePath)) continue;
    const source = safePath(sourceRoot, relativePath);
    const destination = safePath(destinationRoot, relativePath);
    if (entry.isDirectory()) {
      await mkdir(destination, { recursive: true });
      await copyTree(sourceRoot, destinationRoot, relativePath);
    } else if (entry.isFile()) {
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination, fsConstants.COPYFILE_EXCL);
    } else if (entry.isSymbolicLink()) {
      const linkText = await readlink(source);
      await assertSafeSymlink(sourceRoot, source, linkText);
      await assertSafeSymlink(destinationRoot, destination, linkText);
      await mkdir(dirname(destination), { recursive: true });
      await symlink(linkText, destination);
    } else {
      throw new Error(`unsupported source object: ${relativePath}`);
    }
  }
}

async function copyArtifacts(input: PrepareAgentWorkspaceInput, workspaceRoot: string): Promise<void> {
  if (!input.artifactSourceRoot || !input.artifactRelativePaths) return;
  for (const relativePath of input.artifactRelativePaths) {
    const source = safePath(input.artifactSourceRoot, relativePath);
    const destination = safePath(workspaceRoot, relativePath);
    const stat = await lstat(source);
    if (!stat.isFile()) throw new Error(`agent source artifact must be a regular file: ${relativePath}`);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination, fsConstants.COPYFILE_EXCL);
  }
}

async function writeCreateOnly(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(`${canonicalJson(value)}\n`);
  } finally {
    await handle.close();
  }
}

export async function captureAuthoritativeFingerprint(authoritativeRoot: string): Promise<string> {
  return (await fingerprint(resolve(authoritativeRoot))).hash;
}

export async function assertAuthoritativeFingerprintUnchanged(
  authoritativeRoot: string,
  expectedFingerprint: string,
): Promise<void> {
  const actual = await captureAuthoritativeFingerprint(authoritativeRoot);
  if (actual !== expectedFingerprint) {
    throw new Error(`authoritative repository fingerprint changed: expected ${expectedFingerprint}, got ${actual}`);
  }
}

export async function prepareAgentWorkspace(
  input: PrepareAgentWorkspaceInput,
): Promise<PreparedAgentWorkspace> {
  const authoritativeRoot = resolve(input.authoritativeRoot);
  const destinationRoot = resolve(input.destinationRoot);
  const workspaceRoot = join(destinationRoot, input.jobKind);
  const manifestPath = join(workspaceRoot, '.agent-workspace-manifest.json');
  const authoritative = await fingerprint(authoritativeRoot);
  await mkdir(destinationRoot, { recursive: true });
  await mkdir(workspaceRoot, { recursive: false });
  await copyTree(authoritativeRoot, workspaceRoot);
  await copyArtifacts(input, workspaceRoot);
  const workspace = await fingerprint(workspaceRoot);
  const manifest: WorkspaceManifest = {
    schemaVersion: 'agent-workspace-manifest-v1',
    jobKind: input.jobKind,
    authoritativeFingerprintSha256: authoritative.hash,
    workspaceBaselineFingerprintSha256: workspace.hash,
    entries: workspace.entries,
  };
  await writeCreateOnly(manifestPath, manifest);
  return {
    workspaceRoot,
    authoritativeFingerprintSha256: authoritative.hash,
    workspaceBaselineFingerprintSha256: workspace.hash,
    manifestPath,
  };
}
