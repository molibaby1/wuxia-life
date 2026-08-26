import { getWorldProfile } from '../narrative/worldProfile';
import type {
  AchievementMaintenancePattern,
  UnmetMaintenancePressure,
} from '../narrative/profile/types';
import type { GameState } from '../types/eventTypes';
import {
  flagIsActive,
  inferMaintenanceDimensionLevel,
  readMergedFlags,
  type P17MaintenanceDimension,
} from './stateAccess';

export interface ActiveAchievementMaintenance {
  pattern: AchievementMaintenancePattern;
  unmet: UnmetMaintenancePressure[];
  aggregatePressure: number;
}

export function resolveActiveAchievementMaintenance(
  state: GameState,
  worldId = 'wuxia',
): ActiveAchievementMaintenance[] {
  const patterns = getWorldProfile(worldId).achievementMaintenancePatterns ?? [];
  const flags = readMergedFlags(state);
  const active: ActiveAchievementMaintenance[] = [];

  for (const pattern of patterns) {
    const triggerFlag = pattern.achievementFlags.find(flag => flagIsActive(flags, flag));
    if (!triggerFlag) {
      continue;
    }

    const unmet: UnmetMaintenancePressure[] = [];
    for (const dimension of pattern.dimensions) {
      const currentLevel = inferMaintenanceDimensionLevel(
        state,
        dimension.dimension as P17MaintenanceDimension,
      );
      const pressure = Math.max(0, dimension.requiredLevel - currentLevel);
      if (pressure > 0.05) {
        unmet.push({
          patternId: pattern.id,
          dimension: dimension.dimension,
          requiredLevel: dimension.requiredLevel,
          currentLevel,
          pressure,
        });
      }
    }

    const aggregatePressure =
      unmet.length === 0
        ? 0
        : unmet.reduce((sum, item) => sum + item.pressure, 0) / unmet.length;

    active.push({ pattern, unmet, aggregatePressure });
  }

  return active;
}

export function collectUnmetMaintenancePressure(
  state: GameState,
  worldId = 'wuxia',
): UnmetMaintenancePressure[] {
  return resolveActiveAchievementMaintenance(state, worldId).flatMap(item => item.unmet);
}

export function formatUnmetPressureReport(
  unmet: UnmetMaintenancePressure[],
): string[] {
  return unmet.map(
    item =>
      `${item.patternId}:${item.dimension} required=${item.requiredLevel.toFixed(2)} current=${item.currentLevel.toFixed(2)} pressure=${item.pressure.toFixed(2)}`,
  );
}
