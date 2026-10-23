import { ApiError } from '../../server/src/errors/apiError.js';
import {
  createServerLifeRandomSource,
  getLifeRngState,
  saveLifeRngState,
} from '../../server/src/repositories/gameLifeRngRepository.js';
import { SeededRandomSource } from '../../src/headless/adapters/randomSource.js';
import type { Queryable } from '../../server/src/db/pool.js';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function mockDb(row: Record<string, unknown> | null): Queryable & { calls: Array<{ sql: string; values?: unknown[] }> } {
  const calls: Array<{ sql: string; values?: unknown[] }> = [];
  return {
    calls,
    query: async (sql: string, values?: unknown[]) => {
      calls.push({ sql, values });
      return { rows: sql.startsWith('SELECT') && row ? [row] : [], rowCount: row ? 1 : 0 };
    },
  } as unknown as Queryable & { calls: Array<{ sql: string; values?: unknown[] }> };
}

export async function runGameLifeRngRepositoryTests(): Promise<void> {
  const source = new SeededRandomSource(41);
  source.next();
  const state = source.exportState();
  const validRow = {
    save_slot_id: 'slot-1',
    snapshot_id: 'snapshot-1',
    life_id: 'life-1',
    algorithm: state.algorithm,
    algorithm_version: state.algorithmVersion,
    seed_source: 'server_csprng',
    initial_seed: String(state.initialSeed),
    current_state: String(state.state),
    draw_index: String(state.drawIndex),
  };
  const loaded = await getLifeRngState(mockDb(validRow), 'slot-1', 'snapshot-1');
  assert(loaded.lifeId === 'life-1' && loaded.randomState.drawIndex === 1,
    'valid persisted state restores its life identity and exact draw position');

  const mismatched = { ...validRow, save_slot_id: 'other-slot' };
  let bindingRejected = false;
  try { await getLifeRngState(mockDb(mismatched), 'slot-1', 'snapshot-1'); }
  catch (error) { bindingRejected = error instanceof ApiError && error.code === 'GAME_RNG_STATE_INVALID'; }
  assert(bindingRejected, 'a state bound to another slot fails closed');

  const inconsistent = { ...validRow, current_state: String((state.state + 1) >>> 0) };
  let corruptRejected = false;
  try { await getLifeRngState(mockDb(inconsistent), 'slot-1', 'snapshot-1'); }
  catch (error) { corruptRejected = error instanceof ApiError && error.code === 'GAME_RNG_STATE_INVALID'; }
  assert(corruptRejected, 'an internally inconsistent RNG state fails closed');

  let missingRejected = false;
  try { await getLifeRngState(mockDb(null), 'slot-1', 'snapshot-1'); }
  catch (error) { missingRejected = error instanceof ApiError && error.code === 'GAME_RNG_STATE_INVALID'; }
  assert(missingRejected, 'a historical snapshot without RNG state is not initialized on read');

  const writeDb = mockDb(null);
  await saveLifeRngState(writeDb, {
    slotId: 'slot-1', snapshotId: 'snapshot-2', lifeId: 'life-1', randomState: state,
  });
  assert(writeDb.calls.some(call => call.sql.includes('INSERT INTO game_life_rng_states')),
    'life RNG state writes use the independent persistence table');

  const serverSource = createServerLifeRandomSource();
  assert(serverSource.exportState().drawIndex === 0,
    'server CSPRNG creates a fresh state without consuming a game draw');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runGameLifeRngRepositoryTests().then(() => console.log('gameLifeRngRepository.test.ts: ok'));
}
