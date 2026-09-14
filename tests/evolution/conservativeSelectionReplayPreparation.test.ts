import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareConservativeSelectionReplay } from '../../scripts/evolution/conservativeSelectionReplay/prepareConservativeSelectionReplay';
import {
  buildConservativeSelectionProjection,
  validateConservativeSelectionProjection,
} from '../../scripts/evolution/conservativeSelectionReplay/conservativeSelectionContracts';
import type { SelectionPriorityReplayPresentation } from '../../scripts/evolution/selectionPriorityReplay/selectionPriorityReplay';

export async function runConservativeSelectionReplayPreparationTests(): Promise<void> {
  const outputRoot = join(await mkdtemp(join(tmpdir(), 'conservative-selection-preparation-')), 'experiment');
  const prepared = await prepareConservativeSelectionReplay({
    repoRoot: process.cwd(),
    sourceRoot: join(process.cwd(), 'artifacts/ae-selection-priority-replay-v1-20260911'),
    outputRoot,
  });
  assert.equal(prepared.experiment.jobCount, 24);
  assert.equal(prepared.experiment.model, 'deepseek-v4-flash');
  assert.equal(prepared.experiment.ordinarySessionsExecuted, false);
  assert.equal(prepared.experiment.participantInvocationsExecuted, false);
  assert.equal(prepared.experiment.productionSelectionModified, false);
  assert.deepEqual(
    [...new Set(prepared.experiment.jobs.map(job => job.caseId))].sort(),
    [
      'ordinary-run-20260910-000005',
      'ordinary-run-20260910-000006',
      'ordinary-run-20260910-000007',
      'ordinary-run-20260911-000002',
    ],
  );
  for (const caseId of new Set(prepared.experiment.jobs.map(job => job.caseId))) {
    for (const presentationId of ['original', 'reversed']) {
      assert.deepEqual(
        prepared.experiment.jobs
          .filter(job => job.caseId === caseId && job.presentationId === presentationId)
          .map(job => job.sampleOrdinal),
        [1, 2, 3],
      );
    }
  }
  await assert.rejects(
    () => prepareConservativeSelectionReplay({
      repoRoot: process.cwd(),
      sourceRoot: join(process.cwd(), 'artifacts/ae-selection-priority-replay-v1-20260911'),
      outputRoot,
    }),
    /already exists/i,
  );

  const sourceRoot = join(process.cwd(), 'artifacts/ae-selection-priority-replay-v1-20260911');
  const tamperedRoot = join(await mkdtemp(join(tmpdir(), 'conservative-selection-source-')), 'source');
  await cp(sourceRoot, tamperedRoot, { recursive: true });
  const tamperedCorpusPath = join(tamperedRoot, 'corpus.json');
  await writeFile(tamperedCorpusPath, `${await readFile(tamperedCorpusPath, 'utf8')} `);
  await assert.rejects(
    () => prepareConservativeSelectionReplay({ repoRoot: process.cwd(), sourceRoot: tamperedRoot, outputRoot: join(tamperedRoot, 'output') }),
    /corpus SHA-256/i,
  );

  const tamperedPresentationRoot = join(await mkdtemp(join(tmpdir(), 'conservative-selection-presentation-')), 'source');
  await cp(sourceRoot, tamperedPresentationRoot, { recursive: true });
  const tamperedPresentationPath = join(tamperedPresentationRoot, 'ordinary-run-20260910-000005', 'presentations', 'original.json');
  const tamperedPresentation = JSON.parse(await readFile(tamperedPresentationPath, 'utf8')) as Record<string, unknown>;
  const tamperedCandidates = tamperedPresentation.candidates as Array<Record<string, unknown>>;
  tamperedCandidates[0].hypothesis = '篡改语义';
  await writeFile(tamperedPresentationPath, JSON.stringify(tamperedPresentation));
  await assert.rejects(
    () => prepareConservativeSelectionReplay({ repoRoot: process.cwd(), sourceRoot: tamperedPresentationRoot, outputRoot: join(tamperedPresentationRoot, 'output') }),
    /presentation hash|semantic/i,
  );

  const frozenPresentation = JSON.parse(await readFile(join(sourceRoot, 'ordinary-run-20260910-000005', 'presentations', 'original.json'), 'utf8')) as SelectionPriorityReplayPresentation;
  const projection = buildConservativeSelectionProjection(frozenPresentation);
  assert.throws(() => validateConservativeSelectionProjection(frozenPresentation, projection.input, {
    ...projection.mapping,
    candidates: projection.mapping.candidates.map(item => ({ ...item, sourceIndex: item.isBaseline ? 1 : item.sourceIndex })),
  }), /source identity|sourceIndex|baseline/i);
  assert.throws(() => validateConservativeSelectionProjection(frozenPresentation, projection.input, {
    ...projection.mapping,
    candidates: projection.mapping.candidates.map(item => ({ ...item, isBaseline: false })),
  }), /exactly one|baseline/i);
  assert.throws(() => validateConservativeSelectionProjection(frozenPresentation, {
    ...projection.input,
    candidates: projection.input.candidates.map((item, index) => index === 0 ? { ...item, sourceIndex: 0 } : item),
  }, projection.mapping), /semantic|sourceIndex|blindInputSha256/i);
  assert.throws(() => validateConservativeSelectionProjection(frozenPresentation, {
    ...projection.input,
    baselineCandidateRef: 'candidate-Z',
  }, projection.mapping), /baselineCandidateRef|blindInputSha256/i);
}

runConservativeSelectionReplayPreparationTests().then(
  () => console.log('conservativeSelectionReplayPreparation.test.ts: ok'),
  error => {
    console.error(error);
    process.exitCode = 1;
  },
);
