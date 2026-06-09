import type { RepetitionPressureConfig, RepetitionPressureReport } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import type { EventDefinition } from '../types/eventTypes';
import type { GameState } from '../types/eventTypes';
import { getPlayerAge } from './stateAccess';

function selectRepetitionConfig(age: number, worldId = 'wuxia'): RepetitionPressureConfig {
  const configs = getWorldProfile(worldId).repetitionPressureConfigs ?? [];
  if (age < 20) {
    return configs.find(entry => entry.id === 'p20_repetition_early_growth') ?? configs[0];
  }
  if (age >= 40) {
    return configs.find(entry => entry.id === 'p20_repetition_late_life') ?? configs[0];
  }
  return configs.find(entry => entry.id === 'p20_repetition_default') ?? configs[0];
}

function collectEventClass(event: EventDefinition): string | null {
  const tags = event.metadata?.tags ?? [];
  const id = event.id.toLowerCase();
  for (const tag of tags) {
    if (tag) return tag;
  }
  if (/train|martial/.test(id)) return 'training';
  if (/study|scholar/.test(id)) return 'study';
  if (/trade|merchant|business|economy/.test(id)) return 'economy';
  if (/legacy|inherit|elderly/.test(id)) return 'legacy';
  if (/feud|demonic/.test(id)) return 'feud';
  if (/injury|hurt|wound/.test(id)) return 'injury';
  return event.category ?? null;
}

export function buildRepetitionPressureReport(
  state: GameState,
  event: EventDefinition,
  worldId = 'wuxia',
): RepetitionPressureReport {
  const age = getPlayerAge(state);
  const config = selectRepetitionConfig(age, worldId);
  const lookback = config.lookbackYears ?? 4;
  const history = state.eventHistory ?? [];
  let recentExactRepeats = 0;
  let seenIds = new Set<string>();
  let windowCount = 0;

  for (const record of history) {
    const ageGap = age - (record.age ?? age);
    if (ageGap < 0 || ageGap > lookback) {
      continue;
    }
    windowCount += 1;
    seenIds.add(record.eventId);
    if (record.eventId === event.id) {
      recentExactRepeats += 1;
    }
  }

  const unseenEventRatio = seenIds.has(event.id) ? 0 : 1;
  const exactRepeatDecay = Math.max(
    config.thematicContinuityFloor,
    1 - recentExactRepeats * config.exactRepeatSuppression,
  );
  const noveltyBoost = 1 + unseenEventRatio * config.noveltyPreference;
  const combinedMultiplier = Math.max(
    config.thematicContinuityFloor,
    Math.min(2.5, exactRepeatDecay * noveltyBoost),
  );

  return {
    age,
    exactRepeatDecay,
    noveltyBoost,
    thematicFloor: config.thematicContinuityFloor,
    recentExactRepeats,
    unseenEventRatio,
    combinedMultiplier,
  };
}

export function getProfileRepetitionPressureMultiplier(
  state: GameState,
  event: EventDefinition,
  worldId = 'wuxia',
): number {
  const age = getPlayerAge(state);
  const config = selectRepetitionConfig(age, worldId);
  const report = buildRepetitionPressureReport(state, event, worldId);
  let multiplier = report.combinedMultiplier;

  const eventClass = collectEventClass(event);
  const history = state.eventHistory ?? [];
  if (eventClass) {
    for (const record of history) {
      const ageGap = age - (record.age ?? age);
      if (ageGap < 0 || ageGap > config.crossStagePayoffMinSpacing) {
        continue;
      }
      const recordClass = record.eventId.toLowerCase();
      if (recordClass.includes(eventClass) && record.eventId !== event.id) {
        multiplier *= 1 - config.exactRepeatSuppression * 0.35;
      }
    }
  }

  return Math.max(config.thematicContinuityFloor, Math.min(2.5, multiplier));
}
