import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EndingSystem } from '../src/core/EndingSystem';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { GameState } from '../src/types/eventTypes';

const MONEY_SENTINELS = [0, 399, 400, 999, 1000, 9999];

function makeState(overrides: Partial<GameState['player']> = {}): GameState {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = 70;
  state.player.martialPower = 0;
  state.player.reputation = 0;
  state.player.knowledge = 0;
  state.player.connections = 20;
  state.player.businessAcumen = 0;
  state.player.influence = 0;
  state.player.chivalry = 0;
  state.player.spouse = null;
  state.player.children = 0;
  state.player.flags = {};
  state.player.traits = [];
  Object.assign(state.player, overrides);
  return state;
}

function endingIdForMoney(money: number, overrides: Partial<GameState['player']> = {}): string {
  return EndingSystem.determineEnding(makeState({ ...overrides, money })).id;
}

function testMoneyDoesNotCreateGenericAchievement(): void {
  const endingIds = MONEY_SENTINELS.map(money => endingIdForMoney(money));

  assert.deepEqual(
    endingIds,
    MONEY_SENTINELS.map(() => 'ordinary_life'),
    'money alone must not classify a generic life as an achievement ending',
  );
}

function testModerateNonMoneyEvidenceRemainsEffective(): void {
  const evidenceCases: Array<Partial<GameState['player']>> = [
    { martialPower: 55 },
    { reputation: 45 },
    { knowledge: 60 },
  ];

  for (const evidence of evidenceCases) {
    for (const money of [0, 9999]) {
      assert.equal(
        endingIdForMoney(money, evidence),
        'unfulfilled_ambition',
        `moderate non-money evidence must remain effective at money=${money}`,
      );
    }
  }
}

function testHighNonMoneyEvidenceRemainsEffective(): void {
  const evidenceCases: Array<Partial<GameState['player']>> = [
    { martialPower: 75 },
    { reputation: 70 },
    { knowledge: 75 },
  ];

  for (const evidence of evidenceCases) {
    for (const money of MONEY_SENTINELS) {
      assert.equal(
        endingIdForMoney(money, { ...evidence, spouse: '发妻', children: 1 }),
        'ordinary_life',
        `high non-money evidence must remain effective at money=${money}`,
      );
    }
  }
}

function testNeutralAchievementBlockHasNoReplacementProxy(): void {
  const source = fs.readFileSync(path.resolve('src/core/EndingSystem.ts'), 'utf8');
  const start = source.indexOf('const hasModerateAchievement');
  const end = source.indexOf("if (data.flags.includes('retired'))", start);
  assert(start >= 0 && end > start, 'neutral achievement block must remain identifiable');
  const achievementBlock = source.slice(start, end);

  assert.equal(/data\.money\s*>=\s*(400|1000)/.test(achievementBlock), false);
  assert.equal(/wealthCapacity|\bwealth\b|businessAcumen|merchantNetwork|merchant-/.test(achievementBlock), false);
}

function main(): void {
  testMoneyDoesNotCreateGenericAchievement();
  testModerateNonMoneyEvidenceRemainsEffective();
  testHighNonMoneyEvidenceRemainsEffective();
  testNeutralAchievementBlockHasNoReplacementProxy();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
  console.log('globalMoneyEndingAchievementRetirement.test.ts: ok');
}

main();
