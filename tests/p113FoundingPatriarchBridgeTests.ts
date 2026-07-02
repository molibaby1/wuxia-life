import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import {
  deriveSampleLineAge40Identity,
  deriveSampleLineCostLabel,
  deriveSampleLineCurrentGoal,
  isPlayerVisibleSampleLineText,
} from '../src/p50/sampleLineExpression';
import sampleLinesSpine from '../src/data/lines/sample-lines-spine.json';
import type { GameState, PlayerState, SampleLineEvent } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const ENTRY_GATE_EXPR =
  "(flags.has('p16_scholar_mentor') || flags.has('p16_alliance_brokered')) && (flags.has('p22_faction_continuation_active') || flags.has('p16_alliance_brokered')) && flags.has('orthodox_childhood_seed_done')";

const PAYOFF_GATE_EXPR =
  "flags.has('founding_patriarch_midlife_pressure_done') && !flags.has('founding_patriarch_payoff_done')";

function patriarchBaseState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 34,
      charisma: 10,
      money: 80,
      martialPower: 50,
      reputation: 40,
      connections: 45,
      ...(overrides.player ?? {}),
    } as PlayerState,
    flags: {
      orthodox_childhood_seed_done: true,
      p16_scholar_mentor: true,
      p22_faction_continuation_active: true,
      p16_alliance_brokered: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

const allEvents = sampleLinesSpine as SampleLineEvent[];
const entryEvent = allEvents.find(e => e.id === 'founding_patriarch_bridge_entry');
const pressureEvent = allEvents.find(e => e.id === 'founding_patriarch_midlife_pressure');
const payoffEvent = allEvents.find(e => e.id === 'founding_patriarch_payoff_echo');

function testPatriarchBridgeEventsExist(): void {
  assert(Boolean(entryEvent), 'founding_patriarch_bridge_entry should exist');
  assert(Boolean(pressureEvent), 'founding_patriarch_midlife_pressure should exist');
  assert(Boolean(payoffEvent), 'founding_patriarch_payoff_echo should exist');
}

function testEntryEventShape(): void {
  assert(entryEvent?.eventType === 'choice', 'entry should be choice type');
  assert(entryEvent?.ageRange?.min === 32, 'entry min age should be 32');
  assert(entryEvent?.ageRange?.max === 38, 'entry max age should be 38');
  assert((entryEvent?.choices?.length ?? 0) >= 2, 'entry should have at least 2 choices');
}

function testEntryGateReadsScholarFactionFlags(): void {
  const evaluator = new ConditionEvaluator();
  const eligible = patriarchBaseState();
  assert(evaluator.evaluate(entryEvent!.conditions![0]!, eligible), 'scholar+faction should pass entry gate');

  const noScholarOrAlliance = patriarchBaseState({ flags: {} });
  delete (noScholarOrAlliance.flags as Record<string, unknown>).p16_scholar_mentor;
  delete (noScholarOrAlliance.flags as Record<string, unknown>).p16_alliance_brokered;
  assert(!evaluator.evaluate(entryEvent!.conditions![0]!, noScholarOrAlliance), 'missing scholar and alliance gate should fail');

  const noFaction = patriarchBaseState({ flags: { p16_scholar_mentor: true } });
  delete (noFaction.flags as Record<string, unknown>).p22_faction_continuation_active;
  delete (noFaction.flags as Record<string, unknown>).p16_alliance_brokered;
  assert(!evaluator.evaluate(entryEvent!.conditions![0]!, noFaction), 'missing faction commitment should fail');

  const alreadyCrossed = patriarchBaseState({ flags: { founding_patriarch_bridge_crossed: true } });
  assert(!evaluator.evaluate(entryEvent!.conditions![0]!, alreadyCrossed), 'already crossed should fail');

  const renownConflict = patriarchBaseState({ flags: { tavern_renown_bridge_crossed: true } });
  assert(!evaluator.evaluate(entryEvent!.conditions![0]!, renownConflict), 'active renown bridge should fail');
}

function testEntryChoicesSetCheckpointFlags(): void {
  const scholarChoice = entryEvent!.choices!.find(c => c.id === 'patriarch_embrace_scholar_mentor');
  const allianceChoice = entryEvent!.choices!.find(c => c.id === 'patriarch_embrace_alliance_faction');
  assert(Boolean(scholarChoice), 'scholar mentor choice should exist');
  assert(Boolean(allianceChoice), 'alliance faction choice should exist');

  for (const choice of [scholarChoice!, allianceChoice!]) {
    const effects = choice.effects ?? [];
    assert(
      effects.some(e => e.type === 'flag_set' && e.target === 'founding_patriarch_bridge_crossed'),
      `${choice.id} sets founding_patriarch_bridge_crossed`,
    );
    assert(
      effects.some(e => e.type === 'flag_set' && e.target === 'founding_patriarch_on_ramp_done'),
      `${choice.id} sets founding_patriarch_on_ramp_done`,
    );
    assert(
      effects.some(e => e.type === 'event_record' && e.target === 'founding_patriarch_bridge_entry'),
      `${choice.id} records founding_patriarch_bridge_entry`,
    );
  }
}

function testPayoffEchoShapeAndGate(): void {
  assert(payoffEvent?.eventType === 'choice', 'payoff should be choice type');
  assert(payoffEvent?.version === '2.0.0', 'payoff version should be 2.0.0');
  assert(payoffEvent?.ageRange?.min === 48, 'payoff min age should be 48');
  assert(payoffEvent?.ageRange?.max === 52, 'payoff max age should be 52');
  assert((payoffEvent?.choices?.length ?? 0) === 3, 'payoff should have 3 choices');

  const evaluator = new ConditionEvaluator();
  const eligible = patriarchBaseState({
    player: { age: 50 } as PlayerState,
    flags: {
      founding_patriarch_on_ramp_done: true,
      founding_patriarch_midlife_pressure_done: true,
      founding_patriarch_on_ramp_scholar: true,
    },
  });
  assert(evaluator.evaluate(payoffEvent!.conditions![0]!, eligible), 'pressure done should pass payoff gate');

  const noPressure = patriarchBaseState({
    player: { age: 50 } as PlayerState,
    flags: { founding_patriarch_on_ramp_done: true },
  });
  assert(!evaluator.evaluate(payoffEvent!.conditions![0]!, noPressure), 'missing pressure should fail payoff gate');
}

function testPressureEventShapeAndGate(): void {
  assert(pressureEvent?.eventType === 'choice', 'pressure should be choice type');
  assert(pressureEvent?.ageRange?.min === 40, 'pressure min age should be 40');
  assert(pressureEvent?.ageRange?.max === 45, 'pressure max age should be 45');
  assert((pressureEvent?.choices?.length ?? 0) === 2, 'pressure should have 2 choices');

  const evaluator = new ConditionEvaluator();
  const eligible = patriarchBaseState({
    player: { age: 42 } as PlayerState,
    flags: {
      founding_patriarch_on_ramp_done: true,
      p16_scholar_mentor: true,
    },
  });
  assert(evaluator.evaluate(pressureEvent!.conditions![0]!, eligible), 'on-ramp done should pass pressure gate');

  const noOnRamp = patriarchBaseState({
    player: { age: 42 } as PlayerState,
    flags: { p16_scholar_mentor: true },
  });
  assert(!evaluator.evaluate(pressureEvent!.conditions![0]!, noOnRamp), 'missing on-ramp should fail pressure gate');
}

function testPressureCheckpointAndScholarPriority(): void {
  const scholarChoice = pressureEvent!.choices!.find(c => c.id === 'patriarch_pressure_rule_first');
  const allianceChoice = pressureEvent!.choices!.find(c => c.id === 'patriarch_pressure_alliance_first');
  assert(Boolean(scholarChoice), 'pressure scholar choice should exist');
  assert(Boolean(allianceChoice), 'pressure alliance choice should exist');

  for (const choice of [scholarChoice!, allianceChoice!]) {
    const effects = choice.effects ?? [];
    assert(
      effects.some(e => e.type === 'flag_set' && e.target === 'founding_patriarch_midlife_pressure_done'),
      `${choice.id} sets founding_patriarch_midlife_pressure_done`,
    );
  }
  assert(
    (scholarChoice!.effects ?? []).some(
      e => e.type === 'flag_set' && e.target === 'founding_patriarch_pressure_rule_first',
    ),
    'scholar pressure choice should set founding_patriarch_pressure_rule_first',
  );
  assert(
    (allianceChoice!.effects ?? []).some(
      e => e.type === 'flag_set' && e.target === 'founding_patriarch_pressure_alliance_first',
    ),
    'alliance pressure choice should set founding_patriarch_pressure_alliance_first',
  );

  const evaluator = new ConditionEvaluator();
  const bothScholarAndAlliance = patriarchBaseState({
    player: { age: 42 } as PlayerState,
    flags: {
      founding_patriarch_on_ramp_done: true,
      p16_scholar_mentor: true,
      p16_alliance_brokered: true,
      p22_faction_continuation_active: true,
    },
  });
  assert(evaluator.evaluate(scholarChoice!.condition!, bothScholarAndAlliance), 'scholar branch available when scholar marker is set');
  assert(
    !evaluator.evaluate(allianceChoice!.condition!, bothScholarAndAlliance),
    'alliance-first branch should be blocked when scholar marker is set',
  );
}

function testPayoffSetsTerminalFlags(): void {
  const shared = payoffEvent?.autoEffects ?? [];
  assert(
    shared.some(e => e.type === 'flag_set' && e.target === 'founding_patriarch_payoff_done'),
    'payoff sets founding_patriarch_payoff_done',
  );
  assert(
    shared.some(e => e.type === 'flag_set' && e.target === 'founding_patriarch_identity_done'),
    'payoff sets founding_patriarch_identity_done',
  );
  assert(
    shared.some(e => e.type === 'flag_set' && e.target === 'founding_patriarch_payoff_resolved'),
    'payoff sets founding_patriarch_payoff_resolved',
  );

  const legacy = payoffEvent!.choices!.find(c => c.id === 'patriarch_payoff_hold_legacy')!;
  const independent = payoffEvent!.choices!.find(c => c.id === 'patriarch_payoff_independent_founder')!;
  const dual = payoffEvent!.choices!.find(c => c.id === 'patriarch_payoff_dual_gate')!;
  assert(
    (legacy.effects ?? []).some(e => e.type === 'flag_set' && e.target === 'founding_patriarch_payoff_legacy_holder'),
    'legacy choice sets legacy_holder marker',
  );
  assert(
    (independent.effects ?? []).some(e => e.type === 'flag_set' && e.target === 'founding_patriarch_payoff_independent_founder'),
    'independent choice sets independent_founder marker',
  );
  assert(
    (dual.effects ?? []).some(e => e.type === 'flag_set' && e.target === 'founding_patriarch_payoff_dual_gate'),
    'dual_gate choice sets dual_gate marker',
  );
}

function testPatriarchExpressionDiffersFromGenericOrthodoxAndRenown(): void {
  const patriarchOnRamp = patriarchBaseState({
    player: { age: 40 } as PlayerState,
    flags: {
      founding_patriarch_on_ramp_done: true,
      founding_patriarch_on_ramp_scholar: true,
    },
  });
  const genericOrthodox = patriarchBaseState({
    flags: { orthodox_formal_disciple: true },
  });
  delete (genericOrthodox.flags as Record<string, unknown>).founding_patriarch_on_ramp_done;
  const renown = {
    ...patriarchBaseState({
      player: { age: 40 } as PlayerState,
      flags: { renown_on_ramp_done: true, tavern_renown_bridge_crossed: true },
    }),
    flags: {
      renown_on_ramp_done: true,
      tavern_renown_bridge_crossed: true,
      route_renown_committed: true,
    },
  } as GameState;

  const patriarchGoal = deriveSampleLineCurrentGoal(patriarchOnRamp);
  const genericGoal = deriveSampleLineCurrentGoal(genericOrthodox);
  const renownGoal = deriveSampleLineCurrentGoal(renown);

  assert(patriarchGoal?.includes('开宗立派'), 'patriarch goal should mention 开宗立派');
  assert(!genericGoal?.includes('开宗立派'), 'generic orthodox goal should not mention founding patriarch');
  assert(renownGoal?.includes('名号'), 'renown goal should mention 名号');
  assert(!renownGoal?.includes('开宗立派'), 'renown should not mention founding patriarch');

  const patriarchCost = deriveSampleLineCostLabel(patriarchOnRamp);
  const genericCost = deriveSampleLineCostLabel(genericOrthodox);
  assert(patriarchCost.includes('开派'), 'patriarch cost label should mention 开派');
  assert(genericCost === '守正代价', 'generic orthodox cost should remain 守正代价');

  const patriarchIdentity = deriveSampleLineAge40Identity(patriarchOnRamp);
  assert(patriarchIdentity?.includes('开派'), 'patriarch identity should mention 开派');
  assert(isPlayerVisibleSampleLineText(patriarchGoal ?? ''), 'patriarch goal should be player-visible');
}

function testPatriarchPressureExpressionSignals(): void {
  const scholarPressureState = patriarchBaseState({
    player: { age: 42 } as PlayerState,
    flags: {
      founding_patriarch_on_ramp_done: true,
      founding_patriarch_midlife_pressure_done: true,
      founding_patriarch_pressure_rule_first: true,
    },
  });
  const alliancePressureState = patriarchBaseState({
    player: { age: 42 } as PlayerState,
    flags: {
      founding_patriarch_on_ramp_done: true,
      founding_patriarch_midlife_pressure_done: true,
      founding_patriarch_pressure_alliance_first: true,
    },
  });

  const scholarGoal = deriveSampleLineCurrentGoal(scholarPressureState);
  const allianceGoal = deriveSampleLineCurrentGoal(alliancePressureState);
  const scholarCost = deriveSampleLineCostLabel(scholarPressureState);
  const allianceCost = deriveSampleLineCostLabel(alliancePressureState);

  assert(scholarCost === '门派延续之重', 'pressure scholar cost label should be 门派延续之重');
  assert(allianceCost === '门派延续之重', 'pressure alliance cost label should be 门派延续之重');
  assert(scholarGoal?.includes('门规传承'), 'pressure scholar goal should mention 门规传承');
  assert(scholarGoal?.includes('盟约续责'), 'pressure scholar goal should mention 盟约续责');
  assert(allianceGoal?.includes('盟约续责'), 'pressure alliance goal should mention 盟约续责');
  assert(allianceGoal?.includes('门规传承'), 'pressure alliance goal should mention 门规传承');
  assert(scholarGoal !== allianceGoal, 'pressure scholar and alliance goals should be distinguishable');
}

function testPatriarchPayoffExpressionReadsCheckpoint(): void {
  const payoffState = patriarchBaseState({
    player: { age: 50 } as PlayerState,
    flags: {
      founding_patriarch_on_ramp_done: true,
      founding_patriarch_on_ramp_alliance: true,
      founding_patriarch_payoff_done: true,
      founding_patriarch_identity_done: true,
      founding_patriarch_payoff_independent_founder: true,
    },
  });
  const goal = deriveSampleLineCurrentGoal(payoffState);
  const cost = deriveSampleLineCostLabel(payoffState);
  const identity = deriveSampleLineAge40Identity(payoffState);

  assert(goal?.includes('自立山门'), 'payoff goal should reflect independent_founder choice');
  assert(cost === '自立开派之快', 'payoff cost should reflect independent_founder choice');
  assert(identity?.includes('自立山门'), 'payoff identity should reflect independent_founder choice');
}

function writeChainProof(): void {
  const lines = [
    '# P113 Founding Patriarch Bridge Chain Proof',
    '',
    '> **Stage:** P113 Wuxia Founding Patriarch Bridge (Narrow Playable)',
    '> **Date:** 2026-07-02',
    '',
    '## Chain nodes',
    '',
    '| Step | Age | Event | Flags in | Flags out |',
    '| ---- | --- | ----- | -------- | --------- |',
    '| 1 | 15 | `scholar_mentor_line` rare roll | scholar_house + focus_on_study | `p16_scholar_mentor` |',
    '| 2 | 30 | `p22_faction_sect_continuation` | `sect_exposure`/`joined_sect` | `p22_faction_continuation_active`, `p16_alliance_brokered` |',
    `| 3 | 32–38 | \`founding_patriarch_bridge_entry\` | ${ENTRY_GATE_EXPR.slice(0, 60)}… | \`founding_patriarch_bridge_crossed\`, \`founding_patriarch_on_ramp_done\`, on-ramp variant marker |`,
    '| 4 | 40–45 | `founding_patriarch_midlife_pressure` | `founding_patriarch_on_ramp_done && !founding_patriarch_midlife_pressure_done` | `founding_patriarch_midlife_pressure_done`, `founding_patriarch_pressure_rule_first/alliance_first` |',
    `| 5 | 48–52 | \`founding_patriarch_payoff_echo\` (choice v2.0.0) | ${PAYOFF_GATE_EXPR} | \`founding_patriarch_payoff_done\`, \`founding_patriarch_identity_done\`, \`founding_patriarch_payoff_resolved\`, choice marker |`,
    '',
    '## Payoff choice branches',
    '',
    '| Choice | Marker | Cost label | Goal |',
    '| ------ | ------ | ---------- | ---- |',
    '| 续责开派 | `founding_patriarch_payoff_legacy_holder` | 续责开派之累 | 续责如山，开派名号落在门派与治学一并传承之上 |',
    '| 自立开派 | `founding_patriarch_payoff_independent_founder` | 自立开派之快 | 自立山门，治学规矩自己定 |',
    '| 双门并立 | `founding_patriarch_payoff_dual_gate` | 双门并立之累 | 盟约师承各守其份 |',
    '',
    '## Expression differentiation',
    '',
    '| Surface | Founding patriarch signal | Generic orthodox | Renown on-ramp |',
    '| ------- | ------------------------- | ---------------- | -------------- |',
    '| `orthodoxCurrentGoal` | 开宗立派 / payoff choice goal | 行侠守义 / 守正 | 江湖名号 / 引荐主事 |',
    '| `deriveSampleLineCostLabel` | 开派盟约之累 / payoff 之累/之快 | 守正代价 | 人情债 (renown line) |',
    '| `orthodoxAge40Identity` | 开派苗子 / payoff identity | 正派武者 | renown identity |',
    '',
    '## Regression scope',
    '',
    '- P37 pinnacle parity tests: unchanged lifetime traces',
    '- P102–P112 patron tests: unchanged spine events',
    '- `guard:sample-lines-baseline`: spine additive only',
    '',
    '## Deferred',
    '',
    '- Full faction empire graph / multi-event pinnacle arc',
    '- Ordinary-origin founding-patriarch bridges',
    '- Full North Star §8 Wave 2 pinnacle content wave',
    '- Midlife pressure chain between entry and payoff',
  ];
  const outPath = join(process.cwd(), 'docs/test-reports/p113-founding-patriarch-bridge-chain-proof.md');
  writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  console.log(`Wrote proof artifact: ${outPath}`);
}

const tests: Array<[string, () => void]> = [
  ['events exist', testPatriarchBridgeEventsExist],
  ['entry event shape', testEntryEventShape],
  ['entry gate reads scholar/faction flags', testEntryGateReadsScholarFactionFlags],
  ['entry choices set checkpoint flags', testEntryChoicesSetCheckpointFlags],
  ['pressure event shape and gate', testPressureEventShapeAndGate],
  ['pressure checkpoint and scholar priority', testPressureCheckpointAndScholarPriority],
  ['payoff echo shape and gate', testPayoffEchoShapeAndGate],
  ['payoff sets terminal flags', testPayoffSetsTerminalFlags],
  ['patriarch expression differs from generic orthodox and renown', testPatriarchExpressionDiffersFromGenericOrthodoxAndRenown],
  ['patriarch pressure expression signals', testPatriarchPressureExpressionSignals],
  ['patriarch payoff expression reads checkpoint', testPatriarchPayoffExpressionReadsCheckpoint],
];

for (const [name, fn] of tests) {
  try {
    fn();
  } catch (error) {
    throw new Error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

writeChainProof();
console.log('p113FoundingPatriarchBridgeTests: all passed');
