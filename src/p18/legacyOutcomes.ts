import { getWorldProfile } from '../narrative/worldProfile';
import type { LegacyOutcomePattern } from '../narrative/profile/types';
import type { GameState } from '../types/eventTypes';
import { aggregateStabilityPenalty, resolveActiveInheritanceChannels } from './inheritanceChannels';
import { collectUnmetCultivationPressure } from './cultivationPressure';
import { flagIsActive, inferSuccessorQuality, lifePathSignalActive, readMergedFlags } from './stateAccess';
import { getMaxSuccessorQuality, resolveActiveSuccessorRoles } from './successorRoles';

export interface ActiveLegacyOutcome {
  pattern: LegacyOutcomePattern;
  intensity: number;
  source: string;
}

function outcomeMatches(
  pattern: LegacyOutcomePattern,
  state: GameState,
  flags: Record<string, unknown>,
  unmetCount: number,
  stabilityPenalty: number,
  successorQuality: number,
): ActiveLegacyOutcome | null {
  if (pattern.outcomeKind === 'underinvestment' && unmetCount > 0) {
    return {
      pattern,
      intensity: Math.min(1, pattern.baseIntensity * (0.5 + unmetCount * 0.15)),
      source: 'unmet_cultivation_pressure',
    };
  }
  if (
    pattern.outcomeKind === 'burden_without_capability' &&
    stabilityPenalty > 0.15
  ) {
    return {
      pattern,
      intensity: Math.min(1, pattern.baseIntensity + stabilityPenalty * 0.5),
      source: 'burden_stability_penalty',
    };
  }

  const triggerFlag = pattern.triggerFlags?.find(flag => flagIsActive(flags, flag));
  if (triggerFlag) {
    return {
      pattern,
      intensity: pattern.baseIntensity,
      source: `flag:${triggerFlag}`,
    };
  }
  const lifePathSignal = pattern.lifePathSignals?.find(signal => lifePathSignalActive(state, signal));
  if (lifePathSignal) {
    if (pattern.outcomeKind === 'transmission_success' && successorQuality < 0.45) {
      return null;
    }
    return {
      pattern,
      intensity: pattern.baseIntensity,
      source: `lifePath:${lifePathSignal}`,
    };
  }

  return null;
}

export function resolveActiveLegacyOutcomes(
  state: GameState,
  worldId = 'wuxia',
): ActiveLegacyOutcome[] {
  const patterns = getWorldProfile(worldId).legacyOutcomePatterns ?? [];
  const flags = readMergedFlags(state);
  const unmet = collectUnmetCultivationPressure(state, worldId);
  const channels = resolveActiveInheritanceChannels(state, worldId);
  const stabilityPenalty = aggregateStabilityPenalty(channels);
  const roles = resolveActiveSuccessorRoles(state, worldId);
  const successorQuality = Math.max(inferSuccessorQuality(state), getMaxSuccessorQuality(roles));
  const active: ActiveLegacyOutcome[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    if (seen.has(pattern.id)) {
      continue;
    }
    const match = outcomeMatches(
      pattern,
      state,
      flags,
      unmet.length,
      stabilityPenalty,
      successorQuality,
    );
    if (match) {
      seen.add(pattern.id);
      active.push(match);
    }
  }

  return active;
}

export function computeSuccessionQualityScore(
  state: GameState,
  worldId = 'wuxia',
): number {
  const roles = resolveActiveSuccessorRoles(state, worldId);
  const base = Math.max(inferSuccessorQuality(state), getMaxSuccessorQuality(roles));
  const outcomes = resolveActiveLegacyOutcomes(state, worldId);
  const delta = outcomes.reduce((sum, item) => sum + item.pattern.successionQualityDelta * item.intensity, 0);
  const unmet = collectUnmetCultivationPressure(state, worldId);
  const unmetPenalty =
    unmet.length === 0 ? 0 : unmet.reduce((sum, item) => sum + item.pressure, 0) / unmet.length * 0.2;
  const stabilityPenalty = aggregateStabilityPenalty(resolveActiveInheritanceChannels(state, worldId)) * 0.15;
  return Math.max(0, Math.min(1, base + delta - unmetPenalty - stabilityPenalty));
}
