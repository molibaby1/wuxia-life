import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { EffectDefinition, EventChoice, EventDefinition } from '../src/types/eventTypes';
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

function isMoneyEffect(effect: EffectDefinition): boolean {
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money';
}

function startState(name: string): { engine: GameEngineIntegration; state: GameState } {
  const engine = new GameEngineIntegration();
  engine.startNewGame(name, 'male');
  const state = engine.getGameState();
  state.player.traits = [];
  return { engine, state };
}

function eventConditionsPass(event: EventDefinition, state: GameState): boolean {
  const evaluator = new ConditionEvaluator();
  return (event.conditions ?? []).every(condition => evaluator.evaluate(condition, state));
}

function hasAdditiveStat(effects: EffectDefinition[], stat: string, value: number): boolean {
  return effects.some(effect =>
    effect.type === 'stat_modify'
    && (effect.target ?? effect.stat) === stat
    && effect.value === value
    && effect.operator === 'add',
  );
}

function testPeakAuthoring(): void {
  const peak = getEvent('merchant_wealth_peak');
  const peakEffects = peak.autoEffects ?? [];

  assert.equal(peakEffects.some(isMoneyEffect), false);
  assert(peakEffects.some(effect =>
    effect.type === 'wealth_capacity_set' && effect.value === 'regional_magnate',
  ));
  assert(hasAdditiveStat(peakEffects, 'reputation', 25));
  assert(hasAdditiveStat(peakEffects, 'charisma', 10));
  assert(peakEffects.some(effect =>
    effect.type === 'flag_set'
    && effect.flag === 'merchant_wealthy'
    && effect.value === true,
  ));
}

function testSectAuthoring(): void {
  const sect = getEvent('merchant_sect_investment');
  const heavy = getChoice(sect, 'invest_righteous_heavy');
  const righteous = getChoice(sect, 'invest_righteous');
  const evil = getChoice(sect, 'invest_evil');
  const both = getChoice(sect, 'invest_both');

  assert.deepEqual(heavy.condition, {
    type: 'wealth_capacity_at_least',
    minimum: 'regional_magnate',
  });
  assert.equal((heavy as EventChoice & { conditions?: unknown }).conditions, undefined);
  assert.equal(heavy.text.includes('金钱'), false);
  assert.equal(heavy.text.includes('500'), false);
  assert.equal((heavy.effects ?? []).some(isMoneyEffect), false);
  assert(heavy.effects?.some(effect =>
    effect.type === 'wealth_capacity_set' && effect.value === 'wealthy',
  ));
  assert(hasAdditiveStat(heavy.effects ?? [], 'chivalry', 20));
  assert(hasAdditiveStat(heavy.effects ?? [], 'reputation', 30));
  assert(hasAdditiveStat(heavy.effects ?? [], 'martialPower', 10));

  assert.equal((righteous.effects ?? []).some(isMoneyEffect), false);
  assert.equal(
    (righteous.effects ?? []).some(effect =>
      effect.type === 'wealth_capacity_set' || effect.type === 'wealth_capacity_raise_to',
    ),
    false,
  );
  assert(hasAdditiveStat(righteous.effects ?? [], 'chivalry', 10));
  assert(hasAdditiveStat(righteous.effects ?? [], 'reputation', 15));

  assert.equal((evil.effects ?? []).some(isMoneyEffect), false);
  assert.equal(
    (evil.effects ?? []).some(effect =>
      effect.type === 'wealth_capacity_set' || effect.type === 'wealth_capacity_raise_to',
    ),
    false,
  );
  assert(hasAdditiveStat(evil.effects ?? [], 'martialPower', 15));
  assert(hasAdditiveStat(evil.effects ?? [], 'chivalry', -10));

  assert.equal((both.effects ?? []).some(isMoneyEffect), false);
  assert.equal(
    (both.effects ?? []).some(effect =>
      effect.type === 'wealth_capacity_set' || effect.type === 'wealth_capacity_raise_to',
    ),
    false,
  );
  assert(hasAdditiveStat(both.effects ?? [], 'charisma', 12));

  assert(heavy.effects?.some(effect => effect.type === 'flag_set' && effect.flag === 'merchant_invest_good' && effect.value === true));
  assert(righteous.effects?.some(effect => effect.type === 'flag_set' && effect.flag === 'merchant_invest_good' && effect.value === true));
  assert(evil.effects?.some(effect => effect.type === 'flag_set' && effect.flag === 'merchant_invest_evil' && effect.value === true));
  assert(both.effects?.some(effect => effect.type === 'flag_set' && effect.flag === 'merchant_invest_both' && effect.value === true));
}

async function testPeakRuntime(): Promise<void> {
  const peak = getEvent('merchant_wealth_peak');
  const { engine, state } = startState('Merchant Peak Runtime');
  state.player.wealthCapacity = 'wealthy';
  state.player.reputation = 40;
  state.player.charisma = 20;

  await engine.executeChoiceEffects(peak.autoEffects ?? [], peak.id);
  const after = engine.getGameState();
  assert.equal(after.player.wealthCapacity, 'regional_magnate');
  assert.equal('money' in after.player, false);
  assert.equal(after.player.reputation, 65);
  assert.equal(after.player.charisma, 30);
  assert.equal(after.flags.merchant_wealthy, true);
}

function testHeavyAvailabilityRuntime(): void {
  const evaluator = new ConditionEvaluator();
  const sect = getEvent('merchant_sect_investment');
  const heavy = getChoice(sect, 'invest_righteous_heavy');

  const regionalMagnateWithNoMoney = startState('Merchant Heavy Availability Regional').state;
  regionalMagnateWithNoMoney.player.wealthCapacity = 'regional_magnate';
  assert.equal(evaluator.evaluate(heavy.condition!, regionalMagnateWithNoMoney), true);

  const wealthyWithCash = startState('Merchant Heavy Availability Wealthy').state;
  wealthyWithCash.player.wealthCapacity = 'wealthy';
  assert.equal(evaluator.evaluate(heavy.condition!, wealthyWithCash), false);
}

async function testHeavyRuntime(): Promise<void> {
  const sect = getEvent('merchant_sect_investment');
  const heavy = getChoice(sect, 'invest_righteous_heavy');
  const { engine, state } = startState('Merchant Heavy Runtime');
  state.player.wealthCapacity = 'regional_magnate';
  state.player.chivalry = 30;
  state.player.reputation = 40;
  state.player.martialPower = 50;

  await engine.executeChoiceEffects(heavy.effects ?? [], sect.id, heavy.id);
  const after = engine.getGameState();
  assert.equal(after.player.wealthCapacity, 'wealthy');
  assert.equal('money' in after.player, false);
  assert.equal(after.player.chivalry, 50);
  assert.equal(after.player.reputation, 70);
  assert.equal(after.player.martialPower, 60);
  assert.equal(after.flags.merchant_invest_good, true);
}

function assertStatDelta(
  before: GameState['player'],
  after: GameState['player'],
  stat: 'chivalry' | 'reputation' | 'martialPower' | 'charisma',
  delta: number,
): void {
  assert.equal(after[stat], before[stat] + delta);
}

async function testStandardChoiceRuntimeMatrix(): Promise<void> {
  const sect = getEvent('merchant_sect_investment');
  const cases = [
    {
      choiceId: 'invest_righteous',
      stat: 'chivalry' as const,
      delta: 10,
      secondaryStat: 'reputation' as const,
      secondaryDelta: 15,
      flag: 'merchant_invest_good' as const,
    },
    {
      choiceId: 'invest_evil',
      stat: 'martialPower' as const,
      delta: 15,
      secondaryStat: 'chivalry' as const,
      secondaryDelta: -10,
      flag: 'merchant_invest_evil' as const,
    },
    {
      choiceId: 'invest_both',
      stat: 'charisma' as const,
      delta: 12,
      flag: 'merchant_invest_both' as const,
    },
  ];

  for (const testCase of cases) {
    const choice = getChoice(sect, testCase.choiceId);
    const { engine, state } = startState(`Merchant Sect ${testCase.choiceId}`);
    state.player.wealthCapacity = 'regional_magnate';
    state.player.chivalry = 30;
    state.player.reputation = 40;
    state.player.martialPower = 50;
    state.player.charisma = 20;

    const before = { ...state.player };
    await engine.executeChoiceEffects(choice.effects ?? [], sect.id, choice.id);
    const after = engine.getGameState();

    assert.equal(after.player.wealthCapacity, 'regional_magnate');
    assert.equal('money' in after.player, false);
    assertStatDelta(before, after.player, testCase.stat, testCase.delta);
    if (testCase.secondaryStat) {
      assertStatDelta(before, after.player, testCase.secondaryStat, testCase.secondaryDelta ?? 0);
    }
    assert.equal(after.flags[testCase.flag], true);
  }
}

function testBusinessEmpireAuthoring(): void {
  const empire = getEvent('merchant_business_empire');
  const empireEffects = empire.autoEffects ?? [];

  assert.equal(empireEffects.some(isMoneyEffect), false);
  assert(empireEffects.some(effect =>
    effect.type === 'wealth_capacity_raise_to' && effect.minimum === 'regional_magnate',
  ));
  assert(hasAdditiveStat(empireEffects, 'reputation', 20));
  assert(hasAdditiveStat(empireEffects, 'charisma', 10));
  assert(empireEffects.some(effect =>
    effect.type === 'flag_set'
    && effect.flag === 'merchant_empire'
    && effect.value === true,
  ));
}

async function testBusinessEmpireRuntimeRecoveryAndNoOp(): Promise<void> {
  const empire = getEvent('merchant_business_empire');

  const recovery = startState('Merchant Empire Recovery');
  recovery.state.player.wealthCapacity = 'wealthy';
  recovery.state.player.reputation = 40;
  recovery.state.player.charisma = 20;
  recovery.state.flags.merchant_invest_good = true;
  recovery.state.player.flags.merchant_invest_good = true;

  await recovery.engine.executeChoiceEffects(empire.autoEffects ?? [], empire.id);
  const recoveryAfter = recovery.engine.getGameState();
  assert.equal(recoveryAfter.player.wealthCapacity, 'regional_magnate');
  assert.equal('money' in recoveryAfter.player, false);
  assert.equal(recoveryAfter.player.reputation, 60);
  assert.equal(recoveryAfter.player.charisma, 30);
  assert.equal(recoveryAfter.flags.merchant_empire, true);

  const noOp = startState('Merchant Empire Capacity No-op');
  noOp.state.player.wealthCapacity = 'regional_magnate';
  noOp.state.flags.merchant_invest_evil = true;
  noOp.state.player.flags.merchant_invest_evil = true;

  await noOp.engine.executeChoiceEffects(empire.autoEffects ?? [], empire.id);
  const noOpAfter = noOp.engine.getGameState();
  assert.equal(noOpAfter.player.wealthCapacity, 'regional_magnate');
  assert.equal('money' in noOpAfter.player, false);
  assert.equal(noOpAfter.flags.merchant_empire, true);
}

function testTycoonAuthoring(): void {
  const tycoon = getEvent('merchant_ending_tycoon');

  assert.deepEqual(tycoon.conditions, [
    {
      type: 'expression',
      expression: 'flags.merchant_empire == true',
    },
    {
      type: 'wealth_capacity_at_least',
      minimum: 'regional_magnate',
    },
  ]);
  assert.equal(
    tycoon.conditions?.some(condition =>
      condition.type === 'expression' && condition.expression.includes('money'),
    ),
    false,
  );
}

function testTycoonEligibilityMatrix(): void {
  const tycoon = getEvent('merchant_ending_tycoon');

  const eligible = startState('Merchant Tycoon Eligible').state;
  eligible.player.wealthCapacity = 'regional_magnate';
  eligible.flags.merchant_empire = true;
  eligible.player.flags.merchant_empire = true;
  assert.equal(eventConditionsPass(tycoon, eligible), true);

  const wealthy = startState('Merchant Tycoon Wealthy').state;
  wealthy.player.wealthCapacity = 'wealthy';
  wealthy.flags.merchant_empire = true;
  wealthy.player.flags.merchant_empire = true;
  assert.equal(eventConditionsPass(tycoon, wealthy), false);

  const missingEmpire = startState('Merchant Tycoon Missing Empire').state;
  missingEmpire.player.wealthCapacity = 'regional_magnate';
  assert.equal(eventConditionsPass(tycoon, missingEmpire), false);
}

async function testHeavyLateSpineRuntime(): Promise<void> {
  const peak = getEvent('merchant_wealth_peak');
  const sect = getEvent('merchant_sect_investment');
  const heavy = getChoice(sect, 'invest_righteous_heavy');
  const empire = getEvent('merchant_business_empire');
  const tycoon = getEvent('merchant_ending_tycoon');
  const { engine, state } = startState('Merchant Heavy Late Spine');

  state.player.wealthCapacity = 'wealthy';
  state.flags.merchant_chamber_head = true;
  state.player.flags.merchant_chamber_head = true;

  await engine.executeChoiceEffects(peak.autoEffects ?? [], peak.id);
  let after = engine.getGameState();
  assert.equal(after.player.wealthCapacity, 'regional_magnate');
  assert.equal('money' in after.player, false);
  assert.equal(after.flags.merchant_wealthy, true);

  await engine.executeChoiceEffects(heavy.effects ?? [], sect.id, heavy.id);
  after = engine.getGameState();
  assert.equal(after.player.wealthCapacity, 'wealthy');
  assert.equal('money' in after.player, false);
  assert.equal(after.flags.merchant_invest_good, true);

  await engine.executeChoiceEffects(empire.autoEffects ?? [], empire.id);
  after = engine.getGameState();
  assert.equal(after.player.wealthCapacity, 'regional_magnate');
  assert.equal('money' in after.player, false);
  assert.equal(after.flags.merchant_empire, true);
  assert.equal(eventConditionsPass(tycoon, after), true);
}

async function run(): Promise<void> {
  testPeakAuthoring();
  testSectAuthoring();
  await testPeakRuntime();
  testHeavyAvailabilityRuntime();
  await testHeavyRuntime();
  await testStandardChoiceRuntimeMatrix();
  testBusinessEmpireAuthoring();
  await testBusinessEmpireRuntimeRecoveryAndNoOp();
  testTycoonAuthoring();
  testTycoonEligibilityMatrix();
  await testHeavyLateSpineRuntime();
  console.log('merchantLateEconomicProgressionLegacyMoneyMigration.test.ts: ok');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
