import type {
  ActiveActionSummaryDisplay,
  AutomaticStageResultDisplay,
  DisturbanceNarrativeDisplay,
  PeriodSummaryDisplay,
} from '../../../src/types/activeActionTypes.js';
import type { HeadlessProgressionVolatileState } from '../../../src/headless/session/sessionTypes.js';
import type { Queryable } from '../db/pool.js';
import { ApiError } from '../errors/apiError.js';

export type ProgressionCheckpoint =
  | { protocolVersion: 1; state: 'clear' | 'legacy_unknown' }
  | {
      protocolVersion: 1;
      state: 'pending';
      phase: 'action_summary';
      payload: {
        pendingActionSummary: ActiveActionSummaryDisplay;
        pendingDisturbanceNarrative: DisturbanceNarrativeDisplay | null;
      };
    }
  | {
      protocolVersion: 1;
      state: 'pending';
      phase: 'disturbance_narrative';
      payload: { pendingDisturbanceNarrative: DisturbanceNarrativeDisplay };
    }
  | {
      protocolVersion: 1;
      state: 'pending';
      phase: 'period_summary';
      payload: { pendingPeriodSummary: PeriodSummaryDisplay };
    };

interface CheckpointRow {
  save_slot_id: string;
  snapshot_id: string;
  protocol_version: number;
  checkpoint_state: string;
  phase: string | null;
  payload: unknown;
}

const INVALID_MESSAGE = 'Progression checkpoint is missing, unsupported, or malformed';

function invalid(details?: Record<string, unknown>): ApiError {
  return new ApiError(422, 'PROGRESSION_CHECKPOINT_INVALID', INVALID_MESSAGE, details);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, required: string[], optional: string[] = []): boolean {
  const keys = Object.keys(value);
  return required.every(key => Object.prototype.hasOwnProperty.call(value, key))
    && keys.every(key => required.includes(key) || optional.includes(key));
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isDeltaMap(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every(item => typeof item === 'number' && Number.isFinite(item));
}

function isActionSummary(value: unknown): value is ActiveActionSummaryDisplay {
  if (!isRecord(value) || !hasExactKeys(value,
    ['sourceLabel', 'actionName', 'durationLabel', 'rewardSummary', 'costSummary', 'riskSummary', 'nextStepHint'],
    ['appliedDeltaSummary', 'resultExplanation', 'diminishingReturnNotice', 'longTermImpactLines'])) return false;
  const stringKeys = ['sourceLabel', 'actionName', 'durationLabel', 'rewardSummary', 'costSummary', 'riskSummary', 'nextStepHint'];
  return stringKeys.every(key => isString(value[key]))
    && ['appliedDeltaSummary', 'resultExplanation', 'diminishingReturnNotice'].every(key => value[key] === undefined || isString(value[key]))
    && (value.longTermImpactLines === undefined || (Array.isArray(value.longTermImpactLines) && value.longTermImpactLines.every(isString)));
}

function isDisturbance(value: unknown): value is DisturbanceNarrativeDisplay {
  return isRecord(value)
    && hasExactKeys(value, ['sourceLabel', 'disturbanceId', 'title', 'bodyText', 'sourceActionName', 'impactSummary', 'returnToPlanHint'])
    && Object.values(value).every(isString);
}

function isDisturbanceOrNull(value: unknown): value is DisturbanceNarrativeDisplay | null {
  return value === null || isDisturbance(value);
}

function isStageResult(value: unknown): value is AutomaticStageResultDisplay {
  if (!isRecord(value) || !hasExactKeys(value, ['id', 'sourceKind', 'title', 'deltas'], ['body'])) return false;
  return isString(value.id)
    && (value.sourceKind === 'story_event' || value.sourceKind === 'setback')
    && isString(value.title)
    && (value.body === undefined || isString(value.body))
    && isDeltaMap(value.deltas);
}

function isPeriodSummary(value: unknown): value is PeriodSummaryDisplay {
  return isRecord(value)
    && hasExactKeys(value, ['sourceLabel', 'headline', 'body', 'statDeltaSummary', 'narrativeText'], ['stageResults'])
    && ['sourceLabel', 'headline', 'body', 'statDeltaSummary', 'narrativeText'].every(key => isString(value[key]))
    && (value.stageResults === undefined || (Array.isArray(value.stageResults) && value.stageResults.every(isStageResult)));
}

function decodePayload(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try { value = JSON.parse(value) as unknown; }
    catch { throw invalid({ reason: 'payload is not valid JSON' }); }
  }
  if (!isRecord(value)) throw invalid({ reason: 'payload must be an object' });
  return value;
}

function decodeRow(row: CheckpointRow, slotId: string, snapshotId: string): ProgressionCheckpoint {
  if (row.save_slot_id !== slotId || row.snapshot_id !== snapshotId || row.protocol_version !== 1) {
    throw invalid({ reason: 'checkpoint binding or protocol version mismatch' });
  }
  const payload = decodePayload(row.payload);
  if (row.checkpoint_state === 'clear' || row.checkpoint_state === 'legacy_unknown') {
    if (row.phase !== null || Object.keys(payload).length !== 0) throw invalid({ reason: 'non-pending checkpoint has payload' });
    return { protocolVersion: 1, state: row.checkpoint_state };
  }
  if (row.checkpoint_state !== 'pending') throw invalid({ reason: 'unknown checkpoint state' });
  const pendingActionSummary = payload.pendingActionSummary;
  const pendingDisturbanceNarrative = payload.pendingDisturbanceNarrative;
  const pendingPeriodSummary = payload.pendingPeriodSummary;
  if (row.phase === 'action_summary'
    && hasExactKeys(payload, ['pendingActionSummary', 'pendingDisturbanceNarrative'])
    && isActionSummary(pendingActionSummary)
    && isDisturbanceOrNull(pendingDisturbanceNarrative)) {
    return {
      protocolVersion: 1,
      state: 'pending',
      phase: 'action_summary',
      payload: {
        pendingActionSummary,
        pendingDisturbanceNarrative,
      },
    };
  }
  if (row.phase === 'disturbance_narrative'
    && hasExactKeys(payload, ['pendingDisturbanceNarrative'])
    && isDisturbance(pendingDisturbanceNarrative)) {
    return {
      protocolVersion: 1,
      state: 'pending',
      phase: 'disturbance_narrative',
      payload: { pendingDisturbanceNarrative },
    };
  }
  if (row.phase === 'period_summary'
    && hasExactKeys(payload, ['pendingPeriodSummary'])
    && isPeriodSummary(pendingPeriodSummary)) {
    return {
      protocolVersion: 1,
      state: 'pending',
      phase: 'period_summary',
      payload: { pendingPeriodSummary },
    };
  }
  throw invalid({ reason: 'checkpoint phase and closed payload shape do not match' });
}

export async function getCheckpoint(
  db: Queryable,
  slotId: string,
  snapshotId: string,
): Promise<ProgressionCheckpoint> {
  const result = await db.query<CheckpointRow>(
    `SELECT save_slot_id, snapshot_id, protocol_version, checkpoint_state, phase, payload
       FROM save_slot_progression_checkpoints
      WHERE save_slot_id = $1
      FOR UPDATE`,
    [slotId],
  );
  const row = result.rows[0];
  if (!row) throw invalid({ reason: 'checkpoint row is missing' });
  return decodeRow(row, slotId, snapshotId);
}

export async function saveCheckpoint(
  db: Queryable,
  slotId: string,
  snapshotId: string,
  checkpoint: ProgressionCheckpoint,
): Promise<void> {
  if (!isRecord(checkpoint)) throw invalid({ reason: 'checkpoint must be an object' });
  const topLevelKeys = checkpoint.state === 'pending'
    ? ['protocolVersion', 'state', 'phase', 'payload']
    : ['protocolVersion', 'state'];
  if (!hasExactKeys(checkpoint, topLevelKeys)) throw invalid({ reason: 'checkpoint has unknown or missing top-level fields' });
  const checkpointState = decodeRow({
    save_slot_id: slotId,
    snapshot_id: snapshotId,
    protocol_version: checkpoint.protocolVersion,
    checkpoint_state: checkpoint.state,
    phase: checkpoint.state === 'pending' ? checkpoint.phase : null,
    payload: checkpoint.state === 'pending' ? checkpoint.payload : {},
  }, slotId, snapshotId);
  const payload = checkpointState.state === 'pending' ? checkpointState.payload : {};
  const phase = checkpointState.state === 'pending' ? checkpointState.phase : null;
  await db.query(
    `INSERT INTO save_slot_progression_checkpoints (
       save_slot_id, snapshot_id, protocol_version, checkpoint_state, phase, payload, updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
     ON CONFLICT (save_slot_id) DO UPDATE SET
       snapshot_id = EXCLUDED.snapshot_id,
       protocol_version = EXCLUDED.protocol_version,
       checkpoint_state = EXCLUDED.checkpoint_state,
       phase = EXCLUDED.phase,
       payload = EXCLUDED.payload,
       updated_at = NOW()`,
    [slotId, snapshotId, checkpointState.protocolVersion, checkpointState.state, phase, JSON.stringify(payload)],
  );
}

export function buildCheckpoint(
  volatile: HeadlessProgressionVolatileState,
  terminal: boolean,
): ProgressionCheckpoint {
  if (terminal) return { protocolVersion: 1, state: 'clear' };
  const { pendingActionSummary: action, pendingDisturbanceNarrative: disturbance, pendingPeriodSummary: period } = volatile;
  if (period && action) throw invalid({ reason: 'period summary and action summary cannot both be pending' });
  if (period && disturbance) throw invalid({ reason: 'period summary and disturbance cannot both be pending' });
  if (period) return {
    protocolVersion: 1,
    state: 'pending',
    phase: 'period_summary',
    payload: { pendingPeriodSummary: period },
  };
  if (action) return {
    protocolVersion: 1,
    state: 'pending',
    phase: 'action_summary',
    payload: { pendingActionSummary: action, pendingDisturbanceNarrative: disturbance },
  };
  if (disturbance) return {
    protocolVersion: 1,
    state: 'pending',
    phase: 'disturbance_narrative',
    payload: { pendingDisturbanceNarrative: disturbance },
  };
  return { protocolVersion: 1, state: 'clear' };
}
