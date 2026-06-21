/**
 * Shared headless auto-progression loop (server gameService + P8 playability runner).
 */

import type { EventDefinition } from '../types/eventTypes';
import type { HeadlessEngineSession } from './session/HeadlessEngineSession';

function shouldDeferFormalAutoStoryEvent(event: EventDefinition): boolean {
  if (event.category === 'daily_event' || event.metadata?.tags?.includes('daily_pool')) {
    return false;
  }
  if (event.eventType === 'auto') {
    return true;
  }
  if (event.autoEffects && event.autoEffects.length > 0 && !event.choices?.length) {
    return true;
  }
  return false;
}

/** Mirror GameProcessSimulator.ensureProgressionCatchUp — one year when age unchanged. */
export async function ensureProgressionCatchUp(
  session: HeadlessEngineSession,
  ageBefore: number,
): Promise<void> {
  if (session.getTerminalState()) return;
  if (session.hasPendingForcedEvent()) return;
  const ageAfter = session.getRuntimeState().player?.age ?? 0;
  if (ageAfter <= ageBefore) {
    await session.advanceCalendar(1, 'year');
    if (session.hasPendingForcedEvent()) {
      await session.getNextEvent();
    }
  }
}

export async function progressUntilChoiceOrTerminal(session: HeadlessEngineSession): Promise<void> {
  let guard = 0;
  while (guard < 32) {
    guard += 1;
    const next = await session.getNextEvent();
    if (!next) {
      const phase = session.getSessionPhase();
      if (phase === 'active_planning' || phase === 'passive_progression') {
        if (phase === 'passive_progression') {
          session.ensurePassivePresentation();
        }
        break;
      }
      break;
    }
    if (!next.isAutomatic) break;
    if (shouldDeferFormalAutoStoryEvent(next.raw)) break;
    const progress = await session.progressAutomatic({ maxSteps: 8 });
    if (progress.stoppedReason === 'terminal') break;
    if (progress.stepsExecuted === 0) break;
  }
  if (session.getSessionPhase() === 'passive_progression') {
    session.ensurePassivePresentation();
  }
}
