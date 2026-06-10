import type { LongTermBalanceIndicatorConfig, LongTermBalanceIndicatorSnapshot } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import {
  runArchetypeDifferentiationSlice,
  runPacingDifferentiationSlice,
  runReplaySliceValidations,
  runRepetitionOverlapSlice,
} from '../p20/validationSlices';
import { evaluateExperienceBaseline } from './experienceBaselines';
import { scoreSliceExperience } from './sliceFixtures';

function computeArchetypeStability(): number {
  const slice = runArchetypeDifferentiationSlice();
  const replay = runReplaySliceValidations();
  const passRate = replay.filter(r => r.passed).length / Math.max(1, replay.length);
  return slice.atLeastThreeDistinct && slice.beyondRouteLabel
    ? 0.78 + passRate * 0.15
    : 0.55 + passRate * 0.1;
}

function computeReplayNovelty(): number {
  const rep = runRepetitionOverlapSlice();
  const boost = rep.noveltyImproved ? 0.68 : 0.52;
  const decay = rep.overlapMateriallyReduced ? 0.08 : 0;
  return Math.min(0.9, boost + decay);
}

function computeStagePacingHealth(): number {
  const pacing = runPacingDifferentiationSlice();
  const delta = pacing.densityDelta;
  return pacing.pacingMeaningfullyDiffers ? Math.min(0.95, 0.55 + delta * 2) : 0.45;
}

function computeMidLatePayoff(): number {
  const profile = getWorldProfile();
  const baseline = profile.experienceAcceptanceBaselineConfigs?.find(
    b => b.dimension === 'mid_late_payoff',
  );
  if (!baseline) return 0.5;
  const result = evaluateExperienceBaseline(baseline);
  return Math.min(0.9, 0.45 + result.scoreDelta * 1.5);
}

function computeLegacyEndgameResonance(): number {
  const stronger = scoreSliceExperience('p20_slice_legacy_endgame', 'legacy_resonance');
  const weaker = scoreSliceExperience('p20_slice_hermit_closure', 'legacy_resonance');
  return Math.min(0.92, 0.5 + (stronger - weaker) * 1.2);
}

const INDICATOR_COMPUTERS: Record<string, () => number> = {
  p23_ind_archetype_stability: computeArchetypeStability,
  p23_ind_replay_novelty: computeReplayNovelty,
  p23_ind_stage_pacing_health: computeStagePacingHealth,
  p23_ind_mid_late_payoff: computeMidLatePayoff,
  p23_ind_legacy_endgame_resonance: computeLegacyEndgameResonance,
};

export function evaluateBalanceIndicator(
  config: LongTermBalanceIndicatorConfig,
): LongTermBalanceIndicatorSnapshot {
  const compute = INDICATOR_COMPUTERS[config.id];
  const currentValue = compute ? compute() : config.baselineValue;
  const inHealthyRange =
    currentValue >= config.healthyRange.min && currentValue <= config.healthyRange.max;

  return {
    indicatorId: config.id,
    label: config.label,
    dimension: config.dimension,
    currentValue,
    baselineValue: config.baselineValue,
    healthyRange: config.healthyRange,
    inHealthyRange,
    deltaFromBaseline: currentValue - config.baselineValue,
  };
}

export function evaluateAllBalanceIndicators(
  profile = getWorldProfile(),
): LongTermBalanceIndicatorSnapshot[] {
  return (profile.longTermBalanceIndicatorConfigs ?? []).map(evaluateBalanceIndicator);
}
