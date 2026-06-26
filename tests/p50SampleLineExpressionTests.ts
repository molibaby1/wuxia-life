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

function testPost40PayoffExpression(): void {
  const orthodox45 = makeState(45, {
    orthodox_age40_identity_done: true,
    orthodox_age45_payoff_done: true,
    orthodox_age45_legacy_steward_done: true,
  });
  const orthodoxGoal = deriveSampleLineCurrentGoal(orthodox45) ?? '';
  assert(orthodoxGoal.includes('传承'), `orthodox 45 payoff goal: ${orthodoxGoal}`);

  const demonic45 = makeState(45, {
    demonic_age40_identity_done: true,
    demonic_age45_payoff_done: true,
    demonic_age45_territory_consolidated: true,
    route_demonic: true,
  });
  const demonicGoal = deriveSampleLineCurrentGoal(demonic45) ?? '';
  assert(demonicGoal.includes('地盘'), `demonic 45 payoff goal: ${demonicGoal}`);

  const merchant45 = makeState(45, {
    merchant_age40_identity_done: true,
    merchant_age45_payoff_done: true,
    merchant_age45_expansion_fork_done: true,
    merchant_childhood_seed_done: true,
  });
  const merchantGoal = deriveSampleLineCurrentGoal(merchant45) ?? '';
  assert(merchantGoal.includes('扩张'), `merchant 45 payoff goal: ${merchantGoal}`);

  for (const goal of [orthodoxGoal, demonicGoal, merchantGoal]) {
    assert(isPlayerVisibleSampleLineText(goal), `raw key in 40+ goal: ${goal}`);
  }
}

function testOrthodox301ResidualExpression(): void {
  const age25Cost = makeState(26, {
    route_orthodox: true,
    orthodox_righteousness_cost_visible: true,
    orthodox_trial_completed: true,
  });
  const costGoal = deriveSampleLineCurrentGoal(age25Cost) ?? '';
  assert(costGoal.includes('代价') || costGoal.includes('义务'), `orthodox age-25 cost goal: ${costGoal}`);

  const age32Gray = makeState(33, {
    route_orthodox: true,
    orthodox_righteousness_cost_visible: true,
    orthodox_gray_pressure_visible: true,
    orthodox_trial_completed: true,
  });
  const grayGoal = deriveSampleLineCurrentGoal(age32Gray) ?? '';
  assert(grayGoal.includes('灰度') || grayGoal.includes('代价'), `orthodox age-32 gray goal: ${grayGoal}`);

  const graySummary = deriveLifeMemorySummary(age32Gray);
  assert(
    graySummary.routeStatus?.currentGoalLabel?.includes('灰度')
    || graySummary.routeStatus?.currentGoalLabel?.includes('代价'),
    'orthodox gray pressure missing from life-memory goal',
  );
}

function testMerchant804ResidualExpression(): void {
  const age32Debt = makeState(33, {
    route_merchant: true,
    merchant_childhood_seed_done: true,
    merchant_shop_grocery: true,
    merchant_midlife_debt: true,
  });
  const debtGoal = deriveSampleLineCurrentGoal(age32Debt) ?? '';
  assert(
    debtGoal.includes('人情') || debtGoal.includes('周转') || debtGoal.includes('债'),
    `merchant age-32 debt goal: ${debtGoal}`,
  );

  const age40Debt = makeState(40, {
    route_merchant: true,
    merchant_age40_identity_done: true,
    merchant_midlife_debt: true,
    merchant_childhood_seed_done: true,
  });
  const identity = deriveSampleLineAge40Identity(age40Debt) ?? '';
  assert(
    identity.includes('债') && identity.includes('人情'),
    `merchant age-40 debt identity: ${identity}`,
  );
  const summary = deriveLifeMemorySummary(age40Debt);
  assert(
    summary.unresolvedDebts?.some((debt) => debt.label.includes('人情债')),
    'merchant age-40 life-memory missing favor debt',
  );
}

function main(): void {
  testOrthodoxExpression();
  testDemonicExpression();
  testMerchantExpression();
  testCrossLineAge13CostLabels();
  testMerchantLineWinsOverParallelDemonicRoute();
  testOrthodox301ResidualExpression();
  testMerchant804ResidualExpression();
  testPost40PayoffExpression();
  console.log('p50SampleLineExpressionTests: all passed');
}

main();
