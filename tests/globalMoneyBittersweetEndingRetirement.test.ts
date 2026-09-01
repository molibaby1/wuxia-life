import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EndingSystem } from '../src/core/EndingSystem';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { GameState } from '../src/types/eventTypes';

const MONEY_SENTINELS = [-1, -1000, 0, 100, 9999];

function makeHighAchievementState(money: number): GameState {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.player.age = 70;
  state.player.martialPower = 75;
  state.player.reputation = 40;
  state.player.knowledge = 20;
  state.player.connections = 20;
  state.player.businessAcumen = 0;
  state.player.influence = 0;
  state.player.chivalry = 0;
  state.player.spouse = null;
  state.player.children = 0;
  state.player.flags = {};
  state.player.traits = [];
  return state;
}

function testMoneyCannotSelectBittersweetEnding(): void {
  for (const money of MONEY_SENTINELS) {
    const ending = EndingSystem.determineEnding(makeHighAchievementState(money));
    assert.equal(
      ending.id,
      'unfulfilled_ambition',
      `money=${money} must not select bittersweet_success or change the stable neutral classification`
    );
  }
}

function testBittersweetEndingDefinitionRemains(): void {
  const ending = EndingSystem.getEndingById('bittersweet_success');

  assert(ending, 'bittersweet_success must remain in the ending catalog');
  assert.equal(ending.category, 'neutral');
  assert.equal(ending.name, '有成有憾');
}

function testRetiredNeutralSiblingRemainsBeforeOtherBranches(): void {
  const retired = makeHighAchievementState(-1);
  retired.player.flags = { retired: true };

  assert.equal(
    EndingSystem.determineEnding(retired).id,
    'hermit_life',
    'retired players must keep the existing hermit_life precedence',
  );
}

function testNoReplacementClassifierWasAdded(): void {
  const source = fs.readFileSync(path.resolve('src/core/EndingSystem.ts'), 'utf8');
  const start = source.indexOf('private static determineNeutralEnding');
  assert(start >= 0, 'neutral ending classifier must remain identifiable');

  const neutralClassifier = source.slice(start);
  assert.equal(neutralClassifier.includes('bittersweet_success'), false);
  assert.equal(
    /data\.money|wealthCapacity|\bwealth\b|lossScore|costScore|healthStatus|setback|failure|asset/i.test(
      neutralClassifier,
    ),
    false,
    'neutral classifier must not replace the retired wallet condition with a cost proxy',
  );
}

function main(): void {
  testMoneyCannotSelectBittersweetEnding();
  testBittersweetEndingDefinitionRemains();
  testRetiredNeutralSiblingRemainsBeforeOtherBranches();
  testNoReplacementClassifierWasAdded();
  console.log('globalMoneyBittersweetEndingRetirement.test.ts: ok');
}

main();
