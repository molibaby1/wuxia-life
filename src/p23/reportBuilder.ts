import type { WorldProfile } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { buildExperienceAcceptanceMatrix, formatAcceptanceMatrixMarkdown } from './validationMatrix';
import { evaluateAllBalanceIndicators } from './balanceIndicators';
import { runBoundedFullLifeOperation } from './validationSlices';

export interface P23GateReport {
  generatedAt: string;
  decision: 'pass' | 'warning' | 'fail';
  acceptanceSurfaces: {
    dimensionCount: number;
    baselineCount: number;
    comparisonSampleCount: number;
    balanceIndicatorCount: number;
    liveBalanceSampleCount: number;
  };
  validation: {
    baselinesPass: boolean;
    comparisonsPass: boolean;
    indicatorsHealthy: boolean;
    matrixPass: boolean;
    fullLifeOperationPass: boolean;
    lowValueDetectionPass: boolean;
    tuningRedirectionPass: boolean;
  };
  messages: string[];
  warnings: string[];
}

export function profileHasP23Sections(profile: WorldProfile): boolean {
  return (
    (profile.experienceDimensionConfigs?.length ?? 0) >= 7 &&
    (profile.experienceAcceptanceBaselineConfigs?.length ?? 0) >= 4 &&
    (profile.experienceComparisonSampleConfigs?.length ?? 0) >= 4 &&
    (profile.longTermBalanceIndicatorConfigs?.length ?? 0) >= 5 &&
    (profile.liveBalanceWaveSampleConfigs?.length ?? 0) >= 4
  );
}

export function assembleP23GateReport(profile: WorldProfile = getWorldProfile()): P23GateReport {
  const messages: string[] = [];
  const warnings: string[] = [];

  if (!profileHasP23Sections(profile)) {
    warnings.push('P23 profile sections incomplete');
  }

  const matrix = buildExperienceAcceptanceMatrix(profile);
  const fullLife = runBoundedFullLifeOperation(matrix);
  const baselines = matrix.baselineScores;
  const comparisons = matrix.comparisonOutcomes;
  const indicators = matrix.balanceIndicators;
  const liveSamples = matrix.liveBalanceSamples;

  const baselinesPass = baselines.every(b => b.passed);
  const comparisonsPass = comparisons.every(c => c.passed);
  const indicatorsHealthy = indicators.every(i => i.inHealthyRange);
  const matrixPass = matrix.decision !== 'fail';
  const fullLifeOperationPass = fullLife.waveDecision !== 'fail';
  const lowValueDetectionPass = liveSamples.some(
    s => s.waveClass === 'low_value_detection' && s.passed,
  );
  const tuningRedirectionPass = liveSamples.some(
    s => s.waveClass === 'tuning_redirection' && s.passed,
  );

  if (!baselinesPass) warnings.push('Experience baselines incomplete');
  if (!comparisonsPass) warnings.push('Experience comparisons incomplete');
  if (!indicatorsHealthy) warnings.push('Balance indicators out of healthy range');
  if (!lowValueDetectionPass) warnings.push('Low-value wave detection sample not firing');

  messages.push(`Dimensions: ${profile.experienceDimensionConfigs?.length ?? 0}`);
  messages.push(`Baselines passing: ${baselines.filter(b => b.passed).length}/${baselines.length}`);
  messages.push(`Comparisons passing: ${comparisons.filter(c => c.passed).length}/${comparisons.length}`);
  messages.push(`Indicators healthy: ${indicators.filter(i => i.inHealthyRange).length}/${indicators.length}`);
  messages.push(`Matrix decision: ${matrix.decision}`);
  messages.push(`Full-life operation: ${fullLife.waveDecision}`);

  let decision: P23GateReport['decision'] = 'pass';
  if (warnings.length > 0) decision = warnings.length >= 3 ? 'fail' : 'warning';
  if (!profileHasP23Sections(profile) || !matrixPass || !baselinesPass) {
    decision = 'fail';
  }

  return {
    generatedAt: new Date().toISOString(),
    decision,
    acceptanceSurfaces: {
      dimensionCount: profile.experienceDimensionConfigs?.length ?? 0,
      baselineCount: profile.experienceAcceptanceBaselineConfigs?.length ?? 0,
      comparisonSampleCount: profile.experienceComparisonSampleConfigs?.length ?? 0,
      balanceIndicatorCount: profile.longTermBalanceIndicatorConfigs?.length ?? 0,
      liveBalanceSampleCount: profile.liveBalanceWaveSampleConfigs?.length ?? 0,
    },
    validation: {
      baselinesPass,
      comparisonsPass,
      indicatorsHealthy,
      matrixPass,
      fullLifeOperationPass,
      lowValueDetectionPass,
      tuningRedirectionPass,
    },
    messages,
    warnings,
  };
}

export function formatP23GateMarkdown(report: P23GateReport): string {
  return [
    '# P23 Experience Acceptance Gate',
    '',
    `- Decision: **${report.decision}**`,
    `- Dimensions: ${report.acceptanceSurfaces.dimensionCount}`,
    `- Baselines: ${report.acceptanceSurfaces.baselineCount}`,
    `- Comparisons: ${report.acceptanceSurfaces.comparisonSampleCount}`,
    `- Balance indicators: ${report.acceptanceSurfaces.balanceIndicatorCount}`,
    `- Live-balance samples: ${report.acceptanceSurfaces.liveBalanceSampleCount}`,
    '',
    '## Validation',
    `- Baselines: ${report.validation.baselinesPass ? 'PASS' : 'FAIL'}`,
    `- Comparisons: ${report.validation.comparisonsPass ? 'PASS' : 'FAIL'}`,
    `- Indicators healthy: ${report.validation.indicatorsHealthy ? 'PASS' : 'FAIL'}`,
    `- Matrix: ${report.validation.matrixPass ? 'PASS' : 'FAIL'}`,
    `- Full-life operation: ${report.validation.fullLifeOperationPass ? 'PASS' : 'FAIL'}`,
    `- Low-value detection: ${report.validation.lowValueDetectionPass ? 'PASS' : 'FAIL'}`,
    `- Tuning redirection: ${report.validation.tuningRedirectionPass ? 'PASS' : 'FAIL'}`,
    '',
    '## Messages',
    ...report.messages.map(m => `- ${m}`),
    ...(report.warnings.length ? ['', '## Warnings', ...report.warnings.map(w => `- ${w}`)] : []),
  ].join('\n');
}

export function assembleP23ClosurePayload(profile: WorldProfile = getWorldProfile()) {
  const gate = assembleP23GateReport(profile);
  const matrix = buildExperienceAcceptanceMatrix(profile);
  const fullLife = runBoundedFullLifeOperation();
  const indicators = evaluateAllBalanceIndicators(profile);
  return { gate, matrix, fullLife, indicators };
}

export function formatP23ClosureMarkdown(
  gate: P23GateReport,
  matrix: ReturnType<typeof buildExperienceAcceptanceMatrix>,
  fullLife: ReturnType<typeof runBoundedFullLifeOperation>,
): string {
  return [
    formatP23GateMarkdown(gate),
    '',
    formatAcceptanceMatrixMarkdown(matrix),
    '',
    '# P23 Full-Life Operation',
    '',
    ...fullLife.cases.map(c => `- [${c.passed ? 'PASS' : 'FAIL'}] ${c.description}`),
  ].join('\n');
}
