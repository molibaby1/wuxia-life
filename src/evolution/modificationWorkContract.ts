import type {
  InvestigationHandoff,
  InvestigationHandoffItem,
  InvestigationHandoffKind,
} from './investigationHandoff';
import { investigationHandoffRefIndex } from './investigationHandoff';

export type ModificationWorkProposal = {
  kind: 'proposal';
  proposedChange: string;
  scopeRefs: string[];
  evidenceRefs: string[];
  expectedPlayerObservableDifference: string;
  unknowns: string[];
  risks: string[];
  nonGoals: string[];
};

export type ModificationWorkNoProposal = {
  kind: 'no_proposal';
  reason: string;
};

export type ModificationWorkResult = ModificationWorkProposal | ModificationWorkNoProposal;

const PROPOSAL_KEYS = [
  'kind',
  'proposedChange',
  'scopeRefs',
  'evidenceRefs',
  'expectedPlayerObservableDifference',
  'unknowns',
  'risks',
  'nonGoals',
] as const;

const NO_PROPOSAL_KEYS = ['kind', 'reason'] as const;

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object and must not be null`);
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      throw new Error(`${label} contains unknown field: ${key}`);
    }
  }
  for (const key of allowed) {
    if (!(key in value)) {
      throw new Error(`${label} missing required field: ${key}`);
    }
  }
}

function assertNonEmptyString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
}

function assertNonEmptyStringArray(value: unknown, path: string): asserts value is string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }
  if (value.length === 0) {
    throw new Error(`${path} must be a non-empty array`);
  }
  value.forEach((item, index) => {
    if (typeof item !== 'string' || item.length === 0) {
      throw new Error(`${path}[${index}] must be a non-empty string`);
    }
  });
}

function assertStringArrayAllowEmpty(value: unknown, path: string): asserts value is string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }
  value.forEach((item, index) => {
    if (typeof item !== 'string' || item.length === 0) {
      throw new Error(`${path}[${index}] must be a non-empty string`);
    }
  });
}

export function parseModificationWorkResult(rawResponse: string): ModificationWorkResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error('modification work response must be valid JSON');
  }

  assertObject(parsed, 'modification work response');
  assertNonEmptyString(parsed.kind, 'kind');
  if (parsed.kind !== 'proposal' && parsed.kind !== 'no_proposal') {
    throw new Error('kind must be proposal or no_proposal');
  }

  if (parsed.kind === 'no_proposal') {
    assertExactKeys(parsed, NO_PROPOSAL_KEYS, 'modification work response');
    assertNonEmptyString(parsed.reason, 'reason');
    return {
      kind: 'no_proposal',
      reason: parsed.reason,
    };
  }

  assertExactKeys(parsed, PROPOSAL_KEYS, 'modification work response');
  assertNonEmptyString(parsed.proposedChange, 'proposedChange');
  assertNonEmptyStringArray(parsed.scopeRefs, 'scopeRefs');
  assertNonEmptyStringArray(parsed.evidenceRefs, 'evidenceRefs');
  assertNonEmptyString(
    parsed.expectedPlayerObservableDifference,
    'expectedPlayerObservableDifference',
  );
  assertStringArrayAllowEmpty(parsed.unknowns, 'unknowns');
  assertStringArrayAllowEmpty(parsed.risks, 'risks');
  assertStringArrayAllowEmpty(parsed.nonGoals, 'nonGoals');

  return {
    kind: 'proposal',
    proposedChange: parsed.proposedChange,
    scopeRefs: [...parsed.scopeRefs],
    evidenceRefs: [...parsed.evidenceRefs],
    expectedPlayerObservableDifference: parsed.expectedPlayerObservableDifference,
    unknowns: [...parsed.unknowns],
    risks: [...parsed.risks],
    nonGoals: [...parsed.nonGoals],
  };
}

export function validateModificationWorkReferences(
  result: ModificationWorkResult,
  allowedEvidenceRefs: ReadonlySet<string>,
  allowedScopeRefs: ReadonlySet<string>,
): void {
  if (result.kind !== 'proposal') return;

  for (const [index, ref] of result.evidenceRefs.entries()) {
    if (!allowedEvidenceRefs.has(ref)) {
      throw new Error(`evidenceRefs[${index}] references unknown evidence: ${ref}`);
    }
  }
  for (const [index, ref] of result.scopeRefs.entries()) {
    if (!allowedScopeRefs.has(ref)) {
      throw new Error(
        `scopeRefs[${index}] is outside current-product bounded mechanism slice: ${ref}`,
      );
    }
  }
}

// --- Modification Work v2 (uncertainty-preserving); v1 above stays unchanged ---

export type ModificationWorkAssumptionV2 = {
  statement: string;
  relatedInvestigationRefs: string[];
};

export type ModificationWorkProposalV2 = {
  kind: 'proposal';
  proposedChange: string;
  scopeRefs: string[];
  evidenceRefs: string[];
  investigationBasisRefs: string[];
  unresolvedDependencyRefs: string[];
  assumptions: ModificationWorkAssumptionV2[];
  expectedPlayerObservableDifference: string;
  risks: string[];
  nonGoals: string[];
};

export type ModificationWorkNoProposalV2 = {
  kind: 'no_proposal';
  reason: string;
};

export type ModificationWorkResultV2 = ModificationWorkProposalV2 | ModificationWorkNoProposalV2;

const PROPOSAL_V2_KEYS = [
  'kind',
  'proposedChange',
  'scopeRefs',
  'evidenceRefs',
  'investigationBasisRefs',
  'unresolvedDependencyRefs',
  'assumptions',
  'expectedPlayerObservableDifference',
  'risks',
  'nonGoals',
] as const;

const ASSUMPTION_V2_KEYS = ['statement', 'relatedInvestigationRefs'] as const;

const BASIS_KINDS: ReadonlySet<InvestigationHandoffKind> = new Set([
  'confirmed_fact',
  'relevant_mechanism',
  'limiting_evidence',
]);

const UNRESOLVED_KINDS: ReadonlySet<InvestigationHandoffKind> = new Set([
  'unresolved_question',
  'evidence_gap',
]);

function parseAssumptionV2(value: unknown, path: string): ModificationWorkAssumptionV2 {
  assertObject(value, path);
  assertExactKeys(value, ASSUMPTION_V2_KEYS, path);
  assertNonEmptyString(value.statement, `${path}.statement`);
  assertStringArrayAllowEmpty(value.relatedInvestigationRefs, `${path}.relatedInvestigationRefs`);
  return {
    statement: value.statement,
    relatedInvestigationRefs: [...value.relatedInvestigationRefs],
  };
}

export function parseModificationWorkResultV2(rawResponse: string): ModificationWorkResultV2 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error('modification work v2 response must be valid JSON');
  }

  assertObject(parsed, 'modification work v2 response');
  assertNonEmptyString(parsed.kind, 'kind');
  if (parsed.kind !== 'proposal' && parsed.kind !== 'no_proposal') {
    throw new Error('kind must be proposal or no_proposal');
  }

  if (parsed.kind === 'no_proposal') {
    assertExactKeys(parsed, NO_PROPOSAL_KEYS, 'modification work v2 response');
    assertNonEmptyString(parsed.reason, 'reason');
    return {
      kind: 'no_proposal',
      reason: parsed.reason,
    };
  }

  assertExactKeys(parsed, PROPOSAL_V2_KEYS, 'modification work v2 response');
  assertNonEmptyString(parsed.proposedChange, 'proposedChange');
  assertNonEmptyStringArray(parsed.scopeRefs, 'scopeRefs');
  assertNonEmptyStringArray(parsed.evidenceRefs, 'evidenceRefs');
  assertNonEmptyStringArray(parsed.investigationBasisRefs, 'investigationBasisRefs');
  assertStringArrayAllowEmpty(parsed.unresolvedDependencyRefs, 'unresolvedDependencyRefs');
  if (!Array.isArray(parsed.assumptions)) {
    throw new Error('assumptions must be an array');
  }
  const assumptions = parsed.assumptions.map((item, index) =>
    parseAssumptionV2(item, `assumptions[${index}]`),
  );
  assertNonEmptyString(
    parsed.expectedPlayerObservableDifference,
    'expectedPlayerObservableDifference',
  );
  assertStringArrayAllowEmpty(parsed.risks, 'risks');
  assertStringArrayAllowEmpty(parsed.nonGoals, 'nonGoals');

  return {
    kind: 'proposal',
    proposedChange: parsed.proposedChange,
    scopeRefs: [...parsed.scopeRefs],
    evidenceRefs: [...parsed.evidenceRefs],
    investigationBasisRefs: [...parsed.investigationBasisRefs],
    unresolvedDependencyRefs: [...parsed.unresolvedDependencyRefs],
    assumptions,
    expectedPlayerObservableDifference: parsed.expectedPlayerObservableDifference,
    risks: [...parsed.risks],
    nonGoals: [...parsed.nonGoals],
  };
}

export function validateModificationWorkReferencesV2(
  result: ModificationWorkResultV2,
  allowedEvidenceRefs: ReadonlySet<string>,
  allowedScopeRefs: ReadonlySet<string>,
  handoff: InvestigationHandoff,
): void {
  if (result.kind !== 'proposal') return;

  const byRef = investigationHandoffRefIndex(handoff);

  for (const [index, ref] of result.evidenceRefs.entries()) {
    if (!allowedEvidenceRefs.has(ref)) {
      throw new Error(`evidenceRefs[${index}] references unknown evidence: ${ref}`);
    }
  }
  for (const [index, ref] of result.scopeRefs.entries()) {
    if (!allowedScopeRefs.has(ref)) {
      throw new Error(
        `scopeRefs[${index}] is outside current-product bounded mechanism slice: ${ref}`,
      );
    }
  }

  for (const [index, ref] of result.investigationBasisRefs.entries()) {
    const item = byRef.get(ref);
    if (!item) {
      throw new Error(`investigationBasisRefs[${index}] references unknown handoff ref: ${ref}`);
    }
    if (!BASIS_KINDS.has(item.kind)) {
      throw new Error(
        `investigationBasisRefs[${index}] must reference confirmed_fact|relevant_mechanism|limiting_evidence, got ${item.kind}: ${ref}`,
      );
    }
  }

  for (const [index, ref] of result.unresolvedDependencyRefs.entries()) {
    const item = byRef.get(ref);
    if (!item) {
      throw new Error(
        `unresolvedDependencyRefs[${index}] references unknown handoff ref: ${ref}`,
      );
    }
    if (!UNRESOLVED_KINDS.has(item.kind)) {
      throw new Error(
        `unresolvedDependencyRefs[${index}] must reference unresolved_question|evidence_gap, got ${item.kind}: ${ref}`,
      );
    }
  }

  for (const [aIndex, assumption] of result.assumptions.entries()) {
    for (const [rIndex, ref] of assumption.relatedInvestigationRefs.entries()) {
      if (!byRef.has(ref)) {
        throw new Error(
          `assumptions[${aIndex}].relatedInvestigationRefs[${rIndex}] references unknown handoff ref: ${ref}`,
        );
      }
    }
  }
}

export function handoffItemOrThrow(
  handoff: InvestigationHandoff,
  ref: string,
): InvestigationHandoffItem {
  const item = investigationHandoffRefIndex(handoff).get(ref);
  if (!item) throw new Error(`unknown handoff ref: ${ref}`);
  return item;
}
