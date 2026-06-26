import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  deriveSampleLineAge40Identity,
  deriveSampleLineCostLabel,
  deriveSampleLineCurrentGoal,
  detectSampleLine,
  isPlayerVisibleSampleLineText,
} from '../src/p50/sampleLineExpression';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function makeState(age: number, flags: Record<string, unknown>): GameState {
  return {
    player: {
      age,
      name: 'fixture',
      gender: 'male',
      martialPower: 30,
      externalSkill: 10,
      internalSkill: 10,
      qinggong: 10,
      chivalry: 10,
      constitution: 50,
      comprehension: 30,
      sect: null,
      title: null,
      reputation: 10,
      money: 100,
      knowledge: 15,
      charisma: 10,
      businessAcumen: 10,
      influence: 8,
      connections: 5,
      martialHeritage: 0,
      scholarlyHeritage: 0,
      merchantNetwork: 0,
      children: 0,
      spouse: null,
      alive: true,
      flags: {},
      lifeStates: createDefaultPlayerLifeStates(),
    },
    flags,
    relations: {},
    achievements: [],
    eventHistory: [
      {
        eventId: 'sect_midlife_gray_mission',
        selectedChoice: 'refuse',
        age: 36,
      } as GameState['eventHistory'][0],
    ],
    routeStates: {},
  } as GameState;
}

function testOrthodoxExpression(): void {
  const youth = makeState(28, {
    route_orthodox: true,
    orthodox_trial_completed: true,
    orthodox_formal_disciple: true,
  });
  const goal = deriveSampleLineCurrentGoal(youth);
  assert(Boolean(goal?.includes('行侠')), `orthodox youth goal missing: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), `raw key leaked in goal: ${goal}`);

  const midlife = makeState(36, {
    route_orthodox: true,
    orthodox_formal_disciple: true,
    sect_midlife_gray_refused: true,
  });
  midlife.eventHistory = [
    {
      eventId: 'sect_midlife_gray_mission',
      selectedChoice: 'refuse',
      age: 36,
    } as GameState['eventHistory'][0],
  ];
  const summary = deriveLifeMemorySummary(midlife);
  assert(summary.routeStatus?.currentGoalLabel?.includes('守正'), 'orthodox midlife goal missing');
  assert(
    summary.achievements?.some((entry) => entry.label.includes('守正') || entry.label.includes('正派'))
    || summary.routeStatus?.currentGoalLabel?.includes('代价'),
    'orthodox midlife identity signal missing',
  );

  const age40 = makeState(40, {
    route_orthodox: true,
    orthodox_age40_identity_done: true,
    sect_midlife_gray_refused: true,
  });
  const identity = deriveSampleLineAge40Identity(age40);
  assert(Boolean(identity?.includes('正派')), `orthodox age40 identity missing: ${identity}`);

  const screen = buildMainScreenModel(age40.player, deriveLifeMemorySummary(age40));
  assert(!screen.routeSummary.includes('route_orthodox'), 'raw route key in main screen');
}

function testDemonicExpression(): void {
  const youth = makeState(25, {
    route_demonic: true,
    demonic_youth_first_transgression: true,
    outlaw_rise: true,
  });
  const goal = deriveSampleLineCurrentGoal(youth);
  assert(Boolean(goal?.includes('力量') || goal?.includes('地盘')), `demonic goal missing: ${goal}`);

  const midlife = makeState(35, {
    route_demonic: true,
    demonic_midlife_isolation_done: true,
    demonic_midlife_betrayal_done: true,
  });
  const summary = deriveLifeMemorySummary(midlife);
  assert(summary.risks?.some((risk) => risk.label.includes('旧友')), 'demonic isolation risk missing');

  const age40 = makeState(40, {
    route_demonic: true,
    demonic_age40_identity_done: true,
    demonic_midlife_legacy_rule: true,
  });
  const identity = deriveSampleLineAge40Identity(age40);
  assert(Boolean(identity?.includes('魔道')), `demonic age40 identity missing: ${identity}`);
}

function testMerchantExpression(): void {
  const youth = makeState(20, {
    route_merchant: true,
    merchant_talent: true,
    merchant_shop_grocery: true,
  });
  const goal = deriveSampleLineCurrentGoal(youth);
  assert(Boolean(goal?.includes('店铺') || goal?.includes('经营')), `merchant goal missing: ${goal}`);

  const orthodox = makeState(28, { route_orthodox: true, orthodox_formal_disciple: true });
  const merchant = makeState(28, {
    route_merchant: true,
    merchant_caravan_success: true,
  });
  const orthodoxGoal = deriveSampleLineCurrentGoal(orthodox) ?? '';
  const merchantGoal = deriveSampleLineCurrentGoal(merchant) ?? '';
  assert(orthodoxGoal !== merchantGoal, 'merchant should differ from orthodox at age 25+');
  assert(!merchantGoal.includes('行侠'), 'merchant goal should not read orthodox');

  const crisis = makeState(35, {
    route_merchant: true,
    merchant_shop_failed: true,
    merchant_midlife_debt: true,
  });
  const summary = deriveLifeMemorySummary(crisis);
  assert(summary.unresolvedDebts?.some((debt) => debt.label.includes('失利')), 'merchant shop debt missing');
  assert(summary.unresolvedDebts?.some((debt) => debt.label.includes('人情债')), 'merchant midlife debt missing');
}

function testCrossLineAge13CostLabels(): void {
  const orthodox = makeState(13, {
    route_orthodox: true,
    route_merchant: true,
    orthodox_childhood_seed_done: true,
  });
  const demonic = makeState(13, {
    route_demonic: true,
    route_merchant: true,
    demonic_childhood_seed_done: true,
  });
  const merchant = makeState(13, {
    route_merchant: true,
    merchant_childhood_seed_done: true,
  });

  const orthodoxCost = deriveSampleLineCostLabel(orthodox);
  const demonicCost = deriveSampleLineCostLabel(demonic);
  const merchantCost = deriveSampleLineCostLabel(merchant);

  assert(orthodoxCost.includes('守正'), `orthodox age-13 cost unexpected: ${orthodoxCost}`);
  assert(demonicCost.includes('邪路'), `demonic age-13 cost unexpected: ${demonicCost}`);
  assert(merchantCost.includes('商路'), `merchant age-13 cost unexpected: ${merchantCost}`);
  assert(
    new Set([orthodoxCost, demonicCost, merchantCost]).size === 3,
    'age-13 cost labels collapsed across sample lines',
  );
}

function testMerchantLineWinsOverParallelDemonicRoute(): void {
  const merchant804Midlife = makeState(28, {
    merchant_childhood_seed_done: true,
    route_merchant: true,
    route_demonic: true,
    merchant_shop_grocery: true,
  });
  assert(detectSampleLine(merchant804Midlife.flags ?? {}) === 'merchant', 'parallel route_demonic stole merchant line');
  const goal = deriveSampleLineCurrentGoal(merchant804Midlife) ?? '';
  assert(!goal.includes('试探底线'), `merchant line goal bleeds demonic: ${goal}`);
  assert(goal.includes('店铺') || goal.includes('经营') || goal.includes('周转'), `unexpected merchant goal: ${goal}`);
}

function main(): void {
  testOrthodoxExpression();
  testDemonicExpression();
  testMerchantExpression();
  testCrossLineAge13CostLabels();
  testMerchantLineWinsOverParallelDemonicRoute();
  console.log('p50SampleLineExpressionTests: all passed');
}

main();
