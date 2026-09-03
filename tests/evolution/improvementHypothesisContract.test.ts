import assert from 'node:assert/strict';
import type { ExternalFeedback } from '../../src/evolution/externalFeedbackContract';
import {
  parseImprovementHypothesisSet,
  parseStoredImprovementHypothesisSet,
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
  const zero = parseImprovementHypothesisSet(JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [],
    noProblemAssessment: {
      rationale: '反馈只描述了一次局部感受，无法形成稳定的产品问题假设。',
      feedbackRefs: ['overallImpression', 'observations[0]'],
      evidenceRefs: ['entry-000001'],
    },
  }));
  assert.equal(zero.schemaVersion, 'improvement-hypothesis-set-v2');
  assert.equal(zero.noProblemAssessment?.rationale, '反馈只描述了一次局部感受，无法形成稳定的产品问题假设。');

  assert.throws(
    () => parseImprovementHypothesisSet(JSON.stringify({
      schemaVersion: 'improvement-hypothesis-set-v2',
      hypotheses: [],
      noProblemAssessment: null,
    })),
    /noProblemAssessment/i,
  );

  const one = parseImprovementHypothesisSet(JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [validDraft],
    noProblemAssessment: null,
  }));
  assert.equal(one.hypotheses[0]?.hypothesisId, 'hypothesis-000001');
  validateImprovementHypothesisReferences(one, feedback, payload);

  const two = parseImprovementHypothesisSet(JSON.stringify({
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
  }));
  assert.deepEqual(two.hypotheses.map(item => item.hypothesisId), [
    'hypothesis-000001',
    'hypothesis-000002',
  ]);

  assert.throws(
    () => parseImprovementHypothesisSet(JSON.stringify({
      schemaVersion: 'improvement-hypothesis-set-v2',
      hypotheses: [validDraft],
      noProblemAssessment: {
        rationale: '不应与 hypothesis 同时存在。',
        feedbackRefs: ['overallImpression'],
        evidenceRefs: [],
      },
    })),
    /noProblemAssessment/i,
  );

  for (const forbidden of [
    'severity',
    'priority',
    'confidence',
    'score',
    'proposedChanges',
    'modificationProposal',
  ]) {
    assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
      schemaVersion: 'improvement-hypothesis-set-v2',
      hypotheses: [{
        ...validDraft,
        [forbidden]: 'not allowed',
      }],
      noProblemAssessment: null,
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
    /schemaVersion/i,
  );
  assert.throws(
    () => parseImprovementHypothesisSet(JSON.stringify({
      schemaVersion: 'improvement-hypothesis-set-v2',
      hypotheses: 'nope',
      noProblemAssessment: null,
    })),
    /hypotheses must be an array/i,
  );

  for (const field of ['hypothesis', 'observedBasis', 'productSignificance'] as const) {
    assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
      schemaVersion: 'improvement-hypothesis-set-v2',
      hypotheses: [{ ...validDraft, [field]: '' }],
      noProblemAssessment: null,
    })), new RegExp(field, 'i'));
  }

  assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [{ ...validDraft, feedbackRefs: [] }],
    noProblemAssessment: null,
  })), /feedbackRefs/i);

  assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [{ ...validDraft, unknowns: [] }],
    noProblemAssessment: null,
  })), /unknowns/i);

  assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [{ ...validDraft, feedbackRefs: [1] }],
    noProblemAssessment: null,
  })), /feedbackRefs\[0\]/i);

  assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [{ ...validDraft, evidenceRefs: [''] }],
    noProblemAssessment: null,
  })), /evidenceRefs\[0\]/i);

  assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [{ ...validDraft, unknowns: [42] }],
    noProblemAssessment: null,
  })), /unknowns\[0\]/i);

  assert.throws(() => parseImprovementHypothesisSet(JSON.stringify({
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [{ ...validDraft, hypothesisId: 'hypothesis-999999' }],
    noProblemAssessment: null,
  })), /unknown field/i);

  const legacy = parseStoredImprovementHypothesisSet(JSON.stringify({ hypotheses: [validDraft] }));
  assert.equal(legacy.schemaVersion, 'improvement-hypothesis-set-v1');
  assert.equal(legacy.hypotheses[0]?.hypothesisId, 'hypothesis-000001');
  const legacyEmpty = parseStoredImprovementHypothesisSet('{"hypotheses":[]}');
  assert.equal(legacyEmpty.schemaVersion, 'improvement-hypothesis-set-v1');
  assert.equal(legacyEmpty.noProblemAssessment, null);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runImprovementHypothesisContractTests();
  console.log('improvementHypothesisContract.test.ts: ok');
}
