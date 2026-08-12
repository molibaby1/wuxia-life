import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { runRealControlCheck } from '../../scripts/b0/roles/realControlRunner';
import { runB0Calibration } from '../../scripts/b0/runB0';
import { synthesizeKnownBadTrace } from '../../scripts/b0/trace/synthesizeKnownBadTrace';
import { auditRawTrace } from '../../scripts/b0/roles/mechanicalAuditor';

async function main(): Promise<void> {
  const opaque = synthesizeKnownBadTrace('opaque_negative', 'candidate', {
    schemaVersion: 'b0-known-bad-recipe-v1',
    badId: 'opaque_negative',
    mode: 'opaque_negative',
    personaId: 'p8-martial-lin',
    seed: 801,
  });
  const opaqueAudit = auditRawTrace(opaque, 'fixture');
  assert.ok(
    opaqueAudit.detections.some(d => d.code === 'opaque_negative'),
    'fixture opaque_negative must remain detectable',
  );

  const standalone = await runRealControlCheck({
    outRoot: '.tmp/b0',
    runId: `b0-test-real-control-${Date.now()}-${randomBytes(2).toString('hex')}`,
  });

  assert.equal(standalone.cases.length, 2, 'expected two real control personas');
  assert.equal(standalone.passed, true, standalone.failures.join('; '));
  assert.equal(standalone.summary.softDiagnosticsDoNotHardKill, true);

  for (const c of standalone.cases) {
    assert.equal(c.projectionOk, true, `${c.personaId} visible projection failed`);
    assert.equal(c.audit.hardKill, false, `${c.personaId} hard-killed: ${JSON.stringify(c.audit)}`);
    assert.ok(c.recordCount > 0);
    assert.ok(c.traceStepCount > 0);
    assert.ok(existsSync(join(standalone.outDir, 'raw-traces', `real_control_${c.personaId}.json`)));
    assert.ok(
      existsSync(
        join(standalone.outDir, 'player-visible-traces', `real_control_${c.personaId}.json`),
      ),
    );

    const visible = JSON.parse(
      readFileSync(
        join(standalone.outDir, 'player-visible-traces', `real_control_${c.personaId}.json`),
        'utf8',
      ),
    );
    const text = JSON.stringify(visible);
    assert.equal(text.includes('directEffects'), false);
    assert.equal(text.includes('outcomeEffects'), false);
    assert.equal(text.includes('hiddenEffects'), false);
    assert.equal(text.includes('"finalState"'), false);
    assert.equal(text.includes('"sampleId"'), false);
    assert.equal(text.includes('"personaId"'), false);
  }

  // Main B0 path must consume real control into verdict + evidence hash.
  const main = await runB0Calibration({
    outRoot: '.tmp/b0',
    runId: `b0-test-main-real-control-${Date.now()}-${randomBytes(2).toString('hex')}`,
  });
  assert.equal(main.terminalVerdict, 'awaiting_human');
  assert.equal(main.automatic.suggested, 'passed', main.automatic.reasons.join('; '));
  assert.ok(existsSync(join(main.outDir, 'real-control-summary.json')));
  assert.equal(typeof main.evidence.realControlSummaryHash, 'string');
  assert.ok(main.evidence.realControlSummaryHash && main.evidence.realControlSummaryHash.length === 64);
  assert.ok(
    main.automatic.reasons.some(r => r.includes('real control')) ||
      main.automatic.reasons.some(r => r.includes('synthetic+real control')),
  );

  const softOpaque = standalone.cases.flatMap(c =>
    c.audit.detections.filter(d => d.code === 'opaque_negative' && d.severity === 'soft'),
  );
  if (softOpaque.length > 0) {
    console.log(`  soft opaque diagnostics: ${softOpaque.length} (not hard-kill)`);
  }

  console.log('b0RealControlHeadless: PASS');
  console.log(`  standaloneOutDir=${standalone.outDir}`);
  console.log(`  mainOutDir=${main.outDir}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
