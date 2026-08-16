import assert from 'node:assert/strict';
import {
  HEADLESS_API_PLAYER_SURFACE_ID,
  PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
  type ObservablePayload,
} from '../../src/evolution/playerObservableTranscript';
import {
  parseExternalFeedback,
  validateExternalFeedbackReferences,
  type ExternalFeedback,
} from '../../src/evolution/externalFeedbackContract';

const samplePayload: ObservablePayload = {
  transcriptVersion: PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
  surfaceId: HEADLESS_API_PLAYER_SURFACE_ID,
  transcriptId: 'transcript-0001',
  entries: [{
    entryId: 'entry-000001',
    kind: 'story_event',
    title: '初入江湖',
    body: '你来到山门之前。',
  }],
};

const valid: ExternalFeedback = {
  overallImpression: '这段人生前期有期待，中段让我觉得重复。',
  observations: [{
    feedback: '连续几段经历让我觉得节奏很像。',
    evidenceRefs: ['entry-000001'],
  }],
};

export function runExternalFeedbackContractTests(): void {
  const validJson = JSON.stringify(valid);
  const parsed = parseExternalFeedback(validJson);
  assert.deepEqual(parsed, valid);
  validateExternalFeedbackReferences(parsed, samplePayload);

  const emptyObservations = parseExternalFeedback(JSON.stringify({
    overallImpression: '整体还行。',
    observations: [],
  }));
  assert.deepEqual(emptyObservations.observations, []);
  validateExternalFeedbackReferences(emptyObservations, samplePayload);

  assert.throws(
    () => validateExternalFeedbackReferences({
      ...valid,
      observations: [{
        feedback: '引用不存在。',
        evidenceRefs: ['entry-999999'],
      }],
    }, samplePayload),
    /entry-999999|unknown entryId|not found/i,
  );

  for (const forbiddenField of ['severity', 'confidence', 'score', 'qualification']) {
    assert.throws(
      () => parseExternalFeedback(JSON.stringify({
        overallImpression: '印象。',
        observations: [],
        [forbiddenField]: 'high',
      })),
      /unknown field/i,
    );
    assert.throws(
      () => parseExternalFeedback(JSON.stringify({
        overallImpression: '印象。',
        observations: [{
          feedback: '观察。',
          evidenceRefs: [],
          [forbiddenField]: 'high',
        }],
      })),
      /unknown field/i,
    );
  }

  assert.throws(
    () => parseExternalFeedback(JSON.stringify({
      observations: [{ feedback: '缺 overallImpression。', evidenceRefs: [] }],
    })),
    /overallImpression/i,
  );

  assert.throws(
    () => parseExternalFeedback(JSON.stringify({
      overallImpression: '印象。',
      observations: 'not-an-array',
    })),
    /observations/i,
  );

  assert.throws(
    () => parseExternalFeedback(JSON.stringify({
      overallImpression: '印象。',
      observations: [{ feedback: '', evidenceRefs: [] }],
    })),
    /feedback/i,
  );

  assert.throws(
    () => parseExternalFeedback(JSON.stringify({
      overallImpression: '印象。',
      observations: [{ feedback: '观察。', evidenceRefs: [''] }],
    })),
    /evidenceRefs\[0\] must be a non-empty string/i,
  );

  const subjectiveText = '这十年非常无聊，完全不值得玩。';
  const subjective = parseExternalFeedback(JSON.stringify({
    overallImpression: subjectiveText,
    observations: [{
      feedback: subjectiveText,
      evidenceRefs: ['entry-000001'],
    }],
  }));
  assert.equal(subjective.overallImpression, subjectiveText);
  assert.equal(subjective.observations[0]?.feedback, subjectiveText);
  validateExternalFeedbackReferences(subjective, samplePayload);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExternalFeedbackContractTests();
  console.log('externalFeedbackContract.test.ts: ok');
}
