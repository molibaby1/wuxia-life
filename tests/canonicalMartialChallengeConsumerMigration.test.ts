import { assert } from './GameTestFramework';
import {
  calculateFailureProbability,
  CHALLENGE_MODIFIABLE_STATS,
} from '../src/core/ChallengeSystem';
import { CHALLENGE_SCENES } from '../src/data/challengeScenes';
import type { ChallengeScene } from '../src/types/difficultyTypes';
import type { PlayerStats } from '../src/types/eventTypes';

const LEGACY_MARTIAL_FIELDS = ['externalSkill', 'internalSkill', 'qinggong'] as const;

function countLegacyMentions(source: string): number {
  let count = 0;
  for (const field of LEGACY_MARTIAL_FIELDS) {
    count += (source.match(new RegExp(`\\b${field}\\b`, 'g')) ?? []).length;
  }
  return count;
}

function baselineStats(): PlayerStats {
  return {
    martialPower: 100,
    constitution: 50,
    charisma: 40,
    chivalry: 40,
    reputation: 40,
    connections: 40,
    knowledge: 40,
  };
}

function run(): void {
  assert(
    countLegacyMentions(JSON.stringify(CHALLENGE_SCENES)) === 0,
    'challengeScenes must contain 0 legacy martial fields',
  );

  for (const scene of Object.values(CHALLENGE_SCENES)) {
    for (const stat of scene.relevantStats) {
      assert(
        CHALLENGE_MODIFIABLE_STATS.has(stat),
        `${scene.id} relevantStats key ${stat} must be in CHALLENGE_MODIFIABLE_STATS`,
      );
    }
    for (const key of Object.keys(scene.thresholds)) {
      assert(
        CHALLENGE_MODIFIABLE_STATS.has(key),
        `${scene.id} thresholds key ${key} must be in CHALLENGE_MODIFIABLE_STATS`,
      );
    }
  }

  const tournament = CHALLENGE_SCENES.martial_arts_tournament;
  assert(Boolean(tournament), 'martial_arts_tournament must exist');
  const mpThreshold = tournament.thresholds.martialPower;
  assert(Boolean(mpThreshold), 'martial_arts_tournament must keep martialPower threshold');
  assert(mpThreshold.qualified === 80, 'martial_arts_tournament martialPower.qualified must stay 80');
  assert(mpThreshold.excellent === 150, 'martial_arts_tournament martialPower.excellent must stay 150');
  assert(
    mpThreshold.failureRateReduction === 0.3,
    'martial_arts_tournament martialPower.failureRateReduction must stay 0.3',
  );

  const breakthrough = CHALLENGE_SCENES.cultivation_breakthrough;
  assert(Boolean(breakthrough), 'cultivation_breakthrough must exist');
  assert(
    !breakthrough.relevantStats.includes('martialPower'),
    'cultivation_breakthrough must not add martialPower to relevantStats',
  );
  assert(
    breakthrough.thresholds.martialPower === undefined,
    'cultivation_breakthrough must not add martialPower threshold',
  );

  const stats = baselineStats();
  const baseline = calculateFailureProbability(tournament, stats, 1.0);
  const withUnknown: ChallengeScene = {
    ...tournament,
    relevantStats: [...tournament.relevantStats, 'unknown_challenge_stat'],
    thresholds: {
      ...tournament.thresholds,
      unknown_challenge_stat: { qualified: 1, excellent: 2, failureRateReduction: 0.9 },
    },
  };
  const unknownResult = calculateFailureProbability(withUnknown, stats, 1.0);
  assert(
    unknownResult.finalFailureRate === baseline.finalFailureRate,
    'unknown relevantStats key must not change failure modifier vs baseline',
  );
  assert(
    !Number.isNaN(unknownResult.finalFailureRate),
    'unknown relevantStats key must not produce NaN failure rate',
  );
  assert(
    !unknownResult.abilityAssessment.some(item => item.stat === 'unknown_challenge_stat'),
    'unknown relevantStats key must not appear in abilityAssessment',
  );

  console.log('canonicalMartialChallengeConsumerMigration.test.ts: ok');
}

run();
