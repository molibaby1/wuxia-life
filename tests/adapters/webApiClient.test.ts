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
  } finally {
    globalThis.fetch = originalFetch;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void runWebApiClientTests().then(() => console.log('webApiClient tests passed'));
}
