import assert from 'node:assert/strict';
import { applyStatDeltas } from '../src/core/activePlanning/ActivePlanningService';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { getMinimumActions } from '../src/data/activeActionCatalog';
import { childhoodActionCatalog } from '../src/data/childhoodActionCatalog';
import {
  CANONICAL_PLAYER_NUMERIC_STATS,
  isCanonicalPlayerNumericStat,
  readPlayerNumeric,
  writePlayerNumeric,
} from '../src/utils/playerStatAccess';
import type { PlayerState } from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

function basePlayer(): PlayerState {
  const engine = new GameEngineIntegration();
  engine.startNewGame('US-003', 'male');
  return engine.getGameState().player;
}

function testAllowlistExcludesRetiredAndCapacity(): void {
  assert.equal(isCanonicalPlayerNumericStat('money'), false);
  assert.equal(isCanonicalPlayerNumericStat('wealth'), false);
  assert.equal(isCanonicalPlayerNumericStat('wealthCapacity'), false);
  assert.equal((CANONICAL_PLAYER_NUMERIC_STATS as readonly string[]).includes('money'), false);
  assert.equal(isCanonicalPlayerNumericStat('martialPower'), true);
  assert.equal(isCanonicalPlayerNumericStat('businessAcumen'), true);
}

function testGenericWriteCannotCreateOrMutateRetiredBalances(): void {
  const player = basePlayer();
  const beforeMoney = player.money;
  const beforeWealth = player.wealth;
  writePlayerNumeric(player, 'money', 9999);
  writePlayerNumeric(player, 'wealth', 8888);
  writePlayerNumeric(player, 'wealthCapacity', 7);
  assert.equal(player.money, beforeMoney);
  assert.equal(player.wealth, beforeWealth);
  assert.equal(typeof player.wealthCapacity, 'string');
  assert.equal(Object.prototype.hasOwnProperty.call(player, 'fakeStat'), false);
  writePlayerNumeric(player, 'fakeStat', 42);
  assert.equal(Object.prototype.hasOwnProperty.call(player, 'fakeStat'), false);
  assert.equal(readPlayerNumeric(player, 'money'), 0);
  assert.equal(readPlayerNumeric(player, 'wealth'), 0);
}

function testApplyStatDeltasFailClosed(): void {
  const player = basePlayer();
  const beforeMoney = player.money;
  const beforeWealth = player.wealth;
  const beforeMartial = player.martialPower;
  applyStatDeltas(player, { money: 50, wealth: 40, martialPower: 3, wealthCapacity: 1 });
  assert.equal(player.money, beforeMoney);
  assert.equal(player.wealth, beforeWealth);
  assert.equal(player.martialPower, beforeMartial + 3);
}

function testValidCatalogDeltasStillApply(): void {
  const player = basePlayer();
  const before = {
    martialPower: player.martialPower,
    knowledge: player.knowledge,
    businessAcumen: player.businessAcumen,
    connections: player.connections,
  };
  applyStatDeltas(player, {
    martialPower: 2,
    knowledge: 1,
    businessAcumen: 1,
    connections: 1,
  });
  assert.equal(player.martialPower, before.martialPower + 2);
  assert.equal(player.knowledge, before.knowledge + 1);
  assert.equal(player.businessAcumen, before.businessAcumen + 1);
  assert.equal(player.connections, before.connections + 1);

  for (const action of [...getMinimumActions(), ...childhoodActionCatalog]) {
    for (const reward of action.rewards) {
      assert.equal(
        isCanonicalPlayerNumericStat(reward.stat),
        true,
        `${action.id} reward ${reward.stat} must be canonical`,
      );
    }
    for (const cost of action.costs) {
      assert.equal(
        isCanonicalPlayerNumericStat(cost.stat),
        true,
        `${action.id} cost ${cost.stat} must be canonical`,
      );
    }
  }
}

function main(): void {
  testAllowlistExcludesRetiredAndCapacity();
  testGenericWriteCannotCreateOrMutateRetiredBalances();
  testApplyStatDeltasFailClosed();
  testValidCatalogDeltasStillApply();
  console.log('globalMoneyGenericNumericStatEscapeClosure.test.ts: ok');
}

main();
