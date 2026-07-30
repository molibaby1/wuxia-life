import { getActionById } from '../data/activeActionCatalog';
import { createDefaultPlayerLifeStates } from '../data/life/lifeStates';
import type { PlayerLifeStates } from '../types/eventTypes';
import { applyPracticeHabitEffects } from '../core/activePlanning/applyPracticeHabitEffects';

export function applyDeclaredActionHabitEffects(
  lifeStates: PlayerLifeStates,
  actionId: string,
): PlayerLifeStates {
  const action = getActionById(actionId);
  if (!action) throw new Error(`Unknown action for Habit simulation: ${actionId}`);
  return applyPracticeHabitEffects(
    { ...createDefaultPlayerLifeStates(), ...lifeStates },
    action.habitEffects,
  );
}
