import { EventLoader } from '../core/EventLoader';
import { ConditionEvaluator } from '../core/ConditionEvaluator';
import { createDefaultPlayerLifeStates } from '../data/life/lifeStates';
import type { GameState, PlayerLifeStates, PlayerState } from '../types/eventTypes';

const HABIT_TRAJECTORY_EVENT_IDS = [
  'p21_scholar_route_reinforcement',
  'p21_martial_route_reinforcement',
  'p22_early_wealth_route_fork',
  'p22_early_martial_route_fork',
  'p26_study_habit_midlife_callback',
  'p26_training_habit_midlife_callback',
  'p26_business_habit_obligation',
  'p21_study_echo_callback',
  'p27_mentor_obligation_consequence',
  'p27_renown_upkeep_pressure',
  'p27_study_habit_healer_reinforcement',
  'p28_social_momentum_network_fork',
  'p28_social_reputation_reinforcement',
  'p28_family_bond_elder_care',
  'p28_family_bond_sibling_support',
  'p28_family_bond_caretaker_obligation',
  'p29_study_habit_case_record_duty',
  'p29_social_momentum_healer_network',
  'p29_social_momentum_patron_obligation',
  'p42_training_habit_youth_sparring',
  'p42_training_habit_later_guardian',
  'p42_study_habit_childhood_copybook',
  'p42_study_habit_later_chronicle',
  'p42_business_habit_youth_stall',
  'p42_business_habit_midlife_syndicate',
  'p42_social_momentum_youth_introduction',
  'p42_social_momentum_later_testimonial',
  'p42_family_bond_festival_reunion',
  'p42_family_bond_estate_trust',
  'p42_training_habit_martial_clan_echo',
  'p42_training_habit_scholar_body_echo',
  'p42_study_habit_scholar_academy_echo',
  'p42_study_habit_merchant_ledger_echo',
] as const;

function basePlayer(
  overrides: Omit<Partial<PlayerState>, 'lifeStates'> & { lifeStates?: Partial<PlayerLifeStates> } = {},
): PlayerState {
  const { lifeStates: lifeStatesOverride, ...rest } = overrides;
  return {
    age: 24,
    name: 'habit-slice',
    gender: 'male',
    martialPower: 35,
    externalSkill: 30,
    internalSkill: 28,
    qinggong: 25,
    chivalry: 35,
    constitution: 50,
    comprehension: 40,
    sect: null,
    title: null,
    reputation: 20,
    money: 300,
    knowledge: 30,
    charisma: 32,
    businessAcumen: 25,
    influence: 18,
    connections: 12,
    martialHeritage: 8,
    scholarlyHeritage: 5,
    merchantNetwork: 5,
    children: 0,
    spouse: null,
    alive: true,
    lifeStates: createDefaultPlayerLifeStates(lifeStatesOverride),
    facts: {},
    flags: {},
    ...rest,
  } as PlayerState;
}

function makeState(habits: {
  trainingHabit?: number;
  studyHabit?: number;
  businessHabit?: number;
  socialMomentum?: number;
  familyBond?: number;
}): GameState {
  return {
    player: basePlayer({
      age: habits.socialMomentum || habits.familyBond ? 34 : 24,
      lifeStates: {
        trainingHabit: habits.trainingHabit ?? 0,
        studyHabit: habits.studyHabit ?? 0,
        businessHabit: habits.businessHabit ?? 0,
        socialMomentum: habits.socialMomentum ?? 0,
        familyBond: habits.familyBond ?? 0,
      },
    }),
    facts: {},
    flags: {},
    relations: {},
    achievements: [],
    eventHistory: [],
  };
}

function eligibleHabitEvents(state: GameState): string[] {
  const loader = EventLoader.getInstance();
  const evaluator = new ConditionEvaluator();
  const eligible: string[] = [];
  for (const eventId of HABIT_TRAJECTORY_EVENT_IDS) {
    const event = loader.getEventById(eventId);
    if (!event?.conditions?.length) continue;
    const allMatch = event.conditions.every(c => evaluator.evaluate(c, state));
    if (allMatch) eligible.push(eventId);
  }
  return eligible;
}

export interface P20HabitTrajectorySliceResult {
  slice: 'p20_habit_trajectory_divergence';
  highHabitProfile: { trainingHabit: number; studyHabit: number; businessHabit: number };
  lowHabitProfile: { trainingHabit: number; studyHabit: number; businessHabit: number };
  highEligibleEvents: string[];
  lowEligibleEvents: string[];
  exclusiveToHigh: string[];
  exclusiveToLow: string[];
  materiallyDiffers: boolean;
  passed: boolean;
}

export function runP20HabitTrajectorySlice(): P20HabitTrajectorySliceResult {
  const high = makeState({
    trainingHabit: 3,
    studyHabit: 3,
    businessHabit: 3,
    socialMomentum: 3,
    familyBond: 3,
  });
  const low = makeState({
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
    socialMomentum: 0,
    familyBond: 0,
  });
  const highEligibleEvents = eligibleHabitEvents(high);
  const lowEligibleEvents = eligibleHabitEvents(low);
  const exclusiveToHigh = highEligibleEvents.filter(id => !lowEligibleEvents.includes(id));
  const exclusiveToLow = lowEligibleEvents.filter(id => !highEligibleEvents.includes(id));
  const materiallyDiffers = exclusiveToHigh.length >= 3;
  return {
    slice: 'p20_habit_trajectory_divergence',
    highHabitProfile: { trainingHabit: 3, studyHabit: 3, businessHabit: 3 },
    lowHabitProfile: { trainingHabit: 0, studyHabit: 0, businessHabit: 0 },
    highEligibleEvents,
    lowEligibleEvents,
    exclusiveToHigh,
    exclusiveToLow,
    materiallyDiffers,
    passed: materiallyDiffers && highEligibleEvents.length > lowEligibleEvents.length,
  };
}

export function formatP20HabitTrajectorySliceMarkdown(result: P20HabitTrajectorySliceResult): string {
  return [
    '# P20 Habit Trajectory Divergence Slice (P26/P27/P28/P29/P42)',
    '',
    `Decision: **${result.passed ? 'PASS' : 'FAIL'}**`,
    '',
    '## Profiles',
    `- High: ${JSON.stringify(result.highHabitProfile)}`,
    `- Low: ${JSON.stringify(result.lowHabitProfile)}`,
    '',
    '## Eligible habit trajectory events',
    `- High: ${result.highEligibleEvents.join(', ') || '(none)'}`,
    `- Low: ${result.lowEligibleEvents.join(', ') || '(none)'}`,
    `- Exclusive to high: ${result.exclusiveToHigh.join(', ') || '(none)'}`,
    `- Materially differs: ${result.materiallyDiffers}`,
  ].join('\n');
}
