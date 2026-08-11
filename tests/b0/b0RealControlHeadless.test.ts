import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runRealControlCheck } from '../../scripts/b0/roles/realControlRunner';
import { synthesizeKnownBadTrace } from '../../scripts/b0/trace/synthesizeKnownBadTrace';
import { auditRawTrace } from '../../scripts/b0/roles/mechanicalAuditor';

async function main(): Promise<void> {
  // Fixture opaque_negative must still hard-kill under fixture profile
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

  const result = await runRealControlCheck({
    outRoot: '.tmp/b0',
    runId: 'b0-test-real-control',
  });

  assert.equal(result.cases.length, 2, 'expected two real control personas');
  assert.equal(result.passed, true, result.failures.join('; '));

  for (const c of result.cases) {
    assert.equal(c.projectionOk, true, `${c.personaId} visible projection failed`);
    assert.equal(c.audit.hardKill, false, `${c.personaId} hard-killed: ${JSON.stringify(c.audit)}`);
    assert.ok(c.recordCount > 0);
    assert.ok(c.traceStepCount > 0);
    assert.ok(existsSync(join(result.outDir, 'raw-traces', `real_control_${c.personaId}.json`)));
    assert.ok(
      existsSync(join(result.outDir, 'player-visible-traces', `real_control_${c.personaId}.json`)),
    );

    const visible = JSON.parse(
      readFileSync(
        join(result.outDir, 'player-visible-traces', `real_control_${c.personaId}.json`),
        'utf8',
      ),
    );
    const text = JSON.stringify(visible);
    assert.equal(text.includes('directEffects'), false);
    assert.equal(text.includes('outcomeEffects'), false);
    assert.equal(text.includes('hiddenEffects'), false);
    assert.equal(text.includes('"finalState"'), false);
  }

  // Soft diagnostics may exist; they must not hard-kill Control.
  const softOpaque = result.cases.flatMap(c =>
    c.audit.detections.filter(d => d.code === 'opaque_negative' && d.severity === 'soft'),
  );
  if (softOpaque.length > 0) {
    console.log(`  soft opaque diagnostics: ${softOpaque.length} (not hard-kill)`);
  }

  console.log('b0RealControlHeadless: PASS');
  console.log(`  outDir=${result.outDir}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
