import { randomUUID } from 'node:crypto';
import { copyFile, lstat, mkdir, open, readdir, readFile, rename, rm } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { canonicalJson, sha256Hex } from '../phase0/provenance';

export type DurableEvidenceVisibility = 'PARTICIPANT_VISIBLE' | 'HUMAN_FORENSIC_ONLY';

export interface DurableEvidenceObjectInput {
  logicalName: string;
  relativePath: string;
  sourcePath: string;
  visibility: DurableEvidenceVisibility;
  evidenceKind: string;
  sourceRef: string;
}

export interface DurableEvidenceObject {
  logicalName: string;
  relativePath: string;
  sha256: string;
  byteLength: number;
  visibility: DurableEvidenceVisibility;
  evidenceKind: string;
  sourceRef: string;
}

export type DurableParticipantRole = 'feedback' | 'hypothesis' | 'solution' | 'reviewer' | 'configuration-execution';

export interface DurableParticipantInvocationReceiptInput {
  invocationRef: string;
  role: DurableParticipantRole;
  round: 1 | 2;
  continuationRef: string | null;
  promptLogicalName: string;
  bindingLogicalName: string;
  invocationLogicalName: string;
  rawOutputLogicalName: string | null;
  stderrLogicalName: string | null;
  executionTraceLogicalName: string;
  structuredResultLogicalName: string | null;
  failureLogicalName: string | null;
  visibleEvidenceLogicalNames: string[];
  skillLogicalNames: string[];
  authorityLogicalNames: string[];
}

export interface DurableEvidenceRefReceipt {
  logicalName: string;
  sha256: string;
}

export interface DurableParticipantInvocationReceipt {
  invocationRef: string;
  role: DurableParticipantRole;
  round: 1 | 2;
  continuationRef: string | null;
  prompt: DurableEvidenceRefReceipt;
  binding: DurableEvidenceRefReceipt;
  invocation: DurableEvidenceRefReceipt;
  rawOutput: DurableEvidenceRefReceipt | null;
  stderr: DurableEvidenceRefReceipt | null;
  executionTrace: DurableEvidenceRefReceipt;
  structuredResult: DurableEvidenceRefReceipt | null;
  failure: DurableEvidenceRefReceipt | null;
  visibleEvidence: DurableEvidenceRefReceipt[];
  skills: DurableEvidenceRefReceipt[];
  authority: DurableEvidenceRefReceipt[];
}

export interface DurableEvidenceCapsuleInput {
  capsuleRoot: string;
  sessionId: string;
  sourceRunRef: string;
  createdAt: string;
  repositoryIdentity: Record<string, unknown>;
  workflowIdentity: Record<string, unknown>;
  evidence: DurableEvidenceObjectInput[];
  importantEvents?: DurableEvidenceImportantEvents;
  extensions?: DurableEvidenceExtensions;
  participantReceipts?: DurableParticipantInvocationReceiptInput[];
}

export interface DurableEvidenceImportantEvents {
  participantFailure: boolean;
  reviewContinuation: boolean;
  configurationExecution: boolean;
  crossRoundTransition: boolean;
}

export interface DurableEvidenceExtension {
  status: 'present' | 'not_applicable';
  refs: string[];
}

export interface DurableEvidenceExtensions {
  configurationExecution: DurableEvidenceExtension;
  crossRoundTransition: DurableEvidenceExtension;
}

export interface DurableEvidenceCapsuleManifest {
  schemaVersion: 'durable-evidence-capsule-v1';
  capsuleId: string;
  sessionId: string;
  sourceRunRef: string;
  createdAt: string;
  repositoryIdentity: Record<string, unknown>;
  workflowIdentity: Record<string, unknown>;
  analysisCoreStatus: 'complete';
  importantEvents: DurableEvidenceImportantEvents;
  extensions: DurableEvidenceExtensions;
  objects: DurableEvidenceObject[];
  totalBytes: number;
  participantReceipts: DurableParticipantInvocationReceipt[];
}

export interface DurableEvidenceCapsulePublishResult {
  capsuleRoot: string;
  manifest: DurableEvidenceCapsuleManifest;
  reused: boolean;
}

function assertNonEmpty(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string`);
}

function assertSafeRelativePath(value: unknown, label: string): asserts value is string {
  assertNonEmpty(value, label);
  if (isAbsolute(value) || value.includes('\\')) throw new Error(`${label} must be Capsule-relative`);
  const segments = value.split('/');
  if (segments.some(segment => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(`${label} must not contain unsafe path segments`);
  }
  if (value === 'manifest.json') throw new Error(`${label} must not target manifest.json`);
}

function validateObjectInput(input: DurableEvidenceObjectInput, index: number): void {
  assertNonEmpty(input.logicalName, `evidence[${index}].logicalName`);
  assertSafeRelativePath(input.relativePath, `evidence[${index}].relativePath`);
  assertNonEmpty(input.sourcePath, `evidence[${index}].sourcePath`);
  assertNonEmpty(input.evidenceKind, `evidence[${index}].evidenceKind`);
  if (input.visibility !== 'PARTICIPANT_VISIBLE' && input.visibility !== 'HUMAN_FORENSIC_ONLY') {
    throw new Error(`evidence[${index}].visibility must be PARTICIPANT_VISIBLE or HUMAN_FORENSIC_ONLY`);
  }
  assertSafeRelativePath(input.sourceRef, `evidence[${index}].sourceRef`);
}

function validateUniqueObjects(objects: Array<Pick<DurableEvidenceObject, 'logicalName' | 'relativePath'>>): void {
  const logicalNames = new Set<string>();
  const paths = new Set<string>();
  for (const object of objects) {
    if (logicalNames.has(object.logicalName)) throw new Error(`duplicate logical evidence identity: ${object.logicalName}`);
    if (paths.has(object.relativePath)) throw new Error(`duplicate Capsule destination path: ${object.relativePath}`);
    logicalNames.add(object.logicalName);
    paths.add(object.relativePath);
  }
}

function resolveReceiptRef(
  logicalName: string,
  objectsByName: Map<string, DurableEvidenceObject>,
  label: string,
): DurableEvidenceRefReceipt {
  assertNonEmpty(logicalName, label);
  const object = objectsByName.get(logicalName);
  if (!object) throw new Error(`${label} references missing logical evidence: ${logicalName}`);
  return { logicalName, sha256: object.sha256 };
}

function resolveReceiptRefs(
  logicalNames: string[],
  objectsByName: Map<string, DurableEvidenceObject>,
  label: string,
): DurableEvidenceRefReceipt[] {
  if (!Array.isArray(logicalNames)) throw new Error(`${label} must be an array`);
  return logicalNames.map((name, index) => resolveReceiptRef(name, objectsByName, `${label}[${index}]`));
}

function resolveParticipantReceipts(
  input: DurableEvidenceCapsuleInput,
  objects: DurableEvidenceObject[],
): DurableParticipantInvocationReceipt[] {
  const receipts = input.participantReceipts ?? [];
  if (!Array.isArray(receipts)) throw new Error('participantReceipts must be an array');
  const objectsByName = new Map(objects.map(object => [object.logicalName, object] as const));
  const invocationRefs = new Set<string>();
  return [...receipts].sort((left, right) => (
    left.round - right.round
    || (left.continuationRef ?? '').localeCompare(right.continuationRef ?? '')
    || left.role.localeCompare(right.role)
    || left.invocationRef.localeCompare(right.invocationRef)
  )).map((receipt, index) => {
    assertNonEmpty(receipt.invocationRef, `participantReceipts[${index}].invocationRef`);
    if (invocationRefs.has(receipt.invocationRef)) throw new Error(`duplicate participant invocation receipt: ${receipt.invocationRef}`);
    invocationRefs.add(receipt.invocationRef);
    if (!['feedback', 'hypothesis', 'solution', 'reviewer', 'configuration-execution'].includes(receipt.role)) {
      throw new Error(`participantReceipts[${index}].role is invalid`);
    }
    if (receipt.round !== 1 && receipt.round !== 2) throw new Error(`participantReceipts[${index}].round is invalid`);
    if (!(receipt.continuationRef === null || typeof receipt.continuationRef === 'string')) throw new Error(`participantReceipts[${index}].continuationRef is invalid`);
    const structuredResult = receipt.structuredResultLogicalName === null
      ? null
      : resolveReceiptRef(receipt.structuredResultLogicalName, objectsByName, `participantReceipts[${index}].structuredResult`);
    const failure = receipt.failureLogicalName === null
      ? null
      : resolveReceiptRef(receipt.failureLogicalName, objectsByName, `participantReceipts[${index}].failure`);
    if (structuredResult !== null && failure !== null) throw new Error(`participantReceipts[${index}] cannot reference both structured result and failure`);
    return {
      invocationRef: receipt.invocationRef,
      role: receipt.role,
      round: receipt.round,
      continuationRef: receipt.continuationRef,
      prompt: resolveReceiptRef(receipt.promptLogicalName, objectsByName, `participantReceipts[${index}].prompt`),
      binding: resolveReceiptRef(receipt.bindingLogicalName, objectsByName, `participantReceipts[${index}].binding`),
      invocation: resolveReceiptRef(receipt.invocationLogicalName, objectsByName, `participantReceipts[${index}].invocation`),
      rawOutput: receipt.rawOutputLogicalName === null ? null : resolveReceiptRef(receipt.rawOutputLogicalName, objectsByName, `participantReceipts[${index}].rawOutput`),
      stderr: receipt.stderrLogicalName === null ? null : resolveReceiptRef(receipt.stderrLogicalName, objectsByName, `participantReceipts[${index}].stderr`),
      executionTrace: resolveReceiptRef(receipt.executionTraceLogicalName, objectsByName, `participantReceipts[${index}].executionTrace`),
      structuredResult,
      failure,
      visibleEvidence: resolveReceiptRefs(receipt.visibleEvidenceLogicalNames, objectsByName, `participantReceipts[${index}].visibleEvidence`),
      skills: resolveReceiptRefs(receipt.skillLogicalNames, objectsByName, `participantReceipts[${index}].skills`),
      authority: resolveReceiptRefs(receipt.authorityLogicalNames, objectsByName, `participantReceipts[${index}].authority`),
    };
  });
}

function manifestFromObjects(input: DurableEvidenceCapsuleInput, objects: DurableEvidenceObject[]): DurableEvidenceCapsuleManifest {
  const importantEvents = input.importantEvents ?? {
    participantFailure: false,
    reviewContinuation: false,
    configurationExecution: false,
    crossRoundTransition: false,
  };
  const extensions = input.extensions ?? {
    configurationExecution: { status: 'not_applicable', refs: [] },
    crossRoundTransition: { status: 'not_applicable', refs: [] },
  };
  for (const field of ['configurationExecution', 'crossRoundTransition'] as const) {
    const occurred = importantEvents[field];
    if (occurred !== (extensions[field].status === 'present')) {
      throw new Error(`manifest extension status does not match important event ${field}`);
    }
  }
  return {
    schemaVersion: 'durable-evidence-capsule-v1',
    capsuleId: input.sessionId,
    sessionId: input.sessionId,
    sourceRunRef: input.sourceRunRef,
    createdAt: input.createdAt,
    repositoryIdentity: input.repositoryIdentity,
    workflowIdentity: input.workflowIdentity,
    analysisCoreStatus: 'complete',
    importantEvents,
    extensions,
    objects: [...objects].sort((left, right) => (
      left.logicalName.localeCompare(right.logicalName)
      || left.relativePath.localeCompare(right.relativePath)
    )),
    totalBytes: objects.reduce((total, object) => total + object.byteLength, 0),
    participantReceipts: resolveParticipantReceipts(input, objects),
  };
}

function validateEventMetadata(input: DurableEvidenceCapsuleInput): void {
  const importantEvents = input.importantEvents;
  if (importantEvents !== undefined) {
    for (const field of ['participantFailure', 'reviewContinuation', 'configurationExecution', 'crossRoundTransition'] as const) {
      if (typeof importantEvents[field] !== 'boolean') throw new Error(`importantEvents.${field} must be boolean`);
    }
  }
  const extensions = input.extensions;
  if (extensions !== undefined) {
    for (const field of ['configurationExecution', 'crossRoundTransition'] as const) {
      const extension = extensions[field];
      if (extension.status !== 'present' && extension.status !== 'not_applicable') throw new Error(`extensions.${field}.status is invalid`);
      if (!Array.isArray(extension.refs) || extension.refs.some(ref => typeof ref !== 'string' || ref.length === 0)) throw new Error(`extensions.${field}.refs must be a string array`);
      extension.refs.forEach(ref => assertSafeRelativePath(ref, `extensions.${field}.refs`));
    }
  }
}

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

async function writeCreateOnly(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(content, 'utf8');
  } finally {
    await handle.close();
  }
}

async function assertRegularFile(path: string, label: string): Promise<void> {
  const info = await lstat(path);
  if (!info.isFile()) throw new Error(`${label} must be a regular file: ${path}`);
}

async function listFiles(root: string, current = ''): Promise<string[]> {
  const entries = await readdir(join(root, current), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const relativePath = current ? `${current}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...await listFiles(root, relativePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    } else {
      throw new Error(`Capsule contains unsupported filesystem entry: ${relativePath}`);
    }
  }
  return files.sort();
}

function parseManifest(value: unknown): DurableEvidenceCapsuleManifest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Capsule manifest must be an object');
  const manifest = value as Record<string, unknown>;
  if (manifest.schemaVersion !== 'durable-evidence-capsule-v1') throw new Error('unsupported Capsule manifest schemaVersion');
  for (const field of ['capsuleId', 'sessionId', 'sourceRunRef', 'createdAt']) assertNonEmpty(manifest[field], `manifest.${field}`);
  if (!Array.isArray(manifest.objects)) throw new Error('manifest.objects must be an array');
  if (manifest.analysisCoreStatus !== 'complete') throw new Error('manifest.analysisCoreStatus must be complete');
  const importantEvents = manifest.importantEvents;
  if (typeof importantEvents !== 'object' || importantEvents === null || Array.isArray(importantEvents)) {
    throw new Error('manifest.importantEvents must be an object');
  }
  for (const field of ['participantFailure', 'reviewContinuation', 'configurationExecution', 'crossRoundTransition']) {
    if (typeof (importantEvents as Record<string, unknown>)[field] !== 'boolean') {
      throw new Error(`manifest.importantEvents.${field} must be boolean`);
    }
  }
  const extensions = manifest.extensions;
  if (typeof extensions !== 'object' || extensions === null || Array.isArray(extensions)) {
    throw new Error('manifest.extensions must be an object');
  }
  for (const field of ['configurationExecution', 'crossRoundTransition']) {
    const extension = (extensions as Record<string, unknown>)[field];
    if (typeof extension !== 'object' || extension === null || Array.isArray(extension)) {
      throw new Error(`manifest.extensions.${field} must be an object`);
    }
    const record = extension as Record<string, unknown>;
    if (record.status !== 'present' && record.status !== 'not_applicable') {
      throw new Error(`manifest.extensions.${field}.status is invalid`);
    }
    if (!Array.isArray(record.refs) || record.refs.some(ref => typeof ref !== 'string' || ref.length === 0)) {
      throw new Error(`manifest.extensions.${field}.refs must be a string array`);
    }
    for (const ref of record.refs) assertSafeRelativePath(ref, `manifest.extensions.${field}.refs`);
  }
  for (const field of ['configurationExecution', 'crossRoundTransition'] as const) {
    if (importantEvents[field] !== (((extensions as Record<string, unknown>)[field] as Record<string, unknown>).status === 'present')) {
      throw new Error(`manifest extension status does not match important event ${field}`);
    }
  }
  if (!Number.isSafeInteger(manifest.totalBytes) || (manifest.totalBytes as number) < 0) throw new Error('manifest.totalBytes must be a non-negative integer');
  const objects: DurableEvidenceObject[] = manifest.objects.map((raw, index) => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new Error(`manifest.objects[${index}] must be an object`);
    const object = raw as Record<string, unknown>;
    assertNonEmpty(object.logicalName, `manifest.objects[${index}].logicalName`);
    assertSafeRelativePath(object.relativePath, `manifest.objects[${index}].relativePath`);
    assertNonEmpty(object.sha256, `manifest.objects[${index}].sha256`);
    if (!/^[0-9a-f]{64}$/.test(object.sha256)) throw new Error(`manifest.objects[${index}].sha256 must be lowercase SHA-256`);
    if (!Number.isSafeInteger(object.byteLength) || (object.byteLength as number) < 0) throw new Error(`manifest.objects[${index}].byteLength must be a non-negative integer`);
    if (object.visibility !== 'PARTICIPANT_VISIBLE' && object.visibility !== 'HUMAN_FORENSIC_ONLY') throw new Error(`manifest.objects[${index}].visibility is invalid`);
    assertNonEmpty(object.evidenceKind, `manifest.objects[${index}].evidenceKind`);
    assertSafeRelativePath(object.sourceRef, `manifest.objects[${index}].sourceRef`);
    return {
      logicalName: object.logicalName,
      relativePath: object.relativePath,
      sha256: object.sha256,
      byteLength: object.byteLength as number,
      visibility: object.visibility,
      evidenceKind: object.evidenceKind,
      sourceRef: object.sourceRef,
    };
  });
  validateUniqueObjects(objects);
  const sortedObjects = [...objects].sort((left, right) => left.logicalName.localeCompare(right.logicalName) || left.relativePath.localeCompare(right.relativePath));
  if (canonicalJson(sortedObjects) !== canonicalJson(objects)) throw new Error('manifest.objects must use deterministic ordering');
  const totalBytes = objects.reduce((total, object) => total + object.byteLength, 0);
  if (totalBytes !== manifest.totalBytes) throw new Error('manifest.totalBytes does not match declared objects');
  assertRecord(manifest.repositoryIdentity, 'manifest.repositoryIdentity');
  assertRecord(manifest.workflowIdentity, 'manifest.workflowIdentity');
  if (!Array.isArray(manifest.participantReceipts)) throw new Error('manifest.participantReceipts must be an array');
  const objectsByName = new Map(objects.map(object => [object.logicalName, object] as const));
  const participantReceipts: DurableParticipantInvocationReceipt[] = manifest.participantReceipts.map((raw, index) => {
    assertRecord(raw, `manifest.participantReceipts[${index}]`);
    const receipt = raw as Record<string, unknown>;
    assertNonEmpty(receipt.invocationRef, `manifest.participantReceipts[${index}].invocationRef`);
    if (!['feedback', 'hypothesis', 'solution', 'reviewer', 'configuration-execution'].includes(String(receipt.role))) throw new Error(`manifest.participantReceipts[${index}].role is invalid`);
    if (receipt.round !== 1 && receipt.round !== 2) throw new Error(`manifest.participantReceipts[${index}].round is invalid`);
    if (!(receipt.continuationRef === null || typeof receipt.continuationRef === 'string')) throw new Error(`manifest.participantReceipts[${index}].continuationRef is invalid`);
    const ref = (value: unknown, label: string): DurableEvidenceRefReceipt | null => {
      if (value === null) return null;
      assertRecord(value, label);
      assertNonEmpty(value.logicalName, `${label}.logicalName`);
      assertNonEmpty(value.sha256, `${label}.sha256`);
      if (!/^[0-9a-f]{64}$/.test(value.sha256)) throw new Error(`${label}.sha256 must be lowercase SHA-256`);
      const object = objectsByName.get(value.logicalName);
      if (!object) throw new Error(`${label} references missing logical evidence: ${value.logicalName}`);
      if (object.sha256 !== value.sha256) throw new Error(`${label} hash does not match logical evidence: ${value.logicalName}`);
      return { logicalName: value.logicalName, sha256: value.sha256 };
    };
    const arrayRefs = (value: unknown, label: string): DurableEvidenceRefReceipt[] => {
      if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
      return value.map((entry, entryIndex) => {
        const resolved = ref(entry, `${label}[${entryIndex}]`);
        if (resolved === null) throw new Error(`${label}[${entryIndex}] cannot be null`);
        return resolved;
      });
    };
    const requiredRef = (value: unknown, label: string): DurableEvidenceRefReceipt => {
      const resolved = ref(value, label);
      if (resolved === null) throw new Error(`${label} is required`);
      return resolved;
    };
    const structuredResult = ref(receipt.structuredResult, `manifest.participantReceipts[${index}].structuredResult`);
    const failure = ref(receipt.failure, `manifest.participantReceipts[${index}].failure`);
    if (structuredResult !== null && failure !== null) throw new Error(`manifest.participantReceipts[${index}] cannot reference both structured result and failure`);
    return {
      invocationRef: receipt.invocationRef,
      role: receipt.role as DurableParticipantRole,
      round: receipt.round,
      continuationRef: receipt.continuationRef,
      prompt: requiredRef(receipt.prompt, `manifest.participantReceipts[${index}].prompt`),
      binding: requiredRef(receipt.binding, `manifest.participantReceipts[${index}].binding`),
      invocation: requiredRef(receipt.invocation, `manifest.participantReceipts[${index}].invocation`),
      rawOutput: ref(receipt.rawOutput, `manifest.participantReceipts[${index}].rawOutput`),
      stderr: ref(receipt.stderr, `manifest.participantReceipts[${index}].stderr`),
      executionTrace: requiredRef(receipt.executionTrace, `manifest.participantReceipts[${index}].executionTrace`),
      structuredResult,
      failure,
      visibleEvidence: arrayRefs(receipt.visibleEvidence, `manifest.participantReceipts[${index}].visibleEvidence`),
      skills: arrayRefs(receipt.skills, `manifest.participantReceipts[${index}].skills`),
      authority: arrayRefs(receipt.authority, `manifest.participantReceipts[${index}].authority`),
    };
  });
  if (new Set(participantReceipts.map(receipt => receipt.invocationRef)).size !== participantReceipts.length) throw new Error('manifest.participantReceipts contains duplicate invocationRef');
  const sortedReceipts = [...participantReceipts].sort((left, right) => left.round - right.round || (left.continuationRef ?? '').localeCompare(right.continuationRef ?? '') || left.role.localeCompare(right.role) || left.invocationRef.localeCompare(right.invocationRef));
  if (canonicalJson(sortedReceipts) !== canonicalJson(participantReceipts)) throw new Error('manifest.participantReceipts must use deterministic ordering');
  return {
    schemaVersion: 'durable-evidence-capsule-v1',
    capsuleId: manifest.capsuleId,
    sessionId: manifest.sessionId,
    sourceRunRef: manifest.sourceRunRef,
    createdAt: manifest.createdAt,
    repositoryIdentity: (manifest.repositoryIdentity ?? {}) as Record<string, unknown>,
    workflowIdentity: (manifest.workflowIdentity ?? {}) as Record<string, unknown>,
    analysisCoreStatus: 'complete',
    importantEvents: importantEvents as DurableEvidenceImportantEvents,
    extensions: extensions as DurableEvidenceExtensions,
    objects,
    totalBytes: manifest.totalBytes as number,
    participantReceipts,
  };
}

export async function verifyDurableEvidenceCapsule(capsuleRoot: string): Promise<DurableEvidenceCapsuleManifest> {
  const root = resolve(capsuleRoot);
  await assertRegularFile(join(root, 'manifest.json'), 'Capsule manifest');
  const manifest = parseManifest(JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8')));
  const declaredPaths = new Set(['manifest.json', ...manifest.objects.map(object => object.relativePath)]);
  const actualPaths = await listFiles(root);
  for (const actualPath of actualPaths) {
    if (!declaredPaths.has(actualPath)) throw new Error(`Capsule contains undeclared file: ${actualPath}`);
  }
  for (const object of manifest.objects) {
    const path = join(root, object.relativePath);
    await assertRegularFile(path, `retained evidence ${object.logicalName}`);
    const bytes = await readFile(path);
    if (bytes.byteLength !== object.byteLength) throw new Error(`byte length mismatch for ${object.logicalName}`);
    if (sha256Hex(bytes) !== object.sha256) throw new Error(`sha256 mismatch for ${object.logicalName}`);
  }
  for (const extensionName of ['configurationExecution', 'crossRoundTransition'] as const) {
    const extension = manifest.extensions[extensionName];
    if (extension.status === 'not_applicable') continue;
    for (const ref of extension.refs) {
      const hasEvidence = manifest.objects.some(object => object.relativePath === ref || object.relativePath.startsWith(`${ref}/`));
      if (!hasEvidence) throw new Error(`required Capsule extension evidence is missing: ${extensionName}:${ref}`);
    }
  }
  return manifest;
}

export async function publishDurableEvidenceCapsule(
  input: DurableEvidenceCapsuleInput,
): Promise<DurableEvidenceCapsulePublishResult> {
  const finalRoot = resolve(input.capsuleRoot);
  assertNonEmpty(input.sessionId, 'sessionId');
  assertNonEmpty(input.sourceRunRef, 'sourceRunRef');
  assertNonEmpty(input.createdAt, 'createdAt');
  if (!Array.isArray(input.evidence)) throw new Error('evidence must be an array');
  input.evidence.forEach(validateObjectInput);
  validateUniqueObjects(input.evidence);
  validateEventMetadata(input);
  if (input.participantReceipts !== undefined && !Array.isArray(input.participantReceipts)) throw new Error('participantReceipts must be an array');

  try {
    const existing = await verifyDurableEvidenceCapsule(finalRoot);
    if (existing.capsuleId !== input.sessionId || existing.sessionId !== input.sessionId || existing.sourceRunRef !== input.sourceRunRef) {
      throw new Error(`existing Capsule identity does not match ${input.sessionId}`);
    }
    return { capsuleRoot: finalRoot, manifest: existing, reused: true };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT' && await pathExists(finalRoot)) {
      throw new Error(`existing Capsule is invalid and cannot be replaced: ${String(error)}`);
    }
  }

  const stagingRoot = join(dirname(finalRoot), `.staging-${input.sessionId}-${randomUUID()}`);
  await mkdir(stagingRoot, { recursive: true });
  const objects: DurableEvidenceObject[] = [];
  try {
    for (const evidence of [...input.evidence].sort((left, right) => left.logicalName.localeCompare(right.logicalName) || left.relativePath.localeCompare(right.relativePath))) {
      await assertRegularFile(evidence.sourcePath, `source evidence ${evidence.logicalName}`);
      const destination = join(stagingRoot, evidence.relativePath);
      const destinationRelative = relative(stagingRoot, destination);
      if (!destinationRelative || destinationRelative.startsWith(`..${sep}`) || isAbsolute(destinationRelative)) throw new Error(`unsafe Capsule destination: ${evidence.relativePath}`);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(evidence.sourcePath, destination);
      const bytes = await readFile(destination);
      objects.push({
        logicalName: evidence.logicalName,
        relativePath: evidence.relativePath,
        sha256: sha256Hex(bytes),
        byteLength: bytes.byteLength,
        visibility: evidence.visibility,
        evidenceKind: evidence.evidenceKind,
        sourceRef: evidence.sourceRef,
      });
    }
    const manifest = manifestFromObjects(input, objects);
    await writeCreateOnly(join(stagingRoot, 'manifest.json'), `${canonicalJson(manifest)}\n`);
    await verifyDurableEvidenceCapsule(stagingRoot);
    if (await pathExists(finalRoot)) throw new Error(`Capsule final path already exists: ${finalRoot}`);
    await rename(stagingRoot, finalRoot);
    const published = await verifyDurableEvidenceCapsule(finalRoot);
    return { capsuleRoot: finalRoot, manifest: published, reused: false };
  } catch (error) {
    await rm(stagingRoot, { recursive: true, force: true });
    throw error;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}
