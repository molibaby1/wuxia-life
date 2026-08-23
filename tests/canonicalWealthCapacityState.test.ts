import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import { validateCanonicalSnapshot } from '../src/contracts/validation/canonicalGameStateValidation';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';

const engine = new GameEngineIntegration();
engine.startNewGame('财力契约', 'male');
const state = engine.getGameState();
assert.equal(state.player.wealthCapacity, 'no_surplus');
assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.15.0');

const snapshot = defaultSnapshotConverter.toSnapshot(state, {
  eventCatalogVersion: 'test',
  sourcePlatform: 'node-headless',
  time: { now: () => 1 },
});
assert.equal(snapshot.state.player.wealthCapacity, 'no_surplus');

const missing = structuredClone(snapshot) as any;
delete missing.state.player.wealthCapacity;
assert(validateCanonicalSnapshot(missing).some(issue => issue.path === 'snapshot.state.player.wealthCapacity'));

const invalid = structuredClone(snapshot) as any;
invalid.state.player.wealthCapacity = '999';
assert(validateCanonicalSnapshot(invalid).some(issue => issue.path === 'snapshot.state.player.wealthCapacity'));

const oldVersion = structuredClone(snapshot) as any;
oldVersion.metadata.schemaVersion = '3.14.0';
assert(validateCanonicalSnapshot(oldVersion).some(issue => issue.path === 'snapshot.metadata.schemaVersion'));

console.log('canonicalWealthCapacityState.test.ts: ok');
