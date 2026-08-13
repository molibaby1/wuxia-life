import type { P8Persona } from '../../src/p8/types';

export const B1_MANIFEST_VERSION = 'b1-manifest-v1' as const;
export const B1_EVIDENCE_VERSION = 'b1-evidence-v1' as const;
export const B1_DECISION_PATH = 'human-decision.json' as const;

export type B1ArtifactManifest = {
  schemaVersion: typeof B1_MANIFEST_VERSION;
  runId: string;
  sourceFingerprint: { head: string; branch: string; worktreeHash: string };
  baseCatalogHash: string;
  overlayHash: string;
  seedBundleHash: string;
  engineVersion: string;
  metricsVersion: string;
  evidenceSchemaVersion: typeof B1_EVIDENCE_VERSION;
  persona: P8Persona;
  seed: number;
  endAge: number;
  artifacts: {
    baseCatalog: 'base-catalog.json';
    overlay: 'overlay.json';
    rawTraces: ['raw-traces/baseline.json', 'raw-traces/candidate.json'];
    visibleTraces: ['player-visible-traces/baseline.json', 'player-visible-traces/candidate.json'];
    metrics: ['metrics/baseline.json', 'metrics/candidate.json'];
    evidenceIndex: 'evidence-index.json';
    runSummary: 'run-summary.json';
  };
};

export const B1_ARTIFACT_PATHS: readonly string[] = [
  'base-catalog.json',
  'overlay.json',
  'raw-traces/baseline.json',
  'raw-traces/candidate.json',
  'player-visible-traces/baseline.json',
  'player-visible-traces/candidate.json',
  'metrics/baseline.json',
  'metrics/candidate.json',
  'manifest.json',
];


export function createB1Manifest(input: Omit<B1ArtifactManifest, 'schemaVersion' | 'evidenceSchemaVersion' | 'artifacts'>): B1ArtifactManifest {
  return {
    ...input,
    schemaVersion: B1_MANIFEST_VERSION,
    evidenceSchemaVersion: B1_EVIDENCE_VERSION,
    artifacts: {
      baseCatalog: 'base-catalog.json',
      overlay: 'overlay.json',
      rawTraces: ['raw-traces/baseline.json', 'raw-traces/candidate.json'],
      visibleTraces: ['player-visible-traces/baseline.json', 'player-visible-traces/candidate.json'],
      metrics: ['metrics/baseline.json', 'metrics/candidate.json'],
      evidenceIndex: 'evidence-index.json',
      runSummary: 'run-summary.json',
    },
  };
}
