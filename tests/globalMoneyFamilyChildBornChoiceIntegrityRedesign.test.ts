import assert from 'node:assert/strict';
import { EventExecutor } from '../src/core/EventExecutor';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { EffectDefinition, EventChoice, EventDefinition, GameState, PlayerState } from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const EVENT_ID = 'family_child_born';
const GRAND_BANQUET_CHOICE_ID = 'family_child_born_choice_1';
const SIMPLE_CHOICE_ID = 'child_born_simple';
const CARE_CHOICE_ID = 'child_born_care';
const GRAND_BANQUET_FLAG = 'family_child_born_grand_banquet';
const SIMPLE_FLAG = 'family_child_born_simple_celebration';
const CARE_FLAG = 'family_child_born_personal_care';
const BRANCH_FLAGS = [GRAND_BANQUET_FLAG, SIMPLE_FLAG, CARE_FLAG] as const;
const SHARED_CHILD_EFFECTS = ['children', 'has_child'] as const;
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
  engine.startNewGame('Family Child Born Choice Integrity Redesign', 'male');
  const state = engine.getGameState();
  state.player.money = money;
  state.player.connections = 5;
  state.player.children = 0;
  state.flags = { married: true };
  state.player.flags = { married: true };
  return { engine, state };
}

function branchSpecificOutcome(state: GameState): Record<string, unknown> {
  return {
    grandBanquet: Boolean(state.flags[GRAND_BANQUET_FLAG]),
    simpleCelebration: Boolean(state.flags[SIMPLE_FLAG]),
    personalCare: Boolean(state.flags[CARE_FLAG]),
    wealthCapacity: state.player.wealthCapacity,
  };
}

function createMinimalPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    name: '测试',
    gender: 'male',
    age: 30,
    martialPower: 0,
    chivalry: 0,
    charisma: 0,
    constitution: 0,
    knowledge: 0,
    businessAcumen: 0,
    influence: 0,
    connections: 5,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    money: 0,
    wealthCapacity: 'no_surplus',
    reputation: 0,
    affiliation: null,
    title: null,
    healthStatus: 'healthy',
    statuses: [],
    alive: true,
    items: [],
    flags: { married: true },
    events: [],
    relationships: [],
    children: 0,
    spouse: '发妻',
    lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 0 },
    traits: [],
    ...overrides,
  };
}

function createMinimalState(overrides: Partial<GameState> = {}): GameState {
  return {
    player: createMinimalPlayer(),
    flags: { married: true },
    relations: {},
    eventHistory: [],
    actionHistory: [],
    ...overrides,
  };
}

function sharedChildOutcome(state: GameState): Record<string, unknown> {
  return {
    children: state.player.children,
    hasChild: Boolean(state.flags.has_child),
  };
}

function branchSpecificFlags(choiceId: string): string[] {
  const effects = getChoice(getEvent(), choiceId).effects ?? [];
  return effects
    .filter(effect => effect.type === 'flag_set' && effectTarget(effect) !== undefined)
    .map(effect => effectTarget(effect)!)
    .filter(flag => !SHARED_CHILD_EFFECTS.includes(flag as typeof SHARED_CHILD_EFFECTS[number]));
}

function testAuthoringAndScheduleContracts(): void {
  const event = getEvent();
  assert.equal(event.eventType, 'choice');
  assert.deepEqual(event.ageRange, { min: 25, max: 40 });
  assert.deepEqual(event.triggers, [{ type: 'age_reach', value: 25 }]);
  assert.deepEqual(event.triggerConditions?.flags?.required, ['married']);
  assert.deepEqual(event.triggerConditions?.flags?.not, ['has_child']);
  assert.equal(event.weight, 80);
  assert.deepEqual(event.choices?.map(choice => choice.id), [
    GRAND_BANQUET_CHOICE_ID,
    SIMPLE_CHOICE_ID,
    CARE_CHOICE_ID,
  ]);

  const effects = (event.choices ?? []).flatMap(choice => choice.effects ?? []);
  assert.equal(effects.filter(isMoneyEffect).length, 0, `${EVENT_ID} must have no legacy money write`);
  assert.equal(effects.some(isWealthReplacementEffect), false, `${EVENT_ID} must not gain Wealth replacement`);

  const grandEffects = getChoice(event, GRAND_BANQUET_CHOICE_ID).effects ?? [];
  assert(grandEffects.some(effect => effect.type === 'stat_modify' && effectTarget(effect) === 'connections' && effect.value === 10));
  assert(grandEffects.some(effect => effect.type === 'flag_set' && effectTarget(effect) === GRAND_BANQUET_FLAG));
  assert(!grandEffects.some(effect => effect.type === 'flag_set' && BRANCH_FLAGS.slice(1).includes(effectTarget(effect) as typeof BRANCH_FLAGS[number])));

  const simpleEffects = getChoice(event, SIMPLE_CHOICE_ID).effects ?? [];
  assert(simpleEffects.some(effect => effect.type === 'flag_set' && effectTarget(effect) === SIMPLE_FLAG));
  assert(!simpleEffects.some(effect => effect.type === 'flag_set' && effectTarget(effect) !== SIMPLE_FLAG && effectTarget(effect) !== 'has_child'));

  const careEffects = getChoice(event, CARE_CHOICE_ID).effects ?? [];
  assert(careEffects.some(effect => effect.type === 'flag_set' && effectTarget(effect) === CARE_FLAG));
  assert(!careEffects.some(effect => effect.type === 'flag_set' && effectTarget(effect) !== CARE_FLAG && effectTarget(effect) !== 'has_child'));
}

function testChoicesDoNotCollapse(): void {
  const grandSpecific = branchSpecificFlags(GRAND_BANQUET_CHOICE_ID);
  const simpleSpecific = branchSpecificFlags(SIMPLE_CHOICE_ID);
  const careSpecific = branchSpecificFlags(CARE_CHOICE_ID);

  assert.notDeepEqual([...grandSpecific].sort(), [...simpleSpecific].sort(), 'grand banquet and simple celebration must differ');
  assert.notDeepEqual([...simpleSpecific].sort(), [...careSpecific].sort(), 'simple celebration and personal care must differ');
  assert.notDeepEqual([...grandSpecific].sort(), [...careSpecific].sort(), 'grand banquet and personal care must differ');
}

function testSimpleAndCareAreNotWalletOnlyDistinction(): void {
  const simpleEffects = getChoice(getEvent(), SIMPLE_CHOICE_ID).effects ?? [];
  const careEffects = getChoice(getEvent(), CARE_CHOICE_ID).effects ?? [];

  const simpleNonWallet = simpleEffects.filter(effect => !isMoneyEffect(effect));
  const careNonWallet = careEffects.filter(effect => !isMoneyEffect(effect));

  assert.notDeepEqual(
    simpleNonWallet.map(effect => ({ type: effect.type, target: effectTarget(effect), value: effect.value })),
    careNonWallet.map(effect => ({ type: effect.type, target: effectTarget(effect), value: effect.value })),
    'simple celebration and personal care must not collapse once wallet distinction is removed',
  );
}

async function executeChoice(choiceId: string, money: number): Promise<GameState> {
  const { engine } = createScenario(money);
  const event = getEvent();
  const beforeMoney = engine.getGameState().player.money;
  const beforeWealthCapacity = engine.getGameState().player.wealthCapacity;
  await engine.executeChoiceEffects(getChoice(event, choiceId).effects ?? [], event.id, choiceId);
  const after = engine.getGameState();
  assert.equal(after.player.money, beforeMoney, `${choiceId} must not alter money`);
  assert.equal(after.player.wealthCapacity, beforeWealthCapacity, `${choiceId} must not alter Wealth Capacity`);
  return after;
}

async function executeChoiceEffectsOnly(choiceId: string): Promise<GameState> {
  const event = getEvent();
  return new EventExecutor().executeEffects(
    getChoice(event, choiceId).effects ?? [],
    createMinimalState(),
  );
}

async function testRuntimeGrandBanquetBranch(): Promise<void> {
  for (const money of MONEY_SENTINELS) {
    const state = await executeChoice(GRAND_BANQUET_CHOICE_ID, money);
    assert.equal(state.flags[GRAND_BANQUET_FLAG], true);
    assert.notEqual(state.flags[SIMPLE_FLAG], true);
    assert.notEqual(state.flags[CARE_FLAG], true);
    assert.deepEqual(sharedChildOutcome(state), { children: 1, hasChild: true });
  }

  const grandOnly = await executeChoiceEffectsOnly(GRAND_BANQUET_CHOICE_ID);
  const simpleOnly = await executeChoiceEffectsOnly(SIMPLE_CHOICE_ID);
  assert.equal(grandOnly.player.connections, 15, 'grand banquet must apply connections +10');
  assert.equal(simpleOnly.player.connections, 5, 'simple branch must not alter connections');
}

async function testRuntimeSimpleBranch(): Promise<void> {
  for (const money of MONEY_SENTINELS) {
    const state = await executeChoice(SIMPLE_CHOICE_ID, money);
    assert.equal(state.flags[SIMPLE_FLAG], true);
    assert.notEqual(state.flags[GRAND_BANQUET_FLAG], true);
    assert.notEqual(state.flags[CARE_FLAG], true);
    assert.deepEqual(sharedChildOutcome(state), { children: 1, hasChild: true });
  }

  const simpleOnly = await executeChoiceEffectsOnly(SIMPLE_CHOICE_ID);
  const careOnly = await executeChoiceEffectsOnly(CARE_CHOICE_ID);
  assert.equal(simpleOnly.player.connections, 5, 'simple branch must not alter connections');
  assert.equal(careOnly.player.connections, 5, 'personal care branch must not alter connections');
}

async function testRuntimePersonalCareBranch(): Promise<void> {
  for (const money of MONEY_SENTINELS) {
    const state = await executeChoice(CARE_CHOICE_ID, money);
    assert.equal(state.flags[CARE_FLAG], true);
    assert.notEqual(state.flags[GRAND_BANQUET_FLAG], true);
    assert.notEqual(state.flags[SIMPLE_FLAG], true);
    assert.deepEqual(sharedChildOutcome(state), { children: 1, hasChild: true });
  }
}

async function testMutualExclusivityAndMoneyInvariance(): Promise<void> {
  const outcomes: Record<string, Record<string, unknown>[]> = {
    grand: [],
    simple: [],
    care: [],
  };

  for (const money of MONEY_SENTINELS) {
    outcomes.grand.push(branchSpecificOutcome(await executeChoice(GRAND_BANQUET_CHOICE_ID, money)));
    outcomes.simple.push(branchSpecificOutcome(await executeChoice(SIMPLE_CHOICE_ID, money)));
    outcomes.care.push(branchSpecificOutcome(await executeChoice(CARE_CHOICE_ID, money)));
  }

  for (const branch of Object.values(outcomes)) {
    assert.deepEqual(branch[0], branch[1]);
    assert.deepEqual(branch[0], branch[2]);
  }

  assert.notDeepEqual(outcomes.grand[0], outcomes.simple[0]);
  assert.notDeepEqual(outcomes.simple[0], outcomes.care[0]);
  assert.notDeepEqual(outcomes.grand[0], outcomes.care[0]);

  for (const money of MONEY_SENTINELS) {
    for (const choiceId of [GRAND_BANQUET_CHOICE_ID, SIMPLE_CHOICE_ID, CARE_CHOICE_ID]) {
      const state = await executeChoice(choiceId, money);
      const activeBranchFlags = BRANCH_FLAGS.filter(flag => state.flags[flag] === true);
      assert.equal(activeBranchFlags.length, 1, `${choiceId} must set exactly one branch identity flag`);
    }
  }
}

function testEligibilityUnchanged(): void {
  const event = getEvent();
  for (const money of MONEY_SENTINELS) {
    const { state } = createScenario(money);
    state.player.age = 30;
    assert.equal(EventExecutor.canTriggerEvent(event, state), true, `eligible at money=${money}`);
  }

  const ineligible = createScenario(0).state;
  ineligible.player.age = 30;
  delete ineligible.flags.married;
  delete ineligible.player.flags.married;
  assert.equal(EventExecutor.canTriggerEvent(event, ineligible), false, 'unmarried state must remain ineligible');

  const alreadyParent = createScenario(0).state;
  alreadyParent.player.age = 30;
  alreadyParent.flags.has_child = true;
  alreadyParent.player.flags.has_child = true;
  assert.equal(EventExecutor.canTriggerEvent(event, alreadyParent), false, 'has_child must remain blocking');
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
  testChoicesDoNotCollapse();
  testSimpleAndCareAreNotWalletOnlyDistinction();
  testEligibilityUnchanged();
  await testRuntimeGrandBanquetBranch();
  await testRuntimeSimpleBranch();
  await testRuntimePersonalCareBranch();
  await testMutualExclusivityAndMoneyInvariance();
  testMoneyProducerInventory();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.15.0');
  console.log('globalMoneyFamilyChildBornChoiceIntegrityRedesign.test.ts: all passed');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
