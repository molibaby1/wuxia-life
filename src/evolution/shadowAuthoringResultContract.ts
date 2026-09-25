import {
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
} from './preschoolSharedNeutralAuthoringContract';

export type ShadowAuthoringTerminalStatus =
  | 'SHADOW_AUTHORING_VERIFIED'
  | 'SHADOW_AUTHORING_EXECUTION_FAILED'
  | 'SHADOW_AUTHORING_CONFORMANCE_FAILED'
  | 'SHADOW_AUTHORING_VERIFICATION_FAILED'
  | 'CONTRACT_CHANGE_REQUIRED'
  | 'EXECUTION_ENVELOPE_EXCEEDED';

export interface ShadowAuthoringExecutionParticipantResultV1 {
  schemaVersion: 'shadow-authoring-execution-participant-result-v1';
  status: 'completed' | 'failed';
  changedFiles: string[];
  verificationCommandsRun: string[];
  deviations: string[];
}

export interface ShadowAuthoringResultV1 {
  schemaVersion: 'shadow-authoring-result-v1';
  terminalStatus: ShadowAuthoringTerminalStatus;
  contractId: typeof PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID;
  contractVersion: typeof PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION;
  proposalSha256: string;
  reviewSha256: string;
  admissionSha256: string;
  canonicalChangedFileRefs: string[];
  verificationArtifactRef: string | null;
  promotionPackageRef: string | null;
  authoritativeFingerprintBefore: string;
  authoritativeFingerprintAfter: string;
  participantJobs: 1;
}

type RecordValue = Record<string, unknown>;

function assertObject(value: unknown): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('shadow authoring execution result must be an object');
  }
}

function assertExactKeys(value: RecordValue): void {
  const keys = [
    'schemaVersion',
    'status',
    'changedFiles',
    'verificationCommandsRun',
    'deviations',
  ] as const;
  for (const key of Object.keys(value)) {
    if (!(keys as readonly string[]).includes(key)) {
      throw new Error(`shadow authoring execution result contains unknown field: ${key}`);
    }
  }
  for (const key of keys) {
    if (!(key in value)) throw new Error(`shadow authoring execution result is missing field: ${key}`);
  }
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value.map((item, index) => {
    if (typeof item !== 'string' || item.length === 0) {
      throw new Error(`${path}[${index}] must be a non-empty string`);
    }
    return item;
  });
}

export function validateShadowAuthoringExecutionParticipantResult(
  value: unknown,
): ShadowAuthoringExecutionParticipantResultV1 {
  assertObject(value);
  assertExactKeys(value);
  if (value.schemaVersion !== 'shadow-authoring-execution-participant-result-v1') {
    throw new Error('shadow authoring execution result schemaVersion is invalid');
  }
  if (value.status !== 'completed' && value.status !== 'failed') {
    throw new Error('shadow authoring execution result status is invalid');
  }
  return {
    schemaVersion: 'shadow-authoring-execution-participant-result-v1',
    status: value.status,
    changedFiles: stringArray(value.changedFiles, 'shadow authoring execution result.changedFiles'),
    verificationCommandsRun: stringArray(
      value.verificationCommandsRun,
      'shadow authoring execution result.verificationCommandsRun',
    ),
    deviations: stringArray(value.deviations, 'shadow authoring execution result.deviations'),
  };
}
