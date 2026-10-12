import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventExecutor } from '../src/core/EventExecutor';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { addAsset } from '../src/core/assetOwnership';
import {
  getItemOwnershipState,
  getOwnedItems,
} from '../src/core/itemOwnership';
import { ITEM_DEFINITIONS, type ItemId } from '../src/types/item';
import { EffectType, type EffectDefinition } from '../src/types/eventTypes';

async function main(): Promise<void> {
  assert.equal(
    new Set(ITEM_DEFINITIONS.map(definition => definition.id)).size,
    ITEM_DEFINITIONS.length,
    'registered Item IDs must be unique',
  );

  const engine = new GameEngineIntegration();
  engine.startNewGame('物品测试', 'male');
  const state = engine.getGameState();
  state.facts = { ...addAsset(state.facts, 'merchant_shop'), unrelated_fact: 'kept' };
  state.flags = { unrelated_flag: true };
  state.player.items = [{ id: 'test_martial_manual', name: '旧字段影子物品', quantity: 1 }];
  const baselineStats = { ...state.player };
  const executor = new EventExecutor();
  const evaluator = new ConditionEvaluator();
  const martialItem = ITEM_DEFINITIONS[0]!;
  const familyItem = ITEM_DEFINITIONS[1]!;
  const condition = (type: 'item_owned' | 'item_not_owned', item: ItemId) =>
    ({ type, item }) as const;
  const effect = (type: EffectType.ITEM_ADD | EffectType.ITEM_REMOVE, item: unknown) =>
    ({ type, item }) as unknown as EffectDefinition;

  assert.equal(getItemOwnershipState(state.inventory, martialItem.id), 'not_owned');
  assert.equal(evaluator.evaluate(condition('item_owned', martialItem.id), state), false);
  assert.equal(evaluator.evaluate(condition('item_not_owned', martialItem.id), state), true);
  assert.deepEqual(getOwnedItems(state.inventory), [], 'PlayerState.items must not become Item ownership');

  const acquired = await executor.executeEffects([effect(EffectType.ITEM_ADD, martialItem.id)], state);
  assert.deepEqual(acquired.inventory, [
    { id: martialItem.id, name: martialItem.displayName, quantity: 1 },
  ]);
  assert.equal(state.inventory, undefined, 'effect execution must not mutate its input state');
  assert.equal(evaluator.evaluate(condition('item_owned', martialItem.id), acquired), true);
  assert.equal(evaluator.evaluate(condition('item_not_owned', martialItem.id), acquired), false);
  assert.deepEqual(getOwnedItems(acquired.inventory), [
    { id: martialItem.id, displayName: martialItem.displayName },
  ]);
  assert.deepEqual(acquired.facts, state.facts, 'Item ownership must not alter Asset or other facts');
  assert.equal(acquired.facts, state.facts, 'Item ownership must preserve the Asset facts source');
  assert.deepEqual(acquired.flags, state.flags, 'Item ownership must not alter flags');
  assert.deepEqual(acquired.player, baselineStats, 'Item ownership must not alter player data');

  await assert.rejects(
    executor.executeEffects([effect(EffectType.ITEM_ADD, martialItem.id)], acquired),
    /Cannot add Item test_martial_manual: owned/,
    'duplicate acquisition must fail',
  );
  await assert.rejects(
    executor.executeEffects([effect(EffectType.ITEM_REMOVE, familyItem.id)], acquired),
    /Cannot remove Item test_family_keepsake: not_owned/,
    'removing an unowned Item must fail',
  );
  await assert.rejects(
    executor.executeEffects([effect(EffectType.ITEM_ADD, 'unregistered_item')], state),
    /Invalid Item effect value/,
    'an unregistered Item ID must fail',
  );
  assert.equal(state.inventory, undefined, 'failed operations must leave the original inventory untouched');

  const legacyRows = [
    { id: 'item_jade_pendant', name: '家传玉佩', quantity: 1 },
    { id: 'item_healing_pill', name: '疗伤丹', quantity: 3 },
    { id: 'item_silver', name: '银两', quantity: 3200 },
  ];
  const withLegacyRows = { ...state, inventory: legacyRows };
  const bothAcquired = await executor.executeEffects([
    effect(EffectType.ITEM_ADD, martialItem.id),
    effect(EffectType.ITEM_ADD, familyItem.id),
  ], withLegacyRows);
  assert.deepEqual(bothAcquired.inventory, [
    ...legacyRows,
    { id: martialItem.id, name: martialItem.displayName, quantity: 1 },
    { id: familyItem.id, name: familyItem.displayName, quantity: 1 },
  ], 'unregistered historic rows should be preserved without promotion');
  assert.deepEqual(getOwnedItems(bothAcquired.inventory), [
    { id: martialItem.id, displayName: martialItem.displayName },
    { id: familyItem.id, displayName: familyItem.displayName },
  ]);
  const removed = await executor.executeEffects([effect(EffectType.ITEM_REMOVE, martialItem.id)], bothAcquired);
  assert.deepEqual(removed.inventory, [
    ...legacyRows,
    { id: familyItem.id, name: familyItem.displayName, quantity: 1 },
  ], 'removal must preserve all unrelated legacy data');

  for (const invalidInventory of [
    [{ id: martialItem.id, name: martialItem.displayName, quantity: 0 }],
    [{ id: martialItem.id, name: martialItem.displayName, quantity: 1.5 }],
    [{ id: martialItem.id, name: martialItem.displayName, quantity: 2 }],
    [{ id: martialItem.id, name: '自由伪造名称', quantity: 1 }],
    [
      { id: martialItem.id, name: martialItem.displayName, quantity: 1 },
      { id: martialItem.id, name: martialItem.displayName, quantity: 1 },
    ],
  ]) {
    const invalidState = { ...state, inventory: invalidInventory };
    assert.equal(getItemOwnershipState(invalidState.inventory, martialItem.id), 'invalid');
    assert.equal(evaluator.evaluate(condition('item_owned', martialItem.id), invalidState), false);
    assert.equal(evaluator.evaluate(condition('item_not_owned', martialItem.id), invalidState), false);
    await assert.rejects(
      executor.executeEffects([effect(EffectType.ITEM_ADD, martialItem.id)], invalidState),
      /Cannot add Item test_martial_manual: invalid/,
    );
    await assert.rejects(
      executor.executeEffects([effect(EffectType.ITEM_REMOVE, martialItem.id)], invalidState),
      /Cannot remove Item test_martial_manual: invalid/,
    );
  }

  const invalidIdCondition = {
    type: 'item_owned',
    item: 'unregistered_item',
  } as unknown as Parameters<ConditionEvaluator['evaluate']>[0];
  assert.equal(evaluator.evaluate(invalidIdCondition, state), false);

  await assert.rejects(
    executor.executeEffects([
      effect(EffectType.ITEM_ADD, martialItem.id),
      { type: 'not_an_effect' } as unknown as EffectDefinition,
    ], state),
    /Unknown effect type/,
    'a later effect error must abort the whole local result',
  );
  assert.equal(state.inventory, undefined, 'a later effect error must not partially mutate canonical inventory');
  assert.deepEqual(state.facts, withLegacyRows.facts, 'failed effects must preserve canonical facts');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
