/**
 * P33 habit-zero on-ramp minimal e2e slice — studyHabit 0 → bridge threshold without seeded habits.
 *
 * Models runtime habit accumulation from explicit declared study actions then verifies
 * p27 bridge event eligibility at studyHabit >= 2.
 */
import { EventLoader } from '../core/EventLoader';
import { ConditionEvaluator } from '../core/ConditionEvaluator';
import { getActionById } from '../data/activeActionCatalog';
import { applyDeclaredActionHabitEffects } from './declaredHabitActionSimulation';
import type { PracticeHabitEffect } from '../types/activeActionTypes';
import type { GameState, PlayerLifeStates, PlayerState } from '../types/eventTypes';

export interface P33OnRampStep {
  step: number;
  action: string;
  actionId: string;
  simulatedStatDelta: Record<string, number>;
  declaredHabitEffect?: PracticeHabitEffect;
  studyHabitBefore: number;
  studyHabitAfter: number;
  bridgeEventEligible: boolean;
}

export interface P33HabitZeroOnRampResult {
  slice: 'p33_habit_zero_on_ramp';
  pathId: 'p33_medical_study_habit_on_ramp';
  habitAxis: 'studyHabit';
  thresholdTarget: 2;
  seed: {
    originId: string;
    studyHabitStart: number;
    age: number;
  };
  onRampSequence: P33OnRampStep[];
  thresholdReached: boolean;
  bridgeEventId: 'p27_study_habit_healer_reinforcement';
  bridgeEventEligibleAtThreshold: boolean;
}

function gameStateAtStudyHabit(studyHabit: number, age: number): GameState {
  return {
    player: {
      age,
      name: 'p33-habit-zero',
      traits: [],
      lifeStates: {
        trainingHabit: 0,
        studyHabit,
        businessHabit: 0,
      },
    } as PlayerState,
    facts: {},
    flags: {},
    relations: {},
    achievements: [],
    eventHistory: [],
  };
}

function isBridgeEventEligible(studyHabit: number, age: number): boolean {
  const event = EventLoader.getInstance().getEventById('p27_study_habit_healer_reinforcement');
  if (!event?.conditions?.length) return false;
  const evaluator = new ConditionEvaluator();
  return event.conditions.every(c => evaluator.evaluate(c, gameStateAtStudyHabit(studyHabit, age)));
}

/** studyHabit 0 → explicit study actions → threshold 2 → p27 bridge eligibility. */
export function runP33HabitZeroOnRampSlice(): P33HabitZeroOnRampResult {
  const age = 20;
  let lifeStates: PlayerLifeStates = {
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
  };

  const onRampSequence: P33OnRampStep[] = [];
  const rampActions = [
    { actionId: 'action_study_basic', simulatedStatDelta: { knowledge: 5 } },
    { actionId: 'action_study_basic', simulatedStatDelta: { knowledge: 4 } },
  ];

  for (let i = 0; i < rampActions.length; i++) {
    const before = lifeStates.studyHabit ?? 0;
    const tick = rampActions[i]!;
    lifeStates = applyDeclaredActionHabitEffects(lifeStates, tick.actionId);
    const after = lifeStates.studyHabit ?? 0;
    const action = getActionById(tick.actionId)!;
    onRampSequence.push({
      step: i + 1,
      action: `${action.name} → studyHabit ${before}→${after}`,
      actionId: tick.actionId,
      simulatedStatDelta: tick.simulatedStatDelta,
      declaredHabitEffect: action.habitEffects?.[0],
      studyHabitBefore: before,
      studyHabitAfter: after,
      bridgeEventEligible: isBridgeEventEligible(after, age),
    });
  }

  const threshold = lifeStates.studyHabit ?? 0;
  const eligible = isBridgeEventEligible(threshold, age);

  return {
    slice: 'p33_habit_zero_on_ramp',
    pathId: 'p33_medical_study_habit_on_ramp',
    habitAxis: 'studyHabit',
    thresholdTarget: 2,
    seed: { originId: 'scholar_house', studyHabitStart: 0, age },
    onRampSequence,
    thresholdReached: threshold >= 2,
    bridgeEventId: 'p27_study_habit_healer_reinforcement',
    bridgeEventEligibleAtThreshold: eligible,
  };
}

export function formatP33HabitZeroOnRampMarkdown(result: P33HabitZeroOnRampResult): string {
  return [
    '# P33 Habit-Zero On-Ramp Minimal E2E Slice',
    '',
    `Path: \`${result.pathId}\` → \`${result.bridgeEventId}\` eligibility`,
    '',
    '## Seed',
    '',
    `- Origin: \`${result.seed.originId}\``,
    `- studyHabit start: **${result.seed.studyHabitStart}**`,
    `- Age: ${result.seed.age}`,
    '',
    '## On-ramp sequence (explicit study actions with declared habitEffects)',
    '',
    ...result.onRampSequence.map(
      s =>
        `${s.step}. ${s.action} → studyHabit ${s.studyHabitBefore}→${s.studyHabitAfter} (p27 eligible: ${s.bridgeEventEligible})`,
    ),
    '',
    '## Threshold outcome',
    '',
    `- Threshold target: studyHabit >= ${result.thresholdTarget}`,
    `- Threshold reached: **${result.thresholdReached}**`,
    `- Bridge event eligible: **${result.bridgeEventEligibleAtThreshold}**`,
    '',
    '## Scope note',
    '',
    'Partial slice only — not full birth→death. On-ramp applies declared action effects; bridge unlock chain continues in P33-001 medical short-chain.',
    '',
  ].join('\n');
}
