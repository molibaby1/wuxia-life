import type {
  ExperienceComparisonOutcome,
  LiveBalanceWaveSampleConfig,
  LongTermBalanceIndicatorSnapshot,
} from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { runLiveOpsTuningComparisonSlice, type P22TuningComparisonSlice } from '../p22/validationSlices';
import { getLiveOpsTuningEvidence } from '../p22/tuningEvidence';
import { evaluateAllBalanceIndicators } from './balanceIndicators';
import { runAllExperienceComparisons } from './comparisonReporting';

export interface LiveBalanceSampleResult {
  sampleId: string;
  waveClass: string;
  targetDimension: string;
  contentVolumeDelta: number;
  experienceDeltaObserved: number;
  passed: boolean;
  detail: string;
  redirected?: boolean;
}

export interface LiveBalanceSampleContext {
  comparisons: ExperienceComparisonOutcome[];
  indicators: LongTermBalanceIndicatorSnapshot[];
  tuning: P22TuningComparisonSlice;
  evidence: ReturnType<typeof getLiveOpsTuningEvidence>;
}

export function buildLiveBalanceSampleContext(
  profile = getWorldProfile(),
): LiveBalanceSampleContext {
  return {
    comparisons: runAllExperienceComparisons(profile),
    indicators: evaluateAllBalanceIndicators(profile),
    tuning: runLiveOpsTuningComparisonSlice(),
    evidence: getLiveOpsTuningEvidence(),
  };
}

export function runLiveBalanceSample(
  config: LiveBalanceWaveSampleConfig,
  ctx: LiveBalanceSampleContext = buildLiveBalanceSampleContext(),
): LiveBalanceSampleResult {
  const { comparisons, indicators, tuning, evidence } = ctx;

  switch (config.waveClass) {
    case 'high_value_tuning': {
      const tuningImprovements = [
        tuning.routeDistribution.improved,
        tuning.closureDensity.improved,
        tuning.archetypeCoverage.improved,
      ].filter(Boolean).length;
      const experienceDelta = tuningImprovements * 0.03 + (tuning.allThreeCovered ? 0.06 : 0.02);
      const passed =
        config.contentVolumeDelta === 0 &&
        experienceDelta >= config.experienceDeltaExpected * 0.45 &&
        tuning.allThreeCovered;
      return {
        sampleId: config.id,
        waveClass: config.waveClass,
        targetDimension: config.targetDimension,
        contentVolumeDelta: config.contentVolumeDelta,
        experienceDeltaObserved: experienceDelta,
        passed,
        detail: `Pacing tune: hermit spacing ${evidence.hermitClosureSpacing}, delta ${experienceDelta.toFixed(3)}`,
      };
    }
    case 'low_value_detection': {
      const volumeOnlyGain = config.contentVolumeDelta * 0.002;
      const targetIndicator = indicators.find(i => i.dimension === config.targetDimension);
      const targetComparison = comparisons.find(c => c.dimension === config.targetDimension);
      const measurableGain = Math.max(
        0,
        Math.min(
          targetIndicator?.deltaFromBaseline ?? 0,
          targetComparison?.delta ?? 0,
        ),
      );
      const experienceDeltaObserved = Math.min(volumeOnlyGain, measurableGain);
      const detected =
        config.contentVolumeDelta >= 3 &&
        experienceDeltaObserved < config.experienceDeltaExpected;
      return {
        sampleId: config.id,
        waveClass: config.waveClass,
        targetDimension: config.targetDimension,
        contentVolumeDelta: config.contentVolumeDelta,
        experienceDeltaObserved,
        passed: detected,
        detail: `Volume +${config.contentVolumeDelta} events, measurable gain ${experienceDeltaObserved.toFixed(3)} vs threshold ${config.experienceDeltaExpected} — low-value ${detected ? 'detected' : 'missed'}`,
      };
    }
    case 'tuning_redirection': {
      const targetComparison = comparisons.find(c => c.dimension === config.targetDimension);
      const targetIndicator = indicators.find(i => i.dimension === config.targetDimension);
      const lowValueSample = getWorldProfile().liveBalanceWaveSampleConfigs?.find(
        s => s.id === config.redirectedFromWaveId,
      );
      const lowValueResult = lowValueSample
        ? runLiveBalanceSample(lowValueSample, ctx)
        : undefined;
      const redirected =
        (lowValueResult?.passed ?? false) &&
        (targetComparison?.passed ?? false) &&
        (targetIndicator?.inHealthyRange ?? false);
      const experienceDelta = targetComparison?.delta ?? 0;
      const indicatorShifted = (targetIndicator?.deltaFromBaseline ?? 0) > 0;
      return {
        sampleId: config.id,
        waveClass: config.waveClass,
        targetDimension: config.targetDimension,
        contentVolumeDelta: config.contentVolumeDelta,
        experienceDeltaObserved: experienceDelta,
        passed: redirected && experienceDelta >= 0.05 && indicatorShifted,
        redirected,
        detail: `Redirected from ${config.redirectedFromWaveId}: ${config.targetDimension} delta ${experienceDelta.toFixed(3)}, indicator shift ${targetIndicator?.deltaFromBaseline.toFixed(3)}`,
      };
    }
    case 'full_life_operation': {
      const archetypeIndicator = indicators.find(i => i.indicatorId === 'p23_ind_archetype_stability');
      const legacyIndicator = indicators.find(i => i.indicatorId === 'p23_ind_legacy_endgame_resonance');
      const weakImproved =
        (archetypeIndicator?.deltaFromBaseline ?? 0) > 0 ||
        (legacyIndicator?.deltaFromBaseline ?? 0) > 0;
      const experienceDelta =
        (archetypeIndicator?.currentValue ?? 0) * 0.4 +
        (legacyIndicator?.currentValue ?? 0) * 0.3 +
        (tuning.allThreeCovered ? 0.15 : 0);
      return {
        sampleId: config.id,
        waveClass: config.waveClass,
        targetDimension: config.targetDimension,
        contentVolumeDelta: config.contentVolumeDelta,
        experienceDeltaObserved: experienceDelta,
        passed: weakImproved && experienceDelta >= config.experienceDeltaExpected * 0.5,
        detail: `Full-life wave: archetype ${archetypeIndicator?.currentValue.toFixed(2)}, legacy ${legacyIndicator?.currentValue.toFixed(2)}`,
      };
    }
    default:
      return {
        sampleId: config.id,
        waveClass: config.waveClass,
        targetDimension: config.targetDimension,
        contentVolumeDelta: config.contentVolumeDelta,
        experienceDeltaObserved: 0,
        passed: false,
        detail: 'Unknown wave class',
      };
  }
}

export function runAllLiveBalanceSamples(
  profile = getWorldProfile(),
): LiveBalanceSampleResult[] {
  const ctx = buildLiveBalanceSampleContext(profile);
  return (profile.liveBalanceWaveSampleConfigs ?? []).map(config =>
    runLiveBalanceSample(config, ctx),
  );
}
