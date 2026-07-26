import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import { FixedTimeSource } from '../src/headless/adapters/timeSource';
import { useGameStore } from '../src/store/gameStore';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runCanonicalStatusFoundationTests(): void {
  const engine = new GameEngineIntegration();
  engine.startNewGame('状态基础测试', 'male');
  const initialState = engine.getGameState();

  assert(initialState.player.healthStatus === 'healthy', 'new engine game must start healthy');
  assert(initialState.player.statuses.length === 0, 'new engine game must start with no statuses');

  initialState.player.healthStatus = 'seriously_injured';
  initialState.player.statuses = ['injured', 'fatigued', 'ill'];

  const snapshot = defaultSnapshotConverter.toSnapshot(initialState, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: new FixedTimeSource(1717200000000),
  });
  assert(snapshot.state.player.healthStatus === 'seriously_injured', 'healthStatus must be persisted');
  assert(
    JSON.stringify(snapshot.state.player.statuses) === JSON.stringify(['injured', 'fatigued', 'ill']),
    'multiple statuses must be persisted',
  );

  const restored = defaultSnapshotConverter.fromSnapshot(JSON.parse(JSON.stringify(snapshot)));
  assert(restored.player.healthStatus === 'seriously_injured', 'healthStatus must round-trip');
  assert(
    JSON.stringify(restored.player.statuses) === JSON.stringify(['injured', 'fatigued', 'ill']),
    'multiple statuses must round-trip',
  );
  assert(
    JSON.stringify(restored.player.lifeStates) === JSON.stringify(initialState.player.lifeStates),
    'lifeStates must remain independent',
  );
  assert(JSON.stringify(restored.flags) === JSON.stringify(initialState.flags), 'flags must remain independent from statuses');

  engine.startNewGame('状态空集测试', 'female');
  const emptyState = engine.getGameState();
  const emptySnapshot = defaultSnapshotConverter.toSnapshot(emptyState, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: new FixedTimeSource(1717200000000),
  });
  const emptyRestored = defaultSnapshotConverter.fromSnapshot(emptySnapshot);
  assert(emptyRestored.player.statuses.length === 0, 'empty statuses must round-trip');

  const store = useGameStore();
  store.startGame('旧入口状态基础测试', 'male');
  assert(store.state.player?.healthStatus === 'healthy', 'deprecated store entry must initialize healthy');
  assert(store.state.player?.statuses.length === 0, 'deprecated store entry must initialize no statuses');
  store.resetGame();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCanonicalStatusFoundationTests();
  console.log('canonicalStatusFoundation.test.ts: ok');
}
