import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getP8PersonaById } from '../../src/p8/personas';
import {
  DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL,
  type DeepSeekImprovementHypothesisFailure,
  type DeepSeekImprovementHypothesisSuccess,
} from '../../scripts/evolution/improvementHypothesis/deepseekImprovementHypothesis';
import { DEEPSEEK_PLAYER_EXPERIENCE_MODEL } from '../../scripts/evolution/externalFeedback/deepseekPlayerExperienceFeedback';
import { runMinimalExternalFeedback } from '../../scripts/evolution/runMinimalExternalFeedback';
import { runImprovementHypothesis } from '../../scripts/evolution/runImprovementHypothesis';
import { proveLegacyParticipantFailure } from '../../scripts/evolution/problemAgnosticSolution/participantFailureRouting';

const API_KEY = 'sk-test-key-not-real';
const FORBIDDEN_PROVIDER_INPUT_MARKERS = [
  'internal/player-surface-source.json',
  'inputs/persona.json',
  'inputs/catalog.json',
  'oracle_effect_score_v1',
];
const FORBIDDEN_INVOCATION_FIELDS = [
  'severity',
  'confidence',
  'priority',
  'qualification',
];

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const child of value) collectObjectKeys(child, keys);
    return keys;
  }
  if (!value || typeof value !== 'object') return keys;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    keys.add(key);
    collectObjectKeys(child, keys);
  }
  return keys;
}

type HypothesisInvokeInput = {
  apiKey: string;
  invocationRef: string;
  runRef: string;
  feedbackInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
  observablePayloadBytes: string;
  feedbackBytes: string;
};

type Capture = Partial<HypothesisInvokeInput> & { callCount: number };

function successInvoke(
  participantJson: string,
  capture: Capture,
): (input: HypothesisInvokeInput) => Promise<
  DeepSeekImprovementHypothesisSuccess | DeepSeekImprovementHypothesisFailure
> {
  const rawProviderResponse = JSON.stringify({
    id: 'chatcmpl_hyp_loop_001',
    object: 'chat.completion',
    model: DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: participantJson },
      finish_reason: 'stop',
    }],
  });
  return async input => {
    capture.callCount += 1;
    Object.assign(capture, input);
    return {
      ok: true,
      responseId: 'chatcmpl_hyp_loop_001',
      model: DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL,
      httpStatus: 200,
      rawProviderResponse,
      rawParticipantResponse: participantJson,
    };
  };
}

async function createSource(sourceRoot: string, runRef: string): Promise<{
  feedbackInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  observablePayloadBytes: string;
  feedbackBytes: string;
  rawFeedbackParticipantResponse: string;
}> {
  const persona = getP8PersonaById('p8-martial-lin');
  assert.ok(persona, 'p8-martial-lin must exist');
  const participantJson = JSON.stringify({
    overallImpression: '后半段让我有些重复感。',
    observations: [{
      feedback: '几段经历给我的感觉很像。',
      evidenceRefs: ['entry-000001'],
    }],
  });

  const result = await runMinimalExternalFeedback(
    {
      runRef,
      persona,
      seed: 424242,
      endAge: 22,
      catalogVersion: 'default',
      maxSteps: 200,
      outRoot: sourceRoot,
      apiKey: API_KEY,
    },
    {
      invoke: async () => ({
        ok: true,
        responseId: 'chatcmpl_source_001',
        model: DEEPSEEK_PLAYER_EXPERIENCE_MODEL,
        httpStatus: 200,
        rawProviderResponse: '{"id":"chatcmpl_source_001"}',
        rawParticipantResponse: participantJson,
      }),
    },
  );

  const observablePayloadBytes = await readFile(
    join(result.feedbackDir, 'observable-payload.json'),
    'utf8',
  );
  const feedbackBytes = await readFile(join(result.feedbackDir, 'feedback.json'), 'utf8');
  const rawFeedbackParticipantResponse = await readFile(
    join(result.feedbackDir, 'raw-participant-response.txt'),
    'utf8',
  );

  return {
    feedbackInvocationRef: result.invocationRef,
    experimentRootHash: result.experimentRootHash,
    observablePayloadHash: result.observablePayloadHash,
    observablePayloadBytes,
    feedbackBytes,
    rawFeedbackParticipantResponse,
  };
}

export async function runImprovementHypothesisLoopTests(): Promise<void> {
  await testOneHypothesisSuccess();
  await testZeroHypothesesCompletedSuccess();
  await testMultipleHypothesesIndependentIds();
  await testInvalidReferenceFails();
  await testContractFailurePersistsSchemaForProof();
  await testProviderFailure();
  await testNoReplaceBeforeInvoke();
}

async function testOneHypothesisSuccess(): Promise<void> {
  const sourceRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-src-a-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-out-a-'));
  const runRef = 'hyp-loop-one';
  const source = await createSource(sourceRoot, runRef);
  const capture: Capture = { callCount: 0 };

  const participantJson = JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [{
      hypothesis: '这次体验后半段可能缺乏足够的玩家可感知差异。',
      observedBasis: 'participant 明确表达了后半段重复感。',
      feedbackRefs: ['observations[0]'],
      evidenceRefs: ['entry-000001'],
      unknowns: ['不知道该体验是否普遍存在，也不知道因果来源。'],
      productSignificance: '如果成立，可能削弱长生命周期体验的变化感。',
    }],
    noProblemAssessment: null,
  });

  const result = await runImprovementHypothesis(
    { runRef, sourceRoot, outRoot, apiKey: API_KEY },
    { invoke: successInvoke(participantJson, capture) },
  );

  assert.equal(capture.callCount, 1);
  assert.equal(capture.observablePayloadBytes, source.observablePayloadBytes);
  assert.equal(capture.feedbackBytes, source.feedbackBytes);
  assert.equal(capture.runRef, runRef);
  assert.equal(capture.feedbackInvocationRef, source.feedbackInvocationRef);
  assert.equal(capture.experimentRootHash, source.experimentRootHash);
  assert.equal(capture.observablePayloadHash, source.observablePayloadHash);

  const capturedBlob = JSON.stringify(capture);
  for (const marker of FORBIDDEN_PROVIDER_INPUT_MARKERS) {
    assert.equal(capturedBlob.includes(marker), false, `provider input leaked ${marker}`);
  }
  assert.equal(capturedBlob.includes('p8-martial-lin'), false, 'provider input leaked persona');
  assert.doesNotMatch(capturedBlob, /src\/evolution|scripts\/evolution/);

  assert.equal(
    await readFile(join(result.hypothesisDir, 'source-observable-payload.json'), 'utf8'),
    source.observablePayloadBytes,
  );
  assert.equal(
    await readFile(join(result.hypothesisDir, 'source-feedback.json'), 'utf8'),
    source.feedbackBytes,
  );
  assert.equal(
    await readFile(join(result.hypothesisDir, 'source-feedback-raw-participant-response.txt'), 'utf8'),
    source.rawFeedbackParticipantResponse,
  );

  const hypotheses = JSON.parse(
    await readFile(join(result.hypothesisDir, 'hypotheses.json'), 'utf8'),
  ) as { hypotheses: Array<{ hypothesisId: string }> };
  assert.equal(hypotheses.hypotheses[0]?.hypothesisId, 'hypothesis-000001');

  const invocation = JSON.parse(
    await readFile(join(result.hypothesisDir, 'invocation.json'), 'utf8'),
  ) as Record<string, unknown>;
  assert.equal(invocation.runRef, runRef);
  assert.equal(invocation.feedbackInvocationRef, source.feedbackInvocationRef);
  assert.equal(invocation.experimentRootHash, source.experimentRootHash);
  assert.equal(invocation.observablePayloadHash, source.observablePayloadHash);
  assert.equal(invocation.feedbackHash, result.feedbackHash);
  assert.equal(invocation.status, 'completed');
  const invocationKeys = collectObjectKeys(invocation);
  for (const forbidden of FORBIDDEN_INVOCATION_FIELDS) {
    assert.equal(invocationKeys.has(forbidden), false, `invocation leaked ${forbidden}`);
  }

  const report = await readFile(result.humanReportPath, 'utf8');
  assert.match(report, /后半段让我有些重复感/);
  assert.ok(report.includes(participantJson));
  assert.match(report, /可能缺乏足够的玩家可感知差异/);
  assert.match(report, /几段经历给我的感觉很像/);
  assert.match(report, /entry-000001/);
  assert.match(report, /不知道该体验是否普遍存在/);
  assert.match(report, /削弱长生命周期体验的变化感/);
  assert.match(report, /继续调查/);
  assert.match(report, /暂不继续/);
  assert.match(report, /当前无法判断/);
  assert.match(report, /继续调查 ≠ 已证实|继续调查≠已证实|不是已确认缺陷/);
  assert.match(report, /STOP/);
  assert.match(report, /可撤销产品推断/);
}

async function testZeroHypothesesCompletedSuccess(): Promise<void> {
  const sourceRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-src-b-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-out-b-'));
  const runRef = 'hyp-loop-zero';
  await createSource(sourceRoot, runRef);
  const capture: Capture = { callCount: 0 };
  const participantJson = JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [],
    noProblemAssessment: {
      rationale: '当前反馈不足以形成值得进一步调查的产品问题假设。',
      feedbackRefs: ['overallImpression'],
      evidenceRefs: [],
    },
  });

  const result = await runImprovementHypothesis(
    { runRef, sourceRoot, outRoot, apiKey: API_KEY },
    { invoke: successInvoke(participantJson, capture) },
  );

  const hypotheses = JSON.parse(
    await readFile(join(result.hypothesisDir, 'hypotheses.json'), 'utf8'),
  );
  assert.deepEqual(hypotheses.schemaVersion, 'improvement-hypothesis-set-v2');
  assert.equal(hypotheses.noProblemAssessment.rationale, '当前反馈不足以形成值得进一步调查的产品问题假设。');

  const invocation = JSON.parse(
    await readFile(join(result.hypothesisDir, 'invocation.json'), 'utf8'),
  ) as { status: string };
  assert.equal(invocation.status, 'completed');

  const report = await readFile(result.humanReportPath, 'utf8');
  assert.match(report, /0 条.*合法|合法 completed result|不足以形成/);
  assert.match(report, /不表示 participant failure/);
  assert.doesNotMatch(report, /provider\/contract failure/);
  assert.doesNotMatch(report, /- status: failed/);
}

async function testMultipleHypothesesIndependentIds(): Promise<void> {
  const sourceRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-src-c-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-out-c-'));
  const runRef = 'hyp-loop-multi';
  await createSource(sourceRoot, runRef);
  const capture: Capture = { callCount: 0 };
  const participantJson = JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [
      {
        hypothesis: '问题 A。',
        observedBasis: '依据 A。',
        feedbackRefs: ['overallImpression'],
        evidenceRefs: [],
        unknowns: ['未知 A。'],
        productSignificance: '意义 A。',
      },
      {
        hypothesis: '问题 B。',
        observedBasis: '依据 B。',
        feedbackRefs: ['observations[0]'],
        evidenceRefs: ['entry-000001'],
        unknowns: ['未知 B。'],
        productSignificance: '意义 B。',
      },
    ],
    noProblemAssessment: null,
  });

  const result = await runImprovementHypothesis(
    { runRef, sourceRoot, outRoot, apiKey: API_KEY },
    { invoke: successInvoke(participantJson, capture) },
  );

  const hypotheses = JSON.parse(
    await readFile(join(result.hypothesisDir, 'hypotheses.json'), 'utf8'),
  ) as { hypotheses: Array<{ hypothesisId: string }> };
  assert.deepEqual(
    hypotheses.hypotheses.map(item => item.hypothesisId),
    ['hypothesis-000001', 'hypothesis-000002'],
  );

  const report = await readFile(result.humanReportPath, 'utf8');
  assert.match(report, /## hypothesis-000001/);
  assert.match(report, /## hypothesis-000002/);
  const continueCount = (report.match(/继续调查/g) ?? []).length;
  assert.ok(continueCount >= 2, 'each hypothesis must show review options');
  assert.doesNotMatch(report, /voting|aggregation|consensus/i);
}

async function testInvalidReferenceFails(): Promise<void> {
  const sourceRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-src-d-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-out-d-'));
  const runRef = 'hyp-loop-bad-ref';
  const source = await createSource(sourceRoot, runRef);
  const capture: Capture = { callCount: 0 };
  const participantJson = JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [{
      hypothesis: '潜在问题。',
      observedBasis: '观察。',
      feedbackRefs: ['observations[9]'],
      evidenceRefs: [],
      unknowns: ['仍未知。'],
      productSignificance: '值得调查。',
    }],
    noProblemAssessment: null,
  });

  await assert.rejects(
    () => runImprovementHypothesis(
      { runRef, sourceRoot, outRoot, apiKey: API_KEY },
      { invoke: successInvoke(participantJson, capture) },
    ),
    /observations\[9\]|unknown feedback/i,
  );

  const hypothesisDir = join(outRoot, 'hypothesis-runs', runRef);
  assert.equal(
    await readFile(join(hypothesisDir, 'raw-participant-response.txt'), 'utf8'),
    participantJson,
  );
  assert.equal(await pathExists(join(hypothesisDir, 'hypotheses.json')), false);

  const invocation = JSON.parse(
    await readFile(join(hypothesisDir, 'invocation.json'), 'utf8'),
  ) as { status: string; errorKind?: string };
  assert.equal(invocation.status, 'failed');
  assert.equal(invocation.errorKind, 'invalid_reference');

  const report = await readFile(join(hypothesisDir, 'human-review.md'), 'utf8');
  assert.match(report, new RegExp(runRef));
  assert.match(report, new RegExp(source.feedbackInvocationRef));
  assert.match(report, /failed/);
  assert.doesNotMatch(report, /participant wrong|participant 错误/i);
}

async function testContractFailurePersistsSchemaForProof(): Promise<void> {
  const sourceRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-src-contract-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-out-contract-'));
  const runRef = 'hyp-loop-contract-fail';
  await createSource(sourceRoot, runRef);
  const participantJson = JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [{
      hypothesis: 'Potential issue.',
      observedBasis: 'Observed basis.',
      feedbackRefs: ['overallImpression'],
      evidenceRefs: [],
      unknowns: ['Unknown.'],
    }],
    noProblemAssessment: null,
  });

  await assert.rejects(
    () => runImprovementHypothesis(
      { runRef, sourceRoot, outRoot, apiKey: API_KEY },
      { invoke: successInvoke(participantJson, { callCount: 0 }) },
    ),
    /productSignificance/,
  );

  const invocation = JSON.parse(
    await readFile(join(outRoot, 'hypothesis-runs', runRef, 'invocation.json'), 'utf8'),
  ) as Record<string, unknown>;
  assert.equal(invocation.hypothesisInvocationRef, `${runRef}-deepseek-improvement-hypothesis-001`);
  assert.equal('invocationRef' in invocation, false);
  assert.equal(invocation.status, 'failed');
  assert.equal(invocation.errorKind, 'parse');

  const proved = await proveLegacyParticipantFailure({
    experimentRoot: outRoot,
    stage: 'IMPROVEMENT_HYPOTHESIS',
    runRef,
  });
  assert.equal(proved?.participantErrorKind, 'parse');
}

async function testProviderFailure(): Promise<void> {
  const sourceRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-src-e-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-out-e-'));
  const runRef = 'hyp-loop-provider-fail';
  const source = await createSource(sourceRoot, runRef);
  const rawProviderResponse = '{"error":"temporary"}';

  await assert.rejects(
    () => runImprovementHypothesis(
      { runRef, sourceRoot, outRoot, apiKey: API_KEY },
      {
        invoke: async () => ({
          ok: false,
          errorKind: 'http',
          message: 'DeepSeek HTTP 503',
          httpStatus: 503,
          rawProviderResponse,
        }),
      },
    ),
    /provider|http|503/i,
  );

  const hypothesisDir = join(outRoot, 'hypothesis-runs', runRef);
  assert.equal(
    await readFile(join(hypothesisDir, 'raw-provider-response.txt'), 'utf8'),
    rawProviderResponse,
  );
  assert.equal(await pathExists(join(hypothesisDir, 'hypotheses.json')), false);

  const invocation = JSON.parse(
    await readFile(join(hypothesisDir, 'invocation.json'), 'utf8'),
  ) as { status: string; errorKind?: string };
  assert.equal(invocation.status, 'failed');
  assert.equal(invocation.errorKind, 'provider');

  const report = await readFile(join(hypothesisDir, 'human-review.md'), 'utf8');
  assert.match(report, new RegExp(source.experimentRootHash));
  assert.match(report, /failed/);
}

async function testNoReplaceBeforeInvoke(): Promise<void> {
  const sourceRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-src-f-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-out-f-'));
  const runRef = 'hyp-loop-noreplace';
  await createSource(sourceRoot, runRef);
  const capture: Capture = { callCount: 0 };
  const participantJson = JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [],
    noProblemAssessment: {
      rationale: '当前反馈不足以形成可审计的问题假设。',
      feedbackRefs: ['overallImpression'],
      evidenceRefs: [],
    },
  });

  await runImprovementHypothesis(
    { runRef, sourceRoot, outRoot, apiKey: API_KEY },
    { invoke: successInvoke(participantJson, capture) },
  );
  assert.equal(capture.callCount, 1);

  await assert.rejects(
    () => runImprovementHypothesis(
      { runRef, sourceRoot, outRoot, apiKey: API_KEY },
      { invoke: successInvoke(participantJson, capture) },
    ),
    /hypothesis run target already exists/i,
  );
  assert.equal(capture.callCount, 1, 'second run must fail before provider invoke');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runImprovementHypothesisLoopTests()
    .then(() => console.log('improvementHypothesisLoop.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
