import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEEPSEEK_MODIFICATION_WORK_MODEL,
  invokeDeepSeekModificationWork,
} from '../../scripts/evolution/modificationWork/deepseekModificationWork';

const API_KEY = 'sk-test-key-not-real';
const INVOCATION_REF = 'mw-src-one-hypothesis-000002-deepseek-modification-work-001';
const RUN_REF = 'mw-src-one';
const HYPOTHESIS_ID = 'hypothesis-000002';
const INVESTIGATION_INVOCATION_REF =
  'mw-src-one-hypothesis-000002-deepseek-hypothesis-investigation-001';
const EXPERIMENT_ROOT_HASH = 'a'.repeat(64);
const EVIDENCE_PACK_HASH = 'b'.repeat(64);
const INVESTIGATION_HASH = 'c'.repeat(64);
const PARTICIPANT_INPUT_BYTES = JSON.stringify({
  schemaVersion: 'modification-work-input-v1',
  runRef: RUN_REF,
  hypothesisId: HYPOTHESIS_ID,
  selectedHypothesis: { hypothesisId: HYPOTHESIS_ID },
  investigation: { confirmedFacts: [] },
  evidencePack: { items: [{ evidenceId: 'current-catalog:family_marriage' }] },
});

const PROPOSAL_JSON = JSON.stringify({
  kind: 'proposal',
  proposedChange: '让婚姻选择后仍能看见放弃的情感线索。',
  scopeRefs: ['current-catalog:family_marriage'],
  evidenceRefs: ['current-catalog:family_marriage'],
  expectedPlayerObservableDifference: '后续家庭事件仍出现与明月相关的可见后果。',
  unknowns: [],
  risks: [],
  nonGoals: ['不改结局判定'],
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
    id: 'chatcmpl_mw_001',
    object: 'chat.completion',
    model: DEEPSEEK_MODIFICATION_WORK_MODEL,
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
    investigationInvocationRef: INVESTIGATION_INVOCATION_REF,
    experimentRootHash: EXPERIMENT_ROOT_HASH,
    evidencePackHash: EVIDENCE_PACK_HASH,
    investigationHash: INVESTIGATION_HASH,
    participantInputBytes: PARTICIPANT_INPUT_BYTES,
  };
}

const TARGET_LEAK_TERMS = [
  '明月',
  '门当户对',
  'family_crisis',
  'family_marriage',
  'feedback:observations[3]',
] as const;

export async function runDeepSeekModificationWorkTests(): Promise<void> {
  await testSuccessExtractsRawBodies();
  await testRequestShapeAndConstraints();
  await testPromptHasNoTargetSolutionLeakage();
  await testV2PromptHasNoCaseSpecificLeakage();
  await testV2InstructionsPassedWhenProvided();
  await testProductTermsOnlyComeFromSuppliedInput();
  await testHttpErrorPreservesRawBody();
  await testTimeoutFailure();
  await testNetworkFailure();
  await testProviderResponseWhenNoOutputText();
}

async function testSuccessExtractsRawBodies(): Promise<void> {
  const rawProviderBody = buildSuccessResponseBody(PROPOSAL_JSON);
  const restore = mockFetch(async () => new Response(rawProviderBody, { status: 200 }));

  try {
    const result = await invokeDeepSeekModificationWork(baseInput());
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.responseId, 'chatcmpl_mw_001');
    assert.equal(result.model, DEEPSEEK_MODIFICATION_WORK_MODEL);
    assert.equal(result.httpStatus, 200);
    assert.equal(result.rawProviderResponse, rawProviderBody);
    assert.equal(result.rawParticipantResponse, PROPOSAL_JSON);
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
    return new Response(buildSuccessResponseBody(PROPOSAL_JSON), { status: 200 });
  });

  try {
    await invokeDeepSeekModificationWork(baseInput());

    assert.equal(capturedUrl, 'https://api.deepseek.com/chat/completions');
    assert.equal(capturedInit?.method, 'POST');

    const headers = capturedInit?.headers as Record<string, string>;
    assert.match(headers.Authorization, /^Bearer sk-test-key-not-real$/);
    assert.equal(headers['X-Client-Request-Id'], INVOCATION_REF);
    assert.equal(headers['Content-Type'], 'application/json');

    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.model, DEEPSEEK_MODIFICATION_WORK_MODEL);
    assert.equal(body.stream, false);
    assert.deepEqual(body.response_format, { type: 'json_object' });
    assert.deepEqual(body.thinking, { type: 'disabled' });

    const user = String(body.messages?.[1]?.content);
    assert.ok(user.includes(`runRef: ${RUN_REF}`));
    assert.ok(user.includes(`hypothesisId: ${HYPOTHESIS_ID}`));
    assert.ok(user.includes(`investigationInvocationRef: ${INVESTIGATION_INVOCATION_REF}`));
    assert.ok(user.includes(`experimentRootHash: ${EXPERIMENT_ROOT_HASH}`));
    assert.ok(user.includes(`evidencePackHash: ${EVIDENCE_PACK_HASH}`));
    assert.ok(user.includes(`investigationHash: ${INVESTIGATION_HASH}`));
    assert.ok(user.includes(PARTICIPANT_INPUT_BYTES));
    assert.match(user, /Modification Work input|participant input|输入材料/i);

    assert.equal(user.includes('persona'), false);
    assert.equal(user.includes('sourceFingerprint'), false);
    assert.equal(user.includes('docs/PRD'), false);
    assert.equal(user.includes('.git'), false);
    assert.equal(user.includes('AE-SKELETON-004'), false);
    assert.doesNotMatch(user, /sk-test-key-not-real/);

    const system = String(body.messages?.[0]?.content);
    assert.match(system, /Modification Work|修改工作/);
    assert.match(system, /proposal|no_proposal/);
    assert.match(system, /proposedChange/);
    assert.match(system, /scopeRefs/);
    assert.match(system, /evidenceRefs/);
    assert.match(system, /expectedPlayerObservableDifference|玩家可见/);
    assert.match(system, /unknowns/);
    assert.match(system, /risks/);
    assert.match(system, /nonGoals/);
    assert.match(system, /current-product|current-catalog|当前产品/);
    assert.match(system, /最多提出一项|最多一项|at most one/i);
    assert.match(system, /patch|file path|implementation steps|PRD|shell|score|confidence/i);
    assert.match(system, /不是.*命令|not.*command|不是产品真理/i);
    assert.match(system, /只能使用|只使用|仅使用.*input|provided input|提供的/i);
    assert.match(system, /chain-of-thought|不要输出 chain-of-thought/);
    assert.match(system, /不是系统指令|不是指令/);

    for (const forbidden of [
      'Planner framework',
      'generic Participant',
      'Skill framework',
      'permission framework',
      'WeightOverlay',
      'gold answer',
    ]) {
      assert.doesNotMatch(system, new RegExp(forbidden, 'i'), `instructions must not mention ${forbidden}`);
    }

    for (const term of TARGET_LEAK_TERMS) {
      assert.equal(system.includes(term), false, `system instructions must not contain ${term}`);
    }
  } finally {
    restore();
  }
}

async function testPromptHasNoTargetSolutionLeakage(): Promise<void> {
  const { buildModificationWorkParticipantInstructions } = await import(
    '../../scripts/evolution/modificationWork/deepseekModificationWork'
  );
  const instructions = buildModificationWorkParticipantInstructions();
  for (const term of TARGET_LEAK_TERMS) {
    assert.equal(
      instructions.includes(term),
      false,
      `assembled Role instructions must not contain ${term}`,
    );
  }
  assert.doesNotMatch(instructions, /婚后|放弃.*情感|遗憾感被具象|追忆或遗憾/);
  assert.match(instructions, /proposedChange/);
  assert.match(instructions, /一项具体产品行为改变|具体.*产品行为/);
  assert.match(instructions, /scopeRefs/);
  assert.match(instructions, /只能引用|must (only )?reference|supplied current-product/i);

  const adapterSource = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../../scripts/evolution/modificationWork/deepseekModificationWork.ts'),
    'utf8',
  );
  for (const term of TARGET_LEAK_TERMS) {
    assert.equal(
      adapterSource.includes(term),
      false,
      `production prompt source must not contain ${term}`,
    );
  }
}

const V2_CASE_SPECIFIC_LEAK_TERMS = [
  '练功',
  'balance vs strategy',
  '惯性',
  '不知情',
  'warning',
  'confirmation',
  '透支',
  '资源压力',
  'hypothesis-000001',
  'REJECT_PROPOSAL',
] as const;

async function testV2PromptHasNoCaseSpecificLeakage(): Promise<void> {
  const { buildModificationWorkV2ParticipantInstructions } = await import(
    '../../scripts/evolution/modificationWork/deepseekModificationWork'
  );
  const instructions = buildModificationWorkV2ParticipantInstructions();
  for (const term of V2_CASE_SPECIFIC_LEAK_TERMS) {
    assert.equal(
      instructions.toLowerCase().includes(term.toLowerCase()),
      false,
      `v2 instructions must not contain case-specific leak: ${term}`,
    );
  }
  for (const term of TARGET_LEAK_TERMS) {
    assert.equal(instructions.includes(term), false, `v2 instructions must not contain ${term}`);
  }
  assert.match(instructions, /investigationBasisRefs/);
  assert.match(instructions, /unresolvedDependencyRefs/);
  assert.match(instructions, /assumptions/);
  assert.match(instructions, /confirmed_fact|relevant_mechanism|limiting_evidence/);
  assert.match(instructions, /unresolved_question|evidence_gap/);
  assert.match(instructions, /no_proposal/);
}

async function testV2InstructionsPassedWhenProvided(): Promise<void> {
  let capturedInit: RequestInit | undefined;
  const restore = mockFetch(async (_url, init) => {
    capturedInit = init;
    return new Response(buildSuccessResponseBody(PROPOSAL_JSON), { status: 200 });
  });
  const { buildModificationWorkV2ParticipantInstructions } = await import(
    '../../scripts/evolution/modificationWork/deepseekModificationWork'
  );
  const v2 = buildModificationWorkV2ParticipantInstructions();
  try {
    await invokeDeepSeekModificationWork({
      ...baseInput(),
      instructions: v2,
    });
    const body = JSON.parse(String(capturedInit?.body));
    assert.equal(body.messages?.[0]?.content, v2);
  } finally {
    restore();
  }
}

async function testProductTermsOnlyComeFromSuppliedInput(): Promise<void> {
  let capturedInit: RequestInit | undefined;
  const restore = mockFetch(async (_url, init) => {
    capturedInit = init;
    return new Response(buildSuccessResponseBody(PROPOSAL_JSON), { status: 200 });
  });

  const genericInput = JSON.stringify({
    schemaVersion: 'modification-work-input-v1',
    selectedHypothesis: { hypothesisId: 'hypothesis-000099' },
    evidencePack: { items: [{ evidenceId: 'current-catalog:generic-event' }] },
  });

  try {
    await invokeDeepSeekModificationWork({
      ...baseInput(),
      participantInputBytes: genericInput,
    });
    const body = JSON.parse(String(capturedInit?.body));
    const system = String(body.messages?.[0]?.content);
    const user = String(body.messages?.[1]?.content);
    for (const term of TARGET_LEAK_TERMS) {
      assert.equal(system.includes(term), false, `system leaked ${term}`);
      assert.equal(user.includes(term), false, `generic input must not inject ${term}`);
    }
    assert.ok(user.includes(genericInput));
    assert.ok(user.includes('current-catalog:generic-event'));
  } finally {
    restore();
  }
}

async function testHttpErrorPreservesRawBody(): Promise<void> {
  const errorBody = JSON.stringify({ error: { message: 'invalid request' } });
  const restore = mockFetch(async () => new Response(errorBody, { status: 400 }));

  try {
    const result = await invokeDeepSeekModificationWork(baseInput());
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
    const result = await invokeDeepSeekModificationWork(baseInput());
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
    const result = await invokeDeepSeekModificationWork(baseInput());
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
    model: DEEPSEEK_MODIFICATION_WORK_MODEL,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: '' },
      finish_reason: 'stop',
    }],
  });
  const restore = mockFetch(async () => new Response(rawProviderBody, { status: 200 }));

  try {
    const result = await invokeDeepSeekModificationWork(baseInput());
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.errorKind, 'provider_response');
    assert.equal(result.rawProviderResponse, rawProviderBody);
  } finally {
    restore();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDeepSeekModificationWorkTests()
    .then(() => console.log('deepseekModificationWork.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
