import assert from 'node:assert/strict';
import { projectInvestigationHandoff } from '../../src/evolution/investigationHandoff';
import type { HypothesisInvestigationResult } from '../../src/evolution/hypothesisInvestigationContract';
import { buildExperienceSemanticContext } from '../../src/evolution/experienceSemanticContext';

function sampleInvestigation(): HypothesisInvestigationResult {
  return {
    confirmedFacts: [
      { statement: 'fact-one', evidenceRefs: ['ev:a', 'ev:b'] },
      { statement: 'fact-two', evidenceRefs: ['ev:c'] },
    ],
    relevantMechanisms: [
      { statement: 'mech-one', evidenceRefs: ['ev:m1'] },
    ],
    limitingEvidence: [
      { statement: 'limit-one', evidenceRefs: ['ev:l1'] },
      { statement: 'limit-two', evidenceRefs: ['ev:l2'] },
    ],
    unresolvedQuestions: ['unresolved-one', 'unresolved-two'],
    evidenceGaps: ['gap-one'],
  };
}

export function runInvestigationHandoffTests(): void {
  const investigation = sampleInvestigation();
  const handoff = projectInvestigationHandoff(investigation);

  assert.equal(handoff.items.length, 8);

  assert.deepEqual(
    handoff.items.map(item => item.ref),
    [
      'investigation:confirmed-fact:000001',
      'investigation:confirmed-fact:000002',
      'investigation:relevant-mechanism:000001',
      'investigation:limiting-evidence:000001',
      'investigation:limiting-evidence:000002',
      'investigation:unresolved-question:000001',
      'investigation:unresolved-question:000002',
      'investigation:evidence-gap:000001',
    ],
  );

  assert.deepEqual(
    handoff.items.map(item => item.kind),
    [
      'confirmed_fact',
      'confirmed_fact',
      'relevant_mechanism',
      'limiting_evidence',
      'limiting_evidence',
      'unresolved_question',
      'unresolved_question',
      'evidence_gap',
    ],
  );

  assert.deepEqual(
    handoff.items.map(item => item.statement),
    [
      'fact-one',
      'fact-two',
      'mech-one',
      'limit-one',
      'limit-two',
      'unresolved-one',
      'unresolved-two',
      'gap-one',
    ],
  );

  assert.deepEqual(handoff.items[0]!.evidenceRefs, ['ev:a', 'ev:b']);
  assert.deepEqual(handoff.items[2]!.evidenceRefs, ['ev:m1']);
  assert.deepEqual(handoff.items[3]!.evidenceRefs, ['ev:l1']);
  assert.deepEqual(handoff.items[5]!.evidenceRefs, []);
  assert.deepEqual(handoff.items[7]!.evidenceRefs, []);

  const again = projectInvestigationHandoff(investigation);
  assert.deepEqual(again, handoff);

  const emptyUnresolved = projectInvestigationHandoff({
    confirmedFacts: [],
    relevantMechanisms: [],
    limitingEvidence: [],
    unresolvedQuestions: ['only-q'],
    evidenceGaps: ['only-gap'],
  });
  assert.deepEqual(emptyUnresolved.items[0], {
    ref: 'investigation:unresolved-question:000001',
    kind: 'unresolved_question',
    statement: 'only-q',
    evidenceRefs: [],
  });
  assert.deepEqual(emptyUnresolved.items[1], {
    ref: 'investigation:evidence-gap:000001',
    kind: 'evidence_gap',
    statement: 'only-gap',
    evidenceRefs: [],
  });

  const withPattern = projectInvestigationHandoff({
    confirmedFacts: [{
      statement: 'investigation used all supplied evidence kinds',
      evidenceRefs: [
        'feedback:observations[0]',
        'observable:entry-000001',
        'pattern:pattern-000001',
      ],
    }],
    relevantMechanisms: [],
    limitingEvidence: [],
    unresolvedQuestions: [],
    evidenceGaps: [],
  }, {
    runRef: 'run-000001',
    items: [
      {
        evidenceId: 'feedback:observations[0]',
        kind: 'feedback',
        payload: { text: '一次反馈。' },
      },
      {
        evidenceId: 'observable:entry-000001',
        kind: 'observable_entry',
        payload: {
          entryId: 'entry-000001',
          experienceContext: buildExperienceSemanticContext({ age: 16, kind: 'story_event' }),
        },
      },
      {
        evidenceId: 'pattern:pattern-000001',
        kind: 'experience_pattern',
        payload: {
          patternId: 'pattern-000001',
          experienceContextRefs: ['run:run-000001:entry:entry-000001:experienceContext'],
        },
      },
    ],
  });
  assert.deepEqual(withPattern.evidenceBasis, [
    {
      kind: 'single_run_observation',
      evidenceRefs: ['feedback:observations[0]', 'observable:entry-000001'],
    },
    {
      kind: 'multi_run_pattern',
      evidenceRefs: ['pattern:pattern-000001'],
    },
    {
      kind: 'experience_semantic_context',
      evidenceRefs: ['run:run-000001:entry:entry-000001:experienceContext'],
    },
  ]);
}
