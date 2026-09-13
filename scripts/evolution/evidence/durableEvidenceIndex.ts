import { lstat, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { canonicalJson } from '../phase0/provenance';
import {
  verifyDurableEvidenceCapsule,
  type DurableEvidenceCapsuleManifest,
} from './durableEvidenceCapsule';

export const DURABLE_EVIDENCE_ROOT = 'artifacts/evolution/run-evidence';
export const DURABLE_EVIDENCE_INDEX_PATH = `${DURABLE_EVIDENCE_ROOT}/index.json`;
export const DURABLE_EVIDENCE_PACKAGE_METADATA_PATH = `${DURABLE_EVIDENCE_ROOT}/evidence-package.json`;

export interface DurableEvidenceIndexEntry {
  sessionId: string;
  sourceRunRef: string;
  createdAt: string;
  capsulePath: string;
  capsuleBytes: number;
  importantEvents: DurableEvidenceCapsuleManifest['importantEvents'];
}

export interface DurableEvidenceIndex {
  schemaVersion: 'durable-evidence-index-v1';
  generatedAt: string;
  capsuleCount: number;
  capsules: DurableEvidenceIndexEntry[];
}

function byRecency(left: Pick<DurableEvidenceIndexEntry, 'createdAt' | 'sessionId'>, right: Pick<DurableEvidenceIndexEntry, 'createdAt' | 'sessionId'>): number {
  return right.createdAt.localeCompare(left.createdAt) || right.sessionId.localeCompare(left.sessionId);
}

async function directoryEntries(root: string): Promise<string[]> {
  try {
    return (await readdir(root, { withFileTypes: true }))
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.staging-'))
      .map(entry => entry.name)
      .sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

async function capsuleBytes(root: string): Promise<number> {
  const entries = await readdir(root, { withFileTypes: true });
  let total = 0;
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) total += await capsuleBytes(path);
    else if (entry.isFile()) total += (await lstat(path)).size;
    else throw new Error(`Capsule contains unsupported filesystem entry: ${path}`);
  }
  return total;
}

export async function loadValidDurableEvidenceCapsules(repositoryRoot: string): Promise<Array<{ root: string; manifest: DurableEvidenceCapsuleManifest; capsuleBytes: number }>> {
  const root = resolve(repositoryRoot, DURABLE_EVIDENCE_ROOT);
  const capsules: Array<{ root: string; manifest: DurableEvidenceCapsuleManifest; capsuleBytes: number }> = [];
  for (const name of await directoryEntries(root)) {
    const capsuleRoot = join(root, name);
    try {
      await lstat(join(capsuleRoot, 'manifest.json'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw error;
    }
    const manifest = await verifyDurableEvidenceCapsule(capsuleRoot);
    if (manifest.capsuleId !== name) throw new Error(`Capsule directory/name mismatch: ${name} != ${manifest.capsuleId}`);
    capsules.push({ root: capsuleRoot, manifest, capsuleBytes: await capsuleBytes(capsuleRoot) });
  }
  return capsules.sort((left, right) => byRecency(left.manifest, right.manifest));
}

export async function buildDurableEvidenceIndex(input: {
  repositoryRoot: string;
  generatedAt?: string;
}): Promise<{ indexPath: string; index: DurableEvidenceIndex }> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const capsules = await loadValidDurableEvidenceCapsules(repositoryRoot);
  const index: DurableEvidenceIndex = {
    schemaVersion: 'durable-evidence-index-v1',
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    capsuleCount: capsules.length,
    capsules: capsules.map(({ manifest, capsuleBytes }) => ({
      sessionId: manifest.sessionId,
      sourceRunRef: manifest.sourceRunRef,
      createdAt: manifest.createdAt,
      capsulePath: `${DURABLE_EVIDENCE_ROOT}/${manifest.capsuleId}`,
      capsuleBytes,
      importantEvents: manifest.importantEvents,
    })),
  };
  const indexPath = join(repositoryRoot, DURABLE_EVIDENCE_INDEX_PATH);
  await mkdir(resolve(indexPath, '..'), { recursive: true });
  await writeFile(indexPath, `${canonicalJson(index)}\n`, 'utf8');
  return { indexPath, index };
}

export async function readDurableEvidenceIndex(repositoryRoot: string): Promise<DurableEvidenceIndex> {
  return JSON.parse(await readFile(join(resolve(repositoryRoot), DURABLE_EVIDENCE_INDEX_PATH), 'utf8')) as DurableEvidenceIndex;
}

export function selectDurableEvidenceCapsules(input: {
  capsules: Array<{ root: string; manifest: DurableEvidenceCapsuleManifest; capsuleBytes: number }>;
  explicitSessionIds?: string[];
  recentCount?: number;
}): Array<{ root: string; manifest: DurableEvidenceCapsuleManifest; capsuleBytes: number; reason: 'recent' | 'explicit' }> {
  const recentCount = input.recentCount ?? 5;
  const sorted = [...input.capsules].sort((left, right) => byRecency(left.manifest, right.manifest));
  const selected = new Map<string, { root: string; manifest: DurableEvidenceCapsuleManifest; capsuleBytes: number; reason: 'recent' | 'explicit' }>();
  for (const capsule of sorted.slice(0, recentCount)) {
    selected.set(capsule.manifest.sessionId, { ...capsule, reason: 'recent' });
  }
  for (const sessionId of [...new Set(input.explicitSessionIds ?? [])].sort()) {
    const capsule = sorted.find(candidate => candidate.manifest.sessionId === sessionId);
    if (!capsule) throw new Error(`requested Durable Evidence Capsule does not exist or is invalid: ${sessionId}`);
    selected.set(sessionId, { ...capsule, reason: selected.has(sessionId) ? 'recent' : 'explicit' });
  }
  return [...selected.values()].sort((left, right) => byRecency(left.manifest, right.manifest));
}

