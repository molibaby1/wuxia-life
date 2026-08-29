import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventExecutor } from '../src/core/EventExecutor';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { hasAsset } from '../src/core/assetOwnership';
import type { GameState } from '../src/types/eventTypes';

function makeState(): GameState {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Asset Event Semantics', 'male');
  const state = engine.getGameState();
  state.facts = { unrelated_fact: 7 };
  state.player.wealthCapacity = 'comfortable_means';
  return state;
}

async function assertRejects(action: () => Promise<unknown>, expected: RegExp): Promise<void> {
  await assert.rejects(action, expected);
}

async function run(): Promise<void> {
  const evaluator = new ConditionEvaluator();
  const executor = new EventExecutor();
  const state = makeState();

  assert.equal(
    evaluator.evaluate({ type: 'asset_owned', asset: 'merchant_shop' } as never, state),
    false,
  );

  const acquired = await executor.executeEffects([
    { type: 'asset_add', asset: 'merchant_shop' } as never,
  ], state);

  assert.equal(
    evaluator.evaluate({ type: 'asset_owned', asset: 'merchant_shop' } as never, acquired),
    true,
  );
  assert.equal(hasAsset(acquired.facts, 'merchant_shop'), true);
  assert.equal('money' in acquired.player, false);
  assert.equal(acquired.player.wealthCapacity, 'comfortable_means');
  assert.equal(acquired.facts.unrelated_fact, 7);
  assert.notEqual(acquired.facts, state.facts);

  const removed = await executor.executeEffects([
    { type: 'asset_remove', asset: 'merchant_shop' } as never,
  ], acquired);
  assert.equal(
    evaluator.evaluate({ type: 'asset_owned', asset: 'merchant_shop' } as never, removed),
    false,
  );

  const invalidState = makeState();
  invalidState.flags.merchant_shop = true;
  assert.equal(
    evaluator.evaluate({ type: 'asset_owned', asset: 'unknown_asset' } as never, invalidState),
    false,
  );
  await assertRejects(
    () => executor.executeEffects([
      { type: 'asset_add', asset: 'unknown_asset' } as never,
    ], state),
    /invalid asset/i,
  );

  console.log('assetEventSemantics.test.ts: ok');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
