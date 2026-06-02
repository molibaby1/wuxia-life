import type { GameStateSnapshot } from '../../../src/contracts/gameStateSnapshot.js';
import type { BackendEnv } from '../config/env.js';
import type { Queryable } from '../db/pool.js';
import { withTransaction } from '../db/transaction.js';
import { conflict, notFound, validationError } from '../errors/apiError.js';
import * as saveSlotRepo from '../repositories/saveSlotRepository.js';
import * as snapshotRepo from '../repositories/snapshotRepository.js';
import * as sessionRepo from '../repositories/sessionRepository.js';
import * as replayRepo from '../repositories/replayRepository.js';
import {
  buildChoiceRequest,
  createHeadlessSessionFromNewGame,
  createHeadlessSessionFromSnapshot,
  deriveNextEvent,
  executeChoiceOnSession,
  progressUntilChoiceOrTerminal,
  createProductionLogger,
} from './headlessRuntime.js';
import { issueSessionToken } from './sessionStore.js';
import { resolveDevice } from './deviceService.js';
import { resolveSession } from './sessionStore.js';

export interface SlotListItem {
  slotIndex: number;
  slotId: string;
  label: string;
  occupied: boolean;
  slotVersion?: number;
  updatedAt?: string;
  snapshotId?: string;
  age?: number;
  terminal?: boolean;
  engineVersion?: string;
  eventCatalogVersion?: string;
}

function mapNextEvent(session: Awaited<ReturnType<typeof deriveNextEvent>>) {
  if (!session) return null;
  return {
    eventId: session.event.eventId,
    title: session.event.title,
    text: session.event.text,
    isAutomatic: session.isAutomatic,
    choices: session.event.choices,
  };
}

export async function listSaves(
  db: Queryable,
  env: BackendEnv,
  deviceToken: string,
): Promise<SlotListItem[]> {
  const { deviceId } = await resolveDevice(db, env, deviceToken);
  const slots = await saveSlotRepo.ensureDeviceSlots(db, deviceId);
  const items: SlotListItem[] = [];
  for (const slot of slots) {
    const base: SlotListItem = {
      slotIndex: slot.slot_index,
      slotId: slot.id,
      label: slot.label,
      occupied: Boolean(slot.current_snapshot_id),
    };
    if (!slot.current_snapshot_id) {
      items.push(base);
      continue;
    }
    const snap = await snapshotRepo.getSnapshotById(db, slot.current_snapshot_id);
    if (!snap) {
      items.push(base);
      continue;
    }
    items.push({
      ...base,
      occupied: true,
      slotVersion: slot.version,
      updatedAt: slot.updated_at.toISOString(),
      snapshotId: snap.id,
      age: snap.snapshot.state.player?.age,
      terminal: !snap.snapshot.state.player?.alive,
      engineVersion: snap.engine_version,
      eventCatalogVersion: snap.event_catalog_version,
    });
  }
  return items;
}

export async function createNewSession(
  db: Queryable,
  env: BackendEnv,
  params: {
    deviceToken: string;
    slotIndex: number;
    playerName: string;
    gender: 'male' | 'female';
    sourcePlatform: string;
    confirmOverwrite?: boolean;
  },
) {
  const { deviceId } = await resolveDevice(db, env, params.deviceToken);
  if (params.slotIndex < 1 || params.slotIndex > 3) {
    throw validationError('slotIndex must be 1, 2, or 3');
  }
  return withTransaction(env.databaseUrl, async client => {
    const slots = await saveSlotRepo.ensureDeviceSlots(client, deviceId);
    const slot = slots.find(s => s.slot_index === params.slotIndex);
    if (!slot) throw notFound('Save slot not found');
    if (slot.current_snapshot_id && !params.confirmOverwrite) {
      throw conflict('SLOT_OVERWRITE_REQUIRED', 'Slot is occupied; confirm overwrite required', {
        slotIndex: params.slotIndex,
      });
    }
    const logger = createProductionLogger(env);
    const headless = createHeadlessSessionFromNewGame({
      playerName: params.playerName,
      gender: params.gender,
      catalogVersion: env.eventCatalogVersion,
      logger,
    });
    await progressUntilChoiceOrTerminal(headless);
    const snapshot = headless.serialize();
    snapshot.metadata.sourcePlatform = params.sourcePlatform as GameStateSnapshot['metadata']['sourcePlatform'];
    snapshot.metadata.engineVersion = env.engineVersion;
    snapshot.metadata.eventCatalogVersion = env.eventCatalogVersion;

    const { sessionToken, tokenHash } = issueSessionToken(env);
    const session = await sessionRepo.insertSession(client, {
      deviceId,
      saveSlotId: slot.id,
      tokenHash,
      engineVersion: env.engineVersion,
      eventCatalogVersion: env.eventCatalogVersion,
    });

    const snapRow = await snapshotRepo.insertSnapshot(client, {
      saveSlotId: slot.id,
      sessionId: session.id,
      slotVersion: slot.version + 1,
      snapshot,
      engineVersion: env.engineVersion,
      eventCatalogVersion: env.eventCatalogVersion,
    });
    const updatedSlot = await saveSlotRepo.updateSlotPointer(
      client,
      slot.id,
      slot.version,
      snapRow.id,
    );
    if (!updatedSlot) {
      throw conflict('STALE_SLOT_VERSION', 'Slot version conflict during new game');
    }

    await replayRepo.appendReplayAction(client, {
      sessionId: session.id,
      saveSlotId: slot.id,
      actionType: 'session_created',
      snapshotHashAfter: snapRow.content_hash,
      payload: { slotIndex: params.slotIndex, sourcePlatform: params.sourcePlatform },
    });

    const next = await deriveNextEvent(headless);
    const terminal = headless.getTerminalState();
    if (terminal) {
      await sessionRepo.updateSessionStatus(client, session.id, 'terminal');
      await replayRepo.appendReplayAction(client, {
        sessionId: session.id,
        saveSlotId: slot.id,
        actionType: 'terminal',
        snapshotHashAfter: snapRow.content_hash,
      });
    }

    return {
      sessionId: session.id,
      sessionToken,
      slot: updatedSlot,
      snapshot: snapRow,
      nextEvent: mapNextEvent(next),
      terminal,
      lifeMemory: headless.getLifeMemory(),
    };
  });
}

export async function restoreSession(
  db: Queryable,
  env: BackendEnv,
  params: { deviceToken: string; slotIndex: number },
) {
  const { deviceId } = await resolveDevice(db, env, params.deviceToken);
  return withTransaction(env.databaseUrl, async client => {
    await saveSlotRepo.ensureDeviceSlots(client, deviceId);
    const slot = await saveSlotRepo.getSlotByDeviceAndIndex(client, deviceId, params.slotIndex);
    if (!slot?.current_snapshot_id) {
      throw notFound('Save slot is empty');
    }
    const snap = await snapshotRepo.getSnapshotById(client, slot.current_snapshot_id);
    if (!snap) throw notFound('Snapshot not found');
    snapshotRepo.assertSnapshotCompatibility(snap, env.engineVersion, env.eventCatalogVersion);

    const logger = createProductionLogger(env);
    const headless = await createHeadlessSessionFromSnapshot({
      snapshot: snap.snapshot,
      catalogVersion: env.eventCatalogVersion,
      logger,
    });
    await progressUntilChoiceOrTerminal(headless);

    const { sessionToken, tokenHash } = issueSessionToken(env);
    const session = await sessionRepo.insertSession(client, {
      deviceId,
      saveSlotId: slot.id,
      tokenHash,
      engineVersion: env.engineVersion,
      eventCatalogVersion: env.eventCatalogVersion,
      status: headless.getTerminalState() ? 'terminal' : 'active',
    });

    await replayRepo.appendReplayAction(client, {
      sessionId: session.id,
      saveSlotId: slot.id,
      actionType: 'session_restored',
      snapshotHashBefore: snap.content_hash,
      snapshotHashAfter: snap.content_hash,
      payload: { slotIndex: params.slotIndex },
    });

    const next = await deriveNextEvent(headless);
    return {
      sessionId: session.id,
      sessionToken,
      slot,
      snapshot: snap,
      nextEvent: mapNextEvent(next),
      terminal: headless.getTerminalState(),
      lifeMemory: headless.getLifeMemory(),
    };
  });
}

export async function executeChoice(
  db: Queryable,
  env: BackendEnv,
  params: {
    deviceToken: string;
    sessionId: string;
    sessionToken: string;
    expectedSlotVersion: number;
    expectedSnapshotId: string;
    eventId: string;
    choiceId: string;
  },
) {
  const { deviceId } = await resolveDevice(db, env, params.deviceToken);
  return withTransaction(env.databaseUrl, async client => {
    const { session } = await resolveSession(
      client,
      env,
      params.sessionId,
      params.sessionToken,
      deviceId,
    );
    if (!session.save_slot_id) throw notFound('Session has no save slot');
    const slot = (await saveSlotRepo.ensureDeviceSlots(client, deviceId)).find(
      s => s.id === session.save_slot_id,
    );
    if (!slot) throw notFound('Save slot not found');
    if (slot.version !== params.expectedSlotVersion) {
      throw conflict('STALE_SLOT_VERSION', 'Stale slot version', {
        currentSlotVersion: slot.version,
        currentSnapshotId: slot.current_snapshot_id,
      });
    }
    if (slot.current_snapshot_id !== params.expectedSnapshotId) {
      throw conflict('STALE_SNAPSHOT', 'Stale snapshot id', {
        currentSlotVersion: slot.version,
        currentSnapshotId: slot.current_snapshot_id,
      });
    }
    const currentSnap = await snapshotRepo.getSnapshotById(client, params.expectedSnapshotId);
    if (!currentSnap) throw notFound('Snapshot not found');
    snapshotRepo.assertSnapshotCompatibility(currentSnap, env.engineVersion, env.eventCatalogVersion);

    const logger = createProductionLogger(env);
    const headless = await createHeadlessSessionFromSnapshot({
      snapshot: currentSnap.snapshot,
      catalogVersion: env.eventCatalogVersion,
      logger,
    });
    const hashBefore = currentSnap.content_hash;
    await deriveNextEvent(headless);
    const request = buildChoiceRequest({
      snapshot: currentSnap.snapshot,
      snapshotId: currentSnap.id,
      eventId: params.eventId,
      choiceId: params.choiceId,
    });
    const response = await executeChoiceOnSession(headless, request);
    if (response.status === 'failure') {
      throw validationError(response.error.message, {
        code: response.error.code,
      });
    }
    await progressUntilChoiceOrTerminal(headless);
    const newSnapshot = headless.serialize();
    newSnapshot.metadata.engineVersion = env.engineVersion;
    newSnapshot.metadata.eventCatalogVersion = env.eventCatalogVersion;

    const snapRow = await snapshotRepo.insertSnapshot(client, {
      saveSlotId: slot.id,
      sessionId: session.id,
      slotVersion: slot.version + 1,
      snapshot: newSnapshot,
      engineVersion: env.engineVersion,
      eventCatalogVersion: env.eventCatalogVersion,
    });
    const updatedSlot = await saveSlotRepo.updateSlotPointer(
      client,
      slot.id,
      slot.version,
      snapRow.id,
    );
    if (!updatedSlot) {
      throw conflict('STALE_SLOT_VERSION', 'Slot version conflict during choice', {
        currentSlotVersion: slot.version,
        currentSnapshotId: slot.current_snapshot_id,
      });
    }

    await replayRepo.appendReplayAction(client, {
      sessionId: session.id,
      saveSlotId: slot.id,
      actionType: 'choice_executed',
      eventId: params.eventId,
      choiceId: params.choiceId,
      snapshotHashBefore: hashBefore,
      snapshotHashAfter: snapRow.content_hash,
    });

    const terminal = headless.getTerminalState();
    if (terminal) {
      await sessionRepo.updateSessionStatus(client, session.id, 'terminal');
      await replayRepo.appendReplayAction(client, {
        sessionId: session.id,
        saveSlotId: slot.id,
        actionType: 'terminal',
        snapshotHashAfter: snapRow.content_hash,
      });
    }

    const next = await deriveNextEvent(headless);
    return {
      slot: updatedSlot,
      snapshot: snapRow,
      response,
      nextEvent: mapNextEvent(next),
      terminal,
      lifeMemory: headless.getLifeMemory(),
    };
  });
}

export async function manualSave(
  db: Queryable,
  env: BackendEnv,
  params: {
    deviceToken: string;
    sessionId: string;
    sessionToken: string;
    expectedSlotVersion: number;
    expectedSnapshotId: string;
  },
) {
  const { deviceId } = await resolveDevice(db, env, params.deviceToken);
  return withTransaction(env.databaseUrl, async client => {
    const { session } = await resolveSession(
      client,
      env,
      params.sessionId,
      params.sessionToken,
      deviceId,
    );
    if (!session.save_slot_id) throw notFound('Session has no save slot');
    const slot = (await saveSlotRepo.ensureDeviceSlots(client, deviceId)).find(
      s => s.id === session.save_slot_id,
    );
    if (!slot) throw notFound('Save slot not found');
    if (slot.version !== params.expectedSlotVersion) {
      throw conflict('STALE_SLOT_VERSION', 'Stale slot version', {
        currentSlotVersion: slot.version,
        currentSnapshotId: slot.current_snapshot_id,
      });
    }
    if (slot.current_snapshot_id !== params.expectedSnapshotId) {
      throw conflict('STALE_SNAPSHOT', 'Stale snapshot id', {
        currentSlotVersion: slot.version,
        currentSnapshotId: slot.current_snapshot_id,
      });
    }
    const currentSnap = await snapshotRepo.getSnapshotById(client, params.expectedSnapshotId);
    if (!currentSnap) throw notFound('Snapshot not found');

    const logger = createProductionLogger(env);
    const headless = await createHeadlessSessionFromSnapshot({
      snapshot: currentSnap.snapshot,
      catalogVersion: env.eventCatalogVersion,
      logger,
    });
    const serialized = headless.serialize();
    const newIntegrity = snapshotRepo.buildSnapshotIntegrity(serialized);
    let snapRow = currentSnap;
    let updatedSlot = slot;
    if (newIntegrity.contentHash !== currentSnap.content_hash) {
      snapRow = await snapshotRepo.insertSnapshot(client, {
        saveSlotId: slot.id,
        sessionId: session.id,
        slotVersion: slot.version + 1,
        snapshot: serialized,
        engineVersion: env.engineVersion,
        eventCatalogVersion: env.eventCatalogVersion,
      });
      const swapped = await saveSlotRepo.updateSlotPointer(
        client,
        slot.id,
        slot.version,
        snapRow.id,
      );
      if (!swapped) {
        throw conflict('STALE_SLOT_VERSION', 'Slot version conflict during manual save', {
          currentSlotVersion: slot.version,
          currentSnapshotId: slot.current_snapshot_id,
        });
      }
      updatedSlot = swapped;
    }

    await replayRepo.appendReplayAction(client, {
      sessionId: session.id,
      saveSlotId: slot.id,
      actionType: 'manual_save',
      snapshotHashBefore: currentSnap.content_hash,
      snapshotHashAfter: snapRow.content_hash,
    });

    return { slot: updatedSlot, snapshot: snapRow };
  });
}
