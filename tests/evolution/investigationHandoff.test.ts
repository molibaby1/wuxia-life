import assert from 'node:assert/strict';
import { projectInvestigationHandoff } from '../../src/evolution/investigationHandoff';
import type { HypothesisInvestigationResult } from '../../src/evolution/hypothesisInvestigationContract';

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
}
