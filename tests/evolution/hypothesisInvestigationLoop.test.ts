import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getP8PersonaById } from '../../src/p8/personas';
import {
  DEEPSEEK_HYPOTHESIS_INVESTIGATION_MODEL,
  type DeepSeekHypothesisInvestigationFailure,
  type DeepSeekHypothesisInvestigationSuccess,
} from '../../scripts/evolution/hypothesisInvestigation/deepseekHypothesisInvestigation';
import { DEEPSEEK_PLAYER_EXPERIENCE_MODEL } from '../../scripts/evolution/externalFeedback/deepseekPlayerExperienceFeedback';
import { DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL } from '../../scripts/evolution/improvementHypothesis/deepseekImprovementHypothesis';
import { runMinimalExternalFeedback } from '../../scripts/evolution/runMinimalExternalFeedback';
import { runImprovementHypothesis } from '../../scripts/evolution/runImprovementHypothesis';
import { runHypothesisInvestigation } from '../../scripts/evolution/runHypothesisInvestigation';
import { parseHypothesisInvestigationResult } from '../../src/evolution/hypothesisInvestigationContract';

const API_KEY = 'sk-test-key-not-real';

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

type InvestigationInvokeInput = {
  apiKey: string;
  invocationRef: string;
  runRef: string;
  hypothesisId: string;
  hypothesisInvocationRef: string;
  experimentRootHash: string;
  evidencePackHash: string;
  evidencePackBytes: string;
};

type Capture = Partial<InvestigationInvokeInput> & { callCount: number };

function successInvoke(
  buildParticipantJson: (input: InvestigationInvokeInput) => string,
  capture: Capture,
): (input: InvestigationInvokeInput) => Promise<
  DeepSeekHypothesisInvestigationSuccess | DeepSeekHypothesisInvestigationFailure
> {
  return async input => {
    capture.callCount += 1;
    Object.assign(capture, input);
    const participantJson = buildParticipantJson(input);
    const rawProviderResponse = JSON.stringify({
      id: 'chatcmpl_inv_loop_001',
      object: 'chat.completion',
      model: DEEPSEEK_HYPOTHESIS_INVESTIGATION_MODEL,
      choices: [{
        index: 0,
        message: { role: 'assistant', content: participantJson },
        finish_reason: 'stop',
      }],
    });
    return {
      ok: true,
      responseId: 'chatcmpl_inv_loop_001',
      model: DEEPSEEK_HYPOTHESIS_INVESTIGATION_MODEL,
      httpStatus: 200,
      rawProviderResponse,
      rawParticipantResponse: participantJson,
    };
  };
}

function firstEvidenceId(evidencePackBytes: string): string {
  const pack = JSON.parse(evidencePackBytes) as {
    items: Array<{ evidenceId: string }>;
  };
  const id = pack.items[0]?.evidenceId;
  assert.ok(id, 'evidence pack must contain at least one evidence item');
  return id;
}

async function createHypothesisSource(input: {
  mefRoot: string;
  hypothesisRoot: string;
  runRef: string;
}): Promise<void> {
  const persona = getP8PersonaById('p8-martial-lin');
  assert.ok(persona, 'p8-martial-lin must exist');

  const feedbackJson = JSON.stringify({
    overallImpression: '后半段让我有些重复感。',
    observations: [
      { feedback: '几段经历给我的感觉很像。', evidenceRefs: ['entry-000001'] },
      { feedback: '中间有些平淡。', evidenceRefs: ['entry-000001'] },
      { feedback: '资源开始吃紧。', evidenceRefs: ['entry-000001'] },
      { feedback: '婚姻选择留下遗憾。', evidenceRefs: ['entry-000001'] },
    ],
  });

  await runMinimalExternalFeedback(
    {
      runRef: input.runRef,
      persona,
      seed: 424242,
      endAge: 22,
      catalogVersion: 'default',
      maxSteps: 200,
      outRoot: input.mefRoot,
      apiKey: API_KEY,
    },
    {
      invoke: async () => ({
        ok: true,
        responseId: 'chatcmpl_inv_loop_mef',
        model: DEEPSEEK_PLAYER_EXPERIENCE_MODEL,
        httpStatus: 200,
        rawProviderResponse: '{"id":"chatcmpl_inv_loop_mef"}',
        rawParticipantResponse: feedbackJson,
      }),
    },
  );

  const hypothesesJson = JSON.stringify({
    hypotheses: [
      {
        hypothesis: '资源压力可能成为情感负担。',
        observedBasis: 'participant 提到资源吃紧。',
        feedbackRefs: ['observations[2]'],
        evidenceRefs: ['entry-000001'],
        unknowns: ['是否普遍存在。'],
        productSignificance: '可能削弱长期代入感。',
      },
      {
        hypothesis: '婚姻选择可能造成持久遗憾感。',
        observedBasis: 'participant 明确提到遗憾。',
        feedbackRefs: ['observations[3]'],
        evidenceRefs: ['entry-000001'],
        unknowns: ['是否多数玩家有同样反应。'],
        productSignificance: '可能影响结局满意度。',
      },
    ],
  });

  await runImprovementHypothesis(
    {
      runRef: input.runRef,
      sourceRoot: input.mefRoot,
      outRoot: input.hypothesisRoot,
      apiKey: API_KEY,
    },
    {
      invoke: async () => ({
        ok: true,
        responseId: 'chatcmpl_inv_loop_hyp',
        model: DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL,
        httpStatus: 200,
        rawProviderResponse: '{"id":"chatcmpl_inv_loop_hyp"}',
        rawParticipantResponse: hypothesesJson,
      }),
    },
  );
}

export async function runHypothesisInvestigationLoopTests(): Promise<void> {
  await testCompletedLoop();
  await testLongitudinalMode();
  await testEvidenceGapCompleted();
  await testInvalidReferenceFails();
  await testProviderFailure();
  await testParseFailure();
  await testNoReplaceBeforeInvoke();
  await testParticipantInputBoundary();
  await testHumanReviewSemantics();
}

async function testLongitudinalMode(): Promise<void> {
  const mefRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-mef-longitudinal-'));
  const hypRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-hyp-longitudinal-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-out-longitudinal-'));
  const runRef = 'inv-loop-longitudinal';
  const hypothesisId = 'hypothesis-000002';
  await createHypothesisSource({ mefRoot, hypothesisRoot: hypRoot, runRef });
  const capture: Capture = { callCount: 0 };

  const result = await runHypothesisInvestigation(
    {
      runRef,
      hypothesisId,
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypRoot,
      outRoot,
      evidenceMode: 'longitudinal-v1',
      apiKey: API_KEY,
    },
    {
      invoke: successInvoke(input => {
        const pack = JSON.parse(input.evidencePackBytes) as {
          schemaVersion: string;
          evidenceMode?: string;
        };
        assert.equal(pack.schemaVersion, 'hypothesis-investigation-evidence-v2');
        assert.equal(pack.evidenceMode, 'longitudinal-v1');
        const evidenceId = firstEvidenceId(input.evidencePackBytes);
        return JSON.stringify({
          confirmedFacts: [],
          relevantMechanisms: [],
          limitingEvidence: [],
          unresolvedQuestions: ['需要更多 bounded evidence。'],
          evidenceGaps: [evidenceId],
        });
      }, capture),
    },
  );

  assert.equal(capture.callCount, 1);
  assert.equal(
    result.investigationInvocationRef,
    `${runRef}-${hypothesisId}-deepseek-hypothesis-investigation-longitudinal-001`,
  );
  const invocation = JSON.parse(
    await readFile(join(result.investigationDir, 'invocation.json'), 'utf8'),
  ) as { schemaVersion: string; evidenceMode?: string; status: string };
  assert.equal(invocation.schemaVersion, 'hypothesis-investigation-invocation-v2');
  assert.equal(invocation.evidenceMode, 'longitudinal-v1');
  assert.equal(invocation.status, 'completed');
}

async function testCompletedLoop(): Promise<void> {
  const mefRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-mef-a-'));
  const hypRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-hyp-a-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-out-a-'));
  const runRef = 'inv-loop-one';
  const hypothesisId = 'hypothesis-000002';
  await createHypothesisSource({ mefRoot, hypothesisRoot: hypRoot, runRef });
  const capture: Capture = { callCount: 0 };

  const result = await runHypothesisInvestigation(
    {
      runRef,
      hypothesisId,
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypRoot,
      outRoot,
      apiKey: API_KEY,
    },
    {
      invoke: successInvoke(input => {
        const evidenceId = firstEvidenceId(input.evidencePackBytes);
        return JSON.stringify({
          confirmedFacts: [{
            statement: '本次 run 在 family_marriage 选择了 marry_arranged。',
            evidenceRefs: [evidenceId],
          }],
          relevantMechanisms: [],
          limitingEvidence: [],
          unresolvedQuestions: ['单次 run 不能判断多数玩家是否产生相同遗憾。'],
          evidenceGaps: [],
        });
      }, capture),
    },
  );

  assert.equal(capture.callCount, 1);
  assert.equal(result.runRef, runRef);
  assert.equal(result.hypothesisId, hypothesisId);
  assert.equal(result.status, 'completed');

  const investigationDir = result.investigationDir;
  for (const name of [
    'source-hypotheses.json',
    'source-hypothesis-invocation.json',
    'investigation-evidence.json',
    'raw-provider-response.txt',
    'raw-participant-response.txt',
    'investigation.json',
    'invocation.json',
    'human-review.md',
  ]) {
    assert.equal(await pathExists(join(investigationDir, name)), true, name);
  }

  const investigationBytes = await readFile(join(investigationDir, 'investigation.json'), 'utf8');
  const parsed = parseHypothesisInvestigationResult(
    await readFile(join(investigationDir, 'raw-participant-response.txt'), 'utf8'),
  );
  assert.equal(investigationBytes.includes('"confirmedFacts"'), true);
  assert.equal(parsed.confirmedFacts.length, 1);

  const invocation = JSON.parse(
    await readFile(join(investigationDir, 'invocation.json'), 'utf8'),
  ) as { status: string; hypothesisId: string };
  assert.equal(invocation.status, 'completed');
  assert.equal(invocation.hypothesisId, hypothesisId);
}

async function testEvidenceGapCompleted(): Promise<void> {
  const mefRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-mef-b-'));
  const hypRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-hyp-b-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-out-b-'));
  const runRef = 'inv-loop-gap';
  await createHypothesisSource({ mefRoot, hypothesisRoot: hypRoot, runRef });
  const capture: Capture = { callCount: 0 };

  const result = await runHypothesisInvestigation(
    {
      runRef,
      hypothesisId: 'hypothesis-000002',
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypRoot,
      outRoot,
      apiKey: API_KEY,
    },
    {
      invoke: successInvoke(() => JSON.stringify({
        confirmedFacts: [],
        relevantMechanisms: [],
        limitingEvidence: [],
        unresolvedQuestions: ['当前单次 run 无法判断多数玩家是否产生同样遗憾。'],
        evidenceGaps: ['当前 evidence 不包含新的外部体验样本。'],
      }), capture),
    },
  );

  assert.equal(result.status, 'completed');
  const invocation = JSON.parse(
    await readFile(join(result.investigationDir, 'invocation.json'), 'utf8'),
  ) as { status: string };
  assert.equal(invocation.status, 'completed');
  assert.equal(await pathExists(join(result.investigationDir, 'investigation.json')), true);
}

async function testInvalidReferenceFails(): Promise<void> {
  const mefRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-mef-c-'));
  const hypRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-hyp-c-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-out-c-'));
  const runRef = 'inv-loop-bad-ref';
  await createHypothesisSource({ mefRoot, hypothesisRoot: hypRoot, runRef });
  const capture: Capture = { callCount: 0 };
  const participantJson = JSON.stringify({
    confirmedFacts: [{
      statement: '引用了不存在的 catalog。',
      evidenceRefs: ['source-catalog:not-real'],
    }],
    relevantMechanisms: [],
    limitingEvidence: [],
    unresolvedQuestions: [],
    evidenceGaps: [],
  });

  await assert.rejects(
    () => runHypothesisInvestigation(
      {
        runRef,
        hypothesisId: 'hypothesis-000002',
        mefSourceRoot: mefRoot,
        hypothesisSourceRoot: hypRoot,
        outRoot,
        apiKey: API_KEY,
      },
      { invoke: successInvoke(() => participantJson, capture) },
    ),
    /source-catalog:not-real|unknown evidence/i,
  );

  const investigationDir = join(
    outRoot,
    'investigation-runs',
    runRef,
    'hypothesis-000002',
  );
  assert.equal(
    await readFile(join(investigationDir, 'raw-participant-response.txt'), 'utf8'),
    participantJson,
  );
  assert.equal(await pathExists(join(investigationDir, 'investigation.json')), false);
  const invocation = JSON.parse(
    await readFile(join(investigationDir, 'invocation.json'), 'utf8'),
  ) as { status: string; errorKind?: string };
  assert.equal(invocation.status, 'failed');
  assert.equal(invocation.errorKind, 'invalid_reference');
  assert.equal(await pathExists(join(investigationDir, 'human-review.md')), true);
}

async function testProviderFailure(): Promise<void> {
  const mefRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-mef-d-'));
  const hypRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-hyp-d-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-out-d-'));
  const runRef = 'inv-loop-provider-fail';
  await createHypothesisSource({ mefRoot, hypothesisRoot: hypRoot, runRef });
  const rawProviderResponse = '{"error":"temporary"}';

  await assert.rejects(
    () => runHypothesisInvestigation(
      {
        runRef,
        hypothesisId: 'hypothesis-000002',
        mefSourceRoot: mefRoot,
        hypothesisSourceRoot: hypRoot,
        outRoot,
        apiKey: API_KEY,
      },
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

  const investigationDir = join(
    outRoot,
    'investigation-runs',
    runRef,
    'hypothesis-000002',
  );
  assert.equal(
    await readFile(join(investigationDir, 'raw-provider-response.txt'), 'utf8'),
    rawProviderResponse,
  );
  assert.equal(await pathExists(join(investigationDir, 'investigation.json')), false);
  const invocation = JSON.parse(
    await readFile(join(investigationDir, 'invocation.json'), 'utf8'),
  ) as { status: string; errorKind?: string };
  assert.equal(invocation.status, 'failed');
  assert.equal(invocation.errorKind, 'provider');
}

async function testParseFailure(): Promise<void> {
  const mefRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-mef-e-'));
  const hypRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-hyp-e-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-out-e-'));
  const runRef = 'inv-loop-parse-fail';
  await createHypothesisSource({ mefRoot, hypothesisRoot: hypRoot, runRef });
  const capture: Capture = { callCount: 0 };
  const badJson = '{"confirmedFacts":[]}';

  await assert.rejects(
    () => runHypothesisInvestigation(
      {
        runRef,
        hypothesisId: 'hypothesis-000002',
        mefSourceRoot: mefRoot,
        hypothesisSourceRoot: hypRoot,
        outRoot,
        apiKey: API_KEY,
      },
      { invoke: successInvoke(() => badJson, capture) },
    ),
    /missing required field|unknown field|must/i,
  );

  const investigationDir = join(
    outRoot,
    'investigation-runs',
    runRef,
    'hypothesis-000002',
  );
  assert.equal(
    await readFile(join(investigationDir, 'raw-participant-response.txt'), 'utf8'),
    badJson,
  );
  const invocation = JSON.parse(
    await readFile(join(investigationDir, 'invocation.json'), 'utf8'),
  ) as { status: string; errorKind?: string };
  assert.equal(invocation.status, 'failed');
  assert.equal(invocation.errorKind, 'parse');
}

async function testNoReplaceBeforeInvoke(): Promise<void> {
  const mefRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-mef-f-'));
  const hypRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-hyp-f-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-out-f-'));
  const runRef = 'inv-loop-noreplace';
  await createHypothesisSource({ mefRoot, hypothesisRoot: hypRoot, runRef });
  const capture: Capture = { callCount: 0 };

  await runHypothesisInvestigation(
    {
      runRef,
      hypothesisId: 'hypothesis-000002',
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypRoot,
      outRoot,
      apiKey: API_KEY,
    },
    {
      invoke: successInvoke(() => JSON.stringify({
        confirmedFacts: [],
        relevantMechanisms: [],
        limitingEvidence: [],
        unresolvedQuestions: ['未知。'],
        evidenceGaps: ['缺口。'],
      }), capture),
    },
  );
  assert.equal(capture.callCount, 1);

  await assert.rejects(
    () => runHypothesisInvestigation(
      {
        runRef,
        hypothesisId: 'hypothesis-000002',
        mefSourceRoot: mefRoot,
        hypothesisSourceRoot: hypRoot,
        outRoot,
        apiKey: API_KEY,
      },
      {
        invoke: successInvoke(() => JSON.stringify({
          confirmedFacts: [],
          relevantMechanisms: [],
          limitingEvidence: [],
          unresolvedQuestions: ['未知。'],
          evidenceGaps: ['缺口。'],
        }), capture),
      },
    ),
    /already exists/i,
  );
  assert.equal(capture.callCount, 1, 'second run must fail before provider invoke');
}

async function testParticipantInputBoundary(): Promise<void> {
  const mefRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-mef-g-'));
  const hypRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-hyp-g-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-out-g-'));
  const runRef = 'inv-loop-boundary';
  await createHypothesisSource({ mefRoot, hypothesisRoot: hypRoot, runRef });
  const capture: Capture = { callCount: 0 };

  await runHypothesisInvestigation(
    {
      runRef,
      hypothesisId: 'hypothesis-000002',
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypRoot,
      outRoot,
      apiKey: API_KEY,
    },
    {
      invoke: successInvoke(() => JSON.stringify({
        confirmedFacts: [],
        relevantMechanisms: [],
        limitingEvidence: [],
        unresolvedQuestions: ['未知。'],
        evidenceGaps: ['缺口。'],
      }), capture),
    },
  );

  assert.ok(capture.evidencePackBytes);
  const captured = JSON.stringify(capture);
  assert.equal(captured.includes('sourceHypothesesBytes'), false);
  assert.equal(captured.includes('sourceHypothesisInvocationBytes'), false);
  assert.equal(captured.includes('p8-martial-lin'), false);
  assert.equal(captured.includes('sourceFingerprint'), false);
  assert.equal(captured.includes('hypothesis-000001'), false);
  assert.doesNotMatch(captured, /src\/evolution|scripts\/evolution/);

  const pack = JSON.parse(capture.evidencePackBytes!) as {
    selectedHypothesis: { hypothesisId: string };
  };
  assert.equal(pack.selectedHypothesis.hypothesisId, 'hypothesis-000002');
}

async function testHumanReviewSemantics(): Promise<void> {
  const mefRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-mef-h-'));
  const hypRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-hyp-h-'));
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-loop-out-h-'));
  const runRef = 'inv-loop-review';
  await createHypothesisSource({ mefRoot, hypothesisRoot: hypRoot, runRef });
  const capture: Capture = { callCount: 0 };

  const result = await runHypothesisInvestigation(
    {
      runRef,
      hypothesisId: 'hypothesis-000002',
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypRoot,
      outRoot,
      apiKey: API_KEY,
    },
    {
      invoke: successInvoke(input => {
        const evidenceId = firstEvidenceId(input.evidencePackBytes);
        return JSON.stringify({
          confirmedFacts: [{
            statement: '相关事实。',
            evidenceRefs: [evidenceId],
          }],
          relevantMechanisms: [{
            statement: '相关机制。',
            evidenceRefs: [evidenceId],
          }],
          limitingEvidence: [{
            statement: '限制性 evidence。',
            evidenceRefs: [evidenceId],
          }],
          unresolvedQuestions: ['仍未知。'],
          evidenceGaps: ['证据缺口。'],
        });
      }, capture),
    },
  );

  const report = await readFile(result.humanReportPath, 'utf8');
  assert.match(report, /hypothesis-000002|selected hypothesis|选定 hypothesis/i);
  assert.match(report, /confirmed facts|已确认事实/i);
  assert.match(report, /relevant mechanisms|相关机制/i);
  assert.match(report, /limiting|限制性|矛盾/i);
  assert.match(report, /unresolved|仍未知|未知项/i);
  assert.match(report, /evidence gaps|evidence gap|证据缺口/i);
  assert.match(report, /source-run|source run|当时/i);
  assert.match(report, /current-product|current product|当前产品/i);
  assert.match(report, /原始.*response|raw participant/i);
  assert.match(report, /值得进入后续产品决策/);
  assert.match(report, /需要更多 evidence/);
  assert.match(report, /暂不继续/);
  assert.match(report, /investigation ≠ hypothesis verdict|investigation.*不是.*verdict/i);
  assert.match(report, /相关机制 ≠ proven root cause|相关机制.*不是.*根因/);
  assert.match(report, /modification authorization|不等于.*修改授权|≠.*modification/i);
  assert.match(report, /STOP/);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHypothesisInvestigationLoopTests()
    .then(() => console.log('hypothesisInvestigationLoop.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
