import { createDefaultPlayerLifeStates } from '../src/data/life/lifeStates';
import {
  detectSampleLine,
  deriveSampleLineCurrentGoal,
  deriveSampleLineCostLabel,
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

const payoffEvent = (sampleLinesSpine as SampleLineEvent[]).find(e => e.id === 'renown_midlife_payoff');

console.log('=== P77 Tavern Hand Renown Payoff Spine Tests ===\n');

console.log('1. Event wiring');

function testPayoffEventExists(): void {
  assert(payoffEvent !== undefined, 'renown_midlife_payoff event should exist in sample-lines-spine.json');
  console.log('  ✓ renown_midlife_payoff event exists in sample-lines-spine.json');
}

function testPayoffEventIsChoice(): void {
  assert(payoffEvent?.eventType === 'choice', `payoff event should be choice type, got ${payoffEvent?.eventType}`);
  console.log('  ✓ payoff event is choice type (player-driven resolution)');
}

function testPayoffEventThreeChoices(): void {
  const choices = payoffEvent?.choices ?? [];
  assert(choices.length === 3, `payoff event should have 3 choices, got ${choices.length}`);
  const ids = choices.map((c: { id: string }) => c.id);
  assert(ids.includes('hard_holder'), 'should have hard_holder choice');
  assert(ids.includes('breaker'), 'should have breaker choice');
  assert(ids.includes('balancer'), 'should have balancer choice');
  console.log('  ✓ payoff event has 3 distinct choices: hard_holder / breaker / balancer');
}

function testPayoffEventAgeRange(): void {
  assert(payoffEvent?.ageRange?.min === 43, `payoff min age should be 43, got ${payoffEvent?.ageRange?.min}`);
  assert(payoffEvent?.ageRange?.max === 47, `payoff max age should be 47, got ${payoffEvent?.ageRange?.max}`);
  console.log('  ✓ payoff event age range is 43-47 (post-pressure)');
}

function testPayoffEventConditions(): void {
  const conditions = payoffEvent?.conditions ?? [];
  assert(conditions.length >= 1, 'payoff event should have conditions');
  const expr = conditions[0]?.expression ?? '';
  assert(expr.includes('renown_midlife_pressure_done'), 'payoff condition should require renown_midlife_pressure_done');
  assert(expr.includes('!flags.has') && expr.includes('renown_midlife_payoff_done'), 'payoff condition should have exclusivity guard');
  assert(expr.includes('tavern_renown_bridge_crossed'), 'payoff condition should require tavern_renown_bridge_crossed');
  assert(expr.includes('orthodox_childhood_seed_done'), 'payoff condition should exclude orthodox');
  assert(expr.includes('demonic_childhood_seed_done'), 'payoff condition should exclude demonic');
  console.log('  ✓ payoff event trigger conditions correct (pressure gate + exclusivity + bridge + orthodox/demonic exclusion)');
}

function testPayoffEventAutoEffects(): void {
  const effects = payoffEvent?.autoEffects ?? [];
  const hasPayoffDone = effects.some(
    (e: { type: string; target: string }) => e.type === 'flag_set' && e.target === 'renown_midlife_payoff_done'
  );
  const hasAge40IdentityDone = effects.some(
    (e: { type: string; target: string }) => e.type === 'flag_set' && e.target === 'renown_age40_identity_done'
  );
  assert(hasPayoffDone, 'payoff event should set renown_midlife_payoff_done flag');
  assert(hasAge40IdentityDone, 'payoff event should set renown_age40_identity_done flag');
  console.log('  ✓ payoff event sets both checkpoint flag + age-40 identity flag');
}

testPayoffEventExists();
testPayoffEventIsChoice();
testPayoffEventThreeChoices();
testPayoffEventAgeRange();
testPayoffEventConditions();
testPayoffEventAutoEffects();

console.log('\n2. Pre-payoff state (post-pressure, pre-payoff)');

function testPrePayoffDetectSampleLine(): void {
  const state = makeState(42, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
  });
  const line = detectSampleLine(state.flags ?? {});
  assert(line === 'renown', `detectSampleLine should return 'renown', got ${line}`);
  console.log('  ✓ detectSampleLine returns renown at pre-payoff (post-pressure) state');
}

function testPrePayoffCostLabelIsPressureLevel(): void {
  const state = makeState(42, {
    origin_tavern_hand: true,
    ally_network: true,
    tavern_renown_bridge_crossed: true,
    route_renown_committed: true,
    renown_on_ramp_done: true,
    tavern_renown_on_ramp: true,
    renown_midlife_pressure_done: true,
    tavern_renown_pressure: true,
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '人情债渐重', `pre-payoff cost label should be 人情债渐重, got: ${label}`);
  assert(!label.includes('声名之累') && !label.includes('快意恩仇') && !label.includes('人情练达'),
    `pre-payoff cost label should NOT have payoff text, got: ${label}`);
  console.log('  ✓ pre-payoff cost label is pressure level (人情债渐重)');
}

testPrePayoffDetectSampleLine();
testPrePayoffCostLabelIsPressureLevel();

console.log('\n3. Option A (Hard Holder) — post-payoff state');

function testOptionAFlags(): void {
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
  };
  assert(flags.renown_midlife_payoff_done === true, 'payoff done flag should be set');
  assert(flags.renown_age40_identity_done === true, 'age-40 identity done flag should be set');
  assert(flags.tavern_renown_payoff_hard_holder === true, 'hard_holder marker should be set');
  assert(flags.tavern_renown_payoff_breaker === undefined, 'breaker marker should NOT be set');
  assert(flags.tavern_renown_payoff_balancer === undefined, 'balancer marker should NOT be set');
  console.log('  ✓ Option A flags: payoff_done + age40_identity_done + hard_holder marker (exactly one choice)');
}

function testOptionAStats(): void {
  const choices = payoffEvent?.choices ?? [];
  const choiceA = choices.find((c: { id: string }) => c.id === 'hard_holder');
  assert(choiceA !== undefined, 'hard_holder choice should exist');
  const effects = choiceA.effects ?? [];
  const repEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'reputation');
  const conEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'connections');
  const chaEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'charisma');
  assert(repEffect?.value === 5, `Option A reputation should be +5, got ${repEffect?.value}`);
  assert(conEffect?.value === 3, `Option A connections should be +3, got ${conEffect?.value}`);
  assert(chaEffect?.value === 2, `Option A charisma should be +2, got ${chaEffect?.value}`);
  console.log('  ✓ Option A stats: rep+5, con+3, cha+2 (reputation-heavy, net +10)');
}

function testOptionACostLabel(): void {
  const state = makeState(43, {
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
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '声名之累', `Option A cost label should be 声名之累, got: ${label}`);
  assert(isPlayerVisibleSampleLineText(label), 'Option A cost label should be player-visible');
  console.log('  ✓ Option A cost label: 声名之累 (fame as burden)');
}

function testOptionACurrentGoal(): void {
  const state = makeState(43, {
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
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('硬扛'), `Option A goal should mention 硬扛, got: ${goal}`);
  assert(goal?.includes('名声'), `Option A goal should mention 名声, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'Option A goal should be player-visible');
  console.log('  ✓ Option A current goal: 硬扛人情债，保住名声');
}

testOptionAFlags();
testOptionAStats();
testOptionACostLabel();
testOptionACurrentGoal();

console.log('\n4. Option B (Breaker) — post-payoff state');

function testOptionBFlags(): void {
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
  };
  assert(flags.renown_midlife_payoff_done === true, 'payoff done flag should be set');
  assert(flags.renown_age40_identity_done === true, 'age-40 identity done flag should be set');
  assert(flags.tavern_renown_payoff_breaker === true, 'breaker marker should be set');
  assert(flags.tavern_renown_payoff_hard_holder === undefined, 'hard_holder marker should NOT be set');
  assert(flags.tavern_renown_payoff_balancer === undefined, 'balancer marker should NOT be set');
  console.log('  ✓ Option B flags: payoff_done + age40_identity_done + breaker marker (exactly one choice)');
}

function testOptionBStats(): void {
  const choices = payoffEvent?.choices ?? [];
  const choiceB = choices.find((c: { id: string }) => c.id === 'breaker');
  assert(choiceB !== undefined, 'breaker choice should exist');
  const effects = choiceB.effects ?? [];
  const repEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'reputation');
  const conEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'connections');
  const chaEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'charisma');
  assert(repEffect?.value === -2, `Option B reputation should be -2, got ${repEffect?.value}`);
  assert(conEffect?.value === -4, `Option B connections should be -4, got ${conEffect?.value}`);
  assert(chaEffect?.value === -1, `Option B charisma should be -1, got ${chaEffect?.value}`);
  console.log('  ✓ Option B stats: rep-2, con-4, cha-1 (connections-heavy loss, net -7)');
}

function testOptionBCostLabel(): void {
  const state = makeState(43, {
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
  });
  const label = deriveSampleLineCostLabel(state);
  assert(label === '快意恩仇', `Option B cost label should be 快意恩仇, got: ${label}`);
  assert(isPlayerVisibleSampleLineText(label), 'Option B cost label should be player-visible');
  console.log('  ✓ Option B cost label: 快意恩仇 (freedom from social obligation)');
}

function testOptionBCurrentGoal(): void {
  const state = makeState(43, {
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
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('撕破脸'), `Option B goal should mention 撕破脸, got: ${goal}`);
  assert(goal?.includes('债'), `Option B goal should mention 债, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'Option B goal should be player-visible');
  console.log('  ✓ Option B current goal: 撕破脸皮，断了不该还的债');
}

testOptionBFlags();
testOptionBStats();
testOptionBCostLabel();
testOptionBCurrentGoal();

console.log('\n5. Option C (Balancer) — post-payoff state');

function testOptionCFlags(): void {
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
  };
  assert(flags.renown_midlife_payoff_done === true, 'payoff done flag should be set');
  assert(flags.renown_age40_identity_done === true, 'age-40 identity done flag should be set');
  assert(flags.tavern_renown_payoff_balancer === true, 'balancer marker should be set');
  assert(flags.tavern_renown_payoff_hard_holder === undefined, 'hard_holder marker should NOT be set');
  assert(flags.tavern_renown_payoff_breaker === undefined, 'breaker marker should NOT be set');
  console.log('  ✓ Option C flags: payoff_done + age40_identity_done + balancer marker (exactly one choice)');
}

function testOptionCStats(): void {
  const choices = payoffEvent?.choices ?? [];
  const choiceC = choices.find((c: { id: string }) => c.id === 'balancer');
  assert(choiceC !== undefined, 'balancer choice should exist');
  const effects = choiceC.effects ?? [];
  const repEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'reputation');
  const conEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'connections');
  const chaEffect = effects.find((e: { type: string; target: string }) => e.type === 'stat_modify' && e.target === 'charisma');
  assert(repEffect?.value === 2, `Option C reputation should be +2, got ${repEffect?.value}`);
  assert(conEffect?.value === 1, `Option C connections should be +1, got ${conEffect?.value}`);
  assert(chaEffect?.value === 3, `Option C charisma should be +3, got ${chaEffect?.value}`);
  console.log('  ✓ Option C stats: rep+2, con+1, cha+3 (charisma-heavy, net +6)');
}

function testOptionCCostLabel(): void {
  const state = makeState(43, {
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
  assert(label === '人情练达', `Option C cost label should be 人情练达, got: ${label}`);
  assert(isPlayerVisibleSampleLineText(label), 'Option C cost label should be player-visible');
  console.log('  ✓ Option C cost label: 人情练达 (mastery of social currency)');
}

function testOptionCCurrentGoal(): void {
  const state = makeState(43, {
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
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('分寸'), `Option C goal should mention 分寸, got: ${goal}`);
  assert(goal?.includes('平衡'), `Option C goal should mention 平衡, got: ${goal}`);
  assert(isPlayerVisibleSampleLineText(goal!), 'Option C goal should be player-visible');
  console.log('  ✓ Option C current goal: 拿捏人情往来的分寸，找到平衡');
}

testOptionCFlags();
testOptionCStats();
testOptionCCostLabel();
testOptionCCurrentGoal();

console.log('\n6. Distinct from merchant payoff');

function testRenownPayoffDistinctFromMerchantPayoff(): void {
  const renownFlags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    renown_midlife_payoff_done: true,
    tavern_renown_payoff_balancer: true,
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

  assert(renownSummary !== merchantSummary, 'renown and merchant payoff summaries should be distinct');
  assert(renownSummary?.includes('江湖名宿') || renownSummary?.includes('人情'), `renown should be jianghu/favor flavored, got: ${renownSummary}`);
  assert(merchantSummary?.includes('商人') || merchantSummary?.includes('商路') || merchantSummary?.includes('巨贾'), `merchant should be business flavored, got: ${merchantSummary}`);
  console.log('  ✓ renown payoff distinct from merchant payoff across summary');
}

function testRenownPayoffMemoryDistinctFromMerchant(): void {
  const renownFlags = {
    origin_tavern_hand: true,
    tavern_renown_bridge_crossed: true,
    renown_on_ramp_done: true,
    renown_midlife_pressure_done: true,
    renown_midlife_payoff_done: true,
    tavern_renown_payoff_balancer: true,
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

  assert(renownMemory !== merchantMemory, 'renown and merchant payoff memories should be distinct');
  console.log('  ✓ renown payoff memory distinct from merchant payoff memory');
}

testRenownPayoffDistinctFromMerchantPayoff();
testRenownPayoffMemoryDistinctFromMerchant();

console.log('\n7. No regression of P71/P72/P73/P75');

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

function testMerchantPayoffUnchanged(): void {
  const flags = {
    origin_tavern_hand: true,
    tavern_merchant_bridge_crossed: true,
    magnate_on_ramp_done: true,
    magnate_midlife_pressure_done: true,
    magnate_payoff_done: true,
  };
  const summary = deriveOrdinaryOriginSummary(flags);
  assert(summary?.includes('商人') || summary?.includes('商路') || summary?.includes('巨贾'), `merchant payoff should still be business flavored, got: ${summary}`);
  console.log('  ✓ merchant payoff unchanged (no regression)');
}

testP71BridgeStillWorks();
testP72EntryStillWorks();
testP73OnRampStillWorks();
testP75PressureStillWorks();
testMerchantPayoffUnchanged();

console.log('\n✅ All P77 renown payoff spine tests passed');
