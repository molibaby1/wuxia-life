import { validateGameStateSnapshot } from '../src/contracts/validation/contractValidation';
import {
  GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
  type GameStateSnapshot,
} from '../src/contracts/gameStateSnapshot';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { FixedTimeSource } from '../src/headless/adapters/timeSource';
import {
  SnapshotConversionError,
  defaultSnapshotConverter,
} from '../src/headless/snapshot/SnapshotConverter';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function cloneSnapshot(snapshot: GameStateSnapshot): GameStateSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as GameStateSnapshot;
}

function run(): void {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Legacy Health Removal', 'male');
  const initialState = engine.getGameState();
  assert(!('health' in initialState.player), 'new game must not contain legacy player.health');
  assert(initialState.player.healthStatus === 'healthy', 'new game must initialize healthStatus');
  assert(initialState.player.statuses.length === 0, 'new game must initialize empty statuses');

  const snapshot = defaultSnapshotConverter.toSnapshot(initialState, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: new FixedTimeSource(1717200000000),
  });
  assert(snapshot.metadata.schemaVersion === GAME_STATE_SNAPSHOT_SCHEMA_VERSION, 'snapshot must use current schema 3.8.0');
  assert(!('health' in snapshot.state.player), 'snapshot must not contain legacy health');
  assert('healthStatus' in snapshot.state.player, 'snapshot must contain healthStatus');
  assert('statuses' in snapshot.state.player, 'snapshot must contain statuses');

  const restored = defaultSnapshotConverter.fromSnapshot(cloneSnapshot(snapshot));
  assert(!('health' in restored.player), 'restored state must not contain legacy health');
  assert(restored.player.healthStatus === 'healthy', 'healthStatus must round-trip');
  assert(restored.player.statuses.length === 0, 'statuses must round-trip');

  const withHealth = cloneSnapshot(snapshot) as GameStateSnapshot & { state: { player: { health: number } } };
  withHealth.state.player.health = 100;
  const validation = validateGameStateSnapshot(withHealth);
  assert(!validation.ok && validation.errors.includes('forbidden state.player.health'), 'snapshot validation must reject health');
  try {
    defaultSnapshotConverter.fromSnapshot(withHealth);
    throw new Error('snapshot converter must reject health');
  } catch (error) {
    assert(error instanceof SnapshotConversionError, 'health rejection must be a snapshot conversion error');
    assert(error.code === 'SNAPSHOT_FORBIDDEN_FIELD', 'health rejection must identify forbidden field');
  }

  const oldSchema = cloneSnapshot(snapshot);
  oldSchema.metadata.schemaVersion = '3.3.0';
  try {
    defaultSnapshotConverter.fromSnapshot(oldSchema);
    throw new Error('old snapshot schema must be rejected');
  } catch (error) {
    assert(error instanceof SnapshotConversionError, 'old schema rejection must be a snapshot conversion error');
    assert(error.code === 'SNAPSHOT_INVALID', 'old schema rejection must identify unsupported schema');
  }

  console.log('canonicalLegacyHealthRemoval.test.ts: ok');
}

run();
