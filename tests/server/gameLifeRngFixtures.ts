import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot.js';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl.js';
import { SeededRandomSource, type SeededRandomState } from '../../src/headless/adapters/randomSource.js';
import type { Queryable } from '../../server/src/db/pool.js';
import * as lifeRngRepo from '../../server/src/repositories/gameLifeRngRepository.js';
import * as checkpointRepo from '../../server/src/repositories/progressionCheckpointRepository.js';
import type { ProgressionCheckpoint } from '../../server/src/repositories/progressionCheckpointRepository.js';

export async function persistFixtureRngState(
  db: Queryable,
  slotId: string,
  sourceSnapshotId: string,
  targetSnapshotId: string,
  controlledSeedOrState?: number | SeededRandomState,
) {
  const sourceState = await lifeRngRepo.getLifeRngState(db, slotId, sourceSnapshotId);
  const randomState = typeof controlledSeedOrState === 'number'
    ? new SeededRandomSource(controlledSeedOrState).exportState()
    : controlledSeedOrState ?? sourceState.randomState;
  await lifeRngRepo.saveLifeRngState(db, {
    slotId,
    snapshotId: targetSnapshotId,
    lifeId: sourceState.lifeId,
    randomState,
  });
  return { ...sourceState, snapshotId: targetSnapshotId, randomState };
}

export async function saveFixtureCheckpoint(
  db: Queryable,
  slotId: string,
  snapshotId: string,
  snapshot: GameStateSnapshot,
  checkpoint: ProgressionCheckpoint,
): Promise<void> {
  const fixture = HeadlessEngineSessionImpl.create({ snapshot });
  await checkpointRepo.saveCheckpoint(
    db,
    slotId,
    snapshotId,
    checkpoint,
    fixture.getProgressionVolatileState(),
  );
}
