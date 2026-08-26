export {
  flagIsActive,
  inferMaintenanceDimensionLevel,
  lifePathSignalActive,
  readMergedFlags,
} from '../p17/stateAccess';

import type { GameState } from '../types/eventTypes';
import { flagIsActive, lifePathSignalActive, readMergedFlags } from '../p17/stateAccess';

const HERITAGE_CEILING = 100;
const CHILDREN_CEILING = 5;
const DISCIPLE_CEILING = 8;

export function inferSuccessorQuality(state: GameState): number {
  const player = state.player;
  if (!player) {
    return 0;
  }
  const flags = readMergedFlags(state);
  let quality = 0;
  let weight = 0;

  const martialHeritage = Math.min(1, (player.martialHeritage ?? 0) / HERITAGE_CEILING);
  const scholarlyHeritage = Math.min(1, (player.scholarlyHeritage ?? 0) / HERITAGE_CEILING);
  const merchantNetwork = Math.min(1, (player.merchantNetwork ?? 0) / HERITAGE_CEILING);
  const discipleBoost = Math.min(
    1,
    (state.lifePath?.relationships?.disciples?.length ?? 0) / DISCIPLE_CEILING,
  );
  const childBoost = Math.min(1, (player.children ?? 0) / CHILDREN_CEILING);

  quality += martialHeritage * 0.35;
  weight += 0.35;
  quality += scholarlyHeritage * 0.15;
  weight += 0.15;
  quality += merchantNetwork * 0.1;
  weight += 0.1;
  quality += discipleBoost * 0.2;
  weight += 0.2;
  quality += childBoost * 0.1;
  weight += 0.1;

  if (flagIsActive(flags, 'martial_transmission')) {
    quality += 0.15;
    weight += 0.15;
  }
  if (flagIsActive(flags, 'master_legacy')) {
    quality += 0.1;
    weight += 0.1;
  }
  if (flagIsActive(flags, 'child_martial_artist')) {
    quality += 0.08;
    weight += 0.08;
  }

  return weight === 0 ? 0 : Math.min(1, quality / weight);
}

export function inferCultivationCostSatisfaction(
  state: GameState,
  dimension: string,
  satisfactionSignals: string[],
): number {
  const player = state.player;
  if (!player) {
    return 0;
  }
  const flags = readMergedFlags(state);
  let total = 0;
  let count = 0;

  for (const signal of satisfactionSignals) {
    if (signal.startsWith('player.')) {
      const key = signal.slice('player.'.length) as keyof typeof player;
      const raw = player[key];
      if (typeof raw === 'number') {
        if (key === 'connections' || key === 'influence') {
          total += Math.min(1, raw / 80);
        } else if (key === 'martialPower') {
          total += Math.min(1, raw / 100);
        } else {
          total += Math.min(1, raw / 100);
        }
        count += 1;
      }
      continue;
    }
    if (signal === 'martialHeritage') {
      total += Math.min(1, (player.martialHeritage ?? 0) / HERITAGE_CEILING);
      count += 1;
      continue;
    }
    if (signal === 'lifePath.relationships.disciples') {
      total += Math.min(
        1,
        (state.lifePath?.relationships?.disciples?.length ?? 0) / DISCIPLE_CEILING,
      );
      count += 1;
      continue;
    }
    if (flagIsActive(flags, signal)) {
      total += 1;
      count += 1;
      continue;
    }
    if (lifePathSignalActive(state, signal)) {
      total += 0.7;
      count += 1;
    }
  }

  return count === 0 ? 0 : total / count;
}
