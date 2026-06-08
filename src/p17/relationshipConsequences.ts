import { getWorldProfile } from '../narrative/worldProfile';
import type {
  RelationshipConsequencePattern,
  ResolvedConsequencePattern,
} from '../narrative/profile/types';
import type { GameState } from '../types/eventTypes';
import { flagIsActive, lifePathSignalActive, readMergedFlags } from './stateAccess';

export interface ActiveRelationshipConsequence {
  pattern: RelationshipConsequencePattern;
  intensity: number;
  source: string;
}

function patternMatches(
  pattern: RelationshipConsequencePattern,
  state: GameState,
  flags: Record<string, unknown>,
): ActiveRelationshipConsequence | null {
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
    const lifePath = state.lifePath;
    let countBoost = 1;
    if (lifePathSignal === 'sworn_enemy') {
      countBoost = Math.min(1.5, 0.5 + (lifePath?.commitments?.swornEnemies?.length ?? 0) * 0.25);
    }
    if (lifePathSignal === 'enemy') {
      countBoost = Math.min(1.4, 0.5 + (lifePath?.relationships?.enemies?.length ?? 0) * 0.2);
    }
    return {
      pattern,
      intensity: Math.min(1, pattern.baseIntensity * countBoost),
      source: `lifePath:${lifePathSignal}`,
    };
  }

  return null;
}

export function resolveActiveRelationshipConsequences(
  state: GameState,
  worldId = 'wuxia',
): ActiveRelationshipConsequence[] {
  const patterns = getWorldProfile(worldId).relationshipConsequencePatterns ?? [];
  const flags = readMergedFlags(state);
  const active: ActiveRelationshipConsequence[] = [];
  const seen = new Set<string>();

  for (const pattern of patterns) {
    if (seen.has(pattern.id)) {
      continue;
    }
    const match = patternMatches(pattern, state, flags);
    if (match) {
      seen.add(pattern.id);
      active.push(match);
    }
  }

  return active;
}

export function toResolvedRelationshipPatterns(
  active: ActiveRelationshipConsequence[],
): ResolvedConsequencePattern[] {
  return active.map(item => ({
    patternId: item.pattern.id,
    label: item.pattern.label,
    kind: item.pattern.consequenceKind,
    intensity: item.intensity,
    source: item.source,
  }));
}
