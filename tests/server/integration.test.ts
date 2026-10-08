import { runMigrations } from '../../server/src/db/migrate.js';
import { getPool, closePool } from '../../server/src/db/pool.js';
import { loadBackendEnv } from '../../server/src/config/env.js';
import { bootstrapDevice } from '../../server/src/services/deviceService.js';
import * as gameService from '../../server/src/services/gameService.js';
import { seedActiveCatalog } from '../../server/src/http/router.js';
import * as saveSlotRepo from '../../server/src/repositories/saveSlotRepository.js';
import * as snapshotRepo from '../../server/src/repositories/snapshotRepository.js';
import { hashToken } from '../../server/src/crypto/tokens.js';
import { ApiError } from '../../server/src/errors/apiError.js';
import type { SessionProgressionPayload } from '../../src/contracts/sessionProgression.js';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

type Progression = SessionProgressionPayload & {
  sessionId?: string;
  sessionToken?: string;
  slot?: { version: number };
  snapshot?: { id: string };
};

async function advanceToActivePlanning(
  db: Awaited<ReturnType<typeof getPool>>,
  env: ReturnType<typeof loadBackendEnv>,
  deviceToken: string,
  start: Progression & { sessionId: string; sessionToken: string },
): Promise<Progression & { sessionId: string; sessionToken: string }> {
  let current = start;
  for (let i = 0; i < 20; i += 1) {
    if (current.sessionPhase === 'active_planning') return current;
    if (current.sessionPhase !== 'story_event' || !current.nextEvent?.choices?.length) break;
    const choiceId = current.nextEvent.choices.find(c => c.available)?.id ?? current.nextEvent.choices[0]!.id;
    const result = await gameService.executeChoice(db, env, {
      deviceToken,
      sessionId: current.sessionId,
      sessionToken: current.sessionToken,
      expectedSlotVersion: current.slotVersion,
      expectedSnapshotId: current.snapshotId,
      eventId: current.nextEvent.eventId,
      choiceId,
    });
    current = {
      ...result,
      sessionId: current.sessionId,
      sessionToken: current.sessionToken,
    };
  }
  return current;
}

export async function runP6bIntegrationTests(databaseUrl: string): Promise<void> {
  process.env.DATABASE_URL = databaseUrl;
  process.env.TOKEN_HASH_SECRET = 'integration-test-secret-1234';
  process.env.ENGINE_VERSION = 'p6b-headless';
  process.env.EVENT_CATALOG_VERSION = '1.0.0';
  process.env.NODE_ENV = 'test';

  const env = loadBackendEnv();
  await runMigrations(databaseUrl);
  await seedActiveCatalog(env);
  const db = getPool(databaseUrl);

  const boot1 = await bootstrapDevice(db, env);
  const boot2 = await bootstrapDevice(db, env, boot1.deviceToken);
  assert(boot1.deviceId === boot2.deviceId, 'device token is stable');

  const slots = await gameService.listSaves(db, env, boot1.deviceToken);
  assert(slots.length === 3, 'three slots');

  const created = await gameService.createNewSession(db, env, {
    deviceToken: boot1.deviceToken,
    slotIndex: 1,
    playerName: '集成侠客',
    gender: 'male',
    sourcePlatform: 'web-browser',
  });
  assert(created.sessionToken.length > 10, 'session token issued');
  assert(created.snapshot.id.length > 0, 'snapshot persisted');
  assert(created.sessionPhase === 'story_event' || created.sessionPhase === 'active_planning', 'create has sessionPhase');
  if (created.sessionPhase === 'active_planning') {
    assert(created.planningOptions.length >= 1, 'planning options when active_planning');
  }

  const listed = await gameService.listSaves(db, env, boot1.deviceToken);
  assert(listed[0]?.occupied === true, 'slot 1 occupied');

  try {
    await gameService.createNewSession(db, env, {
      deviceToken: boot1.deviceToken,
      slotIndex: 1,
      playerName: '覆盖',
      gender: 'male',
      sourcePlatform: 'web-browser',
    });
    throw new Error('expected overwrite conflict');
  } catch (error) {
    assert((error as { code?: string }).code === 'SLOT_OVERWRITE_REQUIRED', 'overwrite guard');
  }

  const restored = await gameService.restoreSession(db, env, {
    deviceToken: boot1.deviceToken,
    slotIndex: 1,
  });
  assert(restored.sessionId !== created.sessionId, 'new session on restore');
  assert(restored.sessionPhase.length > 0, 'restore has sessionPhase');

  const planningBase = await gameService.createNewSession(db, env, {
    deviceToken: boot1.deviceToken,
    slotIndex: 2,
    playerName: '规划存档',
    gender: 'male',
    sourcePlatform: 'web-browser',
  });
  const planningSnapshot = structuredClone(planningBase.snapshot.snapshot);
  planningSnapshot.state.player.age = 16;
  planningSnapshot.state.player.alive = true;
  planningSnapshot.state.player.connections = 5;
  planningSnapshot.state.player.affiliation = null;
  planningSnapshot.state.player.events = [];
  planningSnapshot.state.eventHistory = [];
  delete planningSnapshot.state.pendingStoryEventId;
  const planningSnapRow = await snapshotRepo.insertSnapshot(db, {
    saveSlotId: planningBase.slot.id,
    sessionId: planningBase.sessionId,
    slotVersion: planningBase.slot.version + 1,
    snapshot: planningSnapshot,
    engineVersion: env.engineVersion,
    eventCatalogVersion: env.eventCatalogVersion,
  });
  const planningSlot = await saveSlotRepo.updateSlotPointer(
    db,
    planningBase.slot.id,
    planningBase.slot.version,
    planningSnapRow.id,
  );
  assert(planningSlot !== null, 'age-16 planning snapshot becomes current');
  const restoredPlanning = await gameService.restoreSession(db, env, {
    deviceToken: boot1.deviceToken,
    slotIndex: 2,
  });
  assert(restoredPlanning.sessionPhase === 'active_planning', 'restore preserves age-16 planning');
  assert(restoredPlanning.planningOptions.length === 5, 'restored save retains all five planning options');
  assert(restoredPlanning.nextEvent === null, 'restore does not prefetch an ordinary event');
  const repeatedPlanningRestore = await gameService.restoreSession(db, env, {
    deviceToken: boot1.deviceToken,
    slotIndex: 2,
  });
  assert(repeatedPlanningRestore.sessionPhase === 'active_planning', 'repeated restore preserves planning');
  assert(repeatedPlanningRestore.snapshotId === restoredPlanning.snapshotId, 'repeated restore uses same snapshot');
  assert(repeatedPlanningRestore.nextEvent === null, 'repeated restore does not draw another event');

  const age16Action = await gameService.executeActiveAction(db, env, {
    deviceToken: boot1.deviceToken,
    sessionId: restoredPlanning.sessionId,
    sessionToken: restoredPlanning.sessionToken,
    expectedSlotVersion: restoredPlanning.slotVersion,
    expectedSnapshotId: restoredPlanning.snapshotId,
    actionId: 'action_training_basic',
  });
  assert(age16Action.sessionPhase === 'action_summary', 'API age-16 action reaches its result decision point');
  const age16ActionSnapshot = await snapshotRepo.getSnapshotById(db, age16Action.snapshotId);
  if (!age16ActionSnapshot) throw new Error('API age-16 action snapshot is persisted');
  assert(
    (age16ActionSnapshot.snapshot.state.actionHistory ?? []).some(
      entry => entry.sourceKind === 'active_action' && entry.actionId === 'action_training_basic',
    ),
    'API age-16 action is written to History before scheduling',
  );
  assert(
    JSON.stringify(age16ActionSnapshot.snapshot.state.currentTime) !==
      JSON.stringify(planningSnapshot.state.currentTime),
    'API age-16 action advances time before its result is acknowledged',
  );
  const restoredAge16Summary = await gameService.restoreSession(db, env, {
    deviceToken: boot1.deviceToken,
    slotIndex: 2,
  });
  assert(restoredAge16Summary.sessionPhase === 'action_summary', 'API restore preserves the pending action result');
  assert(restoredAge16Summary.snapshotId === age16Action.snapshotId, 'action-result restore retains the same snapshot');
  const repeatedAge16SummaryRestore = await gameService.restoreSession(db, env, {
    deviceToken: boot1.deviceToken,
    slotIndex: 2,
  });
  assert(
    repeatedAge16SummaryRestore.sessionPhase === 'action_summary' &&
      repeatedAge16SummaryRestore.snapshotId === restoredAge16Summary.snapshotId,
    'repeated API restore preserves the same unconfirmed result without advancing it',
  );
  let age16Acknowledged = await gameService.acknowledgeProgression(db, env, {
    deviceToken: boot1.deviceToken,
    sessionId: repeatedAge16SummaryRestore.sessionId,
    sessionToken: repeatedAge16SummaryRestore.sessionToken,
    expectedSlotVersion: repeatedAge16SummaryRestore.slotVersion,
    expectedSnapshotId: repeatedAge16SummaryRestore.snapshotId,
    ackKind: 'action_summary',
  });
  if (age16Acknowledged.sessionPhase === 'disturbance_narrative') {
    age16Acknowledged = await gameService.acknowledgeProgression(db, env, {
      deviceToken: boot1.deviceToken,
      sessionId: repeatedAge16SummaryRestore.sessionId,
      sessionToken: repeatedAge16SummaryRestore.sessionToken,
      expectedSlotVersion: age16Acknowledged.slotVersion,
      expectedSnapshotId: age16Acknowledged.snapshotId,
      ackKind: 'disturbance',
    });
  }
  assert(
    age16Acknowledged.sessionPhase === 'active_planning' || age16Acknowledged.sessionPhase === 'story_event',
    'API acknowledges action and interruption results before returning planning or a selected event',
  );

  const pendingEventBase = await gameService.createNewSession(db, env, {
    deviceToken: boot1.deviceToken,
    slotIndex: 3,
    playerName: '待处理事件存档',
    gender: 'male',
    sourcePlatform: 'web-browser',
  });
  const pendingEventSnapshot = structuredClone(pendingEventBase.snapshot.snapshot);
  pendingEventSnapshot.state.player.age = 16;
  pendingEventSnapshot.state.player.alive = true;
  pendingEventSnapshot.state.player.connections = 5;
  pendingEventSnapshot.state.player.affiliation = null;
  pendingEventSnapshot.state.player.events = [];
  pendingEventSnapshot.state.eventHistory = [];
  pendingEventSnapshot.state.pendingStoryEventId = 'mingyue_market_meet';
  const pendingEventSnapRow = await snapshotRepo.insertSnapshot(db, {
    saveSlotId: pendingEventBase.slot.id,
    sessionId: pendingEventBase.sessionId,
    slotVersion: pendingEventBase.slot.version + 1,
    snapshot: pendingEventSnapshot,
    engineVersion: env.engineVersion,
    eventCatalogVersion: env.eventCatalogVersion,
  });
  const pendingEventSlot = await saveSlotRepo.updateSlotPointer(
    db,
    pendingEventBase.slot.id,
    pendingEventBase.slot.version,
    pendingEventSnapRow.id,
  );
  assert(pendingEventSlot !== null, 'pending-event snapshot becomes current');
  const restoredPendingEvent = await gameService.restoreSession(db, env, {
    deviceToken: boot1.deviceToken,
    slotIndex: 3,
  });
  assert(restoredPendingEvent.sessionPhase === 'story_event', 'restore resumes the pending event phase');
  assert(
    restoredPendingEvent.nextEvent?.eventId === 'mingyue_market_meet',
    'restore retains the selected formal event',
  );
  const repeatedPendingEventRestore = await gameService.restoreSession(db, env, {
    deviceToken: boot1.deviceToken,
    slotIndex: 3,
  });
  assert(
    repeatedPendingEventRestore.nextEvent?.eventId === 'mingyue_market_meet',
    'repeated restore retains the same pending event',
  );

  let progressionCursor: Progression & { sessionId: string; sessionToken: string } = {
    ...created,
    sessionId: created.sessionId,
    sessionToken: created.sessionToken,
    slotVersion: created.slotVersion,
    snapshotId: created.snapshotId,
  };

  const next = created.nextEvent;
  if (next && next.choices && next.choices.length > 0) {
    const choiceId = next.choices.find(c => c.available)?.id ?? next.choices[0]!.id;
    const choiceResult = await gameService.executeChoice(db, env, {
      deviceToken: boot1.deviceToken,
      sessionId: created.sessionId,
      sessionToken: created.sessionToken,
      expectedSlotVersion: created.slotVersion,
      expectedSnapshotId: created.snapshotId,
      eventId: next.eventId,
      choiceId,
    });
    assert(choiceResult.slot.version > created.slot.version, 'slot version increments');
    assert(choiceResult.sessionPhase.length > 0, 'choice returns sessionPhase');
    progressionCursor = {
      ...choiceResult,
      sessionId: created.sessionId,
      sessionToken: created.sessionToken,
      slotVersion: choiceResult.slotVersion,
      snapshotId: choiceResult.snapshotId,
    };
  }

  const planning = await advanceToActivePlanning(db, env, boot1.deviceToken, progressionCursor);

  if (planning.sessionPhase === 'active_planning' && planning.planningOptions.length > 0) {
    const actionId = planning.planningOptions[0]!.actionId;

    try {
      await gameService.executeActiveAction(db, env, {
        deviceToken: boot1.deviceToken,
        sessionId: planning.sessionId,
        sessionToken: planning.sessionToken,
        expectedSlotVersion: planning.slotVersion,
        expectedSnapshotId: planning.snapshotId,
        actionId: 'not_a_real_action',
      });
      throw new Error('expected INVALID_ACTION');
    } catch (error) {
      assert((error as ApiError).details?.code === 'INVALID_ACTION', 'unknown action rejected');
    }

    const actionResult = await gameService.executeActiveAction(db, env, {
      deviceToken: boot1.deviceToken,
      sessionId: planning.sessionId,
      sessionToken: planning.sessionToken,
      expectedSlotVersion: planning.slotVersion,
      expectedSnapshotId: planning.snapshotId,
      actionId,
    });
    assert(actionResult.sessionPhase === 'action_summary', 'active-action → action_summary');
    assert(actionResult.activeActionSummary !== null, 'summary present');
    assert(actionResult.slotVersion > planning.slotVersion, 'slot version increments on action');
    assert(actionResult.snapshotId !== planning.snapshotId, 'snapshot id changes');

    const restoredMidSummary = await gameService.restoreSession(db, env, {
      deviceToken: boot1.deviceToken,
      slotIndex: 1,
    });
    assert(restoredMidSummary.sessionId !== planning.sessionId, 'restore issues new session');
    assert(restoredMidSummary.sessionPhase === 'action_summary', 'restore preserves action_summary volatile');
    assert(restoredMidSummary.activeActionSummary !== null, 'restore returns pending summary');

    try {
      await gameService.executeActiveAction(db, env, {
        deviceToken: boot1.deviceToken,
        sessionId: planning.sessionId,
        sessionToken: planning.sessionToken,
        expectedSlotVersion: actionResult.slotVersion,
        expectedSnapshotId: actionResult.snapshotId,
        actionId,
      });
      throw new Error('expected INVALID_SESSION_PHASE');
    } catch (error) {
      assert((error as ApiError).details?.code === 'INVALID_SESSION_PHASE', 'wrong phase rejected');
    }

    const ackResult = await gameService.acknowledgeProgression(db, env, {
      deviceToken: boot1.deviceToken,
      sessionId: planning.sessionId,
      sessionToken: planning.sessionToken,
      expectedSlotVersion: actionResult.slotVersion,
      expectedSnapshotId: actionResult.snapshotId,
      ackKind: 'action_summary',
    });
    assert(
      ackResult.sessionPhase === 'active_planning' ||
        ackResult.sessionPhase === 'disturbance_narrative' ||
        ackResult.sessionPhase === 'story_event',
      'summary ack returns forward phase',
    );
    let latest = ackResult;
    if (ackResult.sessionPhase === 'disturbance_narrative') {
      latest = await gameService.acknowledgeProgression(db, env, {
        deviceToken: boot1.deviceToken,
        sessionId: planning.sessionId,
        sessionToken: planning.sessionToken,
        expectedSlotVersion: ackResult.slotVersion,
        expectedSnapshotId: ackResult.snapshotId,
        ackKind: 'disturbance',
      });
      assert(
        latest.sessionPhase === 'active_planning' || latest.sessionPhase === 'story_event',
        'disturbance ack returns planning or story',
      );
    }

    if (
      latest.sessionPhase === 'story_event' &&
      latest.nextEvent?.isAutomatic &&
      (!latest.nextEvent.choices || latest.nextEvent.choices.length === 0)
    ) {
      latest = await gameService.acknowledgeProgression(db, env, {
        deviceToken: boot1.deviceToken,
        sessionId: planning.sessionId,
        sessionToken: planning.sessionToken,
        expectedSlotVersion: latest.slotVersion,
        expectedSnapshotId: latest.snapshotId,
        ackKind: 'story_automatic',
      });
      assert(
        latest.sessionPhase === 'active_planning' ||
          latest.sessionPhase === 'story_event' ||
          latest.sessionPhase === 'terminal',
        'story_automatic ack advances past automatic narrative',
      );
    }

    try {
      await gameService.executeActiveAction(db, env, {
        deviceToken: boot1.deviceToken,
        sessionId: planning.sessionId,
        sessionToken: planning.sessionToken,
        expectedSlotVersion: latest.slotVersion,
        expectedSnapshotId: 'stale-snapshot-id',
        actionId,
      });
      throw new Error('expected STALE_SNAPSHOT');
    } catch (error) {
      assert((error as ApiError).code === 'STALE_SNAPSHOT', 'stale snapshot 409');
    }
  }

  const badHash = hashToken('invalid-token', env.tokenHashSecret);
  const badDevice = await db.query('SELECT id FROM anonymous_devices WHERE token_hash = $1', [badHash]);
  assert(badDevice.rowCount === 0, 'invalid token not stored');
  try {
    await bootstrapDevice(db, env, 'totally-invalid-token');
    throw new Error('expected unauthorized');
  } catch (error) {
    assert(error instanceof ApiError, 'reject bad token with ApiError');
  }

  await closePool();
}
