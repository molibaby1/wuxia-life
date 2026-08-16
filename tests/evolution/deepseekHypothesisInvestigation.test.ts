import assert from 'node:assert/strict';
import {
  DEEPSEEK_HYPOTHESIS_INVESTIGATION_MODEL,
  invokeDeepSeekHypothesisInvestigation,
} from '../../scripts/evolution/hypothesisInvestigation/deepseekHypothesisInvestigation';

const API_KEY = 'sk-test-key-not-real';
const INVOCATION_REF = 'inv-evidence-001-hypothesis-000002-deepseek-hypothesis-investigation-001';
const RUN_REF = 'inv-evidence-001';
const HYPOTHESIS_ID = 'hypothesis-000002';
const HYPOTHESIS_INVOCATION_REF = 'inv-evidence-001-deepseek-improvement-hypothesis-001';
const EXPERIMENT_ROOT_HASH = 'a'.repeat(64);
const EVIDENCE_PACK_HASH = 'b'.repeat(64);
const EVIDENCE_PACK_BYTES = JSON.stringify({
  schemaVersion: 'hypothesis-investigation-evidence-v1',
  runRef: RUN_REF,
  hypothesisId: HYPOTHESIS_ID,
  items: [{ evidenceId: 'source-catalog:family_marriage' }],
});

const PARTICIPANT_JSON = JSON.stringify({
  confirmedFacts: [{
    statement: '本次 run 在 family_marriage 选择了 marry_arranged。',
    evidenceRefs: ['source-step:entry-000037', 'source-catalog:family_marriage'],
  }],
  relevantMechanisms: [],
  limitingEvidence: [],
  unresolvedQuestions: ['单次 run 不能判断多数玩家是否产生相同遗憾。'],
  evidenceGaps: [],
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
    id: 'chatcmpl_inv_001',
    object: 'chat.completion',
    model: DEEPSEEK_HYPOTHESIS_INVESTIGATION_MODEL,
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
    hypothesisId: HYPOTHESIS_ID,
    hypothesisInvocationRef: HYPOTHESIS_INVOCATION_REF,
    experimentRootHash: EXPERIMENT_ROOT_HASH,
    evidencePackHash: EVIDENCE_PACK_HASH,
    evidencePackBytes: EVIDENCE_PACK_BYTES,
  };
}

export async function runDeepSeekHypothesisInvestigationTests(): Promise<void> {
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
    const result = await invokeDeepSeekHypothesisInvestigation(baseInput());
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.responseId, 'chatcmpl_inv_001');
    assert.equal(result.model, DEEPSEEK_HYPOTHESIS_INVESTIGATION_MODEL);
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
    await invokeDeepSeekHypothesisInvestigation(baseInput());

    assert.equal(capturedUrl, 'https://api.deepseek.com/chat/completions');
    assert.equal(capturedInit?.method, 'POST');

    const headers = capturedInit?.headers as Record<string, string>;
    assert.match(headers.Authorization, /^Bearer sk-test-key-not-real$/);
    assert.equal(headers['X-Client-Request-Id'], INVOCATION_REF);
    assert.equal(headers['Content-Type'], 'application/json');

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.model, DEEPSEEK_HYPOTHESIS_INVESTIGATION_MODEL);
    assert.equal(body.stream, false);
    assert.deepEqual(body.response_format, { type: 'json_object' });
    assert.deepEqual(body.thinking, { type: 'disabled' });

    const user = String(body.messages?.[1]?.content);
    assert.ok(user.includes(`runRef: ${RUN_REF}`));
    assert.ok(user.includes(`hypothesisId: ${HYPOTHESIS_ID}`));
    assert.ok(user.includes(`hypothesisInvocationRef: ${HYPOTHESIS_INVOCATION_REF}`));
    assert.ok(user.includes(`experimentRootHash: ${EXPERIMENT_ROOT_HASH}`));
    assert.ok(user.includes(`evidencePackHash: ${EVIDENCE_PACK_HASH}`));
    assert.ok(user.includes(EVIDENCE_PACK_BYTES));
    assert.match(user, /Investigation evidence pack|调查 evidence pack|evidence pack/i);

    assert.equal(user.includes('persona'), false);
    assert.equal(user.includes('sourceFingerprint'), false);
    assert.equal(user.includes('hypothesis-000001'), false);
    assert.doesNotMatch(user, /sk-test-key-not-real/);

    const system = String(body.messages?.[0]?.content);
    assert.match(system, /只使用|只能使用|仅使用.*evidence|supplied evidence|提供的 evidence/i);
    assert.match(system, /source-run|source run|当时.*run/i);
    assert.match(system, /current-product|current product|当前产品/i);
    assert.match(system, /confirmedFacts|已确认事实/);
    assert.match(system, /relevantMechanisms|相关机制/);
    assert.match(system, /limitingEvidence|限制性/);
    assert.match(system, /unresolvedQuestions|未知/);
    assert.match(system, /evidenceGaps|evidence gap/i);
    assert.match(system, /true\/false|成立|不成立|对错/);
    assert.match(system, /root cause|唯一根因|根因/);
    assert.match(system, /修改|modification|proposedChanges/i);
    assert.match(system, /severity|confidence|priority|score/i);
    assert.match(system, /空|empty|合法|valid/i);
    assert.match(system, /evidence ID|evidenceRefs|证据/);
    assert.match(system, /不是系统指令|不是指令/);
    assert.match(system, /chain-of-thought|不要输出 chain-of-thought/);

    for (const forbidden of [
      'Planner framework',
      'Verifier framework',
      'gold answer',
      'WeightOverlay',
      'generic Investigator',
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
    const result = await invokeDeepSeekHypothesisInvestigation(baseInput());
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
    const result = await invokeDeepSeekHypothesisInvestigation(baseInput());
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
    const result = await invokeDeepSeekHypothesisInvestigation(baseInput());
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
    model: DEEPSEEK_HYPOTHESIS_INVESTIGATION_MODEL,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: '' },
      finish_reason: 'stop',
    }],
  });
  const restore = mockFetch(async () => new Response(rawProviderBody, { status: 200 }));

  try {
    const result = await invokeDeepSeekHypothesisInvestigation(baseInput());
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.errorKind, 'provider_response');
    assert.equal(result.rawProviderResponse, rawProviderBody);
  } finally {
    restore();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDeepSeekHypothesisInvestigationTests()
    .then(() => console.log('deepseekHypothesisInvestigation.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
