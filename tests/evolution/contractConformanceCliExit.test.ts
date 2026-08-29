import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runContractConformanceCli } from '../../scripts/evolution/contractConformance/cli';
import {
  EXACT_CONFORMANCE_PAYLOAD,
  type ConformanceTrialEvidenceV1,
  type TrialClassification,
} from '../../scripts/evolution/contractConformance/contractConformanceExperiment';

function trialFixture(
  trialId: string,
  classification: TrialClassification,
): ConformanceTrialEvidenceV1 {
  return {
    schemaVersion: 'contract-conformance-trial-v1',
    trialId,
    bindingLabel: 'Codex current binding',
    requestedBinding: 'fixture',
    resolvedModelObservation: 'fixture',
    startedAt: '2026-08-29T00:00:00.000Z',
    elapsedMs: 1,
    classification,
    terminalPayloadRef: `trials/${trialId}/terminal-payload.txt`,
    notes: ['synthetic fixture for CLI exit semantics'],
  };
}

async function writeTrialFixture(
  evidenceRoot: string,
  trial: ConformanceTrialEvidenceV1,
): Promise<void> {
  const dir = join(evidenceRoot, 'trials', trial.trialId);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'trial.json'), `${JSON.stringify(trial, null, 2)}\n`);
  await writeFile(
    join(dir, 'terminal-payload.txt'),
    trial.classification === 'PASS'
      ? `${JSON.stringify(EXACT_CONFORMANCE_PAYLOAD)}\n`
      : 'not-valid-json\n',
  );
}

export async function runContractConformanceCliExitTests(): Promise<void> {
  const stage = await readFile('docs/governance/current-product-stage.md', 'utf8');
  const q10 = stage.match(/10\. Structured Final Output Contract V1 Minimal Slice？→[^\n]+/);
  assert.ok(q10, 'FAQ Q10 must exist');
  assert.match(q10[0], /CONTRACT_CONFORMANCE_PROMISING/);
  assert.match(q10[0], /PROMISING_WITH_CAVEATS/);
  assert.doesNotMatch(q10[0], /RUNTIME CONFORMANCE UNVERIFIED/);
  assert.match(q10[0], /full P3 DEFERRED/);
  assert.match(q10[0], /CURSOR_MODEL_BINDING_NOT_OBSERVABLE/);
  assert.match(stage, /FULL CONSOLIDATION: DEFERRED/);

  const evidenceRoot = await mkdtemp(join(tmpdir(), 'conformance-cli-exit-'));
  try {
    await writeTrialFixture(evidenceRoot, trialFixture('pass-01', 'PASS'));
    const passCode = await runContractConformanceCli([
      'matrix-verdict',
      '--evidence-root',
      evidenceRoot,
      '--verdict',
      'CONTRACT_CONFORMANCE_PROMISING',
      '--rationale',
      'fixture all-pass',
    ]);
    assert.equal(passCode, 0, 'all-PASS matrix-verdict must exit 0');
    const passMatrix = JSON.parse(
      await readFile(join(evidenceRoot, 'matrix.json'), 'utf8'),
    ) as { trials: ConformanceTrialEvidenceV1[] };
    assert.equal(passMatrix.trials.length, 1);
    assert.equal(passMatrix.trials[0]?.classification, 'PASS');

    const nonPassClasses: TrialClassification[] = [
      'ENVELOPE_FAILURE',
      'ROLE_SCHEMA_FAILURE',
      'RUNTIME_FAILURE',
      'TIMEOUT',
    ];

    for (const classification of nonPassClasses) {
      const root = await mkdtemp(join(tmpdir(), `conformance-cli-${classification}-`));
      try {
        await writeTrialFixture(root, trialFixture('pass-keep', 'PASS'));
        await writeTrialFixture(root, trialFixture(`fail-${classification}`, classification));
        const code = await runContractConformanceCli([
          'matrix-verdict',
          '--evidence-root',
          root,
          '--verdict',
          'CONTRACT_CONFORMANCE_UNSTABLE',
          '--rationale',
          `fixture includes ${classification}`,
        ]);
        assert.equal(
          code,
          1,
          `matrix-verdict with ${classification} must exit non-zero after writing artifacts`,
        );
        const matrixRaw = await readFile(join(root, 'matrix.json'), 'utf8');
        const matrix = JSON.parse(matrixRaw) as {
          trials: ConformanceTrialEvidenceV1[];
          verdict: string;
        };
        assert.equal(matrix.trials.length, 2);
        assert.ok(
          matrix.trials.some(trial => trial.classification === classification),
          `matrix.json must preserve ${classification} trial`,
        );
        assert.equal(matrix.verdict, 'CONTRACT_CONFORMANCE_UNSTABLE');
        const failTrial = JSON.parse(
          await readFile(join(root, 'trials', `fail-${classification}`, 'trial.json'), 'utf8'),
        ) as ConformanceTrialEvidenceV1;
        assert.equal(failTrial.classification, classification);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  } finally {
    await rm(evidenceRoot, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runContractConformanceCliExitTests()
    .then(() => console.log('contractConformanceCliExit.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
