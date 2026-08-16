import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { getP8PersonaById } from '../../src/p8/personas';
import { validatePhase0RunSeal } from '../../scripts/evolution/phase0/provenance';
import { runPhase0 } from '../../scripts/evolution/phase0/runPhase0';

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

async function createCleanGitFixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-phase0-e2e-git-'));
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'phase0@example.invalid']);
  git(root, ['config', 'user.name', 'Phase 0 Test']);
  await writeFile(join(root, 'tracked.txt'), 'baseline\n', 'utf8');
  git(root, ['add', 'tracked.txt']);
  git(root, ['commit', '-qm', 'baseline']);
  return root;
}

function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const child of value) collectObjectKeys(child, keys);
    return keys;
  }
  if (!value || typeof value !== 'object') return keys;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    keys.add(key);
    collectObjectKeys(child, keys);
  }
  return keys;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

export async function runPhase0EndToEndTests(): Promise<void> {
  const repo = await createCleanGitFixture();
  const evidenceRoot = await mkdtemp(join(tmpdir(), 'wuxia-phase0-e2e-artifacts-'));
  const outRoot = join(evidenceRoot, 'phase0');
  const anchorRoot = join(evidenceRoot, 'phase0-anchors');
  const persona = getP8PersonaById('p8-martial-lin');
  assert.ok(persona, 'p8-martial-lin must exist');

  const originalCwd = process.cwd();
  process.chdir(repo);
  try {
    const shared = {
      outRoot,
      anchorRoot,
      persona,
      seed: 101,
      endAge: 12,
      catalogVersion: '1.0.0',
      maxSteps: 600,
    } as const;

    const first = await runPhase0({ ...shared, runRef: 'phase0-e2e-a' });
    const second = await runPhase0({ ...shared, runRef: 'phase0-e2e-b' });

    const firstPayloadPath = join(first.outDir, 'reviewer-input', 'observable-payload.json');
    const secondPayloadPath = join(second.outDir, 'reviewer-input', 'observable-payload.json');
    const firstPayloadBytes = await readFile(firstPayloadPath, 'utf8');
    const secondPayloadBytes = await readFile(secondPayloadPath, 'utf8');
    assert.equal(firstPayloadBytes, secondPayloadBytes, 'same semantic inputs must reproduce payload bytes');
    assert.equal(first.observablePayloadHash, second.observablePayloadHash);

    const firstEnvelope = JSON.parse(await readFile(
      join(first.outDir, 'provenance', 'experiment-envelope.json'),
      'utf8',
    )) as Record<string, unknown>;
    const secondEnvelope = JSON.parse(await readFile(
      join(second.outDir, 'provenance', 'experiment-envelope.json'),
      'utf8',
    )) as Record<string, unknown>;
    assert.equal(firstEnvelope.configFingerprint, secondEnvelope.configFingerprint);
    assert.equal(firstEnvelope.sourceFingerprint, secondEnvelope.sourceFingerprint);
    assert.equal(firstEnvelope.policyVisibilityBoundary, 'uses_hidden_oracle');

    const runInput = JSON.parse(await readFile(
      join(first.outDir, 'inputs', 'run-input.json'),
      'utf8',
    )) as Record<string, unknown>;
    assert.equal(runInput.activePlanningDecisionSurface, 'excluded');
    assert.equal(
      (runInput.selectionPolicy as { kind?: string } | undefined)?.kind,
      'oracle_effect_score_v1',
    );

    const surfaceSource = JSON.parse(await readFile(
      join(first.outDir, 'internal', 'player-surface-source.json'),
      'utf8',
    ));
    const surfaceKeys = collectObjectKeys(surfaceSource);
    assert.equal(surfaceKeys.has('planningOptions'), false);

    assert.equal(
      await pathExists(join(first.outDir, 'reviewer-input', 'experiment-envelope.json')),
      false,
      'reviewer-input directory must not contain the experiment envelope',
    );
    await validatePhase0RunSeal(first.outDir, first.experimentRootHash);
    await validatePhase0RunSeal(second.outDir, second.experimentRootHash);
    assert.notEqual(resolve(dirname(first.anchorPath)), resolve(first.outDir));
    assert.notEqual(resolve(dirname(second.anchorPath)), resolve(second.outDir));

    const payload = JSON.parse(firstPayloadBytes) as {
      entries: Array<{
        kind: string;
        visibleChoices?: Array<{ label: string; description?: string }>;
      }>;
    };
    const choiceEntries = payload.entries.filter(entry => (entry.visibleChoices?.length ?? 0) > 0);
    assert.ok(choiceEntries.length > 0, 'evidence fixture should expose at least one story-event choice surface');
    assert.ok(
      choiceEntries.some(entry => entry.visibleChoices?.some(choice => Boolean(choice.description))),
      'API-visible choice description must survive projection',
    );

    const forbiddenKeys = new Set([
      'seed',
      'persona',
      'policy',
      'eventId',
      'choiceId',
      'baseScore',
      'personaAdjustedScore',
      'selectedScore',
      'directEffects',
      'outcomeEffects',
      'finalState',
      'lifeStates',
      'flags',
      'diagnostic',
      'riskHints',
      'planningOptions',
    ]);
    const payloadKeys = collectObjectKeys(payload);
    for (const forbidden of forbiddenKeys) {
      assert.equal(payloadKeys.has(forbidden), false, `Reviewer payload leaked forbidden key ${forbidden}`);
    }
    assert.equal(firstPayloadBytes.includes(persona.id), false, 'Reviewer payload leaked persona identity');
    assert.equal(firstPayloadBytes.includes('oracle_effect_score_v1'), false, 'Reviewer payload leaked policy identity');

    await assert.rejects(
      () => runPhase0({ ...shared, runRef: '../escape' }),
      /invalid Phase 0 runRef/,
    );

    const preexistingRef = 'phase0-preexisting';
    const preexistingPath = join(outRoot, preexistingRef);
    await mkdir(preexistingPath, { recursive: true });
    await writeFile(join(preexistingPath, 'sentinel.txt'), 'keep-me', 'utf8');
    await assert.rejects(
      () => runPhase0({ ...shared, runRef: preexistingRef }),
      /final run target already exists/,
    );
    assert.equal(await readFile(join(preexistingPath, 'sentinel.txt'), 'utf8'), 'keep-me');

    const raceRef = 'phase0-race';
    let raceStagingDir = '';
    let raceTarget = '';
    await assert.rejects(
      () => runPhase0(
        { ...shared, runRef: raceRef, endAge: 2, maxSteps: 120 },
        {
          beforePublish: async context => {
            raceStagingDir = context.stagingDir;
            raceTarget = context.finalRunPath;
            await mkdir(context.finalRunPath, { recursive: false });
            await writeFile(join(context.finalRunPath, 'sentinel.txt'), 'race-winner', 'utf8');
          },
        },
      ),
      /no-replace publication refused/,
    );
    assert.equal(await readFile(join(raceTarget, 'sentinel.txt'), 'utf8'), 'race-winner');
    assert.equal(await pathExists(raceStagingDir), true, 'failed race must preserve staging');
    assert.equal(await pathExists(join(anchorRoot, `${raceRef}.json`)), false, 'failed race must not write anchor');
    await assert.rejects(
      () => runPhase0({ ...shared, runRef: raceRef, endAge: 2, maxSteps: 120 }),
      /final run target already exists/,
      'race target must permanently consume runRef',
    );

    const anchorFailureRef = 'phase0-anchor-failure';
    let anchorFailureStaging = '';
    let anchorFailureFinal = '';
    let anchorFailureAnchor = '';
    await assert.rejects(
      () => runPhase0(
        { ...shared, runRef: anchorFailureRef, endAge: 2, maxSteps: 120 },
        {
          beforeAnchor: async context => {
            anchorFailureStaging = context.stagingDir;
            anchorFailureFinal = context.finalRunPath;
            anchorFailureAnchor = context.anchorPath;
            await mkdir(dirname(context.anchorPath), { recursive: true });
            await writeFile(context.anchorPath, 'external-race-winner', { flag: 'wx' });
          },
        },
      ),
      /anchor already exists/,
    );
    assert.equal(await pathExists(anchorFailureFinal), true, 'anchor failure must retain final run');
    assert.equal(await pathExists(anchorFailureStaging), true, 'anchor failure must retain staging');
    assert.equal(await readFile(anchorFailureAnchor, 'utf8'), 'external-race-winner');
    await assert.rejects(
      () => runPhase0({ ...shared, runRef: anchorFailureRef, endAge: 2, maxSteps: 120 }),
      /final run target already exists|anchor target already exists/,
      'anchor failure must permanently consume runRef',
    );
  } finally {
    process.chdir(originalCwd);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase0EndToEndTests()
    .then(() => console.log('phase0EndToEnd.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
