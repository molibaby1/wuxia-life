import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  DURABLE_EVIDENCE_PACKAGE_METADATA_PATH,
  loadValidDurableEvidenceCapsules,
} from './durableEvidenceIndex';

interface DurableEvidencePackageMetadata {
  schemaVersion: 'durable-evidence-package-v1';
  defaultRecentCount: number;
  locallyKnownCapsuleCount: number;
  includedCapsuleCount: number;
  includedSessionIds: Array<{ sessionId: string; reason: 'recent' | 'explicit' }>;
  includedEvidenceBytes: number;
}

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertNonNegativeSafeInteger(value: unknown, label: string): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
}

function parsePackageMetadata(value: unknown): DurableEvidencePackageMetadata {
  assertRecord(value, 'evidence package metadata');
  if (value.schemaVersion !== 'durable-evidence-package-v1') {
    throw new Error('unsupported evidence package metadata schemaVersion');
  }
  assertNonNegativeSafeInteger(value.defaultRecentCount, 'metadata.defaultRecentCount');
  assertNonNegativeSafeInteger(value.locallyKnownCapsuleCount, 'metadata.locallyKnownCapsuleCount');
  assertNonNegativeSafeInteger(value.includedCapsuleCount, 'metadata.includedCapsuleCount');
  assertNonNegativeSafeInteger(value.includedEvidenceBytes, 'metadata.includedEvidenceBytes');
  if (!Array.isArray(value.includedSessionIds)) {
    throw new Error('metadata.includedSessionIds must be an array');
  }
  const includedSessionIds = value.includedSessionIds.map((entry, index) => {
    assertRecord(entry, `metadata.includedSessionIds[${index}]`);
    if (typeof entry.sessionId !== 'string' || entry.sessionId.length === 0) {
      throw new Error(`metadata.includedSessionIds[${index}].sessionId must be a non-empty string`);
    }
    if (entry.reason !== 'recent' && entry.reason !== 'explicit') {
      throw new Error(`metadata.includedSessionIds[${index}].reason must be recent or explicit`);
    }
    return { sessionId: entry.sessionId, reason: entry.reason };
  });
  if (new Set(includedSessionIds.map(entry => entry.sessionId)).size !== includedSessionIds.length) {
    throw new Error('metadata.includedSessionIds contains duplicate session IDs');
  }
  return {
    schemaVersion: 'durable-evidence-package-v1',
    defaultRecentCount: value.defaultRecentCount,
    locallyKnownCapsuleCount: value.locallyKnownCapsuleCount,
    includedCapsuleCount: value.includedCapsuleCount,
    includedSessionIds,
    includedEvidenceBytes: value.includedEvidenceBytes,
  };
}

function assertExactSessionSet(expected: Set<string>, actual: Set<string>): void {
  const missing = [...expected].filter(sessionId => !actual.has(sessionId)).sort();
  const unexpected = [...actual].filter(sessionId => !expected.has(sessionId)).sort();
  if (missing.length > 0 || unexpected.length > 0) {
    const details = [
      missing.length > 0 ? `missing declared Capsules: ${missing.join(', ')}` : null,
      unexpected.length > 0 ? `unexpected extracted Capsules: ${unexpected.join(', ')}` : null,
    ].filter((detail): detail is string => detail !== null).join('; ');
    throw new Error(`packaged Capsule set mismatch: ${details}`);
  }
}

export async function verifyPackagedEvidence(repositoryRoot: string): Promise<Awaited<ReturnType<typeof loadValidDurableEvidenceCapsules>>> {
  const root = resolve(repositoryRoot);
  const metadata = parsePackageMetadata(JSON.parse(await readFile(resolve(root, DURABLE_EVIDENCE_PACKAGE_METADATA_PATH), 'utf8')));
  const capsules = await loadValidDurableEvidenceCapsules(root);
  const actualIds = new Set<string>();
  for (const capsule of capsules) {
    if (actualIds.has(capsule.manifest.sessionId)) {
      throw new Error(`extracted Capsules contain duplicate session ID: ${capsule.manifest.sessionId}`);
    }
    actualIds.add(capsule.manifest.sessionId);
  }
  const expectedIds = new Set(metadata.includedSessionIds.map(item => item.sessionId));
  assertExactSessionSet(expectedIds, actualIds);
  if (metadata.includedCapsuleCount !== actualIds.size) {
    throw new Error(`metadata.includedCapsuleCount does not match extracted Capsules: ${metadata.includedCapsuleCount} != ${actualIds.size}`);
  }
  const actualEvidenceBytes = capsules.reduce((total, capsule) => total + capsule.capsuleBytes, 0);
  if (metadata.includedEvidenceBytes !== actualEvidenceBytes) {
    throw new Error(`metadata.includedEvidenceBytes does not match extracted Capsules: ${metadata.includedEvidenceBytes} != ${actualEvidenceBytes}`);
  }
  if (metadata.locallyKnownCapsuleCount < metadata.includedCapsuleCount) {
    throw new Error('metadata.locallyKnownCapsuleCount cannot be less than includedCapsuleCount');
  }
  return capsules;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let repositoryRoot = process.cwd();
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--repository-root') repositoryRoot = args[++index] ?? (() => { throw new Error('--repository-root requires a value'); })();
    else throw new Error(`unknown argument: ${args[index]}`);
  }
  const capsules = await verifyPackagedEvidence(repositoryRoot);
  console.log(`Verified packaged Durable Evidence Capsules: ${capsules.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
