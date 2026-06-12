import type { HeadlessEngineSession } from '../../../src/headless/session/HeadlessEngineSession.js';
import type { SessionProgressionPayload, StoryEventDto } from '../../../src/contracts/sessionProgression.js';
import type { LifeMemorySummary } from '../../../src/types/lifeMemory.js';
import type { HeadlessTerminalState } from '../../../src/headless/session/sessionTypes.js';

function mapNextEvent(
  next: Awaited<ReturnType<HeadlessEngineSession['getNextEvent']>>,
): StoryEventDto | null {
  if (!next) return null;
  return {
    eventId: next.event.eventId,
    title: next.event.title,
    text: next.event.text,
    isAutomatic: next.isAutomatic,
    choices: next.event.choices,
  };
}

export function mapSessionProgression(
  session: HeadlessEngineSession,
  slotVersion: number,
  snapshotId: string,
  terminal: HeadlessTerminalState | null,
  lifeMemory: LifeMemorySummary,
  nextEventResult?: Awaited<ReturnType<HeadlessEngineSession['getNextEvent']>> | null,
): SessionProgressionPayload {
  const phase = session.getSessionPhase();
  const nextEvent =
    phase === 'story_event'
      ? mapNextEvent(nextEventResult ?? null)
      : null;
  const planningOptions = phase === 'active_planning' ? session.getPlanningOptions() : [];
  const volatile = session.getProgressionVolatileState();

  return {
    sessionPhase: phase,
    nextEvent,
    planningOptions,
    activeActionSummary: volatile.pendingActionSummary,
    disturbanceNarrative: volatile.pendingDisturbanceNarrative,
    slotVersion,
    snapshotId,
    terminal,
    lifeMemory,
  };
}
