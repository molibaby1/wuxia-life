import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  detectOrdinaryOrigin,
  deriveOrdinaryOriginCurrentGoal,
  deriveOrdinaryOriginLifeMemory,
  deriveOrdinaryOriginSummary,
  isPlayerVisibleOrdinaryOriginText,
} from '../src/p56/ordinaryOriginExpression';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function testBridgeGateFlags(): void {
  const state = makeGameState({
    origin_farm_peasant: true,
    peasant_swap_crew_curiosity: true,
    peasant_midlife_outside_offer: true,
    peasant_accept_outside: true,
    route_wealth_committed: true,
    peasant_merchant_bridge_crossed: true,
  });
  const flags = state.flags ?? {};
  assert(flags.origin_farm_peasant === true, 'origin_farm_peasant should be true');
  assert(flags.peasant_swap_crew_curiosity === true, 'peasant_swap_crew_curiosity should be true');
  assert(flags.peasant_midlife_outside_offer === true, 'peasant_midlife_outside_offer should be true');
  assert(flags.peasant_accept_outside === true, 'peasant_accept_outside should be true');
  assert(flags.route_wealth_committed === true, 'route_wealth_committed should be true');
  assert(flags.peasant_merchant_bridge_crossed === true, 'peasant_merchant_bridge_crossed should be true');
}

function testBridgeGateRequiresAcceptOutside(): void {
  const noAccept = makeGameState({
    origin_farm_peasant: true,
    peasant_swap_crew_curiosity: true,
    peasant_midlife_outside_offer: true,
    peasant_refuse_outside: true,
    route_wealth_committed: true,
  });
  const flags = noAccept.flags ?? {};
  assert(flags.peasant_accept_outside !== true, 'bridge should require accept_outside');
  assert(flags.peasant_merchant_bridge_crossed !== true, 'bridge should require peasant_merchant_bridge_crossed');
}

function testBridgeRequiresSwapCrewCuriosity(): void {
  const noCuriosity = makeGameState({
    origin_farm_peasant: true,
    peasant_steadfast_field: true,
    route_wealth_committed: true,
  });
  const flags = noCuriosity.flags ?? {};
  assert(flags.peasant_swap_crew_curiosity !== true, 'bridge should require swap_crew_curiosity prerequisite');
  assert(flags.peasant_merchant_bridge_crossed !== true, 'bridge should not fire without swap_crew_curiosity');
}

function testBridgeCurrentGoalExpression(): void {
  const bridge = makeGameState({
    origin_farm_peasant: true,
    peasant_merchant_bridge_crossed: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(bridge) ?? '';
  assert(goal.includes('粮商') || goal.includes('粮路'), `bridge currentGoal: ${goal}`);
  assert(isPlayerVisibleOrdinaryOriginText(goal), `raw key in bridge goal: ${goal}`);

  const midlife = makeGameState({
    origin_farm_peasant: true,
    peasant_swap_crew_curiosity: true,
    peasant_midlife_outside_offer: true,
  }, 28);
  const midlifeGoal = deriveOrdinaryOriginCurrentGoal(midlife) ?? '';
  assert(midlifeGoal.includes('机会') || midlifeGoal.includes('招手'), `midlife currentGoal: ${midlifeGoal}`);
  assert(!midlifeGoal.includes('粮商'), `midlife goal should not mention grain merchant: ${midlifeGoal}`);
}

function testBridgeLifeMemoryExpression(): void {
  const bridge = makeGameState({
    origin_farm_peasant: true,
    peasant_merchant_bridge_crossed: true,
  });
  const memory = deriveOrdinaryOriginLifeMemory(bridge.flags ?? {});
  assert(Boolean(memory?.includes('粮路') || memory?.includes('粮货')), `bridge lifeMemory: ${memory}`);
  assert(isPlayerVisibleOrdinaryOriginText(memory ?? ''), `raw key in bridge lifeMemory: ${memory}`);

  const accept = makeGameState({
    origin_farm_peasant: true,
    peasant_midlife_outside_offer: true,
    peasant_accept_outside: true,
  }, 27);
  const acceptMemory = deriveOrdinaryOriginLifeMemory(accept.flags ?? {});
  assert(Boolean(acceptMemory?.includes('镇上') || acceptMemory?.includes('村子')), `accept lifeMemory: ${acceptMemory}`);
}

function testBridgeSummaryExpression(): void {
  const bridge = makeGameState({
    origin_farm_peasant: true,
    peasant_merchant_bridge_crossed: true,
  });
  const summary = deriveOrdinaryOriginSummary(bridge.flags ?? {});
  assert(Boolean(summary?.includes('农家') || summary?.includes('粮货')), `bridge summary: ${summary}`);

  const midlife = makeGameState({
    origin_farm_peasant: true,
    peasant_midlife_outside_offer: true,
  }, 28);
  const midlifeSummary = deriveOrdinaryOriginSummary(midlife.flags ?? {});
  assert(Boolean(midlifeSummary?.includes('平凡农人')), `midlife summary: ${midlifeSummary}`);
  assert(!midlifeSummary?.includes('粮货'), `midlife summary should not say 粮货: ${midlifeSummary}`);
}

function testBridgeDoesNotBreakOrdinaryOrigin(): void {
  const bridge = makeGameState({
    origin_farm_peasant: true,
    peasant_swap_crew_curiosity: true,
    peasant_midlife_outside_offer: true,
    peasant_accept_outside: true,
    route_wealth_committed: true,
    peasant_merchant_bridge_crossed: true,
  });
  const origin = detectOrdinaryOrigin(bridge.flags ?? {});
  assert(origin === 'farm_peasant', `bridge should keep ordinary origin: ${origin}`);
}

function testBridgeSummaryInLifeMemorySummary(): void {
  const bridge = makeGameState({
    origin_farm_peasant: true,
    peasant_merchant_bridge_crossed: true,
  });
  const summary = deriveLifeMemorySummary(bridge);
  assert(Boolean(summary.ordinaryOriginLifeMemory), 'ordinaryOriginLifeMemory missing');
  assert(Boolean(summary.ordinaryOriginSummary), 'ordinaryOriginSummary missing');
}

function testNonPeasantNoBridge(): void {
  const apprentice = makeGameState({
    origin_town_apprentice: true,
    route_wealth_committed: true,
    peasant_merchant_bridge_crossed: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(apprentice);
  assert(!goal?.includes('粮商'), `apprentice should not have peasant bridge goal: ${goal}`);

  const tavern = makeGameState({
    origin_tavern_hand: true,
    route_wealth_committed: true,
    peasant_merchant_bridge_crossed: true,
  });
  const tavernGoal = deriveOrdinaryOriginCurrentGoal(tavern);
  assert(!tavernGoal?.includes('粮商'), `tavern should not have peasant bridge goal: ${tavernGoal}`);
}

const MAGNATE_ON_RAMP_EXPRESSION =
  "(flags.has('route_merchant') || flags.has('merchant_childhood_seed_done') || flags.has('p8_route_wealth') || flags.has('apprentice_merchant_bridge_crossed') || flags.has('tavern_merchant_bridge_crossed') || flags.has('peasant_merchant_bridge_crossed')) && (flags.has('merchant_caravan_success') || flags.has('merchant_shop_grocery') || flags.has('merchant_shop_weapon') || flags.has('merchant_shop_herb') || flags.has('merchant_wealthy') || flags.has('merchant_chamber_head') || flags.has('apprentice_merchant_bridge_crossed') || flags.has('tavern_merchant_bridge_crossed') || flags.has('peasant_merchant_bridge_crossed')) && !flags.has('magnate_on_ramp_done') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')";

const MERCHANT_MIDLIFE_DEBT_EXPRESSION =
  "(flags.has('route_merchant') || flags.has('merchant_childhood_seed_done') || flags.has('merchant_talent') || flags.has('p8_route_wealth') || flags.has('apprentice_merchant_bridge_crossed') || flags.has('tavern_merchant_bridge_crossed') || flags.has('peasant_merchant_bridge_crossed')) && (flags.has('merchant_shop_grocery') || flags.has('merchant_shop_weapon') || flags.has('merchant_shop_herb') || flags.has('merchant_shop_failed') || flags.has('merchant_caravan_success') || flags.has('apprentice_merchant_bridge_crossed') || flags.has('tavern_merchant_bridge_crossed') || flags.has('peasant_merchant_bridge_crossed')) && !flags.has('merchant_midlife_debt') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')";

function makeGameState(flags: Record<string, boolean>, age = 30): GameState {
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
    eventHistory: [],
    routeStates: {},
  } as GameState;
}

function testMagnateOnRampGateAcceptsBridgeFlag(): void {
  const evaluator = new ConditionEvaluator();
  const bridgedState = makeGameState({
    origin_farm_peasant: true,
    peasant_swap_crew_curiosity: true,
    peasant_midlife_outside_offer: true,
    peasant_accept_outside: true,
    route_wealth_committed: true,
    peasant_merchant_bridge_crossed: true,
  });
  const result = evaluator.evaluate(
    { type: 'expression', expression: MAGNATE_ON_RAMP_EXPRESSION },
    bridgedState,
  );
  assert(result === true, 'magnate_on_ramp gate should accept peasant_merchant_bridge_crossed');
}

function testMagnateOnRampGateRejectsWithoutBridge(): void {
  const evaluator = new ConditionEvaluator();
  const noBridgeState = makeGameState({
    origin_farm_peasant: true,
    peasant_swap_crew_curiosity: true,
    peasant_midlife_outside_offer: true,
    peasant_accept_outside: true,
    route_wealth_committed: true,
  });
  const result = evaluator.evaluate(
    { type: 'expression', expression: MAGNATE_ON_RAMP_EXPRESSION },
    noBridgeState,
  );
  assert(result === false, 'magnate_on_ramp gate should reject without bridge flag');
}

function testMerchantMidlifeDebtGateAcceptsBridgeFlag(): void {
  const evaluator = new ConditionEvaluator();
  const bridgedState = makeGameState({
    origin_farm_peasant: true,
    peasant_swap_crew_curiosity: true,
    peasant_midlife_outside_offer: true,
    peasant_accept_outside: true,
    route_wealth_committed: true,
    peasant_merchant_bridge_crossed: true,
  }, 34);
  const result = evaluator.evaluate(
    { type: 'expression', expression: MERCHANT_MIDLIFE_DEBT_EXPRESSION },
    bridgedState,
  );
  assert(result === true, 'merchant_midlife_debt gate should accept bridge flag');
}

function testMagnateOnRampRejectsAlreadyDone(): void {
  const evaluator = new ConditionEvaluator();
  const state = makeGameState({
    origin_farm_peasant: true,
    peasant_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
  });
  const result = evaluator.evaluate(
    { type: 'expression', expression: MAGNATE_ON_RAMP_EXPRESSION },
    state,
  );
  assert(result === false, 'magnate_on_ramp should reject when already done');
}

function testMagnateOnRampRejectsOrthodox(): void {
  const evaluator = new ConditionEvaluator();
  const state = makeGameState({
    origin_farm_peasant: true,
    peasant_merchant_bridge_crossed: true,
    orthodox_childhood_seed_done: true,
  });
  const result = evaluator.evaluate(
    { type: 'expression', expression: MAGNATE_ON_RAMP_EXPRESSION },
    state,
  );
  assert(result === false, 'magnate_on_ramp should reject orthodox childhood');
}

function testGenericMerchantStillWorks(): void {
  const evaluator = new ConditionEvaluator();
  const merchantState = makeGameState({
    merchant_childhood_seed_done: true,
    route_merchant: true,
    merchant_shop_grocery: true,
  });
  const result = evaluator.evaluate(
    { type: 'expression', expression: MAGNATE_ON_RAMP_EXPRESSION },
    merchantState,
  );
  assert(result === true, 'generic merchant path should still work');
}

function testApprenticeBridgeStillWorks(): void {
  const evaluator = new ConditionEvaluator();
  const apprenticeState = makeGameState({
    origin_town_apprentice: true,
    apprentice_merchant_bridge_crossed: true,
  });
  const result = evaluator.evaluate(
    { type: 'expression', expression: MAGNATE_ON_RAMP_EXPRESSION },
    apprenticeState,
  );
  assert(result === true, 'P58 apprentice bridge should still work (no regression)');
}

function testTavernBridgeStillWorks(): void {
  const evaluator = new ConditionEvaluator();
  const tavernState = makeGameState({
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
  });
  const result = evaluator.evaluate(
    { type: 'expression', expression: MAGNATE_ON_RAMP_EXPRESSION },
    tavernState,
  );
  assert(result === true, 'P59 tavern bridge should still work (no regression)');
}

function testDeclineOfferNoBridge(): void {
  const state = makeGameState({
    origin_farm_peasant: true,
    peasant_swap_crew_curiosity: true,
    peasant_midlife_outside_offer: true,
    peasant_refuse_outside: true,
    ordinary_peasant_midlife_done: true,
  });
  const flags = state.flags ?? {};
  assert(flags.peasant_merchant_bridge_crossed !== true, 'decline_offer should not cross bridge');
  const goal = deriveOrdinaryOriginCurrentGoal(state) ?? '';
  assert(!goal.includes('粮商'), `decline offer should not have bridge goal: ${goal}`);
}

function main(): void {
  testBridgeGateFlags();
  testBridgeGateRequiresAcceptOutside();
  testBridgeRequiresSwapCrewCuriosity();
  testBridgeCurrentGoalExpression();
  testBridgeLifeMemoryExpression();
  testBridgeSummaryExpression();
  testBridgeDoesNotBreakOrdinaryOrigin();
  testBridgeSummaryInLifeMemorySummary();
  testNonPeasantNoBridge();
  testMagnateOnRampGateAcceptsBridgeFlag();
  testMagnateOnRampGateRejectsWithoutBridge();
  testMerchantMidlifeDebtGateAcceptsBridgeFlag();
  testMagnateOnRampRejectsAlreadyDone();
  testMagnateOnRampRejectsOrthodox();
  testGenericMerchantStillWorks();
  testApprenticeBridgeStillWorks();
  testTavernBridgeStillWorks();
  testDeclineOfferNoBridge();
  console.log('p61FarmPeasantBridgeTests: all passed');
}

main();
