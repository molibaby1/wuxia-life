import { copyFile, lstat, mkdir, open, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { canonicalJson, sha256Hex } from '../phase0/provenance';

export interface ConfigurationEvidenceEntry {
  path: string;
  status: 'present' | 'missing';
  sha256?: string;
  byteLength?: number;
}

export interface ConfigurationBeforeEvidence {
  schemaVersion: 'configuration-before-evidence-v1';
  allowedWritePaths: string[];
  entries: ConfigurationEvidenceEntry[];
}

export interface ConfigurationAfterEvidence {
  schemaVersion: 'configuration-after-evidence-v1';
  actualChangedFiles: string[];
  entries: ConfigurationEvidenceEntry[];
}

function safePath(root: string, path: string): string {
  if (!path || isAbsolute(path)) throw new Error(`configuration evidence path must be relative: ${path}`);
  const resolvedRoot = resolve(root);
  const target = resolve(resolvedRoot, path);
  const escaped = relative(resolvedRoot, target);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
    throw new Error(`configuration evidence path escapes workspace: ${path}`);
  }
  return target;
}

async function writeCreateOnly(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(content, 'utf8');
  } finally {
    await handle.close();
  }
}

async function captureEntries(input: {
  workspaceRoot: string;
  destinationRoot: string;
  paths: string[];
  destinationDirectory: 'before' | 'after';
}): Promise<ConfigurationEvidenceEntry[]> {
  const entries: ConfigurationEvidenceEntry[] = [];
  for (const path of [...new Set(input.paths)].sort()) {
    const source = safePath(input.workspaceRoot, path);
    const destination = safePath(join(input.destinationRoot, input.destinationDirectory), path);
    try {
      const sourceStat = await lstat(source);
      if (!sourceStat.isFile()) throw new Error(`configuration evidence target must be a regular file: ${path}`);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination);
      const bytes = await readFile(destination);
      entries.push({ path, status: 'present', sha256: sha256Hex(bytes), byteLength: bytes.byteLength });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      entries.push({ path, status: 'missing' });
    }
  }
  return entries;
}

export async function captureConfigurationBeforeEvidence(input: {
  workspaceRoot: string;
  destinationRoot: string;
  allowedWritePaths: string[];
}): Promise<ConfigurationBeforeEvidence> {
  const allowedWritePaths = [...new Set(input.allowedWritePaths)].sort();
  const entries = await captureEntries({
    workspaceRoot: input.workspaceRoot,
    destinationRoot: input.destinationRoot,
    paths: allowedWritePaths,
    destinationDirectory: 'before',
  });
  const manifest: ConfigurationBeforeEvidence = {
    schemaVersion: 'configuration-before-evidence-v1',
    allowedWritePaths,
    entries,
  };
  await writeCreateOnly(join(input.destinationRoot, 'before-manifest.json'), `${canonicalJson(manifest)}\n`);
  return manifest;
}

export async function captureConfigurationAfterEvidence(input: {
  workspaceRoot: string;
  destinationRoot: string;
  actualChangedFiles: string[];
}): Promise<ConfigurationAfterEvidence> {
  const actualChangedFiles = [...new Set(input.actualChangedFiles)].sort();
  const entries = await captureEntries({
    workspaceRoot: input.workspaceRoot,
    destinationRoot: input.destinationRoot,
    paths: actualChangedFiles,
    destinationDirectory: 'after',
  });
  const manifest: ConfigurationAfterEvidence = {
    schemaVersion: 'configuration-after-evidence-v1',
    actualChangedFiles,
    entries,
  };
  await writeCreateOnly(join(input.destinationRoot, 'after-manifest.json'), `${canonicalJson(manifest)}\n`);
  return manifest;
}
