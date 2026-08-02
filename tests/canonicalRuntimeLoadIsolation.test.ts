import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';

const runtimeState = defaultSnapshotConverter.fromSnapshot(structuredClone(gameStateSnapshotAge50));
runtimeState.player.items = [{ id: 'nested-item', metadata: { rarity: 'rare' } }];
runtimeState.player.events = [{
  eventId: 'player-event',
  stateSnapshot: { player: { flags: { nested: { value: true } } } },
}];
runtimeState.eventHistory[0].stateSnapshot = {
  player: { flags: { nested: { value: true } } },
};
runtimeState.actionHistory = [{
  actionId: 'load-isolation-action',
  category: 'business',
  duration: { value: 2, unit: 'month' },
  deltas: { money: 12, influence: 3 },
  sourceKind: 'active_action',
  age: 50,
  timestamp: { year: 50, month: 3, day: 15 },
}];
runtimeState.inventory = [{ id: 'inventory-item', name: 'item', quantity: 1 }];
runtimeState.ending = { title: 'ending', details: { legacy: ['a'] } };
runtimeState.p16TendencyShaping = {
  discipline: 1,
  endurance: 2,
  caution: 3,
  empathy: 4,
  ambition: 5,
  socialEase: 6,
};
runtimeState.lastSavedAt = 111;
runtimeState.gameTimestamp = 222;

const engine = new GameEngineIntegration();
engine.loadGameState(runtimeState);
const loaded = engine.getGameState();

runtimeState.eventHistory[0].stateSnapshot!.player!.flags!.nested.value = false;
runtimeState.actionHistory![0].duration.value = 99;
runtimeState.actionHistory![0].deltas.money = 99;
runtimeState.player.relationships![0].status = 'external-change';
((runtimeState.player.items![0] as Record<string, unknown>).metadata as Record<string, unknown>).rarity = 'external-change';
runtimeState.player.events![0].stateSnapshot!.player!.flags!.nested.value = false;
runtimeState.inventory![0].quantity = 99;
runtimeState.karma!.history[0].reason = 'external-change';
((runtimeState.ending as Record<string, unknown>).details as Record<string, unknown>).legacy = ['external-change'];
runtimeState.p16TendencyShaping!.discipline = 99;

assert.equal(loaded.eventHistory[0].stateSnapshot!.player!.flags!.nested.value, true);
assert.equal(loaded.actionHistory![0].duration.value, 2);
assert.equal(loaded.actionHistory![0].deltas.money, 12);
assert.equal(loaded.player.relationships![0].status, 'married');
assert.equal(((loaded.player.items![0] as Record<string, unknown>).metadata as Record<string, unknown>).rarity, 'rare');
assert.equal(loaded.player.events![0].stateSnapshot!.player!.flags!.nested.value, true);
assert.equal(loaded.inventory![0].quantity, 1);
assert.equal(loaded.karma!.history[0].reason, 'rescued_villagers_from_bandits');
assert.deepEqual(((loaded.ending as Record<string, unknown>).details as Record<string, unknown>).legacy, ['a']);
assert.equal(loaded.p16TendencyShaping!.discipline, 1);

loaded.eventHistory[0].stateSnapshot!.player!.flags!.nested.value = 'engine-change';
loaded.actionHistory![0].duration.value = 77;
loaded.actionHistory![0].deltas.money = 77;
loaded.player.relationships![0].status = 'engine-change';
((loaded.player.items![0] as Record<string, unknown>).metadata as Record<string, unknown>).rarity = 'engine-change';
loaded.player.events![0].stateSnapshot!.player!.flags!.nested.value = 'engine-change';
loaded.inventory![0].quantity = 77;
loaded.karma!.history[0].reason = 'engine-change';
((loaded.ending as Record<string, unknown>).details as Record<string, unknown>).legacy = ['engine-change'];
loaded.p16TendencyShaping!.discipline = 77;

assert.equal(runtimeState.eventHistory[0].stateSnapshot!.player!.flags!.nested.value, false);
assert.equal(runtimeState.actionHistory![0].duration.value, 99);
assert.equal(runtimeState.actionHistory![0].deltas.money, 99);
assert.equal(runtimeState.player.relationships![0].status, 'external-change');
assert.equal(((runtimeState.player.items![0] as Record<string, unknown>).metadata as Record<string, unknown>).rarity, 'external-change');
assert.equal(runtimeState.player.events![0].stateSnapshot!.player!.flags!.nested.value, false);
assert.equal(runtimeState.inventory![0].quantity, 99);
assert.equal(runtimeState.karma!.history[0].reason, 'external-change');
assert.deepEqual(((runtimeState.ending as Record<string, unknown>).details as Record<string, unknown>).legacy, ['external-change']);
assert.equal(runtimeState.p16TendencyShaping!.discipline, 99);

assert.equal(loaded.lastSavedAt, 111);
assert.equal(loaded.gameTimestamp, 222);

console.log('✅ Canonical runtime load isolation tests passed');
