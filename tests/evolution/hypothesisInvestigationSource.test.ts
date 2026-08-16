import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getP8PersonaById } from '../../src/p8/personas';
import { DEEPSEEK_PLAYER_EXPERIENCE_MODEL } from '../../scripts/evolution/externalFeedback/deepseekPlayerExperienceFeedback';
import { DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL } from '../../scripts/evolution/improvementHypothesis/deepseekImprovementHypothesis';
import { loadHypothesisInvestigationSource } from '../../scripts/evolution/hypothesisInvestigation/loadHypothesisInvestigationSource';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';
import { runMinimalExternalFeedback } from '../../scripts/evolution/runMinimalExternalFeedback';
import { runImprovementHypothesis } from '../../scripts/evolution/runImprovementHypothesis';

const API_KEY = 'sk-test-key-not-real';

async function createCompletedHypothesisSource(input: {
  mefRoot: string;
  hypothesisRoot: string;
  runRef: string;
}): Promise<{
  feedbackInvocationRef: string;
  hypothesisInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
}> {
  const persona = getP8PersonaById('p8-martial-lin');
  assert.ok(persona, 'p8-martial-lin must exist');

  const feedbackJson = JSON.stringify({
    overallImpression: '后半段让我有些重复感。',
    observations: [
      { feedback: '几段经历给我的感觉很像。', evidenceRefs: ['entry-000001'] },
      { feedback: '中间有些平淡。', evidenceRefs: ['entry-000001'] },
      { feedback: '资源开始吃紧。', evidenceRefs: ['entry-000001'] },
      {
        feedback: '婚姻选择留下遗憾。',
        evidenceRefs: ['entry-000001'],
      },
    ],
  });

  const mef = await runMinimalExternalFeedback(
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
        responseId: 'chatcmpl_inv_src_mef',
        model: DEEPSEEK_PLAYER_EXPERIENCE_MODEL,
        httpStatus: 200,
        rawProviderResponse: '{"id":"chatcmpl_inv_src_mef"}',
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

  const hyp = await runImprovementHypothesis(
    {
      runRef: input.runRef,
      sourceRoot: input.mefRoot,
      outRoot: input.hypothesisRoot,
      apiKey: API_KEY,
    },
    {
      invoke: async () => ({
        ok: true,
        responseId: 'chatcmpl_inv_src_hyp',
        model: DEEPSEEK_IMPROVEMENT_HYPOTHESIS_MODEL,
        httpStatus: 200,
        rawProviderResponse: '{"id":"chatcmpl_inv_src_hyp"}',
        rawParticipantResponse: hypothesesJson,
      }),
    },
  );

  const feedbackBytes = await readFile(
    join(input.mefRoot, 'feedback-runs', input.runRef, 'feedback.json'),
    'utf8',
  );

  return {
    feedbackInvocationRef: mef.invocationRef,
    hypothesisInvocationRef: hyp.hypothesisInvocationRef,
    experimentRootHash: mef.experimentRootHash,
    observablePayloadHash: mef.observablePayloadHash,
    feedbackHash: sha256Hex(feedbackBytes),
  };
}

export async function runHypothesisInvestigationSourceTests(): Promise<void> {
  const mefRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-mef-'));
  const hypothesisRoot = await mkdtemp(join(tmpdir(), 'wuxia-inv-hyp-'));
  const runRef = 'inv-source-001';
  const created = await createCompletedHypothesisSource({ mefRoot, hypothesisRoot, runRef });
  const hypothesisId = 'hypothesis-000002';

  const source = await loadHypothesisInvestigationSource({
    mefSourceRoot: mefRoot,
    hypothesisSourceRoot: hypothesisRoot,
    runRef,
    hypothesisId,
  });

  assert.equal(source.runRef, runRef);
  assert.equal(source.hypothesisId, hypothesisId);
  assert.equal(source.feedbackInvocationRef, created.feedbackInvocationRef);
  assert.equal(source.hypothesisInvocationRef, created.hypothesisInvocationRef);
  assert.equal(source.experimentRootHash, created.experimentRootHash);
  assert.equal(source.observablePayloadHash, created.observablePayloadHash);
  assert.equal(source.feedbackHash, created.feedbackHash);
  assert.equal(source.selectedHypothesis.hypothesisId, hypothesisId);
  assert.match(source.selectedHypothesis.hypothesis, /婚姻|遗憾/);

  const hypothesesPath = join(
    hypothesisRoot,
    'hypothesis-runs',
    runRef,
    'hypotheses.json',
  );
  const invocationPath = join(
    hypothesisRoot,
    'hypothesis-runs',
    runRef,
    'invocation.json',
  );
  const hypothesesBytes = await readFile(hypothesesPath, 'utf8');
  const invocationBytes = await readFile(invocationPath, 'utf8');
  assert.equal(source.sourceHypothesesBytes, hypothesesBytes);
  assert.equal(source.sourceHypothesisInvocationBytes, invocationBytes);
  assert.equal(source.hypothesesHash, sha256Hex(hypothesesBytes));
  assert.equal(
    source.selectedHypothesisHash,
    sha256Hex(canonicalJson(source.selectedHypothesis)),
  );
  assert.ok(source.gameRunPath.includes(runRef));
  assert.ok(source.mefSource.runRef === runRef);

  await assert.rejects(
    () => loadHypothesisInvestigationSource({
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypothesisRoot,
      runRef,
      hypothesisId: 'hypothesis-000099',
    }),
    /hypothesis-000099|unknown hypothesis/i,
  );

  const invocation = JSON.parse(invocationBytes) as Record<string, unknown>;
  await writeFile(
    invocationPath,
    canonicalJson({ ...invocation, status: 'failed' }),
  );
  await assert.rejects(
    () => loadHypothesisInvestigationSource({
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypothesisRoot,
      runRef,
      hypothesisId,
    }),
    /completed|status/i,
  );
  await writeFile(invocationPath, invocationBytes);

  await writeFile(
    invocationPath,
    canonicalJson({ ...invocation, runRef: 'other-run-ref-001' }),
  );
  await assert.rejects(
    () => loadHypothesisInvestigationSource({
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypothesisRoot,
      runRef,
      hypothesisId,
    }),
    /runRef|mismatch/i,
  );
  await writeFile(invocationPath, invocationBytes);

  await writeFile(
    invocationPath,
    canonicalJson({
      ...invocation,
      feedbackInvocationRef: 'wrong-feedback-invocation',
    }),
  );
  await assert.rejects(
    () => loadHypothesisInvestigationSource({
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypothesisRoot,
      runRef,
      hypothesisId,
    }),
    /feedbackInvocationRef|mismatch/i,
  );
  await writeFile(invocationPath, invocationBytes);

  await writeFile(
    invocationPath,
    canonicalJson({
      ...invocation,
      experimentRootHash: 'f'.repeat(64),
    }),
  );
  await assert.rejects(
    () => loadHypothesisInvestigationSource({
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypothesisRoot,
      runRef,
      hypothesisId,
    }),
    /experimentRootHash|mismatch/i,
  );
  await writeFile(invocationPath, invocationBytes);

  await writeFile(
    invocationPath,
    canonicalJson({
      ...invocation,
      observablePayloadHash: 'e'.repeat(64),
    }),
  );
  await assert.rejects(
    () => loadHypothesisInvestigationSource({
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypothesisRoot,
      runRef,
      hypothesisId,
    }),
    /observablePayloadHash|mismatch/i,
  );
  await writeFile(invocationPath, invocationBytes);

  await writeFile(
    invocationPath,
    canonicalJson({
      ...invocation,
      feedbackHash: 'd'.repeat(64),
    }),
  );
  await assert.rejects(
    () => loadHypothesisInvestigationSource({
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypothesisRoot,
      runRef,
      hypothesisId,
    }),
    /feedbackHash|mismatch/i,
  );
  await writeFile(invocationPath, invocationBytes);

  const sealPath = join(mefRoot, 'game-runs', runRef, 'experiment-root.sha256');
  const originalSeal = await readFile(sealPath, 'utf8');
  await writeFile(sealPath, '0'.repeat(64));
  await assert.rejects(
    () => loadHypothesisInvestigationSource({
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypothesisRoot,
      runRef,
      hypothesisId,
    }),
    /seal|hash|mismatch|experiment/i,
  );
  await writeFile(sealPath, originalSeal);

  const parsed = JSON.parse(hypothesesBytes) as {
    hypotheses: Array<Record<string, unknown>>;
  };
  parsed.hypotheses[1] = {
    ...parsed.hypotheses[1],
    evidenceRefs: ['entry-999999'],
  };
  await writeFile(hypothesesPath, canonicalJson(parsed));
  await assert.rejects(
    () => loadHypothesisInvestigationSource({
      mefSourceRoot: mefRoot,
      hypothesisSourceRoot: hypothesisRoot,
      runRef,
      hypothesisId,
    }),
    /entry-999999|unknown entryId/i,
  );
  await writeFile(hypothesesPath, hypothesesBytes);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHypothesisInvestigationSourceTests()
    .then(() => console.log('hypothesisInvestigationSource.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
