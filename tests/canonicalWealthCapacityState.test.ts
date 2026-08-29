import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import { validateCanonicalSnapshot } from '../src/contracts/validation/canonicalGameStateValidation';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';

const engine = new GameEngineIntegration();
engine.startNewGame('财力契约', 'male');
const state = engine.getGameState();
assert.equal(state.player.wealthCapacity, 'no_surplus');
assert.equal('money' in state.player, false);
assert.equal('wealth' in state.player, false);
assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');

const snapshot = defaultSnapshotConverter.toSnapshot(state, {
  eventCatalogVersion: 'test',
  sourcePlatform: 'node-headless',
  time: { now: () => 1 },
});
assert.equal(snapshot.state.player.wealthCapacity, 'no_surplus');
assert.equal('money' in snapshot.state.player, false);
assert.equal('wealth' in snapshot.state.player, false);

const missing = structuredClone(snapshot) as any;
delete missing.state.player.wealthCapacity;
assert(validateCanonicalSnapshot(missing).some(issue => issue.path === 'snapshot.state.player.wealthCapacity'));

const invalid = structuredClone(snapshot) as any;
invalid.state.player.wealthCapacity = '999';
assert(validateCanonicalSnapshot(invalid).some(issue => issue.path === 'snapshot.state.player.wealthCapacity'));

const legacy315 = structuredClone(snapshot) as any;
legacy315.metadata.schemaVersion = '3.15.0';
assert(validateCanonicalSnapshot(legacy315).some(issue => issue.path === 'snapshot.metadata.schemaVersion'));

const injectedMoney = structuredClone(snapshot) as any;
injectedMoney.state.player.money = 100;
assert(validateCanonicalSnapshot(injectedMoney).some(issue => issue.path === 'snapshot.state.player.money'));

const injectedWealth = structuredClone(snapshot) as any;
injectedWealth.state.player.wealth = 50;
assert(validateCanonicalSnapshot(injectedWealth).some(issue => issue.path === 'snapshot.state.player.wealth'));

console.log('canonicalWealthCapacityState.test.ts: ok');
