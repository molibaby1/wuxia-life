/**
 * P23 experience acceptance and live-balance closure tests.
 */

import {
  WUXIA_EXPERIENCE_ACCEPTANCE_BASELINE_CONFIGS,
  WUXIA_EXPERIENCE_COMPARISON_SAMPLE_CONFIGS,
  WUXIA_EXPERIENCE_DIMENSION_CONFIGS,
  WUXIA_LIVE_BALANCE_WAVE_SAMPLE_CONFIGS,
  WUXIA_LONG_TERM_BALANCE_INDICATOR_CONFIGS,
} from '../src/narrative/profile/wuxiaExperienceAcceptanceSurfaces';
import { getWorldProfile, WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { evaluateAllBalanceIndicators } from '../src/p23/balanceIndicators';
import { runAllExperienceComparisons } from '../src/p23/comparisonReporting';
import { evaluateAllExperienceBaselines } from '../src/p23/experienceBaselines';
import { runAllLiveBalanceSamples } from '../src/p23/liveBalanceSamples';
import { assembleP23GateReport, profileHasP23Sections } from '../src/p23/reportBuilder';
import { scoreSliceExperience } from '../src/p23/sliceFixtures';
import { buildExperienceAcceptanceMatrix } from '../src/p23/validationMatrix';
import { runBoundedFullLifeOperation } from '../src/p23/validationSlices';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testProfileSections(): void {
  assert(profileHasP23Sections(WUXIA_WORLD_PROFILE), 'P23 profile sections must be present');
  assert(WUXIA_EXPERIENCE_DIMENSION_CONFIGS.length >= 7, 'experience dimensions');
  assert(WUXIA_EXPERIENCE_ACCEPTANCE_BASELINE_CONFIGS.length >= 4, 'acceptance baselines');
  assert(WUXIA_EXPERIENCE_COMPARISON_SAMPLE_CONFIGS.length >= 4, 'comparison samples');
  assert(WUXIA_LONG_TERM_BALANCE_INDICATOR_CONFIGS.length >= 5, 'balance indicators');
  assert(WUXIA_LIVE_BALANCE_WAVE_SAMPLE_CONFIGS.length >= 4, 'live-balance samples');
}

function testBaselinesDistinguishSlices(): void {
  const baselines = evaluateAllExperienceBaselines();
  assert(baselines.length >= 4, 'baseline count');
  for (const baseline of baselines) {
    assert(baseline.orderingCorrect, `${baseline.baselineId} ordering: ${baseline.strongerScore} vs ${baseline.weakerScore}`);
    assert(baseline.passed, `${baseline.baselineId} delta ${baseline.scoreDelta}`);
  }
}

function testComparisons(): void {
  const comparisons = runAllExperienceComparisons();
  assert(comparisons.length >= 4, 'comparison count');
  assert(comparisons.every(c => c.distinguishesStrongerWeaker), `comparisons: ${JSON.stringify(comparisons)}`);
  const archetype = comparisons.find(c => c.sampleId === 'p23_cmp_archetype_replay');
  const payoff = comparisons.find(c => c.sampleId === 'p23_cmp_mid_late_payoff');
  const legacy = comparisons.find(c => c.sampleId === 'p23_cmp_legacy_endgame');
  assert(!!archetype?.passed, 'archetype comparison');
  assert(!!payoff?.passed, 'payoff comparison');
  assert(!!legacy?.passed, 'legacy comparison');
}

function testBalanceIndicators(): void {
  const indicators = evaluateAllBalanceIndicators();
  assert(indicators.length >= 5, 'indicator count');
  assert(indicators.every(i => i.currentValue >= 0 && i.currentValue <= 1.5), 'indicator values bounded');
  assert(indicators.filter(i => i.inHealthyRange).length >= 4, 'most indicators healthy');
}

function testLiveBalanceSamples(): void {
  const samples = runAllLiveBalanceSamples();
  assert(samples.length >= 4, 'live-balance sample count');
  const highValue = samples.find(s => s.waveClass === 'high_value_tuning');
  const lowValue = samples.find(s => s.waveClass === 'low_value_detection');
  const redirect = samples.find(s => s.waveClass === 'tuning_redirection');
  const fullLife = samples.find(s => s.waveClass === 'full_life_operation');
  assert(!!highValue?.passed, `high-value tuning: ${highValue?.detail}`);
  assert(!!lowValue?.passed, `low-value detection: ${lowValue?.detail}`);
  assert(
    (lowValue?.experienceDeltaObserved ?? 1) < 0.01,
    'low-value sample must observe sub-threshold experience gain',
  );
  assert(!!redirect?.passed, `tuning redirect: ${redirect?.detail}`);
  assert(redirect?.redirected === true, 'tuning redirect must chain from detected low-value wave');
  assert(!!fullLife?.passed, `full-life operation: ${fullLife?.detail}`);
}

function testValidationMatrix(): void {
  const matrix = buildExperienceAcceptanceMatrix();
  assert(matrix.rows.length >= 7, 'matrix rows');
  assert(matrix.summary.baselinesPassing >= 4, 'baselines in matrix');
  assert(matrix.summary.comparisonsPassing >= 4, 'comparisons in matrix');
  assert(matrix.decision !== 'fail', `matrix decision ${matrix.decision}`);
}

function testFullLifeOperation(): void {
  const op = runBoundedFullLifeOperation();
  assert(op.weakDimensionImproved, 'weak dimension improved');
  assert(op.lowValueRedirected, 'low value redirected');
  assert(op.indicatorChangedDirection, 'indicator changed direction');
  assert(op.waveDecision !== 'fail', `full-life wave ${op.waveDecision}`);
}

function testGateReport(): void {
  const gate = assembleP23GateReport(WUXIA_WORLD_PROFILE);
  assert(gate.decision !== 'fail', `gate decision ${gate.decision}: ${gate.warnings.join('; ')}`);
  assert(gate.validation.baselinesPass, 'baselines pass');
  assert(gate.validation.comparisonsPass, 'comparisons pass');
  assert(gate.validation.lowValueDetectionPass, 'low-value detection');
  assert(gate.validation.tuningRedirectionPass, 'tuning redirection');
}

function testSliceScoresSanity(): void {
  const midlife = scoreSliceExperience('p20_slice_midlife_consequence', 'archetype_strength');
  const origin = scoreSliceExperience('p20_slice_origin_early', 'archetype_strength');
  assert(midlife > origin, `midlife ${midlife} > origin ${origin}`);
  const scholar = scoreSliceExperience('p20_slice_legacy_endgame', 'legacy_resonance');
  const hermitLegacy = scoreSliceExperience('p20_slice_hermit_closure', 'legacy_resonance');
  assert(scholar > hermitLegacy, `scholar legacy ${scholar} > hermit ${hermitLegacy}`);
}

function main(): void {
  testProfileSections();
  testSliceScoresSanity();
  testBaselinesDistinguishSlices();
  testComparisons();
  testBalanceIndicators();
  testLiveBalanceSamples();
  testValidationMatrix();
  testFullLifeOperation();
  testGateReport();
  assert(getWorldProfile().experienceDimensionConfigs?.length === 7, 'profile wired');
  console.log('✔ p23ExperienceAcceptanceTests passed');
}

main();
