import assert from 'node:assert/strict';
import {
  parseHypothesisInvestigationResult,
  validateHypothesisInvestigationReferences,
} from '../../src/evolution/hypothesisInvestigationContract';

const emptyGapResult = {
  confirmedFacts: [],
  relevantMechanisms: [],
  limitingEvidence: [],
  unresolvedQuestions: ['当前单次 run 无法判断多数玩家是否产生同样遗憾。'],
  evidenceGaps: ['当前 evidence 不包含新的外部体验样本。'],
};

const validStatement = {
  statement: 'source run 包含 family_marriage。',
  evidenceRefs: ['source-catalog:family_marriage'],
};

export function runHypothesisInvestigationContractTests(): void {
  const result = parseHypothesisInvestigationResult(JSON.stringify(emptyGapResult));
  assert.equal(result.confirmedFacts.length, 0);
  assert.equal(result.relevantMechanisms.length, 0);
  assert.equal(result.limitingEvidence.length, 0);
  assert.deepEqual(result.unresolvedQuestions, emptyGapResult.unresolvedQuestions);
  assert.deepEqual(result.evidenceGaps, emptyGapResult.evidenceGaps);

  const withFact = parseHypothesisInvestigationResult(JSON.stringify({
    confirmedFacts: [validStatement],
    relevantMechanisms: [],
    limitingEvidence: [],
    unresolvedQuestions: [],
    evidenceGaps: [],
  }));
  assert.equal(withFact.confirmedFacts[0]?.statement, validStatement.statement);
  assert.deepEqual(withFact.confirmedFacts[0]?.evidenceRefs, validStatement.evidenceRefs);

  for (const forbidden of [
    'confirmedHypothesis',
    'rejectedHypothesis',
    'rootCause',
    'confidence',
    'severity',
    'priority',
    'score',
    'recommendation',
    'proposedChanges',
    'modificationProposal',
  ]) {
    assert.throws(() => parseHypothesisInvestigationResult(JSON.stringify({
      ...emptyGapResult,
      [forbidden]: 'not allowed',
    })), /unknown field/i);
  }

  assert.throws(() => parseHypothesisInvestigationResult(JSON.stringify({
    confirmedFacts: [{
      statement: '事实。',
      evidenceRefs: ['source-catalog:family_marriage'],
      confidence: 0.9,
    }],
    relevantMechanisms: [],
    limitingEvidence: [],
    unresolvedQuestions: [],
    evidenceGaps: [],
  })), /unknown field/i);

  assert.throws(() => parseHypothesisInvestigationResult(JSON.stringify({
    confirmedFacts: [{
      statement: '',
      evidenceRefs: ['source-catalog:family_marriage'],
    }],
    relevantMechanisms: [],
    limitingEvidence: [],
    unresolvedQuestions: [],
    evidenceGaps: [],
  })), /statement/i);

  assert.throws(() => parseHypothesisInvestigationResult(JSON.stringify({
    confirmedFacts: [{
      statement: '事实。',
      evidenceRefs: [],
    }],
    relevantMechanisms: [],
    limitingEvidence: [],
    unresolvedQuestions: [],
    evidenceGaps: [],
  })), /evidenceRefs/i);

  assert.throws(() => parseHypothesisInvestigationResult(JSON.stringify({
    confirmedFacts: [{
      statement: '事实。',
      evidenceRefs: [''],
    }],
    relevantMechanisms: [],
    limitingEvidence: [],
    unresolvedQuestions: [],
    evidenceGaps: [],
  })), /evidenceRefs\[0\]/i);

  assert.throws(() => parseHypothesisInvestigationResult('[]'), /must be an object/i);
  assert.throws(() => parseHypothesisInvestigationResult('{}'), /confirmedFacts|unknown field|must/i);
  assert.throws(
    () => parseHypothesisInvestigationResult(JSON.stringify({
      ...emptyGapResult,
      unresolvedQuestions: [1],
    })),
    /unresolvedQuestions\[0\]/i,
  );
  assert.throws(
    () => parseHypothesisInvestigationResult(JSON.stringify({
      ...emptyGapResult,
      evidenceGaps: [''],
    })),
    /evidenceGaps\[0\]/i,
  );

  const allowed = new Set(['source-catalog:family_marriage']);
  validateHypothesisInvestigationReferences({
    confirmedFacts: [validStatement],
    relevantMechanisms: [],
    limitingEvidence: [],
    unresolvedQuestions: [],
    evidenceGaps: [],
  }, allowed);

  assert.throws(
    () => validateHypothesisInvestigationReferences({
      confirmedFacts: [{
        statement: '引用了不存在的 evidence。',
        evidenceRefs: ['source-catalog:not-real'],
      }],
      relevantMechanisms: [],
      limitingEvidence: [],
      unresolvedQuestions: [],
      evidenceGaps: [],
    }, allowed),
    /source-catalog:not-real|unknown evidence/i,
  );

  validateHypothesisInvestigationReferences({
    confirmedFacts: [],
    relevantMechanisms: [],
    limitingEvidence: [],
    unresolvedQuestions: ['仍未知。'],
    evidenceGaps: ['缺少更多体验样本。'],
  }, allowed);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHypothesisInvestigationContractTests();
  console.log('hypothesisInvestigationContract.test.ts: ok');
}
