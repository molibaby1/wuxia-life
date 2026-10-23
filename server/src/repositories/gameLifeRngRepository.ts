import { randomBytes } from 'node:crypto';
import { SeededRandomSource, type SeededRandomState } from '../../../src/headless/adapters/randomSource.js';
import type { Queryable } from '../db/pool.js';
import { ApiError } from '../errors/apiError.js';

export interface GameLifeRngState {
  saveSlotId: string;
  snapshotId: string;
  lifeId: string;
  randomState: SeededRandomState;
}

interface GameLifeRngStateRow {
  save_slot_id: string;
  snapshot_id: string;
  life_id: string;
  algorithm: string;
  algorithm_version: number;
  seed_source: string;
  initial_seed: string | number;
  current_state: string | number;
  draw_index: string | number;
}

const INVALID_MESSAGE = '此人生缺少可验证的随机进度，已安全停止继续游戏；请通过覆盖存档开始新人生。';

function invalid(reason: string): ApiError {
  return new ApiError(409, 'GAME_RNG_STATE_INVALID', INVALID_MESSAGE, { reason });
}

function safeInteger(value: string | number, field: string): number {
  const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
  if (typeof number !== 'number' || !Number.isSafeInteger(number) || number < 0) {
    throw invalid(`${field} is not a safe non-negative integer`);
  }
  return number;
}

function decodeRow(row: GameLifeRngStateRow, slotId: string, snapshotId: string): GameLifeRngState {
  if (row.save_slot_id !== slotId || row.snapshot_id !== snapshotId) {
    throw invalid('save slot or snapshot binding mismatch');
  }
  if (row.algorithm !== 'mulberry32' || row.algorithm_version !== 1 || row.seed_source !== 'server_csprng') {
    throw invalid('unsupported RNG algorithm, version, or seed source');
  }
  const randomState: SeededRandomState = {
    algorithm: 'mulberry32',
    algorithmVersion: 1,
    initialSeed: safeInteger(row.initial_seed, 'initial_seed'),
    state: safeInteger(row.current_state, 'current_state'),
    drawIndex: safeInteger(row.draw_index, 'draw_index'),
  };
  try {
    SeededRandomSource.fromState(randomState);
  } catch {
    throw invalid('stored RNG state is malformed or internally inconsistent');
  }
  return { saveSlotId: row.save_slot_id, snapshotId: row.snapshot_id, lifeId: row.life_id, randomState };
}

export function createServerLifeRandomSource(): SeededRandomSource {
  return new SeededRandomSource(randomBytes(4).readUInt32BE(0));
}

export async function getLifeRngState(
  db: Queryable,
  slotId: string,
  snapshotId: string,
): Promise<GameLifeRngState> {
  const result = await db.query<GameLifeRngStateRow>(
    `SELECT save_slot_id, snapshot_id, life_id, algorithm, algorithm_version,
            seed_source, initial_seed, current_state, draw_index
       FROM game_life_rng_states
      WHERE snapshot_id = $1`,
    [snapshotId],
  );
  const row = result.rows[0];
  if (!row) throw invalid('RNG state record is missing');
  return decodeRow(row, slotId, snapshotId);
}

export async function saveLifeRngState(
  db: Queryable,
  params: {
    slotId: string;
    snapshotId: string;
    lifeId: string;
    randomState: SeededRandomState;
  },
): Promise<void> {
  try {
    SeededRandomSource.fromState(params.randomState);
  } catch {
    throw invalid('refusing to persist malformed RNG state');
  }
  await db.query(
    `INSERT INTO game_life_rng_states (
       save_slot_id, snapshot_id, life_id, algorithm, algorithm_version,
       seed_source, initial_seed, current_state, draw_index
     ) VALUES ($1, $2, $3, $4, $5, 'server_csprng', $6, $7, $8)`,
    [
      params.slotId,
      params.snapshotId,
      params.lifeId,
      params.randomState.algorithm,
      params.randomState.algorithmVersion,
      params.randomState.initialSeed,
      params.randomState.state,
      String(params.randomState.drawIndex),
    ],
  );
}
