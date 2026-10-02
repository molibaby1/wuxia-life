export const ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH =
  '.evolution-participant/final-result.json' as const;

export const ARTIFACT_BACKED_STRUCTURED_RESULT_PREFLIGHT_COMMAND =
  '.evolution-participant/preflight-solution-work' as const;

export const ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES = 1_048_576 as const;

export const ARTIFACT_BACKED_STRUCTURED_FINAL_RESULT_RECEIPT_SCHEMA_VERSION =
  'artifact-backed-structured-final-result-receipt-v1' as const;

export interface ArtifactBackedStructuredFinalResultReceiptV1 {
  schemaVersion: typeof ARTIFACT_BACKED_STRUCTURED_FINAL_RESULT_RECEIPT_SCHEMA_VERSION;
  bytes: number;
  sha256: string;
}

const RECEIPT_SCHEMA_VERSION = ARTIFACT_BACKED_STRUCTURED_FINAL_RESULT_RECEIPT_SCHEMA_VERSION;
const RECEIPT_SHA256_PATTERN = /^[0-9a-f]{64}$/;
const RECEIPT_KEYS = new Set(['schemaVersion', 'bytes', 'sha256']);

export function validateArtifactBackedStructuredFinalResultReceipt(
  value: unknown,
): ArtifactBackedStructuredFinalResultReceiptV1 {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('artifact-backed receipt must be an object');
  }

  const keys = Reflect.ownKeys(value);
  if (keys.length !== RECEIPT_KEYS.size || keys.some(key => typeof key !== 'string' || !RECEIPT_KEYS.has(key))) {
    throw new Error('artifact-backed receipt must contain exactly schemaVersion, bytes, and sha256');
  }

  const receipt = value as Record<string, unknown>;
  if (receipt.schemaVersion !== RECEIPT_SCHEMA_VERSION) {
    throw new Error(`artifact-backed receipt schemaVersion must be ${RECEIPT_SCHEMA_VERSION}`);
  }
  if (
    typeof receipt.bytes !== 'number'
    || !Number.isSafeInteger(receipt.bytes)
    || receipt.bytes < 0
    || receipt.bytes > ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES
  ) {
    throw new Error(`artifact-backed receipt bytes must be an integer from 0 to ${ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES}`);
  }
  if (typeof receipt.sha256 !== 'string' || !RECEIPT_SHA256_PATTERN.test(receipt.sha256)) {
    throw new Error('artifact-backed receipt sha256 must be 64 lowercase hexadecimal characters');
  }

  return {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    bytes: receipt.bytes,
    sha256: receipt.sha256,
  };
}

export function renderArtifactBackedStructuredFinalResultInstructionsV1(input: {
  roleSchemaName: string;
  preflightCommand?: string;
}): string {
  const preflightInstructions = input.preflightCommand === undefined
    ? []
    : [
      'Before calculating the receipt, run the Host-provided Role-schema preflight command:',
      `./${input.preflightCommand}`,
      'If it exits non-zero or does not print the exact PASS marker "ROLE_SCHEMA_PREFLIGHT_PASS", use the validator error to correct the artifact yourself in this same Solution turn, then run the preflight command again.',
      "Only after a PASS marker may you compute the artifact's exact byte length and SHA-256 for the receipt. Do not modify the artifact after PASS.",
    ];

  return [
    'Artifact-Backed Structured Final Result Receipt V1',
    '',
    `Produce the complete ${input.roleSchemaName} as one valid JSON object.`,
    `Write the complete JSON object to the Host-reserved result file:\n${ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH}`,
    `Do not use the terminal message to carry the ${input.roleSchemaName}.`,
    ...preflightInstructions,
    ...(input.preflightCommand === undefined
      ? ['After writing the result file, compute its exact byte length and SHA-256.']
      : []),
    'The terminal output must contain only the small JSON receipt for this artifact. Do not emit the result object in terminal output, prose, Markdown, or a continuation.',
    'Return the receipt as one JSON object with exactly these three fields:',
    `schemaVersion: "${ARTIFACT_BACKED_STRUCTURED_FINAL_RESULT_RECEIPT_SCHEMA_VERSION}"`,
    'bytes: exact artifact byte length as a non-negative integer',
    'sha256: exact artifact SHA-256 as 64 lowercase hexadecimal characters',
    'The Host will reject rather than repair either the receipt or result artifact.',
  ].join('\n');
}
