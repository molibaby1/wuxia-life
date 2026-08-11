/**
 * P35 habit-led mixed/pinnacle lifetime sim traces — cross-track and dual-gate paths without static resolver.
 */
import { evaluateMixedDestinies, evaluatePinnacleDestinies } from '../p16/compositeDestiny';
import {
  applyRareLineFlags,
  rollRareEventLines,
  type RareLineRollResult,
} from '../p16/rareEventLines';
import { EventLoader } from '../core/EventLoader';
import { getActionById } from '../data/activeActionCatalog';
import { getWorldProfile } from '../narrative/worldProfile';
import type { EventDefinition } from '../types/eventTypes';
import { applyEventChoiceFlagSets } from './p32BridgeParity';
import { applyDeclaredActionHabitEffects } from './declaredHabitActionSimulation';
import { createSimulationPlayerState } from './simulationPlayerState';
import type { PracticeHabitEffect } from '../types/activeActionTypes';
import type { PlayerLifeStates } from '../types/eventTypes';

type FlagEffect = { type?: string; flag?: string; target?: string; value?: unknown };

export interface P35LifetimeAgeStep {
  age: number;
  phase: 'birth' | 'childhood' | 'youth' | 'midlife' | 'bridge' | 'luck' | 'terminal';
  action: string;
  actionId?: string;
  simulatedStatDelta?: Record<string, number>;
  declaredHabitEffect?: PracticeHabitEffect;
  trainingHabit: number;
  studyHabit: number;
  martialPower: number;
  reputation: number;
}

export interface P35LifetimeEventStep {
  age: number;
  eventId: string;
  choiceIndex: number;
  choiceLabel: string;
  flagsAfter: string[];
}

export interface P35MixedHealerSwordsmanLifetimeResult {
  slice: 'p35_mixed_healer_swordsman_lifetime';
  pathId: 'p35_mixed_healer_swordsman_habit_zero_lifetime';
  outcomeId: 'healer_swordsman';
  seed: {
    originId: string;
    birthAge: number;
    trainingHabitStart: number;
    studyHabitStart: number;
  };
  ageProgression: P35LifetimeAgeStep[];
  eventSequence: P35LifetimeEventStep[];
  terminalCheckpoint: {
    age: number;
    endState: 'mixed_composite_eval_terminal';
    unlocked: boolean;
    crossTrackGroupsSatisfied: number;
  };
  resolvedBridgeFlags: string[];
  crossTrackSignals: string[];
  usedStaticResolver: false;
}

export interface P35PinnacleFailureAttribution {
  grindOnlyLocked: boolean;
  luckGateUnmet: boolean;
  choiceGateMet: boolean;
  detail: string;
}

export interface P35PinnacleMythLegendLifetimeResult {
  slice: 'p35_pinnacle_myth_legend_lifetime';
  pathId: 'p35_pinnacle_myth_legend_habit_zero_lifetime';
  outcomeId: 'jianghu_myth_legend';
  seed: {
    originId: string;
    birthAge: number;
    trainingHabitStart: number;
  };
  ageProgression: P35LifetimeAgeStep[];
  eventSequence: P35LifetimeEventStep[];
  luckWindow: {
    lineId: string;
    age: number;
    triggered: boolean;
    unlocksFlags: string[];
    effectiveProbability: number;
  };
  failureAttribution: P35PinnacleFailureAttribution;
  terminalCheckpoint: {
    age: number;
    endState: 'pinnacle_composite_eval_terminal';
    unlocked: boolean;
    choiceGateMet: boolean;
    luckGateMet: boolean;
  };
  resolvedBridgeFlags: string[];
  usedStaticResolver: false;
}

const MIXED_TERMINAL_AGE = 68;
const PINNACLE_TERMINAL_AGE = 72;

function applyFlagSetsFromEffects(
  effects: FlagEffect[],
  flags: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...flags };
  for (const effect of effects) {
    if (effect.type !== 'flag_set') continue;
    const key = effect.flag ?? effect.target;
    if (!key) continue;
    next[key] = effect.value ?? true;
  }
  return next;
}

function applyEventAutoFlagSets(
  event: EventDefinition,
  flags: Record<string, unknown>,
): Record<string, unknown> {
  return applyFlagSetsFromEffects((event.autoEffects ?? []) as FlagEffect[], flags);
}

function applyEventChoiceOutcomeFlagSets(
  event: EventDefinition,
  choiceIndex: number,
  outcomeId: string,
  flags: Record<string, unknown>,
): Record<string, unknown> {
  const choice = event.choices?.[choiceIndex];
  let next = applyFlagSetsFromEffects((choice?.effects ?? []) as FlagEffect[], flags);
  const outcome = choice?.outcomes?.find(o => o.id === outcomeId);
  if (outcome?.effects) {
    next = applyFlagSetsFromEffects(outcome.effects as FlagEffect[], next);
  }
  return next;
}

function childhoodTrainingFlags(): Record<string, unknown> {
  return {
    p9_echo_training_hook: true,
    p9_early_training_focus: true,
    origin_id: 'martial_family',
  };
}

function buildMixedPlayer(
  age: number,
  lifeStates: PlayerLifeStates,
  stats: { martialPower: number; reputation: number; money: number; connections: number },
) {
  return createSimulationPlayerState({
    name: 'p35-mixed-lifetime',
    age,
    origin: 'martial_family',
    martialPower: stats.martialPower,
    reputation: stats.reputation,
    connections: stats.connections,
    money: stats.money,
    alive: age < MIXED_TERMINAL_AGE,
    lifeStates: {
      trainingHabit: lifeStates.trainingHabit ?? 0,
      studyHabit: lifeStates.studyHabit ?? 0,
    },
  });
}

function buildPinnaclePlayer(
  age: number,
  lifeStates: PlayerLifeStates,
  stats: { martialPower: number; reputation: number; money: number; connections: number },
) {
  return createSimulationPlayerState({
    name: 'p35-pinnacle-lifetime',
    age,
    origin: 'martial_family',
    martialPower: stats.martialPower,
    reputation: stats.reputation,
    connections: stats.connections,
    money: stats.money,
    alive: age < PINNACLE_TERMINAL_AGE,
    lifeStates: {
      trainingHabit: lifeStates.trainingHabit ?? 0,
      studyHabit: lifeStates.studyHabit ?? 0,
    },
  });
}

function activeFlags(flags: Record<string, unknown>): string[] {
  return Object.keys(flags).filter(k => flags[k] === true);
}

/** Dual-track lifetime: martial training on-ramp + medical study on-ramp → cross-track bridges → mixed eval. */
export function runP35MixedHealerSwordsmanLifetimeSlice(): P35MixedHealerSwordsmanLifetimeResult {
  const loader = EventLoader.getInstance();
  const martialFork = loader.getEventById('p22_early_martial_route_fork')!;
  const p27Event = loader.getEventById('p27_study_habit_healer_reinforcement')!;
  const p29Event = loader.getEventById('p29_study_habit_case_record_duty')!;
  const p27Choice = p27Event.choices?.[0];
  const p29Choice = p29Event.choices?.[0];
  const martialChoice = martialFork.choices?.[0];

  let lifeStates: PlayerLifeStates = {
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
  };
  let martialPower = 28;
  let reputation = 14;
  let money = 10;
  const connections = 30;

  lifeStates = applyDeclaredActionHabitEffects(lifeStates, 'action_childhood_training');
  const ageProgression: P35LifetimeAgeStep[] = [
    {
      age: 0,
      phase: 'birth',
      action: 'born martial_family; dual habit axes at 0',
      trainingHabit: 0,
      studyHabit: 0,
      martialPower,
      reputation,
    },
    {
      age: 8,
      phase: 'childhood',
      action: 'action_childhood_training → p9_early_training_focus (martial track seed)',
      actionId: 'action_childhood_training',
      simulatedStatDelta: { martialPower: 4 },
      declaredHabitEffect: getActionById('action_childhood_training')!.habitEffects?.[0],
      trainingHabit: lifeStates.trainingHabit,
      studyHabit: 0,
      martialPower: (martialPower += 4),
      reputation,
    },
  ];

  let flags: Record<string, unknown> = childhoodTrainingFlags();

  const martialRamp = [
    { age: 14, actionId: 'action_training_basic', simulatedStatDelta: { martialPower: 7, reputation: 4 } },
    { age: 17, actionId: 'action_training_basic', simulatedStatDelta: { martialPower: 6, reputation: 4 } },
  ];
  for (const tick of martialRamp) {
    lifeStates = applyDeclaredActionHabitEffects(lifeStates, tick.actionId);
    martialPower += tick.simulatedStatDelta.martialPower!;
    reputation += tick.simulatedStatDelta.reputation!;
    const action = getActionById(tick.actionId)!;
    ageProgression.push({
      age: tick.age,
      phase: 'youth',
      action: `${action.name} → trainingHabit ${lifeStates.trainingHabit}`,
      actionId: tick.actionId,
      simulatedStatDelta: tick.simulatedStatDelta,
      declaredHabitEffect: action.habitEffects?.[0],
      trainingHabit: lifeStates.trainingHabit ?? 0,
      studyHabit: lifeStates.studyHabit ?? 0,
      martialPower,
      reputation,
    });
  }

  const studyRamp = [
    { age: 18, actionId: 'action_study_basic', simulatedStatDelta: { knowledge: 5, reputation: 6, money: 5 } },
    { age: 20, actionId: 'action_study_basic', simulatedStatDelta: { knowledge: 4, reputation: 6, money: 5 } },
    { age: 22, actionId: 'action_study_basic', simulatedStatDelta: { knowledge: 4, reputation: 6, money: 5 } },
  ];
  for (const tick of studyRamp) {
    lifeStates = applyDeclaredActionHabitEffects(lifeStates, tick.actionId);
    reputation += tick.simulatedStatDelta.reputation!;
    money += tick.simulatedStatDelta.money!;
    const action = getActionById(tick.actionId)!;
    ageProgression.push({
      age: tick.age,
      phase: 'youth',
      action: `${action.name} → studyHabit ${lifeStates.studyHabit}`,
      actionId: tick.actionId,
      simulatedStatDelta: tick.simulatedStatDelta,
      declaredHabitEffect: action.habitEffects?.[0],
      trainingHabit: lifeStates.trainingHabit ?? 0,
      studyHabit: lifeStates.studyHabit ?? 0,
      martialPower,
      reputation,
    });
  }

  flags = applyEventChoiceFlagSets(martialFork, 0, flags);
  martialPower += 4;
  const flagsAfterMartialFork = activeFlags(flags);
  ageProgression.push({
    age: 16,
    phase: 'bridge',
    action: `p22_early_martial_route_fork → martial_path_started`,
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: lifeStates.studyHabit ?? 0,
    martialPower,
    reputation: (reputation += 5),
  });

  martialPower = 58;
  reputation = 54;
  money = 38;

  flags = applyEventChoiceFlagSets(p27Event, 0, flags);
  const flagsAfterP27 = activeFlags(flags);
  ageProgression.push({
    age: 34,
    phase: 'bridge',
    action: 'p27_study_habit_healer_reinforcement → medical_pure',
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: lifeStates.studyHabit ?? 0,
    martialPower,
    reputation,
  });

  flags = applyEventChoiceFlagSets(p29Event, 0, flags);
  const flagsAfterP29 = activeFlags(flags);
  reputation = 58;
  money = 42;
  ageProgression.push({
    age: 38,
    phase: 'bridge',
    action: 'p29_study_habit_case_record_duty → medical_divine_doctor_fame',
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: lifeStates.studyHabit ?? 0,
    martialPower: (martialPower = 62),
    reputation,
  });

  const eventSequence: P35LifetimeEventStep[] = [
    {
      age: 16,
      eventId: 'p22_early_martial_route_fork',
      choiceIndex: 0,
      choiceLabel: martialChoice?.id ?? martialChoice?.text ?? 'seek_sect_entry',
      flagsAfter: flagsAfterMartialFork,
    },
    {
      age: 34,
      eventId: 'p27_study_habit_healer_reinforcement',
      choiceIndex: 0,
      choiceLabel: p27Choice?.id ?? p27Choice?.text ?? '顺势钻研医理',
      flagsAfter: flagsAfterP27,
    },
    {
      age: 38,
      eventId: 'p29_study_habit_case_record_duty',
      choiceIndex: 0,
      choiceLabel: p29Choice?.id ?? p29Choice?.text ?? '接下汇辑之责',
      flagsAfter: flagsAfterP29,
    },
  ];

  const terminalPlayer = buildMixedPlayer(MIXED_TERMINAL_AGE, lifeStates, {
    martialPower,
    reputation,
    money,
    connections,
  });
  terminalPlayer.alive = false;

  const mixedReports = evaluateMixedDestinies(terminalPlayer, flags);
  const report = mixedReports.find(r => r.outcomeId === 'healer_swordsman')!;
  const outcome = getWorldProfile('wuxia').mixedDestinyOutcomes!.find(o => o.id === 'healer_swordsman')!;
  const satisfiedGroups = (outcome?.crossTrackGroups ?? []).filter(group =>
    group.requirementIndices.every(idx => report.dimensions[idx]?.status === 'satisfied'),
  );

  ageProgression.push({
    age: MIXED_TERMINAL_AGE,
    phase: 'terminal',
    action: `mixed composite eval → unlocked=${report.unlocked} tracks=${satisfiedGroups.map(g => g.trackId).join('+')}`,
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: lifeStates.studyHabit ?? 0,
    martialPower,
    reputation,
  });

  return {
    slice: 'p35_mixed_healer_swordsman_lifetime',
    pathId: 'p35_mixed_healer_swordsman_habit_zero_lifetime',
    outcomeId: 'healer_swordsman',
    seed: {
      originId: 'martial_family',
      birthAge: 0,
      trainingHabitStart: 0,
      studyHabitStart: 0,
    },
    ageProgression,
    eventSequence,
    terminalCheckpoint: {
      age: MIXED_TERMINAL_AGE,
      endState: 'mixed_composite_eval_terminal',
      unlocked: report.unlocked,
      crossTrackGroupsSatisfied: satisfiedGroups.length,
    },
    resolvedBridgeFlags: ['medical_pure', 'medical_divine_doctor_fame', 'p9_early_training_focus'].filter(
      f => flags[f] === true,
    ),
    crossTrackSignals: satisfiedGroups.map(g => `${g.trackId}:ok`),
    usedStaticResolver: false,
  };
}

/** Pinnacle dual-gate lifetime: orthodox choice gate + hidden_master luck window → jianghu_myth_legend. */
export function runP35PinnacleMythLegendLifetimeSlice(): P35PinnacleMythLegendLifetimeResult {
  const loader = EventLoader.getInstance();
  const sectChoice = loader.getEventById('sect_choice')!;
  const trialEntry = loader.getEventById('orthodox_trial_entry')!;
  const trialService = loader.getEventById('orthodox_trial_service')!;
  const trialCompletion = loader.getEventById('orthodox_trial_completion')!;

  let lifeStates: PlayerLifeStates = {
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
  };
  let martialPower = 32;
  let reputation = 18;
  let money = 12;
  const connections = 22;

  lifeStates = applyDeclaredActionHabitEffects(lifeStates, 'action_childhood_training');
  const ageProgression: P35LifetimeAgeStep[] = [
    {
      age: 0,
      phase: 'birth',
      action: 'born martial_family; trainingHabit=0',
      trainingHabit: 0,
      studyHabit: 0,
      martialPower,
      reputation,
    },
    {
      age: 8,
      phase: 'childhood',
      action: 'action_childhood_training → p9_early_training_focus',
      actionId: 'action_childhood_training',
      simulatedStatDelta: { martialPower: 5 },
      declaredHabitEffect: getActionById('action_childhood_training')!.habitEffects?.[0],
      trainingHabit: lifeStates.trainingHabit,
      studyHabit: 0,
      martialPower: (martialPower += 5),
      reputation,
    },
  ];

  let flags: Record<string, unknown> = childhoodTrainingFlags();
  const eventSequence: P35LifetimeEventStep[] = [];

  const martialRamp = [
    { age: 11, actionId: 'action_training_basic', simulatedStatDelta: { martialPower: 7, reputation: 3 } },
    { age: 12, actionId: 'action_training_basic', simulatedStatDelta: { martialPower: 6, reputation: 3 } },
  ];
  for (const tick of martialRamp) {
    lifeStates = applyDeclaredActionHabitEffects(lifeStates, tick.actionId);
    martialPower += tick.simulatedStatDelta.martialPower!;
    reputation += tick.simulatedStatDelta.reputation!;
    const action = getActionById(tick.actionId)!;
    ageProgression.push({
      age: tick.age,
      phase: 'childhood',
      action: `${action.name} → trainingHabit ${lifeStates.trainingHabit}`,
      actionId: tick.actionId,
      simulatedStatDelta: tick.simulatedStatDelta,
      declaredHabitEffect: action.habitEffects?.[0],
      trainingHabit: lifeStates.trainingHabit ?? 0,
      studyHabit: 0,
      martialPower,
      reputation,
    });
  }

  flags = applyEventChoiceOutcomeFlagSets(sectChoice, 0, 'success', flags);
  const flagsAfterSect = activeFlags(flags);
  eventSequence.push({
    age: 14,
    eventId: 'sect_choice',
    choiceIndex: 0,
    choiceLabel: 'join_shaolin',
    flagsAfter: flagsAfterSect,
  });
  ageProgression.push({
    age: 14,
    phase: 'bridge',
    action: 'sect_choice join_shaolin success',
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: 0,
    martialPower: (martialPower += 3),
    reputation: (reputation += 4),
  });

  flags = applyEventChoiceFlagSets(trialEntry, 0, flags);
  const flagsAfterTrialMind = activeFlags(flags);
  eventSequence.push({
    age: 14,
    eventId: 'orthodox_trial_entry',
    choiceIndex: 0,
    choiceLabel: 'orthodox_trial_mind',
    flagsAfter: flagsAfterTrialMind,
  });
  ageProgression.push({
    age: 14,
    phase: 'bridge',
    action: 'orthodox_trial_entry mind → orthodox_trial_mind_done',
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: 0,
    martialPower,
    reputation: (reputation += 2),
  });

  flags = applyEventChoiceOutcomeFlagSets(trialService, 0, 'great_success', flags);
  const flagsAfterService = activeFlags(flags);
  eventSequence.push({
    age: 15,
    eventId: 'orthodox_trial_service',
    choiceIndex: 0,
    choiceLabel: 'service_aid → great_success',
    flagsAfter: flagsAfterService,
  });
  reputation += 10;
  ageProgression.push({
    age: 15,
    phase: 'bridge',
    action: 'orthodox_trial_service great_success → orthodox_trial_service_done',
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: 0,
    martialPower: (martialPower += 5),
    reputation,
  });

  flags = applyEventAutoFlagSets(trialCompletion, flags);
  const flagsAfterCompletion = activeFlags(flags);
  eventSequence.push({
    age: 16,
    eventId: 'orthodox_trial_completion',
    choiceIndex: -1,
    choiceLabel: 'auto',
    flagsAfter: flagsAfterCompletion,
  });
  martialPower += 8;
  reputation += 6;
  ageProgression.push({
    age: 16,
    phase: 'bridge',
    action: 'orthodox_trial_completion auto → p16_guardian_oath',
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: 0,
    martialPower,
    reputation,
  });

  const luckAge = 20;
  const luckPlayer = buildPinnaclePlayer(luckAge, lifeStates, {
    martialPower: (martialPower = 72),
    reputation: (reputation = 52),
    money,
    connections,
  });
  const rareRolls: RareLineRollResult[] = rollRareEventLines(luckPlayer, flags, () => 0.01);
  flags = applyRareLineFlags(flags, rareRolls);
  const masterRoll = rareRolls.find(r => r.lineId === 'hidden_master_line')!;
  ageProgression.push({
    age: luckAge,
    phase: 'luck',
    action: `hidden_master_line roll (p=${masterRoll.effectiveProbability}) → triggered=${masterRoll.triggered}`,
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: 0,
    martialPower,
    reputation: (reputation += 8),
  });

  const midlifeTicks = [
    { age: 35, mp: 88, rep: 68 },
    { age: 50, mp: 95, rep: 74 },
    { age: 60, mp: 98, rep: 78 },
  ];
  for (const tick of midlifeTicks) {
    martialPower = tick.mp;
    reputation = tick.rep;
    ageProgression.push({
      age: tick.age,
      phase: 'midlife',
      action: 'martial renown grind toward pinnacle stat gates',
      trainingHabit: lifeStates.trainingHabit ?? 0,
      studyHabit: 0,
      martialPower,
      reputation,
    });
  }

  const terminalPlayer = buildPinnaclePlayer(PINNACLE_TERMINAL_AGE, lifeStates, {
    martialPower: 97,
    reputation: 78,
    money: 35,
    connections: 28,
  });
  terminalPlayer.alive = false;

  const pinnacleReports = evaluatePinnacleDestinies(terminalPlayer, flags);
  const report = pinnacleReports.find(r => r.outcomeId === 'jianghu_myth_legend')!;
  const grindPlayer = buildPinnaclePlayer(PINNACLE_TERMINAL_AGE, lifeStates, {
    martialPower: 99,
    reputation: 80,
    money: 40,
    connections: 30,
  });
  const grindOnly = evaluatePinnacleDestinies(grindPlayer, {
    p16_guardian_oath: true,
  }).find(r => r.outcomeId === 'jianghu_myth_legend')!;

  const failureAttribution: P35PinnacleFailureAttribution = {
    grindOnlyLocked: !grindOnly.unlocked,
    luckGateUnmet: grindOnly.unmetGates?.luck !== undefined,
    choiceGateMet: flags.p16_guardian_oath === true,
    detail: grindOnly.unlocked
      ? 'unexpected grind-only unlock'
      : 'grind + choice without luck window stays locked (aligns with p25 rare-window-waste slice)',
  };

  ageProgression.push({
    age: PINNACLE_TERMINAL_AGE,
    phase: 'terminal',
    action: `pinnacle eval → unlocked=${report.unlocked}`,
    trainingHabit: lifeStates.trainingHabit ?? 0,
    studyHabit: 0,
    martialPower: 97,
    reputation: 78,
  });

  return {
    slice: 'p35_pinnacle_myth_legend_lifetime',
    pathId: 'p35_pinnacle_myth_legend_habit_zero_lifetime',
    outcomeId: 'jianghu_myth_legend',
    seed: { originId: 'martial_family', birthAge: 0, trainingHabitStart: 0 },
    ageProgression,
    eventSequence,
    luckWindow: {
      lineId: masterRoll.lineId,
      age: luckAge,
      triggered: masterRoll.triggered,
      unlocksFlags: masterRoll.unlocksFlags,
      effectiveProbability: masterRoll.effectiveProbability,
    },
    failureAttribution,
    terminalCheckpoint: {
      age: PINNACLE_TERMINAL_AGE,
      endState: 'pinnacle_composite_eval_terminal',
      unlocked: report.unlocked,
      choiceGateMet: report.dimensions.some(
        d => d.dimension === 'key_choices' && d.status === 'satisfied',
      ),
      luckGateMet: report.dimensions.some(
        d => d.dimension === 'special_event' && d.status === 'satisfied',
      ),
    },
    resolvedBridgeFlags: ['p16_guardian_oath', 'p16_rare_master_encounter'].filter(f => flags[f] === true),
    usedStaticResolver: false,
  };
}

export function formatP35MixedHealerSwordsmanMarkdown(result: P35MixedHealerSwordsmanLifetimeResult): string {
  return [
    '# P35 Mixed Habit-Led Lifetime Sim Trace — healer_swordsman',
    '',
    `Path: \`${result.pathId}\` → \`${result.outcomeId}\``,
    '',
    '## Seed',
    '',
    `- Origin: \`${result.seed.originId}\``,
    `- Birth age: **${result.seed.birthAge}**`,
    `- trainingHabit / studyHabit start: **${result.seed.trainingHabitStart}** / **${result.seed.studyHabitStart}**`,
    '- Childhood `action_childhood_training` models `p9_early_training_focus` (martial track); no static resolver fixtures',
    '',
    '## Age progression',
    '',
    ...result.ageProgression.map(
      s =>
        `- Age **${s.age}** (${s.phase}): ${s.action} [trainingHabit=${s.trainingHabit}, studyHabit=${s.studyHabit}, mp=${s.martialPower}, rep=${s.reputation}]`,
    ),
    '',
    '## Event sequence (JSON flag_set path)',
    '',
    ...result.eventSequence.map(
      (s, i) =>
        `${i + 1}. Age ${s.age}: \`${s.eventId}\` choice ${s.choiceIndex} (\`${s.choiceLabel}\`) → flags [${s.flagsAfter.join(', ')}]`,
    ),
    '',
    '## Terminal checkpoint',
    '',
    `- Age: **${result.terminalCheckpoint.age}**`,
    `- End state: \`${result.terminalCheckpoint.endState}\``,
    `- Unlocked: **${result.terminalCheckpoint.unlocked}**`,
    `- Cross-track groups satisfied: **${result.terminalCheckpoint.crossTrackGroupsSatisfied}**`,
    `- Cross-track signals: [${result.crossTrackSignals.join(', ')}]`,
    `- Bridge flags: [${result.resolvedBridgeFlags.join(', ')}]`,
    `- Static resolver used: ${result.usedStaticResolver}`,
    '',
  ].join('\n');
}

export function formatP35PinnacleMythLegendMarkdown(result: P35PinnacleMythLegendLifetimeResult): string {
  return [
    '# P35 Pinnacle Habit-Led Lifetime Sim Trace — jianghu_myth_legend',
    '',
    `Path: \`${result.pathId}\` → \`${result.outcomeId}\``,
    '',
    '## Seed',
    '',
    `- Origin: \`${result.seed.originId}\``,
    `- Birth age: **${result.seed.birthAge}**`,
    `- trainingHabit start: **${result.seed.trainingHabitStart}**`,
    '',
    '## Luck window',
    '',
    `- Line: \`${result.luckWindow.lineId}\` at age **${result.luckWindow.age}**`,
    `- Triggered: **${result.luckWindow.triggered}** (p=${result.luckWindow.effectiveProbability})`,
    `- Unlocks flags: [${result.luckWindow.unlocksFlags.join(', ')}]`,
    '',
    '## Failure attribution (grind-only control)',
    '',
    `- Grind-only locked: **${result.failureAttribution.grindOnlyLocked}**`,
    `- Luck gate unmet on grind-only: **${result.failureAttribution.luckGateUnmet}**`,
    `- Choice gate met on success path: **${result.failureAttribution.choiceGateMet}**`,
    `- Detail: ${result.failureAttribution.detail}`,
    '',
    '## Age progression',
    '',
    ...result.ageProgression.map(
      s =>
        `- Age **${s.age}** (${s.phase}): ${s.action} [trainingHabit=${s.trainingHabit}, mp=${s.martialPower}, rep=${s.reputation}]`,
    ),
    '',
    '## Event sequence',
    '',
    ...result.eventSequence.map(
      (s, i) =>
        `${i + 1}. Age ${s.age}: \`${s.eventId}\` (\`${s.choiceLabel}\`) → flags [${s.flagsAfter.join(', ')}]`,
    ),
    '',
    '## Terminal checkpoint',
    '',
    `- Age: **${result.terminalCheckpoint.age}**`,
    `- Unlocked: **${result.terminalCheckpoint.unlocked}**`,
    `- Choice gate met: **${result.terminalCheckpoint.choiceGateMet}**`,
    `- Luck gate met: **${result.terminalCheckpoint.luckGateMet}**`,
    `- Bridge flags: [${result.resolvedBridgeFlags.join(', ')}]`,
    `- Static resolver used: ${result.usedStaticResolver}`,
    '',
  ].join('\n');
}
