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

const allEvents = sampleLinesSpine as SampleLineEvent[];
const compFinalEvent = allEvents.find(e => e.id === 'medical_late_life_compassionate_final');
const compPeacefulEvent = allEvents.find(e => e.id === 'medical_late_life_compassionate_peaceful');
const compLegacyEvent = allEvents.find(e => e.id === 'medical_late_life_compassionate_legacy');
const pragFallenEvent = allEvents.find(e => e.id === 'medical_late_life_pragmatic_fallen');
const pragWandererEvent = allEvents.find(e => e.id === 'medical_late_life_pragmatic_wanderer');
const pragMasterEvent = allEvents.find(e => e.id === 'medical_late_life_pragmatic_master');

const lateLifeEvents = [
  compFinalEvent,
  compPeacefulEvent,
  compLegacyEvent,
  pragFallenEvent,
  pragWandererEvent,
  pragMasterEvent,
];

console.log('=== P91 Tavern Hand Medical Late-Life Spine Tests ===\n');

console.log('1. Event wiring (Group 1)');

function testAllSixLateLifeEventsExist(): void {
  const ids = [
    'medical_late_life_compassionate_final',
    'medical_late_life_compassionate_peaceful',
    'medical_late_life_compassionate_legacy',
    'medical_late_life_pragmatic_fallen',
    'medical_late_life_pragmatic_wanderer',
    'medical_late_life_pragmatic_master',
  ];
  for (const id of ids) {
    const event = allEvents.find(e => e.id === id);
    assert(event !== undefined, `${id} event should exist`);
  }
  console.log('  ✓ all 6 late-life events exist');
}

function testAllEventsAreAutoType(): void {
  for (const event of lateLifeEvents) {
    assert(event?.eventType === 'auto', `${event?.id} should be auto type`);
  }
  console.log('  ✓ all 6 events are auto type');
}

function testAllEventsHaveAgeRange52To56(): void {
  for (const event of lateLifeEvents) {
    assert(event?.ageRange?.min === 52, `${event?.id} min age should be 52, got ${event?.ageRange?.min}`);
    assert(event?.ageRange?.max === 56, `${event?.id} max age should be 56, got ${event?.ageRange?.max}`);
  }
  console.log('  ✓ all 6 events have age range 52-56');
}

function testAllEventsHaveCorrectConditions(): void {
  for (const event of lateLifeEvents) {
    const cond = event?.conditions?.[0]?.expression || '';
    assert(cond.includes('medical_payoff_done'), `${event?.id} needs payoff done`);
    assert(cond.includes('!flags.has') && cond.includes('medical_late_life_done'), `${event?.id} has exclusivity guard`);
    assert(cond.includes('!flags.has') && cond.includes('orthodox_childhood_seed_done'), `${event?.id} excludes orthodox`);
    assert(cond.includes('!flags.has') && cond.includes('demonic_childhood_seed_done'), `${event?.id} excludes demonic`);
    assert(cond.includes('tavern_medical_bridge_crossed'), `${event?.id} requires bridge crossed`);
  }
  console.log('  ✓ all 6 events have correct trigger conditions');
}

function testAllEventsSetSharedCheckpoint(): void {
  for (const event of lateLifeEvents) {
    const effects = event?.autoEffects || [];
    assert(effects.some((e: any) => e.type === 'flag_set' && e.target === 'medical_late_life_done'), `${event?.id} sets medical_late_life_done`);
    assert(effects.some((e: any) => e.type === 'flag_set' && e.target === 'medical_late_life_identity_done'), `${event?.id} sets medical_late_life_identity_done`);
  }
  console.log('  ✓ all 6 events set shared checkpoint + identity flag');
}

function testAllEventsSetCorrectBranchMarkers(): void {
  const markerMap: Record<string, string> = {
    'medical_late_life_compassionate_final': 'tavern_medical_late_compassionate_final',
    'medical_late_life_compassionate_peaceful': 'tavern_medical_late_compassionate_peaceful',
    'medical_late_life_compassionate_legacy': 'tavern_medical_late_compassionate_legacy',
    'medical_late_life_pragmatic_fallen': 'tavern_medical_late_pragmatic_fallen',
    'medical_late_life_pragmatic_wanderer': 'tavern_medical_late_pragmatic_wanderer',
    'medical_late_life_pragmatic_master': 'tavern_medical_late_pragmatic_master',
  };
  for (const event of lateLifeEvents) {
    const effects = event?.autoEffects || [];
    const expectedMarker = markerMap[event?.id || ''];
    assert(effects.some((e: any) => e.type === 'flag_set' && e.target === expectedMarker), `${event?.id} should set ${expectedMarker}`);
  }
  console.log('  ✓ all 6 events set correct branch markers');
}

function testAllEventsRecordMedicalLateLife(): void {
  for (const event of lateLifeEvents) {
    const effects = event?.autoEffects || [];
    assert(effects.some((e: any) => e.type === 'event_record' && e.target === 'medical_late_life'), `${event?.id} records medical_late_life`);
  }
  console.log('  ✓ all 6 events record medical_late_life');
}

testAllSixLateLifeEventsExist();
testAllEventsAreAutoType();
testAllEventsHaveAgeRange52To56();
testAllEventsHaveCorrectConditions();
testAllEventsSetSharedCheckpoint();
testAllEventsSetCorrectBranchMarkers();
testAllEventsRecordMedicalLateLife();

console.log('\n2. Pre-late-life state (Group 2)');

function makePreLateLifeCompassionateState(): GameState {
  return makeState(51, {
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
}

function makePreLateLifePragmaticState(): GameState {
  return makeState(51, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
    medical_payoff_done: true,
    medical_age40_identity_done: true,
    tavern_medical_payoff_pragmatic_holder: true,
  });
}

function testPreLateLifeCompassionateCostLabel(): void {
  const state = makePreLateLifeCompassionateState();
  const label = deriveSampleLineCostLabel(state);
  assert(label === '油尽灯枯', `pre-late-life compassionate label should be 油尽灯枯, got: ${label}`);
  assert(!label.includes('最后仁心') && !label.includes('从容自在'), 'pre-late-life should not have late-life labels');
  console.log('  ✓ pre-late-life compassionate cost label: 油尽灯枯');
}

function testPreLateLifePragmaticCostLabel(): void {
  const state = makePreLateLifePragmaticState();
  const label = deriveSampleLineCostLabel(state);
  assert(label === '声名所累', `pre-late-life pragmatic label should be 声名所累, got: ${label}`);
  assert(!label.includes('人走茶凉') && !label.includes('德高望重'), 'pre-late-life should not have late-life labels');
  console.log('  ✓ pre-late-life pragmatic cost label: 声名所累');
}

function testPreLateLifeCompassionateGoal(): void {
  const state = makePreLateLifeCompassionateState();
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('能多救一个是一个'), `pre-late-life compassionate goal should be payoff level, got: ${goal}`);
  console.log('  ✓ pre-late-life compassionate goal: payoff level');
}

function testPreLateLifePragmaticGoal(): void {
  const state = makePreLateLifePragmaticState();
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('维持各方人情'), `pre-late-life pragmatic goal should be payoff level, got: ${goal}`);
  console.log('  ✓ pre-late-life pragmatic goal: payoff level');
}

testPreLateLifeCompassionateCostLabel();
testPreLateLifePragmaticCostLabel();
testPreLateLifeCompassionateGoal();
testPreLateLifePragmaticGoal();

console.log('\n3. Compassionate 3 branches post-late-life (Group 3)');

function makeCompassionateLateLifeState(branchFlag: string): GameState {
  return makeState(53, {
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
    [branchFlag]: true,
  });
}

function testCompassionateFinalFlagsStatsCostGoal(): void {
  const state = makeCompassionateLateLifeState('tavern_medical_late_compassionate_final');
  const flags = state.flags ?? {};
  assert(flags.medical_late_life_done === true, 'late-life done flag set');
  assert(flags.tavern_medical_late_compassionate_final === true, 'final branch flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '最后仁心', `final cost label should be 最后仁心, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('撑到最后一刻'), `final goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  const effects = compFinalEvent?.autoEffects || [];
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'constitution' && e.value === -3), 'final: con-3');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'chivalry' && e.value === 3), 'final: chivalry+3');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation' && e.value === 2), 'final: rep+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'charisma' && e.value === 1), 'final: cha+1');
  console.log('  ✓ compassionate A (final): flags + stats + cost label + current goal');
}

function testCompassionatePeacefulFlagsStatsCostGoal(): void {
  const state = makeCompassionateLateLifeState('tavern_medical_late_compassionate_peaceful');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_late_compassionate_peaceful === true, 'peaceful branch flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '从容自在', `peaceful cost label should be 从容自在, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('晒晒太阳看看病'), `peaceful goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  const effects = compPeacefulEvent?.autoEffects || [];
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'constitution' && e.value === 2), 'peaceful: con+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'charisma' && e.value === 3), 'peaceful: cha+3');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'chivalry' && e.value === 1), 'peaceful: chivalry+1');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation' && e.value === 1), 'peaceful: rep+1');
  console.log('  ✓ compassionate B (peaceful): flags + stats + cost label + current goal');
}

function testCompassionateLegacyFlagsStatsCostGoal(): void {
  const state = makeCompassionateLateLifeState('tavern_medical_late_compassionate_legacy');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_late_compassionate_legacy === true, 'legacy branch flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '仁心传承', `legacy cost label should be 仁心传承, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('看着徒弟们成长') || goal?.includes('仁心传下去'), `legacy goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  const effects = compLegacyEvent?.autoEffects || [];
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation' && e.value === 4), 'legacy: rep+4');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'chivalry' && e.value === 2), 'legacy: chivalry+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'charisma' && e.value === 2), 'legacy: cha+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'connections' && e.value === 2), 'legacy: connections+2');
  console.log('  ✓ compassionate C (legacy): flags + stats + cost label + current goal');
}

testCompassionateFinalFlagsStatsCostGoal();
testCompassionatePeacefulFlagsStatsCostGoal();
testCompassionateLegacyFlagsStatsCostGoal();

console.log('\n4. Pragmatic 3 branches post-late-life (Group 4)');

function makePragmaticLateLifeState(branchFlag: string): GameState {
  return makeState(53, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
    medical_payoff_done: true,
    medical_age40_identity_done: true,
    tavern_medical_payoff_pragmatic_holder: true,
    medical_late_life_done: true,
    medical_late_life_identity_done: true,
    [branchFlag]: true,
  });
}

function testPragmaticFallenFlagsStatsCostGoal(): void {
  const state = makePragmaticLateLifeState('tavern_medical_late_pragmatic_fallen');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_late_pragmatic_fallen === true, 'fallen branch flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '人走茶凉', `fallen cost label should be 人走茶凉, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('看淡世态炎凉'), `fallen goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  const effects = pragFallenEvent?.autoEffects || [];
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation' && e.value === -3), 'fallen: rep-3');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'connections' && e.value === -4), 'fallen: connections-4');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'money' && e.value === -2), 'fallen: money-2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'charisma' && e.value === 2), 'fallen: cha+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'constitution' && e.value === 1), 'fallen: con+1');
  console.log('  ✓ pragmatic A (fallen): flags + stats + cost label + current goal');
}

function testPragmaticWandererFlagsStatsCostGoal(): void {
  const state = makePragmaticLateLifeState('tavern_medical_late_pragmatic_wanderer');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_late_pragmatic_wanderer === true, 'wanderer branch flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '逍遥自在', `wanderer cost label should be 逍遥自在, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('走到哪儿算哪儿') || goal?.includes('自在就好'), `wanderer goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  const effects = pragWandererEvent?.autoEffects || [];
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'constitution' && e.value === 2), 'wanderer: con+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'chivalry' && e.value === 2), 'wanderer: chivalry+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'charisma' && e.value === 2), 'wanderer: cha+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'connections' && e.value === -3), 'wanderer: connections-3');
  console.log('  ✓ pragmatic B (wanderer): flags + stats + cost label + current goal');
}

function testPragmaticMasterFlagsStatsCostGoal(): void {
  const state = makePragmaticLateLifeState('tavern_medical_late_pragmatic_master');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_late_pragmatic_master === true, 'master branch flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '德高望重', `master cost label should be 德高望重, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('看着这一世繁华') || goal?.includes('守着这一份体面'), `master goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  const effects = pragMasterEvent?.autoEffects || [];
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation' && e.value === 4), 'master: rep+4');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'connections' && e.value === 3), 'master: connections+3');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'charisma' && e.value === 3), 'master: cha+3');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'money' && e.value === 2), 'master: money+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'constitution' && e.value === 1), 'master: con+1');
  console.log('  ✓ pragmatic C (master): flags + stats + cost label + current goal');
}

testPragmaticFallenFlagsStatsCostGoal();
testPragmaticWandererFlagsStatsCostGoal();
testPragmaticMasterFlagsStatsCostGoal();

console.log('\n5. Late-life identity (Group 5: 6 branches, P0)');

function testCompassionateFinalLateLifeIdentity(): void {
  const state = makeCompassionateLateLifeState('tavern_medical_late_compassionate_final');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'final late-life identity should exist');
  assert(identity?.includes('燃尽自己的最后仁心'), `final identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ compassionate A: 燃尽自己的最后仁心');
}

function testCompassionatePeacefulLateLifeIdentity(): void {
  const state = makeCompassionateLateLifeState('tavern_medical_late_compassionate_peaceful');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'peaceful late-life identity should exist');
  assert(identity?.includes('从容自在的老者'), `peaceful identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ compassionate B: 从容自在的老者');
}

function testCompassionateLegacyLateLifeIdentity(): void {
  const state = makeCompassionateLateLifeState('tavern_medical_late_compassionate_legacy');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'legacy late-life identity should exist');
  assert(identity?.includes('仁心满天下的老宗师'), `legacy identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ compassionate C: 仁心满天下的老宗师');
}

function testPragmaticFallenLateLifeIdentity(): void {
  const state = makePragmaticLateLifeState('tavern_medical_late_pragmatic_fallen');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'fallen late-life identity should exist');
  assert(identity?.includes('失势的老御医'), `fallen identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ pragmatic A: 失势的老御医');
}

function testPragmaticWandererLateLifeIdentity(): void {
  const state = makePragmaticLateLifeState('tavern_medical_late_pragmatic_wanderer');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'wanderer late-life identity should exist');
  assert(identity?.includes('逍遥自在的老游医'), `wanderer identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ pragmatic B: 逍遥自在的老游医');
}

function testPragmaticMasterLateLifeIdentity(): void {
  const state = makePragmaticLateLifeState('tavern_medical_late_pragmatic_master');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'master late-life identity should exist');
  assert(identity?.includes('德高望重的老名医'), `master identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ pragmatic C: 德高望重的老名医');
}

testCompassionateFinalLateLifeIdentity();
testCompassionatePeacefulLateLifeIdentity();
testCompassionateLegacyLateLifeIdentity();
testPragmaticFallenLateLifeIdentity();
testPragmaticWandererLateLifeIdentity();
testPragmaticMasterLateLifeIdentity();

console.log('\n6. Two-variant differentiation (Group 6)');

function testTwoVariantsHaveDifferentCostLabels(): void {
  const compState = makeCompassionateLateLifeState('tavern_medical_late_compassionate_final');
  const pragState = makePragmaticLateLifeState('tavern_medical_late_pragmatic_fallen');
  const compLabel = deriveSampleLineCostLabel(compState);
  const pragLabel = deriveSampleLineCostLabel(pragState);
  assert(compLabel !== pragLabel, 'two variants should have different cost labels');
  assert(compLabel === '最后仁心', 'compassionate final should be 最后仁心');
  assert(pragLabel === '人走茶凉', 'pragmatic fallen should be 人走茶凉');
  console.log('  ✓ cost labels differ across variants (最后仁心 vs 人走茶凉)');
}

function testTwoVariantsHaveDifferentGoals(): void {
  const compState = makeCompassionateLateLifeState('tavern_medical_late_compassionate_final');
  const pragState = makePragmaticLateLifeState('tavern_medical_late_pragmatic_fallen');
  const compGoal = deriveSampleLineCurrentGoal(compState);
  const pragGoal = deriveSampleLineCurrentGoal(pragState);
  assert(compGoal !== pragGoal, 'two variants should have different goals');
  console.log('  ✓ current goals differ across variants');
}

function testTwoVariantsHaveDifferentIdentities(): void {
  const compState = makeCompassionateLateLifeState('tavern_medical_late_compassionate_final');
  const pragState = makePragmaticLateLifeState('tavern_medical_late_pragmatic_fallen');
  const compId = deriveSampleLineAge40Identity(compState);
  const pragId = deriveSampleLineAge40Identity(pragState);
  assert(compId !== pragId, 'two variants should have different late-life identities');
  assert(compId?.includes('最后仁心') || compId?.includes('燃尽自己'), 'compassionate has body/spirit focus');
  assert(pragId?.includes('失势的老御医') || pragId?.includes('世态炎凉'), 'pragmatic has social/position focus');
  console.log('  ✓ late-life identities differ across variants');
}

function testBodySpiritVsSocialPositionAxis(): void {
  const compFinalEffects = compFinalEvent?.autoEffects || [];
  const pragFallenEffects = pragFallenEvent?.autoEffects || [];
  const compHasConChange = compFinalEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'constitution');
  const compHasChivalryChange = compFinalEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'chivalry');
  const pragHasRepChange = pragFallenEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation');
  const pragHasConnectionsChange = pragFallenEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'connections');
  assert(compHasConChange && compHasChivalryChange, 'compassionate has body/spirit axis (constitution + chivalry)');
  assert(pragHasRepChange && pragHasConnectionsChange, 'pragmatic has social/position axis (reputation + connections)');
  console.log('  ✓ body/spirit vs social/position axis: compassionate≠pragmatic');
}

testTwoVariantsHaveDifferentCostLabels();
testTwoVariantsHaveDifferentGoals();
testTwoVariantsHaveDifferentIdentities();
testBodySpiritVsSocialPositionAxis();

console.log('\n7. Six-branch differentiation (Group 7)');

function testAllSixBranchesHaveDifferentCostLabels(): void {
  const labels = [
    deriveSampleLineCostLabel(makeCompassionateLateLifeState('tavern_medical_late_compassionate_final')),
    deriveSampleLineCostLabel(makeCompassionateLateLifeState('tavern_medical_late_compassionate_peaceful')),
    deriveSampleLineCostLabel(makeCompassionateLateLifeState('tavern_medical_late_compassionate_legacy')),
    deriveSampleLineCostLabel(makePragmaticLateLifeState('tavern_medical_late_pragmatic_fallen')),
    deriveSampleLineCostLabel(makePragmaticLateLifeState('tavern_medical_late_pragmatic_wanderer')),
    deriveSampleLineCostLabel(makePragmaticLateLifeState('tavern_medical_late_pragmatic_master')),
  ];
  const unique = new Set(labels);
  assert(unique.size === 6, `all 6 branches should have unique cost labels, got ${unique.size} unique: ${[...unique].join(', ')}`);
  console.log('  ✓ all 6 branches have unique cost labels');
}

function testAllSixBranchesHaveDifferentGoals(): void {
  const goals = [
    deriveSampleLineCurrentGoal(makeCompassionateLateLifeState('tavern_medical_late_compassionate_final')),
    deriveSampleLineCurrentGoal(makeCompassionateLateLifeState('tavern_medical_late_compassionate_peaceful')),
    deriveSampleLineCurrentGoal(makeCompassionateLateLifeState('tavern_medical_late_compassionate_legacy')),
    deriveSampleLineCurrentGoal(makePragmaticLateLifeState('tavern_medical_late_pragmatic_fallen')),
    deriveSampleLineCurrentGoal(makePragmaticLateLifeState('tavern_medical_late_pragmatic_wanderer')),
    deriveSampleLineCurrentGoal(makePragmaticLateLifeState('tavern_medical_late_pragmatic_master')),
  ];
  const unique = new Set(goals);
  assert(unique.size === 6, `all 6 branches should have unique current goals, got ${unique.size} unique`);
  console.log('  ✓ all 6 branches have unique current goals');
}

function testAllSixBranchesHaveDifferentIdentities(): void {
  const identities = [
    deriveSampleLineAge40Identity(makeCompassionateLateLifeState('tavern_medical_late_compassionate_final')),
    deriveSampleLineAge40Identity(makeCompassionateLateLifeState('tavern_medical_late_compassionate_peaceful')),
    deriveSampleLineAge40Identity(makeCompassionateLateLifeState('tavern_medical_late_compassionate_legacy')),
    deriveSampleLineAge40Identity(makePragmaticLateLifeState('tavern_medical_late_pragmatic_fallen')),
    deriveSampleLineAge40Identity(makePragmaticLateLifeState('tavern_medical_late_pragmatic_wanderer')),
    deriveSampleLineAge40Identity(makePragmaticLateLifeState('tavern_medical_late_pragmatic_master')),
  ];
  const unique = new Set(identities);
  assert(unique.size === 6, `all 6 branches should have unique late-life identities, got ${unique.size} unique`);
  console.log('  ✓ all 6 branches have unique late-life identities');
}

testAllSixBranchesHaveDifferentCostLabels();
testAllSixBranchesHaveDifferentGoals();
testAllSixBranchesHaveDifferentIdentities();

console.log('\n8. Distinct from renown late-life (Group 8)');

function testMedicalLateLifeDistinctFromRenownLateLife(): void {
  const medFlags = {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
    medical_payoff_done: true,
    medical_age40_identity_done: true,
    tavern_medical_payoff_compassionate_legacy: true,
    medical_late_life_done: true,
    medical_late_life_identity_done: true,
    tavern_medical_late_compassionate_legacy: true,
  };
  const renFlags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    renown_midlife_payoff_done: true,
    tavern_renown_payoff_balancer: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_mentor: true,
  };
  const medSum = deriveOrdinaryOriginSummary(medFlags);
  const renSum = deriveOrdinaryOriginSummary(renFlags);
  assert(medSum !== renSum, 'medical and renown late-life summaries should be distinct');
  assert(medSum?.includes('医者') || medSum?.includes('仁心') || medSum?.includes('名医'), 'medical should be healer flavored');
  assert(renSum?.includes('江湖名宿') || renSum?.includes('老前辈'), 'renown should be jianghu networker flavored');
  console.log('  ✓ medical late-life distinct from renown late-life (healer vs jianghu networker)');
}

function testCostLabelDifferentiationAcrossRoutes(): void {
  const medState = makeCompassionateLateLifeState('tavern_medical_late_compassionate_legacy');
  const renState = makeState(53, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    renown_midlife_payoff_done: true,
    tavern_renown_payoff_balancer: true,
    renown_late_life_done: true,
    tavern_renown_late_mentor: true,
  });
  const medLabel = deriveSampleLineCostLabel(medState);
  const renLabel = deriveSampleLineCostLabel(renState);
  assert(medLabel !== renLabel, 'medical and renown cost labels should be distinct');
  assert(medLabel === '仁心传承' || medLabel === '最后仁心', 'medical label should be healer-specific');
  assert(renLabel === '传承授业' || renLabel === '油尽灯枯', 'renown label should be jianghu-specific');
  console.log('  ✓ cost labels differ across routes (medical vs renown)');
}

testMedicalLateLifeDistinctFromRenownLateLife();
testCostLabelDifferentiationAcrossRoutes();

console.log('\n9. No regression of P83/P84/P85/P87/P89 (Group 9)');

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

function testP84EntryStillWorks(): void {
  const state = makeState(29, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '仁心之累', `P84 entry compassionate label should be 仁心之累, got: ${label}`);
  const pragState = makeState(29, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
  });
  const pragLabel = deriveSampleLineCostLabel(pragState);
  assert(pragLabel === '世故之秤', `P84 entry pragmatic label should be 世故之秤, got: ${pragLabel}`);
  console.log('  ✓ P84 entry expression still works');
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
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('仁心耗尽') || goal?.includes('撑着身子'), `P87 pressure goal should still work, got: ${goal}`);
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

function testRenownLateLifeUnchanged(): void {
  const flags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    renown_midlife_payoff_done: true,
    tavern_renown_payoff_balancer: true,
    renown_late_life_done: true,
    renown_late_life_identity_done: true,
    tavern_renown_late_mentor: true,
  };
  const summary = deriveOrdinaryOriginSummary(flags);
  assert(summary?.includes('江湖名宿') || summary?.includes('老前辈'), `renown late-life should still work, got: ${summary}`);
  console.log('  ✓ renown late-life unchanged (no cross-route regression)');
}

testP83BridgeStillWorks();
testP84EntryStillWorks();
testP85OnRampStillWorks();
testP87PressureStillWorks();
testP89PayoffStillWorks();
testRenownLateLifeUnchanged();

console.log('\n✅ All P91 medical late-life spine tests passed');
