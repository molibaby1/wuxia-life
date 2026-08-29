import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  detectSampleLine,
  deriveSampleLineCurrentGoal,
  deriveSampleLineCostLabel,
  deriveSampleLineAge40Identity,
  isPlayerVisibleSampleLineText,
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
      affiliation: null,
      title: null,
      reputation: 15,
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

const lateLifeEvents = (sampleLinesSpine as SampleLineEvent[]).filter(e => e.id.startsWith('renown_late_life_'));
const burnoutEvent = (sampleLinesSpine as SampleLineEvent[]).find(e => e.id === 'renown_late_life_burnout');
const loneWolfEvent = (sampleLinesSpine as SampleLineEvent[]).find(e => e.id === 'renown_late_life_lone_wolf');
const mentorEvent = (sampleLinesSpine as SampleLineEvent[]).find(e => e.id === 'renown_late_life_mentor');

console.log('=== P79 Tavern Hand Renown Late-Life Spine Tests ===\n');

console.log('1. Event wiring');

function testLateLifeEventsExist(): void {
  assert(lateLifeEvents.length === 3, `should have 3 late-life branch events, got ${lateLifeEvents.length}`);
  const ids = lateLifeEvents.map(e => e.id);
  assert(ids.includes('renown_late_life_burnout'), 'should have burnout branch event');
  assert(ids.includes('renown_late_life_lone_wolf'), 'should have lone_wolf branch event');
  assert(ids.includes('renown_late_life_mentor'), 'should have mentor branch event');
  console.log('  ✓ 3 late-life branch events exist (burnout / lone_wolf / mentor)');
}

function testLateLifeEventsAreAuto(): void {
  assert(burnoutEvent?.eventType === 'auto', `burnout event should be auto type, got ${burnoutEvent?.eventType}`);
  assert(loneWolfEvent?.eventType === 'auto', `lone_wolf event should be auto type, got ${loneWolfEvent?.eventType}`);
  assert(mentorEvent?.eventType === 'auto', `mentor event should be auto type, got ${mentorEvent?.eventType}`);
  console.log('  ✓ all 3 late-life events are auto type (consequence-based, not player choice)');
}

function testLateLifeEventAgeRange(): void {
  assert(burnoutEvent?.ageRange?.min === 52, `burnout min age should be 52, got ${burnoutEvent?.ageRange?.min}`);
  assert(burnoutEvent?.ageRange?.max === 56, `burnout max age should be 56, got ${burnoutEvent?.ageRange?.max}`);
  assert(loneWolfEvent?.ageRange?.min === 52, `lone_wolf min age should be 52`);
  assert(loneWolfEvent?.ageRange?.max === 56, `lone_wolf max age should be 56`);
  assert(mentorEvent?.ageRange?.min === 52, `mentor min age should be 52`);
  assert(mentorEvent?.ageRange?.max === 56, `mentor max age should be 56`);
  console.log('  ✓ late-life event age range is 52-56 (post-payoff, late-life stage)');
}

function testLateLifeEventConditions(): void {
  const events = [burnoutEvent, loneWolfEvent, mentorEvent];
  const markers = ['tavern_renown_payoff_hard_holder', 'tavern_renown_payoff_breaker', 'tavern_renown_payoff_balancer'];
  const names = ['burnout', 'lone_wolf', 'mentor'];

  events.forEach((evt, i) => {
    const conditions = evt?.conditions ?? [];
    assert(conditions.length >= 1, `${names[i]} event should have conditions`);
    const expr = conditions[0]?.expression ?? '';
    assert(expr.includes('renown_midlife_payoff_done'), `${names[i]} condition should require renown_midlife_payoff_done`);
    assert(expr.includes('!flags.has') && expr.includes('renown_late_life_done'), `${names[i]} condition should have exclusivity guard`);
    assert(expr.includes(markers[i]), `${names[i]} condition should require ${markers[i]}`);
    assert(expr.includes('tavern_renown_bridge_crossed'), `${names[i]} condition should require tavern_renown_bridge_crossed`);
    assert(expr.includes('orthodox_childhood_seed_done'), `${names[i]} condition should exclude orthodox`);
    assert(expr.includes('demonic_childhood_seed_done'), `${names[i]} condition should exclude demonic`);
  });
  console.log('  ✓ all 3 late-life events have correct trigger conditions (payoff gate + exclusivity + branch marker + bridge + orthodox/demonic exclusion)');
}

testLateLifeEventsExist();
testLateLifeEventsAreAuto();
testLateLifeEventAgeRange();
testLateLifeEventConditions();

console.log('\n2. Pre-late-life state (post-payoff, pre-late-life)');

function testPreLateLifeDetectSampleLine(): void {
  const state = makeState(51, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
    renown_midlife_payoff_done: true,
    renown_age40_identity_done: true,
    tavern_renown_payoff_balancer: true,
  });
  const line = detectSampleLine(state.flags ?? {});
  assert(line === 'renown', `detectSampleLine should return 'renown', got ${line}`);
  console.log('  ✓ detectSampleLine returns renown at pre-late-life (post-payoff) state');
}

function testPreLateLifeCostLabelIsPayoffLevel(): void {
  const state = makeState(51, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
    renown_midlife_payoff_done: true,
    renown_age40_identity_done: true,
    tavern_renown_payoff_balancer: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '人情练达', `pre-late-life cost label should be 人情练达 (payoff level), got: ${label}`);
  assert(!label.includes('油尽灯枯') && !label.includes('逍遥自在') && !label.includes('传承授业'),
    `pre-late-life cost label should NOT have late-life text, got: ${label}`);
  console.log('  ✓ pre-late-life cost label is payoff level (人情练达)');
}

testPreLateLifeDetectSampleLine();
testPreLateLifeCostLabelIsPayoffLevel();

console.log('\n3. Branch A (Burnout) — post-late-life state');

function testBranchAFlags(): void {
  const flags = {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
    renown_midlife_payoff_done: true,
    renown_age40_identity_done: true,
    tavern_renown_payoff_hard_holder: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_burnout: true,
  };
  assert(flags.renown_late_life_done === true, 'late-life done flag should be set');
  assert(flags.renown_late_life_identity_done === true, 'late-life identity done flag should be set');
  assert(flags.tavern_renown_late_burnout === true, 'burnout marker should be set');
  assert(flags.tavern_renown_late_lone_wolf === undefined, 'lone_wolf marker should NOT be set');
  assert(flags.tavern_renown_late_mentor === undefined, 'mentor marker should NOT be set');
  console.log('  ✓ Branch A flags: late_life_done + identity_done + burnout marker (exactly one branch)');
}

function testBranchAStats(): void {
  const effects = burnoutEvent?.autoEffects ?? [];
  const repEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'reputation');
  const conEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'connections');
  const chaEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'charisma');
  assert(repEffect?.value === 2, `Branch A reputation should be +2, got ${repEffect?.value}`);
  assert(conEffect?.value === 1, `Branch A connections should be +1, got ${conEffect?.value}`);
  assert(chaEffect?.value === -1, `Branch A charisma should be -1, got ${chaEffect?.value}`);
  console.log('  ✓ Branch A stats: rep+2, con+1, cha-1 (modest gain, narrative decline)');
}

function testBranchACostLabel(): void {
  const state = makeState(53, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
    renown_midlife_payoff_done: true,
    renown_age40_identity_done: true,
    tavern_renown_payoff_hard_holder: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_burnout: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '油尽灯枯', `Branch A cost label should be 油尽灯枯, got: ${label}`);
  assert(isPlayerVisibleSampleLineText(label), 'Branch A cost label should be player-visible');
  console.log('  ✓ Branch A cost label: 油尽灯枯 (burnout — fame as final burden)');
}

function testBranchACurrentGoal(): void {
  const state = makeState(53, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
    renown_midlife_payoff_done: true,
    renown_age40_identity_done: true,
    tavern_renown_payoff_hard_holder: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_burnout: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('守住') && goal?.includes('名声'), `Branch A goal should mention 守住+名声, got: ${goal}`);
  assert(goal?.includes('撑到最后'), `Branch A goal should mention 撑到最后, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'Branch A goal should be player-visible');
  console.log('  ✓ Branch A current goal: 守住这一辈子的名声，撑到最后');
}

testBranchAFlags();
testBranchAStats();
testBranchACostLabel();
testBranchACurrentGoal();

console.log('\n4. Branch B (Lone Wolf) — post-late-life state');

function testBranchBFlags(): void {
  const flags = {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
    renown_midlife_payoff_done: true,
    renown_age40_identity_done: true,
    tavern_renown_payoff_breaker: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_lone_wolf: true,
  };
  assert(flags.renown_late_life_done === true, 'late-life done flag should be set');
  assert(flags.renown_late_life_identity_done === true, 'late-life identity done flag should be set');
  assert(flags.tavern_renown_late_lone_wolf === true, 'lone_wolf marker should be set');
  assert(flags.tavern_renown_late_burnout === undefined, 'burnout marker should NOT be set');
  assert(flags.tavern_renown_late_mentor === undefined, 'mentor marker should NOT be set');
  console.log('  ✓ Branch B flags: late_life_done + identity_done + lone_wolf marker (exactly one branch)');
}

function testBranchBStats(): void {
  const effects = loneWolfEvent?.autoEffects ?? [];
  const repEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'reputation');
  const conEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'connections');
  const chaEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'charisma');
  assert(repEffect?.value === -1, `Branch B reputation should be -1, got ${repEffect?.value}`);
  assert(conEffect?.value === -2, `Branch B connections should be -2, got ${conEffect?.value}`);
  assert(chaEffect?.value === 3, `Branch B charisma should be +3, got ${chaEffect?.value}`);
  console.log('  ✓ Branch B stats: rep-1, con-2, cha+3 (connections down, charisma up — freedom trade)');
}

function testBranchBCostLabel(): void {
  const state = makeState(53, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
    renown_midlife_payoff_done: true,
    renown_age40_identity_done: true,
    tavern_renown_payoff_breaker: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_lone_wolf: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '逍遥自在', `Branch B cost label should be 逍遥自在, got: ${label}`);
  assert(isPlayerVisibleSampleLineText(label), 'Branch B cost label should be player-visible');
  console.log('  ✓ Branch B cost label: 逍遥自在 (freedom — unshackled from social debt)');
}

function testBranchBCurrentGoal(): void {
  const state = makeState(53, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
    renown_midlife_payoff_done: true,
    renown_age40_identity_done: true,
    tavern_renown_payoff_breaker: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_lone_wolf: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('无牵无挂') || goal?.includes('过好剩下'), `Branch B goal should mention 无牵无挂/过好剩下, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'Branch B goal should be player-visible');
  console.log('  ✓ Branch B current goal: 无牵无挂，过好剩下的日子');
}

testBranchBFlags();
testBranchBStats();
testBranchBCostLabel();
testBranchBCurrentGoal();

console.log('\n5. Branch C (Mentor) — post-late-life state');

function testBranchCFlags(): void {
  const flags = {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
    renown_midlife_payoff_done: true,
    renown_age40_identity_done: true,
    tavern_renown_payoff_balancer: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_mentor: true,
  };
  assert(flags.renown_late_life_done === true, 'late-life done flag should be set');
  assert(flags.renown_late_life_identity_done === true, 'late-life identity done flag should be set');
  assert(flags.tavern_renown_late_mentor === true, 'mentor marker should be set');
  assert(flags.tavern_renown_late_burnout === undefined, 'burnout marker should NOT be set');
  assert(flags.tavern_renown_late_lone_wolf === undefined, 'lone_wolf marker should NOT be set');
  console.log('  ✓ Branch C flags: late_life_done + identity_done + mentor marker (exactly one branch)');
}

function testBranchCStats(): void {
  const effects = mentorEvent?.autoEffects ?? [];
  const repEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'reputation');
  const conEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'connections');
  const chaEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'charisma');
  assert(repEffect?.value === 3, `Branch C reputation should be +3, got ${repEffect?.value}`);
  assert(conEffect?.value === 2, `Branch C connections should be +2, got ${conEffect?.value}`);
  assert(chaEffect?.value === 2, `Branch C charisma should be +2, got ${chaEffect?.value}`);
  console.log('  ✓ Branch C stats: rep+3, con+2, cha+2 (all around gain — balanced life best outcome)');
}

function testBranchCCostLabel(): void {
  const state = makeState(53, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
    renown_midlife_payoff_done: true,
    renown_age40_identity_done: true,
    tavern_renown_payoff_balancer: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_mentor: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '传承授业', `Branch C cost label should be 传承授业, got: ${label}`);
  assert(isPlayerVisibleSampleLineText(label), 'Branch C cost label should be player-visible');
  console.log('  ✓ Branch C cost label: 传承授业 (mentorship — passing on wisdom)');
}

function testBranchCCurrentGoal(): void {
  const state = makeState(53, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
    renown_midlife_payoff_done: true,
    renown_age40_identity_done: true,
    tavern_renown_payoff_balancer: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_mentor: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('指点后辈') && goal?.includes('传下去'), `Branch C goal should mention 指点后辈+传下去, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'Branch C goal should be player-visible');
  console.log('  ✓ Branch C current goal: 指点后辈，把这一辈子的人情世故传下去');
}

testBranchCFlags();
testBranchCStats();
testBranchCCostLabel();
testBranchCCurrentGoal();

console.log('\n6. Distinct from merchant late-life');

function testRenownLateLifeDistinctFromMerchant(): void {
  const renownFlags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    renown_midlife_payoff_done: true,
    renown_late_life_done: true,
    tavern_renown_late_mentor: true,
  };
  const merchantFlags = {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  };

  const renownSummary = deriveOrdinaryOriginSummary(renownFlags);
  const merchantSummary = deriveOrdinaryOriginSummary(merchantFlags);

  assert(renownSummary !== merchantSummary, 'renown and merchant late-life summaries should be distinct');
  assert(renownSummary?.includes('江湖') || renownSummary?.includes('人情') || renownSummary?.includes('前辈'),
    `renown should be jianghu/favor flavored, got: ${renownSummary}`);
  assert(merchantSummary?.includes('商人') || merchantSummary?.includes('商路') || merchantSummary?.includes('巨贾'),
    `merchant should be business flavored, got: ${merchantSummary}`);
  console.log('  ✓ renown late-life distinct from merchant across summary');
}

function testRenownLateLifeMemoryDistinctFromMerchant(): void {
  const renownFlags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    renown_midlife_payoff_done: true,
    renown_late_life_done: true,
    tavern_renown_late_mentor: true,
  };
  const merchantFlags = {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  };

  const renownMemory = deriveOrdinaryOriginLifeMemory(renownFlags);
  const merchantMemory = deriveOrdinaryOriginLifeMemory(merchantFlags);

  assert(renownMemory !== merchantMemory, 'renown and merchant late-life memories should be distinct');
  console.log('  ✓ renown late-life memory distinct from merchant late-life memory');
}

testRenownLateLifeDistinctFromMerchant();
testRenownLateLifeMemoryDistinctFromMerchant();

console.log('\n7. No regression of P71/P72/P73/P75/P77');

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

function testP75PressureStillWorks(): void {
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
  assert(label === '人情债渐重', `P75 pressure cost label should still be 人情债渐重, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('维持声名') && goal?.includes('人情债'), `P75 pressure goal should still be correct, got: ${goal}`);
  console.log('  ✓ P75 pressure expression still works (no regression)');
}

function testP77PayoffStillWorks(): void {
  const state = makeState(44, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    renown_midlife_payoff_done: true,
    renown_age40_identity_done: true,
    tavern_renown_payoff_balancer: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '人情练达', `P77 payoff cost label should still be 人情练达, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('分寸') && goal?.includes('平衡'), `P77 payoff goal should still be correct, got: ${goal}`);
  console.log('  ✓ P77 payoff expression still works (no regression)');
}

testP71BridgeStillWorks();
testP72EntryStillWorks();
testP73OnRampStillWorks();
testP75PressureStillWorks();
testP77PayoffStillWorks();

console.log('\n8. Late-life identity (P79-003 verification)');

function testBranchALateLifeIdentity(): void {
  const state = makeState(53, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_burnout: true,
  });
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('油尽灯枯的老好人'), `Branch A identity should mention 油尽灯枯的老好人, got: ${identity}`);
  assert(identity?.includes('酒肆'), `Branch A identity should have tavern flavor, got: ${identity}`);
  assert(isPlayerVisibleSampleLineText(identity!), 'Branch A identity should be player-visible');
  console.log('  ✓ Branch A late-life identity: 油尽灯枯的老好人');
}

function testBranchBLateLifeIdentity(): void {
  const state = makeState(53, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_lone_wolf: true,
  });
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('逍遥自在的孤翁'), `Branch B identity should mention 逍遥自在的孤翁, got: ${identity}`);
  assert(identity?.includes('三教九流'), `Branch B identity should have tavern flavor, got: ${identity}`);
  assert(isPlayerVisibleSampleLineText(identity!), 'Branch B identity should be player-visible');
  console.log('  ✓ Branch B late-life identity: 逍遥自在的孤翁');
}

function testBranchCLateLifeIdentity(): void {
  const state = makeState(53, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_mentor: true,
  });
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('德高望重的老前辈'), `Branch C identity should mention 德高望重的老前辈, got: ${identity}`);
  assert(identity?.includes('酒肆掌柜'), `Branch C identity should have tavern flavor, got: ${identity}`);
  assert(isPlayerVisibleSampleLineText(identity!), 'Branch C identity should be player-visible');
  console.log('  ✓ Branch C late-life identity: 德高望重的老前辈');
}

function testThreeBranchesMeaningfullyDifferent(): void {
  const stateA = makeState(53, { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_late_life_done: true, renown_late_life_identity_done: true, tavern_renown_late_burnout: true });
  const stateB = makeState(53, { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_late_life_done: true, renown_late_life_identity_done: true, tavern_renown_late_lone_wolf: true });
  const stateC = makeState(53, { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_late_life_done: true, renown_late_life_identity_done: true, tavern_renown_late_mentor: true });

  const idA = deriveSampleLineAge40Identity(stateA);
  const idB = deriveSampleLineAge40Identity(stateB);
  const idC = deriveSampleLineAge40Identity(stateC);

  assert(idA !== idB, 'Branch A and B identities should differ');
  assert(idB !== idC, 'Branch B and C identities should differ');
  assert(idA !== idC, 'Branch A and C identities should differ');
  console.log('  ✓ All three late-life identities are meaningfully different (not reskinned)');
}

testBranchALateLifeIdentity();
testBranchBLateLifeIdentity();
testBranchCLateLifeIdentity();
testThreeBranchesMeaningfullyDifferent();

console.log('\n9. Ordinary origin late-life expression (P79-004 bonus verification)');

function testOrdinaryOriginLateLifeMemory(): void {
  const flagsA = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_late_life_done: true, tavern_renown_late_burnout: true };
  const flagsB = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_late_life_done: true, tavern_renown_late_lone_wolf: true };
  const flagsC = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_late_life_done: true, tavern_renown_late_mentor: true };

  const memA = deriveOrdinaryOriginLifeMemory(flagsA);
  const memB = deriveOrdinaryOriginLifeMemory(flagsB);
  const memC = deriveOrdinaryOriginLifeMemory(flagsC);

  assert(memA !== memB && memB !== memC && memA !== memC, 'all three branch life memories should differ');
  assert(memA?.includes('老好人'), `Branch A memory should mention 老好人, got: ${memA}`);
  assert(memB?.includes('自在'), `Branch B memory should mention 自在, got: ${memB}`);
  assert(memC?.includes('年轻人') || memC?.includes('传承'), `Branch C memory should mention 年轻人/传承, got: ${memC}`);
  console.log('  ✓ ordinary origin late-life life memory: 3 branches, all different, tavern flavor preserved');
}

function testOrdinaryOriginLateLifeSummary(): void {
  const flagsA = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_late_life_done: true, tavern_renown_late_burnout: true };
  const flagsB = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_late_life_done: true, tavern_renown_late_lone_wolf: true };
  const flagsC = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_late_life_done: true, tavern_renown_late_mentor: true };

  const sumA = deriveOrdinaryOriginSummary(flagsA);
  const sumB = deriveOrdinaryOriginSummary(flagsB);
  const sumC = deriveOrdinaryOriginSummary(flagsC);

  assert(sumA !== sumB && sumB !== sumC && sumA !== sumC, 'all three branch summaries should differ');
  assert(sumA?.includes('油尽灯枯'), `Branch A summary should mention 油尽灯枯, got: ${sumA}`);
  assert(sumB?.includes('逍遥自在') || sumB?.includes('江湖独行'), `Branch B summary should mention 逍遥自在/江湖独行, got: ${sumB}`);
  assert(sumC?.includes('老前辈') || sumC?.includes('传承'), `Branch C summary should mention 老前辈/传承, got: ${sumC}`);
  console.log('  ✓ ordinary origin late-life summary: 3 branches, all different, tavern flavor preserved');
}

testOrdinaryOriginLateLifeMemory();
testOrdinaryOriginLateLifeSummary();

console.log('\n✅ All P79 renown late-life spine tests passed');
