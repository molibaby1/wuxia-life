import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import {
  canonicalJson,
  sha256Hex,
} from '../phase0/provenance';
import {
  ARTIFACT_BACKED_STRUCTURED_FINAL_RESULT_RECEIPT_SCHEMA_VERSION,
  ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH,
} from '../../../src/evolution/artifactBackedStructuredFinalResultContract';
import {
  OPERATOR_BINDING_CODEX_CURRENT,
  ParticipantBindingUnavailableError,
  createCodexReferenceParticipant,
  resolveOperatorParticipantBinding,
  type OperatorParticipantBindingId,
  type ResolvedOperatorParticipantBinding,
} from './resolveParticipantBinding';

const CODEX_JSON_OBJECT_SCHEMA_REF = 'scripts/evolution/operator/codexJsonObjectEnvelope.schema.json';
const CODEX_ARTIFACT_RECEIPT_SCHEMA_REF = 'scripts/evolution/operator/codexArtifactBackedReceipt.schema.json';
const JSON_VALUE_SCHEMA_REF = '#/$defs/jsonValue';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}

function isJsonValueReference(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ['$ref']) && value.$ref === JSON_VALUE_SCHEMA_REF;
}

function isUniversalJsonProperties(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['.*'])
    && isJsonValueReference(value['.*']);
}

function isClosedJsonObject(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['type', 'properties', 'patternProperties', 'required', 'additionalProperties'])
    && value.type === 'object'
    && isRecord(value.properties)
    && Object.keys(value.properties).length === 0
    && isUniversalJsonProperties(value.patternProperties)
    && Array.isArray(value.required)
    && value.required.length === 0
    && value.additionalProperties === false;
}

function isJsonValueSchema(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, ['anyOf']) || !Array.isArray(value.anyOf) || value.anyOf.length !== 6) {
    return false;
  }
  const [stringValue, numberValue, booleanValue, nullValue, arrayValue, objectValue] = value.anyOf;
  return [
    ['string', stringValue],
    ['number', numberValue],
    ['boolean', booleanValue],
    ['null', nullValue],
  ].every(([type, schema]) => isRecord(schema)
    && hasExactKeys(schema, ['type'])
    && schema.type === type)
    && isRecord(arrayValue)
    && hasExactKeys(arrayValue, ['type', 'items'])
    && arrayValue.type === 'array'
    && isJsonValueReference(arrayValue.items)
    && isClosedJsonObject(objectValue);
}

function isJsonObjectEnvelopeSchema(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, ['$defs', 'type', 'properties', 'patternProperties', 'required', 'additionalProperties'])
    && value.type === 'object'
    && isRecord(value.properties)
    && Object.keys(value.properties).length === 0
    && isUniversalJsonProperties(value.patternProperties)
    && Array.isArray(value.required)
    && value.required.length === 0
    && value.additionalProperties === false
    && isRecord(value.$defs)
    && hasExactKeys(value.$defs, ['jsonValue'])
    && isJsonValueSchema(value.$defs.jsonValue);
}

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

export interface ArtifactBackedReferenceParticipantBindingLockV2 {
  readonly schemaVersion: 'reference-participant-binding-lock-v2';
  readonly bindingId: 'CODEX_CURRENT';
  readonly provider: 'codex-local-subagent';
  readonly executableRealPath: string;
  readonly executableVersion: string;
  readonly modelConfigured: string;
  readonly reasoningEffort: string;
  readonly ambientCodexConfigPath: string;
  readonly ambientCodexConfigSha256: string | 'ABSENT';
  readonly structuredResultDelivery: {
    readonly kind: 'WORKSPACE_ARTIFACT_RECEIPT_V1';
    readonly resultRelativePath: '.evolution-participant/final-result.json';
    readonly receiptSchemaRef: 'scripts/evolution/operator/codexArtifactBackedReceipt.schema.json';
    readonly receiptSchemaSha256: string;
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
  if (!isJsonObjectEnvelopeSchema(schema)) {
    throw new ParticipantBindingUnavailableError(
      'PARTICIPANT_BINDING_UNAVAILABLE: native envelope schema must contain only the JSON object constraint',
    );
  }
  return sha256Hex(schemaBytes);
}

function isReceiptSchema(value: unknown): boolean {
  if (!isRecord(value)
    || !hasExactKeys(value, ['type', 'properties', 'required', 'additionalProperties'])
    || value.type !== 'object'
    || value.additionalProperties !== false
    || !Array.isArray(value.required)
    || value.required.length !== 3
    || value.required[0] !== 'schemaVersion'
    || value.required[1] !== 'bytes'
    || value.required[2] !== 'sha256'
    || !isRecord(value.properties)
    || !hasExactKeys(value.properties, ['schemaVersion', 'bytes', 'sha256'])) {
    return false;
  }
  const schemaVersion = value.properties.schemaVersion;
  if (!isRecord(schemaVersion)
    || !hasExactKeys(schemaVersion, ['type', 'enum'])
    || schemaVersion.type !== 'string'
    || !Array.isArray(schemaVersion.enum)
    || schemaVersion.enum.length !== 1
    || schemaVersion.enum[0] !== ARTIFACT_BACKED_STRUCTURED_FINAL_RESULT_RECEIPT_SCHEMA_VERSION) {
    return false;
  }
  return [
    ['bytes', 'integer'],
    ['sha256', 'string'],
  ].every(([field, type]) => {
    const schema = value.properties[field as string];
    return isRecord(schema) && hasExactKeys(schema, ['type']) && schema.type === type;
  });
}

async function readArtifactReceiptSchemaSha256(repositoryRoot: string): Promise<string> {
  const schemaPath = join(resolve(repositoryRoot), CODEX_ARTIFACT_RECEIPT_SCHEMA_REF);
  const schemaBytes = await readFile(schemaPath);
  let schema: unknown;
  try {
    schema = JSON.parse(schemaBytes.toString('utf8'));
  } catch (error) {
    throw new ParticipantBindingUnavailableError(
      `PARTICIPANT_BINDING_UNAVAILABLE: artifact receipt schema is invalid JSON: ${String(error)}`,
    );
  }
  if (!isReceiptSchema(schema)) {
    throw new ParticipantBindingUnavailableError(
      'PARTICIPANT_BINDING_UNAVAILABLE: artifact receipt schema must contain only the transport receipt fields',
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

function validateArtifactBackedLockShape(lock: ArtifactBackedReferenceParticipantBindingLockV2): void {
  if (!isRecord(lock)
    || !hasExactKeys(lock, [
      'schemaVersion',
      'bindingId',
      'provider',
      'executableRealPath',
      'executableVersion',
      'modelConfigured',
      'reasoningEffort',
      'ambientCodexConfigPath',
      'ambientCodexConfigSha256',
      'structuredResultDelivery',
    ])
    || lock.schemaVersion !== 'reference-participant-binding-lock-v2'
    || lock.bindingId !== OPERATOR_BINDING_CODEX_CURRENT
    || lock.provider !== 'codex-local-subagent'
    || typeof lock.executableRealPath !== 'string'
    || !lock.executableRealPath
    || typeof lock.executableVersion !== 'string'
    || !lock.executableVersion
    || typeof lock.modelConfigured !== 'string'
    || !lock.modelConfigured.trim()
    || typeof lock.reasoningEffort !== 'string'
    || !lock.reasoningEffort.trim()
    || typeof lock.ambientCodexConfigPath !== 'string'
    || !isAbsolute(lock.ambientCodexConfigPath)
    || (lock.ambientCodexConfigSha256 !== 'ABSENT'
      && (typeof lock.ambientCodexConfigSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(lock.ambientCodexConfigSha256)))
    || !isRecord(lock.structuredResultDelivery)
    || !hasExactKeys(lock.structuredResultDelivery, ['kind', 'resultRelativePath', 'receiptSchemaRef', 'receiptSchemaSha256'])
    || lock.structuredResultDelivery.kind !== 'WORKSPACE_ARTIFACT_RECEIPT_V1'
    || lock.structuredResultDelivery.resultRelativePath !== ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH
    || lock.structuredResultDelivery.receiptSchemaRef !== CODEX_ARTIFACT_RECEIPT_SCHEMA_REF
    || typeof lock.structuredResultDelivery.receiptSchemaSha256 !== 'string'
    || !/^[0-9a-f]{64}$/.test(lock.structuredResultDelivery.receiptSchemaSha256)) {
    throw new ParticipantBindingUnavailableError('PARTICIPANT_BINDING_UNAVAILABLE: invalid reference Participant binding lock');
  }
}

export async function captureArtifactBackedReferenceParticipantBindingLock(input: {
  repositoryRoot: string;
  bindingId: OperatorParticipantBindingId;
  model: string;
  reasoningEffort: string;
  ambientCodexConfigPath: string;
}): Promise<ArtifactBackedReferenceParticipantBindingLockV2> {
  if (!input.model.trim()) throw new Error('model must be non-empty');
  if (!input.reasoningEffort.trim()) throw new Error('reasoning effort must be non-empty');
  const resolved: ResolvedOperatorParticipantBinding = await resolveOperatorParticipantBinding(input.bindingId);
  const executableRealPath = await realpath(resolved.executable);
  const ambientCodexConfigPath = resolve(input.ambientCodexConfigPath);
  const [ambientCodexConfigSha256, receiptSchemaSha256] = await Promise.all([
    sha256FileOrAbsent(ambientCodexConfigPath),
    readArtifactReceiptSchemaSha256(input.repositoryRoot),
  ]);
  return {
    schemaVersion: 'reference-participant-binding-lock-v2',
    bindingId: resolved.bindingId,
    provider: resolved.provider,
    executableRealPath,
    executableVersion: resolved.executableVersion,
    modelConfigured: input.model,
    reasoningEffort: input.reasoningEffort,
    ambientCodexConfigPath,
    ambientCodexConfigSha256,
    structuredResultDelivery: {
      kind: 'WORKSPACE_ARTIFACT_RECEIPT_V1',
      resultRelativePath: ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH,
      receiptSchemaRef: CODEX_ARTIFACT_RECEIPT_SCHEMA_REF,
      receiptSchemaSha256,
    },
  };
}

export function artifactBackedReferenceParticipantBindingLockSha256(
  lock: ArtifactBackedReferenceParticipantBindingLockV2,
): string {
  return sha256Hex(canonicalJson(lock));
}

export async function resolveArtifactBackedReferenceParticipantBindingFromLock(input: {
  repositoryRoot: string;
  lock: ArtifactBackedReferenceParticipantBindingLockV2;
}): Promise<ResolvedOperatorParticipantBinding> {
  validateArtifactBackedLockShape(input.lock);
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
  const receiptSchemaSha256 = await readArtifactReceiptSchemaSha256(input.repositoryRoot);
  if (receiptSchemaSha256 !== input.lock.structuredResultDelivery.receiptSchemaSha256) {
    throw new ParticipantBindingUnavailableError('PARTICIPANT_BINDING_UNAVAILABLE: artifact receipt schema drift');
  }

  const participant = createCodexReferenceParticipant({
    executable: executableRealPath,
    executableVersion: current.executableVersion,
    model: input.lock.modelConfigured,
    reasoningEffort: input.lock.reasoningEffort,
    nativeOutputSchemaPath: join(resolve(input.repositoryRoot), input.lock.structuredResultDelivery.receiptSchemaRef),
    nativeOutputSchemaSha256: input.lock.structuredResultDelivery.receiptSchemaSha256,
    ambientCodexConfigSha256: input.lock.ambientCodexConfigSha256,
    structuredResultDeliveryMode: input.lock.structuredResultDelivery.kind,
  });
  return {
    ...current,
    executable: executableRealPath,
    participant,
  };
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

  const participant = createCodexReferenceParticipant({
    executable: executableRealPath,
    executableVersion: current.executableVersion,
    model: input.lock.modelConfigured,
    reasoningEffort: input.lock.reasoningEffort,
    nativeOutputSchemaPath: join(resolve(input.repositoryRoot), input.lock.nativeEnvelopeAssistance.schemaRef),
    nativeOutputSchemaSha256: input.lock.nativeEnvelopeAssistance.schemaSha256,
    ambientCodexConfigSha256: input.lock.ambientCodexConfigSha256,
  });
  return {
    ...current,
    executable: executableRealPath,
    participant,
  };
}
