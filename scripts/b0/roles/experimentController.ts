import { createHash, randomBytes } from 'node:crypto';
import {
  B0_ALLOWED_CANDIDATE_PATH_GLOBS,
  B0_FORBIDDEN_PATH_GLOBS,
  type B0Manifest,
  type SeedBundle,
} from '../types';
import { sha256Hex, stableJsonHash } from '../hash';
import { captureSourceFingerprint, type SourceFingerprint } from '../sourceFingerprint';
import { fixtureSetFingerprint, loadSeedBundle } from './fixtureBuilder';
import { transition, type B0State } from '../stateMachine';

export type AbPairMapping = {
  sampleId: string;
  pairKey: string;
  /** Which real arm is exposed as anonymous A. */
  armA: 'baseline' | 'candidate';
  armB: 'baseline' | 'candidate';
};

export type ControllerPrivateStore = {
  labels: Record<string, unknown>;
  /** pairKey -> true identity. Never sent to blind reviewer. */
  abMap: Record<string, AbPairMapping>;
};

export type SealedExperiment = {
  state: B0State;
  manifest: B0Manifest;
  privateStore: ControllerPrivateStore;
  seedBundle: SeedBundle;
};

function catalogFingerprintStub(): string {
  return createHash('sha256').update('formal-catalog-readonly-b0').digest('hex');
}

/** Deterministic anonymous A/B orientation for a sample within a run. */
export function anonymousArmOrder(
  runId: string,
  sampleId: string,
): ['baseline', 'candidate'] | ['candidate', 'baseline'] {
  const h = sha256Hex(`${runId}:${sampleId}:ab`);
  return parseInt(h.slice(0, 8), 16) % 2 === 0
    ? ['baseline', 'candidate']
    : ['candidate', 'baseline'];
}

export function buildPrivateAbMap(
  runId: string,
  sampleIds: string[],
): ControllerPrivateStore['abMap'] {
  const abMap: ControllerPrivateStore['abMap'] = {};
  let i = 0;
  for (const sampleId of sampleIds) {
    const pairKey = `P${i}`;
    const [armA, armB] = anonymousArmOrder(runId, sampleId);
    abMap[pairKey] = { sampleId, pairKey, armA, armB };
    i += 1;
  }
  return abMap;
}

export function sealExperiment(options?: {
  runId?: string;
  labels?: Record<string, unknown>;
  fingerprint?: SourceFingerprint;
}): SealedExperiment {
  const fingerprint = options?.fingerprint ?? captureSourceFingerprint();
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

  const sampleIds = Object.keys(options?.labels ?? {});
  const abMap = buildPrivateAbMap(runId, sampleIds);

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
