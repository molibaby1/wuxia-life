import type { ActionResult, DisturbanceCandidate, DisturbanceResolution } from '../../types/activeActionTypes';
import type { GameState } from '../../types/eventTypes';

const DISTURBANCE_POOL: DisturbanceCandidate[] = [
  { id: 'disturbance_sparring_invite', title: '有人邀你切磋', weight: 1.2, sourceKind: 'random_disturbance' },
  { id: 'disturbance_market_rumor', title: '街市传来江湖传闻', weight: 1.0, sourceKind: 'random_disturbance' },
  { id: 'disturbance_minor_injury', title: '练功不慎，轻微扭伤', weight: 0.6, sourceKind: 'random_disturbance' },
];

const CATEGORY_WEIGHT: Record<string, number> = {
  training: 0.8,
  study: 0.6,
  socializing: 1.2,
};

export interface DisturbanceResolverInput {
  state: GameState;
  actionResult: ActionResult;
  random?: () => number;
  triggerChance?: number;
}

export function resolveDisturbanceAfterAction(input: DisturbanceResolverInput): DisturbanceResolution {
  const age = input.state.player?.age ?? 0;
  if (age <= 7) {
    return { disturbance: null };
  }

  const random = input.random ?? Math.random;
  const triggerChance = input.triggerChance ?? 0.25;
  if (random() > triggerChance) {
    return { disturbance: null };
  }

  const categoryMod = CATEGORY_WEIGHT[input.actionResult.metadata.category] ?? 1;
  const weighted = DISTURBANCE_POOL.map(entry => ({
    entry,
    score: entry.weight * categoryMod,
  }));
  const total = weighted.reduce((sum, item) => sum + item.score, 0);
  if (total <= 0) {
    return { disturbance: null };
  }

  let roll = random() * total;
  for (const item of weighted) {
    roll -= item.score;
    if (roll <= 0) {
      return { disturbance: item.entry };
    }
  }
  return { disturbance: weighted[weighted.length - 1].entry };
}
