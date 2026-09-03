import { lstat, mkdir, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { validatePhase0RunRef } from '../phase0/provenance';

const SESSION_ID_PATTERN = /^ordinary-run-(\d{8})-(\d{6})$/;

export function formatOrdinarySessionId(dateYyyymmdd: string, sequence: number): string {
  if (!/^\d{8}$/.test(dateYyyymmdd)) {
    throw new Error(`session date must be YYYYMMDD: ${dateYyyymmdd}`);
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999999) {
    throw new Error(`session sequence must be 1..999999: ${sequence}`);
  }
  return validatePhase0RunRef(`ordinary-run-${dateYyyymmdd}-${String(sequence).padStart(6, '0')}`);
}

export function localDateYyyymmdd(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
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

/**
 * Allocate the next ordinary-run-YYYYMMDD-NNNNNN that does not already exist
 * under .tmp/evolution/. Does not consult previous-run Participant state.
 */
export async function allocateOrdinarySessionId(input: {
  repositoryRoot: string;
  now?: Date;
}): Promise<string> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const date = localDateYyyymmdd(input.now);
  const evolutionRoot = join(repositoryRoot, '.tmp/evolution');
  await mkdir(evolutionRoot, { recursive: true });

  let maxExisting = 0;
  for (const entry of await readdir(evolutionRoot, { withFileTypes: true })) {
    const match = SESSION_ID_PATTERN.exec(entry.name);
    if (!match || match[1] !== date) continue;
    maxExisting = Math.max(maxExisting, Number(match[2]));
  }

  for (let sequence = maxExisting + 1; sequence <= 999999; sequence += 1) {
    const sessionId = formatOrdinarySessionId(date, sequence);
    const sessionRoot = join(evolutionRoot, sessionId);
    if (await pathExists(sessionRoot)) continue;
    return sessionId;
  }
  throw new Error(`unable to allocate ordinary session id for ${date}`);
}
