import { assert, assertDeepEqual } from './GameTestFramework';
import { GameTestFramework } from './GameTestFramework';
import { activeActionCatalog } from '../src/data/activeActionCatalog';
import { childhoodActionCatalog } from '../src/data/childhoodActionCatalog';
import { executeActiveActionOnState } from '../src/core/activePlanning/ActivePlanningService';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
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

export function runCanonicalHabitPracticeNarrowingTests(): void {
  testExplicitActiveActionHabitEffects();
  testActiveActionDoesNotProjectLegacyHabitFlags();
  testEchoFlagDoesNotCreateHabit();
}

runCanonicalHabitPracticeNarrowingTests();
console.log('canonicalHabitPracticeNarrowing.test.ts passed');
