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
  "(flags.has('route_wealth_committed') || flags.has('p22_wealth_route_forked')) && (flags.has('merchant_invest_good') || flags.has('merchant_invest_evil') || flags.has('merchant_invest_both')) && !flags.has('merchant_patron_bridge_crossed') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')";

const PAYOFF_GATE_EXPR =
  "flags.has('merchant_patron_midlife_pressure_done') && !flags.has('merchant_patron_payoff_done') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')";

function patronBaseState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 36,
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
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

const allEvents = sampleLinesSpine as SampleLineEvent[];
const entryEvent = allEvents.find(e => e.id === 'merchant_patron_bridge_entry');
const payoffEvent = allEvents.find(e => e.id === 'merchant_patron_payoff_echo');

function testPatronBridgeEventsExist(): void {
  assert(Boolean(entryEvent), 'merchant_patron_bridge_entry should exist');
  assert(Boolean(payoffEvent), 'merchant_patron_payoff_echo should exist');
}

function testEntryEventShape(): void {
  assert(entryEvent?.eventType === 'choice', 'entry should be choice type');
  assert(entryEvent?.ageRange?.min === 34, 'entry min age should be 34');
  assert(entryEvent?.ageRange?.max === 38, 'entry max age should be 38');
  assert((entryEvent?.choices?.length ?? 0) >= 2, 'entry should have at least 2 choices');
}

function testEntryGateReadsWealthInvestFlags(): void {
  const evaluator = new ConditionEvaluator();
  const eligible = patronBaseState();
  assert(evaluator.evaluate(entryEvent!.conditions![0]!, eligible), 'wealth+invest should pass entry gate');

  const noWealth = patronBaseState({ flags: { merchant_invest_good: true } });
  delete (noWealth.flags as Record<string, unknown>).route_wealth_committed;
  assert(!evaluator.evaluate(entryEvent!.conditions![0]!, noWealth), 'missing wealth flag should fail');

  const noInvest = patronBaseState({ flags: { route_wealth_committed: true } });
  delete (noInvest.flags as Record<string, unknown>).merchant_invest_good;
  assert(!evaluator.evaluate(entryEvent!.conditions![0]!, noInvest), 'missing invest flag should fail');

  const alreadyCrossed = patronBaseState({ flags: { merchant_patron_bridge_crossed: true } });
  assert(!evaluator.evaluate(entryEvent!.conditions![0]!, alreadyCrossed), 'already crossed should fail');
}

function testEntryChoicesSetCheckpointFlags(): void {
  const orthodoxChoice = entryEvent!.choices!.find(c => c.id === 'patron_embrace_orthodox_sect');
  const martialChoice = entryEvent!.choices!.find(c => c.id === 'patron_embrace_martial_backer');
  assert(Boolean(orthodoxChoice), 'orthodox patron choice should exist');
  assert(Boolean(martialChoice), 'martial patron choice should exist');

  for (const choice of [orthodoxChoice!, martialChoice!]) {
    const effects = choice.effects ?? [];
    assert(
      effects.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_bridge_crossed'),
      `${choice.id} sets merchant_patron_bridge_crossed`,
    );
    assert(
      effects.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_on_ramp_done'),
      `${choice.id} sets merchant_patron_on_ramp_done`,
    );
    assert(
      effects.some(e => e.type === 'event_record' && e.target === 'merchant_patron_bridge_entry'),
      `${choice.id} records merchant_patron_bridge_entry`,
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
  const eligible = patronBaseState({
    player: { age: 50 } as PlayerState,
    flags: {
      merchant_patron_on_ramp_done: true,
      merchant_patron_on_ramp_orthodox: true,
      merchant_patron_midlife_pressure_done: true,
    },
  });
  assert(evaluator.evaluate(payoffEvent!.conditions![0]!, eligible), 'pressure done should pass payoff gate');

  const noPressure = patronBaseState({
    player: { age: 50 } as PlayerState,
    flags: { merchant_patron_on_ramp_done: true, merchant_patron_on_ramp_orthodox: true },
  });
  assert(!evaluator.evaluate(payoffEvent!.conditions![0]!, noPressure), 'missing pressure should fail payoff gate');
}

function testPayoffSetsTerminalFlags(): void {
  const shared = payoffEvent?.autoEffects ?? [];
  assert(
    shared.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_payoff_done'),
    'payoff sets merchant_patron_payoff_done',
  );
  assert(
    shared.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_identity_done'),
    'payoff sets merchant_patron_identity_done',
  );
  assert(
    shared.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_payoff_resolved'),
    'payoff sets merchant_patron_payoff_resolved',
  );

  const hold = payoffEvent!.choices!.find(c => c.id === 'patron_payoff_hold_covenant')!;
  const breaker = payoffEvent!.choices!.find(c => c.id === 'patron_payoff_break_covenant')!;
  const balancer = payoffEvent!.choices!.find(c => c.id === 'patron_payoff_balance_covenant')!;
  assert(
    (hold.effects ?? []).some(e => e.type === 'flag_set' && e.target === 'merchant_patron_payoff_covenant_holder'),
    'hold choice sets covenant_holder marker',
  );
  assert(
    (breaker.effects ?? []).some(e => e.type === 'flag_set' && e.target === 'merchant_patron_payoff_covenant_breaker'),
    'break choice sets covenant_breaker marker',
  );
  assert(
    (balancer.effects ?? []).some(e => e.type === 'flag_set' && e.target === 'merchant_patron_payoff_balancer'),
    'balance choice sets balancer marker',
  );
}

function testPatronExpressionDiffersFromGenericAndMagnate(): void {
  const patronOnRamp = patronBaseState({
    player: { age: 40 } as PlayerState,
    flags: {
      merchant_patron_on_ramp_done: true,
      merchant_patron_on_ramp_orthodox: true,
    },
  });
  const genericMerchant = patronBaseState();
  const magnate = patronBaseState({
    flags: {
      magnate_on_ramp_done: true,
      merchant_patron_on_ramp_done: true,
      merchant_patron_on_ramp_orthodox: true,
    },
  });

  const patronGoal = deriveSampleLineCurrentGoal(patronOnRamp);
  const genericGoal = deriveSampleLineCurrentGoal(genericMerchant);
  const magnateGoal = deriveSampleLineCurrentGoal(magnate);

  assert(patronGoal.includes('侠义盟约'), 'patron goal should mention 侠义盟约');
  assert(!genericGoal.includes('侠义盟约'), 'generic merchant goal should not mention patron');
  assert(magnateGoal.includes('巨贾'), 'magnate goal should mention 巨贾 when magnate_on_ramp_done');
  assert(!magnateGoal.includes('侠义盟约'), 'magnate should win over patron in currentGoal');

  const patronCost = deriveSampleLineCostLabel(patronOnRamp);
  const genericCost = deriveSampleLineCostLabel(genericMerchant);
  assert(patronCost.includes('盟约'), 'patron cost label should mention 盟约');
  assert(genericCost === '商路债务', 'generic merchant cost should remain 商路债务');

  const patronIdentity = deriveSampleLineAge40Identity(patronOnRamp);
  assert(patronIdentity?.includes('商武'), 'patron identity should mention 商武');
  assert(isPlayerVisibleSampleLineText(patronGoal), 'patron goal should be player-visible');
}

function testPatronPayoffExpressionReadsCheckpoint(): void {
  const payoffState = patronBaseState({
    player: { age: 50 } as PlayerState,
    flags: {
      merchant_patron_on_ramp_done: true,
      merchant_patron_on_ramp_martial: true,
      merchant_patron_payoff_done: true,
      merchant_patron_identity_done: true,
      merchant_patron_payoff_covenant_breaker: true,
    },
  });
  const goal = deriveSampleLineCurrentGoal(payoffState);
  const cost = deriveSampleLineCostLabel(payoffState);
  const identity = deriveSampleLineAge40Identity(payoffState);

  assert(goal.includes('撕破盟约'), 'payoff goal should reflect covenant_breaker choice');
  assert(cost === '断武从商之快', 'payoff cost should reflect covenant_breaker choice');
  assert(identity?.includes('断武从商'), 'payoff identity should reflect covenant_breaker choice');
}

function writeChainProof(): void {
  const lines = [
    '# P102 Merchant Martial Patron Bridge Chain Proof',
    '',
    '> **Stage:** P102 Wuxia Merchant Martial Patron Bridge (Narrow Playable)',
    '> **Date:** 2026-07-02',
    '',
    '## Chain nodes',
    '',
    '| Step | Age | Event | Flags in | Flags out |',
    '| ---- | --- | ----- | -------- | --------- |',
    '| 1 | 18 | `p22_early_wealth_route_fork` (merchant.json path) | — | `route_wealth_committed`, `p22_wealth_route_forked` |',
    '| 2 | 32 | `merchant_sect_investment` | `merchant_wealthy` | `merchant_invest_good` |',
    `| 3 | 34–38 | \`merchant_patron_bridge_entry\` | ${ENTRY_GATE_EXPR.slice(0, 60)}… | \`merchant_patron_bridge_crossed\`, \`merchant_patron_on_ramp_done\`, variant marker |`,
    '| 4 | 40–44 | `merchant_patron_midlife_pressure` | `merchant_patron_on_ramp_done` | `merchant_patron_midlife_pressure_done`, variant pressure marker |',
    `| 5 | 48–52 | \`merchant_patron_payoff_echo\` (choice v2.0.0) | ${PAYOFF_GATE_EXPR.slice(0, 60)}… | \`merchant_patron_payoff_done\`, \`merchant_patron_identity_done\`, \`merchant_patron_payoff_resolved\`, choice marker |`,
    '',
    '## Payoff choice branches (P108)',
    '',
    '| Choice | Marker | Cost label | Goal |',
    '| ------ | ------ | ---------- | ---- |',
    '| 硬扛盟约 | `merchant_patron_payoff_covenant_holder` | 盟约如山之累 | 硬扛盟约护商 |',
    '| 撕破盟约 | `merchant_patron_payoff_covenant_breaker` | 断武从商之快 | 撕破盟约，商号不再听山门差遣 |',
    '| 商武平衡 | `merchant_patron_payoff_balancer` | 商武新矩之累 | 重谈盟约边界 |',
    '',
    '## Expression differentiation',
    '',
    '| Surface | Patron signal | Generic merchant | Magnate priority |',
    '| ------- | ------------- | ---------------- | ---------------- |',
    '| `merchantCurrentGoal` | payoff choice goal / pressure / on-ramp | 财富带来选择 | 巨贾 when `magnate_on_ramp_done` |',
    '| `deriveSampleLineCostLabel` | payoff choice 之累/之快 / pressure 之债 / on-ramp 之累 | 商路债务 | 巨贾负担 when magnate markers |',
    '| `merchantAge40Identity` | payoff choice identity + entry overlay | 商路中人 | 巨贾 identity when magnate markers |',
    '',
    '## Regression scope',
    '',
    '- P97–P101 magnate tests: unchanged spine events',
    '- `guard:sample-lines-baseline`: no new guard script; spine additive only',
    '',
    '## Deferred',
    '',
    '- Full 5×3 entry×payoff identity matrix',
    '- Patron late-life / endgame echo (P109+)',
    '- Ordinary-origin patron expression',
    '- Full Wave 3 mixed-achievement graph',
  ];
  const outPath = join(process.cwd(), 'docs/test-reports/p102-merchant-martial-patron-bridge-chain-proof.md');
  writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  console.log(`Wrote proof artifact: ${outPath}`);
}

const tests: Array<[string, () => void]> = [
  ['events exist', testPatronBridgeEventsExist],
  ['entry event shape', testEntryEventShape],
  ['entry gate reads wealth/invest flags', testEntryGateReadsWealthInvestFlags],
  ['entry choices set checkpoint flags', testEntryChoicesSetCheckpointFlags],
  ['payoff echo shape and gate', testPayoffEchoShapeAndGate],
  ['payoff sets terminal flags', testPayoffSetsTerminalFlags],
  ['patron expression differs from generic and magnate', testPatronExpressionDiffersFromGenericAndMagnate],
  ['patron payoff expression reads checkpoint', testPatronPayoffExpressionReadsCheckpoint],
];

for (const [name, fn] of tests) {
  try {
    fn();
  } catch (error) {
    throw new Error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

writeChainProof();
console.log('p102MerchantMartialPatronBridgeTests: all passed');
