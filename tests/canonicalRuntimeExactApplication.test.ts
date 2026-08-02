import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { assertCanonicalGameState } from '../src/contracts/validation/canonicalGameStateValidation';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';

function runtimeState() {
  return defaultSnapshotConverter.fromSnapshot(structuredClone(gameStateSnapshotAge50));
}

function own<T extends object>(value: T, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

const input = runtimeState();
input.currentTime = { year: 50, month: 0, day: 0 };
input.player.wealth = 777;
input.player.deathReason = 'saved-death';
input.player.timeUnit = 'month';
input.player.monthProgress = 5;
input.player.dayProgress = 9;

const engine = new GameEngineIntegration();
engine.loadGameState(input);
const loaded = engine.getGameState();

assert.deepEqual(loaded.currentTime, input.currentTime);
assert.notEqual(loaded.currentTime, input.currentTime);
assert.equal(loaded.player.wealth, 777);
assert.equal(loaded.player.deathReason, 'saved-death');
assert.equal(loaded.player.timeUnit, 'month');
assert.equal(loaded.player.monthProgress, 5);
assert.equal(loaded.player.dayProgress, 9);

input.currentTime!.month = 3;
assert.equal(loaded.currentTime!.month, 0);
loaded.currentTime!.day = 4;
assert.equal(input.currentTime!.day, 0);

const zeroState = runtimeState();
zeroState.player.wealth = 0;
zeroState.player.monthProgress = 0;
zeroState.player.dayProgress = 0;
engine.loadGameState(zeroState);
assert.equal(engine.getGameState().player.wealth, 0);
assert.equal(engine.getGameState().player.monthProgress, 0);
assert.equal(engine.getGameState().player.dayProgress, 0);

const staleState = runtimeState();
staleState.player.wealth = 888;
staleState.player.deathReason = 'stale';
staleState.player.timeUnit = 'day';
staleState.player.monthProgress = 8;
staleState.player.dayProgress = 10;
engine.loadGameState(staleState);

const missingState = runtimeState();
delete missingState.currentTime;
delete missingState.player.wealth;
delete missingState.player.deathReason;
delete missingState.player.timeUnit;
delete missingState.player.monthProgress;
delete missingState.player.dayProgress;
const missingSnapshot = defaultSnapshotConverter.toSnapshot(missingState, {
  eventCatalogVersion: 'test',
  sourcePlatform: 'node-headless',
  time: { now: () => 123 },
});
engine.loadGameState(defaultSnapshotConverter.fromSnapshot(missingSnapshot));
const cleared = engine.getGameState();
assert.equal(own(cleared, 'currentTime'), false);
for (const key of ['wealth', 'deathReason', 'timeUnit', 'monthProgress', 'dayProgress']) {
  assert.equal(own(cleared.player, key), false, `player.${key} should be deleted when absent`);
}

assertCanonicalGameState(cleared);
const reserialized = defaultSnapshotConverter.toSnapshot(cleared, {
  eventCatalogVersion: 'test',
  sourcePlatform: 'node-headless',
  time: { now: () => 123 },
});
assert.equal(own(reserialized.state, 'currentTime'), false);
for (const key of ['wealth', 'deathReason', 'timeUnit', 'monthProgress', 'dayProgress']) {
  assert.equal(own(reserialized.state.player, key), false, `snapshot.player.${key} should stay absent`);
}

const roundTripInput = runtimeState();
roundTripInput.currentTime = { year: 50, month: 0, day: 0 };
roundTripInput.player.wealth = 777;
roundTripInput.player.deathReason = 'saved-death';
roundTripInput.player.timeUnit = 'month';
roundTripInput.player.monthProgress = 5;
roundTripInput.player.dayProgress = 9;
const roundTripSnapshot = defaultSnapshotConverter.toSnapshot(roundTripInput, {
  eventCatalogVersion: 'test',
  sourcePlatform: 'node-headless',
  time: { now: () => 123 },
});
const roundTripHydrated = defaultSnapshotConverter.fromSnapshot(roundTripSnapshot);
engine.loadGameState(roundTripHydrated);
assert.deepEqual(engine.getGameState().currentTime, roundTripHydrated.currentTime);
assert.equal(engine.getGameState().player.wealth, 777);
assert.equal(engine.getGameState().player.deathReason, 'saved-death');
assert.equal(engine.getGameState().player.timeUnit, 'month');
assert.equal(engine.getGameState().player.monthProgress, 5);
assert.equal(engine.getGameState().player.dayProgress, 9);
assertCanonicalGameState(engine.getGameState());

console.log('✅ Canonical runtime exact application tests passed');
