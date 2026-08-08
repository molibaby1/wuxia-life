import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  detectSampleLine,
  deriveSampleLineCurrentGoal,
  deriveSampleLineCostLabel,
  deriveSampleLineAge40Identity,
} from '../src/p50/sampleLineExpression';
import {
  deriveOrdinaryOriginCurrentGoal,
  deriveOrdinaryOriginLifeMemory,
  deriveOrdinaryOriginSummary,
  detectOrdinaryOrigin,
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

const allEvents = sampleLinesSpine as SampleLineEvent[];
const compEmberEvent = allEvents.find(e => e.id === 'medical_endgame_echo_compassionate_ember');
const compPeaceEvent = allEvents.find(e => e.id === 'medical_endgame_echo_compassionate_peace');
const compLegacyEvent = allEvents.find(e => e.id === 'medical_endgame_echo_compassionate_legacy');
const pragFameRemainEvent = allEvents.find(e => e.id === 'medical_endgame_echo_pragmatic_fame_remain');
const pragWandererLegendEvent = allEvents.find(e => e.id === 'medical_endgame_echo_pragmatic_wanderer_legend');
const pragGrandMasterEvent = allEvents.find(e => e.id === 'medical_endgame_echo_pragmatic_grand_master');

const endgameEvents = [
  compEmberEvent,
  compPeaceEvent,
  compLegacyEvent,
  pragFameRemainEvent,
  pragWandererLegendEvent,
  pragGrandMasterEvent,
];

console.log('=== P93 Tavern Hand Medical Endgame Spine Tests ===\n');

console.log('1. Event wiring (Group 1)');

function testAllSixEndgameEventsExist(): void {
  const ids = [
    'medical_endgame_echo_compassionate_ember',
    'medical_endgame_echo_compassionate_peace',
    'medical_endgame_echo_compassionate_legacy',
    'medical_endgame_echo_pragmatic_fame_remain',
    'medical_endgame_echo_pragmatic_wanderer_legend',
    'medical_endgame_echo_pragmatic_grand_master',
  ];
  for (const id of ids) {
    const event = allEvents.find(e => e.id === id);
    assert(event !== undefined, `${id} event should exist`);
  }
  console.log('  ✓ all 6 endgame events exist');
}

function testAllEventsAreAutoType(): void {
  for (const event of endgameEvents) {
    assert(event?.eventType === 'auto', `${event?.id} should be auto type`);
  }
  console.log('  ✓ all 6 events are auto type (echo event)');
}

function testAllEventsHaveAgeRange60To65(): void {
  for (const event of endgameEvents) {
    assert(event?.ageRange?.min === 60, `${event?.id} min age should be 60, got ${event?.ageRange?.min}`);
    assert(event?.ageRange?.max === 65, `${event?.id} max age should be 65, got ${event?.ageRange?.max}`);
  }
  console.log('  ✓ all 6 events have age range 60-65');
}

function testAllEventsHaveCorrectConditions(): void {
  for (const event of endgameEvents) {
    const cond = event?.conditions?.[0]?.expression || '';
    assert(cond.includes('medical_late_life_done'), `${event?.id} needs late-life done`);
    assert(cond.includes('!flags.has') && cond.includes('medical_endgame_echo_done'), `${event?.id} has exclusivity guard`);
    assert(cond.includes('!flags.has') && cond.includes('orthodox_childhood_seed_done'), `${event?.id} excludes orthodox`);
    assert(cond.includes('!flags.has') && cond.includes('demonic_childhood_seed_done'), `${event?.id} excludes demonic`);
    assert(cond.includes('tavern_medical_bridge_crossed'), `${event?.id} requires bridge crossed`);
  }
  console.log('  ✓ all 6 events have correct trigger conditions');
}

function testAllEventsSetSharedCheckpoint(): void {
  for (const event of endgameEvents) {
    const effects = event?.autoEffects || [];
    assert(effects.some((e: any) => e.type === 'flag_set' && e.target === 'medical_endgame_echo_done'), `${event?.id} sets medical_endgame_echo_done`);
    assert(effects.some((e: any) => e.type === 'flag_set' && e.target === 'medical_endgame_identity_done'), `${event?.id} sets medical_endgame_identity_done`);
  }
  console.log('  ✓ all 6 events set shared checkpoint + identity flag');
}

function testAllEventsRecordMedicalEndgameEcho(): void {
  for (const event of endgameEvents) {
    const effects = event?.autoEffects || [];
    assert(effects.some((e: any) => e.type === 'event_record' && e.target === 'medical_endgame_echo'), `${event?.id} records medical_endgame_echo`);
  }
  console.log('  ✓ all 6 events record medical_endgame_echo');
}

function testNoStatChangesInAnyEvent(): void {
  for (const event of endgameEvents) {
    const effects = event?.autoEffects || [];
    const statEffects = effects.filter((e: any) => e.type === 'stat_modify');
    assert(statEffects.length === 0, `${event?.id} should have NO stat_modify effects (lightweight compliant), got ${statEffects.length}`);
  }
  console.log('  ✓ no stat changes in any endgame event (lightweight compliant)');
}

testAllSixEndgameEventsExist();
testAllEventsAreAutoType();
testAllEventsHaveAgeRange60To65();
testAllEventsHaveCorrectConditions();
testAllEventsSetSharedCheckpoint();
testAllEventsRecordMedicalEndgameEcho();
testNoStatChangesInAnyEvent();

console.log('\n2. Pre-endgame baseline (Group 2)');

function makePreEndgameCompassionateState(): GameState {
  return makeState(59, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
    medical_payoff_done: true,
    medical_age40_identity_done: true,
    tavern_medical_payoff_compassionate_holder: true,
    medical_late_life_done: true,
    medical_late_life_identity_done: true,
    tavern_medical_late_compassionate_final: true,
  });
}

function makePreEndgamePragmaticState(): GameState {
  return makeState(59, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
    medical_payoff_done: true,
    medical_age40_identity_done: true,
    tavern_medical_payoff_pragmatic_master: true,
    medical_late_life_done: true,
    medical_late_life_identity_done: true,
    tavern_medical_late_pragmatic_master: true,
  });
}

function testPreEndgameCompassionateCostLabel(): void {
  const state = makePreEndgameCompassionateState();
  const label = deriveSampleLineCostLabel(state);
  assert(label === '最后仁心', `pre-endgame compassionate label should be 最后仁心, got: ${label}`);
  assert(!label.includes('仁心不灭') && !label.includes('医者从容'), 'pre-endgame should not have endgame labels');
  console.log('  ✓ pre-endgame compassionate cost label: 最后仁心 (late-life, not endgame)');
}

function testPreEndgamePragmaticCostLabel(): void {
  const state = makePreEndgamePragmaticState();
  const label = deriveSampleLineCostLabel(state);
  assert(label === '德高望重', `pre-endgame pragmatic label should be 德高望重, got: ${label}`);
  assert(!label.includes('一代宗师') && !label.includes('医名犹存'), 'pre-endgame should not have endgame labels');
  console.log('  ✓ pre-endgame pragmatic cost label: 德高望重 (late-life, not endgame)');
}

testPreEndgameCompassionateCostLabel();
testPreEndgamePragmaticCostLabel();

console.log('\n3. Comp-A post-endgame (Group 3: 仁心不灭·烬)');

function makeCompassionateEndgameState(branchFlag: string): GameState {
  return makeState(62, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
    medical_payoff_done: true,
    medical_age40_identity_done: true,
    tavern_medical_payoff_compassionate_holder: true,
    medical_late_life_done: true,
    medical_late_life_identity_done: true,
    tavern_medical_late_compassionate_final: true,
    medical_endgame_echo_done: true,
    medical_endgame_identity_done: true,
    [branchFlag]: true,
  });
}

function testCompAEmberFlagsCostGoal(): void {
  const state = makeCompassionateEndgameState('tavern_medical_endgame_compassionate_ember');
  const flags = state.flags ?? {};
  assert(flags.medical_endgame_echo_done === true, 'endgame done flag set');
  assert(flags.tavern_medical_endgame_compassionate_ember === true, 'ember branch flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '仁心不灭·烬', `Comp-A cost label should be 仁心不灭·烬, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('仁薪尽传') && goal?.includes('此生无憾'), `Comp-A goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  console.log('  ✓ Comp-A (仁心不灭·烬): flags + cost label + current goal');
}

function testCompAEmberIdentity(): void {
  const state = makeCompassionateEndgameState('tavern_medical_endgame_compassionate_ember');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'Comp-A endgame identity should exist');
  assert(identity?.includes('燃尽自己的点灯人'), `Comp-A identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ Comp-A identity: 燃尽自己的点灯人');
}

testCompAEmberFlagsCostGoal();
testCompAEmberIdentity();

console.log('\n4. Comp-B post-endgame (Group 4: 医者从容·淡)');

function testCompBPeaceFlagsCostGoal(): void {
  const state = makeCompassionateEndgameState('tavern_medical_endgame_compassionate_peace');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_endgame_compassionate_peace === true, 'peace branch flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '医者从容·淡', `Comp-B cost label should be 医者从容·淡, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('晒晒太阳看看病') && goal?.includes('从容了此一生'), `Comp-B goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  console.log('  ✓ Comp-B (医者从容·淡): flags + cost label + current goal');
}

function testCompBPeaceIdentity(): void {
  const state = makeCompassionateEndgameState('tavern_medical_endgame_compassionate_peace');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'Comp-B endgame identity should exist');
  assert(identity?.includes('从容淡然的老医者'), `Comp-B identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ Comp-B identity: 从容淡然的老医者');
}

testCompBPeaceFlagsCostGoal();
testCompBPeaceIdentity();

console.log('\n5. Comp-C post-endgame (Group 5: 仁心满天下·传)');

function testCompCLegacyFlagsCostGoal(): void {
  const state = makeCompassionateEndgameState('tavern_medical_endgame_compassionate_legacy');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_endgame_compassionate_legacy === true, 'legacy branch flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '仁心满天下·传', `Comp-C cost label should be 仁心满天下·传, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('看着仁心一辈辈传下去'), `Comp-C goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  console.log('  ✓ Comp-C (仁心满天下·传): flags + cost label + current goal');
}

function testCompCLegacyIdentity(): void {
  const state = makeCompassionateEndgameState('tavern_medical_endgame_compassionate_legacy');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'Comp-C endgame identity should exist');
  assert(identity?.includes('桃李满天下的仁医宗师'), `Comp-C identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ Comp-C identity: 桃李满天下的仁医宗师');
}

testCompCLegacyFlagsCostGoal();
testCompCLegacyIdentity();

console.log('\n6. Prag-A post-endgame (Group 6: 医名犹存·寂)');

function makePragmaticEndgameState(branchFlag: string): GameState {
  return makeState(62, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
    medical_payoff_done: true,
    medical_age40_identity_done: true,
    tavern_medical_payoff_pragmatic_fallen: true,
    medical_late_life_done: true,
    medical_late_life_identity_done: true,
    tavern_medical_late_pragmatic_fallen: true,
    medical_endgame_echo_done: true,
    medical_endgame_identity_done: true,
    [branchFlag]: true,
  });
}

function testPragAFameRemainFlagsCostGoal(): void {
  const state = makePragmaticEndgameState('tavern_medical_endgame_pragmatic_fame_remain');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_endgame_pragmatic_fame_remain === true, 'fame_remain branch flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '医名犹存·寂', `Prag-A cost label should be 医名犹存·寂, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('权势如烟云') && goal?.includes('医名自长久'), `Prag-A goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  console.log('  ✓ Prag-A (医名犹存·寂): flags + cost label + current goal');
}

function testPragAFameRemainIdentity(): void {
  const state = makePragmaticEndgameState('tavern_medical_endgame_pragmatic_fame_remain');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'Prag-A endgame identity should exist');
  assert(identity?.includes('失势但名存的老太医'), `Prag-A identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ Prag-A identity: 失势但名存的老太医');
}

testPragAFameRemainFlagsCostGoal();
testPragAFameRemainIdentity();

console.log('\n7. Prag-B post-endgame (Group 7: 江湖游医·遥)');

function testPragBWandererLegendFlagsCostGoal(): void {
  const state = makePragmaticEndgameState('tavern_medical_endgame_pragmatic_wanderer_legend');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_endgame_pragmatic_wanderer_legend === true, 'wanderer_legend branch flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '江湖游医·遥', `Prag-B cost label should be 江湖游医·遥, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('传说真假谁在乎') && goal?.includes('自在就好'), `Prag-B goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  console.log('  ✓ Prag-B (江湖游医·遥): flags + cost label + current goal');
}

function testPragBWandererLegendIdentity(): void {
  const state = makePragmaticEndgameState('tavern_medical_endgame_pragmatic_wanderer_legend');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'Prag-B endgame identity should exist');
  assert(identity?.includes('传说里的逍遥游医'), `Prag-B identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ Prag-B identity: 传说里的逍遥游医');
}

testPragBWandererLegendFlagsCostGoal();
testPragBWandererLegendIdentity();

console.log('\n8. Prag-C post-endgame (Group 8: 一代宗师·名)');

function makePragmaticMasterEndgameState(branchFlag: string): GameState {
  return makeState(62, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
    medical_payoff_done: true,
    medical_age40_identity_done: true,
    tavern_medical_payoff_pragmatic_master: true,
    medical_late_life_done: true,
    medical_late_life_identity_done: true,
    tavern_medical_late_pragmatic_master: true,
    medical_endgame_echo_done: true,
    medical_endgame_identity_done: true,
    [branchFlag]: true,
  });
}

function testPragCGrandMasterFlagsCostGoal(): void {
  const state = makePragmaticMasterEndgameState('tavern_medical_endgame_pragmatic_grand_master');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_endgame_pragmatic_grand_master === true, 'grand_master branch flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '一代宗师·名', `Prag-C cost label should be 一代宗师·名, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('看着这一世医名') && goal?.includes('守着这一份圆满'), `Prag-C goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  console.log('  ✓ Prag-C (一代宗师·名): flags + cost label + current goal');
}

function testPragCGrandMasterIdentity(): void {
  const state = makePragmaticMasterEndgameState('tavern_medical_endgame_pragmatic_grand_master');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'Prag-C endgame identity should exist');
  assert(identity?.includes('德高望重的一代宗师'), `Prag-C identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ Prag-C identity: 德高望重的一代宗师');
}

testPragCGrandMasterFlagsCostGoal();
testPragCGrandMasterIdentity();

console.log('\n9. No regression P83/P85/P87/P89/P91 (Group 9)');

function testP83BridgeStillWorks(): void {
  const state = makeState(28, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
  });
  const line = detectSampleLine(state.flags ?? {});
  assert(line === 'medical', `P83 bridge should still detect as medical, got ${line}`);
  console.log('  ✓ P83 bridge detection still works');
}

function testP85OnRampStillWorks(): void {
  const state = makeState(32, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('周边村子'), `P85 on-ramp goal should still mention 周边村子, got: ${goal}`);
  const label = deriveSampleLineCostLabel(state);
  assert(label === '仁心之累', `P85 on-ramp label should still be 仁心之累, got: ${label}`);
  console.log('  ✓ P85 on-ramp expression still works');
}

function testP87PressureStillWorks(): void {
  const state = makeState(38, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '仁心耗尽', `P87 pressure label should still be 仁心耗尽, got: ${label}`);
  const pragState = makeState(39, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
  });
  const pragLabel = deriveSampleLineCostLabel(pragState);
  assert(pragLabel === '人情债缠身', `P87 pragmatic pressure label should still be 人情债缠身, got: ${pragLabel}`);
  console.log('  ✓ P87 pressure expression still works');
}

function testP89PayoffStillWorks(): void {
  const state = makeState(44, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
    medical_payoff_done: true,
    medical_age40_identity_done: true,
    tavern_medical_payoff_compassionate_holder: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '油尽灯枯', `P89 payoff label should still be 油尽灯枯, got: ${label}`);
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('油尽灯枯的仁心医者'), `P89 payoff identity should still work, got: ${identity}`);
  console.log('  ✓ P89 payoff expression still works');
}

function testP91LateLifeStillWorks(): void {
  const state = makeState(55, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
    medical_payoff_done: true,
    medical_age40_identity_done: true,
    tavern_medical_payoff_compassionate_holder: true,
    medical_late_life_done: true,
    medical_late_life_identity_done: true,
    tavern_medical_late_compassionate_final: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '最后仁心', `P91 late-life label should still be 最后仁心, got: ${label}`);
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('燃尽自己的最后仁心'), `P91 late-life identity should still work, got: ${identity}`);
  console.log('  ✓ P91 late-life expression still works (no endgame flag → late-life shown)');
}

testP83BridgeStillWorks();
testP85OnRampStillWorks();
testP87PressureStillWorks();
testP89PayoffStillWorks();
testP91LateLifeStillWorks();

console.log('\n10. Endgame identity verification (Group 10)');

function testAllSixBranchesHaveDifferentCostLabels(): void {
  const labels = [
    deriveSampleLineCostLabel(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_ember')),
    deriveSampleLineCostLabel(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_peace')),
    deriveSampleLineCostLabel(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_legacy')),
    deriveSampleLineCostLabel(makePragmaticEndgameState('tavern_medical_endgame_pragmatic_fame_remain')),
    deriveSampleLineCostLabel(makePragmaticEndgameState('tavern_medical_endgame_pragmatic_wanderer_legend')),
    deriveSampleLineCostLabel(makePragmaticMasterEndgameState('tavern_medical_endgame_pragmatic_grand_master')),
  ];
  const unique = new Set(labels);
  assert(unique.size === 6, `all 6 branches should have unique cost labels, got ${unique.size} unique: ${[...unique].join(', ')}`);
  console.log('  ✓ all 6 branches have unique cost labels');
}

function testAllSixBranchesHaveDifferentGoals(): void {
  const goals = [
    deriveSampleLineCurrentGoal(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_ember')),
    deriveSampleLineCurrentGoal(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_peace')),
    deriveSampleLineCurrentGoal(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_legacy')),
    deriveSampleLineCurrentGoal(makePragmaticEndgameState('tavern_medical_endgame_pragmatic_fame_remain')),
    deriveSampleLineCurrentGoal(makePragmaticEndgameState('tavern_medical_endgame_pragmatic_wanderer_legend')),
    deriveSampleLineCurrentGoal(makePragmaticMasterEndgameState('tavern_medical_endgame_pragmatic_grand_master')),
  ];
  const unique = new Set(goals);
  assert(unique.size === 6, `all 6 branches should have unique current goals, got ${unique.size} unique`);
  console.log('  ✓ all 6 branches have unique current goals');
}

function testAllSixBranchesHaveDifferentIdentities(): void {
  const identities = [
    deriveSampleLineAge40Identity(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_ember')),
    deriveSampleLineAge40Identity(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_peace')),
    deriveSampleLineAge40Identity(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_legacy')),
    deriveSampleLineAge40Identity(makePragmaticEndgameState('tavern_medical_endgame_pragmatic_fame_remain')),
    deriveSampleLineAge40Identity(makePragmaticEndgameState('tavern_medical_endgame_pragmatic_wanderer_legend')),
    deriveSampleLineAge40Identity(makePragmaticMasterEndgameState('tavern_medical_endgame_pragmatic_grand_master')),
  ];
  const unique = new Set(identities);
  assert(unique.size === 6, `all 6 branches should have unique endgame identities, got ${unique.size} unique`);
  console.log('  ✓ all 6 branches have unique endgame identities');
}

function testTwoVariantsHaveDifferentAxes(): void {
  const compIdentity = deriveSampleLineAge40Identity(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_ember'));
  const pragIdentity = deriveSampleLineAge40Identity(makePragmaticEndgameState('tavern_medical_endgame_pragmatic_fame_remain'));
  assert(compIdentity !== pragIdentity, 'two variants should have different identities');
  assert(compIdentity?.includes('点灯人') || compIdentity?.includes('仁心'), 'compassionate has spiritual/healing legacy axis');
  assert(pragIdentity?.includes('老太医') || pragIdentity?.includes('医名') || pragIdentity?.includes('权势'), 'pragmatic has social/medical reputation axis');
  const compLabel = deriveSampleLineCostLabel(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_ember'));
  const pragLabel = deriveSampleLineCostLabel(makePragmaticEndgameState('tavern_medical_endgame_pragmatic_fame_remain'));
  assert(compLabel !== pragLabel, 'two variants should have different cost labels');
  console.log('  ✓ two variants have fundamentally different axes (spiritual/healing vs social/medical reputation)');
}

function testDoneFlagFirstPattern(): void {
  const stateWithBoth = makeState(62, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    medical_late_life_done: true,
    medical_late_life_identity_done: true,
    tavern_medical_late_compassionate_final: true,
    medical_endgame_echo_done: true,
    medical_endgame_identity_done: true,
    tavern_medical_endgame_compassionate_ember: true,
  });
  const label = deriveSampleLineCostLabel(stateWithBoth);
  assert(label === '仁心不灭·烬', `with both late-life and endgame flags, should show endgame label, got: ${label}`);
  assert(label !== '最后仁心', 'endgame should take priority over late-life');
  console.log('  ✓ done-flag-first pattern: endgame > late-life');
}

function testAllSixIdentitiesHaveTavernFlavor(): void {
  const identities = [
    deriveSampleLineAge40Identity(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_ember')),
    deriveSampleLineAge40Identity(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_peace')),
    deriveSampleLineAge40Identity(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_legacy')),
    deriveSampleLineAge40Identity(makePragmaticEndgameState('tavern_medical_endgame_pragmatic_fame_remain')),
    deriveSampleLineAge40Identity(makePragmaticEndgameState('tavern_medical_endgame_pragmatic_wanderer_legend')),
    deriveSampleLineAge40Identity(makePragmaticMasterEndgameState('tavern_medical_endgame_pragmatic_grand_master')),
  ];
  for (let i = 0; i < identities.length; i++) {
    const id = identities[i];
    const hasTavernAnchor = id?.includes('酒肆') || id?.includes('老掌柜');
    assert(hasTavernAnchor, `endgame identity ${i + 1} should have tavern flavor anchor (酒肆 or 老掌柜), got: ${id?.slice(0, 30)}`);
  }
  console.log('  ✓ all 6 endgame identities have tavern-born flavor anchors');
}

function testEndgameIdentityDeeperThanLateLife(): void {
  const endgameIdentity = deriveSampleLineAge40Identity(makeCompassionateEndgameState('tavern_medical_endgame_compassionate_ember'));
  const lateLifeState = makeState(55, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
    medical_payoff_done: true,
    medical_age40_identity_done: true,
    tavern_medical_payoff_compassionate_holder: true,
    medical_late_life_done: true,
    medical_late_life_identity_done: true,
    tavern_medical_late_compassionate_final: true,
  });
  const lateLifeIdentity = deriveSampleLineAge40Identity(lateLifeState);
  assert(endgameIdentity !== undefined, 'endgame identity should exist');
  assert(lateLifeIdentity !== undefined, 'late-life identity should exist');
  const endgameLen = (endgameIdentity || '').length;
  const lateLifeLen = (lateLifeIdentity || '').length;
  assert(endgameLen > lateLifeLen, `endgame identity should be deeper/longer than late-life identity, endgame=${endgameLen} chars vs late-life=${lateLifeLen} chars`);
  console.log('  ✓ endgame identity is deeper than late-life identity');
}

testAllSixBranchesHaveDifferentCostLabels();
testAllSixBranchesHaveDifferentGoals();
testAllSixBranchesHaveDifferentIdentities();
testTwoVariantsHaveDifferentAxes();
testDoneFlagFirstPattern();
testAllSixIdentitiesHaveTavernFlavor();
testEndgameIdentityDeeperThanLateLife();

console.log('\n=== All P93 tests passed ===');
