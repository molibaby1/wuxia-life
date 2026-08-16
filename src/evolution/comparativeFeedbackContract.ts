import type { ObservablePayload } from './playerObservableTranscript';

export interface ComparativeFeedbackObservation {
  comparison: string;
  experienceARefs: string[];
  experienceBRefs: string[];
}

export interface ComparativeFeedback {
  overallComparison: string;
  observations: ComparativeFeedbackObservation[];
}

const FEEDBACK_KEYS = ['overallComparison', 'observations'] as const;
const OBSERVATION_KEYS = ['comparison', 'experienceARefs', 'experienceBRefs'] as const;

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

function assertStringArray(value: unknown, path: string): asserts value is string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${path} must be an array`);
  }
  value.forEach((item, index) => {
    if (typeof item !== 'string' || item.length === 0) {
      throw new Error(`${path}[${index}] must be a non-empty string`);
    }
  });
}

function parseObservation(value: unknown, index: number): ComparativeFeedbackObservation {
  const path = `observations[${index}]`;
  assertObject(value, path);
  assertExactKeys(value, OBSERVATION_KEYS, path);
  assertNonEmptyString(value.comparison, `${path}.comparison`);
  assertStringArray(value.experienceARefs, `${path}.experienceARefs`);
  assertStringArray(value.experienceBRefs, `${path}.experienceBRefs`);
  return {
    comparison: value.comparison,
    experienceARefs: [...value.experienceARefs],
    experienceBRefs: [...value.experienceBRefs],
  };
}

export function parseComparativeFeedback(rawResponse: string): ComparativeFeedback {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error('comparative feedback must be valid JSON');
  }

  assertObject(parsed, 'comparative feedback');
  assertExactKeys(parsed, FEEDBACK_KEYS, 'comparative feedback');
  assertNonEmptyString(parsed.overallComparison, 'overallComparison');

  if (!Array.isArray(parsed.observations)) {
    throw new Error('observations must be an array');
  }

  return {
    overallComparison: parsed.overallComparison,
    observations: parsed.observations.map(parseObservation),
  };
}

export function validateComparativeFeedbackReferences(
  feedback: ComparativeFeedback,
  experienceA: ObservablePayload,
  experienceB: ObservablePayload,
): void {
  const experienceAIds = new Set(experienceA.entries.map((entry) => entry.entryId));
  const experienceBIds = new Set(experienceB.entries.map((entry) => entry.entryId));

  for (const [index, observation] of feedback.observations.entries()) {
    for (const ref of observation.experienceARefs) {
      if (!experienceAIds.has(ref)) {
        throw new Error(
          `observations[${index}].experienceARefs references unknown entryId: ${ref}`,
        );
      }
    }
    for (const ref of observation.experienceBRefs) {
      if (!experienceBIds.has(ref)) {
        throw new Error(
          `observations[${index}].experienceBRefs references unknown entryId: ${ref}`,
        );
      }
    }
  }
}
