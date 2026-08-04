#!/usr/bin/env tsx
import * as fs from 'node:fs';
import * as path from 'node:path';
import pg from 'pg';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import { selectPersonaActiveAction } from '../../src/p8/personaActionStrategy';
import { getP8PersonaById } from '../../src/p8/personas';
import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot';

const root = process.cwd();
const base = path.join(root, '.tmp/late-life-active-action-baseline');
const observations = JSON.parse(fs.readFileSync(path.join(base, 'observations.json'), 'utf8')) as {
  observations: Array<{ checkpointId: string; personaKey: 'martial' | 'wealth' | 'balanced'; seed: number; selectedActionId: string; age: number }>;
};
const keyToPersona = {
  martial: 'p8-martial-lin',
  wealth: 'p8-wealth-shen',
  balanced: 'p8-balanced-wei',
} as const;

const client = new (pg.default?.Client ?? pg.Client)({ connectionString: process.env.DATABASE_URL ?? 'postgres://wuxia:wuxia@localhost:5532/wuxia_p6b' });
await client.connect();
try {
  const device = (await client.query<{ id: string }>('SELECT id FROM anonymous_devices ORDER BY created_at DESC LIMIT 1')).rows[0];
  if (!device) throw new Error('Browser device not found');
  const slot = (await client.query<{ id: string }>('SELECT id FROM save_slots WHERE device_id=$1 AND slot_index=1', [device.id])).rows[0];
  if (!slot) throw new Error('Browser fixture slot not found');
  const rows = (await client.query<{
    snapshot_hash_before: string;
    snapshot_hash_after: string;
    payload: { actionId?: string };
  }>(
    "SELECT snapshot_hash_before,snapshot_hash_after,payload FROM replay_actions WHERE save_slot_id=$1 AND action_type='active_action' ORDER BY created_at ASC",
    [slot.id],
  )).rows;
  // Three exploratory clicks happened while wiring the Browser driver before
  // the final 60-decision run. Exclude only those explicitly recorded rows.
  const finalRows = rows.slice(-observations.observations.length);
  if (finalRows.length !== observations.observations.length) throw new Error(`replay rows=${rows.length} observations=${observations.observations.length}`);
  const differences = [] as Array<Record<string, unknown>>;
  const results = [] as Array<Record<string, unknown>>;
  for (let index = 0; index < observations.observations.length; index += 1) {
    const observation = observations.observations[index]!;
    const replay = finalRows[index]!;
    const beforeRow = (await client.query<{ snapshot: GameStateSnapshot }>(
      'SELECT snapshot FROM game_snapshots WHERE content_hash=$1 ORDER BY created_at ASC LIMIT 1',
      [replay.snapshot_hash_before],
    )).rows[0];
    if (!beforeRow) throw new Error(`pre-choice snapshot missing for decision ${index + 1}`);
    const personaBase = getP8PersonaById(keyToPersona[observation.personaKey]);
    if (!personaBase) throw new Error(`persona missing ${observation.personaKey}`);
    const persona = { ...personaBase, seed: observation.seed };
    const session = HeadlessEngineSessionImpl.create({ snapshot: beforeRow.snapshot });
    const state = session.getRuntimeState();
    const options = session.getPlanningOptions();
    const oracle = selectPersonaActiveAction({
      persona,
      availableActions: options.map(option => ({ actionId: option.actionId, category: option.category, name: option.text })),
      age: state.player.age,
      focusStreakCategory: state.actionFocusStreak?.category ?? null,
      focusStreakCount: state.actionFocusStreak?.count ?? 0,
    });
    const browserChoice = observation.selectedActionId;
    const replayChoice = replay.payload.actionId ?? null;
    if (replayChoice !== browserChoice) {
      differences.push({ index: index + 1, checkpointId: observation.checkpointId, browserChoice, replayChoice, reason: 'BROWSER_REPLAY_ORDER_MISMATCH' });
    }
    const same = browserChoice === oracle.actionId;
    const reason = same
      ? 'SAME_ORACLE'
      : observation.personaKey === 'balanced'
        ? 'VISIBLE_STATE_BALANCING'
        : observation.publicReason.includes('成本') || observation.publicReason.includes('现金流')
          ? 'VISIBLE_RISK_AVOIDANCE'
          : 'HIDDEN_EFFECTS';
    results.push({ sequence: index + 1, checkpointId: observation.checkpointId, browserChoice, oracleChoice: oracle.actionId, same, reason, oracleReason: oracle.reason, preChoiceSnapshotHash: replay.snapshot_hash_before, postChoiceSnapshotHash: replay.snapshot_hash_after });
  }
  if (differences.length > 0) throw new Error(`Browser replay mismatch: ${JSON.stringify(differences.slice(0, 3))}`);
  const divergenceCount = results.filter(result => result.same === false).length;
  const output = { schemaVersion: 1, policy: 'oracle_effect_score_v1', decisionCount: results.length, divergenceCount, divergenceRate: divergenceCount / results.length, differences: results.filter(result => result.same === false), results };
  fs.writeFileSync(path.join(base, 'oracle-comparison.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`oracle comparison: decisions=${results.length} divergence=${divergenceCount}`);
} finally {
  await client.end();
}

