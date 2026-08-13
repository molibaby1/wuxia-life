import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { captureCatalogSnapshot } from '../../scripts/b1/catalogSnapshot';
import { validateB1EvidenceChain } from '../../scripts/b1/evidenceChain';
import { runB10 } from '../../scripts/b1/runB10';
import type { WeightOverlay } from '../../scripts/b1/types';

const persona = {
  id: 'b1-artifact-persona', name: 'Artifact Tester', gender: 'male' as const,
  seed: 17, strategy: 'balanced' as const, strategySummary: 'artifact probe',
  routePreference: 'none' as const, riskPreference: 'medium' as const,
  relationshipPreference: 'medium' as const, choiceTendency: 'balanced' as const,
  shortTermGoals: [],
};

async function main(): Promise<void> {
  const baseCatalog = {
    getAllEvents: () => [], getEventsByAge: () => [], getEventById: () => undefined,
    getWeightForAge: () => 0,
  };
  const overlay: WeightOverlay = {
    schemaVersion: 'b1-weight-overlay-v1',
    baseCatalogHash: captureCatalogSnapshot(baseCatalog).baseCatalogHash,
    patches: [],
  };
  const outRoot = '.tmp/b1-artifact-tests';
  const run = await runB10({ runId: `artifact-${Date.now()}`, outRoot, persona, seed: 17, endAge: 1, baseCatalog, overlay, maxSteps: 16 });
  assert.equal(run.terminalVerdict, 'awaiting_human');
  for (const path of ['manifest.json', 'base-catalog.json', 'overlay.json', 'evidence-index.json', 'run-summary.json',
    'raw-traces/baseline.json', 'raw-traces/candidate.json', 'player-visible-traces/baseline.json', 'player-visible-traces/candidate.json',
    'metrics/baseline.json', 'metrics/candidate.json']) assert.equal(existsSync(join(run.outDir, path)), true, path);
  const manifest = JSON.parse(readFileSync(join(run.outDir, 'manifest.json'), 'utf8'));
  const evidence = JSON.parse(readFileSync(join(run.outDir, 'evidence-index.json'), 'utf8'));
  assert.equal(evidence.chainOk, true);
  assert.equal(run.baseline.finalStateHash, run.candidate.finalStateHash, 'identical empty-overlay arms must have the same canonical final-state hash');
  assert.equal(validateB1EvidenceChain({ outDir: run.outDir, manifest }).chainOk, true);
  const changed = validateB1EvidenceChain({ outDir: run.outDir, manifest: { ...manifest, sourceFingerprint: { ...manifest.sourceFingerprint, head: 'changed' } }, expectedSourceFingerprint: manifest.sourceFingerprint });
  assert.equal(changed.chainOk, false);
  assert.match(changed.breakReasons.join('|'), /source fingerprint changed/);
  const originalEvidence = JSON.parse(readFileSync(join(run.outDir, 'evidence-index.json'), 'utf8'));
  const hashMismatch = validateB1EvidenceChain({ outDir: run.outDir, manifest, expectedArtifactHashes: originalEvidence.artifactHashes });
  assert.equal(hashMismatch.chainOk, true);
  const rawPath = join(run.outDir, 'raw-traces', 'baseline.json');
  const raw = readFileSync(rawPath, 'utf8');
  const { writeFileSync } = await import('node:fs');
  writeFileSync(rawPath, `${raw} `, 'utf8');
  const tampered = validateB1EvidenceChain({ outDir: run.outDir, manifest, expectedArtifactHashes: originalEvidence.artifactHashes });
  assert.equal(tampered.chainOk, false);
  assert.match(tampered.breakReasons.join('|'), /artifact hash mismatch/);
  await assert.rejects(() => runB10({ runId: run.runId, outRoot, persona, seed: 17, endAge: 1, baseCatalog, overlay, maxSteps: 16 }));
  console.log('b1ArtifactIsolation.test.ts: ok');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
