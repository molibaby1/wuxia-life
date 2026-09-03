import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildProblemPackage } from '../../scripts/evolution/problemAgnosticSolution/buildProblemPackage';
import { canonicalJson } from '../../scripts/evolution/phase0/provenance';

const hypothesis = {
  hypothesisId: 'hypothesis-000001',
  hypothesis: 'A fresh problem statement.',
  observedBasis: 'The player-visible basis.',
  feedbackRefs: ['observations[0]'],
  evidenceRefs: ['entry-000001'],
  unknowns: ['What happens next?'],
  productSignificance: 'It matters to the product.',
};

async function writeSelection(root: string, selected = hypothesis): Promise<string> {
  const path = join(root, 'selection.json');
  await writeFile(path, canonicalJson({
    schemaVersion: 'fresh-problem-hypothesis-selection-v1',
    rule: 'first_hypothesis_in_participant_order',
    sourceHypothesesSha256: 'b'.repeat(64),
    hypothesisCount: 1,
    selectedIndex: 0,
    selectedHypothesisId: selected.hypothesisId,
    selectedHypothesis: selected,
  }));
  return path;
}

export async function runProblemPackageBuilderTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'problem-package-builder-'));
  const selectedHypothesisPath = await writeSelection(root);
  const destinationPath = join(root, 'experiment', 'problem-package.json');
  const packageValue = await buildProblemPackage({
    selectedHypothesisPath,
    runRef: 'cohort-run-000001',
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: 'feedback/feedback.json',
    improvementHypothesisRef: 'hypothesis/hypotheses.json',
    diagnosticEvidenceRefs: ['diagnostic/causal-attribution.json'],
    authorityRefs: ['docs/product/auto-evolution-model.md'],
    productSourceFingerprintSha256: 'a'.repeat(64),
    destinationPath,
  });
  assert.equal(packageValue.schemaVersion, 'problem-package-v2');
  assert.equal(packageValue.problemId, 'problem-hypothesis-000001');
  assert.equal(packageValue.problem.statement, hypothesis.hypothesis);
  assert.deepEqual(packageValue.problem.feedbackRefs, hypothesis.feedbackRefs);
  assert.deepEqual(packageValue.problem.evidenceRefs, hypothesis.evidenceRefs);
  assert.deepEqual(packageValue.problem.unknowns, hypothesis.unknowns);
  if (packageValue.schemaVersion === 'problem-package-v2') {
    assert.deepEqual(packageValue.source.diagnosticEvidenceRefs, ['diagnostic/causal-attribution.json']);
  }
  assert.equal(JSON.parse(await readFile(destinationPath, 'utf8')).problem.statement, hypothesis.hypothesis);

  await assert.rejects(
    () => buildProblemPackage({
      selectedHypothesisPath,
      runRef: 'cohort-run-000001',
      observablePayloadRef: 'source/observable-payload.json',
      externalFeedbackRef: 'feedback/feedback.json',
      improvementHypothesisRef: 'hypothesis/hypotheses.json',
      diagnosticEvidenceRefs: ['diagnostic/causal-attribution.json'],
      authorityRefs: ['docs/product/auto-evolution-model.md'],
      productSourceFingerprintSha256: 'a'.repeat(64),
      destinationPath,
    }),
    /already exists/i,
  );
  assert.equal(JSON.parse(await readFile(destinationPath, 'utf8')).problem.statement, hypothesis.hypothesis);

  const forbiddenRoot = await mkdtemp(join(tmpdir(), 'problem-package-builder-forbidden-'));
  const forbiddenSelection = await writeSelection(forbiddenRoot, {
    ...hypothesis,
    domain: 'must-not-enter-the-package',
  } as typeof hypothesis & { domain: string });
  await assert.rejects(
    () => buildProblemPackage({
      selectedHypothesisPath: forbiddenSelection,
      runRef: 'cohort-run-000001',
      observablePayloadRef: 'source/observable-payload.json',
      externalFeedbackRef: 'feedback/feedback.json',
      improvementHypothesisRef: 'hypothesis/hypotheses.json',
      diagnosticEvidenceRefs: ['diagnostic/causal-attribution.json'],
      authorityRefs: ['docs/product/auto-evolution-model.md'],
      productSourceFingerprintSha256: 'a'.repeat(64),
      destinationPath: join(forbiddenRoot, 'problem-package.json'),
    }),
    /reserved|domain|unknown field/i,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runProblemPackageBuilderTests()
    .then(() => console.log('problemPackageBuilder.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
