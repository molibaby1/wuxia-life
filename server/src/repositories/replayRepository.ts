import type { Queryable } from '../db/pool.js';
import { newId } from '../util/ids.js';

export type ReplayActionType =
  | 'session_created'
  | 'session_restored'
  | 'choice_executed'
  | 'active_action'
  | 'progression_ack'
  | 'automatic_progression'
  | 'manual_save'
  | 'terminal';

export interface ReplayActionRow {
  id: string;
  session_id: string;
  save_slot_id: string;
  sequence_number: number;
  action_type: ReplayActionType;
  event_id: string | null;
  choice_id: string | null;
  snapshot_hash_before: string | null;
  snapshot_hash_after: string | null;
  payload: Record<string, unknown>;
  created_at: Date;
}

export async function nextSequenceNumber(db: Queryable, sessionId: string): Promise<number> {
  const result = await db.query<{ max: number | null }>(
    'SELECT MAX(sequence_number) AS max FROM replay_actions WHERE session_id = $1',
    [sessionId],
  );
  return (result.rows[0]?.max ?? 0) + 1;
}

export async function appendReplayAction(
  db: Queryable,
  params: {
    sessionId: string;
    saveSlotId: string;
    actionType: ReplayActionType;
    eventId?: string;
    choiceId?: string;
    snapshotHashBefore?: string;
    snapshotHashAfter?: string;
    payload?: Record<string, unknown>;
  },
): Promise<ReplayActionRow> {
  const sequenceNumber = await nextSequenceNumber(db, params.sessionId);
  const id = newId();
  const result = await db.query<ReplayActionRow>(
    `INSERT INTO replay_actions (
      id, session_id, save_slot_id, sequence_number, action_type,
      event_id, choice_id, snapshot_hash_before, snapshot_hash_after, payload
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
    RETURNING *`,
    [
      id,
      params.sessionId,
      params.saveSlotId,
      sequenceNumber,
      params.actionType,
      params.eventId ?? null,
      params.choiceId ?? null,
      params.snapshotHashBefore ?? null,
      params.snapshotHashAfter ?? null,
      JSON.stringify(params.payload ?? {}),
    ],
  );
  return result.rows[0]!;
}
