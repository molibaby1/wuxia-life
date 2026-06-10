import { runExpansionWave } from '../p22/validationSlices';
import { runArchetypeDifferentiationSlice, runPacingDifferentiationSlice } from '../p20/validationSlices';
import type { ExperienceAcceptanceValidationMatrix } from '../narrative/profile/types';
import { buildExperienceAcceptanceMatrix } from './validationMatrix';

export interface P23FullLifeOperationResult {
  generatedAt: string;
  weakDimensionImproved: boolean;
  lowValueRedirected: boolean;
  indicatorChangedDirection: boolean;
  waveDecision: 'pass' | 'warning' | 'fail';
  cases: Array<{ caseId: string; description: string; passed: boolean }>;
}

export function runBoundedFullLifeOperation(
  matrix: ExperienceAcceptanceValidationMatrix = buildExperienceAcceptanceMatrix(),
): P23FullLifeOperationResult {
  const liveSamples = matrix.liveBalanceSamples;
  const p22Wave = runExpansionWave();
  const archetype = runArchetypeDifferentiationSlice();
  const pacing = runPacingDifferentiationSlice();

  const fullLifeSample = liveSamples.find(s => s.waveClass === 'full_life_operation');
  const redirectSample = liveSamples.find(s => s.waveClass === 'tuning_redirection');
  const lowValueSample = liveSamples.find(s => s.waveClass === 'low_value_detection');

  const weakDimensionImproved =
    matrix.rows.some(r => r.weakAreaImproved) &&
    (fullLifeSample?.passed ?? false);
  const lowValueRedirected =
    (lowValueSample?.passed ?? false) && (redirectSample?.passed ?? false);
  const indicatorChangedDirection =
    matrix.summary.tuningRedirections >= 1 &&
    redirectSample?.passed === true &&
    redirectSample?.redirected === true;

  const cases = [
    {
      caseId: 'early_mid_late_endgame_surfaces',
      description: 'Bounded wave covers archetype, pacing, payoff, and legacy/endgame via matrix rows',
      passed: matrix.rows.length >= 7 && matrix.summary.baselinesPassing >= 3,
    },
    {
      caseId: 'weak_dimension_improved',
      description: 'Previously weak experience dimension becomes measurably stronger',
      passed: weakDimensionImproved,
    },
    {
      caseId: 'low_value_redirected',
      description: 'Low-value volume wave detected and tuning redirected',
      passed: lowValueRedirected,
    },
    {
      caseId: 'indicator_changed_direction',
      description: 'Long-term balance indicators changed chosen tuning direction',
      passed: indicatorChangedDirection,
    },
    {
      caseId: 'p22_upstream_wave',
      description: 'P22 expansion wave remains compatible upstream signal',
      passed: p22Wave.waveDecision !== 'fail',
    },
    {
      caseId: 'archetype_pacing_differentiation',
      description: 'Archetype and pacing differentiation slices remain healthy',
      passed: archetype.atLeastThreeDistinct && pacing.pacingMeaningfullyDiffers,
    },
  ];

  const passedCount = cases.filter(c => c.passed).length;
  let waveDecision: P23FullLifeOperationResult['waveDecision'] = 'pass';
  if (passedCount < cases.length) waveDecision = 'warning';
  if (passedCount < Math.ceil(cases.length * 0.7)) waveDecision = 'fail';

  return {
    generatedAt: new Date().toISOString(),
    weakDimensionImproved,
    lowValueRedirected,
    indicatorChangedDirection,
    waveDecision,
    cases,
  };
}
