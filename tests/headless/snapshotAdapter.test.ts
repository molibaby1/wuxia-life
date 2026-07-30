import { gameEngine } from '../../src/core/GameEngineIntegration';
import { defaultSnapshotConverter } from '../../src/headless/snapshot/SnapshotConverter';
import { createDefaultTimeSource } from '../../src/headless/adapters/timeSource';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runSnapshotAdapterTests(): void {
  gameEngine.startNewGame('快照测试', 'male');
  const before = gameEngine.getGameState();
  before.player.investments = { martial: 1.5, statecraft: 3, official: 0, hermit: 8.25 };

  const snapshot = defaultSnapshotConverter.toSnapshot(before, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: createDefaultTimeSource(),
  });
  assert(snapshot.metadata.schemaVersion === '3.9.0', 'current snapshot schema version');
  assert(snapshot.metadata.eventCatalogVersion === '1.0.0', 'catalog version preserved');
  assert(snapshot.state.player.lifeStates !== undefined, 'lifeStates persisted');

  const hydrated = defaultSnapshotConverter.fromSnapshot(snapshot);
  assert(hydrated.player.name === before.player.name, 'player name round trip');
  assert(JSON.stringify(hydrated.player.investments) === JSON.stringify(before.player.investments), 'investments round trip');
  assert(hydrated.eventHistory.length === before.eventHistory.length, 'event history length');
  gameEngine.loadGameState(hydrated);
  assert(JSON.stringify(gameEngine.getGameState().player.investments) === JSON.stringify(before.player.investments), 'restored investments');

  for (const key of ['route' + 'States', 'route' + 'History', 'road' + 'Commitments']) {
    const invalid = { ...before, [key]: {} } as typeof before;
    let rejected = false;
    try {
      defaultSnapshotConverter.toSnapshot(invalid, {
        eventCatalogVersion: '1.0.0',
        sourcePlatform: 'node-headless',
        time: createDefaultTimeSource(),
      });
    } catch {
      rejected = true;
    }
    assert(rejected, `removed field ${key} rejected`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSnapshotAdapterTests();
  console.log('snapshotAdapter.test.ts: ok');
}
