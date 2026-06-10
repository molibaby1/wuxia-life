import type { RcComparisonSampleConfig, RcComparisonSampleResult } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { evaluateRcCandidate } from './rcEvaluation';
import { scorePlaytestSlice } from './sliceFixtures';

export function runRcComparisonSample(
  config: RcComparisonSampleConfig,
): RcComparisonSampleResult {
  const externalFromSlice = scorePlaytestSlice(
    config.sampleClass === 'targeted_fix_validation'
      ? 'p20_slice_origin_early'
      : 'p20_slice_hermit_closure',
    config.targetDimension,
  );
  const externalAppealScore =
    config.sampleClass === 'targeted_fix_validation'
      ? Math.max(config.externalAppealScore, externalFromSlice)
      : Math.min(config.externalAppealScore, externalFromSlice + 0.05);

  const rc = evaluateRcCandidate({
    buildId: `rc-${config.id}`,
    candidateLabel: config.label,
    internalHealthScore: config.internalHealthScore,
    externalAppealScore,
  });

  const alignmentGap = rc.alignmentGap;
  const biasDirection = rc.biasDirection;

  switch (config.sampleClass) {
    case 'weak_outward_experience': {
      const passed =
        config.internalHealthScore >= 0.75 &&
        externalAppealScore < 0.45 &&
        biasDirection === 'overestimate' &&
        rc.releaseReadiness === 'redirect';
      return {
        sampleId: config.id,
        sampleClass: config.sampleClass,
        targetDimension: config.targetDimension,
        internalHealthScore: config.internalHealthScore,
        externalAppealScore,
        alignmentGap,
        biasDirection,
        passed,
        detail: `False-positive risk: internal=${config.internalHealthScore.toFixed(2)}, external=${externalAppealScore.toFixed(2)}, RC=${rc.releaseReadiness}`,
      };
    }
    case 'feedback_redirection': {
      const passed =
        biasDirection === 'overestimate' &&
        rc.releaseReadiness === 'redirect' &&
        !!config.redirectedFromSampleId &&
        !!config.fixDescription;
      return {
        sampleId: config.id,
        sampleClass: config.sampleClass,
        targetDimension: config.targetDimension,
        internalHealthScore: config.internalHealthScore,
        externalAppealScore,
        alignmentGap,
        biasDirection,
        passed,
        detail: `Redirect: ${config.fixDescription}`,
        redirected: true,
      };
    }
    case 'targeted_fix_validation': {
      const passed =
        externalAppealScore >= 0.6 &&
        biasDirection === 'aligned' &&
        rc.releaseReadiness === 'ship';
      return {
        sampleId: config.id,
        sampleClass: config.sampleClass,
        targetDimension: config.targetDimension,
        internalHealthScore: config.internalHealthScore,
        externalAppealScore,
        alignmentGap,
        biasDirection,
        passed,
        detail: `Fix validated: ${config.fixDescription}`,
        fixValidated: true,
      };
    }
    default:
      return {
        sampleId: config.id,
        sampleClass: config.sampleClass,
        targetDimension: config.targetDimension,
        internalHealthScore: config.internalHealthScore,
        externalAppealScore,
        alignmentGap,
        biasDirection,
        passed: false,
        detail: 'Unknown sample class',
      };
  }
}

export function runAllRcComparisonSamples(
  profile = getWorldProfile(),
): RcComparisonSampleResult[] {
  return (profile.rcComparisonSampleConfigs ?? []).map(runRcComparisonSample);
}
