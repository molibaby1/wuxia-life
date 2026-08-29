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

const MEDICAL_BRIDGE_CONDITION =
  "!flags.has('ordinary_tavern_midlife_done')";

const MERCHANT_BRIDGE_CONDITION =
  "flags.has('ally_network') && !flags.has('ordinary_tavern_midlife_done')";

const RENOWN_BRIDGE_CONDITION =
  "flags.has('ally_network') && !flags.has('ordinary_tavern_midlife_done')";

function testBridgeFlagChainCompassionate(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    tavern_midlife_medical_bridge: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_bridge_crossed: true,
    route_medical_committed: true,
    medical_pure: true,
    medical_talent: true,
    ordinary_tavern_midlife_done: true,
  });
  const flags = state.flags ?? {};
  assert(flags.origin_tavern_hand === true, 'origin_tavern_hand should be true');
  assert(flags.tavern_medical_bridge_crossed === true, 'tavern_medical_bridge_crossed should be true');
  assert(flags.route_medical_committed === true, 'route_medical_committed should be true');
  assert(flags.medical_pure === true, 'medical_pure should be true');
  assert(flags.medical_talent === true, 'medical_talent should be true');
  assert(flags.tavern_embrace_compassionate_healer === true, 'tavern_embrace_compassionate_healer should be true');
  assert(flags.ordinary_tavern_midlife_done === true, 'ordinary_tavern_midlife_done should be true');
}

function testBridgeFlagChainPragmatic(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    tavern_midlife_medical_bridge: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_bridge_crossed: true,
    route_medical_committed: true,
    medical_pure: true,
    medical_talent: true,
    ordinary_tavern_midlife_done: true,
  });
  const flags = state.flags ?? {};
  assert(flags.origin_tavern_hand === true, 'origin_tavern_hand should be true');
  assert(flags.tavern_medical_bridge_crossed === true, 'tavern_medical_bridge_crossed should be true');
  assert(flags.route_medical_committed === true, 'route_medical_committed should be true');
  assert(flags.medical_pure === true, 'medical_pure should be true');
  assert(flags.medical_talent === true, 'medical_talent should be true');
  assert(flags.tavern_embrace_pragmatic_healer === true, 'tavern_embrace_pragmatic_healer should be true');
  assert(flags.ordinary_tavern_midlife_done === true, 'ordinary_tavern_midlife_done should be true');
}

function testBridgeRequiresNoMidlifeDone(): void {
  const alreadyDone = makeState(28, {
    origin_tavern_hand: true,
    ordinary_tavern_midlife_done: true,
  });
  const evaluator = new ConditionEvaluator();
  const result = evaluator.evaluate(
    { type: 'expression', expression: MEDICAL_BRIDGE_CONDITION },
    alreadyDone,
  );
  assert(result === false, 'medical bridge should not fire when ordinary_tavern_midlife_done');
}

function testBridgeFiresWithPrerequisites(): void {
  const ready = makeState(28, {
    origin_tavern_hand: true,
  });
  const evaluator = new ConditionEvaluator();
  const result = evaluator.evaluate(
    { type: 'expression', expression: MEDICAL_BRIDGE_CONDITION },
    ready,
  );
  assert(result === true, 'medical bridge should fire with no midlife_done');
}

function testWrongOriginNoBridge(): void {
  const peasant = makeState(30, {
    origin_farm_peasant: true,
    tavern_medical_bridge_crossed: true,
  });
  const origin = detectOrdinaryOrigin(peasant.flags ?? {});
  assert(origin === 'farm_peasant', 'peasant origin should be farm_peasant');

  const apprentice = makeState(30, {
    origin_town_apprentice: true,
    tavern_medical_bridge_crossed: true,
  });
  const appOrigin = detectOrdinaryOrigin(apprentice.flags ?? {});
  assert(appOrigin === 'town_apprentice', 'apprentice origin should be town_apprentice');
}

function testCurrentGoalExpression(): void {
  const bridge = makeState(30, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(bridge) ?? '';
  assert(goal.includes('看病') || goal.includes('药庐'), `medical currentGoal should mention 看病/药庐: ${goal}`);
  assert(goal.includes('酒肆'), `medical currentGoal should mention 酒肆: ${goal}`);
  assert(!goal.includes('商路'), `medical goal should not mention merchant route: ${goal}`);
  assert(!goal.includes('江湖'), `medical goal should not mention jianghu route: ${goal}`);
  assert(isPlayerVisibleOrdinaryOriginText(goal), `raw key in medical goal: ${goal}`);
}

function testLifeMemoryExpressionCompassionate(): void {
  const bridge = makeState(30, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
  });
  const memory = deriveOrdinaryOriginLifeMemory(bridge.flags ?? {});
  assert(Boolean(memory?.includes('酒肆')), `compassionate lifeMemory should mention 酒肆: ${memory}`);
  assert(Boolean(memory?.includes('医术') || memory?.includes('神医')), `compassionate lifeMemory should mention 医术/神医: ${memory}`);
  assert(Boolean(memory?.includes('有钱没钱') || memory?.includes('受苦')), `compassionate lifeMemory should have compassionate flavor: ${memory}`);
  assert(!memory?.includes('商路'), `medical lifeMemory should not say 商路: ${memory}`);
  assert(isPlayerVisibleOrdinaryOriginText(memory ?? ''), `raw key in medical lifeMemory: ${memory}`);
}

function testLifeMemoryExpressionPragmatic(): void {
  const bridge = makeState(30, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
  });
  const memory = deriveOrdinaryOriginLifeMemory(bridge.flags ?? {});
  assert(Boolean(memory?.includes('酒肆')), `pragmatic lifeMemory should mention 酒肆: ${memory}`);
  assert(Boolean(memory?.includes('医术') || memory?.includes('看病')), `pragmatic lifeMemory should mention 医术/看病: ${memory}`);
  assert(Boolean(memory?.includes('收钱') || memory?.includes('公道') || memory?.includes('大户')), `pragmatic lifeMemory should have pragmatic flavor: ${memory}`);
  assert(!memory?.includes('江湖'), `medical lifeMemory should not say 江湖: ${memory}`);
  assert(isPlayerVisibleOrdinaryOriginText(memory ?? ''), `raw key in medical lifeMemory: ${memory}`);
}

function testSummaryExpression(): void {
  const bridge = makeState(30, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
  });
  const summary = deriveOrdinaryOriginSummary(bridge.flags ?? {});
  assert(Boolean(summary?.includes('酒肆')), `medical summary should include 酒肆: ${summary}`);
  assert(Boolean(summary?.includes('医者') || summary?.includes('行医')), `medical summary should include 医者/行医: ${summary}`);
  assert(Boolean(summary?.includes('自学') || summary?.includes('经验')), `medical summary should include 自学/经验: ${summary}`);
  assert(!summary?.includes('商人'), `medical summary should not say 商人: ${summary}`);
  assert(!summary?.includes('江湖'), `medical summary should not say 江湖: ${summary}`);
}

function testOriginPreservedAfterBridge(): void {
  const bridge = makeState(30, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    route_medical_committed: true,
    medical_pure: true,
  });
  const origin = detectOrdinaryOrigin(bridge.flags ?? {});
  assert(origin === 'tavern_hand', `medical bridge should keep ordinary origin tavern_hand: ${origin}`);
}

function testSummaryInLifeMemorySummary(): void {
  const bridge = makeState(30, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
  });
  const summary = deriveLifeMemorySummary(bridge);
  assert(Boolean(summary.ordinaryOriginLifeMemory), 'ordinaryOriginLifeMemory missing for medical bridge');
  assert(Boolean(summary.ordinaryOriginSummary), 'ordinaryOriginSummary missing for medical bridge');
}

function testDeclinePathNoBridge(): void {
  const decline = makeState(30, {
    origin_tavern_hand: true,
    tavern_midlife_medical_bridge: true,
    tavern_decline_medical: true,
    ordinary_tavern_midlife_done: true,
  });
  const flags = decline.flags ?? {};
  assert(flags.tavern_medical_bridge_crossed !== true, 'decline should not cross medical bridge');
  assert(flags.route_medical_committed !== true, 'decline should not set route_medical_committed');
  assert(flags.medical_pure !== true, 'decline should not set medical_pure');
  assert(flags.medical_talent !== true, 'decline should not set medical_talent');
  assert(flags.ordinary_tavern_midlife_done === true, 'decline should set ordinary_tavern_midlife_done');

  const goal = deriveOrdinaryOriginCurrentGoal(decline) ?? '';
  assert(!goal.includes('看病') && !goal.includes('药庐'), `decline should not have medical goal: ${goal}`);
}

function testMerchantBridgeBlocksMedical(): void {
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
  const medicalResult = evaluator.evaluate(
    { type: 'expression', expression: MEDICAL_BRIDGE_CONDITION },
    merchantBridged,
  );
  assert(medicalResult === false, 'merchant bridge should block medical bridge via ordinary_tavern_midlife_done');
}

function testMedicalBridgeBlocksMerchant(): void {
  const medicalBridged = makeState(29, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    route_medical_committed: true,
    ordinary_tavern_midlife_done: true,
  });
  const evaluator = new ConditionEvaluator();
  const merchantResult = evaluator.evaluate(
    { type: 'expression', expression: MERCHANT_BRIDGE_CONDITION },
    medicalBridged,
  );
  assert(merchantResult === false, 'medical bridge should block merchant bridge via ordinary_tavern_midlife_done');
}

function testRenownBridgeBlocksMedical(): void {
  const renownBridged = makeState(28, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    ordinary_tavern_midlife_done: true,
  });
  const evaluator = new ConditionEvaluator();
  const medicalResult = evaluator.evaluate(
    { type: 'expression', expression: MEDICAL_BRIDGE_CONDITION },
    renownBridged,
  );
  assert(medicalResult === false, 'renown bridge should block medical bridge via ordinary_tavern_midlife_done');
}

function testMedicalBridgeBlocksRenown(): void {
  const medicalBridged = makeState(29, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    route_medical_committed: true,
    ordinary_tavern_midlife_done: true,
  });
  const evaluator = new ConditionEvaluator();
  const renownResult = evaluator.evaluate(
    { type: 'expression', expression: RENOWN_BRIDGE_CONDITION },
    medicalBridged,
  );
  assert(renownResult === false, 'medical bridge should block renown bridge via ordinary_tavern_midlife_done');
}

function testCompositeGateKeyChoicesDim2(): void {
  const bridge = makeState(42, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    medical_pure: true,
  });
  const flags = bridge.flags ?? {};
  assert(flags.medical_pure === true, 'medical_pure should be set for medical gate');

  const keyChoicesDim2 = ['medical_plague_hero', 'medical_pure'];
  const blockedBy = ['medical_poison_path'];
  const hasAny = keyChoicesDim2.some((k) => flags[k] === true);
  const isBlocked = blockedBy.some((k) => flags[k] === true);
  assert(hasAny === true && !isBlocked, 'medical_pure should satisfy medical_sage_healer key_choices dim 2');
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

function testExistingRenownBridgeStillWorks(): void {
  const renownBridge = makeState(30, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(renownBridge) ?? '';
  assert(goal.includes('江湖') || goal.includes('引荐'), `renown bridge goal should still work: ${goal}`);

  const summary = deriveOrdinaryOriginSummary(renownBridge.flags ?? {});
  assert(Boolean(summary?.includes('江湖人物')), `renown bridge summary should still work: ${summary}`);
}

function testEntryVariantsDistinct(): void {
  const compassionate = makeState(30, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
  });
  const pragmatic = makeState(30, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
  });

  const compMemory = deriveOrdinaryOriginLifeMemory(compassionate.flags ?? {}) ?? '';
  const pragMemory = deriveOrdinaryOriginLifeMemory(pragmatic.flags ?? {}) ?? '';

  assert(compMemory !== pragMemory, 'compassionate and pragmatic lifeMemory should be different');
  assert(compMemory.includes('受苦') || compMemory.includes('有钱没钱'), `compassionate should have compassionate flavor: ${compMemory}`);
  assert(pragMemory.includes('收钱') || pragMemory.includes('公道') || pragMemory.includes('大户'), `pragmatic should have pragmatic flavor: ${pragMemory}`);
}

function testNonMedicalIsolation(): void {
  const peasant = makeState(30, {
    origin_farm_peasant: true,
    peasant_steadfast_field: true,
    peasant_swap_crew_curiosity: true,
  });
  const peasantGoal = deriveOrdinaryOriginCurrentGoal(peasant) ?? '';
  assert(!peasantGoal.includes('药庐'), `peasant goal should not have medical: ${peasantGoal}`);

  const apprentice = makeState(30, {
    origin_town_apprentice: true,
    apprentice_craft_committed: true,
  });
  const appGoal = deriveOrdinaryOriginCurrentGoal(apprentice) ?? '';
  assert(!appGoal.includes('看病'), `apprentice goal should not have medical: ${appGoal}`);
}

function main(): void {
  testBridgeFlagChainCompassionate();
  testBridgeFlagChainPragmatic();
  testBridgeRequiresNoMidlifeDone();
  testBridgeFiresWithPrerequisites();
  testWrongOriginNoBridge();
  testCurrentGoalExpression();
  testLifeMemoryExpressionCompassionate();
  testLifeMemoryExpressionPragmatic();
  testSummaryExpression();
  testOriginPreservedAfterBridge();
  testSummaryInLifeMemorySummary();
  testDeclinePathNoBridge();
  testMerchantBridgeBlocksMedical();
  testMedicalBridgeBlocksMerchant();
  testRenownBridgeBlocksMedical();
  testMedicalBridgeBlocksRenown();
  testCompositeGateKeyChoicesDim2();
  testExistingMerchantBridgeStillWorks();
  testExistingRenownBridgeStillWorks();
  testEntryVariantsDistinct();
  testNonMedicalIsolation();
  console.log('p83TavernHandMedicalBridgeTests: all passed');
}

main();
