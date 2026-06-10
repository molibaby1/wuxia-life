import type { AlignmentIndicatorConfig, AlignmentIndicatorSnapshot } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { scoreInternalProxy, scorePlaytestSlice } from './sliceFixtures';

const PROXY_SLICE_BY_DIMENSION: Record<string, { strong: string; weak: string }> = {
  first_run_readability: {
    strong: 'p20_slice_origin_early',
    weak: 'p20_slice_hermit_closure',
  },
  onboarding_motivation: {
    strong: 'p20_slice_origin_early',
    weak: 'p20_slice_wealth_pacing',
  },
  replay_distinctiveness: {
    strong: 'p20_slice_midlife_consequence',
    weak: 'p20_slice_origin_early',
  },
  route_differentiation: {
    strong: 'p20_slice_midlife_consequence',
    weak: 'p20_slice_wealth_pacing',
  },
  late_game_payoff: {
    strong: 'p20_slice_midlife_consequence',
    weak: 'p20_slice_wealth_pacing',
  },
  ending_aftertaste: {
    strong: 'p20_slice_legacy_endgame',
    weak: 'p20_slice_hermit_closure',
  },
};

function resolveBiasDirection(
  gap: number,
  overestimateThreshold = 0.15,
  underestimateThreshold = -0.15,
): AlignmentIndicatorSnapshot['biasDirection'] {
  if (gap > overestimateThreshold) return 'overestimate';
  if (gap < underestimateThreshold) return 'underestimate';
  return 'aligned';
}

export function evaluateAlignmentIndicator(
  config: AlignmentIndicatorConfig,
  profile = getWorldProfile(),
): AlignmentIndicatorSnapshot {
  const comparison = profile.alignmentComparisonConfigs?.find(
    c => c.dimension === config.dimension,
  );
  const slices = PROXY_SLICE_BY_DIMENSION[config.dimension];
  const internalScore = slices
    ? (scoreInternalProxy(slices.strong, config.dimension) +
        scoreInternalProxy(slices.weak, config.dimension)) /
      2
    : config.baselineValue;
  const externalProxyScore = slices
    ? (scorePlaytestSlice(slices.strong, config.dimension) +
        scorePlaytestSlice(slices.weak, config.dimension)) /
      2
    : config.baselineValue;
  const alignmentGap = internalScore - externalProxyScore;
  const biasDirection = resolveBiasDirection(
    alignmentGap,
    comparison?.overestimateThreshold,
    comparison?.underestimateThreshold,
  );
  const currentValue = Math.max(0, Math.min(1, 1 - Math.abs(alignmentGap)));
  const inHealthyRange =
    currentValue >= config.healthyRange.min && currentValue <= config.healthyRange.max;

  return {
    indicatorId: config.id,
    label: config.label,
    dimension: config.dimension,
    internalScore,
    externalProxyScore,
    alignmentGap,
    biasDirection,
    currentValue,
    baselineValue: config.baselineValue,
    healthyRange: config.healthyRange,
    inHealthyRange,
  };
}

export function evaluateAllAlignmentIndicators(
  profile = getWorldProfile(),
): AlignmentIndicatorSnapshot[] {
  return (profile.alignmentIndicatorConfigs ?? []).map(indicator =>
    evaluateAlignmentIndicator(indicator, profile),
  );
}
