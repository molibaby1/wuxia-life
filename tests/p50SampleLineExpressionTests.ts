import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  deriveSampleLineAge40Identity,
  deriveSampleLineCostLabel,
  deriveSampleLineCurrentGoal,
  deriveSampleLineDestinySentence,
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
      chivalry: 10,
      constitution: 50,
      comprehension: 30,
      affiliation: null,
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
  assert(summary.currentGoalLabel?.includes('守正'), 'orthodox midlife goal missing');
  assert(
    summary.achievements?.some((entry) => entry.label.includes('守正') || entry.label.includes('正派'))
    || summary.currentGoalLabel?.includes('代价'),
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
  assert(!screen.stageTags.join(' ').includes('route_orthodox'), 'raw route key in main screen');
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
  assert(isPlayerVisibleSampleLineText(costGoal), `orthodox age-25 cost goal has raw key: ${costGoal}`);

  const age32Gray = makeState(33, {
    route_orthodox: true,
    orthodox_righteousness_cost_visible: true,
    orthodox_gray_pressure_visible: true,
    orthodox_trial_completed: true,
  });
  const grayGoal = deriveSampleLineCurrentGoal(age32Gray) ?? '';
  assert(grayGoal.includes('灰度') || grayGoal.includes('代价'), `orthodox age-32 gray goal: ${grayGoal}`);
  assert(isPlayerVisibleSampleLineText(grayGoal), `orthodox age-32 gray goal has raw key: ${grayGoal}`);

  const graySummary = deriveLifeMemorySummary(age32Gray);
  assert(
    graySummary.currentGoalLabel?.includes('灰度')
    || graySummary.currentGoalLabel?.includes('代价'),
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
  assert(isPlayerVisibleSampleLineText(debtGoal), `merchant age-32 debt goal has raw key: ${debtGoal}`);

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
  assert(isPlayerVisibleSampleLineText(identity), `merchant age-40 debt identity has raw key: ${identity}`);
  const summary = deriveLifeMemorySummary(age40Debt);
  assert(
    summary.unresolvedDebts?.some((debt) => debt.label.includes('人情债')),
    'merchant age-40 life-memory missing favor debt',
  );
}

function testMagnateExpression(): void {
  const onRamp = makeState(30, {
    route_merchant: true,
    merchant_childhood_seed_done: true,
    magnate_on_ramp_done: true,
  });
  const onRampGoal = deriveSampleLineCurrentGoal(onRamp) ?? '';
  assert(onRampGoal.includes('巨贾') || onRampGoal.includes('产业'), `magnate on-ramp goal: ${onRampGoal}`);
  assert(isPlayerVisibleSampleLineText(onRampGoal), `magnate on-ramp goal has raw key: ${onRampGoal}`);

  const pressure = makeState(38, {
    route_merchant: true,
    merchant_childhood_seed_done: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
  });
  const pressureGoal = deriveSampleLineCurrentGoal(pressure) ?? '';
  assert(pressureGoal.includes('人情') || pressureGoal.includes('巨贾'), `magnate pressure goal: ${pressureGoal}`);
  assert(isPlayerVisibleSampleLineText(pressureGoal), `magnate pressure goal has raw key: ${pressureGoal}`);

  const payoff = makeState(44, {
    route_merchant: true,
    merchant_childhood_seed_done: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const payoffGoal = deriveSampleLineCurrentGoal(payoff) ?? '';
  assert(payoffGoal.includes('巨贾') || payoffGoal.includes('守住'), `magnate payoff goal: ${payoffGoal}`);
  assert(isPlayerVisibleSampleLineText(payoffGoal), `magnate payoff goal has raw key: ${payoffGoal}`);

  const age40 = makeState(40, {
    route_merchant: true,
    merchant_childhood_seed_done: true,
    merchant_age40_identity_done: true,
    magnate_on_ramp_done: true,
  });
  const identity = deriveSampleLineAge40Identity(age40) ?? '';
  assert(identity.includes('巨贾'), `magnate age-40 identity: ${identity}`);
  assert(isPlayerVisibleSampleLineText(identity), `magnate age-40 identity has raw key: ${identity}`);

  const costState = makeState(35, {
    route_merchant: true,
    merchant_childhood_seed_done: true,
    magnate_on_ramp_done: true,
  });
  const costLabel = deriveSampleLineCostLabel(costState);
  assert(costLabel === '巨贾负担', `magnate cost label: ${costLabel}`);
}

// P63: Bridge-entry differentiation tests
function testP63ApprenticeBridgeEntryDifferentiation(): void {
  // Apprentice bridge entry at magnate_on_ramp
  const apprenticeOnRamp = makeState(30, {
    apprentice_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
  });
  const apprenticeGoal = deriveSampleLineCurrentGoal(apprenticeOnRamp) ?? '';
  assert(apprenticeGoal.includes('手艺') || apprenticeGoal.includes('合伙'), `apprentice on-ramp goal: ${apprenticeGoal}`);
  assert(isPlayerVisibleSampleLineText(apprenticeGoal), `apprentice on-ramp goal has raw key: ${apprenticeGoal}`);

  const apprenticeCost = deriveSampleLineCostLabel(apprenticeOnRamp);
  assert(apprenticeCost.includes('手艺') || apprenticeCost.includes('合伙'), `apprentice cost label: ${apprenticeCost}`);

  const apprenticeAge40 = makeState(40, {
    apprentice_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  });
  const apprenticeIdentity = deriveSampleLineAge40Identity(apprenticeAge40) ?? '';
  assert(apprenticeIdentity.includes('学徒') || apprenticeIdentity.includes('手艺'), `apprentice age40 identity: ${apprenticeIdentity}`);
  assert(isPlayerVisibleSampleLineText(apprenticeIdentity), `apprentice age40 identity has raw key: ${apprenticeIdentity}`);
}

function testP63TavernBridgeEntryDifferentiation(): void {
  // Tavern bridge entry at magnate_on_ramp
  const tavernOnRamp = makeState(30, {
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
  });
  const tavernGoal = deriveSampleLineCurrentGoal(tavernOnRamp) ?? '';
  assert(tavernGoal.includes('人脉') || tavernGoal.includes('铺子'), `tavern on-ramp goal: ${tavernGoal}`);
  assert(isPlayerVisibleSampleLineText(tavernGoal), `tavern on-ramp goal has raw key: ${tavernGoal}`);

  const tavernCost = deriveSampleLineCostLabel(tavernOnRamp);
  assert(tavernCost.includes('人脉') || tavernCost.includes('铺子'), `tavern cost label: ${tavernCost}`);

  const tavernAge40 = makeState(40, {
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  });
  const tavernIdentity = deriveSampleLineAge40Identity(tavernAge40) ?? '';
  assert(tavernIdentity.includes('酒肆') || tavernIdentity.includes('人脉'), `tavern age40 identity: ${tavernIdentity}`);
  assert(isPlayerVisibleSampleLineText(tavernIdentity), `tavern age40 identity has raw key: ${tavernIdentity}`);
}

function testP63PeasantBridgeEntryDifferentiation(): void {
  // Peasant bridge entry at magnate_on_ramp
  const peasantOnRamp = makeState(30, {
    peasant_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
  });
  const peasantGoal = deriveSampleLineCurrentGoal(peasantOnRamp) ?? '';
  assert(peasantGoal.includes('粮路') || peasantGoal.includes('买卖'), `peasant on-ramp goal: ${peasantGoal}`);
  assert(isPlayerVisibleSampleLineText(peasantGoal), `peasant on-ramp goal has raw key: ${peasantGoal}`);

  const peasantCost = deriveSampleLineCostLabel(peasantOnRamp);
  assert(peasantCost.includes('粮路') || peasantCost.includes('买卖'), `peasant cost label: ${peasantCost}`);

  const peasantAge40 = makeState(40, {
    peasant_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  });
  const peasantIdentity = deriveSampleLineAge40Identity(peasantAge40) ?? '';
  assert(peasantIdentity.includes('农家') || peasantIdentity.includes('粮路'), `peasant age40 identity: ${peasantIdentity}`);
  assert(isPlayerVisibleSampleLineText(peasantIdentity), `peasant age40 identity has raw key: ${peasantIdentity}`);
}

function testP63BridgeEntryDistinction(): void {
  // Verify the three bridge entries produce distinct signals
  const apprentice = makeState(30, { apprentice_merchant_bridge_crossed: true, magnate_on_ramp_done: true });
  const tavern = makeState(30, { tavern_merchant_bridge_crossed: true, magnate_on_ramp_done: true });
  const peasant = makeState(30, { peasant_merchant_bridge_crossed: true, magnate_on_ramp_done: true });

  const apprenticeGoal = deriveSampleLineCurrentGoal(apprentice) ?? '';
  const tavernGoal = deriveSampleLineCurrentGoal(tavern) ?? '';
  const peasantGoal = deriveSampleLineCurrentGoal(peasant) ?? '';

  // Each should have its own distinctive keyword
  assert(apprenticeGoal !== tavernGoal && apprenticeGoal !== peasantGoal, 'bridge goals should differ');
  assert(tavernGoal !== peasantGoal, 'tavern vs peasant goals should differ');

  // Cost labels should also differ
  const apprenticeCost = deriveSampleLineCostLabel(apprentice);
  const tavernCost = deriveSampleLineCostLabel(tavern);
  const peasantCost = deriveSampleLineCostLabel(peasant);
  assert(new Set([apprenticeCost, tavernCost, peasantCost]).size === 3, 'bridge cost labels should be distinct');
}

// P64: Test differentiated magnate pressure/payoff expression per bridge origin
function testMagnatePressurePayoffDifferentiation(): void {
  // Apprentice bridge - pressure stage
  const apprenticePressure = makeState(38, {
    apprentice_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
  });
  const apprenticePressureGoal = deriveSampleLineCurrentGoal(apprenticePressure) ?? '';
  assert(
    apprenticePressureGoal.includes('合伙') || apprenticePressureGoal.includes('供货') || apprenticePressureGoal.includes('销路'),
    `apprentice pressure goal: ${apprenticePressureGoal}`,
  );

  // Tavern bridge - pressure stage
  const tavernPressure = makeState(38, {
    tavern_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
  });
  const tavernPressureGoal = deriveSampleLineCurrentGoal(tavernPressure) ?? '';
  assert(
    tavernPressureGoal.includes('人情') || tavernPressureGoal.includes('老主顾') || tavernPressureGoal.includes('面'),
    `tavern pressure goal: ${tavernPressureGoal}`,
  );

  // Peasant bridge - pressure stage
  const peasantPressure = makeState(38, {
    peasant_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
  });
  const peasantPressureGoal = deriveSampleLineCurrentGoal(peasantPressure) ?? '';
  assert(
    peasantPressureGoal.includes('车马') || peasantPressureGoal.includes('仓库') || peasantPressureGoal.includes('运力'),
    `peasant pressure goal: ${peasantPressureGoal}`,
  );

  // Apprentice bridge - payoff stage
  const apprenticePayoff = makeState(44, {
    apprentice_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const apprenticePayoffGoal = deriveSampleLineCurrentGoal(apprenticePayoff) ?? '';
  assert(
    apprenticePayoffGoal.includes('商路') || apprenticePayoffGoal.includes('供货') || apprenticePayoffGoal.includes('销路'),
    `apprentice payoff goal: ${apprenticePayoffGoal}`,
  );

  // Tavern bridge - payoff stage
  const tavernPayoff = makeState(44, {
    tavern_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const tavernPayoffGoal = deriveSampleLineCurrentGoal(tavernPayoff) ?? '';
  assert(
    tavernPayoffGoal.includes('人脉') || tavernPayoffGoal.includes('老主顾') || tavernPayoffGoal.includes('八方'),
    `tavern payoff goal: ${tavernPayoffGoal}`,
  );

  // Peasant bridge - payoff stage
  const peasantPayoff = makeState(44, {
    peasant_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const peasantPayoffGoal = deriveSampleLineCurrentGoal(peasantPayoff) ?? '';
  assert(
    peasantPayoffGoal.includes('车马') || peasantPayoffGoal.includes('仓储') || peasantPayoffGoal.includes('根基'),
    `peasant payoff goal: ${peasantPayoffGoal}`,
  );

  // Verify three bridges produce different text at pressure stage
  assert(apprenticePressureGoal !== tavernPressureGoal, 'apprentice and tavern pressure goals should differ');
  assert(tavernPressureGoal !== peasantPressureGoal, 'tavern and peasant pressure goals should differ');
  assert(apprenticePressureGoal !== peasantPressureGoal, 'apprentice and peasant pressure goals should differ');

  // Verify three bridges produce different text at payoff stage
  assert(apprenticePayoffGoal !== tavernPayoffGoal, 'apprentice and tavern payoff goals should differ');
  assert(tavernPayoffGoal !== peasantPayoffGoal, 'tavern and peasant payoff goals should differ');
  assert(apprenticePayoffGoal !== peasantPayoffGoal, 'apprentice and peasant payoff goals should differ');

  // Verify all goals are player-visible (no raw keys)
  for (const goal of [apprenticePressureGoal, tavernPressureGoal, peasantPressureGoal,
                       apprenticePayoffGoal, tavernPayoffGoal, peasantPayoffGoal]) {
    assert(isPlayerVisibleSampleLineText(goal), `raw key in differentiated goal: ${goal}`);
  }
}

// P66: Success-cost differentiation tests
function testP66CostLabelPersistsThroughJourney(): void {
  const apprenticeOnRamp = makeState(30, {
    apprentice_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
  });
  const apprenticePressure = makeState(38, {
    apprentice_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
  });
  const apprenticePayoff = makeState(44, {
    apprentice_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });

  const onRampCost = deriveSampleLineCostLabel(apprenticeOnRamp);
  const pressureCost = deriveSampleLineCostLabel(apprenticePressure);
  const payoffCost = deriveSampleLineCostLabel(apprenticePayoff);

  assert(onRampCost.includes('手艺') || onRampCost.includes('合伙'), `apprentice on-ramp cost: ${onRampCost}`);
  assert(pressureCost.includes('合伙') || pressureCost.includes('账目'), `apprentice pressure cost: ${pressureCost}`);
  assert(payoffCost.includes('合伙') || payoffCost.includes('账目'), `apprentice payoff cost: ${payoffCost}`);

  const tavernOnRamp = makeState(30, {
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
  });
  const tavernPressure = makeState(38, {
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
  });
  const tavernPayoff = makeState(44, {
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });

  const tavernOnRampCost = deriveSampleLineCostLabel(tavernOnRamp);
  const tavernPressureCost = deriveSampleLineCostLabel(tavernPressure);
  const tavernPayoffCost = deriveSampleLineCostLabel(tavernPayoff);

  assert(tavernOnRampCost.includes('人脉') || tavernOnRampCost.includes('铺子'), `tavern on-ramp cost: ${tavernOnRampCost}`);
  assert(tavernPressureCost.includes('人情') || tavernPressureCost.includes('面子'), `tavern pressure cost: ${tavernPressureCost}`);
  assert(tavernPayoffCost.includes('人情') || tavernPayoffCost.includes('面子'), `tavern payoff cost: ${tavernPayoffCost}`);

  const peasantOnRamp = makeState(30, {
    peasant_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
  });
  const peasantPressure = makeState(38, {
    peasant_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
  });
  const peasantPayoff = makeState(44, {
    peasant_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });

  const peasantOnRampCost = deriveSampleLineCostLabel(peasantOnRamp);
  const peasantPressureCost = deriveSampleLineCostLabel(peasantPressure);
  const peasantPayoffCost = deriveSampleLineCostLabel(peasantPayoff);

  assert(peasantOnRampCost.includes('粮路') || peasantOnRampCost.includes('买卖'), `peasant on-ramp cost: ${peasantOnRampCost}`);
  assert(peasantPressureCost.includes('粮路') || peasantPressureCost.includes('奔波'), `peasant pressure cost: ${peasantPressureCost}`);
  assert(peasantPayoffCost.includes('粮路') || peasantPayoffCost.includes('奔波'), `peasant payoff cost: ${peasantPayoffCost}`);

  const pressureSet = new Set([pressureCost, tavernPressureCost, peasantPressureCost]);
  assert(pressureSet.size === 3, 'pressure cost labels should be distinct across routes');

  const payoffSet = new Set([payoffCost, tavernPayoffCost, peasantPayoffCost]);
  assert(payoffSet.size === 3, 'payoff cost labels should be distinct across routes');
}

function testP66PayoffHasCostReflection(): void {
  const apprenticePayoff = makeState(44, {
    apprentice_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const apprenticeGoal = deriveSampleLineCurrentGoal(apprenticePayoff) ?? '';
  assert(
    apprenticeGoal.includes('合伙人的脸色') || apprenticeGoal.includes('账目') || apprenticeGoal.includes('分成'),
    `apprentice payoff should have cost reflection: ${apprenticeGoal}`,
  );

  const tavernPayoff = makeState(44, {
    tavern_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const tavernGoal = deriveSampleLineCurrentGoal(tavernPayoff) ?? '';
  assert(
    tavernGoal.includes('欠的人情') || tavernGoal.includes('掂量') || tavernGoal.includes('面子'),
    `tavern payoff should have cost reflection: ${tavernGoal}`,
  );

  const peasantPayoff = makeState(44, {
    peasant_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const peasantGoal = deriveSampleLineCurrentGoal(peasantPayoff) ?? '';
  assert(
    peasantGoal.includes('赌过') || peasantGoal.includes('回不到田里') || peasantGoal.includes('田埂'),
    `peasant payoff should have cost reflection: ${peasantGoal}`,
  );

  for (const goal of [apprenticeGoal, tavernGoal, peasantGoal]) {
    assert(isPlayerVisibleSampleLineText(goal), `raw key in P66 payoff goal: ${goal}`);
  }
}

function testP66Age40IdentityHasCostWeight(): void {
  const apprenticeAge40 = makeState(40, {
    apprentice_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  });
  const apprenticeIdentity = deriveSampleLineAge40Identity(apprenticeAge40) ?? '';
  assert(
    apprenticeIdentity.includes('代价') || apprenticeIdentity.includes('再也回不到') || apprenticeIdentity.includes('刨花'),
    `apprentice age40 identity should have cost weight: ${apprenticeIdentity}`,
  );

  const tavernAge40 = makeState(40, {
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  });
  const tavernIdentity = deriveSampleLineAge40Identity(tavernAge40) ?? '';
  assert(
    tavernIdentity.includes('代价') || tavernIdentity.includes('人人都有求于你') || tavernIdentity.includes('认得你'),
    `tavern age40 identity should have cost weight: ${tavernIdentity}`,
  );

  const peasantAge40 = makeState(40, {
    peasant_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  });
  const peasantIdentity = deriveSampleLineAge40Identity(peasantAge40) ?? '';
  assert(
    peasantIdentity.includes('代价') || peasantIdentity.includes('回不到') || peasantIdentity.includes('田埂'),
    `peasant age40 identity should have cost weight: ${peasantIdentity}`,
  );

  for (const identity of [apprenticeIdentity, tavernIdentity, peasantIdentity]) {
    assert(isPlayerVisibleSampleLineText(identity), `raw key in P66 age40 identity: ${identity}`);
  }
}

function testP66CostDistinctionComparison(): void {
  const apprenticePayoff = makeState(44, {
    apprentice_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const tavernPayoff = makeState(44, {
    tavern_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const peasantPayoff = makeState(44, {
    peasant_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });

  const apprenticeGoal = deriveSampleLineCurrentGoal(apprenticePayoff) ?? '';
  const tavernGoal = deriveSampleLineCurrentGoal(tavernPayoff) ?? '';
  const peasantGoal = deriveSampleLineCurrentGoal(peasantPayoff) ?? '';

  const apprenticeCost = deriveSampleLineCostLabel(apprenticePayoff);
  const tavernCost = deriveSampleLineCostLabel(tavernPayoff);
  const peasantCost = deriveSampleLineCostLabel(peasantPayoff);

  const apprenticeIdentity = deriveSampleLineAge40Identity(makeState(40, {
    apprentice_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  })) ?? '';
  const tavernIdentity = deriveSampleLineAge40Identity(makeState(40, {
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  })) ?? '';
  const peasantIdentity = deriveSampleLineAge40Identity(makeState(40, {
    peasant_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  })) ?? '';

  assert(apprenticeGoal !== tavernGoal && apprenticeGoal !== peasantGoal, 'P66 payoff goals should differ across routes');
  assert(tavernGoal !== peasantGoal, 'P66 tavern vs peasant payoff goals should differ');

  assert(new Set([apprenticeCost, tavernCost, peasantCost]).size === 3, 'P66 payoff cost labels should be 3 distinct values');

  assert(apprenticeIdentity !== tavernIdentity && apprenticeIdentity !== peasantIdentity, 'P66 age40 identities should differ across routes');
  assert(tavernIdentity !== peasantIdentity, 'P66 tavern vs peasant age40 identities should differ');

  assert(apprenticeGoal.includes('合伙') || apprenticeGoal.includes('账目'), 'apprentice cost should be about partnership/books');
  assert(tavernGoal.includes('人情') || tavernGoal.includes('面子'), 'tavern cost should be about favors/face');
  assert(peasantGoal.includes('赌') || peasantGoal.includes('田') || peasantGoal.includes('路'), 'peasant cost should be about bet/road');
}

// P67: Success-shape and recap differentiation tests
function testP67PayoffSuccessShapeDifferentiation(): void {
  const apprenticePayoff = makeState(44, {
    apprentice_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const apprenticeGoal = deriveSampleLineCurrentGoal(apprenticePayoff) ?? '';
  assert(
    apprenticeGoal.includes('从刨子到账本') || apprenticeGoal.includes('手艺的眼光') || apprenticeGoal.includes('品质立住'),
    `apprentice payoff should have craft-judgment success shape: ${apprenticeGoal}`,
  );

  const tavernPayoff = makeState(44, {
    tavern_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const tavernGoal = deriveSampleLineCurrentGoal(tavernPayoff) ?? '';
  assert(
    tavernGoal.includes('从酒肆到商号') || tavernGoal.includes('人情的网络') || tavernGoal.includes('老主顾串起'),
    `tavern payoff should have network-information success shape: ${tavernGoal}`,
  );

  const peasantPayoff = makeState(44, {
    peasant_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const peasantGoal = deriveSampleLineCurrentGoal(peasantPayoff) ?? '';
  assert(
    peasantGoal.includes('从田埂到车马') || peasantGoal.includes('脚力和血汗') || peasantGoal.includes('车马仓储踩出'),
    `peasant payoff should have endurance-logistics success shape: ${peasantGoal}`,
  );

  for (const goal of [apprenticeGoal, tavernGoal, peasantGoal]) {
    assert(isPlayerVisibleSampleLineText(goal), `raw key in P67 payoff goal: ${goal}`);
  }
}

function testP67DestinySentenceExistsAndDistinct(): void {
  const apprenticePayoff = makeState(44, {
    apprentice_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const apprenticeDestiny = deriveSampleLineDestinySentence(apprenticePayoff);
  assert(Boolean(apprenticeDestiny), 'apprentice should have a destiny sentence at payoff');
  assert(apprenticeDestiny!.includes('刨子') || apprenticeDestiny!.includes('手艺'), `apprentice destiny should reference craft origin: ${apprenticeDestiny}`);

  const tavernPayoff = makeState(44, {
    tavern_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const tavernDestiny = deriveSampleLineDestinySentence(tavernPayoff);
  assert(Boolean(tavernDestiny), 'tavern should have a destiny sentence at payoff');
  assert(tavernDestiny!.includes('酒肆') || tavernDestiny!.includes('人情'), `tavern destiny should reference network origin: ${tavernDestiny}`);

  const peasantPayoff = makeState(44, {
    peasant_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const peasantDestiny = deriveSampleLineDestinySentence(peasantPayoff);
  assert(Boolean(peasantDestiny), 'peasant should have a destiny sentence at payoff');
  assert(peasantDestiny!.includes('田埂') || peasantDestiny!.includes('脚力'), `peasant destiny should reference labor origin: ${peasantDestiny}`);

  assert(
    apprenticeDestiny !== tavernDestiny && apprenticeDestiny !== peasantDestiny,
    'destiny sentences should differ across routes',
  );
  assert(tavernDestiny !== peasantDestiny, 'tavern and peasant destiny sentences should differ');

  for (const sentence of [apprenticeDestiny!, tavernDestiny!, peasantDestiny!]) {
    assert(isPlayerVisibleSampleLineText(sentence), `raw key in destiny sentence: ${sentence}`);
  }
}

function testP67Age40IdentityHasSuccessShape(): void {
  const apprenticeAge40 = makeState(40, {
    apprentice_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  });
  const apprenticeIdentity = deriveSampleLineAge40Identity(apprenticeAge40) ?? '';
  assert(
    apprenticeIdentity.includes('靠手艺眼光') || apprenticeIdentity.includes('品质立住') || apprenticeIdentity.includes('从刨子到账本'),
    `apprentice age40 identity should emphasize success shape: ${apprenticeIdentity}`,
  );

  const tavernAge40 = makeState(40, {
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  });
  const tavernIdentity = deriveSampleLineAge40Identity(tavernAge40) ?? '';
  assert(
    tavernIdentity.includes('靠人情网络') || tavernIdentity.includes('人脉织出') || tavernIdentity.includes('从酒肆到商号'),
    `tavern age40 identity should emphasize success shape: ${tavernIdentity}`,
  );

  const peasantAge40 = makeState(40, {
    peasant_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  });
  const peasantIdentity = deriveSampleLineAge40Identity(peasantAge40) ?? '';
  assert(
    peasantIdentity.includes('靠脚力血汗') || peasantIdentity.includes('粮路踩出') || peasantIdentity.includes('从田埂到车马'),
    `peasant age40 identity should emphasize success shape: ${peasantIdentity}`,
  );

  for (const identity of [apprenticeIdentity, tavernIdentity, peasantIdentity]) {
    assert(isPlayerVisibleSampleLineText(identity), `raw key in P67 age40 identity: ${identity}`);
  }
}

function testP67SuccessShapeComparisonDistinction(): void {
  const apprenticePayoff = makeState(44, {
    apprentice_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const tavernPayoff = makeState(44, {
    tavern_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });
  const peasantPayoff = makeState(44, {
    peasant_merchant_bridge_crossed: true,
    route_merchant: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  });

  const apprenticeGoal = deriveSampleLineCurrentGoal(apprenticePayoff) ?? '';
  const tavernGoal = deriveSampleLineCurrentGoal(tavernPayoff) ?? '';
  const peasantGoal = deriveSampleLineCurrentGoal(peasantPayoff) ?? '';

  const apprenticeDestiny = deriveSampleLineDestinySentence(apprenticePayoff) ?? '';
  const tavernDestiny = deriveSampleLineDestinySentence(tavernPayoff) ?? '';
  const peasantDestiny = deriveSampleLineDestinySentence(peasantPayoff) ?? '';

  const apprenticeIdentity = deriveSampleLineAge40Identity(makeState(40, {
    apprentice_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  })) ?? '';
  const tavernIdentity = deriveSampleLineAge40Identity(makeState(40, {
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  })) ?? '';
  const peasantIdentity = deriveSampleLineAge40Identity(makeState(40, {
    peasant_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    merchant_age40_identity_done: true,
  })) ?? '';

  assert(new Set([apprenticeGoal, tavernGoal, peasantGoal]).size === 3, 'P67 payoff goals should be 3 distinct values');
  assert(new Set([apprenticeDestiny, tavernDestiny, peasantDestiny]).size === 3, 'P67 destiny sentences should be 3 distinct values');
  assert(new Set([apprenticeIdentity, tavernIdentity, peasantIdentity]).size === 3, 'P67 age40 identities should be 3 distinct values');

  assert(apprenticeGoal.includes('刨子') || apprenticeGoal.includes('手艺'), 'apprentice success should reference craft shape');
  assert(tavernGoal.includes('酒肆') || tavernGoal.includes('人情'), 'tavern success should reference network shape');
  assert(peasantGoal.includes('田埂') || peasantGoal.includes('脚力'), 'peasant success should reference labor shape');
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
  testMagnateExpression();
  // P63: Bridge-entry differentiation tests
  testP63ApprenticeBridgeEntryDifferentiation();
  testP63TavernBridgeEntryDifferentiation();
  testP63PeasantBridgeEntryDifferentiation();
  testP63BridgeEntryDistinction();
  // P64: Pressure/payoff differentiation tests
  testMagnatePressurePayoffDifferentiation();
  // P66: Success-cost differentiation tests
  testP66CostLabelPersistsThroughJourney();
  testP66PayoffHasCostReflection();
  testP66Age40IdentityHasCostWeight();
  testP66CostDistinctionComparison();
  // P67: Success-shape and recap differentiation tests
  testP67PayoffSuccessShapeDifferentiation();
  testP67DestinySentenceExistsAndDistinct();
  testP67Age40IdentityHasSuccessShape();
  testP67SuccessShapeComparisonDistinction();
  console.log('p50SampleLineExpressionTests: all passed');
}

main();
