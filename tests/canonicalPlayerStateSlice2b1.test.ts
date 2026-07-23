import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import { createDefaultTimeSource } from '../src/headless/adapters/timeSource';
import { gameEngine } from '../src/core/GameEngineIntegration';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runCanonicalPlayerStateSlice2b1Tests(): void {
  gameEngine.startNewGame('Canonical Slice 2B-1', 'male');
  const state = gameEngine.getGameState();
  assert(state.player.traits.length > 0, 'canonical traits remain on new game');
  assert(!('traitProfile' in state.player), 'new game does not create legacy traitProfile');
  assert(!('talents' in state.player), 'new game does not create legacy player.talents');

  const snapshot = defaultSnapshotConverter.toSnapshot(state, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: createDefaultTimeSource(),
  });
  assert(!('talents' in snapshot.state.player), 'snapshot does not persist legacy talents');
  assert(!('traitProfile' in snapshot.state.player), 'snapshot does not persist legacy traitProfile');
  assert(!('growthBiasSummary' in snapshot.state.player), 'snapshot does not persist growthBiasSummary');
  assert(!('talents' in gameStateSnapshotAge50.state.player), 'snapshot fixture does not define legacy talents');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCanonicalPlayerStateSlice2b1Tests();
  console.log('canonicalPlayerStateSlice2b1.test.ts: ok');
}
