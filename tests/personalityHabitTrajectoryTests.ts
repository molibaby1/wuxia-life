import { EventLoader } from '../src/core/EventLoader';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import type { GameState } from '../src/types/eventTypes';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { runP20HabitTrajectorySlice } from '../src/p20/habitTrajectorySlice';
import { runP25HabitTrajectorySlice } from '../src/p25/habitTrajectorySlice';
import { selectArchetypeFamily } from '../src/p20/archetypeCoverage';
import {
  P20_MARTIAL_ASCENDANT,
  P20_SCHOLAR_STATESMAN,
  P20_WEALTH_MERCHANT,
} from '../src/narrative/profile/wuxiaReplayabilitySurfaces';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function makeState(): GameState {
  const engine = new GameEngineIntegration() as any;
  const state = engine.getGameState();
  state.player.age = 24;
  state.player.lifeStates = {
    ...state.player.lifeStates,
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
  };
  state.flags = {};
  state.player.flags = {};
  return state;
}

function assertSemiPersonalityGatedEvent(
  eventId: string,
  axisKey: 'socialMomentum' | 'familyBond',
  axisValue: number,
  age = 24,
): void {
  const loader = EventLoader.getInstance();
  const evaluator = new ConditionEvaluator();
  const event = loader.getEventById(eventId);
  assert(event, `missing ${eventId}`);
  const expression = event?.conditions?.[0]?.type === 'expression'
    ? event.conditions[0].expression
    : '';
  assert(
    expression.includes(`lifeStates.${axisKey}`),
    `${eventId} should use lifeStates.${axisKey}, got: ${expression}`,
  );

  const state = makeState();
  state.player.age = age;
  state.player.lifeStates = {
    ...state.player.lifeStates,
    [axisKey]: axisValue,
  };
  assert(
    evaluator.evaluate({ type: 'expression', expression }, state) === true,
    `${eventId} should trigger from ${axisKey}=${axisValue}`,
  );
}

function assertConcreteSocialEvent(
  eventId: string,
  expression: string,
  age: number,
  applyState: (state: GameState) => void,
): void {
  const loader = EventLoader.getInstance();
  const evaluator = new ConditionEvaluator();
  const event = loader.getEventById(eventId);
  assert(event, `missing ${eventId}`);
  const actualExpression = event?.conditions?.[0]?.type === 'expression' ? event.conditions[0].expression : '';
  assert(actualExpression === expression, `${eventId} should use exact expression, got: ${actualExpression}`);

  const state = makeState();
  state.player.age = age;
  applyState(state);
  assert(
    evaluator.evaluate({ type: 'expression', expression }, state) === true,
    `${eventId} should trigger from concrete prerequisites`,
  );
}

function assertHabitGatedEvent(
  eventId: string,
  habitKey: 'trainingHabit' | 'studyHabit' | 'businessHabit',
  habitValue: number,
  age = 24,
): void {
  const loader = EventLoader.getInstance();
  const evaluator = new ConditionEvaluator();
  const event = loader.getEventById(eventId);
  assert(event, `missing ${eventId}`);
  const expression = event?.conditions?.[0]?.type === 'expression'
    ? event.conditions[0].expression
    : '';
  assert(
    expression.includes(`lifeStates.${habitKey}`),
    `${eventId} should use lifeStates.${habitKey}, got: ${expression}`,
  );

  const state = makeState();
  state.player.age = age;
  if (eventId === 'p21_scholar_route_reinforcement') state.flags.scholar_path_started = true;
  if (eventId === 'p21_martial_route_reinforcement') state.flags.martial_path_started = true;
  if (eventId === 'p22_early_wealth_route_fork') state.flags.origin_merchant_family = true;
  if (eventId === 'p22_early_martial_route_fork') state.flags.martial_path_started = true;
  state.player.lifeStates = {
    ...state.player.lifeStates,
    [habitKey]: habitValue,
  };
  assert(
    evaluator.evaluate({ type: 'expression', expression }, state) === true,
    `${eventId} should trigger from ${habitKey}=${habitValue} without legacy habit flag`,
  );
}

function testConditionEvaluatorLifeStateAccess(): void {
  const evaluator = new ConditionEvaluator();
  const state = makeState();
  state.player.lifeStates = {
    ...state.player.lifeStates,
    trainingHabit: 2,
    studyHabit: 1,
    businessHabit: 0,
  };

  const directPlayerState = evaluator.evaluate(
    { type: 'expression', expression: 'player.lifeStates.trainingHabit >= 2' },
    state,
  );
  const shorthandState = evaluator.evaluate(
    { type: 'expression', expression: 'lifeStates.studyHabit >= 1' },
    state,
  );
  assert(directPlayerState === true, 'ConditionEvaluator supports player.lifeStates.trainingHabit');
  assert(shorthandState === true, 'ConditionEvaluator supports lifeStates.studyHabit shorthand');
}

function testP20HabitTrajectorySlice(): void {
  const result = runP20HabitTrajectorySlice();
  assert(result.materiallyDiffers, 'high vs low habit profiles should differ materially');
  assert(result.passed, `P20 habit slice: ${JSON.stringify(result)}`);
}

function testP25HabitTrajectorySlice(): void {
  const result = runP25HabitTrajectorySlice();
  assert(result.earlyFormationPassed, 'early habit formation should unlock fork/reinforcement samples');
  assert(result.laterEchoPassed, 'later callbacks/consequences should echo early habits');
  assert(result.passed, `P25 habit slice: ${JSON.stringify(result.findings)}`);
}

function assertHabitGatedEventOr(
  eventId: string,
  habitKey: 'trainingHabit' | 'studyHabit' | 'businessHabit',
  habitValue: number,
  age: number,
): void {
  const loader = EventLoader.getInstance();
  const evaluator = new ConditionEvaluator();
  const event = loader.getEventById(eventId);
  assert(event, `missing ${eventId}`);
  const expression = event?.conditions?.[0]?.type === 'expression' ? event.conditions[0].expression : '';
  assert(
    expression.includes(`lifeStates.${habitKey}`),
    `${eventId} should reference lifeStates.${habitKey}, got: ${expression}`,
  );
  const state = makeState();
  state.player.age = age;
  state.player.lifeStates = {
    ...state.player.lifeStates,
    trainingHabit: habitKey === 'trainingHabit' ? habitValue : 0,
    studyHabit: habitKey === 'studyHabit' ? habitValue : 0,
    businessHabit: habitKey === 'businessHabit' ? habitValue : 0,
  };
  assert(
    evaluator.evaluate({ type: 'expression', expression }, state) === true,
    `${eventId} should trigger from ${habitKey}=${habitValue}`,
  );
}

function testP21StudyEchoFromStudyHabit(): void {
  const loader = EventLoader.getInstance();
  const evaluator = new ConditionEvaluator();
  const event = loader.getEventById('p21_study_echo_callback');
  assert(event, 'missing p21_study_echo_callback');
  const expression = event?.conditions?.[0]?.type === 'expression' ? event.conditions[0].expression : '';
  assert(expression.includes('lifeStates.studyHabit'), `echo callback should dual-read studyHabit: ${expression}`);

  const state = makeState();
  state.player.age = 26;
  state.player.lifeStates = {
    ...state.player.lifeStates,
    trainingHabit: 0,
    studyHabit: 2,
    businessHabit: 0,
  };
  assert(
    evaluator.evaluate({ type: 'expression', expression }, state) === true,
    'p21_study_echo_callback should trigger from studyHabit without p9_echo_study_hook',
  );
}

function testLifeStatesLedArchetypeSelection(): void {
  const martialState = makeState();
  martialState.flags = { origin_id: 'martial_family', martial_talent_acknowledged: true };
  martialState.player.age = 40;
  martialState.player.martialPower = 70;
  martialState.player.lifeStates = {
    ...martialState.player.lifeStates,
    trainingHabit: 3,
    studyHabit: 0,
    businessHabit: 0,
  };
  const martialFamily = selectArchetypeFamily(martialState);
  assert(martialFamily.familyId === P20_MARTIAL_ASCENDANT.id, 'martial archetype from lifeStates.trainingHabit');
  assert(martialFamily.matchedSignals.includes('growth'), 'growth signal from lifeStates-led habit');

  const scholarState = makeState();
  scholarState.flags = { origin_id: 'scholar_house', scholar_path_started: true, mentor_bond: true };
  scholarState.player.age = 42;
  scholarState.player.knowledge = 60;
  scholarState.player.lifeStates = {
    ...scholarState.player.lifeStates,
    trainingHabit: 0,
    studyHabit: 3,
    businessHabit: 0,
  };
  const scholarFamily = selectArchetypeFamily(scholarState);
  assert(scholarFamily.familyId === P20_SCHOLAR_STATESMAN.id, 'scholar archetype from lifeStates.studyHabit');
  assert(scholarFamily.matchedSignals.includes('growth'), 'scholar growth from lifeStates-led habit');

  const wealthState = makeState();
  wealthState.flags = { origin_id: 'merchant_house', merchant_network_growing: true };
  wealthState.player.age = 38;
  wealthState.player.merchantNetwork = 40;
  wealthState.player.lifeStates = {
    ...wealthState.player.lifeStates,
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 3,
  };
  const wealthFamily = selectArchetypeFamily(wealthState);
  assert(wealthFamily.familyId === P20_WEALTH_MERCHANT.id, 'wealth archetype from lifeStates.businessHabit');
}

function testP28SemiPersonalityRegression(): void {
  assertSemiPersonalityGatedEvent('p28_family_bond_elder_care', 'familyBond', 2, 38);
  assertSemiPersonalityGatedEvent('p28_family_bond_sibling_support', 'familyBond', 2, 30);
  assertSemiPersonalityGatedEvent('p28_family_bond_caretaker_obligation', 'familyBond', 3, 42);
}

function testP42ArchetypeDifferentiation(): void {
  const loader = EventLoader.getInstance();
  const evaluator = new ConditionEvaluator();

  const martialState = makeState();
  martialState.player.age = 34;
  martialState.flags = { martial_path_started: true };
  martialState.player.lifeStates = {
    ...martialState.player.lifeStates,
    trainingHabit: 3,
  };
  const martialEvent = loader.getEventById('p42_training_habit_martial_clan_echo');
  const martialExpr = martialEvent?.conditions?.[0]?.type === 'expression' ? martialEvent.conditions[0].expression : '';
  assert(martialExpr.includes('martial_path_started'), 'martial echo should gate on martial cluster');
  assert(evaluator.evaluate({ type: 'expression', expression: martialExpr }, martialState) === true, 'martial cluster triggers martial echo');

  const scholarTrainState = makeState();
  scholarTrainState.player.age = 32;
  scholarTrainState.flags = { scholar_path_started: true };
  scholarTrainState.player.knowledge = 45;
  scholarTrainState.player.lifeStates = {
    ...scholarTrainState.player.lifeStates,
    trainingHabit: 3,
  };
  const scholarTrainEvent = loader.getEventById('p42_training_habit_scholar_body_echo');
  const scholarTrainExpr = scholarTrainEvent?.conditions?.[0]?.type === 'expression' ? scholarTrainEvent.conditions[0].expression : '';
  assert(evaluator.evaluate({ type: 'expression', expression: scholarTrainExpr }, scholarTrainState) === true, 'scholar cluster triggers body echo');

  const scholarStudyState = makeState();
  scholarStudyState.player.age = 30;
  scholarStudyState.flags = { scholar_path_started: true };
  scholarStudyState.player.lifeStates = {
    ...scholarStudyState.player.lifeStates,
    studyHabit: 3,
  };
  const scholarStudyEvent = loader.getEventById('p42_study_habit_scholar_academy_echo');
  const scholarStudyExpr = scholarStudyEvent?.conditions?.[0]?.type === 'expression' ? scholarStudyEvent.conditions[0].expression : '';
  assert(evaluator.evaluate({ type: 'expression', expression: scholarStudyExpr }, scholarStudyState) === true, 'scholar cluster triggers academy echo');

  const merchantStudyState = makeState();
  merchantStudyState.player.age = 28;
  merchantStudyState.player.businessAcumen = 35;
  merchantStudyState.player.lifeStates = {
    ...merchantStudyState.player.lifeStates,
    studyHabit: 3,
    businessHabit: 2,
  };
  const merchantStudyEvent = loader.getEventById('p42_study_habit_merchant_ledger_echo');
  const merchantStudyExpr = merchantStudyEvent?.conditions?.[0]?.type === 'expression' ? merchantStudyEvent.conditions[0].expression : '';
  assert(merchantStudyExpr.includes('businessHabit'), 'merchant echo should dual-read business context');
  assert(evaluator.evaluate({ type: 'expression', expression: merchantStudyExpr }, merchantStudyState) === true, 'merchant cluster triggers ledger echo');
}

function testP42FamilyBondDensification(): void {
  assertSemiPersonalityGatedEvent('p42_family_bond_festival_reunion', 'familyBond', 2, 48);
  assertSemiPersonalityGatedEvent('p42_family_bond_estate_trust', 'familyBond', 3, 52);
}

function testP42BusinessSocialDensification(): void {
  assertHabitGatedEvent('p42_business_habit_youth_stall', 'businessHabit', 2, 18);
  assertHabitGatedEvent('p42_business_habit_midlife_syndicate', 'businessHabit', 3, 40);
  assertConcreteSocialEvent(
    'p42_social_momentum_youth_introduction',
    'connections >= 5 || reputation >= 10',
    19,
    (state) => {
      state.player.connections = 5;
    },
  );
  assertConcreteSocialEvent(
    'p42_social_momentum_later_testimonial',
    'reputation >= 20 && (flags.p28_social_reputation_reinforced == true || flags.p29_social_patron_obligation_taken == true)',
    52,
    (state) => {
      state.player.reputation = 20;
      state.flags.p28_social_reputation_reinforced = true;
    },
  );
}

function testP42TrainingStudyDensification(): void {
  assertHabitGatedEvent('p42_training_habit_youth_sparring', 'trainingHabit', 2, 16);
  assertHabitGatedEvent('p42_training_habit_later_guardian', 'trainingHabit', 3, 54);
  assertHabitGatedEvent('p42_study_habit_childhood_copybook', 'studyHabit', 2, 12);
  assertHabitGatedEvent('p42_study_habit_later_chronicle', 'studyHabit', 3, 50);
}

function testP29MedicalAndSocialRegression(): void {
  assertHabitGatedEvent('p29_study_habit_case_record_duty', 'studyHabit', 3, 28);
  assertConcreteSocialEvent(
    'p29_social_momentum_healer_network',
    'flags.medical_talent == true && (connections >= 10 || reputation >= 10)',
    26,
    (state) => {
      state.flags.medical_talent = true;
      state.player.connections = 10;
    },
  );
  assertConcreteSocialEvent(
    'p29_social_momentum_patron_obligation',
    'flags.ally_network == true',
    36,
    (state) => {
      state.flags.ally_network = true;
    },
  );
}

async function main(): Promise<void> {
  testConditionEvaluatorLifeStateAccess();
  assertHabitGatedEvent('p21_scholar_route_reinforcement', 'studyHabit', 2, 22);
  assertHabitGatedEvent('p21_martial_route_reinforcement', 'trainingHabit', 2, 20);
  assertHabitGatedEvent('p22_early_wealth_route_fork', 'businessHabit', 2, 18);
  assertHabitGatedEvent('p22_early_martial_route_fork', 'trainingHabit', 2, 16);
  assertHabitGatedEvent('p26_study_habit_midlife_callback', 'studyHabit', 3, 24);
  assertHabitGatedEvent('p26_training_habit_midlife_callback', 'trainingHabit', 3, 26);
  assertHabitGatedEvent('p26_business_habit_obligation', 'businessHabit', 3, 34);
  testP21StudyEchoFromStudyHabit();
  assertHabitGatedEventOr('p27_mentor_obligation_consequence', 'trainingHabit', 3, 30);
  assertHabitGatedEvent('p27_renown_upkeep_pressure', 'studyHabit', 3, 32);
  assertHabitGatedEvent('p27_study_habit_healer_reinforcement', 'studyHabit', 2, 20);
  testP28SemiPersonalityRegression();
  testP29MedicalAndSocialRegression();
  testP42TrainingStudyDensification();
  testP42BusinessSocialDensification();
  testP42FamilyBondDensification();
  testP42ArchetypeDifferentiation();
  testLifeStatesLedArchetypeSelection();
  testP20HabitTrajectorySlice();
  testP25HabitTrajectorySlice();
  console.log('personalityHabitTrajectoryTests: all passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
