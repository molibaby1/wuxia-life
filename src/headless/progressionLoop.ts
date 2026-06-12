/**
 * Shared headless auto-progression loop (server gameService + P8 playability runner).
 */

import type { HeadlessEngineSession } from './session/HeadlessEngineSession';

/** Mirror GameProcessSimulator.ensureProgressionCatchUp — one year when age unchanged. */
export async function ensureProgressionCatchUp(
  session: HeadlessEngineSession,
  ageBefore: number,
): Promise<void> {
  if (session.getTerminalState()) return;
  const ageAfter = session.getRuntimeState().player?.age ?? 0;
  if (ageAfter <= ageBefore) {
    await session.advanceCalendar(1, 'year');
  }
}

export async function progressUntilChoiceOrTerminal(session: HeadlessEngineSession): Promise<void> {
  let guard = 0;
  while (guard < 32) {
    guard += 1;
    const next = await session.getNextEvent();
    if (!next) {
      if (session.getSessionPhase() === 'active_planning') break;
      break;
    }
    if (!next.isAutomatic) break;
    const progress = await session.progressAutomatic({ maxSteps: 8 });
    if (progress.stoppedReason === 'terminal') break;
    if (progress.stepsExecuted === 0) break;
  }
}
