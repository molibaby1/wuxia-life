import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { readRawRouteKeyFromFlags } from '../src/utils/playerFacingLabels';
import type { EffectDefinition, EventChoice, EventDefinition, GameState } from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const EVENT_ID = 'p22_early_wealth_route_fork';
const EXPAND_CHOICE_ID = 'expand_trade_route';
const CONSOLIDATE_CHOICE_ID = 'consolidate_family_trade';
const EXPANSION_FLAG = 'p22_wealth_route_expansion';
const CONSOLIDATION_FLAG = 'p22_wealth_route_consolidation';
const SHARED_FLAGS = ['route_wealth_committed', 'p22_wealth_route_forked'] as const;
const MONEY_SENTINELS = [0, 317, 9999] as const;
const WEALTH_REPLACEMENT_EFFECTS = new Set([
  'wealth_capacity_set',
  'wealth_capacity_raise_to',
  'wealth_capacity_lower_to',
  'wealth_capacity_at_least',
]);

function getEvent(): EventDefinition {
  const event = EventLoader.getInstance().getEventById(EVENT_ID);
  assert(event, `missing event: ${EVENT_ID}`);
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

function isWealthReplacementEffect(effect: EffectDefinition): boolean {
  if (WEALTH_REPLACEMENT_EFFECTS.has(effect.type)) return true;
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'wealth';
}

function effectTarget(effect: EffectDefinition): string | undefined {
  return effect.target ?? effect.flag ?? effect.stat;
}

function collectFormalMoneyDeclarations(): { total: number; executable: number } {
  const loader = EventLoader.getInstance();
  let total = 0;
  let executable = 0;

  const scanEffects = (effects: EffectDefinition[] | undefined) => {
    for (const effect of effects ?? []) {
      const target = effect.target ?? effect.stat;
      if (target !== 'money') continue;
      total += 1;
      if (effect.type === 'stat_modify') executable += 1;
    }
  };

  for (const event of loader.getAllEvents()) {
    scanEffects(event.autoEffects);
    for (const choice of event.choices ?? []) {
      scanEffects(choice.effects);
    }
  }

  return { total, executable };
}

function createScenario(money: number): { engine: GameEngineIntegration; state: GameState } {
  const engine = new GameEngineIntegration();
  engine.startNewGame('P22 Commercial Commitment Choice Redesign', 'male');
  const state = engine.getGameState();
  state.player.money = money;
  state.player.reputation = 10;
  state.player.traits = [];
  state.player.lifeStates = { ...state.player.lifeStates, businessHabit: 2 };
  state.flags = { origin_merchant_family: true };
  state.player.flags = { origin_merchant_family: true };
  return { engine, state };
}

function branchSpecificOutcome(state: GameState): Record<string, unknown> {
  return {
    expansion: Boolean(state.flags[EXPANSION_FLAG]),
    consolidation: Boolean(state.flags[CONSOLIDATION_FLAG]),
    reputation: state.player.reputation,
    wealthCapacity: state.player.wealthCapacity,
  };
}

function sharedCommitmentOutcome(state: GameState): Record<string, boolean> {
  return Object.fromEntries(SHARED_FLAGS.map(flag => [flag, Boolean(state.flags[flag])]));
}

function testAuthoringAndScheduleContracts(): void {
  const event = getEvent();
  assert.equal(event.eventType, 'choice');
  assert.deepEqual(event.ageRange, { min: 18, max: 24 });
  assert.deepEqual(event.triggers, [{ type: 'age_reach', value: 18 }]);
  assert.deepEqual(event.conditions, [{
    type: 'expression',
    expression: 'lifeStates.businessHabit >= 2 || flags.has("origin_merchant_family")',
  }]);
  assert.equal(event.weight, 47);
  assert.deepEqual(event.choices?.map(choice => choice.id), [EXPAND_CHOICE_ID, CONSOLIDATE_CHOICE_ID]);

  const effects = (event.choices ?? []).flatMap(choice => choice.effects ?? []);
  assert.equal(effects.filter(isMoneyEffect).length, 0, `${EVENT_ID} must have no legacy money write`);
  assert.equal(effects.some(isWealthReplacementEffect), false, `${EVENT_ID} must not gain Wealth replacement`);

  const expandEffects = getChoice(event, EXPAND_CHOICE_ID).effects ?? [];
  assert(expandEffects.some(effect => effect.type === 'flag_set' && effectTarget(effect) === EXPANSION_FLAG));
  assert(!expandEffects.some(effect => effect.type === 'flag_set' && effectTarget(effect) === CONSOLIDATION_FLAG));
  for (const flag of SHARED_FLAGS) {
    assert(expandEffects.some(effect => effect.type === 'flag_set' && effectTarget(effect) === flag));
  }

  const consolidateEffects = getChoice(event, CONSOLIDATE_CHOICE_ID).effects ?? [];
  assert(consolidateEffects.some(effect => effect.type === 'stat_modify' && effectTarget(effect) === 'reputation' && effect.value === 3));
  assert(consolidateEffects.some(effect => effect.type === 'flag_set' && effectTarget(effect) === CONSOLIDATION_FLAG));
  assert(!consolidateEffects.some(effect => effect.type === 'flag_set' && effectTarget(effect) === EXPANSION_FLAG));
  for (const flag of SHARED_FLAGS) {
    assert(consolidateEffects.some(effect => effect.type === 'flag_set' && effectTarget(effect) === flag));
  }
}

function testExpandBranchHasDurableDistinction(): void {
  const expandEffects = getChoice(getEvent(), EXPAND_CHOICE_ID).effects ?? [];
  const branchSpecific = expandEffects.filter(effect =>
    effect.type === 'flag_set'
    && effectTarget(effect) !== undefined
    && !SHARED_FLAGS.includes(effectTarget(effect) as typeof SHARED_FLAGS[number]),
  );
  assert(branchSpecific.length >= 1, 'expand branch must produce branch-specific non-wallet durable evidence');
  assert(
    branchSpecific.some(effect => effectTarget(effect) === EXPANSION_FLAG),
    'expand branch must set expansion strategy flag',
  );
}

function testChoicesDoNotCollapse(): void {
  const expandSpecific = getChoice(getEvent(), EXPAND_CHOICE_ID).effects?.filter(effect =>
    effect.type === 'flag_set'
    && effectTarget(effect) !== undefined
    && !SHARED_FLAGS.includes(effectTarget(effect) as typeof SHARED_FLAGS[number]),
  ) ?? [];
  const consolidateSpecific = getChoice(getEvent(), CONSOLIDATE_CHOICE_ID).effects?.filter(effect =>
    effect.type === 'flag_set'
    && effectTarget(effect) !== undefined
    && !SHARED_FLAGS.includes(effectTarget(effect) as typeof SHARED_FLAGS[number]),
  ) ?? [];

  const expandTargets = new Set(expandSpecific.map(effect => effectTarget(effect)));
  const consolidateTargets = new Set(consolidateSpecific.map(effect => effectTarget(effect)));
  assert.notDeepEqual([...expandTargets].sort(), [...consolidateTargets].sort(), 'branch-specific durable state must differ');
}

async function executeChoice(choiceId: string, money: number): Promise<GameState> {
  const { engine } = createScenario(money);
  const event = getEvent();
  const beforeWealthCapacity = engine.getGameState().player.wealthCapacity;
  await engine.executeChoiceEffects(getChoice(event, choiceId).effects ?? [], event.id, choiceId);
  const after = engine.getGameState();
  assert.equal(after.player.wealthCapacity, beforeWealthCapacity, `${choiceId} must not alter Wealth Capacity`);
  return after;
}

async function testRuntimeExpandBranch(): Promise<void> {
  for (const money of MONEY_SENTINELS) {
    const state = await executeChoice(EXPAND_CHOICE_ID, money);
    assert.equal(state.flags[EXPANSION_FLAG], true);
    assert.notEqual(state.flags[CONSOLIDATION_FLAG], true);
    assert.deepEqual(sharedCommitmentOutcome(state), {
      route_wealth_committed: true,
      p22_wealth_route_forked: true,
    });
    assert.equal(state.player.money, money);
  }
}

async function testRuntimeConsolidateBranch(): Promise<void> {
  for (const money of MONEY_SENTINELS) {
    const beforeReputation = createScenario(money).state.player.reputation;
    const state = await executeChoice(CONSOLIDATE_CHOICE_ID, money);
    assert.equal(state.flags[CONSOLIDATION_FLAG], true);
    assert.notEqual(state.flags[EXPANSION_FLAG], true);
    assert.deepEqual(sharedCommitmentOutcome(state), {
      route_wealth_committed: true,
      p22_wealth_route_forked: true,
    });
    assert.equal(state.player.reputation, beforeReputation + 3);
    assert.equal(state.player.money, money);
  }
}

async function testMutualExclusivityAndMoneyInvariance(): Promise<void> {
  const expandOutcomes: Record<string, unknown>[] = [];
  const consolidateOutcomes: Record<string, unknown>[] = [];

  for (const money of MONEY_SENTINELS) {
    expandOutcomes.push(branchSpecificOutcome(await executeChoice(EXPAND_CHOICE_ID, money)));
    consolidateOutcomes.push(branchSpecificOutcome(await executeChoice(CONSOLIDATE_CHOICE_ID, money)));
  }

  assert.deepEqual(expandOutcomes[0], expandOutcomes[1]);
  assert.deepEqual(expandOutcomes[0], expandOutcomes[2]);
  assert.deepEqual(consolidateOutcomes[0], consolidateOutcomes[1]);
  assert.deepEqual(consolidateOutcomes[0], consolidateOutcomes[2]);
  assert.notDeepEqual(expandOutcomes[0], consolidateOutcomes[0]);

  for (const money of MONEY_SENTINELS) {
    const expandState = await executeChoice(EXPAND_CHOICE_ID, money);
    assert.notEqual(expandState.flags[EXPANSION_FLAG] && expandState.flags[CONSOLIDATION_FLAG], true);
    const consolidateState = await executeChoice(CONSOLIDATE_CHOICE_ID, money);
    assert.notEqual(consolidateState.flags[EXPANSION_FLAG] && consolidateState.flags[CONSOLIDATION_FLAG], true);
  }
}

function testStrategyFlagsAreNotCanonicalMerchantAuthority(): void {
  assert.equal(readRawRouteKeyFromFlags({ [EXPANSION_FLAG]: true }), null);
  assert.equal(readRawRouteKeyFromFlags({ [CONSOLIDATION_FLAG]: true }), null);
  assert.equal(readRawRouteKeyFromFlags({ route_wealth_committed: true, [EXPANSION_FLAG]: true }), null);
}

function testEligibilityUnchanged(): void {
  const evaluator = new ConditionEvaluator();
  const event = getEvent();
  const gate = event.conditions?.[0]!;
  const eligible = MONEY_SENTINELS.map(money => evaluator.evaluate(gate, createScenario(money).state));
  assert.deepEqual(eligible, [true, true, true]);

  const ineligible = createScenario(0).state;
  ineligible.player.lifeStates = { ...ineligible.player.lifeStates, businessHabit: 1 };
  delete ineligible.flags.origin_merchant_family;
  delete ineligible.player.flags.origin_merchant_family;
  assert.equal(evaluator.evaluate(gate, ineligible), false);
}

function assertStrategicOnlyMoneyInventory(): void {
  const loader = EventLoader.getInstance();
  const byEvent = new Map<string, number>();
  for (const event of loader.getAllEvents()) {
    const scan = (effects: EffectDefinition[] | undefined) => {
      for (const effect of effects ?? []) {
        if (effect.type !== 'stat_modify') continue;
        if ((effect.target ?? effect.stat) !== 'money') continue;
        byEvent.set(event.id, (byEvent.get(event.id) ?? 0) + 1);
      }
    };
    scan(event.autoEffects);
    for (const choice of event.choices ?? []) scan(choice.effects);
  }
  assert.equal(byEvent.size, 0, `expected 0 formal money-writing events after D16, got ${[...byEvent.keys()].join(',')}`);
  let total = 0;
  for (const count of byEvent.values()) total += count;
  assert.equal(total, 0, `expected 0 formal money writes after D16, got ${total}`);
}

function testMoneyProducerInventory(): void {
  const event = getEvent();
  const eventMoney = (event.choices ?? []).flatMap(choice => choice.effects ?? []).filter(isMoneyEffect);
  assert.equal(eventMoney.length, 0, `${EVENT_ID} must have zero money writes`);
  assertStrategicOnlyMoneyInventory();
}

async function main(): Promise<void> {
  testAuthoringAndScheduleContracts();
  testExpandBranchHasDurableDistinction();
  testChoicesDoNotCollapse();
  testEligibilityUnchanged();
  testStrategyFlagsAreNotCanonicalMerchantAuthority();
  await testRuntimeExpandBranch();
  await testRuntimeConsolidateBranch();
  await testMutualExclusivityAndMoneyInvariance();
  testMoneyProducerInventory();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.15.0');
  console.log('globalMoneyP22CommercialCommitmentChoiceRedesign.test.ts: all passed');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
