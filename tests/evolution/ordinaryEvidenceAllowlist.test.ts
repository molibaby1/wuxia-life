import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getP8GatePersonas } from '../../src/p8/personas';
import { runPhase0 } from '../../scripts/evolution/phase0/runPhase0';
import { sha256Hex } from '../../scripts/evolution/phase0/provenance';
import { collectOrdinaryEvidence } from '../../scripts/evolution/evidence/ordinaryEvidenceCollector';
import { retainOrdinaryEvidenceCapsule } from '../../scripts/evolution/evidence/retainOrdinaryEvidence';
import type { MultiRoundSessionSummaryV1 } from '../../scripts/evolution/multiRoundRunManifestContract';

async function run(): Promise<void> {
  await testConflictingRoundSnapshotsFailClosed();
  await testExplicitSnapshotBindingFailsClosed();
  await testPerRoundSnapshotProvenance();
  await testProductionLayoutIsAllowlisted();
}

async function testPerRoundSnapshotProvenance(): Promise<void> {
  await assert.rejects(() => retainSnapshotFixture({ round1Snapshots: true, round2Snapshots: false }), /round-2|snapshot/i);
  await assert.rejects(() => retainSnapshotFixture({ round1Snapshots: false, round2Snapshots: true }), /round-1|snapshot/i);
  const deduplicated = await retainSnapshotFixture({ round1Snapshots: true, round2Snapshots: true });
  assert.equal(deduplicated.manifest.objects.filter(object => object.sourceRef === 'authority-snapshots/docs/example.md').length, 1);
  assert.equal(deduplicated.manifest.objects.filter(object => object.sourceRef === 'skill-snapshots/skills/example/SKILL.md').length, 1);
  assert.equal(deduplicated.manifest.objects.some(object => object.relativePath === 'provenance/round-1/authority-snapshots/manifest.json'), true);
  assert.equal(deduplicated.manifest.objects.some(object => object.relativePath === 'provenance/round-2/authority-snapshots/manifest.json'), true);
  assert.equal(deduplicated.manifest.objects.some(object => object.relativePath === 'provenance/round-1/skill-snapshots/manifest.json'), true);
  assert.equal(deduplicated.manifest.objects.some(object => object.relativePath === 'provenance/round-2/skill-snapshots/manifest.json'), true);
  const solutionReceipts = deduplicated.manifest.participantReceipts.filter(receipt => receipt.role === 'solution');
  assert.equal(solutionReceipts.every(receipt => 'authoritySnapshotManifest' in receipt && 'skillSnapshotManifest' in receipt), true);
  for (const round of [1, 2] as const) {
    const receipt = solutionReceipts.find(candidate => candidate.round === round && candidate.continuationRef === null);
    assert.equal(receipt?.authoritySnapshotManifest?.logicalName, `session:round-${round}/authority-snapshots/manifest.json`);
    assert.equal(receipt?.skillSnapshotManifest?.logicalName, `session:round-${round}/skill-snapshots/manifest.json`);
  }
  await assert.rejects(() => retainSnapshotFixture({ round1Snapshots: true, round2Snapshots: true, conflicting: true }), /conflict|mismatch|different/i);
}

async function retainSnapshotFixture(input: {
  round1Snapshots: boolean;
  round2Snapshots: boolean;
  conflicting?: boolean;
}) {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'wuxia-evidence-per-round-'));
  const sessionId = `ordinary-run-20260914-per-round-${input.round1Snapshots ? '1' : '0'}${input.round2Snapshots ? '1' : '0'}${input.conflicting ? '-conflict' : ''}`;
  const experimentRoot = join(repositoryRoot, 'experiment');
  const authorityBytes = 'authority snapshot\n';
  const skillBytes = 'skill snapshot\n';
  for (const round of [1, 2] as const) {
    const roundRoot = join(experimentRoot, `round-${round}`);
    await mkdir(join(roundRoot, 'solution-agent'), { recursive: true });
    await writeFile(join(roundRoot, 'workflow-outcome.json'), '{}\n');
    await writeFile(join(roundRoot, 'problem-package.json'), JSON.stringify({ authorityRefs: ['docs/example.md'] }) + '\n');
    for (const [file, value] of [
      ['participant-prompt.txt', 'prompt\n'],
      ['participant-binding.json', '{}\n'],
      ['invocation.json', JSON.stringify({ invocationRef: `solution-invocation-${round}`, status: 'completed', skillAssignments: [{ identity: 'example', version: '1', canonicalPath: 'skills/example/SKILL.md' }] }) + '\n'],
      ['execution-trace.json', '{}\n'],
      ['result.json', '{}\n'],
    ] as const) await writeFile(join(roundRoot, 'solution-agent', file), value);
    if ((round === 1 ? input.round1Snapshots : input.round2Snapshots) === false) continue;
    const currentAuthorityBytes = input.conflicting && round === 2 ? 'different authority snapshot\n' : authorityBytes;
    const currentSkillBytes = input.conflicting && round === 2 ? 'different skill snapshot\n' : skillBytes;
    await mkdir(join(roundRoot, 'authority-snapshots/docs'), { recursive: true });
    await writeFile(join(roundRoot, 'authority-snapshots/docs/example.md'), currentAuthorityBytes);
    await writeFile(join(roundRoot, 'authority-snapshots/manifest.json'), JSON.stringify({ entries: [{ path: 'docs/example.md', sha256: sha256Hex(currentAuthorityBytes) }] }));
    await mkdir(join(roundRoot, 'skill-snapshots/skills/example'), { recursive: true });
    await writeFile(join(roundRoot, 'skill-snapshots/skills/example/SKILL.md'), currentSkillBytes);
    await writeFile(join(roundRoot, 'skill-snapshots/manifest.json'), JSON.stringify({ entries: [{ identity: 'example', version: '1', canonicalPath: 'skills/example/SKILL.md', sha256: sha256Hex(currentSkillBytes) }] }));
  }
  const sessionExecution: MultiRoundSessionSummaryV1 = {
    schemaVersion: 'multi-round-session-summary-v1',
    multiRoundRunRef: sessionId,
    outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED',
    stopReason: 'ROUND_2_COMPLETED',
    roundCount: 2,
    crossRoundTransitions: 0,
    lastRoundTerminalRoute: 'SKIP',
    execution: { executionRef: 'configuration-execution-000001', status: 'not_started', actualChangedFiles: [], resultingRunRef: null },
  };
  return retainOrdinaryEvidenceCapsule({
    repositoryRoot,
    sessionRoot: join(repositoryRoot, '.tmp/evolution', sessionId),
    experimentRoot,
    sessionId,
    sourceRunRef: sessionId,
    sourceRunRefs: [],
    repositoryIdentity: { branch: 'dev', headSha: 'a'.repeat(40) },
    sessionExecution,
  });
}

async function testExplicitSnapshotBindingFailsClosed(): Promise<void> {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'wuxia-evidence-snapshot-required-'));
  const sessionId = 'ordinary-run-20260914-required-snapshot';
  const sessionRoot = join(repositoryRoot, '.tmp/evolution', sessionId);
  const experimentRoot = join(repositoryRoot, 'experiment');
  await mkdir(join(experimentRoot, 'round-1/solution-agent'), { recursive: true });
  await writeFile(join(experimentRoot, 'round-1/workflow-outcome.json'), '{}\n');
  await writeFile(join(experimentRoot, 'round-1/problem-package.json'), JSON.stringify({ authorityRefs: ['docs/example.md'] }) + '\n');
  for (const [file, value] of [
    ['participant-prompt.txt', 'prompt\n'],
    ['participant-binding.json', '{}\n'],
    ['invocation.json', JSON.stringify({ invocationRef: 'solution-invocation-000001', status: 'completed' }) + '\n'],
    ['execution-trace.json', '{}\n'],
    ['result.json', '{}\n'],
  ] as const) await writeFile(join(experimentRoot, 'round-1/solution-agent', file), value);
  const sessionExecution: MultiRoundSessionSummaryV1 = {
    schemaVersion: 'multi-round-session-summary-v1',
    multiRoundRunRef: sessionId,
    outcome: 'NO_CROSS_ROUND_TRANSITION_OBSERVED',
    stopReason: 'ROUND_1_TERMINAL_NOT_READY',
    roundCount: 1,
    crossRoundTransitions: 0,
    lastRoundTerminalRoute: 'SKIP',
    execution: { executionRef: 'configuration-execution-000001', status: 'not_started', actualChangedFiles: [], resultingRunRef: null },
  };
  await assert.rejects(
    () => retainOrdinaryEvidenceCapsule({ repositoryRoot, sessionRoot, experimentRoot, sessionId, sourceRunRef: sessionId, sourceRunRefs: [], repositoryIdentity: { branch: 'dev', headSha: 'a'.repeat(40) }, sessionExecution }),
    /authority-snapshots evidence is missing or undeclared|required.*snapshot/i,
  );
}

async function testConflictingRoundSnapshotsFailClosed(): Promise<void> {
  const repositoryRoot = await mkdtemp(join(tmpdir(), 'wuxia-evidence-snapshot-conflict-'));
  const experimentRoot = join(repositoryRoot, 'experiment');
  await mkdir(join(experimentRoot, 'round-1/authority-snapshots/docs'), { recursive: true });
  await mkdir(join(experimentRoot, 'round-2/authority-snapshots/docs'), { recursive: true });
  await writeFile(join(experimentRoot, 'round-1/authority-snapshots/docs/example.md'), 'round one\n');
  await writeFile(join(experimentRoot, 'round-2/authority-snapshots/docs/example.md'), 'round two\n');
  await writeFile(join(experimentRoot, 'round-1/authority-snapshots/manifest.json'), JSON.stringify({ entries: [{ path: 'docs/example.md', sha256: sha256Hex('round one\n') }] }));
  await writeFile(join(experimentRoot, 'round-2/authority-snapshots/manifest.json'), JSON.stringify({ entries: [{ path: 'docs/example.md', sha256: sha256Hex('round two\n') }] }));
  await assert.rejects(
    () => collectOrdinaryEvidence({ repositoryRoot, sessionRoot: join(repositoryRoot, 'session'), experimentRoot, sessionId: 'ordinary-run-20260914-conflict', sourceRunRefs: [] }),
    /conflict|mismatch|different/i,
  );
}

async function testProductionLayoutIsAllowlisted(): Promise<void> {
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
  await mkdir(join(experimentRoot, 'round-1/diagnostic'), { recursive: true });
  await writeFile(join(experimentRoot, 'round-1/diagnostic/causal-attribution.json'), '{}\n');
  await writeFile(join(experimentRoot, 'workspace-state-provenance.json'), '{}\n');
  const authorityBytes = '# authority snapshot\n';
  const skillBytes = '# skill snapshot\n';
  await mkdir(join(experimentRoot, 'round-1/authority-snapshots/docs/governance'), { recursive: true });
  await writeFile(join(experimentRoot, 'round-1/authority-snapshots/docs/governance/example.md'), authorityBytes);
  await writeFile(join(experimentRoot, 'round-1/authority-snapshots/manifest.json'), JSON.stringify({
    entries: [{ ref: 'docs/governance/example.md', path: 'docs/governance/example.md', sha256: sha256Hex(authorityBytes) }],
  }) + '\n');
  await mkdir(join(experimentRoot, 'round-1/skill-snapshots/skills/example'), { recursive: true });
  await writeFile(join(experimentRoot, 'round-1/skill-snapshots/skills/example/SKILL.md'), skillBytes);
  await writeFile(join(experimentRoot, 'round-1/skill-snapshots/manifest.json'), JSON.stringify({
    entries: [{ identity: 'example', version: '1', canonicalPath: 'skills/example/SKILL.md', sha256: sha256Hex(skillBytes) }],
  }) + '\n');
  await mkdir(join(experimentRoot, 'round-2/authority-snapshots/docs/governance'), { recursive: true });
  await writeFile(join(experimentRoot, 'round-2/authority-snapshots/docs/governance/example.md'), authorityBytes);
  await writeFile(join(experimentRoot, 'round-2/authority-snapshots/manifest.json'), JSON.stringify({
    entries: [{ ref: 'docs/governance/example.md', path: 'docs/governance/example.md', sha256: sha256Hex(authorityBytes) }],
  }) + '\n');
  await mkdir(join(experimentRoot, 'round-2/skill-snapshots/skills/example'), { recursive: true });
  await writeFile(join(experimentRoot, 'round-2/skill-snapshots/skills/example/SKILL.md'), skillBytes);
  await writeFile(join(experimentRoot, 'round-2/skill-snapshots/manifest.json'), JSON.stringify({
    entries: [{ identity: 'example', version: '1', canonicalPath: 'skills/example/SKILL.md', sha256: sha256Hex(skillBytes) }],
  }) + '\n');
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
  assert.equal(evidence.some(item => item.sourceRef === 'round-1/diagnostic/causal-attribution.json'), true);
  assert.equal(evidence.find(item => item.sourceRef === 'round-1/diagnostic/causal-attribution.json')?.visibility, 'PARTICIPANT_VISIBLE');
  assert.equal(evidence.some(item => item.sourceRef === 'workspace-state-provenance.json'), true);
  assert.equal(evidence.some(item => item.sourceRef === 'authority-snapshots/docs/governance/example.md'), true);
  assert.equal(evidence.some(item => item.sourceRef === 'skill-snapshots/skills/example/SKILL.md'), true);
  assert.equal(evidence.filter(item => item.sourceRef === 'authority-snapshots/docs/governance/example.md').length, 1);
  assert.equal(evidence.filter(item => item.sourceRef === 'skill-snapshots/skills/example/SKILL.md').length, 1);
}

run()
  .then(() => console.log('ordinaryEvidenceAllowlist.test.ts: ok'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
