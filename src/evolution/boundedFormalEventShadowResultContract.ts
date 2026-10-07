import {
  BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
  BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS,
} from './boundedFormalEventAuthoringContract';

export type BoundedFormalEventShadowTerminalStatusV2 =
  | 'SHADOW_AUTHORING_VERIFIED'
  | 'SHADOW_AUTHORING_EXECUTION_FAILED'
  | 'SHADOW_AUTHORING_CONFORMANCE_FAILED'
  | 'SHADOW_AUTHORING_VERIFICATION_FAILED'
  | 'EXECUTION_ENVELOPE_EXCEEDED';

export interface BoundedFormalEventShadowResultV2 {
  schemaVersion: 'shadow-authoring-result-v2';
  terminalStatus: BoundedFormalEventShadowTerminalStatusV2;
  contractId: typeof BOUNDED_FORMAL_EVENT_CONTRACT_ID;
  contractVersion: typeof BOUNDED_FORMAL_EVENT_CONTRACT_VERSION;
  requirementSha256: string | null;
  proposalSha256: string | null;
  reviewSha256: string | null;
  admissionSha256: string | null;
  executionManifestRef: string | null;
  executionManifestSha256: string | null;
  eventId: string | null;
  canonicalChangedFileRefs: string[];
  verificationArtifactRef: string | null;
  authoritativeFingerprintBefore: string;
  authoritativeFingerprintAfter: string;
  participantJobs: 0 | 1;
}

type RecordValue = Record<string, unknown>;

function assertObject(value: unknown): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('bounded Formal Event shadow result must be an object');
  }
}

function exactKeys(value: RecordValue, keys: readonly string[]): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`bounded Formal Event shadow result contains unknown field: ${key}`);
  }
  for (const key of keys) {
    if (!(key in value)) throw new Error(`bounded Formal Event shadow result is missing field: ${key}`);
  }
}

function nullableString(value: unknown, path: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${path} must be a non-empty string or null`);
  return value;
}

function hash(value: unknown, path: string): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw new Error(`${path} must be a SHA-256 hex string`);
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value.map((item, index) => {
    if (typeof item !== 'string' || item.length === 0) throw new Error(`${path}[${index}] must be a non-empty string`);
    return item;
  });
}

export function validateBoundedFormalEventShadowResultV2(value: unknown): BoundedFormalEventShadowResultV2 {
  assertObject(value);
  exactKeys(value, [
    'schemaVersion', 'terminalStatus', 'contractId', 'contractVersion', 'requirementSha256', 'proposalSha256',
    'reviewSha256', 'admissionSha256', 'executionManifestRef', 'executionManifestSha256', 'eventId',
    'canonicalChangedFileRefs', 'verificationArtifactRef',
    'authoritativeFingerprintBefore', 'authoritativeFingerprintAfter', 'participantJobs',
  ]);
  if (value.schemaVersion !== 'shadow-authoring-result-v2') throw new Error('bounded Formal Event shadow result schemaVersion is invalid');
  const terminalStatuses: readonly BoundedFormalEventShadowTerminalStatusV2[] = [
    'SHADOW_AUTHORING_VERIFIED', 'SHADOW_AUTHORING_EXECUTION_FAILED', 'SHADOW_AUTHORING_CONFORMANCE_FAILED',
    'SHADOW_AUTHORING_VERIFICATION_FAILED', 'EXECUTION_ENVELOPE_EXCEEDED',
  ];
  if (typeof value.terminalStatus !== 'string' || !terminalStatuses.includes(value.terminalStatus as BoundedFormalEventShadowTerminalStatusV2)) {
    throw new Error('bounded Formal Event shadow result terminalStatus is invalid');
  }
  if (value.contractId !== BOUNDED_FORMAL_EVENT_CONTRACT_ID || value.contractVersion !== BOUNDED_FORMAL_EVENT_CONTRACT_VERSION) {
    throw new Error('bounded Formal Event shadow result identity is invalid');
  }
  if (value.participantJobs !== 0 && value.participantJobs !== 1) throw new Error('bounded Formal Event participantJobs must be 0 or 1');
  const result: BoundedFormalEventShadowResultV2 = {
    schemaVersion: 'shadow-authoring-result-v2',
    terminalStatus: value.terminalStatus as BoundedFormalEventShadowTerminalStatusV2,
    contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
    contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    requirementSha256: value.requirementSha256 === null ? null : hash(value.requirementSha256, 'shadow result.requirementSha256'),
    proposalSha256: value.proposalSha256 === null ? null : hash(value.proposalSha256, 'shadow result.proposalSha256'),
    reviewSha256: value.reviewSha256 === null ? null : hash(value.reviewSha256, 'shadow result.reviewSha256'),
    admissionSha256: value.admissionSha256 === null ? null : hash(value.admissionSha256, 'shadow result.admissionSha256'),
    executionManifestRef: nullableString(value.executionManifestRef, 'shadow result.executionManifestRef'),
    executionManifestSha256: value.executionManifestSha256 === null
      ? null
      : hash(value.executionManifestSha256, 'shadow result.executionManifestSha256'),
    eventId: nullableString(value.eventId, 'shadow result.eventId'),
    canonicalChangedFileRefs: stringArray(value.canonicalChangedFileRefs, 'shadow result.canonicalChangedFileRefs'),
    verificationArtifactRef: nullableString(value.verificationArtifactRef, 'shadow result.verificationArtifactRef'),
    authoritativeFingerprintBefore: hash(value.authoritativeFingerprintBefore, 'shadow result.authoritativeFingerprintBefore'),
    authoritativeFingerprintAfter: hash(value.authoritativeFingerprintAfter, 'shadow result.authoritativeFingerprintAfter'),
    participantJobs: value.participantJobs,
  };
  if (result.terminalStatus === 'SHADOW_AUTHORING_VERIFIED') {
    if (
      result.requirementSha256 === null || result.proposalSha256 === null || result.reviewSha256 === null
      || result.admissionSha256 === null || result.executionManifestRef === null
      || result.executionManifestSha256 === null || result.eventId === null || result.verificationArtifactRef === null
      || result.authoritativeFingerprintBefore !== result.authoritativeFingerprintAfter
    ) throw new Error('verified shadow result requires all provenance and unchanged authoritative fingerprints');
    const expectedPaths = [...BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS].sort();
    if (JSON.stringify([...result.canonicalChangedFileRefs].sort()) !== JSON.stringify(expectedPaths)) {
      throw new Error('verified shadow result must bind the exact bounded Formal Event write surface');
    }
    if (!/^[a-z][a-z0-9_]*$/.test(result.eventId!)) throw new Error('verified shadow result eventId is invalid');
  }
  return result;
}
