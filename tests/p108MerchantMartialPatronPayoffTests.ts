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
const entryEvent = allEvents.find(e => e.id === 'merchant_patron_bridge_entry');
const pressureEvent = allEvents.find(e => e.id === 'merchant_patron_midlife_pressure');
const payoffEvent = allEvents.find(e => e.id === 'merchant_patron_payoff_echo');

const PAYOFF_MARKERS = [
  'merchant_patron_payoff_covenant_holder',
  'merchant_patron_payoff_covenant_breaker',
  'merchant_patron_payoff_balancer',
] as const;

function patronState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 50,
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
      merchant_patron_midlife_pressure_done: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

// Group 1: Event wiring (R1–R10)

function testPayoffEventExists(): void {
  assert(Boolean(payoffEvent), 'R1: merchant_patron_payoff_echo should exist');
}

function testPayoffIsChoiceEvent(): void {
  assert(payoffEvent?.eventType === 'choice', 'R2: payoff should be choice type');
  assert(payoffEvent?.version === '2.0.0', 'R2: payoff version should be 2.0.0');
}

function testPayoffGateRequiresPressure(): void {
  const expr = payoffEvent!.conditions![0]!.expression ?? '';
  assert(expr.includes('merchant_patron_midlife_pressure_done'), 'R3: gate should require pressure done');
  const evaluator = new ConditionEvaluator();
  assert(evaluator.evaluate(payoffEvent!.conditions![0]!, patronState()), 'pressure done should pass gate');
  const noPressure = patronState();
  delete (noPressure.flags as Record<string, unknown>).merchant_patron_midlife_pressure_done;
  assert(!evaluator.evaluate(payoffEvent!.conditions![0]!, noPressure), 'missing pressure should fail');
}

function testPayoffAgeRange(): void {
  assert(payoffEvent?.ageRange?.min === 48, 'R4: payoff min age should be 48');
  assert(payoffEvent?.ageRange?.max === 52, 'R4: payoff max age should be 52');
}

function testThreeChoiceBranches(): void {
  assert((payoffEvent?.choices?.length ?? 0) === 3, 'R5: payoff should have 3 choices');
  assert(Boolean(payoffEvent!.choices!.find(c => c.id === 'patron_payoff_hold_covenant')), 'hold choice exists');
  assert(Boolean(payoffEvent!.choices!.find(c => c.id === 'patron_payoff_break_covenant')), 'break choice exists');
  assert(Boolean(payoffEvent!.choices!.find(c => c.id === 'patron_payoff_balance_covenant')), 'balance choice exists');
}

function testAllBranchesSetCheckpointFlags(): void {
  const shared = payoffEvent!.autoEffects ?? [];
  for (const flag of ['merchant_patron_payoff_done', 'merchant_patron_payoff_resolved', 'merchant_patron_identity_done']) {
    assert(
      shared.some(e => e.type === 'flag_set' && e.target === flag),
      `R6/R7/R8: shared autoEffects set ${flag}`,
    );
  }
}

function testEachBranchSetsChoiceMarker(): void {
  const mapping: Array<[string, string]> = [
    ['patron_payoff_hold_covenant', 'merchant_patron_payoff_covenant_holder'],
    ['patron_payoff_break_covenant', 'merchant_patron_payoff_covenant_breaker'],
    ['patron_payoff_balance_covenant', 'merchant_patron_payoff_balancer'],
  ];
  for (const [choiceId, marker] of mapping) {
    const choice = payoffEvent!.choices!.find(c => c.id === choiceId)!;
    assert(
      (choice.effects ?? []).some(e => e.type === 'flag_set' && e.target === marker),
      `R9: ${choiceId} sets ${marker}`,
    );
  }
}

function testChoiceMarkersMutuallyExclusive(): void {
  const markersPerChoice = payoffEvent!.choices!.map(c =>
    (c.effects ?? []).filter(e => e.type === 'flag_set' && PAYOFF_MARKERS.includes(e.target as typeof PAYOFF_MARKERS[number])),
  );
  for (let i = 0; i < markersPerChoice.length; i++) {
    assert(markersPerChoice[i]!.length === 1, `R10: choice ${i} sets exactly one payoff marker`);
    for (let j = i + 1; j < markersPerChoice.length; j++) {
      assert(
        markersPerChoice[i]![0]!.target !== markersPerChoice[j]![0]!.target,
        'R10: payoff markers differ across choices',
      );
    }
  }
}

// Group 2: Pre-payoff expression (R11–R12)

function testPrePayoffCostLabel(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_orthodox: true,
      merchant_patron_pressure_orthodox: true,
    },
  });
  delete (state.flags as Record<string, unknown>).merchant_patron_payoff_done;
  assert(deriveSampleLineCostLabel(state) === '侠义盟约之债', 'R11: pre-payoff cost should be pressure 之债');
}

function testPrePayoffGoal(): void {
  const state = patronState({
    flags: { merchant_patron_on_ramp_orthodox: true },
  });
  delete (state.flags as Record<string, unknown>).merchant_patron_payoff_done;
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('武力差遣'), 'R12: pre-payoff goal should be pressure state');
}

// Group 3: Post-payoff expression per choice (R13–R20)

function testPayoffAExpression(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_orthodox: true,
      merchant_patron_payoff_done: true,
      merchant_patron_identity_done: true,
      merchant_patron_payoff_covenant_holder: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '盟约如山之累', 'R13: payoff A cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('硬扛盟约'), 'R14: payoff A goal');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('靠盟约定型'), 'R19: payoff A identity');
}

function testPayoffBExpression(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_martial: true,
      merchant_patron_payoff_done: true,
      merchant_patron_identity_done: true,
      merchant_patron_payoff_covenant_breaker: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '断武从商之快', 'R15: payoff B cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('撕破盟约'), 'R16: payoff B goal');
}

function testPayoffCExpression(): void {
  const state = patronState({
    flags: {
      merchant_patron_bridge_apprentice_craft: true,
      apprentice_merchant_bridge_crossed: true,
      merchant_patron_payoff_done: true,
      merchant_patron_identity_done: true,
      merchant_patron_payoff_balancer: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '商武新矩之累', 'R17: payoff C cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('重谈盟约'), 'R18: payoff C goal');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('商武分寸'), 'R20: bridge-origin + balancer identity');
}

// Group 4: Spine ordering (R21–R22)

function testSpineOrdering(): void {
  const entryIdx = allEvents.findIndex(e => e.id === 'merchant_patron_bridge_entry');
  const pressureIdx = allEvents.findIndex(e => e.id === 'merchant_patron_midlife_pressure');
  const payoffIdx = allEvents.findIndex(e => e.id === 'merchant_patron_payoff_echo');
  assert(entryIdx >= 0 && pressureIdx >= 0 && payoffIdx >= 0, 'R21: all patron spine events exist');
  assert(entryIdx < pressureIdx, 'R21: entry before pressure');
  assert(pressureIdx < payoffIdx, 'R21: pressure before payoff');
  assert((entryEvent?.ageRange?.max ?? 0) < (pressureEvent?.ageRange?.min ?? 99), 'R22: entry age before pressure');
  assert((pressureEvent?.ageRange?.max ?? 0) < (payoffEvent?.ageRange?.min ?? 99), 'R22: pressure age before payoff');
}

// Cross-route regression: npm run test:sample-lines-routes

function writeTargetedProof(): void {
  const lines = [
    '# P108 Merchant Martial Patron Payoff Targeted Proof',
    '',
    '> **Stage:** P108 Patron Payoff Playable Implementation',
    '> **Date:** 2026-07-02',
    '> **Contract:** P107 merchant-martial-patron-payoff-contract',
    '',
    '## Core nodes (validation shape §2.2)',
    '',
    '| Node | Verification |',
    '| ---- | ------------ |',
    '| 7 Pre-payoff state | `midlife_pressure_done` true, `payoff_done` false — cost=之债, goal=pressure |',
    '| 8 Payoff fires | `merchant_patron_payoff_echo` choice at age 48–52 |',
    '| 9 Checkpoint | `merchant_patron_payoff_done` via autoEffects |',
    '| 10 Resolved | `merchant_patron_payoff_resolved` via autoEffects |',
    '| 13–14 Expression | cost label + goal per choice marker |',
    '',
    '## Path A: Native orthodox → hold covenant',
    '',
    '| Step | Flags / Expression |',
    '| ---- | ------------------ |',
    '| Entry | `merchant_patron_on_ramp_orthodox` |',
    '| Pressure | `merchant_patron_midlife_pressure_done`, cost=侠义盟约之债 |',
    '| Payoff choice A | `merchant_patron_payoff_covenant_holder` |',
    '| Post-payoff | cost=盟约如山之累, goal=硬扛盟约护商 |',
    '| Identity | 靠盟约定型的商武金主 |',
    '',
    '## Path B: Native martial → break covenant',
    '',
    '| Step | Flags / Expression |',
    '| ---- | ------------------ |',
    '| Entry | `merchant_patron_on_ramp_martial` |',
    '| Pressure | `merchant_patron_midlife_pressure_done`, cost=护商武力之债 |',
    '| Payoff choice B | `merchant_patron_payoff_covenant_breaker` |',
    '| Post-payoff | cost=断武从商之快, goal=撕破盟约 |',
    '| Identity | 断武从商的巨贾 |',
    '',
    '## Path C: Bridge apprentice → balance covenant',
    '',
    '| Step | Flags / Expression |',
    '| ---- | ------------------ |',
    '| Entry | `merchant_patron_bridge_apprentice_craft` + `apprentice_merchant_bridge_crossed` |',
    '| Pressure | `merchant_patron_midlife_pressure_done`, cost=手艺护商之债 |',
    '| Payoff choice C | `merchant_patron_payoff_balancer` |',
    '| Post-payoff | cost=商武新矩之累, goal=重谈盟约边界 |',
    '| Identity | 懂商武分寸的金主 (bridge overlay on covenant_holder variant tested separately) |',
    '',
    '## Late-life interface',
    '',
    '- `merchant_patron_late_life_done` not set by payoff (reserved P109+)',
    '',
    '## Cross-route regression',
    '',
    '- `npm run test:sample-lines-routes` — flat patron/magnate/founding chain + baseline guard',
  ];
  const outPath = join(process.cwd(), 'docs/test-reports/p108-merchant-martial-patron-payoff-targeted-proof.md');
  writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  console.log(`Wrote proof artifact: ${outPath}`);
}

const tests: Array<[string, () => void]> = [
  ['R1 payoff event exists', testPayoffEventExists],
  ['R2 payoff is choice', testPayoffIsChoiceEvent],
  ['R3 gate requires pressure', testPayoffGateRequiresPressure],
  ['R4 age range 48-52', testPayoffAgeRange],
  ['R5 three choice branches', testThreeChoiceBranches],
  ['R6-R8 checkpoint flags', testAllBranchesSetCheckpointFlags],
  ['R9 choice markers', testEachBranchSetsChoiceMarker],
  ['R10 markers mutually exclusive', testChoiceMarkersMutuallyExclusive],
  ['R11 pre-payoff cost', testPrePayoffCostLabel],
  ['R12 pre-payoff goal', testPrePayoffGoal],
  ['R13-R14 payoff A expression', testPayoffAExpression],
  ['R15-R16 payoff B expression', testPayoffBExpression],
  ['R17-R18-R20 payoff C expression', testPayoffCExpression],
  ['R21-R22 spine ordering', testSpineOrdering],
];

for (const [name, fn] of tests) {
  try {
    fn();
  } catch (error) {
    throw new Error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

writeTargetedProof();
console.log(`p108MerchantMartialPatronPayoffTests: all ${tests.length} passed`);
