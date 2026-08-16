import type { HypothesisInvestigationResult } from './hypothesisInvestigationContract';

export type InvestigationHandoffKind =
  | 'confirmed_fact'
  | 'relevant_mechanism'
  | 'limiting_evidence'
  | 'unresolved_question'
  | 'evidence_gap';

export type InvestigationHandoffItem = {
  ref: string;
  kind: InvestigationHandoffKind;
  statement: string;
  evidenceRefs: string[];
};

export type InvestigationHandoff = {
  items: InvestigationHandoffItem[];
};

function padIndex(index: number): string {
  return String(index + 1).padStart(6, '0');
}

function refFor(kind: InvestigationHandoffKind, index: number): string {
  const slug =
    kind === 'confirmed_fact' ? 'confirmed-fact'
    : kind === 'relevant_mechanism' ? 'relevant-mechanism'
    : kind === 'limiting_evidence' ? 'limiting-evidence'
    : kind === 'unresolved_question' ? 'unresolved-question'
    : 'evidence-gap';
  return `investigation:${slug}:${padIndex(index)}`;
}

/**
 * Pure deterministic read-only projection of sealed Investigation epistemic state.
 * Does not reinterpret statements or invent evidence refs.
 */
export function projectInvestigationHandoff(
  investigation: HypothesisInvestigationResult,
): InvestigationHandoff {
  const items: InvestigationHandoffItem[] = [];

  investigation.confirmedFacts.forEach((entry, index) => {
    items.push({
      ref: refFor('confirmed_fact', index),
      kind: 'confirmed_fact',
      statement: entry.statement,
      evidenceRefs: [...entry.evidenceRefs],
    });
  });

  investigation.relevantMechanisms.forEach((entry, index) => {
    items.push({
      ref: refFor('relevant_mechanism', index),
      kind: 'relevant_mechanism',
      statement: entry.statement,
      evidenceRefs: [...entry.evidenceRefs],
    });
  });

  investigation.limitingEvidence.forEach((entry, index) => {
    items.push({
      ref: refFor('limiting_evidence', index),
      kind: 'limiting_evidence',
      statement: entry.statement,
      evidenceRefs: [...entry.evidenceRefs],
    });
  });

  investigation.unresolvedQuestions.forEach((statement, index) => {
    items.push({
      ref: refFor('unresolved_question', index),
      kind: 'unresolved_question',
      statement,
      evidenceRefs: [],
    });
  });

  investigation.evidenceGaps.forEach((statement, index) => {
    items.push({
      ref: refFor('evidence_gap', index),
      kind: 'evidence_gap',
      statement,
      evidenceRefs: [],
    });
  });

  return { items };
}

export function investigationHandoffRefIndex(
  handoff: InvestigationHandoff,
): ReadonlyMap<string, InvestigationHandoffItem> {
  return new Map(handoff.items.map(item => [item.ref, item]));
}
