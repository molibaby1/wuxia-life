import { lstat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

export interface RepoReferenceLocator {
  reference: string;
  path: string;
  lineStart?: number;
  lineEnd?: number;
}

const VALID_LOCATOR = /^(.+):([1-9]\d*)(?:-([1-9]\d*))?$/;
const MALFORMED_LOCATOR = /^(.+):(\d+)(?:-(\d*))?$/;

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
