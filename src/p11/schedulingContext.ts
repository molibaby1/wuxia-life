import {
  getProfileRouteDefinition,
  getProfileStageForAge,
  getProfileStageConfigs,
  getWorldProfile,
} from '../narrative/worldProfile';
import type { GameProcessRecord } from '../types/simulationRecordTypes';
import type { GameState } from '../types/eventTypes';
import type { RouteSignalPoint } from '../narrative/config/routeDefinitions';
import { eventLoader } from '../core/EventLoader';
import {
  detectStageSignalsForStage,
  getSatisfiedStageSignals,
  getStageExpectedSignals,
} from './signalDetection';
import { ageInBand } from './signalVocabulary';
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

function readMergedFlags(state?: GameState): Record<string, unknown> {
  return {
    ...(state?.flags ?? {}),
    ...(state?.player?.flags ?? {}),
  };
}

const ROUTE_ENTRY_FLAG_ALIASES: Record<string, string[]> = {
  route_wealth: ['p9_echo_business_hook', 'p16_deferred_business_upbringing'],
  route_wanderer: ['p9_echo_travel_hook', 'p16_deferred_travel_upbringing'],
  route_social: ['p9_echo_social_hook', 'p16_deferred_social_upbringing'],
};

function routeHasEntrySignal(routeId: string, flags: Record<string, unknown>): boolean {
  const route = getWorldProfile('wuxia').routeDefinitions.find(item => item.id === routeId);
  if (!route) {
    return false;
  }
  const declaredEntry = route.entrySignals.some(
    point => point.flagKey && hasRouteFlag(flags, point.flagKey),
  );
  if (declaredEntry) {
    return true;
  }
  return (ROUTE_ENTRY_FLAG_ALIASES[routeId] ?? []).some(key => hasRouteFlag(flags, key));
}

function resolveActiveRouteIds(flags: Record<string, unknown>, routePreference?: string | null): string[] {
  const routeDefinitions = getWorldProfile('wuxia').routeDefinitions;
  const active: string[] = [];
  for (const route of routeDefinitions) {
    const hasEntry = routeHasEntrySignal(route.id, flags);
    const hasIdentity = route.identityResolution.candidates.some(
      candidate => flags[candidate.flagKey],
    );
    const prefMatch =
      routePreference &&
      route.identityResolution.routePreferenceFallbacks.includes(routePreference);
    if (hasEntry || hasIdentity || prefMatch) {
      active.push(route.id);
    }
  }
  if (active.length === 0 && routePreference) {
    const fallback = routeDefinitions.find(route =>
      route.identityResolution.routePreferenceFallbacks.includes(routePreference),
    );
    if (fallback) {
      active.push(fallback.id);
    }
  }
  return active;
}

function resolveRoutePreferenceFromState(state: GameState): string | null {
  const flags = readMergedFlags(state);

  for (const [flagName, flagValue] of Object.entries(flags)) {
    if (!flagValue || !flagName.startsWith('p8_route_')) {
      continue;
    }
    const preference = flagName.slice('p8_route_'.length);
    if (preference) {
      return preference;
    }
  }

  if (hasRouteFlag(flags, 'p9_early_business_focus') || hasRouteFlag(flags, 'p16_deferred_business_upbringing')) {
    return 'wealth';
  }
  if (hasRouteFlag(flags, 'p9_early_travel_focus') || hasRouteFlag(flags, 'p16_deferred_travel_upbringing')) {
    return 'wanderer';
  }
  if (hasRouteFlag(flags, 'p9_early_social_focus') || hasRouteFlag(flags, 'p16_deferred_social_upbringing')) {
    return 'social';
  }
  if (hasRouteFlag(flags, 'p9_echo_study_hook')) {
    return 'scholar';
  }
  if (hasRouteFlag(flags, 'p9_echo_training_hook')) {
    return 'martial';
  }

  for (const [routeId, routeState] of Object.entries(state.routeStates ?? {})) {
    if (
      routeState.lifecycle === 'active' ||
      routeState.lifecycle === 'locked_in' ||
      routeState.lifecycle === 'temporary'
    ) {
      return routeId.startsWith('route_') ? routeId.slice('route_'.length) : routeId;
    }
  }

  return null;
}

function hasRouteFlag(flags: Record<string, unknown>, key: string): boolean {
  const value = flags[key];
  return value !== undefined && value !== false && value !== null && value !== '';
}

function filterRelevantRoutePoints(
  points: RouteSignalPoint[],
  age: number,
  flags: Record<string, unknown>,
): RouteSignalPoint[] {
  return points.filter(point => {
    if (!ageInBand(age, point.ageBand)) {
      return false;
    }
    if (point.flagKey && flags[point.flagKey]) {
      return false;
    }
    return true;
  });
}

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
  const flags = readMergedFlags(state);
  const expectedStageSignals = getStageExpectedSignals(age);
  const satisfiedStageSignals = getSatisfiedStageSignals(records, state, age + 1);
  const missingStageSignals = expectedStageSignals.filter(
    signal => !satisfiedStageSignals.includes(signal),
  );
  const routePreference = resolveRoutePreferenceFromState(state);
  const activeRouteIds = resolveActiveRouteIds(flags, routePreference);

  const relevantReinforcementPoints = activeRouteIds.flatMap(routeId => {
    const route = getProfileRouteDefinition(routeId);
    if (!route) {
      return [];
    }
    return filterRelevantRoutePoints(route.reinforcementPoints, age, flags);
  });

  const relevantDivergencePoints = activeRouteIds.flatMap(routeId => {
    const route = getProfileRouteDefinition(routeId);
    if (!route) {
      return [];
    }
    return filterRelevantRoutePoints(route.divergencePoints, age, flags);
  });

  return {
    age,
    stageId: stage?.id ?? null,
    expectedStageSignals,
    satisfiedStageSignals,
    missingStageSignals,
    activeRouteIds,
    relevantReinforcementPoints,
    relevantDivergencePoints,
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
