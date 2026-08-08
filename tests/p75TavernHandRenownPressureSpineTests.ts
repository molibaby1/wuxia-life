import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  detectSampleLine,
  deriveSampleLineCurrentGoal,
  deriveSampleLineCostLabel,
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
import { isPlayerVisibleSampleLineText } from '../src/p50/sampleLineExpression';

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
      reputation: 15,
      money: 100,
      knowledge: 15,
      charisma: 12,
      businessAcumen: 10,
      influence: 10,
      connections: 12,
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

const pressureEvent = (sampleLinesSpine as SampleLineEvent[]).find(e => e.id === 'renown_midlife_pressure');

console.log('=== P75 Tavern Hand Renown Pressure Spine Tests ===\n');

console.log('1. Event wiring');

function testPressureEventExists(): void {
  assert(pressureEvent !== undefined, 'renown_midlife_pressure event should exist in sample-lines-spine.json');
  console.log('  ✓ renown_midlife_pressure event exists in sample-lines-spine.json');
}

function testPressureEventIsAuto(): void {
  assert(pressureEvent?.eventType === 'auto', `pressure event should be auto, got ${pressureEvent?.eventType}`);
  console.log('  ✓ pressure event is auto type (mandatory milestone)');
}

function testPressureEventAgeRange(): void {
  assert(pressureEvent?.ageRange?.min === 37, `pressure min age should be 37, got ${pressureEvent?.ageRange?.min}`);
  assert(pressureEvent?.ageRange?.max === 41, `pressure max age should be 41, got ${pressureEvent?.ageRange?.max}`);
  console.log('  ✓ pressure event age range is 37-41 (post-on-ramp)');
}

function testPressureEventConditions(): void {
  const conditions = pressureEvent?.conditions ?? [];
  assert(conditions.length >= 1, 'pressure event should have conditions');
  const expr = conditions[0]?.expression ?? '';
  assert(expr.includes('renown_on_ramp_done'), 'pressure condition should require renown_on_ramp_done');
  assert(expr.includes('!flags.has') && expr.includes('renown_midlife_pressure_done'), 'pressure condition should have exclusivity guard');
  console.log('  ✓ pressure event trigger conditions correct (on-ramp gate + exclusivity)');
}

function testPressureEventSetsFlags(): void {
  const effects = pressureEvent?.autoEffects ?? [];
  const hasPressureDone = effects.some(
    (e: { type: string; target: string }) => e.type === 'flag_set' && e.target === 'renown_midlife_pressure_done'
  );
  const hasTavernRenownPressure = effects.some(
    (e: { type: string; target: string }) => e.type === 'flag_set' && e.target === 'tavern_renown_pressure'
  );
  assert(hasPressureDone, 'pressure event should set renown_midlife_pressure_done flag');
  assert(hasTavernRenownPressure, 'pressure event should set tavern_renown_pressure marker');
  console.log('  ✓ pressure event sets both checkpoint flag + origin marker');
}

testPressureEventExists();
testPressureEventIsAuto();
testPressureEventAgeRange();
testPressureEventConditions();
testPressureEventSetsFlags();

console.log('\n2. Pre-pressure state (post-on-ramp, pre-pressure)');

function testPrePressureDetectSampleLine(): void {
  const state = makeState(35, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
  });
  const line = detectSampleLine(state.flags ?? {});
  assert(line === 'renown', `detectSampleLine should return 'renown', got ${line}`);
  console.log('  ✓ detectSampleLine returns renown at pre-pressure (post-on-ramp) state');
}

function testPrePressureCostLabelIsOnRampLevel(): void {
  const state = makeState(35, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '江湖声名之累', `pre-pressure cost label should be 江湖声名之累, got: ${label}`);
  assert(!label.includes('人情债'), `pre-pressure cost label should NOT have pressure text, got: ${label}`);
  console.log('  ✓ pre-pressure cost label is on-ramp level (江湖声名之累)');
}

testPrePressureDetectSampleLine();
testPrePressureCostLabelIsOnRampLevel();

console.log('\n3. Post-pressure expression updates (3 P0 + 2 P1)');

function testPostPressureSampleLineCurrentGoal(): void {
  const state = makeState(38, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('维持声名'), `pressure goal should mention 维持声名, got: ${goal}`);
  assert(goal?.includes('人情债'), `pressure goal should mention 人情债, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'pressure goal should be player-visible');
  console.log('  ✓ sample line currentGoal updates after pressure (P0)');
}

function testPostPressureOrdinaryOriginCurrentGoal(): void {
  const state = makeState(38, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(state);
  assert(goal?.includes('维持声名'), `pressure tavern goal should mention 维持声名, got: ${goal}`);
  assert(goal?.includes('人情债'), `pressure tavern goal should mention 人情债, got: ${goal}`);
  assert(isPlayerVisibleOrdinaryOriginText(goal!), 'pressure origin goal should be player-visible');
  console.log('  ✓ ordinary origin currentGoal updates after pressure (P0)');
}

function testPostPressureCostLabel(): void {
  const state = makeState(38, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '人情债渐重', `pressure cost label should be 人情债渐重, got: ${label}`);
  assert(isPlayerVisibleSampleLineText(label), 'pressure cost label should be player-visible');
  console.log('  ✓ sample line cost label: 江湖声名之累 → 人情债渐重 (P0)');
}

function testPostPressureLifeMemory(): void {
  const flags = {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
  };
  const memory = deriveOrdinaryOriginLifeMemory(flags);
  assert(memory !== undefined, 'pressure life memory should exist');
  assert(memory.includes('人情'), `pressure memory should mention 人情, got: ${memory}`);
  assert(memory.includes('酒肆'), `pressure memory should preserve tavern flavor, got: ${memory}`);
  assert(isPlayerVisibleOrdinaryOriginText(memory!), 'pressure memory should be player-visible');
  console.log('  ✓ life memory updates after pressure with tavern-born flavor (P1)');
}

function testPostPressureOriginSummary(): void {
  const flags = {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
  };
  const summary = deriveOrdinaryOriginSummary(flags);
  assert(summary?.includes('江湖名宿'), `pressure summary should still be 江湖名宿, got: ${summary}`);
  assert(summary?.includes('人情债'), `pressure summary should mention 人情债, got: ${summary}`);
  assert(summary?.includes('酒肆出身'), `pressure summary should preserve tavern origin, got: ${summary}`);
  assert(isPlayerVisibleOrdinaryOriginText(summary!), 'pressure summary should be player-visible');
  console.log('  ✓ origin summary shows pressure state (名声越大，人情债越重) (P1)');
}

testPostPressureSampleLineCurrentGoal();
testPostPressureOrdinaryOriginCurrentGoal();
testPostPressureCostLabel();
testPostPressureLifeMemory();
testPostPressureOriginSummary();

console.log('\n4. Distinct from merchant pressure');

function testRenownPressureDistinctFromMerchantPressure(): void {
  const renownFlags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
  };
  const merchantFlags = {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
  };

  const renownSummary = deriveOrdinaryOriginSummary(renownFlags);
  const merchantSummary = deriveOrdinaryOriginSummary(merchantFlags);

  assert(renownSummary !== merchantSummary, 'renown and merchant pressure summaries should be distinct');
  assert(renownSummary?.includes('江湖名宿') || renownSummary?.includes('人情债'), `renown should be jianghu/favor-debt flavored, got: ${renownSummary}`);
  assert(merchantSummary?.includes('商人') || merchantSummary?.includes('商路'), `merchant should be business flavored, got: ${merchantSummary}`);
  console.log('  ✓ renown pressure distinct from merchant pressure across summary');
}

function testRenownPressureMemoryDistinctFromMerchant(): void {
  const renownFlags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
  };
  const merchantFlags = {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
  };

  const renownMemory = deriveOrdinaryOriginLifeMemory(renownFlags);
  const merchantMemory = deriveOrdinaryOriginLifeMemory(merchantFlags);

  assert(renownMemory !== merchantMemory, 'renown and merchant pressure memories should be distinct');
  console.log('  ✓ renown pressure memory distinct from merchant pressure memory');
}

testRenownPressureDistinctFromMerchantPressure();
testRenownPressureMemoryDistinctFromMerchant();

console.log('\n5. No regression of P71/P72/P73');

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
  assert(goal !== undefined && goal.length > 0, 'P72 entry goal should exist');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '江湖声名之累', `P72 entry cost label should still be 江湖声名之累, got: ${label}`);
  console.log('  ✓ P72 entry expression still works (no regression)');
}

function testP73OnRampStillWorks(): void {
  const state = makeState(33, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('主持公道'), `P73 on-ramp goal should still mention 主持公道, got: ${goal}`);
  const label = deriveSampleLineCostLabel(state);
  assert(label === '江湖声名之累', `P73 on-ramp cost label should still be 江湖声名之累, got: ${label}`);
  console.log('  ✓ P73 on-ramp expression still works (no regression)');
}

function testMerchantPressureUnchanged(): void {
  const flags = {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
  };
  const summary = deriveOrdinaryOriginSummary(flags);
  assert(summary?.includes('商人') || summary?.includes('商路'), `merchant pressure should still be business flavored, got: ${summary}`);
  console.log('  ✓ merchant pressure unchanged (no regression)');
}

testP71BridgeStillWorks();
testP72EntryStillWorks();
testP73OnRampStillWorks();
testMerchantPressureUnchanged();

console.log('\n✅ All P75 renown pressure spine tests passed');
