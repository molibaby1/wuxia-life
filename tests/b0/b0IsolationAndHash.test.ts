import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runB0Calibration } from '../../scripts/b0/runB0';
import { projectPlayerVisibleTrace } from '../../scripts/b0/trace/projectPlayerVisibleTrace';
import { synthesizeKnownBadTrace } from '../../scripts/b0/trace/synthesizeKnownBadTrace';
import { stableJsonHash } from '../../scripts/b0/hash';
import { loadSeedBundle } from '../../scripts/b0/roles/fixtureBuilder';

function main(): void {
  const a = runB0Calibration({
    outRoot: '.tmp/b0',
    runId: 'b0-repro-a',
    decision: 'accept',
  });
  const b = runB0Calibration({
    outRoot: '.tmp/b0',
    runId: 'b0-repro-b',
    decision: 'accept',
  });

  assert.equal(a.evidence.mechanicalAuditHash, b.evidence.mechanicalAuditHash);
  assert.equal(a.evidence.fixtureHash, b.evidence.fixtureHash);
  assert.equal(a.evidence.seedBundleHash, b.evidence.seedBundleHash);

  // Same recipe+seed → identical raw bytes
  const recipe = {
    schemaVersion: 'b0-known-bad-recipe-v1' as const,
    badId: 'repeat_short_window',
    mode: 'repeat_short_window' as const,
    personaId: 'p8-martial-lin',
    seed: 801,
  };
  const t1 = synthesizeKnownBadTrace('repeat_short_window', 'candidate', recipe);
  const t2 = synthesizeKnownBadTrace('repeat_short_window', 'candidate', recipe);
  assert.equal(stableJsonHash(t1), stableJsonHash(t2));

  const projected = projectPlayerVisibleTrace(t1);
  assert.equal(projected.ok, true);
  if (projected.ok) {
    const json = JSON.stringify(projected.visible);
    assert.equal(json.includes('directEffects'), false);
    assert.equal(json.includes('outcomeEffects'), false);
    assert.equal(json.includes('hiddenEffects'), false);
    assert.equal(json.includes('finalState'), false);
  }

  // Blind package must not include holdout seeds from seed bundle
  const seeds = loadSeedBundle();
  const holdout = new Set(seeds.layers.holdout.map(s => s.seed));
  const blind = JSON.parse(readFileSync(join(a.outDir, 'blind-review.json'), 'utf8')) as Array<{
    sampleKey: string;
  }>;
  const visibleDir = join(a.outDir, 'player-visible-traces');
  // controller-private labels must not appear in blind review
  const blindText = readFileSync(join(a.outDir, 'blind-review.json'), 'utf8');
  assert.equal(blindText.includes('expectedDetections'), false);
  assert.equal(blindText.includes('known-bad'), false);
  assert.ok(blind.length > 0);

  // Holdout seeds should not be the seed field of blind-reviewed samples' visible traces
  // (blind review only stores observations; check candidate visibles for non-holdout layers)
  const registry = JSON.parse(
    readFileSync(join(a.outDir, 'fixture-set', 'registry.json'), 'utf8'),
  ) as { samples: Array<{ id: string; layer: string }> };
  for (const sample of registry.samples) {
    if (sample.layer === 'holdout') continue;
    const visPath = join(visibleDir, `${sample.id}.candidate.json`);
    const vis = JSON.parse(readFileSync(visPath, 'utf8')) as { seed: number };
    // train/adversarial fixture seeds may coincide with holdout numbers only if recipe says so;
    // holdout_leak attack intentionally exposes 804 — that sample is adversarial, seed on recipe may differ.
    if (sample.id !== 'holdout_leak') {
      // no assertion that seed∉holdout for all — recipes use 801/808; holdout is 804/807
      assert.ok(!holdout.has(vis.seed) || sample.id === 'holdout_leak');
    }
  }

  // Evidence chain files exist and hashes stable
  const evidenceA = JSON.parse(readFileSync(join(a.outDir, 'evidence-index.json'), 'utf8'));
  assert.equal(evidenceA.chainOk, true);
  assert.equal(typeof a.evidence.manifestHash, 'string');
  assert.ok(a.evidence.manifestHash.length === 64);

  console.log('b0IsolationAndHash: PASS');
}

main();
