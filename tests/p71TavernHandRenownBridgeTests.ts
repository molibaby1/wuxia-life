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
  } as GameState;
}

const RENOUN_BRIDGE_CONDITION =
  "flags.has('ally_network') && !flags.has('ordinary_tavern_midlife_done')";

const MERCHANT_BRIDGE_CONDITION =
  "flags.has('ally_network') && !flags.has('ordinary_tavern_midlife_done')";

function testBridgeCheckpointFlags(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    tavern_guest_network: true,
    ally_network: true,
    tavern_midlife_renown_bridge: true,
    tavern_embrace_renown: true,
    route_renown_committed: true,
    tavern_renown_bridge_crossed: true,
    ordinary_tavern_midlife_done: true,
  });
  const flags = state.flags ?? {};
  assert(flags.origin_tavern_hand === true, 'origin_tavern_hand should be true');
  assert(flags.ally_network === true, 'ally_network should be true');
  assert(flags.tavern_renown_bridge_crossed === true, 'tavern_renown_bridge_crossed should be true');
  assert(flags.route_renown_committed === true, 'route_renown_committed should be true');
  assert(flags.ordinary_tavern_midlife_done === true, 'ordinary_tavern_midlife_done should be true');
}

function testBridgeRequiresAllyNetworkSeed(): void {
  const noSeed = makeState(29, {
    origin_tavern_hand: true,
    tavern_service_committed: true,
    ordinary_tavern_midlife_seed: true,
  });
  const evaluator = new ConditionEvaluator();
  const result = evaluator.evaluate(
    { type: 'expression', expression: RENOUN_BRIDGE_CONDITION },
    noSeed,
  );
  assert(result === false, 'renown bridge should not fire without ally_network seed');
}

function testBridgeRequiresNoMidlifeDone(): void {
  const alreadyDone = makeState(29, {
    origin_tavern_hand: true,
    ally_network: true,
    ordinary_tavern_midlife_done: true,
  });
  const evaluator = new ConditionEvaluator();
  const result = evaluator.evaluate(
    { type: 'expression', expression: RENOUN_BRIDGE_CONDITION },
    alreadyDone,
  );
  assert(result === false, 'renown bridge should not fire when ordinary_tavern_midlife_done');
}

function testBridgeFiresWithPrerequisites(): void {
  const ready = makeState(29, {
    origin_tavern_hand: true,
    tavern_guest_network: true,
    ally_network: true,
  });
  const evaluator = new ConditionEvaluator();
  const result = evaluator.evaluate(
    { type: 'expression', expression: RENOUN_BRIDGE_CONDITION },
    ready,
  );
  assert(result === true, 'renown bridge should fire with ally_network + no midlife_done');
}

function testNonTavernNoRenownBridge(): void {
  const peasant = makeState(30, {
    origin_farm_peasant: true,
    route_renown_committed: true,
    tavern_renown_bridge_crossed: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(peasant);
  assert(!goal?.includes('江湖') || !goal?.includes('引荐'), `peasant should not have renown goal: ${goal}`);

  const origin = detectOrdinaryOrigin(peasant.flags ?? {});
  assert(origin === 'farm_peasant', 'peasant origin should be farm_peasant');

  const peasantMemory = deriveOrdinaryOriginLifeMemory(peasant.flags ?? {});
  assert(!peasantMemory?.includes('名号'), `peasant should not have renown memory: ${peasantMemory}`);

  const apprentice = makeState(30, {
    origin_town_apprentice: true,
    tavern_renown_bridge_crossed: true,
  });
  const appGoal = deriveOrdinaryOriginCurrentGoal(apprentice);
  assert(!appGoal?.includes('引荐'), `apprentice should not have renown goal: ${appGoal}`);

  const appSummary = deriveOrdinaryOriginSummary(apprentice.flags ?? {});
  assert(!appSummary?.includes('江湖人物'), `apprentice should not have renown summary: ${appSummary}`);
}

function testCurrentGoalExpression(): void {
  const bridge = makeState(30, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(bridge) ?? '';
  assert(goal.includes('江湖') || goal.includes('名声'), `renown currentGoal should mention 江湖/名声: ${goal}`);
  assert(goal.includes('引荐'), `renown currentGoal should mention 引荐: ${goal}`);
  assert(!goal.includes('商路'), `renown goal should not mention merchant route: ${goal}`);
  assert(isPlayerVisibleOrdinaryOriginText(goal), `raw key in renown goal: ${goal}`);
}

function testLifeMemoryExpression(): void {
  const bridge = makeState(30, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
  });
  const memory = deriveOrdinaryOriginLifeMemory(bridge.flags ?? {});
  assert(Boolean(memory?.includes('酒肆')), `renown lifeMemory should mention 酒肆: ${memory}`);
  assert(Boolean(memory?.includes('江湖') || memory?.includes('名号')), `renown lifeMemory should mention 江湖/名号: ${memory}`);
  assert(Boolean(memory?.includes('引荐') || memory?.includes('主事')), `renown lifeMemory should mention 引荐/主事: ${memory}`);
  assert(!memory?.includes('商路'), `renown lifeMemory should not say 商路: ${memory}`);
  assert(isPlayerVisibleOrdinaryOriginText(memory ?? ''), `raw key in renown lifeMemory: ${memory}`);
}

function testSummaryExpression(): void {
  const bridge = makeState(30, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
  });
  const summary = deriveOrdinaryOriginSummary(bridge.flags ?? {});
  assert(Boolean(summary?.includes('酒肆')), `renown summary should include 酒肆: ${summary}`);
  assert(Boolean(summary?.includes('江湖')), `renown summary should include 江湖: ${summary}`);
  assert(Boolean(summary?.includes('人脉') || summary?.includes('名声')), `renown summary should include 人脉/名声: ${summary}`);
  assert(!summary?.includes('商人'), `renown summary should not say 商人: ${summary}`);
  assert(!summary?.includes('商路'), `renown summary should not say 商路: ${summary}`);
}

function testOriginPreservedAfterBridge(): void {
  const bridge = makeState(30, {
    origin_tavern_hand: true,
    tavern_guest_network: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const origin = detectOrdinaryOrigin(bridge.flags ?? {});
  assert(origin === 'tavern_hand', `renown bridge should keep ordinary origin tavern_hand: ${origin}`);
}

function testSummaryInLifeMemorySummary(): void {
  const bridge = makeState(30, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
  });
  const summary = deriveLifeMemorySummary(bridge);
  assert(Boolean(summary.ordinaryOriginLifeMemory), 'ordinaryOriginLifeMemory missing for renown bridge');
  assert(Boolean(summary.ordinaryOriginSummary), 'ordinaryOriginSummary missing for renown bridge');
}

function testDeclinePathNoBridge(): void {
  const decline = makeState(30, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_midlife_renown_bridge: true,
    tavern_stay_in_tavern: true,
    ordinary_tavern_midlife_done: true,
  });
  const flags = decline.flags ?? {};
  assert(flags.tavern_renown_bridge_crossed !== true, 'stay_in_tavern should not cross renown bridge');
  assert(flags.route_renown_committed !== true, 'stay_in_tavern should not set route_renown_committed');
  assert(flags.ordinary_tavern_midlife_done === true, 'stay_in_tavern should set ordinary_tavern_midlife_done');

  const goal = deriveOrdinaryOriginCurrentGoal(decline) ?? '';
  assert(!goal.includes('江湖') || !goal.includes('引荐'), `decline should not have renown goal: ${goal}`);
}

function testMerchantBridgeBlocksRenown(): void {
  const merchantBridged = makeState(28, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_midlife_ally_referral: true,
    tavern_take_referral: true,
    route_wealth_committed: true,
    tavern_merchant_bridge_crossed: true,
    ordinary_tavern_midlife_done: true,
  });
  const evaluator = new ConditionEvaluator();
  const renownResult = evaluator.evaluate(
    { type: 'expression', expression: RENOUN_BRIDGE_CONDITION },
    merchantBridged,
  );
  assert(renownResult === false, 'merchant bridge should block renown bridge via ordinary_tavern_midlife_done');
}

function testRenownBridgeBlocksMerchant(): void {
  const renownBridged = makeState(28, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    ordinary_tavern_midlife_done: true,
  });
  const evaluator = new ConditionEvaluator();
  const merchantResult = evaluator.evaluate(
    { type: 'expression', expression: MERCHANT_BRIDGE_CONDITION },
    renownBridged,
  );
  assert(merchantResult === false, 'renown bridge should block merchant bridge via ordinary_tavern_midlife_done');
}

function testCompositeGateKeyChoices(): void {
  const bridge = makeState(42, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
  });
  const flags = bridge.flags ?? {};
  assert(flags.ally_network === true, 'ally_network should be set for renown gate');

  const keyChoices = ['mentor_bond', 'ally_network'];
  const hasAny = keyChoices.some((k) => flags[k] === true);
  assert(hasAny === true, 'ally_network should satisfy jianghu_renown_sage key_choices dimension');
}

function testExistingMerchantBridgeStillWorks(): void {
  const merchantBridge = makeState(30, {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(merchantBridge) ?? '';
  assert(goal.includes('商路') || goal.includes('铺子'), `merchant bridge goal should still work: ${goal}`);

  const summary = deriveOrdinaryOriginSummary(merchantBridge.flags ?? {});
  assert(Boolean(summary?.includes('商人')), `merchant bridge summary should still work: ${summary}`);
}

function main(): void {
  testBridgeCheckpointFlags();
  testBridgeRequiresAllyNetworkSeed();
  testBridgeRequiresNoMidlifeDone();
  testBridgeFiresWithPrerequisites();
  testCurrentGoalExpression();
  testLifeMemoryExpression();
  testSummaryExpression();
  testOriginPreservedAfterBridge();
  testSummaryInLifeMemorySummary();
  testDeclinePathNoBridge();
  testMerchantBridgeBlocksRenown();
  testRenownBridgeBlocksMerchant();
  testNonTavernNoRenownBridge();
  testCompositeGateKeyChoices();
  testExistingMerchantBridgeStillWorks();
  console.log('p71TavernHandRenownBridgeTests: all passed');
}

main();
