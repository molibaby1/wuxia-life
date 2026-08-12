import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { runB0Calibration } from '../../scripts/b0/runB0';
import { projectPlayerVisibleTrace } from '../../scripts/b0/trace/projectPlayerVisibleTrace';
import { synthesizeKnownBadTrace } from '../../scripts/b0/trace/synthesizeKnownBadTrace';
import { stableJsonHash } from '../../scripts/b0/hash';
import { loadFixtureRegistry, loadSeedBundle } from '../../scripts/b0/roles/fixtureBuilder';

async function main(): Promise<void> {
  const suffix = `${Date.now()}-${randomBytes(2).toString('hex')}`;
  const a = await runB0Calibration({
    outRoot: '.tmp/b0',
    runId: `b0-repro-a-${suffix}`,
  });
  const b = await runB0Calibration({
    outRoot: '.tmp/b0',
    runId: `b0-repro-b-${suffix}`,
  });

  assert.equal(a.terminalVerdict, 'awaiting_human');
  assert.equal(b.terminalVerdict, 'awaiting_human');
  assert.equal(a.evidence.mechanicalAuditHash, b.evidence.mechanicalAuditHash);
  assert.equal(a.evidence.fixtureHash, b.evidence.fixtureHash);
  assert.equal(a.evidence.seedBundleHash, b.evidence.seedBundleHash);

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
    assert.equal(json.includes('"sampleId"'), false);
    assert.equal(json.includes('"personaId"'), false);
    assert.equal(json.includes('"seed"'), false);
    assert.equal(json.includes('"arm"'), false);
  }

  const registry = loadFixtureRegistry();
  const holdoutIds = registry.samples.filter(s => s.layer === 'holdout').map(s => s.id);
  assert.ok(holdoutIds.length >= 1, 'must have real holdout samples');

  const blindPackage = JSON.parse(
    readFileSync(join(a.outDir, 'blind-package.json'), 'utf8'),
  ) as { pairs: Array<{ pairKey: string; arms: unknown[] }> };
  const blindText = JSON.stringify(blindPackage);
  assert.equal(blindText.includes('"sampleId"'), false);
  assert.equal(blindText.includes('"personaId"'), false);
  assert.equal(blindText.includes('"seed"'), false);
  assert.equal(blindText.includes('"arm"'), false);
  assert.equal(blindText.includes('expectedDetections'), false);
  assert.equal(blindText.includes('knownBadLabel'), false);
  assert.equal(blindText.includes('hardKill'), false);
  assert.equal(blindText.includes('mechanicalVerdict'), false);
  assert.equal(blindText.includes('raw-traces'), false);
  for (const id of holdoutIds) {
    assert.equal(blindText.includes(id), false, `holdout sample ${id} must not enter blind package`);
  }
  for (const sample of registry.samples) {
    assert.equal(
      blindText.includes(`"${sample.id}"`),
      false,
      `blind must not contain sample id ${sample.id}`,
    );
  }
  assert.ok(blindPackage.pairs.length > 0);
  for (const pair of blindPackage.pairs) {
    assert.equal(pair.arms.length, 2, 'each blind pair must be true A/B');
  }

  const abMap = JSON.parse(
    readFileSync(join(a.outDir, 'controller-private', 'abMap.json'), 'utf8'),
  ) as Record<string, { sampleId: string }>;
  assert.ok(Object.keys(abMap).length > 0);
  // Mapping stays private: blind review output has only pairKey.
  const blindReview = JSON.parse(readFileSync(join(a.outDir, 'blind-review.json'), 'utf8')) as Array<{
    pairKey: string;
  }>;
  const reviewText = JSON.stringify(blindReview);
  for (const sample of registry.samples) {
    assert.equal(reviewText.includes(sample.id), false);
  }

  const seeds = loadSeedBundle();
  assert.ok(seeds.layers.holdout.length >= 1);

  const mechanical = JSON.parse(
    readFileSync(join(a.outDir, 'mechanical-audit.json'), 'utf8'),
  ) as Array<{ sampleId: string; detections: Array<{ code: string }> }>;
  for (const id of holdoutIds) {
    const audit = mechanical.find(m => m.sampleId === id);
    assert.ok(audit, `holdout ${id} must be mechanically audited`);
    assert.ok(audit.detections.length > 0, `holdout ${id} must have detections`);
  }

  const evidenceA = JSON.parse(readFileSync(join(a.outDir, 'evidence-index.json'), 'utf8'));
  assert.equal(evidenceA.chainOk, true);
  assert.equal(typeof a.evidence.manifestHash, 'string');
  assert.ok(a.evidence.manifestHash.length === 64);
  assert.equal(typeof evidenceA.realControlSummaryHash, 'string');
  assert.equal(typeof evidenceA.automaticVerdictHash, 'string');
  assert.equal(evidenceA.humanDecisionHash, null);

  console.log('b0IsolationAndHash: PASS');
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
