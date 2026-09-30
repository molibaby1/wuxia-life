import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import {
  canonicalJson,
  sha256Hex,
} from '../phase0/provenance';
import {
  OPERATOR_BINDING_CODEX_CURRENT,
  ParticipantBindingUnavailableError,
  resolveOperatorParticipantBinding,
  type OperatorParticipantBindingId,
  type ResolvedOperatorParticipantBinding,
} from './resolveParticipantBinding';

const CODEX_JSON_OBJECT_SCHEMA_REF = 'scripts/evolution/operator/codexJsonObjectEnvelope.schema.json';

export interface ReferenceParticipantBindingLockV1 {
  readonly schemaVersion: 'reference-participant-binding-lock-v1';
  readonly bindingId: 'CODEX_CURRENT';
  readonly provider: 'codex-local-subagent';
  readonly executableRealPath: string;
  readonly executableVersion: string;
  readonly modelConfigured: string;
  readonly reasoningEffort: string;
  readonly ambientCodexConfigPath: string;
  readonly ambientCodexConfigSha256: string | 'ABSENT';
  readonly nativeEnvelopeAssistance: {
    readonly enabled: true;
    readonly schemaRef: string;
    readonly schemaSha256: string;
  };
}

async function sha256FileOrAbsent(path: string): Promise<string | 'ABSENT'> {
  try {
    return sha256Hex(await readFile(path));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return 'ABSENT';
    throw error;
  }
}

async function readEnvelopeSchemaSha256(repositoryRoot: string): Promise<string> {
  const schemaPath = join(resolve(repositoryRoot), CODEX_JSON_OBJECT_SCHEMA_REF);
  const schemaBytes = await readFile(schemaPath);
  let schema: unknown;
  try {
    schema = JSON.parse(schemaBytes.toString('utf8'));
  } catch (error) {
    throw new ParticipantBindingUnavailableError(
      `PARTICIPANT_BINDING_UNAVAILABLE: native envelope schema is invalid JSON: ${String(error)}`,
    );
  }
  if (
    !schema ||
    typeof schema !== 'object' ||
    Array.isArray(schema) ||
    Object.keys(schema).length !== 1 ||
    (schema as { type?: unknown }).type !== 'object'
  ) {
    throw new ParticipantBindingUnavailableError(
      'PARTICIPANT_BINDING_UNAVAILABLE: native envelope schema must contain only the JSON object constraint',
    );
  }
  return sha256Hex(schemaBytes);
}

function validateLockShape(lock: ReferenceParticipantBindingLockV1): void {
  if (
    lock.schemaVersion !== 'reference-participant-binding-lock-v1' ||
    lock.bindingId !== OPERATOR_BINDING_CODEX_CURRENT ||
    lock.provider !== 'codex-local-subagent' ||
    !lock.executableRealPath ||
    !lock.executableVersion ||
    !lock.modelConfigured.trim() ||
    !lock.reasoningEffort.trim() ||
    !isAbsolute(lock.ambientCodexConfigPath) ||
    (lock.ambientCodexConfigSha256 !== 'ABSENT' && !/^[0-9a-f]{64}$/.test(lock.ambientCodexConfigSha256)) ||
    lock.nativeEnvelopeAssistance?.enabled !== true ||
    lock.nativeEnvelopeAssistance.schemaRef !== CODEX_JSON_OBJECT_SCHEMA_REF ||
    !/^[0-9a-f]{64}$/.test(lock.nativeEnvelopeAssistance.schemaSha256)
  ) {
    throw new ParticipantBindingUnavailableError('PARTICIPANT_BINDING_UNAVAILABLE: invalid reference Participant binding lock');
  }
}

export async function captureReferenceParticipantBindingLock(input: {
  repositoryRoot: string;
  bindingId: OperatorParticipantBindingId;
  model: string;
  reasoningEffort: string;
  ambientCodexConfigPath: string;
}): Promise<ReferenceParticipantBindingLockV1> {
  if (!input.model.trim()) throw new Error('model must be non-empty');
  if (!input.reasoningEffort.trim()) throw new Error('reasoning effort must be non-empty');
  const resolved: ResolvedOperatorParticipantBinding = await resolveOperatorParticipantBinding(input.bindingId);
  const executableRealPath = await realpath(resolved.executable);
  const ambientCodexConfigPath = resolve(input.ambientCodexConfigPath);
  const [ambientCodexConfigSha256, schemaSha256] = await Promise.all([
    sha256FileOrAbsent(ambientCodexConfigPath),
    readEnvelopeSchemaSha256(input.repositoryRoot),
  ]);
  return {
    schemaVersion: 'reference-participant-binding-lock-v1',
    bindingId: resolved.bindingId,
    provider: resolved.provider,
    executableRealPath,
    executableVersion: resolved.executableVersion,
    modelConfigured: input.model,
    reasoningEffort: input.reasoningEffort,
    ambientCodexConfigPath,
    ambientCodexConfigSha256,
    nativeEnvelopeAssistance: {
      enabled: true,
      schemaRef: CODEX_JSON_OBJECT_SCHEMA_REF,
      schemaSha256,
    },
  };
}

export function referenceParticipantBindingLockSha256(lock: ReferenceParticipantBindingLockV1): string {
  return sha256Hex(canonicalJson(lock));
}

export async function resolveReferenceParticipantBindingFromLock(input: {
  repositoryRoot: string;
  lock: ReferenceParticipantBindingLockV1;
}): Promise<ResolvedOperatorParticipantBinding> {
  validateLockShape(input.lock);
  const current = await resolveOperatorParticipantBinding(input.lock.bindingId);
  const executableRealPath = await realpath(current.executable);
  if (executableRealPath !== input.lock.executableRealPath) {
    throw new ParticipantBindingUnavailableError('PARTICIPANT_BINDING_UNAVAILABLE: executable real path drift');
  }
  if (current.executableVersion !== input.lock.executableVersion) {
    throw new ParticipantBindingUnavailableError('PARTICIPANT_BINDING_UNAVAILABLE: executable version drift');
  }
  const ambientCodexConfigSha256 = await sha256FileOrAbsent(input.lock.ambientCodexConfigPath);
  if (ambientCodexConfigSha256 !== input.lock.ambientCodexConfigSha256) {
    throw new ParticipantBindingUnavailableError('PARTICIPANT_BINDING_UNAVAILABLE: ambient Codex config drift');
  }
  const schemaSha256 = await readEnvelopeSchemaSha256(input.repositoryRoot);
  if (schemaSha256 !== input.lock.nativeEnvelopeAssistance.schemaSha256) {
    throw new ParticipantBindingUnavailableError('PARTICIPANT_BINDING_UNAVAILABLE: native envelope schema drift');
  }

  const participant = {
    ...current.participant,
    model: input.lock.modelConfigured,
    reasoningEffort: input.lock.reasoningEffort,
    bindingMetadata: {
      ...current.participant.bindingMetadata,
      ambientCodexConfigSha256: input.lock.ambientCodexConfigSha256,
      nativeEnvelopeSchemaSha256: input.lock.nativeEnvelopeAssistance.schemaSha256,
    },
  };
  return {
    ...current,
    executable: executableRealPath,
    participant,
  };
}
