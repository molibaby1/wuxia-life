import {
  getProfileStageForAge,
  getProfileStageConfigs,
} from '../narrative/worldProfile';
import type { GameProcessRecord } from '../types/simulationRecordTypes';
import type { GameState } from '../types/eventTypes';
import { eventLoader } from '../core/EventLoader';
import {
  detectStageSignalsForStage,
  getSatisfiedStageSignals,
  getStageExpectedSignals,
} from './signalDetection';
import type { NarrativeSchedulingContext, StageSignalKey } from './types';

export const PERSONA_ROUTE_MAP: Record<string, string> = {
  'p8-martial-lin': 'route_martial',
  'p8-scholar-su': 'route_scholar',
  'p8-social-gu': 'route_social',
  'p8-wealth-shen': 'route_wealth',
  'p8-cautious-han': 'route_cautious',
  'p8-deviant-ye': 'route_deviant',
  'p8-explorer-lu': 'route_wanderer',
  'p8-balanced-wei': 'route_balanced',
};

export function recordsFromGameState(state: GameState): GameProcessRecord[] {
  const storyRecords = (state.eventHistory ?? []).map(record => ({
    age: record.age ?? state.player?.age ?? 0,
    eventId: record.eventId,
    eventTitle: eventLoader.getEventById(record.eventId)?.content?.title ?? record.eventId,
    eventType: (eventLoader.getEventById(record.eventId)?.eventType ?? 'auto') as 'auto' | 'choice' | 'ending',
    gameState: (record.stateSnapshot as GameState | undefined) ?? state,
    timestamp: new Date().toISOString(),
    progressionKind: 'story_event' as const,
  }));

  const actionRecords = (state.actionHistory ?? []).map(entry => ({
    age: entry.age ?? state.player?.age ?? 0,
    eventId: entry.actionId,
    eventTitle: entry.actionId,
    eventType: 'auto' as const,
    gameState: state,
    timestamp: new Date().toISOString(),
    progressionKind: 'active_action' as const,
    activeActionId: entry.actionId,
  }));

  return [...storyRecords, ...actionRecords].sort((a, b) => a.age - b.age);
}

export function buildNarrativeSchedulingContextFromState(state: GameState): NarrativeSchedulingContext {
  return buildNarrativeSchedulingContext(recordsFromGameState(state), state);
}

export function buildNarrativeSchedulingContext(
  records: GameProcessRecord[],
  state: GameState,
): NarrativeSchedulingContext {
  const age = state.player?.age ?? 0;
  const stage = getProfileStageForAge(age);
  const expectedStageSignals = getStageExpectedSignals(age);
  const satisfiedStageSignals = getSatisfiedStageSignals(records, state, age + 1);
  const missingStageSignals = expectedStageSignals.filter(
    signal => !satisfiedStageSignals.includes(signal),
  );
  return {
    age,
    stageId: stage?.id ?? null,
    expectedStageSignals,
    satisfiedStageSignals,
    missingStageSignals,
  };
}

export function buildStageSignalSnapshot(
  stageId: string,
  records: GameProcessRecord[],
  finalState?: GameState,
): {
  expected: StageSignalKey[];
  detected: ReturnType<typeof detectStageSignalsForStage>;
  missing: StageSignalKey[];
} {
  const stageConfig = getProfileStageConfigs().find(item => item.id === stageId);
  if (!stageConfig) {
    return { expected: [], detected: [], missing: [] };
  }

  const expected = stageConfig.feedbackExpectation.expectedSignals.filter(
    (value): value is StageSignalKey =>
      [
        'origin',
        'childhood_choice',
        'early_active_action',
        'route_entry',
        'training_milestone',
        'first_turning_point',
        'route_reinforcement',
        'identity_signal',
        'relationship_shift',
        'route_divergence',
        'achievement',
        'age40_identity',
      ].includes(value),
  );
  const detected = detectStageSignalsForStage(stageId, {
    records,
    finalState,
    ageMin: stageConfig.ageMin,
    ageMax: stageConfig.ageMax,
  });
  const detectedKeys = new Set(detected.map(item => item.key));
  const missing = expected.filter(signal => !detectedKeys.has(signal));
  return { expected, detected, missing };
}
