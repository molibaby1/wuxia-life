import { runMigrations } from '../../server/src/db/migrate.js';
import { getPool, closePool } from '../../server/src/db/pool.js';
import { loadBackendEnv } from '../../server/src/config/env.js';
import { bootstrapDevice } from '../../server/src/services/deviceService.js';
import * as gameService from '../../server/src/services/gameService.js';
import { seedActiveCatalog } from '../../server/src/http/router.js';
import { hashToken } from '../../server/src/crypto/tokens.js';
import { ApiError } from '../../server/src/errors/apiError.js';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
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

  const next = created.nextEvent;
  if (next && next.choices && next.choices.length > 0) {
    const choiceId = next.choices.find(c => c.available)?.id ?? next.choices[0]!.id;
    const choiceResult = await gameService.executeChoice(db, env, {
      deviceToken: boot1.deviceToken,
      sessionId: created.sessionId,
      sessionToken: created.sessionToken,
      expectedSlotVersion: created.slot.version,
      expectedSnapshotId: created.snapshot.id,
      eventId: next.eventId,
      choiceId,
    });
    assert(choiceResult.slot.version > created.slot.version, 'slot version increments');
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
