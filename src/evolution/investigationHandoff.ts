import type { HypothesisInvestigationResult } from './hypothesisInvestigationContract';
import { validateExperienceSemanticContext } from './experienceSemanticContext';

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

export type InvestigationEvidenceBasisKind =
  | 'single_run_observation'
  | 'multi_run_pattern'
  | 'experience_semantic_context';

export type InvestigationEvidenceBasis = {
  kind: InvestigationEvidenceBasisKind;
  evidenceRefs: string[];
};

export type InvestigationHandoffEvidenceItem = {
  evidenceId: string;
  kind: string;
  payload: unknown;
};

export type InvestigationHandoffEvidence = {
  runRef?: string;
  items: readonly InvestigationHandoffEvidenceItem[];
};

export type InvestigationHandoff = {
  items: InvestigationHandoffItem[];
  evidenceBasis?: InvestigationEvidenceBasis[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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

function statementEvidenceRefs(investigation: HypothesisInvestigationResult): string[] {
  return [
    ...investigation.confirmedFacts,
    ...investigation.relevantMechanisms,
    ...investigation.limitingEvidence,
  ].flatMap(statement => statement.evidenceRefs);
}

function addContextRefFromObservable(
  contextRefs: Set<string>,
  evidence: InvestigationHandoffEvidence,
  item: InvestigationHandoffEvidenceItem,
): void {
  if (item.kind !== 'observable_entry' || !isRecord(item.payload)) return;
  if (item.payload.experienceContext === undefined) return;
  validateExperienceSemanticContext(item.payload.experienceContext);
  if (typeof evidence.runRef !== 'string' || typeof item.payload.entryId !== 'string') return;
  contextRefs.add(`run:${evidence.runRef}:entry:${item.payload.entryId}:experienceContext`);
}

function addContextRefsFromPattern(
  contextRefs: Set<string>,
  item: InvestigationHandoffEvidenceItem,
): void {
  if (item.kind !== 'experience_pattern' || !isRecord(item.payload)) return;
  if (!Array.isArray(item.payload.experienceContextRefs)) return;
  for (const ref of item.payload.experienceContextRefs) {
    if (typeof ref === 'string' && ref.length > 0) contextRefs.add(ref);
  }
}

function projectEvidenceBasis(
  investigation: HypothesisInvestigationResult,
  evidence: InvestigationHandoffEvidence | undefined,
): InvestigationEvidenceBasis[] | undefined {
  if (evidence === undefined) return undefined;

  const byRef = new Map(evidence.items.map(item => [item.evidenceId, item]));
  const singleRunRefs = new Set<string>();
  const multiRunPatternRefs = new Set<string>();
  const experienceContextRefs = new Set<string>();

  for (const evidenceRef of statementEvidenceRefs(investigation)) {
    const item = byRef.get(evidenceRef);
    if (!item) continue;
    if (item.kind === 'experience_pattern') {
      multiRunPatternRefs.add(evidenceRef);
      addContextRefsFromPattern(experienceContextRefs, item);
      continue;
    }
    if (item.kind === 'feedback' || item.kind === 'observable_entry' || item.kind === 'source_step') {
      singleRunRefs.add(evidenceRef);
      addContextRefFromObservable(experienceContextRefs, evidence, item);
    }
  }

  const basis: InvestigationEvidenceBasis[] = [];
  if (singleRunRefs.size > 0) {
    basis.push({
      kind: 'single_run_observation',
      evidenceRefs: [...singleRunRefs].sort((left, right) => left.localeCompare(right)),
    });
  }
  if (multiRunPatternRefs.size > 0) {
    basis.push({
      kind: 'multi_run_pattern',
      evidenceRefs: [...multiRunPatternRefs].sort((left, right) => left.localeCompare(right)),
    });
  }
  if (experienceContextRefs.size > 0) {
    basis.push({
      kind: 'experience_semantic_context',
      evidenceRefs: [...experienceContextRefs].sort((left, right) => left.localeCompare(right)),
    });
  }
  return basis.length > 0 ? basis : undefined;
}

/**
 * Pure deterministic read-only projection of sealed Investigation epistemic state.
 * Does not reinterpret statements. When evidence is supplied, may attach a derived
 * evidenceBasis (including experience-context refs projected from observable / pattern payloads).
 */
export function projectInvestigationHandoff(
  investigation: HypothesisInvestigationResult,
  evidence?: InvestigationHandoffEvidence,
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

  const evidenceBasis = projectEvidenceBasis(investigation, evidence);
  return {
    items,
    ...(evidenceBasis !== undefined ? { evidenceBasis } : {}),
  };
}

export function investigationHandoffRefIndex(
  handoff: InvestigationHandoff,
): ReadonlyMap<string, InvestigationHandoffItem> {
  return new Map(handoff.items.map(item => [item.ref, item]));
}
