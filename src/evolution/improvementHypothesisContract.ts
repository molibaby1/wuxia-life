import type { ExternalFeedback } from './externalFeedbackContract';
import {
  validateExperiencePatternEvidence,
  type ExperiencePatternEvidence,
} from './experiencePatternEvidenceContract';
import type { ObservablePayload } from './playerObservableTranscript';

export interface ImprovementHypothesis {
  hypothesisId: string;
  hypothesis: string;
  observedBasis: string;
  feedbackRefs: string[];
  evidenceRefs: string[];
  patternEvidenceRefs?: string[];
  unknowns: string[];
  productSignificance: string;
}

export const IMPROVEMENT_HYPOTHESIS_SET_SCHEMA_VERSION = 'improvement-hypothesis-set-v2' as const;
export const LEGACY_IMPROVEMENT_HYPOTHESIS_SET_SCHEMA_VERSION = 'improvement-hypothesis-set-v1' as const;

export interface NoProblemAssessment {
  rationale: string;
  feedbackRefs: string[];
  evidenceRefs: string[];
}

export interface ImprovementHypothesisSet {
  hypotheses: ImprovementHypothesis[];
}

export interface CurrentImprovementHypothesisSet extends ImprovementHypothesisSet {
  schemaVersion: typeof IMPROVEMENT_HYPOTHESIS_SET_SCHEMA_VERSION;
  noProblemAssessment: NoProblemAssessment | null;
}

export interface StoredImprovementHypothesisSet extends ImprovementHypothesisSet {
  schemaVersion:
    | typeof IMPROVEMENT_HYPOTHESIS_SET_SCHEMA_VERSION
    | typeof LEGACY_IMPROVEMENT_HYPOTHESIS_SET_SCHEMA_VERSION;
  noProblemAssessment: NoProblemAssessment | null;
}
const CURRENT_ROOT_KEYS = [
  'schemaVersion',
  'hypotheses',
  'noProblemAssessment',
] as const;
const LEGACY_ROOT_KEYS = ['hypotheses'] as const;
const ASSESSMENT_KEYS = ['rationale', 'feedbackRefs', 'evidenceRefs'] as const;
const DRAFT_KEYS = [
  'hypothesis',
  'observedBasis',
  'feedbackRefs',
  'evidenceRefs',
  'unknowns',
  'productSignificance',
] as const;
const DRAFT_OPTIONAL_KEYS = ['patternEvidenceRefs'] as const;

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object and must not be null`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
  optional: readonly string[] = [],
): void {
  const allowedSet = new Set([...allowed, ...optional]);
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

function parseNoProblemAssessment(value: unknown): NoProblemAssessment {
  assertObject(value, 'noProblemAssessment');
  assertExactKeys(value, ASSESSMENT_KEYS, 'noProblemAssessment');
  assertNonEmptyString(value.rationale, 'noProblemAssessment.rationale');
  assertNonEmptyStringArray(value.feedbackRefs, 'noProblemAssessment.feedbackRefs');
  assertStringArrayAllowEmpty(value.evidenceRefs, 'noProblemAssessment.evidenceRefs');
  return {
    rationale: value.rationale,
    feedbackRefs: [...value.feedbackRefs],
    evidenceRefs: [...value.evidenceRefs],
  };
}

function parseDraft(
  value: unknown,
  index: number,
): Omit<ImprovementHypothesis, 'hypothesisId'> {
  const path = `hypotheses[${index}]`;
  assertObject(value, path);
  assertExactKeys(value, DRAFT_KEYS, path, DRAFT_OPTIONAL_KEYS);
  assertNonEmptyString(value.hypothesis, `${path}.hypothesis`);
  assertNonEmptyString(value.observedBasis, `${path}.observedBasis`);
  assertNonEmptyStringArray(value.feedbackRefs, `${path}.feedbackRefs`);
  assertStringArrayAllowEmpty(value.evidenceRefs, `${path}.evidenceRefs`);
  let patternEvidenceRefs: string[] | undefined;
  if (value.patternEvidenceRefs !== undefined) {
    assertStringArrayAllowEmpty(value.patternEvidenceRefs, `${path}.patternEvidenceRefs`);
    patternEvidenceRefs = value.patternEvidenceRefs as string[];
  }
  assertNonEmptyStringArray(value.unknowns, `${path}.unknowns`);
  assertNonEmptyString(value.productSignificance, `${path}.productSignificance`);
  return {
    hypothesis: value.hypothesis,
    observedBasis: value.observedBasis,
    feedbackRefs: [...value.feedbackRefs],
    evidenceRefs: [...value.evidenceRefs],
    ...(patternEvidenceRefs !== undefined
      ? { patternEvidenceRefs: [...patternEvidenceRefs] }
      : {}),
    unknowns: [...value.unknowns],
    productSignificance: value.productSignificance,
  };
}

function parseJson(rawResponse: string): unknown {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error('improvement hypothesis response must be valid JSON');
  }
  return parsed;
}

function parseHypotheses(value: unknown): ImprovementHypothesis[] {
  if (!Array.isArray(value)) {
    throw new Error('hypotheses must be an array');
  }
  return value.map((item, index) => ({
    hypothesisId: hypothesisId(index),
    ...parseDraft(item, index),
  }));
}

function parseStoredHypotheses(value: unknown): ImprovementHypothesis[] {
  if (!Array.isArray(value)) {
    throw new Error('hypotheses must be an array');
  }
  return value.map((item, index) => {
    assertObject(item, `hypotheses[${index}]`);
    const storedId = item.hypothesisId;
    if (storedId !== undefined && storedId !== hypothesisId(index)) {
      throw new Error(`hypotheses[${index}].hypothesisId does not match participant order`);
    }
    const { hypothesisId: _ignored, ...draft } = item;
    return {
      hypothesisId: hypothesisId(index),
      ...parseDraft(draft, index),
    };
  });
}

function parseCurrentRoot(parsed: Record<string, unknown>): CurrentImprovementHypothesisSet {
  assertExactKeys(parsed, CURRENT_ROOT_KEYS, 'improvement hypothesis response');
  if (parsed.schemaVersion !== IMPROVEMENT_HYPOTHESIS_SET_SCHEMA_VERSION) {
    throw new Error(
      `schemaVersion must be ${IMPROVEMENT_HYPOTHESIS_SET_SCHEMA_VERSION}`,
    );
  }

  const hypotheses = parseHypotheses(parsed.hypotheses);
  const noProblemAssessment = parsed.noProblemAssessment === null
    ? null
    : parseNoProblemAssessment(parsed.noProblemAssessment);
  if (hypotheses.length === 0 && noProblemAssessment === null) {
    throw new Error('noProblemAssessment is required when hypotheses is empty');
  }
  if (hypotheses.length > 0 && noProblemAssessment !== null) {
    throw new Error('noProblemAssessment must be null when hypotheses is non-empty');
  }

  return {
    schemaVersion: IMPROVEMENT_HYPOTHESIS_SET_SCHEMA_VERSION,
    hypotheses,
    noProblemAssessment,
  };
}

export function parseImprovementHypothesisSet(rawResponse: string): CurrentImprovementHypothesisSet {
  const parsed = parseJson(rawResponse);

  assertObject(parsed, 'improvement hypothesis response');
  return parseCurrentRoot(parsed);
}

export function parseStoredImprovementHypothesisSet(rawArtifact: string): StoredImprovementHypothesisSet {
  const parsed = parseJson(rawArtifact);
  assertObject(parsed, 'stored improvement hypothesis set');

  if (parsed.schemaVersion === IMPROVEMENT_HYPOTHESIS_SET_SCHEMA_VERSION) {
    const current = parseCurrentRoot({
      ...parsed,
      hypotheses: Array.isArray(parsed.hypotheses)
        ? parsed.hypotheses.map(item => {
          if (!isRecord(item)) return item;
          const { hypothesisId: _ignored, ...draft } = item;
          return draft;
        })
        : parsed.hypotheses,
    });
    return {
      ...current,
      hypotheses: parseStoredHypotheses(parsed.hypotheses),
    };
  }

  assertExactKeys(parsed, LEGACY_ROOT_KEYS, 'stored improvement hypothesis set');
  return {
    schemaVersion: LEGACY_IMPROVEMENT_HYPOTHESIS_SET_SCHEMA_VERSION,
    hypotheses: parseStoredHypotheses(parsed.hypotheses),
    noProblemAssessment: null,
  };
}

function validFeedbackRefs(feedback: ExternalFeedback): Set<string> {
  return new Set([
    'overallImpression',
    ...feedback.observations.map((_, index) => `observations[${index}]`),
  ]);
}

export function validateImprovementHypothesisReferences(
  set: ImprovementHypothesisSet & { noProblemAssessment?: NoProblemAssessment | null },
  feedback: ExternalFeedback,
  observablePayload: ObservablePayload,
  patternEvidence?: ExperiencePatternEvidence,
): void {
  const feedbackRefs = validFeedbackRefs(feedback);
  const entryIds = new Set(observablePayload.entries.map(entry => entry.entryId));
  const patternRefs = patternEvidence === undefined
    ? new Set<string>()
    : new Set(
      validateExperiencePatternEvidence(patternEvidence).patterns
        .map(pattern => `pattern:${pattern.patternId}`),
    );

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
    for (const ref of hypothesis.patternEvidenceRefs ?? []) {
      if (!patternRefs.has(ref)) {
        throw new Error(
          `hypotheses[${index}].patternEvidenceRefs references unknown pattern evidence: ${ref}`,
        );
      }
    }
  }

  const assessment = set.noProblemAssessment;
  if (assessment === undefined || assessment === null) return;
  for (const ref of assessment.feedbackRefs) {
    if (!feedbackRefs.has(ref)) {
      throw new Error(`noProblemAssessment.feedbackRefs references unknown feedback source: ${ref}`);
    }
  }
  for (const ref of assessment.evidenceRefs) {
    if (!entryIds.has(ref)) {
      throw new Error(`noProblemAssessment.evidenceRefs references unknown entryId: ${ref}`);
    }
  }
}
