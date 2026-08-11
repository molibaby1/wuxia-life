import type { AdversarialRecipe, B0RawTrace, KnownBadRecipe } from '../types';
import {
  synthesizeAdversarialProbe,
  synthesizeKnownBadTrace,
} from '../trace/synthesizeKnownBadTrace';

export type SimulatedPair = {
  sampleId: string;
  baseline: B0RawTrace;
  candidate: B0RawTrace;
  proposedPaths?: string[];
  leakedHoldoutSeed?: number;
  crossReviewPayload?: unknown;
};

export function simulateKnownBadPair(
  sampleId: string,
  recipe: KnownBadRecipe,
): SimulatedPair {
  return {
    sampleId,
    baseline: synthesizeKnownBadTrace(sampleId, 'baseline', recipe),
    candidate: synthesizeKnownBadTrace(sampleId, 'candidate', recipe),
  };
}

export function simulateAdversarialPair(
  sampleId: string,
  recipe: AdversarialRecipe,
  holdoutSeeds: number[],
): SimulatedPair {
  const probe = synthesizeAdversarialProbe(sampleId, recipe, holdoutSeeds);
  const healthy: KnownBadRecipe = {
    schemaVersion: 'b0-known-bad-recipe-v1',
    badId: 'control_healthy',
    mode: 'control_healthy',
    personaId: 'p8-balanced-wei',
    seed: 9001,
  };
  return {
    sampleId,
    baseline: synthesizeKnownBadTrace(sampleId, 'baseline', healthy),
    candidate: probe.rawTrace,
    proposedPaths: probe.proposedPaths,
    leakedHoldoutSeed: probe.leakedHoldoutSeed,
    crossReviewPayload: probe.crossReviewPayload,
  };
}

export function simulateControl(sampleId: string, recipe: KnownBadRecipe): SimulatedPair {
  const trace = synthesizeKnownBadTrace(sampleId, 'candidate', {
    ...recipe,
    mode: 'control_healthy',
  });
  return {
    sampleId,
    baseline: trace,
    candidate: synthesizeKnownBadTrace(sampleId, 'candidate', {
      ...recipe,
      mode: 'control_healthy',
    }),
  };
}
