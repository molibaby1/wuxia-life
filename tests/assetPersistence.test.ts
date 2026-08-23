import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { addAsset, hasAsset } from '../src/core/assetOwnership';
import { FixedTimeSource } from '../src/headless/adapters/timeSource';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';

const engine = new GameEngineIntegration();
engine.startNewGame('Asset Persistence', 'male');
const state = engine.getGameState();
state.facts = addAsset(state.facts, 'merchant_shop');

const snapshot = defaultSnapshotConverter.toSnapshot(state, {
  eventCatalogVersion: '1.0.0',
  sourcePlatform: 'node-headless',
  time: new FixedTimeSource(Date.parse('2026-08-23T00:00:00.000Z')),
});

assert.equal(snapshot.metadata.schemaVersion, '3.15.0');

const serialized = JSON.parse(JSON.stringify(snapshot)) as typeof snapshot;
assert.equal(Object.prototype.hasOwnProperty.call(serialized, 'assets'), false);
assert.equal(Object.prototype.hasOwnProperty.call(serialized.state, 'assets'), false);
assert.equal(Object.prototype.hasOwnProperty.call(serialized.state.player, 'assets'), false);

const restored = defaultSnapshotConverter.fromSnapshot(serialized);
assert.equal(hasAsset(restored.facts, 'merchant_shop'), true);

console.log('assetPersistence.test.ts: ok');
