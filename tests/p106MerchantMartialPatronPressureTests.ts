import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import {
  deriveSampleLineCostLabel,
  deriveSampleLineCurrentGoal,
} from '../src/p50/sampleLineExpression';
import sampleLinesSpine from '../src/data/lines/sample-lines-spine.json';
import type { GameState, PlayerState, SampleLineEvent } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const allEvents = sampleLinesSpine as SampleLineEvent[];
const pressureEvent = allEvents.find(e => e.id === 'merchant_patron_midlife_pressure');
const payoffEvent = allEvents.find(e => e.id === 'merchant_patron_payoff_echo');

function patronState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 42,
      charisma: 10,
      money: 200,
      martialPower: 40,
      reputation: 30,
      ...(overrides.player ?? {}),
    } as PlayerState,
    flags: {
      route_wealth_committed: true,
      merchant_invest_good: true,
      merchant_age40_identity_done: true,
      merchant_patron_on_ramp_done: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

// Group 1: Event wiring (7 tests)

function testPressureEventExists(): void {
  assert(Boolean(pressureEvent), 'merchant_patron_midlife_pressure should exist');
}

function testPressureGateRequiresOnRamp(): void {
  const expr = pressureEvent!.conditions![0]!.expression ?? '';
  assert(expr.includes('merchant_patron_on_ramp_done'), 'gate should require on-ramp done');
  const evaluator = new ConditionEvaluator();
  const eligible = patronState();
  assert(evaluator.evaluate(pressureEvent!.conditions![0]!, eligible), 'on-ramp should pass pressure gate');
  const noOnRamp = patronState({ flags: {} });
  delete (noOnRamp.flags as Record<string, unknown>).merchant_patron_on_ramp_done;
  assert(!evaluator.evaluate(pressureEvent!.conditions![0]!, noOnRamp), 'missing on-ramp should fail');
}

function testPressureAgeRange(): void {
  assert(pressureEvent?.ageRange?.min === 40, 'pressure min age should be 40');
  assert(pressureEvent?.ageRange?.max === 44, 'pressure max age should be 44');
}

function testPressureIsChoiceEvent(): void {
  assert(pressureEvent?.eventType === 'choice', 'pressure should be choice type');
}

function testAllChoicesSetCheckpoint(): void {
  for (const choice of pressureEvent!.choices ?? []) {
    const effects = choice.effects ?? [];
    assert(
      effects.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_midlife_pressure_done'),
      `${choice.id} sets merchant_patron_midlife_pressure_done`,
    );
    assert(
      !effects.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_payoff_done'),
      `${choice.id} must not set merchant_patron_payoff_done`,
    );
    assert(
      !effects.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_identity_done'),
      `${choice.id} must not set merchant_patron_identity_done`,
    );
  }
}

function testVariantChoicesReadEntryMarkers(): void {
  const orthodox = pressureEvent!.choices!.find(c => c.id === 'patron_pressure_orthodox_hold');
  const martial = pressureEvent!.choices!.find(c => c.id === 'patron_pressure_martial_expand');
  const apprentice = pressureEvent!.choices!.find(c => c.id === 'patron_pressure_apprentice_quality');
  assert(orthodox?.condition?.expression?.includes('merchant_patron_on_ramp_orthodox'), 'orthodox branch reads on-ramp marker');
  assert(martial?.condition?.expression?.includes('merchant_patron_on_ramp_martial'), 'martial branch reads on-ramp marker');
  assert(
    apprentice?.condition?.expression?.includes('merchant_patron_bridge_apprentice_craft'),
    'apprentice branch reads bridge marker',
  );
  const orthodoxEffects = orthodox!.effects ?? [];
  assert(
    orthodoxEffects.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_pressure_orthodox'),
    'orthodox branch sets pressure marker',
  );
}

function testGenericFallbackExists(): void {
  const generic = pressureEvent!.choices!.find(c => c.id === 'patron_pressure_generic');
  assert(Boolean(generic), 'generic fallback choice should exist');
  assert(!generic?.condition, 'generic fallback should have no condition');
  assert(
    (generic!.effects ?? []).some(e => e.type === 'flag_set' && e.target === 'merchant_patron_pressure_generic'),
    'generic sets merchant_patron_pressure_generic',
  );
}

// Group 2: Pre-pressure expression (2 tests)

function testPrePressureCostLabel(): void {
  const state = patronState({
    flags: { merchant_patron_on_ramp_orthodox: true },
  });
  assert(deriveSampleLineCostLabel(state) === '侠义盟约之累', 'pre-pressure orthodox cost should be on-ramp 之累');
}

function testPrePressureGoal(): void {
  const state = patronState({
    flags: { merchant_patron_on_ramp_orthodox: true },
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('绑在同一条绳上'), 'pre-pressure goal should be on-ramp state');
}

// Group 3: Post-pressure expression (4 P0 + 1 P1)

function testPostPressureOrthodoxCostLabel(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_orthodox: true,
      merchant_patron_midlife_pressure_done: true,
      merchant_patron_pressure_orthodox: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '侠义盟约之债', 'post-pressure orthodox cost should deepen to 之债');
}

function testPostPressureOrthodoxGoal(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_orthodox: true,
      merchant_patron_midlife_pressure_done: true,
    },
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('武力差遣'), 'post-pressure orthodox goal should mention 武力差遣');
}

function testPostPressureBridgeOriginExpression(): void {
  const state = patronState({
    flags: {
      apprentice_merchant_bridge_crossed: true,
      merchant_patron_bridge_apprentice_craft: true,
      merchant_patron_midlife_pressure_done: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '手艺护商之债', 'apprentice bridge cost should deepen');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('品质与护镖'), 'apprentice bridge goal should mention 品质与护镖');
}

function testPostPressureGenericFallbackExpression(): void {
  const state = patronState({
    flags: {
      merchant_patron_midlife_pressure_done: true,
      merchant_patron_pressure_generic: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '盟约护商之累', 'generic pressure cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('武力负担'), 'generic pressure goal should mention 武力负担');
}

function testPostPressurePayoffStillWinsOverPressure(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_orthodox: true,
      merchant_patron_midlife_pressure_done: true,
      merchant_patron_payoff_done: true,
      merchant_patron_payoff_covenant_holder: true,
    },
  });
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('硬扛盟约'), 'payoff goal should win over pressure');
}

// Group 4: Distinct from magnate / renown (2 tests)

function testPatronPressureCostDistinctFromMagnate(): void {
  const patron = patronState({
    flags: {
      merchant_patron_on_ramp_martial: true,
      merchant_patron_midlife_pressure_done: true,
    },
  });
  const magnate = patronState({
    flags: {
      magnate_on_ramp_done: true,
      magnate_midlife_pressure_done: true,
      magnate_native_pressure_ledger: true,
    },
  });
  const patronCost = deriveSampleLineCostLabel(patron);
  const magnateCost = deriveSampleLineCostLabel(magnate);
  assert(patronCost.includes('护商武力'), 'patron cost should read martial backer burden');
  assert(magnateCost.includes('中年之累') || magnateCost.includes('担子'), 'magnate cost should differ');
  assert(patronCost !== magnateCost, 'patron pressure cost should differ from magnate');
}

function testPatronPressureGoalDistinctFromRenown(): void {
  const patron = patronState({
    flags: {
      merchant_patron_on_ramp_orthodox: true,
      merchant_patron_midlife_pressure_done: true,
    },
  });
  const renown = {
    player: { age: 42 } as PlayerState,
    flags: {
      route_renown_committed: true,
      tavern_renown_bridge_crossed: true,
      renown_midlife_pressure_done: true,
    },
  } as GameState;
  const patronGoal = deriveSampleLineCurrentGoal(patron);
  const renownGoal = deriveSampleLineCurrentGoal(renown);
  assert(patronGoal?.includes('盟约') || patronGoal?.includes('护商'), 'patron goal should read backer burden');
  assert(renownGoal?.includes('声名') || renownGoal?.includes('人情债'), 'renown goal should read renown pressure');
  assert(patronGoal !== renownGoal, 'patron pressure goal should differ from renown');
}

// Cross-route regression: npm run test:sample-lines-routes

function testPayoffGateRequiresPressure(): void {
  const evaluator = new ConditionEvaluator();
  const expr = payoffEvent!.conditions![0]!.expression ?? '';
  assert(expr.includes('merchant_patron_midlife_pressure_done'), 'payoff gate should require pressure done');
  const eligible = patronState({
    player: { age: 50 } as PlayerState,
    flags: {
      merchant_patron_midlife_pressure_done: true,
      merchant_patron_on_ramp_orthodox: true,
    },
  });
  assert(evaluator.evaluate(payoffEvent!.conditions![0]!, eligible), 'pressure done should reach payoff');
}

const tests: Array<[string, () => void]> = [
  ['R1 pressure event exists', testPressureEventExists],
  ['R2 gate requires on-ramp', testPressureGateRequiresOnRamp],
  ['R3 age range 40-44', testPressureAgeRange],
  ['R4 choice event type', testPressureIsChoiceEvent],
  ['R5 all choices set checkpoint', testAllChoicesSetCheckpoint],
  ['R6 variant choices read entry markers', testVariantChoicesReadEntryMarkers],
  ['R7 generic fallback exists', testGenericFallbackExists],
  ['R8 pre-pressure cost label', testPrePressureCostLabel],
  ['R9 pre-pressure goal', testPrePressureGoal],
  ['R10 post-pressure orthodox cost', testPostPressureOrthodoxCostLabel],
  ['R11 post-pressure orthodox goal', testPostPressureOrthodoxGoal],
  ['R12 post-pressure bridge-origin expression', testPostPressureBridgeOriginExpression],
  ['R13 post-pressure generic fallback', testPostPressureGenericFallbackExpression],
  ['R14 payoff wins over pressure expression', testPostPressurePayoffStillWinsOverPressure],
  ['R15 patron cost distinct from magnate', testPatronPressureCostDistinctFromMagnate],
  ['R16 patron goal distinct from renown', testPatronPressureGoalDistinctFromRenown],
  ['R17 payoff gate requires pressure', testPayoffGateRequiresPressure],
];

for (const [name, fn] of tests) {
  try {
    fn();
  } catch (error) {
    throw new Error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

console.log(`p106MerchantMartialPatronPressureTests: all ${tests.length} passed`);
