import type { PlaytestComparisonOutcome, PlaytestComparisonSampleConfig } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { scorePlaytestSlice } from './sliceFixtures';

export function runPlaytestComparison(
  config: PlaytestComparisonSampleConfig,
): PlaytestComparisonOutcome {
  const strongerScore = scorePlaytestSlice(config.strongerSliceId, config.dimension);
  const weakerScore = scorePlaytestSlice(config.weakerSliceId, config.dimension);
  const delta = strongerScore - weakerScore;
  const distinguishesStrongerWeaker = strongerScore > weakerScore && delta >= 0.05;
  const passed = distinguishesStrongerWeaker;

  return {
    sampleId: config.id,
    dimension: config.dimension,
    strongerScore,
    weakerScore,
    delta,
    lifePhaseBand: config.lifePhaseBand,
    distinguishesStrongerWeaker,
    passed,
  };
}

export function runAllPlaytestComparisons(
  profile = getWorldProfile(),
): PlaytestComparisonOutcome[] {
  return (profile.playtestComparisonSampleConfigs ?? []).map(runPlaytestComparison);
}
