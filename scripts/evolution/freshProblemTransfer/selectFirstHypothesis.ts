import { open, lstat, mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseStoredImprovementHypothesisSet, type ImprovementHypothesis } from '../../../src/evolution/improvementHypothesisContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';

export interface FirstHypothesisSelection {
  schemaVersion: 'fresh-problem-hypothesis-selection-v1';
  rule: 'first_hypothesis_in_participant_order';
  sourceHypothesesSha256: string;
  hypothesisCount: number;
  selectedIndex: 0;
  selectedHypothesisId: string;
  selectedHypothesisSha256: string;
  selectedHypothesis: ImprovementHypothesis;
}

export interface SelectFirstHypothesisOptions {
  sourceHypothesesPath: string;
  destinationPath: string;
}

async function assertAbsent(path: string): Promise<void> {
  try {
    await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  throw new Error(`selection artifact already exists: ${path}`);
}

async function writeCreateOnly(path: string, bytes: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(bytes);
  } finally {
    await handle.close();
  }
}

export async function selectFirstHypothesis(
  options: SelectFirstHypothesisOptions,
): Promise<FirstHypothesisSelection | undefined> {
  const sourceBytes = await readFile(options.sourceHypothesesPath, 'utf8');
  const set = parseStoredImprovementHypothesisSet(sourceBytes);
  if (set.hypotheses.length === 0) return undefined;
  await assertAbsent(options.destinationPath);

  const selectedHypothesis = set.hypotheses[0];
  const artifact: FirstHypothesisSelection = {
    schemaVersion: 'fresh-problem-hypothesis-selection-v1',
    rule: 'first_hypothesis_in_participant_order',
    sourceHypothesesSha256: sha256Hex(sourceBytes),
    hypothesisCount: set.hypotheses.length,
    selectedIndex: 0,
    selectedHypothesisId: selectedHypothesis.hypothesisId,
    selectedHypothesisSha256: sha256Hex(canonicalJson(selectedHypothesis)),
    selectedHypothesis,
  };
  await writeCreateOnly(options.destinationPath, `${canonicalJson(artifact)}\n`);
  return artifact;
}
