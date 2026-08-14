import assert from 'node:assert/strict';
import type { ExternalFeedback } from '../../src/evolution/externalFeedbackContract';
import {
  parseImprovementHypothesisSet,
  validateImprovementHypothesisReferences,
} from '../../src/evolution/improvementHypothesisContract';
import {
  HEADLESS_API_PLAYER_SURFACE_ID,
  PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
  type ObservablePayload,
} from '../../src/evolution/playerObservableTranscript';

const payload: ObservablePayload = {
  transcriptVersion: PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
  surfaceId: HEADLESS_API_PLAYER_SURFACE_ID,
  transcriptId: 'transcript-hypothesis-test',
  entries: [{
    entryId: 'entry-000001',
    kind: 'story_event',
    title: '中年行旅',
    body: '你又一次踏上相似的行程。',
  }],
};

const feedback: ExternalFeedback = {
  overallImpression: '后半段让我觉得有些重复。',
  observations: [{
    feedback: '几段经历给我的感觉很像。',
    evidenceRefs: ['entry-000001'],
  }],
};

const validDraft = {
  hypothesis: '这次体验后半段可能缺乏足够的玩家可感知差异。',
  observedBasis: 'participant 明确表达了重复感。',
  feedbackRefs: ['observations[0]'],
  evidenceRefs: ['entry-000001'],
  unknowns: ['不知道该体验是否跨 run 普遍存在，也不知道因果来源。'],
  productSignificance: '如果成立，可能削弱长生命周期体验的变化感。',
};

export function runImprovementHypothesisContractTests(): void {
  const zero = parseImprovementHypothesisSet('{"hypotheses":[]}');
  assert.deepEqual(zero, { hypotheses: [] });

  const one = parseImprovementHypothesisSet(JSON.stringify({
    hypotheses: [validDraft],
  }));
  assert.equal(one.hypotheses[0]?.hypothesisId, 'hypothesis-000001');
  validateImprovementHypothesisReferences(one, feedback, payload);

  const two = parseImprovementHypothesisSet(JSON.stringify({
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
  }));
  assert.deepEqual(two.hypotheses.map(item => item.hypothesisId), [
    'hypothesis-000001',
    'hypothesis-000002',
  ]);

  for (const forbidden of [
    'severity',
    'priority',
    'confidence',
    'score',
    'proposedChanges',
    'modificationProposal',
  ]) {
    assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
      hypotheses: [{
        ...validDraft,
        [forbidden]: 'not allowed',
      }],
    })), /unknown field/i);
  }

  assert.throws(
    () => validateImprovementHypothesisReferences(one, feedback, {
      ...payload,
      entries: [],
    }),
    /entry-000001|unknown entryId/i,
  );

  const badFeedbackRef = parseImprovementHypothesisSet(JSON.stringify({
    hypotheses: [{
      hypothesis: '潜在问题。',
      observedBasis: '观察。',
      feedbackRefs: ['observations[9]'],
      evidenceRefs: [],
      unknowns: ['仍未知。'],
      productSignificance: '值得调查。',
    }],
  }));
  assert.throws(
    () => validateImprovementHypothesisReferences(badFeedbackRef, feedback, payload),
    /observations\[9\]|unknown feedback/i,
  );

  assert.throws(
    () => parseImprovementHypothesisSet('[]'),
    /must be an object/i,
  );
  assert.throws(
    () => parseImprovementHypothesisSet('{}'),
    /hypotheses/i,
  );
  assert.throws(
    () => parseImprovementHypothesisSet(JSON.stringify({ hypotheses: 'nope' })),
    /hypotheses must be an array/i,
  );

  for (const field of ['hypothesis', 'observedBasis', 'productSignificance'] as const) {
    assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
      hypotheses: [{ ...validDraft, [field]: '' }],
    })), new RegExp(field, 'i'));
  }

  assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
    hypotheses: [{ ...validDraft, feedbackRefs: [] }],
  })), /feedbackRefs/i);

  assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
    hypotheses: [{ ...validDraft, unknowns: [] }],
  })), /unknowns/i);

  assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
    hypotheses: [{ ...validDraft, feedbackRefs: [1] }],
  })), /feedbackRefs\[0\]/i);

  assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
    hypotheses: [{ ...validDraft, evidenceRefs: [''] }],
  })), /evidenceRefs\[0\]/i);

  assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
    hypotheses: [{ ...validDraft, unknowns: [42] }],
  })), /unknowns\[0\]/i);

  assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
    hypotheses: [{ ...validDraft, hypothesisId: 'hypothesis-999999' }],
  })), /unknown field/i);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runImprovementHypothesisContractTests();
  console.log('improvementHypothesisContract.test.ts: ok');
}
