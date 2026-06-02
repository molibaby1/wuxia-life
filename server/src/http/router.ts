import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { BackendEnv } from '../config/env.js';
import { getPool } from '../db/pool.js';
import { ApiError } from '../errors/apiError.js';
import { StructuredLogger } from '../logging/logger.js';
import { readJsonBody, getBearerToken } from './request.js';
import { bootstrapDevice } from '../services/deviceService.js';
import * as gameService from '../services/gameService.js';
import * as catalogRepo from '../repositories/catalogRepository.js';
import { createDefaultInMemoryCatalogAdapter } from '../../../src/headless/catalog/InMemoryEventCatalogAdapter.js';
import { computeContentHash } from '../crypto/tokens.js';

export interface RouteContext {
  env: BackendEnv;
  logger: StructuredLogger;
  requestId: string;
}

type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  ctx: RouteContext,
  params: Record<string, string>,
) => Promise<void>;

export type ServerRequestHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<void>;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function sendError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string,
  requestId: string,
  details?: Record<string, unknown>,
): void {
  sendJson(res, status, { error: { code, message, requestId, details } });
}

export function createRouter(env: BackendEnv, logger: StructuredLogger): ServerRequestHandler {
  const routes: Array<{
    method: string;
    pattern: RegExp;
    handler: RouteHandler;
  }> = [
    {
      method: 'GET',
      pattern: /^\/health\/live$/,
      handler: async (_req, res, ctx) => {
        sendJson(res, 200, { status: 'ok', requestId: ctx.requestId });
      },
    },
    {
      method: 'GET',
      pattern: /^\/health\/ready$/,
      handler: async (_req, res, ctx) => {
        const db = getPool(env.databaseUrl);
        await db.query('SELECT 1');
        const catalog = await catalogRepo.getCatalogByVersion(db, env.eventCatalogVersion);
        if (!catalog) {
          sendError(res, 503, 'CATALOG_NOT_FOUND', 'Active catalog not seeded', ctx.requestId);
          return;
        }
        sendJson(res, 200, { status: 'ready', requestId: ctx.requestId });
      },
    },
    {
      method: 'POST',
      pattern: /^\/v1\/devices\/bootstrap$/,
      handler: async (req, res, ctx) => {
        const body = await readJsonBody<{ deviceToken?: string }>(req);
        const db = getPool(env.databaseUrl);
        const result = await bootstrapDevice(db, ctx.env, body.deviceToken);
        sendJson(res, 200, { deviceId: result.deviceId, deviceToken: result.deviceToken });
      },
    },
    {
      method: 'GET',
      pattern: /^\/v1\/saves$/,
      handler: async (req, res, ctx) => {
        const deviceToken = getBearerToken(req, 'x-device-token');
        const db = getPool(env.databaseUrl);
        if (!deviceToken) {
          sendError(res, 401, 'UNAUTHORIZED', 'Missing device token', ctx.requestId);
          return;
        }
        const slots = await gameService.listSaves(db, ctx.env, deviceToken);
        sendJson(res, 200, { slots });
      },
    },
    {
      method: 'GET',
      pattern: /^\/v1\/catalog\/bundle$/,
      handler: async (req, res, ctx) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const version = url.searchParams.get('version') ?? ctx.env.eventCatalogVersion;
        const db = getPool(env.databaseUrl);
        const row = await catalogRepo.getCatalogByVersion(db, version);
        if (!row) {
          sendError(res, 404, 'CATALOG_NOT_FOUND', `Unknown catalog version: ${version}`, ctx.requestId);
          return;
        }
        sendJson(res, 200, row.bundle);
      },
    },
    {
      method: 'POST',
      pattern: /^\/v1\/sessions$/,
      handler: async (req, res, ctx) => {
        const deviceToken = getBearerToken(req, 'x-device-token');
        const body = await readJsonBody<{
          slotIndex: number;
          playerName: string;
          gender: 'male' | 'female';
          sourcePlatform?: string;
          confirmOverwrite?: boolean;
        }>(req);
        const db = getPool(env.databaseUrl);
        const result = await gameService.createNewSession(db, ctx.env, {
          deviceToken: deviceToken!,
          slotIndex: body.slotIndex,
          playerName: body.playerName,
          gender: body.gender,
          sourcePlatform: body.sourcePlatform ?? 'web-browser',
          confirmOverwrite: body.confirmOverwrite,
        });
        sendJson(res, 200, {
          sessionId: result.sessionId,
          sessionToken: result.sessionToken,
          slot: {
            id: result.slot.id,
            slotIndex: result.slot.slot_index,
            version: result.slot.version,
            snapshotId: result.slot.current_snapshot_id,
          },
          snapshot: {
            id: result.snapshot.id,
            contentHash: result.snapshot.content_hash,
          },
          nextEvent: result.nextEvent,
          terminal: result.terminal,
          lifeMemory: result.lifeMemory,
        });
      },
    },
    {
      method: 'POST',
      pattern: /^\/v1\/sessions\/restore$/,
      handler: async (req, res, ctx) => {
        const deviceToken = getBearerToken(req, 'x-device-token');
        const body = await readJsonBody<{ slotIndex: number }>(req);
        const db = getPool(env.databaseUrl);
        const result = await gameService.restoreSession(db, ctx.env, {
          deviceToken: deviceToken!,
          slotIndex: body.slotIndex,
        });
        sendJson(res, 200, {
          sessionId: result.sessionId,
          sessionToken: result.sessionToken,
          slot: {
            id: result.slot.id,
            slotIndex: result.slot.slot_index,
            version: result.slot.version,
            snapshotId: result.slot.current_snapshot_id,
          },
          snapshot: {
            id: result.snapshot.id,
            contentHash: result.snapshot.content_hash,
          },
          nextEvent: result.nextEvent,
          terminal: result.terminal,
          lifeMemory: result.lifeMemory,
        });
      },
    },
    {
      method: 'POST',
      pattern: /^\/v1\/sessions\/([^/]+)\/choices$/,
      handler: async (req, res, ctx, params) => {
        const deviceToken = getBearerToken(req, 'x-device-token');
        const sessionToken = getBearerToken(req, 'x-session-token');
        const body = await readJsonBody<{
          expectedSlotVersion: number;
          expectedSnapshotId: string;
          eventId: string;
          choiceId: string;
        }>(req);
        const db = getPool(env.databaseUrl);
        const result = await gameService.executeChoice(db, ctx.env, {
          deviceToken: deviceToken!,
          sessionId: params.sessionId!,
          sessionToken: sessionToken!,
          expectedSlotVersion: body.expectedSlotVersion,
          expectedSnapshotId: body.expectedSnapshotId,
          eventId: body.eventId,
          choiceId: body.choiceId,
        });
        sendJson(res, 200, {
          slotVersion: result.slot.version,
          snapshotId: result.snapshot.id,
          contentHash: result.snapshot.content_hash,
          feedback: result.response.status === 'success' ? result.response.feedback : undefined,
          diagnostics:
            result.response.status === 'success' ? result.response.diagnostics : result.response.diagnostics,
          terminal: result.terminal,
          lifeMemory: result.lifeMemory,
          nextEvent: result.nextEvent,
        });
      },
    },
    {
      method: 'POST',
      pattern: /^\/v1\/sessions\/([^/]+)\/save$/,
      handler: async (req, res, ctx, params) => {
        const deviceToken = getBearerToken(req, 'x-device-token');
        const sessionToken = getBearerToken(req, 'x-session-token');
        const body = await readJsonBody<{
          expectedSlotVersion: number;
          expectedSnapshotId: string;
        }>(req);
        const db = getPool(env.databaseUrl);
        const result = await gameService.manualSave(db, ctx.env, {
          deviceToken: deviceToken!,
          sessionId: params.sessionId!,
          sessionToken: sessionToken!,
          expectedSlotVersion: body.expectedSlotVersion,
          expectedSnapshotId: body.expectedSnapshotId,
        });
        sendJson(res, 200, {
          slot: {
            id: result.slot.id,
            version: result.slot.version,
            snapshotId: result.slot.current_snapshot_id,
          },
          snapshot: {
            id: result.snapshot.id,
            contentHash: result.snapshot.content_hash,
          },
        });
      },
    },
  ];

  return async (req, res) => {
    const started = Date.now();
    const requestId = randomUUID();
    const ctx: RouteContext = { env, logger, requestId };
    const method = req.method ?? 'GET';
    const url = new URL(req.url ?? '/', 'http://localhost');
    const pathname = url.pathname;

    try {
      for (const route of routes) {
        if (route.method !== method) continue;
        const match = pathname.match(route.pattern);
        if (!match) continue;
        const params: Record<string, string> = {};
        if (match[1]) params.sessionId = match[1];
        await route.handler(req, res, ctx, params);
        logger.request({
          requestId,
          method,
          route: pathname,
          status: res.statusCode,
          durationMs: Date.now() - started,
          sessionId: params.sessionId,
        });
        return;
      }
      sendError(res, 404, 'NOT_FOUND', 'Route not found', requestId);
    } catch (error) {
      if (error instanceof ApiError) {
        sendError(res, error.status, error.code, error.message, requestId, error.details);
      } else {
        logger.error('Unhandled error', { requestId, message: (error as Error).message });
        sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error', requestId);
      }
      logger.request({
        requestId,
        method,
        route: pathname,
        status: res.statusCode,
        durationMs: Date.now() - started,
        errorCode: error instanceof ApiError ? error.code : 'INTERNAL_ERROR',
      });
    }
  };
}

export async function seedActiveCatalog(env: BackendEnv): Promise<void> {
  const adapter = createDefaultInMemoryCatalogAdapter();
  const bundle = adapter.getEventBundle({ catalogVersion: env.eventCatalogVersion });
  const metadata = adapter.getMetadata(env.eventCatalogVersion);
  const contentHash = computeContentHash(JSON.stringify(bundle));
  const db = getPool(env.databaseUrl);
  await catalogRepo.upsertCatalogVersion(db, {
    catalogVersion: env.eventCatalogVersion,
    contentHash,
    status: 'active',
    metadata: metadata as unknown as Record<string, unknown>,
    bundle,
  });
}
