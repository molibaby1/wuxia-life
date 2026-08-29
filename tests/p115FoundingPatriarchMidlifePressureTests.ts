import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
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
const pressureEvent = allEvents.find(e => e.id === 'founding_patriarch_midlife_pressure');
const payoffEvent = allEvents.find(e => e.id === 'founding_patriarch_payoff_echo');

function patriarchState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 42,
      charisma: 12,
      martialPower: 52,
      reputation: 48,
      connections: 50,
      ...(overrides.player ?? {}),
    } as PlayerState,
    flags: {
      orthodox_childhood_seed_done: true,
      founding_patriarch_on_ramp_done: true,
      p16_scholar_mentor: true,
      p22_faction_continuation_active: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

function testPressureExistsAndGates(): void {
  assert(Boolean(pressureEvent), 'pressure event should exist');
  assert(pressureEvent?.ageRange?.min === 40 && pressureEvent?.ageRange?.max === 45, 'pressure age gate 40-45');
  const evaluator = new ConditionEvaluator();
  assert(evaluator.evaluate(pressureEvent!.conditions![0]!, patriarchState()), 'on-ramp done should pass pressure gate');
  assert(
    !evaluator.evaluate(
      pressureEvent!.conditions![0]!,
      patriarchState({ flags: { orthodox_childhood_seed_done: true, founding_patriarch_on_ramp_done: false } }),
    ),
    'missing on-ramp should fail pressure gate',
  );
}

function testPressureBranchesAndCheckpoint(): void {
  const scholarChoice = pressureEvent!.choices!.find(c => c.id === 'patriarch_pressure_rule_first')!;
  const allianceChoice = pressureEvent!.choices!.find(c => c.id === 'patriarch_pressure_alliance_first')!;
  assert(
    (scholarChoice.effects ?? []).some(e => e.type === 'flag_set' && e.target === 'founding_patriarch_midlife_pressure_done'),
    'scholar branch sets pressure checkpoint',
  );
  assert(
    (allianceChoice.effects ?? []).some(e => e.type === 'flag_set' && e.target === 'founding_patriarch_midlife_pressure_done'),
    'alliance branch sets pressure checkpoint',
  );
  assert(
    (scholarChoice.effects ?? []).some(e => e.type === 'flag_set' && e.target === 'founding_patriarch_pressure_rule_first'),
    'scholar branch sets rule-first marker',
  );
  assert(
    (allianceChoice.effects ?? []).some(
      e => e.type === 'flag_set' && e.target === 'founding_patriarch_pressure_alliance_first',
    ),
    'alliance branch sets alliance-first marker',
  );
}

function testPressureExpressionSignals(): void {
  const scholar = patriarchState({
    flags: {
      founding_patriarch_midlife_pressure_done: true,
      founding_patriarch_pressure_rule_first: true,
    },
  });
  const alliance = patriarchState({
    flags: {
      p16_scholar_mentor: false,
      founding_patriarch_midlife_pressure_done: true,
      founding_patriarch_pressure_alliance_first: true,
      p16_alliance_brokered: true,
    },
  });

  const scholarGoal = deriveSampleLineCurrentGoal(scholar) ?? '';
  const allianceGoal = deriveSampleLineCurrentGoal(alliance) ?? '';
  assert(deriveSampleLineCostLabel(scholar) === '门派延续之重', 'pressure cost label');
  assert(deriveSampleLineCostLabel(alliance) === '门派延续之重', 'pressure cost label alliance');
  assert(scholarGoal.includes('门规传承') && scholarGoal.includes('盟约续责'), 'scholar goal signal');
  assert(allianceGoal.includes('门规传承') && allianceGoal.includes('盟约续责'), 'alliance goal signal');
  assert(scholarGoal !== allianceGoal, 'scholar/alliance goals stay distinguishable');
}

function testPayoffRequiresPressureCheckpoint(): void {
  const evaluator = new ConditionEvaluator();
  const ready = patriarchState({
    player: { age: 50 } as PlayerState,
    flags: {
      founding_patriarch_midlife_pressure_done: true,
      founding_patriarch_pressure_rule_first: true,
    },
  });
  const blocked = patriarchState({
    player: { age: 50 } as PlayerState,
    flags: { founding_patriarch_on_ramp_done: true },
  });
  assert(evaluator.evaluate(payoffEvent!.conditions![0]!, ready), 'payoff opens after pressure checkpoint');
  assert(!evaluator.evaluate(payoffEvent!.conditions![0]!, blocked), 'payoff blocked before pressure checkpoint');
}

function writeProof(): void {
  const lines = [
    '# P115 Founding Patriarch Midlife Pressure Targeted Proof',
    '',
    '> **Stage:** P115 Founding Patriarch Midlife Pressure Playable Implementation',
    '> **Date:** 2026-07-02',
    '',
    '## Chain validation',
    '',
    '| Step | Gate | Checkpoint |',
    '| ---- | ---- | ---------- |',
    '| On-ramp | `founding_patriarch_on_ramp_done` | entry from P113 |',
    '| Pressure (40-45) | `on_ramp_done && !midlife_pressure_done` | `founding_patriarch_midlife_pressure_done` + branch marker |',
    '| Payoff (48-52) | `midlife_pressure_done && !payoff_done` | `founding_patriarch_payoff_done` + payoff marker |',
    '',
    '## Branch sample signals',
    '',
    '- Rule-first branch sets `founding_patriarch_pressure_rule_first`',
    '- Alliance-first branch sets `founding_patriarch_pressure_alliance_first`',
    '- Both branches keep cost label as `门派延续之重`',
    '- Goals keep both `门规传承` and `盟约续责` while remaining branch-distinct',
  ];
  writeFileSync(
    join(process.cwd(), 'artifacts/reports/p115-founding-patriarch-midlife-pressure-targeted-proof.md'),
    lines.join('\n') + '\n',
    'utf8',
  );
}

const tests: Array<[string, () => void]> = [
  ['pressure exists and gates', testPressureExistsAndGates],
  ['pressure branches and checkpoint', testPressureBranchesAndCheckpoint],
  ['pressure expression signals', testPressureExpressionSignals],
  ['payoff requires pressure checkpoint', testPayoffRequiresPressureCheckpoint],
];

for (const [name, fn] of tests) {
  try {
    fn();
  } catch (error) {
    throw new Error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

writeProof();
console.log('p115FoundingPatriarchMidlifePressureTests: all passed');
