import assert from 'node:assert/strict';
import {
  DEEPSEEK_PLAYER_EXPERIENCE_MODEL,
  invokeDeepSeekPlayerExperienceFeedback,
} from '../../scripts/evolution/externalFeedback/deepseekPlayerExperienceFeedback';

const API_KEY = 'sk-test-key-not-real';
const INVOCATION_REF = 'inv-ref-0001';
const OBSERVABLE_PAYLOAD_BYTES = '{"transcriptVersion":"player-observable-v1","entries":[]}';

const PARTICIPANT_JSON = JSON.stringify({
  overallImpression: '这段人生前期有期待，中段让我觉得重复。',
  observations: [{
    feedback: '连续几段经历让我觉得节奏很像。',
    evidenceRefs: ['entry-000001'],
  }],
});

function mockFetch(
  handler: (url: string, init?: RequestInit) => Promise<Response> | Response,
): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = handler as typeof fetch;
  return () => {
    globalThis.fetch = original;
  };
}

function buildSuccessResponseBody(participantText: string): string {
  return JSON.stringify({
    id: 'chatcmpl_test_001',
    object: 'chat.completion',
    model: DEEPSEEK_PLAYER_EXPERIENCE_MODEL,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: participantText,
      },
      finish_reason: 'stop',
    }],
  });
}

export async function runDeepSeekPlayerExperienceFeedbackTests(): Promise<void> {
  await testSuccessExtractsRawBodies();
  await testRequestShapeAndConstraints();
  await testHttpErrorPreservesRawBody();
  await testTimeoutFailure();
  await testNetworkFailure();
  await testProviderResponseWhenNoOutputText();
}

async function testSuccessExtractsRawBodies(): Promise<void> {
  const rawProviderBody = buildSuccessResponseBody(PARTICIPANT_JSON);
  const restore = mockFetch(async () => new Response(rawProviderBody, { status: 200 }));

  try {
    const result = await invokeDeepSeekPlayerExperienceFeedback({
      apiKey: API_KEY,
      invocationRef: INVOCATION_REF,
      observablePayloadBytes: OBSERVABLE_PAYLOAD_BYTES,
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.responseId, 'chatcmpl_test_001');
    assert.equal(result.model, DEEPSEEK_PLAYER_EXPERIENCE_MODEL);
    assert.equal(result.httpStatus, 200);
    assert.equal(result.rawProviderResponse, rawProviderBody);
    assert.equal(result.rawParticipantResponse, PARTICIPANT_JSON);
    assert.doesNotMatch(JSON.stringify(result), /sk-test-key-not-real/);
  } finally {
    restore();
  }
}

async function testRequestShapeAndConstraints(): Promise<void> {
  let capturedUrl = '';
  let capturedInit: RequestInit | undefined;

  const restore = mockFetch(async (url, init) => {
    capturedUrl = url;
    capturedInit = init;
    return new Response(buildSuccessResponseBody(PARTICIPANT_JSON), { status: 200 });
  });

  try {
    await invokeDeepSeekPlayerExperienceFeedback({
      apiKey: API_KEY,
      invocationRef: INVOCATION_REF,
      observablePayloadBytes: OBSERVABLE_PAYLOAD_BYTES,
    });

    assert.equal(capturedUrl, 'https://api.deepseek.com/chat/completions');
    assert.equal(capturedInit?.method, 'POST');

    const headers = capturedInit?.headers as Record<string, string>;
    assert.match(headers.Authorization, /^Bearer sk-test-key-not-real$/);
    assert.equal(headers['X-Client-Request-Id'], INVOCATION_REF);
    assert.equal(headers['Content-Type'], 'application/json');

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.model, DEEPSEEK_PLAYER_EXPERIENCE_MODEL);
    assert.equal(body.stream, false);
    assert.deepEqual(body.response_format, { type: 'json_object' });
    assert.equal(body.messages?.[1]?.content?.includes(OBSERVABLE_PAYLOAD_BYTES), true);

    const system = String(body.messages?.[0]?.content);
    assert.match(system, /Wuxia-Life|武侠/i);
    assert.match(system, /感受|体验/i);
    assert.match(system, /entryId/i);
    assert.match(system, /ignore previous instructions/i);
    assert.match(system, /json/i);

    for (const forbidden of [
      'oracle',
      'hidden state',
      'gold label',
      'gold answer',
      'policy data',
      'persona',
      'reviewer qualification',
    ]) {
      assert.doesNotMatch(system, new RegExp(forbidden, 'i'), `instructions must not mention ${forbidden}`);
    }
  } finally {
    restore();
  }
}

async function testHttpErrorPreservesRawBody(): Promise<void> {
  const errorBody = JSON.stringify({ error: { message: 'invalid request' } });
  const restore = mockFetch(async () => new Response(errorBody, { status: 400 }));

  try {
    const result = await invokeDeepSeekPlayerExperienceFeedback({
      apiKey: API_KEY,
      invocationRef: INVOCATION_REF,
      observablePayloadBytes: OBSERVABLE_PAYLOAD_BYTES,
    });

    assert.equal(result.ok, false);
    if (result.ok) return;

    assert.equal(result.errorKind, 'http');
    assert.equal(result.httpStatus, 400);
    assert.equal(result.rawProviderResponse, errorBody);
    assert.doesNotMatch(JSON.stringify(result), /sk-test-key-not-real/);
  } finally {
    restore();
  }
}

async function testTimeoutFailure(): Promise<void> {
  const restore = mockFetch(async () => {
    throw Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
  });

  try {
    const result = await invokeDeepSeekPlayerExperienceFeedback({
      apiKey: API_KEY,
      invocationRef: INVOCATION_REF,
      observablePayloadBytes: OBSERVABLE_PAYLOAD_BYTES,
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.errorKind, 'timeout');
  } finally {
    restore();
  }
}

async function testNetworkFailure(): Promise<void> {
  const restore = mockFetch(async () => {
    throw new TypeError('fetch failed');
  });

  try {
    const result = await invokeDeepSeekPlayerExperienceFeedback({
      apiKey: API_KEY,
      invocationRef: INVOCATION_REF,
      observablePayloadBytes: OBSERVABLE_PAYLOAD_BYTES,
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.errorKind, 'network');
  } finally {
    restore();
  }
}

async function testProviderResponseWhenNoOutputText(): Promise<void> {
  const rawProviderBody = JSON.stringify({
    id: 'chatcmpl_empty',
    object: 'chat.completion',
    model: DEEPSEEK_PLAYER_EXPERIENCE_MODEL,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: '',
      },
      finish_reason: 'stop',
    }],
  });

  const restore = mockFetch(async () => new Response(rawProviderBody, { status: 200 }));

  try {
    const result = await invokeDeepSeekPlayerExperienceFeedback({
      apiKey: API_KEY,
      invocationRef: INVOCATION_REF,
      observablePayloadBytes: OBSERVABLE_PAYLOAD_BYTES,
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.errorKind, 'provider_response');
    assert.equal(result.rawProviderResponse, rawProviderBody);
    assert.doesNotMatch(JSON.stringify(result), /overallImpression/);
  } finally {
    restore();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDeepSeekPlayerExperienceFeedbackTests()
    .then(() => console.log('deepseekPlayerExperienceFeedback.test.ts: ok'))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
