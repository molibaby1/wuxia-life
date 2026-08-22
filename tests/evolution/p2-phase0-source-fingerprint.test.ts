import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getP8PersonaById } from '../../src/p8/personas';
import { runPhase0 } from '../../scripts/evolution/phase0/runPhase0';
import { validatePhase0RunSeal } from '../../scripts/evolution/phase0/provenance';

async function main(): Promise<void> {
  const persona = getP8PersonaById('p8-martial-lin');
  assert.ok(persona);
  const root = await mkdtemp(join(tmpdir(), 'p2-phase0-fingerprint-'));
  const result = await runPhase0({
    runRef: 'p2-source-fingerprint-000001',
    outRoot: join(root, 'game-runs'),
    anchorRoot: join(root, 'run-anchors'),
    persona,
    seed: 801,
    endAge: 0,
    catalogVersion: '1.0.0',
    maxSteps: 20,
    sourceFingerprint: {
      schemaVersion: 'phase0-source-fingerprint-v1',
      headSha: 'isolated-evolution-workspace',
      branch: 'isolated-evolution-workspace',
      worktreeEntries: [],
    },
  });
  await validatePhase0RunSeal(result.outDir, result.experimentRootHash);
  assert.equal(result.runRef, 'p2-source-fingerprint-000001');
  console.log('p2-phase0-source-fingerprint.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
