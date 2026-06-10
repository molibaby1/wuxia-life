import type { ExperienceComparisonOutcome, ExperienceComparisonSampleConfig } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { buildWholeLifePacingReport } from '../p20/wholeLifePacing';
import { scoreSliceExperience, buildSliceState } from './sliceFixtures';

export function runExperienceComparisonSample(
  config: ExperienceComparisonSampleConfig,
): ExperienceComparisonOutcome {
  const strongerScore = scoreSliceExperience(config.strongerSliceId, config.dimension);
  const weakerScore = scoreSliceExperience(config.weakerSliceId, config.dimension);
  const delta = strongerScore - weakerScore;

  let wholeLifeScore: number | undefined;
  let sliceLevelScore: number | undefined;

  if (config.wholeLife) {
    const strongerState = buildSliceState(config.strongerSliceId);
    const weakerState = buildSliceState(config.weakerSliceId);
    const strongerPacing = buildWholeLifePacingReport(strongerState).pacingMultiplier;
    const weakerPacing = buildWholeLifePacingReport(weakerState).pacingMultiplier;
    wholeLifeScore = Math.abs(strongerPacing - weakerPacing);
  }

  if (config.sliceLevel) {
    sliceLevelScore = delta;
  }

  const distinguishesStrongerWeaker = strongerScore > weakerScore && delta >= 0.05;
  const passed = distinguishesStrongerWeaker;

  return {
    sampleId: config.id,
    dimension: config.dimension,
    strongerScore,
    weakerScore,
    delta,
    wholeLifeScore,
    sliceLevelScore,
    distinguishesStrongerWeaker,
    passed,
  };
}

export function runAllExperienceComparisons(
  profile = getWorldProfile(),
): ExperienceComparisonOutcome[] {
  return (profile.experienceComparisonSampleConfigs ?? []).map(runExperienceComparisonSample);
}
