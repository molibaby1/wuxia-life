import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { P17_MAINTENANCE_SECT_LEADERSHIP } from '../src/narrative/profile/wuxiaConsequenceSurfaces';
import { resolveActiveAchievementMaintenance } from '../src/p17/achievementMaintenance';
import { buildLaterLifeConsequenceReport } from '../src/p17/laterLifeSelection';
import type { GameState } from '../src/types/eventTypes';

type SectLeadershipOutcome = {
  activeMaintenancePatterns: string[];
  unmetDimensions: Array<{
    dimension: string;
    requiredLevel: number;
    currentLevel: number;
    pressure: number;
  }>;
  aggregatePressure: number;
  opportunityMultiplier: number;
  riskMultiplier: number;
  combinedMultiplier: number;
};

function makeCanonicalSectMasterState(money: number, wealth?: number): GameState {
  const state = new GameEngineIntegration().getGameState();
  state.player.age = 35;
  state.player.influence = 80;
  state.player.connections = 40;
  state.player.money = money;
  state.player.flags = { sect_master: true };
  state.flags = { sect_master: true };
  if (wealth === undefined) {
    delete state.player.wealth;
  } else {
    state.player.wealth = wealth;
  }
  return state;
}

function sectLeadershipOutcome(state: GameState): SectLeadershipOutcome {
  const maintenance = resolveActiveAchievementMaintenance(state).find(
    item => item.pattern.id === P17_MAINTENANCE_SECT_LEADERSHIP.id,
  );
  assert(maintenance, 'sect leadership maintenance must be active');

  const report = buildLaterLifeConsequenceReport(
    state,
    new Set(['decline', 'instability', 'sect']),
    35,
  );

  return {
    activeMaintenancePatterns: report.activeMaintenancePatterns,
    unmetDimensions: maintenance.unmet.map(item => ({
      dimension: item.dimension,
      requiredLevel: item.requiredLevel,
      currentLevel: item.currentLevel,
      pressure: item.pressure,
    })),
    aggregatePressure: report.aggregateUnmetPressure,
    opportunityMultiplier: report.opportunityMultiplier,
    riskMultiplier: report.riskMultiplier,
    combinedMultiplier: report.combinedMultiplier,
  };
}

function testMoneyInvariance(): void {
  const outcomes = [0, 500, 5000, 999999].map(money =>
    sectLeadershipOutcome(makeCanonicalSectMasterState(money, 0)),
  );

  for (const outcome of outcomes.slice(1)) {
    assert.deepEqual(outcome, outcomes[0], 'changing only money must not change P17 sect leadership maintenance');
  }
}

function testNumericWealthInvariance(): void {
  const outcomes = [undefined, 0, 5000, 999999].map(wealth =>
    sectLeadershipOutcome(makeCanonicalSectMasterState(0, wealth)),
  );

  for (const outcome of outcomes.slice(1)) {
    assert.deepEqual(
      outcome,
      outcomes[0],
      'changing only numeric wealth must not change P17 sect leadership maintenance',
    );
  }
}

function testCombinedExtremeSentinelInvariance(): void {
  assert.deepEqual(
    sectLeadershipOutcome(makeCanonicalSectMasterState(0, 0)),
    sectLeadershipOutcome(makeCanonicalSectMasterState(999999, 999999)),
    'combined money and numeric wealth extremes must not change P17 sect leadership maintenance',
  );
}

function testInternalStabilityRemainsEffective(): void {
  const lowStability = makeCanonicalSectMasterState(0, 0);
  lowStability.player.influence = 0;
  const highStability = makeCanonicalSectMasterState(0, 0);
  highStability.player.influence = 100;

  const lowOutcome = sectLeadershipOutcome(lowStability);
  const highOutcome = sectLeadershipOutcome(highStability);

  assert(
    lowOutcome.unmetDimensions.some(item => item.dimension === 'internal_stability'),
    'low influence must leave internal_stability unmet',
  );
  assert(
    !highOutcome.unmetDimensions.some(item => item.dimension === 'internal_stability'),
    'high influence must satisfy internal_stability',
  );
  assert(lowOutcome.riskMultiplier > highOutcome.riskMultiplier, 'internal stability must still affect decline risk');
}

function testOtherP17MaintenancePatternsRemain(): void {
  const hero = new GameEngineIntegration().getGameState();
  hero.flags = { hero_rep_mantle: true };
  hero.player.flags = { hero_rep_mantle: true };
  const family = new GameEngineIntegration().getGameState();
  family.flags = { married: true };
  family.player.flags = { married: true };

  const heroPatterns = resolveActiveAchievementMaintenance(hero).map(item => item.pattern.id);
  const familyPatterns = resolveActiveAchievementMaintenance(family).map(item => item.pattern.id);
  assert(heroPatterns.includes('p17_hero_reputation_upkeep'), 'hero reputation maintenance must remain active');
  assert(familyPatterns.includes('p17_family_legacy_upkeep'), 'family legacy maintenance must remain active');
}

function testNoSyntheticOrWealthReplacement(): void {
  assert.deepEqual(P17_MAINTENANCE_SECT_LEADERSHIP.dimensions, [
    {
      dimension: 'internal_stability',
      requiredLevel: 0.5,
      neglectRiskMultiplier: 1.45,
      satisfactionSignals: ['player.influence', 'player.connections'],
    },
  ]);

  const stateAccessSource = fs.readFileSync(path.resolve('src/p17/stateAccess.ts'), 'utf8');
  assert.equal(/player\.(money|wealth)/.test(stateAccessSource), false, 'P17 accessor must not read money or numeric wealth');
  assert.equal(stateAccessSource.includes('wealthCapacity'), false, 'P17 must not add a Wealth Capacity replacement');
  assert.equal(stateAccessSource.includes('resources'), false, 'P17 accessor must not retain resources plumbing');
}

function main(): void {
  testMoneyInvariance();
  testNumericWealthInvariance();
  testCombinedExtremeSentinelInvariance();
  testInternalStabilityRemainsEffective();
  testOtherP17MaintenancePatternsRemain();
  testNoSyntheticOrWealthReplacement();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.15.0');
  console.log('globalMoneyP17ResourceRetirement.test.ts: ok');
}

main();
