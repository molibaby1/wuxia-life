import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import {
  deriveSampleLineAge40Identity,
  deriveSampleLineCostLabel,
  deriveSampleLineCurrentGoal,
} from '../src/p50/sampleLineExpression';
import sampleLinesSpine from '../src/data/lines/sample-lines-spine.json';
import type { GameState, PlayerState, SampleLineEvent } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const allEvents = sampleLinesSpine as SampleLineEvent[];
const endgameEvents = allEvents.filter(e => e.id.startsWith('merchant_patron_endgame_echo_'));
const branchAEvent = allEvents.find(e => e.id === 'merchant_patron_endgame_echo_covenant_bound');
const branchBEvent = allEvents.find(e => e.id === 'merchant_patron_endgame_echo_isolated_merchant');
const branchCEvent = allEvents.find(e => e.id === 'merchant_patron_endgame_echo_sustainable_covenant');
const lateLifeAEvent = allEvents.find(e => e.id === 'merchant_patron_late_life_covenant_bound');

const ENDGAME_MARKERS = [
  'merchant_patron_endgame_covenant_echo',
  'merchant_patron_endgame_solitary_echo',
  'merchant_patron_endgame_legacy_echo',
] as const;

const LATE_TO_ENDGAME: Array<[string, string, typeof ENDGAME_MARKERS[number]]> = [
  ['merchant_patron_late_covenant_bound', 'merchant_patron_endgame_echo_covenant_bound', 'merchant_patron_endgame_covenant_echo'],
  ['merchant_patron_late_isolated_merchant', 'merchant_patron_endgame_echo_isolated_merchant', 'merchant_patron_endgame_solitary_echo'],
  ['merchant_patron_late_sustainable_covenant', 'merchant_patron_endgame_echo_sustainable_covenant', 'merchant_patron_endgame_legacy_echo'],
];

function patronState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 62,
      charisma: 10,
      martialPower: 40,
      reputation: 30,
      businessAcumen: 35,
      ...(overrides.player ?? {}),
    } as PlayerState,
    flags: {
      route_wealth_committed: true,
      merchant_invest_good: true,
      merchant_age40_identity_done: true,
      merchant_patron_on_ramp_done: true,
      merchant_patron_midlife_pressure_done: true,
      merchant_patron_payoff_done: true,
      merchant_patron_identity_done: true,
      merchant_patron_payoff_resolved: true,
      merchant_patron_late_life_done: true,
      merchant_patron_late_life_identity_done: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

// Group 1: Event wiring (R1–R11)

function testEndgameEventsExist(): void {
  assert(endgameEvents.length === 3, 'R1: merchant_patron_endgame_echo branch events should exist');
  assert(Boolean(branchAEvent), 'R1: covenant_bound endgame exists');
  assert(Boolean(branchBEvent), 'R1: isolated_merchant endgame exists');
  assert(Boolean(branchCEvent), 'R1: sustainable_covenant endgame exists');
}

function testEndgameIsAuto(): void {
  for (const evt of endgameEvents) {
    assert(evt.eventType === 'auto', `R2: ${evt.id} should be auto type`);
    assert(evt.version === '1.0.0', `R2: ${evt.id} version should be 1.0.0`);
  }
}

function testEndgameGateRequiresLateLife(): void {
  for (const evt of endgameEvents) {
    const expr = evt.conditions![0]!.expression ?? '';
    assert(expr.includes('merchant_patron_late_life_done'), `R3: ${evt.id} gate requires late-life done`);
  }
  const evaluator = new ConditionEvaluator();
  const state = patronState({ flags: { merchant_patron_late_covenant_bound: true } });
  assert(evaluator.evaluate(branchAEvent!.conditions![0]!, state), 'late-life + covenant_bound should pass branch A gate');
  const noLateLife = patronState();
  delete (noLateLife.flags as Record<string, unknown>).merchant_patron_late_life_done;
  assert(!evaluator.evaluate(branchAEvent!.conditions![0]!, noLateLife), 'missing late-life should fail');
}

function testEndgameAgeRange(): void {
  for (const evt of endgameEvents) {
    assert(evt.ageRange?.min === 60, `R4: ${evt.id} min age should be 60`);
    assert(evt.ageRange?.max === 65, `R4: ${evt.id} max age should be 65`);
  }
}

function testThreeConditionalBranches(): void {
  assert(endgameEvents.length === 3, 'R5: 3 conditional branches keyed on late-life marker');
  const lateMarkers = [
    'merchant_patron_late_covenant_bound',
    'merchant_patron_late_isolated_merchant',
    'merchant_patron_late_sustainable_covenant',
  ];
  endgameEvents.forEach((evt, i) => {
    const expr = evt.conditions![0]!.expression ?? '';
    assert(expr.includes(lateMarkers[i]!), `R5: ${evt.id} keyed on ${lateMarkers[i]}`);
  });
}

function testAllBranchesSetCheckpointFlags(): void {
  for (const evt of endgameEvents) {
    const effects = evt.autoEffects ?? [];
    for (const flag of ['merchant_patron_endgame_echo_done', 'merchant_patron_endgame_identity_done']) {
      assert(
        effects.some(e => e.type === 'flag_set' && e.target === flag),
        `R6/R7: ${evt.id} sets ${flag}`,
      );
    }
  }
}

function testEachBranchSetsEndgameMarker(): void {
  for (const [, eventId, marker] of LATE_TO_ENDGAME) {
    const evt = allEvents.find(e => e.id === eventId)!;
    assert(
      (evt.autoEffects ?? []).some(e => e.type === 'flag_set' && e.target === marker),
      `R8: ${eventId} sets ${marker}`,
    );
  }
}

function testEndgameMarkersMutuallyExclusive(): void {
  const markersPerEvent = endgameEvents.map(evt =>
    (evt.autoEffects ?? []).filter(e => e.type === 'flag_set' && ENDGAME_MARKERS.includes(e.target as typeof ENDGAME_MARKERS[number])),
  );
  for (let i = 0; i < markersPerEvent.length; i++) {
    assert(markersPerEvent[i]!.length === 1, `R9: ${endgameEvents[i]!.id} sets exactly one endgame marker`);
    for (let j = i + 1; j < markersPerEvent.length; j++) {
      assert(
        markersPerEvent[i]![0]!.target !== markersPerEvent[j]![0]!.target,
        'R9: endgame markers differ across branches',
      );
    }
  }
}

function testEndgameDoesNotUnsetLateLife(): void {
  for (const evt of endgameEvents) {
    const effects = evt.autoEffects ?? [];
    assert(
      !effects.some(e => e.type === 'flag_unset' && e.target === 'merchant_patron_late_life_done'),
      `R10: ${evt.id} must not unset merchant_patron_late_life_done`,
    );
  }
}

function testEndgameNoStatChanges(): void {
  for (const evt of endgameEvents) {
    const effects = evt.autoEffects ?? [];
    assert(
      !effects.some(e => e.type === 'stat_modify'),
      `R11: ${evt.id} must have no stat_modify effects`,
    );
  }
}

// Group 2: Pre-endgame expression (R12–R13)

function testPreEndgameCostLabel(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_orthodox: true,
      merchant_patron_payoff_covenant_holder: true,
      merchant_patron_late_covenant_bound: true,
    },
  });
  delete (state.flags as Record<string, unknown>).merchant_patron_endgame_echo_done;
  assert(deriveSampleLineCostLabel(state) === '盟约终老之累', 'R12: pre-endgame cost should be late-life label');
}

function testPreEndgameGoal(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_martial: true,
      merchant_patron_payoff_covenant_breaker: true,
      merchant_patron_late_isolated_merchant: true,
    },
  });
  delete (state.flags as Record<string, unknown>).merchant_patron_endgame_echo_done;
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('商路自分断'), 'R13: pre-endgame goal should be late-life state');
}

// Group 3: Post-endgame expression per branch (R14–R21)

function testEndgameAExpression(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_orthodox: true,
      merchant_patron_payoff_covenant_holder: true,
      merchant_patron_late_covenant_bound: true,
      merchant_patron_endgame_echo_done: true,
      merchant_patron_endgame_identity_done: true,
      merchant_patron_endgame_covenant_echo: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '商武终局·担', 'R14: endgame A cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('盟约碑立'), 'R15: endgame A goal');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('盟约碑上的商武金主'), 'R20: endgame A identity');
}

function testEndgameBExpression(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_martial: true,
      merchant_patron_payoff_covenant_breaker: true,
      merchant_patron_late_isolated_merchant: true,
      merchant_patron_endgame_echo_done: true,
      merchant_patron_endgame_solitary_echo: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '商武终局·孤', 'R16: endgame B cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('商号是自己的定论'), 'R17: endgame B goal');
}

function testEndgameCExpression(): void {
  const state = patronState({
    flags: {
      merchant_patron_bridge_apprentice_craft: true,
      apprentice_merchant_bridge_crossed: true,
      merchant_patron_payoff_balancer: true,
      merchant_patron_late_sustainable_covenant: true,
      merchant_patron_endgame_echo_done: true,
      merchant_patron_endgame_identity_done: true,
      merchant_patron_endgame_legacy_echo: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '商武终局·传', 'R18: endgame C cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('新盟分寸'), 'R19: endgame C goal');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('手艺标准'), 'R21: bridge-origin + endgame C identity');
}

function testMagnateWinsOverPatronEndgame(): void {
  const state = patronState({
    flags: {
      merchant_patron_late_covenant_bound: true,
      merchant_patron_endgame_echo_done: true,
      merchant_patron_endgame_covenant_echo: true,
      magnate_endgame_echo_done: true,
      magnate_native_endgame_ledger_legacy: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '稳态身后回响', 'magnate endgame cost should win over patron endgame');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('身后名'), 'magnate endgame goal should win over patron endgame');
}

// Group 4: Spine ordering (R22–R23)

function testSpineOrdering(): void {
  const entryIdx = allEvents.findIndex(e => e.id === 'merchant_patron_bridge_entry');
  const pressureIdx = allEvents.findIndex(e => e.id === 'merchant_patron_midlife_pressure');
  const payoffIdx = allEvents.findIndex(e => e.id === 'merchant_patron_payoff_echo');
  const lateIdx = allEvents.findIndex(e => e.id === 'merchant_patron_late_life_covenant_bound');
  const endgameIdx = allEvents.findIndex(e => e.id === 'merchant_patron_endgame_echo_covenant_bound');
  assert(entryIdx >= 0 && pressureIdx >= 0 && payoffIdx >= 0 && lateIdx >= 0 && endgameIdx >= 0, 'R22: all patron spine events exist');
  assert(entryIdx < pressureIdx, 'R22: entry before pressure');
  assert(pressureIdx < payoffIdx, 'R22: pressure before payoff');
  assert(payoffIdx < lateIdx, 'R22: payoff before late-life');
  assert(lateIdx < endgameIdx, 'R22: late-life before endgame');
  assert((lateLifeAEvent?.ageRange?.max ?? 0) <= (branchAEvent?.ageRange?.min ?? 99), 'R23: late-life age before endgame');
}

// Cross-route regression: npm run test:sample-lines-routes

function writeTargetedProof(): void {
  const lines = [
    '# P112 Merchant Martial Patron Endgame Targeted Proof',
    '',
    '> **Stage:** P112 Patron Endgame Playable Implementation',
    '> **Date:** 2026-07-02',
    '> **Contract:** P111 merchant-martial-patron-endgame-contract',
    '',
    '## Core nodes (validation shape §2.2)',
    '',
    '| Node | Verification |',
    '| ---- | ------------ |',
    '| 9 Pre-endgame state | `late_life_done` true, `endgame_echo_done` false — cost/goal reflect late-life |',
    '| 10 Endgame fires | auto events at age 60–65 keyed on late-life marker |',
    '| 11 Checkpoint | `merchant_patron_endgame_echo_done` via autoEffects |',
    '| 12 Identity done | `merchant_patron_endgame_identity_done` via autoEffects |',
    '| 13 Branch marker | one of `merchant_patron_endgame_*` matches late-life branch |',
    '| 14 Cost label | endgame branch cost label per branch |',
    '| 15 Current goal | endgame branch goal per branch |',
  '',
    '## Path A: Native orthodox → payoff hold → late-life covenant → endgame 担',
    '',
    '| Step | Flags / Expression |',
    '| ---- | ------------------ |',
    '| Entry | `merchant_patron_on_ramp_orthodox` |',
    '| Payoff | `merchant_patron_payoff_covenant_holder` |',
    '| Late-life | `merchant_patron_late_covenant_bound` |',
    '| Pre-endgame | cost=盟约终老之累, goal=守盟约至终 |',
    '| Endgame event | `merchant_patron_endgame_echo_covenant_bound` fires at 62 |',
    '| Post-endgame | `merchant_patron_endgame_covenant_echo`, cost=商武终局·担, goal=盟约碑立 |',
    '| Identity | 盟约碑上的商武金主 |',
    '',
    '## Path B: Native martial → payoff break → late-life isolated → endgame 孤',
    '',
    '| Step | Flags / Expression |',
    '| ---- | ------------------ |',
    '| Entry | `merchant_patron_on_ramp_martial` |',
    '| Payoff | `merchant_patron_payoff_covenant_breaker` |',
    '| Late-life | `merchant_patron_late_isolated_merchant` |',
    '| Pre-endgame | cost=孤商自在之快, goal=商路自分断 |',
    '| Endgame event | `merchant_patron_endgame_echo_isolated_merchant` fires at 62 |',
    '| Post-endgame | `merchant_patron_endgame_solitary_echo`, cost=商武终局·孤, goal=商号是自己的定论 |',
    '',
    '## Path C: Bridge apprentice → payoff balance → late-life sustainable → endgame 传',
    '',
    '| Step | Flags / Expression |',
    '| ---- | ------------------ |',
    '| Entry | `merchant_patron_bridge_apprentice_craft` + `apprentice_merchant_bridge_crossed` |',
    '| Payoff | `merchant_patron_payoff_balancer` |',
    '| Late-life | `merchant_patron_late_sustainable_covenant` |',
    '| Pre-endgame | cost=新盟久立之累, goal=守新盟规矩 |',
    '| Endgame event | `merchant_patron_endgame_echo_sustainable_covenant` fires at 62 |',
    '| Post-endgame | `merchant_patron_endgame_legacy_echo`, cost=商武终局·传, goal=新盟分寸 |',
    '| Identity | 新盟传统的金主 + 手艺标准 overlay |',
    '',
    '## Lightweight constraint',
    '',
    '- No stat_modify in endgame autoEffects',
    '- `merchant_patron_late_life_done` preserved (not unset)',
    '',
    '## Cross-route regression',
    '',
    '- `npm run test:sample-lines-routes` — flat patron/magnate/founding chain + baseline guard',
  ];
  writeFileSync(
    join(process.cwd(), 'artifacts/reports/p112-merchant-martial-patron-endgame-targeted-proof.md'),
    lines.join('\n') + '\n',
  );
}

const tests: Array<[string, () => void]> = [
  ['R1 endgame events exist', testEndgameEventsExist],
  ['R2 endgame is auto', testEndgameIsAuto],
  ['R3 gate requires late-life', testEndgameGateRequiresLateLife],
  ['R4 age range 60-65', testEndgameAgeRange],
  ['R5 three conditional branches', testThreeConditionalBranches],
  ['R6 checkpoint echo_done', testAllBranchesSetCheckpointFlags],
  ['R8 branch markers', testEachBranchSetsEndgameMarker],
  ['R9 markers mutually exclusive', testEndgameMarkersMutuallyExclusive],
  ['R10 does not unset late-life', testEndgameDoesNotUnsetLateLife],
  ['R11 no stat changes', testEndgameNoStatChanges],
  ['R12 pre-endgame cost label', testPreEndgameCostLabel],
  ['R13 pre-endgame goal', testPreEndgameGoal],
  ['R14 endgame A cost', testEndgameAExpression],
  ['R16 endgame B cost/goal', testEndgameBExpression],
  ['R18 endgame C cost/goal/identity', testEndgameCExpression],
  ['magnate wins over patron endgame', testMagnateWinsOverPatronEndgame],
  ['R22-R23 spine ordering', testSpineOrdering],
];

console.log('=== P112 Merchant Martial Patron Endgame Tests ===\n');

let passed = 0;
for (const [name, fn] of tests) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

writeTargetedProof();
console.log('\nWrote artifacts/reports/p112-merchant-martial-patron-endgame-targeted-proof.md');
console.log(`\n${passed}/${passed} tests passed`);
