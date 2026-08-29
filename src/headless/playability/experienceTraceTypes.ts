import type { P8Persona } from '../../p8/types';
import type { GameState } from '../../types/eventTypes';
import type { SessionPhase } from '../session/sessionTypes';

export const EXPERIENCE_TRACE_SCHEMA_VERSION = 'experience-trace-v1' as const;

export const EXPERIENCE_TRACE_SELECTION_POLICY = {
  kind: 'oracle_effect_score_v1',
  usesHiddenEffects: true,
  deterministic: true,
  normalizedStatUnits: false,
  tieBreaker: 'first_candidate',
} as const;

export interface ExperienceTracePersona {
  id: string;
  name: string;
  strategy: P8Persona['strategy'];
  routePreference: string;
  riskPreference: string;
  relationshipPreference: string;
  choiceTendency: string;
}

export interface ExperienceTraceChoiceCandidate {
  choiceId: string;
  text: string;
  description?: string;
  baseScore: number;
  personaAdjustedScore: number;
  personaBonus: number;
  directEffects: unknown[];
  outcomeEffects: unknown[];
  outcomeCount: number;
  selected: boolean;
}

export interface ExperienceTraceChoiceDecision {
  selectedChoiceId: string;
  selectedScore: number;
  runnerUpChoiceId: string | null;
  runnerUpScore: number | null;
  scoreMargin: number | null;
  tieCount: number;
  tieBrokenByOrder: boolean;
}

export interface ExperienceTraceActiveAction {
  availableActions: Array<{
    actionId: string;
    category: string;
    text: string;
  }>;
  selectedActionId: string;
  selectionReason: string;
  focusStreakCategory: string | null;
  focusStreakCount: number;
}

export interface ExperienceTraceStateValueChange {
  before: unknown;
  after: unknown;
}

export interface ExperienceTraceStateDelta {
  playerStats: Record<string, ExperienceTraceStateValueChange>;
  healthStatus?: ExperienceTraceStateValueChange;
  statuses?: ExperienceTraceStateValueChange;
  lifeStates: Record<string, ExperienceTraceStateValueChange>;
  flagsAdded: Record<string, unknown>;
  flagsRemoved: string[];
  flagsChanged: Record<string, ExperienceTraceStateValueChange>;
  eventHistoryAdded: string[];
  timeBefore: unknown;
  timeAfter: unknown;
}

export interface ExperienceTraceStep {
  sequence: number;
  age: number;
  currentTime: { year: number; month: number; day: number };
  phaseBefore: SessionPhase;
  phaseAfter: SessionPhase;
  event?: {
    id: string;
    title: string;
    text: string;
  };
  choiceCandidates?: ExperienceTraceChoiceCandidate[];
  choiceDecision?: ExperienceTraceChoiceDecision;
  activeAction?: ExperienceTraceActiveAction;
  presentation?: {
    actionSummary?: unknown;
    disturbanceNarrative?: unknown;
    periodSummary?: unknown;
    passiveNarrative?: unknown;
  };
  acknowledgement?: {
    kind: string;
  };
  stateDelta: ExperienceTraceStateDelta;
}

export interface ExperienceTrace {
  schemaVersion: typeof EXPERIENCE_TRACE_SCHEMA_VERSION;
  generatedAt: string;
  runtimePath: 'headless_server';
  persona: ExperienceTracePersona;
  seed: number;
  endAge: number;
  selectionPolicy: typeof EXPERIENCE_TRACE_SELECTION_POLICY;
  steps: ExperienceTraceStep[];
  finalState: GameState;
  stoppedReason: string;
}

const TRACE_PLAYER_STAT_KEYS = [
  'martialPower',
  'constitution',
  'charisma',
  'chivalry',
  'reputation',
  'connections',
  'knowledge',
  'businessAcumen',
  'influence',
] as const;

function jsonValue<T>(value: T): T {
  if (value === undefined) return null as T;
  return JSON.parse(JSON.stringify(value)) as T;
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function collectChangedValues(
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined,
): Record<string, ExperienceTraceStateValueChange> {
  const changes: Record<string, ExperienceTraceStateValueChange> = {};
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  for (const key of keys) {
    const beforeValue = before?.[key];
    const afterValue = after?.[key];
    if (!valuesEqual(beforeValue, afterValue)) {
      changes[key] = { before: jsonValue(beforeValue), after: jsonValue(afterValue) };
    }
  }
  return changes;
}

function optionalChange(before: unknown, after: unknown): ExperienceTraceStateValueChange | undefined {
  return valuesEqual(before, after)
    ? undefined
    : { before: jsonValue(before), after: jsonValue(after) };
}

function buildFlagChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Pick<ExperienceTraceStateDelta, 'flagsAdded' | 'flagsRemoved' | 'flagsChanged'> {
  const flagsAdded: Record<string, unknown> = {};
  const flagsChanged: Record<string, ExperienceTraceStateValueChange> = {};
  const flagsRemoved: string[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of keys) {
    if (!(key in before)) {
      flagsAdded[key] = jsonValue(after[key]);
    } else if (!(key in after)) {
      flagsRemoved.push(key);
    } else if (!valuesEqual(before[key], after[key])) {
      flagsChanged[key] = { before: jsonValue(before[key]), after: jsonValue(after[key]) };
    }
  }

  return { flagsAdded, flagsRemoved: flagsRemoved.sort(), flagsChanged };
}

function historyIdsAdded(before: GameState, after: GameState): string[] {
  const previousLength = before.eventHistory?.length ?? 0;
  return (after.eventHistory ?? [])
    .slice(previousLength)
    .map(entry => entry.eventId)
    .filter((eventId): eventId is string => typeof eventId === 'string');
}

export function createExperienceStateDelta(
  before: GameState,
  after: GameState,
): ExperienceTraceStateDelta {
  const beforePlayer = before.player as unknown as Record<string, unknown>;
  const afterPlayer = after.player as unknown as Record<string, unknown>;
  const playerStats: Record<string, ExperienceTraceStateValueChange> = {};
  for (const key of TRACE_PLAYER_STAT_KEYS) {
    const change = optionalChange(beforePlayer[key], afterPlayer[key]);
    if (change) playerStats[key] = change;
  }

  const healthStatus = optionalChange(before.player.healthStatus, after.player.healthStatus);
  const statuses = optionalChange(before.player.statuses, after.player.statuses);
  const lifeStates = collectChangedValues(
    before.player.lifeStates as unknown as Record<string, unknown>,
    after.player.lifeStates as unknown as Record<string, unknown>,
  );

  return {
    playerStats,
    ...(healthStatus ? { healthStatus } : {}),
    ...(statuses ? { statuses } : {}),
    lifeStates,
    ...buildFlagChanges(before.flags ?? {}, after.flags ?? {}),
    eventHistoryAdded: historyIdsAdded(before, after),
    timeBefore: jsonValue(before.currentTime),
    timeAfter: jsonValue(after.currentTime),
  };
}

export function cloneExperienceTraceValue<T>(value: T): T {
  return jsonValue(value);
}

export function experienceTracePersona(persona: P8Persona): ExperienceTracePersona {
  return {
    id: persona.id,
    name: persona.name,
    strategy: persona.strategy,
    routePreference: persona.routePreference,
    riskPreference: persona.riskPreference,
    relationshipPreference: persona.relationshipPreference,
    choiceTendency: persona.choiceTendency,
  };
}
