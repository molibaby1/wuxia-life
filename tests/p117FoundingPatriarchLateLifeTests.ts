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
const payoffEvent = allEvents.find(e => e.id === 'founding_patriarch_payoff_echo');
const lateLifeEvents = allEvents.filter(e => e.id.startsWith('founding_patriarch_late_life'));
const branchAEvent = allEvents.find(e => e.id === 'founding_patriarch_late_life_rule_keeper');
const branchBEvent = allEvents.find(e => e.id === 'founding_patriarch_late_life_alliance_bearer');

const LATE_LIFE_MARKERS = [
  'founding_patriarch_late_rule_keeper',
  'founding_patriarch_late_alliance_bearer',
] as const;

const PRESSURE_TO_LATE: Array<[string, string, typeof LATE_LIFE_MARKERS[number]]> = [
  ['founding_patriarch_pressure_rule_first', 'founding_patriarch_late_life_rule_keeper', 'founding_patriarch_late_rule_keeper'],
  ['founding_patriarch_pressure_alliance_first', 'founding_patriarch_late_life_alliance_bearer', 'founding_patriarch_late_alliance_bearer'],
];

function patriarchState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 54,
      charisma: 12,
      money: 90,
      martialPower: 52,
      reputation: 48,
      connections: 50,
      ...(overrides.player ?? {}),
    } as PlayerState,
    flags: {
      orthodox_childhood_seed_done: true,
      founding_patriarch_on_ramp_done: true,
      founding_patriarch_on_ramp_scholar: true,
      founding_patriarch_midlife_pressure_done: true,
      founding_patriarch_pressure_rule_first: true,
      founding_patriarch_payoff_done: true,
      founding_patriarch_identity_done: true,
      founding_patriarch_payoff_resolved: true,
      founding_patriarch_payoff_legacy_holder: true,
      p16_scholar_mentor: true,
      p22_faction_continuation_active: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

// Group 1: Event wiring (R1–R10)

function testLateLifeEventsExist(): void {
  assert(lateLifeEvents.length === 2, 'R1: founding_patriarch_late_life branch events should exist');
  assert(Boolean(branchAEvent), 'R1: rule_keeper branch exists');
  assert(Boolean(branchBEvent), 'R1: alliance_bearer branch exists');
}

function testLateLifeIsAuto(): void {
  for (const evt of lateLifeEvents) {
    assert(evt.eventType === 'auto', `R2: ${evt.id} should be auto type`);
    assert(evt.version === '1.0.0', `R2: ${evt.id} version should be 1.0.0`);
  }
}

function testLateLifeGateRequiresPayoff(): void {
  for (const evt of lateLifeEvents) {
    const expr = evt.conditions![0]!.expression ?? '';
    assert(expr.includes('founding_patriarch_payoff_done'), `R3: ${evt.id} gate requires payoff done`);
  }
  const evaluator = new ConditionEvaluator();
  const state = patriarchState();
  assert(evaluator.evaluate(branchAEvent!.conditions![0]!, state), 'payoff + rule_first should pass branch A gate');
  const noPayoff = patriarchState();
  delete (noPayoff.flags as Record<string, unknown>).founding_patriarch_payoff_done;
  assert(!evaluator.evaluate(branchAEvent!.conditions![0]!, noPayoff), 'missing payoff should fail');
}

function testLateLifeAgeRange(): void {
  for (const evt of lateLifeEvents) {
    assert(evt.ageRange?.min === 52, `R4: ${evt.id} min age should be 52`);
    assert(evt.ageRange?.max === 56, `R4: ${evt.id} max age should be 56`);
  }
}

function testTwoConditionalBranches(): void {
  assert(lateLifeEvents.length === 2, 'R5: 2 conditional branches keyed on pressure marker');
  const pressureMarkers = [
    'founding_patriarch_pressure_rule_first',
    'founding_patriarch_pressure_alliance_first',
  ];
  lateLifeEvents.forEach((evt, i) => {
    const expr = evt.conditions![0]!.expression ?? '';
    assert(expr.includes(pressureMarkers[i]!), `R5: ${evt.id} keyed on ${pressureMarkers[i]}`);
  });
}

function testAllBranchesSetCheckpointFlags(): void {
  for (const evt of lateLifeEvents) {
    const effects = evt.autoEffects ?? [];
    for (const flag of ['founding_patriarch_late_life_done', 'founding_patriarch_late_life_identity_done']) {
      assert(
        effects.some(e => e.type === 'flag_set' && e.target === flag),
        `R6/R7: ${evt.id} sets ${flag}`,
      );
    }
  }
}

function testEachBranchSetsLateMarker(): void {
  for (const [, eventId, marker] of PRESSURE_TO_LATE) {
    const evt = allEvents.find(e => e.id === eventId)!;
    assert(
      (evt.autoEffects ?? []).some(e => e.type === 'flag_set' && e.target === marker),
      `R8: ${eventId} sets ${marker}`,
    );
  }
}

function testLateMarkersMutuallyExclusive(): void {
  const markersPerEvent = lateLifeEvents.map(evt =>
    (evt.autoEffects ?? []).filter(
      e => e.type === 'flag_set' && LATE_LIFE_MARKERS.includes(e.target as typeof LATE_LIFE_MARKERS[number]),
    ),
  );
  for (let i = 0; i < markersPerEvent.length; i++) {
    assert(markersPerEvent[i]!.length === 1, `R9: ${lateLifeEvents[i]!.id} sets exactly one late-life marker`);
    for (let j = i + 1; j < markersPerEvent.length; j++) {
      assert(
        markersPerEvent[i]![0]!.target !== markersPerEvent[j]![0]!.target,
        'R9: late-life markers differ across branches',
      );
    }
  }
}

function testLateLifeDoesNotSetEndgameEcho(): void {
  for (const evt of lateLifeEvents) {
    const effects = evt.autoEffects ?? [];
    assert(
      !effects.some(e => e.type === 'flag_set' && e.target === 'founding_patriarch_endgame_echo_done'),
      `R10: ${evt.id} must not set founding_patriarch_endgame_echo_done`,
    );
  }
}

// Group 2: Pre-late-life expression (R11–R12)

function testPreLateLifeCostLabel(): void {
  const state = patriarchState({
    flags: {
      founding_patriarch_on_ramp_scholar: true,
      founding_patriarch_payoff_legacy_holder: true,
    },
  });
  delete (state.flags as Record<string, unknown>).founding_patriarch_late_life_done;
  assert(deriveSampleLineCostLabel(state) === '续责开派之累', 'R11: pre-late-life cost should be payoff label');
}

function testPreLateLifeGoal(): void {
  const state = patriarchState({
    flags: {
      founding_patriarch_on_ramp_alliance: true,
      founding_patriarch_payoff_independent_founder: true,
      founding_patriarch_payoff_legacy_holder: false,
    },
  });
  delete (state.flags as Record<string, unknown>).founding_patriarch_late_life_done;
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('自立山门'), 'R12: pre-late-life goal should be payoff state');
}

// Group 3: Post-late-life expression per branch (R13–R18)

function testLateLifeAExpression(): void {
  const state = patriarchState({
    flags: {
      founding_patriarch_on_ramp_scholar: true,
      founding_patriarch_late_life_done: true,
      founding_patriarch_late_life_identity_done: true,
      founding_patriarch_late_rule_keeper: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '门规守成之累', 'R13: late-life A cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('守门规至终'), 'R14: late-life A goal');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('门规守成'), 'R17: late-life A identity');
}

function testLateLifeBExpression(): void {
  const state = patriarchState({
    flags: {
      p16_scholar_mentor: false,
      founding_patriarch_on_ramp_scholar: false,
      founding_patriarch_on_ramp_alliance: true,
      founding_patriarch_pressure_rule_first: false,
      founding_patriarch_pressure_alliance_first: true,
      p16_alliance_brokered: true,
      founding_patriarch_late_life_done: true,
      founding_patriarch_late_life_identity_done: true,
      founding_patriarch_late_alliance_bearer: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '盟约续责之累', 'R15: late-life B cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('守盟约至终'), 'R16: late-life B goal');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('诸派盟约线'), 'R18: alliance on-ramp + late-life B identity');
}

// Group 4: Spine ordering (R19–R21)

function testSpineOrdering(): void {
  const entryIdx = allEvents.findIndex(e => e.id === 'founding_patriarch_bridge_entry');
  const pressureIdx = allEvents.findIndex(e => e.id === 'founding_patriarch_midlife_pressure');
  const payoffIdx = allEvents.findIndex(e => e.id === 'founding_patriarch_payoff_echo');
  const lateIdx = allEvents.findIndex(e => e.id === 'founding_patriarch_late_life_rule_keeper');
  assert(entryIdx >= 0 && pressureIdx >= 0 && payoffIdx >= 0 && lateIdx >= 0, 'R19: all founding spine events exist');
  assert(entryIdx < pressureIdx, 'R19: entry before pressure');
  assert(pressureIdx < payoffIdx, 'R19: pressure before payoff');
  assert(payoffIdx < lateIdx, 'R19: payoff before late-life');
  assert((payoffEvent?.ageRange?.max ?? 0) <= (branchAEvent?.ageRange?.min ?? 99), 'R20: payoff age before late-life');
}

function testLateLifeBranchMatchesPressure(): void {
  for (const [pressureMarker, eventId, lateMarker] of PRESSURE_TO_LATE) {
    const evt = allEvents.find(e => e.id === eventId)!;
    const expr = evt.conditions![0]!.expression ?? '';
    assert(expr.includes(pressureMarker), `R21: ${eventId} keyed on ${pressureMarker}`);
    assert(
      (evt.autoEffects ?? []).some(e => e.type === 'flag_set' && e.target === lateMarker),
      `R21: ${eventId} sets ${lateMarker}`,
    );
  }
}

// Cross-route regression: npm run test:sample-lines-routes

function writeTargetedProof(): void {
  const scholarPre = patriarchState({ player: { age: 50 } as PlayerState });
  delete (scholarPre.flags as Record<string, unknown>).founding_patriarch_late_life_done;
  const scholarPost = patriarchState({
    flags: {
      founding_patriarch_late_life_done: true,
      founding_patriarch_late_life_identity_done: true,
      founding_patriarch_late_rule_keeper: true,
    },
  });
  const alliancePost = patriarchState({
    flags: {
      p16_scholar_mentor: false,
      founding_patriarch_on_ramp_scholar: false,
      founding_patriarch_on_ramp_alliance: true,
      founding_patriarch_pressure_rule_first: false,
      founding_patriarch_pressure_alliance_first: true,
      p16_alliance_brokered: true,
      founding_patriarch_late_life_done: true,
      founding_patriarch_late_life_identity_done: true,
      founding_patriarch_late_alliance_bearer: true,
    },
  });

  const lines = [
    '# P117 Founding Patriarch Late-Life Targeted Proof',
    '',
    '> **Stage:** P117 Founding Patriarch Late-Life Playable Implementation',
    '> **Date:** 2026-07-02',
    '> **Contract:** P116 founding-patriarch-late-life-contract',
    '',
    '## Core nodes (validation shape §2.2)',
    '',
    '| Node | Verification |',
    '| ---- | ------------ |',
    '| 9 Pre-late-life state | `payoff_done` true, `late_life_done` false — cost/goal reflect payoff |',
    '| 10 Late-life fires | auto events at age 52–56 keyed on pressure marker |',
    '| 11 Checkpoint | `founding_patriarch_late_life_done` via autoEffects |',
    '| 13 Branch marker | one of `founding_patriarch_late_*` matches pressure marker |',
    '| 14 Cost label | late-life branch cost label per branch |',
    '| 15 Current goal | late-life branch goal per branch |',
    '',
    '## Branch A: Scholar on-ramp → rule_first → payoff → late-life rule_keeper',
    '',
    '| Step | Flag / Signal | Value |',
    '| ---- | ------------- | ----- |',
    '| Pre-late-life | `founding_patriarch_payoff_done` | true |',
    '| Pre-late-life | `founding_patriarch_late_life_done` | false |',
    `| Pre-late-life cost | deriveSampleLineCostLabel | ${deriveSampleLineCostLabel(scholarPre)} |`,
    `| Pre-late-life goal | deriveSampleLineCurrentGoal | ${deriveSampleLineCurrentGoal(scholarPre)} |`,
    '| Post-late-life | `founding_patriarch_late_rule_keeper` | true |',
    `| Post-late-life cost | deriveSampleLineCostLabel | ${deriveSampleLineCostLabel(scholarPost)} |`,
    `| Post-late-life goal | deriveSampleLineCurrentGoal | ${deriveSampleLineCurrentGoal(scholarPost)} |`,
    `| Post-late-life identity | deriveSampleLineAge40Identity | ${deriveSampleLineAge40Identity(scholarPost)} |`,
    '',
    '## Branch B: Alliance on-ramp → alliance_first → payoff → late-life alliance_bearer',
    '',
    '| Step | Flag / Signal | Value |',
    '| ---- | ------------- | ----- |',
    '| Post-late-life | `founding_patriarch_late_alliance_bearer` | true |',
    `| Post-late-life cost | deriveSampleLineCostLabel | ${deriveSampleLineCostLabel(alliancePost)} |`,
    `| Post-late-life goal | deriveSampleLineCurrentGoal | ${deriveSampleLineCurrentGoal(alliancePost)} |`,
    `| Post-late-life identity | deriveSampleLineAge40Identity | ${deriveSampleLineAge40Identity(alliancePost)} |`,
    '',
    '## Endgame interface reserved',
    '',
    '- Late-life events do **not** set `founding_patriarch_endgame_echo_done`',
    '- Pressure markers preserved after late-life (not cleared)',
    '',
    '## Cross-route regression',
    '',
    '- `npm run test:sample-lines-routes` — flat patron/magnate/founding chain + baseline guard',
  ];
  writeFileSync(
    join(process.cwd(), 'docs/test-reports/p117-founding-patriarch-late-life-targeted-proof.md'),
    lines.join('\n') + '\n',
    'utf8',
  );
}

const tests: Array<[string, () => void]> = [
  ['R1 late-life events exist', testLateLifeEventsExist],
  ['R2 late-life is auto', testLateLifeIsAuto],
  ['R3 gate requires payoff', testLateLifeGateRequiresPayoff],
  ['R4 age range 52-56', testLateLifeAgeRange],
  ['R5 two pressure-keyed branches', testTwoConditionalBranches],
  ['R6 checkpoint late_life_done', testAllBranchesSetCheckpointFlags],
  ['R8 branch markers', testEachBranchSetsLateMarker],
  ['R9 markers mutually exclusive', testLateMarkersMutuallyExclusive],
  ['R10 no endgame echo flag', testLateLifeDoesNotSetEndgameEcho],
  ['R11 pre-late-life cost', testPreLateLifeCostLabel],
  ['R12 pre-late-life goal', testPreLateLifeGoal],
  ['R13 late-life A cost', testLateLifeAExpression],
  ['R15 late-life B cost/goal', testLateLifeBExpression],
  ['R19 spine ordering', testSpineOrdering],
  ['R21 branch matches pressure', testLateLifeBranchMatchesPressure],
];

let passed = 0;
for (const [name, fn] of tests) {
  fn();
  passed++;
  console.log(`✓ ${name}`);
}

writeTargetedProof();
console.log('✓ targeted proof written');

console.log(`\n${passed}/${tests.length} assertions passed`);
