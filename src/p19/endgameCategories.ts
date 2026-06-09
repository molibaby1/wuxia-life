import type {
  EndgameCategoryConfig,
  EndgameCategoryReport,
  ResolvedEndgameCategory,
} from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import type { GameState } from '../types/eventTypes';
import {
  inferAchievementScore,
  inferBurdenScore,
  inferFactionScore,
  inferLegacyScore,
  inferRelationshipScore,
  patternTriggersActive,
} from './stateAccess';

const TRAJECTORY_KEYS = [
  'relationshipScore',
  'factionScore',
  'legacyScore',
  'achievementScore',
  'burdenScore',
] as const;

function computeTrajectoryInputs(state: GameState, worldId: string): Record<string, number> {
  return {
    relationshipScore: inferRelationshipScore(state),
    factionScore: inferFactionScore(state),
    legacyScore: inferLegacyScore(state, worldId),
    achievementScore: inferAchievementScore(state),
    burdenScore: inferBurdenScore(state),
  };
}

function scoreCategory(
  config: EndgameCategoryConfig,
  inputs: Record<string, number>,
  state: GameState,
): number {
  let weight = config.baseWeight;
  const triggers = patternTriggersActive(state, config.triggerFlags, config.lifePathSignals);
  if (triggers) {
    weight += 0.25;
  }
  for (const key of TRAJECTORY_KEYS) {
    const coeff = config.trajectoryWeights[key];
    if (coeff === undefined) continue;
    weight += inputs[key] * coeff * 0.35;
  }
  return weight;
}

export function resolveEndgameCategoryCandidates(
  state: GameState,
  worldId = 'wuxia',
): ResolvedEndgameCategory[] {
  const profile = getWorldProfile(worldId);
  const configs = profile.endgameCategoryConfigs ?? [];
  const inputs = computeTrajectoryInputs(state, worldId);

  return configs
    .map(config => ({
      categoryId: config.id,
      label: config.label,
      kind: config.categoryKind,
      weight: scoreCategory(config, inputs, state),
      source: patternTriggersActive(state, config.triggerFlags, config.lifePathSignals)
        ? 'trigger+trajectory'
        : 'trajectory',
    }))
    .filter(c => c.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}

export function buildEndgameCategoryReport(
  state: GameState,
  worldId = 'wuxia',
): EndgameCategoryReport {
  const age = state.player?.age ?? 0;
  const inputs = computeTrajectoryInputs(state, worldId);
  const candidates = resolveEndgameCategoryCandidates(state, worldId);
  const selectedCategory = candidates[0] ?? {
    categoryId: 'p19_category_fallback',
    label: '平凡收束',
    kind: 'quiet_continuity' as const,
    weight: 0.1,
    source: 'fallback',
  };

  return { age, selectedCategory, candidates, trajectoryInputs: inputs };
}

export function selectEndgameCategory(state: GameState, worldId = 'wuxia'): ResolvedEndgameCategory {
  return buildEndgameCategoryReport(state, worldId).selectedCategory;
}
