import type { BackendEnv } from '../config/env.js';
import type { Queryable } from '../db/pool.js';
import { generateOpaqueToken, hashToken } from '../crypto/tokens.js';
import { unauthorized } from '../errors/apiError.js';
import * as sessionRepo from '../repositories/sessionRepository.js';

export interface SessionAuthContext {
  session: sessionRepo.GameSessionRow;
  sessionToken: string;
}

export async function resolveSession(
  db: Queryable,
  env: BackendEnv,
  sessionId: string,
  sessionToken: string | undefined,
  deviceId: string,
): Promise<SessionAuthContext> {
  if (!sessionToken) throw unauthorized('Missing session token');
  const session = await sessionRepo.getSessionById(db, sessionId);
  if (!session || session.device_id !== deviceId) {
    throw unauthorized('Invalid session');
  }
  const tokenHash = hashToken(sessionToken, env.tokenHashSecret);
  if (session.token_hash !== tokenHash || session.status === 'revoked') {
    throw unauthorized('Invalid session token');
  }
  return { session, sessionToken };
}

export function issueSessionToken(env: BackendEnv): { sessionToken: string; tokenHash: string } {
  const sessionToken = generateOpaqueToken();
  return {
    sessionToken,
    tokenHash: hashToken(sessionToken, env.tokenHashSecret),
  };
}
