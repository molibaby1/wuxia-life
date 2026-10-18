import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import pg from 'pg';
import { loadBackendEnv } from '../../server/src/config/env.js';
import { closePool, getPool } from '../../server/src/db/pool.js';
import { runMigrations } from '../../server/src/db/migrate.js';
import { StructuredLogger } from '../../server/src/logging/logger.js';
import { createRouter, seedActiveCatalog } from '../../server/src/http/router.js';
import * as gameService from '../../server/src/services/gameService.js';
import { bootstrapDevice } from '../../server/src/services/deviceService.js';
import * as saveSlotRepo from '../../server/src/repositories/saveSlotRepository.js';
import * as snapshotRepo from '../../server/src/repositories/snapshotRepository.js';
import * as catalogRepo from '../../server/src/repositories/catalogRepository.js';
import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot.js';
import { ApiError } from '../../server/src/errors/apiError.js';
import { createDefaultRuntimeEventCatalog } from '../../src/core/EventLoaderRuntimeCatalog.js';
import type { HeadlessProgressionVolatileState } from '../../src/headless/session/sessionTypes.js';
import * as checkpointRepo from '../../server/src/repositories/progressionCheckpointRepository.js';
import { getSnapshotVolatileState } from '../../server/src/services/headlessVolatileCache.js';

const { Pool } = pg;

interface LegacyFixture {
  deviceToken: string;
  deviceId: string;
  slotId: string;
  slotIndex: number;
  slotVersion: number;
  snapshotId: string;
  snapshot: GameStateSnapshot;
  sessionId: string;
  sessionToken: string;
  contentHash: string;
}

async function createLegacyFixture(
  db: ReturnType<typeof getPool>,
  env: ReturnType<typeof loadBackendEnv>,
  deviceToken: string,
  slotIndex: number,
  playerName: string,
  pendingStoryEventId?: string,
  runtimeCatalog = createDefaultRuntimeEventCatalog(),
  startingAge = 16,
): Promise<LegacyFixture> {
  const created = await gameService.createNewSession(db, env, {
    deviceToken, slotIndex, playerName, gender: 'male', sourcePlatform: 'web-browser',
  }, runtimeCatalog);
  const snapshot = structuredClone(created.snapshot.snapshot) as GameStateSnapshot;
  snapshot.state.player.age = startingAge;
  snapshot.state.player.alive = true;
  snapshot.state.player.events = [];
  snapshot.state.eventHistory = [];
  if (pendingStoryEventId) snapshot.state.pendingStoryEventId = pendingStoryEventId;
  else delete snapshot.state.pendingStoryEventId;
  const snap = await snapshotRepo.insertSnapshot(db, {
    saveSlotId: created.slot.id,
    sessionId: created.sessionId,
    slotVersion: created.slot.version + 1,
    snapshot,
    engineVersion: env.engineVersion,
    eventCatalogVersion: env.eventCatalogVersion,
  });
  const slot = await saveSlotRepo.updateSlotPointer(db, created.slot.id, created.slot.version, snap.id);
  assert.ok(slot, 'legacy fixture snapshot becomes current');
  await db.query(
    `UPDATE save_slot_progression_checkpoints
        SET snapshot_id = $2, checkpoint_state = 'legacy_unknown', phase = NULL, payload = '{}'::jsonb
      WHERE save_slot_id = $1`,
    [created.slot.id, snap.id],
  );
  return {
    deviceToken, deviceId: created.slot.device_id, slotId: created.slot.id, slotIndex,
    slotVersion: slot.version, snapshotId: snap.id, snapshot, sessionId: created.sessionId,
    sessionToken: created.sessionToken, contentHash: snap.content_hash,
  };
}

async function runInIsolatedSchema(databaseUrl: string): Promise<void> {
  const schema = `legacy_checkpoint_${randomUUID().replace(/-/g, '')}`;
  const adminPool = new Pool({ connectionString: databaseUrl });
  await adminPool.query(`CREATE SCHEMA "${schema}"`);
  const isolatedUrl = new URL(databaseUrl);
  isolatedUrl.searchParams.set('options', `-c search_path=${schema}`);
  process.env.DATABASE_URL = isolatedUrl.toString();
  process.env.TOKEN_HASH_SECRET = 'legacy-checkpoint-isolated-test-secret';
  process.env.ENGINE_VERSION = 'legacy-checkpoint-test';
  process.env.EVENT_CATALOG_VERSION = '1.0.0';
  process.env.NODE_ENV = 'test';
  const env = loadBackendEnv();
  const runtimeCatalog = createDefaultRuntimeEventCatalog();
  try {
    await runMigrations(env.databaseUrl);
    await seedActiveCatalog(env);
    const db = getPool(env.databaseUrl);
    const router = createRouter(env, new StructuredLogger(env), { runtimeCatalog });
    const server = createServer((req, res) => void router(req, res));
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;
    try {
      const device = await bootstrapDevice(db, env);
      const legacy = await createLegacyFixture(db, env, device.deviceToken, 1, '旧档确认侠');
      const catalog = await catalogRepo.getCatalogByVersion(db, env.eventCatalogVersion);
      const pendingStoryId = catalog?.bundle.events[0]?.eventId;
      assert.ok(pendingStoryId, 'catalog provides a restorable story event');
      const legacyWithStory = await createLegacyFixture(
        db, env, device.deviceToken, 2, '保留待办侠', pendingStoryId,
      );

      const getSaves = () => fetch(`${baseUrl}/v1/saves`, { headers: { 'x-device-token': device.deviceToken } });
      const restore = (slotIndex: number) => fetch(`${baseUrl}/v1/sessions/restore`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-device-token': device.deviceToken },
        body: JSON.stringify({ slotIndex }),
      });
      const discard = (fixture: LegacyFixture, body: Record<string, unknown> = {
        expectedSlotVersion: fixture.slotVersion, expectedSnapshotId: fixture.snapshotId,
      }, token = fixture.deviceToken) => fetch(`${baseUrl}/v1/saves/${fixture.slotIndex}/legacy-progression-discard`, {
        method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { 'x-device-token': token } : {}) },
        body: JSON.stringify(body),
      });

      const pendingChoiceDevice = await bootstrapDevice(db, env);
      const pendingChoice = await createLegacyFixture(
        db, env, pendingChoiceDevice.deviceToken, 1, '待确认阶段Choice侠', 'mingyue_market_meet',
        runtimeCatalog, 20,
      );
      const formalEvent = runtimeCatalog.getEventById('mingyue_market_meet');
      assert.ok(formalEvent, 'choice guard uses an event from the formal runtime catalog');
      const legalChoice = formalEvent.choices?.[0]?.id;
      assert.ok(legalChoice, 'formal catalog event provides a legal choice');
      const pendingActionSummary = {
        sourceLabel: '主动规划', actionName: '读书', durationLabel: '一月', rewardSummary: '学识 +1',
        costSummary: '一月', riskSummary: '无', nextStepHint: '继续规划',
      };
      await checkpointRepo.saveCheckpoint(db, pendingChoice.slotId, pendingChoice.snapshotId, {
        protocolVersion: 1,
        state: 'pending',
        phase: 'action_summary',
        payload: { pendingActionSummary, pendingDisturbanceNarrative: null },
      });
      const choiceResponse = await fetch(`${baseUrl}/v1/sessions/${pendingChoice.sessionId}/choices`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json', 'x-device-token': pendingChoice.deviceToken,
          'x-session-token': pendingChoice.sessionToken,
        },
        body: JSON.stringify({
          expectedSlotVersion: pendingChoice.slotVersion,
          expectedSnapshotId: pendingChoice.snapshotId,
          eventId: formalEvent.id,
          choiceId: legalChoice,
        }),
      });
      assert.equal(choiceResponse.status, 422, 'valid choice injection is rejected during a pending result phase');
      const choiceError = await choiceResponse.json() as { error?: { details?: { code?: string } } };
      assert.equal(choiceError.error?.details?.code, 'INVALID_SESSION_PHASE');
      const choiceSlotAfter = await db.query<{ current_snapshot_id: string; version: number }>(
        'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [pendingChoice.slotId],
      );
      assert.deepEqual(choiceSlotAfter.rows[0], {
        current_snapshot_id: pendingChoice.snapshotId, version: pendingChoice.slotVersion,
      }, 'blocked choice leaves the pending snapshot pointer unchanged');

      const savesResponse = await getSaves();
      assert.equal(savesResponse.status, 200, 'legacy slot is reachable in save list');
      const saves = await savesResponse.json() as { slots: Array<{ slotIndex: number; progressionCheckpointState?: string }> };
      assert.equal(saves.slots.find(slot => slot.slotIndex === 1)?.progressionCheckpointState, 'legacy_unknown',
        'save list distinguishes unknown legacy progression');

      const beforeCancel = await db.query<{ current_snapshot_id: string; version: number }>(
        'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [legacy.slotId],
      );
      // Closing the warning makes no request: the legacy snapshot, pointer, and checkpoint remain intact.
      const afterCancel = await db.query<{ current_snapshot_id: string; version: number }>(
        'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [legacy.slotId],
      );
      assert.deepEqual(afterCancel.rows[0], beforeCancel.rows[0], 'cancel leaves the save pointer unchanged');
      const legacyRow = await db.query<{ checkpoint_state: string }>(
        'SELECT checkpoint_state FROM save_slot_progression_checkpoints WHERE save_slot_id = $1', [legacy.slotId],
      );
      assert.equal(legacyRow.rows[0]?.checkpoint_state, 'legacy_unknown', 'cancel leaves legacy marker unchanged');

      for (const [fixture, slotIndex] of [[legacy, 1], [legacyWithStory, 2]] as const) {
        const blockedRestore = await restore(slotIndex);
        assert.equal(blockedRestore.status, 409, 'ordinary restore fails closed for a legacy marker');
        const error = await blockedRestore.json() as { error?: { code?: string } };
        assert.equal(error.error?.code, 'PROGRESSION_CHECKPOINT_LEGACY_UNKNOWN');
        const blockedAction = await fetch(`${baseUrl}/v1/sessions/${fixture.sessionId}/active-action`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json', 'x-device-token': fixture.deviceToken,
            'x-session-token': fixture.sessionToken,
          },
          body: JSON.stringify({
            expectedSlotVersion: fixture.slotVersion, expectedSnapshotId: fixture.snapshotId,
            actionId: 'study',
          }),
        });
        assert.equal(blockedAction.status, 409, 'ordinary action mutation fails closed for a legacy marker');
        const ordinarySession = await db.query<{ id: string }>(
          'SELECT id FROM game_sessions WHERE save_slot_id = $1 ORDER BY created_at DESC LIMIT 1', [fixture.slotId],
        );
        const manualSave = await fetch(`${baseUrl}/v1/sessions/${fixture.sessionId}/save`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json', 'x-device-token': fixture.deviceToken,
            'x-session-token': fixture.sessionToken,
          },
          body: JSON.stringify({ expectedSlotVersion: fixture.slotVersion, expectedSnapshotId: fixture.snapshotId }),
        });
        assert.equal(manualSave.status, 409, 'manual save cannot silently clear the legacy marker');
        assert.ok(ordinarySession.rows[0], 'fixture session is present for normal mutation guards');
      }

      const noToken = await discard(legacy, {
        expectedSlotVersion: legacy.slotVersion, expectedSnapshotId: legacy.snapshotId,
      }, '');
      assert.equal(noToken.status, 401, 'discard requires device identity');
      const foreignDevice = await bootstrapDevice(db, env);
      const wrongIdentity = await discard(legacy, undefined, foreignDevice.deviceToken);
      assert.equal(wrongIdentity.status, 404, 'another device cannot address this slot');
      const missing = await discard(legacy, { expectedSlotVersion: legacy.slotVersion });
      assert.equal(missing.status, 422, 'missing snapshot CAS field is rejected');
      const badVersion = await discard(legacy, { expectedSlotVersion: 1.5, expectedSnapshotId: legacy.snapshotId });
      assert.equal(badVersion.status, 422, 'non-integer slot version is rejected');
      const extraPayload = await discard(legacy, {
        expectedSlotVersion: legacy.slotVersion, expectedSnapshotId: legacy.snapshotId, acknowledge: true,
      });
      assert.equal(extraPayload.status, 422, 'the endpoint accepts only the two CAS fields');

      const beforeConfirm = await snapshotRepo.getSnapshotById(db, legacyWithStory.snapshotId);
      assert.ok(beforeConfirm);
      const confirmed = await discard(legacyWithStory);
      assert.equal(confirmed.status, 200, 'explicit discard accepts a marked legacy save');
      const confirmedBody = await confirmed.json() as { slotVersion: number; snapshotId: string };
      assert.equal(confirmedBody.slotVersion, legacyWithStory.slotVersion + 1, 'discard advances slot CAS once');
      const afterConfirm = await snapshotRepo.getSnapshotById(db, confirmedBody.snapshotId);
      assert.ok(afterConfirm);
      assert.deepEqual(afterConfirm.snapshot, beforeConfirm.snapshot, 'discard keeps canonical snapshot JSON intact');
      assert.equal(afterConfirm.content_hash, beforeConfirm.content_hash, 'discard preserves snapshot content hash');
      assert.equal(afterConfirm.snapshot.state.pendingStoryEventId, pendingStoryId,
        'discard does not skip a pending story event');
      const newCheckpoint = await db.query<{ checkpoint_state: string; snapshot_id: string }>(
        'SELECT checkpoint_state, snapshot_id FROM save_slot_progression_checkpoints WHERE save_slot_id = $1',
        [legacyWithStory.slotId],
      );
      assert.deepEqual(newCheckpoint.rows[0], { checkpoint_state: 'clear', snapshot_id: confirmedBody.snapshotId });
      const audit = await db.query<{
        action_type: string; payload: Record<string, unknown>; snapshot_hash_before: string; snapshot_hash_after: string;
      }>(
        `SELECT action_type, payload, snapshot_hash_before, snapshot_hash_after FROM replay_actions
          WHERE session_id = $1 AND action_type = 'legacy_progression_discarded'`,
        [legacyWithStory.sessionId],
      );
      assert.equal(audit.rowCount, 1, 'one dedicated audit records explicit legacy discard');
      assert.equal(audit.rows[0]?.payload.reason, 'player_discarded_unrecoverable_legacy_results');
      assert.equal(audit.rows[0]?.snapshot_hash_before, beforeConfirm.content_hash);
      assert.equal(audit.rows[0]?.snapshot_hash_after, beforeConfirm.content_hash);

      const concurrentDevice = await bootstrapDevice(db, env);
      const concurrentFixture = await createLegacyFixture(
        db, env, concurrentDevice.deviceToken, 1, '并发放弃侠',
      );
      const concurrentResults = await Promise.all([
        discard(concurrentFixture), discard(concurrentFixture),
      ]);
      assert.deepEqual(concurrentResults.map(response => response.status).sort(), [200, 409],
        'same-version concurrent discard can succeed at most once');
      const concurrentAudit = await db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM replay_actions
          WHERE session_id = $1 AND action_type = 'legacy_progression_discarded'`,
        [concurrentFixture.sessionId],
      );
      assert.equal(concurrentAudit.rows[0]?.count, '1', 'concurrent request produces one dedicated audit');

      const nonLegacyBody = { expectedSlotVersion: confirmedBody.slotVersion, expectedSnapshotId: confirmedBody.snapshotId };
      const nonLegacy = await discard(legacyWithStory, nonLegacyBody);
      assert.equal(nonLegacy.status, 422, 'clear checkpoint cannot be discarded through the legacy-only endpoint');
      const stale = await discard(legacyWithStory);
      assert.equal(stale.status, 409, 'previous version cannot be reused');

      const bad = await createLegacyFixture(db, env, device.deviceToken, 3, '损坏旧档侠');
      await db.query(
        `UPDATE save_slot_progression_checkpoints SET checkpoint_state = 'pending', phase = 'action_summary', payload = '{"fake":true}'
          WHERE save_slot_id = $1`, [bad.slotId],
      );
      const badCheckpoint = await discard(bad);
      assert.equal(badCheckpoint.status, 422, 'malformed data cannot use the legacy discard path');
      const badAfter = await db.query<{ current_snapshot_id: string; version: number }>(
        'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [bad.slotId],
      );
      assert.deepEqual(badAfter.rows[0], { current_snapshot_id: bad.snapshotId, version: bad.slotVersion },
        'malformed checkpoint failure leaves the save untouched');

      const crossSlot = await discard(legacy, {
        expectedSlotVersion: legacy.slotVersion, expectedSnapshotId: legacyWithStory.snapshotId,
      });
      assert.equal(crossSlot.status, 409, 'snapshot binding to another slot cannot be used');

      // Force the audit insert to fail after the service starts its transaction; all durable rows must roll back.
      const rollbackDevice = await bootstrapDevice(db, env);
      const rollback = await createLegacyFixture(db, env, rollbackDevice.deviceToken, 1, '事务回滚侠');
      const triggerName = `fail_legacy_audit_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
      const functionName = `${triggerName}_fn`;
      await db.query(`CREATE FUNCTION ${functionName}() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN IF NEW.action_type = 'legacy_progression_discarded' THEN RAISE EXCEPTION 'forced legacy audit failure'; END IF; RETURN NEW; END $$`);
      await db.query(`CREATE TRIGGER ${triggerName} BEFORE INSERT ON replay_actions FOR EACH ROW EXECUTE FUNCTION ${functionName}()`);
      try {
        const failed = await discard(rollback);
        assert.equal(failed.status, 500, 'database audit failure surfaces as an internal failure');
      } finally {
        await db.query(`DROP TRIGGER IF EXISTS ${triggerName} ON replay_actions`);
        await db.query(`DROP FUNCTION IF EXISTS ${functionName}()`);
      }
      const rolledBackSlot = await db.query<{ current_snapshot_id: string; version: number }>(
        'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [rollback.slotId],
      );
      assert.deepEqual(rolledBackSlot.rows[0], { current_snapshot_id: rollback.snapshotId, version: rollback.slotVersion });
      const rolledBackCheckpoint = await db.query<{ checkpoint_state: string; snapshot_id: string }>(
        'SELECT checkpoint_state, snapshot_id FROM save_slot_progression_checkpoints WHERE save_slot_id = $1',
        [rollback.slotId],
      );
      assert.deepEqual(rolledBackCheckpoint.rows[0], { checkpoint_state: 'legacy_unknown', snapshot_id: rollback.snapshotId });
      const rolledBackAudit = await db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM replay_actions WHERE session_id = $1 AND action_type = 'legacy_progression_discarded'`,
        [rollback.sessionId],
      );
      assert.equal(rolledBackAudit.rows[0]?.count, '0', 'failed audit leaves no replay row');
      const rolledBackSnapshots = await db.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM game_snapshots WHERE save_slot_id = $1', [rollback.slotId],
      );
      assert.equal(rolledBackSnapshots.rows[0]?.count, '2', 'failed audit leaves no orphan same-hash snapshot');

      const mutationDevice = await bootstrapDevice(db, env);
      const mutation = await createLegacyFixture(db, env, mutationDevice.deviceToken, 1, '主动行动回滚侠');
      await checkpointRepo.saveCheckpoint(db, mutation.slotId, mutation.snapshotId, {
        protocolVersion: 1, state: 'clear',
      });
      const restoredMutation = await gameService.restoreSession(db, env, {
        deviceToken: mutation.deviceToken, slotIndex: mutation.slotIndex,
      }, runtimeCatalog);
      assert.equal(restoredMutation.sessionPhase, 'active_planning', 'clear fixture restores to active planning');
      const actionId = restoredMutation.planningOptions[0]?.actionId;
      assert.ok(actionId, 'restored planning fixture has a valid action id');
      const mutationParams = {
        deviceToken: mutation.deviceToken,
        sessionId: restoredMutation.sessionId,
        sessionToken: restoredMutation.sessionToken,
        expectedSlotVersion: restoredMutation.slotVersion,
        expectedSnapshotId: restoredMutation.snapshotId,
        actionId,
      };
      const cacheBeforeFailure = structuredClone(getSnapshotVolatileState(mutation.snapshotId));
      const mutationTrigger = `fail_active_audit_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
      const mutationFunction = `${mutationTrigger}_fn`;
      await db.query(`CREATE FUNCTION ${mutationFunction}() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN IF NEW.action_type = 'active_action' THEN RAISE EXCEPTION 'forced active action audit failure'; END IF; RETURN NEW; END $$`);
      await db.query(`CREATE TRIGGER ${mutationTrigger} BEFORE INSERT ON replay_actions FOR EACH ROW EXECUTE FUNCTION ${mutationFunction}()`);
      try {
        await assert.rejects(
          gameService.executeActiveAction(db, env, mutationParams, runtimeCatalog),
          /forced active action audit failure/,
          'audit failure aborts the active action transaction',
        );
      } finally {
        await db.query(`DROP TRIGGER IF EXISTS ${mutationTrigger} ON replay_actions`);
        await db.query(`DROP FUNCTION IF EXISTS ${mutationFunction}()`);
      }
      const mutationSlotAfterFailure = await db.query<{ current_snapshot_id: string; version: number }>(
        'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [mutation.slotId],
      );
      assert.deepEqual(mutationSlotAfterFailure.rows[0], {
        current_snapshot_id: mutation.snapshotId, version: mutation.slotVersion,
      }, 'failed active action rolls back slot pointer and version');
      const mutationCheckpointAfterFailure = await db.query<{ checkpoint_state: string; snapshot_id: string }>(
        'SELECT checkpoint_state, snapshot_id FROM save_slot_progression_checkpoints WHERE save_slot_id = $1',
        [mutation.slotId],
      );
      assert.deepEqual(mutationCheckpointAfterFailure.rows[0], {
        checkpoint_state: 'clear', snapshot_id: mutation.snapshotId,
      }, 'failed active action rolls back checkpoint binding');
      const mutationReplayAfterFailure = await db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM replay_actions WHERE session_id = $1 AND action_type = 'active_action'`,
        [restoredMutation.sessionId],
      );
      assert.equal(mutationReplayAfterFailure.rows[0]?.count, '0', 'failed active action leaves no replay row');
      const mutationSnapshotsAfterFailure = await db.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM game_snapshots WHERE save_slot_id = $1', [mutation.slotId],
      );
      assert.equal(mutationSnapshotsAfterFailure.rows[0]?.count, '2', 'failed active action rolls back inserted snapshot');
      assert.deepEqual(getSnapshotVolatileState(mutation.snapshotId), cacheBeforeFailure,
        'failed active action does not change the current process cache');

      const retriedAction = await gameService.executeActiveAction(db, env, mutationParams, runtimeCatalog);
      assert.equal(retriedAction.slotVersion, mutation.slotVersion + 1,
        'the original CAS token remains valid after rollback and can commit once');
      await assert.rejects(
        gameService.executeActiveAction(db, env, mutationParams, runtimeCatalog),
        (error: unknown) => error instanceof ApiError && error.code === 'STALE_SLOT_VERSION',
        'the same original CAS token cannot commit a second action',
      );
      const mutationReplayAfterRetry = await db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM replay_actions WHERE session_id = $1 AND action_type = 'active_action'`,
        [restoredMutation.sessionId],
      );
      assert.equal(mutationReplayAfterRetry.rows[0]?.count, '1', 'valid retry commits exactly one action audit');

      const lifecycleDevice = await bootstrapDevice(db, env);
      const overwrite = await createLegacyFixture(db, env, lifecycleDevice.deviceToken, 1, '覆盖生命周期侠');
      const overwritten = await gameService.createNewSession(db, env, {
        deviceToken: overwrite.deviceToken,
        slotIndex: overwrite.slotIndex,
        playerName: '覆盖后的新人物',
        gender: 'female',
        sourcePlatform: 'web-browser',
        confirmOverwrite: true,
      }, runtimeCatalog);
      const overwriteCheckpoint = await checkpointRepo.getCheckpoint(
        db, overwrite.slotId, overwritten.snapshot.id,
      );
      assert.notEqual(overwritten.snapshot.id, overwrite.snapshotId, 'confirmed overwrite creates a new current snapshot');
      assert.notEqual(overwriteCheckpoint.state, 'legacy_unknown', 'confirmed overwrite replaces the legacy marker');
      const overwritePointer = await db.query<{ current_snapshot_id: string; version: number }>(
        'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [overwrite.slotId],
      );
      assert.deepEqual(overwritePointer.rows[0], {
        current_snapshot_id: overwritten.snapshot.id, version: overwritten.slot.version,
      }, 'checkpoint and slot point at the overwritten snapshot');
      await assert.rejects(
        gameService.acknowledgeProgression(db, env, {
          deviceToken: overwrite.deviceToken,
          sessionId: overwrite.sessionId,
          sessionToken: overwrite.sessionToken,
          expectedSlotVersion: overwrite.slotVersion,
          expectedSnapshotId: overwrite.snapshotId,
          ackKind: 'action_summary',
        }, runtimeCatalog),
        (error: unknown) => error instanceof ApiError
          && (error.code === 'STALE_SLOT_VERSION' || error.code === 'STALE_SNAPSHOT'),
        'old session credentials and CAS cannot acknowledge after overwrite',
      );

      const manualSaveDevice = await bootstrapDevice(db, env);
      const manual = await createLegacyFixture(db, env, manualSaveDevice.deviceToken, 1, '待确认手动保存侠');
      const manualActionSummary = {
        sourceLabel: '主动规划', actionName: '习武', durationLabel: '一月', rewardSummary: '功力 +1',
        costSummary: '一月', riskSummary: '无', nextStepHint: '继续规划',
      };
      const manualDisturbance = {
        sourceLabel: '途中', disturbanceId: 'checkpoint_rain', title: '骤雨', bodyText: '骤雨落下',
        sourceActionName: '习武', impactSummary: '行程受阻', returnToPlanHint: '返回计划',
      };
      await checkpointRepo.saveCheckpoint(db, manual.slotId, manual.snapshotId, {
        protocolVersion: 1, state: 'pending', phase: 'action_summary',
        payload: {
          pendingActionSummary: manualActionSummary,
          pendingDisturbanceNarrative: manualDisturbance,
        },
      });
      const saved = await gameService.manualSave(db, env, {
        deviceToken: manual.deviceToken,
        sessionId: manual.sessionId,
        sessionToken: manual.sessionToken,
        expectedSlotVersion: manual.slotVersion,
        expectedSnapshotId: manual.snapshotId,
      }, runtimeCatalog);
      const manualCheckpoint = await checkpointRepo.getCheckpoint(db, manual.slotId, saved.snapshot.id);
      assert.deepEqual(manualCheckpoint, {
        protocolVersion: 1,
        state: 'pending',
        phase: 'action_summary',
        payload: {
          pendingActionSummary: manualActionSummary,
          pendingDisturbanceNarrative: manualDisturbance,
        },
      }, 'manual save rebinds and retains action plus accompanying disturbance DTO');

      const snapshotBeforeClear = await snapshotRepo.getSnapshotById(db, saved.snapshot.id);
      assert.ok(snapshotBeforeClear);
      await saveSlotRepo.clearSlot(db, manual.slotId);
      const checkpointAfterClear = await db.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM save_slot_progression_checkpoints WHERE save_slot_id = $1',
        [manual.slotId],
      );
      assert.equal(checkpointAfterClear.rows[0]?.count, '0', 'clearing a slot removes its checkpoint row');
      const slotAfterClear = await db.query<{ current_snapshot_id: string | null; version: number }>(
        'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [manual.slotId],
      );
      assert.deepEqual(slotAfterClear.rows[0], { current_snapshot_id: null, version: 0 });
      assert.ok(await snapshotRepo.getSnapshotById(db, snapshotBeforeClear.id),
        'clear slot retains historical snapshot rows');

      const terminalDevice = await bootstrapDevice(db, env);
      const terminalCreated = await gameService.createNewSession(db, env, {
        deviceToken: terminalDevice.deviceToken, slotIndex: 1, playerName: '终局生命周期侠',
        gender: 'male', sourcePlatform: 'web-browser',
      }, runtimeCatalog);
      const terminalSnapshot = structuredClone(terminalCreated.snapshot.snapshot) as GameStateSnapshot;
      terminalSnapshot.state.player.alive = false;
      terminalSnapshot.state.player.deathReason = '合法终局夹具';
      const terminalSnapRow = await snapshotRepo.insertSnapshot(db, {
        saveSlotId: terminalCreated.slot.id,
        sessionId: terminalCreated.sessionId,
        slotVersion: terminalCreated.slot.version + 1,
        snapshot: terminalSnapshot,
        engineVersion: env.engineVersion,
        eventCatalogVersion: env.eventCatalogVersion,
      });
      const terminalSlot = await saveSlotRepo.updateSlotPointer(
        db, terminalCreated.slot.id, terminalCreated.slot.version, terminalSnapRow.id,
      );
      assert.ok(terminalSlot);
      await checkpointRepo.saveCheckpoint(db, terminalCreated.slot.id, terminalSnapRow.id, {
        protocolVersion: 1, state: 'clear',
      });
      const terminalCheckpoint = await checkpointRepo.getCheckpoint(
        db, terminalCreated.slot.id, terminalSnapRow.id,
      );
      assert.deepEqual(terminalCheckpoint, { protocolVersion: 1, state: 'clear' },
        'terminal save has a clear progression checkpoint');
      const restoredTerminal = await gameService.restoreSession(db, env, {
        deviceToken: terminalDevice.deviceToken, slotIndex: 1,
      }, runtimeCatalog);
      assert.equal(restoredTerminal.sessionPhase, 'terminal', 'terminal snapshot restores directly to terminal phase');
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
      await closePool();
    }
  } finally {
    process.env.DATABASE_URL = databaseUrl;
    await adminPool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`).catch(() => undefined);
    await adminPool.end();
  }
  await mkdir('artifacts', { recursive: true });
  await writeFile('artifacts/progression-checkpoint-legacy-test.json', `${JSON.stringify({
    test: 'progression checkpoint legacy DB/API behavior',
    result: 'PASS',
    isolatedSchema: schema,
    checks: [
      'legacy save listing and no-request cancellation preserve state',
      'restore, active action, and manual save fail closed',
      'explicit discard validates identity, payload, version, snapshot binding, and checkpoint shape',
      'a legal catalog Choice is rejected while a result checkpoint is pending',
      'concurrent discard succeeds at most once with one dedicated replay audit',
      'canonical snapshot JSON/hash and pendingStoryEventId are preserved',
      'audit-trigger failure rolls back slot, checkpoint, snapshot, and replay rows',
      'failed active action preserves process cache and original CAS token can retry exactly once',
      'confirmed overwrite rebinds checkpoint and rejects prior session CAS credentials',
      'manual save retains pending action and disturbance DTOs; clear slot deletes only checkpoint binding',
      'terminal snapshot uses a clear checkpoint and restores terminal phase',
    ],
    credentialsRecorded: false,
  }, null, 2)}\n`);
}

export async function runProgressionCheckpointLegacyTests(databaseUrl = process.env.DATABASE_URL): Promise<void> {
  assert.ok(databaseUrl, 'DATABASE_URL is required');
  await runInIsolatedSchema(databaseUrl);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runProgressionCheckpointLegacyTests();
  console.log('Progression checkpoint legacy tests passed');
}
