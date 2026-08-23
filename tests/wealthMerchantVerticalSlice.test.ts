import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { GameState } from '../src/types/eventTypes';

function makeState(): GameState {
  const engine = new GameEngineIntegration();
  engine.startNewGame('商贾竖切', 'male');
  return engine.getGameState();
}

async function run(): Promise<void> {
  const loader = EventLoader.getInstance();
  const evaluator = new ConditionEvaluator();

  const origin = loader.getEventById('origin_background')!;
  const merchantOrigin = origin.choices!.find(choice => choice.id === 'origin_merchant_family')!;
  assert(
    merchantOrigin.effects.some(
      effect => effect.type === 'wealth_capacity_set' && effect.value === 'comfortable_means',
    ),
    'merchant origin must explicitly seed comfortable_means',
  );
  assert(
    merchantOrigin.effects.some(
      effect => effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money' && effect.value === 200,
    ),
    'merchant origin must retain legacy money +200 for migrated and legacy consumers',
  );

  const failure = loader.getEventById('merchant_shop_failure')!;
  const investMore = failure.choices!.find(choice => choice.id === 'invest_more')!;
  assert.deepEqual(
    investMore.condition,
    {
      type: 'wealth_capacity_at_least',
      minimum: 'modest_savings',
    },
    'invest_more must use canonical singular wealth_capacity_at_least condition',
  );
  assert.equal(
    (investMore as any).conditions,
    undefined,
    'invest_more must not keep the plural conditions field',
  );
  // The retained money -50 is legacy migration debt; it must not be read as Wealth Capacity consumption.
  assert(
    investMore.effects.some(
      effect => effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money' && effect.value === -50,
    ),
    'invest_more must retain legacy money -50 during Phase 1A',
  );

  const peak = loader.getEventById('merchant_wealth_peak')!;
  assert(
    peak.autoEffects?.some(
      effect => effect.type === 'wealth_capacity_set' && effect.value === 'regional_magnate',
    ),
    'merchant_wealth_peak must explicitly seed regional_magnate',
  );
  assert(
    peak.autoEffects?.some(
      effect => effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money' && effect.value === 200,
    ),
    'merchant_wealth_peak must retain legacy money +200 for downstream consumers',
  );

  const engine = new GameEngineIntegration();
  engine.startNewGame('商贾竖切', 'male');
  assert.equal(engine.getGameState().player.wealthCapacity, 'no_surplus', 'new game starts at no_surplus');
  const moneyBeforeOrigin = engine.getGameState().player.money;
  // Neutralize random trait growth multipliers so this slice checks the legacy cash delta itself.
  engine.getGameState().player.traits = [];

  await engine.executeChoiceEffects(
    merchantOrigin.effects,
    origin.id,
    merchantOrigin.id,
  );
  const afterOrigin = engine.getGameState();
  assert.equal(
    afterOrigin.player.wealthCapacity,
    'comfortable_means',
    'merchant origin must change no_surplus to comfortable_means',
  );
  assert.equal(
    afterOrigin.player.money,
    moneyBeforeOrigin + 200,
    'merchant origin must keep legacy money +200 alongside Capacity seeding',
  );

  const noSurplusState = makeState();
  noSurplusState.player.wealthCapacity = 'no_surplus';
  noSurplusState.player.money = 999;
  assert.equal(
    evaluator.evaluate(investMore.condition!, noSurplusState),
    false,
    'no_surplus player must not be able to choose invest_more',
  );

  const modestSavingsState = makeState();
  modestSavingsState.player.wealthCapacity = 'modest_savings';
  modestSavingsState.player.money = 0;
  assert.equal(
    evaluator.evaluate(investMore.condition!, modestSavingsState),
    true,
    'modest_savings player must be able to choose invest_more regardless of legacy money',
  );

  const moneyBeforePeak = afterOrigin.player.money;
  const afterPeak = await engine.executeChoiceEffects(
    peak.autoEffects ?? [],
    peak.id,
  );
  assert.equal(
    afterPeak.gameState.player.wealthCapacity,
    'regional_magnate',
    'merchant_wealth_peak must set regional_magnate',
  );
  assert.equal(
    afterPeak.gameState.player.money,
    moneyBeforePeak + 200,
    'merchant_wealth_peak must keep legacy money +200 alongside Capacity seeding',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .then(() => console.log('wealthMerchantVerticalSlice.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
