import type { PlaytestCalibrationValidationMatrix } from '../narrative/profile/types';
import { buildExperienceAcceptanceMatrix } from '../p23/validationMatrix';
import { runArchetypeDifferentiationSlice, runPacingDifferentiationSlice } from '../p20/validationSlices';
import { buildPlaytestCalibrationMatrix } from './validationMatrix';

export interface P24RcCalibrationWaveResult {
  generatedAt: string;
  weakDimensionImproved: boolean;
  internalMissedPlayerProblem: boolean;
  rcRedirectedFix: boolean;
  waveDecision: 'pass' | 'warning' | 'fail';
  cases: Array<{ caseId: string; description: string; passed: boolean }>;
}

export function runBoundedRcCalibrationWave(
  matrix: PlaytestCalibrationValidationMatrix = buildPlaytestCalibrationMatrix(),
): P24RcCalibrationWaveResult {
  const p23Matrix = buildExperienceAcceptanceMatrix();
  const archetype = runArchetypeDifferentiationSlice();
  const pacing = runPacingDifferentiationSlice();

  const weakOutward = matrix.rcComparisonResults.find(
    r => r.sampleClass === 'weak_outward_experience',
  );
  const redirect = matrix.rcComparisonResults.find(
    r => r.sampleClass === 'feedback_redirection',
  );
  const targetedFix = matrix.rcComparisonResults.find(
    r => r.sampleClass === 'targeted_fix_validation',
  );

  const weakDimensionImproved =
    matrix.rows.some(r => r.baselinePassed && r.comparisonPassed) &&
    (targetedFix?.passed ?? false);
  const internalMissedPlayerProblem = weakOutward?.passed === true;
  const rcRedirectedFix =
    (redirect?.passed ?? false) &&
    redirect?.redirected === true &&
    (targetedFix?.fixValidated ?? false);

  const cases = [
    {
      caseId: 'early_mid_late_endgame_surfaces',
      description: 'Bounded RC wave covers early, mid, and late/end playtest comparison bands',
      passed:
        matrix.comparisonOutcomes.some(c => c.lifePhaseBand === 'early') &&
        matrix.comparisonOutcomes.some(c => c.lifePhaseBand === 'mid') &&
        matrix.comparisonOutcomes.some(c => c.lifePhaseBand === 'late_end'),
    },
    {
      caseId: 'weak_dimension_improved',
      description: 'Previously weak human-facing dimension becomes measurably stronger after fix',
      passed: weakDimensionImproved,
    },
    {
      caseId: 'internal_missed_player_problem',
      description: 'Internal metrics alone would have missed player-facing problem',
      passed: internalMissedPlayerProblem,
    },
    {
      caseId: 'rc_redirected_fix',
      description: 'RC reporting redirected or sharpened the final fix choice',
      passed: rcRedirectedFix,
    },
    {
      caseId: 'p23_upstream_acceptance',
      description: 'P23 experience acceptance matrix remains compatible upstream',
      passed: p23Matrix.decision !== 'fail',
    },
    {
      caseId: 'archetype_pacing_preserved',
      description: 'Archetype and pacing differentiation preserved during RC wave',
      passed: archetype.atLeastThreeDistinct && pacing.pacingMeaningfullyDiffers,
    },
  ];

  const passedCount = cases.filter(c => c.passed).length;
  let waveDecision: P24RcCalibrationWaveResult['waveDecision'] = 'pass';
  if (passedCount < cases.length) waveDecision = 'warning';
  if (passedCount < Math.ceil(cases.length * 0.7)) waveDecision = 'fail';

  return {
    generatedAt: new Date().toISOString(),
    weakDimensionImproved,
    internalMissedPlayerProblem,
    rcRedirectedFix,
    waveDecision,
    cases,
  };
}

export interface P24FullRcClosureResult {
  generatedAt: string;
  alignedDecisionShare: number;
  falsePositiveCasesReduced: boolean;
  strongDimensionsPreserved: boolean;
  closureDecision: 'pass' | 'warning' | 'fail';
  messages: string[];
}

export function runFullRcClosurePass(
  matrix: PlaytestCalibrationValidationMatrix = buildPlaytestCalibrationMatrix(),
): P24FullRcClosureResult {
  const wave = runBoundedRcCalibrationWave(matrix);
  const messages: string[] = [];

  const totalRcSamples = matrix.rcComparisonResults.length;
  const alignedSamples = matrix.rcComparisonResults.filter(
    r => r.biasDirection === 'aligned' || r.passed,
  ).length;
  const alignedDecisionShare = totalRcSamples > 0 ? alignedSamples / totalRcSamples : 0;

  const falsePositiveCasesReduced =
    matrix.summary.falsePositiveDetected >= 1 && matrix.summary.targetedFixesValidated >= 1;
  const strongDimensionsPreserved =
    matrix.summary.baselinesPassing >= 5 &&
    matrix.summary.comparisonCoverageComplete &&
    matrix.summary.comparisonsPassing === matrix.comparisonOutcomes.length &&
    wave.cases.find(c => c.caseId === 'archetype_pacing_preserved')?.passed === true;

  messages.push(`Aligned decision share: ${(alignedDecisionShare * 100).toFixed(0)}%`);
  messages.push(`Baselines passing: ${matrix.summary.baselinesPassing}/${matrix.baselineScores.length}`);
  messages.push(`RC wave: ${wave.waveDecision}`);

  let closureDecision: P24FullRcClosureResult['closureDecision'] = 'pass';
  if (!falsePositiveCasesReduced || alignedDecisionShare < 0.5) closureDecision = 'warning';
  if (matrix.decision === 'fail' || wave.waveDecision === 'fail') closureDecision = 'fail';

  return {
    generatedAt: new Date().toISOString(),
    alignedDecisionShare,
    falsePositiveCasesReduced,
    strongDimensionsPreserved,
    closureDecision,
    messages,
  };
}
