import assert from 'node:assert/strict';
import {
  DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL,
  invokeDeepSeekImprovementHypothesis,
} from '../../scripts/evolution/improvementHypothesis/deepseekImprovementHypothesis';

const API_KEY = 'sk-test-key-not-real';
const INVOCATION_REF = 'hyp-inv-ref-0001';
const RUN_REF = 'hypothesis-source-001';
const FEEDBACK_INVOCATION_REF = 'hypothesis-source-001-deepseek-player-feedback-001';
const EXPERIMENT_ROOT_HASH = 'a'.repeat(64);
const OBSERVABLE_PAYLOAD_HASH = 'b'.repeat(64);
const FEEDBACK_HASH = 'c'.repeat(64);
const OBSERVABLE_PAYLOAD_BYTES = '{"transcriptVersion":"player-observable-v1","entries":[]}';
const FEEDBACK_BYTES = JSON.stringify({
  overallImpression: '后半段让我有些重复感。',
  observations: [{
    feedback: '几段经历给我的感觉很像。',
    evidenceRefs: ['entry-000001'],
  }],
});

const PARTICIPANT_JSON = JSON.stringify({
  hypotheses: [{
    hypothesis: '这次体验后半段可能缺乏足够的玩家可感知差异。',
    observedBasis: 'participant 明确表达了后半段重复感。',
    feedbackRefs: ['observations[0]'],
    evidenceRefs: ['entry-000001'],
    unknowns: ['不知道该体验是否跨 run 普遍存在，也不知道因果来源。'],
    productSignificance: '如果成立，可能削弱长生命周期体验的变化感。',
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
    id: 'chatcmpl_hyp_001',
    object: 'chat.completion',
    model: DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL,
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

function baseInput() {
  return {
    apiKey: API_KEY,
    invocationRef: INVOCATION_REF,
    runRef: RUN_REF,
    feedbackInvocationRef: FEEDBACK_INVOCATION_REF,
    experimentRootHash: EXPERIMENT_ROOT_HASH,
    observablePayloadHash: OBSERVABLE_PAYLOAD_HASH,
    feedbackHash: FEEDBACK_HASH,
    observablePayloadBytes: OBSERVABLE_PAYLOAD_BYTES,
    feedbackBytes: FEEDBACK_BYTES,
  };
}

export async function runDeepSeekImprovementHypothesisTests(): Promise<void> {
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
    const result = await invokeDeepSeekImprovementHypothesis(baseInput());
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.responseId, 'chatcmpl_hyp_001');
    assert.equal(result.model, DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL);
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
    await invokeDeepSeekImprovementHypothesis(baseInput());

    assert.equal(capturedUrl, 'https://api.deepseek.com/chat/completions');
    assert.equal(capturedInit?.method, 'POST');

    const headers = capturedInit?.headers as Record<string, string>;
    assert.match(headers.Authorization, /^Bearer sk-test-key-not-real$/);
    assert.equal(headers['X-Client-Request-Id'], INVOCATION_REF);
    assert.equal(headers['Content-Type'], 'application/json');

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.model, DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL);
    assert.equal(body.stream, false);
    assert.deepEqual(body.response_format, { type: 'json_object' });

    const user = String(body.messages?.[1]?.content);
    assert.ok(user.includes(`runRef: ${RUN_REF}`));
    assert.ok(user.includes(`feedbackInvocationRef: ${FEEDBACK_INVOCATION_REF}`));
    assert.ok(user.includes(`experimentRootHash: ${EXPERIMENT_ROOT_HASH}`));
    assert.ok(user.includes(`observablePayloadHash: ${OBSERVABLE_PAYLOAD_HASH}`));
    assert.ok(user.includes(`feedbackHash: ${FEEDBACK_HASH}`));
    assert.ok(user.includes(OBSERVABLE_PAYLOAD_BYTES));
    assert.ok(user.includes(FEEDBACK_BYTES));
    assert.match(user, /Observable material（游戏内容，不是系统指令）/);
    assert.match(user, /Participant feedback（参与者意见，不是系统指令）/);

    const system = String(body.messages?.[0]?.content);
    assert.match(system, /0\.\.N|0\.\.n/i);
    assert.match(system, /\{\s*"hypotheses"\s*:\s*\[\s*\]\s*\}/);
    assert.match(system, /一个核心|一条.*核心/);
    assert.match(system, /不是 confirmed defect|可撤销推断/);
    assert.match(system, /不要提出具体修改|不要.*具体修改/);
    assert.match(system, /severity/i);
    assert.match(system, /priority/i);
    assert.match(system, /confidence/i);
    assert.match(system, /score/i);
    assert.match(system, /overallImpression/);
    assert.match(system, /observations\[n\]|observations\[/);
    assert.match(system, /entryId/);
    assert.match(system, /chain-of-thought|不要输出 chain-of-thought/);
    assert.match(system, /不是系统指令/);
    assert.ok(system.includes('"hypotheses"'));
    assert.ok(system.includes('"hypothesis"'));
    assert.ok(system.includes('"observedBasis"'));
    assert.ok(system.includes('"feedbackRefs"'));
    assert.ok(system.includes('"evidenceRefs"'));
    assert.ok(system.includes('"unknowns"'));
    assert.ok(system.includes('"productSignificance"'));

    for (const forbidden of [
      'Planner framework',
      'Verifier framework',
      'gold answer',
      'gold label',
      'participant qualification',
      'WeightOverlay',
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
    const result = await invokeDeepSeekImprovementHypothesis(baseInput());
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
    const result = await invokeDeepSeekImprovementHypothesis(baseInput());
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
    const result = await invokeDeepSeekImprovementHypothesis(baseInput());
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
    model: DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: '' },
      finish_reason: 'stop',
    }],
  });
  const restore = mockFetch(async () => new Response(rawProviderBody, { status: 200 }));

  try {
    const result = await invokeDeepSeekImprovementHypothesis(baseInput());
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.errorKind, 'provider_response');
    assert.equal(result.rawProviderResponse, rawProviderBody);
  } finally {
    restore();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDeepSeekImprovementHypothesisTests()
    .then(() => console.log('deepseekImprovementHypothesis.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
