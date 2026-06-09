import { getWorldProfile } from '../narrative/worldProfile';
import type {
  InheritanceChannelPattern,
  ResolvedConsequencePattern,
} from '../narrative/profile/types';
import type { GameState } from '../types/eventTypes';
import { flagIsActive, inferSuccessorQuality, lifePathSignalActive, readMergedFlags } from './stateAccess';
import { getMaxSuccessorQuality, resolveActiveSuccessorRoles } from './successorRoles';

export interface ActiveInheritanceChannel {
  pattern: InheritanceChannelPattern;
  intensity: number;
  source: string;
  stabilityPenalty: number;
}

function channelMatches(
  pattern: InheritanceChannelPattern,
  state: GameState,
  flags: Record<string, unknown>,
  successorQuality: number,
): ActiveInheritanceChannel | null {
  const triggerFlag = pattern.triggerFlags?.find(flag => flagIsActive(flags, flag));
  const lifePathSignal = pattern.lifePathSignals?.find(signal => lifePathSignalActive(state, signal));
  if (!triggerFlag && !lifePathSignal) {
    return null;
  }

  let stabilityPenalty = 0;
  const required = pattern.requiredQualityForStability ?? 0;
  if (
    (pattern.polarity === 'burden' || pattern.polarity === 'mixed') &&
    required > 0 &&
    successorQuality < required
  ) {
    stabilityPenalty = (required - successorQuality) * pattern.baseIntensity;
  }

  let intensity = pattern.baseIntensity;
  if (pattern.polarity === 'asset' && successorQuality > required) {
    intensity = Math.min(1, intensity * (0.85 + successorQuality * 0.3));
  }

  return {
    pattern,
    intensity,
    source: triggerFlag ? `flag:${triggerFlag}` : `lifePath:${lifePathSignal}`,
    stabilityPenalty,
  };
}

export function resolveActiveInheritanceChannels(
  state: GameState,
  worldId = 'wuxia',
): ActiveInheritanceChannel[] {
  const patterns = getWorldProfile(worldId).inheritanceChannelPatterns ?? [];
  const flags = readMergedFlags(state);
  const roles = resolveActiveSuccessorRoles(state, worldId);
  const successorQuality = Math.max(inferSuccessorQuality(state), getMaxSuccessorQuality(roles));
  const active: ActiveInheritanceChannel[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    if (seen.has(pattern.id)) {
      continue;
    }
    const match = channelMatches(pattern, state, flags, successorQuality);
    if (match) {
      seen.add(pattern.id);
      active.push(match);
    }
  }

  return active;
}

export function toResolvedInheritanceChannels(
  active: ActiveInheritanceChannel[],
): ResolvedConsequencePattern[] {
  return active.map(item => ({
    patternId: item.pattern.id,
    label: item.pattern.label,
    kind: item.pattern.polarity,
    intensity: item.intensity,
    source: item.source,
  }));
}

export function aggregateStabilityPenalty(active: ActiveInheritanceChannel[]): number {
  return active.reduce((sum, item) => sum + item.stabilityPenalty, 0);
}
