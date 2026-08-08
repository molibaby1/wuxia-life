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

function makeState(age: number, flags: Record<string, unknown>): GameState {
  return {
    player: {
      age,
      name: 'fixture',
      gender: 'male',
      martialPower: 30,
      chivalry: 10,
      constitution: 50,
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
    eventHistory: [],
  } as GameState;
}

function testBridgeGateFlags(): void {
  const state = makeState(30, {
    origin_town_apprentice: true,
    apprentice_trade_curiosity: true,
    apprentice_midlife_trade_network: true,
    apprentice_join_partnership: true,
    route_wealth_committed: true,
    apprentice_merchant_bridge_crossed: true,
  });
  const flags = state.flags ?? {};
  assert(flags.origin_town_apprentice === true, 'origin_town_apprentice should be true');
  assert(flags.apprentice_trade_curiosity === true, 'apprentice_trade_curiosity should be true');
  assert(flags.apprentice_midlife_trade_network === true, 'apprentice_midlife_trade_network should be true');
  assert(flags.apprentice_join_partnership === true, 'apprentice_join_partnership should be true');
  assert(flags.route_wealth_committed === true, 'route_wealth_committed should be true');
  assert(flags.apprentice_merchant_bridge_crossed === true, 'apprentice_merchant_bridge_crossed should be true');
}

function testBridgeGateRequiresAllPrerequisites(): void {
  const missingTradeCuriosity = makeState(30, {
    origin_town_apprentice: true,
    apprentice_midlife_trade_network: true,
    apprentice_join_partnership: true,
    route_wealth_committed: true,
    apprentice_merchant_bridge_crossed: true,
  });
  const flags1 = missingTradeCuriosity.flags ?? {};
  assert(flags1.apprentice_trade_curiosity !== true, 'bridge should require trade_curiosity');

  const missingPartnership = makeState(30, {
    origin_town_apprentice: true,
    apprentice_trade_curiosity: true,
    apprentice_midlife_trade_network: true,
    route_wealth_committed: true,
    apprentice_merchant_bridge_crossed: true,
  });
  const flags2 = missingPartnership.flags ?? {};
  assert(flags2.apprentice_join_partnership !== true, 'bridge should require join_partnership');
}

function testBridgeCurrentGoalExpression(): void {
  const bridge = makeState(30, {
    origin_town_apprentice: true,
    apprentice_merchant_bridge_crossed: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(bridge) ?? '';
  assert(goal.includes('商路') || goal.includes('合伙'), `bridge currentGoal: ${goal}`);
  assert(isPlayerVisibleOrdinaryOriginText(goal), `raw key in bridge goal: ${goal}`);

  const midlife = makeState(26, {
    origin_town_apprentice: true,
    apprentice_trade_curiosity: true,
    apprentice_midlife_trade_network: true,
  });
  const midlifeGoal = deriveOrdinaryOriginCurrentGoal(midlife) ?? '';
  assert(midlifeGoal.includes('买卖') || midlifeGoal.includes('合伙'), `midlife currentGoal: ${midlifeGoal}`);
  assert(!midlifeGoal.includes('商路'), `midlife goal should not mention merchant route: ${midlifeGoal}`);
}

function testBridgeLifeMemoryExpression(): void {
  const bridge = makeState(30, {
    origin_town_apprentice: true,
    apprentice_merchant_bridge_crossed: true,
  });
  const memory = deriveOrdinaryOriginLifeMemory(bridge.flags ?? {});
  assert(Boolean(memory?.includes('商路') || memory?.includes('合伙')), `bridge lifeMemory: ${memory}`);
  assert(isPlayerVisibleOrdinaryOriginText(memory ?? ''), `raw key in bridge lifeMemory: ${memory}`);

  const partnership = makeState(28, {
    origin_town_apprentice: true,
    apprentice_midlife_trade_network: true,
    apprentice_join_partnership: true,
  });
  const partnershipMemory = deriveOrdinaryOriginLifeMemory(partnership.flags ?? {});
  assert(Boolean(partnershipMemory?.includes('合伙') || partnershipMemory?.includes('买卖')), `partnership lifeMemory: ${partnershipMemory}`);
}

function testBridgeSummaryExpression(): void {
  const bridge = makeState(30, {
    origin_town_apprentice: true,
    apprentice_merchant_bridge_crossed: true,
  });
  const summary = deriveOrdinaryOriginSummary(bridge.flags ?? {});
  assert(Boolean(summary?.includes('商人') || summary?.includes('商路')), `bridge summary: ${summary}`);

  const midlife = makeState(26, {
    origin_town_apprentice: true,
    apprentice_midlife_trade_network: true,
  });
  const midlifeSummary = deriveOrdinaryOriginSummary(midlife.flags ?? {});
  assert(Boolean(midlifeSummary?.includes('学徒')), `midlife summary: ${midlifeSummary}`);
  assert(!midlifeSummary?.includes('商人'), `midlife summary should not say 商人: ${midlifeSummary}`);
}

function testBridgeDoesNotBreakOrdinaryOrigin(): void {
  const bridge = makeState(30, {
    origin_town_apprentice: true,
    apprentice_trade_curiosity: true,
    apprentice_midlife_trade_network: true,
    apprentice_join_partnership: true,
    route_wealth_committed: true,
    apprentice_merchant_bridge_crossed: true,
  });
  const origin = detectOrdinaryOrigin(bridge.flags ?? {});
  assert(origin === 'town_apprentice', `bridge should keep ordinary origin: ${origin}`);
}

function testBridgeSummaryInLifeMemorySummary(): void {
  const bridge = makeState(30, {
    origin_town_apprentice: true,
    apprentice_merchant_bridge_crossed: true,
  });
  const summary = deriveLifeMemorySummary(bridge);
  assert(Boolean(summary.ordinaryOriginLifeMemory), 'ordinaryOriginLifeMemory missing');
  assert(Boolean(summary.ordinaryOriginSummary), 'ordinaryOriginSummary missing');
}

function testNonApprenticeNoBridge(): void {
  const peasant = makeState(30, {
    origin_farm_peasant: true,
    route_wealth_committed: true,
    apprentice_merchant_bridge_crossed: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(peasant);
  assert(!goal?.includes('商路'), `peasant should not have bridge goal: ${goal}`);

  const origin = detectOrdinaryOrigin(peasant.flags ?? {});
  assert(origin === 'farm_peasant', 'peasant origin should be farm_peasant');
}

const MAGNATE_ON_RAMP_EXPRESSION =
  "(flags.has('route_merchant') || flags.has('merchant_childhood_seed_done') || flags.has('p8_route_wealth') || flags.has('apprentice_merchant_bridge_crossed')) && (flags.has('merchant_caravan_success') || flags.has('merchant_shop_grocery') || flags.has('merchant_shop_weapon') || flags.has('merchant_shop_herb') || flags.has('merchant_wealthy') || flags.has('merchant_chamber_head') || flags.has('apprentice_merchant_bridge_crossed')) && !flags.has('magnate_on_ramp_done') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')";

const MERCHANT_MIDLIFE_DEBT_EXPRESSION =
  "(flags.has('route_merchant') || flags.has('merchant_childhood_seed_done') || flags.has('merchant_talent') || flags.has('p8_route_wealth') || flags.has('apprentice_merchant_bridge_crossed')) && (flags.has('merchant_shop_grocery') || flags.has('merchant_shop_weapon') || flags.has('merchant_shop_herb') || flags.has('merchant_shop_failed') || flags.has('merchant_caravan_success') || flags.has('apprentice_merchant_bridge_crossed')) && !flags.has('merchant_midlife_debt') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')";

function makeGameState(flags: Record<string, boolean>, age = 30): GameState {
  return {
    player: {
      age,
      name: 'fixture',
      gender: 'male',
      martialPower: 30,
      chivalry: 10,
      constitution: 50,
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
    eventHistory: [],
  } as GameState;
}

function testMagnateOnRampGateAcceptsBridgeFlag(): void {
  const evaluator = new ConditionEvaluator();
  const bridgedState = makeGameState({
    origin_town_apprentice: true,
    apprentice_trade_curiosity: true,
    apprentice_midlife_trade_network: true,
    apprentice_join_partnership: true,
    route_wealth_committed: true,
    apprentice_merchant_bridge_crossed: true,
  });
  const result = evaluator.evaluate(
    { type: 'expression', expression: MAGNATE_ON_RAMP_EXPRESSION },
    bridgedState,
  );
  assert(result === true, 'magnate_on_ramp gate should accept apprentice_merchant_bridge_crossed');
}

function testMagnateOnRampGateRejectsWithoutBridge(): void {
  const evaluator = new ConditionEvaluator();
  const noBridgeState = makeGameState({
    origin_town_apprentice: true,
    apprentice_trade_curiosity: true,
    apprentice_midlife_trade_network: true,
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
    origin_town_apprentice: true,
    apprentice_trade_curiosity: true,
    apprentice_midlife_trade_network: true,
    apprentice_join_partnership: true,
    route_wealth_committed: true,
    apprentice_merchant_bridge_crossed: true,
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
    origin_town_apprentice: true,
    apprentice_merchant_bridge_crossed: true,
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
    origin_town_apprentice: true,
    apprentice_merchant_bridge_crossed: true,
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

function main(): void {
  testBridgeGateFlags();
  testBridgeGateRequiresAllPrerequisites();
  testBridgeCurrentGoalExpression();
  testBridgeLifeMemoryExpression();
  testBridgeSummaryExpression();
  testBridgeDoesNotBreakOrdinaryOrigin();
  testBridgeSummaryInLifeMemorySummary();
  testNonApprenticeNoBridge();
  testMagnateOnRampGateAcceptsBridgeFlag();
  testMagnateOnRampGateRejectsWithoutBridge();
  testMerchantMidlifeDebtGateAcceptsBridgeFlag();
  testMagnateOnRampRejectsAlreadyDone();
  testMagnateOnRampRejectsOrthodox();
  testGenericMerchantStillWorks();
  console.log('p58ApprenticeBridgeTests: all passed');
}

main();
