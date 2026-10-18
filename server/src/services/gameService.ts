import type { GameStateSnapshot } from '../../../src/contracts/gameStateSnapshot.js';
import type { BackendEnv } from '../config/env.js';
import type { Queryable } from '../db/pool.js';
import { withTransaction } from '../db/transaction.js';
import { ApiError, conflict, notFound, validationError } from '../errors/apiError.js';
import * as saveSlotRepo from '../repositories/saveSlotRepository.js';
import * as snapshotRepo from '../repositories/snapshotRepository.js';
import * as sessionRepo from '../repositories/sessionRepository.js';
import * as replayRepo from '../repositories/replayRepository.js';
import * as checkpointRepo from '../repositories/progressionCheckpointRepository.js';
import { HeadlessProgressionError } from '../../../src/headless/session/sessionTypes.js';
import type { ProgressionAckKind } from '../../../src/contracts/sessionProgression.js';
import {
  buildChoiceRequest,
  createHeadlessSessionFromNewGame,
  createHeadlessSessionFromSnapshot,
  executeChoiceOnSession,
  progressUntilChoiceOrTerminal,
  createProductionLogger,
  resolveSessionAfterAutoProgress,
} from './headlessRuntime.js';
import { mapSessionProgression } from './sessionProgressionMapper.js';
import {
  clearSnapshotVolatileState,
  getSnapshotVolatileState,
  setSnapshotVolatileState,
} from './headlessVolatileCache.js';
import { issueSessionToken } from './sessionStore.js';
import { resolveDevice } from './deviceService.js';
import { resolveSession } from './sessionStore.js';
import type { RuntimeEventCatalog } from '../../../src/core/RuntimeEventCatalog.js';

function mapProgressionError(error: unknown): never {
  if (error instanceof HeadlessProgressionError) {
    throw validationError(error.message, { code: error.code });
  }
  throw error;
}

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
  progressionCheckpointState?: 'clear' | 'pending' | 'legacy_unknown' | 'invalid';
}

async function restoreProgressionState(
  client: Queryable,
  slotId: string,
  snapshotId: string,
  headless: Awaited<ReturnType<typeof createHeadlessSessionFromSnapshot>>,
) {
  const checkpoint = await checkpointRepo.getCheckpoint(client, slotId, snapshotId);
  if (checkpoint.state === 'legacy_unknown') {
    throw new ApiError(409, 'PROGRESSION_CHECKPOINT_LEGACY_UNKNOWN',
      '此旧存档的待确认结果无法恢复；存档已保留，请先在存档列表明确选择是否放弃旧结果。');
  }
  // Only this exact snapshot may supply non-persistent presentation data. The DB
  // checkpoint always owns settled summaries, even when the cache says otherwise.
  const volatile = getSnapshotVolatileState(snapshotId) ?? headless.getProgressionVolatileState();
  headless.applyProgressionVolatileState({
    ...volatile,
    pendingActionSummary: null,
    pendingDisturbanceNarrative: null,
    pendingPeriodSummary: null,
    ...(checkpoint.state === 'pending' ? checkpoint.payload : {}),
  });
  return checkpoint;
}

function buildProgressionResponse(
  headless: Awaited<ReturnType<typeof createHeadlessSessionFromNewGame>>,
  slotVersion: number,
  snapshotId: string,
  resolved?: Awaited<ReturnType<typeof resolveSessionAfterAutoProgress>>,
) {
  const terminal = headless.getTerminalState();
  const lifeMemory = headless.getLifeMemory();
  return mapSessionProgression(
    headless,
    slotVersion,
    snapshotId,
    terminal,
    lifeMemory,
    resolved?.nextEvent ?? null,
  );
}

function shouldPersistProgressionVolatile(
  headless: Awaited<ReturnType<typeof createHeadlessSessionFromNewGame>>,
  resolved?: Awaited<ReturnType<typeof resolveSessionAfterAutoProgress>>,
): boolean {
  const phase = headless.getSessionPhase();
  if (
    phase === 'action_summary' ||
    phase === 'disturbance_narrative' ||
    phase === 'period_summary' ||
    phase === 'passive_progression'
  ) {
    return true;
  }
  return phase === 'story_event' && resolved?.nextEvent !== null && resolved?.nextEvent !== undefined;
}

function syncProgressionVolatileCache(
  snapshotId: string,
  headless: Awaited<ReturnType<typeof createHeadlessSessionFromNewGame>>,
  resolved: Awaited<ReturnType<typeof resolveSessionAfterAutoProgress>>,
): void {
  if (headless.getTerminalState()) {
    clearSnapshotVolatileState(snapshotId);
    return;
  }
  if (shouldPersistProgressionVolatile(headless, resolved)) {
    setSnapshotVolatileState(snapshotId, headless.getProgressionVolatileState());
    return;
  }
  clearSnapshotVolatileState(snapshotId);
}

export async function listSaves(
  db: Queryable,
  env: BackendEnv,
  deviceToken: string,
): Promise<SlotListItem[]> {
  const { deviceId } = await resolveDevice(db, env, deviceToken);
  return withTransaction(env.databaseUrl, async client => {
    const slots = await saveSlotRepo.ensureDeviceSlots(client, deviceId);
    const items: SlotListItem[] = [];
    for (const listedSlot of slots) {
      const slot = (await saveSlotRepo.getSlotByDeviceAndIndex(client, deviceId, listedSlot.slot_index))!;
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
      const snap = await snapshotRepo.getSnapshotById(client, slot.current_snapshot_id);
      let progressionCheckpointState: SlotListItem['progressionCheckpointState'];
      try {
        progressionCheckpointState = (await checkpointRepo.getCheckpoint(client, slot.id, slot.current_snapshot_id)).state;
      } catch (error) {
        if (!(error instanceof ApiError) || error.code !== 'PROGRESSION_CHECKPOINT_INVALID') throw error;
        progressionCheckpointState = 'invalid';
      }
      items.push({
        ...base,
        slotVersion: slot.version,
        updatedAt: slot.updated_at.toISOString(),
        snapshotId: slot.current_snapshot_id,
        age: snap?.snapshot.state.player?.age,
        terminal: snap ? !snap.snapshot.state.player?.alive : undefined,
        engineVersion: snap?.engine_version,
        eventCatalogVersion: snap?.event_catalog_version,
        progressionCheckpointState: snap ? progressionCheckpointState : 'invalid',
      });
    }
    return items;
  });
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
  runtimeCatalog?: RuntimeEventCatalog,
) {
  const { deviceId } = await resolveDevice(db, env, params.deviceToken);
  if (params.slotIndex < 1 || params.slotIndex > 3) {
    throw validationError('slotIndex must be 1, 2, or 3');
  }
  let updateCache: (() => void) | undefined;
  const result = await withTransaction(env.databaseUrl, async client => {
    await saveSlotRepo.ensureDeviceSlots(client, deviceId);
    const slot = await saveSlotRepo.getSlotByDeviceAndIndex(client, deviceId, params.slotIndex);
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
      runtimeCatalog,
    });
    await progressUntilChoiceOrTerminal(headless);
    const resolved = await resolveSessionAfterAutoProgress(headless);
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

    await checkpointRepo.saveCheckpoint(client, slot.id, snapRow.id,
      checkpointRepo.buildCheckpoint(headless.getProgressionVolatileState(), Boolean(headless.getTerminalState())));

    await replayRepo.appendReplayAction(client, {
      sessionId: session.id,
      saveSlotId: slot.id,
      actionType: 'session_created',
      snapshotHashAfter: snapRow.content_hash,
      payload: { slotIndex: params.slotIndex, sourcePlatform: params.sourcePlatform },
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
    updateCache = () => syncProgressionVolatileCache(snapRow.id, headless, resolved);

    return {
      sessionId: session.id,
      sessionToken,
      slot: updatedSlot,
      snapshot: snapRow,
      ...buildProgressionResponse(headless, updatedSlot.version, snapRow.id, resolved),
    };
  });
  updateCache?.();
  return result;
}

export async function restoreSession(
  db: Queryable,
  env: BackendEnv,
  params: { deviceToken: string; slotIndex: number },
  runtimeCatalog?: RuntimeEventCatalog,
) {
  const { deviceId } = await resolveDevice(db, env, params.deviceToken);
  let updateCache: (() => void) | undefined;
  const result = await withTransaction(env.databaseUrl, async client => {
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
      runtimeCatalog,
    });
    await restoreProgressionState(client, slot.id, snap.id, headless);

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

    const resolved = await resolveSessionAfterAutoProgress(headless);
    updateCache = () => syncProgressionVolatileCache(snap.id, headless, resolved);
    return {
      sessionId: session.id,
      sessionToken,
      slot,
      snapshot: snap,
      ...buildProgressionResponse(headless, slot.version, snap.id, resolved),
    };
  });
  updateCache?.();
  return result;
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
  runtimeCatalog?: RuntimeEventCatalog,
) {
  let updateCache: (() => void) | undefined;
  const result = await withTransaction(env.databaseUrl, async client => {
    const { session, slot, currentSnap, headless } = await loadHeadlessForMutation(
      client, env, params, runtimeCatalog,
    );
    if (headless.getSessionPhase() !== 'story_event') {
      throw validationError('Choices require story_event phase', { code: 'INVALID_SESSION_PHASE' });
    }
    if (headless.describePendingEvent()?.eventId !== params.eventId) {
      throw validationError('Choice does not belong to the current event', { code: 'STALE_EVENT' });
    }
    const hashBefore = currentSnap.content_hash;
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
    if (headless.getSessionPhase() !== 'period_summary') {
      await progressUntilChoiceOrTerminal(headless);
    }
    const resolved = await resolveSessionAfterAutoProgress(headless);
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

    await checkpointRepo.saveCheckpoint(client, slot.id, snapRow.id,
      checkpointRepo.buildCheckpoint(headless.getProgressionVolatileState(), Boolean(headless.getTerminalState())));

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

    updateCache = () => syncProgressionVolatileCache(snapRow.id, headless, resolved);
    return {
      slot: updatedSlot,
      snapshot: snapRow,
      response,
      ...buildProgressionResponse(headless, updatedSlot.version, snapRow.id, resolved),
    };
  });
  updateCache?.();
  return result;
}

async function loadHeadlessForMutation(
  client: Queryable,
  env: BackendEnv,
  params: {
    deviceToken: string;
    sessionId: string;
    sessionToken: string;
    expectedSlotVersion: number;
    expectedSnapshotId: string;
  },
  runtimeCatalog?: RuntimeEventCatalog,
  resolveAutoProgress = true,
) {
  const { deviceId } = await resolveDevice(client, env, params.deviceToken);
  const { session } = await resolveSession(
    client,
    env,
    params.sessionId,
    params.sessionToken,
    deviceId,
  );
  if (!session.save_slot_id) throw notFound('Session has no save slot');
  const slot = await saveSlotRepo.getSlotByDeviceAndId(client, deviceId, session.save_slot_id);
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
    runtimeCatalog,
  });
  const checkpoint = await restoreProgressionState(client, slot.id, currentSnap.id, headless);
  if (resolveAutoProgress) {
    await resolveSessionAfterAutoProgress(headless);
  }
  return { session, slot, currentSnap, headless, deviceId, checkpoint };
}

export async function executeMarketStallAction(
  db: Queryable,
  env: BackendEnv,
  params: {
    deviceToken: string;
    sessionId: string;
    sessionToken: string;
    expectedSlotVersion: number;
    expectedSnapshotId: string;
    operation: 'attempt' | 'abandon';
  },
  runtimeCatalog?: RuntimeEventCatalog,
) {
  if (params.operation !== 'attempt' && params.operation !== 'abandon') {
    throw validationError('operation must be attempt or abandon');
  }
  let updateCache: (() => void) | undefined;
  const result = await withTransaction(env.databaseUrl, async client => {
    // This action must inspect the selected state as-is. Auto progression here could
    // select a story event and make abandon an extra scheduler draw.
    const { session, slot, currentSnap, headless } = await loadHeadlessForMutation(
      client,
      env,
      params,
      runtimeCatalog,
      false,
    );
    if (headless.getSessionPhase() !== 'active_planning') {
      throw validationError('Market stall actions require active_planning phase', {
        code: 'INVALID_SESSION_PHASE',
      });
    }
    const hashBefore = currentSnap.content_hash;
    try {
      await headless.executeMarketStallAction(params.operation);
    } catch (error) {
      mapProgressionError(error);
    }
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
    const updatedSlot = await saveSlotRepo.updateSlotPointer(client, slot.id, slot.version, snapRow.id);
    if (!updatedSlot) {
      throw conflict('STALE_SLOT_VERSION', 'Slot version conflict during market stall action', {
        currentSlotVersion: slot.version,
        currentSnapshotId: slot.current_snapshot_id,
      });
    }
    await checkpointRepo.saveCheckpoint(client, slot.id, snapRow.id,
      checkpointRepo.buildCheckpoint(headless.getProgressionVolatileState(), Boolean(headless.getTerminalState())));

    await replayRepo.appendReplayAction(client, {
      sessionId: session.id,
      saveSlotId: slot.id,
      actionType: 'market_stall_action',
      snapshotHashBefore: hashBefore,
      snapshotHashAfter: snapRow.content_hash,
      payload: { operation: params.operation },
    });
    const resolved = { nextEvent: null, phase: headless.getSessionPhase() };
    updateCache = () => syncProgressionVolatileCache(snapRow.id, headless, resolved);
    return {
      slot: updatedSlot,
      snapshot: snapRow,
      ...buildProgressionResponse(headless, updatedSlot.version, snapRow.id),
    };
  });
  updateCache?.();
  return result;
}

export async function executeActiveAction(
  db: Queryable,
  env: BackendEnv,
  params: {
    deviceToken: string;
    sessionId: string;
    sessionToken: string;
    expectedSlotVersion: number;
    expectedSnapshotId: string;
    actionId: string;
  },
  runtimeCatalog?: RuntimeEventCatalog,
) {
  let updateCache: (() => void) | undefined;
  const result = await withTransaction(env.databaseUrl, async client => {
    const { session, slot, currentSnap, headless } = await loadHeadlessForMutation(
      client,
      env,
      params,
      runtimeCatalog,
    );
    const hashBefore = currentSnap.content_hash;
    try {
      await headless.executeActiveAction(params.actionId);
    } catch (error) {
      mapProgressionError(error);
    }
    const resolved = await resolveSessionAfterAutoProgress(headless);
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
    const updatedSlot = await saveSlotRepo.updateSlotPointer(client, slot.id, slot.version, snapRow.id);
    if (!updatedSlot) {
      throw conflict('STALE_SLOT_VERSION', 'Slot version conflict during active action', {
        currentSlotVersion: slot.version,
        currentSnapshotId: slot.current_snapshot_id,
      });
    }
    await checkpointRepo.saveCheckpoint(client, slot.id, snapRow.id,
      checkpointRepo.buildCheckpoint(headless.getProgressionVolatileState(), Boolean(headless.getTerminalState())));

    await replayRepo.appendReplayAction(client, {
      sessionId: session.id,
      saveSlotId: slot.id,
      actionType: 'active_action',
      snapshotHashBefore: hashBefore,
      snapshotHashAfter: snapRow.content_hash,
      payload: { actionId: params.actionId },
    });
    updateCache = () => syncProgressionVolatileCache(snapRow.id, headless, resolved);
    return buildProgressionResponse(headless, updatedSlot.version, snapRow.id, resolved);
  });
  updateCache?.();
  return result;
}

export async function acknowledgeProgression(
  db: Queryable,
  env: BackendEnv,
  params: {
    deviceToken: string;
    sessionId: string;
    sessionToken: string;
    expectedSlotVersion: number;
    expectedSnapshotId: string;
    ackKind: ProgressionAckKind;
  },
  runtimeCatalog?: RuntimeEventCatalog,
) {
  let updateCache: (() => void) | undefined;
  const result = await withTransaction(env.databaseUrl, async client => {
    const { session, slot, currentSnap, headless } = await loadHeadlessForMutation(
      client,
      env,
      params,
      runtimeCatalog,
    );
    const hashBefore = currentSnap.content_hash;
    try {
      await headless.acknowledgeProgression(params.ackKind);
    } catch (error) {
      mapProgressionError(error);
    }
    const resolved = await resolveSessionAfterAutoProgress(headless);
    const serialized = headless.serialize();
    // Confirmation consumes a decision point even when canonical facts/hash stay
    // identical. Reuse the public slot/snapshot CAS token for exactly-once ACK.
    const snapRow = await snapshotRepo.insertSnapshot(client, {
      saveSlotId: slot.id,
      sessionId: session.id,
      slotVersion: slot.version + 1,
      snapshot: serialized,
      engineVersion: env.engineVersion,
      eventCatalogVersion: env.eventCatalogVersion,
    });
    const updatedSlot = await saveSlotRepo.updateSlotPointer(client, slot.id, slot.version, snapRow.id);
    if (!updatedSlot) {
      throw conflict('STALE_SLOT_VERSION', 'Slot version conflict during progression ack', {
        currentSlotVersion: slot.version,
        currentSnapshotId: slot.current_snapshot_id,
      });
    }
    await checkpointRepo.saveCheckpoint(client, slot.id, snapRow.id,
      checkpointRepo.buildCheckpoint(headless.getProgressionVolatileState(), Boolean(headless.getTerminalState())));
    await replayRepo.appendReplayAction(client, {
      sessionId: session.id,
      saveSlotId: slot.id,
      actionType: 'progression_ack',
      snapshotHashBefore: hashBefore,
      snapshotHashAfter: snapRow.content_hash,
      payload: { ackKind: params.ackKind },
    });
    const terminal = headless.getTerminalState();
    if (terminal) {
      await sessionRepo.updateSessionStatus(client, session.id, 'terminal');
    }
    updateCache = () => syncProgressionVolatileCache(snapRow.id, headless, resolved);
    return buildProgressionResponse(headless, updatedSlot.version, snapRow.id, resolved);
  });
  updateCache?.();
  return result;
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
  runtimeCatalog?: RuntimeEventCatalog,
) {
  let updateCache: (() => void) | undefined;
  const result = await withTransaction(env.databaseUrl, async client => {
    const { session, slot, currentSnap, headless, checkpoint } = await loadHeadlessForMutation(
      client, env, params, runtimeCatalog, false,
    );
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

    await checkpointRepo.saveCheckpoint(client, slot.id, snapRow.id, checkpoint);
    await replayRepo.appendReplayAction(client, {
      sessionId: session.id,
      saveSlotId: slot.id,
      actionType: 'manual_save',
      snapshotHashBefore: currentSnap.content_hash,
      snapshotHashAfter: snapRow.content_hash,
    });

    updateCache = () => syncProgressionVolatileCache(snapRow.id, headless,
      { nextEvent: null, phase: headless.getSessionPhase() });
    return { slot: updatedSlot, snapshot: snapRow };
  });
  updateCache?.();
  return result;
}

export async function discardLegacyProgression(
  db: Queryable,
  env: BackendEnv,
  params: {
    deviceToken: string;
    slotIndex: number;
    expectedSlotVersion: number;
    expectedSnapshotId: string;
  },
) {
  const { deviceId } = await resolveDevice(db, env, params.deviceToken);
  return withTransaction(env.databaseUrl, async client => {
    const slot = await saveSlotRepo.getSlotByDeviceAndIndex(client, deviceId, params.slotIndex);
    if (!slot?.current_snapshot_id) throw notFound('Save slot is empty');
    if (slot.version !== params.expectedSlotVersion) {
      throw conflict('STALE_SLOT_VERSION', 'Stale slot version');
    }
    if (slot.current_snapshot_id !== params.expectedSnapshotId) {
      throw conflict('STALE_SNAPSHOT', 'Stale snapshot id');
    }
    const checkpoint = await checkpointRepo.getCheckpoint(client, slot.id, slot.current_snapshot_id);
    if (checkpoint.state !== 'legacy_unknown') {
      throw new ApiError(422, 'PROGRESSION_CHECKPOINT_INVALID', '只有已标记的旧存档可以放弃无法恢复的结果。');
    }
    const snapshot = await snapshotRepo.getSnapshotById(client, slot.current_snapshot_id);
    if (!snapshot) throw notFound('Snapshot not found');
    snapshotRepo.assertSnapshotCompatibility(snapshot, env.engineVersion, env.eventCatalogVersion);
    snapshotRepo.buildSnapshotIntegrity(snapshot.snapshot);
    // No Headless execution: preserve every canonical fact and pending event,
    // retain the original row/hash, and never grant an extra scheduler draw.
    const copied = await snapshotRepo.copySnapshotForSlotVersion(client, snapshot, slot.version + 1);
    const swapped = await saveSlotRepo.updateSlotPointer(client, slot.id, slot.version, copied.id);
    if (!swapped) throw conflict('STALE_SLOT_VERSION', 'Slot version conflict during legacy discard');
    await checkpointRepo.saveCheckpoint(client, slot.id, copied.id, { protocolVersion: 1, state: 'clear' });
    await replayRepo.appendReplayAction(client, {
      sessionId: snapshot.session_id,
      saveSlotId: slot.id,
      actionType: 'legacy_progression_discarded',
      snapshotHashBefore: snapshot.content_hash,
      snapshotHashAfter: copied.content_hash,
      payload: {
        previousSnapshotId: snapshot.id,
        newSnapshotId: copied.id,
        reason: 'player_discarded_unrecoverable_legacy_results',
      },
    });
    return { slotVersion: swapped.version, snapshotId: copied.id };
  });
}
