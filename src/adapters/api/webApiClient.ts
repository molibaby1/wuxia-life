/// <reference types="vite/client" />
import type { SessionProgressionPayload } from '../../contracts/sessionProgression';
import { webPlatformStorage } from '../platform/webPlatformStorage';

export type ApiClientErrorCategory =
  | 'auth'
  | 'validation'
  | 'conflict'
  | 'not_found'
  | 'server'
  | 'network';

export class WebApiClientError extends Error {
  readonly category: ApiClientErrorCategory;
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    category: ApiClientErrorCategory,
    code: string,
    message: string,
    status: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'WebApiClientError';
    this.category = category;
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function categorize(status: number): ApiClientErrorCategory {
  if (status === 401 || status === 403) return 'auth';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status >= 500) return 'server';
  return 'validation';
}

export interface SaveSlotDto {
  slotIndex: number;
  slotId: string;
  label: string;
  occupied: boolean;
  slotVersion?: number;
  updatedAt?: string;
  snapshotId?: string;
  age?: number;
  terminal?: boolean;
}

export interface SessionStartResponse extends SessionProgressionPayload {
  sessionId: string;
  sessionToken: string;
  slot: { id: string; slotIndex: number; version: number; snapshotId: string | null };
  snapshot: { id: string; contentHash: string };
}

export type ChoiceResponse = SessionProgressionPayload & {
  slotVersion: number;
  snapshotId: string;
  contentHash?: string;
  feedback?: { summary?: string };
};

export class WebApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    init: RequestInit & { deviceToken?: string; sessionToken?: string } = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (init.deviceToken) headers.set('X-Device-Token', init.deviceToken);
    if (init.sessionToken) headers.set('X-Session-Token', init.sessionToken);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    } catch {
      throw new WebApiClientError('network', 'NETWORK_ERROR', '无法连接服务器', 0);
    }
    const body = (await response.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string; details?: Record<string, unknown> };
    };
    if (!response.ok) {
      const code = body.error?.code ?? 'UNKNOWN';
      const message = body.error?.message ?? '请求失败';
      throw new WebApiClientError(
        categorize(response.status),
        code,
        message,
        response.status,
        body.error?.details,
      );
    }
    return body as T;
  }

  async bootstrapDevice(existingToken?: string | null): Promise<string> {
    const body = await this.request<{ deviceToken: string }>('/v1/devices/bootstrap', {
      method: 'POST',
      body: JSON.stringify(existingToken ? { deviceToken: existingToken } : {}),
    });
    webPlatformStorage.setDeviceToken(body.deviceToken);
    return body.deviceToken;
  }

  async ensureDeviceToken(): Promise<string> {
    const existing = webPlatformStorage.getDeviceToken();
    return this.bootstrapDevice(existing);
  }

  async listSaves(deviceToken: string): Promise<SaveSlotDto[]> {
    const body = await this.request<{ slots: SaveSlotDto[] }>('/v1/saves', {
      method: 'GET',
      deviceToken,
    });
    return body.slots;
  }

  async createSession(params: {
    deviceToken: string;
    slotIndex: number;
    playerName: string;
    gender: 'male' | 'female';
    confirmOverwrite?: boolean;
  }): Promise<SessionStartResponse> {
    const body = await this.request<SessionStartResponse>('/v1/sessions', {
      method: 'POST',
      deviceToken: params.deviceToken,
      body: JSON.stringify({
        slotIndex: params.slotIndex,
        playerName: params.playerName,
        gender: params.gender,
        sourcePlatform: 'web-browser',
        confirmOverwrite: params.confirmOverwrite,
      }),
    });
    webPlatformStorage.setSessionAuth(body.sessionId, body.sessionToken);
    return body;
  }

  async restoreSession(deviceToken: string, slotIndex: number): Promise<SessionStartResponse> {
    const body = await this.request<SessionStartResponse>('/v1/sessions/restore', {
      method: 'POST',
      deviceToken,
      body: JSON.stringify({ slotIndex }),
    });
    webPlatformStorage.setSessionAuth(body.sessionId, body.sessionToken);
    return body;
  }

  async executeChoice(params: {
    deviceToken: string;
    sessionId: string;
    sessionToken: string;
    expectedSlotVersion: number;
    expectedSnapshotId: string;
    eventId: string;
    choiceId: string;
  }): Promise<ChoiceResponse> {
    return this.request<ChoiceResponse>('/v1/sessions/' + params.sessionId + '/choices', {
      method: 'POST',
      deviceToken: params.deviceToken,
      sessionToken: params.sessionToken,
      body: JSON.stringify({
        expectedSlotVersion: params.expectedSlotVersion,
        expectedSnapshotId: params.expectedSnapshotId,
        eventId: params.eventId,
        choiceId: params.choiceId,
      }),
    });
  }

  async executeActiveAction(params: {
    deviceToken: string;
    sessionId: string;
    sessionToken: string;
    expectedSlotVersion: number;
    expectedSnapshotId: string;
    actionId: string;
  }): Promise<SessionProgressionPayload> {
    return this.request<SessionProgressionPayload>(
      '/v1/sessions/' + params.sessionId + '/active-action',
      {
        method: 'POST',
        deviceToken: params.deviceToken,
        sessionToken: params.sessionToken,
        body: JSON.stringify({
          expectedSlotVersion: params.expectedSlotVersion,
          expectedSnapshotId: params.expectedSnapshotId,
          actionId: params.actionId,
        }),
      },
    );
  }

  async acknowledgeProgression(params: {
    deviceToken: string;
    sessionId: string;
    sessionToken: string;
    expectedSlotVersion: number;
    expectedSnapshotId: string;
    ackKind: 'action_summary' | 'disturbance';
  }): Promise<SessionProgressionPayload> {
    return this.request<SessionProgressionPayload>(
      '/v1/sessions/' + params.sessionId + '/progression-ack',
      {
        method: 'POST',
        deviceToken: params.deviceToken,
        sessionToken: params.sessionToken,
        body: JSON.stringify({
          expectedSlotVersion: params.expectedSlotVersion,
          expectedSnapshotId: params.expectedSnapshotId,
          ackKind: params.ackKind,
        }),
      },
    );
  }

  async manualSave(params: {
    deviceToken: string;
    sessionId: string;
    sessionToken: string;
    expectedSlotVersion: number;
    expectedSnapshotId: string;
  }) {
    return this.request('/v1/sessions/' + params.sessionId + '/save', {
      method: 'POST',
      deviceToken: params.deviceToken,
      sessionToken: params.sessionToken,
      body: JSON.stringify({
        expectedSlotVersion: params.expectedSlotVersion,
        expectedSnapshotId: params.expectedSnapshotId,
      }),
    });
  }

  async healthReady(): Promise<boolean> {
    try {
      await this.request('/health/ready', { method: 'GET' });
      return true;
    } catch {
      return false;
    }
  }
}

export function createWebApiClient(): WebApiClient | null {
  const baseUrl = import.meta.env.VITE_P6B_API_URL?.trim();
  if (!baseUrl) return null;
  return new WebApiClient(baseUrl.replace(/\/$/, ''));
}
