import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runB0Calibration } from '../../scripts/b0/runB0';
import { auditRawTrace } from '../../scripts/b0/roles/mechanicalAuditor';
import { synthesizeKnownBadTrace } from '../../scripts/b0/trace/synthesizeKnownBadTrace';
import { loadFixtureRegistry, loadKnownBadRecipe } from '../../scripts/b0/roles/fixtureBuilder';
import { validateProposedPaths } from '../../scripts/b0/patchScopeValidator';
import { productionVetoBlocks } from '../../scripts/b0/humanDecision';
import { auditRedTeam } from '../../scripts/b0/roles/redTeamAuditor';

function main(): void {
  const result = runB0Calibration({
    outRoot: '.tmp/b0',
    runId: 'b0-test-calibration',
    decision: 'accept',
    decisionReason: 'calibration matrix satisfied',
  });

  assert.equal(result.automatic.suggested, 'passed', result.automatic.reasons.join('; '));
  assert.equal(result.terminalVerdict, 'passed', `terminal=${result.terminalVerdict}`);
  assert.ok(existsSync(join(result.outDir, 'manifest.json')));
  assert.ok(existsSync(join(result.outDir, 'evidence-index.json')));
  assert.ok(existsSync(join(result.outDir, 'human-decision.json')));

  const registry = loadFixtureRegistry();
  for (const sample of registry.samples.filter(s => s.kind === 'known-bad')) {
    const recipe = loadKnownBadRecipe(sample.recipePath);
    const raw = synthesizeKnownBadTrace(sample.id, 'candidate', recipe);
    const audit = auditRawTrace(raw);
    for (const code of sample.expectedDetections ?? []) {
      assert.ok(
        audit.detections.some(d => d.code === code),
        `${sample.id} missing detection ${code}: ${JSON.stringify(audit.detections)}`,
      );
    }
  }

  const controlRecipe = loadKnownBadRecipe('control/control_healthy.recipe.json');
  const controlRaw = synthesizeKnownBadTrace('control_healthy', 'candidate', controlRecipe);
  const controlAudit = auditRawTrace(controlRaw);
  assert.equal(controlAudit.hardKill, false, `control hard-killed: ${JSON.stringify(controlAudit)}`);

  // Production candidate with out-of-scope patch must be veto-blocked
  const red = auditRedTeam({
    proposedPathsBySample: { evil: ['src/data/events.json'] },
    visibleTraces: [],
    seedsExposedToBlind: [],
    holdoutSeeds: [804],
    foreignReviewPayloads: [],
    projectionFailures: [],
  });
  assert.equal(productionVetoBlocks(red), true);
  assert.equal(validateProposedPaths(['src/data/events.json']).ok, false);

  console.log('b0GuardrailCalibration: PASS');
  console.log(`  outDir=${result.outDir}`);
  console.log(`  automatic=${result.automatic.suggested}`);
}

main();
