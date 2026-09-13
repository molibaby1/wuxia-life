import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { getP8GatePersonas } from '../../src/p8/personas';
import { runPhase0 } from '../../scripts/evolution/phase0/runPhase0';
import { verifyDurableEvidenceCapsule } from '../../scripts/evolution/evidence/durableEvidenceCapsule';
import { repairOrdinaryEvidence } from '../../scripts/evolution/evidence/repairOrdinaryEvidence';

async function snapshotFiles(root: string, current = ''): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (const entry of await readdir(join(root, current), { withFileTypes: true })) {
    const relativePath = current ? `${current}/${entry.name}` : entry.name;
    const path = join(root, relativePath);
    if (entry.isDirectory()) {
      for (const [nested, digest] of await snapshotFiles(root, relativePath)) result.set(nested, digest);
    } else if (entry.isFile()) {
      result.set(relativePath, createHash('sha256').update(await readFile(path)).digest('hex'));
    }
  }
  return result;
}

async function run(): Promise<void> {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'wuxia-evidence-repair-'));
  const sessionId = 'ordinary-run-20260914-repair';
  const sessionRoot = join(repositoryRoot, '.tmp/evolution', sessionId);
  const experimentRoot = join(sessionRoot, 'experiment');
  await mkdir(experimentRoot, { recursive: true });
  const phase0 = await runPhase0({
    runRef: sessionId,
    outRoot: join(sessionRoot, 'game-runs'),
    anchorRoot: join(sessionRoot, 'phase0-anchors'),
    persona: getP8GatePersonas()[0]!,
    seed: 19,
    endAge: 2,
    catalogVersion: '1.0.0',
    maxSteps: 120,
  });
  await writeFile(join(experimentRoot, 'run-manifest.json'), JSON.stringify({
    schemaVersion: 'multi-round-run-manifest-v1',
    multiRoundRunRef: sessionId,
    initialSourceRunRef: sessionId,
    limits: { maxAgentRounds: 2, maxCrossRoundTransitions: 1, maxRoundParticipantJobs: 4, maxExecutionParticipantJobs: 1, maxTotalParticipantJobs: 9, retryCount: 0 },
    rounds: [{ round: 1, workflowRef: 'round-1', sourceRunRef: sessionId, terminalRoute: 'SKIP', executionRef: null, resultingRunRef: null, nextAction: 'STOP' }],
    execution: { executionRef: 'configuration-execution-000001', allowedWritePaths: [], actualChangedFiles: [], status: 'not_started', verificationResults: [], resultingRunRef: null },
    budget: { round1ParticipantJobs: 0, executionParticipantJobs: 0, round2ParticipantJobs: 0, totalParticipantJobs: 0, retryCount: 0 },
    outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED',
    stopReason: 'ROUND_1_TERMINAL_NOT_READY',
  }) + '\n');
  await writeFile(join(sessionRoot, 'operator-result.json'), JSON.stringify({
    schemaVersion: 'ordinary-evolution-operator-result-v3',
    sessionId,
    branch: 'dev',
    headSha: 'a'.repeat(40),
    workingTreeClean: true,
    sessionRoot: `.tmp/evolution/${sessionId}`,
    experimentRoot: `.tmp/evolution/${sessionId}/experiment`,
    durableEvidenceStatus: 'FAILED',
  }) + '\n');

  const before = await snapshotFiles(sessionRoot);
  const result = await repairOrdinaryEvidence({ repositoryRoot, sessionRoot });
  assert.equal(result.reused, false);
  assert.equal(await stat(join(repositoryRoot, 'artifacts/evolution/run-evidence', sessionId)).then(() => true), true);
  await verifyDurableEvidenceCapsule(result.capsuleRoot);
  const after = await snapshotFiles(sessionRoot);
  assert.deepEqual(after, before);
  assert.equal(basename(result.capsuleRoot), sessionId);
  assert.equal(phase0.runRef, sessionId);
}

run()
  .then(() => console.log('durableEvidenceRepair.test.ts: ok'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
