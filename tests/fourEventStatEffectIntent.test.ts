import assert from 'node:assert/strict';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventExecutor } from '../src/core/EventExecutor';
import { EventLoader } from '../src/core/EventLoader';
import { generateChoiceFeedback } from '../src/core/ChoiceFeedbackGenerator';
import { calculatePublicStatDeltas } from '../src/core/activePlanning/periodSummaryBuilder';
import { traitSystem } from '../src/core/TraitSystem';
import type {
  EventChoice,
  EventDefinition,
  GameState,
  PlayerState,
  TraitId,
} from '../src/types/eventTypes';

type PublicStat =
  | 'chivalry'
  | 'charisma'
  | 'connections'
  | 'knowledge'
  | 'reputation';

type ExpectedStat = {
  stat: PublicStat;
  before: number;
  after: number;
  delta: number;
};

function baseState(
  overrides: Partial<PlayerState> = {},
  stateOverrides: Partial<GameState> = {},
): GameState {
  const player = {
    name: '事件属性效果回归',
    age: 25,
    gender: 'male',
    martialPower: 10,
    chivalry: 20,
    constitution: 10,
    reputation: 80,
    knowledge: 20,
    charisma: 20,
    businessAcumen: 0,
    influence: 0,
    connections: 20,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    wealthCapacity: 'no_surplus' as const,
    affiliation: null,
    title: null,
    flags: {},
    events: [],
    items: [],
    relationships: [],
    children: 0,
    spouse: null,
    alive: true,
    healthStatus: 'healthy' as const,
    statuses: [],
    investments: [],
    traits: [],
    lifeStates: {
      trainingHabit: 0,
      studyHabit: 0,
      businessHabit: 0,
    },
    ...overrides,
  };

  return {
    saveVersion: '1.0.0',
    lastSavedAt: 0,
    gameTimestamp: 0,
    player,
    triggeredEvents: [],
    eventHistory: [],
    facts: {},
    flags: {},
    relations: {},
    inventory: [],
    statistics: { totalEvents: 0, totalChoices: 0, playTime: 0 },
    ...stateOverrides,
  } as GameState;
}

function getEvent(id: string): EventDefinition {
  const event = EventLoader.getInstance().getEventById(id);
  assert(event, `正式事件必须由 EventLoader 装载：${id}`);
  return event;
}

function getChoice(event: EventDefinition, id: string): EventChoice {
  const choice = event.choices?.find(candidate => candidate.id === id);
  assert(choice, `正式事件 ${event.id} 缺少选项 ${id}`);
  return choice;
}

function eventConditionsPass(event: EventDefinition, state: GameState): boolean {
  const evaluator = new ConditionEvaluator();
  return (event.conditions ?? []).every(condition => evaluator.evaluate(condition, state));
}

function assertAgeRange(event: EventDefinition, min: number, max: number, triggerAge: number): void {
  assert.deepEqual(event.ageRange, { min, max }, `${event.id} 年龄范围保持不变`);
  assert.deepEqual(event.triggers, [{ type: 'age_reach', value: triggerAge }], `${event.id} 年龄触发保持不变`);
}

async function settle(
  event: EventDefinition,
  choiceId: string,
  before: GameState,
  expected: ExpectedStat[],
): Promise<GameState> {
  const choice = getChoice(event, choiceId);
  const effects = choice.effects ?? [];
  const after = await new EventExecutor().executeEffects(effects, before);
  const canonicalDelta = calculatePublicStatDeltas(before.player, after.player);
  const feedback = generateChoiceFeedback({
    narrativeResult: event.content.title,
    effects,
    sourceEventId: event.id,
    sourceChoiceId: choice.id,
    beforePlayer: before.player,
    afterPlayer: after.player,
    beforeFlags: before.flags,
    afterFlags: after.flags,
  });
  const feedbackDelta = Object.fromEntries(
    feedback.player.statImpacts.map(impact => [impact.stat, impact.delta]),
  );

  assert.deepEqual(feedbackDelta, canonicalDelta, `${event.id}/${choiceId} 玩家可见 delta 必须等于 canonical before/after`);
  for (const item of expected) {
    assert.equal(before.player[item.stat], item.before, `${event.id}/${choiceId} 测试初值`);
    assert.equal(after.player[item.stat], item.after, `${event.id}/${choiceId} ${item.stat} 结算后值`);
    assert.equal(canonicalDelta[item.stat] ?? 0, item.delta, `${event.id}/${choiceId} ${item.stat} 实际公开 delta`);
    console.log(`${event.id}/${choiceId}: ${item.stat} ${item.before}→${item.after}（公开 Δ${item.delta >= 0 ? '+' : ''}${item.delta}）`);
  }
  return after;
}

function assertFlag(state: GameState, flag: string, expected = true): void {
  assert.equal(state.flags[flag], expected, `top-level flag ${flag}`);
  assert.equal(state.player.flags?.[flag], expected, `player flag ${flag}`);
}

async function testRefugeeSectStory(): Promise<void> {
  const event = getEvent('refugee_sect_story');
  assertAgeRange(event, 16, 35, 16);
  assert.equal(eventConditionsPass(event, baseState({ age: 16 })), true, '流浪武者故事无额外资格门槛');

  const sympathy = getChoice(event, 'refugee_sect_story_choice_1');
  const first = await settle(event, sympathy.id, baseState({ chivalry: -8, connections: 2 }), [
    { stat: 'chivalry', before: -8, after: -3, delta: 5 },
    { stat: 'connections', before: 2, after: 12, delta: 10 },
  ]);
  assertFlag(first, 'sympathized_refugee');

  await settle(event, sympathy.id, baseState({ chivalry: 70, connections: 60 }), [
    { stat: 'chivalry', before: 70, after: 75, delta: 5 },
    { stat: 'connections', before: 60, after: 70, delta: 10 },
  ]);

  const heroic = baseState({ chivalry: 10, connections: 1, traits: ['heroic_heart'] as TraitId[] });
  const growthAdjusted = await settle(event, sympathy.id, heroic, [
    { stat: 'chivalry', before: 10, after: 17, delta: 7 },
    { stat: 'connections', before: 1, after: 11, delta: 10 },
  ]);
  assert.equal(traitSystem.getGrowthMultiplier(heroic.player, 'chivalry'), 1.3);
  assertFlag(growthAdjusted, 'sympathized_refugee');

  const neutral = getChoice(event, 'refugee_sect_story_choice_2');
  await settle(event, neutral.id, baseState({ knowledge: 2 }), [
    { stat: 'knowledge', before: 2, after: 7, delta: 5 },
  ]);
  await settle(event, neutral.id, baseState({ knowledge: 42 }), [
    { stat: 'knowledge', before: 42, after: 47, delta: 5 },
  ]);
}

async function testCourtPoliticsRevealed(): Promise<void> {
  const event = getEvent('court_politics_revealed');
  assertAgeRange(event, 25, 50, 25);
  assert.equal(
    eventConditionsPass(event, baseState({ age: 25, reputation: 100 })),
    true,
    'reputation >= 100 必须保持事件资格',
  );
  assert.equal(
    eventConditionsPass(event, baseState({ age: 25, reputation: 40 }, { flags: { official_faction: true } })),
    true,
    'official_faction 必须保持独立事件资格路径',
  );
  assert.equal(
    eventConditionsPass(event, baseState({ age: 25, reputation: 99 })),
    false,
    '低于名望门槛且没有 official_faction 时仍不具资格',
  );

  const expose = getChoice(event, 'court_politics_revealed_choice_1');
  assert.match(expose.description ?? '', /名望|声望/, '公布真相前应提示名望方向的代价');
  assert.doesNotMatch(expose.description ?? '', /\b50\b/, '选择前不展示内部精确效果数值');
  const high = await settle(event, expose.id, baseState({ reputation: 120, connections: 10 }), [
    { stat: 'reputation', before: 120, after: 70, delta: -50 },
    { stat: 'connections', before: 10, after: 30, delta: 20 },
  ]);
  assertFlag(high, 'exposed_court_plot');
  const low = await settle(event, expose.id, baseState({ reputation: 40, connections: 60 }), [
    { stat: 'reputation', before: 40, after: 0, delta: -40 },
    { stat: 'connections', before: 60, after: 80, delta: 20 },
  ]);
  assertFlag(low, 'exposed_court_plot');

  const exploit = getChoice(event, 'court_politics_revealed_choice_2');
  const exploitedHigh = await settle(event, exploit.id, baseState({ reputation: 100 }), [
    { stat: 'reputation', before: 100, after: 115, delta: 15 },
  ]);
  assertFlag(exploitedHigh, 'exploited_court_plot');
  const exploitedLow = await settle(event, exploit.id, baseState({ reputation: 40 }), [
    { stat: 'reputation', before: 40, after: 55, delta: 15 },
  ]);
  assertFlag(exploitedLow, 'exploited_court_plot');

  const silence = getChoice(event, 'court_politics_revealed_choice_3');
  const silent = await settle(event, silence.id, baseState({ reputation: 88, connections: 33 }), []);
  assertFlag(silent, 'ignored_court_plot');
  assert.equal(silent.player.reputation, 88, '沉默分支不修改名望');
  assert.equal(silent.player.connections, 33, '沉默分支不修改人脉');
}

async function testP26BusinessHabitObligation(): Promise<void> {
  const event = getEvent('p26_business_habit_obligation');
  assertAgeRange(event, 34, 44, 34);
  assert.equal(
    eventConditionsPass(event, baseState({ age: 34, lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 3 } })),
    true,
    'businessHabit=3 必须符合资格',
  );
  assert.equal(
    eventConditionsPass(event, baseState({ age: 34, lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 2 } })),
    false,
    'businessHabit=2 必须不符合资格',
  );

  const take = getChoice(event, 'take_long_term_ledger');
  assert.equal(take.text, '接下账路，换取更稳更深的商脉');
  assert.equal(take.effects?.some(effect => effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money'), false, '不得恢复 legacy wallet rewards');
  const takenLow = await settle(event, take.id, baseState({ reputation: 2 }), [
    { stat: 'reputation', before: 2, after: 7, delta: 5 },
  ]);
  assertFlag(takenLow, 'p26_business_obligation_taken');
  assert.equal('money' in takenLow.player, false);
  const takenHigh = await settle(event, take.id, baseState({ reputation: 40 }), [
    { stat: 'reputation', before: 40, after: 45, delta: 5 },
  ]);
  assertFlag(takenHigh, 'p26_business_obligation_taken');

  const decline = getChoice(event, 'stay_small_scale');
  const declined = await settle(event, decline.id, baseState({ reputation: 40 }), []);
  assertFlag(declined, 'p26_business_obligation_declined');
  assert.equal(declined.player.reputation, 40, '保持小规模分支不修改名望');
  assert.equal(declined.player.flags?.p26_business_obligation_taken, undefined);
}

async function testMerchantTalentDiscovery(): Promise<void> {
  const event = getEvent('merchant_talent_discovery');
  assertAgeRange(event, 8, 16, 8);
  const eligible = baseState(
    { age: 8, charisma: 20, flags: { merchant_childhood_seed_done: true } },
    { facts: { birth_background: 'merchant_house' } as GameState['facts'] },
  );
  assert.equal(eventConditionsPass(event, eligible), true, '合法商人出身及童年积累可满足资格');
  assert.equal(
    eventConditionsPass(event, baseState({ age: 8, charisma: 11 })),
    false,
    '魅力不足且没有已批准的商路事实时不得满足资格',
  );

  const business = getChoice(event, 'study_business');
  const firstShop = getEvent('merchant_first_shop');
  const firstShopConditionsPass = (state: GameState) => eventConditionsPass(firstShop, state);

  const businessLow = await settle(event, business.id, eligible, [
    { stat: 'charisma', before: 20, after: 25, delta: 5 },
  ]);
  assert.equal(businessLow.player.wealthCapacity, 'modest_savings');
  assertFlag(businessLow, 'merchant_talent');
  assertFlag(businessLow, 'route_merchant');
  const shopEligible = {
    ...businessLow,
    player: { ...businessLow.player, age: 16 },
  } as GameState;
  assert.equal(firstShopConditionsPass(shopEligible), true, 'Merchant 天赋与 Wealth Capacity 继续开启既有开店资格');
  const noTalent = {
    ...shopEligible,
    flags: { ...shopEligible.flags, merchant_talent: false },
    player: { ...shopEligible.player, flags: { ...shopEligible.player.flags, merchant_talent: false } },
  } as GameState;
  assert.equal(firstShopConditionsPass(noTalent), false, '没有 merchant_talent 仍不能开店');
  const insufficientWealth = {
    ...shopEligible,
    player: { ...shopEligible.player, wealthCapacity: 'no_surplus' },
  } as GameState;
  assert.equal(firstShopConditionsPass(insufficientWealth), false, '未达到 modest_savings 仍不能开店');

  const businessHigh = await settle(event, business.id, baseState({ age: 8, charisma: 40, flags: { merchant_childhood_seed_done: true } }), [
    { stat: 'charisma', before: 40, after: 45, delta: 5 },
  ]);
  assert.equal(businessHigh.player.wealthCapacity, 'modest_savings');
  assertFlag(businessHigh, 'merchant_talent');
  assertFlag(businessHigh, 'route_merchant');

  const sociallyGifted = baseState({ age: 8, charisma: 20, flags: { merchant_childhood_seed_done: true }, traits: ['social_gift'] as TraitId[] });
  const charismaGrowth = await settle(event, business.id, sociallyGifted, [
    { stat: 'charisma', before: 20, after: 27, delta: 7 },
  ]);
  assert.equal(traitSystem.getGrowthMultiplier(sociallyGifted.player, 'charisma'), 1.3);
  assert.equal(charismaGrowth.player.wealthCapacity, 'modest_savings');

  const charismaAtCap = await settle(event, business.id, baseState({ age: 8, charisma: 98, flags: { merchant_childhood_seed_done: true } }), [
    { stat: 'charisma', before: 98, after: 100, delta: 2 },
  ]);
  assert.equal(charismaAtCap.player.charisma, 100, '魅力增量仍受合法 0–100 上限处理');

  const study = getChoice(event, 'focus_studying');
  const studiedLow = await settle(event, study.id, eligible, [
    { stat: 'knowledge', before: 20, after: 25, delta: 5 },
  ]);
  const studiedHigh = await settle(event, study.id, baseState({ age: 8, knowledge: 42, charisma: 20, flags: { merchant_childhood_seed_done: true } }), [
    { stat: 'knowledge', before: 42, after: 47, delta: 5 },
  ]);
  for (const state of [studiedLow, studiedHigh]) {
    assert.equal(state.player.wealthCapacity, 'no_surplus', '专心读书不改变 Wealth Capacity');
    assert.equal(state.player.flags?.merchant_talent, undefined, '专心读书不建立 merchant_talent');
    assert.equal(state.player.flags?.route_merchant, undefined, '专心读书不建立商业路线');
    assert.equal(firstShopConditionsPass({ ...state, player: { ...state.player, age: 16 } } as GameState), false);
  }
}

async function run(): Promise<void> {
  await testRefugeeSectStory();
  await testCourtPoliticsRevealed();
  await testP26BusinessHabitObligation();
  await testMerchantTalentDiscovery();
  console.log('fourEventStatEffectIntent.test.ts: passed');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
