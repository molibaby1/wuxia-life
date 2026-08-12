import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { stableJsonHash, stableStringify, sha256Hex } from './hash';
import {
  buildSealedLabels,
  loadAdversarialRecipe,
  loadFixtureRegistry,
  loadKnownBadRecipe,
} from './roles/fixtureBuilder';
import { sealExperiment, advance } from './roles/experimentController';
import {
  simulateAdversarialPair,
  simulateControl,
  simulateKnownBadPair,
  type SimulatedPair,
} from './roles/simulator';
import { auditRawTrace } from './roles/mechanicalAuditor';
import { reviewBlindPackage } from './roles/blindReviewer';
import { auditRedTeam } from './roles/redTeamAuditor';
import { runRealControlCheck } from './roles/realControlRunner';
import { projectPlayerVisibleTrace } from './trace/projectPlayerVisibleTrace';
import { captureSourceFingerprint } from './sourceFingerprint';
import { applyHumanDecision, evaluateAutomaticTerminal } from './humanDecision';
import type {
  BlindPackage,
  BlindPair,
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

function emptyEvidence(partial: Partial<EvidenceIndex> = {}): EvidenceIndex {
  return {
    sourceFingerprintHash: '',
    manifestHash: '',
    fixtureHash: '',
    seedBundleHash: '',
    rawTraceHashes: {},
    visibleTraceHashes: {},
    mechanicalAuditHash: '',
    blindReviewHash: '',
    redTeamHash: '',
    realControlSummaryHash: null,
    automaticVerdictHash: null,
    humanDecisionHash: null,
    chainOk: false,
    breakReasons: [],
    ...partial,
  };
}

function ensureFreshOutDir(outDir: string): string | null {
  if (existsSync(join(outDir, 'manifest.json')) || existsSync(join(outDir, 'run-summary.json'))) {
    return `refusing to overwrite existing artifact dir ${outDir}`;
  }
  return null;
}

export async function runB0Calibration(options: {
  outRoot?: string;
  runId?: string;
  decision?: 'accept' | 'reject';
  decisionReason?: string;
  /** Test-only: skip Headless real control (still marks blocked unless injected). */
  skipRealControl?: boolean;
  /** Test-only fingerprint overrides. */
  fingerprintLiveHeadSha?: string;
  fingerprintLiveBranch?: string;
}): Promise<B0RunResult> {
  const runId = options.runId ?? `b0-${Date.now()}-${randomBytes(3).toString('hex')}`;
  const outDir = join(options.outRoot ?? '.tmp/b0', runId);
  const overwriteError = ensureFreshOutDir(outDir);
  if (overwriteError) {
    const evidence = emptyEvidence({ breakReasons: [overwriteError] });
    const automatic = { suggested: 'blocked' as const, reasons: [overwriteError] };
    return { runId, outDir, state: 'blocked', terminalVerdict: 'blocked', evidence, automatic };
  }

  mkdirSync(join(outDir, 'raw-traces'), { recursive: true });
  mkdirSync(join(outDir, 'player-visible-traces'), { recursive: true });
  mkdirSync(join(outDir, 'controller-private'), { recursive: true });
  mkdirSync(join(outDir, 'fixture-set'), { recursive: true });

  const fingerprint = captureSourceFingerprint({
    liveHeadSha: options.fingerprintLiveHeadSha,
    liveBranch: options.fingerprintLiveBranch,
  });
  const labels = buildSealedLabels();
  let experiment = sealExperiment({
    runId,
    labels,
    fingerprint,
  });

  writeJson(join(outDir, 'manifest.json'), experiment.manifest);
  writeJson(join(outDir, 'controller-private', 'labels.json'), experiment.privateStore.labels);
  writeJson(join(outDir, 'controller-private', 'abMap.json'), experiment.privateStore.abMap);
  writeJson(join(outDir, 'seed-bundle.json'), experiment.seedBundle);

  const registry = loadFixtureRegistry();
  writeJson(join(outDir, 'fixture-set', 'registry.json'), registry);

  if (!fingerprint.matches) {
    const reasons = fingerprint.mismatchReasons.map(r => `source freeze: ${r}`);
    const evidence = emptyEvidence({
      sourceFingerprintHash: stableJsonHash(fingerprint),
      manifestHash: stableJsonHash(experiment.manifest),
      fixtureHash: experiment.manifest.fixtureSetFingerprint,
      seedBundleHash: experiment.manifest.seedBundleFingerprint,
      breakReasons: reasons,
    });
    const automatic = { suggested: 'blocked' as const, reasons };
    writeJson(join(outDir, 'evidence-index.json'), evidence);
    writeJson(join(outDir, 'automatic-suggestion.json'), automatic);
    writeJson(join(outDir, 'run-summary.json'), {
      runId,
      state: 'blocked',
      terminalVerdict: 'blocked',
      automatic,
    });
    return { runId, outDir, state: 'blocked', terminalVerdict: 'blocked', evidence, automatic };
  }

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
        seedsExposedToBlind.push(pair.leakedHoldoutSeed);
      }
    }
  }

  experiment = { ...experiment, state: advance(experiment.state, 'simulated') };

  const rawTraceHashes: Record<string, string> = {};
  const visibleTraceHashes: Record<string, string> = {};
  const mechanical: MechanicalAuditResult[] = [];
  const archivedVisible: Array<{ label: string; visible: B0PlayerVisibleTrace }> = [];
  const projectionFailures: string[] = [];
  const blindPairs: BlindPair[] = [];

  const sampleById = new Map(registry.samples.map(s => [s.id, s]));
  const pairKeyBySampleId = new Map(
    Object.values(experiment.privateStore.abMap).map(m => [m.sampleId, m] as const),
  );

  for (const pair of pairs) {
    const projectedByArm: Partial<Record<'baseline' | 'candidate', B0PlayerVisibleTrace>> = {};
    for (const arm of ['baseline', 'candidate'] as const) {
      const raw = arm === 'baseline' ? pair.baseline : pair.candidate;
      const rawPath = join(outDir, 'raw-traces', `${pair.sampleId}.${arm}.json`);
      writeJson(rawPath, raw);
      rawTraceHashes[`${pair.sampleId}:${arm}`] = sha256Hex(readFileSync(rawPath));

      const projected = projectPlayerVisibleTrace(raw);
      if (!projected.ok) {
        projectionFailures.push(
          `${pair.sampleId}:${arm}:${projected.reason}:${projected.leakedKeys.join(',')}`,
        );
        continue;
      }

      let visible = projected.visible;
      const sampleMeta = sampleById.get(pair.sampleId);
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
      archivedVisible.push({ label: `${pair.sampleId}:${arm}`, visible });
      projectedByArm[arm] = visible;

      if (arm === 'candidate') {
        mechanical.push(auditRawTrace(raw));
      }
    }

    const sampleMeta = sampleById.get(pair.sampleId);
    const mapping = pairKeyBySampleId.get(pair.sampleId);
    if (sampleMeta && mapping && sampleMeta.layer !== 'holdout') {
      const aSteps = projectedByArm[mapping.armA]?.steps ?? [];
      const bSteps = projectedByArm[mapping.armB]?.steps ?? [];
      blindPairs.push({
        pairKey: mapping.pairKey,
        arms: [
          { schemaVersion: 'b0-blind-arm-v1', anonymousKey: `${mapping.pairKey}-A`, steps: aSteps },
          { schemaVersion: 'b0-blind-arm-v1', anonymousKey: `${mapping.pairKey}-B`, steps: bSteps },
        ],
      });
    }
  }

  const blindPackage: BlindPackage = {
    schemaVersion: 'b0-blind-package-v1',
    pairs: blindPairs,
  };
  writeJson(join(outDir, 'blind-package.json'), blindPackage);
  const blindPackageText = stableStringify(blindPackage);
  const blindReview = reviewBlindPackage(blindPackage);

  const redTeam = auditRedTeam({
    proposedPathsBySample,
    visibleTraces: archivedVisible,
    seedsExposedToBlind,
    holdoutSeeds,
    foreignReviewPayloads: foreignPayloads,
    projectionFailures,
    blindPackageText,
    knownSampleIds: registry.samples.map(s => s.id),
  });

  writeJson(join(outDir, 'mechanical-audit.json'), mechanical);
  writeJson(join(outDir, 'blind-review.json'), blindReview);
  writeJson(join(outDir, 'red-team-review.json'), redTeam);

  experiment = { ...experiment, state: advance(experiment.state, 'audited') };

  let realControlSummaryHash: string | null = null;
  let realControlHardKilled = false;
  let realControlBlocked = false;
  if (!options.skipRealControl) {
    const realControl = await runRealControlCheck({ outDir, runId });
    realControlSummaryHash = stableJsonHash(realControl.summary);
    realControlHardKilled = realControl.hardKilled;
    realControlBlocked = realControl.blocked;
  } else {
    realControlBlocked = true;
  }

  const holdoutSamples = registry.samples.filter(s => s.layer === 'holdout');
  const holdoutMissing = holdoutSamples.length === 0;

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
    realControlSummaryHash,
    automaticVerdictHash: null,
    humanDecisionHash: null,
    chainOk: true,
    breakReasons: [],
  };

  if (Object.keys(rawTraceHashes).length === 0) {
    evidence.chainOk = false;
    evidence.breakReasons.push('no raw traces');
  }
  if (realControlSummaryHash == null) {
    evidence.chainOk = false;
    evidence.breakReasons.push('missing real control summary hash');
  }
  if (holdoutMissing) {
    evidence.chainOk = false;
    evidence.breakReasons.push('no holdout samples in frozen registry');
  }
  if (projectionFailures.length > 0 && !redTeam.veto) {
    evidence.chainOk = false;
    evidence.breakReasons.push('projection failures without red-team veto');
  }
  for (const [key, hash] of Object.entries(rawTraceHashes)) {
    const [sampleId, arm] = key.split(':');
    const live = sha256Hex(readFileSync(join(outDir, 'raw-traces', `${sampleId}.${arm}.json`)));
    if (live !== hash) {
      evidence.chainOk = false;
      evidence.breakReasons.push(`raw hash mismatch ${key}`);
    }
  }
  // Blind package must not contain identity field keys.
  for (const token of [
    '"sampleId"',
    '"personaId"',
    '"seed"',
    '"arm"',
    '"knownBadLabel"',
    '"expectedDetections"',
    '"hardKill"',
    '"mechanicalVerdict"',
  ]) {
    if (blindPackageText.includes(token)) {
      evidence.chainOk = false;
      evidence.breakReasons.push(`blind package identity leak token=${token}`);
    }
  }

  if (experiment.state === 'blocked' || !evidence.chainOk) {
    const automatic = {
      suggested: 'blocked' as const,
      reasons: evidence.breakReasons,
    };
    evidence.automaticVerdictHash = stableJsonHash(automatic);
    writeJson(join(outDir, 'evidence-index.json'), evidence);
    writeJson(join(outDir, 'automatic-suggestion.json'), automatic);
    writeJson(join(outDir, 'run-summary.json'), {
      runId,
      state: 'blocked',
      terminalVerdict: 'blocked',
      automatic,
    });
    return {
      runId,
      outDir,
      state: 'blocked',
      terminalVerdict: 'blocked',
      evidence,
      automatic,
    };
  }

  experiment = {
    ...experiment,
    state: advance(experiment.state, 'evidence_checked'),
  };
  experiment = { ...experiment, state: advance(experiment.state, 'awaiting_human') };

  const controlIds = new Set(registry.samples.filter(s => s.kind === 'control').map(s => s.id));
  const controlHardKilled = mechanical.some(m => controlIds.has(m.sampleId) && m.hardKill);

  const knownBadMissed: string[] = [];
  for (const sample of registry.samples.filter(s => s.kind === 'known-bad')) {
    const audit = mechanical.find(m => m.sampleId === sample.id);
    const detected = new Set(audit?.detections.map(d => d.code) ?? []);
    const expected = sample.expectedDetections ?? [];
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
    realControlHardKilled,
    realControlBlocked,
    knownBadMissed,
    holdoutMissing,
    registry,
  });
  evidence.automaticVerdictHash = stableJsonHash(automatic);

  let terminalVerdict: B0RunResult['terminalVerdict'] = 'awaiting_human';
  let state: B0State = experiment.state;

  if (options.decision) {
    const human = applyHumanDecision(
      options.decision,
      automatic,
      options.decisionReason ?? `human ${options.decision}`,
    );
    evidence.humanDecisionHash = stableJsonHash(human);
    writeJson(join(outDir, 'human-decision.json'), human);
    terminalVerdict = human.terminalVerdict;
    state = advance('awaiting_human', human.terminalVerdict);
  } else {
    writeJson(join(outDir, 'automatic-suggestion.json'), automatic);
  }

  writeJson(join(outDir, 'evidence-index.json'), evidence);
  writeJson(join(outDir, 'run-summary.json'), {
    runId,
    state,
    terminalVerdict,
    automatic,
    note: 'B0 passed does not authorize B1, formal config changes, auto-merge, or release',
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

const isMain =
  process.argv[1] &&
  existsSync(process.argv[1]) &&
  (process.argv[1].endsWith('runB0.ts') || process.argv[1].includes('/runB0.'));

if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  runB0Calibration(args)
    .then(result => {
      console.log(
        JSON.stringify(
          {
            runId: result.runId,
            outDir: result.outDir,
            state: result.state,
            terminalVerdict: result.terminalVerdict,
            automatic: result.automatic,
          },
          null,
          2,
        ),
      );
      if (result.terminalVerdict === 'blocked' || result.terminalVerdict === 'failed') {
        process.exitCode = 1;
      }
    })
    .catch(err => {
      console.error(err);
      process.exitCode = 1;
    });
}
