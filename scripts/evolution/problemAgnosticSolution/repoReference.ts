import { lstat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import {
  ParticipantOutputValidationError,
  type ParticipantFailureFacts,
  type ParticipantFailureReason,
} from './participantFailureClassification';

export interface RepoReferenceLocator {
  reference: string;
  path: string;
  lineStart?: number;
  lineEnd?: number;
}

const VALID_LOCATOR = /^(.+):([1-9]\d*)(?:-([1-9]\d*))?$/;
const MALFORMED_LOCATOR = /^(.+):(\d+)(?:-(\d*))?$/;

export const repoReferenceFs = { lstat };

function referenceFailure(
  origin: 'OUTPUT_REFERENCE' | 'HOST_INFRASTRUCTURE',
  reason: ParticipantFailureReason,
  message: string,
): never {
  const facts: ParticipantFailureFacts = {
    origin,
    reason,
    participantErrorKind: 'invalid_output',
    message,
  };
  throw new ParticipantOutputValidationError(facts);
}

function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' ? code : undefined;
}

function parseReferenceForValidation(reference: string, label: string): RepoReferenceLocator {
  try {
    const locator = parseRepoReference(reference);
    if (!locator.path) {
      referenceFailure('OUTPUT_REFERENCE', 'MALFORMED_LOCATOR', `${label} has an invalid reference: ${reference}`);
    }
    return locator;
  } catch (error) {
    referenceFailure(
      'OUTPUT_REFERENCE',
      'MALFORMED_LOCATOR',
      `${label} has an invalid locator: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function resolveReferencePath(root: string, path: string, label: string, reference: string): string {
  if (isAbsolute(path)) {
    referenceFailure('OUTPUT_REFERENCE', 'ABSOLUTE_PATH', `${label} must be relative: ${reference}`);
  }
  const resolvedRoot = resolve(root);
  const target = resolve(resolvedRoot, path);
  const escaped = relative(resolvedRoot, target);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
    referenceFailure('OUTPUT_REFERENCE', 'ESCAPES_ALLOWED_ROOT', `${label} escapes its allowed root: ${reference}`);
  }
  return target;
}

async function lstatReferenceTarget(target: string, label: string, reference: string): Promise<Awaited<ReturnType<typeof lstat>> | null> {
  try {
    return await repoReferenceFs.lstat(target);
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return null;
    referenceFailure('OUTPUT_REFERENCE', 'IO_ERROR', `${label} could not be inspected: ${reference}`);
  }
}

export function parseRepoReference(reference: string): RepoReferenceLocator {
  const match = VALID_LOCATOR.exec(reference);
  if (match) {
    const lineStart = Number(match[2]);
    const lineEnd = match[3] === undefined ? undefined : Number(match[3]);
    if (lineEnd !== undefined && lineEnd < lineStart) {
      throw new Error(`repoRef has an invalid line range: ${reference}`);
    }
    return { reference, path: match[1]!, lineStart, ...(lineEnd === undefined ? {} : { lineEnd }) };
  }
  if (MALFORMED_LOCATOR.test(reference)) {
    throw new Error(`repoRef has an invalid line locator: ${reference}`);
  }
  return { reference, path: reference };
}

export async function assertRepoReferenceFile(
  root: string,
  reference: string,
  label: string,
): Promise<void> {
  const locator = parseRepoReference(reference);
  if (!locator.path || isAbsolute(locator.path)) {
    throw new Error(`${label} must be a relative path: ${reference}`);
  }
  const resolvedRoot = resolve(root);
  const target = resolve(resolvedRoot, locator.path);
  const escaped = relative(resolvedRoot, target);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
    throw new Error(`${label} escapes its allowed root: ${reference}`);
  }
  const stat = await lstat(target);
  if (!stat.isFile()) throw new Error(`${label} must resolve to a regular file: ${reference}`);
}

export async function assertRepoReferenceFileAgainstAuthoritative(input: {
  workspaceRoot: string;
  authoritativeRoot: string;
  reference: string;
  label: string;
}): Promise<void> {
  const locator = parseReferenceForValidation(input.reference, input.label);
  const authoritativeTarget = resolveReferencePath(
    input.authoritativeRoot,
    locator.path,
    input.label,
    input.reference,
  );
  const workspaceTarget = resolveReferencePath(
    input.workspaceRoot,
    locator.path,
    input.label,
    input.reference,
  );

  const authoritativeStat = await lstatReferenceTarget(
    authoritativeTarget,
    input.label,
    input.reference,
  );
  if (authoritativeStat === null) {
    referenceFailure('OUTPUT_REFERENCE', 'MISSING_TARGET', `${input.label} does not exist: ${input.reference}`);
  }
  if (!authoritativeStat.isFile()) {
    referenceFailure('OUTPUT_REFERENCE', 'NOT_REGULAR_FILE', `${input.label} is not a regular file: ${input.reference}`);
  }

  const workspaceStat = await lstatReferenceTarget(workspaceTarget, input.label, input.reference);
  if (workspaceStat === null || !workspaceStat.isFile()) {
    referenceFailure(
      'HOST_INFRASTRUCTURE',
      'WORKSPACE_MATERIALIZATION_MISMATCH',
      `${input.label} is not materialized as a regular workspace file: ${input.reference}`,
    );
  }
}

export async function assertArtifactReferenceFile(input: {
  artifactRoot: string;
  workspaceRoot: string;
  authoritativeRoot: string;
  reference: string;
  label: string;
}): Promise<void> {
  const locator = parseReferenceForValidation(input.reference, input.label);
  if (locator.lineStart !== undefined) {
    referenceFailure('OUTPUT_REFERENCE', 'MALFORMED_LOCATOR', `${input.label} does not accept line locators: ${input.reference}`);
  }

  const artifactTarget = resolveReferencePath(
    input.artifactRoot,
    locator.path,
    input.label,
    input.reference,
  );
  const authoritativeTarget = resolveReferencePath(
    input.authoritativeRoot,
    locator.path,
    input.label,
    input.reference,
  );
  const workspaceTarget = resolveReferencePath(
    input.workspaceRoot,
    locator.path,
    input.label,
    input.reference,
  );

  const artifactStat = await lstatReferenceTarget(artifactTarget, input.label, input.reference);
  if (artifactStat !== null) {
    if (!artifactStat.isFile()) {
      referenceFailure('OUTPUT_REFERENCE', 'NOT_REGULAR_FILE', `${input.label} is not a regular file: ${input.reference}`);
    }
    return;
  }

  const authoritativeStat = await lstatReferenceTarget(
    authoritativeTarget,
    input.label,
    input.reference,
  );
  if (authoritativeStat === null) {
    referenceFailure('OUTPUT_REFERENCE', 'MISSING_TARGET', `${input.label} does not exist: ${input.reference}`);
  }
  if (!authoritativeStat.isFile()) {
    referenceFailure('OUTPUT_REFERENCE', 'NOT_REGULAR_FILE', `${input.label} is not a regular file: ${input.reference}`);
  }

  const workspaceStat = await lstatReferenceTarget(workspaceTarget, input.label, input.reference);
  if (workspaceStat === null || !workspaceStat.isFile()) {
    referenceFailure(
      'HOST_INFRASTRUCTURE',
      'WORKSPACE_MATERIALIZATION_MISMATCH',
      `${input.label} is not materialized as a regular workspace file: ${input.reference}`,
    );
  }
}
