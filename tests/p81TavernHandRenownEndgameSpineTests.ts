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
      externalSkill: 10,
      internalSkill: 10,
      qinggong: 10,
      chivalry: 10,
      constitution: 50,
      comprehension: 30,
      sect: null,
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

const endgameEvents = (sampleLinesSpine as SampleLineEvent[]).filter(e => e.id.startsWith('renown_endgame_echo_'));
const sighEvent = (sampleLinesSpine as SampleLineEvent[]).find(e => e.id === 'renown_endgame_echo_sigh');
const distantEvent = (sampleLinesSpine as SampleLineEvent[]).find(e => e.id === 'renown_endgame_echo_distant');
const legacyEvent = (sampleLinesSpine as SampleLineEvent[]).find(e => e.id === 'renown_endgame_echo_legacy');

console.log('=== P81 Tavern Hand Renown Endgame Spine Tests ===\n');

console.log('1. Event wiring');

function testEndgameEventsExist(): void {
  assert(endgameEvents.length === 3, `should have 3 endgame echo events, got ${endgameEvents.length}`);
  const ids = endgameEvents.map(e => e.id);
  assert(ids.includes('renown_endgame_echo_sigh'), 'should have sigh variant event');
  assert(ids.includes('renown_endgame_echo_distant'), 'should have distant variant event');
  assert(ids.includes('renown_endgame_echo_legacy'), 'should have legacy variant event');
  console.log('  ✓ 3 endgame echo events exist (sigh / distant / legacy)');
}

function testEndgameEventsAreAuto(): void {
  assert(sighEvent?.eventType === 'auto', `sigh event should be auto type, got ${sighEvent?.eventType}`);
  assert(distantEvent?.eventType === 'auto', `distant event should be auto type, got ${distantEvent?.eventType}`);
  assert(legacyEvent?.eventType === 'auto', `legacy event should be auto type, got ${legacyEvent?.eventType}`);
  console.log('  ✓ all 3 endgame events are auto type (echo event, not player choice)');
}

function testEndgameEventAgeRange(): void {
  const events = [sighEvent, distantEvent, legacyEvent];
  const names = ['sigh', 'distant', 'legacy'];
  events.forEach((evt, i) => {
    assert(evt?.ageRange?.min === 60, `${names[i]} min age should be 60, got ${evt?.ageRange?.min}`);
    assert(evt?.ageRange?.max === 65, `${names[i]} max age should be 65, got ${evt?.ageRange?.max}`);
  });
  console.log('  ✓ endgame event age range is 60-65 (post-late-life, endgame stage)');
}

function testEndgameEventConditions(): void {
  const events = [sighEvent, distantEvent, legacyEvent];
  const markers = ['tavern_renown_late_burnout', 'tavern_renown_late_lone_wolf', 'tavern_renown_late_mentor'];
  const names = ['sigh', 'distant', 'legacy'];

  events.forEach((evt, i) => {
    const conditions = evt?.conditions ?? [];
    assert(conditions.length >= 1, `${names[i]} event should have conditions`);
    const expr = conditions[0]?.expression ?? '';
    assert(expr.includes('renown_late_life_done'), `${names[i]} condition should require renown_late_life_done`);
    assert(expr.includes('!flags.has') && expr.includes('renown_endgame_done'), `${names[i]} condition should have exclusivity guard`);
    assert(expr.includes(markers[i]), `${names[i]} condition should require ${markers[i]}`);
    assert(expr.includes('tavern_renown_bridge_crossed'), `${names[i]} condition should require tavern_renown_bridge_crossed`);
    assert(expr.includes('orthodox_childhood_seed_done'), `${names[i]} condition should exclude orthodox`);
    assert(expr.includes('demonic_childhood_seed_done'), `${names[i]} condition should exclude demonic`);
  });
  console.log('  ✓ all 3 endgame events have correct trigger conditions (late-life gate + exclusivity + branch marker + bridge + orthodox/demonic exclusion)');
}

function testEndgameNoStatChanges(): void {
  const events = [sighEvent, distantEvent, legacyEvent];
  events.forEach(evt => {
    const effects = evt?.autoEffects ?? [];
    const statEffects = effects.filter((e: { type: string }) => e.type === 'stat_modify');
    assert(statEffects.length === 0, `${evt?.id} should have NO stat changes (endgame is memory, not power)`);
  });
  console.log('  ✓ no stat changes in any endgame event (lightweight compliance — endgame is memory, not power)');
}

testEndgameEventsExist();
testEndgameEventsAreAuto();
testEndgameEventAgeRange();
testEndgameEventConditions();
testEndgameNoStatChanges();

console.log('\n2. Pre-endgame baseline (post-late-life, pre-endgame)');

function testPreEndgameDetectSampleLine(): void {
  const state = makeState(59, {
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
  const line = detectSampleLine(state.flags ?? {});
  assert(line === 'renown', `detectSampleLine should return 'renown', got ${line}`);
  console.log('  ✓ detectSampleLine returns renown at pre-endgame (post-late-life) state');
}

function testPreEndgameCostLabelIsLateLifeLevel(): void {
  const state = makeState(59, {
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
  assert(label === '传承授业', `pre-endgame cost label should be 传承授业 (late-life level), got: ${label}`);
  assert(!label.includes('身后名'), `pre-endgame cost label should NOT have endgame text, got: ${label}`);
  console.log('  ✓ pre-endgame cost label is late-life level (传承授业)');
}

testPreEndgameDetectSampleLine();
testPreEndgameCostLabelIsLateLifeLevel();

console.log('\n3. Variant A (Sigh / 叹) — post-endgame state');

function testVariantAFlags(): void {
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
    renown_endgame_done: true,
    renown_endgame_identity_done: true,
    tavern_renown_endgame_sigh: true,
  };
  assert(flags.renown_endgame_done === true, 'endgame done flag should be set');
  assert(flags.renown_endgame_identity_done === true, 'endgame identity done flag should be set');
  assert(flags.tavern_renown_endgame_sigh === true, 'sigh marker should be set');
  assert(flags.tavern_renown_endgame_distant === undefined, 'distant marker should NOT be set');
  assert(flags.tavern_renown_endgame_legacy === undefined, 'legacy marker should NOT be set');
  console.log('  ✓ Variant A flags: endgame_done + identity_done + sigh marker (exactly one branch)');
}

function testVariantACostLabel(): void {
  const state = makeState(62, {
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
    renown_endgame_done: true,
    renown_endgame_identity_done: true,
    tavern_renown_endgame_sigh: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '身后名·叹', `Variant A cost label should be 身后名·叹, got: ${label}`);
  assert(isPlayerVisibleSampleLineText(label), 'Variant A cost label should be player-visible');
  console.log('  ✓ Variant A cost label: 身后名·叹 (bittersweet — fame outlasts the person)');
}

function testVariantACurrentGoal(): void {
  const state = makeState(62, {
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
    renown_endgame_done: true,
    renown_endgame_identity_done: true,
    tavern_renown_endgame_sigh: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('听着自己成了传说'), `Variant A goal should mention 听着自己成了传说, got: ${goal}`);
  assert(goal?.includes('也算值了'), `Variant A goal should mention 也算值了, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'Variant A goal should be player-visible');
  console.log('  ✓ Variant A current goal: 听着自己成了传说，也算值了');
}

testVariantAFlags();
testVariantACostLabel();
testVariantACurrentGoal();

console.log('\n4. Variant B (Distant / 遥) — post-endgame state');

function testVariantBFlags(): void {
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
    renown_endgame_done: true,
    renown_endgame_identity_done: true,
    tavern_renown_endgame_distant: true,
  };
  assert(flags.renown_endgame_done === true, 'endgame done flag should be set');
  assert(flags.renown_endgame_identity_done === true, 'endgame identity done flag should be set');
  assert(flags.tavern_renown_endgame_distant === true, 'distant marker should be set');
  assert(flags.tavern_renown_endgame_sigh === undefined, 'sigh marker should NOT be set');
  assert(flags.tavern_renown_endgame_legacy === undefined, 'legacy marker should NOT be set');
  console.log('  ✓ Variant B flags: endgame_done + identity_done + distant marker (exactly one branch)');
}

function testVariantBCostLabel(): void {
  const state = makeState(62, {
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
    renown_endgame_done: true,
    renown_endgame_identity_done: true,
    tavern_renown_endgame_distant: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '身后名·遥', `Variant B cost label should be 身后名·遥, got: ${label}`);
  assert(isPlayerVisibleSampleLineText(label), 'Variant B cost label should be player-visible');
  console.log('  ✓ Variant B cost label: 身后名·遥 (mysterious — legend outstrips reality)');
}

function testVariantBCurrentGoal(): void {
  const state = makeState(62, {
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
    renown_endgame_done: true,
    renown_endgame_identity_done: true,
    tavern_renown_endgame_distant: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('传说真假') || goal?.includes('自己知道'), `Variant B goal should mention 传说真假/自己知道, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'Variant B goal should be player-visible');
  console.log('  ✓ Variant B current goal: 传说真假谁真谁假，自己知道就好');
}

testVariantBFlags();
testVariantBCostLabel();
testVariantBCurrentGoal();

console.log('\n5. Variant C (Legacy / 传) — post-endgame state');

function testVariantCFlags(): void {
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
    renown_endgame_done: true,
    renown_endgame_identity_done: true,
    tavern_renown_endgame_legacy: true,
  };
  assert(flags.renown_endgame_done === true, 'endgame done flag should be set');
  assert(flags.renown_endgame_identity_done === true, 'endgame identity done flag should be set');
  assert(flags.tavern_renown_endgame_legacy === true, 'legacy marker should be set');
  assert(flags.tavern_renown_endgame_sigh === undefined, 'sigh marker should NOT be set');
  assert(flags.tavern_renown_endgame_distant === undefined, 'distant marker should NOT be set');
  console.log('  ✓ Variant C flags: endgame_done + identity_done + legacy marker (exactly one branch)');
}

function testVariantCCostLabel(): void {
  const state = makeState(62, {
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
    renown_endgame_done: true,
    renown_endgame_identity_done: true,
    tavern_renown_endgame_legacy: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '身后名·传', `Variant C cost label should be 身后名·传, got: ${label}`);
  assert(isPlayerVisibleSampleLineText(label), 'Variant C cost label should be player-visible');
  console.log('  ✓ Variant C cost label: 身后名·传 (warm — wisdom passed down)');
}

function testVariantCCurrentGoal(): void {
  const state = makeState(62, {
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
    renown_endgame_done: true,
    renown_endgame_identity_done: true,
    tavern_renown_endgame_legacy: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('看着后辈们传下去') || goal?.includes('这就够了'), `Variant C goal should mention 看着后辈们传下去/这就够了, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'Variant C goal should be player-visible');
  console.log('  ✓ Variant C current goal: 看着后辈们传下去，这就够了');
}

testVariantCFlags();
testVariantCCostLabel();
testVariantCCurrentGoal();

console.log('\n6. No regression P71/P72/P73/P75/P77/P79');

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

function testP79LateLifeStillWorks(): void {
  const state = makeState(53, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    renown_midlife_payoff_done: true,
    renown_age40_identity_done: true,
    tavern_renown_payoff_balancer: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_mentor: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '传承授业', `P79 late-life cost label should still be 传承授业, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('指点后辈') && goal?.includes('传下去'), `P79 late-life goal should still be correct, got: ${goal}`);
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('德高望重的老前辈'), `P79 late-life identity should still work, got: ${identity}`);
  console.log('  ✓ P79 late-life expression still works (no regression)');
}

testP71BridgeStillWorks();
testP72EntryStillWorks();
testP73OnRampStillWorks();
testP75PressureStillWorks();
testP77PayoffStillWorks();
testP79LateLifeStillWorks();

console.log('\n7. Endgame identity verification');

function testVariantAEndgameIdentity(): void {
  const state = makeState(62, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_endgame_done: true,
    renown_endgame_identity_done: true,
    tavern_renown_endgame_sigh: true,
  });
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('熬干了的老传说'), `Variant A identity should mention 熬干了的老传说, got: ${identity}`);
  assert(identity?.includes('酒肆'), `Variant A identity should have tavern flavor, got: ${identity}`);
  assert(isPlayerVisibleSampleLineText(identity!), 'Variant A identity should be player-visible');
  console.log('  ✓ Variant A endgame identity: 熬干了的老传说');
}

function testVariantBEndgameIdentity(): void {
  const state = makeState(62, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_endgame_done: true,
    renown_endgame_identity_done: true,
    tavern_renown_endgame_distant: true,
  });
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('传说里的神秘人'), `Variant B identity should mention 传说里的神秘人, got: ${identity}`);
  assert(identity?.includes('三教九流') || identity?.includes('逍遥'), `Variant B identity should have tavern flavor, got: ${identity}`);
  assert(isPlayerVisibleSampleLineText(identity!), 'Variant B identity should be player-visible');
  console.log('  ✓ Variant B endgame identity: 传说里的神秘人');
}

function testVariantCEndgameIdentity(): void {
  const state = makeState(62, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_endgame_done: true,
    renown_endgame_identity_done: true,
    tavern_renown_endgame_legacy: true,
  });
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('活在传说里的老掌柜'), `Variant C identity should mention 活在传说里的老掌柜, got: ${identity}`);
  assert(identity?.includes('老掌柜') || identity?.includes('传承'), `Variant C identity should have tavern flavor, got: ${identity}`);
  assert(isPlayerVisibleSampleLineText(identity!), 'Variant C identity should be player-visible');
  console.log('  ✓ Variant C endgame identity: 活在传说里的老掌柜');
}

function testThreeEndgameIdentitiesMeaningfullyDifferent(): void {
  const stateA = makeState(62, { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_endgame_done: true, renown_endgame_identity_done: true, tavern_renown_endgame_sigh: true });
  const stateB = makeState(62, { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_endgame_done: true, renown_endgame_identity_done: true, tavern_renown_endgame_distant: true });
  const stateC = makeState(62, { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_endgame_done: true, renown_endgame_identity_done: true, tavern_renown_endgame_legacy: true });

  const idA = deriveSampleLineAge40Identity(stateA);
  const idB = deriveSampleLineAge40Identity(stateB);
  const idC = deriveSampleLineAge40Identity(stateC);

  assert(idA !== idB, 'Variant A and B identities should differ');
  assert(idB !== idC, 'Variant B and C identities should differ');
  assert(idA !== idC, 'Variant A and C identities should differ');
  console.log('  ✓ All three endgame identities are meaningfully different (not reskinned)');
}

testVariantAEndgameIdentity();
testVariantBEndgameIdentity();
testVariantCEndgameIdentity();
testThreeEndgameIdentitiesMeaningfullyDifferent();

console.log('\n8. Ordinary origin endgame expression (bonus verification)');

function testOrdinaryOriginEndgameCurrentGoal(): void {
  const flagsA = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_endgame_done: true, tavern_renown_endgame_sigh: true };
  const flagsB = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_endgame_done: true, tavern_renown_endgame_distant: true };
  const flagsC = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_endgame_done: true, tavern_renown_endgame_legacy: true };

  const goalA = deriveOrdinaryOriginCurrentGoal(makeState(62, flagsA));
  const goalB = deriveOrdinaryOriginCurrentGoal(makeState(62, flagsB));
  const goalC = deriveOrdinaryOriginCurrentGoal(makeState(62, flagsC));

  assert(goalA !== goalB && goalB !== goalC && goalA !== goalC, 'all three branch current goals should differ');
  assert(goalA?.includes('听着自己成了传说'), `Variant A ordinary goal should match sample line, got: ${goalA}`);
  assert(goalC?.includes('看着后辈们传下去'), `Variant C ordinary goal should match sample line, got: ${goalC}`);
  console.log('  ✓ ordinary origin endgame current goal: 3 branches, all different, matches sample line');
}

function testOrdinaryOriginEndgameLifeMemory(): void {
  const flagsA = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_endgame_done: true, tavern_renown_endgame_sigh: true };
  const flagsB = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_endgame_done: true, tavern_renown_endgame_distant: true };
  const flagsC = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_endgame_done: true, tavern_renown_endgame_legacy: true };

  const memA = deriveOrdinaryOriginLifeMemory(flagsA);
  const memB = deriveOrdinaryOriginLifeMemory(flagsB);
  const memC = deriveOrdinaryOriginLifeMemory(flagsC);

  assert(memA !== memB && memB !== memC && memA !== memC, 'all three branch life memories should differ');
  assert(memA?.includes('名声比人长久') || memA?.includes('老客人'), `Variant A memory should have sigh flavor, got: ${memA}`);
  assert(memB?.includes('逍遥翁') || memB?.includes('真假难辨'), `Variant B memory should have distant flavor, got: ${memB}`);
  assert(memC?.includes('老掌柜的规矩') || memC?.includes('传承'), `Variant C memory should have legacy flavor, got: ${memC}`);
  assert(isPlayerVisibleOrdinaryOriginText(memA!), 'Variant A memory should be player-visible');
  console.log('  ✓ ordinary origin endgame life memory: 3 branches, all different, tavern flavor preserved');
}

function testOrdinaryOriginEndgameSummary(): void {
  const flagsA = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_endgame_done: true, tavern_renown_endgame_sigh: true };
  const flagsB = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_endgame_done: true, tavern_renown_endgame_distant: true };
  const flagsC = { origin_tavern_hand: true, tavern_renown_bridge_crossed: true, renown_endgame_done: true, tavern_renown_endgame_legacy: true };

  const sumA = deriveOrdinaryOriginSummary(flagsA);
  const sumB = deriveOrdinaryOriginSummary(flagsB);
  const sumC = deriveOrdinaryOriginSummary(flagsC);

  assert(sumA !== sumB && sumB !== sumC && sumA !== sumC, 'all three branch summaries should differ');
  assert(sumA?.includes('身后名·叹'), `Variant A summary should mention 身后名·叹, got: ${sumA}`);
  assert(sumB?.includes('身后名·遥'), `Variant B summary should mention 身后名·遥, got: ${sumB}`);
  assert(sumC?.includes('身后名·传'), `Variant C summary should mention 身后名·传, got: ${sumC}`);
  assert(sumA?.includes('酒肆'), `Variant A summary should have tavern flavor, got: ${sumA}`);
  assert(isPlayerVisibleOrdinaryOriginText(sumA!), 'Variant A summary should be player-visible');
  console.log('  ✓ ordinary origin endgame summary: 3 branches, all different, tavern flavor preserved');
}

testOrdinaryOriginEndgameCurrentGoal();
testOrdinaryOriginEndgameLifeMemory();
testOrdinaryOriginEndgameSummary();

console.log('\n9. Endgame-first priority verification');

function testEndgameTakesPriorityOverLateLife(): void {
  const state = makeState(62, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_mentor: true,
    renown_endgame_done: true,
    renown_endgame_identity_done: true,
    tavern_renown_endgame_legacy: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '身后名·传', `when both late-life and endgame flags set, endgame should win (身后名·传), got: ${label}`);
  assert(label !== '传承授业', `endgame label should NOT be late-life label when both flags set`);
  console.log('  ✓ endgame takes priority over late-life (done-flag-first pattern)');
}

testEndgameTakesPriorityOverLateLife();

console.log('\n✅ All P81 renown endgame spine tests passed');
