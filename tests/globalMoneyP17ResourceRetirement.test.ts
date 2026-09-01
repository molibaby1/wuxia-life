import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import {
  P17_MAINTENANCE_FAMILY_LEGACY,
  P17_MAINTENANCE_SECT_LEADERSHIP,
  P17_RELATIONSHIP_KINSHIP_DUTY,
} from '../src/narrative/profile/wuxiaConsequenceSurfaces';
import { resolveActiveAchievementMaintenance } from '../src/p17/achievementMaintenance';
import { buildLaterLifeConsequenceReport } from '../src/p17/laterLifeSelection';
import { resolveActiveRelationshipConsequences } from '../src/p17/relationshipConsequences';
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

function testFamilyLegacyRequiresExplicitAchievement(): void {
  const hero = new GameEngineIntegration().getGameState();
  hero.flags = { hero_rep_mantle: true };
  hero.player.flags = { hero_rep_mantle: true };
  const marriedOnly = new GameEngineIntegration().getGameState();
  marriedOnly.flags = { married: true };
  marriedOnly.player.flags = { married: true };
  const familyLegacy = new GameEngineIntegration().getGameState();
  familyLegacy.flags = { family_legacy: true };
  familyLegacy.player.flags = { family_legacy: true };

  const heroPatterns = resolveActiveAchievementMaintenance(hero).map(item => item.pattern.id);
  const marriedOnlyPatterns = resolveActiveAchievementMaintenance(marriedOnly).map(item => item.pattern.id);
  const familyLegacyPatterns = resolveActiveAchievementMaintenance(familyLegacy).map(item => item.pattern.id);
  assert(heroPatterns.includes('p17_hero_reputation_upkeep'), 'hero reputation maintenance must remain active');
  assert(
    !marriedOnlyPatterns.includes(P17_MAINTENANCE_FAMILY_LEGACY.id),
    'married alone must not activate family legacy maintenance',
  );
  assert(
    familyLegacyPatterns.includes(P17_MAINTENANCE_FAMILY_LEGACY.id),
    'family_legacy must continue activating family legacy maintenance',
  );
}

function testMarriageStillActivatesKinshipDuty(): void {
  const married = new GameEngineIntegration().getGameState();
  married.flags = { married: true };
  married.player.flags = { married: true };

  const relationshipPatterns = resolveActiveRelationshipConsequences(married).map(item => item.pattern.id);
  assert(
    relationshipPatterns.includes(P17_RELATIONSHIP_KINSHIP_DUTY.id),
    'married must continue activating kinship duty',
  );
}

function familyLegacyOutcome(children: number): Pick<
  ReturnType<typeof buildLaterLifeConsequenceReport>,
  'activeMaintenancePatterns' | 'unmetMaintenance' | 'aggregateUnmetPressure' |
  'opportunityMultiplier' | 'riskMultiplier' | 'combinedMultiplier'
> {
  const state = new GameEngineIntegration().getGameState();
  state.player.age = 45;
  state.player.children = children;
  state.player.connections = 30;
  state.player.flags = { family_legacy: true };
  state.flags = { family_legacy: true };
  state.lifePath = {
    faction: 'neutral',
    lifeStage: 'legacy',
    achievements: [],
    relationships: { allies: [], enemies: [], mentors: [], disciples: ['d1', 'd2'] },
    commitments: { cannotJoin: [], mustProtect: [], swornEnemies: [] },
  };
  const report = buildLaterLifeConsequenceReport(state, new Set(['family', 'obligation']), 45);
  return {
    activeMaintenancePatterns: report.activeMaintenancePatterns,
    unmetMaintenance: report.unmetMaintenance,
    aggregateUnmetPressure: report.aggregateUnmetPressure,
    opportunityMultiplier: report.opportunityMultiplier,
    riskMultiplier: report.riskMultiplier,
    combinedMultiplier: report.combinedMultiplier,
  };
}

function testFamilyLegacySatisfactionIgnoresChildren(): void {
  assert.deepEqual(
    familyLegacyOutcome(0),
    familyLegacyOutcome(3),
    'family legacy maintenance satisfaction must not improve from child count',
  );
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
  testFamilyLegacyRequiresExplicitAchievement();
  testMarriageStillActivatesKinshipDuty();
  testFamilyLegacySatisfactionIgnoresChildren();
  testNoSyntheticOrWealthReplacement();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
  console.log('globalMoneyP17ResourceRetirement.test.ts: ok');
}

main();
