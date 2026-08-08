import assert from 'node:assert/strict';
import { resolveActiveAction } from '../src/core/activePlanning/ActionResultResolver';
import { activeActionCatalog } from '../src/data/activeActionCatalog';
import { childhoodActionCatalog } from '../src/data/childhoodActionCatalog';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { ActiveActionDefinition } from '../src/types/activeActionTypes';

function action(id: string): ActiveActionDefinition {
  const found = [...activeActionCatalog, ...childhoodActionCatalog].find(item => item.id === id);
  assert(found, `missing action ${id}`);
  return found;
}

function expectedReward(actionDefinition: ActiveActionDefinition): number {
  return actionDefinition.rewards.reduce((sum, reward) => sum + (reward.min + reward.max) / 2, 0);
}

const childhoodTraining = action('action_childhood_training');
const childhoodStudy = action('action_study_lite');

assert.deepEqual(childhoodTraining.duration, childhoodStudy.duration, 'childhood training and study must cost equal time');
assert.equal(childhoodTraining.risk, childhoodStudy.risk, 'childhood training and study must carry equal risk');
assert.deepEqual(childhoodTraining.costs, childhoodStudy.costs, 'childhood training and study must have equal resources costs');
assert.deepEqual(
  childhoodTraining.rewards,
  [{ stat: 'constitution', min: 1, max: 2 }],
  'childhood training must grant a visible, age-valid constitution reward',
);
assert.deepEqual(
  childhoodStudy.rewards,
  [{ stat: 'knowledge', min: 1, max: 2 }],
  'childhood study must grant one comparable knowledge reward channel',
);
assert.deepEqual(childhoodTraining.habitEffects, [{ state: 'trainingHabit', value: 1 }]);
assert.deepEqual(childhoodStudy.habitEffects, [{ state: 'studyHabit', value: 1 }]);
assert.equal(expectedReward(childhoodTraining), expectedReward(childhoodStudy));

const adultTraining = action('action_training_basic');
const adultStudy = action('action_study_basic');

assert.deepEqual(adultTraining.duration, adultStudy.duration, 'adult training and study must cost equal time');
assert.equal(adultTraining.risk, adultStudy.risk, 'adult training and study must carry equal risk');
assert.deepEqual(adultTraining.costs, adultStudy.costs, 'adult training and study must have equal resource costs');
assert.deepEqual(
  adultStudy.rewards,
  [{ stat: 'knowledge', min: 1, max: 3 }],
  'adult study must use one visible canonical reward channel',
);
assert.equal(expectedReward(adultTraining), expectedReward(adultStudy), 'adult expected canonical gains must be equal');
assert.deepEqual(adultTraining.habitEffects, [{ state: 'trainingHabit', value: 1 }]);
assert.deepEqual(adultStudy.habitEffects, [{ state: 'studyHabit', value: 1 }]);

const engine = new GameEngineIntegration();
engine.startNewGame('童年平衡', 'male');
const state = engine.getGameState();
state.player.age = 7;
const trainingResult = resolveActiveAction({ state, actionId: childhoodTraining.id, random: () => 0.5 });
const studyResult = resolveActiveAction({ state, actionId: childhoodStudy.id, random: () => 0.5 });
assert.deepEqual(trainingResult?.deltas, { constitution: 2 });
assert.deepEqual(studyResult?.deltas, { knowledge: 2 });

console.log('activeActionAttributeBalance.test.ts: ok');
