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

const compPressureEvent = (sampleLinesSpine as SampleLineEvent[]).find(e => e.id === 'medical_pressure_compassionate');
const pragPressureEvent = (sampleLinesSpine as SampleLineEvent[]).find(e => e.id === 'medical_pressure_pragmatic');

console.log('=== P87 Tavern Hand Medical Pressure Spine Tests ===\n');

console.log('1. Event wiring (Group 1)');

function testCompassionatePressureEventExists(): void {
  assert(compPressureEvent !== undefined, 'medical_pressure_compassionate event should exist');
  console.log('  ✓ compassionate pressure event exists');
}

function testPragmaticPressureEventExists(): void {
  assert(pragPressureEvent !== undefined, 'medical_pressure_pragmatic event should exist');
  console.log('  ✓ pragmatic pressure event exists');
}

function testBothEventsAreAuto(): void {
  assert(compPressureEvent?.eventType === 'auto', 'compassionate should be auto');
  assert(pragPressureEvent?.eventType === 'auto', 'pragmatic should be auto');
  console.log('  ✓ both pressure events are auto type');
}

function testCompassionateAgeRange(): void {
  assert(compPressureEvent?.ageRange?.min === 36, `compassionate min age should be 36, got ${compPressureEvent?.ageRange?.min}`);
  assert(compPressureEvent?.ageRange?.max === 40, `compassionate max age should be 40, got ${compPressureEvent?.ageRange?.max}`);
  console.log('  ✓ compassionate pressure age range: 36-40');
}

function testPragmaticAgeRange(): void {
  assert(pragPressureEvent?.ageRange?.min === 37, `pragmatic min age should be 37, got ${pragPressureEvent?.ageRange?.min}`);
  assert(pragPressureEvent?.ageRange?.max === 41, `pragmatic max age should be 41, got ${pragPressureEvent?.ageRange?.max}`);
  console.log('  ✓ pragmatic pressure age range: 37-41');
}

function testCompassionateConditions(): void {
  const cond = compPressureEvent?.conditions?.[0]?.expression || '';
  assert(cond.includes('medical_on_ramp_done'), 'compassionate needs on-ramp done');
  assert(cond.includes('tavern_medical_on_ramp_compassionate'), 'compassionate needs variant marker');
  assert(cond.includes('!flags.has') && cond.includes('medical_midlife_pressure_done'), 'compassionate has exclusivity guard');
  assert(cond.includes('!flags.has') && cond.includes('orthodox_childhood_seed_done'), 'compassionate excludes orthodox');
  console.log('  ✓ compassionate pressure conditions correct');
}

function testPragmaticConditions(): void {
  const cond = pragPressureEvent?.conditions?.[0]?.expression || '';
  assert(cond.includes('medical_on_ramp_done'), 'pragmatic needs on-ramp done');
  assert(cond.includes('tavern_medical_on_ramp_pragmatic'), 'pragmatic needs variant marker');
  assert(cond.includes('!flags.has') && cond.includes('medical_midlife_pressure_done'), 'pragmatic has exclusivity guard');
  console.log('  ✓ pragmatic pressure conditions correct');
}

function testBothSetSharedCheckpoint(): void {
  const compEffects = compPressureEvent?.autoEffects || [];
  const pragEffects = pragPressureEvent?.autoEffects || [];
  assert(compEffects.some((e: any) => e.type === 'flag_set' && e.target === 'medical_midlife_pressure_done'), 'compassionate sets shared checkpoint');
  assert(pragEffects.some((e: any) => e.type === 'flag_set' && e.target === 'medical_midlife_pressure_done'), 'pragmatic sets shared checkpoint');
  console.log('  ✓ both events set shared medical_midlife_pressure_done checkpoint');
}

function testCompassionateVariantMarker(): void {
  const effects = compPressureEvent?.autoEffects || [];
  assert(effects.some((e: any) => e.type === 'flag_set' && e.target === 'tavern_medical_pressure_compassionate'), 'compassionate sets variant marker');
  console.log('  ✓ compassionate sets tavern_medical_pressure_compassionate marker');
}

function testPragmaticVariantMarker(): void {
  const effects = pragPressureEvent?.autoEffects || [];
  assert(effects.some((e: any) => e.type === 'flag_set' && e.target === 'tavern_medical_pressure_pragmatic'), 'pragmatic sets variant marker');
  console.log('  ✓ pragmatic sets tavern_medical_pressure_pragmatic marker');
}

testCompassionatePressureEventExists();
testPragmaticPressureEventExists();
testBothEventsAreAuto();
testCompassionateAgeRange();
testPragmaticAgeRange();
testCompassionateConditions();
testPragmaticConditions();
testBothSetSharedCheckpoint();
testCompassionateVariantMarker();
testPragmaticVariantMarker();

console.log('\n2. Pre-pressure state (Group 2)');

function testPrePressureCompassionateCostLabel(): void {
  const state = makeState(35, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '仁心之累', `pre-pressure compassionate label should be 仁心之累, got: ${label}`);
  assert(!label.includes('耗尽'), 'pre-pressure should not have 耗尽');
  console.log('  ✓ pre-pressure compassionate cost label: 仁心之累');
}

function testPrePressurePragmaticCostLabel(): void {
  const state = makeState(35, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '世故之秤', `pre-pressure pragmatic label should be 世故之秤, got: ${label}`);
  assert(!label.includes('缠身'), 'pre-pressure should not have 缠身');
  console.log('  ✓ pre-pressure pragmatic cost label: 世故之秤');
}

function testPrePressureCompassionateGoal(): void {
  const state = makeState(35, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('周边村子'), 'pre-pressure compassionate goal should mention 周边村子');
  assert(!goal?.includes('耗尽'), 'pre-pressure should not mention 耗尽');
  console.log('  ✓ pre-pressure compassionate goal: on-ramp level');
}

function testPrePressurePragmaticGoal(): void {
  const state = makeState(35, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('大户'), 'pre-pressure pragmatic goal should mention 大户');
  assert(!goal?.includes('缠身'), 'pre-pressure should not mention 缠身');
  console.log('  ✓ pre-pressure pragmatic goal: on-ramp level');
}

testPrePressureCompassionateCostLabel();
testPrePressurePragmaticCostLabel();
testPrePressureCompassionateGoal();
testPrePressurePragmaticGoal();

console.log('\n3. Post-pressure expression updates (Group 3: 6 P0 + 4 P1)');

function testPostPressureCompassionateSampleLineGoal(): void {
  const state = makeState(38, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('仁心耗尽') || goal?.includes('撑着身子'), `compassionate pressure goal should mention 仁心耗尽/撑着身子, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  console.log('  ✓ [P0] sample line compassionate goal updates after pressure');
}

function testPostPressurePragmaticSampleLineGoal(): void {
  const state = makeState(39, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('人情债') || goal?.includes('维持名声'), `pragmatic pressure goal should mention 人情债/维持名声, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'goal should be player-visible');
  console.log('  ✓ [P0] sample line pragmatic goal updates after pressure');
}

function testPostPressureCompassionateCostLabel(): void {
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
  assert(label === '仁心耗尽', `compassionate pressure label should be 仁心耗尽, got: ${label}`);
  console.log('  ✓ [P0] cost label: 仁心之累 → 仁心耗尽');
}

function testPostPressurePragmaticCostLabel(): void {
  const state = makeState(39, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '人情债缠身', `pragmatic pressure label should be 人情债缠身, got: ${label}`);
  console.log('  ✓ [P0] cost label: 世故之秤 → 人情债缠身');
}

function testPostPressureCompassionateOriginGoal(): void {
  const state = makeState(38, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(state);
  assert(goal?.includes('仁心') || goal?.includes('撑着身子'), `compassionate origin goal should have pressure flavor, got: ${goal}`);
  assert(isPlayerVisibleOrdinaryOriginText(goal!), 'goal should be player-visible');
  console.log('  ✓ [P0] ordinary origin compassionate goal updates');
}

function testPostPressurePragmaticOriginGoal(): void {
  const state = makeState(39, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
  });
  const goal = deriveOrdinaryOriginCurrentGoal(state);
  assert(goal?.includes('人情债') || goal?.includes('维持名声'), `pragmatic origin goal should have pressure flavor, got: ${goal}`);
  assert(isPlayerVisibleOrdinaryOriginText(goal!), 'goal should be player-visible');
  console.log('  ✓ [P0] ordinary origin pragmatic goal updates');
}

function testPostPressureCompassionateLifeMemory(): void {
  const flags = {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
  };
  const memory = deriveOrdinaryOriginLifeMemory(flags);
  assert(memory !== undefined, 'compassionate pressure memory should exist');
  assert(memory.includes('仁心') || memory.includes('老掌柜'), `compassionate memory should preserve tavern flavor, got: ${memory}`);
  assert(isPlayerVisibleOrdinaryOriginText(memory!), 'memory should be player-visible');
  console.log('  ✓ [P1] compassionate life memory updates');
}

function testPostPressurePragmaticLifeMemory(): void {
  const flags = {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
  };
  const memory = deriveOrdinaryOriginLifeMemory(flags);
  assert(memory !== undefined, 'pragmatic pressure memory should exist');
  assert(memory.includes('人情') || memory.includes('账'), `pragmatic memory should have favor-debt flavor, got: ${memory}`);
  assert(isPlayerVisibleOrdinaryOriginText(memory!), 'memory should be player-visible');
  console.log('  ✓ [P1] pragmatic life memory updates');
}

function testPostPressureCompassionateSummary(): void {
  const flags = {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
  };
  const summary = deriveOrdinaryOriginSummary(flags);
  assert(summary?.includes('仁心医者'), `compassionate summary should say 仁心医者, got: ${summary}`);
  assert(summary?.includes('耗尽') || summary?.includes('身子'), `compassionate summary should show pressure, got: ${summary}`);
  assert(isPlayerVisibleOrdinaryOriginText(summary!), 'summary should be player-visible');
  console.log('  ✓ [P1] compassionate summary shows pressure state');
}

function testPostPressurePragmaticSummary(): void {
  const flags = {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
  };
  const summary = deriveOrdinaryOriginSummary(flags);
  assert(summary?.includes('世故人医'), `pragmatic summary should say 世故人医, got: ${summary}`);
  assert(summary?.includes('人情债') || summary?.includes('缠'), `pragmatic summary should show pressure, got: ${summary}`);
  assert(isPlayerVisibleOrdinaryOriginText(summary!), 'summary should be player-visible');
  console.log('  ✓ [P1] pragmatic summary shows pressure state');
}

testPostPressureCompassionateSampleLineGoal();
testPostPressurePragmaticSampleLineGoal();
testPostPressureCompassionateCostLabel();
testPostPressurePragmaticCostLabel();
testPostPressureCompassionateOriginGoal();
testPostPressurePragmaticOriginGoal();
testPostPressureCompassionateLifeMemory();
testPostPressurePragmaticLifeMemory();
testPostPressureCompassionateSummary();
testPostPressurePragmaticSummary();

console.log('\n4. Variant differentiation (Group 4)');

function testTwoVariantsHaveDifferentCostLabels(): void {
  const compState = makeState(38, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
  });
  const pragState = makeState(39, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
  });
  const compLabel = deriveSampleLineCostLabel(compState);
  const pragLabel = deriveSampleLineCostLabel(pragState);
  assert(compLabel !== pragLabel, 'two variants should have different cost labels');
  assert(compLabel === '仁心耗尽', 'compassionate should be 仁心耗尽');
  assert(pragLabel === '人情债缠身', 'pragmatic should be 人情债缠身');
  console.log('  ✓ cost labels are different (仁心耗尽 vs 人情债缠身)');
}

function testTwoVariantsHaveDifferentGoals(): void {
  const compState = makeState(38, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
  });
  const pragState = makeState(39, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
  });
  const compGoal = deriveSampleLineCurrentGoal(compState);
  const pragGoal = deriveSampleLineCurrentGoal(pragState);
  assert(compGoal !== pragGoal, 'two variants should have different goals');
  console.log('  ✓ current goals are different between variants');
}

function testTwoVariantsHaveDifferentSummaries(): void {
  const compFlags = {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
  };
  const pragFlags = {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
  };
  const compSum = deriveOrdinaryOriginSummary(compFlags);
  const pragSum = deriveOrdinaryOriginSummary(pragFlags);
  assert(compSum !== pragSum, 'two variants should have different summaries');
  assert(compSum?.includes('仁心医者'), 'compassionate summary has 仁心医者');
  assert(pragSum?.includes('世故人医'), 'pragmatic summary has 世故人医');
  console.log('  ✓ summaries are different (仁心医者 vs 世故人医)');
}

function testInwardVsOutwardDirection(): void {
  const compEffects = compPressureEvent?.autoEffects || [];
  const pragEffects = pragPressureEvent?.autoEffects || [];
  const compHasConDown = compEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'constitution' && e.value < 0);
  const pragHasConnectionsUp = pragEffects.some((e: any) => e.type === 'stat_modify' && e.target === 'connections' && e.value > 0);
  assert(compHasConDown, 'compassionate has constitution decrease (inward burnout)');
  assert(pragHasConnectionsUp, 'pragmatic has connections increase (outward entanglement)');
  console.log('  ✓ inward vs outward direction: constitution↓ vs connections↑');
}

testTwoVariantsHaveDifferentCostLabels();
testTwoVariantsHaveDifferentGoals();
testTwoVariantsHaveDifferentSummaries();
testInwardVsOutwardDirection();

console.log('\n5. Cross-route distinction (Group 5)');

function testMedicalPressureDistinctFromRenownPressure(): void {
  const medFlags = {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
  };
  const renFlags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
  };
  const medSum = deriveOrdinaryOriginSummary(medFlags);
  const renSum = deriveOrdinaryOriginSummary(renFlags);
  assert(medSum !== renSum, 'medical and renown pressure summaries should be distinct');
  assert(medSum?.includes('仁心医者') || medSum?.includes('世故人医'), 'medical should be healer flavored');
  assert(renSum?.includes('江湖名宿'), 'renown should be jianghu flavored');
  console.log('  ✓ medical pressure distinct from renown pressure');
}

function testMedicalPressureDistinctFromMerchantPressure(): void {
  const medFlags = {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_pragmatic: true,
  };
  const merFlags = {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
  };
  const medSum = deriveOrdinaryOriginSummary(medFlags);
  const merSum = deriveOrdinaryOriginSummary(merFlags);
  assert(medSum !== merSum, 'medical and merchant pressure summaries should be distinct');
  assert(medSum?.includes('医者') || medSum?.includes('人情'), 'medical should be healer/favor flavored');
  assert(merSum?.includes('商人') || merSum?.includes('商路'), 'merchant should be business flavored');
  console.log('  ✓ medical pressure distinct from merchant pressure');
}

function testCostLabelDifferentiation(): void {
  const medCompState = makeState(38, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_compassionate_healer: true,
    tavern_medical_on_ramp_compassionate: true,
    medical_on_ramp_done: true,
    medical_midlife_pressure_done: true,
    tavern_medical_pressure_compassionate: true,
  });
  const renState = makeState(38, {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
  });
  const medLabel = deriveSampleLineCostLabel(medCompState);
  const renLabel = deriveSampleLineCostLabel(renState);
  assert(medLabel !== renLabel, 'medical and renown cost labels should be distinct');
  assert(medLabel === '仁心耗尽' || medLabel === '人情债缠身', 'medical label should be healer-specific');
  assert(renLabel === '人情债渐重', 'renown label should be jianghu-specific');
  console.log('  ✓ cost labels differ across routes');
}

testMedicalPressureDistinctFromRenownPressure();
testMedicalPressureDistinctFromMerchantPressure();
testCostLabelDifferentiation();

console.log('\n6. No regression of P83/P84/P85 (Group 6)');

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

function testP85PragmaticOnRampStillWorks(): void {
  const state = makeState(33, {
    origin_tavern_hand: true,
    tavern_medical_bridge_crossed: true,
    tavern_embrace_pragmatic_healer: true,
    tavern_medical_on_ramp_pragmatic: true,
    medical_on_ramp_done: true,
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('大户'), `P85 pragmatic on-ramp goal should still mention 大户, got: ${goal}`);
  console.log('  ✓ P85 pragmatic on-ramp still works');
}

function testRenownPressureUnchanged(): void {
  const flags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
  };
  const summary = deriveOrdinaryOriginSummary(flags);
  assert(summary?.includes('江湖名宿') || summary?.includes('人情债'), `renown pressure should still work, got: ${summary}`);
  console.log('  ✓ renown pressure unchanged (no cross-route regression');
}

testP83BridgeStillWorks();
testP84EntryStillWorks();
testP85OnRampStillWorks();
testP85PragmaticOnRampStillWorks();
testRenownPressureUnchanged();

console.log('\n✅ All P87 medical pressure spine tests passed');
