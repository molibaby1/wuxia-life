import type { EventDefinition } from '../types/eventTypes';
import type { PlayerState } from '../types/eventTypes';
import { EventLoader } from '../core/EventLoader';
import { resolveP31HabitLedKeyChoiceBridges } from './p31HabitLedKeyChoiceBridges';

/** P31 bridge flag targets compared in JSON↔resolver parity tests. */
export const P31_BRIDGE_FLAGS = [
  'ally_network',
  'medical_pure',
  'medical_divine_doctor_fame',
] as const;

export type P31BridgeFlag = (typeof P31_BRIDGE_FLAGS)[number];

export interface P31BridgeEventSpec {
  eventId: string;
  choiceIndex: number;
  bridgeFlag: P31BridgeFlag;
  habitAxis: 'socialMomentum' | 'studyHabit';
  threshold: number;
  /** Bridge precondition flags the resolver expects before setting bridgeFlag. */
  resolverPreconditions: string[];
}

export const P31_BRIDGE_EVENT_SPECS: P31BridgeEventSpec[] = [
  {
    eventId: 'p28_social_reputation_reinforcement',
    choiceIndex: 0,
    bridgeFlag: 'ally_network',
    habitAxis: 'socialMomentum',
    threshold: 2,
    resolverPreconditions: ['p28_social_reputation_reinforced'],
  },
  {
    eventId: 'p27_study_habit_healer_reinforcement',
    choiceIndex: 0,
    bridgeFlag: 'medical_pure',
    habitAxis: 'studyHabit',
    threshold: 2,
    resolverPreconditions: ['p27_study_healer_path'],
  },
  {
    eventId: 'p29_study_habit_case_record_duty',
    choiceIndex: 0,
    bridgeFlag: 'medical_divine_doctor_fame',
    habitAxis: 'studyHabit',
    threshold: 3,
    resolverPreconditions: ['p27_study_healer_path', 'p29_study_healer_case_duty'],
  },
];

type FlagEffect = { type?: string; flag?: string; target?: string; value?: unknown };

/** Apply positive-choice flag_set effects from a loaded event (runtime JSON path). */
export function applyEventChoiceFlagSets(
  event: EventDefinition,
  choiceIndex: number,
  flags: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...flags };
  const choice = event.choices?.[choiceIndex];
  const effects = (choice?.effects ?? []) as FlagEffect[];
  const bridgeFlagSet = new Set<string>(P31_BRIDGE_FLAGS);
  for (const effect of effects) {
    if (effect.type !== 'flag_set') continue;
    const key = effect.flag ?? effect.target;
    if (!key) continue;
    // ponytail: runtime JSON path mirrors resolver poison mutex; raw JSON effects unchanged in game engine
    if (bridgeFlagSet.has(key) && next.medical_poison_path === true) continue;
    next[key] = effect.value ?? true;
  }
  return next;
}

/** Bridge flags after JSON choice effects vs static resolver for the same player + precondition flags. */
export function compareJsonResolverBridgeParity(
  player: Partial<PlayerState>,
  flagsBeforeBridge: Record<string, unknown>,
  spec: P31BridgeEventSpec,
): {
  jsonFlags: Record<string, unknown>;
  resolverFlags: Record<string, unknown>;
  bridgeFlag: P31BridgeFlag;
  jsonSetsBridge: boolean;
  resolverSetsBridge: boolean;
  aligned: boolean;
} {
  const event = EventLoader.getInstance().getEventById(spec.eventId);
  if (!event) {
    throw new Error(`Missing event ${spec.eventId} for parity compare`);
  }
  const jsonFlags = applyEventChoiceFlagSets(event, spec.choiceIndex, flagsBeforeBridge);
  const resolverFlags = resolveP31HabitLedKeyChoiceBridges(player, jsonFlags);
  const jsonSetsBridge = jsonFlags[spec.bridgeFlag] === true;
  const resolverSetsBridge = resolverFlags[spec.bridgeFlag] === true;
  return {
    jsonFlags,
    resolverFlags,
    bridgeFlag: spec.bridgeFlag,
    jsonSetsBridge,
    resolverSetsBridge,
    aligned: jsonSetsBridge === resolverSetsBridge,
  };
}

/** Precondition flags for resolver-only path (bridge flags absent, preconditions present). */
export function bridgePreconditionFlags(spec: P31BridgeEventSpec): Record<string, unknown> {
  const flags: Record<string, unknown> = {};
  for (const key of spec.resolverPreconditions) {
    flags[key] = true;
  }
  return flags;
}

export function playerAtHabitThreshold(
  spec: P31BridgeEventSpec,
  value: number,
): Partial<PlayerState> {
  return {
    lifeStates: {
      trainingHabit: 0,
      studyHabit: 0,
      businessHabit: 0,
      socialMomentum: 0,
      familyBond: 0,
      [spec.habitAxis]: value,
    },
  };
}

/** P33: JSON runtime path and resolver both block bridge flags when medical_poison_path is set. */
export function comparePoisonMutexParity(spec: P31BridgeEventSpec): {
  bridgeFlag: P31BridgeFlag;
  jsonSetsBridge: boolean;
  resolverSetsBridge: boolean;
  aligned: boolean;
} {
  const seed =
    spec.bridgeFlag === 'medical_divine_doctor_fame' ? { p27_study_healer_path: true } : {};
  const result = compareJsonResolverBridgeParity(
    playerAtHabitThreshold(spec, spec.threshold),
    { ...seed, medical_poison_path: true },
    spec,
  );
  return {
    bridgeFlag: spec.bridgeFlag,
    jsonSetsBridge: result.jsonSetsBridge,
    resolverSetsBridge: result.resolverSetsBridge,
    aligned: result.aligned,
  };
}
