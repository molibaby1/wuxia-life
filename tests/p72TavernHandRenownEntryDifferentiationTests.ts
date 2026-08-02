import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  detectSampleLine,
  deriveSampleLineAge40Identity,
  deriveSampleLineCostLabel,
  deriveSampleLineCurrentGoal,
} from '../src/p50/sampleLineExpression';
import {
  deriveOrdinaryOriginSummary,
} from '../src/p56/ordinaryOriginExpression';
import { getPlayerRouteSummary } from '../src/utils/playerFacingLabels';
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

function testDetectSampleLineRenown(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const line = detectSampleLine(state.flags ?? {});
  assert(line === 'renown', `detectSampleLine should return 'renown', got ${line}`);
  console.log('  ✓ detectSampleLine returns renown for tavern renown bridge');
}

function testDetectSampleLineRenownOnlyWithBridge(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    ally_network: true,
  });
  const line = detectSampleLine(state.flags ?? {});
  assert(line === null, `detectSampleLine should return null without bridge, got ${line}`);
  console.log('  ✓ detectSampleLine returns null for ally_network without bridge');
}

function testDetectSampleLineMerchantStillWorks(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
  });
  const line = detectSampleLine(state.flags ?? {});
  assert(line === 'merchant', `detectSampleLine should return 'merchant', got ${line}`);
  console.log('  ✓ detectSampleLine still returns merchant for merchant bridge');
}

function testDetectSampleLineOrthodoxStillWorks(): void {
  const state = makeState(30, {
    orthodox_childhood_seed_done: true,
  });
  const line = detectSampleLine(state.flags ?? {});
  assert(line === 'orthodox', `detectSampleLine should return 'orthodox', got ${line}`);
  console.log('  ✓ detectSampleLine still returns orthodox for orthodox seed');
}

function testDetectSampleLineDemonicStillWorks(): void {
  const state = makeState(30, {
    demonic_path_touched: true,
  });
  const line = detectSampleLine(state.flags ?? {});
  assert(line === 'demonic', `detectSampleLine should return 'demonic', got ${line}`);
  console.log('  ✓ detectSampleLine still returns demonic for demonic path touched');
}

function testRenownCurrentGoalAtEntry(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(typeof goal === 'string', `currentGoal should be string, got ${typeof goal}`);
  assert(goal!.includes('人脉'), `currentGoal should mention 人脉, got ${goal}`);
  assert(goal!.includes('声名'), `currentGoal should mention 声名, got ${goal}`);
  assert(goal!.includes('引荐'), `currentGoal should mention 引荐, got ${goal}`);
  console.log('  ✓ renown currentGoal has tavern-born renown flavor');
}

function testRenownCostLabelAtEntry(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(typeof label === 'string', `costLabel should be string, got ${typeof label}`);
  assert(label.includes('声名'), `costLabel should mention 声名, got ${label}`);
  console.log('  ✓ renown costLabel has renown-specific flavor');
}

function testRenownAge40IdentityAtEntry(): void {
  const state = makeState(40, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const identity = deriveSampleLineAge40Identity(state);
  assert(typeof identity === 'string', `age40Identity should be string, got ${typeof identity}`);
  assert(identity!.includes('酒肆'), `age40Identity should mention 酒肆, got ${identity}`);
  assert(identity!.includes('江湖名宿'), `age40Identity should mention 江湖名宿, got ${identity}`);
  assert(identity!.includes('人脉'), `age40Identity should mention 人脉, got ${identity}`);
  assert(identity!.includes('引荐'), `age40Identity should mention 引荐, got ${identity}`);
  console.log('  ✓ renown age40Identity has tavern-born renown flavor');
}

function testRenownAge40IdentityBeforeBridge(): void {
  const state = makeState(40, {
    origin_tavern_hand: true,
    ally_network: true,
  });
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity === undefined || identity === null, `age40Identity should be undefined before bridge, got ${identity}`);
  console.log('  ✓ renown age40Identity is undefined before bridge');
}

function testRenownDistinctFromMerchant(): void {
  const renownState = makeState(40, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const merchantState = makeState(40, {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
  });

  const renownGoal = deriveSampleLineCurrentGoal(renownState);
  const merchantGoal = deriveSampleLineCurrentGoal(merchantState);
  assert(renownGoal !== merchantGoal, 'renown and merchant currentGoal should be different');

  const renownCost = deriveSampleLineCostLabel(renownState);
  const merchantCost = deriveSampleLineCostLabel(merchantState);
  assert(renownCost !== merchantCost, 'renown and merchant costLabel should be different');

  const renownIdentity = deriveSampleLineAge40Identity(renownState);
  const merchantIdentity = deriveSampleLineAge40Identity(merchantState);
  assert(renownIdentity !== merchantIdentity, 'renown and merchant age40Identity should be different');

  console.log('  ✓ renown entry is distinct from merchant entry across all surfaces');
}

function testRenownDistinctFromPlainTavern(): void {
  const renownState = makeState(40, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const tavernState = makeState(40, {
    origin_tavern_hand: true,
    tavern_service_committed: true,
  });

  const renownLine = detectSampleLine(renownState.flags ?? {});
  const tavernLine = detectSampleLine(tavernState.flags ?? {});
  assert(renownLine !== tavernLine, 'renown and plain tavern sample lines should differ');

  const renownRoute = getPlayerRouteSummary(renownState);
  const tavernRoute = getPlayerRouteSummary(tavernState);
  assert(renownRoute.name !== tavernRoute.name, 'renown and plain tavern route names should differ');

  console.log('  ✓ renown entry is distinct from plain tavern entry');
}

function testRenownRouteSummary(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const summary = getPlayerRouteSummary(state);
  assert(summary.name === '江湖名宿', `route summary name should be 江湖名宿, got ${summary.name}`);
  console.log('  ✓ renown route summary shows 江湖名宿');
}

function testRenownOriginSummary(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const summary = deriveOrdinaryOriginSummary(state.flags ?? {});
  assert(typeof summary === 'string', `origin summary should be string, got ${typeof summary}`);
  assert(summary.includes('酒肆'), `origin summary should mention 酒肆, got ${summary}`);
  assert(summary.includes('江湖'), `origin summary should mention 江湖, got ${summary}`);
  console.log('  ✓ renown origin summary has tavern-born jianghu flavor');
}

function testRenownPriorityOverMerchant(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    tavern_merchant_bridge_crossed: true,
  });
  const line = detectSampleLine(state.flags ?? {});
  assert(line === 'renown', `renown should take priority over merchant, got ${line}`);
  console.log('  ✓ renown bridge takes priority over merchant bridge in detectSampleLine');
}

function testRenownPriorityOverAllyNetworkOnly(): void {
  const state = makeState(25, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
  });
  const line = detectSampleLine(state.flags ?? {});
  assert(line === 'renown', `renown bridge should take priority over ally_network only, got ${line}`);
  console.log('  ✓ renown bridge takes priority over ally_network-only in detectSampleLine');
}

function runAllTests(): void {
  console.log('=== P72 Tavern Hand Renown Entry Differentiation Tests ===\n');

  console.log('1. Sample line detection');
  testDetectSampleLineRenown();
  testDetectSampleLineRenownOnlyWithBridge();
  testDetectSampleLineMerchantStillWorks();
  testDetectSampleLineOrthodoxStillWorks();
  testDetectSampleLineDemonicStillWorks();
  testRenownPriorityOverMerchant();
  testRenownPriorityOverAllyNetworkOnly();

  console.log('\n2. Player-facing expression surfaces');
  testRenownCurrentGoalAtEntry();
  testRenownCostLabelAtEntry();
  testRenownAge40IdentityAtEntry();
  testRenownAge40IdentityBeforeBridge();
  testRenownRouteSummary();
  testRenownOriginSummary();

  console.log('\n3. Differentiation from other paths');
  testRenownDistinctFromMerchant();
  testRenownDistinctFromPlainTavern();

  console.log('\n✅ All P72 entry differentiation tests passed');
}

runAllTests();
