import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { EventChoice, EventDefinition } from '../src/types/eventTypes';
import type { GameState } from '../src/types/eventTypes';
import type { WealthCapacity } from '../src/types/wealthCapacity';

const MONEY_SENTINEL = 37;

function getEvent(id: string): EventDefinition {
  const event = EventLoader.getInstance().getEventById(id);
  assert(event, `missing event: ${id}`);
  return event;
}

function getChoice(event: EventDefinition, id: string): EventChoice {
  const choice = event.choices?.find(candidate => candidate.id === id);
  assert(choice, `missing choice ${id} in ${event.id}`);
  return choice;
}

function hasMoneyEffect(choice: EventChoice): boolean {
  return (choice.effects ?? []).some(
    effect => effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money',
  );
}

function hasAdditiveStatEffect(choice: EventChoice, stat: string, value: number): boolean {
  return (choice.effects ?? []).some(
    effect =>
      effect.type === 'stat_modify'
      && (effect.target ?? effect.stat) === stat
      && effect.value === value
      && effect.operator === 'add',
  );
}

function baseState(): GameState {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Merchant Market Monopoly Legacy Money Migration', 'male');
  return engine.getGameState();
}

function testAuthoringSemantics(): void {
  const market = getEvent('merchant_market_monopoly');
  const monopoly = getChoice(market, 'monopoly_trade');
  const fair = getChoice(market, 'fair_competition');

  assert.equal(hasMoneyEffect(monopoly), false);
  assert(
    monopoly.effects?.some(
      effect => effect.type === 'wealth_capacity_raise_to'
        && effect.minimum === 'wealthy',
    ),
  );
  assert(hasAdditiveStatEffect(monopoly, 'reputation', -10));
  assert(
    monopoly.effects?.some(
      effect => effect.type === 'flag_set'
        && effect.flag === 'merchant_monopoly'
        && effect.value === true,
    ),
  );
  assert.equal(monopoly.text.includes('金钱'), false);
  assert.equal(monopoly.text.includes('+80'), false);

  assert.equal(hasMoneyEffect(fair), false);
  assert.equal(
    fair.effects?.some(effect => effect.type === 'wealth_capacity_raise_to'),
    false,
  );
  assert(hasAdditiveStatEffect(fair, 'reputation', 10));
  assert(
    fair.effects?.some(
      effect => effect.type === 'flag_set'
        && effect.flag === 'merchant_fair_trade'
        && effect.value === true,
    ),
  );
  assert.equal(fair.text.includes('金钱'), false);
  assert.equal(fair.text.includes('+40'), false);
}

async function testMonopolyRuntime(
  wealthCapacity: WealthCapacity,
  expectedWealth: WealthCapacity,
): Promise<void> {
  const market = getEvent('merchant_market_monopoly');
  const monopoly = getChoice(market, 'monopoly_trade');

  const engine = new GameEngineIntegration();
  engine.startNewGame(`Market Monopoly ${wealthCapacity}`, 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = wealthCapacity;
  state.player.reputation = 20;
  state.player.traits = [];
  const reputationBefore = engine.getGameState().player.reputation;

  await engine.executeChoiceEffects(monopoly.effects ?? [], market.id, monopoly.id);
  const after = engine.getGameState();
  assert.equal('money' in after.player, false);
  assert.equal(after.player.wealthCapacity, expectedWealth);
  assert.equal(after.player.reputation, reputationBefore - 10);
  assert.equal(after.flags.merchant_monopoly, true);
}

async function testMonopolyRuntimeMatrix(): Promise<void> {
  await testMonopolyRuntime('comfortable_means', 'wealthy');
  await testMonopolyRuntime('wealthy', 'wealthy');
  await testMonopolyRuntime('regional_magnate', 'regional_magnate');
}

async function testFairRuntime(): Promise<void> {
  const market = getEvent('merchant_market_monopoly');
  const fair = getChoice(market, 'fair_competition');

  const engine = new GameEngineIntegration();
  engine.startNewGame('Market Fair Competition', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'comfortable_means';
  state.player.reputation = 5;
  state.player.traits = [];
  const reputationBefore = engine.getGameState().player.reputation;

  await engine.executeChoiceEffects(fair.effects ?? [], market.id, fair.id);
  const after = engine.getGameState();
  assert.equal('money' in after.player, false);
  assert.equal(after.player.wealthCapacity, 'comfortable_means');
  assert.equal(after.player.reputation, reputationBefore + 10);
  assert.equal(after.flags.merchant_fair_trade, true);
}

async function testOfficialConnectionAfterMonopoly(): Promise<void> {
  const market = getEvent('merchant_market_monopoly');
  const monopoly = getChoice(market, 'monopoly_trade');
  const official = getEvent('merchant_official_connection');
  const evaluator = new ConditionEvaluator();

  const engine = new GameEngineIntegration();
  engine.startNewGame('Official After Monopoly', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'comfortable_means';
  state.player.traits = [];

  await engine.executeChoiceEffects(monopoly.effects ?? [], market.id, monopoly.id);
  const after = engine.getGameState();
  assert.equal(
    evaluator.evaluate(official.conditions![0], after),
    true,
  );
}

async function testOfficialConnectionAfterFair(): Promise<void> {
  const market = getEvent('merchant_market_monopoly');
  const fair = getChoice(market, 'fair_competition');
  const official = getEvent('merchant_official_connection');
  const evaluator = new ConditionEvaluator();

  const engine = new GameEngineIntegration();
  engine.startNewGame('Official After Fair', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'comfortable_means';
  state.player.traits = [];

  await engine.executeChoiceEffects(fair.effects ?? [], market.id, fair.id);
  const after = engine.getGameState();
  assert.equal(
    evaluator.evaluate(official.conditions![0], after),
    true,
  );
}

async function testHiddenWealthEndingAfterFair(): Promise<void> {
  const market = getEvent('merchant_market_monopoly');
  const fair = getChoice(market, 'fair_competition');
  const hiddenWealth = getEvent('merchant_ending_hidden_wealth');
  const evaluator = new ConditionEvaluator();

  const engine = new GameEngineIntegration();
  engine.startNewGame('Hidden Wealth After Fair', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'comfortable_means';
  state.player.traits = [];

  await engine.executeChoiceEffects(fair.effects ?? [], market.id, fair.id);
  const after = engine.getGameState();
  after.player.chivalry = 50;
  assert.equal(
    evaluator.evaluate(hiddenWealth.conditions![0], after),
    true,
  );
}

async function run(): Promise<void> {
  testAuthoringSemantics();
  await testMonopolyRuntimeMatrix();
  await testFairRuntime();
  await testOfficialConnectionAfterMonopoly();
  await testOfficialConnectionAfterFair();
  await testHiddenWealthEndingAfterFair();
  console.log('merchantMarketMonopolyLegacyMoneyMigration.test.ts: ok');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
