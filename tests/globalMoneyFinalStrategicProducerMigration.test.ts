import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventExecutor } from '../src/core/EventExecutor';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import familyParenthoodDeferredEvents from '../src/data/lines/family-parenthood-deferred.json';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { EffectDefinition, EventChoice, EventDefinition, GameState, PlayerState } from '../src/types/eventTypes';
import type { WealthCapacity } from '../src/types/wealthCapacity';

process.env.WUXIA_ENGINE_QUIET = '1';

const deferredFamilyEvents = familyParenthoodDeferredEvents as unknown as EventDefinition[];

const MONEY_SENTINELS = [0, 317, 9999] as const;
const WEALTH_TIERS = [
  'no_surplus',
  'modest_savings',
  'comfortable_means',
  'wealthy',
  'regional_magnate',
] as const satisfies readonly WealthCapacity[];

const REQUIREMENT_CHOICES = [
  { eventId: 'border_crisis', choiceId: 'border_crisis_ransom', tier: 'comfortable_means' },
  { eventId: 'jianghu_demon_sect', choiceId: 'fund_expedition', tier: 'comfortable_means' },
  { eventId: 'family_child_marriage', choiceId: 'family_child_marriage_choice_1', tier: 'comfortable_means' },
  { eventId: 'hero_ally_pays_price', choiceId: 'ally_pay_ransom', tier: 'comfortable_means' },
  { eventId: 'family_crisis', choiceId: 'family_crisis_full_support', tier: 'comfortable_means' },
  { eventId: 'family_crisis', choiceId: 'family_crisis_limited_support', tier: 'modest_savings' },
  { eventId: 'career_foundation_sect', choiceId: 'create_sect', tier: 'comfortable_means' },
  { eventId: 'career_sect_expansion', choiceId: 'career_sect_expansion_choice_1', tier: 'comfortable_means' },
] as const;

function isMoneyEffect(effect: EffectDefinition): boolean {
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money';
}

function collectFormalMoneyWrites(): Array<{ eventId: string; choiceId?: string }> {
  const writes: Array<{ eventId: string; choiceId?: string }> = [];
  for (const event of EventLoader.getInstance().getAllEvents()) {
    for (const effect of event.autoEffects ?? []) {
      if (isMoneyEffect(effect)) writes.push({ eventId: event.id });
    }
    for (const choice of event.choices ?? []) {
      for (const effect of choice.effects ?? []) {
        if (isMoneyEffect(effect)) writes.push({ eventId: event.id, choiceId: choice.id });
      }
    }
  }
  return writes;
}

function getEvent(eventId: string): EventDefinition {
  const event = EventLoader.getInstance().getEventById(eventId) ??
    deferredFamilyEvents.find(candidate => candidate.id === eventId);
  assert(event, `missing event: ${eventId}`);
  return event;
}

function getChoice(eventId: string, choiceId: string): EventChoice {
  const choice = getEvent(eventId).choices?.find(candidate => candidate.id === choiceId);
  assert(choice, `missing choice ${choiceId} in ${eventId}`);
  return choice;
}

function createMinimalPlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    name: '测试',
    gender: 'male',
    age: 40,
    martialPower: 0,
    chivalry: 0,
    charisma: 0,
    constitution: 0,
    knowledge: 0,
    businessAcumen: 0,
    influence: 0,
    connections: 10,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    wealthCapacity: 'no_surplus',
    reputation: 10,
    affiliation: null,
    title: null,
    healthStatus: 'healthy',
    statuses: [],
    alive: true,
    items: [],
    flags: {},
    events: [],
    relationships: [],
    children: 0,
    spouse: null,
    lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 0 },
    traits: [],
    ...overrides,
  };
}

function createMinimalState(overrides: Partial<GameState> = {}): GameState {
  const player = overrides.player ?? createMinimalPlayer();
  return {
    player,
    flags: { ...(overrides.flags ?? {}), ...(player.flags ?? {}) },
    relations: {},
    eventHistory: [],
    actionHistory: [],
    ...overrides,
    player,
  };
}

function choiceAvailable(eventId: string, choiceId: string, playerOverrides: Partial<PlayerState>): boolean {
  const choice = getChoice(eventId, choiceId);
  if (!choice.condition) return true;
  return new ConditionEvaluator().evaluate(choice.condition, createMinimalState({
    player: createMinimalPlayer(playerOverrides),
  }));
}

function assertWealthRequirement(eventId: string, choiceId: string, tier: WealthCapacity): void {
  const choice = getChoice(eventId, choiceId);
  assert.deepEqual(choice.condition, {
    type: 'wealth_capacity_at_least',
    minimum: tier,
  }, `${eventId}/${choiceId} must require ${tier}`);
  assert.equal((choice.effects ?? []).filter(isMoneyEffect).length, 0);
}

function testFormalMoneyProducerZero(): void {
  const writes = collectFormalMoneyWrites();
  assert.equal(writes.length, 0, `formal event money writes must equal 0, got ${writes.length}: ${JSON.stringify(writes)}`);
  assert.equal(new Set(writes.map(write => write.eventId)).size, 0, 'formal money-writing events must equal 0');
}

function testRequirementGates(): void {
  for (const requirement of REQUIREMENT_CHOICES) {
    assertWealthRequirement(requirement.eventId, requirement.choiceId, requirement.tier);
  }
}

function testHeroContractsAndMatrix(): void {
  const supported = getChoice('hero_ally_pays_price', 'ally_pay_ransom_supported');
  assert.deepEqual(supported.condition, {
    type: 'expression',
    expression: 'player.connections >= 20',
  });
  assert.equal((supported.effects ?? []).filter(isMoneyEffect).length, 0);
  assert((supported.effects ?? []).some(effect => (effect.target ?? effect.flag) === 'hero_ally_ransomed'));

  assertWealthRequirement('hero_ally_pays_price', 'ally_pay_ransom', 'comfortable_means');
  const direct = getChoice('hero_ally_pays_price', 'ally_pay_ransom');
  assert.notEqual(direct.condition?.type, 'expression');
  assert.equal(JSON.stringify(direct.condition ?? {}).includes('connections'), false);

  assert.equal(choiceAvailable('hero_ally_pays_price', 'ally_pay_ransom_supported', {
    connections: 20,
    wealthCapacity: 'no_surplus',
  }), true);
  assert.equal(choiceAvailable('hero_ally_pays_price', 'ally_pay_ransom', {
    connections: 20,
    wealthCapacity: 'no_surplus',
  }), false);

  assert.equal(choiceAvailable('hero_ally_pays_price', 'ally_pay_ransom_supported', {
    connections: 5,
    wealthCapacity: 'comfortable_means',
  }), false);
  assert.equal(choiceAvailable('hero_ally_pays_price', 'ally_pay_ransom', {
    connections: 5,
    wealthCapacity: 'comfortable_means',
  }), true);

  assert.equal(choiceAvailable('hero_ally_pays_price', 'ally_pay_ransom_supported', {
    connections: 20,
    wealthCapacity: 'comfortable_means',
  }), true);
  assert.equal(choiceAvailable('hero_ally_pays_price', 'ally_pay_ransom', {
    connections: 20,
    wealthCapacity: 'comfortable_means',
  }), true);

  assert.equal(choiceAvailable('hero_ally_pays_price', 'ally_pay_ransom_supported', {
    connections: 5,
    wealthCapacity: 'no_surplus',
  }), false);
  assert.equal(choiceAvailable('hero_ally_pays_price', 'ally_pay_ransom', {
    connections: 5,
    wealthCapacity: 'no_surplus',
  }), false);
  assert.equal(choiceAvailable('hero_ally_pays_price', 'ally_shield_reputation', {
    connections: 5,
    wealthCapacity: 'no_surplus',
  }), true);
  assert.equal(choiceAvailable('hero_ally_pays_price', 'ally_cut_ties', {
    connections: 5,
    wealthCapacity: 'no_surplus',
  }), true);
}

function testFamilyCrisisTierMatrixAndWording(): void {
  const event = getEvent('family_crisis');
  const surfaces = [
    event.content?.text ?? '',
    ...(event.choices ?? []).map(choice => choice.text ?? ''),
  ].join('\n');
  assert(!surfaces.includes('倾尽家财'), 'family_crisis must not claim total economic depletion');

  assert.equal(choiceAvailable('family_crisis', 'family_crisis_full_support', { wealthCapacity: 'no_surplus' }), false);
  assert.equal(choiceAvailable('family_crisis', 'family_crisis_limited_support', { wealthCapacity: 'no_surplus' }), false);
  assert.equal(choiceAvailable('family_crisis', 'family_crisis_self_preserve', { wealthCapacity: 'no_surplus' }), true);

  assert.equal(choiceAvailable('family_crisis', 'family_crisis_limited_support', { wealthCapacity: 'modest_savings' }), true);
  assert.equal(choiceAvailable('family_crisis', 'family_crisis_full_support', { wealthCapacity: 'modest_savings' }), false);

  assert.equal(choiceAvailable('family_crisis', 'family_crisis_limited_support', { wealthCapacity: 'comfortable_means' }), true);
  assert.equal(choiceAvailable('family_crisis', 'family_crisis_full_support', { wealthCapacity: 'comfortable_means' }), true);
}

function testSectExpansionDurableFlagAuthoring(): void {
  const major = getChoice('career_sect_expansion', 'career_sect_expansion_choice_1');
  assert((major.effects ?? []).some(effect =>
    effect.type === 'flag_set' && (effect.flag ?? effect.target) === 'career_sect_major_expansion'));
  assert.equal((major.effects ?? []).filter(isMoneyEffect).length, 0);
  assert((major.text ?? '').includes('声望 +30'));
  assert(!(major.text ?? '').includes('财富 -200'));

  for (const choiceId of ['career_sect_expansion_choice_2', 'career_sect_expansion_choice_3']) {
    const choice = getChoice('career_sect_expansion', choiceId);
    assert.equal(choice.condition, undefined);
    assert.equal(
      (choice.effects ?? []).some(effect => (effect.flag ?? effect.target) === 'career_sect_major_expansion'),
      false,
    );
  }

  const createSect = getChoice('career_foundation_sect', 'create_sect');
  assert((createSect.effects ?? []).some(effect => (effect.flag ?? effect.target) === 'has_own_sect'));
  assert.equal((createSect.effects ?? []).filter(isMoneyEffect).length, 0);
}

function testBorderEndingAuthoring(): void {
  const event = getEvent('border_ending_merchant');
  const effects = event.autoEffects ?? [];
  assert.equal(effects.filter(isMoneyEffect).length, 0);
  assert(effects.some(effect => effect.type === 'wealth_capacity_raise_to' && effect.minimum === 'regional_magnate'));
  assert.equal(effects.some(effect => effect.type === 'wealth_capacity_set'), false);
  assert(effects.some(effect => (effect.target ?? effect.flag) === 'border_ending_merchant'));
}

function testStaleNumericWalletWording(): void {
  const surfaces: Array<{ label: string; text: string }> = [
    { label: 'border_crisis_ransom', text: getChoice('border_crisis', 'border_crisis_ransom').text ?? '' },
    { label: 'fund_expedition', text: getChoice('jianghu_demon_sect', 'fund_expedition').text ?? '' },
    {
      label: 'family_child_marriage_choice_1',
      text: getChoice('family_child_marriage', 'family_child_marriage_choice_1').text ?? '',
    },
    {
      label: 'ally_pay_ransom_supported',
      text: [
        getChoice('hero_ally_pays_price', 'ally_pay_ransom_supported').text ?? '',
        getChoice('hero_ally_pays_price', 'ally_pay_ransom_supported').description ?? '',
      ].join('\n'),
    },
    {
      label: 'ally_pay_ransom',
      text: [
        getChoice('hero_ally_pays_price', 'ally_pay_ransom').text ?? '',
        getChoice('hero_ally_pays_price', 'ally_pay_ransom').description ?? '',
      ].join('\n'),
    },
    {
      label: 'family_crisis',
      text: [
        getEvent('family_crisis').content?.text ?? '',
        ...(getEvent('family_crisis').choices ?? []).map(choice => choice.text ?? ''),
      ].join('\n'),
    },
    { label: 'create_sect', text: getChoice('career_foundation_sect', 'create_sect').text ?? '' },
    {
      label: 'career_sect_expansion_choice_1',
      text: getChoice('career_sect_expansion', 'career_sect_expansion_choice_1').text ?? '',
    },
    {
      label: 'border_ending_merchant',
      text: [
        getEvent('border_ending_merchant').content?.text ?? '',
        getEvent('border_ending_merchant').content?.description ?? '',
      ].join('\n'),
    },
  ];

  const banned = [
    '银两 -10',
    '银两 -20',
    '银两 -30',
    '财富 -30',
    '财富 -100',
    '财富 -200',
    '金钱 +40',
    '财富 +40',
    '倾囊',
    '倾尽家财',
  ];

  for (const surface of surfaces) {
    for (const token of banned) {
      assert(!surface.text.includes(token), `${surface.label} must not keep stale token "${token}"`);
    }
  }

  assert((getChoice('family_child_marriage', 'family_child_marriage_choice_1').text ?? '').includes('风光大嫁'));
  assert((getChoice('career_sect_expansion', 'career_sect_expansion_choice_1').text ?? '').includes('大规模扩建'));
}

async function testRequirementNonConsumptionAndMoneySentinels(): Promise<void> {
  const samples: Array<{ eventId: string; choiceId: string; wealth: WealthCapacity; flags?: Record<string, boolean> }> = [
    { eventId: 'border_crisis', choiceId: 'border_crisis_ransom', wealth: 'comfortable_means' },
    { eventId: 'hero_ally_pays_price', choiceId: 'ally_pay_ransom_supported', wealth: 'no_surplus' },
    { eventId: 'hero_ally_pays_price', choiceId: 'ally_pay_ransom', wealth: 'comfortable_means' },
    { eventId: 'family_crisis', choiceId: 'family_crisis_full_support', wealth: 'comfortable_means' },
    { eventId: 'career_sect_expansion', choiceId: 'career_sect_expansion_choice_1', wealth: 'comfortable_means' },
  ];

  for (const sample of samples) {
    for (const money of MONEY_SENTINELS) {
      const engine = new GameEngineIntegration();
      engine.startNewGame('D16 sentinel', 'male');
      const state = engine.getGameState();
      state.player.wealthCapacity = sample.wealth;
      state.player.connections = sample.choiceId === 'ally_pay_ransom_supported' ? 20 : 10;
      state.player.reputation = 10;
      const beforeWealth = state.player.wealthCapacity;
      await engine.executeChoiceEffects(
        getChoice(sample.eventId, sample.choiceId).effects ?? [],
        sample.eventId,
        sample.choiceId,
      );
      const after = engine.getGameState();
      assert.equal('money' in after.player, false, `${sample.eventId}/${sample.choiceId} money sentinel`);
      assert.equal(after.player.wealthCapacity, beforeWealth, `${sample.eventId}/${sample.choiceId} must not consume Wealth`);
    }
  }

  for (const wealth of ['comfortable_means', 'wealthy', 'regional_magnate'] as const) {
    const engine = new GameEngineIntegration();
    engine.startNewGame('D16 non-consumption', 'male');
    const state = engine.getGameState();
    state.player.wealthCapacity = wealth;
    await engine.executeChoiceEffects(
      getChoice('career_foundation_sect', 'create_sect').effects ?? [],
      'career_foundation_sect',
      'create_sect',
    );
    const after = engine.getGameState();
    assert.equal(after.player.wealthCapacity, wealth);
    assert.equal(after.flags.has_own_sect ?? after.player.flags?.has_own_sect, true);
    assert.equal('money' in after.player, false);
  }
}

async function testSectExpansionFlagRuntime(): Promise<void> {
  const engine = new GameEngineIntegration();
  engine.startNewGame('D16 sect expansion', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'comfortable_means';
  state.player.reputation = 10;
  await engine.executeChoiceEffects(
    getChoice('career_sect_expansion', 'career_sect_expansion_choice_1').effects ?? [],
    'career_sect_expansion',
    'career_sect_expansion_choice_1',
  );
  assert.equal(engine.getGameState().flags.career_sect_major_expansion, true);

  for (const choiceId of ['career_sect_expansion_choice_2', 'career_sect_expansion_choice_3']) {
    const other = new GameEngineIntegration();
    other.startNewGame('D16 sect minor', 'male');
    await other.executeChoiceEffects(
      getChoice('career_sect_expansion', choiceId).effects ?? [],
      'career_sect_expansion',
      choiceId,
    );
    assert.notEqual(other.getGameState().flags.career_sect_major_expansion, true);
  }
}

async function testBorderEndingTransitionMatrix(): Promise<void> {
  for (const wealth of WEALTH_TIERS) {
    for (const _money of MONEY_SENTINELS) {
      const before = createMinimalState({
        player: createMinimalPlayer({ wealthCapacity: wealth }),
      });
      const after = await new EventExecutor().executeEffects(
        getEvent('border_ending_merchant').autoEffects ?? [],
        before,
      );
      assert.equal('money' in after.player, false);
      assert.equal(after.player.wealthCapacity, 'regional_magnate');
      assert.equal(after.flags.border_ending_merchant, true);
    }
  }
}

async function main(): Promise<void> {
  testFormalMoneyProducerZero();
  testRequirementGates();
  testHeroContractsAndMatrix();
  testFamilyCrisisTierMatrixAndWording();
  testSectExpansionDurableFlagAuthoring();
  testBorderEndingAuthoring();
  testStaleNumericWalletWording();
  await testRequirementNonConsumptionAndMoneySentinels();
  await testSectExpansionFlagRuntime();
  await testBorderEndingTransitionMatrix();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
  console.log('globalMoneyFinalStrategicProducerMigration.test.ts: all passed');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
