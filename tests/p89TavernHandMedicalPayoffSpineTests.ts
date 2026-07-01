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
    routeStates: {},
  } as GameState;
}

const compPayoffEvent = (sampleLinesSpine as SampleLineEvent[]).find(e => e.id === 'medical_payoff_compassionate');
const pragPayoffEvent = (sampleLinesSpine as SampleLineEvent[]).find(e => e.id === 'medical_payoff_pragmatic');

console.log('=== P89 Tavern Hand Medical Payoff Spine Tests ===\n');

console.log('1. Event wiring (Group 1)');

function testCompassionatePayoffEventExists(): void {
  assert(compPayoffEvent !== undefined, 'medical_payoff_compassionate event should exist');
  console.log('  ✓ compassionate payoff event exists');
}

function testPragmaticPayoffEventExists(): void {
  assert(pragPayoffEvent !== undefined, 'medical_payoff_pragmatic event should exist');
  console.log('  ✓ pragmatic payoff event exists');
}

function testBothEventsAreChoice(): void {
  assert(compPayoffEvent?.eventType === 'choice', 'compassionate payoff should be choice type');
  assert(pragPayoffEvent?.eventType === 'choice', 'pragmatic payoff should be choice type');
  console.log('  ✓ both payoff events are choice type');
}

function testBothEventsHaveThreeChoices(): void {
  assert(compPayoffEvent?.choices?.length === 3, `compassionate should have 3 choices, got ${compPayoffEvent?.choices?.length}`);
  assert(pragPayoffEvent?.choices?.length === 3, `pragmatic should have 3 choices, got ${pragPayoffEvent?.choices?.length}`);
  console.log('  ✓ both events have 3 choices each');
}

function testCompassionateAgeRange(): void {
  assert(compPayoffEvent?.ageRange?.min === 42, `compassionate min age should be 42, got ${compPayoffEvent?.ageRange?.min}`);
  assert(compPayoffEvent?.ageRange?.max === 46, `compassionate max age should be 46, got ${compPayoffEvent?.ageRange?.max}`);
  console.log('  ✓ compassionate payoff age range: 42-46');
}

function testPragmaticAgeRange(): void {
  assert(pragPayoffEvent?.ageRange?.min === 43, `pragmatic min age should be 43, got ${pragPayoffEvent?.ageRange?.min}`);
  assert(pragPayoffEvent?.ageRange?.max === 47, `pragmatic max age should be 47, got ${pragPayoffEvent?.ageRange?.max}`);
  console.log('  ✓ pragmatic payoff age range: 43-47');
}

function testCompassionateConditions(): void {
  const cond = compPayoffEvent?.conditions?.[0]?.expression || '';
  assert(cond.includes('medical_midlife_pressure_done'), 'compassionate needs pressure done');
  assert(cond.includes('tavern_medical_pressure_compassionate'), 'compassionate needs variant marker');
  assert(cond.includes('!flags.has') && cond.includes('medical_payoff_done'), 'compassionate has exclusivity guard');
  assert(cond.includes('!flags.has') && cond.includes('orthodox_childhood_seed_done'), 'compassionate excludes orthodox');
  assert(cond.includes('!flags.has') && cond.includes('demonic_childhood_seed_done'), 'compassionate excludes demonic');
  console.log('  ✓ compassionate payoff conditions correct');
}

function testPragmaticConditions(): void {
  const cond = pragPayoffEvent?.conditions?.[0]?.expression || '';
  assert(cond.includes('medical_midlife_pressure_done'), 'pragmatic needs pressure done');
  assert(cond.includes('tavern_medical_pressure_pragmatic'), 'pragmatic needs variant marker');
  assert(cond.includes('!flags.has') && cond.includes('medical_payoff_done'), 'pragmatic has exclusivity guard');
  assert(cond.includes('!flags.has') && cond.includes('orthodox_childhood_seed_done'), 'pragmatic excludes orthodox');
  assert(cond.includes('!flags.has') && cond.includes('demonic_childhood_seed_done'), 'pragmatic excludes demonic');
  console.log('  ✓ pragmatic payoff conditions correct');
}

function testBothSetSharedCheckpoint(): void {
  const compEffects = compPayoffEvent?.autoEffects || [];
  const pragEffects = pragPayoffEvent?.autoEffects || [];
  assert(compEffects.some((e: any) => e.type === 'flag_set' && e.target === 'medical_payoff_done'), 'compassionate sets shared checkpoint');
  assert(pragEffects.some((e: any) => e.type === 'flag_set' && e.target === 'medical_payoff_done'), 'pragmatic sets shared checkpoint');
  console.log('  ✓ both events set shared medical_payoff_done checkpoint');
}

function testBothSetAge40IdentityDone(): void {
  const compEffects = compPayoffEvent?.autoEffects || [];
  const pragEffects = pragPayoffEvent?.autoEffects || [];
  assert(compEffects.some((e: any) => e.type === 'flag_set' && e.target === 'medical_age40_identity_done'), 'compassionate sets age40 identity done');
  assert(pragEffects.some((e: any) => e.type === 'flag_set' && e.target === 'medical_age40_identity_done'), 'pragmatic sets age40 identity done');
  console.log('  ✓ both events set medical_age40_identity_done');
}

testCompassionatePayoffEventExists();
testPragmaticPayoffEventExists();
testBothEventsAreChoice();
testBothEventsHaveThreeChoices();
testCompassionateAgeRange();
testPragmaticAgeRange();
testCompassionateConditions();
testPragmaticConditions();
testBothSetSharedCheckpoint();
testBothSetAge40IdentityDone();

console.log('\n2. Pre-payoff state (Group 2)');

function testPrePayoffCompassionateCostLabel(): void {
  const state = makeState(41, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '仁心耗尽', `pre-payoff compassionate label should be 仁心耗尽, got: ${label}`);
  assert(!label.includes('油尽灯枯') && !label.includes('释然'), 'pre-payoff should not have payoff labels');
  console.log('  ✓ pre-payoff compassionate cost label: 仁心耗尽');
}

function testPrePayoffPragmaticCostLabel(): void {
  const state = makeState(42, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '人情债缠身', `pre-payoff pragmatic label should be 人情债缠身, got: ${label}`);
  assert(!label.includes('声名所累') && !label.includes('快意'), 'pre-payoff should not have payoff labels');
  console.log('  ✓ pre-payoff pragmatic cost label: 人情债缠身');
}

function testPrePayoffCompassionateGoal(): void {
  const state = makeState(41, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('仁心耗尽') || goal?.includes('撑着身子'), `pre-payoff compassionate goal should be pressure level, got: ${goal}`);
  console.log('  ✓ pre-payoff compassionate goal: pressure level');
}

function testPrePayoffPragmaticGoal(): void {
  const state = makeState(42, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('人情债') || goal?.includes('维持名声'), `pre-payoff pragmatic goal should be pressure level, got: ${goal}`);
  console.log('  ✓ pre-payoff pragmatic goal: pressure level');
}

testPrePayoffCompassionateCostLabel();
testPrePayoffPragmaticCostLabel();
testPrePayoffCompassionateGoal();
testPrePayoffPragmaticGoal();

console.log('\n3. Compassionate 3 choices post-payoff (Group 3)');

function makeCompassionatePayoffState(choiceFlag: string): GameState {
  return makeState(44, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
    medical_payoff_done: true,
    medical_age40_identity_done: true,
    [choiceFlag]: true,
  });
}

function testCompassionateHolderFlagsStatsCostGoal(): void {
  const state = makeCompassionatePayoffState('tavern_medical_payoff_compassionate_holder');
  const flags = state.flags ?? {};
  assert(flags.medical_payoff_done === true, 'payoff done flag set');
  assert(flags.tavern_medical_payoff_compassionate_holder === true, 'holder choice flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '油尽灯枯', `holder cost label should be 油尽灯枯, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('能多救一个是一个'), `holder goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  const choice = compPayoffEvent?.choices?.find(c => c.id === 'compassionate_holder');
  const effects = choice?.effects || [];
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation' && e.value === 2), 'holder: rep+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'constitution' && e.value === -2), 'holder: con-2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'chivalry' && e.value === 3), 'holder: chivalry+3');
  console.log('  ✓ compassionate A (holder): flags + stats + cost label + current goal');
}

function testCompassionateLetGoFlagsStatsCostGoal(): void {
  const state = makeCompassionatePayoffState('tavern_medical_payoff_compassionate_let_go');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_payoff_compassionate_let_go === true, 'let_go choice flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '释然行医', `let_go cost label should be 释然行医, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('量力而行'), `let_go goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  const choice = compPayoffEvent?.choices?.find(c => c.id === 'compassionate_let_go');
  const effects = choice?.effects || [];
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation' && e.value === -1), 'let_go: rep-1');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'constitution' && e.value === 2), 'let_go: con+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'charisma' && e.value === 1), 'let_go: charisma+1');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'chivalry' && e.value === -1), 'let_go: chivalry-1');
  console.log('  ✓ compassionate B (let_go): flags + stats + cost label + current goal');
}

function testCompassionateLegacyFlagsStatsCostGoal(): void {
  const state = makeCompassionatePayoffState('tavern_medical_payoff_compassionate_legacy');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_payoff_compassionate_legacy === true, 'legacy choice flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '仁心传承', `legacy cost label should be 仁心传承, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('传下去') || goal?.includes('仁心'), `legacy goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  const choice = compPayoffEvent?.choices?.find(c => c.id === 'compassionate_legacy');
  const effects = choice?.effects || [];
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation' && e.value === 1), 'legacy: rep+1');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'constitution' && e.value === 1), 'legacy: con+1');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'charisma' && e.value === 2), 'legacy: charisma+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'chivalry' && e.value === 1), 'legacy: chivalry+1');
  console.log('  ✓ compassionate C (legacy): flags + stats + cost label + current goal');
}

testCompassionateHolderFlagsStatsCostGoal();
testCompassionateLetGoFlagsStatsCostGoal();
testCompassionateLegacyFlagsStatsCostGoal();

console.log('\n4. Pragmatic 3 choices post-payoff (Group 4)');

function makePragmaticPayoffState(choiceFlag: string): GameState {
  return makeState(45, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
    medical_payoff_done: true,
    medical_age40_identity_done: true,
    [choiceFlag]: true,
  });
}

function testPragmaticHolderFlagsStatsCostGoal(): void {
  const state = makePragmaticPayoffState('tavern_medical_payoff_pragmatic_holder');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_payoff_pragmatic_holder === true, 'holder choice flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '声名所累', `holder cost label should be 声名所累, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('维持各方人情') || goal?.includes('权贵圈'), `holder goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  const choice = pragPayoffEvent?.choices?.find(c => c.id === 'pragmatic_holder');
  const effects = choice?.effects || [];
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation' && e.value === 4), 'holder: rep+4');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'connections' && e.value === 3), 'holder: connections+3');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'chivalry' && e.value === -2), 'holder: chivalry-2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'money' && e.value === 60), 'holder: money+60');
  console.log('  ✓ pragmatic A (holder): flags + stats + cost label + current goal');
}

function testPragmaticBreakerFlagsStatsCostGoal(): void {
  const state = makePragmaticPayoffState('tavern_medical_payoff_pragmatic_breaker');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_payoff_pragmatic_breaker === true, 'breaker choice flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '快意江湖', `breaker cost label should be 快意江湖, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('断了权贵') || goal?.includes('只给'), `breaker goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  const choice = pragPayoffEvent?.choices?.find(c => c.id === 'pragmatic_breaker');
  const effects = choice?.effects || [];
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation' && e.value === -3), 'breaker: rep-3');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'constitution' && e.value === 2), 'breaker: con+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'connections' && e.value === -5), 'breaker: connections-5');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'charisma' && e.value === -1), 'breaker: charisma-1');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'chivalry' && e.value === 1), 'breaker: chivalry+1');
  console.log('  ✓ pragmatic B (breaker): flags + stats + cost label + current goal');
}

function testPragmaticMasterFlagsStatsCostGoal(): void {
  const state = makePragmaticPayoffState('tavern_medical_payoff_pragmatic_master');
  const flags = state.flags ?? {};
  assert(flags.tavern_medical_payoff_pragmatic_master === true, 'master choice flag set');
  const label = deriveSampleLineCostLabel(state);
  assert(label === '人情练达', `master cost label should be 人情练达, got: ${label}`);
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('拿捏分寸') || goal?.includes('游刃有余'), `master goal should match, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  const choice = pragPayoffEvent?.choices?.find(c => c.id === 'pragmatic_master');
  const effects = choice?.effects || [];
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'reputation' && e.value === 2), 'master: rep+2');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'connections' && e.value === 1), 'master: connections+1');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'charisma' && e.value === 4), 'master: charisma+4');
  assert(effects.some((e: any) => e.type === 'stat_modify' && e.target === 'money' && e.value === 30), 'master: money+30');
  console.log('  ✓ pragmatic C (master): flags + stats + cost label + current goal');
}

testPragmaticHolderFlagsStatsCostGoal();
testPragmaticBreakerFlagsStatsCostGoal();
testPragmaticMasterFlagsStatsCostGoal();

console.log('\n5. Age-40 identity (Group 5: 6 branches)');

function testCompassionateHolderAge40Identity(): void {
  const state = makeCompassionatePayoffState('tavern_medical_payoff_compassionate_holder');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'holder age-40 identity should exist');
  assert(identity?.includes('油尽灯枯的仁心医者'), `holder identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ compassionate A: 油尽灯枯的仁心医者');
}

function testCompassionateLetGoAge40Identity(): void {
  const state = makeCompassionatePayoffState('tavern_medical_payoff_compassionate_let_go');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'let_go age-40 identity should exist');
  assert(identity?.includes('释然通透的医者'), `let_go identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ compassionate B: 释然通透的医者');
}

function testCompassionateLegacyAge40Identity(): void {
  const state = makeCompassionatePayoffState('tavern_medical_payoff_compassionate_legacy');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'legacy age-40 identity should exist');
  assert(identity?.includes('传道授业的仁医之师'), `legacy identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ compassionate C: 传道授业的仁医之师');
}

function testPragmaticHolderAge40Identity(): void {
  const state = makePragmaticPayoffState('tavern_medical_payoff_pragmatic_holder');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'holder age-40 identity should exist');
  assert(identity?.includes('声名赫赫的权贵御医'), `holder identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ pragmatic A: 声名赫赫的权贵御医');
}

function testPragmaticBreakerAge40Identity(): void {
  const state = makePragmaticPayoffState('tavern_medical_payoff_pragmatic_breaker');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'breaker age-40 identity should exist');
  assert(identity?.includes('快意恩仇的江湖游医'), `breaker identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ pragmatic B: 快意恩仇的江湖游医');
}

function testPragmaticMasterAge40Identity(): void {
  const state = makePragmaticPayoffState('tavern_medical_payoff_pragmatic_master');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity !== undefined, 'master age-40 identity should exist');
  assert(identity?.includes('人情练达的一代名医'), `master identity should match, got: ${identity}`);
  assert(identity?.includes('酒肆'), 'identity should have tavern flavor');
  console.log('  ✓ pragmatic C: 人情练达的一代名医');
}

testCompassionateHolderAge40Identity();
testCompassionateLetGoAge40Identity();
testCompassionateLegacyAge40Identity();
testPragmaticHolderAge40Identity();
testPragmaticBreakerAge40Identity();
testPragmaticMasterAge40Identity();

console.log('\n6. Two-variant differentiation (Group 6)');

function testTwoVariantsHaveDifferentCostLabels(): void {
  const compState = makeCompassionatePayoffState('tavern_medical_payoff_compassionate_holder');
  const pragState = makePragmaticPayoffState('tavern_medical_payoff_pragmatic_holder');
  const compLabel = deriveSampleLineCostLabel(compState);
  const pragLabel = deriveSampleLineCostLabel(pragState);
  assert(compLabel !== pragLabel, 'two variants should have different cost labels');
  assert(compLabel === '油尽灯枯', 'compassionate holder should be 油尽灯枯');
  assert(pragLabel === '声名所累', 'pragmatic holder should be 声名所累');
  console.log('  ✓ cost labels differ across variants (油尽灯枯 vs 声名所累)');
}

function testTwoVariantsHaveDifferentGoals(): void {
  const compState = makeCompassionatePayoffState('tavern_medical_payoff_compassionate_holder');
  const pragState = makePragmaticPayoffState('tavern_medical_payoff_pragmatic_holder');
  const compGoal = deriveSampleLineCurrentGoal(compState);
  const pragGoal = deriveSampleLineCurrentGoal(pragState);
  assert(compGoal !== pragGoal, 'two variants should have different goals');
  console.log('  ✓ current goals differ across variants');
}

function testTwoVariantsHaveDifferentAge40Identities(): void {
  const compState = makeCompassionatePayoffState('tavern_medical_payoff_compassionate_holder');
  const pragState = makePragmaticPayoffState('tavern_medical_payoff_pragmatic_holder');
  const compId = deriveSampleLineAge40Identity(compState);
  const pragId = deriveSampleLineAge40Identity(pragState);
  assert(compId !== pragId, 'two variants should have different age-40 identities');
  assert(compId?.includes('仁心医者'), 'compassionate has 仁心医者');
  assert(pragId?.includes('权贵御医'), 'pragmatic has 权贵御医');
  console.log('  ✓ age-40 identities differ across variants');
}

function testInwardVsOutwardDirection(): void {
  const compHolderChoice = compPayoffEvent?.choices?.find(c => c.id === 'compassionate_holder');
  const pragHolderChoice = pragPayoffEvent?.choices?.find(c => c.id === 'pragmatic_holder');
  const compEffects = compHolderChoice?.effects || [];
  const pragEffects = pragHolderChoice?.effects || [];
  const compHasConDown = compEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'constitution' && e.value < 0);
  const pragHasConnectionsUp = pragEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'connections' && e.value > 0);
  assert(compHasConDown, 'compassionate has constitution decrease (inward burnout)');
  assert(pragHasConnectionsUp, 'pragmatic has connections increase (outward entanglement)');
  console.log('  ✓ inward vs outward direction: constitution↓ vs connections↑');
}

testTwoVariantsHaveDifferentCostLabels();
testTwoVariantsHaveDifferentGoals();
testTwoVariantsHaveDifferentAge40Identities();
testInwardVsOutwardDirection();

console.log('\n7. Six-branch differentiation (Group 7)');

function testAllSixBranchesHaveDifferentCostLabels(): void {
  const labels = [
    deriveSampleLineCostLabel(makeCompassionatePayoffState('tavern_medical_payoff_compassionate_holder')),
    deriveSampleLineCostLabel(makeCompassionatePayoffState('tavern_medical_payoff_compassionate_let_go')),
    deriveSampleLineCostLabel(makeCompassionatePayoffState('tavern_medical_payoff_compassionate_legacy')),
    deriveSampleLineCostLabel(makePragmaticPayoffState('tavern_medical_payoff_pragmatic_holder')),
    deriveSampleLineCostLabel(makePragmaticPayoffState('tavern_medical_payoff_pragmatic_breaker')),
    deriveSampleLineCostLabel(makePragmaticPayoffState('tavern_medical_payoff_pragmatic_master')),
  ];
  const unique = new Set(labels);
  assert(unique.size === 6, `all 6 branches should have unique cost labels, got ${unique.size} unique: ${[...unique].join(', ')}`);
  console.log('  ✓ all 6 branches have unique cost labels');
}

function testAllSixBranchesHaveDifferentGoals(): void {
  const goals = [
    deriveSampleLineCurrentGoal(makeCompassionatePayoffState('tavern_medical_payoff_compassionate_holder')),
    deriveSampleLineCurrentGoal(makeCompassionatePayoffState('tavern_medical_payoff_compassionate_let_go')),
    deriveSampleLineCurrentGoal(makeCompassionatePayoffState('tavern_medical_payoff_compassionate_legacy')),
    deriveSampleLineCurrentGoal(makePragmaticPayoffState('tavern_medical_payoff_pragmatic_holder')),
    deriveSampleLineCurrentGoal(makePragmaticPayoffState('tavern_medical_payoff_pragmatic_breaker')),
    deriveSampleLineCurrentGoal(makePragmaticPayoffState('tavern_medical_payoff_pragmatic_master')),
  ];
  const unique = new Set(goals);
  assert(unique.size === 6, `all 6 branches should have unique goals, got ${unique.size} unique`);
  console.log('  ✓ all 6 branches have unique current goals');
}

function testAllSixBranchesHaveDifferentAge40Identities(): void {
  const identities = [
    deriveSampleLineAge40Identity(makeCompassionatePayoffState('tavern_medical_payoff_compassionate_holder')),
    deriveSampleLineAge40Identity(makeCompassionatePayoffState('tavern_medical_payoff_compassionate_let_go')),
    deriveSampleLineAge40Identity(makeCompassionatePayoffState('tavern_medical_payoff_compassionate_legacy')),
    deriveSampleLineAge40Identity(makePragmaticPayoffState('tavern_medical_payoff_pragmatic_holder')),
    deriveSampleLineAge40Identity(makePragmaticPayoffState('tavern_medical_payoff_pragmatic_breaker')),
    deriveSampleLineAge40Identity(makePragmaticPayoffState('tavern_medical_payoff_pragmatic_master')),
  ];
  const unique = new Set(identities);
  assert(unique.size === 6, `all 6 branches should have unique age-40 identities, got ${unique.size} unique`);
  console.log('  ✓ all 6 branches have unique age-40 identities');
}

testAllSixBranchesHaveDifferentCostLabels();
testAllSixBranchesHaveDifferentGoals();
testAllSixBranchesHaveDifferentAge40Identities();

console.log('\n8. Distinct from renown/merchant payoff (Group 8)');

function testMedicalPayoffDistinctFromRenownPayoff(): void {
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
  };
  const renFlags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    renown_midlife_payoff_done: true,
    tavern_renown_payoff_balancer: true,
  };
  const medSum = deriveOrdinaryOriginSummary(medFlags);
  const renSum = deriveOrdinaryOriginSummary(renFlags);
  assert(medSum !== renSum, 'medical and renown payoff summaries should be distinct');
  assert(medSum?.includes('医者') || medSum?.includes('仁心'), 'medical should be healer flavored');
  assert(renSum?.includes('江湖名宿'), 'renown should be jianghu flavored');
  console.log('  ✓ medical payoff distinct from renown payoff');
}

function testMedicalPayoffDistinctFromMerchantPayoff(): void {
  const medFlags = {
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
  };
  const merFlags = {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  };
  const medSum = deriveOrdinaryOriginSummary(medFlags);
  const merSum = deriveOrdinaryOriginSummary(merFlags);
  assert(medSum !== merSum, 'medical and merchant payoff summaries should be distinct');
  assert(medSum?.includes('医者') || medSum?.includes('人情'), 'medical should be healer/favor flavored');
  assert(merSum?.includes('商人') || merSum?.includes('商路'), 'merchant should be business flavored');
  console.log('  ✓ medical payoff distinct from merchant payoff');
}

function testCostLabelDifferentiationAcrossRoutes(): void {
  const medCompState = makeCompassionatePayoffState('tavern_medical_payoff_compassionate_holder');
  const renState = makeState(45, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    renown_midlife_payoff_done: true,
    tavern_renown_payoff_hard_holder: true,
  });
  const medLabel = deriveSampleLineCostLabel(medCompState);
  const renLabel = deriveSampleLineCostLabel(renState);
  assert(medLabel !== renLabel, 'medical and renown cost labels should be distinct');
  assert(medLabel === '油尽灯枯' || medLabel === '声名所累', 'medical label should be healer-specific');
  assert(renLabel === '声名之累' || renLabel === '快意恩仇', 'renown label should be jianghu-specific');
  console.log('  ✓ cost labels differ across routes');
}

testMedicalPayoffDistinctFromRenownPayoff();
testMedicalPayoffDistinctFromMerchantPayoff();
testCostLabelDifferentiationAcrossRoutes();

console.log('\n9. No regression of P83/P84/P85/P87 (Group 9)');

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

function testRenownPayoffUnchanged(): void {
  const flags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    renown_midlife_payoff_done: true,
    tavern_renown_payoff_balancer: true,
  };
  const summary = deriveOrdinaryOriginSummary(flags);
  assert(summary?.includes('江湖名宿') || summary?.includes('人情练达'), `renown payoff should still work, got: ${summary}`);
  console.log('  ✓ renown payoff unchanged (no cross-route regression)');
}

testP83BridgeStillWorks();
testP84EntryStillWorks();
testP85OnRampStillWorks();
testP87PressureStillWorks();
testRenownPayoffUnchanged();

console.log('\n✅ All P89 medical payoff spine tests passed');
