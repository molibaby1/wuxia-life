import type { WorldProfile } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { evaluateContentConstraints, formatConstraintReportMarkdown } from './constraintEvaluation';
import { buildProductionValidationMatrix, formatProductionMatrixMarkdown } from './productionMatrix';
import {
  runContentSampleValidations,
  runEchoWiringValidation,
  runOptimizationWave,
  runTuningComparisonSlice,
  scholarArchetypeConfigPresent,
} from './validationSlices';

export interface P21GateReport {
  generatedAt: string;
  decision: 'pass' | 'warning' | 'fail';
  productionSurfaces: {
    styleConstraintCount: number;
    duplicateConstraintCount: number;
    hasLlmContentContract: boolean;
    hasLlmTuningContract: boolean;
    tuningSampleCount: number;
    p21EventCount: number;
  };
  validation: {
    contentSamplesPass: boolean;
    echoWiringPass: boolean;
    constraintReportPass: boolean;
    productionMatrixPass: boolean;
    tuningComparisonPass: boolean;
    optimizationWavePass: boolean;
  };
  messages: string[];
  warnings: string[];
}

export function profileHasP21Sections(profile: WorldProfile): boolean {
  return (
    (profile.contentStyleConstraints?.length ?? 0) >= 3 &&
    (profile.contentDuplicateConstraints?.length ?? 0) >= 2 &&
    !!profile.llmContentContract &&
    !!profile.llmTuningContract &&
    (profile.tuningSampleConfigs?.length ?? 0) >= 3
  );
}

export function assembleP21GateReport(profile: WorldProfile = getWorldProfile()): P21GateReport {
  const messages: string[] = [];
  const warnings: string[] = [];

  if (!profileHasP21Sections(profile)) {
    warnings.push('P21 profile sections incomplete');
  }

  const contentSlices = runContentSampleValidations();
  const echoWiring = runEchoWiringValidation();
  const constraintReport = evaluateContentConstraints(profile);
  const matrix = buildProductionValidationMatrix();
  const tuningSlice = runTuningComparisonSlice();
  const wave = runOptimizationWave();

  const contentSamplesPass = contentSlices.every(s => s.passed);
  const echoWiringPass = echoWiring.every(e => e.callbackExists && e.hasContract);
  const constraintReportPass = constraintReport.decision !== 'fail';
  const productionMatrixPass = matrix.decision !== 'fail';
  const tuningComparisonPass = tuningSlice.allThreeCovered;
  const optimizationWavePass = wave.waveDecision !== 'fail';

  if (!contentSamplesPass) warnings.push('Content sample validations incomplete');
  if (!echoWiringPass) warnings.push('Echo wiring validation failed');
  if (!tuningComparisonPass) warnings.push('Tuning comparison slice incomplete');
  if (!scholarArchetypeConfigPresent()) warnings.push('Scholar archetype config missing');

  messages.push(`Style constraints: ${profile.contentStyleConstraints?.length ?? 0}`);
  messages.push(`Duplicate constraints: ${profile.contentDuplicateConstraints?.length ?? 0}`);
  messages.push(`Tuning samples: ${profile.tuningSampleConfigs?.length ?? 0}`);
  messages.push(`P21 events loaded: ${contentSlices.length}`);

  let decision: P21GateReport['decision'] = 'pass';
  if (warnings.length > 0) decision = warnings.length >= 3 ? 'fail' : 'warning';
  if (!profileHasP21Sections(profile) || !contentSamplesPass || !productionMatrixPass) {
    decision = 'fail';
  }

  return {
    generatedAt: new Date().toISOString(),
    decision,
    productionSurfaces: {
      styleConstraintCount: profile.contentStyleConstraints?.length ?? 0,
      duplicateConstraintCount: profile.contentDuplicateConstraints?.length ?? 0,
      hasLlmContentContract: !!profile.llmContentContract,
      hasLlmTuningContract: !!profile.llmTuningContract,
      tuningSampleCount: profile.tuningSampleConfigs?.length ?? 0,
      p21EventCount: contentSlices.length,
    },
    validation: {
      contentSamplesPass,
      echoWiringPass,
      constraintReportPass,
      productionMatrixPass,
      tuningComparisonPass,
      optimizationWavePass,
    },
    messages,
    warnings,
  };
}

export function formatP21GateMarkdown(report: P21GateReport): string {
  return [
    '# P21 Content Production Gate',
    '',
    `- Decision: **${report.decision}**`,
    `- Style constraints: ${report.productionSurfaces.styleConstraintCount}`,
    `- Duplicate constraints: ${report.productionSurfaces.duplicateConstraintCount}`,
    `- Tuning samples: ${report.productionSurfaces.tuningSampleCount}`,
    '',
    '## Validation',
    `- Content samples: ${report.validation.contentSamplesPass ? 'PASS' : 'FAIL'}`,
    `- Echo wiring: ${report.validation.echoWiringPass ? 'PASS' : 'FAIL'}`,
    `- Constraint report: ${report.validation.constraintReportPass ? 'PASS' : 'FAIL'}`,
    `- Production matrix: ${report.validation.productionMatrixPass ? 'PASS' : 'FAIL'}`,
    `- Tuning comparison: ${report.validation.tuningComparisonPass ? 'PASS' : 'FAIL'}`,
    `- Optimization wave: ${report.validation.optimizationWavePass ? 'PASS' : 'FAIL'}`,
    '',
    '## Messages',
    ...report.messages.map(m => `- ${m}`),
    ...(report.warnings.length ? ['', '## Warnings', ...report.warnings.map(w => `- ${w}`)] : []),
  ].join('\n');
}

export function assembleP21ClosurePayload(profile: WorldProfile = getWorldProfile()) {
  const gate = assembleP21GateReport(profile);
  const matrix = buildProductionValidationMatrix();
  const constraintReport = evaluateContentConstraints(profile);
  const tuningSlice = runTuningComparisonSlice();
  const wave = runOptimizationWave();
  return { gate, matrix, constraintReport, tuningSlice, wave };
}

export function formatP21ClosureMarkdown(
  gate: P21GateReport,
  matrix: ReturnType<typeof buildProductionValidationMatrix>,
  wave: ReturnType<typeof runOptimizationWave>,
  constraintReport: ReturnType<typeof evaluateContentConstraints>,
): string {
  return [
    formatP21GateMarkdown(gate),
    '',
    formatProductionMatrixMarkdown(matrix),
    '',
    formatConstraintReportMarkdown(constraintReport),
    '',
    '# P21 Optimization Wave',
    '',
    ...wave.cases.map(c => `- [${c.passed ? 'PASS' : 'FAIL'}] ${c.description}`),
  ].join('\n');
}
