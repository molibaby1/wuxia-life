import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { EventCategory, EventPriority, type EventDefinition } from '../../src/types/eventTypes.js';
import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog.js';
import { loadBackendEnv } from '../../server/src/config/env.js';
import { closePool, getPool } from '../../server/src/db/pool.js';
import { runMigrations } from '../../server/src/db/migrate.js';
import { StructuredLogger } from '../../server/src/logging/logger.js';
import { createRouter, seedActiveCatalog } from '../../server/src/http/router.js';
import * as gameService from '../../server/src/services/gameService.js';
import { bootstrapDevice } from '../../server/src/services/deviceService.js';
import * as saveSlotRepo from '../../server/src/repositories/saveSlotRepository.js';
import * as snapshotRepo from '../../server/src/repositories/snapshotRepository.js';
import { persistFixtureRngState, saveFixtureCheckpoint } from './gameLifeRngFixtures.js';
import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot.js';

const schedulerGuardEvent: EventDefinition = {
  id: 'pd138_market_stall_scheduler_guard',
  version: '1.0.0',
  category: EventCategory.SIDE_QUEST,
  priority: EventPriority.NORMAL,
  weight: 100,
  maxTriggers: 1,
  ageRange: { min: 16, max: 100 },
  triggers: [],
  storyLine: 'pd138_market_stall_api_test',
  content: { title: '调度哨兵', text: '仅用于确认 abandon 不额外抽取事件。' },
  eventType: 'choice',
  choices: [{ id: 'continue', text: '继续', effects: [] }],
};

const runtimeCatalog: RuntimeEventCatalog = {
  getAllEvents: () => [schedulerGuardEvent],
  getEventsByAge: age => age >= 16 && age <= 100 ? [schedulerGuardEvent] : [],
  getEventById: id => id === schedulerGuardEvent.id ? schedulerGuardEvent : undefined,
  getWeightForAge: event => event.weight,
};

interface SessionCursor {
  sessionId: string;
  sessionToken: string;
  deviceToken: string;
  slotId: string;
  slotVersion: number;
  snapshotId: string;
  contentHash: string;
  businessAcumenBefore: number;
}

async function createAcceptedFixture(
  db: ReturnType<typeof getPool>,
  env: ReturnType<typeof loadBackendEnv>,
  deviceToken: string,
  slotIndex: number,
  playerName: string,
  pendingEvent = false,
  supplyPrepared = false,
): Promise<SessionCursor> {
  const created = await gameService.createNewSession(db, env, {
    deviceToken,
    slotIndex,
    playerName,
    gender: 'male',
    sourcePlatform: 'web-browser',
  }, runtimeCatalog);
  const snapshot = structuredClone(created.snapshot.snapshot) as GameStateSnapshot;
  const invitationTime = { year: 5, month: 1, day: 1 };
  snapshot.state.player.age = 20;
  snapshot.state.currentTime = { ...invitationTime };
  snapshot.state.eventHistory = [
    {
      eventId: 'p138_market_stall_invitation',
      age: 20,
      timestamp: { ...invitationTime },
      triggeredAt: { ...invitationTime },
    },
    ...(supplyPrepared ? [{
      eventId: 'p138_market_stall_supply',
      age: 20,
      timestamp: { ...invitationTime },
      triggeredAt: { ...invitationTime },
    }] : []),
  ];
  snapshot.state.flags.p138_market_stall_accepted = true;
  snapshot.state.flags.p138_market_stall_refused = false;
  snapshot.state.flags.p138_market_stall_supply_prepared = supplyPrepared;
  if (pendingEvent) {
    snapshot.state.pendingStoryEventId = schedulerGuardEvent.id;
  } else {
    delete snapshot.state.pendingStoryEventId;
  }

  const snapRow = await snapshotRepo.insertSnapshot(db, {
    saveSlotId: created.slot.id,
    sessionId: created.sessionId,
    slotVersion: created.slot.version + 1,
    snapshot,
    engineVersion: env.engineVersion,
    eventCatalogVersion: env.eventCatalogVersion,
  });
  const slot = await saveSlotRepo.updateSlotPointer(
    db,
    created.slot.id,
    created.slot.version,
    snapRow.id,
  );
  assert.ok(slot, 'accepted PD-138 fixture becomes the current save');
  await persistFixtureRngState(db, created.slot.id, created.snapshot.id, snapRow.id);
  await saveFixtureCheckpoint(db, created.slot.id, snapRow.id, snapshot, {
    protocolVersion: 1,
    state: 'clear',
  });
  return {
    sessionId: created.sessionId,
    sessionToken: created.sessionToken,
    deviceToken,
    slotId: created.slot.id,
    slotVersion: slot.version,
    snapshotId: snapRow.id,
    contentHash: snapRow.content_hash,
    businessAcumenBefore: snapshot.state.player.businessAcumen,
  };
}

async function run(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required');
  process.env.TOKEN_HASH_SECRET = 'pd138-market-stall-integration-secret';
  process.env.ENGINE_VERSION = 'pd138-market-stall-test';
  process.env.EVENT_CATALOG_VERSION = '1.0.0';
  process.env.NODE_ENV = 'test';
  const env = loadBackendEnv();
  await runMigrations(databaseUrl);
  await seedActiveCatalog(env);
  const db = getPool(databaseUrl);
  const logger = new StructuredLogger(env);
  const router = createRouter(env, logger, { runtimeCatalog });
  const server = createServer((req, res) => void router(req, res));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const device = await bootstrapDevice(db, env);
    const attempt = await createAcceptedFixture(db, env, device.deviceToken, 1, '试摊操作侠');
    const abandon = await createAcceptedFixture(db, env, device.deviceToken, 2, '放弃操作侠');
    const pending = await createAcceptedFixture(db, env, device.deviceToken, 3, '待处理事件侠', true);
    const preparedDevice = await bootstrapDevice(db, env);
    const prepared = await createAcceptedFixture(db, env, preparedDevice.deviceToken, 1, '备货试摊侠', false, true);
    const concurrentAttemptDevice = await bootstrapDevice(db, env);
    const concurrentAttempt = await createAcceptedFixture(
      db, env, concurrentAttemptDevice.deviceToken, 1, '并发试摊侠',
    );

    const request = (
      cursor: SessionCursor,
      body: Record<string, unknown>,
      includeAuth = true,
    ) => fetch(`${baseUrl}/v1/sessions/${cursor.sessionId}/market-stall-actions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(includeAuth ? {
          'x-device-token': cursor.deviceToken,
          'x-session-token': cursor.sessionToken,
        } : {}),
      },
      body: JSON.stringify(body),
    });
    const bodyFor = (cursor: SessionCursor, operation: string) => ({
      expectedSlotVersion: cursor.slotVersion,
      expectedSnapshotId: cursor.snapshotId,
      operation,
    });

    const invalidOperation = await request(attempt, bodyFor(attempt, 'complete'));
    assert.equal(invalidOperation.status, 422, 'unknown operations are rejected');
    const extraField = await request(attempt, { ...bodyFor(attempt, 'attempt'), eventId: 'forged-event' });
    assert.equal(extraField.status, 422, 'event/choice injection and other extra fields are rejected');
    const missingField = await request(attempt, {
      expectedSlotVersion: attempt.slotVersion,
      operation: 'attempt',
    });
    assert.equal(missingField.status, 422, 'missing snapshot CAS fields are rejected');
    const invalidVersion = await request(attempt, {
      ...bodyFor(attempt, 'attempt'),
      expectedSlotVersion: 1.5,
    });
    assert.equal(invalidVersion.status, 422, 'non-integral slot versions are rejected');
    const invalidSnapshotId = await request(attempt, {
      ...bodyFor(attempt, 'attempt'),
      expectedSnapshotId: 'old-snapshot',
    });
    assert.equal(invalidSnapshotId.status, 422, 'malformed snapshot UUIDs are rejected');
    const unauthenticated = await request(attempt, bodyFor(attempt, 'attempt'), false);
    assert.equal(unauthenticated.status, 401, 'both existing device and session authentication remain required');
    const pendingEvent = await request(pending, bodyFor(pending, 'abandon'));
    assert.equal(pendingEvent.status, 422, 'a selected story event blocks market stall mutations');
    const pendingSlot = await db.query<{ current_snapshot_id: string | null }>(
      'SELECT current_snapshot_id FROM save_slots WHERE id = $1',
      [pending.slotId],
    );
    assert.equal(pendingSlot.rows[0]?.current_snapshot_id, pending.snapshotId, 'blocked event phase leaves the snapshot untouched');
    const pendingReplay = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM replay_actions WHERE session_id = $1 AND action_type = 'market_stall_action'`,
      [pending.sessionId],
    );
    assert.equal(pendingReplay.rows[0]?.count, '0', 'blocked event phase creates no replay action');

    const attemptResponse = await request(attempt, bodyFor(attempt, 'attempt'));
    assert.equal(attemptResponse.status, 200, 'accepted active objective can be attempted through the API');
    const attemptResult = await attemptResponse.json() as {
      sessionPhase: string;
      slotVersion: number;
      snapshotId: string;
      marketStallObjective: { status: string; canAttempt: boolean } | null;
    };
    assert.equal(attemptResult.sessionPhase, 'action_summary', 'attempt enters its single result confirmation');
    assert.equal(attemptResult.marketStallObjective?.status, 'completed', 'projection reports the completed attempt');
    assert.equal(attemptResult.marketStallObjective?.canAttempt, false, 'completed objective cannot run twice');
    const restoredAttempt = await gameService.restoreSession(db, env, {
      deviceToken: attempt.deviceToken,
      slotIndex: 1,
    }, runtimeCatalog);
    assert.equal(restoredAttempt.sessionPhase, 'action_summary', 'same-process save restore preserves the attempt result confirmation');
    assert.ok(restoredAttempt.activeActionSummary, 'restored attempt retains its result summary');

    const attemptSnapshot = await snapshotRepo.getSnapshotById(db, attemptResult.snapshotId);
    assert.ok(attemptSnapshot);
    assert.equal(attemptSnapshot.snapshot.state.player.businessAcumen, attempt.businessAcumenBefore + 1,
      'unprepared attempt applies exact +1');
    assert.equal(attemptSnapshot.snapshot.state.currentTime?.month, 2, 'attempt consumes exactly one calendar month');
    assert.equal(attemptSnapshot.snapshot.state.flags.p138_market_stall_attempted, true, 'attempt fact is durable');
    const attemptReplay = await db.query<{
      action_type: string;
      snapshot_hash_before: string;
      snapshot_hash_after: string;
      payload: { operation?: string };
    }>(
      `SELECT action_type, snapshot_hash_before, snapshot_hash_after, payload
       FROM replay_actions WHERE session_id = $1 ORDER BY sequence_number`,
      [attempt.sessionId],
    );
    const marketAttemptActions = attemptReplay.rows.filter(row => row.action_type === 'market_stall_action');
    assert.equal(marketAttemptActions.length, 1, 'one successful attempt creates one dedicated replay record');
    assert.equal(marketAttemptActions[0]?.payload.operation, 'attempt', 'replay records the explicit operation');
    assert.equal(marketAttemptActions[0]?.snapshot_hash_before, attempt.contentHash, 'replay stores the before snapshot hash');
    assert.equal(marketAttemptActions[0]?.snapshot_hash_after, attemptSnapshot.content_hash, 'replay stores the after snapshot hash');

    const preparedAttempt = await request(prepared, bodyFor(prepared, 'attempt'));
    const preparedBody = await preparedAttempt.json() as { error?: { code?: string; details?: unknown }; snapshotId?: string };
    assert.equal(preparedAttempt.status, 200,
      `prepared objective can be attempted through the API: ${JSON.stringify(preparedBody.error ?? preparedBody)}`);
    const preparedResult = preparedBody as { snapshotId: string };
    const preparedSnapshot = await snapshotRepo.getSnapshotById(db, preparedResult.snapshotId);
    assert.ok(preparedSnapshot);
    assert.equal(preparedSnapshot.snapshot.state.player.businessAcumen, prepared.businessAcumenBefore + 2,
      'prepared attempt applies exact total +2');
    assert.equal(preparedSnapshot.snapshot.state.flags.p138_market_stall_attempted, true,
      'prepared attempt still records the one-time completion fact');

    const concurrentAttemptBody = bodyFor(concurrentAttempt, 'attempt');
    const concurrentAttempts = await Promise.all([
      request(concurrentAttempt, concurrentAttemptBody),
      request(concurrentAttempt, concurrentAttemptBody),
    ]);
    assert.deepEqual(concurrentAttempts.map(response => response.status).sort(), [200, 409],
      'CAS allows at most one concurrent attempt');
    const acceptedConcurrentAttempt = concurrentAttempts.find(response => response.status === 200);
    assert.ok(acceptedConcurrentAttempt);
    const concurrentAttemptResult = await acceptedConcurrentAttempt.json() as { snapshotId: string };
    const concurrentAttemptSnapshot = await snapshotRepo.getSnapshotById(db, concurrentAttemptResult.snapshotId);
    assert.ok(concurrentAttemptSnapshot);
    assert.equal(concurrentAttemptSnapshot.snapshot.state.player.businessAcumen,
      concurrentAttempt.businessAcumenBefore + 1, 'concurrent attempt applies exactly one +1 result');
    assert.equal(concurrentAttemptSnapshot.snapshot.state.currentTime?.month, 2,
      'concurrent attempt advances exactly one game month');
    const concurrentAttemptReplay = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM replay_actions
       WHERE session_id = $1 AND action_type = 'market_stall_action'`,
      [concurrentAttempt.sessionId],
    );
    assert.equal(concurrentAttemptReplay.rows[0]?.count, '1',
      'concurrent attempt creates exactly one replay audit row');

    const phaseGuard = await request({
      ...attempt,
      slotVersion: attemptResult.slotVersion,
      snapshotId: attemptResult.snapshotId,
    }, bodyFor({ ...attempt, slotVersion: attemptResult.slotVersion, snapshotId: attemptResult.snapshotId }, 'abandon'));
    assert.equal(phaseGuard.status, 422, 'result summary blocks a second market stall operation');

    const abandonBody = bodyFor(abandon, 'abandon');
    const concurrent = await Promise.all([
      request(abandon, abandonBody),
      request(abandon, abandonBody),
    ]);
    assert.deepEqual(concurrent.map(response => response.status).sort(), [200, 409], 'CAS allows at most one concurrent abandon');
    const acceptedAbandon = concurrent.find(response => response.status === 200);
    assert.ok(acceptedAbandon);
    const abandonResult = await acceptedAbandon.json() as {
      sessionPhase: string;
      slotVersion: number;
      snapshotId: string;
      marketStallObjective: { status: string; canAttempt: boolean } | null;
    };
    assert.equal(abandonResult.sessionPhase, 'active_planning', 'abandon keeps the player in active planning');
    assert.equal(abandonResult.marketStallObjective?.status, 'abandoned', 'projection reports explicit abandonment');
    assert.equal(abandonResult.marketStallObjective?.canAttempt, false, 'abandoned objective cannot be attempted');
    const abandonedSnapshot = await snapshotRepo.getSnapshotById(db, abandonResult.snapshotId);
    assert.ok(abandonedSnapshot);
    assert.equal(abandonedSnapshot.snapshot.state.currentTime?.month, 1, 'abandon consumes no game time');
    assert.equal(abandonedSnapshot.snapshot.state.player.businessAcumen, abandon.businessAcumenBefore,
      'abandon awards no business acumen');
    assert.equal(abandonedSnapshot.snapshot.state.flags.p138_market_stall_abandoned, true, 'abandon fact is durable');
    assert.equal(abandonedSnapshot.snapshot.state.pendingStoryEventId, undefined, 'abandon does not draw an extra scheduler event');
    assert.deepEqual(abandonedSnapshot.snapshot.state.actionHistory, (await snapshotRepo.getSnapshotById(db, abandon.snapshotId))?.snapshot.state.actionHistory,
      'abandon does not create an ordinary action-history entry');
    const abandonReplay = await db.query<{ action_type: string; payload: { operation?: string } }>(
      `SELECT action_type, payload FROM replay_actions WHERE session_id = $1`,
      [abandon.sessionId],
    );
    assert.equal(abandonReplay.rows.filter(row => row.action_type === 'market_stall_action').length, 1,
      'concurrent requests produce exactly one replay mutation');
    assert.equal(abandonReplay.rows.find(row => row.action_type === 'market_stall_action')?.payload.operation, 'abandon',
      'abandon replay records its explicit operation');

    const staleSnapshot = await request(abandon, bodyFor(abandon, 'attempt'));
    assert.equal(staleSnapshot.status, 409, 'replayed stale version/snapshot is rejected after mutation');
    const staleIdWithCurrentVersion = await request(abandon, {
      expectedSlotVersion: abandonResult.slotVersion,
      expectedSnapshotId: abandon.snapshotId,
      operation: 'attempt',
    });
    assert.equal(staleIdWithCurrentVersion.status, 409, 'a stale snapshot is rejected even with the current slot version');
    const endedObjective = await request({
      ...abandon,
      slotVersion: abandonResult.slotVersion,
      snapshotId: abandonResult.snapshotId,
    }, bodyFor({
      ...abandon,
      slotVersion: abandonResult.slotVersion,
      snapshotId: abandonResult.snapshotId,
    }, 'attempt'));
    assert.equal(endedObjective.status, 422, 'a fresh request cannot reuse the abandoned objective');
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await closePool();
  }
}

export async function runMarketStallApiTests(databaseUrl: string): Promise<void> {
  process.env.DATABASE_URL = databaseUrl;
  await run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required for market stall API tests');
  runMarketStallApiTests(databaseUrl).catch(error => {
    console.error(error);
    process.exit(1);
  });
}
