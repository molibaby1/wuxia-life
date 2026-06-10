/**
 * P22 content library expansion and live-ops baseline tests.
 */

import {
  WUXIA_BASELINE_POOL_CONFIGS,
  WUXIA_LIBRARY_COVERAGE_EXPECTATIONS,
  WUXIA_LIVE_OPS_TUNING_SAMPLE_CONFIGS,
  WUXIA_LIVE_OPS_WAVE_CONFIGS,
} from '../src/narrative/profile/wuxiaContentLibrarySurfaces';
import { getWorldProfile, WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { buildLibraryCoverageMatrix } from '../src/p22/coverageMatrix';
import { evaluateAllPoolCoverage } from '../src/p22/coverageEvaluation';
import { assembleP22GateReport, profileHasP22Sections } from '../src/p22/reportBuilder';
import { detectWeakSpots, distinguishThinFromRepetitive } from '../src/p22/weakSpotDetection';
import {
  runExpansionValidations,
  runExpansionWave,
  runLiveOpsTuningComparisonSlice,
  runWaveValidations,
} from '../src/p22/validationSlices';
import { gameEngine } from '../src/core/GameEngineIntegration';
import { getP22ExpansionEventById } from '../src/p22/p22ContentCatalog';
import {
  applyLiveOpsActivationToState,
  P22_LIVE_OPS_ACTIVE_FLAG,
  shouldActivateLiveOpsForOrigin,
} from '../src/p22/liveOpsActivation';
import { detectOffTargetLiveOpsTuning, getLiveOpsTuningEvidence } from '../src/p22/tuningEvidence';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testProfileSections(): void {
  assert(profileHasP22Sections(WUXIA_WORLD_PROFILE), 'P22 profile sections must be present');
  assert(WUXIA_BASELINE_POOL_CONFIGS.length >= 3, 'baseline pools');
  assert(WUXIA_LIBRARY_COVERAGE_EXPECTATIONS.length >= 3, 'coverage expectations');
  assert(WUXIA_LIVE_OPS_WAVE_CONFIGS.length >= 3, 'live-ops waves');
  assert(WUXIA_LIVE_OPS_TUNING_SAMPLE_CONFIGS.length >= 3, 'live-ops tuning samples');
}

function testExpansionEventsLoaded(): void {
  const ids = [
    'p22_origin_frontier_orphan',
    'p22_childhood_street_shaping',
    'p22_early_wealth_route_fork',
    'p22_relationship_mentor_obligation',
    'p22_faction_sect_continuation',
    'p22_legacy_teaching_succession',
    'p22_endgame_hermit_memory',
    'p22_wave_early_frontier_growth',
    'p22_wave_mid_merchant_identity',
    'p22_wave_late_fade_closure',
  ];
  for (const id of ids) {
    assert(!!getP22ExpansionEventById(id), `missing ${id}`);
  }
  const slices = runExpansionValidations();
  assert(slices.every(s => s.passed), `expansions: ${JSON.stringify(slices)}`);
}

function testCoverageAndWeakSpots(): void {
  const snapshots = evaluateAllPoolCoverage();
  assert(snapshots.length >= 5, 'pool snapshots');
  const weakSpots = detectWeakSpots();
  assert(weakSpots.length > 0, 'weak spots should be detectable');
  assert(
    new Set(weakSpots.map(f => f.findingKind)).size >= 1,
    'weak spots should report typed findings',
  );
  const thinRep = distinguishThinFromRepetitive('p22_pool_early_route');
  assert(!!thinRep, 'early route pool snapshot');
  assert(typeof thinRep.thinCoverage === 'boolean', 'thin coverage dimension');
  assert(typeof thinRep.repetitiveCoverage === 'boolean', 'repetitive coverage dimension');
}

function testCoverageMatrix(): void {
  const matrix = buildLibraryCoverageMatrix();
  assert(matrix.rows.length >= 5, 'matrix rows');
  assert(matrix.summary.expansionEventCount >= 10, 'p22 event count');
  assert(matrix.decision !== 'fail', `matrix decision ${matrix.decision}`);
}

function testWavesAndTuning(): void {
  const waves = runWaveValidations();
  assert(waves.length >= 3, 'waves');
  assert(waves.every(w => w.passed), `waves: ${JSON.stringify(waves)}`);
  const tuning = runLiveOpsTuningComparisonSlice();
  assert(tuning.allThreeCovered, `tuning: ${JSON.stringify(tuning)}`);
  const evidence = getLiveOpsTuningEvidence();
  assert(evidence.wealthPathAffinity >= 1.0, 'wealth path affinity tuned');
  assert(evidence.hermitClosureSpacing <= 1.2, 'hermit closure spacing tuned');
  assert(evidence.wealthBaseWeight >= 1.1, 'wealth base weight sample tuned');
  assert(!detectOffTargetLiveOpsTuning('p22_tune_wealth_archetype_coverage', evidence.wealthBaseWeight), 'on-target tuning');
}

function testExpansionWave(): void {
  const wave = runExpansionWave();
  assert(wave.weakAreaImproved, 'weak area improved');
  assert(wave.tuningStabilized, 'tuning stabilized');
  assert(wave.validationCaughtDuplication, 'validation caught drift');
  assert(wave.waveDecision !== 'fail', `wave decision ${wave.waveDecision}`);
}

function testGateReport(): void {
  const gate = assembleP22GateReport(getWorldProfile());
  assert(gate.decision !== 'fail', `gate ${gate.decision} warnings=${gate.warnings.join(';')}`);
  assert(gate.validation.expansionsPass, 'expansions pass');
  assert(gate.validation.wavesPass, 'waves pass');
  assert(gate.validation.tuningComparisonPass, 'tuning pass');
}

function testLiveOpsActivation(): void {
  assert(shouldActivateLiveOpsForOrigin('streetborn'), 'streetborn activates');
  assert(shouldActivateLiveOpsForOrigin('merchant_house'), 'merchant activates');
  assert(!shouldActivateLiveOpsForOrigin('martial_family'), 'martial does not activate');
  assert(!shouldActivateLiveOpsForOrigin('scholar_house'), 'scholar does not activate');

  const activated = applyLiveOpsActivationToState(
    {
      flags: { origin_streetborn: true },
      player: {
        flags: { origin_streetborn: true },
        traitProfile: { origin: 'streetborn' },
      },
    } as ReturnType<typeof gameEngine.getGameState>,
    { origin: 'streetborn' },
  );
  assert(activated.flags[P22_LIVE_OPS_ACTIVE_FLAG] === true, 'weak origin sets activation flag');

  const inactive = applyLiveOpsActivationToState(
    {
      flags: {},
      player: { flags: {}, traitProfile: { origin: 'martial_family' } },
    } as ReturnType<typeof gameEngine.getGameState>,
    { origin: 'martial_family' },
  );
  assert(!inactive.flags[P22_LIVE_OPS_ACTIVE_FLAG], 'strong origin skips activation');
}

function testLiveOpsSelectionGate(): void {
  gameEngine.resetGame();
  assert(
    !gameEngine.getAvailableEvents(1).some(event => event.id.startsWith('p22_')),
    'p22 events excluded without activation',
  );

  const base = gameEngine.getGameState();
  gameEngine.loadGameState({
    ...base,
    flags: { p22_live_ops_active: true, origin_poor_family: true },
    player: {
      ...base.player,
      age: 1,
      flags: { p22_live_ops_active: true, origin_poor_family: true },
    },
  });
  assert(
    gameEngine.getAvailableEvents(1).some(event => event.id === 'p22_origin_frontier_orphan'),
    'p22 origin sample selectable when activated with matching origin flags',
  );
}

function main(): void {
  testProfileSections();
  testExpansionEventsLoaded();
  testCoverageAndWeakSpots();
  testCoverageMatrix();
  testWavesAndTuning();
  testExpansionWave();
  testGateReport();
  testLiveOpsActivation();
  testLiveOpsSelectionGate();
  console.log('✔ p22ContentLibraryTests passed');
}

main();
