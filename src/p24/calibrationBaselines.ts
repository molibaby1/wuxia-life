import type { PlaytestBaselineScore, PlaytestCalibrationBaselineConfig } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { scorePlaytestSlice } from './sliceFixtures';

export function evaluatePlaytestBaseline(
  config: PlaytestCalibrationBaselineConfig,
): PlaytestBaselineScore {
  const strongerScore = scorePlaytestSlice(config.strongerSliceId, config.dimension);
  const weakerScore = scorePlaytestSlice(config.weakerSliceId, config.dimension);
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

export function evaluateAllPlaytestBaselines(
  profile = getWorldProfile(),
): PlaytestBaselineScore[] {
  return (profile.playtestCalibrationBaselineConfigs ?? []).map(evaluatePlaytestBaseline);
}
