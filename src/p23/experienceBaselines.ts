import type { ExperienceAcceptanceBaselineConfig, ExperienceBaselineScore } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { scoreSliceExperience } from './sliceFixtures';

export function evaluateExperienceBaseline(
  config: ExperienceAcceptanceBaselineConfig,
): ExperienceBaselineScore {
  const strongerScore = scoreSliceExperience(config.strongerSliceId, config.dimension);
  const weakerScore = scoreSliceExperience(config.weakerSliceId, config.dimension);
  const scoreDelta = strongerScore - weakerScore;
  const orderingCorrect = strongerScore > weakerScore;
  const passed = orderingCorrect && scoreDelta >= config.minimumScoreDelta;

  return {
    baselineId: config.id,
    dimension: config.dimension,
    strongerSliceId: config.strongerSliceId,
    weakerSliceId: config.weakerSliceId,
    strongerScore,
    weakerScore,
    scoreDelta,
    orderingCorrect,
    passed,
  };
}

export function evaluateAllExperienceBaselines(
  profile = getWorldProfile(),
): ExperienceBaselineScore[] {
  return (profile.experienceAcceptanceBaselineConfigs ?? []).map(evaluateExperienceBaseline);
}
