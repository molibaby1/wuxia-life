import type { EventDefinition } from '../types/eventTypes';
import type { GameState } from '../types/eventTypes';
import { getPreEndgameRecoveryMultiplier } from './preEndgameRecovery';

export { collectEndgameEventTags } from './preEndgameRecovery';

export function getLaterLifeEndgameRecoveryMultiplier(
  state: GameState,
  event: EventDefinition,
  worldId = 'wuxia',
): { multiplier: number; report: ReturnType<typeof getPreEndgameRecoveryMultiplier>['report'] } {
  return getPreEndgameRecoveryMultiplier(state, event, worldId);
}
