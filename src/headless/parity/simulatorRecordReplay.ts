/**
 * Replay GameProcessSimulator records by stepping through recorded pre-event snapshots.
 */

import type { GameEngineIntegration } from '../../core/GameEngineIntegration';
import { resolveChoiceEffects } from '../../core/ChoiceOutcomeResolver';
import { dailyEvents } from '../../data/life/dailyEvents';
import type { EventCatalogReadService } from '../catalog/EventCatalogReadService';
import {
  EffectType,
  EventCategory,
  EventPriority,
  type DailyEventVariantConfig,
  type EffectDefinition,
  type EventCondition,
  type EventDefinition,
  type GameState,
} from '../../types/eventTypes';
import type { GameProcessRecord } from '../../types/simulationRecordTypes';
import {
  ensureYearAdvanced,
  enforceRouteTrackIsolation,
  hasGameEnded,
  type RouteTrack,
} from './routeTrackFixtures';
import {
  ACTIVE_ACTION_REPLAY_RANDOM,
  isActiveActionReplayEventId,
  resolveActiveActionIdFromReplayEvent,
} from '../../core/activePlanning/activeActionReplay';

const P3_PARITY_END_AGE = 50;

export interface SimulatorReplayOptions {
  routeTrack?: RouteTrack;
  suppressLethalSetbacks?: boolean;
  catalogVersion?: string;
}

export interface SimulatorReplayResult {
  finalState: GameState;
  outcomeTexts: string[];
}

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function findDailyVariant(eventId: string): { configTitle: string; variant: DailyEventVariantConfig } | null {
  for (const config of dailyEvents) {
    for (const variants of Object.values(config.variants)) {
      const variant = variants.find(item => item.id === eventId);
      if (variant) {
        return { configTitle: config.title, variant };
      }
    }
  }
  return null;
}

function buildDailyReplayEvent(
  eventId: string,
  state: GameState,
  match: { configTitle: string; variant: DailyEventVariantConfig },
): EventDefinition {
  const age = state.player?.age ?? 0;
  return {
    id: eventId,
    version: '1.0.0',
    category: EventCategory.DAILY_EVENT,
    priority: EventPriority.LOW,
    weight: 1,
    ageRange: { min: age, max: age },
    triggers: [{ type: 'age_reach', value: age }],
    content: {
      title: match.configTitle,
      text: match.variant.text,
      description: match.variant.text,
    },
    eventType: 'auto',
    autoEffects: [
      ...(match.variant.statEffects || []).map(effect => ({
        type: EffectType.STAT_MODIFY,
        target: effect.stat,
        value: effect.value,
        operator: 'add' as const,
      })),
      ...(match.variant.stateEffects || []).map(effect => ({
        type: EffectType.LIFE_STATE_CHANGE,
        target: effect.state,
        value: effect.value,
        operator: 'add' as const,
      })),
      ...((match.variant.flags || []).map(flag => ({
        type: EffectType.FLAG_SET,
        target: 'player.flags',
        value: true,
        flag,
      })) as EventDefinition['autoEffects']),
    ],
  };
}

function resolveEffectsForReplay(
  state: GameState,
  event: EventDefinition,
  record: GameProcessRecord,
  engine: GameEngineIntegration,
): { effects: EffectDefinition[]; outcomeText: string | null } {
  const choice = record.selectedChoice;
  if (!choice) {
    return { effects: [], outcomeText: record.outcomeText ?? null };
  }

  if (record.outcomeText && choice.outcomes?.length) {
    const matched = choice.outcomes.find(
      outcome =>
        outcome.text === record.outcomeText ||
        (outcome.text && record.outcomeText?.includes(outcome.text)),
    );
    if (matched?.effects?.length) {
      return { effects: matched.effects, outcomeText: record.outcomeText ?? matched.text ?? null };
    }
  }

  const resolved = resolveChoiceEffects(
    state,
    event,
    choice,
    condition => engine.isChoiceAvailable(condition as EventCondition | undefined),
  );
  return {
    effects: resolved?.effects ?? choice.effects ?? [],
    outcomeText: resolved?.outcomeText ?? record.outcomeText ?? null,
  };
}

function resolveReplayEvent(
  catalog: EventCatalogReadService,
  catalogVersion: string,
  eventId: string,
  state: GameState,
): EventDefinition {
  try {
    return catalog.getEventById(eventId, catalogVersion);
  } catch {
    const daily = findDailyVariant(eventId);
    if (daily) {
      return buildDailyReplayEvent(eventId, state, daily);
    }
    throw new Error(`Event not found for replay: ${eventId}`);
  }
}

export function isImmediateAuditRecord(records: GameProcessRecord[], index: number): boolean {
  if (index === 0) return false;
  const previous = records[index - 1]!;
  const current = records[index]!;
  // Simulator only inserts immediate follow-ups in the same game year as the choice.
  return (
    Boolean(previous.selectedChoice) &&
    current.eventType === 'auto' &&
    current.age === previous.age
  );
}

/** Records that the replay driver executes (excludes same-year audit rows). */
export function filterReplayExecutableRecords(records: GameProcessRecord[]): GameProcessRecord[] {
  return records.filter((_, index) => !isImmediateAuditRecord(records, index));
}

export async function replaySimulatorRecords(
  engine: GameEngineIntegration,
  catalog: EventCatalogReadService,
  options: SimulatorReplayOptions,
  records: GameProcessRecord[],
): Promise<SimulatorReplayResult> {
  const catalogVersion = options.catalogVersion ?? '1.0.0';
  const outcomeTexts: string[] = [];
  let pendingYearAge: number | null = null;

  const finishYear = (yearAge: number) => {
    enforceRouteTrackIsolation(engine.getGameState(), options.routeTrack);
    if (yearAge < P3_PARITY_END_AGE) {
      ensureYearAdvanced(engine, yearAge);
    }
    pendingYearAge = null;
  };

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index]!;
    const nextRecord = records[index + 1];

    if (isImmediateAuditRecord(records, index)) {
      continue;
    }

    if (pendingYearAge !== null && record.age !== pendingYearAge) {
      finishYear(pendingYearAge);
    }

    engine.loadGameState(cloneState(record.gameState));
    const state = engine.getGameState();
    pendingYearAge = record.age;
    if (!state.player?.alive || hasGameEnded(state)) {
      break;
    }

    if (record.eventId === 'no_event') {
      outcomeTexts.push('');
      if (nextRecord === undefined || nextRecord.age !== record.age) {
        finishYear(record.age);
      }
      continue;
    }

    const activeActionId =
      record.progressionKind === 'active_action'
        ? record.activeActionId
        : isActiveActionReplayEventId(record.eventId)
          ? resolveActiveActionIdFromReplayEvent(record.eventId)
          : null;

    if (activeActionId) {
      const result = engine.executeActiveAction(activeActionId, { random: ACTIVE_ACTION_REPLAY_RANDOM });
      if (!result) {
        throw new Error(`Active action replay failed: ${activeActionId} at age ${record.age}`);
      }
      engine.consumeLastEventOutcomeNote();
      enforceRouteTrackIsolation(engine.getGameState(), options.routeTrack);
      outcomeTexts.push(record.outcomeText ?? result.feedbackText ?? '');
      if (nextRecord === undefined || nextRecord.age !== record.age) {
        finishYear(record.age);
      }
      continue;
    }

    const event = resolveReplayEvent(catalog, catalogVersion, record.eventId, state);
    const eventType = event.eventType || 'auto';

    if (eventType === 'choice' && record.selectedChoice) {
      const { effects: effectsToExecute, outcomeText: resolvedText } = resolveEffectsForReplay(
        state,
        event,
        record,
        engine,
      );
      await engine.executeChoiceEffects(
        effectsToExecute,
        event.id,
        record.selectedChoice.id,
      );
      engine.consumeLastEventOutcomeNote();
      enforceRouteTrackIsolation(engine.getGameState(), options.routeTrack);
      if (!engine.getGameState().player?.alive || hasGameEnded(engine.getGameState())) {
        break;
      }
    } else if (event.autoEffects && event.autoEffects.length > 0) {
      await engine.executeAutoEvent(event);
      engine.consumeLastEventOutcomeNote();
      enforceRouteTrackIsolation(engine.getGameState(), options.routeTrack);
    }

    outcomeTexts.push(record.outcomeText ?? '');

    if (nextRecord === undefined || nextRecord.age !== record.age) {
      finishYear(record.age);
    }
  }

  if (pendingYearAge !== null) {
    finishYear(pendingYearAge);
  }

  return { finalState: engine.getGameState(), outcomeTexts };
}

export function prepareEngineForSimulatorReplay(
  engine: GameEngineIntegration,
  options: {
    playerName?: string;
    gender?: 'male' | 'female';
    suppressLethalSetbacks?: boolean;
  },
): void {
  engine.reset();
  if (options.suppressLethalSetbacks) {
    engine.setSuppressLethalSetbacks(true);
  }
}
