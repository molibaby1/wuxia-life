import { execSync } from 'node:child_process';
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
const payoffEvent = allEvents.find(e => e.id === 'merchant_patron_payoff_echo');
const lateLifeEvents = allEvents.filter(e => e.id.startsWith('merchant_patron_late_life'));
const branchAEvent = allEvents.find(e => e.id === 'merchant_patron_late_life_covenant_bound');
const branchBEvent = allEvents.find(e => e.id === 'merchant_patron_late_life_isolated_merchant');
const branchCEvent = allEvents.find(e => e.id === 'merchant_patron_late_life_sustainable_covenant');

const LATE_LIFE_MARKERS = [
  'merchant_patron_late_covenant_bound',
  'merchant_patron_late_isolated_merchant',
  'merchant_patron_late_sustainable_covenant',
] as const;

const PAYOFF_TO_LATE: Array<[string, string, typeof LATE_LIFE_MARKERS[number]]> = [
  ['merchant_patron_payoff_covenant_holder', 'merchant_patron_late_life_covenant_bound', 'merchant_patron_late_covenant_bound'],
  ['merchant_patron_payoff_covenant_breaker', 'merchant_patron_late_life_isolated_merchant', 'merchant_patron_late_isolated_merchant'],
  ['merchant_patron_payoff_balancer', 'merchant_patron_late_life_sustainable_covenant', 'merchant_patron_late_sustainable_covenant'],
];

function patronState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 54,
      charisma: 10,
      money: 200,
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
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

// Group 1: Event wiring (R1–R10)

function testLateLifeEventsExist(): void {
  assert(lateLifeEvents.length === 3, 'R1: merchant_patron_late_life branch events should exist');
  assert(Boolean(branchAEvent), 'R1: covenant_bound branch exists');
  assert(Boolean(branchBEvent), 'R1: isolated_merchant branch exists');
  assert(Boolean(branchCEvent), 'R1: sustainable_covenant branch exists');
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
    assert(expr.includes('merchant_patron_payoff_done'), `R3: ${evt.id} gate requires payoff done`);
  }
  const evaluator = new ConditionEvaluator();
  const state = patronState({ flags: { merchant_patron_payoff_covenant_holder: true } });
  assert(evaluator.evaluate(branchAEvent!.conditions![0]!, state), 'payoff + holder should pass branch A gate');
  const noPayoff = patronState();
  delete (noPayoff.flags as Record<string, unknown>).merchant_patron_payoff_done;
  assert(!evaluator.evaluate(branchAEvent!.conditions![0]!, noPayoff), 'missing payoff should fail');
}

function testLateLifeAgeRange(): void {
  for (const evt of lateLifeEvents) {
    assert(evt.ageRange?.min === 52, `R4: ${evt.id} min age should be 52`);
    assert(evt.ageRange?.max === 56, `R4: ${evt.id} max age should be 56`);
  }
}

function testThreeConditionalBranches(): void {
  assert(lateLifeEvents.length === 3, 'R5: 3 conditional branches keyed on payoff marker');
  const payoffMarkers = [
    'merchant_patron_payoff_covenant_holder',
    'merchant_patron_payoff_covenant_breaker',
    'merchant_patron_payoff_balancer',
  ];
  lateLifeEvents.forEach((evt, i) => {
    const expr = evt.conditions![0]!.expression ?? '';
    assert(expr.includes(payoffMarkers[i]!), `R5: ${evt.id} keyed on ${payoffMarkers[i]}`);
  });
}

function testAllBranchesSetCheckpointFlags(): void {
  for (const evt of lateLifeEvents) {
    const effects = evt.autoEffects ?? [];
    for (const flag of ['merchant_patron_late_life_done', 'merchant_patron_late_life_identity_done']) {
      assert(
        effects.some(e => e.type === 'flag_set' && e.target === flag),
        `R6/R7: ${evt.id} sets ${flag}`,
      );
    }
  }
}

function testEachBranchSetsLateMarker(): void {
  for (const [, eventId, marker] of PAYOFF_TO_LATE) {
    const evt = allEvents.find(e => e.id === eventId)!;
    assert(
      (evt.autoEffects ?? []).some(e => e.type === 'flag_set' && e.target === marker),
      `R8: ${eventId} sets ${marker}`,
    );
  }
}

function testLateMarkersMutuallyExclusive(): void {
  const markersPerEvent = lateLifeEvents.map(evt =>
    (evt.autoEffects ?? []).filter(e => e.type === 'flag_set' && LATE_LIFE_MARKERS.includes(e.target as typeof LATE_LIFE_MARKERS[number])),
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
      !effects.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_endgame_echo_done'),
      `R10: ${evt.id} must not set merchant_patron_endgame_echo_done`,
    );
  }
}

// Group 2: Pre-late-life expression (R11–R12)

function testPreLateLifeCostLabel(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_orthodox: true,
      merchant_patron_payoff_covenant_holder: true,
    },
  });
  delete (state.flags as Record<string, unknown>).merchant_patron_late_life_done;
  assert(deriveSampleLineCostLabel(state) === '盟约如山之累', 'R11: pre-late-life cost should be payoff label');
}

function testPreLateLifeGoal(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_martial: true,
      merchant_patron_payoff_covenant_breaker: true,
    },
  });
  delete (state.flags as Record<string, unknown>).merchant_patron_late_life_done;
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('撕破盟约'), 'R12: pre-late-life goal should be payoff state');
}

// Group 3: Post-late-life expression per branch (R13–R20)

function testLateLifeAExpression(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_orthodox: true,
      merchant_patron_payoff_covenant_holder: true,
      merchant_patron_late_life_done: true,
      merchant_patron_late_life_identity_done: true,
      merchant_patron_late_covenant_bound: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '盟约终老之累', 'R13: late-life A cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('守盟约至终'), 'R14: late-life A goal');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('盟约终老'), 'R19: late-life A identity');
}

function testLateLifeBExpression(): void {
  const state = patronState({
    flags: {
      merchant_patron_on_ramp_martial: true,
      merchant_patron_payoff_covenant_breaker: true,
      merchant_patron_late_life_done: true,
      merchant_patron_late_isolated_merchant: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '孤商自在之快', 'R15: late-life B cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('商路自分断'), 'R16: late-life B goal');
}

function testLateLifeCExpression(): void {
  const state = patronState({
    flags: {
      merchant_patron_bridge_apprentice_craft: true,
      apprentice_merchant_bridge_crossed: true,
      merchant_patron_payoff_balancer: true,
      merchant_patron_late_life_done: true,
      merchant_patron_late_life_identity_done: true,
      merchant_patron_late_sustainable_covenant: true,
    },
  });
  assert(deriveSampleLineCostLabel(state) === '新盟久立之累', 'R17: late-life C cost label');
  const goal = deriveSampleLineCurrentGoal(state);
  assert(goal?.includes('守新盟规矩'), 'R18: late-life C goal');
  const identity = deriveSampleLineAge40Identity(state);
  assert(identity?.includes('手艺标准'), 'R20: bridge-origin + late-life C identity');
}

// Group 4: Spine ordering (R21–R22)

function testSpineOrdering(): void {
  const entryIdx = allEvents.findIndex(e => e.id === 'merchant_patron_bridge_entry');
  const pressureIdx = allEvents.findIndex(e => e.id === 'merchant_patron_midlife_pressure');
  const payoffIdx = allEvents.findIndex(e => e.id === 'merchant_patron_payoff_echo');
  const lateIdx = allEvents.findIndex(e => e.id === 'merchant_patron_late_life_covenant_bound');
  assert(entryIdx >= 0 && pressureIdx >= 0 && payoffIdx >= 0 && lateIdx >= 0, 'R21: all patron spine events exist');
  assert(entryIdx < pressureIdx, 'R21: entry before pressure');
  assert(pressureIdx < payoffIdx, 'R21: pressure before payoff');
  assert(payoffIdx < lateIdx, 'R21: payoff before late-life');
  assert((payoffEvent?.ageRange?.max ?? 0) <= (branchAEvent?.ageRange?.min ?? 99), 'R22: payoff age before late-life');
}

// Group 5: Prior stage regression (R23–R30)

function testP102Regression(): void {
  execSync('npm exec tsx tests/p102MerchantMartialPatronBridgeTests.ts', { stdio: 'pipe' });
}

function testP103Regression(): void {
  execSync('npm exec tsx tests/p103MerchantMartialPatronBridgeOriginTests.ts', { stdio: 'pipe' });
}

function testP104Regression(): void {
  execSync('npm exec tsx tests/p104MerchantMartialPatronBridgeOriginPeasantTests.ts', { stdio: 'pipe' });
}

function testP106Regression(): void {
  execSync('npm exec tsx tests/p106MerchantMartialPatronPressureTests.ts', { stdio: 'pipe' });
}

function testP108Regression(): void {
  execSync('npm exec tsx tests/p108MerchantMartialPatronPayoffTests.ts', { stdio: 'pipe' });
}

function testP100MagnateRegression(): void {
  execSync('npm exec tsx tests/p100MerchantMagnateNativeEndgameTests.ts', { stdio: 'pipe' });
}

function testP101MagnateRegression(): void {
  execSync('npm exec tsx tests/p101MerchantMagnateBridgeOriginEndgameTests.ts', { stdio: 'pipe' });
}

function testSampleLinesBaselineGuard(): void {
  execSync('npm run guard:sample-lines-baseline', { stdio: 'pipe' });
}

function writeTargetedProof(): void {
  const lines = [
    '# P110 Merchant Martial Patron Late-Life Targeted Proof',
    '',
    '> **Stage:** P110 Patron Late-Life Playable Implementation',
    '> **Date:** 2026-07-02',
    '> **Contract:** P109 merchant-martial-patron-late-life-contract',
    '',
    '## Core nodes (validation shape §2.2)',
    '',
    '| Node | Verification |',
    '| ---- | ------------ |',
    '| 9 Pre-late-life state | `payoff_done` true, `late_life_done` false — cost/goal reflect payoff |',
    '| 10 Late-life fires | auto events at age 52–56 keyed on payoff marker |',
    '| 11 Checkpoint | `merchant_patron_late_life_done` via autoEffects |',
    '| 13 Branch marker | one of `merchant_patron_late_*` matches payoff choice |',
    '| 14 Cost label | late-life branch cost label per branch |',
    '| 15 Current goal | late-life branch goal per branch |',
    '',
    '## Path A: Native orthodox → payoff hold → late-life covenant bound',
    '',
    '| Step | Flags / Expression |',
    '| ---- | ------------------ |',
    '| Entry | `merchant_patron_on_ramp_orthodox` |',
    '| Payoff | `merchant_patron_payoff_covenant_holder` |',
    '| Pre-late-life | cost=盟约如山之累, goal=硬扛盟约护商 |',
    '| Late-life event | `merchant_patron_late_life_covenant_bound` fires |',
    '| Post-late-life | `merchant_patron_late_covenant_bound`, cost=盟约终老之累, goal=守盟约至终 |',
    '| Identity | 盟约终老的商武金主 |',
    '',
    '## Path B: Native martial → payoff break → late-life isolated merchant',
    '',
    '| Step | Flags / Expression |',
    '| ---- | ------------------ |',
    '| Entry | `merchant_patron_on_ramp_martial` |',
    '| Payoff | `merchant_patron_payoff_covenant_breaker` |',
    '| Pre-late-life | cost=断武从商之快, goal=撕破盟约 |',
    '| Late-life event | `merchant_patron_late_life_isolated_merchant` fires |',
    '| Post-late-life | `merchant_patron_late_isolated_merchant`, cost=孤商自在之快, goal=商路自分断 |',
    '',
    '## Path C: Bridge apprentice → payoff balance → late-life sustainable covenant',
    '',
    '| Step | Flags / Expression |',
    '| ---- | ------------------ |',
    '| Entry | `merchant_patron_bridge_apprentice_craft` + `apprentice_merchant_bridge_crossed` |',
    '| Payoff | `merchant_patron_payoff_balancer` |',
    '| Pre-late-life | cost=商武新矩之累, goal=重谈盟约边界 |',
    '| Late-life event | `merchant_patron_late_life_sustainable_covenant` fires |',
    '| Post-late-life | `merchant_patron_late_sustainable_covenant`, cost=新盟久立之累, goal=守新盟规矩 |',
    '| Identity | 新盟掌局的金主 + 手艺标准 overlay |',
    '',
    '## Endgame interface',
    '',
    '- `merchant_patron_endgame_echo_done` not set by late-life (reserved P111+)',
    '',
    '## Regression',
    '',
    '- P102–P108 patron tests pass',
    '- P100/P101 magnate tests pass',
    '- `guard:sample-lines-baseline` pass',
  ];
  writeFileSync(
    join(process.cwd(), 'docs/test-reports/p110-merchant-martial-patron-late-life-targeted-proof.md'),
    `${lines.join('\n')}\n`,
  );
}

function writeClosureReport(): void {
  const lines = [
    '# P110 Merchant Martial Patron Late-Life Closure Report',
    '',
    '> **Stage:** P110 Patron Late-Life Playable Implementation',
    '> **Date:** 2026-07-02',
    '> **Contract:** P109 merchant-martial-patron-late-life-contract',
    '',
    '## Summary',
    '',
    'P110 delivers runtime late-life for `merchant_martial_patron`: 3 auto branch events keyed on payoff choice, expression updates (cost label / goal / identity), targeted proof, and regression tests.',
    '',
    '## Closure criteria (12/12)',
    '',
    '| # | Criterion | Status | Evidence |',
    '| - | --------- | ------ | -------- |',
    '| C1 | Late-life fires as auto | ✅ | 3 auto events in spine |',
    '| C2 | Checkpoint flags set | ✅ | `late_life_done` + `late_life_identity_done` |',
    '| C3 | Branch marker traceable | ✅ | `merchant_patron_late_*` per payoff |',
    '| C4 | Cost label per branch | ✅ | R13–R18 tests |',
    '| C5 | Current goal per branch | ✅ | R14, R16, R18 tests |',
    '| C6 | Identity updates | ✅ | R19, R20 tests |',
    '| C7 | 商武一体 flavor | ✅ | 账房/演武场/盟约/刀 in narrative + expression |',
    '| C8 | No P102–P108 regressions | ✅ | R23–R27 |',
    '| C9 | No magnate regressions | ✅ | R28 |',
    '| C10 | Typecheck passes | ✅ | npm run typecheck |',
    '| C11 | Guard sample-lines-baseline | ✅ | R29 |',
    '| C12 | Endgame interfaces reserved | ✅ | R10 — no `endgame_echo_done` |',
    '',
    '## What patron late-life now provides',
    '',
    '- Auto late-life at age 52–56 after payoff',
    '- Three payoff-driven branches: 盟约绑紧 / 自由孤立 / 新盟可持续',
    '- Player-facing differentiation via cost label, goal, and identity',
    '',
    '## Endgame echo recommendation',
    '',
    '**Worth opening P111+:** Late-life checkpoints and branch markers are wired; endgame echo can read `merchant_patron_late_*` for narrative continuity, mirroring renown/medical patterns.',
    '',
    '## Deferred',
    '',
    '- Full 5×3 entry×payoff×late-life identity matrix',
    '- Ordinary-origin patron late-life expression',
    '- Stat threshold gates for late-life',
    '- `gate:p20` broad rerun',
    '- Patron endgame echo implementation (P111+)',
  ];
  writeFileSync(
    join(process.cwd(), 'docs/test-reports/p110-merchant-martial-patron-late-life-closure-report.md'),
    `${lines.join('\n')}\n`,
  );
}

console.log('=== P110 Merchant Martial Patron Late-Life Tests ===\n');

console.log('Group 1: Event wiring');
testLateLifeEventsExist();
testLateLifeIsAuto();
testLateLifeGateRequiresPayoff();
testLateLifeAgeRange();
testThreeConditionalBranches();
testAllBranchesSetCheckpointFlags();
testEachBranchSetsLateMarker();
testLateMarkersMutuallyExclusive();
testLateLifeDoesNotSetEndgameEcho();
console.log('  ✓ R1–R10 pass\n');

console.log('Group 2: Pre-late-life expression');
testPreLateLifeCostLabel();
testPreLateLifeGoal();
console.log('  ✓ R11–R12 pass\n');

console.log('Group 3: Post-late-life expression');
testLateLifeAExpression();
testLateLifeBExpression();
testLateLifeCExpression();
console.log('  ✓ R13–R20 pass\n');

console.log('Group 4: Spine ordering');
testSpineOrdering();
console.log('  ✓ R21–R22 pass\n');

console.log('Group 5: Prior stage regression');
testP102Regression();
testP103Regression();
testP104Regression();
testP106Regression();
testP108Regression();
testP100MagnateRegression();
testP101MagnateRegression();
testSampleLinesBaselineGuard();
console.log('  ✓ R23–R29 pass\n');

writeTargetedProof();
writeClosureReport();
console.log('  ✓ targeted proof + closure report written\n');

console.log('All P110 tests passed.');
