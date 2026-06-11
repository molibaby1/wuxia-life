/**
 * P24 playtest calibration and RC closure tests.
 */

import {
  WUXIA_ALIGNMENT_INDICATOR_CONFIGS,
  WUXIA_PLAYTEST_CALIBRATION_BASELINE_CONFIGS,
  WUXIA_PLAYTEST_COMPARISON_SAMPLE_CONFIGS,
  WUXIA_PLAYTEST_DIMENSION_CONFIGS,
  WUXIA_PLAYTEST_FEEDBACK_SCHEMA,
  WUXIA_RC_COMPARISON_SAMPLE_CONFIGS,
  WUXIA_RC_EVALUATION_SCHEMA,
} from '../src/narrative/profile/wuxiaPlaytestCalibrationSurfaces';
import { RC_RELEASE_READINESS_STATES } from '../src/narrative/profile/types';
import { getWorldProfile, WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { evaluateAllAlignmentIndicators } from '../src/p24/alignmentIndicators';
import { evaluateAllPlaytestBaselines } from '../src/p24/calibrationBaselines';
import { runAllPlaytestComparisons } from '../src/p24/comparisonReporting';
import { evaluateRcCandidate } from '../src/p24/rcEvaluation';
import { runAllRcComparisonSamples } from '../src/p24/rcSamples';
import { assembleP24GateReport, profileHasP24Sections } from '../src/p24/reportBuilder';
import { matrixComparisonsPass } from '../src/p24/validationMatrix';
import { scorePlaytestSlice } from '../src/p24/sliceFixtures';
import { buildPlaytestCalibrationMatrix } from '../src/p24/validationMatrix';
import { runBoundedRcCalibrationWave, runFullRcClosurePass } from '../src/p24/validationSlices';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testProfileSections(): void {
  assert(profileHasP24Sections(WUXIA_WORLD_PROFILE), 'P24 profile sections must be present');
  assert(WUXIA_PLAYTEST_DIMENSION_CONFIGS.length >= 6, 'playtest dimensions');
  assert(WUXIA_PLAYTEST_CALIBRATION_BASELINE_CONFIGS.length >= 6, 'calibration baselines');
  assert(WUXIA_PLAYTEST_COMPARISON_SAMPLE_CONFIGS.length >= 6, 'comparison samples');
  assert(WUXIA_ALIGNMENT_INDICATOR_CONFIGS.length >= 5, 'alignment indicators');
  assert(WUXIA_RC_COMPARISON_SAMPLE_CONFIGS.length >= 3, 'RC samples');
  assert(!!WUXIA_PLAYTEST_FEEDBACK_SCHEMA.fields.length, 'playtest feedback schema');
  assert(!!WUXIA_RC_EVALUATION_SCHEMA.fields.length, 'RC evaluation schema');
}

function testSchemas(): void {
  const profile = getWorldProfile();
  assert(profile.playtestFeedbackSchema?.schemaVersion === 'p24-v1', 'feedback schema version');
  assert(profile.rcEvaluationSchema?.releaseReadinessThresholds.minInternalHealth > 0, 'RC thresholds');

  const rc = evaluateRcCandidate({
    buildId: 'test-build',
    candidateLabel: 'test',
    internalHealthScore: 0.8,
    externalAppealScore: 0.35,
  });
  assert(rc.biasDirection === 'overestimate', 'overestimate bias');
  assert(rc.releaseReadiness === 'redirect', 'redirect on overestimate');
  assert(
    profile.rcEvaluationSchema?.fields
      .find(f => f.fieldId === 'releaseReadiness')
      ?.enumValues?.every(v => (RC_RELEASE_READINESS_STATES as readonly string[]).includes(v)),
    'releaseReadiness schema matches evaluator states',
  );
  assert((profile.alignmentComparisonConfigs?.length ?? 0) >= 5, 'alignment comparison configs');
}

function testBaselinesDistinguishSlices(): void {
  const baselines = evaluateAllPlaytestBaselines();
  assert(baselines.length >= 6, 'baseline count');
  for (const baseline of baselines) {
    assert(
      baseline.orderingCorrect,
      `${baseline.baselineId} ordering: ${baseline.strongerScore} vs ${baseline.weakerScore}`,
    );
    assert(baseline.passed, `${baseline.baselineId} delta ${baseline.scoreDelta}`);
  }
}

function testPlaytestSliceScoring(): void {
  const strong = scorePlaytestSlice('p20_slice_origin_early', 'first_run_readability');
  const weak = scorePlaytestSlice('p20_slice_hermit_closure', 'first_run_readability');
  assert(strong > weak, `first-run: ${strong} vs ${weak}`);
}

function testComparisons(): void {
  const comparisons = runAllPlaytestComparisons();
  assert(comparisons.length >= 6, 'comparison count');
  assert(comparisons.every(c => c.distinguishesStrongerWeaker), `comparisons: ${JSON.stringify(comparisons)}`);
  const early = comparisons.filter(c => c.lifePhaseBand === 'early');
  const mid = comparisons.filter(c => c.lifePhaseBand === 'mid');
  const late = comparisons.filter(c => c.lifePhaseBand === 'late_end');
  assert(early.length >= 1, 'early band sample');
  assert(mid.length >= 2, 'mid band samples');
  assert(late.length >= 2, 'late/end band samples');
}

function testAlignmentIndicators(): void {
  const indicators = evaluateAllAlignmentIndicators();
  assert(indicators.length >= 5, 'indicator count');
  assert(indicators.every(i => i.currentValue >= 0 && i.currentValue <= 1), 'indicator values bounded');
}

function testRcSamples(): void {
  const samples = runAllRcComparisonSamples();
  assert(samples.length >= 3, 'RC sample count');
  const weakOutward = samples.find(s => s.sampleClass === 'weak_outward_experience');
  const redirect = samples.find(s => s.sampleClass === 'feedback_redirection');
  const fix = samples.find(s => s.sampleClass === 'targeted_fix_validation');
  assert(!!weakOutward?.passed, `weak outward: ${weakOutward?.detail}`);
  assert(!!redirect?.passed, `redirect: ${redirect?.detail}`);
  assert(redirect?.redirected === true, 'redirect chain');
  assert(!!fix?.passed, `targeted fix: ${fix?.detail}`);
  assert(fix?.fixValidated === true, 'fix validated');
  const fixRc = evaluateRcCandidate({
    buildId: 'rc-p24_rc_targeted_fix',
    candidateLabel: fix?.sampleId ?? 'targeted_fix',
    internalHealthScore: fix?.internalHealthScore ?? 0,
    externalAppealScore: fix?.externalAppealScore ?? 0,
  });
  assert(fixRc.releaseReadiness === 'ship', 'targeted fix must reach ship readiness');
}

function testValidationMatrix(): void {
  const matrix = buildPlaytestCalibrationMatrix();
  assert(matrix.rows.length >= 6, 'matrix rows');
  assert(matrix.summary.baselinesPassing >= 6, 'baselines in matrix');
  assert(matrix.summary.comparisonsPassing >= 6, 'comparison samples passing');
  assert(matrix.summary.comparisonsRequired === matrix.rows.length, 'comparisons required = dimensions');
  assert(matrix.summary.comparisonsCovered === matrix.summary.comparisonsRequired, 'all dimensions covered');
  assert(matrix.summary.comparisonsDimensionPassing === matrix.summary.comparisonsRequired, 'all dimensions passing');
  assert(matrix.decision !== 'fail', `matrix decision ${matrix.decision}`);
}

function testComparisonCoverageConsistency(): void {
  const matrix = buildPlaytestCalibrationMatrix();
  const routeRow = matrix.rows.find(r => r.dimension === 'route_differentiation');
  const payoffRow = matrix.rows.find(r => r.dimension === 'late_game_payoff');
  assert(!!routeRow && routeRow.comparisonCovered, 'route_differentiation must have comparison sample');
  assert(!!payoffRow && payoffRow.comparisonCovered, 'late_game_payoff must have comparison sample');
  assert(!!routeRow?.comparisonPassed, 'route row must pass');
  assert(!!payoffRow?.comparisonPassed, 'payoff row must pass');
  assert(matrix.summary.comparisonCoverageComplete, 'coverage must be complete on current profile');
  assert(matrix.summary.comparisonsCovered === matrix.summary.comparisonsRequired, 'covered = required');
  assert(matrixComparisonsPass(matrix), 'matrixComparisonsPass must be true when all dimensions pass');

  const gate = assembleP24GateReport(WUXIA_WORLD_PROFILE);
  assert(gate.validation.comparisonsPass, 'gate comparisonsPass must match row-level passes');
  assert(gate.decision === 'pass', `gate must pass after coverage closure, got ${gate.decision}`);
  assert(
    !gate.warnings.some(w => w.includes('route_differentiation') || w.includes('coverage incomplete')),
    `coverage warning should be removed, got: ${gate.warnings.join('; ')}`,
  );
}

function testRcCalibrationWave(): void {
  const wave = runBoundedRcCalibrationWave();
  assert(wave.weakDimensionImproved, 'weak dimension improved');
  assert(wave.internalMissedPlayerProblem, 'internal missed player problem');
  assert(wave.rcRedirectedFix, 'RC redirected fix');
  assert(wave.waveDecision !== 'fail', `RC wave ${wave.waveDecision}`);
}

function testFullRcClosure(): void {
  const matrix = buildPlaytestCalibrationMatrix();
  const closure = runFullRcClosurePass(matrix);
  assert(closure.alignedDecisionShare >= 0.5, 'aligned decision share');
  assert(closure.falsePositiveCasesReduced, 'false positive reduced');
  assert(closure.strongDimensionsPreserved, 'strong dimensions preserved when comparison coverage complete');
  assert(closure.closureDecision !== 'fail', `closure ${closure.closureDecision}`);
}

function testGateReport(): void {
  const matrix = buildPlaytestCalibrationMatrix();
  const gate = assembleP24GateReport(WUXIA_WORLD_PROFILE);
  assert(gate.decision !== 'fail', `gate decision ${gate.decision}: ${gate.warnings.join('; ')}`);
  assert(gate.validation.baselinesPass, 'baselines pass');
  assert(gate.validation.comparisonsPass === matrixComparisonsPass(matrix), 'comparisonsPass aligns with matrix rows');
  assert(gate.validation.falsePositiveDetectionPass, 'false positive detection');
  assert(gate.validation.redirectionPass, 'redirection pass');
  assert(gate.validation.targetedFixPass, 'targeted fix pass');
}

function main(): void {
  testProfileSections();
  testSchemas();
  testBaselinesDistinguishSlices();
  testPlaytestSliceScoring();
  testComparisons();
  testAlignmentIndicators();
  testRcSamples();
  testValidationMatrix();
  testComparisonCoverageConsistency();
  testRcCalibrationWave();
  testFullRcClosure();
  testGateReport();
  console.log('p24PlaytestCalibrationTests: all passed');
}

main();
