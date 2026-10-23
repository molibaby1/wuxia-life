import type { Queryable } from '../../server/src/db/pool.js';
import { ApiError } from '../../server/src/errors/apiError.js';
import {
  buildCheckpoint,
  getCheckpoint,
  getCheckpointRuntimeState,
  saveCheckpoint,
  type ProgressionCheckpoint,
} from '../../server/src/repositories/progressionCheckpointRepository.js';
import type { HeadlessProgressionVolatileState } from '../../src/headless/session/sessionTypes.js';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function mockDb(row: Record<string, unknown> | null = null): Queryable & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    query: async (sql: string) => {
      calls.push(sql);
      if (sql.startsWith('SELECT')) return { rows: row ? [row] : [], rowCount: row ? 1 : 0 };
      return { rows: [], rowCount: 1 };
    },
  } as unknown as Queryable & { calls: string[] };
}

const emptyVolatile = (): HeadlessProgressionVolatileState => ({
  pendingActionSummary: null,
  pendingDisturbanceNarrative: null,
  pendingPeriodSummary: null,
  passiveNarrative: null,
  passiveNarrativeId: null,
  annualPassiveMemory: null,
  pendingStoryEventId: null,
  pendingEphemeralStoryEvent: null,
  storyGapPassiveServed: false,
});

export async function runProgressionCheckpointRepositoryTests(): Promise<void> {
  const action = {
    sourceLabel: '主动规划', actionName: '读书', durationLabel: '一月', rewardSummary: '学识 +1',
    costSummary: '一月', riskSummary: '无', nextStepHint: '继续规划',
  };
  const disturbance = {
    sourceLabel: '途中', disturbanceId: 'rain', title: '骤雨', bodyText: '骤雨落下',
    sourceActionName: '读书', impactSummary: '计划受阻', returnToPlanHint: '返回计划',
  };
  const volatile = emptyVolatile();
  volatile.pendingActionSummary = action;
  volatile.pendingDisturbanceNarrative = disturbance;
  const built = buildCheckpoint(volatile, false);
  assert(built.state === 'pending' && built.phase === 'action_summary', 'action summary takes first phase priority');
  if (built.state === 'pending' && built.phase === 'action_summary') {
    assert(built.payload.pendingActionSummary.sourceLabel === '主动规划', 'action DTO is retained');
    assert(built.payload.pendingDisturbanceNarrative?.disturbanceId === 'rain', 'co-pending disturbance is retained');
  }

  const invalid = mockDb({
    save_slot_id: 'slot-1', snapshot_id: 'snapshot-1', protocol_version: 1,
    checkpoint_state: 'pending', phase: 'action_summary',
    payload: { pendingActionSummary: action, unexpected: true },
  });
  let invalidRejected = false;
  try { await getCheckpoint(invalid, 'slot-1', 'snapshot-1'); }
  catch (error) { invalidRejected = error instanceof ApiError && error.code === 'PROGRESSION_CHECKPOINT_INVALID'; }
  assert(invalidRejected, 'unknown payload keys fail closed');

  const missing = mockDb();
  let missingRejected = false;
  try { await getCheckpoint(missing, 'slot-1', 'snapshot-1'); }
  catch (error) { missingRejected = error instanceof ApiError && error.code === 'PROGRESSION_CHECKPOINT_INVALID'; }
  assert(missingRejected, 'missing checkpoint fails closed');

  const legacy = mockDb({
    save_slot_id: 'slot-1', snapshot_id: 'snapshot-1', protocol_version: 1,
    checkpoint_state: 'legacy_unknown', phase: null, payload: {},
  });
  const legacyResult = await getCheckpoint(legacy, 'slot-1', 'snapshot-1');
  assert(legacyResult.state === 'legacy_unknown', 'legacy checkpoint remains distinguishable');

  const saveDb = mockDb();
  const clear: ProgressionCheckpoint = buildCheckpoint(emptyVolatile(), true);
  await saveCheckpoint(saveDb, 'slot-1', 'snapshot-1', clear, emptyVolatile());
  assert(saveDb.calls.some(sql => sql.includes('INSERT INTO save_slot_progression_checkpoints')), 'checkpoint write uses upsert');
  assert(saveDb.calls.some(sql => sql.includes('runtime_state_version, runtime_state')),
    'checkpoint write persists the volatile runtime state with its Snapshot');

  const runtime = {
    save_slot_id: 'slot-1',
    snapshot_id: 'snapshot-1',
    runtime_state_version: 1,
    runtime_state: {
      protocolVersion: 1,
      storyGapPassiveServed: true,
      passiveNarrative: { title: '雨后', text: '在檐下等雨停。' },
      passiveNarrativeId: 'preschool_test_rain',
      annualPassiveMemory: null,
      pendingEphemeralStoryEvent: null,
    },
  };
  const restoredRuntime = await getCheckpointRuntimeState(mockDb(runtime), 'slot-1', 'snapshot-1');
  assert(restoredRuntime.passiveNarrative?.title === '雨后', 'persisted passive selection is restored exactly');
  assert(restoredRuntime.passiveNarrativeId === 'preschool_test_rain', 'persisted passive identity is restored exactly');
  assert(restoredRuntime.storyGapPassiveServed, 'story-gap scheduler opportunity state is restored');

  const legacyRuntimeState = { ...runtime.runtime_state } as Record<string, unknown>;
  delete legacyRuntimeState.passiveNarrativeId;
  let missingPassiveIdentityRejected = false;
  try {
    await getCheckpointRuntimeState(
      mockDb({ ...runtime, runtime_state: legacyRuntimeState }), 'slot-1', 'snapshot-1',
    );
  } catch (error) {
    missingPassiveIdentityRejected = error instanceof ApiError
      && error.code === 'PROGRESSION_CHECKPOINT_INVALID';
  }
  assert(missingPassiveIdentityRejected,
    'a persisted ordinary passive display without stable identity fails closed');

  let missingRuntimeRejected = false;
  try {
    await getCheckpointRuntimeState(mockDb({ ...runtime, runtime_state_version: 0, runtime_state: {} }), 'slot-1', 'snapshot-1');
  } catch (error) {
    missingRuntimeRejected = error instanceof ApiError && error.code === 'PROGRESSION_CHECKPOINT_INVALID';
  }
  assert(missingRuntimeRejected, 'a current RNG-backed life without durable runtime state fails closed');

  let extraTopLevelRejected = false;
  try {
    await saveCheckpoint(saveDb, 'slot-1', 'snapshot-1', { ...clear, unexpected: true } as never, emptyVolatile());
  } catch (error) {
    extraTopLevelRejected = error instanceof ApiError && error.code === 'PROGRESSION_CHECKPOINT_INVALID';
  }
  assert(extraTopLevelRejected, 'clear checkpoint rejects unknown top-level fields');
}
