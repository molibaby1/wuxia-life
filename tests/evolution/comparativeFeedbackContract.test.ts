import assert from 'node:assert/strict';
import {
  HEADLESS_API_PLAYER_SURFACE_ID,
  PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
  type ObservablePayload,
} from '../../src/evolution/playerObservableTranscript';
import {
  parseComparativeFeedback,
  validateComparativeFeedbackReferences,
  type ComparativeFeedback,
} from '../../src/evolution/comparativeFeedbackContract';

const experienceA: ObservablePayload = {
  transcriptVersion: PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
  surfaceId: HEADLESS_API_PLAYER_SURFACE_ID,
  transcriptId: 'transcript-a',
  entries: [{
    entryId: 'entry-000001',
    kind: 'story_event',
    title: '体验 A',
    body: '基线文本。',
  }],
};

const experienceB: ObservablePayload = {
  transcriptVersion: PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
  surfaceId: HEADLESS_API_PLAYER_SURFACE_ID,
  transcriptId: 'transcript-b',
  entries: [{
    entryId: 'entry-000001',
    kind: 'story_event',
    title: '体验 B',
    body: '候选文本。',
  }, {
    entryId: 'entry-000002',
    kind: 'story_event',
    body: '仅 B 有。',
  }],
};

const valid: ComparativeFeedback = {
  overallComparison: '两段体验在开场语气上不同。',
  observations: [{
    comparison: 'B 多了一句夜里讲述的内容。',
    experienceARefs: ['entry-000001'],
    experienceBRefs: ['entry-000001'],
  }],
};

export function runComparativeFeedbackContractTests(): void {
  const parsed = parseComparativeFeedback(JSON.stringify(valid));
  assert.deepEqual(parsed, valid);
  validateComparativeFeedbackReferences(parsed, experienceA, experienceB);

  const emptyObservations = parseComparativeFeedback(JSON.stringify({
    overallComparison: '几乎感觉不到差别。',
    observations: [],
  }));
  assert.deepEqual(emptyObservations.observations, []);
  validateComparativeFeedbackReferences(emptyObservations, experienceA, experienceB);

  assert.throws(
    () => validateComparativeFeedbackReferences({
      ...valid,
      observations: [{
        comparison: 'A 引用不存在。',
        experienceARefs: ['entry-999999'],
        experienceBRefs: [],
      }],
    }, experienceA, experienceB),
    /experienceARefs.*entry-999999|unknown entryId/i,
  );

  assert.throws(
    () => validateComparativeFeedbackReferences({
      ...valid,
      observations: [{
        comparison: 'B 引用不存在。',
        experienceARefs: [],
        experienceBRefs: ['entry-888888'],
      }],
    }, experienceA, experienceB),
    /experienceBRefs.*entry-888888|unknown entryId/i,
  );

  // Duplicate entry IDs across A/B are namespaced by separate arrays.
  validateComparativeFeedbackReferences({
    overallComparison: '同一 entryId 分属两边。',
    observations: [{
      comparison: '都引用 entry-000001。',
      experienceARefs: ['entry-000001'],
      experienceBRefs: ['entry-000001'],
    }],
  }, experienceA, experienceB);

  for (const forbiddenField of [
    'winner',
    'score',
    'rating',
    'confidence',
    'severity',
    'priority',
    'promotion',
  ]) {
    assert.throws(
      () => parseComparativeFeedback(JSON.stringify({
        overallComparison: '比较。',
        observations: [],
        [forbiddenField]: 'high',
      })),
      /unknown field/i,
    );
    assert.throws(
      () => parseComparativeFeedback(JSON.stringify({
        overallComparison: '比较。',
        observations: [{
          comparison: '观察。',
          experienceARefs: [],
          experienceBRefs: [],
          [forbiddenField]: 'high',
        }],
      })),
      /unknown field/i,
    );
  }

  assert.throws(
    () => parseComparativeFeedback('{not-json'),
    /valid JSON/i,
  );

  assert.throws(
    () => parseComparativeFeedback(JSON.stringify({
      observations: [],
    })),
    /overallComparison/i,
  );

  assert.throws(
    () => parseComparativeFeedback(JSON.stringify({
      overallComparison: '',
      observations: [],
    })),
    /overallComparison/i,
  );

  assert.throws(
    () => parseComparativeFeedback(JSON.stringify({
      overallComparison: '比较。',
      observations: 'not-an-array',
    })),
    /observations/i,
  );

  assert.throws(
    () => parseComparativeFeedback(JSON.stringify({
      overallComparison: '比较。',
      observations: [{
        comparison: '',
        experienceARefs: [],
        experienceBRefs: [],
      }],
    })),
    /comparison/i,
  );

  assert.throws(
    () => parseComparativeFeedback(JSON.stringify({
      overallComparison: '比较。',
      observations: [{
        comparison: '观察。',
        experienceARefs: [1],
        experienceBRefs: [],
      }],
    })),
    /experienceARefs\[0\] must be a non-empty string/i,
  );

  assert.throws(
    () => parseComparativeFeedback(JSON.stringify({
      overallComparison: '比较。',
      observations: [{
        comparison: '观察。',
        experienceARefs: [''],
        experienceBRefs: ['entry-000002'],
      }],
    })),
    /experienceARefs\[0\] must be a non-empty string/i,
  );

  const subjectiveText = '我更喜欢 Experience B，但这只是我的主观偏好。';
  const subjective = parseComparativeFeedback(JSON.stringify({
    overallComparison: subjectiveText,
    observations: [{
      comparison: subjectiveText,
      experienceARefs: ['entry-000001'],
      experienceBRefs: ['entry-000002'],
    }],
  }));
  assert.equal(subjective.overallComparison, subjectiveText);
  validateComparativeFeedbackReferences(subjective, experienceA, experienceB);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runComparativeFeedbackContractTests();
  console.log('comparativeFeedbackContract.test.ts: ok');
}
