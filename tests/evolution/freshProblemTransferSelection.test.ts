import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { selectFirstHypothesis } from '../../scripts/evolution/freshProblemTransfer/selectFirstHypothesis';

function draft(label: string) {
  return {
    hypothesis: `问题 ${label}`,
    observedBasis: `依据 ${label}`,
    feedbackRefs: ['observations[0]'],
    evidenceRefs: [],
    unknowns: [`未知 ${label}`],
    productSignificance: `意义 ${label}`,
  };
}

async function writeSet(root: string, value: unknown): Promise<string> {
  const path = join(root, 'hypotheses.json');
  await writeFile(path, JSON.stringify(value));
  return path;
}

export async function runFreshProblemTransferSelectionTests(): Promise<void> {
  // 0 -> no selection and no artifact.
  {
    const root = await mkdtemp(join(tmpdir(), 'fresh-problem-selection-'));
    const source = await writeSet(root, { hypotheses: [] });
    const result = await selectFirstHypothesis({
      sourceHypothesesPath: source,
      destinationPath: join(root, 'selection', 'selected-hypothesis.json'),
    });
    assert.equal(result, undefined);
  }

  // 1 and N -> always index 0, with a traceable source and selected hash.
  for (const hypotheses of [[draft('one')], [draft('first'), draft('second')]]) {
    const root = await mkdtemp(join(tmpdir(), 'fresh-problem-selection-'));
    const source = await writeSet(root, { hypotheses });
    const destination = join(root, 'selection', 'selected-hypothesis.json');
    const result = await selectFirstHypothesis({ sourceHypothesesPath: source, destinationPath: destination });
    assert.equal(result?.selectedIndex, 0);
    assert.equal(result?.selectedHypothesisId, 'hypothesis-000001');
    assert.equal(result?.hypothesisCount, hypotheses.length);
    const artifact = JSON.parse(await readFile(destination, 'utf8'));
    assert.equal(artifact.rule, 'first_hypothesis_in_participant_order');
    assert.equal(artifact.selectedIndex, 0);
    assert.equal('score' in artifact, false);
    assert.equal('ranking' in artifact, false);
  }

  // The real runner stores the normalized set with generated hypothesis IDs.
  {
    const root = await mkdtemp(join(tmpdir(), 'fresh-problem-selection-'));
    const source = await writeSet(root, {
      schemaVersion: 'improvement-hypothesis-set-v2',
      hypotheses: [
        { hypothesisId: 'hypothesis-000001', ...draft('stored') },
      ],
      noProblemAssessment: null,
    });
    const result = await selectFirstHypothesis({
      sourceHypothesesPath: source,
      destinationPath: join(root, 'selection', 'selected-hypothesis.json'),
    });
    assert.equal(result?.selectedHypothesisId, 'hypothesis-000001');
    assert.equal(result?.selectedHypothesis?.hypothesis, '问题 stored');
  }

  // Changing participant order changes the selected hypothesis, not the rule.
  {
    const root = await mkdtemp(join(tmpdir(), 'fresh-problem-selection-'));
    const source = await writeSet(root, { hypotheses: [draft('A'), draft('B')] });
    const result = await selectFirstHypothesis({
      sourceHypothesesPath: source,
      destinationPath: join(root, 'selection', 'selected-hypothesis.json'),
    });
    assert.equal(result?.selectedHypothesis?.hypothesis, '问题 A');
  }

  // The whole set must validate; do not skip an invalid item to reach a later one.
  {
    const root = await mkdtemp(join(tmpdir(), 'fresh-problem-selection-'));
    const source = await writeSet(root, { hypotheses: [{ ...draft('bad'), extra: true }, draft('good')] });
    await assert.rejects(
      () => selectFirstHypothesis({
        sourceHypothesesPath: source,
        destinationPath: join(root, 'selection', 'selected-hypothesis.json'),
      }),
      /unknown field|hypotheses/i,
    );
    assert.equal(await pathExists(join(root, 'selection', 'selected-hypothesis.json')), false);
  }

  // Existing destination is create-only and must not be overwritten.
  {
    const root = await mkdtemp(join(tmpdir(), 'fresh-problem-selection-'));
    const source = await writeSet(root, { hypotheses: [draft('one')] });
    const destination = join(root, 'selection', 'selected-hypothesis.json');
    await mkdir(join(root, 'selection'), { recursive: true });
    await writeFile(destination, 'existing');
    await assert.rejects(
      () => selectFirstHypothesis({ sourceHypothesesPath: source, destinationPath: destination }),
      /already exists/i,
    );
    assert.equal(await readFile(destination, 'utf8'), 'existing');
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== 'ENOENT';
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFreshProblemTransferSelectionTests()
    .then(() => console.log('freshProblemTransferSelection.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
