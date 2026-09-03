import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import {
  SETBACK_MODIFIABLE_STATS,
  applySetbackEffects,
} from '../src/core/SetbackEventSystem';
import { SETBACK_EVENTS, getSetbackEvent } from '../src/data/setbackEvents';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { EventCategory, EventPriority, type EventDefinition, type GameState } from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const WALLET_SETBACK_IDS = [
  'property_loss',
  'robbery',
  'business_failure',
  'natural_disaster',
] as const;

const MONEY_SENTINELS = [0, 100, 317, 9999] as const;
const NUMERIC_WALLET_HINT = /银两\s*-?\d+|金钱\s*-?\d+|财富\s*-?\d+|money\s*-?\d+/i;

function collectSetbackMoneyMutations(): Array<{ id: string; delta: number }> {
  const mutations: Array<{ id: string; delta: number }> = [];
  for (const event of SETBACK_EVENTS) {
    const delta = event.effects.statChanges?.money;
    if (typeof delta === 'number') mutations.push({ id: event.id, delta });
  }
  return mutations;
}

function requireSetback(id: (typeof WALLET_SETBACK_IDS)[number]) {
  const event = getSetbackEvent(id);
  assert(event, `missing difficulty setback: ${id}`);
  return event;
}

function makeEngineState(): GameState {
  const engine = new GameEngineIntegration();
  engine.startNewGame('E1挫折', 'male');
  const state = engine.getGameState();
  state.player.constitution = 20;
  state.player.businessAcumen = 10;
  state.player.reputation = 30;
  return state;
}

function probeAutoEvent(): EventDefinition {
  return {
    id: 'e1_setback_probe_auto',
    version: '1.0.0',
    category: EventCategory.DAILY_EVENT,
    priority: EventPriority.LOW,
    weight: 1,
    ageRange: { min: 1, max: 1 },
    triggers: [],
    eventType: 'auto',
    autoEffects: [{ type: 'flag_set', target: 'e1_setback_probe', value: true }],
    content: { text: 'probe', title: 'probe' },
    metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags: [] },
  };
}

function testActiveSetbackMoneyMutationCountZero(): void {
  const mutations = collectSetbackMoneyMutations();
  assert.equal(
    mutations.length,
    0,
    `Difficulty Setback active money mutation count must equal 0, got ${mutations.length}: ${JSON.stringify(mutations)}`,
  );
}

function testAllowlistDropsMoney(): void {
  assert.equal(SETBACK_MODIFIABLE_STATS.has('money'), false, 'SETBACK_MODIFIABLE_STATS must not include money');
}

function testSourceGuards(): void {
  const propertyLoss = requireSetback('property_loss');
  assert.equal(propertyLoss.effects.statChanges?.money, undefined);
  assert.equal(Object.keys(propertyLoss.effects.statChanges ?? {}).length, 0);
  assert.equal(propertyLoss.baseProbability, 10);
  assert.equal(propertyLoss.exemption.baseRate, 20);
  assert.deepEqual(propertyLoss.conditions, {});
  assert.equal(propertyLoss.name, '财产损失');
  assert.match(propertyLoss.description, /财产|盗匪|经营/);

  const robbery = requireSetback('robbery');
  assert.equal(robbery.effects.statChanges?.money, undefined);
  assert.equal(robbery.effects.statChanges?.constitution, -3);
  assert.equal(robbery.baseProbability, 7);
  assert.equal(robbery.exemption.constitutionThreshold, 45);
  assert.equal(robbery.exemption.baseRate, 25);
  assert.equal(robbery.name, '遭遇劫匪');

  const businessFailure = requireSetback('business_failure');
  assert.equal(businessFailure.effects.statChanges?.money, undefined);
  assert.equal(businessFailure.effects.statChanges?.businessAcumen, -5);
  assert.equal(businessFailure.baseProbability, 6);
  assert.equal(businessFailure.exemption.constitutionThreshold, 45);
  assert.equal(businessFailure.exemption.baseRate, 25);

  const disaster = requireSetback('natural_disaster');
  assert.equal(disaster.effects.statChanges?.money, undefined);
  assert.equal(disaster.effects.statChanges?.constitution, -10);
  assert.equal(disaster.effects.statChanges?.reputation, -15);
  assert.equal(disaster.baseProbability, 1);
  assert.equal(disaster.exemption.constitutionThreshold, 60);
  assert.equal(disaster.exemption.baseRate, 50);

  for (const id of WALLET_SETBACK_IDS) {
    const event = requireSetback(id);
    const blob = `${event.name}\n${event.description}\n${event.failureText}`;
    assert.equal(NUMERIC_WALLET_HINT.test(blob), false, `${id} must not keep numeric wallet hints`);
    assert.equal(JSON.stringify(event).includes('wealth_capacity'), false, `${id} must not add Wealth replacement`);
  }
}

function testRuntimeSentinelsAndRobberyConstitution(): void {
  for (const _money of MONEY_SENTINELS) {
    for (const id of WALLET_SETBACK_IDS) {
      const before = makeEngineState();
      const after = applySetbackEffects(before, id);
      assert.equal('money' in after.player, false, `${id} must not create legacy money`);
      assert.equal(after.player.wealthCapacity, before.player.wealthCapacity);
    }

    const robbed = applySetbackEffects(makeEngineState(), 'robbery');
    assert.equal(robbed.player.constitution, 17, 'robbery must keep constitution -3');
    assert.equal('money' in robbed.player, false);

    const failed = applySetbackEffects(makeEngineState(), 'business_failure');
    assert.equal(failed.player.businessAcumen, 5, 'business_failure must keep businessAcumen -5');

    const disaster = applySetbackEffects(makeEngineState(), 'natural_disaster');
    assert.equal(disaster.player.constitution, 10);
    assert.equal(disaster.player.reputation, 15);

    const loss = applySetbackEffects(makeEngineState(), 'property_loss');
    assert.equal(loss.player.constitution, 20);
    assert.equal(loss.player.businessAcumen, 10);
    assert.equal(loss.player.reputation, 30);
  }
}

async function testExecuteAutoEventStillAppliesSetbacksWithoutMoney(): Promise<void> {
  const engine = new GameEngineIntegration();
  engine.startNewGame('E1挫折', 'male');
  const state = engine.getGameState();
  state.player.age = 1;
  state.player.constitution = 10;
  const random = Math.random;
  let calls = 0;
  Math.random = () => {
    calls += 1;
    return calls === 1 ? 0 : 0.5;
  };
  try {
    const result = await engine.executeAutoEvent(probeAutoEvent());
    const setbacks = result.stageResults.filter(stage => stage.sourceKind === 'setback');
    assert.equal(setbacks.length > 0, true, 'executeAutoEvent must still be able to apply a difficulty setback');
    assert.equal(
      setbacks.some(stage => stage.id === 'setback_property_loss'),
      true,
      'mapped property_loss must resolve as canonical setback_property_loss',
    );
    assert.equal(
      setbacks.some(stage => stage.id === 'property_loss'),
      false,
      'mapped setback must not keep legacy Difficulty history/stage id',
    );
    assert.equal('money' in engine.getGameState().player, false, 'headless/runtime auto path must not mutate money');
  } finally {
    Math.random = random;
  }
}

function testCompatibilitySeedAndSnapshotUntouched(): void {
  const engine = new GameEngineIntegration();
  engine.startNewGame('E1种子', 'female');
  assert.equal('money' in engine.getGameState().player, false, 'new-game player must not expose legacy money');
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
}

async function main(): Promise<void> {
  testActiveSetbackMoneyMutationCountZero();
  testAllowlistDropsMoney();
  testSourceGuards();
  testRuntimeSentinelsAndRobberyConstitution();
  await testExecuteAutoEventStillAppliesSetbacksWithoutMoney();
  testCompatibilitySeedAndSnapshotUntouched();
  console.log('globalMoneyDifficultySetbackWalletMutationRetirement.test.ts: all passed');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
