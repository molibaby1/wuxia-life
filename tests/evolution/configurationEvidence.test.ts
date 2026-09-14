import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getP8GatePersonas } from '../../src/p8/personas';
import {
  captureConfigurationAfterEvidence,
  captureConfigurationBeforeEvidence,
} from '../../scripts/evolution/evidence/configurationEvidence';
import { publishDurableEvidenceCapsule, verifyDurableEvidenceCapsule } from '../../scripts/evolution/evidence/durableEvidenceCapsule';
import { retainOrdinaryEvidenceCapsule } from '../../scripts/evolution/evidence/retainOrdinaryEvidence';
import { runPhase0 } from '../../scripts/evolution/phase0/runPhase0';
import { buildMultiRoundSessionSummary, parseMultiRoundRunManifest } from '../../scripts/evolution/multiRoundRunManifestContract';
import { sha256Hex } from '../../scripts/evolution/phase0/provenance';

export async function runConfigurationEvidenceTests(): Promise<void> {
  await testBeforeAndAfterCaptureIsTemporal();
  await testNoOpAndUnauthorizedPathAreRepresented();
  await testConfigurationRetentionIsFailClosed();
}

function configurationExecution(sessionId: string) {
  return buildMultiRoundSessionSummary(parseMultiRoundRunManifest({
    schemaVersion: 'multi-round-run-manifest-v1',
    multiRoundRunRef: sessionId,
    initialSourceRunRef: sessionId,
    limits: { maxAgentRounds: 2, maxCrossRoundTransitions: 1, maxRoundParticipantJobs: 4, maxExecutionParticipantJobs: 1, maxTotalParticipantJobs: 9, retryCount: 0 },
    rounds: [{ round: 1, workflowRef: 'round-1', sourceRunRef: sessionId, terminalRoute: 'READY_FOR_CONFIG_EXECUTION', executionRef: 'configuration-execution-000001', resultingRunRef: null, nextAction: 'CONFIGURATION_EXECUTION' }],
    execution: { executionRef: 'configuration-execution-000001', allowedWritePaths: ['src/data/example.json'], actualChangedFiles: ['src/data/example.json'], status: 'completed', verificationResults: [], resultingRunRef: null },
    budget: { round1ParticipantJobs: 4, executionParticipantJobs: 1, round2ParticipantJobs: 0, totalParticipantJobs: 5, retryCount: 0 },
    outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED',
    stopReason: 'NO_CONFIGURATION_CHANGE',
  }));
}

async function testConfigurationRetentionIsFailClosed(): Promise<void> {
  await assert.rejects(() => retainConfigurationFixture('missing-before'), /before-manifest/);
  await assert.rejects(() => retainConfigurationFixture('missing-after'), /after-manifest/);
  await assert.rejects(() => retainConfigurationFixture('missing-bytes'), /required ordinary evidence is missing/);
  const complete = await retainConfigurationFixture('complete');
  await verifyDurableEvidenceCapsule(complete.capsuleRoot);
}

async function retainConfigurationFixture(variant: 'missing-before' | 'missing-after' | 'missing-bytes' | 'complete') {
  const repositoryRoot = await mkdtemp(join(tmpdir(), `wuxia-config-retain-${variant}-`));
  const sessionId = `ordinary-run-20260914-config-${variant}`;
  const sessionRoot = join(repositoryRoot, '.tmp/evolution', sessionId);
  const experimentRoot = join(sessionRoot, 'experiment');
  const phase0 = await runPhase0({ runRef: sessionId, outRoot: join(sessionRoot, 'game-runs'), anchorRoot: join(sessionRoot, 'phase0-anchors'), persona: getP8GatePersonas()[0]!, seed: 31, endAge: 2, catalogVersion: '1.0.0', maxSteps: 120 });
  const configRoot = join(experimentRoot, 'configuration-execution');
  await mkdir(configRoot, { recursive: true });
  await mkdir(join(experimentRoot, 'round-1'), { recursive: true });
  await writeFile(join(experimentRoot, 'round-1/problem-package.json'), '{}\n');
  await writeFile(join(experimentRoot, 'round-1/workflow-outcome.json'), '{}\n');
  const beforeBytes = 'before\n';
  const afterBytes = 'after\n';
  await writeFile(join(configRoot, 'invocation.json'), JSON.stringify({ invocationRef: 'configuration-invocation-000001', status: 'completed' }));
  await writeFile(join(configRoot, 'participant-prompt.txt'), 'configuration prompt\n');
  await writeFile(join(configRoot, 'participant-binding.json'), '{}\n');
  await writeFile(join(configRoot, 'execution-trace.json'), '{}\n');
  await writeFile(join(configRoot, 'raw-output.txt'), '{}\n');
  await writeFile(join(configRoot, 'result.json'), '{}\n');
  if (variant !== 'missing-before') {
    await mkdir(join(configRoot, 'before/src/data'), { recursive: true });
    await writeFile(join(configRoot, 'before/src/data/example.json'), beforeBytes);
    await writeFile(join(configRoot, 'before-manifest.json'), JSON.stringify({ entries: [{ path: 'src/data/example.json', status: 'present', sha256: sha256Hex(beforeBytes), byteLength: Buffer.byteLength(beforeBytes) }] }));
  }
  if (variant !== 'missing-after') {
    await mkdir(join(configRoot, 'after/src/data'), { recursive: true });
    if (variant !== 'missing-bytes') await writeFile(join(configRoot, 'after/src/data/example.json'), afterBytes);
    await writeFile(join(configRoot, 'after-manifest.json'), JSON.stringify({ entries: [{ path: 'src/data/example.json', status: 'present', sha256: sha256Hex(afterBytes), byteLength: Buffer.byteLength(afterBytes) }] }));
  }
  return retainOrdinaryEvidenceCapsule({
    repositoryRoot,
    sessionRoot,
    experimentRoot,
    sessionId,
    sourceRunRef: phase0.runRef,
    sourceRunRefs: [phase0.runRef],
    repositoryIdentity: { branch: 'dev', headSha: 'a'.repeat(40) },
    sessionExecution: configurationExecution(sessionId),
    createdAt: '2026-09-14T00:00:00.000Z',
  });
}

async function testBeforeAndAfterCaptureIsTemporal(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-config-evidence-'));
  const workspaceRoot = join(root, 'workspace');
  const destinationRoot = join(root, 'execution');
  await mkdir(workspaceRoot, { recursive: true });
  const file = join(workspaceRoot, 'src/data/example.json');
  await mkdir(join(workspaceRoot, 'src/data'), { recursive: true });
  await writeFile(file, 'A');

  await captureConfigurationBeforeEvidence({
    workspaceRoot,
    destinationRoot,
    allowedWritePaths: ['src/data/example.json'],
  });
  await writeFile(file, 'B');
  await captureConfigurationAfterEvidence({
    workspaceRoot,
    destinationRoot,
    actualChangedFiles: ['src/data/example.json'],
  });

  assert.equal(await readFile(join(destinationRoot, 'before', 'src/data/example.json'), 'utf8'), 'A');
  assert.equal(await readFile(join(destinationRoot, 'after', 'src/data/example.json'), 'utf8'), 'B');
  assert.equal(await readFile(file, 'utf8'), 'B');
  assert.equal(JSON.parse(await readFile(join(destinationRoot, 'before-manifest.json'), 'utf8')).entries[0].sha256.length, 64);
  assert.equal(JSON.parse(await readFile(join(destinationRoot, 'after-manifest.json'), 'utf8')).entries[0].byteLength, 1);

  const capsule = await publishDurableEvidenceCapsule({
    capsuleRoot: join(root, 'artifacts/evolution/run-evidence/config-temporal-000001'),
    sessionId: 'config-temporal-000001',
    sourceRunRef: 'config-temporal-000001',
    createdAt: '2026-09-13T00:00:00.000Z',
    repositoryIdentity: { branch: 'dev', headSha: 'a'.repeat(40), workingTreeClean: true },
    workflowIdentity: { workflow: 'ordinary-auto-evolution' },
    evidence: [
      { logicalName: 'configuration-before', relativePath: 'extensions/configuration-execution/before/src/data/example.json', sourcePath: join(destinationRoot, 'before/src/data/example.json'), visibility: 'HUMAN_FORENSIC_ONLY', evidenceKind: 'configuration_before', sourceRef: 'configuration-execution/before/src/data/example.json' },
      { logicalName: 'configuration-after', relativePath: 'extensions/configuration-execution/after/src/data/example.json', sourcePath: join(destinationRoot, 'after/src/data/example.json'), visibility: 'HUMAN_FORENSIC_ONLY', evidenceKind: 'configuration_after', sourceRef: 'configuration-execution/after/src/data/example.json' },
      { logicalName: 'configuration-before-manifest', relativePath: 'extensions/configuration-execution/before-manifest.json', sourcePath: join(destinationRoot, 'before-manifest.json'), visibility: 'HUMAN_FORENSIC_ONLY', evidenceKind: 'configuration_execution', sourceRef: 'configuration-execution/before-manifest.json' },
      { logicalName: 'configuration-after-manifest', relativePath: 'extensions/configuration-execution/after-manifest.json', sourcePath: join(destinationRoot, 'after-manifest.json'), visibility: 'HUMAN_FORENSIC_ONLY', evidenceKind: 'configuration_execution', sourceRef: 'configuration-execution/after-manifest.json' },
    ],
    importantEvents: { participantFailure: false, reviewContinuation: false, configurationExecution: true, crossRoundTransition: false },
    extensions: { configurationExecution: { status: 'present', refs: ['extensions/configuration-execution'] }, crossRoundTransition: { status: 'not_applicable', refs: [] } },
  });
  await verifyDurableEvidenceCapsule(capsule.capsuleRoot);
  assert.equal(await readFile(join(capsule.capsuleRoot, 'extensions/configuration-execution/before/src/data/example.json'), 'utf8'), 'A');
  assert.equal(await readFile(join(capsule.capsuleRoot, 'extensions/configuration-execution/after/src/data/example.json'), 'utf8'), 'B');
}

async function testNoOpAndUnauthorizedPathAreRepresented(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-config-evidence-boundary-'));
  const workspaceRoot = join(root, 'workspace');
  const destinationRoot = join(root, 'execution');
  await mkdir(join(workspaceRoot, 'src/data'), { recursive: true });
  await mkdir(join(workspaceRoot, 'docs'), { recursive: true });
  await writeFile(join(workspaceRoot, 'src/data/example.json'), 'same');
  await writeFile(join(workspaceRoot, 'docs/unauthorized.md'), 'changed');

  await captureConfigurationBeforeEvidence({
    workspaceRoot,
    destinationRoot,
    allowedWritePaths: ['src/data/example.json'],
  });
  await captureConfigurationAfterEvidence({
    workspaceRoot,
    destinationRoot,
    actualChangedFiles: ['docs/unauthorized.md'],
  });
  const after = JSON.parse(await readFile(join(destinationRoot, 'after-manifest.json'), 'utf8')) as {
    entries: Array<{ path: string; status: string }>;
  };
  assert.deepEqual(after.entries.map(entry => [entry.path, entry.status]), [['docs/unauthorized.md', 'present']]);
  assert.equal((await stat(join(destinationRoot, 'after/docs/unauthorized.md'))).isFile(), true);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runConfigurationEvidenceTests()
    .then(() => console.log('configurationEvidence.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
