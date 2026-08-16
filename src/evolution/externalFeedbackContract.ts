import type { ObservablePayload } from './playerObservableTranscript';

export interface ExternalFeedbackObservation {
  feedback: string;
  evidenceRefs: string[];
}

export interface ExternalFeedback {
  overallImpression: string;
  observations: ExternalFeedbackObservation[];
}

const FEEDBACK_KEYS = ['overallImpression', 'observations'] as const;
const OBSERVATION_KEYS = ['feedback', 'evidenceRefs'] as const;

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
    if (typeof item !== 'string') {
      throw new Error(`${path}[${index}] must be a string`);
    }
  });
}

function parseObservation(value: unknown, index: number): ExternalFeedbackObservation {
  const path = `observations[${index}]`;
  assertObject(value, path);
  assertExactKeys(value, OBSERVATION_KEYS, path);
  assertNonEmptyString(value.feedback, `${path}.feedback`);
  assertStringArray(value.evidenceRefs, `${path}.evidenceRefs`);
  return {
    feedback: value.feedback,
    evidenceRefs: [...value.evidenceRefs],
  };
}

export function parseExternalFeedback(rawResponse: string): ExternalFeedback {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error('external feedback must be valid JSON');
  }

  assertObject(parsed, 'external feedback');
  assertExactKeys(parsed, FEEDBACK_KEYS, 'external feedback');
  assertNonEmptyString(parsed.overallImpression, 'overallImpression');

  if (!Array.isArray(parsed.observations)) {
    throw new Error('observations must be an array');
  }

  return {
    overallImpression: parsed.overallImpression,
    observations: parsed.observations.map(parseObservation),
  };
}

export function validateExternalFeedbackReferences(
  feedback: ExternalFeedback,
  observablePayload: ObservablePayload,
): void {
  const entryIds = new Set(observablePayload.entries.map((entry) => entry.entryId));

  for (const [index, observation] of feedback.observations.entries()) {
    for (const evidenceRef of observation.evidenceRefs) {
      if (!entryIds.has(evidenceRef)) {
        throw new Error(
          `observations[${index}].evidenceRefs references unknown entryId: ${evidenceRef}`,
        );
      }
    }
  }
}
