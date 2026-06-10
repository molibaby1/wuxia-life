import type { WorldProfile } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { evaluateAllAlignmentIndicators } from './alignmentIndicators';
import {
  buildPlaytestCalibrationMatrix,
  formatCalibrationMatrixMarkdown,
  matrixComparisonsPass,
} from './validationMatrix';
import { runBoundedRcCalibrationWave, runFullRcClosurePass } from './validationSlices';

export interface P24GateReport {
  generatedAt: string;
  decision: 'pass' | 'warning' | 'fail';
  calibrationSurfaces: {
    dimensionCount: number;
    baselineCount: number;
    comparisonSampleCount: number;
    alignmentIndicatorCount: number;
    rcComparisonSampleCount: number;
    hasPlaytestFeedbackSchema: boolean;
    hasRcEvaluationSchema: boolean;
  };
  validation: {
    baselinesPass: boolean;
    comparisonsPass: boolean;
    indicatorsHealthy: boolean;
    matrixPass: boolean;
    rcWavePass: boolean;
    falsePositiveDetectionPass: boolean;
    redirectionPass: boolean;
    targetedFixPass: boolean;
    fullClosurePass: boolean;
  };
  messages: string[];
  warnings: string[];
}

export function profileHasP24Sections(profile: WorldProfile): boolean {
  return (
    (profile.playtestDimensionConfigs?.length ?? 0) >= 6 &&
    (profile.playtestCalibrationBaselineConfigs?.length ?? 0) >= 6 &&
    (profile.playtestComparisonSampleConfigs?.length ?? 0) >= 3 &&
    (profile.alignmentComparisonConfigs?.length ?? 0) >= 5 &&
    (profile.alignmentIndicatorConfigs?.length ?? 0) >= 5 &&
    (profile.rcComparisonSampleConfigs?.length ?? 0) >= 3 &&
    !!profile.playtestFeedbackSchema &&
    !!profile.rcEvaluationSchema
  );
}

export function assembleP24GateReport(profile: WorldProfile = getWorldProfile()): P24GateReport {
  const messages: string[] = [];
  const warnings: string[] = [];

  if (!profileHasP24Sections(profile)) {
    warnings.push('P24 profile sections incomplete');
  }

  const matrix = buildPlaytestCalibrationMatrix(profile);
  const rcWave = runBoundedRcCalibrationWave(matrix);
  const fullClosure = runFullRcClosurePass(matrix);

  const baselinesPass = matrix.baselineScores.every(b => b.passed);
  const comparisonsPass = matrixComparisonsPass(matrix);
  const indicatorsHealthy = matrix.alignmentIndicators.every(i => i.inHealthyRange);
  const matrixPass = matrix.decision !== 'fail';
  const rcWavePass = rcWave.waveDecision !== 'fail';
  const falsePositiveDetectionPass = matrix.rcComparisonResults.some(
    r => r.sampleClass === 'weak_outward_experience' && r.passed,
  );
  const redirectionPass = matrix.rcComparisonResults.some(
    r => r.sampleClass === 'feedback_redirection' && r.passed,
  );
  const targetedFixPass = matrix.rcComparisonResults.some(
    r => r.sampleClass === 'targeted_fix_validation' && r.passed,
  );
  const fullClosurePass = fullClosure.closureDecision !== 'fail';

  if (!baselinesPass) warnings.push('Playtest baselines incomplete');
  if (!comparisonsPass) {
    if (!matrix.summary.comparisonCoverageComplete) {
      const uncovered = matrix.rows
        .filter(r => !r.comparisonCovered)
        .map(r => r.dimension)
        .join(', ');
      warnings.push(`Playtest comparison coverage incomplete (missing: ${uncovered})`);
    } else {
      warnings.push('Playtest comparison samples failing for covered dimensions');
    }
  }
  if (!falsePositiveDetectionPass) warnings.push('Weak-outward RC sample not firing');

  messages.push(`Dimensions: ${profile.playtestDimensionConfigs?.length ?? 0}`);
  messages.push(`Baselines passing: ${matrix.summary.baselinesPassing}/${matrix.baselineScores.length}`);
  messages.push(
    `Comparison samples passing: ${matrix.summary.comparisonsPassing}/${matrix.comparisonOutcomes.length}`,
  );
  messages.push(
    `Comparison dimension coverage: ${matrix.summary.comparisonsCovered}/${matrix.summary.comparisonsRequired}`,
  );
  messages.push(
    `Comparison dimensions passing: ${matrix.summary.comparisonsDimensionPassing}/${matrix.summary.comparisonsRequired}`,
  );
  messages.push(`Matrix decision: ${matrix.decision}`);
  messages.push(`RC wave: ${rcWave.waveDecision}`);
  messages.push(`Full closure: ${fullClosure.closureDecision}`);

  let decision: P24GateReport['decision'] = 'pass';
  if (warnings.length > 0) decision = warnings.length >= 3 ? 'fail' : 'warning';
  if (!profileHasP24Sections(profile) || !matrixPass || !baselinesPass) {
    decision = 'fail';
  }

  return {
    generatedAt: new Date().toISOString(),
    decision,
    calibrationSurfaces: {
      dimensionCount: profile.playtestDimensionConfigs?.length ?? 0,
      baselineCount: profile.playtestCalibrationBaselineConfigs?.length ?? 0,
      comparisonSampleCount: profile.playtestComparisonSampleConfigs?.length ?? 0,
      alignmentIndicatorCount: profile.alignmentIndicatorConfigs?.length ?? 0,
      rcComparisonSampleCount: profile.rcComparisonSampleConfigs?.length ?? 0,
      hasPlaytestFeedbackSchema: !!profile.playtestFeedbackSchema,
      hasRcEvaluationSchema: !!profile.rcEvaluationSchema,
    },
    validation: {
      baselinesPass,
      comparisonsPass,
      indicatorsHealthy,
      matrixPass,
      rcWavePass,
      falsePositiveDetectionPass,
      redirectionPass,
      targetedFixPass,
      fullClosurePass,
    },
    messages,
    warnings,
  };
}

export function formatP24GateMarkdown(gate: P24GateReport): string {
  return [
    '# P24 Playtest Calibration Gate',
    '',
    `- Decision: **${gate.decision}**`,
    `- Generated: ${gate.generatedAt}`,
    '',
    '## Surfaces',
    `- Dimensions: ${gate.calibrationSurfaces.dimensionCount}`,
    `- Baselines: ${gate.calibrationSurfaces.baselineCount}`,
    `- Comparison samples: ${gate.calibrationSurfaces.comparisonSampleCount}`,
    `- Alignment indicators: ${gate.calibrationSurfaces.alignmentIndicatorCount}`,
    `- RC samples: ${gate.calibrationSurfaces.rcComparisonSampleCount}`,
    `- Playtest feedback schema: ${gate.calibrationSurfaces.hasPlaytestFeedbackSchema ? 'yes' : 'no'}`,
    `- RC evaluation schema: ${gate.calibrationSurfaces.hasRcEvaluationSchema ? 'yes' : 'no'}`,
    '',
    '## Validation',
    ...Object.entries(gate.validation).map(([k, v]) => `- ${k}: ${v ? 'PASS' : 'FAIL'}`),
    '',
    '## Messages',
    ...gate.messages.map(m => `- ${m}`),
    ...(gate.warnings.length > 0 ? ['', '## Warnings', ...gate.warnings.map(w => `- ${w}`)] : []),
  ].join('\n');
}

export function assembleP24ClosurePayload(profile: WorldProfile = getWorldProfile()) {
  const gate = assembleP24GateReport(profile);
  const matrix = buildPlaytestCalibrationMatrix(profile);
  const rcWave = runBoundedRcCalibrationWave(matrix);
  const fullClosure = runFullRcClosurePass(matrix);
  const indicators = evaluateAllAlignmentIndicators(profile);
  return { gate, matrix, rcWave, fullClosure, indicators };
}

export function formatP24ClosureMarkdown(
  gate: P24GateReport,
  matrix: ReturnType<typeof buildPlaytestCalibrationMatrix>,
  rcWave: ReturnType<typeof runBoundedRcCalibrationWave>,
): string {
  return [
    '## RC Calibration Wave',
    `- Wave decision: **${rcWave.waveDecision}**`,
    ...rcWave.cases.map(c => `- [${c.passed ? 'PASS' : 'FAIL'}] ${c.caseId}: ${c.description}`),
    '',
    formatCalibrationMatrixMarkdown(matrix),
    '',
    '## Gate summary',
    `- Gate decision: **${gate.decision}**`,
  ].join('\n');
}
