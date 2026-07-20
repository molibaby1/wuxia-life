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
  before.roadCommitments = {
    statecraft: {
      roadId: 'statecraft',
      committedAtAge: 16,
      sourceChoiceId: 'study_business',
      sourceEventId: 'merchant_talent_discovery',
      proofCount: 1,
      latestProofEventId: 'merchant_first_shop_grocery',
      lifecycle: 'locked_in',
    },
  };
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
  assert(hydrated.roadCommitments?.statecraft?.lifecycle === 'locked_in', 'road lifecycle');
  assert(hydrated.roadCommitments?.statecraft?.proofCount === 1, 'road proof count');
  assert(hydrated.roadCommitments?.statecraft?.sourceEventId === 'merchant_talent_discovery', 'road source event');
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
