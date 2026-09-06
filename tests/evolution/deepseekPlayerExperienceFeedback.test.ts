import assert from 'node:assert/strict';
import {
  buildParticipantInstructions,
  buildPlayerExperienceFeedbackPrompt,
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
  await testCritiqueAlignmentBoundary();
  await testExperienceReviewLens();
  await testWeakExperiencePromptBoundary();
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

async function testCritiqueAlignmentBoundary(): Promise<void> {
  const system = buildParticipantInstructions();

  // Role: reviewer, not diary author / summary-only.
  assert.match(system, /审查/);
  assert.match(system, /主动审查|主动寻找/);
  assert.match(system, /而不是只做|而不是/);

  // Must actively look for weakness signals.
  assert.match(system, /重复/);
  assert.match(system, /反馈缺失|缺少.*影响/);
  assert.match(system, /期待落差/);
  assert.match(system, /参与感/);

  // High recall, low-confidence allowed; empty observations allowed.
  assert.match(system, /玩家可能感觉/);
  assert.match(system, /observations/);
  assert.match(system, /为空数组/);
  assert.match(system, /不要编造/);

  // Role boundary: forbid cause analysis, fix suggestions, scores.
  assert.match(system, /不要.*原因分析/);
  assert.match(system, /不要.*修改建议/);
  assert.match(system, /不要.*评分/);
  assert.match(system, /不要.*score/i);
  assert.match(system, /不要.*置信度/);
  assert.match(system, /不要.*系统设计失败/);
}

async function testExperienceReviewLens(): Promise<void> {
  const system = buildParticipantInstructions();

  // Lens present as reference perspectives.
  assert.match(system, /Experience Review Lens/);
  assert.match(system, /参考/);
  assert.match(system, /不是固定分类/);
  assert.match(system, /不要求逐项输出|不要求每次/);

  // All eight lenses named (English anchors).
  for (const lens of [
    'Feedback Timeliness',
    'Milestone Significance',
    'Causal Continuity',
    'Growth Experience',
    'Choice Impact',
    'Pacing and Rhythm',
    'Relationship Continuity',
    'Immersion',
  ]) {
    assert.match(system, new RegExp(lens.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  // Other important issues still allowed in free text; empty observations allowed.
  assert.match(system, /其他重要体验问题|自由文本/);
  assert.match(system, /为空数组/);

  // Role boundary retained: experience observation + evidence refs, no diagnosis/solution.
  assert.match(system, /entryId/);
  assert.match(system, /不要.*原因分析/);
  assert.match(system, /不要.*修改建议/);
  assert.match(system, /不要.*score/i);
}

async function testWeakExperiencePromptBoundary(): Promise<void> {
  const weakPayloadBytes = JSON.stringify({
    transcriptVersion: 'player-observable-v1',
    entries: [
      { entryId: 'entry-000001', kind: 'story_event', title: '初入江湖', body: '你拜入山门，师父许诺传你绝学。' },
      { entryId: 'entry-000002', kind: 'story_event', title: '苦修三年', body: '每日挑水劈柴，节奏与昨日相似。' },
      { entryId: 'entry-000003', kind: 'story_event', title: '再苦修两年', body: '每日挑水劈柴，节奏与昨日相似。' },
      { entryId: 'entry-000004', kind: 'choice_event', title: '抉择', body: '你选择下山行侠，但此后无人再提此事。' },
    ],
  });

  const prompt = buildPlayerExperienceFeedbackPrompt(weakPayloadBytes);

  // Prompt must embed the weak mock experience verbatim.
  assert.equal(prompt.includes(weakPayloadBytes), true);

  // Instructions must allow reporting repetition / missing feedback / expectation gap.
  assert.match(prompt, /重复/);
  assert.match(prompt, /反馈缺失|缺少.*影响/);
  assert.match(prompt, /期待落差/);

  // Instructions must prohibit cause analysis, fix suggestions, and scores.
  assert.match(prompt, /不要.*原因分析/);
  assert.match(prompt, /不要.*修改建议/);
  assert.match(prompt, /不要.*score/i);
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
