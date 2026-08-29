import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { addAsset, hasAsset } from '../src/core/assetOwnership';
import type { EventCondition, EventDefinition, EventChoice } from '../src/types/eventTypes';

const SHOP_FLAGS = ['merchant_shop_grocery', 'merchant_shop_weapon', 'merchant_shop_herb'];

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

function effectsOf(choice: EventChoice): Array<Record<string, unknown>> {
  return choice.effects as Array<Record<string, unknown>>;
}

function expressionsOf(event: EventDefinition): string[] {
  return (event.conditions ?? [])
    .filter((condition): condition is Extract<EventCondition, { type: 'expression' }> => condition.type === 'expression')
    .map(condition => condition.expression);
}

async function run(): Promise<void> {
  const shop = getEvent('merchant_first_shop');
  const grocery = getChoice(shop, 'open_grocery_shop');
  const weapon = getChoice(shop, 'open_weapon_shop');
  const herb = getChoice(shop, 'open_herb_shop');

  for (const [choice, flag] of [
    [grocery, 'merchant_shop_grocery'],
    [weapon, 'merchant_shop_weapon'],
    [herb, 'merchant_shop_herb'],
  ] as const) {
    const assetEffects = effectsOf(choice).filter(effect => effect.type === 'asset_add');
    assert.deepEqual(assetEffects, [
      { type: 'asset_add', asset: 'merchant_shop' },
    ], `${choice.id} must add exactly one merchant_shop Asset`);
    assert(
      effectsOf(choice).some(effect => effect.type === 'flag_set' && effect.flag === flag),
      `${choice.id} must retain its historical shop-type flag`,
    );
  }

  const engine = new GameEngineIntegration();
  engine.startNewGame('Merchant Shop Asset Vertical', 'male');
  await engine.executeChoiceEffects(grocery.effects ?? [], shop.id, grocery.id);
  const acquired = engine.getGameState();
  assert.equal('money' in acquired.player, false, 'shop opening must not mutate legacy money');
  assert.equal(hasAsset(acquired.facts, 'merchant_shop'), true);
  assert.equal(acquired.player.flags.merchant_shop_grocery, true);

  const failure = getEvent('merchant_shop_failure');
  assert.deepEqual(failure.conditions?.[0], {
    type: 'asset_owned',
    asset: 'merchant_shop',
  });
  assert.equal(failure.conditions?.length, 2);
  const failureRhythm = expressionsOf(failure).join(' ');
  assert.match(failureRhythm, /!flags\.merchant_shop_success/);
  for (const flag of [
    'hvg_merchant_caravan_track',
    'hvg_merchant_operating_pressure_done',
    'hvg_merchant_ledger_rhythm_expand',
    'hvg_merchant_ledger_pressure_stockout',
  ]) {
    assert.match(failureRhythm, new RegExp(`flags\\.${flag}`));
  }
  for (const flag of SHOP_FLAGS) {
    assert.equal(failureRhythm.includes(flag), false, `failure ownership must not read ${flag}`);
  }

  const closeShop = getChoice(failure, 'close_shop');
  assert(
    effectsOf(closeShop).some(effect => effect.type === 'asset_remove' && effect.asset === 'merchant_shop'),
    'close_shop must remove merchant_shop Asset',
  );
  assert(
    effectsOf(closeShop).some(effect => effect.type === 'flag_set' && effect.flag === 'merchant_shop_failed'),
    'close_shop must retain merchant_shop_failed',
  );

  const evaluator = new ConditionEvaluator();
  const ownershipGate = failure.conditions![0];
  const historicalOnly = {
    ...acquired,
    facts: { historical_fact: true },
    flags: { merchant_shop_grocery: true },
  };
  historicalOnly.player.flags = { merchant_shop_grocery: true };
  assert.equal(evaluator.evaluate(ownershipGate, historicalOnly), false);

  const canonicalOnly = {
    ...acquired,
    facts: addAsset({}, 'merchant_shop'),
    flags: { hvg_merchant_operating_pressure_done: true },
  };
  canonicalOnly.player.flags = { hvg_merchant_operating_pressure_done: true };
  assert.equal(evaluator.evaluate(ownershipGate, canonicalOnly), true);

  await engine.executeChoiceEffects(closeShop.effects ?? [], failure.id, closeShop.id);
  const closed = engine.getGameState();
  assert.equal('money' in closed.player, false, 'shop closing must not mutate legacy money');
  assert.equal(hasAsset(closed.facts, 'merchant_shop'), false);
  assert.equal(closed.player.flags.merchant_shop_grocery, true);
  assert.equal(closed.player.flags.merchant_shop_failed, true);

  const caravan = getEvent('merchant_caravan_guard');
  assert.deepEqual(caravan.conditions?.[0], {
    type: 'asset_owned',
    asset: 'merchant_shop',
  });
  const caravanRhythm = expressionsOf(caravan).join(' ');
  assert.match(caravanRhythm, /!flags\.hvg_merchant_caravan_track/);
  for (const flag of [
    'hvg_merchant_operating_pressure_done',
    'hvg_merchant_caravan_rhythm_fast',
    'hvg_merchant_caravan_rhythm_market',
  ]) {
    assert.match(caravanRhythm, new RegExp(`flags\\.${flag}`));
  }
  for (const flag of SHOP_FLAGS) {
    assert.equal(caravanRhythm.includes(flag), false, `caravan ownership must not read ${flag}`);
  }

  assert.equal(evaluator.evaluate(caravan.conditions![0], closed), false);
  assert.equal(evaluator.evaluate(caravan.conditions![0], canonicalOnly), true);

  console.log('merchantShopAssetVertical.test.ts: ok');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
