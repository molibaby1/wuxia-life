import type { BackendEnv } from '../config/env.js';
import type { Queryable } from '../db/pool.js';
import { generateOpaqueToken, hashToken } from '../crypto/tokens.js';
import { unauthorized } from '../errors/apiError.js';
import * as deviceRepo from '../repositories/deviceRepository.js';

export interface DeviceAuthContext {
  deviceId: string;
  deviceToken: string;
}

export async function bootstrapDevice(
  db: Queryable,
  env: BackendEnv,
  existingToken?: string,
): Promise<{ deviceId: string; deviceToken: string }> {
  if (existingToken) {
    const tokenHash = hashToken(existingToken, env.tokenHashSecret);
    const existing = await deviceRepo.findDeviceByTokenHash(db, tokenHash);
    if (existing) {
      return { deviceId: existing.id, deviceToken: existingToken };
    }
    throw unauthorized('Invalid device token');
  }
  const deviceToken = generateOpaqueToken();
  const tokenHash = hashToken(deviceToken, env.tokenHashSecret);
  const row = await deviceRepo.insertDevice(db, tokenHash);
  return { deviceId: row.id, deviceToken };
}

export async function resolveDevice(
  db: Queryable,
  env: BackendEnv,
  deviceToken: string | undefined,
): Promise<DeviceAuthContext> {
  if (!deviceToken) throw unauthorized('Missing device token');
  const tokenHash = hashToken(deviceToken, env.tokenHashSecret);
  const row = await deviceRepo.findDeviceByTokenHash(db, tokenHash);
  if (!row) throw unauthorized('Invalid device token');
  return { deviceId: row.id, deviceToken };
}
