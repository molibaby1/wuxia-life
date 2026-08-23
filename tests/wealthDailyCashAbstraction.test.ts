import assert from 'node:assert/strict';

import { executeActiveActionOnState } from '../src/core/activePlanning/ActivePlanningService';
import { activeActionCatalog } from '../src/data/activeActionCatalog';
import { childhoodActionCatalog } from '../src/data/childhoodActionCatalog';
import { dailyEvents } from '../src/data/life/dailyEvents';
import { GameTestFramework } from './GameTestFramework';
import type { ActiveActionDefinition } from '../src/types/activeActionTypes';

function createState() {
  return (new GameTestFramework() as unknown as { createTestState(): ReturnType<GameTestFramework['createTestState']> }).createTestState();
}

function findAction(id: string): ActiveActionDefinition {
  const found = [...activeActionCatalog, ...childhoodActionCatalog].find(action => action.id === id);
  assert(found, `missing action ${id}`);
  return found;
}

function findDailyEvent(id: string) {
  const found = dailyEvents.find(event => event.id === id);
  assert(found, `missing daily event ${id}`);
  return found;
}

function assertNoMoneyChannel(action: ActiveActionDefinition): void {
  assert.equal(action.rewards.some(reward => reward.stat === 'money'), false, `${action.id} must not reward money`);
  assert.equal(action.costs.some(cost => cost.stat === 'money'), false, `${action.id} must not cost money`);
}

function testAdultBasicActionsDoNotChangeMoneyOrExposePressure(): void {
  const ids = [
    'action_training_basic',
    'action_study_basic',
    'action_socializing_basic',
    'action_business_basic',
    'action_travel_basic',
  ];

  for (const id of ids) {
    const state = createState();
    const before = state.player.money;
    const result = executeActiveActionOnState(state, id, { random: () => 0.5, includeDisturbance: false });

    assert(result, `${id} must execute`);
    assert.equal(state.player.money, before, `${id} must not alter ordinary cash balance`);
    assert.equal('resourcePressureNotice' in result.activeActionSummary, false, `${id} must not surface money pressure notice`);
    assertNoMoneyChannel(findAction(id));
  }
}

function testChildhoodBusinessActionsKeepGrowthWithoutMoney(): void {
  const errand = findAction('action_household_errand');
  const apprentice = findAction('action_household_apprentice');

  assert.deepEqual(
    errand.rewards.filter(reward => reward.stat !== 'money'),
    [
      { stat: 'businessAcumen', min: 1, max: 1 },
      { stat: 'knowledge', min: 0, max: 1 },
    ],
    'household errand must keep non-money growth',
  );
  assert.deepEqual(
    apprentice.rewards.filter(reward => reward.stat !== 'money'),
    [{ stat: 'businessAcumen', min: 1, max: 2 }],
    'household apprentice must keep non-money growth',
  );
  assert.equal(errand.rewards.some(reward => reward.stat === 'money'), false, 'household errand must no longer reward money');
  assert.equal(apprentice.rewards.some(reward => reward.stat === 'money'), false, 'household apprentice must no longer reward money');
}

function testDailyLivelihoodVariantsLoseOnlyMoneyGain(): void {
  const oddJob = findDailyEvent('daily_take_odd_job');
  const smallTrade = findDailyEvent('daily_small_trade');

  assert.equal(
    oddJob.variants.positive?.some(variant => variant.statEffects?.some(effect => effect.stat === 'money')),
    false,
    'daily_take_odd_job positive variant must not use money statEffects',
  );
  assert.equal(
    oddJob.variants.neutral?.some(variant => variant.statEffects?.some(effect => effect.stat === 'money')),
    false,
    'daily_take_odd_job neutral variant must not use money statEffects',
  );
  assert.equal(
    smallTrade.variants.positive?.some(variant => variant.statEffects?.some(effect => effect.stat === 'money')),
    false,
    'daily_small_trade positive variant must not use money statEffects',
  );
  assert.equal(
    smallTrade.variants.neutral?.some(variant => variant.statEffects?.some(effect => effect.stat === 'money')),
    false,
    'daily_small_trade neutral variant must not use money statEffects',
  );
  assert.equal(
    oddJob.variants.positive?.[0].text.includes('稳住'),
    true,
    'daily_take_odd_job must keep narrative tone',
  );
  assert.equal(
    oddJob.variants.negative?.[0].effects?.some(effect => effect.type === 'status_add'),
    true,
    'daily_take_odd_job must keep status pressure',
  );
  assert.equal(
    smallTrade.variants.negative?.[0].effects?.some(effect => effect.type === 'status_add'),
    true,
    'daily_small_trade must keep status pressure',
  );
}

function testAdultBasicCatalogHasNoOrdinaryMoneyFlow(): void {
  for (const id of [
    'action_training_basic',
    'action_study_basic',
    'action_socializing_basic',
    'action_business_basic',
    'action_travel_basic',
  ]) {
    assertNoMoneyChannel(findAction(id));
  }
}

export async function runWealthDailyCashAbstractionTests(): Promise<void> {
  testAdultBasicActionsDoNotChangeMoneyOrExposePressure();
  testAdultBasicCatalogHasNoOrdinaryMoneyFlow();
  testChildhoodBusinessActionsKeepGrowthWithoutMoney();
  testDailyLivelihoodVariantsLoseOnlyMoneyGain();
  console.log('wealthDailyCashAbstraction.test.ts: ordinary cash-pressure abstraction verified');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWealthDailyCashAbstractionTests().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
