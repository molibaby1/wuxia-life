import type { PlaytestDimension } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { scoreSliceExperience } from '../p23/sliceFixtures';

export function scorePlaytestSlice(sliceId: string, dimension: PlaytestDimension): number {
  const slice = getWorldProfile().replaySliceConfigs?.find(s => s.id === sliceId);
  const fadePenalty = slice?.seedFlags.includes('fade_legacy') ? 0.22 : 0;
  const lowEngagementPenalty = slice?.seedFlags.includes('low_engagement') ? 0.12 : 0;
  const emphasis = slice?.emphasis ?? 'origin_early_growth';

  switch (dimension) {
    case 'first_run_readability': {
      const pacing = scoreSliceExperience(sliceId, 'stage_pacing_health');
      const earlyBoost = emphasis === 'origin_early_growth' ? 0.28 : 0.08;
      return Math.max(0, pacing * 0.45 + earlyBoost + 0.2 - fadePenalty - lowEngagementPenalty);
    }
    case 'onboarding_motivation': {
      const pacing = scoreSliceExperience(sliceId, 'stage_pacing_health');
      const route = scoreSliceExperience(sliceId, 'route_differentiation');
      const momentumBoost = emphasis === 'origin_early_growth' ? 0.22 : 0;
      const delayedPayoffPenalty = sliceId === 'p20_slice_wealth_pacing' ? 0.22 : 0;
      return Math.max(
        0,
        pacing * 0.3 +
          route * 0.25 +
          momentumBoost +
          0.12 -
          fadePenalty -
          lowEngagementPenalty -
          delayedPayoffPenalty,
      );
    }
    case 'replay_distinctiveness':
      return scoreSliceExperience(sliceId, 'replay_distinctiveness');
    case 'route_differentiation':
      return scoreSliceExperience(sliceId, 'route_differentiation');
    case 'late_game_payoff':
      return scoreSliceExperience(sliceId, 'mid_late_payoff');
    case 'ending_aftertaste':
      return scoreSliceExperience(sliceId, 'endgame_aftertaste');
    default:
      return scoreSliceExperience(sliceId);
  }
}

export function scoreInternalProxy(sliceId: string, dimension: PlaytestDimension): number {
  switch (dimension) {
    case 'first_run_readability':
      return scoreSliceExperience(sliceId, 'stage_pacing_health') * 0.7 + 0.2;
    case 'onboarding_motivation':
      return scoreSliceExperience(sliceId, 'archetype_strength') * 0.5 + 0.25;
    case 'replay_distinctiveness':
      return scoreSliceExperience(sliceId, 'replay_distinctiveness') * 0.85 + 0.1;
    case 'route_differentiation':
      return scoreSliceExperience(sliceId, 'route_differentiation') * 0.8 + 0.12;
    case 'late_game_payoff':
      return scoreSliceExperience(sliceId, 'mid_late_payoff') * 0.85 + 0.1;
    case 'ending_aftertaste':
      return scoreSliceExperience(sliceId, 'endgame_aftertaste') * 0.75 + 0.15;
    default:
      return scoreSliceExperience(sliceId);
  }
}
