import type { EventDefinition } from '../types/eventTypes';
import type { RouteSignalPoint } from '../narrative/config/routeDefinitions';
import { getRouteIdentityFromFlags } from '../narrative/config/routeDefinitions';
import { getProfileStageConfigs, getProfileStageForAge } from '../narrative/worldProfile';
import type { GameProcessRecord } from '../types/simulationRecordTypes';
import type { GameState } from '../types/eventTypes';
import type {
  DetectedSignal,
  NarrativeRoutePointRef,
  NarrativeSchedulingMetadata,
  RouteCoverageKind,
  SignalDetectionInput,
  StageSignalKey,
} from './types';
import { isStageSignalKey } from './signalVocabulary';
import { eventLoader } from '../core/EventLoader';

function isRouteCoverageKind(value: string): value is RouteCoverageKind {
  return value === 'entry' || value === 'reinforcement' || value === 'divergence' || value === 'identity';
}

function parseRoutePointRef(raw: unknown): NarrativeRoutePointRef | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const candidate = raw as Record<string, unknown>;
  if (typeof candidate.routeId !== 'string' || typeof candidate.ageBand !== 'string') {
    return null;
  }
  if (typeof candidate.kind !== 'string' || !isRouteCoverageKind(candidate.kind)) {
    return null;
  }
  return {
    routeId: candidate.routeId,
    kind: candidate.kind,
    ageBand: candidate.ageBand,
    eventId: typeof candidate.eventId === 'string' ? candidate.eventId : undefined,
    flagKey: typeof candidate.flagKey === 'string' ? candidate.flagKey : undefined,
  };
}

function parseNarrativeSchedulingMetadata(
  raw: NonNullable<EventDefinition['metadata']>['narrativeScheduling'],
): NarrativeSchedulingMetadata | undefined {
  if (!raw) {
    return undefined;
  }
  const stageSignals = (raw.stageSignals ?? []).filter(
    (value): value is StageSignalKey => typeof value === 'string' && isStageSignalKey(value),
  );
  const routePoints = (raw.routePoints ?? [])
    .map(parseRoutePointRef)
    .filter((point): point is NarrativeRoutePointRef => point !== null);
  if (stageSignals.length === 0 && routePoints.length === 0) {
    return undefined;
  }
  return { stageSignals, routePoints };
}

function recordsInRange(
  records: GameProcessRecord[],
  ageMin: number,
  ageMax: number,
): GameProcessRecord[] {
  return records.filter(record => record.age >= ageMin && record.age < ageMax);
}

function readFlags(record: GameProcessRecord): Record<string, unknown> {
  return {
    ...(record.gameState?.flags ?? {}),
    ...(record.gameState?.player?.flags ?? {}),
  };
}

function getEventMetadata(eventId: string): NarrativeSchedulingMetadata | undefined {
  const event = eventLoader.getEventById(eventId);
  return parseNarrativeSchedulingMetadata(event?.metadata?.narrativeScheduling);
}

function declaredStageSignalsFromRecord(record: GameProcessRecord): StageSignalKey[] {
  const meta = getEventMetadata(record.eventId);
  return (meta?.stageSignals ?? []).filter(isStageSignalKey);
}

function hasFlag(flags: Record<string, unknown>, key: string): boolean {
  const value = flags[key];
  return value !== undefined && value !== false && value !== null && value !== '';
}

function detectOrigin(records: GameProcessRecord[]): DetectedSignal | null {
  const hits = records.filter(record => {
    if (record.age > 10) {
      return false;
    }
    if (record.eventId.includes('origin') || record.eventTitle.includes('出身')) {
      return true;
    }
    return declaredStageSignalsFromRecord(record).includes('origin');
  });
  if (hits.length === 0) {
    return null;
  }
  return {
    key: 'origin',
    ages: hits.map(r => r.age),
    sources: hits.map(r => `event:${r.eventId}`),
  };
}

function detectChildhoodChoice(records: GameProcessRecord[]): DetectedSignal | null {
  const hits = records.filter(
    record => record.age < 10 && record.eventType === 'choice',
  );
  const declared = records.filter(record =>
    declaredStageSignalsFromRecord(record).includes('childhood_choice'),
  );
  const merged = [...hits, ...declared];
  if (merged.length === 0) {
    return null;
  }
  return {
    key: 'childhood_choice',
    ages: merged.map(r => r.age),
    sources: merged.map(r => `event:${r.eventId}`),
  };
}

function detectEarlyActiveAction(records: GameProcessRecord[]): DetectedSignal | null {
  const hits = records.filter(
    record => record.age < 10 && record.progressionKind === 'active_action',
  );
  if (hits.length === 0) {
    return null;
  }
  return {
    key: 'early_active_action',
    ages: hits.map(r => r.age),
    sources: hits.map(r => `action:${r.activeActionId ?? 'unknown'}`),
  };
}

function detectRouteEntry(records: GameProcessRecord[]): DetectedSignal | null {
  const entryFlags = [
    'p9_echo_training_hook',
    'p9_echo_study_hook',
    'p9_early_business_focus',
    'p9_early_travel_focus',
    'p9_early_social_focus',
    'p8_route_martial',
    'p8_route_scholar',
    'p8_route_social',
    'p8_route_wealth',
    'p8_route_wanderer',
  ];
  const hits: GameProcessRecord[] = [];
  for (const record of records) {
    if (record.age < 10 || record.age >= 20) {
      continue;
    }
    const flags = readFlags(record);
    if (entryFlags.some(flag => hasFlag(flags, flag))) {
      hits.push(record);
      continue;
    }
    if (declaredStageSignalsFromRecord(record).includes('route_entry')) {
      hits.push(record);
    }
  }
  if (hits.length === 0) {
    return null;
  }
  return {
    key: 'route_entry',
    ages: hits.map(r => r.age),
    sources: hits.map(r => `event:${r.eventId}`),
  };
}

function detectTrainingMilestone(records: GameProcessRecord[]): DetectedSignal | null {
  const milestoneIds = ['p9_childhood_sword_trial', 'p9_childhood_dark_spark'];
  const hits = records.filter(record => {
    if (record.age < 10 || record.age >= 20) {
      return false;
    }
    return (
      milestoneIds.includes(record.eventId) ||
      declaredStageSignalsFromRecord(record).includes('training_milestone')
    );
  });
  if (hits.length === 0) {
    return null;
  }
  return {
    key: 'training_milestone',
    ages: hits.map(r => r.age),
    sources: hits.map(r => `event:${r.eventId}`),
  };
}

function detectFirstTurningPoint(records: GameProcessRecord[]): DetectedSignal | null {
  const hits = records.filter(record => {
    if (record.age < 15 || record.age >= 20) {
      return false;
    }
    if (record.eventType === 'choice') {
      return true;
    }
    if (declaredStageSignalsFromRecord(record).includes('first_turning_point')) {
      return true;
    }
    const flags = readFlags(record);
    return Object.keys(flags).some(
      key => key.startsWith('p9_') || key.includes('route') || key.includes('path'),
    );
  });
  if (hits.length === 0) {
    return null;
  }
  return {
    key: 'first_turning_point',
    ages: hits.map(r => r.age),
    sources: hits.map(r => `event:${r.eventId}`),
  };
}

function detectRouteReinforcement(records: GameProcessRecord[]): DetectedSignal | null {
  const hits = records.filter(record => {
    if (record.age < 20 || record.age >= 30) {
      return false;
    }
    const tags = (eventLoader.getEventById(record.eventId)?.metadata?.tags ?? []).map(t =>
      t.toLowerCase(),
    );
    if (tags.includes('route_reinforcement') || tags.includes('reinforcement')) {
      return true;
    }
    return declaredStageSignalsFromRecord(record).includes('route_reinforcement');
  });
  if (hits.length === 0) {
    return null;
  }
  return {
    key: 'route_reinforcement',
    ages: hits.map(r => r.age),
    sources: hits.map(r => `event:${r.eventId}`),
  };
}

function detectIdentitySignal(records: GameProcessRecord[], finalFlags: Record<string, unknown>): DetectedSignal | null {
  const identity = getRouteIdentityFromFlags(finalFlags);
  const hits = records.filter(record => {
    if (record.age < 20 || record.age >= 30) {
      return false;
    }
    const flags = readFlags(record);
    return Object.keys(flags).some(key => key.startsWith('p9_route_identity_'));
  });
  if (!identity && hits.length === 0) {
    return null;
  }
  return {
    key: 'identity_signal',
    ages: hits.map(r => r.age),
    sources: identity ? [`identity:${identity}`, ...hits.map(r => `event:${r.eventId}`)] : hits.map(r => `event:${r.eventId}`),
  };
}

function detectRelationshipShift(records: GameProcessRecord[]): DetectedSignal | null {
  const relationshipEvents = ['family_marriage', 'family_child_born', 'love_confession'];
  const hits = records.filter(record => {
    if (record.age < 20 || record.age >= 30) {
      return false;
    }
    if (relationshipEvents.some(id => record.eventId.includes(id))) {
      return true;
    }
    const flags = readFlags(record);
    if (hasFlag(flags, 'married') || hasFlag(flags, 'love_started')) {
      return true;
    }
    return declaredStageSignalsFromRecord(record).includes('relationship_shift');
  });
  if (hits.length === 0) {
    return null;
  }
  return {
    key: 'relationship_shift',
    ages: hits.map(r => r.age),
    sources: hits.map(r => `event:${r.eventId}`),
  };
}

function detectRouteDivergence(records: GameProcessRecord[]): DetectedSignal | null {
  const hits = records.filter(record => {
    if (record.age < 28 || record.age >= 40) {
      return false;
    }
    const tags = (eventLoader.getEventById(record.eventId)?.metadata?.tags ?? []).map(t =>
      t.toLowerCase(),
    );
    if (tags.includes('route_divergence') || record.eventId.startsWith('p9_') && record.eventId.includes('midlife')) {
      return true;
    }
    return declaredStageSignalsFromRecord(record).includes('route_divergence');
  });
  if (hits.length === 0) {
    return null;
  }
  return {
    key: 'route_divergence',
    ages: hits.map(r => r.age),
    sources: hits.map(r => `event:${r.eventId}`),
  };
}

function detectAchievement(records: GameProcessRecord[], finalState: SignalDetectionInput['finalState']): DetectedSignal | null {
  const hits = records.filter(record => {
    if (record.age < 30) {
      return false;
    }
    if (declaredStageSignalsFromRecord(record).includes('achievement')) {
      return true;
    }
    const tags = (eventLoader.getEventById(record.eventId)?.metadata?.tags ?? []).map(t =>
      t.toLowerCase(),
    );
    return tags.includes('achievement') || tags.includes('milestone');
  });
  const stats = finalState?.player;
  const statAchievement =
    stats &&
    ((stats.martialPower ?? 0) >= 40 ||
      (stats.knowledge ?? 0) >= 30);
  if (hits.length === 0 && !statAchievement) {
    return null;
  }
  return {
    key: 'achievement',
    ages: hits.map(r => r.age),
    sources: statAchievement
      ? [...hits.map(r => `event:${r.eventId}`), 'stat:threshold_met']
      : hits.map(r => `event:${r.eventId}`),
  };
}

function detectAge40Identity(records: GameProcessRecord[], finalFlags: Record<string, unknown>): DetectedSignal | null {
  const identity = getRouteIdentityFromFlags(finalFlags);
  const hits = records.filter(record => record.age >= 35 && declaredStageSignalsFromRecord(record).includes('age40_identity'));
  if (!identity && hits.length === 0) {
    return null;
  }
  return {
    key: 'age40_identity',
    ages: hits.length > 0 ? hits.map(r => r.age) : [records.length > 0 ? (records[records.length - 1]?.age ?? 40) : 40],
    sources: identity ? [`identity:${identity}`] : hits.map(r => `event:${r.eventId}`),
  };
}

const STAGE_DETECTORS: Record<
  StageSignalKey,
  (records: GameProcessRecord[], finalState: SignalDetectionInput['finalState']) => DetectedSignal | null
> = {
  origin: records => detectOrigin(records),
  childhood_choice: records => detectChildhoodChoice(records),
  early_active_action: records => detectEarlyActiveAction(records),
  route_entry: records => detectRouteEntry(records),
  training_milestone: records => detectTrainingMilestone(records),
  first_turning_point: records => detectFirstTurningPoint(records),
  route_reinforcement: records => detectRouteReinforcement(records),
  identity_signal: (records, finalState) =>
    detectIdentitySignal(records, {
      ...(finalState?.flags ?? {}),
      ...(finalState?.player?.flags ?? {}),
    }),
  relationship_shift: records => detectRelationshipShift(records),
  route_divergence: records => detectRouteDivergence(records),
  achievement: (records, finalState) => detectAchievement(records, finalState),
  age40_identity: (records, finalState) =>
    detectAge40Identity(records, {
      ...(finalState?.flags ?? {}),
      ...(finalState?.player?.flags ?? {}),
    }),
};

export function detectStageSignals(input: SignalDetectionInput): DetectedSignal[] {
  const ageMin = input.ageMin ?? 0;
  const ageMax = input.ageMax ?? 41;
  const scoped = recordsInRange(input.records, ageMin, ageMax);
  const detected: DetectedSignal[] = [];

  for (const key of Object.keys(STAGE_DETECTORS) as StageSignalKey[]) {
    const result = STAGE_DETECTORS[key](scoped, input.finalState);
    if (result) {
      detected.push(result);
    }
  }

  return detected;
}

export function detectStageSignalsForStage(
  stageId: string,
  input: SignalDetectionInput,
): DetectedSignal[] {
  const stage = getProfileStageConfigs().find(item => item.id === stageId);
  if (!stage) {
    return [];
  }
  const ageMin =
    stage.id === 'stage_30_40' && stage.feedbackExpectation.expectedSignals.includes('route_divergence')
      ? 28
      : stage.ageMin;
  const all = detectStageSignals({
    ...input,
    ageMin,
    ageMax: stage.ageMax,
  });
  const expected = stage.feedbackExpectation.expectedSignals.filter(isStageSignalKey);
  return all.filter(item => expected.includes(item.key));
}

export function listEventsCoveringStageSignal(signal: StageSignalKey): EventDefinition[] {
  return eventLoader.getAllEvents().filter(event => {
    const declared = event.metadata?.narrativeScheduling?.stageSignals ?? [];
    if (declared.includes(signal)) {
      return true;
    }
    const tags = (event.metadata?.tags ?? []).map(tag => tag.toLowerCase());
    if (signal === 'route_divergence' && tags.includes('route_divergence')) {
      return true;
    }
    if (signal === 'route_reinforcement' && tags.includes('route_reinforcement')) {
      return true;
    }
    return false;
  });
}

export function observeRoutePoint(
  point: RouteSignalPoint,
  records: GameProcessRecord[],
  finalFlags: Record<string, unknown>,
): { observed: boolean; sources: string[] } {
  const sources: string[] = [];
  const { min, max } = point.ageBand.includes('-')
    ? { min: Number(point.ageBand.split('-')[0]), max: Number(point.ageBand.split('-')[1]) }
    : { min: 0, max: 41 };

  for (const record of records) {
    if (record.age < min || record.age > max) {
      continue;
    }
    if (point.eventId && record.eventId === point.eventId) {
      sources.push(`event:${record.eventId}@age${record.age}`);
    }
    const flags = readFlags(record);
    if (point.flagKey && hasFlag(flags, point.flagKey)) {
      sources.push(`flag:${point.flagKey}@age${record.age}`);
    }
    const meta = getEventMetadata(record.eventId);
    const routeMatch = meta?.routePoints?.some(
      rp =>
        rp.kind === point.kind &&
        rp.ageBand === point.ageBand &&
        (rp.eventId === point.eventId || rp.flagKey === point.flagKey),
    );
    if (routeMatch) {
      sources.push(`metadata:${record.eventId}`);
    }
  }

  if (point.flagKey && hasFlag(finalFlags, point.flagKey)) {
    sources.push(`flag:${point.flagKey}@final`);
  }

  return { observed: sources.length > 0, sources: [...new Set(sources)] };
}

export function getStageExpectedSignals(age: number): StageSignalKey[] {
  const stage = getProfileStageForAge(age);
  if (!stage) {
    return [];
  }
  return stage.feedbackExpectation.expectedSignals.filter(isStageSignalKey);
}

export function getSatisfiedStageSignals(
  records: GameProcessRecord[],
  finalState?: GameState,
  ageMax = 41,
): StageSignalKey[] {
  return detectStageSignals({ records, finalState, ageMax }).map(item => item.key);
}

export function eventCoversMissingStageSignal(
  event: EventDefinition,
  missingSignals: StageSignalKey[],
): boolean {
  const declared = event.metadata?.narrativeScheduling?.stageSignals ?? [];
  return missingSignals.some(signal => declared.includes(signal));
}

export function eventCoversRoutePoint(
  event: EventDefinition,
  point: RouteSignalPoint,
  routeId: string,
): boolean {
  const declared = event.metadata?.narrativeScheduling?.routePoints ?? [];
  if (
    declared.some(
      rp =>
        rp.routeId === routeId &&
        rp.kind === point.kind &&
        rp.ageBand === point.ageBand,
    )
  ) {
    return true;
  }
  if (point.eventId && event.id === point.eventId) {
    return true;
  }
  if (point.flagKey) {
    const effectsCoverFlag = event.autoEffects?.some(
      effect => effect.type === 'flag_set' && effect.target === point.flagKey,
    );
    if (effectsCoverFlag) {
      return true;
    }
  }
  return false;
}
