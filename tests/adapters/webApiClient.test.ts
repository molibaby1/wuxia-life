import { WebApiClient, WebApiClientError } from '../../src/adapters/api/webApiClient';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export async function runWebApiClientTests(): Promise<void> {
  const error = new WebApiClientError('conflict', 'STALE_SLOT_VERSION', 'stale', 409, {
    currentSlotVersion: 2,
  });
  assert(error.category === 'conflict', 'conflict category');
  assert(error.status === 409, 'status preserved');

  const originalFetch = globalThis.fetch;
  const client = new WebApiClient('https://api.example.test');
  const responsePayload = { sessionPhase: 'active_planning' };
  let requestUrl = '';
  let requestInit: RequestInit | undefined;
  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestInit = init;
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    const response = await client.executeMarketStallAction({
      deviceToken: 'device-token',
      sessionId: 'session-id',
      sessionToken: 'session-token',
      expectedSlotVersion: 4,
      expectedSnapshotId: 'snapshot-id',
      operation: 'attempt',
    });
    assert(requestUrl === 'https://api.example.test/v1/sessions/session-id/market-stall-actions', 'market stall action route');
    assert(requestInit?.method === 'POST', 'market stall action method');
    const headers = new Headers(requestInit?.headers);
    assert(headers.get('X-Device-Token') === 'device-token', 'device token header');
    assert(headers.get('X-Session-Token') === 'session-token', 'session token header');
    assert(
      requestInit?.body === JSON.stringify({
        expectedSlotVersion: 4,
        expectedSnapshotId: 'snapshot-id',
        operation: 'attempt',
      }),
      'market stall action request body',
    );
    assert(response.sessionPhase === 'active_planning', 'market stall action response');

    requestUrl = '';
    requestInit = undefined;
    globalThis.fetch = async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({ slotVersion: 9, snapshotId: 'snapshot-next' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    const discarded = await client.discardLegacyProgression({
      deviceToken: 'device-token',
      slotIndex: 2,
      expectedSlotVersion: 8,
      expectedSnapshotId: 'snapshot-old',
    });
    assert(
      requestUrl === 'https://api.example.test/v1/saves/2/legacy-progression-discard',
      'legacy progression discard route',
    );
    assert(requestInit?.method === 'POST', 'legacy progression discard method');
    assert(
      requestInit?.body === JSON.stringify({
        expectedSlotVersion: 8,
        expectedSnapshotId: 'snapshot-old',
      }),
      'legacy progression discard body matches the closed request schema',
    );
    assert(discarded.slotVersion === 9 && discarded.snapshotId === 'snapshot-next', 'discard CAS response');

    for (const [status, code] of [
      [409, 'PROGRESSION_CHECKPOINT_LEGACY_UNKNOWN'],
      [422, 'PROGRESSION_CHECKPOINT_INVALID'],
    ] as const) {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: { code, message: 'checkpoint status' } }), {
          status,
          headers: { 'Content-Type': 'application/json' },
        });
      let received: unknown;
      try {
        await client.restoreSession('device-token', 2);
      } catch (cause) {
        received = cause;
      }
      if (!(received instanceof WebApiClientError)) {
        throw new Error(`${code} is consumed as WebApiClientError`);
      }
      assert(received.code === code && received.status === status, `${code} and HTTP status are preserved`);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void runWebApiClientTests().then(() => console.log('webApiClient tests passed'));
}
