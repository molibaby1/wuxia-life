import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';
import { stableJsonHash, sha256Hex } from './hash';
import { B1_ARTIFACT_PATHS, B1_DECISION_PATH, type B1ArtifactManifest, B1_EVIDENCE_VERSION } from './manifest';

export type B1EvidenceIndex = {
  schemaVersion: typeof B1_EVIDENCE_VERSION;
  runId: string;
  manifestHash: string;
  sourceFingerprintHash: string;
  baseCatalogHash: string;
  overlayHash: string;
  seedBundleHash: string;
  artifactHashes: Record<string, string>;
  humanDecisionHash?: string | null;
  chainOk: boolean;
  breakReasons: string[];
};

const FORBIDDEN_VISIBLE_KEYS = new Set([
  'hiddenEffects', 'directEffects', 'outcomeEffects', 'finalState',
  'sampleId', 'personaId', 'seed', 'arm', 'eventId', 'mechanicalVerdict',
  'expectedDetections', 'knownBadLabel', 'candidateVerdict', 'baselineVerdict',
]);

function pathInside(root: string, child: string): boolean {
  const resolvedRoot = isAbsolute(root) ? root : join(process.cwd(), root);
  const resolvedChild = isAbsolute(child) ? child : join(process.cwd(), child);
  const rel = relative(resolvedRoot, resolvedChild);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function findForbiddenKeys(value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => findForbiddenKeys(item, `${path}[${index}]`));
  if (!value || typeof value !== 'object') return [];
  const result: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_VISIBLE_KEYS.has(key)) result.push(`${path}.${key}`);
    result.push(...findForbiddenKeys(nested, `${path}.${key}`));
  }
  return result;
}

export function hashArtifactFile(outDir: string, artifactPath: string): string {
  return sha256Hex(readFileSync(join(outDir, artifactPath)));
}

export function validateB1EvidenceChain(input: {
  outDir: string;
  manifest: B1ArtifactManifest;
  expectedSourceFingerprint?: B1ArtifactManifest['sourceFingerprint'];
  expectedArtifactHashes?: Record<string, string>;
}): B1EvidenceIndex {
  const { outDir, manifest, expectedSourceFingerprint, expectedArtifactHashes } = input;
  const reasons: string[] = [];
  if (manifest.schemaVersion !== 'b1-manifest-v1') reasons.push('invalid manifest schema');
  if (manifest.runId.length === 0) reasons.push('missing run id');
  if (expectedSourceFingerprint && stableJsonHash(expectedSourceFingerprint) !== stableJsonHash(manifest.sourceFingerprint)) {
    reasons.push('source fingerprint changed');
  }
  const artifactHashes: Record<string, string> = {};
  let humanDecisionHash: string | null = null;
  for (const artifactPath of B1_ARTIFACT_PATHS) {
    if (!pathInside(outDir, join(outDir, artifactPath))) {
      reasons.push(`artifact path escapes root: ${artifactPath}`);
      continue;
    }
    if (!existsSync(join(outDir, artifactPath))) {
      reasons.push(`missing artifact: ${artifactPath}`);
      continue;
    }
    artifactHashes[artifactPath] = hashArtifactFile(outDir, artifactPath);
    if (expectedArtifactHashes?.[artifactPath] && expectedArtifactHashes[artifactPath] !== artifactHashes[artifactPath]) {
      reasons.push(`artifact hash mismatch: ${artifactPath}`);
    }
  }
  const decisionPath = join(outDir, B1_DECISION_PATH);
  if (existsSync(decisionPath)) {
    artifactHashes[B1_DECISION_PATH] = hashArtifactFile(outDir, B1_DECISION_PATH);
    try {
      const decision = JSON.parse(readFileSync(decisionPath, 'utf8')) as Record<string, unknown>;
      const decisionHash = decision.decisionHash;
      const { decisionHash: _ignored, ...unsigned } = decision;
      if (typeof decisionHash !== 'string' || decisionHash !== stableJsonHash(unsigned)) {
        reasons.push('human decision hash mismatch');
      } else {
        humanDecisionHash = decisionHash;
      }
    } catch {
      reasons.push('invalid human decision');
    }
  }
  if (existsSync(join(outDir, 'player-visible-traces', 'baseline.json'))) {
    for (const arm of ['baseline', 'candidate']) {
      try {
        const visible = JSON.parse(readFileSync(join(outDir, 'player-visible-traces', `${arm}.json`), 'utf8'));
        const leaks = findForbiddenKeys(visible);
        for (const leak of leaks) reasons.push(`visible trace leak: ${arm}:${leak}`);
      } catch {
        reasons.push(`invalid visible trace: ${arm}`);
      }
    }
  }
  return {
    schemaVersion: B1_EVIDENCE_VERSION,
    runId: manifest.runId,
    manifestHash: stableJsonHash(manifest),
    sourceFingerprintHash: stableJsonHash(manifest.sourceFingerprint),
    baseCatalogHash: manifest.baseCatalogHash,
    overlayHash: manifest.overlayHash,
    seedBundleHash: manifest.seedBundleHash,
    artifactHashes,
    humanDecisionHash,
    chainOk: reasons.length === 0,
    breakReasons: reasons,
  };
}
