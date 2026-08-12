import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { runB0Calibration } from '../../scripts/b0/runB0';
import { auditRawTrace } from '../../scripts/b0/roles/mechanicalAuditor';
import { synthesizeKnownBadTrace } from '../../scripts/b0/trace/synthesizeKnownBadTrace';
import { loadFixtureRegistry, loadKnownBadRecipe } from '../../scripts/b0/roles/fixtureBuilder';
import { validateProposedPaths } from '../../scripts/b0/patchScopeValidator';
import { productionVetoBlocks, applyHumanDecision } from '../../scripts/b0/humanDecision';
import { auditRedTeam } from '../../scripts/b0/roles/redTeamAuditor';

async function main(): Promise<void> {
  const runId = `b0-test-calibration-${Date.now()}-${randomBytes(2).toString('hex')}`;
  const result = await runB0Calibration({
    outRoot: '.tmp/b0',
    runId,
  });

  assert.equal(result.automatic.suggested, 'passed', result.automatic.reasons.join('; '));
  assert.equal(result.terminalVerdict, 'awaiting_human', `terminal=${result.terminalVerdict}`);
  assert.equal(result.state, 'awaiting_human');
  assert.ok(existsSync(join(result.outDir, 'manifest.json')));
  assert.ok(existsSync(join(result.outDir, 'evidence-index.json')));
  assert.ok(existsSync(join(result.outDir, 'automatic-suggestion.json')));
  assert.ok(existsSync(join(result.outDir, 'real-control-summary.json')));
  assert.ok(existsSync(join(result.outDir, 'blind-package.json')));
  assert.equal(existsSync(join(result.outDir, 'human-decision.json')), false);

  const evidence = JSON.parse(readFileSync(join(result.outDir, 'evidence-index.json'), 'utf8'));
  assert.equal(evidence.chainOk, true);
  assert.equal(typeof evidence.realControlSummaryHash, 'string');
  assert.equal(typeof evidence.automaticVerdictHash, 'string');
  assert.equal(evidence.humanDecisionHash, null);

  const registry = loadFixtureRegistry();
  assert.ok(registry.samples.some(s => s.layer === 'holdout'), 'registry must include holdout');

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

  const refused = applyHumanDecision('accept', { suggested: 'failed', reasons: ['x'] }, 'forge');
  assert.equal(refused.decision, 'reject');

  // Source mismatch must hard-block (unique runId, wrong HEAD).
  const blocked = await runB0Calibration({
    outRoot: '.tmp/b0',
    runId: `b0-test-freeze-block-${Date.now()}-${randomBytes(2).toString('hex')}`,
    fingerprintLiveHeadSha: '0'.repeat(40),
  });
  assert.equal(blocked.terminalVerdict, 'blocked');
  assert.ok(blocked.automatic.reasons.some(r => r.includes('source freeze')));

  console.log('b0GuardrailCalibration: PASS');
  console.log(`  outDir=${result.outDir}`);
  console.log(`  automatic=${result.automatic.suggested}`);
  console.log(`  terminal=${result.terminalVerdict}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
