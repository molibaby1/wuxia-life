import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
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
import * as gameLifeRngRepo from '../../server/src/repositories/gameLifeRngRepository.js';
import { persistFixtureRngState, saveFixtureCheckpoint } from './gameLifeRngFixtures.js';
import {
  buildCheckpoint,
} from '../../server/src/repositories/progressionCheckpointRepository.js';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl.js';
import { SeededRandomSource } from '../../src/headless/adapters/randomSource.js';
import { GameEngineIntegration } from '../../src/core/GameEngineIntegration.js';
import { difficultyManager } from '../../src/core/DifficultyManager.js';
import { eventLoader } from '../../src/core/EventLoader.js';
import { getChallengeScene } from '../../src/data/challengeScenes.js';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../../src/contracts/choiceExecution.js';
import { selectPassiveNarrative } from '../../src/data/infantPassiveNarratives.js';
import type { GameState } from '../../src/types/eventTypes.js';

const childMode = process.argv.includes('--api-child');
const activeApiChildren = new Set<ReturnType<typeof spawn>>();
let activeSchemaName: string | undefined;
let activeSourceDatabaseUrl: string | undefined;

class CountingSeededRandomSource extends SeededRandomSource {
  readonly draws: number[] = [];

  override next(): number {
    const value = super.next();
    this.draws.push(value);
    return value;
  }
}

function countingRandomFromState(state: ReturnType<SeededRandomSource['exportState']>): CountingSeededRandomSource {
  const random = new CountingSeededRandomSource(state.initialSeed);
  for (let index = 0; index < state.drawIndex; index += 1) random.next();
  random.draws.length = 0;
  return random;
}

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
  let schedulerCalls = 0;
  const traceRandom = process.env.P6B_TEST_RNG_TRACE === '1';
  const requestRandomTrace = new AsyncLocalStorage<{
    requestId: string;
    draws: Array<{ seedLabel: string | number; value: number }>;
  }>();
  if (process.env.P6B_TEST_SCHEDULER_TRACE === '1') {
    const selectEvent = GameEngineIntegration.prototype.selectEvent;
    GameEngineIntegration.prototype.selectEvent = function (age?: number) {
      schedulerCalls += 1;
      return selectEvent.call(this, age);
    };
  }
  if (traceRandom) {
    const next = SeededRandomSource.prototype.next;
    SeededRandomSource.prototype.next = function () {
      const value = next.call(this);
      requestRandomTrace.getStore()?.draws.push({ seedLabel: this.seedLabel, value });
      return value;
    };
  }
  const traceScheduler = process.env.P6B_TEST_SCHEDULER_TRACE === '1';
  const env = loadBackendEnv();
  const router = createRouter(env, new StructuredLogger(env));
  const server = createServer((req, res) => {
    if (handleCors(req, res, env)) return;
    const requestId = req.headers['x-p6b-test-request-id'];
    const schedulerCallsAtRequestStart = schedulerCalls;
    if (traceScheduler && typeof requestId === 'string') {
      res.once('finish', () => {
        process.stdout.write(`${JSON.stringify({
          type: 'S1_SCHEDULER_WINDOW',
          requestId,
          schedulerDelta: schedulerCalls - schedulerCallsAtRequestStart,
          schedulerTotal: schedulerCalls,
        })}\n`);
      });
    }
    if (traceRandom && typeof requestId === 'string') {
      const randomWindow = { requestId, draws: [] as Array<{ seedLabel: string | number; value: number }> };
      res.once('finish', () => {
        process.stdout.write(`${JSON.stringify({
          type: 'S1_RANDOM_WINDOW',
          requestId,
          draws: randomWindow.draws,
          difficulty: {
            testModeEnabled: difficultyManager.config.testModeEnabled,
            failureProbabilityCoefficient: difficultyManager.config.failureProbabilityCoefficient,
          },
        })}\n`);
      });
      requestRandomTrace.run(randomWindow, () => { void router(req, res); });
      return;
    }
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

function startApiChild(traceScheduler = false, traceRandom = false): {
  child: ReturnType<typeof spawn>;
  ready: Promise<string>;
  traceScheduler: boolean;
  traceRandom: boolean;
  waitForSchedulerWindow: (requestId: string) => Promise<{ delta: number; total: number }>;
  waitForRandomWindow: (requestId: string) => Promise<{
    draws: Array<{ seedLabel: string | number; value: number }>;
    difficulty: { testModeEnabled: boolean; failureProbabilityCoefficient: number };
  }>;
  getStderr: () => string;
} {
  const child = spawn(process.execPath, ['--import', 'tsx', fileURLToPath(import.meta.url), '--api-child'], {
    env: {
      ...process.env,
      HTTP_HOST: '127.0.0.1',
      HTTP_PORT: '18787',
      P6B_TEST_SCHEDULER_TRACE: traceScheduler ? '1' : '0',
      P6B_TEST_RNG_TRACE: traceRandom ? '1' : '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  activeApiChildren.add(child);
  child.once('exit', () => activeApiChildren.delete(child));
  let stdout = '';
  let stderr = '';
  let stdoutRemainder = '';
  const schedulerWindows = new Map<string, { delta: number; total: number }>();
  const randomWindows = new Map<string, {
    draws: Array<{ seedLabel: string | number; value: number }>;
    difficulty: { testModeEnabled: boolean; failureProbabilityCoefficient: number };
  }>();
  const schedulerWindowWaiters = new Map<
    string,
    Array<{ resolve: (window: { delta: number; total: number }) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>
  >();
  const randomWindowWaiters = new Map<
    string,
    Array<{
      resolve: (window: {
        draws: Array<{ seedLabel: string | number; value: number }>;
        difficulty: { testModeEnabled: boolean; failureProbabilityCoefficient: number };
      }) => void;
      reject: (error: Error) => void;
      timer: NodeJS.Timeout;
    }>
  >();
  child.stdout.setEncoding('utf8').on('data', chunk => {
    stdout += chunk;
    const lines = `${stdoutRemainder}${chunk}`.split('\n');
    stdoutRemainder = lines.pop() ?? '';
    for (const line of lines) {
      try {
        const marker = JSON.parse(line) as {
          type?: string;
          requestId?: string;
          schedulerDelta?: number;
          schedulerTotal?: number;
          draws?: Array<{ seedLabel: string | number; value: number }>;
          difficulty?: { testModeEnabled: boolean; failureProbabilityCoefficient: number };
        };
        if (
          marker.type === 'S1_RANDOM_WINDOW' &&
          marker.requestId &&
          marker.draws &&
          marker.difficulty
        ) {
          const window = { draws: marker.draws, difficulty: marker.difficulty };
          randomWindows.set(marker.requestId, window);
          for (const waiter of randomWindowWaiters.get(marker.requestId) ?? []) {
            clearTimeout(waiter.timer);
            waiter.resolve(window);
          }
          randomWindowWaiters.delete(marker.requestId);
        }
        if (
          marker.type !== 'S1_SCHEDULER_WINDOW' ||
          !marker.requestId ||
          typeof marker.schedulerDelta !== 'number' ||
          typeof marker.schedulerTotal !== 'number'
        ) continue;
        const window = { delta: marker.schedulerDelta, total: marker.schedulerTotal };
        schedulerWindows.set(marker.requestId, window);
        for (const waiter of schedulerWindowWaiters.get(marker.requestId) ?? []) {
          clearTimeout(waiter.timer);
          waiter.resolve(window);
        }
        schedulerWindowWaiters.delete(marker.requestId);
      } catch {
        // The ready marker and diagnostic output are not scheduler-window records.
      }
    }
  });
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
  const waitForSchedulerWindow = (requestId: string) => {
    const existing = schedulerWindows.get(requestId);
    if (existing) return Promise.resolve(existing);
    return new Promise<{ delta: number; total: number }>((resolve, reject) => {
      const waiter = {
        resolve,
        reject,
        timer: setTimeout(() => {
          const waiters = schedulerWindowWaiters.get(requestId) ?? [];
          schedulerWindowWaiters.set(requestId, waiters.filter(candidate => candidate !== waiter));
          reject(new Error(`API child did not finish Scheduler window ${requestId}: ${stderr}`));
        // The response-finish marker closes the window; this timeout only fails a missing marker.
        }, 10_000),
      };
      const waiters = schedulerWindowWaiters.get(requestId) ?? [];
      waiters.push(waiter);
      schedulerWindowWaiters.set(requestId, waiters);
    });
  };
  const waitForRandomWindow = (requestId: string) => {
    const existing = randomWindows.get(requestId);
    if (existing) return Promise.resolve(existing);
    return new Promise<{
      draws: Array<{ seedLabel: string | number; value: number }>;
      difficulty: { testModeEnabled: boolean; failureProbabilityCoefficient: number };
    }>((resolve, reject) => {
      const waiter = {
        resolve,
        reject,
        timer: setTimeout(() => {
          const waiters = randomWindowWaiters.get(requestId) ?? [];
          randomWindowWaiters.set(requestId, waiters.filter(candidate => candidate !== waiter));
          reject(new Error(`API child did not finish RNG window ${requestId}: ${stderr}`));
        // The response-finish marker closes the window; this timeout only fails a missing marker.
        }, 10_000),
      };
      const waiters = randomWindowWaiters.get(requestId) ?? [];
      waiters.push(waiter);
      randomWindowWaiters.set(requestId, waiters);
    });
  };
  return {
    child,
    ready,
    traceScheduler,
    traceRandom,
    waitForSchedulerWindow,
    waitForRandomWindow,
    getStderr: () => stderr,
  };
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
      'save_slot_progression_checkpoints', 'game_life_rng_states',
    ]],
  );
  assert.equal(current.rows[0]?.current_schema, schemaName);
  return {
    currentSchema: current.rows[0]!.current_schema,
    migrationSchema: migration.rows[0]?.table_schema ?? null,
    coreTableSchemas: Object.fromEntries(tables.rows.map(row => [row.table_name, row.table_schema])),
  };
}

type ApiProgressionResponse = {
  sessionId: string;
  sessionToken?: string;
  slotVersion: number;
  snapshotId: string;
  sessionPhase: string;
  planningOptions?: Array<{ actionId: string }>;
  activeActionSummary?: unknown;
  disturbanceNarrative?: unknown;
  nextEvent?: {
    eventId: string;
    choices?: Array<{ id: string; available: boolean }>;
  } | null;
  periodSummary?: unknown;
  passiveNarrative?: { title: string; text: string } | null;
  feedback?: { player: unknown };
  error?: { code?: string; details?: { code?: string } };
};

async function runS1HeadlessApiActionParityScenario(
  db: ReturnType<typeof getPool>,
  env: ReturnType<typeof loadBackendEnv>,
  device: { deviceId: string; deviceToken: string },
): Promise<void> {
  const created = await gameService.createNewSession(db, env, {
    deviceToken: device.deviceToken,
    slotIndex: 3,
    playerName: '受控主动行动对照侠',
    gender: 'male',
    sourcePlatform: 'web-browser',
  });
  const fixtureSession = HeadlessEngineSessionImpl.create(
    {
      playerName: '受控主动行动对照侠',
      gender: 'male',
      catalogVersion: env.eventCatalogVersion,
      randomSeed: 1,
    },
    { random: new SeededRandomSource(1) },
  );
  const initialSnapshot = fixtureSession.serialize();
  initialSnapshot.state.player.age = 16;
  initialSnapshot.state.player.alive = true;
  initialSnapshot.state.player.connections = 5;
  initialSnapshot.state.player.affiliation = null;
  initialSnapshot.state.player.events = [];
  initialSnapshot.state.eventHistory = [];
  delete initialSnapshot.state.pendingStoryEventId;
  initialSnapshot.metadata.sourcePlatform = 'web-browser';
  initialSnapshot.metadata.engineVersion = env.engineVersion;
  initialSnapshot.metadata.eventCatalogVersion = env.eventCatalogVersion;
  assert.equal(initialSnapshot.metadata.eventCatalogVersion, env.eventCatalogVersion);
  assert.equal(env.eventCatalogVersion, '1.0.0');

  const initialRow = await snapshotRepo.insertSnapshot(db, {
    saveSlotId: created.slot.id,
    sessionId: created.sessionId,
    slotVersion: created.slot.version + 1,
    snapshot: initialSnapshot,
    engineVersion: env.engineVersion,
    eventCatalogVersion: env.eventCatalogVersion,
  });
  const initialSlot = await saveSlotRepo.updateSlotPointer(
    db, created.slot.id, created.slot.version, initialRow.id,
  );
  assert.ok(initialSlot, 'controlled age-16 planning snapshot becomes current');
  await persistFixtureRngState(db, created.slot.id, created.snapshot.id, initialRow.id, 3);
  await saveFixtureCheckpoint(db, created.slot.id, initialRow.id, initialSnapshot, {
    protocolVersion: 1,
    state: 'clear',
  });

  const headless = HeadlessEngineSessionImpl.create(
    { snapshot: structuredClone(initialSnapshot) },
    { random: new SeededRandomSource(3) },
  );
  const headlessEngine = (headless as unknown as { engine: GameEngineIntegration }).engine;
  let headlessSchedulerCalls = 0;
  const headlessSelectEvent = headlessEngine.selectEvent.bind(headlessEngine);
  headlessEngine.selectEvent = (age?: number) => {
    headlessSchedulerCalls += 1;
    return headlessSelectEvent(age);
  };
  assert.equal(headless.getSessionPhase(), 'active_planning');
  assert.ok(headless.getPlanningOptions().some(option => option.actionId === 'action_training_basic'));

  let schedulerRequestId = 0;
  const postJson = async (
    api: ReturnType<typeof startApiChild>,
    path: string,
    body: unknown,
    sessionToken?: string,
  ) => {
    const requestId = `s1-${++schedulerRequestId}`;
    const response = await fetch(`${await api.ready}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-device-token': device.deviceToken,
        ...(api.traceScheduler || api.traceRandom ? { 'x-p6b-test-request-id': requestId } : {}),
        ...(sessionToken ? { 'x-session-token': sessionToken } : {}),
      },
      body: JSON.stringify(body),
    });
    const responseBody = await response.json() as ApiProgressionResponse;
    const schedulerWindow = api.traceScheduler
      ? await api.waitForSchedulerWindow(requestId)
      : undefined;
    const randomWindow = api.traceRandom
      ? await api.waitForRandomWindow(requestId)
      : undefined;
    return { status: response.status, body: responseBody, schedulerWindow, randomWindow };
  };

  let writer = startApiChild(true);
  let reader: ReturnType<typeof startApiChild> | undefined;
  try {
    await writer.ready;
    const planningResponse = await postJson(writer, '/v1/sessions/restore', { slotIndex: 3 });
    assert.equal(planningResponse.status, 200);
    const planning = planningResponse.body;
    assert.equal(planning.sessionPhase, 'active_planning');
    assert.equal(planning.snapshotId, initialRow.id,
      'HTTP restores the exact controlled Snapshot used by the Headless path');
    const persistedInitial = await snapshotRepo.getSnapshotById(db, initialRow.id);
    assert.ok(persistedInitial);
    assert.deepEqual(persistedInitial.snapshot.state, JSON.parse(JSON.stringify(initialSnapshot.state)),
      'the persisted API starting state matches the canonical Headless starting state');
    assert.ok(planning.planningOptions?.some(option => option.actionId === 'action_training_basic'));
    assert.deepEqual(
      planning.planningOptions?.map(option => option.actionId),
      headless.getPlanningOptions().map(option => option.actionId),
      'HTTP and Headless expose the same legal initial planning actions',
    );
    assert.equal(planningResponse.schedulerWindow?.delta, 0);
    assert.equal(planningResponse.schedulerWindow?.total, 0,
      'restoring valid active planning does not evaluate the Scheduler');

    const timeBefore = headless.getRuntimeState().currentTime;
    await headless.executeActiveAction('action_training_basic');
    assert.equal(headlessSchedulerCalls, 0, 'Headless action execution does not evaluate the Scheduler');
    const headlessAction = headless.getProgressionVolatileState();
    const actionResponse = await postJson(
      writer,
      `/v1/sessions/${planning.sessionId}/active-action`,
      {
        expectedSlotVersion: planning.slotVersion,
        expectedSnapshotId: planning.snapshotId,
        actionId: 'action_training_basic',
      },
      planning.sessionToken,
    );
    assert.equal(actionResponse.status, 200);
    assert.equal(actionResponse.body.sessionPhase, 'action_summary');
    assert.ok(actionResponse.body.activeActionSummary);
    assert.deepEqual(
      actionResponse.body.activeActionSummary,
      JSON.parse(JSON.stringify(headlessAction.pendingActionSummary)),
      'HTTP action_summary displays the same actual settlement as Headless');
    assert.equal(actionResponse.schedulerWindow?.delta, 0);
    assert.equal(actionResponse.schedulerWindow?.total, 0,
      'active-action response does not evaluate the Scheduler before confirmation');

    const actionRow = await snapshotRepo.getSnapshotById(db, actionResponse.body.snapshotId);
    assert.ok(actionRow, 'HTTP action writes a Snapshot');
    assert.deepEqual(actionRow.snapshot.state, JSON.parse(JSON.stringify(headless.serialize().state)),
      'HTTP and Headless canonical states match immediately after the same action');
    const actionHistory = actionRow.snapshot.state.actionHistory ?? [];
    const activeActionEntries = actionHistory.filter(entry =>
      entry.sourceKind === 'active_action' && entry.actionId === 'action_training_basic',
    );
    assert.equal(activeActionEntries.length, 1, 'the active action settles and enters history exactly once');
    assert.equal(actionRow.snapshot.state.player.age, initialSnapshot.state.player.age);
    assert.deepEqual(actionRow.snapshot.state.currentTime, headless.serialize().state.currentTime);
    const monthsBefore = timeBefore.year * 12 + timeBefore.month;
    const monthsAfter = actionRow.snapshot.state.currentTime.year * 12 + actionRow.snapshot.state.currentTime.month;
    assert.equal(monthsAfter - monthsBefore, 3, 'one-quarter training advances the formal calendar by three months');
    for (const [stat, delta] of Object.entries(activeActionEntries[0]!.deltas)) {
      const beforeValue = initialSnapshot.state.player[stat as keyof typeof initialSnapshot.state.player];
      const afterValue = actionRow.snapshot.state.player[stat as keyof typeof actionRow.snapshot.state.player];
      assert.equal(afterValue, Number(beforeValue) + delta,
        `canonical ${stat} change matches the single Action History result`);
    }
    const actionCheckpoint = await progressionCheckpointRepo.getCheckpoint(
      db, created.slot.id, actionRow.id,
    );
    assert.deepEqual(
      actionCheckpoint,
      JSON.parse(JSON.stringify(progressionCheckpointRepo.buildCheckpoint(headlessAction, false))),
      'HTTP Snapshot checkpoint stores the unconfirmed Headless action result',
    );
    const activeActionReplay = await db.query<{ payload: { actionId?: string } }>(
      `SELECT payload FROM replay_actions
        WHERE save_slot_id = $1 AND action_type = 'active_action'
        ORDER BY id`,
      [created.slot.id],
    );
    assert.equal(activeActionReplay.rows.length, 1, 'one active-action Replay record is written');
    assert.equal(activeActionReplay.rows[0]?.payload.actionId, 'action_training_basic');

    await stopApiChild(writer.child, 'SIGKILL');
    reader = startApiChild(true);
    await reader.ready;
    const restoredResponse = await postJson(reader, '/v1/sessions/restore', { slotIndex: 3 });
    assert.equal(restoredResponse.status, 200);
    const restored = restoredResponse.body;
    assert.equal(restored.sessionPhase, 'action_summary',
      'a fresh HTTP process restores the pending action confirmation without skipping it');
    assert.equal(restored.snapshotId, actionResponse.body.snapshotId);
    assert.equal(restored.slotVersion, actionResponse.body.slotVersion);
    assert.deepEqual(restored.activeActionSummary, actionResponse.body.activeActionSummary);
    assert.ok(restored.sessionToken, 'restoring the action result provides an HTTP session token');
    assert.equal(restoredResponse.schedulerWindow?.delta, 0);
    assert.equal(restoredResponse.schedulerWindow?.total, 0,
      'restoring an unconfirmed action does not grant an extra Scheduler opportunity');

    const slotBeforeInvalid = await db.query<{ current_snapshot_id: string; version: number }>(
      'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [created.slot.id],
    );
    const checkpointBeforeInvalid = await progressionCheckpointRepo.getCheckpoint(
      db, created.slot.id, restored.snapshotId,
    );
    const duplicateAction = await postJson(
      reader,
      `/v1/sessions/${restored.sessionId}/active-action`,
      {
        expectedSlotVersion: restored.slotVersion,
        expectedSnapshotId: restored.snapshotId,
        actionId: 'action_training_basic',
      },
      restored.sessionToken,
    );
    assert.equal(duplicateAction.status, 422);
    assert.equal(duplicateAction.body.error?.details?.code, 'INVALID_SESSION_PHASE');
    const prematureDisturbanceAck = await postJson(
      reader,
      `/v1/sessions/${restored.sessionId}/progression-ack`,
      {
        expectedSlotVersion: restored.slotVersion,
        expectedSnapshotId: restored.snapshotId,
        ackKind: 'disturbance',
      },
      restored.sessionToken,
    );
    assert.equal(prematureDisturbanceAck.status, 422);
    assert.equal(prematureDisturbanceAck.body.error?.details?.code, 'INVALID_SESSION_PHASE');
    const slotAfterInvalid = await db.query<{ current_snapshot_id: string; version: number }>(
      'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [created.slot.id],
    );
    assert.deepEqual(slotAfterInvalid.rows, slotBeforeInvalid.rows,
      'illegal duplicate action and premature ACK leave the Snapshot pointer and slot version unchanged');
    assert.deepEqual(
      await progressionCheckpointRepo.getCheckpoint(db, created.slot.id, restored.snapshotId),
      checkpointBeforeInvalid,
      'illegal phase operations leave the pending result checkpoint unchanged',
    );
    assert.equal(duplicateAction.schedulerWindow?.delta, 0);
    assert.equal(prematureDisturbanceAck.schedulerWindow?.delta, 0);
    assert.equal(prematureDisturbanceAck.schedulerWindow?.total, 0,
      'illegal phase operations do not evaluate the Scheduler');
    const replayAfterInvalid = await db.query<{ payload: { actionId?: string } }>(
      `SELECT payload FROM replay_actions
        WHERE save_slot_id = $1 AND action_type = 'active_action'
        ORDER BY id`,
      [created.slot.id],
    );
    assert.equal(replayAfterInvalid.rows.length, 1,
      'rejected duplicate action does not add a second active-action Replay record');

    await headless.acknowledgeProgression('action_summary');
    let currentApi = restored;
    let ackKinds: string[] = [];
    let finalActionConfirmationWindow: { delta: number; total: number } | undefined;
    if (headless.getSessionPhase() === 'disturbance_narrative') {
      const ackResponse = await postJson(
        reader,
        `/v1/sessions/${restored.sessionId}/progression-ack`,
        {
          expectedSlotVersion: currentApi.slotVersion,
          expectedSnapshotId: currentApi.snapshotId,
          ackKind: 'action_summary',
        },
        restored.sessionToken,
      );
      assert.equal(ackResponse.status, 200);
      currentApi = ackResponse.body;
      ackKinds.push('action_summary');
      assert.equal(currentApi.sessionPhase, 'disturbance_narrative');
      assert.deepEqual(currentApi.disturbanceNarrative,
        JSON.parse(JSON.stringify(headless.getProgressionVolatileState().pendingDisturbanceNarrative)),
        'the confirmed summary exposes the same pending disturbance on both paths');
      assert.equal(ackResponse.schedulerWindow?.delta, 0);
      assert.equal(ackResponse.schedulerWindow?.total, 0,
        'confirming an action summary cannot schedule before its disturbance is confirmed');
      await headless.acknowledgeProgression('disturbance');
      const disturbanceAck = await postJson(
        reader,
        `/v1/sessions/${restored.sessionId}/progression-ack`,
        {
          expectedSlotVersion: currentApi.slotVersion,
          expectedSnapshotId: currentApi.snapshotId,
          ackKind: 'disturbance',
        },
        restored.sessionToken,
      );
      assert.equal(disturbanceAck.status, 200);
      currentApi = disturbanceAck.body;
      finalActionConfirmationWindow = disturbanceAck.schedulerWindow;
      ackKinds.push('disturbance');
    } else {
      assert.ok(
        headless.getSessionPhase() === 'active_planning' || headless.getSessionPhase() === 'story_event',
        'final action summary confirmation reaches planning or a selected event',
      );
      const ackResponse = await postJson(
        reader,
        `/v1/sessions/${restored.sessionId}/progression-ack`,
        {
          expectedSlotVersion: currentApi.slotVersion,
          expectedSnapshotId: currentApi.snapshotId,
          ackKind: 'action_summary',
        },
        restored.sessionToken,
      );
      assert.equal(ackResponse.status, 200);
      currentApi = ackResponse.body;
      finalActionConfirmationWindow = ackResponse.schedulerWindow;
      ackKinds.push('action_summary');
    }
    const headlessFinalPhase = headless.getSessionPhase();
    assert.ok(
      headlessFinalPhase === 'active_planning' || headlessFinalPhase === 'story_event',
      'the final Headless confirmation reaches a legal planning or event decision point',
    );
    assert.equal(headlessSchedulerCalls, 1,
      'Headless gets one Scheduler evaluation after the final result confirmation');
    assert.ok(
      currentApi.sessionPhase === 'active_planning' || currentApi.sessionPhase === 'story_event',
      'final confirmation reaches the next legal planning or event decision point',
    );
    const schedulerCallsAfterConfirmation = finalActionConfirmationWindow?.total ?? -1;
    assert.equal(finalActionConfirmationWindow?.delta, 1);
    assert.equal(schedulerCallsAfterConfirmation, 1,
      'HTTP gets one Scheduler evaluation at the final confirmation boundary');

    const finalSnapshot = await snapshotRepo.getSnapshotById(db, currentApi.snapshotId);
    assert.ok(finalSnapshot);
    assert.deepEqual(finalSnapshot.snapshot.state.currentTime, actionRow.snapshot.state.currentTime,
      'Scheduler evaluation does not advance the calendar a second time');
    const finalCheckpoint = await progressionCheckpointRepo.getCheckpoint(
      db, created.slot.id, finalSnapshot.id,
    );
    assert.deepEqual(finalCheckpoint, { protocolVersion: 1, state: 'clear' });
    const ackReplay = await db.query<{ payload: { ackKind?: string } }>(
      `SELECT payload FROM replay_actions
        WHERE save_slot_id = $1 AND action_type = 'progression_ack'
        ORDER BY id`,
      [created.slot.id],
    );
    assert.deepEqual(ackReplay.rows.map(row => row.payload.ackKind), ackKinds,
      'Replay records each legal confirmation once and in phase order');

    const stableRead = await postJson(reader, '/v1/sessions/restore', { slotIndex: 3 });
    assert.equal(stableRead.status, 200);
    assert.equal(stableRead.body.sessionPhase, currentApi.sessionPhase);
    assert.equal(stableRead.body.snapshotId, currentApi.snapshotId);
    assert.equal(stableRead.schedulerWindow?.delta, 0);
    assert.equal(stableRead.schedulerWindow?.total, 1,
      're-reading the next decision point does not grant another Scheduler opportunity');
    if (currentApi.sessionPhase === 'story_event') {
      assert.equal(currentApi.nextEvent?.eventId, finalSnapshot.snapshot.state.pendingStoryEventId);
      assert.deepEqual(stableRead.body.nextEvent, currentApi.nextEvent,
        're-reading a selected event preserves its player-visible identity and choices');
    } else {
      assert.equal(currentApi.sessionPhase, 'active_planning');
      assert.ok((stableRead.body.planningOptions?.length ?? 0) > 0);
      assert.equal(stableRead.body.nextEvent ?? null, null);
    }

    assert.equal(currentApi.sessionPhase, 'story_event',
      'S1b starts only when the controlled action confirmation selected an actual event');
    assert.equal(currentApi.nextEvent?.eventId, 'sect_choice',
      'S1b requires the current Scheduler result to be sect_choice');
    assert.equal(stableRead.body.nextEvent?.eventId, 'sect_choice',
      'restoring the current event preserves its identity');
    assert.equal(finalSnapshot.snapshot.state.pendingStoryEventId, 'sect_choice');
    assert.equal(finalSnapshot.snapshot.metadata.eventCatalogVersion, env.eventCatalogVersion);
    assert.ok(stableRead.body.sessionToken, 'the restore response provides the active HTTP session token');

    const eventHeadless = HeadlessEngineSessionImpl.create(
      { snapshot: structuredClone(finalSnapshot.snapshot) },
      { random: new SeededRandomSource(1) },
    );
    const eventHeadlessEngine = (eventHeadless as unknown as { engine: GameEngineIntegration }).engine;
    let eventHeadlessSchedulerCalls = 0;
    const eventHeadlessSelectEvent = eventHeadlessEngine.selectEvent.bind(eventHeadlessEngine);
    eventHeadlessEngine.selectEvent = (age?: number) => {
      eventHeadlessSchedulerCalls += 1;
      return eventHeadlessSelectEvent(age);
    };
    const headlessPendingEvent = eventHeadless.describePendingEvent();
    assert.equal(eventHeadless.getSessionPhase(), 'story_event');
    assert.equal(headlessPendingEvent?.eventId, 'sect_choice');
    const apiAvailableChoiceIds = (currentApi.nextEvent?.choices ?? [])
      .filter(choice => choice.available)
      .map(choice => choice.id);
    const headlessAvailableChoiceIds = (headlessPendingEvent?.event.choices ?? [])
      .filter(choice => choice.available)
      .map(choice => choice.id);
    assert.deepEqual(apiAvailableChoiceIds, headlessAvailableChoiceIds,
      'Headless reconstructed from the API event Snapshot exposes the same legal choices');
    const headlessStayHomeChoice = headlessPendingEvent?.raw.choices?.find(
      choice => choice.id === 'stay_home',
    );
    assert.ok(apiAvailableChoiceIds.includes('stay_home'),
      'the formal sect_choice Snapshot exposes stay_home as a legal Choice');
    assert.ok(headlessStayHomeChoice, 'Headless resolves the same formal Choice from the event Snapshot');
    assert.equal(headlessStayHomeChoice.outcomes, undefined,
      'stay_home has no random outcome branch');
    assert.equal(headlessStayHomeChoice.challenge, undefined,
      'stay_home has no random challenge branch');
    assert.equal(eventHeadlessSchedulerCalls, 0,
      'reading the already selected event does not draw another Scheduler result');

    const eventStateBeforeChoice = structuredClone(finalSnapshot.snapshot.state);
    const headlessChoiceResponse = await eventHeadless.executeChoice({
      requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
      snapshotRef: { snapshot: structuredClone(finalSnapshot.snapshot) },
      action: { eventId: 'sect_choice', choiceId: 'stay_home' },
    });
    assert.equal(headlessChoiceResponse.status, 'success');
    assert.equal(eventHeadless.getSessionPhase(), 'period_summary');
    const headlessPeriodSummary = eventHeadless.getProgressionVolatileState().pendingPeriodSummary;
    assert.ok(headlessPeriodSummary);
    const headlessPeriodSummaryView = headlessPeriodSummary as {
      sourceLabel?: string;
      headline?: string;
      body?: string;
      statDeltaSummary?: string;
    };
    assert.equal(headlessPeriodSummaryView.sourceLabel, '剧情抉择');
    assert.equal(headlessPeriodSummaryView.headline, headlessPendingEvent?.raw.content?.title);
    assert.ok(
      headlessPeriodSummaryView.body?.startsWith(
        headlessStayHomeChoice.description ?? headlessStayHomeChoice.text ?? headlessPendingEvent?.raw.content?.text ?? '',
      ),
      'period_summary presents the actual selected Choice or its explicit narrative',
    );
    assert.equal(eventHeadlessSchedulerCalls, 0,
      'Headless Choice execution does not run the Scheduler before result confirmation');

    const choiceResponse = await postJson(
      reader,
      `/v1/sessions/${stableRead.body.sessionId}/choices`,
      {
        expectedSlotVersion: stableRead.body.slotVersion,
        expectedSnapshotId: stableRead.body.snapshotId,
        eventId: 'sect_choice',
        choiceId: 'stay_home',
      },
      stableRead.body.sessionToken,
    );
    assert.equal(choiceResponse.status, 200, JSON.stringify(choiceResponse.body));
    assert.equal(choiceResponse.body.sessionPhase, 'period_summary');
    assert.equal(choiceResponse.schedulerWindow?.delta, 0);
    assert.equal(choiceResponse.schedulerWindow?.total, 1,
      'the HTTP Choice settles without an additional Scheduler call');
    assert.deepEqual(
      choiceResponse.body.periodSummary,
      JSON.parse(JSON.stringify(headlessPeriodSummary)),
      'HTTP period_summary matches the Headless summary from the same event Snapshot and Choice',
    );
    assert.ok(choiceResponse.body.feedback?.player);
    const headlessPlayerFeedback = headlessChoiceResponse.feedback.player as {
      narrativeResult?: string | null;
      statImpacts?: Array<{ stat: string; delta: number; visibility: string }>;
    };
    const apiPlayerFeedback = choiceResponse.body.feedback?.player as {
      narrativeResult?: string | null;
      statImpacts?: Array<{ stat: string; delta: number; visibility: string }>;
    };
    assert.equal(headlessPlayerFeedback.narrativeResult, null,
      'a direct Choice without an outcome does not invent an independent result narrative');
    assert.equal(apiPlayerFeedback?.narrativeResult, null);
    assert.deepEqual(
      choiceResponse.body.feedback?.player,
      JSON.parse(JSON.stringify(headlessChoiceResponse.feedback.player)),
      'public HTTP feedback matches the actual Headless Choice result',
    );
    assert.equal(eventHeadlessSchedulerCalls, 0,
      'Headless remains scheduler-free while the Choice result awaits confirmation');

    const choiceSnapshot = await snapshotRepo.getSnapshotById(db, choiceResponse.body.snapshotId);
    assert.ok(choiceSnapshot, 'HTTP Choice writes a period_summary Snapshot');
    assert.deepEqual(choiceSnapshot.snapshot.state.player.events,
      headlessChoiceResponse.nextSnapshot.state.player.events,
      'API and Headless event records match');
    assert.deepEqual(choiceSnapshot.snapshot.state.eventHistory,
      headlessChoiceResponse.nextSnapshot.state.eventHistory,
      'API and Headless formal Event History match');
    const { gameTimestamp: _apiGameTimestamp, ...apiCanonicalState } = choiceSnapshot.snapshot.state;
    const { gameTimestamp: _headlessGameTimestamp, ...headlessCanonicalState } = headlessChoiceResponse.nextSnapshot.state;
    assert.deepEqual(apiCanonicalState, headlessCanonicalState,
      'API and Headless business state, time and event history match after the same deterministic Choice');
    assert.equal(choiceSnapshot.snapshot.state.pendingStoryEventId, undefined,
      'the completed event is removed from the pending event pointer');
    assert.equal(choiceSnapshot.snapshot.state.flags.familyDisciple, true);
    assert.notDeepEqual(choiceSnapshot.snapshot.state.currentTime, eventStateBeforeChoice.currentTime,
      'the formal Choice advances its configured calendar time');
    assert.equal(choiceSnapshot.snapshot.state.criticalChoices?.sect_choice, 'none');
    const actualMartialPowerDelta =
      choiceSnapshot.snapshot.state.player.martialPower - eventStateBeforeChoice.player.martialPower;
    const publicMartialPowerImpact = apiPlayerFeedback.statImpacts?.find(
      impact => impact.stat === 'martialPower',
    );
    assert.ok(actualMartialPowerDelta !== 0, 'the controlled Choice produces a real canonical public stat change');
    assert.equal(publicMartialPowerImpact?.delta, actualMartialPowerDelta,
      'public feedback reports the actual canonical martialPower delta');
    assert.equal(publicMartialPowerImpact?.visibility, 'player');
    assert.ok(headlessPeriodSummaryView.statDeltaSummary?.includes(`功力+${actualMartialPowerDelta}`),
      'period_summary reports the same actual public stat delta');
    const sectChoiceHistory = choiceSnapshot.snapshot.state.eventHistory.filter(
      entry => entry.eventId === 'sect_choice',
    );
    assert.equal(sectChoiceHistory.length, 1, 'sect_choice enters Event History exactly once');
    assert.equal(sectChoiceHistory[0]?.age, eventStateBeforeChoice.player.age,
      'Event History records the age at which the player made the choice');
    const activeActionHistory = choiceSnapshot.snapshot.state.actionHistory?.filter(entry =>
      entry.sourceKind === 'active_action' && entry.actionId === 'action_training_basic',
    ) ?? [];
    assert.equal(activeActionHistory.length, 1,
      'the earlier active action remains settled exactly once through event execution');
    const choiceCheckpoint = await progressionCheckpointRepo.getCheckpoint(
      db, created.slot.id, choiceSnapshot.id,
    );
    assert.deepEqual(
      choiceCheckpoint,
      JSON.parse(JSON.stringify(buildCheckpoint(eventHeadless.getProgressionVolatileState(), false))),
      'HTTP checkpoint stores the unconfirmed period_summary produced by Headless');
    const choiceReplay = await db.query<{
      event_id: string | null;
      choice_id: string | null;
      payload: unknown;
    }>(
      `SELECT event_id, choice_id, payload FROM replay_actions
        WHERE save_slot_id = $1 AND action_type = 'choice_executed'
        ORDER BY id`,
      [created.slot.id],
    );
    assert.equal(choiceReplay.rows.length, 1, 'one choice_executed Replay is written');
    assert.equal(choiceReplay.rows[0]?.event_id, 'sect_choice');
    assert.equal(choiceReplay.rows[0]?.choice_id, 'stay_home');

    await stopApiChild(reader.child, 'SIGKILL');
    reader = startApiChild(true);
    const periodRestore = await postJson(reader, '/v1/sessions/restore', { slotIndex: 3 });
    assert.equal(periodRestore.status, 200);
    assert.equal(periodRestore.body.sessionPhase, 'period_summary',
      'a fresh API process restores the unconfirmed event result');
    assert.equal(periodRestore.body.snapshotId, choiceResponse.body.snapshotId);
    assert.equal(periodRestore.body.slotVersion, choiceResponse.body.slotVersion);
    assert.deepEqual(periodRestore.body.periodSummary, choiceResponse.body.periodSummary);
    assert.equal(periodRestore.schedulerWindow?.delta, 0);
    assert.equal(periodRestore.schedulerWindow?.total, 0,
      'new-process restoration of period_summary does not evaluate the Scheduler');

    const slotBeforeInvalidChoiceOps = await db.query<{
      current_snapshot_id: string;
      version: number;
    }>('SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [created.slot.id]);
    const checkpointBeforeInvalidChoiceOps = await progressionCheckpointRepo.getCheckpoint(
      db, created.slot.id, periodRestore.body.snapshotId,
    );
    const replayBeforeInvalidChoiceOps = await db.query<{
      action_type: string;
      event_id: string | null;
      choice_id: string | null;
      payload: unknown;
    }>(
      `SELECT action_type, event_id, choice_id, payload FROM replay_actions
        WHERE save_slot_id = $1 ORDER BY id`,
      [created.slot.id],
    );
    const duplicateChoice = await postJson(
      reader,
      `/v1/sessions/${periodRestore.body.sessionId}/choices`,
      {
        expectedSlotVersion: periodRestore.body.slotVersion,
        expectedSnapshotId: periodRestore.body.snapshotId,
        eventId: 'sect_choice',
        choiceId: 'stay_home',
      },
      periodRestore.body.sessionToken,
    );
    assert.equal(duplicateChoice.status, 422);
    assert.equal(duplicateChoice.body.error?.details?.code, 'INVALID_SESSION_PHASE');
    const wrongPeriodAck = await postJson(
      reader,
      `/v1/sessions/${periodRestore.body.sessionId}/progression-ack`,
      {
        expectedSlotVersion: periodRestore.body.slotVersion,
        expectedSnapshotId: periodRestore.body.snapshotId,
        ackKind: 'action_summary',
      },
      periodRestore.body.sessionToken,
    );
    assert.equal(wrongPeriodAck.status, 422);
    assert.equal(wrongPeriodAck.body.error?.details?.code, 'INVALID_SESSION_PHASE');
    const expiredChoiceCasAck = await postJson(
      reader,
      `/v1/sessions/${periodRestore.body.sessionId}/progression-ack`,
      {
        expectedSlotVersion: currentApi.slotVersion,
        expectedSnapshotId: currentApi.snapshotId,
        ackKind: 'period_summary',
      },
      periodRestore.body.sessionToken,
    );
    assert.equal(expiredChoiceCasAck.status, 409);
    assert.equal(expiredChoiceCasAck.body.error?.code, 'STALE_SLOT_VERSION');
    assert.equal(duplicateChoice.schedulerWindow?.delta, 0);
    assert.equal(wrongPeriodAck.schedulerWindow?.delta, 0);
    assert.equal(expiredChoiceCasAck.schedulerWindow?.delta, 0);
    assert.equal(expiredChoiceCasAck.schedulerWindow?.total, 0,
      'rejected phase and stale-CAS requests do not evaluate the Scheduler');
    const slotAfterInvalidChoiceOps = await db.query<{
      current_snapshot_id: string;
      version: number;
    }>('SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [created.slot.id]);
    assert.deepEqual(slotAfterInvalidChoiceOps.rows, slotBeforeInvalidChoiceOps.rows,
      'rejected duplicate Choice, wrong ACK and expired CAS leave the Snapshot pointer unchanged');
    assert.deepEqual(
      await progressionCheckpointRepo.getCheckpoint(db, created.slot.id, periodRestore.body.snapshotId),
      checkpointBeforeInvalidChoiceOps,
      'rejected operations leave the pending period_summary checkpoint unchanged');
    assert.deepEqual(
      (await db.query(
        `SELECT action_type, event_id, choice_id, payload FROM replay_actions
          WHERE save_slot_id = $1 ORDER BY id`,
        [created.slot.id],
      )).rows,
      replayBeforeInvalidChoiceOps.rows,
      'rejected operations do not append any Replay record');

    await eventHeadless.acknowledgeProgression('period_summary');
    assert.equal(eventHeadless.getSessionPhase(), 'active_planning',
      'confirmed ordinary event returns to legal active planning');
    assert.ok(eventHeadless.getPlanningOptions().length > 0,
      'Headless still has legal active actions after stay_home');
    assert.equal(eventHeadless.serialize().state.pendingStoryEventId, undefined);
    assert.equal(eventHeadlessSchedulerCalls, 0,
      'confirming an ordinary event with available actions does not recursively call the Scheduler');

    const periodAck = await postJson(
      reader,
      `/v1/sessions/${periodRestore.body.sessionId}/progression-ack`,
      {
        expectedSlotVersion: periodRestore.body.slotVersion,
        expectedSnapshotId: periodRestore.body.snapshotId,
        ackKind: 'period_summary',
      },
      periodRestore.body.sessionToken,
    );
    assert.equal(periodAck.status, 200, JSON.stringify(periodAck.body));
    assert.equal(periodAck.body.sessionPhase, 'active_planning');
    assert.ok((periodAck.body.planningOptions?.length ?? 0) > 0,
      'HTTP returns active planning while valid actions remain');
    assert.equal(periodAck.body.nextEvent ?? null, null);
    assert.equal(periodAck.schedulerWindow?.delta, 0);
    assert.equal(periodAck.schedulerWindow?.total, 0,
      'period_summary confirmation does not recursively evaluate ordinary Scheduler events');
    const activePlanningSnapshot = await snapshotRepo.getSnapshotById(db, periodAck.body.snapshotId);
    assert.ok(activePlanningSnapshot);
    assert.deepEqual(activePlanningSnapshot.snapshot.state, choiceSnapshot.snapshot.state,
      'period_summary confirmation does not settle the Choice effects a second time');
    assert.equal(periodAck.body.slotVersion, periodRestore.body.slotVersion + 1,
      'the successful result confirmation advances the slot CAS version once');
    assert.notEqual(periodAck.body.snapshotId, periodRestore.body.snapshotId,
      'the successful result confirmation advances the Snapshot pointer');
    assert.deepEqual(
      await progressionCheckpointRepo.getCheckpoint(db, created.slot.id, activePlanningSnapshot.id),
      { protocolVersion: 1, state: 'clear' },
      'successful period_summary confirmation clears the pending checkpoint');
    const periodAckReplay = await db.query<{ payload: { ackKind?: string } }>(
      `SELECT payload FROM replay_actions
        WHERE save_slot_id = $1 AND action_type = 'progression_ack'
          AND payload->>'ackKind' = 'period_summary'
        ORDER BY id`,
      [created.slot.id],
    );
    assert.deepEqual(periodAckReplay.rows.map(row => row.payload.ackKind), ['period_summary'],
      'period_summary confirmation adds exactly one corresponding Replay');

    const slotBeforeExpiredAckRetry = await db.query<{
      current_snapshot_id: string;
      version: number;
    }>('SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [created.slot.id]);
    const checkpointBeforeExpiredAckRetry = await progressionCheckpointRepo.getCheckpoint(
      db, created.slot.id, activePlanningSnapshot.id,
    );
    const replayBeforeExpiredAckRetry = await db.query<{
      action_type: string;
      event_id: string | null;
      choice_id: string | null;
      payload: unknown;
    }>(
      `SELECT action_type, event_id, choice_id, payload FROM replay_actions
        WHERE save_slot_id = $1 ORDER BY id`,
      [created.slot.id],
    );
    const repeatedPeriodAck = await postJson(
      reader,
      `/v1/sessions/${periodRestore.body.sessionId}/progression-ack`,
      {
        expectedSlotVersion: periodRestore.body.slotVersion,
        expectedSnapshotId: periodRestore.body.snapshotId,
        ackKind: 'period_summary',
      },
      periodRestore.body.sessionToken,
    );
    assert.equal(repeatedPeriodAck.status, 409);
    assert.equal(repeatedPeriodAck.body.error?.code, 'STALE_SLOT_VERSION');
    assert.equal(repeatedPeriodAck.schedulerWindow?.delta, 0);
    const slotAfterExpiredAckRetry = await db.query<{
      current_snapshot_id: string;
      version: number;
    }>('SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [created.slot.id]);
    assert.deepEqual(slotAfterExpiredAckRetry.rows, slotBeforeExpiredAckRetry.rows,
      'a repeated stale period_summary ACK cannot advance the saved decision point');
    assert.deepEqual(
      await progressionCheckpointRepo.getCheckpoint(db, created.slot.id, activePlanningSnapshot.id),
      checkpointBeforeExpiredAckRetry,
      'a rejected repeated ACK leaves the clear checkpoint unchanged');
    assert.deepEqual(
      (await db.query(
        `SELECT action_type, event_id, choice_id, payload FROM replay_actions
          WHERE save_slot_id = $1 ORDER BY id`,
        [created.slot.id],
      )).rows,
      replayBeforeExpiredAckRetry.rows,
      'a rejected repeated ACK does not append any Replay record');
    assert.equal((await db.query<{ count: string }>(
      `SELECT count(*) AS count FROM replay_actions
        WHERE save_slot_id = $1 AND action_type = 'progression_ack'
          AND payload->>'ackKind' = 'period_summary'`,
      [created.slot.id],
    )).rows[0]?.count, '1', 'a rejected repeated ACK does not add Replay');

    const activePlanningRestore = await postJson(reader, '/v1/sessions/restore', { slotIndex: 3 });
    assert.equal(activePlanningRestore.status, 200);
    assert.equal(activePlanningRestore.body.sessionPhase, 'active_planning');
    assert.equal(activePlanningRestore.body.snapshotId, activePlanningSnapshot.id);
    assert.ok((activePlanningRestore.body.planningOptions?.length ?? 0) > 0);
    assert.equal(activePlanningRestore.schedulerWindow?.delta, 0);
    assert.equal(activePlanningRestore.schedulerWindow?.total, 0,
      'restoring the confirmed planning point does not offer another Scheduler opportunity');
    assert.equal(eventHeadlessSchedulerCalls, 0,
      'Headless repeated planning reads remain scheduler-free after ordinary event completion');
    console.log(`[S1] ${JSON.stringify({
      initialSnapshotId: initialRow.id,
      actionId: 'action_training_basic',
      actionSummaryPhase: actionResponse.body.sessionPhase,
      disturbanceConfirmed: Boolean(headlessAction.pendingDisturbanceNarrative),
      ackKinds,
      headlessFinalPhase,
      apiFinalPhase: currentApi.sessionPhase,
      selectedEventId: currentApi.nextEvent?.eventId ?? null,
      schedulerCalls: { headless: headlessSchedulerCalls, api: schedulerCallsAfterConfirmation },
      repeatedApiPhase: stableRead.body.sessionPhase,
    })}`);
    console.log(`[S1b] ${JSON.stringify({
      eventSnapshotId: finalSnapshot.id,
      eventId: 'sect_choice',
      choiceId: 'stay_home',
      choicePhase: choiceResponse.body.sessionPhase,
      periodSummaryRestoredPhase: periodRestore.body.sessionPhase,
      finalApiPhase: periodAck.body.sessionPhase,
      periodSummary: choiceResponse.body.periodSummary,
      publicFeedback: choiceResponse.body.feedback?.player,
      canonicalEffects: {
        ageBefore: eventStateBeforeChoice.player.age,
        ageAfter: choiceSnapshot.snapshot.state.player.age,
        timeBefore: eventStateBeforeChoice.currentTime,
        timeAfter: choiceSnapshot.snapshot.state.currentTime,
        familyDisciple: choiceSnapshot.snapshot.state.flags.familyDisciple,
        sectChoice: choiceSnapshot.snapshot.state.criticalChoices?.sect_choice,
      },
      rejectedOperations: [
        { operation: 'duplicate choice', status: duplicateChoice.status, code: duplicateChoice.body.error?.details?.code },
        { operation: 'wrong ackKind', status: wrongPeriodAck.status, code: wrongPeriodAck.body.error?.details?.code },
        { operation: 'expired CAS', status: expiredChoiceCasAck.status, code: expiredChoiceCasAck.body.error?.code },
        { operation: 'repeated ack', status: repeatedPeriodAck.status, code: repeatedPeriodAck.body.error?.code },
      ],
      checkpointAfterAck: await progressionCheckpointRepo.getCheckpoint(
        db, created.slot.id, activePlanningSnapshot.id,
      ),
      canonicalStateParity: true,
      feedbackParity: true,
      eventHistoryCount: sectChoiceHistory.length,
      choiceReplayCount: choiceReplay.rows.length,
      periodAckReplayCount: periodAckReplay.rows.length,
      schedulerWindows: {
        actionConfirmation: finalActionConfirmationWindow,
        eventRead: { delta: stableRead.schedulerWindow?.delta, total: stableRead.schedulerWindow?.total },
        choice: choiceResponse.schedulerWindow,
        periodRestore: periodRestore.schedulerWindow,
        invalidPeriodOps: [
          duplicateChoice.schedulerWindow,
          wrongPeriodAck.schedulerWindow,
          expiredChoiceCasAck.schedulerWindow,
        ],
        periodAck: periodAck.schedulerWindow,
        activePlanningRestore: activePlanningRestore.schedulerWindow,
        headlessEventPath: eventHeadlessSchedulerCalls,
      },
    })}`);
  } finally {
    if (reader) await stopApiChild(reader.child, 'SIGTERM');
    else await stopApiChild(writer.child, 'SIGTERM');
  }
}

async function runS1cRandomChoiceParityScenario(
  db: ReturnType<typeof getPool>,
  env: ReturnType<typeof loadBackendEnv>,
  device: { deviceId: string; deviceToken: string },
): Promise<void> {
  const eventId = 'jianghu_challenge';
  const choiceId = 'accept_challenge';
  const sceneId = 'jianghu_open_challenge';
  const event = eventLoader.getEventById(eventId);
  assert.ok(event, 'the active formal Catalog contains jianghu_challenge');
  const choice = event.choices?.find(candidate => candidate.id === choiceId);
  assert.ok(choice?.challenge, 'accept_challenge is a formal Challenge Choice');
  assert.equal(choice.challenge.sceneId, sceneId);
  assert.ok(event.ageRange && event.ageRange.min <= 35 && event.ageRange.max >= 35);
  assert.ok(event.triggers?.some(trigger => trigger.type === 'age_reach' && trigger.value === 30));
  assert.equal(event.triggerConditions?.stats?.martialPower?.min, 40);
  const scene = getChallengeScene(sceneId);
  assert.ok(scene, 'the formal Challenge scene is available');
  assert.equal(scene.baseFailureRate, 55);
  assert.deepEqual(scene.relevantStats, ['martialPower']);
  assert.equal(scene.thresholds.martialPower?.qualified, 70);
  assert.equal(scene.thresholds.martialPower?.excellent, 130);
  assert.equal(difficultyManager.config.testModeEnabled, false);
  assert.equal(difficultyManager.config.failureProbabilityCoefficient, 1);

  const created = await gameService.createNewSession(db, env, {
    deviceToken: device.deviceToken,
    slotIndex: 3,
    playerName: '受控随机挑战对照侠',
    gender: 'male',
    sourcePlatform: 'web-browser',
    confirmOverwrite: true,
  });
  const firstGeneratedRng = await gameLifeRngRepo.getLifeRngState(db, created.slot.id, created.snapshot.id);
  const fixture = HeadlessEngineSessionImpl.create(
    {
      playerName: '受控随机挑战对照侠',
      gender: 'male',
      catalogVersion: env.eventCatalogVersion,
      randomSeed: 1,
    },
    { random: new SeededRandomSource(1) },
  );
  const eventSnapshot = fixture.serialize();
  eventSnapshot.state.player.age = 35;
  eventSnapshot.state.player.alive = true;
  eventSnapshot.state.player.martialPower = 80;
  eventSnapshot.state.player.reputation = 20;
  eventSnapshot.state.player.chivalry = 30;
  eventSnapshot.state.player.traits = [];
  eventSnapshot.state.player.events = [];
  eventSnapshot.state.eventHistory = [];
  eventSnapshot.state.actionHistory = [];
  eventSnapshot.state.pendingStoryEventId = eventId;
  eventSnapshot.metadata.sourcePlatform = 'web-browser';
  eventSnapshot.metadata.engineVersion = env.engineVersion;
  eventSnapshot.metadata.eventCatalogVersion = env.eventCatalogVersion;
  assert.equal(eventSnapshot.metadata.eventCatalogVersion, '1.0.0');
  assert.ok(eventSnapshot.state.player.age >= event.ageRange.min);
  assert.ok(eventSnapshot.state.player.age <= event.ageRange.max);
  assert.ok(eventSnapshot.state.player.martialPower >= event.triggerConditions.stats.martialPower.min);
  assert.equal(choice.condition, undefined, 'accept_challenge has no additional conditional gate');

  const eventRow = await snapshotRepo.insertSnapshot(db, {
    saveSlotId: created.slot.id,
    sessionId: created.sessionId,
    slotVersion: created.slot.version + 1,
    snapshot: eventSnapshot,
    engineVersion: env.engineVersion,
    eventCatalogVersion: env.eventCatalogVersion,
  });
  const eventSlot = await saveSlotRepo.updateSlotPointer(
    db, created.slot.id, created.slot.version, eventRow.id,
  );
  assert.ok(eventSlot, 'the controlled current-event Snapshot becomes the API slot pointer');
  const firstLifeRng = await persistFixtureRngState(db, created.slot.id, created.snapshot.id, eventRow.id, 6);
  await saveFixtureCheckpoint(db, created.slot.id, eventRow.id, eventSnapshot, {
    protocolVersion: 1,
    state: 'clear',
  });
  const persistedEvent = await snapshotRepo.getSnapshotById(db, eventRow.id);
  assert.ok(persistedEvent);
  assert.deepEqual(persistedEvent.snapshot.state, JSON.parse(JSON.stringify(eventSnapshot.state)));

  const headlessRandom = countingRandomFromState(firstLifeRng.randomState);
  const headless = HeadlessEngineSessionImpl.create(
    { snapshot: structuredClone(persistedEvent.snapshot) },
    { random: headlessRandom },
  );
  const headlessEngine = (headless as unknown as { engine: GameEngineIntegration }).engine;
  let headlessSchedulerCalls = 0;
  const headlessSelectEvent = headlessEngine.selectEvent.bind(headlessEngine);
  headlessEngine.selectEvent = (age?: number) => {
    headlessSchedulerCalls += 1;
    return headlessSelectEvent(age);
  };
  assert.equal(headless.getSessionPhase(), 'story_event');
  assert.equal(headless.describePendingEvent()?.eventId, eventId);
  assert.ok(headless.getPlanningOptions().length > 0,
    'the controlled adult state retains legal active actions after the event');
  assert.equal(headless.hasPendingForcedEvent(), false);
  assert.equal(headlessRandom.draws.length, 0,
    'constructing a Headless Session does not consume the game random stream');
  const headlessChoiceAvailability = headless.describePendingEvent()?.event.choices
    ?.find(candidate => candidate.id === choiceId)?.available;
  assert.equal(headlessChoiceAvailability, true);

  let requestSequence = 0;
  const postJson = async (
    api: ReturnType<typeof startApiChild>,
    path: string,
    body: unknown,
    sessionToken?: string,
  ) => {
    const requestId = `s1c-${++requestSequence}`;
    const response = await fetch(`${await api.ready}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-device-token': device.deviceToken,
        ...(api.traceScheduler || api.traceRandom ? { 'x-p6b-test-request-id': requestId } : {}),
        ...(sessionToken ? { 'x-session-token': sessionToken } : {}),
      },
      body: JSON.stringify(body),
    });
    const responseBody = await response.json() as ApiProgressionResponse;
    const schedulerWindow = api.traceScheduler
      ? await api.waitForSchedulerWindow(requestId)
      : undefined;
    const randomWindow = api.traceRandom
      ? await api.waitForRandomWindow(requestId)
      : undefined;
    return { status: response.status, body: responseBody, schedulerWindow, randomWindow };
  };

  let apiProcess = startApiChild(true, true);
  try {
    await apiProcess.ready;
    const eventRestore = await postJson(apiProcess, '/v1/sessions/restore', { slotIndex: 3 });
    assert.equal(eventRestore.status, 200);
    assert.equal(eventRestore.body.sessionPhase, 'story_event');
    assert.equal(eventRestore.body.snapshotId, eventRow.id);
    assert.equal(eventRestore.body.nextEvent?.eventId, eventId);
    assert.ok(eventRestore.body.nextEvent?.choices?.some(
      candidate => candidate.id === choiceId && candidate.available,
    ));
    assert.ok(eventRestore.body.sessionToken);
    assert.equal(eventRestore.schedulerWindow?.delta, 0);
    assert.equal(eventRestore.schedulerWindow?.total, 0);
    assert.deepEqual(eventRestore.randomWindow?.draws, [],
      'API restore does not consume the persisted game random stream');

    const headlessBeforeChoice = structuredClone(headless.serialize().state);
    const headlessChoiceResponse = await headless.executeChoice({
      requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
      snapshotRef: { snapshot: structuredClone(persistedEvent.snapshot) },
      action: { eventId, choiceId },
    });
    assert.equal(headlessChoiceResponse.status, 'success');
    assert.equal(headless.getSessionPhase(), 'period_summary');
    assert.equal(headlessSchedulerCalls, 0,
      'Headless Choice settlement does not run the Scheduler before result confirmation');

    const apiChoice = await postJson(
      apiProcess,
      `/v1/sessions/${eventRestore.body.sessionId}/choices`,
      {
        expectedSlotVersion: eventRestore.body.slotVersion,
        expectedSnapshotId: eventRestore.body.snapshotId,
        eventId,
        choiceId,
      },
      eventRestore.body.sessionToken,
    );
    assert.equal(apiChoice.status, 200, JSON.stringify(apiChoice.body));
    assert.equal(apiChoice.body.sessionPhase, 'period_summary');
    assert.equal(apiChoice.schedulerWindow?.delta, 0);
    assert.equal(apiChoice.schedulerWindow?.total, 0,
      'the HTTP Choice response is returned without a Scheduler evaluation');

    const seededExpected = SeededRandomSource.fromState(firstLifeRng.randomState);
    const expectedDraws = [seededExpected.next()];
    assert.deepEqual(headlessRandom.draws, expectedDraws,
      'Headless consumes the next persisted life draw for the Challenge');
    assert.deepEqual(apiChoice.randomWindow?.draws,
      expectedDraws.map(value => ({ seedLabel: firstLifeRng.randomState.initialSeed, value })),
      'the real HTTP Choice request consumes the same persisted life draw as Headless');
    assert.equal(apiChoice.randomWindow?.draws[0]?.value, expectedDraws[0],
      'the next API request continues from the exact restored RNG position');
    assert.deepEqual(apiChoice.randomWindow?.difficulty, {
      testModeEnabled: difficultyManager.config.testModeEnabled,
      failureProbabilityCoefficient: difficultyManager.config.failureProbabilityCoefficient,
    }, 'HTTP and Headless use the same observed Challenge difficulty configuration');
    assert.equal(apiChoice.randomWindow?.difficulty.testModeEnabled, false);
    assert.equal(apiChoice.randomWindow?.difficulty.failureProbabilityCoefficient, 1);

    const failureRate = scene.baseFailureRate * difficultyManager.config.failureProbabilityCoefficient;
    assert.equal(failureRate, 55,
      'martialPower 80 is qualified but below the excellent threshold, so no scene modifier applies');
    assert.ok(expectedDraws[0]! * 100 < failureRate,
      'the controlled next life draw deterministically selects the formal failure branch');
    const challenge = choice.challenge;
    const headlessFeedback = headlessChoiceResponse.feedback.player as {
      narrativeResult?: string | null;
      statImpacts?: Array<{ stat: string; delta: number; visibility: string }>;
    };
    const apiFeedback = apiChoice.body.feedback?.player as {
      narrativeResult?: string | null;
      statImpacts?: Array<{ stat: string; delta: number; visibility: string }>;
    };
    assert.equal(headlessFeedback.narrativeResult, challenge.failure.text);
    assert.equal(apiFeedback?.narrativeResult, challenge.failure.text);
    assert.deepEqual(apiChoice.body.feedback?.player, JSON.parse(JSON.stringify(headlessChoiceResponse.feedback.player)));
    const reputationImpact = apiFeedback?.statImpacts?.find(impact => impact.stat === 'reputation');
    assert.equal(reputationImpact?.delta, -10);
    assert.equal(reputationImpact?.visibility, 'player');

    const choiceSnapshot = await snapshotRepo.getSnapshotById(db, apiChoice.body.snapshotId);
    assert.ok(choiceSnapshot);
    const choiceRng = await gameLifeRngRepo.getLifeRngState(db, created.slot.id, choiceSnapshot.id);
    assert.equal(choiceRng.lifeId, firstLifeRng.lifeId);
    assert.equal(choiceRng.randomState.drawIndex, firstLifeRng.randomState.drawIndex + 1,
      'the Challenge draw position advances atomically with the new Snapshot');
    assert.deepEqual(apiChoice.body.periodSummary,
      JSON.parse(JSON.stringify(headless.getProgressionVolatileState().pendingPeriodSummary)));
    assert.deepEqual(choiceSnapshot.snapshot.state.player.events,
      headlessChoiceResponse.nextSnapshot.state.player.events);
    assert.deepEqual(choiceSnapshot.snapshot.state.eventHistory,
      headlessChoiceResponse.nextSnapshot.state.eventHistory);
    const { gameTimestamp: _apiGameTimestamp, ...apiCanonicalState } = choiceSnapshot.snapshot.state;
    const { gameTimestamp: _headlessGameTimestamp, ...headlessCanonicalState } = headlessChoiceResponse.nextSnapshot.state;
    assert.deepEqual(apiCanonicalState, headlessCanonicalState,
      'all canonical business state, including calendar, facts and event history, matches exactly');
    assert.deepEqual(choiceSnapshot.snapshot.state.currentTime, headlessBeforeChoice.currentTime);
    assert.equal(choiceSnapshot.snapshot.state.player.age, 35);
    assert.equal(choiceSnapshot.snapshot.state.player.reputation, 10);
    assert.equal(choiceSnapshot.snapshot.state.player.martialPower, 80);
    assert.equal(choiceSnapshot.snapshot.state.pendingStoryEventId, undefined);
    assert.equal(choiceSnapshot.snapshot.state.eventHistory.filter(record => record.eventId === eventId).length, 1);
    assert.equal(apiChoice.body.slotVersion, eventRestore.body.slotVersion + 1);
    const currentSlotAfterChoice = await db.query<{
      current_snapshot_id: string;
      version: number;
    }>('SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [created.slot.id]);
    assert.deepEqual(currentSlotAfterChoice.rows, [{ current_snapshot_id: choiceSnapshot.id, version: apiChoice.body.slotVersion }]);
    const choiceCheckpoint = await progressionCheckpointRepo.getCheckpoint(db, created.slot.id, choiceSnapshot.id);
    assert.deepEqual(choiceCheckpoint,
      JSON.parse(JSON.stringify(buildCheckpoint(headless.getProgressionVolatileState(), false))));
    assert.equal(choiceCheckpoint.state, 'pending');
    assert.equal(choiceCheckpoint.phase, 'period_summary');
    const choiceReplay = await db.query<{
      event_id: string | null;
      choice_id: string | null;
      snapshot_hash_before: string | null;
      snapshot_hash_after: string | null;
    }>(
      `SELECT event_id, choice_id, snapshot_hash_before, snapshot_hash_after FROM replay_actions
        WHERE save_slot_id = $1 AND session_id = $2 AND action_type = 'choice_executed'
        ORDER BY id`,
      [created.slot.id, eventRestore.body.sessionId],
    );
    assert.deepEqual(choiceReplay.rows, [{
      event_id: eventId,
      choice_id: choiceId,
      snapshot_hash_before: eventRow.content_hash,
      snapshot_hash_after: choiceSnapshot.content_hash,
    }]);

    await stopApiChild(apiProcess.child, 'SIGKILL');
    apiProcess = startApiChild(true, true);
    await apiProcess.ready;
    const periodRestore = await postJson(apiProcess, '/v1/sessions/restore', { slotIndex: 3 });
    assert.equal(periodRestore.status, 200);
    assert.equal(periodRestore.body.sessionPhase, 'period_summary');
    assert.equal(periodRestore.body.snapshotId, choiceSnapshot.id);
    assert.equal(periodRestore.body.slotVersion, apiChoice.body.slotVersion);
    assert.deepEqual(periodRestore.body.periodSummary, apiChoice.body.periodSummary,
      'a fresh process restores the exact public result summary without re-running the Challenge');
    assert.equal(periodRestore.schedulerWindow?.delta, 0);
    assert.equal(periodRestore.schedulerWindow?.total, 0);
    assert.deepEqual(periodRestore.randomWindow?.draws, [],
      'restoring period_summary does not consume or redraw the Challenge random input');

    const slotBeforeRejected = await db.query<{
      current_snapshot_id: string;
      version: number;
    }>('SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [created.slot.id]);
    const checkpointBeforeRejected = await progressionCheckpointRepo.getCheckpoint(
      db, created.slot.id, periodRestore.body.snapshotId,
    );
    const replayCountBeforeRejected = await db.query<{ count: string }>(
      'SELECT count(*) AS count FROM replay_actions WHERE save_slot_id = $1',
      [created.slot.id],
    );
    const duplicateChoice = await postJson(
      apiProcess,
      `/v1/sessions/${periodRestore.body.sessionId}/choices`,
      {
        expectedSlotVersion: periodRestore.body.slotVersion,
        expectedSnapshotId: periodRestore.body.snapshotId,
        eventId,
        choiceId,
      },
      periodRestore.body.sessionToken,
    );
    assert.equal(duplicateChoice.status, 422);
    assert.equal(duplicateChoice.body.error?.details?.code, 'INVALID_SESSION_PHASE');
    assert.equal(duplicateChoice.randomWindow?.draws.length, 0,
      'a duplicate Choice rejected in period_summary consumes no game randomness');
    assert.equal(duplicateChoice.schedulerWindow?.delta, 0);
    assert.equal(duplicateChoice.schedulerWindow?.total, 0);
    assert.deepEqual((await db.query(
      'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [created.slot.id],
    )).rows, slotBeforeRejected.rows);
    assert.deepEqual(
      await progressionCheckpointRepo.getCheckpoint(db, created.slot.id, periodRestore.body.snapshotId),
      checkpointBeforeRejected,
    );
    assert.equal((await db.query<{ count: string }>(
      'SELECT count(*) AS count FROM replay_actions WHERE save_slot_id = $1',
      [created.slot.id],
    )).rows[0]?.count, replayCountBeforeRejected.rows[0]?.count,
    'rejected duplicate Choice does not append a Replay record');
    assert.equal((await db.query<{ count: string }>(
      `SELECT count(*) AS count FROM replay_actions
        WHERE save_slot_id = $1 AND session_id = $2 AND action_type = 'choice_executed'`,
      [created.slot.id, eventRestore.body.sessionId],
    )).rows[0]?.count, '1');

    if (choiceCheckpoint.state !== 'pending' || choiceCheckpoint.phase !== 'period_summary') {
      throw new Error('The persisted Challenge checkpoint must contain period_summary');
    }
    const headlessAckRandom = countingRandomFromState(choiceRng.randomState);
    const headlessAck = HeadlessEngineSessionImpl.create(
      { snapshot: structuredClone(choiceSnapshot.snapshot) },
      { random: headlessAckRandom },
    );
    headlessAck.applyProgressionVolatileState({
      ...headless.getProgressionVolatileState(),
      pendingPeriodSummary: choiceCheckpoint.payload.pendingPeriodSummary,
    });
    const ackEngine = (headlessAck as unknown as { engine: GameEngineIntegration }).engine;
    let headlessAckSchedulerCalls = 0;
    const ackSelectEvent = ackEngine.selectEvent.bind(ackEngine);
    ackEngine.selectEvent = (age?: number) => {
      headlessAckSchedulerCalls += 1;
      return ackSelectEvent(age);
    };
    assert.equal(headlessAck.getSessionPhase(), 'period_summary');
    assert.equal(headlessAck.hasPendingForcedEvent(), false,
      'the controlled ordinary Challenge result has no pending forced event before ACK');
    assert.ok(headlessAck.getPlanningOptions().length > 0,
      'legal active actions remain available at the persisted Challenge decision point');
    assert.equal(headlessAckRandom.draws.length, 0,
      'the restored Headless ACK Session starts at the persisted post-Challenge draw position');

    await headlessAck.acknowledgeProgression('period_summary');
    const periodAck = await postJson(
      apiProcess,
      `/v1/sessions/${periodRestore.body.sessionId}/progression-ack`,
      {
        expectedSlotVersion: periodRestore.body.slotVersion,
        expectedSnapshotId: periodRestore.body.snapshotId,
        ackKind: 'period_summary',
      },
      periodRestore.body.sessionToken,
    );
    assert.equal(periodAck.status, 200, JSON.stringify(periodAck.body));
    assert.equal(periodAck.body.sessionPhase, 'active_planning',
      'with no pending forced event and legal actions available, result confirmation returns to active planning');
    assert.equal(periodAck.body.sessionPhase, headlessAck.getSessionPhase(),
      'API and a restored Headless Session reach the same post-confirmation phase');
    assert.deepEqual(periodAck.randomWindow?.draws,
      headlessAckRandom.draws.map(value => ({ seedLabel: choiceRng.randomState.initialSeed, value })),
      'the API and restored Headless ACK consume the same persisted random input');
    assert.equal(periodAck.schedulerWindow?.delta, headlessAckSchedulerCalls,
      'the API ACK Scheduler count matches the restored Headless ACK path');
    if (periodAck.body.sessionPhase === 'active_planning') {
      assert.ok((periodAck.body.planningOptions?.length ?? 0) > 0);
      assert.ok(headlessAck.getPlanningOptions().length > 0);
      assert.equal(periodAck.body.nextEvent ?? null, null);
    } else {
      const headlessNextEvent = headlessAck.describePendingEvent();
      assert.ok(headlessNextEvent);
      assert.equal(periodAck.body.nextEvent?.eventId, headlessNextEvent.eventId);
      assert.deepEqual(periodAck.body.nextEvent?.choices, headlessNextEvent.event.choices);
    }

    const ackSnapshot = await snapshotRepo.getSnapshotById(db, periodAck.body.snapshotId);
    assert.ok(ackSnapshot);
    const { gameTimestamp: _apiAckGameTimestamp, ...apiAckCanonicalState } = ackSnapshot.snapshot.state;
    const { gameTimestamp: _headlessAckGameTimestamp, ...headlessAckCanonicalState } = headlessAck.serialize().state;
    assert.deepEqual(apiAckCanonicalState, headlessAckCanonicalState,
      'the confirmed API and Headless canonical state, including game calendar, match');
    assert.deepEqual(ackSnapshot.snapshot.state.currentTime, headlessAck.serialize().state.currentTime);
    assert.deepEqual(ackSnapshot.snapshot.state.currentTime, choiceSnapshot.snapshot.state.currentTime,
      'the available-action confirmation does not advance time or recurse into event scheduling');
    assert.equal(periodAck.body.slotVersion, periodRestore.body.slotVersion + 1);
    assert.notEqual(periodAck.body.snapshotId, periodRestore.body.snapshotId);
    const slotAfterAck = await db.query<{
      current_snapshot_id: string;
      version: number;
    }>('SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [created.slot.id]);
    assert.deepEqual(slotAfterAck.rows, [{
      current_snapshot_id: ackSnapshot.id,
      version: periodAck.body.slotVersion,
    }]);
    const ackCheckpoint = await progressionCheckpointRepo.getCheckpoint(db, created.slot.id, ackSnapshot.id);
    assert.deepEqual(ackCheckpoint, { protocolVersion: 1, state: 'clear' });
    const ackReplay = await db.query<{
      payload: {
        ackKind?: string;
        rng?: {
          lifeId: string;
          algorithm: string;
          algorithmVersion: number;
          initialSeed: number;
          drawIndexBefore: number;
          drawIndexAfter: number;
          stateBefore: number;
          stateAfter: number;
        };
      };
      snapshot_hash_before: string | null;
      snapshot_hash_after: string | null;
    }>(
      `SELECT payload, snapshot_hash_before, snapshot_hash_after FROM replay_actions
        WHERE save_slot_id = $1 AND session_id = $2 AND action_type = 'progression_ack'
          AND payload->>'ackKind' = 'period_summary'`,
      [created.slot.id, periodRestore.body.sessionId],
    );
    assert.deepEqual(ackReplay.rows, [{
      payload: {
        ackKind: 'period_summary',
        rng: {
          lifeId: choiceRng.lifeId,
          algorithm: choiceRng.randomState.algorithm,
          algorithmVersion: choiceRng.randomState.algorithmVersion,
          initialSeed: choiceRng.randomState.initialSeed,
          drawIndexBefore: choiceRng.randomState.drawIndex,
          drawIndexAfter: choiceRng.randomState.drawIndex,
          stateBefore: choiceRng.randomState.state,
          stateAfter: choiceRng.randomState.state,
        },
      },
      snapshot_hash_before: choiceSnapshot.content_hash,
      snapshot_hash_after: ackSnapshot.content_hash,
    }]);
    const repeatedAck = await postJson(
      apiProcess,
      `/v1/sessions/${periodRestore.body.sessionId}/progression-ack`,
      {
        expectedSlotVersion: periodRestore.body.slotVersion,
        expectedSnapshotId: periodRestore.body.snapshotId,
        ackKind: 'period_summary',
      },
      periodRestore.body.sessionToken,
    );
    assert.equal(repeatedAck.status, 409);
    assert.equal(repeatedAck.body.error?.code, 'STALE_SLOT_VERSION');
    assert.deepEqual(repeatedAck.randomWindow?.draws, [],
      'a repeated confirmed ACK is rejected before creating a Session or consuming randomness');
    assert.equal(repeatedAck.schedulerWindow?.delta, 0);
    assert.equal(repeatedAck.schedulerWindow?.total, 0);
    assert.deepEqual((await db.query(
      'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [created.slot.id],
    )).rows, slotAfterAck.rows);
    assert.deepEqual(
      await progressionCheckpointRepo.getCheckpoint(db, created.slot.id, ackSnapshot.id),
      ackCheckpoint,
    );
    assert.equal((await db.query<{ count: string }>(
      `SELECT count(*) AS count FROM replay_actions
        WHERE save_slot_id = $1 AND session_id = $2 AND action_type = 'progression_ack'
          AND payload->>'ackKind' = 'period_summary'`,
      [created.slot.id, periodRestore.body.sessionId],
    )).rows[0]?.count, '1', 'the repeated ACK does not create a second Replay record');
    assert.equal((await db.query<{ count: string }>(
      `SELECT count(*) AS count FROM replay_actions
        WHERE save_slot_id = $1 AND session_id = $2 AND action_type = 'choice_executed'`,
      [created.slot.id, eventRestore.body.sessionId],
    )).rows[0]?.count, '1');

    await stopApiChild(apiProcess.child, 'SIGKILL');
    apiProcess = startApiChild(true, true);
    await apiProcess.ready;
    const finalRestore = await postJson(apiProcess, '/v1/sessions/restore', { slotIndex: 3 });
    assert.equal(finalRestore.status, 200);
    assert.equal(finalRestore.body.sessionPhase, periodAck.body.sessionPhase);
    assert.equal(finalRestore.body.snapshotId, periodAck.body.snapshotId);
    assert.deepEqual(finalRestore.body.nextEvent, periodAck.body.nextEvent);
    assert.deepEqual(finalRestore.body.planningOptions, periodAck.body.planningOptions);
    assert.equal(finalRestore.schedulerWindow?.delta, 0);
    assert.equal(finalRestore.schedulerWindow?.total, periodAck.schedulerWindow?.total,
      'restoring the post-ACK decision point preserves it without another Scheduler opportunity');
    assert.equal(finalRestore.randomWindow?.draws.length, 0,
      'restoring the confirmed decision point consumes no game randomness');

    const independentSession = await gameService.createNewSession(db, env, {
      deviceToken: device.deviceToken,
      slotIndex: 3,
      playerName: '第二个受控随机挑战侠',
      gender: 'male',
      sourcePlatform: 'web-browser',
      confirmOverwrite: true,
    });
    const independentGeneratedRng = await gameLifeRngRepo.getLifeRngState(
      db, independentSession.slot.id, independentSession.snapshot.id,
    );
    assert.notEqual(independentGeneratedRng.lifeId, firstGeneratedRng.lifeId,
      'overwriting a slot creates a new life identity instead of reusing the prior stream');
    const independentEventSnapshot = structuredClone(eventSnapshot);
    const independentEventRow = await snapshotRepo.insertSnapshot(db, {
      saveSlotId: independentSession.slot.id,
      sessionId: independentSession.sessionId,
      slotVersion: independentSession.slot.version + 1,
      snapshot: independentEventSnapshot,
      engineVersion: env.engineVersion,
      eventCatalogVersion: env.eventCatalogVersion,
    });
    const independentEventSlot = await saveSlotRepo.updateSlotPointer(
      db,
      independentSession.slot.id,
      independentSession.slot.version,
      independentEventRow.id,
    );
    assert.ok(independentEventSlot, 'the second controlled event Snapshot becomes the slot pointer');
    // Keep the preserved S1d failure-branch assertions deterministic with a distinct life stream.
    const independentRng = await persistFixtureRngState(
      db, independentSession.slot.id, independentSession.snapshot.id, independentEventRow.id, 7,
    );
    await saveFixtureCheckpoint(db, independentSession.slot.id, independentEventRow.id, independentEventSnapshot, {
      protocolVersion: 1,
      state: 'clear',
    });
    assert.notEqual(independentEventRow.id, eventRow.id,
      'the second independent API life starts from a distinct persisted Snapshot');
    assert.deepEqual(independentEventRow.snapshot.state, eventRow.snapshot.state,
      'both independent Snapshots carry identical canonical event and player facts');

    const independentRestore = await postJson(apiProcess, '/v1/sessions/restore', { slotIndex: 3 });
    assert.equal(independentRestore.status, 200);
    assert.notEqual(independentRestore.body.sessionId, eventRestore.body.sessionId,
      'each independent API life receives a distinct server session');
    assert.equal(independentRestore.body.snapshotId, independentEventRow.id);
    assert.equal(independentRestore.body.sessionPhase, 'story_event');
    assert.equal(independentRestore.body.nextEvent?.eventId, eventId);
    assert.ok(independentRestore.body.nextEvent?.choices?.some(
      candidate => candidate.id === choiceId && candidate.available,
    ));
    assert.deepEqual(independentRestore.randomWindow?.draws, [],
      'restoring the second life does not consume its persisted random stream');
    assert.equal(independentRestore.schedulerWindow?.delta, 0);
    assert.equal(independentRestore.schedulerWindow?.total, 0);

    const independentHeadlessRandom = countingRandomFromState(independentRng.randomState);
    const independentHeadless = HeadlessEngineSessionImpl.create(
      { snapshot: structuredClone(independentEventSnapshot) },
      { random: independentHeadlessRandom },
    );
    const independentHeadlessChoice = await independentHeadless.executeChoice({
      requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
      snapshotRef: { snapshot: structuredClone(independentEventSnapshot) },
      action: { eventId, choiceId },
    });
    assert.equal(independentHeadlessChoice.status, 'success');
    const independentExpectedSource = SeededRandomSource.fromState(independentRng.randomState);
    const independentExpectedDraw = independentExpectedSource.next();
    assert.deepEqual(independentHeadlessRandom.draws, [independentExpectedDraw],
      'the second Headless life advances only its own persisted source');
    const independentChoice = await postJson(
      apiProcess,
      `/v1/sessions/${independentRestore.body.sessionId}/choices`,
      {
        expectedSlotVersion: independentRestore.body.slotVersion,
        expectedSnapshotId: independentRestore.body.snapshotId,
        eventId,
        choiceId,
      },
      independentRestore.body.sessionToken,
    );
    assert.equal(independentChoice.status, 200, JSON.stringify(independentChoice.body));
    assert.equal(independentChoice.body.sessionPhase, 'period_summary');
    assert.deepEqual(independentChoice.randomWindow?.draws, [{
      seedLabel: independentRng.randomState.initialSeed,
      value: independentExpectedDraw,
    }], 'the second API life continues from its own persisted draw position');
    assert.equal(independentChoice.schedulerWindow?.delta, 0);
    assert.equal(independentChoice.schedulerWindow?.total, 0);
    const independentFeedback = independentChoice.body.feedback?.player as {
      narrativeResult?: string | null;
    } | undefined;
    const expectedIndependentResult = independentExpectedDraw * 100 < failureRate
      ? choice.challenge.failure.text
      : choice.challenge.success.text;
    assert.equal(independentFeedback?.narrativeResult, expectedIndependentResult,
      'the second life settles the branch selected by its own next random value');
    assert.deepEqual(independentChoice.body.feedback?.player,
      JSON.parse(JSON.stringify(independentHeadlessChoice.feedback.player)));
    assert.deepEqual(independentChoice.body.periodSummary,
      JSON.parse(JSON.stringify(independentHeadless.getProgressionVolatileState().pendingPeriodSummary)));

    const independentChoiceSnapshot = await snapshotRepo.getSnapshotById(db, independentChoice.body.snapshotId);
    assert.ok(independentChoiceSnapshot);
    assert.deepEqual(independentChoiceSnapshot.snapshot.state.player,
      independentHeadlessChoice.nextSnapshot.state.player);
    assert.equal(independentChoiceSnapshot.snapshot.state.player.martialPower, 80);
    assert.deepEqual(independentChoiceSnapshot.snapshot.state.currentTime, eventRow.snapshot.state.currentTime);
    assert.equal(independentChoiceSnapshot.snapshot.state.pendingStoryEventId, undefined);
    assert.equal(independentChoiceSnapshot.snapshot.state.eventHistory
      .filter(record => record.eventId === eventId).length, 1);
    const independentChoiceReplay = await db.query<{
      event_id: string | null;
      choice_id: string | null;
      snapshot_hash_before: string | null;
      snapshot_hash_after: string | null;
    }>(
      `SELECT event_id, choice_id, snapshot_hash_before, snapshot_hash_after FROM replay_actions
        WHERE save_slot_id = $1 AND session_id = $2 AND action_type = 'choice_executed'
          AND event_id = $3 AND choice_id = $4`,
      [independentSession.slot.id, independentRestore.body.sessionId, eventId, choiceId],
    );
    assert.deepEqual(independentChoiceReplay.rows, [{
      event_id: eventId,
      choice_id: choiceId,
      snapshot_hash_before: independentEventRow.content_hash,
      snapshot_hash_after: independentChoiceSnapshot.content_hash,
    }]);

    console.log(`[S1c] ${JSON.stringify({
      snapshotId: eventRow.id,
      eventId,
      choiceId,
      sceneId,
      controlledFixture: true,
      qualification: { age: 35, martialPower: 80, reputation: 20 },
      randomInput: {
        apiChoiceSeed: apiChoice.randomWindow?.draws.map(draw => draw.seedLabel),
        headlessChoiceDraws: headlessRandom.draws,
        apiChoiceDraws: apiChoice.randomWindow?.draws.map(draw => draw.value),
        challengeFailureRate: failureRate,
        selectedBranch: 'failure',
        difficulty: apiChoice.randomWindow?.difficulty,
      },
      choice: {
        phase: apiChoice.body.sessionPhase,
        reputation: [20, choiceSnapshot.snapshot.state.player.reputation],
        martialPower: [80, choiceSnapshot.snapshot.state.player.martialPower],
        feedback: apiChoice.body.feedback?.player,
        periodSummary: apiChoice.body.periodSummary,
        eventHistoryCount: choiceSnapshot.snapshot.state.eventHistory.filter(record => record.eventId === eventId).length,
        replayCount: choiceReplay.rows.length,
        checkpoint: choiceCheckpoint,
        schedulerWindow: apiChoice.schedulerWindow,
      },
      restore: {
        phase: periodRestore.body.sessionPhase,
        snapshotId: periodRestore.body.snapshotId,
        summaryStable: true,
        rngDraws: periodRestore.randomWindow?.draws,
      },
      rejected: [
        { status: duplicateChoice.status, code: duplicateChoice.body.error?.details?.code },
        { status: repeatedAck.status, code: repeatedAck.body.error?.code },
      ],
      acknowledgement: {
        phase: periodAck.body.sessionPhase,
        scheduler: periodAck.schedulerWindow,
        headlessSchedulerCalls: headlessAckSchedulerCalls,
        randomDraws: periodAck.randomWindow?.draws,
        checkpoint: ackCheckpoint,
        replayCount: 1,
        nextEventId: periodAck.body.nextEvent?.eventId ?? null,
      },
      finalRestore: {
        phase: finalRestore.body.sessionPhase,
        scheduler: finalRestore.schedulerWindow,
      },
      randomContext: 'not sent by the HTTP route; API and Headless were matched by seed-1 source and observed draw position',
    })}`);
    console.log(`[S1d] ${JSON.stringify({
      controlledFixture: true,
      apiSessionIds: [eventRestore.body.sessionId, independentRestore.body.sessionId],
      snapshotIds: [eventRow.id, independentEventRow.id],
      sameCanonicalInitialState: true,
      drawWindows: {
        firstSessionRestore: eventRestore.randomWindow?.draws,
        firstSessionChoice: apiChoice.randomWindow?.draws,
        secondSessionRestore: independentRestore.randomWindow?.draws,
        secondSessionChoice: independentChoice.randomWindow?.draws,
      },
      selectedBranches: [
        apiFeedback?.narrativeResult === choice.challenge.failure.text ? 'failure' : 'unexpected',
        independentFeedback?.narrativeResult === choice.challenge.failure.text ? 'failure' : 'unexpected',
      ],
      reputationAfter: [choiceSnapshot.snapshot.state.player.reputation,
        independentChoiceSnapshot.snapshot.state.player.reputation],
      choiceReplayRows: [choiceReplay.rows.length, independentChoiceReplay.rows.length],
      schedulerWindows: [apiChoice.schedulerWindow, independentChoice.schedulerWindow],
    })}`);
  } finally {
    await stopApiChild(apiProcess.child, 'SIGTERM');
  }
}

async function runPassiveNarrativeRestoreScenario(
  db: ReturnType<typeof getPool>,
  env: ReturnType<typeof loadBackendEnv>,
): Promise<void> {
  const device = await bootstrapDevice(db, env);
  const created = await gameService.createNewSession(db, env, {
    deviceToken: device.deviceToken,
    slotIndex: 1,
    playerName: '被动叙事恢复测试侠',
    gender: 'male',
    sourcePlatform: 'web-browser',
  });
  const snapshot = structuredClone(created.snapshot.snapshot);
  snapshot.state.player.age = 3.5;
  snapshot.state.player.alive = true;
  snapshot.state.player.events = [];
  snapshot.state.eventHistory = [];
  snapshot.state.flags = { ...(snapshot.state.flags ?? {}), origin_scholar_family: true };
  delete snapshot.state.pendingStoryEventId;
  const passiveRandom = new SeededRandomSource(812);
  const expectedSelectionRandom = new SeededRandomSource(812);
  const expectedSelectedEntry = selectPassiveNarrative(
    snapshot.state as unknown as GameState,
    () => expectedSelectionRandom.next(),
  );
  const passiveSession = HeadlessEngineSessionImpl.create(
    { snapshot: structuredClone(snapshot) },
    { random: passiveRandom },
  );
  assert.equal(passiveSession.getSessionPhase(), 'passive_progression');
  passiveSession.ensurePassivePresentation();
  const selectedNarrative = passiveSession.getProgressionVolatileState().passiveNarrative;
  assert.ok(selectedNarrative, 'the controlled passive progression has a selected narrative');
  const selectedRuntime = passiveSession.getProgressionVolatileState();
  const selectedPassiveNarrativeId = (selectedRuntime as typeof selectedRuntime & {
    passiveNarrativeId?: string | null;
  }).passiveNarrativeId;
  assert.equal(selectedPassiveNarrativeId, expectedSelectedEntry.id,
    'the selected stable passive ID is captured with its displayed content');
  assert.deepEqual(selectedNarrative, {
    title: expectedSelectedEntry.title,
    text: expectedSelectedEntry.text,
  });
  const selectedRandomState = passiveRandom.exportState();
  assert.deepEqual(selectedRandomState, expectedSelectionRandom.exportState(),
    'the first passive selection and its RNG position are captured together');
  assert.ok(selectedRandomState.drawIndex > 0, 'the passive selection advances its life RNG');

  const snapshotRow = await snapshotRepo.insertSnapshot(db, {
    saveSlotId: created.slot.id,
    sessionId: created.sessionId,
    slotVersion: created.slot.version + 1,
    snapshot,
    engineVersion: env.engineVersion,
    eventCatalogVersion: env.eventCatalogVersion,
  });
  const updatedSlot = await saveSlotRepo.updateSlotPointer(
    db, created.slot.id, created.slot.version, snapshotRow.id,
  );
  assert.ok(updatedSlot, 'the controlled passive Snapshot becomes current');
  const savedRng = await persistFixtureRngState(
    db, created.slot.id, created.snapshot.id, snapshotRow.id, selectedRandomState,
  );
  await progressionCheckpointRepo.saveCheckpoint(
    db,
    created.slot.id,
    snapshotRow.id,
    { protocolVersion: 1, state: 'clear' },
    selectedRuntime,
  );
  const selectedCheckpoint = await db.query<{ runtime_state: Record<string, unknown> }>(
    'SELECT runtime_state FROM save_slot_progression_checkpoints WHERE save_slot_id = $1',
    [created.slot.id],
  );
  assert.equal(selectedCheckpoint.rows[0]?.runtime_state.passiveNarrativeId, expectedSelectedEntry.id,
    'the runtime checkpoint persists the stable passive ID outside the canonical Snapshot');

  let api = startApiChild(true, true);
  try {
    await api.ready;
    const restoreRequest = async (
      apiProcess: ReturnType<typeof startApiChild>,
      requestId: string,
    ) => {
      const response = await fetch(`${await apiProcess.ready}/v1/sessions/restore`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-device-token': device.deviceToken,
          'x-p6b-test-request-id': requestId,
        },
        body: JSON.stringify({ slotIndex: 1 }),
      });
      const body = await response.json() as ApiProgressionResponse;
      const [randomWindow, schedulerWindow] = await Promise.all([
        apiProcess.waitForRandomWindow(requestId),
        apiProcess.waitForSchedulerWindow(requestId),
      ]);
      return { status: response.status, body, randomWindow, schedulerWindow };
    };

    const restored = await restoreRequest(api, 's1-passive-restore');
    assert.equal(restored.status, 200);
    assert.equal(restored.body.sessionPhase, 'passive_progression');
    assert.deepEqual(restored.body.passiveNarrative, selectedNarrative,
      'API restore returns the exact persisted passive selection');
    assert.deepEqual(restored.randomWindow.draws, [], 'API restore does not redraw passive content');
    assert.equal(restored.schedulerWindow.delta, 0, 'passive restore does not evaluate the Scheduler');
    assert.equal(restored.schedulerWindow.total, 0);
    assert.deepEqual(
      (await gameLifeRngRepo.getLifeRngState(db, created.slot.id, snapshotRow.id)).randomState,
      savedRng.randomState,
      'passive restore leaves the persisted life RNG position unchanged',
    );
    const restoredReplay = await db.query<{ payload: { rng?: Record<string, unknown> } }>(
      `SELECT payload FROM replay_actions
        WHERE save_slot_id = $1 AND session_id = $2 AND action_type = 'session_restored'`,
      [created.slot.id, restored.body.sessionId],
    );
    assert.deepEqual(restoredReplay.rows[0]?.payload.rng, {
      lifeId: savedRng.lifeId,
      algorithm: savedRng.randomState.algorithm,
      algorithmVersion: savedRng.randomState.algorithmVersion,
      initialSeed: savedRng.randomState.initialSeed,
      drawIndexBefore: savedRng.randomState.drawIndex,
      drawIndexAfter: savedRng.randomState.drawIndex,
      stateBefore: savedRng.randomState.state,
      stateAfter: savedRng.randomState.state,
    }, 'restore Replay records the unchanged random position');

    const sessionsBeforeMissingPassive = await db.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM game_sessions WHERE save_slot_id = $1', [created.slot.id],
    );
    await db.query(
      `UPDATE save_slot_progression_checkpoints
          SET runtime_state = jsonb_set(
            jsonb_set(runtime_state, '{passiveNarrative}', 'null'::jsonb),
            '{annualPassiveMemory}', 'null'::jsonb
          )
        WHERE save_slot_id = $1`,
      [created.slot.id],
    );
    const missingPassive = await restoreRequest(api, 's1-passive-missing');
    assert.equal(missingPassive.status, 422, 'restore fails closed when the selected passive content is missing');
    assert.equal(missingPassive.body.error?.code, 'PROGRESSION_CHECKPOINT_INVALID');
    assert.deepEqual(missingPassive.randomWindow.draws, [], 'missing passive content is not regenerated');
    assert.equal(missingPassive.schedulerWindow.delta, 0);
    assert.equal(missingPassive.schedulerWindow.total, 0);
    assert.equal((await db.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM game_sessions WHERE save_slot_id = $1', [created.slot.id],
    )).rows[0]?.count, sessionsBeforeMissingPassive.rows[0]?.count,
    'failed passive restore does not create a replacement Session');

    await progressionCheckpointRepo.saveCheckpoint(
      db,
      created.slot.id,
      snapshotRow.id,
      { protocolVersion: 1, state: 'clear' },
      selectedRuntime,
    );
    const slotBeforeInvalidIdentity = await db.query<{ current_snapshot_id: string; version: number }>(
      'SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [created.slot.id],
    );
    const rngBeforeInvalidIdentity = await gameLifeRngRepo.getLifeRngState(
      db, created.slot.id, snapshotRow.id,
    );
    const replayBeforeInvalidIdentity = await db.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM replay_actions WHERE save_slot_id = $1', [created.slot.id],
    );
    const sessionsBeforeInvalidIdentity = await db.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM game_sessions WHERE save_slot_id = $1', [created.slot.id],
    );
    await db.query(
      `UPDATE save_slot_progression_checkpoints
          SET runtime_state = jsonb_set(runtime_state, '{passiveNarrativeId}', to_jsonb($2::text))
        WHERE save_slot_id = $1`,
      [created.slot.id, 'missing-preschool-passive-entry'],
    );
    const invalidIdentityCheckpoint = await db.query<{ runtime_state: Record<string, unknown> }>(
      'SELECT runtime_state FROM save_slot_progression_checkpoints WHERE save_slot_id = $1',
      [created.slot.id],
    );
    const invalidIdentityRestore = await restoreRequest(api, 's1-passive-invalid-id');
    assert.equal(invalidIdentityRestore.status, 422,
      'restore fails closed when the selected passive identity cannot be resolved');
    assert.equal(invalidIdentityRestore.body.error?.code, 'PROGRESSION_CHECKPOINT_INVALID');
    assert.deepEqual(invalidIdentityRestore.randomWindow.draws, []);
    assert.equal(invalidIdentityRestore.schedulerWindow.delta, 0);
    assert.deepEqual(
      await db.query('SELECT current_snapshot_id, version FROM save_slots WHERE id = $1', [created.slot.id]),
      slotBeforeInvalidIdentity,
      'invalid passive identity does not advance Slot CAS or Snapshot pointer',
    );
    assert.deepEqual(
      await gameLifeRngRepo.getLifeRngState(db, created.slot.id, snapshotRow.id),
      rngBeforeInvalidIdentity,
      'invalid passive identity does not advance the persisted RNG position',
    );
    assert.deepEqual(
      await db.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM replay_actions WHERE save_slot_id = $1', [created.slot.id],
      ),
      replayBeforeInvalidIdentity,
      'invalid passive identity creates no Replay record',
    );
    assert.deepEqual(
      await db.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM game_sessions WHERE save_slot_id = $1', [created.slot.id],
      ),
      sessionsBeforeInvalidIdentity,
      'invalid passive identity creates no replacement Session',
    );
    assert.deepEqual(
      (await db.query<{ runtime_state: Record<string, unknown> }>(
        'SELECT runtime_state FROM save_slot_progression_checkpoints WHERE save_slot_id = $1',
        [created.slot.id],
      )).rows,
      invalidIdentityCheckpoint.rows,
      'failed restore leaves the invalid runtime checkpoint unchanged for diagnosis',
    );

    await progressionCheckpointRepo.saveCheckpoint(
      db,
      created.slot.id,
      snapshotRow.id,
      { protocolVersion: 1, state: 'clear' },
      selectedRuntime,
    );
    const restoredForConfirmation = await restoreRequest(api, 's1-passive-restore-before-ack');
    assert.equal(restoredForConfirmation.status, 200);
    assert.deepEqual(restoredForConfirmation.body.passiveNarrative, selectedNarrative);
    assert.equal(restoredForConfirmation.body.snapshotId, snapshotRow.id);
    assert.deepEqual(restoredForConfirmation.randomWindow.draws, []);

    await stopApiChild(api.child, 'SIGTERM');
    api = startApiChild(true, true);
    const apiUrlAfterRestart = await api.ready;
    const ackRequestId = 's1-passive-continue-after-restart';
    const acknowledgementResponse = await fetch(
      `${apiUrlAfterRestart}/v1/sessions/${restoredForConfirmation.body.sessionId}/progression-ack`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-device-token': device.deviceToken,
          'x-session-token': restoredForConfirmation.body.sessionToken!,
          'x-p6b-test-request-id': ackRequestId,
        },
        body: JSON.stringify({
          expectedSlotVersion: restoredForConfirmation.body.slotVersion,
          expectedSnapshotId: restoredForConfirmation.body.snapshotId,
          ackKind: 'passive_continue',
        }),
      },
    );
    const acknowledgement = await acknowledgementResponse.json() as ApiProgressionResponse;
    const [ackRandomWindow, ackSchedulerWindow] = await Promise.all([
      api.waitForRandomWindow(ackRequestId),
      api.waitForSchedulerWindow(ackRequestId),
    ]);
    assert.equal(acknowledgementResponse.status, 200, JSON.stringify(acknowledgement));
    assert.equal(acknowledgement.sessionPhase, 'period_summary');
    assert.deepEqual(ackRandomWindow.draws, [],
      'passive_continue uses the persisted entry without reselecting or consuming another draw');
    assert.equal(ackSchedulerWindow.delta, 0);
    const periodSummary = acknowledgement.periodSummary as { headline: string; body: string };
    assert.equal(periodSummary.headline, expectedSelectedEntry.title);
    assert.equal(periodSummary.body, expectedSelectedEntry.text);
    const confirmedSnapshot = await snapshotRepo.getSnapshotById(db, acknowledgement.snapshotId);
    assert.ok(confirmedSnapshot);
    assert.equal(
      confirmedSnapshot.snapshot.state.eventHistory[
        confirmedSnapshot.snapshot.state.eventHistory.length - 1
      ]?.eventId,
      expectedSelectedEntry.id,
      'the confirmed Snapshot records the same stable passive identity that was displayed');
    const confirmedRng = await gameLifeRngRepo.getLifeRngState(
      db, created.slot.id, confirmedSnapshot.id,
    );
    assert.equal(confirmedRng.lifeId, savedRng.lifeId);
    assert.deepEqual(confirmedRng.randomState, selectedRandomState,
      'confirmation persists the unchanged RNG state alongside its Snapshot');
    const passiveAckReplay = await db.query<{
      payload: { rng?: Record<string, unknown> };
      snapshot_hash_before: string;
      snapshot_hash_after: string;
    }>(
      `SELECT payload, snapshot_hash_before, snapshot_hash_after FROM replay_actions
        WHERE save_slot_id = $1 AND session_id = $2 AND action_type = 'progression_ack'
          AND payload->>'ackKind' = 'passive_continue'`,
      [created.slot.id, restoredForConfirmation.body.sessionId],
    );
    assert.equal(passiveAckReplay.rows.length, 1);
    assert.equal(passiveAckReplay.rows[0]?.snapshot_hash_before, snapshotRow.content_hash);
    assert.equal(passiveAckReplay.rows[0]?.snapshot_hash_after, confirmedSnapshot.content_hash);
    assert.equal(passiveAckReplay.rows[0]?.payload.rng?.drawIndexBefore, selectedRandomState.drawIndex);
    assert.equal(passiveAckReplay.rows[0]?.payload.rng?.drawIndexAfter, selectedRandomState.drawIndex);
  } finally {
    await stopApiChild(api.child, 'SIGTERM');
  }
}

async function runConcurrentLifeChoiceScenario(
  db: ReturnType<typeof getPool>,
  env: ReturnType<typeof loadBackendEnv>,
): Promise<void> {
  const eventId = 'jianghu_challenge';
  const choiceId = 'accept_challenge';
  const deviceA = await bootstrapDevice(db, env);
  const deviceB = await bootstrapDevice(db, env);
  const [createdA, createdB] = await Promise.all([
    gameService.createNewSession(db, env, {
      deviceToken: deviceA.deviceToken,
      slotIndex: 1,
      playerName: '并发随机人生甲',
      gender: 'male',
      sourcePlatform: 'web-browser',
    }),
    gameService.createNewSession(db, env, {
      deviceToken: deviceB.deviceToken,
      slotIndex: 1,
      playerName: '并发随机人生乙',
      gender: 'male',
      sourcePlatform: 'web-browser',
    }),
  ]);
  const fixture = HeadlessEngineSessionImpl.create({
    playerName: '并发随机受控挑战侠',
    gender: 'male',
    catalogVersion: env.eventCatalogVersion,
    randomSeed: 1,
  }, { random: new SeededRandomSource(1) });
  const template = fixture.serialize();
  template.state.player.age = 35;
  template.state.player.alive = true;
  template.state.player.martialPower = 80;
  template.state.player.reputation = 20;
  template.state.player.chivalry = 30;
  template.state.player.traits = [];
  template.state.player.events = [];
  template.state.eventHistory = [];
  template.state.actionHistory = [];
  template.state.pendingStoryEventId = eventId;
  template.metadata.sourcePlatform = 'web-browser';
  template.metadata.engineVersion = env.engineVersion;
  template.metadata.eventCatalogVersion = env.eventCatalogVersion;

  const prepareLife = async (
    created: Awaited<ReturnType<typeof gameService.createNewSession>>,
    seed: number,
  ) => {
    const snapshot = structuredClone(template);
    const snapshotRow = await snapshotRepo.insertSnapshot(db, {
      saveSlotId: created.slot.id,
      sessionId: created.sessionId,
      slotVersion: created.slot.version + 1,
      snapshot,
      engineVersion: env.engineVersion,
      eventCatalogVersion: env.eventCatalogVersion,
    });
    const slot = await saveSlotRepo.updateSlotPointer(
      db, created.slot.id, created.slot.version, snapshotRow.id,
    );
    assert.ok(slot);
    const rng = await persistFixtureRngState(
      db, created.slot.id, created.snapshot.id, snapshotRow.id, seed,
    );
    await saveFixtureCheckpoint(db, created.slot.id, snapshotRow.id, snapshot, {
      protocolVersion: 1,
      state: 'clear',
    });
    return { snapshot, snapshotRow, slot, rng };
  };
  const [lifeA, lifeB] = await Promise.all([
    prepareLife(createdA, 1),
    prepareLife(createdB, 7),
  ]);
  assert.notEqual(lifeA.rng.lifeId, lifeB.rng.lifeId,
    'concurrent operations belong to distinct persisted life identities');
  assert.deepEqual(lifeA.snapshot.state, lifeB.snapshot.state,
    'both lives execute the same legal Challenge against identical canonical input');

  const api = startApiChild(true, true);
  try {
    const apiUrl = await api.ready;
    let requestIndex = 0;
    const postJson = async (
      deviceToken: string,
      path: string,
      body: unknown,
      sessionToken?: string,
    ) => {
      const requestId = `s1-concurrent-${++requestIndex}`;
      const response = await fetch(`${apiUrl}${path}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-device-token': deviceToken,
          'x-p6b-test-request-id': requestId,
          ...(sessionToken ? { 'x-session-token': sessionToken } : {}),
        },
        body: JSON.stringify(body),
      });
      const result = await response.json() as ApiProgressionResponse;
      const [randomWindow, schedulerWindow] = await Promise.all([
        api.waitForRandomWindow(requestId),
        api.waitForSchedulerWindow(requestId),
      ]);
      return { status: response.status, body: result, randomWindow, schedulerWindow };
    };

    const [restoredA, restoredB] = await Promise.all([
      postJson(deviceA.deviceToken, '/v1/sessions/restore', { slotIndex: 1 }),
      postJson(deviceB.deviceToken, '/v1/sessions/restore', { slotIndex: 1 }),
    ]);
    assert.equal(restoredA.status, 200);
    assert.equal(restoredB.status, 200);
    assert.deepEqual(restoredA.randomWindow.draws, []);
    assert.deepEqual(restoredB.randomWindow.draws, []);
    assert.equal(restoredA.body.nextEvent?.eventId, eventId);
    assert.equal(restoredB.body.nextEvent?.eventId, eventId);

    const headlessRandomA = countingRandomFromState(lifeA.rng.randomState);
    const headlessRandomB = countingRandomFromState(lifeB.rng.randomState);
    const serialA = HeadlessEngineSessionImpl.create(
      { snapshot: structuredClone(lifeA.snapshot) }, { random: headlessRandomA },
    );
    const serialB = HeadlessEngineSessionImpl.create(
      { snapshot: structuredClone(lifeB.snapshot) }, { random: headlessRandomB },
    );
    const serialResultA = await serialA.executeChoice({
      requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
      snapshotRef: { snapshot: structuredClone(lifeA.snapshot) },
      action: { eventId, choiceId },
    });
    const serialResultB = await serialB.executeChoice({
      requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
      snapshotRef: { snapshot: structuredClone(lifeB.snapshot) },
      action: { eventId, choiceId },
    });
    assert.equal(serialResultA.status, 'success');
    assert.equal(serialResultB.status, 'success');
    const expectedDrawA = headlessRandomA.draws[0];
    const expectedDrawB = headlessRandomB.draws[0];
    assert.notEqual(expectedDrawA, expectedDrawB,
      'controlled serial inputs differ so a cross-life stream swap is observable');

    const [choiceA, choiceB] = await Promise.all([
      postJson(deviceA.deviceToken, `/v1/sessions/${restoredA.body.sessionId}/choices`, {
        expectedSlotVersion: restoredA.body.slotVersion,
        expectedSnapshotId: restoredA.body.snapshotId,
        eventId,
        choiceId,
      }, restoredA.body.sessionToken),
      postJson(deviceB.deviceToken, `/v1/sessions/${restoredB.body.sessionId}/choices`, {
        expectedSlotVersion: restoredB.body.slotVersion,
        expectedSnapshotId: restoredB.body.snapshotId,
        eventId,
        choiceId,
      }, restoredB.body.sessionToken),
    ]);
    assert.equal(choiceA.status, 200, JSON.stringify(choiceA.body));
    assert.equal(choiceB.status, 200, JSON.stringify(choiceB.body));
    assert.deepEqual(choiceA.randomWindow.draws, [{
      seedLabel: lifeA.rng.randomState.initialSeed,
      value: expectedDrawA,
    }], 'API life A consumes only its own controlled serial draw');
    assert.deepEqual(choiceB.randomWindow.draws, [{
      seedLabel: lifeB.rng.randomState.initialSeed,
      value: expectedDrawB,
    }], 'API life B consumes only its own controlled serial draw');
    assert.deepEqual(choiceA.body.feedback?.player, JSON.parse(JSON.stringify(serialResultA.feedback.player)));
    assert.deepEqual(choiceB.body.feedback?.player, JSON.parse(JSON.stringify(serialResultB.feedback.player)));
    assert.equal(choiceA.schedulerWindow.delta, 0);
    assert.equal(choiceB.schedulerWindow.delta, 0);

    const [snapshotA, snapshotB] = await Promise.all([
      snapshotRepo.getSnapshotById(db, choiceA.body.snapshotId),
      snapshotRepo.getSnapshotById(db, choiceB.body.snapshotId),
    ]);
    assert.ok(snapshotA);
    assert.ok(snapshotB);
    const [rngAfterA, rngAfterB] = await Promise.all([
      gameLifeRngRepo.getLifeRngState(db, createdA.slot.id, snapshotA.id),
      gameLifeRngRepo.getLifeRngState(db, createdB.slot.id, snapshotB.id),
    ]);
    assert.equal(rngAfterA.lifeId, lifeA.rng.lifeId);
    assert.equal(rngAfterB.lifeId, lifeB.rng.lifeId);
    assert.deepEqual(rngAfterA.randomState, headlessRandomA.exportState());
    assert.deepEqual(rngAfterB.randomState, headlessRandomB.exportState());
    assert.equal(rngAfterA.randomState.drawIndex, lifeA.rng.randomState.drawIndex + 1);
    assert.equal(rngAfterB.randomState.drawIndex, lifeB.rng.randomState.drawIndex + 1);
    const [replayA, replayB] = await Promise.all([
      db.query<{ payload: { rng?: Record<string, unknown> } }>(
        `SELECT payload FROM replay_actions WHERE save_slot_id = $1 AND session_id = $2
          AND action_type = 'choice_executed'`, [createdA.slot.id, restoredA.body.sessionId],
      ),
      db.query<{ payload: { rng?: Record<string, unknown> } }>(
        `SELECT payload FROM replay_actions WHERE save_slot_id = $1 AND session_id = $2
          AND action_type = 'choice_executed'`, [createdB.slot.id, restoredB.body.sessionId],
      ),
    ]);
    assert.equal(replayA.rows[0]?.payload.rng?.lifeId, lifeA.rng.lifeId);
    assert.equal(replayB.rows[0]?.payload.rng?.lifeId, lifeB.rng.lifeId);
    assert.equal(replayA.rows[0]?.payload.rng?.drawIndexBefore, lifeA.rng.randomState.drawIndex);
    assert.equal(replayA.rows[0]?.payload.rng?.drawIndexAfter, lifeA.rng.randomState.drawIndex + 1);
    assert.equal(replayB.rows[0]?.payload.rng?.drawIndexBefore, lifeB.rng.randomState.drawIndex);
    assert.equal(replayB.rows[0]?.payload.rng?.drawIndexAfter, lifeB.rng.randomState.drawIndex + 1);
    console.log(`[S1f-concurrent] ${JSON.stringify({
      independentLifeIds: [lifeA.rng.lifeId, lifeB.rng.lifeId],
      concurrentApiChoiceDraws: [choiceA.randomWindow.draws, choiceB.randomWindow.draws],
      controlledSerialDraws: [expectedDrawA, expectedDrawB],
      outcomesMatchSerial: true,
      persistedDrawIndices: [rngAfterA.randomState.drawIndex, rngAfterB.randomState.drawIndex],
    })}`);
  } finally {
    await stopApiChild(api.child, 'SIGTERM');
  }
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
    game_life_rng_states: schemaName,
  }, 'all fixture tables must be namespaced to the isolated schema');
  await seedActiveCatalog(env);
  const device = await bootstrapDevice(db, env);
  await runS1HeadlessApiActionParityScenario(db, env, device);
  await runS1cRandomChoiceParityScenario(db, env, device);
  await runPassiveNarrativeRestoreScenario(db, env);
  await runConcurrentLifeChoiceScenario(db, env);
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
  await persistFixtureRngState(db, created.slot.id, created.snapshot.id, planningSnapshot.id);
  await saveFixtureCheckpoint(db, created.slot.id, planningSnapshot.id, snapshot, {
    protocolVersion: 1,
    state: 'clear',
  });
  // Use a controlled Headless producer so the checkpoint and canonical action history
  // come from a real executeActiveAction result, rather than a hand-written DTO.
  // This verifies persistence/restoration of the combined phase, not random occurrence frequency.
  let actionProducer: HeadlessEngineSessionImpl | undefined;
  let actionProducerRandom: SeededRandomSource | undefined;
  let attachedDisturbance: ReturnType<HeadlessEngineSessionImpl['getProgressionVolatileState']>['pendingDisturbanceNarrative'] = null;
  for (let seed = 1; seed <= 100; seed += 1) {
    const random = new SeededRandomSource(seed);
    const producer = HeadlessEngineSessionImpl.create(
      { snapshot: structuredClone(snapshot) },
      { random },
    );
    await producer.executeActiveAction('action_training_basic');
    const volatile = producer.getProgressionVolatileState();
    if (volatile.pendingActionSummary && volatile.pendingDisturbanceNarrative) {
      actionProducer = producer;
      actionProducerRandom = random;
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
    const originRng = await gameLifeRngRepo.getLifeRngState(writerClient, created.slot.id, created.snapshot.id);
    await gameLifeRngRepo.saveLifeRngState(writerClient, {
      slotId: created.slot.id,
      snapshotId: actionRow.id,
      lifeId: originRng.lifeId,
      randomState: actionProducerRandom.exportState(),
    });
    const actionSlot = await saveSlotRepo.updateSlotPointer(writerClient, created.slot.id, planningSlot.version, actionRow.id);
    assert.ok(actionSlot, 'controlled action snapshot becomes current');
    await progressionCheckpointRepo.saveCheckpoint(
      writerClient,
      created.slot.id,
      actionRow.id,
      buildCheckpoint(producerVolatile, false),
      producerVolatile,
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
    await persistFixtureRngState(
      db, periodBase.slot.id, periodBase.snapshot.id, periodFixtureRow.id,
    );
    const periodFixtureSlot = await saveSlotRepo.updateSlotPointer(
      db, periodBase.slot.id, periodBase.slot.version, periodFixtureRow.id,
    );
    assert.ok(periodFixtureSlot);
    await saveFixtureCheckpoint(db, periodBase.slot.id, periodFixtureRow.id, periodFixture, {
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
