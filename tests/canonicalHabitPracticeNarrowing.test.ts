import { assert, assertDeepEqual } from './GameTestFramework';
import { GameTestFramework } from './GameTestFramework';
import { activeActionCatalog } from '../src/data/activeActionCatalog';
import { childhoodActionCatalog } from '../src/data/childhoodActionCatalog';
import { executeActiveActionOnState } from '../src/core/activePlanning/ActivePlanningService';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import fs from 'node:fs';
import path from 'node:path';
import { EventLoader } from '../src/core/EventLoader';
import type { GameState } from '../src/types/eventTypes';

const framework = new GameTestFramework();

function createState(): GameState {
  return (framework as unknown as { createTestState(): GameState }).createTestState();
}

function findAction(id: string) {
  const action = [...activeActionCatalog, ...childhoodActionCatalog].find(item => item.id === id);
  if (!action) throw new Error(`action not found: ${id}`);
  return action;
}

function testExplicitActiveActionHabitEffects(): void {
  assertDeepEqual(findAction('action_training_basic').habitEffects, [
    { state: 'trainingHabit', value: 1 },
  ], 'quarterly training must explicitly add training practice');
  assertDeepEqual(findAction('action_study_basic').habitEffects, [
    { state: 'studyHabit', value: 1 },
  ], 'quarterly study must explicitly add study practice');
  assertDeepEqual(findAction('action_business_basic').habitEffects, [
    { state: 'businessHabit', value: 1 },
  ], 'quarterly business must explicitly add business practice');
  assertDeepEqual(findAction('action_childhood_training').habitEffects, [
    { state: 'trainingHabit', value: 1 },
  ], 'quarterly childhood training is explicit practice');
  assertDeepEqual(findAction('action_study_lite').habitEffects, [
    { state: 'studyHabit', value: 1 },
  ], 'quarterly childhood study is explicit practice');
  assertDeepEqual(findAction('action_household_apprentice').habitEffects, [
    { state: 'businessHabit', value: 1 },
  ], 'quarterly household apprenticeship is explicit practice');
  assert(findAction('action_childhood_yard_play').habitEffects === undefined, 'yard play is not training practice');
  assert(findAction('action_household_errand').habitEffects === undefined, 'one-month errand is not business practice');
}

function testActiveActionDoesNotProjectLegacyHabitFlags(): void {
  const state = createState();
  state.flags = {};
  state.player.flags = {};
  state.player.lifeStates = createDefaultPlayerLifeStates();
  state.player.lifeStates.trainingHabit = 0;

  executeActiveActionOnState(state, 'action_training_basic', {
    random: () => 0.5,
    includeDisturbance: false,
  });

  assert(state.player.lifeStates.trainingHabit === 1, 'explicit effect adds training practice');
  assert(state.flags.training_habit === undefined, 'game flags must not project training_habit');
  assert(state.player.flags.training_habit === undefined, 'player flags must not project training_habit');
}

function testEchoFlagDoesNotCreateHabit(): void {
  const state = createState();
  state.flags = {};
  state.player.flags = {};
  state.player.lifeStates = createDefaultPlayerLifeStates();
  state.player.lifeStates.trainingHabit = 0;

  const yardPlay = findAction('action_childhood_yard_play');
  assert(yardPlay.onCompleteFlags?.includes('p9_echo_training_hook') === true, 'fixture keeps route echo fact');
  executeActiveActionOnState(state, yardPlay.id, {
    random: () => 0.5,
    includeDisturbance: false,
  });

  assert(state.flags.p9_echo_training_hook === true, 'route echo fact remains');
  assert(state.player.lifeStates.trainingHabit === 0, 'echo flag must not create training practice');
}

function eventHasHabitEffect(
  eventId: string,
  target: 'trainingHabit' | 'studyHabit' | 'businessHabit',
  choiceId?: string,
): boolean {
  const event = EventLoader.getInstance().getEventById(eventId);
  if (!event) throw new Error(`event not found: ${eventId}`);
  const effects = choiceId
    ? event.choices?.find(item => item.id === choiceId)?.effects ?? []
    : event.autoEffects ?? [];
  return effects.some(effect => effect.type === 'life_state_change' && effect.target === target);
}

function testRejectedExplicitFormalProducersAreRemoved(): void {
  assert(!eventHasHabitEffect('martial_arts_enlightenment', 'studyHabit', 'balanced_start'), 'balanced enlightenment must not create study practice');
  assert(!eventHasHabitEffect('p9_childhood_balanced_posture', 'studyHabit'), 'one childhood posture test must not create study practice');
  assert(!eventHasHabitEffect('p9_childhood_first_trade', 'businessHabit'), 'first trade must not create long-term business practice');
  assert(!eventHasHabitEffect('childhood_preference', 'studyHabit', 'balance_both'), 'one balanced childhood choice must not create study practice');
}

function testFormalEventTagsDoNotAutoCreateHabit(): void {
  const source = fs.readFileSync(path.resolve('src/core/GameEngineIntegration.ts'), 'utf8');
  assert(!/martialGain\s*>=\s*8[\s\S]{0,260}trainingHabit/.test(source), 'martial gain threshold must not create trainingHabit');
  assert(!/academicGain\s*>=\s*3[\s\S]{0,260}studyHabit/.test(source), 'academic gain threshold must not create studyHabit');
  assert(!/moneyGain\s*>=\s*25[\s\S]{0,320}businessHabit/.test(source), 'business gain threshold must not create businessHabit');
}

export function runCanonicalHabitPracticeNarrowingTests(): void {
  testExplicitActiveActionHabitEffects();
  testActiveActionDoesNotProjectLegacyHabitFlags();
  testEchoFlagDoesNotCreateHabit();
  testRejectedExplicitFormalProducersAreRemoved();
  testFormalEventTagsDoNotAutoCreateHabit();
}

runCanonicalHabitPracticeNarrowingTests();
