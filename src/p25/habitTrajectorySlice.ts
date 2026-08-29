import { EventLoader } from '../core/EventLoader';
import { ConditionEvaluator } from '../core/ConditionEvaluator';
import { createDefaultPlayerLifeStates } from '../data/life/lifeStates';
import type { GameState, PlayerLifeStates, PlayerState } from '../types/eventTypes';

export type HabitTrajectoryAxis =
  | 'trainingHabit'
  | 'studyHabit'
  | 'businessHabit';

export interface P25HabitEchoFinding {
  phase: 'early_formation' | 'later_echo';
  eventId: string;
  habitAxis: HabitTrajectoryAxis;
  habitValue: number;
  eligible: boolean;
  pointer: string;
  detail: string;
}

export interface P25HabitTrajectorySliceResult {
  slice: 'p25_habit_trajectory_echo';
  findings: P25HabitEchoFinding[];
  earlyFormationPassed: boolean;
  laterEchoPassed: boolean;
  passed: boolean;
}

function basePlayer(
  overrides: Omit<Partial<PlayerState>, 'lifeStates'> & { lifeStates?: Partial<PlayerLifeStates> } = {},
): PlayerState {
  const { lifeStates: lifeStatesOverride, ...rest } = overrides;
  return {
    age: 18,
    name: 'p25-habit',
    gender: 'male',
    martialPower: 30,
    reputation: 15,
    knowledge: 25,
    alive: true,
    lifeStates: createDefaultPlayerLifeStates(lifeStatesOverride),
    flags: {},
    ...rest,
  } as PlayerState;
}

function evaluateEvent(eventId: string, state: GameState): boolean {
  const event = EventLoader.getInstance().getEventById(eventId);
  if (!event?.conditions?.length) return false;
  const evaluator = new ConditionEvaluator();
  return event.conditions.every(c => evaluator.evaluate(c, state));
}

export function runP25HabitTrajectorySlice(): P25HabitTrajectorySliceResult {
  const findings: P25HabitEchoFinding[] = [];

  const earlyTraining = {
    player: basePlayer({
      age: 18,
      lifeStates: { trainingHabit: 2, studyHabit: 0, businessHabit: 0 },
    }),
    flags: { martial_path_started: true },
    relations: {},
    achievements: [],
    eventHistory: [],
    facts: {},
  } as GameState;

  const earlyStudy = {
    ...earlyTraining,
    player: basePlayer({
      age: 18,
      lifeStates: { trainingHabit: 0, studyHabit: 2, businessHabit: 0 },
    }),
    flags: { scholar_path_started: true },
  };

  findings.push({
    phase: 'early_formation',
    eventId: 'p22_early_martial_route_fork',
    habitAxis: 'trainingHabit',
    habitValue: 2,
    eligible: evaluateEvent('p22_early_martial_route_fork', earlyTraining),
    pointer: 'event:p22_early_martial_route_fork @ trainingHabit=2 age=18',
    detail: 'Early martial fork accessible from accumulated training habit',
  });

  findings.push({
    phase: 'early_formation',
    eventId: 'p21_scholar_route_reinforcement',
    habitAxis: 'studyHabit',
    habitValue: 2,
    eligible: evaluateEvent('p21_scholar_route_reinforcement', {
      ...earlyStudy,
      player: { ...earlyStudy.player!, age: 22 },
    }),
    pointer: 'event:p21_scholar_route_reinforcement @ studyHabit=2 age=22',
    detail: 'Scholar reinforcement accessible from accumulated study habit',
  });

  const earlyHealer = {
    player: basePlayer({
      age: 20,
      lifeStates: { trainingHabit: 0, studyHabit: 2, businessHabit: 0 },
    }),
    flags: {},
    relations: {},
    achievements: [],
    eventHistory: [],
  } as GameState;

  findings.push({
    phase: 'early_formation',
    eventId: 'p27_study_habit_healer_reinforcement',
    habitAxis: 'studyHabit',
    habitValue: 2,
    eligible: evaluateEvent('p27_study_habit_healer_reinforcement', earlyHealer),
    pointer: 'event:p27_study_habit_healer_reinforcement @ studyHabit=2 age=20',
    detail: 'P27 medical healer reinforcement from study habit',
  });

  const laterTrainingEcho = {
    player: basePlayer({
      age: 26,
      lifeStates: { trainingHabit: 3, studyHabit: 0, businessHabit: 0 },
    }),
    flags: {},
    relations: {},
    achievements: [],
    eventHistory: [],
  } as GameState;

  const laterStudyEcho = {
    player: basePlayer({
      age: 24,
      lifeStates: { trainingHabit: 0, studyHabit: 3, businessHabit: 0 },
    }),
    flags: {},
    relations: {},
    achievements: [],
    eventHistory: [],
  } as GameState;

  const laterBusinessConsequence = {
    player: basePlayer({
      age: 34,
      lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 3 },
    }),
    flags: {},
    relations: {},
    achievements: [],
    eventHistory: [],
  } as GameState;

  findings.push({
    phase: 'later_echo',
    eventId: 'p26_training_habit_midlife_callback',
    habitAxis: 'trainingHabit',
    habitValue: 3,
    eligible: evaluateEvent('p26_training_habit_midlife_callback', laterTrainingEcho),
    pointer: 'event:p26_training_habit_midlife_callback @ trainingHabit=3 age=26',
    detail: 'Midlife training callback echoes early habit formation',
  });

  findings.push({
    phase: 'later_echo',
    eventId: 'p26_study_habit_midlife_callback',
    habitAxis: 'studyHabit',
    habitValue: 3,
    eligible: evaluateEvent('p26_study_habit_midlife_callback', laterStudyEcho),
    pointer: 'event:p26_study_habit_midlife_callback @ studyHabit=3 age=24',
    detail: 'Midlife study callback echoes early habit formation',
  });

  findings.push({
    phase: 'later_echo',
    eventId: 'p26_business_habit_obligation',
    habitAxis: 'businessHabit',
    habitValue: 3,
    eligible: evaluateEvent('p26_business_habit_obligation', laterBusinessConsequence),
    pointer: 'event:p26_business_habit_obligation @ businessHabit=3 age=34',
    detail: 'Mid/late business obligation echoes accumulated livelihood habit',
  });

  const laterMentorObligation = {
    player: basePlayer({
      age: 32,
      lifeStates: { trainingHabit: 3, studyHabit: 0, businessHabit: 0 },
    }),
    flags: {},
    relations: {},
    achievements: [],
    eventHistory: [],
  } as GameState;

  findings.push({
    phase: 'later_echo',
    eventId: 'p27_mentor_obligation_consequence',
    habitAxis: 'trainingHabit',
    habitValue: 3,
    eligible: evaluateEvent('p27_mentor_obligation_consequence', laterMentorObligation),
    pointer: 'event:p27_mentor_obligation_consequence @ trainingHabit=3 age=32',
    detail: 'P27 mentor obligation from accumulated training habit',
  });

  const laterRenownPressure = {
    player: basePlayer({
      age: 34,
      lifeStates: { trainingHabit: 0, studyHabit: 3, businessHabit: 0 },
    }),
    flags: {},
    relations: {},
    achievements: [],
    eventHistory: [],
  } as GameState;

  findings.push({
    phase: 'later_echo',
    eventId: 'p27_renown_upkeep_pressure',
    habitAxis: 'studyHabit',
    habitValue: 3,
    eligible: evaluateEvent('p27_renown_upkeep_pressure', laterRenownPressure),
    pointer: 'event:p27_renown_upkeep_pressure @ studyHabit=3 age=34',
    detail: 'P27 renown upkeep pressure from accumulated study habit',
  });

  findings.push({
    phase: 'later_echo',
    eventId: 'p29_study_habit_case_record_duty',
    habitAxis: 'studyHabit',
    habitValue: 3,
    eligible: evaluateEvent('p29_study_habit_case_record_duty', {
      player: basePlayer({
        age: 28,
        lifeStates: { trainingHabit: 0, studyHabit: 3, businessHabit: 0 },
      }),
      facts: {},
      flags: { p27_study_healer_path: true },
      relations: {},
      achievements: [],
      eventHistory: [],
    } as GameState),
    pointer: 'event:p29_study_habit_case_record_duty @ studyHabit=3 age=28 + p27_study_healer_path',
    detail: 'P29 studyHabit case-record duty from deep study habit',
  });

  const earlyFormationPassed = findings
    .filter(f => f.phase === 'early_formation')
    .every(f => f.eligible);
  const laterEchoPassed = findings
    .filter(f => f.phase === 'later_echo')
    .every(f => f.eligible);

  return {
    slice: 'p25_habit_trajectory_echo',
    findings,
    earlyFormationPassed,
    laterEchoPassed,
    passed: earlyFormationPassed && laterEchoPassed,
  };
}

export function formatP25HabitTrajectorySliceMarkdown(result: P25HabitTrajectorySliceResult): string {
  const lines = [
    '# P25 Habit Trajectory Echo Slice (P26/P27/P28/P29)',
    '',
    `Decision: **${result.passed ? 'PASS' : 'FAIL'}**`,
    '',
    '## Findings',
  ];
  for (const f of result.findings) {
    lines.push(
      `- [${f.phase}] \`${f.eventId}\` (${f.habitAxis}=${f.habitValue}): ${f.eligible ? 'PASS' : 'FAIL'} — ${f.detail}`,
    );
    lines.push(`  - pointer: \`${f.pointer}\``);
  }
  return lines.join('\n');
}
