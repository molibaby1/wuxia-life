import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getP8GatePersonas } from '../../src/p8/personas';
import { runPhase0 } from '../../scripts/evolution/phase0/runPhase0';
import { collectOrdinaryEvidence } from '../../scripts/evolution/evidence/ordinaryEvidenceCollector';

async function run(): Promise<void> {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'wuxia-evidence-allowlist-'));
  const sessionId = 'ordinary-run-20260914-allowlist';
  const sessionRoot = join(repositoryRoot, '.tmp/evolution', sessionId);
  const gameRunsRoot = join(sessionRoot, 'game-runs');
  const experimentRoot = join(sessionRoot, 'experiment');
  await mkdir(experimentRoot, { recursive: true });
  const phase0 = await runPhase0({
    runRef: sessionId,
    outRoot: gameRunsRoot,
    anchorRoot: join(sessionRoot, 'phase0-anchors'),
    persona: getP8GatePersonas()[0]!,
    seed: 17,
    endAge: 2,
    catalogVersion: '1.0.0',
    maxSteps: 120,
  });

  const feedbackRoot = join(experimentRoot, 'round-1/feedback-runs', sessionId);
  await mkdir(feedbackRoot, { recursive: true });
  await writeFile(join(feedbackRoot, 'feedback.json'), '{}\n');
  await writeFile(join(experimentRoot, 'round-1/debug-secret.txt'), 'must-not-retain\n');
  await writeFile(join(feedbackRoot, 'uncontracted-debug.log'), 'must-not-retain\n');

  const evidence = await collectOrdinaryEvidence({
    repositoryRoot,
    sessionRoot,
    experimentRoot,
    sessionId,
    sourceRunRefs: [phase0.runRef],
  });

  assert.equal(evidence.some(item => item.sourceRef === 'round-1/debug-secret.txt'), false);
  assert.equal(evidence.some(item => item.sourceRef === `round-1/feedback-runs/${sessionId}/uncontracted-debug.log`), false);
  assert.equal(evidence.some(item => item.sourceRef === `round-1/feedback-runs/${sessionId}/feedback.json`), true);
}

run()
  .then(() => console.log('ordinaryEvidenceAllowlist.test.ts: ok'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
