import type { PracticeHabitEffect } from '../../types/activeActionTypes';
import type { PlayerLifeStates } from '../../types/eventTypes';

export function applyPracticeHabitEffects(
  lifeStates: PlayerLifeStates,
  effects: readonly PracticeHabitEffect[] | undefined,
): PlayerLifeStates {
  const next = { ...lifeStates };
  for (const effect of effects ?? []) {
    next[effect.state] = Math.max(0, Math.min(5, next[effect.state] + effect.value));
  }
  return next;
}
