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
const endgameEvents = allEvents.filter(e => e.id.startsWith('founding_patriarch_endgame_echo_'));
const branchAEvent = allEvents.find(e => e.id === 'founding_patriarch_endgame_echo_rule_keeper');
const branchBEvent = allEvents.find(e => e.id === 'founding_patriarch_endgame_echo_alliance_bearer');
const lateLifeAEvent = allEvents.find(e => e.id === 'founding_patriarch_late_life_rule_keeper');

const ENDGAME_MARKERS = [
  'founding_patriarch_endgame_rule_echo',
  'founding_patriarch_endgame_alliance_echo',
] as const;

const LATE_TO_ENDGAME: Array<[string, string, typeof ENDGAME_MARKERS[number]]> = [
  ['founding_patriarch_late_rule_keeper', 'founding_patriarch_endgame_echo_rule_keeper', 'founding_patriarch_endgame_rule_echo'],
  ['founding_patriarch_late_alliance_bearer', 'founding_patriarch_endgame_echo_alliance_bearer', 'founding_patriarch_endgame_alliance_echo'],
];

function patriarchState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 62,
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
      founding_patriarch_late_life_done: true,
      founding_patriarch_late_life_identity_done: true,
      founding_patriarch_late_rule_keeper: true,
      p16_scholar_mentor: true,
      p22_faction_continuation_active: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

// Group 1: Event wiring (R1–R11)

function testEndgameEventsExist(): void {
  assert(endgameEvents.length === 2, 'R1: founding_patriarch_endgame_echo branch events should exist');
  assert(Boolean(branchAEvent), 'R1: rule_keeper endgame exists');
  assert(Boolean(branchBEvent), 'R1: alliance_bearer endgame exists');
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
    assert(expr.includes('founding_patriarch_late_life_done'), `R3: ${evt.id} gate requires late-life done`);
  }
  const evaluator = new ConditionEvaluator();
  const state = patriarchState();
  assert(evaluator.evaluate(branchAEvent!.conditions![0]!, state), 'late-life + rule_keeper should pass branch A gate');
  const noLateLife = patriarchState();
  delete (noLateLife.flags as Record<string, unknown>).founding_patriarch_late_life_done;
  assert(!evaluator.evaluate(branchAEvent!.conditions![0]!, noLateLife), 'missing late-life should fail');
}

function testEndgameAgeRange(): void {
  for (const evt of endgameEvents) {
    assert(evt.ageRange?.min === 60, `R4: ${evt.id} min age should be 60`);
    assert(evt.ageRange?.max === 65, `R4: ${evt.id} max age should be 65`);
  }
}

function testTwoConditionalBranches(): void {
  assert(endgameEvents.length === 2, 'R5: 2 conditional branches keyed on late-life marker');
  const lateMarkers = [
    'founding_patriarch_late_rule_keeper',
    'founding_patriarch_late_alliance_bearer',
  ];
  endgameEvents.forEach((evt, i) => {
    const expr = evt.conditions![0]!.expression ?? '';
    assert(expr.includes(lateMarkers[i]!), `R5: ${evt.id} keyed on ${lateMarkers[i]}`);
  });
}

function testAllBranchesSetCheckpointFlags(): void {
  for (const evt of endgameEvents) {
    const effects = evt.autoEffects ?? [];
    for (const flag of ['founding_patriarch_endgame_echo_done', 'founding_patriarch_endgame_identity_done']) {
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
    (evt.autoEffects ?? []).filter(
      e => e.type === 'flag_set' && ENDGAME_MARKERS.includes(e.target as typeof ENDGAME_MARKERS[number]),
    ),
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
      !effects.some(e => e.type === 'flag_unset' && e.target === 'founding_patriarch_late_life_done'),
      `R10: ${evt.id} must not unset founding_patriarch_late_life_done`,
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
  const state = patriarchState();
  delete (state.flags as Record<string, unknown>).founding_patriarch_endgame_echo_done;
  assert(deriveSampleLineCostLabel(state) === '门规守成之累', 'R12: pre-endgame cost should be late-life label');
}

function testPreEndgameGoal(): void {
  const state = patriarchState({
    flags: {
      founding_patriarch_on_ramp_alliance: true,
      founding_patriarch_on_ramp_scholar: false,
      founding_patriarch_pressure_rule_first: false,
      founding_patriarch_pressure_alliance_first: true,
      founding_patriarch_late_rule_keeper: false,
      founding_patriarch_late_alliance_bearer: true,
    },
  });
  delete (state.flags as Record<string, unknown>).founding_patriarch_endgame_echo_done;
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('守盟约至终'), 'R13: pre-endgame goal should be late-life state');
}

// Group 3: Post-endgame expression per branch (R14–R20)

function testEndgameAExpression(): void {
  const state = patriarchState({
    flags: {
      founding_patriarch_endgame_echo_done: true,
      founding_patriarch_endgame_identity_done: true,
      founding_patriarch_endgame_rule_echo: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '开派终局·规', 'R14: endgame A cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('门规碑立'), 'R15: endgame A goal');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('门规碑上的开宗祖师'), 'R18: endgame A identity');
}

function testEndgameBExpression(): void {
  const state = patriarchState({
    flags: {
      p16_scholar_mentor: false,
      founding_patriarch_on_ramp_scholar: false,
      founding_patriarch_on_ramp_alliance: true,
      founding_patriarch_pressure_rule_first: false,
      founding_patriarch_pressure_alliance_first: true,
      founding_patriarch_late_rule_keeper: false,
      founding_patriarch_late_alliance_bearer: true,
      founding_patriarch_endgame_echo_done: true,
      founding_patriarch_endgame_identity_done: true,
      founding_patriarch_endgame_alliance_echo: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '开派终局·盟', 'R16: endgame B cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('盟约碑立'), 'R17: endgame B goal');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('诸派盟约线'), 'R20: alliance on-ramp + endgame B identity');
}

// Group 4: Spine ordering (R21–R22)

function testSpineOrdering(): void {
  const entryIdx = allEvents.findIndex(e => e.id === 'founding_patriarch_bridge_entry');
  const pressureIdx = allEvents.findIndex(e => e.id === 'founding_patriarch_midlife_pressure');
  const payoffIdx = allEvents.findIndex(e => e.id === 'founding_patriarch_payoff_echo');
  const lateIdx = allEvents.findIndex(e => e.id === 'founding_patriarch_late_life_rule_keeper');
  const endgameIdx = allEvents.findIndex(e => e.id === 'founding_patriarch_endgame_echo_rule_keeper');
  assert(entryIdx >= 0 && pressureIdx >= 0 && payoffIdx >= 0 && lateIdx >= 0 && endgameIdx >= 0, 'R21: all founding spine events exist');
  assert(entryIdx < pressureIdx, 'R21: entry before pressure');
  assert(pressureIdx < payoffIdx, 'R21: pressure before payoff');
  assert(payoffIdx < lateIdx, 'R21: payoff before late-life');
  assert(lateIdx < endgameIdx, 'R21: late-life before endgame');
  assert((lateLifeAEvent?.ageRange?.max ?? 0) <= (branchAEvent?.ageRange?.min ?? 99), 'R22: late-life age before endgame');
}

// Cross-route regression: npm run test:sample-lines-routes

function writeTargetedProof(): void {
  const scholarPre = patriarchState({ player: { age: 58 } as PlayerState });
  delete (scholarPre.flags as Record<string, unknown>).founding_patriarch_endgame_echo_done;
  const scholarPost = patriarchState({
    flags: {
      founding_patriarch_endgame_echo_done: true,
      founding_patriarch_endgame_identity_done: true,
      founding_patriarch_endgame_rule_echo: true,
    },
  });
  const alliancePost = patriarchState({
    flags: {
      p16_scholar_mentor: false,
      founding_patriarch_on_ramp_scholar: false,
      founding_patriarch_on_ramp_alliance: true,
      founding_patriarch_pressure_rule_first: false,
      founding_patriarch_pressure_alliance_first: true,
      founding_patriarch_late_rule_keeper: false,
      founding_patriarch_late_alliance_bearer: true,
      founding_patriarch_endgame_echo_done: true,
      founding_patriarch_endgame_identity_done: true,
      founding_patriarch_endgame_alliance_echo: true,
    },
  });

  const lines = [
    '# P119 Founding Patriarch Endgame Targeted Proof',
    '',
    '> **Stage:** P119 Founding Patriarch Endgame Playable Implementation',
    '> **Date:** 2026-07-02',
    '> **Contract:** P118 founding-patriarch-endgame-contract',
    '',
    '## Core nodes (validation shape §2.2)',
    '',
    '| Node | Verification |',
    '| ---- | ------------ |',
    '| 9 Pre-endgame state | `late_life_done` true, `endgame_echo_done` false — cost/goal reflect late-life |',
    '| 10 Endgame fires | auto events at age 60–65 keyed on late-life marker |',
    '| 11 Checkpoint | `founding_patriarch_endgame_echo_done` via autoEffects |',
    '| 12 Identity done | `founding_patriarch_endgame_identity_done` via autoEffects |',
    '| 13 Branch marker | one of `founding_patriarch_endgame_*` matches late-life branch |',
    '| 14 Cost label | endgame branch cost label per branch |',
    '| 15 Current goal | endgame branch goal per branch |',
    '',
    '## Branch A: Scholar on-ramp → rule_first → payoff → late-life rule_keeper → endgame rule_echo',
    '',
    '| Step | Flag / Signal | Value |',
    '| ---- | ------------- | ----- |',
    '| Pre-endgame | `founding_patriarch_late_life_done` | true |',
    '| Pre-endgame | `founding_patriarch_endgame_echo_done` | false |',
    `| Pre-endgame cost | deriveSampleLineCostLabel | ${deriveSampleLineCostLabel(scholarPre)} |`,
    `| Pre-endgame goal | deriveSampleLineCurrentGoal | ${deriveSampleLineCurrentGoal(scholarPre)} |`,
    '| Endgame event | `founding_patriarch_endgame_echo_rule_keeper` fires at 62 |',
    '| Post-endgame | `founding_patriarch_endgame_rule_echo` | true |',
    `| Post-endgame cost | deriveSampleLineCostLabel | ${deriveSampleLineCostLabel(scholarPost)} |`,
    `| Post-endgame goal | deriveSampleLineCurrentGoal | ${deriveSampleLineCurrentGoal(scholarPost)} |`,
    `| Post-endgame identity | deriveSampleLineAge40Identity | ${deriveSampleLineAge40Identity(scholarPost)} |`,
    '',
    '## Branch B: Alliance on-ramp → alliance_first → payoff → late-life alliance_bearer → endgame alliance_echo',
    '',
    '| Step | Flag / Signal | Value |',
    '| ---- | ------------- | ----- |',
    '| Post-endgame | `founding_patriarch_endgame_alliance_echo` | true |',
    `| Post-endgame cost | deriveSampleLineCostLabel | ${deriveSampleLineCostLabel(alliancePost)} |`,
    `| Post-endgame goal | deriveSampleLineCurrentGoal | ${deriveSampleLineCurrentGoal(alliancePost)} |`,
    `| Post-endgame identity | deriveSampleLineAge40Identity | ${deriveSampleLineAge40Identity(alliancePost)} |`,
    '',
    '## Lightweight constraint',
    '',
    '- No stat_modify in endgame autoEffects',
    '- `founding_patriarch_late_life_done` preserved (not unset)',
    '',
    '## Cross-route regression',
    '',
    '- `npm run test:sample-lines-routes` — flat patron/magnate/founding chain + baseline guard',
  ];
  writeFileSync(
    join(process.cwd(), 'docs/test-reports/p119-founding-patriarch-endgame-targeted-proof.md'),
    lines.join('\n') + '\n',
    'utf8',
  );
}

const tests: Array<[string, () => void]> = [
  ['R1 endgame events exist', testEndgameEventsExist],
  ['R2 endgame is auto', testEndgameIsAuto],
  ['R3 gate requires late-life', testEndgameGateRequiresLateLife],
  ['R4 age range 60-65', testEndgameAgeRange],
  ['R5 two conditional branches', testTwoConditionalBranches],
  ['R6 checkpoint echo_done', testAllBranchesSetCheckpointFlags],
  ['R8 branch markers', testEachBranchSetsEndgameMarker],
  ['R9 markers mutually exclusive', testEndgameMarkersMutuallyExclusive],
  ['R10 no unset late_life_done', testEndgameDoesNotUnsetLateLife],
  ['R11 no stat changes', testEndgameNoStatChanges],
  ['R12 pre-endgame cost', testPreEndgameCostLabel],
  ['R13 pre-endgame goal', testPreEndgameGoal],
  ['R14 endgame A cost', testEndgameAExpression],
  ['R16 endgame B cost/goal', testEndgameBExpression],
  ['R21 spine ordering', testSpineOrdering],
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
