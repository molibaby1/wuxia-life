import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { EventChoice, EventDefinition } from '../src/types/eventTypes';
import type { GameState } from '../src/types/eventTypes';

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

function baseState(): GameState {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Merchant Caravan Legacy Money Migration', 'male');
  return engine.getGameState();
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

function testAuthoringSemantics(): void {
  const caravan = getEvent('merchant_caravan_guard');
  const elite = getChoice(caravan, 'hire_elite_guards');
  const personal = getChoice(caravan, 'escort_personally');
  const normal = getChoice(caravan, 'hire_normal_guards');

  assert.deepEqual(elite.condition, {
    type: 'wealth_capacity_at_least',
    minimum: 'comfortable_means',
  });
  assert.equal((elite as EventChoice & { conditions?: unknown }).conditions, undefined);
  assert.equal(hasMoneyEffect(elite), false);
  assert(hasAdditiveStatEffect(elite, 'reputation', 10));
  assert.equal(elite.text.includes('金钱'), false);
  assert.equal(elite.text.includes('150'), false);

  assert.deepEqual(personal.condition, {
    type: 'expression',
    expression: 'martialPower >= 30',
  });
  assert.equal((personal as EventChoice & { conditions?: unknown }).conditions, undefined);
  assert.equal(hasMoneyEffect(personal), false);
  assert(hasAdditiveStatEffect(personal, 'martialPower', 5));
  assert(
    personal.effects?.some(
      effect => effect.type === 'wealth_capacity_raise_to'
        && effect.minimum === 'comfortable_means',
    ),
  );

  assert.equal(hasMoneyEffect(normal), false);
  assert(hasAdditiveStatEffect(normal, 'charisma', 3));
  assert.equal(
    normal.effects?.some(effect => effect.type === 'wealth_capacity_raise_to'),
    false,
  );

  const market = getEvent('merchant_market_monopoly');
  assert.deepEqual(market.conditions, [
    {
      type: 'expression',
      expression: 'flags.merchant_caravan_success == true',
    },
    {
      type: 'wealth_capacity_at_least',
      minimum: 'comfortable_means',
    },
  ]);

  for (const choice of market.choices ?? []) {
    assert.equal(hasMoneyEffect(choice), false);
  }
}

function testEligibilityRuntime(): void {
  const evaluator = new ConditionEvaluator();
  const caravan = getEvent('merchant_caravan_guard');
  const elite = getChoice(caravan, 'hire_elite_guards');
  const personal = getChoice(caravan, 'escort_personally');

  const richButLowWealth = baseState();
  richButLowWealth.player.wealthCapacity = 'modest_savings';
  assert.equal(evaluator.evaluate(elite.condition!, richButLowWealth), false);

  const comfortableNoMoney = baseState();
  comfortableNoMoney.player.wealthCapacity = 'comfortable_means';
  assert.equal(evaluator.evaluate(elite.condition!, comfortableNoMoney), true);

  const lowMartial = baseState();
  lowMartial.player.martialPower = 29;
  assert.equal(evaluator.evaluate(personal.condition!, lowMartial), false);

  const sufficientMartial = baseState();
  sufficientMartial.player.martialPower = 30;
  assert.equal(evaluator.evaluate(personal.condition!, sufficientMartial), true);
}

async function testEliteEffectsRuntime(): Promise<void> {
  const caravan = getEvent('merchant_caravan_guard');
  const elite = getChoice(caravan, 'hire_elite_guards');

  const engine = new GameEngineIntegration();
  engine.startNewGame('Merchant Caravan Elite', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'comfortable_means';
  state.player.traits = [];
  const reputationBefore = engine.getGameState().player.reputation;

  await engine.executeChoiceEffects(elite.effects ?? [], caravan.id, elite.id);
  const after = engine.getGameState();
  assert.equal('money' in after.player, false);
  assert.equal(after.player.wealthCapacity, 'comfortable_means');
  assert.equal(after.player.reputation, reputationBefore + 10);
  assert.equal(after.flags.merchant_caravan_success, true);
}

async function testPersonalEffectsFromModestSavings(): Promise<void> {
  const caravan = getEvent('merchant_caravan_guard');
  const personal = getChoice(caravan, 'escort_personally');

  const engine = new GameEngineIntegration();
  engine.startNewGame('Merchant Caravan Personal Modest', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'modest_savings';
  state.player.martialPower = 30;
  state.player.traits = [];
  const martialBefore = engine.getGameState().player.martialPower;

  await engine.executeChoiceEffects(personal.effects ?? [], caravan.id, personal.id);
  const after = engine.getGameState();
  assert.equal('money' in after.player, false);
  assert.equal(after.player.wealthCapacity, 'comfortable_means');
  assert.equal(after.player.martialPower, martialBefore + 5);
  assert.equal(after.flags.merchant_caravan_success, true);
}

async function testPersonalEffectsFromWealthy(): Promise<void> {
  const caravan = getEvent('merchant_caravan_guard');
  const personal = getChoice(caravan, 'escort_personally');

  const engine = new GameEngineIntegration();
  engine.startNewGame('Merchant Caravan Personal Wealthy', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'wealthy';
  state.player.martialPower = 30;
  await engine.executeChoiceEffects(personal.effects ?? [], caravan.id, personal.id);
  const after = engine.getGameState();
  assert.equal(after.player.wealthCapacity, 'wealthy');
}

async function testNormalEffectsRuntime(): Promise<void> {
  const caravan = getEvent('merchant_caravan_guard');
  const normal = getChoice(caravan, 'hire_normal_guards');

  const engine = new GameEngineIntegration();
  engine.startNewGame('Merchant Caravan Normal', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'modest_savings';
  state.player.traits = [];
  const charismaBefore = engine.getGameState().player.charisma;

  await engine.executeChoiceEffects(normal.effects ?? [], caravan.id, normal.id);
  const after = engine.getGameState();
  assert.equal('money' in after.player, false);
  assert.equal(after.player.wealthCapacity, 'modest_savings');
  assert.equal(after.player.charisma, charismaBefore + 3);
  assert.notEqual(after.flags.merchant_caravan_success, true);
}

function testDownstreamContinuityRuntime(): void {
  const evaluator = new ConditionEvaluator();
  const market = getEvent('merchant_market_monopoly');

  const successButLowWealth = baseState();
  successButLowWealth.flags = { merchant_caravan_success: true };
  successButLowWealth.player.flags = { merchant_caravan_success: true };
  successButLowWealth.player.wealthCapacity = 'modest_savings';
  assert.equal(evaluator.evaluate(market.conditions![0], successButLowWealth), true);
  assert.equal(evaluator.evaluate(market.conditions![1], successButLowWealth), false);

  const successAndComfortable = baseState();
  successAndComfortable.flags = { merchant_caravan_success: true };
  successAndComfortable.player.flags = { merchant_caravan_success: true };
  successAndComfortable.player.wealthCapacity = 'comfortable_means';
  assert.equal(evaluator.evaluate(market.conditions![0], successAndComfortable), true);
  assert.equal(evaluator.evaluate(market.conditions![1], successAndComfortable), true);
}

async function run(): Promise<void> {
  testAuthoringSemantics();
  testEligibilityRuntime();
  await testEliteEffectsRuntime();
  await testPersonalEffectsFromModestSavings();
  await testPersonalEffectsFromWealthy();
  await testNormalEffectsRuntime();
  testDownstreamContinuityRuntime();
  console.log('merchantCaravanLegacyMoneyMigration.test.ts: ok');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
