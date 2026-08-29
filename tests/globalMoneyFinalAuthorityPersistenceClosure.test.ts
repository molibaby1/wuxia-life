/**
 * Final Authority & Persistence Closure Correction — Human three-check + nested pin.
 * Does not re-prove the full Phase F matrix (see globalMoneyPhysicalRemovalClosure).
 */
import assert from 'node:assert/strict';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import { validateGameStateSnapshot } from '../src/contracts/validation/contractValidation';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import { writePlayerNumeric } from '../src/utils/playerStatAccess';

process.env.WUXIA_ENGINE_QUIET = '1';

assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');

function testFreshPlayerHasNoExactBalanceOwnProperties(): void {
  const engine = new GameEngineIntegration();
  engine.startNewGame('final-closure', 'male');
  const player = engine.getGameState().player as object;
  assert.equal(Object.prototype.hasOwnProperty.call(player, 'money'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(player, 'wealth'), false);
  assert.equal(typeof (player as { wealthCapacity?: unknown }).wealthCapacity, 'string');
}

function testPriorSchemaHardRejectedNoMigration(): void {
  const snapshot = structuredClone(gameStateSnapshotAge50);
  snapshot.metadata.schemaVersion = '3.15.0';
  assert.equal(validateGameStateSnapshot(snapshot).ok, false, '3.15.0 must be rejected');
  assert.throws(
    () => defaultSnapshotConverter.fromSnapshot(snapshot),
    /3\.16\.0|schemaVersion|unsupported|invalid/i,
  );
}

function testWealthCapacityRoundTripWithoutLegacyFields(): void {
  const engine = new GameEngineIntegration();
  engine.startNewGame('round-trip', 'female');
  const before = engine.getGameState().player.wealthCapacity;
  const snapshot = defaultSnapshotConverter.toSnapshot(engine.getGameState(), {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: { now: () => 1717200000000 },
  });
  assert.equal(snapshot.metadata.schemaVersion, '3.16.0');
  assert.equal('money' in snapshot.state.player, false);
  assert.equal('wealth' in snapshot.state.player, false);
  const hydrated = defaultSnapshotConverter.fromSnapshot(snapshot);
  assert.equal(hydrated.player.wealthCapacity, before);
  assert.equal(Object.prototype.hasOwnProperty.call(hydrated.player, 'money'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(hydrated.player, 'wealth'), false);
}

function testNestedExactBalancesRejected(): void {
  for (const field of ['money', 'wealth'] as const) {
    const snapshot = structuredClone(gameStateSnapshotAge50);
    const nestedPlayer = structuredClone(snapshot.state.player) as Record<string, unknown>;
    nestedPlayer[field] = 99;
    snapshot.state.eventHistory = [{
      eventId: `nested-${field}`,
      stateSnapshot: { player: nestedPlayer as never },
    }];
    const result = validateGameStateSnapshot(snapshot);
    assert.equal(result.ok, false, `nested ${field} must reject`);
    assert.throws(() => defaultSnapshotConverter.fromSnapshot(snapshot));
  }
}

function testGenericWriterCannotRecreate(): void {
  const engine = new GameEngineIntegration();
  engine.startNewGame('writer', 'male');
  const player = engine.getGameState().player;
  writePlayerNumeric(player, 'money', 1);
  writePlayerNumeric(player, 'wealth', 1);
  assert.equal(Object.prototype.hasOwnProperty.call(player, 'money'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(player, 'wealth'), false);
}

testFreshPlayerHasNoExactBalanceOwnProperties();
testPriorSchemaHardRejectedNoMigration();
testWealthCapacityRoundTripWithoutLegacyFields();
testNestedExactBalancesRejected();
testGenericWriterCannotRecreate();

console.log('globalMoneyFinalAuthorityPersistenceClosure.test.ts: ok');
