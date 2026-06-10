import type { WorldProfile } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { buildLibraryCoverageMatrix, formatCoverageMatrixMarkdown } from './coverageMatrix';
import { evaluateAllPoolCoverage } from './coverageEvaluation';
import { detectWeakSpots } from './weakSpotDetection';
import {
  runExpansionValidations,
  runExpansionWave,
  runLiveOpsTuningComparisonSlice,
  runWaveValidations,
} from './validationSlices';

export interface P22GateReport {
  generatedAt: string;
  decision: 'pass' | 'warning' | 'fail';
  librarySurfaces: {
    baselinePoolCount: number;
    coverageExpectationCount: number;
    liveOpsWaveCount: number;
    liveOpsTuningSampleCount: number;
    p22EventCount: number;
  };
  validation: {
    expansionsPass: boolean;
    wavesPass: boolean;
    coverageMatrixPass: boolean;
    tuningComparisonPass: boolean;
    expansionWavePass: boolean;
  };
  messages: string[];
  warnings: string[];
}

export function profileHasP22Sections(profile: WorldProfile): boolean {
  return (
    (profile.baselinePoolConfigs?.length ?? 0) >= 3 &&
    (profile.libraryCoverageExpectations?.length ?? 0) >= 3 &&
    (profile.liveOpsWaveConfigs?.length ?? 0) >= 3 &&
    (profile.liveOpsTuningSampleConfigs?.length ?? 0) >= 3
  );
}

export function assembleP22GateReport(profile: WorldProfile = getWorldProfile()): P22GateReport {
  const messages: string[] = [];
  const warnings: string[] = [];

  if (!profileHasP22Sections(profile)) {
    warnings.push('P22 profile sections incomplete');
  }

  const expansions = runExpansionValidations();
  const waves = runWaveValidations();
  const matrix = buildLibraryCoverageMatrix();
  const tuning = runLiveOpsTuningComparisonSlice();
  const wave = runExpansionWave();
  const poolSnapshots = evaluateAllPoolCoverage();

  const expansionsPass = expansions.every(s => s.passed);
  const wavesPass = waves.every(w => w.passed);
  const coverageMatrixPass = matrix.decision !== 'fail';
  const tuningComparisonPass = tuning.allThreeCovered;
  const expansionWavePass = wave.waveDecision !== 'fail';

  if (!expansionsPass) warnings.push('Expansion validations incomplete');
  if (!wavesPass) warnings.push('Live-ops wave validations incomplete');
  if (!tuningComparisonPass) warnings.push('Live-ops tuning comparison incomplete');

  messages.push(`Baseline pools: ${profile.baselinePoolConfigs?.length ?? 0}`);
  messages.push(`Coverage expectations: ${profile.libraryCoverageExpectations?.length ?? 0}`);
  messages.push(`Live-ops waves: ${profile.liveOpsWaveConfigs?.length ?? 0}`);
  messages.push(`P22 events: ${matrix.summary.expansionEventCount}`);
  messages.push(`Pool snapshots: ${poolSnapshots.map(p => `${p.poolId}=${p.healthClass}`).join(', ')}`);
  messages.push(`Weak spots detected: ${detectWeakSpots().length}`);

  let decision: P22GateReport['decision'] = 'pass';
  if (warnings.length > 0) decision = warnings.length >= 3 ? 'fail' : 'warning';
  if (!profileHasP22Sections(profile) || !expansionsPass || !coverageMatrixPass) {
    decision = 'fail';
  }

  return {
    generatedAt: new Date().toISOString(),
    decision,
    librarySurfaces: {
      baselinePoolCount: profile.baselinePoolConfigs?.length ?? 0,
      coverageExpectationCount: profile.libraryCoverageExpectations?.length ?? 0,
      liveOpsWaveCount: profile.liveOpsWaveConfigs?.length ?? 0,
      liveOpsTuningSampleCount: profile.liveOpsTuningSampleConfigs?.length ?? 0,
      p22EventCount: matrix.summary.expansionEventCount,
    },
    validation: {
      expansionsPass,
      wavesPass,
      coverageMatrixPass,
      tuningComparisonPass,
      expansionWavePass,
    },
    messages,
    warnings,
  };
}

export function formatP22GateMarkdown(report: P22GateReport): string {
  return [
    '# P22 Content Library Gate',
    '',
    `- Decision: **${report.decision}**`,
    `- Baseline pools: ${report.librarySurfaces.baselinePoolCount}`,
    `- Live-ops waves: ${report.librarySurfaces.liveOpsWaveCount}`,
    `- P22 events: ${report.librarySurfaces.p22EventCount}`,
    '',
    '## Validation',
    `- Expansions: ${report.validation.expansionsPass ? 'PASS' : 'FAIL'}`,
    `- Waves: ${report.validation.wavesPass ? 'PASS' : 'FAIL'}`,
    `- Coverage matrix: ${report.validation.coverageMatrixPass ? 'PASS' : 'FAIL'}`,
    `- Tuning comparison: ${report.validation.tuningComparisonPass ? 'PASS' : 'FAIL'}`,
    `- Expansion wave: ${report.validation.expansionWavePass ? 'PASS' : 'FAIL'}`,
    '',
    '## Messages',
    ...report.messages.map(m => `- ${m}`),
    ...(report.warnings.length ? ['', '## Warnings', ...report.warnings.map(w => `- ${w}`)] : []),
  ].join('\n');
}

export function assembleP22ClosurePayload(profile: WorldProfile = getWorldProfile()) {
  const gate = assembleP22GateReport(profile);
  const matrix = buildLibraryCoverageMatrix();
  const tuning = runLiveOpsTuningComparisonSlice();
  const wave = runExpansionWave();
  const poolSnapshots = evaluateAllPoolCoverage();
  return { gate, matrix, tuning, wave, poolSnapshots };
}

export function formatP22ClosureMarkdown(
  gate: P22GateReport,
  matrix: ReturnType<typeof buildLibraryCoverageMatrix>,
  wave: ReturnType<typeof runExpansionWave>,
): string {
  return [
    formatP22GateMarkdown(gate),
    '',
    formatCoverageMatrixMarkdown(matrix),
    '',
    '# P22 Expansion Wave',
    '',
    ...wave.cases.map(c => `- [${c.passed ? 'PASS' : 'FAIL'}] ${c.description}`),
  ].join('\n');
}
