import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  detectSampleLine,
  deriveSampleLineCurrentGoal,
} from '../src/p50/sampleLineExpression';
import {
  deriveOrdinaryOriginCurrentGoal,
  deriveOrdinaryOriginLifeMemory,
  deriveOrdinaryOriginSummary,
  detectOrdinaryOrigin,
  isPlayerVisibleOrdinaryOriginText,
} from '../src/p56/ordinaryOriginExpression';
import sampleLinesSpine from '../src/data/lines/sample-lines-spine.json';
import type { GameState, SampleLineEvent } from '../src/types/eventTypes';

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

const onRampEvent = (sampleLinesSpine as SampleLineEvent[]).find(e => e.id === 'renown_on_ramp');

console.log('=== P73 Tavern Hand Renown On-Ramp Spine Tests ===\n');

console.log('1. On-ramp event wiring');

function testOnRampEventExists(): void {
  assert(onRampEvent !== undefined, 'renown_on_ramp event should exist in sample-lines-spine.json');
  console.log('  ✓ renown_on_ramp event exists in sample-lines-spine.json');
}

function testOnRampEventIsAuto(): void {
  assert(onRampEvent?.eventType === 'auto', `on-ramp event should be auto, got ${onRampEvent?.eventType}`);
  console.log('  ✓ on-ramp event is auto type (mandatory milestone)');
}

function testOnRampEventAgeRange(): void {
  assert(onRampEvent?.ageRange?.min === 32, `on-ramp min age should be 32, got ${onRampEvent?.ageRange?.min}`);
  assert(onRampEvent?.ageRange?.max === 35, `on-ramp max age should be 35, got ${onRampEvent?.ageRange?.max}`);
  console.log('  ✓ on-ramp event age range is 32-35 (post-bridge)');
}

function testOnRampEventSetsDoneFlag(): void {
  const effects = onRampEvent?.autoEffects ?? [];
  const hasFlagSet = effects.some(
    (e: { type: string; target: string }) => e.type === 'flag_set' && e.target === 'renown_on_ramp_done'
  );
  assert(hasFlagSet, 'on-ramp event should set renown_on_ramp_done flag');
  console.log('  ✓ on-ramp event sets renown_on_ramp_done checkpoint flag');
}

function testOnRampEventHasStatBoosts(): void {
  const effects = onRampEvent?.autoEffects ?? [];
  const statEffects = effects.filter((e: { type: string }) => e.type === 'stat_modify');
  assert(statEffects.length >= 2, `on-ramp should have at least 2 stat boosts, got ${statEffects.length}`);
  console.log('  ✓ on-ramp event has stat boosts (renown-appropriate)');
}

testOnRampEventExists();
testOnRampEventIsAuto();
testOnRampEventAgeRange();
testOnRampEventSetsDoneFlag();
testOnRampEventHasStatBoosts();

console.log('\n2. Pre-on-ramp (bridge-only) state');

function testPreOnRampDetectSampleLine(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const line = detectSampleLine(state.flags ?? {});
  assert(line === 'renown', `detectSampleLine should return 'renown', got ${line}`);
  console.log('  ✓ detectSampleLine returns renown at bridge-only state');
}

function testPreOnRampOriginStillTavern(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const origin = detectOrdinaryOrigin(state.flags ?? {});
  assert(origin === 'tavern_hand', `origin should still be tavern_hand, got ${origin}`);
  console.log('  ✓ origin is still tavern_hand after bridge');
}

function testPreOnRampCurrentGoalIsBridgeLevel(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal.includes('立足'), `pre-on-ramp goal should be bridge level, got: ${goal}`);
  assert(!goal.includes('主持公道'), `pre-on-ramp goal should NOT have on-ramp text, got: ${goal}`);
  console.log('  ✓ sample line currentGoal is bridge-level before on-ramp');
}

function testPreOnRampSummaryIsBridgeLevel(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const summary = deriveOrdinaryOriginSummary(state.flags ?? {});
  assert(summary?.includes('江湖人物'), `pre-on-ramp summary should be bridge level, got: ${summary}`);
  assert(!summary?.includes('江湖名宿'), `pre-on-ramp summary should NOT be on-ramp level, got: ${summary}`);
  console.log('  ✓ origin summary is bridge-level before on-ramp');
}

testPreOnRampDetectSampleLine();
testPreOnRampOriginStillTavern();
testPreOnRampCurrentGoalIsBridgeLevel();
testPreOnRampSummaryIsBridgeLevel();

console.log('\n3. Post-on-ramp expression updates');

function testPostOnRampSampleLineCurrentGoal(): void {
  const state = makeState(33, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal.includes('有了名号'), `on-ramp goal should show advancement, got: ${goal}`);
  assert(goal.includes('主持公道'), `on-ramp goal should mention 主持公道, got: ${goal}`);
  console.log('  ✓ sample line currentGoal updates after on-ramp');
}

function testPostOnRampOrdinaryOriginCurrentGoal(): void {
  const state = makeState(33, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(state);
  assert(goal.includes('有了名号'), `on-ramp tavern goal should show advancement, got: ${goal}`);
  assert(goal.includes('主持公道'), `on-ramp tavern goal should mention 主持公道, got: ${goal}`);
  console.log('  ✓ ordinary origin currentGoal updates after on-ramp');
}

function testPostOnRampLifeMemory(): void {
  const flags = {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
  };
  const memory = deriveOrdinaryOriginLifeMemory(flags);
  assert(memory !== undefined, 'on-ramp life memory should exist');
  assert(memory.includes('主持了公道'), `on-ramp memory should mention 主持公道, got: ${memory}`);
  assert(memory.includes('不是因为武功'), `on-ramp memory should preserve tavern flavor, got: ${memory}`);
  assert(isPlayerVisibleOrdinaryOriginText(memory!), 'on-ramp memory should be player-visible');
  console.log('  ✓ life memory updates after on-ramp (tavern-born flavor preserved)');
}

function testPostOnRampOriginSummary(): void {
  const flags = {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
  };
  const summary = deriveOrdinaryOriginSummary(flags);
  assert(summary?.includes('江湖名宿'), `on-ramp summary should be 江湖名宿, got: ${summary}`);
  assert(summary?.includes('酒肆出身'), `on-ramp summary should preserve tavern origin, got: ${summary}`);
  assert(isPlayerVisibleOrdinaryOriginText(summary!), 'on-ramp summary should be player-visible');
  console.log('  ✓ origin summary advances to 江湖名宿 after on-ramp');
}

function testPostOnRampOriginStillTavern(): void {
  const flags = {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
  };
  const origin = detectOrdinaryOrigin(flags);
  assert(origin === 'tavern_hand', `origin should still be tavern_hand, got ${origin}`);
  console.log('  ✓ origin is still tavern_hand after on-ramp');
}

testPostOnRampSampleLineCurrentGoal();
testPostOnRampOrdinaryOriginCurrentGoal();
testPostOnRampLifeMemory();
testPostOnRampOriginSummary();
testPostOnRampOriginStillTavern();

console.log('\n4. Distinct from merchant on-ramp');

function testRenownOnRampDistinctFromMerchantOnRamp(): void {
  const renownFlags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
  };
  const merchantFlags = {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
  };

  const renownSummary = deriveOrdinaryOriginSummary(renownFlags);
  const merchantSummary = deriveOrdinaryOriginSummary(merchantFlags);

  assert(renownSummary !== merchantSummary, 'renown and merchant on-ramp summaries should be distinct');
  assert(renownSummary?.includes('江湖名宿') || renownSummary?.includes('江湖'), `renown should be jianghu flavored, got: ${renownSummary}`);
  assert(merchantSummary?.includes('商人') || merchantSummary?.includes('商路'), `merchant should be business flavored, got: ${merchantSummary}`);
  console.log('  ✓ renown on-ramp distinct from merchant on-ramp across summary');
}

function testRenownOnRampMemoryDistinctFromMerchant(): void {
  const renownFlags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
  };
  const merchantFlags = {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
  };

  const renownMemory = deriveOrdinaryOriginLifeMemory(renownFlags);
  const merchantMemory = deriveOrdinaryOriginLifeMemory(merchantFlags);

  assert(renownMemory !== merchantMemory, 'renown and merchant memories should be distinct');
  console.log('  ✓ renown on-ramp memory distinct from merchant on-ramp memory');
}

testRenownOnRampDistinctFromMerchantOnRamp();
testRenownOnRampMemoryDistinctFromMerchant();

console.log('\n5. No regression of P71/P72 entry evidence');

function testP71BridgeStillWorks(): void {
  const state = makeState(29, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const line = detectSampleLine(state.flags ?? {});
  assert(line === 'renown', `P71 bridge should still detect as renown, got ${line}`);
  console.log('  ✓ P71 bridge detection still works (no regression)');
}

function testP72EntryStillWorks(): void {
  const state = makeState(30, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal.length > 0, 'P72 entry goal should exist');
  console.log('  ✓ P72 entry expression still works (no regression)');
}

function testMerchantOnRampUnchanged(): void {
  const flags = {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
  };
  const summary = deriveOrdinaryOriginSummary(flags);
  assert(summary?.includes('商人'), `merchant on-ramp should still be 商人, got: ${summary}`);
  console.log('  ✓ merchant on-ramp unchanged (no regression)');
}

testP71BridgeStillWorks();
testP72EntryStillWorks();
testMerchantOnRampUnchanged();

console.log('\n✅ All P73 renown on-ramp spine tests passed');
