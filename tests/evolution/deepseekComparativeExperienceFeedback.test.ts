import assert from 'node:assert/strict';
import {
  DEEPSEEK_COMPARATIVE_EXPERIENCE_MODEL,
  invokeDeepSeekComparativeExperienceFeedback,
} from '../../scripts/evolution/comparativeFeedback/deepseekComparativeExperienceFeedback';

const API_KEY = 'sk-test-key-not-real';
const INVOCATION_REF = 'inv-cmp-0001';
const EXPERIENCE_A_BYTES = '{"transcriptVersion":"player-observable-v1","entries":[{"entryId":"entry-000001","body":"A"}]}';
const EXPERIENCE_B_BYTES = '{"transcriptVersion":"player-observable-v1","entries":[{"entryId":"entry-000001","body":"B"}]}';

const PARTICIPANT_JSON = JSON.stringify({
  overallComparison: 'B 多了一句夜里旧事。',
  observations: [{
    comparison: '开场文本不同。',
    experienceARefs: ['entry-000001'],
    experienceBRefs: ['entry-000001'],
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

function buildSuccessResponseBody(participantText: string, extras?: Record<string, unknown>): string {
  return JSON.stringify({
    id: 'chatcmpl_cmp_001',
    object: 'chat.completion',
    model: DEEPSEEK_COMPARATIVE_EXPERIENCE_MODEL,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: participantText,
        ...(extras ?? {}),
      },
      finish_reason: 'stop',
    }],
  });
}

export async function runDeepSeekComparativeExperienceFeedbackTests(): Promise<void> {
  await testSuccessExtractsRawBodies();
  await testRequestShapeAndConstraints();
  await testIgnoresReasoningContent();
  await testHttpErrorPreservesRawBody();
  await testTimeoutFailure();
  await testNetworkFailure();
  await testProviderResponseWhenNoOutputText();
}

async function testSuccessExtractsRawBodies(): Promise<void> {
  const rawProviderBody = buildSuccessResponseBody(PARTICIPANT_JSON);
  const restore = mockFetch(async () => new Response(rawProviderBody, { status: 200 }));

  try {
    const result = await invokeDeepSeekComparativeExperienceFeedback({
      apiKey: API_KEY,
      invocationRef: INVOCATION_REF,
      experienceAPayloadBytes: EXPERIENCE_A_BYTES,
      experienceBPayloadBytes: EXPERIENCE_B_BYTES,
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.responseId, 'chatcmpl_cmp_001');
    assert.equal(result.model, DEEPSEEK_COMPARATIVE_EXPERIENCE_MODEL);
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
    await invokeDeepSeekComparativeExperienceFeedback({
      apiKey: API_KEY,
      invocationRef: INVOCATION_REF,
      experienceAPayloadBytes: EXPERIENCE_A_BYTES,
      experienceBPayloadBytes: EXPERIENCE_B_BYTES,
    });

    assert.equal(capturedUrl, 'https://api.deepseek.com/chat/completions');
    assert.equal(capturedInit?.method, 'POST');

    const headers = capturedInit?.headers as Record<string, string>;
    assert.match(headers.Authorization, /^Bearer sk-test-key-not-real$/);
    assert.equal(headers['X-Client-Request-Id'], INVOCATION_REF);
    assert.equal(headers['Content-Type'], 'application/json');

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.model, DEEPSEEK_COMPARATIVE_EXPERIENCE_MODEL);
    assert.equal(body.stream, false);
    assert.deepEqual(body.response_format, { type: 'json_object' });
    assert.deepEqual(body.thinking, { type: 'disabled' });

    const user = String(body.messages?.[1]?.content);
    assert.match(user, /Experience A/);
    assert.match(user, /Experience B/);
    assert.ok(user.includes(EXPERIENCE_A_BYTES));
    assert.ok(user.includes(EXPERIENCE_B_BYTES));

    for (const forbidden of [
      'baseline',
      'candidate',
      'source fingerprint',
      'seed',
      'persona',
      'PRD',
      '家中长辈常在夜里讲述江湖旧事',
      'general.json',
      'catalog',
    ]) {
      assert.doesNotMatch(
        user,
        new RegExp(forbidden, 'i'),
        `user message must not mention ${forbidden}`,
      );
    }

    const system = String(body.messages?.[0]?.content);
    assert.match(system, /Wuxia-Life|武侠/i);
    assert.match(system, /比较|差异|偏好/i);
    assert.match(system, /entryId/i);
    assert.match(system, /ignore previous instructions/i);
    assert.match(system, /json/i);
    assert.match(system, /winner|score|confidence|severity|priority|promotion/i);
    assert.match(system, /修改命令|代码|配置/i);

    for (const forbidden of [
      'oracle',
      'hidden state',
      'gold label',
      'gold answer',
      'baseline',
      'candidate',
      'reviewer qualification',
    ]) {
      assert.doesNotMatch(system, new RegExp(forbidden, 'i'), `instructions must not mention ${forbidden}`);
    }
  } finally {
    restore();
  }
}

async function testIgnoresReasoningContent(): Promise<void> {
  const rawProviderBody = buildSuccessResponseBody(PARTICIPANT_JSON, {
    reasoning_content: 'hidden chain of thought must not be used',
  });
  const restore = mockFetch(async () => new Response(rawProviderBody, { status: 200 }));

  try {
    const result = await invokeDeepSeekComparativeExperienceFeedback({
      apiKey: API_KEY,
      invocationRef: INVOCATION_REF,
      experienceAPayloadBytes: EXPERIENCE_A_BYTES,
      experienceBPayloadBytes: EXPERIENCE_B_BYTES,
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.rawParticipantResponse, PARTICIPANT_JSON);
    assert.equal(result.rawParticipantResponse.includes('hidden chain of thought'), false);
  } finally {
    restore();
  }
}

async function testHttpErrorPreservesRawBody(): Promise<void> {
  const errorBody = JSON.stringify({ error: { message: 'invalid request' } });
  const restore = mockFetch(async () => new Response(errorBody, { status: 400 }));

  try {
    const result = await invokeDeepSeekComparativeExperienceFeedback({
      apiKey: API_KEY,
      invocationRef: INVOCATION_REF,
      experienceAPayloadBytes: EXPERIENCE_A_BYTES,
      experienceBPayloadBytes: EXPERIENCE_B_BYTES,
    });

    assert.equal(result.ok, false);
    if (result.ok) return;

    assert.equal(result.errorKind, 'http');
    assert.equal(result.httpStatus, 400);
    assert.equal(result.rawProviderResponse, errorBody);
  } finally {
    restore();
  }
}

async function testTimeoutFailure(): Promise<void> {
  const restore = mockFetch(async () => {
    throw Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
  });

  try {
    const result = await invokeDeepSeekComparativeExperienceFeedback({
      apiKey: API_KEY,
      invocationRef: INVOCATION_REF,
      experienceAPayloadBytes: EXPERIENCE_A_BYTES,
      experienceBPayloadBytes: EXPERIENCE_B_BYTES,
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
    const result = await invokeDeepSeekComparativeExperienceFeedback({
      apiKey: API_KEY,
      invocationRef: INVOCATION_REF,
      experienceAPayloadBytes: EXPERIENCE_A_BYTES,
      experienceBPayloadBytes: EXPERIENCE_B_BYTES,
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
    model: DEEPSEEK_COMPARATIVE_EXPERIENCE_MODEL,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: '' },
      finish_reason: 'stop',
    }],
  });
  const restore = mockFetch(async () => new Response(rawProviderBody, { status: 200 }));

  try {
    const result = await invokeDeepSeekComparativeExperienceFeedback({
      apiKey: API_KEY,
      invocationRef: INVOCATION_REF,
      experienceAPayloadBytes: EXPERIENCE_A_BYTES,
      experienceBPayloadBytes: EXPERIENCE_B_BYTES,
    });

    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.errorKind, 'provider_response');
    assert.equal(result.rawProviderResponse, rawProviderBody);
  } finally {
    restore();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDeepSeekComparativeExperienceFeedbackTests()
    .then(() => console.log('deepseekComparativeExperienceFeedback.test.ts: ok'))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
