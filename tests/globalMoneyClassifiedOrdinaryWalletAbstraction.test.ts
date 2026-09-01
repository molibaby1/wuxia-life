import assert from 'node:assert/strict';
import { EventExecutor } from '../src/core/EventExecutor';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import familyParenthoodDeferredEvents from '../src/data/lines/family-parenthood-deferred.json';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { EffectDefinition, EventDefinition, GameState, PlayerState } from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const MONEY_SENTINELS = [0, 317, 9999] as const;
const WEALTH_REPLACEMENT_EFFECTS = new Set([
  'wealth_capacity_set',
  'wealth_capacity_raise_to',
  'wealth_capacity_lower_to',
  'wealth_capacity_at_least',
]);

const STRATEGIC_RESIDUAL_COUNTS: Record<string, number> = {};

const STRATEGIC_RESIDUAL_EVENTS = Object.keys(STRATEGIC_RESIDUAL_COUNTS);

const ORDINARY_RETIRED_EVENTS = [
  'border_clan_conflict',
  'border_trade_route',
  'border_career_growth',
  'border_alliance',
  'family_child_education',
  'relationship_debt_return',
  'p29_social_momentum_patron_obligation',
  'court_politics_revealed',
  'career_recruit_disciples',
  'p9_childhood_first_trade',
  'p9_business_echo_midlife',
  'p9_merchant_midlife_caravan',
  'p11_wealth_reinforcement_first_deal',
  'p11_wealth_wanderer_divergence_fork',
  'hvg_merchant_first_responsibility_challenge',
  'hvg_merchant_post_shop_operating_rhythm',
  'hvg_merchant_first_operating_pressure',
  'hvg_merchant_midlife_expansion_rhythm',
  'merchant_midlife_debt_milestone',
  'magnate_on_ramp',
  'magnate_midlife_pressure',
  'magnate_payoff',
  'magnate_late_life',
] as const;

type MoneyWrite = { eventId: string; choiceId?: string; effect: EffectDefinition };

const deferredFamilyEvents = familyParenthoodDeferredEvents as unknown as EventDefinition[];

function isMoneyEffect(effect: EffectDefinition): boolean {
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money';
}

function isWealthReplacementEffect(effect: EffectDefinition): boolean {
  if (WEALTH_REPLACEMENT_EFFECTS.has(effect.type)) return true;
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'wealth';
}

function collectFormalMoneyWrites(): MoneyWrite[] {
  const loader = EventLoader.getInstance();
  const writes: MoneyWrite[] = [];
  const scan = (effects: EffectDefinition[] | undefined, eventId: string, choiceId?: string) => {
    for (const effect of effects ?? []) {
      if (!isMoneyEffect(effect)) continue;
      writes.push({ eventId, choiceId, effect });
    }
  };
  for (const event of loader.getAllEvents()) {
    scan(event.autoEffects, event.id);
    for (const choice of event.choices ?? []) scan(choice.effects, event.id, choice.id);
  }
  return writes;
}

function getEvent(eventId: string): EventDefinition {
  const event = EventLoader.getInstance().getEventById(eventId) ??
    deferredFamilyEvents.find(candidate => candidate.id === eventId);
  assert(event, `missing event: ${eventId}`);
  return event;
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
    wealthCapacity: 'no_surplus',
    reputation: 0,
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
  return {
    player: createMinimalPlayer(),
    flags: {},
    relations: {},
    eventHistory: [],
    actionHistory: [],
    ...overrides,
  };
}

function testStrategicResidualWhitelist(): void {
  const writes = collectFormalMoneyWrites();
  const byEvent = new Map<string, MoneyWrite[]>();
  for (const write of writes) {
    if (!byEvent.has(write.eventId)) byEvent.set(write.eventId, []);
    byEvent.get(write.eventId)!.push(write);
  }

  assert.equal(writes.length, 0, `expected 0 formal money writes after D16, got ${writes.length}`);
  assert.deepEqual([...byEvent.keys()].sort(), [...STRATEGIC_RESIDUAL_EVENTS].sort());

  for (const [eventId, expectedCount] of Object.entries(STRATEGIC_RESIDUAL_COUNTS)) {
    assert.equal(byEvent.get(eventId)?.length ?? 0, expectedCount, `${eventId} strategic write count`);
  }

  const writingEvents = new Set(writes.map(write => write.eventId));
  assert.equal(writingEvents.size, 0, `expected 0 money-writing events after D16, got ${writingEvents.size}`);
}

function testOrdinaryEventsHaveNoMoneyWrites(): void {
  for (const eventId of ORDINARY_RETIRED_EVENTS) {
    const event = getEvent(eventId);
    const effects = [
      ...(event.autoEffects ?? []),
      ...(event.choices ?? []).flatMap(choice => choice.effects ?? []),
    ];
    assert.equal(
      effects.filter(isMoneyEffect).length,
      0,
      `${eventId} must have zero ordinary money writes after D14`,
    );
    assert.equal(
      effects.some(isWealthReplacementEffect),
      false,
      `${eventId} must not gain Wealth replacement`,
    );
  }
}

function testCareerSectExpansionMixedGuard(): void {
  const event = getEvent('career_sect_expansion');
  const byChoice = new Map(
    (event.choices ?? []).map(choice => [
      choice.id,
      (choice.effects ?? []).filter(isMoneyEffect),
    ]),
  );

  assert.equal(byChoice.get('career_sect_expansion_choice_1')?.length ?? 0, 0);
  assert.equal(byChoice.get('career_sect_expansion_choice_2')?.length ?? 0, 0);
  assert.equal(byChoice.get('career_sect_expansion_choice_3')?.length ?? 0, 0);

  const major = event.choices?.find(choice => choice.id === 'career_sect_expansion_choice_1');
  assert.deepEqual(major?.condition, {
    type: 'wealth_capacity_at_least',
    minimum: 'comfortable_means',
  });
  assert(
    (major?.effects ?? []).some(effect => (effect.flag ?? effect.target) === 'career_sect_major_expansion'),
    'choice 1 must set career_sect_major_expansion',
  );
}

function testRetiredP9ContentStillAbsent(): void {
  const loader = EventLoader.getInstance();
  assert.equal(loader.getEventById('p9_wealth_caravan_gate'), undefined);
  assert.equal(loader.getEventById('p9_route_identity_wealth'), undefined);
}

async function executeEffects(eventId: string, effects: EffectDefinition[], _money: number): Promise<GameState> {
  const state = createMinimalState();
  return new EventExecutor().executeEffects(effects, state);
}

async function executeChoice(eventId: string, choiceId: string, money: number): Promise<GameState> {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Classified Ordinary Wallet Abstraction', 'male');
  const state = engine.getGameState();
  state.player.wealthCapacity = 'no_surplus';
  const event = getEvent(eventId);
  const choice = event.choices?.find(candidate => candidate.id === choiceId);
  assert(choice, `missing choice ${choiceId}`);
  const beforeWealthCapacity = state.player.wealthCapacity;
  await engine.executeChoiceEffects(choice.effects ?? [], event.id, choice.id);
  const after = engine.getGameState();
  assert.equal('money' in after.player, false, `${eventId}/${choiceId} must not alter money`);
  assert.equal(after.player.wealthCapacity, beforeWealthCapacity, `${eventId}/${choiceId} must not alter Wealth Capacity`);
  return after;
}

async function testRepresentativeMoneySentinelInvariance(): Promise<void> {
  const cases: Array<{ eventId: string; choiceId?: string; assert?: (state: GameState) => void }> = [
    { eventId: 'border_clan_conflict', choiceId: 'border_conflict_trade' },
    { eventId: 'p9_childhood_first_trade' },
    { eventId: 'p11_wealth_reinforcement_first_deal' },
    { eventId: 'hvg_merchant_first_responsibility_challenge', choiceId: 'ledger_rushed_collection' },
    { eventId: 'magnate_on_ramp', choiceId: 'magnate_entry_caravan_fast' },
    { eventId: 'career_sect_expansion', choiceId: 'career_sect_expansion_choice_2' },
  ];

  for (const testCase of cases) {
    for (const money of MONEY_SENTINELS) {
      if (testCase.choiceId) {
        const state = await executeChoice(testCase.eventId, testCase.choiceId, money);
        testCase.assert?.(state);
        continue;
      }
      const event = getEvent(testCase.eventId);
      const before = money;
      const state = await executeEffects(testCase.eventId, event.autoEffects ?? [], before);
      assert.equal('money' in state.player, false, `${testCase.eventId} auto must not alter money`);
      testCase.assert?.(state);
    }
  }
}

async function testSetMoneyRetirements(): Promise<void> {
  for (const money of MONEY_SENTINELS) {
    const debtState = await executeEffects(
      'relationship_debt_return',
      getEvent('relationship_debt_return').autoEffects ?? [],
      money,
    );
    assert.equal('money' in debtState.player, false, 'relationship_debt_return must not set money');

    const courtState = await executeChoice(
      'court_politics_revealed',
      'court_politics_revealed_choice_2',
      money,
    );
    assert.equal('money' in courtState.player, false, 'court_politics_revealed choice 2 must not set money');
    assert.equal(courtState.flags.exploited_court_plot, true);
  }
}

function testChoiceIntegrityNonCollapseSamples(): void {
  const sect = getEvent('career_sect_expansion');
  const outcomes = (sect.choices ?? []).map(choice =>
    (choice.effects ?? [])
      .filter(effect => !isMoneyEffect(effect))
      .map(effect => ({
        type: effect.type,
        target: effect.target ?? effect.stat ?? effect.flag ?? effect.status,
        value: effect.value,
      })),
  );
  assert.notDeepEqual(outcomes[1], outcomes[2], 'sect expansion minor tiers must remain distinct without wallet writes');
}

function getChoiceText(eventId: string, choiceId: string): string {
  const choice = getEvent(eventId).choices?.find(candidate => candidate.id === choiceId);
  assert(choice, `missing choice ${choiceId} in ${eventId}`);
  return choice.text ?? '';
}

function choiceMoneyWriteCount(eventId: string, choiceId: string): number {
  const choice = getEvent(eventId).choices?.find(candidate => candidate.id === choiceId);
  assert(choice, `missing choice ${choiceId} in ${eventId}`);
  return (choice.effects ?? []).filter(isMoneyEffect).length;
}

function testStaleWalletWordingRemoved(): void {
  const cases: Array<{ eventId: string; choiceId: string; stale: string; keep?: string }> = [
    { eventId: 'border_career_growth', choiceId: 'border_career_trade', stale: '金钱 +50' },
    { eventId: 'family_child_education', choiceId: 'child_education_merchant', stale: '财富 +50' },
    { eventId: 'career_recruit_disciples', choiceId: 'career_recruit_disciples_choice_2', stale: '财富 +50' },
    { eventId: 'career_sect_expansion', choiceId: 'career_sect_expansion_choice_2', stale: '财富 -50', keep: '声望 +10' },
    { eventId: 'career_sect_expansion', choiceId: 'career_sect_expansion_choice_3', stale: '财富 -20', keep: '学识 +4' },
  ];

  for (const testCase of cases) {
    const text = getChoiceText(testCase.eventId, testCase.choiceId);
    assert.equal(
      choiceMoneyWriteCount(testCase.eventId, testCase.choiceId),
      0,
      `${testCase.eventId}/${testCase.choiceId} must remain money-write free`,
    );
    assert(
      !text.includes(testCase.stale),
      `${testCase.eventId}/${testCase.choiceId} must not keep stale wallet wording "${testCase.stale}"`,
    );
    if (testCase.keep) {
      assert(
        text.includes(testCase.keep),
        `${testCase.eventId}/${testCase.choiceId} must preserve non-money hint "${testCase.keep}"`,
      );
    }
  }
}

function testStrategicSectExpansionChoice1Migrated(): void {
  const text = getChoiceText('career_sect_expansion', 'career_sect_expansion_choice_1');
  const moneyWrites = getEvent('career_sect_expansion').choices
    ?.find(choice => choice.id === 'career_sect_expansion_choice_1')
    ?.effects
    ?.filter(isMoneyEffect) ?? [];
  assert.equal(moneyWrites.length, 0);
  assert(!text.includes('财富 -200'), 'career_sect_expansion choice 1 must retire strategic wallet wording');
  assert(text.includes('声望 +30'), 'career_sect_expansion choice 1 must keep reputation hint');
}

async function main(): Promise<void> {
  testStrategicResidualWhitelist();
  testOrdinaryEventsHaveNoMoneyWrites();
  testCareerSectExpansionMixedGuard();
  testRetiredP9ContentStillAbsent();
  testChoiceIntegrityNonCollapseSamples();
  testStaleWalletWordingRemoved();
  testStrategicSectExpansionChoice1Migrated();
  await testRepresentativeMoneySentinelInvariance();
  await testSetMoneyRetirements();
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
  console.log('globalMoneyClassifiedOrdinaryWalletAbstraction.test.ts: all passed');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
