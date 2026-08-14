import type { ExternalFeedback } from './externalFeedbackContract';
import type { ObservablePayload } from './playerObservableTranscript';

export interface ImprovementHypothesis {
  hypothesisId: string;
  hypothesis: string;
  observedBasis: string;
  feedbackRefs: string[];
  evidenceRefs: string[];
  unknowns: string[];
  productSignificance: string;
}

export interface ImprovementHypothesisSet {
  hypotheses: ImprovementHypothesis[];
}

const ROOT_KEYS = ['hypotheses'] as const;
const DRAFT_KEYS = [
  'hypothesis',
  'observedBasis',
  'feedbackRefs',
  'evidenceRefs',
  'unknowns',
  'productSignificance',
] as const;

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

function hypothesisId(index: number): string {
  return `hypothesis-${String(index + 1).padStart(6, '0')}`;
}

function parseDraft(
  value: unknown,
  index: number,
): Omit<ImprovementHypothesis, 'hypothesisId'> {
  const path = `hypotheses[${index}]`;
  assertObject(value, path);
  assertExactKeys(value, DRAFT_KEYS, path);
  assertNonEmptyString(value.hypothesis, `${path}.hypothesis`);
  assertNonEmptyString(value.observedBasis, `${path}.observedBasis`);
  assertNonEmptyStringArray(value.feedbackRefs, `${path}.feedbackRefs`);
  assertStringArrayAllowEmpty(value.evidenceRefs, `${path}.evidenceRefs`);
  assertNonEmptyStringArray(value.unknowns, `${path}.unknowns`);
  assertNonEmptyString(value.productSignificance, `${path}.productSignificance`);
  return {
    hypothesis: value.hypothesis,
    observedBasis: value.observedBasis,
    feedbackRefs: [...value.feedbackRefs],
    evidenceRefs: [...value.evidenceRefs],
    unknowns: [...value.unknowns],
    productSignificance: value.productSignificance,
  };
}

export function parseImprovementHypothesisSet(rawResponse: string): ImprovementHypothesisSet {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error('improvement hypothesis response must be valid JSON');
  }

  assertObject(parsed, 'improvement hypothesis response');
  assertExactKeys(parsed, ROOT_KEYS, 'improvement hypothesis response');
  if (!Array.isArray(parsed.hypotheses)) {
    throw new Error('hypotheses must be an array');
  }

  return {
    hypotheses: parsed.hypotheses.map((value, index) => ({
      hypothesisId: hypothesisId(index),
      ...parseDraft(value, index),
    })),
  };
}

function validFeedbackRefs(feedback: ExternalFeedback): Set<string> {
  return new Set([
    'overallImpression',
    ...feedback.observations.map((_, index) => `observations[${index}]`),
  ]);
}

export function validateImprovementHypothesisReferences(
  set: ImprovementHypothesisSet,
  feedback: ExternalFeedback,
  observablePayload: ObservablePayload,
): void {
  const feedbackRefs = validFeedbackRefs(feedback);
  const entryIds = new Set(observablePayload.entries.map(entry => entry.entryId));

  for (const [index, hypothesis] of set.hypotheses.entries()) {
    for (const ref of hypothesis.feedbackRefs) {
      if (!feedbackRefs.has(ref)) {
        throw new Error(
          `hypotheses[${index}].feedbackRefs references unknown feedback source: ${ref}`,
        );
      }
    }
    for (const ref of hypothesis.evidenceRefs) {
      if (!entryIds.has(ref)) {
        throw new Error(
          `hypotheses[${index}].evidenceRefs references unknown entryId: ${ref}`,
        );
      }
    }
  }
}
