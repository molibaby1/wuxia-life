import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { sectChoice } from '../src/data/youthEvents';
import { assertCanonicalGameState } from '../src/contracts/validation/canonicalGameStateValidation';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';

const stayHome = sectChoice.choices?.find(choice => choice.id === 'stay_home');
const joinShaolin = sectChoice.choices?.find(choice => choice.id === 'join_shaolin');
assert(stayHome, 'sect_choice must define stay_home');
assert(joinShaolin, 'sect_choice must define join_shaolin');

const stayHomeEngine = new GameEngineIntegration();
stayHomeEngine.getGameState().player.age = 14;
await stayHomeEngine.executeChoiceEffects(stayHome.effects ?? [], sectChoice.id, stayHome.id);
const stayHomeState = stayHomeEngine.getGameState();

assert.equal(stayHomeState.criticalChoices?.sect_choice, 'none');
assert(stayHomeState.player.flags.familyDisciple === true, 'stay_home must preserve familyDisciple');
assert(
  stayHomeState.player.events?.some(event => event.eventId === 'stay_home'),
  'stay_home event record must be preserved',
);
assert(!JSON.stringify(stayHomeState.criticalChoices).includes('stay_home'));
assertCanonicalGameState(stayHomeState);

const roundTripped = defaultSnapshotConverter.fromSnapshot(defaultSnapshotConverter.toSnapshot(stayHomeState, {
  eventCatalogVersion: '1.0.0',
  sourcePlatform: 'node-headless',
  time: { now: () => 1717200000000 },
}));
assert.equal(roundTripped.criticalChoices?.sect_choice, 'none');

const orthodoxEngine = new GameEngineIntegration();
await orthodoxEngine.executeChoiceEffects(joinShaolin.effects ?? [], sectChoice.id, joinShaolin.id);
assert.equal(orthodoxEngine.getGameState().criticalChoices?.sect_choice, 'orthodox');

const unknownEngine = new GameEngineIntegration();
await assert.rejects(
  () => unknownEngine.executeChoiceEffects([], sectChoice.id, 'unknown_sect_choice'),
  /unknown sect choice/i,
);
assert.equal(unknownEngine.getGameState().criticalChoices?.sect_choice, undefined);
assert(!JSON.stringify(unknownEngine.getGameState().criticalChoices).includes('unknown_sect_choice'));

console.log('✅ Canonical critical choice normalization tests passed');
