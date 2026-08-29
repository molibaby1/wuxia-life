import { mkdir, open, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { renderStructuredFinalOutputContractV1 } from '../../../src/evolution/participantStructuredOutputContract';
import { validateStructuredTerminalEnvelope } from '../../../src/evolution/structuredTerminalEnvelope';

export const CONFORMANCE_SCHEMA_VERSION = 'participant-contract-conformance-v1' as const;
export const CONFORMANCE_ROLE_SCHEMA_NAME = 'participant-contract-conformance-v1' as const;

export const EXACT_CONFORMANCE_PAYLOAD = {
  schemaVersion: CONFORMANCE_SCHEMA_VERSION,
  status: 'OK',
  message: 'contract-confirmed',
} as const;

export const TRIAL_CLASSIFICATIONS = [
  'PASS',
  'ENVELOPE_FAILURE',
  'ROLE_SCHEMA_FAILURE',
  'RUNTIME_FAILURE',
  'TIMEOUT',
] as const;

export type TrialClassification = (typeof TRIAL_CLASSIFICATIONS)[number];

export const MATRIX_VERDICTS = [
  'CONTRACT_CONFORMANCE_PROMISING',
  'CONTRACT_CONFORMANCE_UNSTABLE',
  'CONTRACT_CONFORMANCE_REGRESSION',
  'OBSERVATION_INSUFFICIENT',
] as const;

export type MatrixVerdict = (typeof MATRIX_VERDICTS)[number];

export const DEFAULT_EVIDENCE_ROOT =
  '.tmp/evolution/structured-output-contract-conformance';

export type ConformanceBindingLabel =
  | 'Codex current binding'
  | 'Cursor Auto';

export interface ConformanceTrialEvidenceV1 {
  schemaVersion: 'contract-conformance-trial-v1';
  trialId: string;
  bindingLabel: ConformanceBindingLabel;
  requestedBinding: string;
  resolvedModelObservation: string;
  startedAt: string;
  elapsedMs?: number;
  classification: TrialClassification;
  terminalPayloadRef: string;
  transportStdoutRef?: string;
  executionTraceRef?: string;
  failureDetail?: string;
  notes?: string[];
}

export interface ConformanceMatrixEvidenceV1 {
  schemaVersion: 'contract-conformance-matrix-v1';
  createdAt: string;
  evidenceRoot: string;
  trials: ConformanceTrialEvidenceV1[];
  verdict?: MatrixVerdict;
  verdictRationale?: string;
  contractReliabilitySeparatedFromReasoningQuality: true;
  cursorModelBindingUncertainty: string;
  fullP3RemainsDeferred: true;
}

export function buildConformancePrompt(): string {
  return [
    'This is a contract-only conformance trial.',
    'Do not investigate the repository.',
    'Do not run commands.',
    'Do not invent additional fields.',
    'Your only job is to emit the exact terminal JSON object required below.',
    renderStructuredFinalOutputContractV1({
      roleSchemaName: CONFORMANCE_ROLE_SCHEMA_NAME,
    }),
    '',
    'Exact required object:',
    JSON.stringify(EXACT_CONFORMANCE_PAYLOAD),
  ].join('\n');
}

export function validateExactConformancePayload(
  value: Record<string, unknown>,
): { ok: true } | { ok: false; detail: string } {
  const expectedKeys = Object.keys(EXACT_CONFORMANCE_PAYLOAD);
  const actualKeys = Object.keys(value);
  if (actualKeys.length !== expectedKeys.length) {
    return {
      ok: false,
      detail: `expected exactly ${String(expectedKeys.length)} keys, got ${String(actualKeys.length)}`,
    };
  }
  for (const key of expectedKeys) {
    if (!(key in value)) {
      return { ok: false, detail: `missing key: ${key}` };
    }
    const expected = EXACT_CONFORMANCE_PAYLOAD[key as keyof typeof EXACT_CONFORMANCE_PAYLOAD];
    if (value[key] !== expected) {
      return {
        ok: false,
        detail: `key ${key}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(value[key])}`,
      };
    }
  }
  return { ok: true };
}

export function classifyTerminalPayload(raw: string): {
  classification: Extract<TrialClassification, 'PASS' | 'ENVELOPE_FAILURE' | 'ROLE_SCHEMA_FAILURE'>;
  failureDetail?: string;
} {
  const envelope = validateStructuredTerminalEnvelope(raw);
  if (!envelope.ok) {
    return {
      classification: 'ENVELOPE_FAILURE',
      failureDetail: `${envelope.failureClass}:${envelope.reason}`,
    };
  }
  const schema = validateExactConformancePayload(envelope.parsedObject);
  if (!schema.ok) {
    return {
      classification: 'ROLE_SCHEMA_FAILURE',
      failureDetail: schema.detail,
    };
  }
  return { classification: 'PASS' };
}

export function classifyRuntimeFailure(errorKind: string): TrialClassification {
  if (errorKind === 'timeout') return 'TIMEOUT';
  return 'RUNTIME_FAILURE';
}

async function writeCreateOnly(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(content);
  } finally {
    await handle.close();
  }
}

export async function writeJsonCreateOnly(path: string, value: unknown): Promise<void> {
  await writeCreateOnly(path, `${JSON.stringify(value, null, 2)}\n`);
}

export async function writeTextCreateOnly(path: string, content: string): Promise<void> {
  await writeCreateOnly(path, content);
}

export function trialDirectory(evidenceRoot: string, trialId: string): string {
  return join(evidenceRoot, 'trials', trialId);
}

export async function ensureEvidenceRoot(evidenceRoot: string): Promise<void> {
  await mkdir(evidenceRoot, { recursive: true });
  await mkdir(join(evidenceRoot, 'trials'), { recursive: true });
}

export async function writeMatrixEvidence(
  evidenceRoot: string,
  matrix: ConformanceMatrixEvidenceV1,
): Promise<string> {
  const path = join(evidenceRoot, 'matrix.json');
  await writeFile(path, `${JSON.stringify(matrix, null, 2)}\n`);
  return path;
}
