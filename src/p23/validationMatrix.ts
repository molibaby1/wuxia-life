import type { ExperienceAcceptanceValidationMatrix } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { evaluateAllBalanceIndicators } from './balanceIndicators';
import { runAllExperienceComparisons } from './comparisonReporting';
import { evaluateAllExperienceBaselines } from './experienceBaselines';
import { getLiveOpsTuningEvidence } from '../p22/tuningEvidence';
import { runLiveOpsTuningComparisonSlice } from '../p22/validationSlices';
import { runLiveBalanceSample } from './liveBalanceSamples';

export function buildExperienceAcceptanceMatrix(
  profile = getWorldProfile(),
): ExperienceAcceptanceValidationMatrix {
  const baselineScores = evaluateAllExperienceBaselines(profile);
  const comparisonOutcomes = runAllExperienceComparisons(profile);
  const balanceIndicators = evaluateAllBalanceIndicators(profile);
  const liveBalanceCtx = {
    comparisons: comparisonOutcomes,
    indicators: balanceIndicators,
    tuning: runLiveOpsTuningComparisonSlice(),
    evidence: getLiveOpsTuningEvidence(),
  };
  const liveBalanceResults = (profile.liveBalanceWaveSampleConfigs ?? []).map(config =>
    runLiveBalanceSample(config, liveBalanceCtx),
  );

  const dimensions = profile.experienceDimensionConfigs ?? [];
  const rows = dimensions.map(dim => {
    const baseline = baselineScores.find(b => b.dimension === dim.id);
    const comparison = comparisonOutcomes.find(c => c.dimension === dim.id);
    const indicator = balanceIndicators.find(i => i.dimension === dim.id);
    const weakImproved =
      (baseline?.passed ?? false) ||
      (comparison?.passed ?? false) ||
      (indicator?.deltaFromBaseline ?? 0) > 0.02;
    const strongProtected = indicator?.inHealthyRange ?? true;

    return {
      dimension: dim.id,
      baselinePassed: baseline?.passed ?? false,
      comparisonPassed: comparison?.passed ?? false,
      indicatorHealthy: indicator?.inHealthyRange ?? true,
      weakAreaImproved: weakImproved,
      strongAreaProtected: strongProtected,
      detail: [
        baseline ? `baseline Δ=${baseline.scoreDelta.toFixed(3)}` : 'no baseline',
        comparison ? `comparison Δ=${comparison.delta.toFixed(3)}` : 'no comparison',
        indicator ? `indicator=${indicator.currentValue.toFixed(3)}` : 'no indicator',
      ].join('; '),
    };
  });

  const baselinesPassing = baselineScores.filter(b => b.passed).length;
  const comparisonsPassing = comparisonOutcomes.filter(c => c.passed).length;
  const indicatorsHealthy = balanceIndicators.filter(i => i.inHealthyRange).length;
  const lowValueWavesDetected = liveBalanceResults.filter(
    r => r.waveClass === 'low_value_detection' && r.passed,
  ).length;
  const tuningRedirections = liveBalanceResults.filter(
    r => r.waveClass === 'tuning_redirection' && r.passed,
  ).length;

  let decision: ExperienceAcceptanceValidationMatrix['decision'] = 'pass';
  if (baselinesPassing < baselineScores.length || comparisonsPassing < comparisonOutcomes.length) {
    decision = 'warning';
  }
  if (baselinesPassing < Math.ceil(baselineScores.length * 0.75)) {
    decision = 'fail';
  }

  return {
    generatedAt: new Date().toISOString(),
    rows,
    baselineScores,
    comparisonOutcomes,
    balanceIndicators,
    liveBalanceSamples: liveBalanceResults.map(r => ({
      sampleId: r.sampleId,
      waveClass: r.waveClass,
      passed: r.passed,
      detail: r.detail,
      redirected: r.redirected,
    })),
    summary: {
      dimensionCount: dimensions.length,
      baselinesPassing,
      comparisonsPassing,
      indicatorsHealthy,
      lowValueWavesDetected,
      tuningRedirections,
    },
    decision,
  };
}

export function formatAcceptanceMatrixMarkdown(matrix: ExperienceAcceptanceValidationMatrix): string {
  return [
    '# P23 Experience Acceptance Matrix',
    '',
    `- Decision: **${matrix.decision}**`,
    `- Dimensions: ${matrix.summary.dimensionCount}`,
    `- Baselines passing: ${matrix.summary.baselinesPassing}`,
    `- Comparisons passing: ${matrix.summary.comparisonsPassing}`,
    `- Indicators healthy: ${matrix.summary.indicatorsHealthy}`,
    `- Low-value waves detected: ${matrix.summary.lowValueWavesDetected}`,
    `- Tuning redirections: ${matrix.summary.tuningRedirections}`,
    '',
    '## Dimension rows',
    ...matrix.rows.map(
      r =>
        `- **${r.dimension}**: baseline=${r.baselinePassed ? 'PASS' : 'FAIL'}, comparison=${r.comparisonPassed ? 'PASS' : 'FAIL'}, indicator=${r.indicatorHealthy ? 'HEALTHY' : 'OUT'} — ${r.detail}`,
    ),
    '',
    '## Live-balance samples',
    ...matrix.liveBalanceSamples.map(s => `- [${s.passed ? 'PASS' : 'FAIL'}] ${s.sampleId}: ${s.detail}`),
  ].join('\n');
}
