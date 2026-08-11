import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { stableJsonHash, stableStringify, sha256Hex } from './hash';
import {
  buildSealedLabels,
  loadAdversarialRecipe,
  loadFixtureRegistry,
  loadKnownBadRecipe,
  loadSeedBundle,
} from './roles/fixtureBuilder';
import { sealExperiment, advance } from './roles/experimentController';
import {
  simulateAdversarialPair,
  simulateControl,
  simulateKnownBadPair,
  type SimulatedPair,
} from './roles/simulator';
import { auditRawTrace } from './roles/mechanicalAuditor';
import { reviewPlayerVisibleTraces } from './roles/blindReviewer';
import { auditRedTeam } from './roles/redTeamAuditor';
import { projectPlayerVisibleTrace } from './trace/projectPlayerVisibleTrace';
import { applyHumanDecision, evaluateAutomaticTerminal } from './humanDecision';
import type {
  B0PlayerVisibleTrace,
  EvidenceIndex,
  MechanicalAuditResult,
} from './types';
import type { B0State } from './stateMachine';

export type B0RunResult = {
  runId: string;
  outDir: string;
  state: B0State;
  terminalVerdict: 'passed' | 'failed' | 'blocked' | 'awaiting_human';
  evidence: EvidenceIndex;
  automatic: { suggested: 'passed' | 'failed' | 'blocked'; reasons: string[] };
};

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${stableStringify(value)}\n`, 'utf8');
}

export function runB0Calibration(options: {
  outRoot?: string;
  runId?: string;
  decision?: 'accept' | 'reject';
  decisionReason?: string;
  baselineDir?: string;
}): B0RunResult {
  const labels = buildSealedLabels();
  let experiment = sealExperiment({
    runId: options.runId,
    labels,
    baselineDir: options.baselineDir,
  });
  const runId = experiment.manifest.runId;
  const outDir = join(options.outRoot ?? '.tmp/b0', runId);
  mkdirSync(join(outDir, 'raw-traces'), { recursive: true });
  mkdirSync(join(outDir, 'player-visible-traces'), { recursive: true });
  mkdirSync(join(outDir, 'controller-private'), { recursive: true });
  mkdirSync(join(outDir, 'fixture-set'), { recursive: true });

  writeJson(join(outDir, 'manifest.json'), experiment.manifest);
  writeJson(join(outDir, 'controller-private', 'labels.json'), experiment.privateStore.labels);
  writeJson(join(outDir, 'controller-private', 'abMap.json'), experiment.privateStore.abMap);
  writeJson(join(outDir, 'seed-bundle.json'), experiment.seedBundle);

  const registry = loadFixtureRegistry();
  writeJson(join(outDir, 'fixture-set', 'registry.json'), registry);

  experiment = { ...experiment, state: advance(experiment.state, 'queued') };

  const holdoutSeeds = experiment.seedBundle.layers.holdout.map(s => s.seed);
  const pairs: SimulatedPair[] = [];
  const proposedPathsBySample: Record<string, string[]> = {};
  const foreignPayloads: unknown[] = [];
  const seedsExposedToBlind: number[] = [];

  for (const sample of registry.samples) {
    if (sample.kind === 'control') {
      const recipe = loadKnownBadRecipe(sample.recipePath);
      pairs.push(simulateControl(sample.id, recipe));
    } else if (sample.kind === 'known-bad') {
      const recipe = loadKnownBadRecipe(sample.recipePath);
      pairs.push(simulateKnownBadPair(sample.id, recipe));
    } else {
      const recipe = loadAdversarialRecipe(sample.recipePath);
      const pair = simulateAdversarialPair(sample.id, recipe, holdoutSeeds);
      pairs.push(pair);
      if (pair.proposedPaths) proposedPathsBySample[sample.id] = pair.proposedPaths;
      if (pair.crossReviewPayload) foreignPayloads.push(pair.crossReviewPayload);
      if (pair.leakedHoldoutSeed != null) {
        // Simulate a polluted blind package that incorrectly received holdout seed
        seedsExposedToBlind.push(pair.leakedHoldoutSeed);
      }
    }
  }

  experiment = { ...experiment, state: advance(experiment.state, 'simulated') };

  const rawTraceHashes: Record<string, string> = {};
  const visibleTraceHashes: Record<string, string> = {};
  const mechanical: MechanicalAuditResult[] = [];
  const visibleForBlind: Array<{ sampleKey: string; visible: B0PlayerVisibleTrace }> = [];
  const allVisible: B0PlayerVisibleTrace[] = [];
  const projectionFailures: string[] = [];

  let abIndex = 0;
  for (const pair of pairs) {
    for (const arm of ['baseline', 'candidate'] as const) {
      const raw = arm === 'baseline' ? pair.baseline : pair.candidate;
      const rawPath = join(outDir, 'raw-traces', `${pair.sampleId}.${arm}.json`);
      writeJson(rawPath, raw);
      rawTraceHashes[`${pair.sampleId}:${arm}`] = sha256Hex(readFileSync(rawPath));

      const projected = projectPlayerVisibleTrace(raw);
      if (!projected.ok) {
        projectionFailures.push(`${pair.sampleId}:${arm}:${projected.reason}:${projected.leakedKeys.join(',')}`);
        continue;
      }
      // Adversarial hidden_in_visible_trace: intentionally re-inject hidden keys into visible package
      let visible = projected.visible;
      const sampleMeta = registry.samples.find(s => s.id === pair.sampleId);
      if (
        sampleMeta?.kind === 'adversarial' &&
        arm === 'candidate' &&
        (sampleMeta.expectedBlockCodes ?? []).includes('hidden_in_visible_trace')
      ) {
        visible = {
          ...visible,
          steps: [
            ...visible.steps,
            {
              age: 99,
              directEffects: [{ leak: true }],
              outcomeEffects: [{ leak: true }],
            },
          ],
        };
      }

      const visPath = join(outDir, 'player-visible-traces', `${pair.sampleId}.${arm}.json`);
      writeJson(visPath, visible);
      visibleTraceHashes[`${pair.sampleId}:${arm}`] = sha256Hex(readFileSync(visPath));
      allVisible.push(visible);

      // Blind only sees candidate arm, anonymized — never holdout seeds from seed bundle holdout layer
      if (arm === 'candidate') {
        const sampleLayer = registry.samples.find(s => s.id === pair.sampleId)?.layer;
        if (sampleLayer !== 'holdout') {
          visibleForBlind.push({ sampleKey: `S${abIndex}`, visible });
          seedsExposedToBlind.push(visible.seed);
        }
        abIndex += 1;
      }

      if (arm === 'candidate') {
        mechanical.push(auditRawTrace(raw));
      }
    }
  }

  const blindReview = reviewPlayerVisibleTraces(visibleForBlind);
  const redTeam = auditRedTeam({
    proposedPathsBySample,
    visibleTraces: allVisible,
    seedsExposedToBlind,
    holdoutSeeds,
    foreignReviewPayloads: foreignPayloads,
    projectionFailures,
  });

  writeJson(join(outDir, 'mechanical-audit.json'), mechanical);
  writeJson(join(outDir, 'blind-review.json'), blindReview);
  writeJson(join(outDir, 'red-team-review.json'), redTeam);

  experiment = { ...experiment, state: advance(experiment.state, 'audited') };

  const evidence: EvidenceIndex = {
    sourceFingerprintHash: stableJsonHash(experiment.manifest.sourceFingerprint),
    manifestHash: stableJsonHash(experiment.manifest),
    fixtureHash: experiment.manifest.fixtureSetFingerprint,
    seedBundleHash: experiment.manifest.seedBundleFingerprint,
    rawTraceHashes,
    visibleTraceHashes,
    mechanicalAuditHash: stableJsonHash(mechanical),
    blindReviewHash: stableJsonHash(blindReview),
    redTeamHash: stableJsonHash(redTeam),
    chainOk: true,
    breakReasons: [],
  };

  // Evidence integrity checks
  if (Object.keys(rawTraceHashes).length === 0) {
    evidence.chainOk = false;
    evidence.breakReasons.push('no raw traces');
  }
  if (projectionFailures.length > 0 && !redTeam.veto) {
    evidence.chainOk = false;
    evidence.breakReasons.push('projection failures without red-team veto');
  }
  // Verify written files still match hashes
  for (const [key, hash] of Object.entries(rawTraceHashes)) {
    const [sampleId, arm] = key.split(':');
    const live = sha256Hex(readFileSync(join(outDir, 'raw-traces', `${sampleId}.${arm}.json`)));
    if (live !== hash) {
      evidence.chainOk = false;
      evidence.breakReasons.push(`raw hash mismatch ${key}`);
    }
  }

  writeJson(join(outDir, 'evidence-index.json'), evidence);
  experiment = {
    ...experiment,
    state: advance(experiment.state, evidence.chainOk ? 'evidence_checked' : 'blocked'),
  };

  if (experiment.state === 'blocked') {
    writeJson(join(outDir, 'human-decision.json'), {
      decision: 'reject',
      decidedAt: new Date().toISOString(),
      reason: evidence.breakReasons.join('; '),
      terminalVerdict: 'blocked',
    });
    return {
      runId,
      outDir,
      state: 'blocked',
      terminalVerdict: 'blocked',
      evidence,
      automatic: { suggested: 'blocked', reasons: evidence.breakReasons },
    };
  }

  experiment = { ...experiment, state: advance(experiment.state, 'awaiting_human') };

  const controlIds = new Set(registry.samples.filter(s => s.kind === 'control').map(s => s.id));
  const controlHardKilled = mechanical.some(m => controlIds.has(m.sampleId) && m.hardKill);

  const knownBadMissed: string[] = [];
  for (const sample of registry.samples.filter(s => s.kind === 'known-bad')) {
    const audit = mechanical.find(m => m.sampleId === sample.id);
    const detected = new Set(audit?.detections.map(d => d.code) ?? []);
    const expected = sample.expectedDetections ?? [];
    // Detection by mechanical OR (for opaque) already mechanical; red-team does not replace experience detection
    const missing = expected.filter(code => !detected.has(code));
    if (missing.length > 0) {
      knownBadMissed.push(`${sample.id}:${missing.join('|')}`);
    }
  }

  const automatic = evaluateAutomaticTerminal({
    labels: labels as DecisionInputLabels,
    mechanical,
    redTeam,
    evidence,
    controlHardKilled,
    knownBadMissed,
    registry,
  });

  let terminalVerdict: B0RunResult['terminalVerdict'] = 'awaiting_human';
  let state: B0State = experiment.state;

  if (options.decision) {
    const human = applyHumanDecision(
      options.decision,
      automatic,
      options.decisionReason ?? `human ${options.decision}`,
    );
    writeJson(join(outDir, 'human-decision.json'), human);
    terminalVerdict = human.terminalVerdict;
    state = advance('awaiting_human', human.terminalVerdict);
  } else {
    writeJson(join(outDir, 'automatic-suggestion.json'), automatic);
  }

  writeJson(join(outDir, 'run-summary.json'), {
    runId,
    state,
    terminalVerdict,
    automatic,
  });

  return {
    runId,
    outDir,
    state,
    terminalVerdict,
    evidence,
    automatic,
  };
}

type DecisionInputLabels = Parameters<typeof evaluateAutomaticTerminal>[0]['labels'];

function parseArgs(argv: string[]): {
  outRoot: string;
  decision?: 'accept' | 'reject';
  runId?: string;
} {
  let outRoot = '.tmp/b0';
  let decision: 'accept' | 'reject' | undefined;
  let runId: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out' && argv[i + 1]) outRoot = argv[++i];
    else if (argv[i] === '--decision' && argv[i + 1]) {
      decision = argv[++i] as 'accept' | 'reject';
    } else if (argv[i] === '--run-id' && argv[i + 1]) runId = argv[++i];
  }
  return { outRoot, decision, runId };
}

const isMain = process.argv[1] && existsSync(process.argv[1]) &&
  (process.argv[1].endsWith('runB0.ts') || process.argv[1].includes('/runB0.'));

if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const result = runB0Calibration(args);
  console.log(JSON.stringify({
    runId: result.runId,
    outDir: result.outDir,
    state: result.state,
    terminalVerdict: result.terminalVerdict,
    automatic: result.automatic,
  }, null, 2));
  if (result.terminalVerdict === 'blocked' || result.terminalVerdict === 'failed') {
    process.exitCode = 1;
  }
}
