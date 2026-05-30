import type { GameState } from '../types/eventTypes';

/**
 * 正式事件触发历史（冷却、maxTriggers、复读降权均读此字段）
 */
export function appendFormalEventHistory(
  gameState: GameState,
  eventId: string,
  age: number,
  triggeredAtYear?: number
): void {
  if (!gameState.eventHistory) {
    gameState.eventHistory = [];
  }

  const alreadyExists = gameState.eventHistory.some(
    entry => entry.eventId === eventId && entry.age === age
  );
  if (alreadyExists) {
    return;
  }

  gameState.eventHistory.push({
    eventId,
    triggeredAt: triggeredAtYear ?? gameState.currentTime?.year ?? 0,
    age,
  });
}
