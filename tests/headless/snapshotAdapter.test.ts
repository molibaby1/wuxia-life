import { gameEngine } from '../../src/core/GameEngineIntegration';
import { defaultSnapshotConverter } from '../../src/headless/snapshot/SnapshotConverter';
import { createDefaultTimeSource } from '../../src/headless/adapters/timeSource';
import { deriveLifeMemorySummary } from '../../src/core/deriveLifeMemorySummary';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runSnapshotAdapterTests(): void {
  gameEngine.startNewGame('快照测试', 'male');
  const before = gameEngine.getGameState();
  before.routeStates = before.routeStates ?? {};
  before.eventHistory = before.eventHistory ?? [];
  const memoryBefore = deriveLifeMemorySummary(before);

  const snapshot = defaultSnapshotConverter.toSnapshot(before, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: createDefaultTimeSource(),
  });
  assert(snapshot.metadata.eventCatalogVersion === '1.0.0', 'catalog version preserved');

  const hydrated = defaultSnapshotConverter.fromSnapshot(snapshot);
  assert(hydrated.player.name === before.player.name, 'player name round trip');
  assert(JSON.stringify(hydrated.routeStates) === JSON.stringify(before.routeStates), 'route state');
  assert(hydrated.eventHistory.length === before.eventHistory.length, 'event history length');

  gameEngine.loadGameState(hydrated);
  const memoryAfter = deriveLifeMemorySummary(gameEngine.getGameState());
  assert(
    JSON.stringify(memoryAfter) === JSON.stringify(memoryBefore),
    'life memory summary equivalence after hydration',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSnapshotAdapterTests();
  console.log('snapshotAdapter.test.ts: ok');
}
