import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog.js';
import { EventLoader } from '../../src/core/EventLoader.js';
import {
  appendScholarOfficialPursuitEntry,
  SCHOLAR_OFFICIAL_APPOINTMENT_ACCEPT_CHOICE_ID,
  SCHOLAR_OFFICIAL_APPOINTMENT_DECLINE_CHOICE_ID,
  SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID,
  SCHOLAR_OFFICIAL_PURSUIT_INVITATION_EVENT_ID,
  SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY,
} from '../../src/core/scholarOfficialPursuit.js';
import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot.js';
import { EventCategory, EventPriority, type EventDefinition, type GameState } from '../../src/types/eventTypes.js';
import { loadBackendEnv } from '../../server/src/config/env.js';
import { closePool, getPool } from '../../server/src/db/pool.js';
import { runMigrations } from '../../server/src/db/migrate.js';
import { StructuredLogger } from '../../server/src/logging/logger.js';
import { createRouter, seedActiveCatalog } from '../../server/src/http/router.js';
import * as gameService from '../../server/src/services/gameService.js';
import { bootstrapDevice } from '../../server/src/services/deviceService.js';
import * as saveSlotRepo from '../../server/src/repositories/saveSlotRepository.js';
import * as snapshotRepo from '../../server/src/repositories/snapshotRepository.js';
import * as progressionCheckpointRepo from '../../server/src/repositories/progressionCheckpointRepository.js';

const schedulerGuardEvent: EventDefinition = {
  id: 'p138_scholar_pursuit_scheduler_guard',
  version: '1.0.0',
  category: EventCategory.SIDE_QUEST,
  priority: EventPriority.NORMAL,
  weight: 100,
  maxTriggers: 1,
  ageRange: { min: 16, max: 100 },
  triggers: [],
  content: { title: '调度哨兵', text: '仅用于确认求仕操作不自动抽取事件。' },
  eventType: 'choice',
  choices: [{ id: 'continue', text: '继续', effects: [] }],
};

const appointmentEvent = EventLoader.getInstance().getEventById(SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID)!;
const runtimeEvents = [schedulerGuardEvent, appointmentEvent];

const runtimeCatalog: RuntimeEventCatalog = {
  getAllEvents: () => runtimeEvents,
  getEventsByAge: age => age >= 16 && age <= 100 ? runtimeEvents : [],
  getEventById: id => runtimeEvents.find(event => event.id === id),
  getWeightForAge: event => event.weight,
};

interface PursuitCursor {
  sessionId: string;
  sessionToken: string;
  deviceToken: string;
  slotId: string;
  slotIndex: number;
  slotVersion: number;
  snapshotId: string;
  contentHash: string;
  date: { year: number; month: number; day: number };
  titleBefore: string | null;
}

async function createAcceptedFixture(
  db: ReturnType<typeof getPool>,
  env: ReturnType<typeof loadBackendEnv>,
  deviceToken: string,
  slotIndex: number,
  playerName: string,
  pendingEvent: boolean | 'appointment' = false,
  passingExam = false,
): Promise<PursuitCursor> {
  const created = await gameService.createNewSession(db, env, {
    deviceToken,
    slotIndex,
    playerName,
    gender: 'male',
    sourcePlatform: 'web-browser',
  }, runtimeCatalog);
  const snapshot = structuredClone(created.snapshot.snapshot) as GameStateSnapshot;
  const invitationDate = { year: 4, month: 5, day: 3 };
  snapshot.state.player.age = 20;
  snapshot.state.player.knowledge = 20;
  snapshot.state.currentTime = { ...invitationDate };
  delete snapshot.state.pendingStoryEventId;
  let acceptedState = appendScholarOfficialPursuitEntry(snapshot.state as unknown as GameState, {
    type: 'invitation_response',
    date: { ...invitationDate },
    age: 20,
    sourceEventId: SCHOLAR_OFFICIAL_PURSUIT_INVITATION_EVENT_ID,
    response: 'accepted',
  });
  let fixtureDate = invitationDate;
  if (passingExam) {
    const examStart = { year: 4, month: 6, day: 3 };
    fixtureDate = { year: 4, month: 7, day: 3 };
    acceptedState = appendScholarOfficialPursuitEntry({ ...acceptedState, currentTime: fixtureDate }, {
      type: 'exam_attempt',
      attemptNumber: 1,
      startedAt: examStart,
      completedAt: fixtureDate,
      ageAtStart: 20,
      knowledgeAtStart: 20,
      rulesVersion: 'curve-a-v1',
      adoptedPassRate: 0.25,
      result: 'passed',
    });
    snapshot.state.currentTime = { ...fixtureDate };
  }
  snapshot.state.flags = structuredClone(acceptedState.flags);
  snapshot.state.player.flags = structuredClone(acceptedState.player.flags);
  if (pendingEvent) {
    snapshot.state.pendingStoryEventId = pendingEvent === 'appointment'
      ? SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID
      : schedulerGuardEvent.id;
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
  assert.ok(slot, 'accepted pursuit fixture becomes the current save');
  await progressionCheckpointRepo.saveCheckpoint(db, created.slot.id, snapRow.id, {
    protocolVersion: 1,
    state: 'clear',
  });
  return {
    sessionId: created.sessionId,
    sessionToken: created.sessionToken,
    deviceToken,
    slotId: created.slot.id,
    slotIndex,
    slotVersion: slot.version,
    snapshotId: snapRow.id,
    contentHash: snapRow.content_hash,
    date: fixtureDate,
    titleBefore: snapshot.state.player.title ?? null,
  };
}

async function run(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required');
  process.env.TOKEN_HASH_SECRET = 'p138-scholar-pursuit-integration-secret';
  process.env.ENGINE_VERSION = 'p138-scholar-pursuit-test';
  process.env.EVENT_CATALOG_VERSION = '1.0.2';
  process.env.NODE_ENV = 'test';
  const env = loadBackendEnv();
  await runMigrations(databaseUrl);
  await seedActiveCatalog(env);
  const db = getPool(databaseUrl);
  const router = createRouter(env, new StructuredLogger(env), { runtimeCatalog });
  const server = createServer((req, res) => void router(req, res));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const device = await bootstrapDevice(db, env);
    const exam = await createAcceptedFixture(db, env, device.deviceToken, 1, '求仕考试侠');
    const abandonDevice = await bootstrapDevice(db, env);
    const abandon = await createAcceptedFixture(db, env, abandonDevice.deviceToken, 1, '求仕放弃侠');
    const pendingDevice = await bootstrapDevice(db, env);
    const pending = await createAcceptedFixture(db, env, pendingDevice.deviceToken, 1, '待决事件侠', true);
    const appointmentDevice = await bootstrapDevice(db, env);
    const appointment = await createAcceptedFixture(
      db, env, appointmentDevice.deviceToken, 1, '州府任用侠', 'appointment', true,
    );
    const refusalDevice = await bootstrapDevice(db, env);
    const refusal = await createAcceptedFixture(
      db, env, refusalDevice.deviceToken, 1, '婉拒州府任用侠', 'appointment', true,
    );
    const rollbackAppointmentDevice = await bootstrapDevice(db, env);
    const rollbackAppointment = await createAcceptedFixture(
      db, env, rollbackAppointmentDevice.deviceToken, 1, '任用回滚侠', 'appointment', true,
    );

    const request = (
      cursor: PursuitCursor,
      body: Record<string, unknown>,
      includeAuth = true,
    ) => fetch(`${baseUrl}/v1/sessions/${cursor.sessionId}/scholar-official-pursuit-actions`, {
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
    const bodyFor = (cursor: PursuitCursor, operation: string) => ({
      expectedSlotVersion: cursor.slotVersion,
      expectedSnapshotId: cursor.snapshotId,
      operation,
    });
    const choiceRequest = (cursor: PursuitCursor, choiceId: string) => fetch(
      `${baseUrl}/v1/sessions/${cursor.sessionId}/choices`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-device-token': cursor.deviceToken,
          'x-session-token': cursor.sessionToken,
        },
        body: JSON.stringify({
          expectedSlotVersion: cursor.slotVersion,
          expectedSnapshotId: cursor.snapshotId,
          eventId: SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID,
          choiceId,
        }),
      },
    );

    const acceptedAppointmentResponses = await Promise.all([
      choiceRequest(appointment, SCHOLAR_OFFICIAL_APPOINTMENT_ACCEPT_CHOICE_ID),
      choiceRequest(appointment, SCHOLAR_OFFICIAL_APPOINTMENT_ACCEPT_CHOICE_ID),
    ]);
    assert.deepEqual(acceptedAppointmentResponses.map(response => response.status).sort(), [200, 409],
      'Server CAS admits exactly one concurrent appointment acceptance');
    const appointmentResponse = acceptedAppointmentResponses.find(response => response.status === 200);
    assert.ok(appointmentResponse);
    const appointmentResult = await appointmentResponse.json() as {
      slotVersion: number;
      snapshotId: string;
      contentHash: string;
      sessionPhase: string;
      scholarOfficialPursuit: { status: string; appointmentAccepted: boolean };
    };
    assert.equal(appointmentResult.slotVersion, appointment.slotVersion + 1);
    assert.equal(appointmentResult.scholarOfficialPursuit.status, 'completed');
    assert.equal(appointmentResult.scholarOfficialPursuit.appointmentAccepted, true);
    const persistedAppointment = await snapshotRepo.getSnapshotById(db, appointmentResult.snapshotId);
    assert.ok(persistedAppointment);
    assert.deepEqual(persistedAppointment.snapshot.state.currentTime, appointment.date,
      'the real Server Choice leaves the offer and decision on the same game date');
    const appointmentLedger = persistedAppointment.snapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
      entries: Array<Record<string, unknown>>;
    };
    const acceptedAppointmentEntry = appointmentLedger.entries[appointmentLedger.entries.length - 1];
    assert.equal(appointmentLedger.entries.length, 3, 'the Server transaction persists exactly one appointment decision');
    assert.equal(acceptedAppointmentEntry?.type, 'appointment_decision');
    assert.equal(acceptedAppointmentEntry?.response, 'accepted');
    assert.deepEqual(acceptedAppointmentEntry?.offeredAt, appointment.date);
    assert.deepEqual(acceptedAppointmentEntry?.decidedAt, appointment.date);
    assert.deepEqual(acceptedAppointmentEntry?.effectiveAt, appointment.date);
    const appointmentReplay = await db.query<{
      action_type: string;
      event_id: string | null;
      choice_id: string | null;
      snapshot_hash_before: string;
      snapshot_hash_after: string;
    }>(
      `SELECT action_type, event_id, choice_id, snapshot_hash_before, snapshot_hash_after
       FROM replay_actions WHERE session_id = $1 AND action_type = 'choice_executed'`,
      [appointment.sessionId],
    );
    assert.equal(appointmentReplay.rows.length, 1, 'the accepted appointment has one persisted replay action');
    assert.equal(appointmentReplay.rows[0]?.event_id, SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID);
    assert.equal(appointmentReplay.rows[0]?.choice_id, SCHOLAR_OFFICIAL_APPOINTMENT_ACCEPT_CHOICE_ID);
    assert.equal(appointmentReplay.rows[0]?.snapshot_hash_before, appointment.contentHash);
    assert.equal(appointmentReplay.rows[0]?.snapshot_hash_after, appointmentResult.contentHash);
    const appointmentCheckpoint = await db.query<{ snapshot_id: string; checkpoint_state: string; phase: string | null }>(
      'SELECT snapshot_id, checkpoint_state, phase FROM save_slot_progression_checkpoints WHERE save_slot_id = $1',
      [appointment.slotId],
    );
    assert.equal(appointmentCheckpoint.rows[0]?.snapshot_id, appointmentResult.snapshotId,
      'the checkpoint advances atomically with the appointment Snapshot');
    assert.equal(appointmentCheckpoint.rows[0]?.checkpoint_state, 'pending');
    assert.equal(appointmentCheckpoint.rows[0]?.phase, appointmentResult.sessionPhase,
      'the checkpoint preserves the post-choice progression phase for recovery');
    const restoredAppointment = await gameService.restoreSession(db, env, {
      deviceToken: appointment.deviceToken,
      slotIndex: appointment.slotIndex,
    }, runtimeCatalog);
    assert.equal(restoredAppointment.scholarOfficialPursuit.status, 'completed',
      'database recovery retains the accepted appointment and completed objective');
    assert.equal(restoredAppointment.scholarOfficialPursuit.appointmentAccepted, true,
      'database recovery retains the appointment acceptance in the existing read-only projection');
    assert.equal((await choiceRequest(appointment, SCHOLAR_OFFICIAL_APPOINTMENT_ACCEPT_CHOICE_ID)).status, 409,
      'a stale replay of the appointment Choice is rejected by slot and Snapshot CAS');

    const refusalResponse = await choiceRequest(refusal, SCHOLAR_OFFICIAL_APPOINTMENT_DECLINE_CHOICE_ID);
    assert.equal(refusalResponse.status, 200, 'the real Server Choice path accepts an appointment refusal');
    const refusalResult = await refusalResponse.json() as {
      snapshotId: string;
      scholarOfficialPursuit: { status: string; appointmentAccepted: boolean };
    };
    assert.equal(refusalResult.scholarOfficialPursuit.status, 'active');
    assert.equal(refusalResult.scholarOfficialPursuit.appointmentAccepted, false);
    const persistedRefusal = await snapshotRepo.getSnapshotById(db, refusalResult.snapshotId);
    assert.ok(persistedRefusal);
    const refusalLedger = persistedRefusal.snapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
      entries: Array<Record<string, unknown>>;
    };
    const declinedAppointmentEntry = refusalLedger.entries[refusalLedger.entries.length - 1];
    assert.equal(declinedAppointmentEntry?.response, 'declined');
    assert.equal(Object.prototype.hasOwnProperty.call(declinedAppointmentEntry, 'effectiveAt'), false);
    assert.deepEqual(declinedAppointmentEntry?.decidedAt, refusal.date);

    const appointmentTriggerName = `fail_zhoufu_audit_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const appointmentFunctionName = `${appointmentTriggerName}_fn`;
    await db.query(`CREATE FUNCTION ${appointmentFunctionName}() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.action_type = 'choice_executed' AND NEW.event_id = '${SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID}' THEN RAISE EXCEPTION 'forced appointment audit failure'; END IF; RETURN NEW; END $$`);
    await db.query(`CREATE TRIGGER ${appointmentTriggerName} BEFORE INSERT ON replay_actions FOR EACH ROW EXECUTE FUNCTION ${appointmentFunctionName}()`);
    try {
      const failedAppointment = await choiceRequest(rollbackAppointment, SCHOLAR_OFFICIAL_APPOINTMENT_ACCEPT_CHOICE_ID);
      assert.equal(failedAppointment.status, 500, 'replay audit failure aborts the appointment transaction');
    } finally {
      await db.query(`DROP TRIGGER IF EXISTS ${appointmentTriggerName} ON replay_actions`);
      await db.query(`DROP FUNCTION IF EXISTS ${appointmentFunctionName}()`);
    }
    const appointmentRollbackSlot = await db.query<{ current_snapshot_id: string; version: number }>(
      'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [rollbackAppointment.slotId],
    );
    assert.deepEqual(appointmentRollbackSlot.rows[0], {
      current_snapshot_id: rollbackAppointment.snapshotId,
      version: rollbackAppointment.slotVersion,
    }, 'failed appointment persistence rolls back the slot and Snapshot CAS');
    const appointmentRollbackCheckpoint = await db.query<{ checkpoint_state: string; snapshot_id: string }>(
      'SELECT checkpoint_state, snapshot_id FROM save_slot_progression_checkpoints WHERE save_slot_id = $1',
      [rollbackAppointment.slotId],
    );
    assert.deepEqual(appointmentRollbackCheckpoint.rows[0], {
      checkpoint_state: 'clear',
      snapshot_id: rollbackAppointment.snapshotId,
    });
    const appointmentRollbackReplay = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM replay_actions WHERE session_id = $1 AND event_id = $2`,
      [rollbackAppointment.sessionId, SCHOLAR_OFFICIAL_APPOINTMENT_EVENT_ID],
    );
    assert.equal(appointmentRollbackReplay.rows[0]?.count, '0', 'failed appointment persistence leaves no replay row');
    const appointmentRollbackSnapshots = await db.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM game_snapshots WHERE save_slot_id = $1', [rollbackAppointment.slotId],
    );
    assert.equal(appointmentRollbackSnapshots.rows[0]?.count, '2',
      'failed appointment persistence leaves no orphan Snapshot');

    assert.equal((await request(exam, bodyFor(exam, 'pass'))).status, 422, 'unknown operations are rejected');
    assert.equal((await request(exam, { ...bodyFor(exam, 'take_exam'), passRate: 1 })).status, 422,
      'client supplied probabilities and all unknown fields are rejected');
    assert.equal((await request(exam, { ...bodyFor(exam, 'take_exam'), result: 'passed' })).status, 422,
      'client supplied results are rejected');
    assert.equal((await request(exam, { ...bodyFor(exam, 'take_exam'), completedAt: exam.date })).status, 422,
      'client supplied dates are rejected');
    assert.equal((await request(exam, bodyFor(exam, 'take_exam'), false)).status, 401,
      'device and session authentication remain required');
    assert.equal((await request(pending, bodyFor(pending, 'abandon'))).status, 422,
      'an already selected story event blocks the operation');
    const pendingSlot = await db.query<{ current_snapshot_id: string | null }>(
      'SELECT current_snapshot_id FROM save_slots WHERE id = $1', [pending.slotId],
    );
    assert.equal(pendingSlot.rows[0]?.current_snapshot_id, pending.snapshotId,
      'blocked event phase leaves the snapshot untouched');
    const pendingReplay = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM replay_actions WHERE session_id = $1 AND action_type = 'scholar_official_pursuit_action'`,
      [pending.sessionId],
    );
    assert.equal(pendingReplay.rows[0]?.count, '0', 'blocked event phase creates no replay action');

    const examBody = bodyFor(exam, 'take_exam');
    const concurrent = await Promise.all([request(exam, examBody), request(exam, examBody)]);
    assert.deepEqual(concurrent.map(response => response.status).sort(), [200, 409],
      'slot and snapshot CAS allow at most one concurrent exam');
    const acceptedResponse = concurrent.find(response => response.status === 200);
    assert.ok(acceptedResponse);
    const result = await acceptedResponse.json() as {
      sessionPhase: string;
      slotVersion: number;
      snapshotId: string;
      contentHash: string;
      replayAction: { id: string; snapshotHashBefore: string; snapshotHashAfter: string };
      scholarOfficialPursuit: {
        status: string;
        latestExam: {
          result: 'passed' | 'failed';
          rulesVersion: string;
          knowledgeAtStart: number;
          adoptedPassRate: number;
          startedAt: { year: number; month: number; day: number };
          completedAt: { year: number; month: number; day: number };
        } | null;
      };
    };
    assert.equal(result.sessionPhase, 'action_summary', 'exam requires explicit result confirmation');
    assert.equal(result.scholarOfficialPursuit.status, 'active', 'passing grants qualification without completing or ending pursuit');
    const latestExam = result.scholarOfficialPursuit.latestExam;
    assert.ok(latestExam);
    assert.ok(['passed', 'failed'].includes(latestExam.result));
    assert.equal(latestExam.rulesVersion, 'curve-a-v1');
    assert.equal(latestExam.knowledgeAtStart, 20);
    assert.equal(latestExam.adoptedPassRate, 0.25);
    assert.deepEqual(latestExam.startedAt, exam.date);
    assert.deepEqual(latestExam.completedAt, { year: 4, month: 6, day: 3 });
    assert.equal(result.replayAction.snapshotHashBefore, exam.contentHash);
    assert.equal(result.replayAction.snapshotHashAfter, result.contentHash);
    assert.equal((await request(exam, examBody)).status, 409, 'replayed stale version and snapshot are rejected');

    const persistedSnapshot = await snapshotRepo.getSnapshotById(db, result.snapshotId);
    assert.ok(persistedSnapshot);
    assert.deepEqual(persistedSnapshot.snapshot.state.currentTime, latestExam.completedAt,
      'the persisted snapshot advances exactly one month');
    const persistedLedger = persistedSnapshot.snapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
      entries: Array<{ type: string; result?: string; rulesVersion?: string; adoptedPassRate?: number }>;
    };
    assert.equal(persistedLedger.entries.filter(entry => entry.type === 'exam_attempt').length, 1,
      'one exam operation appends exactly one ledger attempt');
    assert.equal(persistedLedger.entries[1]?.result, latestExam.result,
      'the response result matches the authoritative snapshot ledger');
    assert.equal(persistedSnapshot.snapshot.state.ending, undefined, 'passing never creates an ending');
    assert.equal(persistedSnapshot.snapshot.state.player.title ?? null, exam.titleBefore,
      'passing never assigns an office or title');

    const replayRows = await db.query<{
      id: string;
      action_type: string;
      snapshot_hash_before: string;
      snapshot_hash_after: string;
      payload: { operation?: string; exam?: { result?: string; rulesVersion?: string; knowledgeAtStart?: number; adoptedPassRate?: number } };
    }>(
      `SELECT id, action_type, snapshot_hash_before, snapshot_hash_after, payload
       FROM replay_actions WHERE session_id = $1 AND action_type = 'scholar_official_pursuit_action'`,
      [exam.sessionId],
    );
    assert.equal(replayRows.rows.length, 1, 'concurrent duplicate exam request creates one replay record');
    assert.equal(replayRows.rows[0]?.id, result.replayAction.id);
    assert.equal(replayRows.rows[0]?.payload.operation, 'take_exam');
    assert.deepEqual(replayRows.rows[0]?.payload.exam, {
      ...latestExam,
    });
    assert.equal(replayRows.rows[0]?.snapshot_hash_before, exam.contentHash);
    assert.equal(replayRows.rows[0]?.snapshot_hash_after, result.contentHash);

    const restored = await gameService.restoreSession(db, env, {
      deviceToken: exam.deviceToken,
      slotIndex: exam.slotIndex,
    }, runtimeCatalog);
    assert.equal(restored.sessionPhase, 'action_summary', 'database checkpoint restores result confirmation');
    assert.ok(restored.activeActionSummary?.resultExplanation?.includes(latestExam.result === 'passed' ? '合格' : '落选'));
    assert.deepEqual(restored.scholarOfficialPursuit.latestExam, latestExam,
      'snapshot restoration preserves the result and cooldown source facts');

    const abandonResponse = await request(abandon, bodyFor(abandon, 'abandon'));
    assert.equal(abandonResponse.status, 200, 'active pursuit can be voluntarily abandoned');
    const abandonResult = await abandonResponse.json() as {
      sessionPhase: string;
      snapshotId: string;
      contentHash: string;
      replayAction: { id: string; snapshotHashBefore: string; snapshotHashAfter: string };
      scholarOfficialPursuit: { status: string; canAbandon: boolean; latestExam: null };
    };
    assert.equal(abandonResult.sessionPhase, 'active_planning', 'abandon keeps legal planning active');
    assert.equal(abandonResult.scholarOfficialPursuit.status, 'abandoned');
    assert.equal(abandonResult.scholarOfficialPursuit.canAbandon, false);
    assert.equal(abandonResult.scholarOfficialPursuit.latestExam, null);
    const abandonedSnapshot = await snapshotRepo.getSnapshotById(db, abandonResult.snapshotId);
    assert.ok(abandonedSnapshot);
    assert.deepEqual(abandonedSnapshot.snapshot.state.currentTime, abandon.date, 'abandon consumes no game time');
    assert.equal(abandonedSnapshot.snapshot.state.pendingStoryEventId, undefined,
      'abandon does not take an extra Scheduler opportunity');
    const abandonLedger = abandonedSnapshot.snapshot.state.flags[SCHOLAR_OFFICIAL_PURSUIT_LEDGER_KEY] as {
      entries: Array<{ type: string }>;
    };
    assert.deepEqual(abandonLedger.entries.map(entry => entry.type), ['invitation_response', 'abandon']);
    const abandonReplay = await db.query<{ payload: { operation?: string }; snapshot_hash_before: string; snapshot_hash_after: string }>(
      `SELECT payload, snapshot_hash_before, snapshot_hash_after FROM replay_actions
       WHERE session_id = $1 AND action_type = 'scholar_official_pursuit_action'`,
      [abandon.sessionId],
    );
    assert.equal(abandonReplay.rows.length, 1);
    assert.equal(abandonReplay.rows[0]?.payload.operation, 'abandon');
    assert.equal(abandonReplay.rows[0]?.snapshot_hash_before, abandon.contentHash);
    assert.equal(abandonReplay.rows[0]?.snapshot_hash_after, abandonResult.contentHash);

    const rollbackDevice = await bootstrapDevice(db, env);
    const rollback = await createAcceptedFixture(db, env, rollbackDevice.deviceToken, 1, '回滚求仕侠');
    const triggerName = `fail_scholar_audit_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const functionName = `${triggerName}_fn`;
    await db.query(`CREATE FUNCTION ${functionName}() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.action_type = 'scholar_official_pursuit_action' THEN RAISE EXCEPTION 'forced scholar audit failure'; END IF; RETURN NEW; END $$`);
    await db.query(`CREATE TRIGGER ${triggerName} BEFORE INSERT ON replay_actions FOR EACH ROW EXECUTE FUNCTION ${functionName}()`);
    try {
      const failed = await request(rollback, bodyFor(rollback, 'take_exam'));
      assert.equal(failed.status, 500, 'replay audit failure aborts the exam transaction');
    } finally {
      await db.query(`DROP TRIGGER IF EXISTS ${triggerName} ON replay_actions`);
      await db.query(`DROP FUNCTION IF EXISTS ${functionName}()`);
    }
    const rollbackSlot = await db.query<{ current_snapshot_id: string; version: number }>(
      'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [rollback.slotId],
    );
    assert.deepEqual(rollbackSlot.rows[0], {
      current_snapshot_id: rollback.snapshotId,
      version: rollback.slotVersion,
    }, 'failed persistence rolls back the slot pointer and version');
    const rollbackCheckpoint = await db.query<{ checkpoint_state: string; snapshot_id: string }>(
      'SELECT checkpoint_state, snapshot_id FROM save_slot_progression_checkpoints WHERE save_slot_id = $1',
      [rollback.slotId],
    );
    assert.deepEqual(rollbackCheckpoint.rows[0], { checkpoint_state: 'clear', snapshot_id: rollback.snapshotId });
    const rollbackReplay = await db.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM replay_actions
       WHERE session_id = $1 AND action_type = 'scholar_official_pursuit_action'`,
      [rollback.sessionId],
    );
    assert.equal(rollbackReplay.rows[0]?.count, '0', 'failed persistence leaves no replay record');
    const rollbackSnapshots = await db.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM game_snapshots WHERE save_slot_id = $1', [rollback.slotId],
    );
    assert.equal(rollbackSnapshots.rows[0]?.count, '2', 'failed persistence leaves no orphan result snapshot');
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await closePool();
  }
}

export async function runScholarOfficialPursuitApiTests(databaseUrl: string): Promise<void> {
  process.env.DATABASE_URL = databaseUrl;
  await run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required for scholar pursuit API tests');
  runScholarOfficialPursuitApiTests(databaseUrl).catch(error => {
    console.error(error);
    process.exit(1);
  });
}
