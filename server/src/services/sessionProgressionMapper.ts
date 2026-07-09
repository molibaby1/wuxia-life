import type { HeadlessEngineSession } from '../../../src/headless/session/HeadlessEngineSession.js';
import type {
  PlayerSummaryDto,
  SessionProgressionPayload,
  StoryEventDto,
} from '../../../src/contracts/sessionProgression.js';
import type { LifeMemorySummary } from '../../../src/types/lifeMemory.js';
import type { HeadlessTerminalState } from '../../../src/headless/session/sessionTypes.js';

function mapPlayerSummary(session: HeadlessEngineSession): PlayerSummaryDto {
  const state = session.getRuntimeState();
  const player = state.player;
  const time = state.currentTime ?? { year: 1, month: 1, day: 1 };
  return {
    name: player?.name ?? '侠客',
    age: player?.age ?? 0,
    martialPower: player?.martialPower ?? 0,
    externalSkill: player?.externalSkill ?? 0,
    internalSkill: player?.internalSkill ?? 0,
    qinggong: player?.qinggong ?? 0,
    chivalry: player?.chivalry ?? 0,
    constitution: player?.constitution ?? 0,
    comprehension: player?.comprehension ?? 0,
    money: player?.money ?? 0,
    sect: player?.sect,
    alive: player?.alive !== false,
    currentYear: time.year,
    currentMonth: time.month,
    currentDay: time.day,
    lifeStates: player?.lifeStates,
  };
}

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
    periodSummary: volatile.pendingPeriodSummary,
    passiveNarrative: volatile.passiveNarrative,
    slotVersion,
    snapshotId,
    terminal,
    lifeMemory,
    player: mapPlayerSummary(session),
  };
}
