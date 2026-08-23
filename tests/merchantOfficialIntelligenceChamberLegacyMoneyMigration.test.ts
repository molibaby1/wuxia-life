import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { EventChoice, EventDefinition } from '../src/types/eventTypes';

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

function hasMoneyEffect(effects: EventDefinition['autoEffects'] | EventChoice['effects']): boolean {
  return (effects ?? []).some(
    effect => effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money',
  );
}

function hasAdditiveStatEffect(
  effects: EventDefinition['autoEffects'] | EventChoice['effects'],
  stat: string,
  value: number,
): boolean {
  return (effects ?? []).some(
    effect => effect.type === 'stat_modify'
      && (effect.target ?? effect.stat) === stat
      && effect.value === value
      && effect.operator === 'add',
  );
}

function testOfficialAuthoring(): void {
  const official = getEvent('merchant_official_connection');
  const heavy = getChoice(official, 'heavy_bribe');
  const moderate = getChoice(official, 'moderate_bribe');
  const refuse = getChoice(official, 'refuse_bribe');

  assert.deepEqual(heavy.condition, {
    type: 'wealth_capacity_at_least',
    minimum: 'wealthy',
  });
  assert.equal((heavy as EventChoice & { conditions?: unknown }).conditions, undefined);
  assert.equal(hasMoneyEffect(heavy.effects), false);
  assert(hasAdditiveStatEffect(heavy.effects, 'reputation', 25));
  assert(hasAdditiveStatEffect(heavy.effects, 'charisma', 12));
  assert(heavy.effects.some(
    effect => effect.type === 'flag_set'
      && effect.flag === 'merchant_official_friend'
      && effect.value === true,
  ));
  assert.equal(heavy.text.includes('金钱'), false);
  assert.equal(heavy.text.includes('500'), false);

  assert.equal(moderate.condition, undefined);
  assert.equal(hasMoneyEffect(moderate.effects), false);
  assert(hasAdditiveStatEffect(moderate.effects, 'reputation', 15));
  assert(hasAdditiveStatEffect(moderate.effects, 'charisma', 8));
  assert(moderate.effects.some(
    effect => effect.type === 'flag_set'
      && effect.flag === 'merchant_official_friend'
      && effect.value === true,
  ));
  assert.equal(moderate.text.includes('金钱'), false);
  assert.equal(moderate.text.includes('-30'), false);

  assert.equal(hasMoneyEffect(refuse.effects), false);
  assert(hasAdditiveStatEffect(refuse.effects, 'chivalry', 10));
  assert(hasAdditiveStatEffect(refuse.effects, 'reputation', -5));
}

async function testOfficialRuntime(): Promise<void> {
  const official = getEvent('merchant_official_connection');
  const heavy = getChoice(official, 'heavy_bribe');
  const moderate = getChoice(official, 'moderate_bribe');
  const evaluator = new ConditionEvaluator();

  const lowEngine = new GameEngineIntegration();
  lowEngine.startNewGame('Official Heavy Low Wealth', 'male');
  const low = lowEngine.getGameState();
  low.player.wealthCapacity = 'comfortable_means';
  low.player.money = 999;
  assert.equal(evaluator.evaluate(heavy.condition!, low), false);

  const heavyEngine = new GameEngineIntegration();
  heavyEngine.startNewGame('Official Heavy Wealthy', 'male');
  const heavyState = heavyEngine.getGameState();
  heavyState.player.wealthCapacity = 'wealthy';
  heavyState.player.money = MONEY_SENTINEL;
  heavyState.player.reputation = 20;
  heavyState.player.charisma = 20;
  heavyState.player.traits = [];
  await heavyEngine.executeChoiceEffects(heavy.effects, official.id, heavy.id);
  const heavyAfter = heavyEngine.getGameState();
  assert.equal(heavyAfter.player.money, MONEY_SENTINEL);
  assert.equal(heavyAfter.player.wealthCapacity, 'wealthy');
  assert.equal(heavyAfter.player.reputation, 45);
  assert.equal(heavyAfter.player.charisma, 32);
  assert.equal(heavyAfter.flags.merchant_official_friend, true);

  const moderateEngine = new GameEngineIntegration();
  moderateEngine.startNewGame('Official Moderate', 'male');
  const moderateState = moderateEngine.getGameState();
  moderateState.player.wealthCapacity = 'comfortable_means';
  moderateState.player.money = MONEY_SENTINEL;
  moderateState.player.reputation = 20;
  moderateState.player.charisma = 20;
  moderateState.player.traits = [];
  await moderateEngine.executeChoiceEffects(moderate.effects, official.id, moderate.id);
  const moderateAfter = moderateEngine.getGameState();
  assert.equal(moderateAfter.player.money, MONEY_SENTINEL);
  assert.equal(moderateAfter.player.wealthCapacity, 'comfortable_means');
  assert.equal(moderateAfter.player.reputation, 35);
  assert.equal(moderateAfter.player.charisma, 28);
  assert.equal(moderateAfter.flags.merchant_official_friend, true);
}

function testIntelligenceAuthoring(): void {
  const intelligence = getEvent('merchant_intelligence_network');
  assert.equal(hasMoneyEffect(intelligence.autoEffects), false);
  assert(hasAdditiveStatEffect(intelligence.autoEffects, 'charisma', 8));
  assert(hasAdditiveStatEffect(intelligence.autoEffects, 'reputation', -5));
  assert(intelligence.autoEffects?.some(
    effect => effect.type === 'flag_set'
      && effect.flag === 'merchant_intelligence'
      && effect.value === true,
  ));
  assert.equal(
    intelligence.autoEffects?.some(
      effect => effect.type === 'wealth_capacity_set'
        || effect.type === 'wealth_capacity_raise_to',
    ),
    false,
  );
}

async function testIntelligenceRuntime(): Promise<void> {
  const intelligence = getEvent('merchant_intelligence_network');
  const engine = new GameEngineIntegration();
  engine.startNewGame('Merchant Intelligence Wallet Neutral', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'comfortable_means';
  state.player.money = MONEY_SENTINEL;
  state.player.charisma = 20;
  state.player.reputation = 20;
  state.player.traits = [];
  state.flags.merchant_official_friend = true;
  state.player.flags.merchant_official_friend = true;

  await engine.executeChoiceEffects(intelligence.autoEffects ?? [], intelligence.id);
  const after = engine.getGameState();
  assert.equal(after.player.money, MONEY_SENTINEL);
  assert.equal(after.player.wealthCapacity, 'comfortable_means');
  assert.equal(after.player.charisma, 28);
  assert.equal(after.player.reputation, 15);
  assert.equal(after.flags.merchant_intelligence, true);
}

function testChamberAuthoring(): void {
  const chamber = getEvent('merchant_chamber_of_commerce');

  assert.deepEqual(chamber.conditions, [
    {
      type: 'expression',
      expression: 'flags.merchant_intelligence == true',
    },
    {
      type: 'wealth_capacity_at_least',
      minimum: 'comfortable_means',
    },
  ]);

  assert.equal(hasMoneyEffect(chamber.autoEffects), false);
  assert(chamber.autoEffects?.some(
    effect => effect.type === 'wealth_capacity_raise_to'
      && effect.minimum === 'wealthy',
  ));
  assert(hasAdditiveStatEffect(chamber.autoEffects, 'reputation', 30));
  assert(hasAdditiveStatEffect(chamber.autoEffects, 'charisma', 12));
  assert(chamber.autoEffects?.some(
    effect => effect.type === 'flag_set'
      && effect.flag === 'merchant_chamber_head'
      && effect.value === true,
  ));
}

function testChamberEligibilityRuntime(): void {
  const chamber = getEvent('merchant_chamber_of_commerce');
  const evaluator = new ConditionEvaluator();

  const lowEngine = new GameEngineIntegration();
  lowEngine.startNewGame('Chamber Low Wealth', 'male');
  const low = lowEngine.getGameState();
  low.flags.merchant_intelligence = true;
  low.player.flags.merchant_intelligence = true;
  low.player.wealthCapacity = 'modest_savings';
  low.player.money = 999;
  assert.equal(evaluator.evaluate(chamber.conditions![0], low), true);
  assert.equal(evaluator.evaluate(chamber.conditions![1], low), false);

  const comfortableEngine = new GameEngineIntegration();
  comfortableEngine.startNewGame('Chamber Comfortable', 'male');
  const comfortable = comfortableEngine.getGameState();
  comfortable.flags.merchant_intelligence = true;
  comfortable.player.flags.merchant_intelligence = true;
  comfortable.player.wealthCapacity = 'comfortable_means';
  comfortable.player.money = 0;
  assert.equal(evaluator.evaluate(chamber.conditions![0], comfortable), true);
  assert.equal(evaluator.evaluate(chamber.conditions![1], comfortable), true);
}

async function assertChamberTransition(
  beforeWealth: 'comfortable_means' | 'wealthy' | 'regional_magnate',
  expectedWealth: 'wealthy' | 'regional_magnate',
): Promise<void> {
  const chamber = getEvent('merchant_chamber_of_commerce');
  const engine = new GameEngineIntegration();
  engine.startNewGame(`Chamber ${beforeWealth}`, 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = beforeWealth;
  state.player.money = MONEY_SENTINEL;
  state.player.reputation = 20;
  state.player.charisma = 20;
  state.player.traits = [];

  await engine.executeChoiceEffects(chamber.autoEffects ?? [], chamber.id);
  const after = engine.getGameState();
  assert.equal(after.player.money, MONEY_SENTINEL);
  assert.equal(after.player.wealthCapacity, expectedWealth);
  assert.equal(after.player.reputation, 50);
  assert.equal(after.player.charisma, 32);
  assert.equal(after.flags.merchant_chamber_head, true);
}

async function testChamberRuntimeMatrix(): Promise<void> {
  await assertChamberTransition('comfortable_means', 'wealthy');
  await assertChamberTransition('wealthy', 'wealthy');
  await assertChamberTransition('regional_magnate', 'regional_magnate');
}

function eventConditionsPass(event: EventDefinition, engine: GameEngineIntegration): boolean {
  const evaluator = new ConditionEvaluator();
  const state = engine.getGameState();
  return (event.conditions ?? []).every(condition => evaluator.evaluate(condition, state));
}

async function testFairModerateToChamberContinuity(): Promise<void> {
  const official = getEvent('merchant_official_connection');
  const moderate = getChoice(official, 'moderate_bribe');
  const intelligence = getEvent('merchant_intelligence_network');
  const chamber = getEvent('merchant_chamber_of_commerce');

  const engine = new GameEngineIntegration();
  engine.startNewGame('Fair Moderate Chamber Continuity', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'comfortable_means';
  state.player.money = MONEY_SENTINEL;
  state.player.reputation = 40;
  state.player.charisma = 20;
  state.player.traits = [];
  state.flags.merchant_fair_trade = true;
  state.player.flags.merchant_fair_trade = true;

  assert.equal(eventConditionsPass(official, engine), true);
  await engine.executeChoiceEffects(moderate.effects, official.id, moderate.id);
  assert.equal(engine.getGameState().player.money, MONEY_SENTINEL);
  assert.equal(eventConditionsPass(intelligence, engine), true);

  await engine.executeChoiceEffects(intelligence.autoEffects ?? [], intelligence.id);
  assert.equal(engine.getGameState().player.money, MONEY_SENTINEL);
  assert.equal(eventConditionsPass(chamber, engine), true);

  await engine.executeChoiceEffects(chamber.autoEffects ?? [], chamber.id);
  const after = engine.getGameState();
  assert.equal(after.player.money, MONEY_SENTINEL);
  assert.equal(after.player.wealthCapacity, 'wealthy');
  assert.equal(after.flags.merchant_chamber_head, true);
  assert.equal(eventConditionsPass(getEvent('merchant_wealth_peak'), engine), true);
}

async function testMonopolyHeavyToChamberContinuity(): Promise<void> {
  const official = getEvent('merchant_official_connection');
  const heavy = getChoice(official, 'heavy_bribe');
  const intelligence = getEvent('merchant_intelligence_network');
  const chamber = getEvent('merchant_chamber_of_commerce');
  const evaluator = new ConditionEvaluator();

  const engine = new GameEngineIntegration();
  engine.startNewGame('Monopoly Heavy Chamber Continuity', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'wealthy';
  state.player.money = 0;
  state.player.reputation = 40;
  state.player.charisma = 20;
  state.player.traits = [];
  state.flags.merchant_monopoly = true;
  state.player.flags.merchant_monopoly = true;

  assert.equal(eventConditionsPass(official, engine), true);
  assert.equal(evaluator.evaluate(heavy.condition!, engine.getGameState()), true);
  await engine.executeChoiceEffects(heavy.effects, official.id, heavy.id);
  assert.equal(engine.getGameState().player.money, 0);

  assert.equal(eventConditionsPass(intelligence, engine), true);
  await engine.executeChoiceEffects(intelligence.autoEffects ?? [], intelligence.id);
  assert.equal(engine.getGameState().player.money, 0);

  assert.equal(eventConditionsPass(chamber, engine), true);
  await engine.executeChoiceEffects(chamber.autoEffects ?? [], chamber.id);
  assert.equal(engine.getGameState().player.wealthCapacity, 'wealthy');
  assert.equal(engine.getGameState().player.money, 0);
}

function testPeakRemainsDeferred(): void {
  const peak = getEvent('merchant_wealth_peak');
  assert(peak.autoEffects?.some(
    effect => effect.type === 'wealth_capacity_set'
      && effect.value === 'regional_magnate',
  ));
  assert(peak.autoEffects?.some(
    effect => effect.type === 'stat_modify'
      && (effect.target ?? effect.stat) === 'money'
      && effect.value === 200,
  ));
}

async function run(): Promise<void> {
  testOfficialAuthoring();
  await testOfficialRuntime();
  testIntelligenceAuthoring();
  await testIntelligenceRuntime();
  testChamberAuthoring();
  testChamberEligibilityRuntime();
  await testChamberRuntimeMatrix();
  await testFairModerateToChamberContinuity();
  await testMonopolyHeavyToChamberContinuity();
  testPeakRemainsDeferred();
  console.log('merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts: ok');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
