import { getWorldProfile } from '../narrative/worldProfile';
import type {
  FactionIdentityConsequencePattern,
  ResolvedConsequencePattern,
} from '../narrative/profile/types';
import type { GameState } from '../types/eventTypes';
import { flagIsActive, readMergedFlags } from './stateAccess';

export interface ActiveFactionConsequence {
  pattern: FactionIdentityConsequencePattern;
  intensity: number;
  source: string;
}

export function resolveActiveFactionConsequences(
  state: GameState,
  worldId = 'wuxia',
): ActiveFactionConsequence[] {
  const patterns = getWorldProfile(worldId).factionIdentityConsequencePatterns ?? [];
  const flags = readMergedFlags(state);
  const active: ActiveFactionConsequence[] = [];

  for (const pattern of patterns) {
    const triggerFlag = pattern.triggerFlags?.find(flag => flagIsActive(flags, flag));
    if (!triggerFlag) {
      continue;
    }
    active.push({
      pattern,
      intensity: pattern.baseIntensity,
      source: `flag:${triggerFlag}`,
    });
  }

  return active;
}

export function toResolvedFactionPatterns(
  active: ActiveFactionConsequence[],
): ResolvedConsequencePattern[] {
  return active.map(item => ({
    patternId: item.pattern.id,
    label: item.pattern.label,
    kind: item.pattern.consequenceKind,
    intensity: item.intensity,
    source: item.source,
  }));
}
