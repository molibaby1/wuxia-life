import assert from 'node:assert/strict';
import {
  EXPERIENCE_PATTERN_EVIDENCE_SCHEMA_VERSION,
  serializeExperiencePatternEvidence,
  validateExperiencePatternEvidence,
} from '../../src/evolution/experiencePatternEvidenceContract';
import { buildExperienceSemanticContext } from '../../src/evolution/experienceSemanticContext';
import { extractExperiencePatternEvidence } from '../../scripts/evolution/experiencePattern/buildExperiencePatternEvidence';
import type { ComparativeFeedback } from '../../src/evolution/comparativeFeedbackContract';

const repeatedContext = buildExperienceSemanticContext({ age: 16, kind: 'story_event' });

function runEvidence(runRef: string, body: string) {
  return {
    runRef,
    items: [{
      evidenceId: 'observable:entry-000001',
      kind: 'observable_entry',
      payload: {
        entryId: 'entry-000001',
        kind: 'story_event',
        age: 16,
        body,
        experienceContext: repeatedContext,
      },
    }],
  };
}

const comparativeEvidence: ComparativeFeedback = {
  overallComparison: '两段体验都出现了相同的早期成长语义。',
  observations: [{
    comparison: '两段体验都包含早期叙事事件。',
    experienceARefs: ['entry-000001'],
    experienceBRefs: ['entry-000001'],
  }],
};

export function runExperiencePatternEvidenceTests(): void {
  const evidence = extractExperiencePatternEvidence({
    runs: [runEvidence('run-000001', '第一段经历。'), runEvidence('run-000002', '第二段经历。')],
    comparativeEvidence: [{
      comparisonId: 'comparison-000001',
      baselineRunRef: 'run-000001',
      candidateRunRef: 'run-000002',
      feedback: comparativeEvidence,
    }],
  });

  assert.equal(evidence.schemaVersion, EXPERIENCE_PATTERN_EVIDENCE_SCHEMA_VERSION);
  assert.equal(evidence.patterns.length, 1);
  const pattern = evidence.patterns[0]!;
  assert.equal(pattern.patternType, 'frequency');
  assert.deepEqual(pattern.supportingRuns, ['run-000001', 'run-000002']);
  assert.deepEqual(pattern.evidenceRefs, [
    'comparison:comparison-000001:observation:0',
    'run:run-000001:observable:entry-000001',
    'run:run-000002:observable:entry-000001',
  ]);
  assert.deepEqual(pattern.experienceContextRefs, [
    'run:run-000001:entry:entry-000001:experienceContext',
    'run:run-000002:entry:entry-000001:experienceContext',
  ]);
  assert.equal(Object.keys(pattern).includes('confidence'), false);
  assert.equal(Object.keys(pattern).includes('verdict'), false);
  assert.equal(Object.keys(pattern).includes('solutionRecommendation'), false);

  assert.deepEqual(
    validateExperiencePatternEvidence(JSON.parse(serializeExperiencePatternEvidence(evidence))),
    evidence,
  );
  assert.throws(
    () => validateExperiencePatternEvidence({
      ...evidence,
      patterns: [{ ...pattern, patternType: 'unsupported' as never }],
    }),
    /patternType.*invalid/i,
  );

  const legacyEvidence = {
    schemaVersion: EXPERIENCE_PATTERN_EVIDENCE_SCHEMA_VERSION,
    patterns: [{
      patternId: 'pattern-legacy-000001',
      description: '旧 artifact pattern。',
      supportingRuns: ['run-000001', 'run-000002'],
      evidenceRefs: ['run:run-000001:observable:entry-000001'],
      experienceContextRefs: ['run:run-000001:entry:entry-000001:experienceContext'],
    }],
  };
  assert.deepEqual(validateExperiencePatternEvidence(legacyEvidence), legacyEvidence);
  assert.equal(serializeExperiencePatternEvidence(legacyEvidence), JSON.stringify(legacyEvidence));

  const noPattern = extractExperiencePatternEvidence({
    runs: [runEvidence('run-000001', '只有一段经历。')],
    comparativeEvidence: [],
  });
  assert.deepEqual(noPattern.patterns, []);

  const legacyOnly = extractExperiencePatternEvidence({
    runs: [{
      runRef: 'legacy-run-000001',
      items: [{
        evidenceId: 'observable:entry-000001',
        kind: 'observable_entry',
        payload: {
          entryId: 'entry-000001',
          kind: 'story_event',
          body: '旧 artifact，没有 Experience Semantic Context。',
        },
      }],
    }],
    comparativeEvidence: [],
  });
  assert.deepEqual(legacyOnly.patterns, []);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    runExperiencePatternEvidenceTests();
    console.log('experiencePatternEvidence.test.ts: ok');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
