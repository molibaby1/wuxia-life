import type { PlaytestCalibrationValidationMatrix } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { evaluateAllAlignmentIndicators } from './alignmentIndicators';
import { evaluateAllPlaytestBaselines } from './calibrationBaselines';
import { runAllPlaytestComparisons } from './comparisonReporting';
import { runAllRcComparisonSamples } from './rcSamples';

/** Row-level pass: every required dimension has a passing comparison sample. */
export function matrixComparisonsPass(matrix: PlaytestCalibrationValidationMatrix): boolean {
  return matrix.rows.every(r => r.comparisonPassed);
}

export function buildPlaytestCalibrationMatrix(
  profile = getWorldProfile(),
): PlaytestCalibrationValidationMatrix {
  const baselineScores = evaluateAllPlaytestBaselines(profile);
  const comparisonOutcomes = runAllPlaytestComparisons(profile);
  const alignmentIndicators = evaluateAllAlignmentIndicators(profile);
  const rcComparisonResults = runAllRcComparisonSamples(profile);

  const dimensions = profile.playtestDimensionConfigs ?? [];
  const rows = dimensions.map(dim => {
    const baseline = baselineScores.find(b => b.dimension === dim.id);
    const comparison = comparisonOutcomes.find(c => c.dimension === dim.id);
    const comparisonCovered = comparison !== undefined;
    const indicator = alignmentIndicators.find(i => i.dimension === dim.id);
    const rcSample = rcComparisonResults.find(r => r.targetDimension === dim.id);

    return {
      dimension: dim.id,
      baselinePassed: baseline?.passed ?? false,
      comparisonCovered,
      comparisonPassed: comparisonCovered && comparison.passed,
      indicatorAligned: indicator
        ? indicator.biasDirection === 'aligned' || indicator.inHealthyRange
        : true,
      rcSamplePassed: rcSample?.passed ?? true,
      detail: [
        baseline ? `baseline Δ=${baseline.scoreDelta.toFixed(3)}` : 'no baseline',
        comparison
          ? `comparison Δ=${comparison.delta.toFixed(3)}`
          : 'no comparison sample (required)',
        indicator ? `gap=${indicator.alignmentGap.toFixed(3)} ${indicator.biasDirection}` : 'no indicator',
      ].join('; '),
    };
  });

  const baselinesPassing = baselineScores.filter(b => b.passed).length;
  const comparisonsPassing = comparisonOutcomes.filter(c => c.passed).length;
  const comparisonsRequired = dimensions.length;
  const comparisonsCovered = rows.filter(r => r.comparisonCovered).length;
  const comparisonCoverageComplete = comparisonsCovered === comparisonsRequired;
  const comparisonsDimensionPassing = rows.filter(r => r.comparisonPassed).length;
  const comparisonsHealthy =
    comparisonCoverageComplete && comparisonOutcomes.every(c => c.passed);
  const indicatorsAligned = alignmentIndicators.filter(
    i => i.biasDirection === 'aligned' || i.inHealthyRange,
  ).length;
  const rcSamplesPassing = rcComparisonResults.filter(r => r.passed).length;
  const falsePositiveDetected = rcComparisonResults.filter(
    r => r.sampleClass === 'weak_outward_experience' && r.passed,
  ).length;
  const redirectionsValidated = rcComparisonResults.filter(
    r => r.sampleClass === 'feedback_redirection' && r.passed,
  ).length;
  const targetedFixesValidated = rcComparisonResults.filter(
    r => r.sampleClass === 'targeted_fix_validation' && r.passed,
  ).length;

  let decision: PlaytestCalibrationValidationMatrix['decision'] = 'pass';
  if (baselinesPassing < baselineScores.length || !comparisonsHealthy) {
    decision = 'warning';
  }
  if (baselinesPassing < Math.ceil(baselineScores.length * 0.75)) {
    decision = 'fail';
  }
  if (!comparisonCoverageComplete && comparisonsCovered < Math.ceil(comparisonsRequired * 0.5)) {
    decision = 'fail';
  }

  return {
    generatedAt: new Date().toISOString(),
    rows,
    baselineScores,
    comparisonOutcomes,
    alignmentIndicators,
    rcComparisonResults,
    summary: {
      dimensionCount: dimensions.length,
      baselinesPassing,
      comparisonsPassing,
      comparisonsRequired,
      comparisonsCovered,
      comparisonCoverageComplete,
      comparisonsDimensionPassing,
      indicatorsAligned,
      rcSamplesPassing,
      falsePositiveDetected,
      redirectionsValidated,
      targetedFixesValidated,
    },
    decision,
  };
}

export function formatCalibrationMatrixMarkdown(
  matrix: PlaytestCalibrationValidationMatrix,
): string {
  return [
    '# P24 Playtest Calibration Matrix',
    '',
    `- Decision: **${matrix.decision}**`,
    `- Dimensions: ${matrix.summary.dimensionCount}`,
    `- Baselines passing: ${matrix.summary.baselinesPassing}`,
    `- Comparison samples passing: ${matrix.summary.comparisonsPassing}/${matrix.comparisonOutcomes.length}`,
    `- Comparison dimension coverage: ${matrix.summary.comparisonsCovered}/${matrix.summary.comparisonsRequired} (${matrix.summary.comparisonCoverageComplete ? 'complete' : 'incomplete'})`,
    `- Comparison dimensions passing: ${matrix.summary.comparisonsDimensionPassing}/${matrix.summary.comparisonsRequired}`,
    `- Indicators aligned/healthy: ${matrix.summary.indicatorsAligned}`,
    `- RC samples passing: ${matrix.summary.rcSamplesPassing}`,
    `- False-positive detected: ${matrix.summary.falsePositiveDetected}`,
    `- Redirections validated: ${matrix.summary.redirectionsValidated}`,
    `- Targeted fixes validated: ${matrix.summary.targetedFixesValidated}`,
    '',
    '## Dimension rows',
    ...matrix.rows.map(
      r =>
        `- **${r.dimension}**: baseline=${r.baselinePassed ? 'PASS' : 'FAIL'}, comparison=${r.comparisonPassed ? 'PASS' : 'FAIL'}${r.comparisonCovered ? '' : ' (uncovered)'}, indicator=${r.indicatorAligned ? 'OK' : 'GAP'} — ${r.detail}`,
    ),
    '',
    '## RC comparison samples',
    ...matrix.rcComparisonResults.map(
      s => `- [${s.passed ? 'PASS' : 'FAIL'}] ${s.sampleId} (${s.sampleClass}): ${s.detail}`,
    ),
  ].join('\n');
}
