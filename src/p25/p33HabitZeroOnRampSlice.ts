/**
 * P33 habit-zero on-ramp minimal e2e slice — studyHabit 0 → bridge threshold without seeded habits.
 *
 * Models runtime habit accumulation (comprehension-tagged academic activity) then verifies
 * p27 bridge event eligibility at studyHabit >= 2.
 */
import { EventLoader } from '../core/EventLoader';
import { ConditionEvaluator } from '../core/ConditionEvaluator';
import type { GameState, PlayerState } from '../types/eventTypes';

export interface P33OnRampStep {
  step: number;
  action: string;
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

/** ponytail: mirrors GameEngineIntegration comprehension + academicGain >= 4 → studyHabit +1 */
export function incrementStudyHabitFromComprehension(
  lifeStates: Record<string, number>,
  academicGain: number,
): Record<string, number> {
  const next = { ...lifeStates };
  if (academicGain >= 4) {
    next.studyHabit = Math.min(5, (next.studyHabit ?? 0) + 1);
  }
  return next;
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

/** studyHabit 0 → comprehension on-ramp ticks → threshold 2 → p27 bridge eligibility. */
export function runP33HabitZeroOnRampSlice(): P33HabitZeroOnRampResult {
  const age = 20;
  let lifeStates: Record<string, number> = {
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
  };

  const onRampSequence: P33OnRampStep[] = [];
  const rampActions = [
    { action: 'comprehension_study_session_1 (knowledge +5)', academicGain: 5 },
    { action: 'comprehension_study_session_2 (knowledge +4)', academicGain: 4 },
  ];

  for (let i = 0; i < rampActions.length; i++) {
    const before = lifeStates.studyHabit ?? 0;
    lifeStates = incrementStudyHabitFromComprehension(lifeStates, rampActions[i]!.academicGain);
    const after = lifeStates.studyHabit ?? 0;
    onRampSequence.push({
      step: i + 1,
      action: rampActions[i]!.action,
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
    '## On-ramp sequence (comprehension academic ticks, no seeded threshold)',
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
    'Partial slice only — not full birth→death. On-ramp models runtime habit increment; bridge unlock chain continues in P33-001 medical short-chain.',
    '',
  ].join('\n');
}
