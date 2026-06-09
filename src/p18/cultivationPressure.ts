import { getWorldProfile } from '../narrative/worldProfile';
import type {
  SuccessorCultivationCostPattern,
  UnmetCultivationPressure,
} from '../narrative/profile/types';
import type { GameState } from '../types/eventTypes';
import { flagIsActive, inferCultivationCostSatisfaction, readMergedFlags } from './stateAccess';

export interface ActiveCultivationCostPattern {
  pattern: SuccessorCultivationCostPattern;
  unmet: UnmetCultivationPressure[];
  aggregatePressure: number;
}

function patternActive(
  pattern: SuccessorCultivationCostPattern,
  flags: Record<string, unknown>,
): boolean {
  return (pattern.successorRoleFlags ?? []).some(flag => flagIsActive(flags, flag));
}

export function collectUnmetCultivationPressure(
  state: GameState,
  worldId = 'wuxia',
): UnmetCultivationPressure[] {
  const patterns = getWorldProfile(worldId).successorCultivationCostPatterns ?? [];
  const flags = readMergedFlags(state);
  const unmet: UnmetCultivationPressure[] = [];

  for (const pattern of patterns) {
    if (!patternActive(pattern, flags)) {
      continue;
    }
    for (const dim of pattern.costDimensions) {
      const currentLevel = inferCultivationCostSatisfaction(
        state,
        dim.dimension,
        dim.satisfactionSignals,
      );
      if (currentLevel >= dim.requiredLevel) {
        continue;
      }
      const gap = dim.requiredLevel - currentLevel;
      unmet.push({
        patternId: pattern.id,
        dimension: dim.dimension,
        requiredLevel: dim.requiredLevel,
        currentLevel,
        pressure: Math.min(1, gap * dim.underinvestmentRiskMultiplier),
      });
    }
  }

  return unmet;
}

export function resolveActiveCultivationCostPatterns(
  state: GameState,
  worldId = 'wuxia',
): ActiveCultivationCostPattern[] {
  const patterns = getWorldProfile(worldId).successorCultivationCostPatterns ?? [];
  const flags = readMergedFlags(state);
  const active: ActiveCultivationCostPattern[] = [];

  for (const pattern of patterns) {
    if (!patternActive(pattern, flags)) {
      continue;
    }
    const unmet = collectUnmetCultivationPressure(state, worldId).filter(
      item => item.patternId === pattern.id,
    );
    const aggregatePressure =
      unmet.length === 0
        ? 0
        : unmet.reduce((sum, item) => sum + item.pressure, 0) / unmet.length;
    active.push({ pattern, unmet, aggregatePressure });
  }

  return active;
}

export function formatUnmetCultivationPressureReport(
  unmet: UnmetCultivationPressure[],
): string[] {
  return unmet.map(
    item =>
      `${item.patternId}/${item.dimension}: required ${item.requiredLevel.toFixed(2)}, current ${item.currentLevel.toFixed(2)}, pressure ${item.pressure.toFixed(2)}`,
  );
}
