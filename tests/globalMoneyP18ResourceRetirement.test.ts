import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import {
  P18_COST_DISCIPLE_CULTIVATION,
} from '../src/narrative/profile/wuxiaLegacySurfaces';
import { collectUnmetCultivationPressure } from '../src/p18/cultivationPressure';
import {
  buildLaterLifeLegacyReport,
} from '../src/p18/laterLifeLegacySelection';
import { inferSuccessorQuality } from '../src/p18/stateAccess';
import { resolveActiveLegacyOutcomes } from '../src/p18/legacyOutcomes';
import type { GameState } from '../src/types/eventTypes';

function makeState(
  money: number,
  overrides: { flags?: Record<string, unknown>; connections?: number; martialHeritage?: number } = {},
): GameState {
  const flags = {
    has_disciples: true,
    ...(overrides.flags ?? {}),
  };
  return {
    player: {
      age: 52,
      name: 'p18-money-retirement',
      gender: 'male',
      martialPower: 80,
      chivalry: 55,
      constitution: 50,
      affiliation: null,
      title: null,
      reputation: 65,
      money,
      knowledge: 45,
      charisma: 50,
      businessAcumen: 35,
      influence: 55,
      connections: overrides.connections ?? 0,
      martialHeritage: overrides.martialHeritage ?? 40,
      scholarlyHeritage: 15,
      merchantNetwork: 10,
      children: 0,
      spouse: null,
      flags: { ...flags },
      alive: true,
    },
    flags: { ...flags },
    lifePath: {
      faction: 'neutral',
      lifeStage: 'legacy',
      achievements: [],
      relationships: { allies: [], enemies: [], mentors: [], disciples: ['d1', 'd2'] },
      commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
    },
    achievements: [],
  } as GameState;
}

function outcomeForMoney(money: number): Record<string, unknown> {
  const state = makeState(money);
  const report = buildLaterLifeLegacyReport(state, new Set(['decline', 'legacy']), 52);
  return {
    activeCultivationCostPatterns: report.activeCultivationCostPatterns,
    unmetCultivationPressure: report.unmetCultivationPressure,
    aggregateUnmetPressure: report.aggregateUnmetPressure,
    successionQualityScore: report.successionQualityScore,
    opportunityMultiplier: report.opportunityMultiplier,
    riskMultiplier: report.riskMultiplier,
    combinedMultiplier: report.combinedMultiplier,
    activeLegacyOutcomes: resolveActiveLegacyOutcomes(state).map(item => ({
      id: item.pattern.id,
      source: item.source,
      intensity: item.intensity,
    })),
  };
}

function legacyResourcesSatisfaction(money: number, martialHeritage: number): number {
  return (
    Math.min(1, money / 2000) +
    Math.min(1, martialHeritage / 100)
  ) / 2;
}

function testResourcesDimensionIsRetired(): void {
  assert.deepEqual(
    P18_COST_DISCIPLE_CULTIVATION.costDimensions.map(dimension => dimension.dimension),
    ['time', 'attention'],
    'P18 disciple cultivation must retain only time and attention',
  );
  assert.equal(
    P18_COST_DISCIPLE_CULTIVATION.costDimensions.some(dimension =>
      dimension.satisfactionSignals.includes('player.money'),
    ),
    false,
    'P18 disciple cultivation must not use player.money as a satisfaction signal',
  );
  assert.equal(
    P18_COST_DISCIPLE_CULTIVATION.costDimensions.some(dimension =>
      dimension.satisfactionSignals.includes('martialHeritage'),
    ),
    false,
    'martialHeritage must not be a generic P18 resources signal',
  );
}

function testOldMoneyThresholdRedEvidenceAndInvariance(): void {
  const oldLow = legacyResourcesSatisfaction(30, 0);
  const oldHigh = legacyResourcesSatisfaction(2000, 0);
  assert(oldLow < 0.35, `legacy low-money resources satisfaction should be below threshold: ${oldLow}`);
  assert(oldHigh >= 0.35, `legacy high-money resources satisfaction should cross threshold: ${oldHigh}`);

  const low = outcomeForMoney(30);
  const high = outcomeForMoney(2000);
  assert.deepEqual(
    low,
    high,
    'changing only money must not change P18 cultivation pressure or later-life outcome',
  );
}

function testMoneySentinelsDoNotChangeP18Outcome(): void {
  const outcomes = [0, 30, 1999, 2000, 999999].map(outcomeForMoney);
  for (const outcome of outcomes.slice(1)) {
    assert.deepEqual(
      outcome,
      outcomes[0],
      'P18 disciple cultivation outcome must be invariant across money sentinels',
    );
  }
}

function testTimeAndAttentionRemainEffective(): void {
  const lowTime = makeState(800, { flags: { disciple_training_active: false, martial_transmission: false } });
  const highTime = makeState(800, {
    flags: { disciple_training_active: true, martial_transmission: true },
  });
  const lowTimeDimensions = collectUnmetCultivationPressure(lowTime)
    .filter(item => item.patternId === P18_COST_DISCIPLE_CULTIVATION.id)
    .map(item => item.dimension);
  const highTimeDimensions = collectUnmetCultivationPressure(highTime)
    .filter(item => item.patternId === P18_COST_DISCIPLE_CULTIVATION.id)
    .map(item => item.dimension);
  assert(lowTimeDimensions.includes('time'), 'low time investment must remain unmet');
  assert.equal(highTimeDimensions.includes('time'), false, 'high time investment must satisfy time');

  const lowAttention = makeState(800, {
    flags: { disciple_training_active: true, has_disciples: false },
    connections: 0,
  });
  const highAttention = makeState(800, {
    flags: { disciple_training_active: true, has_disciples: true },
    connections: 80,
  });
  const lowAttentionDimensions = collectUnmetCultivationPressure(lowAttention)
    .filter(item => item.patternId === P18_COST_DISCIPLE_CULTIVATION.id)
    .map(item => item.dimension);
  const highAttentionDimensions = collectUnmetCultivationPressure(highAttention)
    .filter(item => item.patternId === P18_COST_DISCIPLE_CULTIVATION.id)
    .map(item => item.dimension);
  assert(lowAttentionDimensions.includes('attention'), 'low attention investment must remain unmet');
  assert.equal(
    highAttentionDimensions.includes('attention'),
    false,
    'high attention investment must satisfy attention',
  );
}

function testMartialHeritageKeepsSuccessorSemantics(): void {
  const low = inferSuccessorQuality(makeState(800, { martialHeritage: 0 }));
  const high = inferSuccessorQuality(makeState(800, { martialHeritage: 100 }));
  assert(high > low, 'martialHeritage must continue to affect successor quality');
}

function testP18OnlyStaticBoundaryAndSnapshotVersion(): void {
  const stateAccessSource = fs.readFileSync(path.resolve('src/p18/stateAccess.ts'), 'utf8');
  const surfaceSource = fs.readFileSync(
    path.resolve('src/narrative/profile/wuxiaLegacySurfaces.ts'),
    'utf8',
  );
  assert.equal(/key === ['"]money['"]/.test(stateAccessSource), false);
  assert.equal(surfaceSource.includes("dimension: 'resources'"), false);
  assert.equal(surfaceSource.includes('wealthCapacity'), false);
  assert.equal(surfaceSource.includes('wealth_capacity_at_least'), false);
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.15.0');
}

testOldMoneyThresholdRedEvidenceAndInvariance();
testResourcesDimensionIsRetired();
testMoneySentinelsDoNotChangeP18Outcome();
testTimeAndAttentionRemainEffective();
testMartialHeritageKeepsSuccessorSemantics();
testP18OnlyStaticBoundaryAndSnapshotVersion();
console.log('✔ globalMoneyP18ResourceRetirement passed');
