import { createHash, randomBytes } from 'node:crypto';
import {
  B0_ALLOWED_CANDIDATE_PATH_GLOBS,
  B0_FORBIDDEN_PATH_GLOBS,
  type B0Manifest,
  type SeedBundle,
} from '../types';
import { stableJsonHash } from '../hash';
import { captureSourceFingerprint } from '../sourceFingerprint';
import { fixtureSetFingerprint, loadSeedBundle } from './fixtureBuilder';
import { transition, type B0State } from '../stateMachine';

export type ControllerPrivateStore = {
  labels: Record<string, unknown>;
  abMap: Record<string, { sampleId: string; arm: 'baseline' | 'candidate' }>;
};

export type SealedExperiment = {
  state: B0State;
  manifest: B0Manifest;
  privateStore: ControllerPrivateStore;
  seedBundle: SeedBundle;
};

function catalogFingerprintStub(): string {
  // B0 does not mutate formal catalog; fingerprint is a frozen marker of "formal untouched".
  return createHash('sha256').update('formal-catalog-readonly-b0').digest('hex');
}

export function sealExperiment(options?: {
  runId?: string;
  labels?: Record<string, unknown>;
  baselineDir?: string;
}): SealedExperiment {
  const fingerprint = captureSourceFingerprint(options?.baselineDir);
  const seedBundle = loadSeedBundle();
  const fixtureHash = fixtureSetFingerprint();
  const runId = options?.runId ?? `b0-${Date.now()}-${randomBytes(3).toString('hex')}`;

  const manifest: B0Manifest = {
    runId,
    schemaVersion: 'b0-manifest-v1',
    sourceFingerprint: fingerprint,
    eventCatalogFingerprint: catalogFingerprintStub(),
    overlayFingerprint: fixtureHash,
    fixtureSetFingerprint: fixtureHash,
    seedBundleFingerprint: stableJsonHash(seedBundle),
    evaluatorVersions: {
      mechanicalAuditor: 'b0-mech-v1',
      blindReviewer: 'b0-blind-v1',
      redTeam: 'b0-red-v1',
      playerVisibleProjection: 'b0-visible-v1',
    },
    allowedCandidatePaths: [...B0_ALLOWED_CANDIDATE_PATH_GLOBS],
    forbiddenPaths: [...B0_FORBIDDEN_PATH_GLOBS],
    seedLayers: seedBundle.layers,
    abMapSealed: true,
  };

  // Anonymous A/B map — true identity stays private
  const abMap: ControllerPrivateStore['abMap'] = {};
  let i = 0;
  for (const sampleId of Object.keys(options?.labels ?? {})) {
    abMap[`A${i}`] = { sampleId, arm: 'candidate' };
    abMap[`B${i}`] = { sampleId, arm: 'baseline' };
    i += 1;
  }

  return {
    state: transition('draft', 'sealed'),
    manifest,
    privateStore: {
      labels: options?.labels ?? {},
      abMap,
    },
    seedBundle,
  };
}

export function advance(state: B0State, to: B0State): B0State {
  return transition(state, to);
}
