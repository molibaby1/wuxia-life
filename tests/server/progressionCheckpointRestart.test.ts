import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { loadBackendEnv } from '../../server/src/config/env.js';
import { closePool, getPool } from '../../server/src/db/pool.js';
import { runMigrations } from '../../server/src/db/migrate.js';
import { StructuredLogger } from '../../server/src/logging/logger.js';
import { createRouter, seedActiveCatalog } from '../../server/src/http/router.js';
import { handleCors } from '../../server/src/http/cors.js';
import * as gameService from '../../server/src/services/gameService.js';
import { bootstrapDevice } from '../../server/src/services/deviceService.js';
import * as saveSlotRepo from '../../server/src/repositories/saveSlotRepository.js';
import * as snapshotRepo from '../../server/src/repositories/snapshotRepository.js';
import * as progressionCheckpointRepo from '../../server/src/repositories/progressionCheckpointRepository.js';
import { buildCheckpoint } from '../../server/src/repositories/progressionCheckpointRepository.js';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl.js';
import { SeededRandomSource } from '../../src/headless/adapters/randomSource.js';

const childMode = process.argv.includes('--api-child');
const activeApiChildren = new Set<ReturnType<typeof spawn>>();
let activeSchemaName: string | undefined;
let activeSourceDatabaseUrl: string | undefined;

function changedPaths(before: unknown, after: unknown, path = '$'): string[] {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (
    typeof before !== 'object' || before === null || Array.isArray(before) ||
    typeof after !== 'object' || after === null || Array.isArray(after)
  ) return [path];
  const beforeRecord = before as Record<string, unknown>;
  const afterRecord = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)]);
  return [...keys].flatMap(key => changedPaths(beforeRecord[key], afterRecord[key], `${path}.${key}`));
}

async function runApiChild(): Promise<void> {
  const env = loadBackendEnv();
  const router = createRouter(env, new StructuredLogger(env));
  const server = createServer((req, res) => {
    if (handleCors(req, res, env)) return;
    void router(req, res);
  });
  server.listen(env.httpPort, env.httpHost, () => {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Expected TCP listener');
    console.log(JSON.stringify({ ready: `http://127.0.0.1:${address.port}` }));
  });
  await Promise.race([once(process, 'SIGTERM'), once(process, 'SIGINT')]);
  await new Promise<void>(resolve => server.close(() => resolve()));
  await closePool();
}

function startApiChild(): { child: ReturnType<typeof spawn>; ready: Promise<string>; getStderr: () => string } {
  const child = spawn(process.execPath, ['--import', 'tsx', fileURLToPath(import.meta.url), '--api-child'], {
    env: { ...process.env, HTTP_HOST: '127.0.0.1', HTTP_PORT: '18787' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  activeApiChildren.add(child);
  child.once('exit', () => activeApiChildren.delete(child));
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
  child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
  const ready = (async () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const line = stdout.split('\n').find(value => value.includes('"ready"'));
      if (line) return (JSON.parse(line) as { ready: string }).ready;
      if (child.exitCode !== null) throw new Error(`API child exited early: ${stderr}`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`API child did not become ready: ${stderr}`);
  })();
  return { child, ready, getStderr: () => stderr };
}

async function stopApiChild(child: ReturnType<typeof spawn>, signal: NodeJS.Signals): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill(signal);
  await exited;
}

async function stopAllApiChildren(): Promise<void> {
  await Promise.all([...activeApiChildren].map(child => stopApiChild(child, 'SIGTERM')));
}

async function dbSchemaIsolation(databaseUrl: string, schemaName: string): Promise<{
  currentSchema: string;
  migrationSchema: string | null;
  coreTableSchemas: Record<string, string>;
}> {
  const isolatedDb = getPool(databaseUrl);
  const current = await isolatedDb.query<{ current_schema: string }>('SELECT current_schema() AS current_schema');
  const migration = await isolatedDb.query<{ table_schema: string }>(
    `SELECT table_schema FROM information_schema.tables
      WHERE table_schema = current_schema() AND table_name = 'schema_migrations' AND table_type = 'BASE TABLE'`,
  );
  const tables = await isolatedDb.query<{ table_name: string; table_schema: string }>(
    `SELECT table_name, table_schema FROM information_schema.tables
      WHERE table_schema = current_schema() AND table_name = ANY($1::text[]) AND table_type = 'BASE TABLE'`,
    [[
      'anonymous_devices', 'game_sessions', 'game_snapshots', 'save_slots',
      'save_slot_progression_checkpoints',
    ]],
  );
  assert.equal(current.rows[0]?.current_schema, schemaName);
  return {
    currentSchema: current.rows[0]!.current_schema,
    migrationSchema: migration.rows[0]?.table_schema ?? null,
    coreTableSchemas: Object.fromEntries(tables.rows.map(row => [row.table_name, row.table_schema])),
  };
}

async function runProgressionCheckpointRestartTestImpl(sourceDatabaseUrl = process.env.DATABASE_URL): Promise<void> {
  assert.ok(sourceDatabaseUrl, 'DATABASE_URL is required');
  assert.match(new URL(sourceDatabaseUrl).pathname, /wuxia_p6b/, 'must use isolated P6B database');
  const schemaName = `progression_checkpoint_restart_${randomUUID().replace(/-/g, '')}`;
  activeSchemaName = schemaName;
  activeSourceDatabaseUrl = sourceDatabaseUrl;
  const admin = new pg.Client({ connectionString: sourceDatabaseUrl });
  await admin.connect();
  try {
    await admin.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
  } finally {
    await admin.end();
  }
  const scopedUrl = new URL(sourceDatabaseUrl);
  scopedUrl.searchParams.set('options', `-csearch_path=${schemaName}`);
  const databaseUrl = scopedUrl.toString();
  process.env.DATABASE_URL = databaseUrl;
  process.env.TOKEN_HASH_SECRET = 'progression-checkpoint-restart-test-secret';
  process.env.ENGINE_VERSION = 'progression-checkpoint-restart-test';
  process.env.EVENT_CATALOG_VERSION = '1.0.0';
  process.env.NODE_ENV = 'test';
  const env = loadBackendEnv();
  const db = getPool(databaseUrl);
  await runMigrations(databaseUrl);
  const isolation = await dbSchemaIsolation(sourceDatabaseUrl, schemaName);
  assert.equal(isolation.currentSchema, schemaName, 'test connections must resolve objects only in the isolated schema');
  assert.equal(isolation.migrationSchema, schemaName, 'schema_migrations must be created in the isolated schema');
  assert.deepEqual(isolation.coreTableSchemas, {
    anonymous_devices: schemaName,
    game_sessions: schemaName,
    game_snapshots: schemaName,
    save_slots: schemaName,
    save_slot_progression_checkpoints: schemaName,
  }, 'all fixture tables must be namespaced to the isolated schema');
  await seedActiveCatalog(env);
  const device = await bootstrapDevice(db, env);
  const created = await gameService.createNewSession(db, env, {
    deviceToken: device.deviceToken,
    slotIndex: 1,
    playerName: '跨进程恢复测试侠',
    gender: 'male',
    sourcePlatform: 'web-browser',
  });

  const snapshot = structuredClone(created.snapshot.snapshot);
  snapshot.state.player.age = 16;
  snapshot.state.player.alive = true;
  snapshot.state.player.connections = 5;
  snapshot.state.player.affiliation = null;
  snapshot.state.player.events = [];
  snapshot.state.eventHistory = [];
  delete snapshot.state.pendingStoryEventId;
  const planningSnapshot = await snapshotRepo.insertSnapshot(db, {
    saveSlotId: created.slot.id,
    sessionId: created.sessionId,
    slotVersion: created.slot.version + 1,
    snapshot,
    engineVersion: env.engineVersion,
    eventCatalogVersion: env.eventCatalogVersion,
  });
  const planningSlot = await saveSlotRepo.updateSlotPointer(
    db, created.slot.id, created.slot.version, planningSnapshot.id,
  );
  assert.ok(planningSlot, 'age-16 planning fixture is current');
  await progressionCheckpointRepo.saveCheckpoint(db, created.slot.id, planningSnapshot.id, {
    protocolVersion: 1,
    state: 'clear',
  });
  // Use a controlled Headless producer so the checkpoint and canonical action history
  // come from a real executeActiveAction result, rather than a hand-written DTO.
  // This verifies persistence/restoration of the combined phase, not random occurrence frequency.
  let actionProducer: HeadlessEngineSessionImpl | undefined;
  let attachedDisturbance: ReturnType<HeadlessEngineSessionImpl['getProgressionVolatileState']>['pendingDisturbanceNarrative'] = null;
  for (let seed = 1; seed <= 100; seed += 1) {
    const producer = HeadlessEngineSessionImpl.create(
      { snapshot: structuredClone(snapshot) },
      { random: new SeededRandomSource(seed) },
    );
    await producer.executeActiveAction('action_training_basic');
    const volatile = producer.getProgressionVolatileState();
    if (volatile.pendingActionSummary && volatile.pendingDisturbanceNarrative) {
      actionProducer = producer;
      attachedDisturbance = volatile.pendingDisturbanceNarrative;
      break;
    }
  }
  assert.ok(actionProducer, 'a controlled seed produces a real action summary with disturbance');
  const producerVolatile = actionProducer.getProgressionVolatileState();
  assert.equal(actionProducer.getSessionPhase(), 'action_summary');
  assert.ok(producerVolatile.pendingActionSummary);
  assert.ok(attachedDisturbance);
  const actionSnapshot = actionProducer.serialize();
  let actionRow: Awaited<ReturnType<typeof snapshotRepo.insertSnapshot>>;
  const writerClient = await db.connect();
  try {
    await writerClient.query('BEGIN');
    actionRow = await snapshotRepo.insertSnapshot(writerClient, {
      saveSlotId: created.slot.id,
      sessionId: created.sessionId,
      slotVersion: planningSlot.version + 1,
      snapshot: actionSnapshot,
      engineVersion: env.engineVersion,
      eventCatalogVersion: env.eventCatalogVersion,
    });
    const actionSlot = await saveSlotRepo.updateSlotPointer(writerClient, created.slot.id, planningSlot.version, actionRow.id);
    assert.ok(actionSlot, 'controlled action snapshot becomes current');
    await progressionCheckpointRepo.saveCheckpoint(
      writerClient,
      created.slot.id,
      actionRow.id,
      buildCheckpoint(producerVolatile, false),
    );
    await writerClient.query('COMMIT');
  } catch (error) {
    await writerClient.query('ROLLBACK');
    throw error;
  } finally {
    writerClient.release();
  }
  const pendingResponse = {
    sessionPhase: actionProducer.getSessionPhase(),
    activeActionSummary: producerVolatile.pendingActionSummary,
    disturbanceNarrative: attachedDisturbance,
    periodSummary: producerVolatile.pendingPeriodSummary,
    snapshotId: actionRow.id,
  };
  const writer = startApiChild();
  const writerBaseUrl = await writer.ready;
  const planningResponse = await fetch(`${writerBaseUrl}/v1/sessions/restore`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-device-token': device.deviceToken },
    body: JSON.stringify({ slotIndex: 1 }),
  });
  const planning = await planningResponse.json() as Record<string, any>;
  assert.equal(planningResponse.status, 200, JSON.stringify(planning));
  assert.equal(planning.sessionPhase, 'action_summary');
  const beforeRestart = JSON.parse(JSON.stringify({
    sessionPhase: pendingResponse.sessionPhase,
    activeActionSummary: pendingResponse.activeActionSummary,
    disturbanceNarrative: pendingResponse.disturbanceNarrative,
    periodSummary: pendingResponse.periodSummary,
  })) as Record<string, unknown>;
  assert.deepEqual(planning.activeActionSummary, beforeRestart.activeActionSummary);
  assert.deepEqual(planning.disturbanceNarrative, beforeRestart.disturbanceNarrative);

  await stopApiChild(writer.child, 'SIGKILL');
  const reader = startApiChild();
  const readerBaseUrl = await reader.ready;

  let result: unknown;
  let phaseAckEvidence: unknown;
  let failure: string | undefined;
  try {
    const response = await fetch(`${readerBaseUrl}/v1/sessions/restore`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-device-token': device.deviceToken },
      body: JSON.stringify({ slotIndex: 1 }),
    });
    const responseBody = await response.json() as Record<string, unknown>;
    assert.equal(response.status, 200, `fresh API process restore: ${JSON.stringify(responseBody)}`);
    const restored = responseBody;
    const { sessionToken: _sessionToken, ...restoredEvidence } = restored;
    result = { beforeRestart, afterRestart: restoredEvidence };
    assert.equal(restored.sessionPhase, beforeRestart.sessionPhase,
      'fresh API process must recover the pending phase after process restart');
    assert.deepEqual(restored.activeActionSummary, beforeRestart.activeActionSummary,
      'fresh API process must recover the complete action summary DTO');
    assert.deepEqual(restored.disturbanceNarrative, beforeRestart.disturbanceNarrative,
      'fresh API process must retain any disturbance accompanying action summary');
    assert.deepEqual(restored.periodSummary, beforeRestart.periodSummary,
      'fresh API process must retain the complete period summary DTO');
  } catch (error) {
    failure = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  } finally {
    await stopApiChild(reader.child, 'SIGTERM');
    const artifact = {
      test: 'progression checkpoint cross-process RED regression',
      processBoundary: 'independent API child process',
      database: new URL(databaseUrl).pathname,
      schema: schemaName,
      pendingPhase: beforeRestart.sessionPhase,
      beforeRestart,
      result,
      phaseAckEvidence,
      failure: failure ?? null,
      childStderr: reader.getStderr(),
    };
    await mkdir('artifacts', { recursive: true });
    await writeFile('artifacts/progression-checkpoint-restart-green.json', `${JSON.stringify(artifact, null, 2)}\n`);
  }
  try {
    const normalizationSession = await gameService.restoreSession(db, env, {
      deviceToken: device.deviceToken,
      slotIndex: 1,
    });
    const normalized = await gameService.manualSave(db, env, {
      deviceToken: device.deviceToken,
      sessionId: normalizationSession.sessionId,
      sessionToken: normalizationSession.sessionToken,
      expectedSlotVersion: normalizationSession.slotVersion,
      expectedSnapshotId: normalizationSession.snapshotId,
    });
    const secondSession = await gameService.restoreSession(db, env, {
      deviceToken: device.deviceToken,
      slotIndex: 1,
    });
    const thirdSession = await gameService.restoreSession(db, env, {
      deviceToken: device.deviceToken,
      slotIndex: 1,
    });
    const hashBeforeAck = await snapshotRepo.getSnapshotById(db, normalized.snapshot.id);
    assert.ok(hashBeforeAck);
    const concurrentAcks = await Promise.allSettled([secondSession, thirdSession].map(session =>
      gameService.acknowledgeProgression(db, env, {
        deviceToken: device.deviceToken,
        sessionId: session.sessionId,
        sessionToken: session.sessionToken,
        expectedSlotVersion: normalized.slot.version,
        expectedSnapshotId: normalized.snapshot.id,
        ackKind: 'action_summary',
      }),
    ));
    const successfulAcks = concurrentAcks.filter((outcome): outcome is PromiseFulfilledResult<Awaited<ReturnType<typeof gameService.acknowledgeProgression>>> => outcome.status === 'fulfilled');
    const firstAck = successfulAcks[0]?.value;
    assert.ok(firstAck, 'one of two concurrent phase ACKs must commit');
    const rejectedAck = concurrentAcks.find(outcome => outcome.status === 'rejected');
    const retryOutcome = rejectedAck?.status === 'rejected'
      ? ((rejectedAck.reason as { code?: string }).code ?? 'rejected')
      : 'accepted';
    const hashAfterAck = await snapshotRepo.getSnapshotById(db, firstAck.snapshotId);
    phaseAckEvidence = {
      previousSlotVersion: normalized.slot.version,
      firstAckSlotVersion: firstAck.slotVersion,
      previousSnapshotId: normalized.snapshot.id,
      firstAckSnapshotId: firstAck.snapshotId,
      snapshotHashBefore: hashBeforeAck.content_hash,
      snapshotHashAfter: hashAfterAck?.content_hash,
      changedCanonicalPaths: hashAfterAck ? changedPaths(hashBeforeAck.snapshot, hashAfterAck.snapshot) : [],
      retryOutcome,
      successfulConcurrentAcks: successfulAcks.length,
    };
    assert.equal(hashAfterAck?.content_hash, hashBeforeAck.content_hash,
      'acknowledging action_summary with attached disturbance must not change canonical snapshot hash');
    assert.ok(firstAck.slotVersion > normalized.slot.version,
      'phase-only ACK must advance the save slot version even when canonical hash is unchanged');
    assert.notEqual(firstAck.snapshotId, normalized.snapshot.id,
      'phase-only ACK must replace the snapshot pointer');
    assert.notEqual(retryOutcome, 'accepted',
      'a second restored session holding the old CAS token must be rejected');
    assert.equal(successfulAcks.length, 1,
      'two concurrent restored sessions holding the old CAS token must produce exactly one ACK');
    await assert.rejects(() => gameService.acknowledgeProgression(db, env, {
      deviceToken: device.deviceToken,
      sessionId: normalizationSession.sessionId,
      sessionToken: normalizationSession.sessionToken,
      expectedSlotVersion: normalized.slot.version,
      expectedSnapshotId: normalized.snapshot.id,
      ackKind: 'action_summary',
    }), { code: 'STALE_SLOT_VERSION' }, 'a serial retry with the old CAS token must also fail');
    const ackAudit = await db.query<{ count: string }>(
      "SELECT count(*) AS count FROM replay_actions WHERE save_slot_id = $1 AND action_type = 'progression_ack'",
      [created.slot.id],
    );
    assert.equal(ackAudit.rows[0]?.count, '1', 'only the committed confirmation has an ACK audit');
    assert.deepEqual(hashAfterAck?.snapshot.state, hashBeforeAck.snapshot.state,
      'phase-only confirmation does not re-settle facts or draw a scheduler event');
    assert.equal(firstAck.sessionPhase, 'disturbance_narrative',
      'action summary ACK must expose its accompanying disturbance as the next phase');
    assert.deepEqual(firstAck.disturbanceNarrative, attachedDisturbance);
    const disturbanceReader = startApiChild();
    const disturbanceResponse = await fetch(`${await disturbanceReader.ready}/v1/sessions/restore`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-device-token': device.deviceToken },
      body: JSON.stringify({ slotIndex: 1 }),
    });
    const disturbanceRestored = await disturbanceResponse.json() as Record<string, unknown>;
    assert.equal(disturbanceResponse.status, 200);
    assert.equal(disturbanceRestored.sessionPhase, 'disturbance_narrative');
    assert.deepEqual(disturbanceRestored.disturbanceNarrative, attachedDisturbance,
      'fresh API process must restore the complete disturbance narrative DTO');
    await stopApiChild(disturbanceReader.child, 'SIGTERM');
    const periodBase = await gameService.createNewSession(db, env, {
      deviceToken: device.deviceToken,
      slotIndex: 2,
      playerName: '真实事件阶段恢复侠',
      gender: 'male',
      sourcePlatform: 'web-browser',
    });
    const periodFixture = structuredClone(periodBase.snapshot.snapshot);
    periodFixture.state.player.age = 16;
    periodFixture.state.player.martialPower = 60;
    periodFixture.state.player.alive = true;
    periodFixture.state.player.connections = 5;
    periodFixture.state.player.affiliation = null;
    periodFixture.state.player.events = [];
    periodFixture.state.eventHistory = [];
    periodFixture.state.pendingStoryEventId = 'relationship_life_saving';
    const periodFixtureRow = await snapshotRepo.insertSnapshot(db, {
      saveSlotId: periodBase.slot.id,
      sessionId: periodBase.sessionId,
      slotVersion: periodBase.slot.version + 1,
      snapshot: periodFixture,
      engineVersion: env.engineVersion,
      eventCatalogVersion: env.eventCatalogVersion,
    });
    const periodFixtureSlot = await saveSlotRepo.updateSlotPointer(
      db, periodBase.slot.id, periodBase.slot.version, periodFixtureRow.id,
    );
    assert.ok(periodFixtureSlot);
    await progressionCheckpointRepo.saveCheckpoint(db, periodBase.slot.id, periodFixtureRow.id, {
      protocolVersion: 1,
      state: 'clear',
    });
    const periodWriter = startApiChild();
    const periodWriterUrl = await periodWriter.ready;
    const eventResponse = await fetch(`${periodWriterUrl}/v1/sessions/restore`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-device-token': device.deviceToken },
      body: JSON.stringify({ slotIndex: 2 }),
    });
    const eventSession = await eventResponse.json() as Record<string, any>;
    assert.equal(eventResponse.status, 200);
    assert.equal(eventSession.sessionPhase, 'story_event');
    const eventChoiceId = eventSession.nextEvent.choices.find((choice: { id: string }) =>
      choice.id === 'relationship_life_saving_not_save')?.id;
    assert.ok(eventChoiceId, 'formal relationship event has the expected available non-saving choice');
    const choiceResponse = await fetch(`${periodWriterUrl}/v1/sessions/${eventSession.sessionId}/choices`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-device-token': device.deviceToken,
        'x-session-token': eventSession.sessionToken,
      },
      body: JSON.stringify({
        expectedSlotVersion: eventSession.slotVersion,
        expectedSnapshotId: eventSession.snapshotId,
        eventId: eventSession.nextEvent.eventId,
        choiceId: eventChoiceId,
      }),
    });
    const periodPending = await choiceResponse.json() as Record<string, unknown>;
    assert.equal(choiceResponse.status, 200);
    assert.equal(periodPending.sessionPhase, 'period_summary');
    assert.ok(periodPending.periodSummary);
    await stopApiChild(periodWriter.child, 'SIGKILL');
    const periodReader = startApiChild();
    const periodResponse = await fetch(`${await periodReader.ready}/v1/sessions/restore`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-device-token': device.deviceToken },
      body: JSON.stringify({ slotIndex: 2 }),
    });
    const periodRestored = await periodResponse.json() as Record<string, unknown>;
    assert.equal(periodResponse.status, 200);
    assert.equal(periodRestored.sessionPhase, 'period_summary');
    assert.deepEqual(periodRestored.periodSummary, periodPending.periodSummary,
      'fresh API process must restore the complete period summary produced by a legal event choice');
    await stopApiChild(periodReader.child, 'SIGTERM');
    phaseAckEvidence = {
      ...phaseAckEvidence as Record<string, unknown>,
      disturbanceRestart: {
        phase: disturbanceRestored.sessionPhase,
        disturbanceNarrative: disturbanceRestored.disturbanceNarrative,
      },
      periodRestart: {
        phase: periodRestored.sessionPhase,
        periodSummary: periodRestored.periodSummary,
      },
    };
  } catch (error) {
    failure = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }
  await writeFile('artifacts/progression-checkpoint-phase-ack-diagnostic.json', `${JSON.stringify({
    phaseAckEvidence,
    failure: failure ?? null,
  }, null, 2)}\n`);
  await closePool();
  if (failure) throw new Error(`Progression checkpoint restart regression failed; see artifacts/progression-checkpoint-restart-green.json: ${failure}`);
}

export async function runProgressionCheckpointRestartTest(sourceDatabaseUrl = process.env.DATABASE_URL): Promise<void> {
  try {
    await runProgressionCheckpointRestartTestImpl(sourceDatabaseUrl);
  } finally {
    await stopAllApiChildren();
    await closePool();
    if (activeSchemaName && activeSourceDatabaseUrl) {
      const admin = new pg.Client({ connectionString: activeSourceDatabaseUrl });
      try {
        await admin.connect();
        await admin.query(`DROP SCHEMA IF EXISTS "${activeSchemaName}" CASCADE`);
      } finally {
        await admin.end();
        activeSchemaName = undefined;
        activeSourceDatabaseUrl = undefined;
      }
    }
  }
}

if (childMode) {
  await runApiChild();
} else if (import.meta.url === `file://${process.argv[1]}`) {
  await runProgressionCheckpointRestartTest();
  console.log('Progression checkpoint restart test passed');
}
