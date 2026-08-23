import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { hasAsset } from '../src/core/assetOwnership';
import type { EventChoice, EventCondition, EventDefinition } from '../src/types/eventTypes';
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

function expressionConditions(event: EventDefinition): string[] {
  return (event.conditions ?? [])
    .filter((condition): condition is Extract<EventCondition, { type: 'expression' }> => condition.type === 'expression')
    .map(condition => condition.expression);
}

function hasMoneyEffect(choice: EventChoice): boolean {
  return (choice.effects ?? []).some(
    effect => effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money',
  );
}

function hasWealthMutation(choice: EventChoice): boolean {
  return (choice.effects ?? []).some(
    effect => effect.type === 'wealth_capacity_set' || effect.type === 'wealth_capacity_raise_to',
  );
}

function hasAssetAddMerchantShop(choice: EventChoice): boolean {
  return (choice.effects ?? []).some(
    effect => effect.type === 'asset_add' && effect.asset === 'merchant_shop',
  );
}

function hasAssetRemoveMerchantShop(choice: EventChoice): boolean {
  return (choice.effects ?? []).some(
    effect => effect.type === 'asset_remove' && effect.asset === 'merchant_shop',
  );
}

function hasReputationMinusFive(choice: EventChoice): boolean {
  return (choice.effects ?? []).some(
    effect =>
      effect.type === 'stat_modify'
      && (effect.target ?? effect.stat) === 'reputation'
      && effect.value === -5,
  );
}

function hasMerchantShopFailedFlag(choice: EventChoice): boolean {
  return (choice.effects ?? []).some(
    effect => effect.type === 'flag_set' && effect.flag === 'merchant_shop_failed' && effect.value === true,
  );
}

function baseState(): GameState {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Merchant Shop Legacy Money Migration', 'male');
  return engine.getGameState();
}

function testAuthoringSemantics(): void {
  const talent = getEvent('merchant_talent_discovery');
  const studyBusiness = getChoice(talent, 'study_business');
  const talentExpr = expressionConditions(talent).join(' ');

  assert.equal(talentExpr.includes('money'), false);
  assert.match(talentExpr, /flags\.origin_merchant_family/);
  assert(
    studyBusiness.effects?.some(
      effect => effect.type === 'wealth_capacity_raise_to' && effect.minimum === 'modest_savings',
    ),
  );
  assert.equal(hasMoneyEffect(studyBusiness), false);

  const shop = getEvent('merchant_first_shop');
  assert.deepEqual(shop.conditions, [
    { type: 'expression', expression: 'flags.merchant_talent == true' },
    { type: 'wealth_capacity_at_least', minimum: 'modest_savings' },
  ]);

  for (const choiceId of ['open_grocery_shop', 'open_weapon_shop', 'open_herb_shop'] as const) {
    const choice = getChoice(shop, choiceId);
    assert.equal(hasMoneyEffect(choice), false);
    assert(hasAssetAddMerchantShop(choice));
  }

  const failure = getEvent('merchant_shop_failure');
  const investMore = getChoice(failure, 'invest_more');
  assert.deepEqual(investMore.condition, {
    type: 'wealth_capacity_at_least',
    minimum: 'modest_savings',
  });
  assert.equal(hasMoneyEffect(investMore), false);
  assert.equal(hasWealthMutation(investMore), false);

  const closeShop = getChoice(failure, 'close_shop');
  assert.equal(hasMoneyEffect(closeShop), false);
  assert(hasAssetRemoveMerchantShop(closeShop));
  assert(hasReputationMinusFive(closeShop));
  assert(hasMerchantShopFailedFlag(closeShop));
  assert.equal(closeShop.text.includes('金钱'), false);

  const caravan = getEvent('merchant_caravan_guard');
  assert(caravan.choices!.some(choice => hasMoneyEffect(choice)));
  assert(
    caravan.choices!.some(choice =>
      JSON.stringify((choice as EventChoice).conditions ?? []).includes('money >= 150'),
    ),
  );
}

function testTalentEligibilityRuntime(): void {
  const evaluator = new ConditionEvaluator();
  const talent = getEvent('merchant_talent_discovery');

  const richButUnqualified = baseState();
  richButUnqualified.player.money = 999;
  richButUnqualified.player.charisma = 1;
  richButUnqualified.flags = { route_merchant: true };
  richButUnqualified.player.flags = { route_merchant: true };
  assert.equal(evaluator.evaluate(talent.conditions![0], richButUnqualified), false);

  const merchantOrigin = baseState();
  merchantOrigin.player.money = 0;
  merchantOrigin.player.charisma = 1;
  merchantOrigin.flags = {
    origin_merchant_family: true,
    route_merchant: true,
  };
  merchantOrigin.player.flags = {
    origin_merchant_family: true,
    route_merchant: true,
  };
  assert.equal(evaluator.evaluate(talent.conditions![0], merchantOrigin), true);

  const hvgState = baseState();
  hvgState.player.money = 0;
  hvgState.player.charisma = 1;
  hvgState.flags = {
    route_merchant: true,
    hvg_merchant_first_challenge_done: true,
  };
  hvgState.player.flags = {
    route_merchant: true,
    hvg_merchant_first_challenge_done: true,
  };
  assert.equal(evaluator.evaluate(talent.conditions![0], hvgState), true);
}

function testFirstShopEligibilityNoFallback(): void {
  const evaluator = new ConditionEvaluator();
  const shop = getEvent('merchant_first_shop');

  const blocked = baseState();
  blocked.player.wealthCapacity = 'no_surplus';
  blocked.player.money = 999;
  blocked.flags = { merchant_talent: true };
  blocked.player.flags = { merchant_talent: true };
  assert.equal(evaluator.evaluate(shop.conditions![0], blocked), true);
  assert.equal(evaluator.evaluate(shop.conditions![1], blocked), false);

  const eligible = baseState();
  eligible.player.wealthCapacity = 'modest_savings';
  eligible.player.money = 0;
  eligible.flags = { merchant_talent: true };
  eligible.player.flags = { merchant_talent: true };
  assert.equal(evaluator.evaluate(shop.conditions![0], eligible), true);
  assert.equal(evaluator.evaluate(shop.conditions![1], eligible), true);
}

async function testFullRuntimeVertical(): Promise<void> {
  const talent = getEvent('merchant_talent_discovery');
  const shop = getEvent('merchant_first_shop');
  const failure = getEvent('merchant_shop_failure');
  const studyBusiness = getChoice(talent, 'study_business');
  const openGrocery = getChoice(shop, 'open_grocery_shop');
  const investMore = getChoice(failure, 'invest_more');
  const closeShop = getChoice(failure, 'close_shop');

  const engine = new GameEngineIntegration();
  engine.startNewGame('Merchant Shop Legacy Money Migration', 'male');
  const initial = engine.getGameState();
  initial.player.wealthCapacity = 'no_surplus';
  initial.player.money = MONEY_SENTINEL;
  initial.flags = {
    route_merchant: true,
    hvg_merchant_first_challenge_done: true,
  };
  initial.player.flags = {
    route_merchant: true,
    hvg_merchant_first_challenge_done: true,
  };

  await engine.executeChoiceEffects(studyBusiness.effects ?? [], talent.id, studyBusiness.id);
  const afterTalent = engine.getGameState();
  assert.equal(afterTalent.player.wealthCapacity, 'modest_savings');
  assert.equal(afterTalent.player.money, MONEY_SENTINEL);

  const evaluator = new ConditionEvaluator();
  assert.equal(evaluator.evaluate(shop.conditions![1], afterTalent), true);

  await engine.executeChoiceEffects(openGrocery.effects ?? [], shop.id, openGrocery.id);
  const afterOpen = engine.getGameState();
  assert.equal(hasAsset(afterOpen.facts, 'merchant_shop'), true);
  assert.equal(afterOpen.player.money, MONEY_SENTINEL);

  afterOpen.flags = {
    ...afterOpen.flags,
    hvg_merchant_caravan_track: true,
  };
  afterOpen.player.flags = {
    ...afterOpen.player.flags,
    hvg_merchant_caravan_track: true,
  };
  assert.equal(evaluator.evaluate(investMore.condition!, afterOpen), true);

  await engine.executeChoiceEffects(investMore.effects ?? [], failure.id, investMore.id);
  const afterInvest = engine.getGameState();
  assert.equal(afterInvest.player.money, MONEY_SENTINEL);
  assert.equal(afterInvest.player.wealthCapacity, 'modest_savings');

  const closeEngine = new GameEngineIntegration();
  closeEngine.startNewGame('Merchant Shop Legacy Money Migration Close', 'male');
  const closeInitial = closeEngine.getGameState();
  closeInitial.player.wealthCapacity = 'modest_savings';
  closeInitial.player.money = MONEY_SENTINEL;
  await closeEngine.executeChoiceEffects(openGrocery.effects ?? [], shop.id, openGrocery.id);
  await closeEngine.executeChoiceEffects(closeShop.effects ?? [], failure.id, closeShop.id);
  const afterClose = closeEngine.getGameState();
  assert.equal(hasAsset(afterClose.facts, 'merchant_shop'), false);
  assert.equal(afterClose.player.money, MONEY_SENTINEL);
  assert.equal(afterClose.player.wealthCapacity, 'modest_savings');
}

async function testRaiseToDoesNotDowngrade(): Promise<void> {
  const talent = getEvent('merchant_talent_discovery');
  const studyBusiness = getChoice(talent, 'study_business');

  const engine = new GameEngineIntegration();
  engine.startNewGame('Merchant Shop Legacy Money Migration', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'comfortable_means';
  state.flags = {
    route_merchant: true,
    hvg_merchant_first_challenge_done: true,
  };
  state.player.flags = {
    route_merchant: true,
    hvg_merchant_first_challenge_done: true,
  };

  await engine.executeChoiceEffects(studyBusiness.effects ?? [], talent.id, studyBusiness.id);
  assert.equal(engine.getGameState().player.wealthCapacity, 'comfortable_means');
}

async function run(): Promise<void> {
  testAuthoringSemantics();
  testTalentEligibilityRuntime();
  testFirstShopEligibilityNoFallback();
  await testFullRuntimeVertical();
  await testRaiseToDoesNotDowngrade();
  console.log('merchantShopLegacyMoneyMigration.test.ts: ok');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
