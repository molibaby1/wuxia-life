export type StructuredTerminalEnvelopeFailureReason =
  | 'EMPTY'
  | 'INVALID_JSON'
  | 'NON_OBJECT_ROOT';

export type StructuredTerminalEnvelopeValidation =
  | {
      ok: true;
      parsedObject: Record<string, unknown>;
    }
  | {
      ok: false;
      failureClass: 'ENVELOPE_FAILURE';
      reason: StructuredTerminalEnvelopeFailureReason;
    };

export function validateStructuredTerminalEnvelope(
  raw: string,
): StructuredTerminalEnvelopeValidation {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return {
      ok: false,
      failureClass: 'ENVELOPE_FAILURE',
      reason: 'EMPTY',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return {
      ok: false,
      failureClass: 'ENVELOPE_FAILURE',
      reason: 'INVALID_JSON',
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      failureClass: 'ENVELOPE_FAILURE',
      reason: 'NON_OBJECT_ROOT',
    };
  }

  return {
    ok: true,
    parsedObject: parsed as Record<string, unknown>,
  };
}
