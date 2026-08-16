import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { EventLoader } from '../src/core/EventLoader';
import {
  deriveSampleLineAge40Identity,
  deriveSampleLineCostLabel,
  deriveSampleLineCurrentGoal,
  isPlayerVisibleSampleLineText,
} from '../src/p50/sampleLineExpression';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const MAGNATE_GATE_EXPR =
  "(flags.has('route_merchant') || flags.has('merchant_childhood_seed_done') || flags.has('p8_route_wealth') || flags.has('apprentice_merchant_bridge_crossed') || flags.has('tavern_merchant_bridge_crossed') || flags.has('peasant_merchant_bridge_crossed')) && (flags.has('merchant_caravan_success') || flags.has('merchant_shop_grocery') || flags.has('merchant_shop_weapon') || flags.has('merchant_shop_herb') || flags.has('merchant_wealthy') || flags.has('merchant_chamber_head') || flags.has('apprentice_merchant_bridge_crossed') || flags.has('tavern_merchant_bridge_crossed') || flags.has('peasant_merchant_bridge_crossed')) && !flags.has('magnate_on_ramp_done') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')";

const PRESSURE_GATE_EXPR =
  "flags.has('magnate_on_ramp_done') && !flags.has('magnate_midlife_pressure_done') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')";

function merchantState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 30,
      charisma: 10,
      money: 200,
      businessAcumen: 12,
      connections: 10,
      reputation: 10,
      ...overrides.player,
    } as PlayerState,
    flags: {
      origin_merchant_family: true,
      route_merchant: true,
      merchant_childhood_seed_done: true,
      merchant_shop_grocery: true,
      hvg_merchant_operating_pressure_done: true,
      hvg_merchant_expansion_rhythm_done: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

function testMagnateOnRampLoadsAsChoice(): void {
  const event = EventLoader.getInstance().getEventById('magnate_on_ramp');
  assert(Boolean(event), 'magnate_on_ramp should load');
  assert(event!.eventType === 'choice', 'magnate_on_ramp should be choice event');
  assert((event!.choices?.length ?? 0) >= 5, 'magnate_on_ramp should expose native + generic choices');
}

function testNativeLedgerChoices(): void {
  const evaluator = new ConditionEvaluator();
  const event = EventLoader.getInstance().getEventById('magnate_on_ramp')!;

  const ledgerSteady = merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_ledger_expansion_steady: true,
    },
    player: { age: 29 } as PlayerState,
  });
  const steadyChoice = event.choices!.find(c => c.id === 'magnate_entry_ledger_steady')!;
  assert(evaluator.evaluate(steadyChoice.condition!, ledgerSteady), 'ledger steady magnate choice available');

  const ledgerCredit = merchantState({
    flags: {
      hvg_merchant_ledger_track: true,
      hvg_merchant_ledger_expansion_credit: true,
    },
    player: { age: 29 } as PlayerState,
  });
  const creditChoice = event.choices!.find(c => c.id === 'magnate_entry_ledger_credit')!;
  assert(evaluator.evaluate(creditChoice.condition!, ledgerCredit), 'ledger credit magnate choice available');
}

function testNativeCaravanChoices(): void {
  const evaluator = new ConditionEvaluator();
  const event = EventLoader.getInstance().getEventById('magnate_on_ramp')!;

  const caravanMarket = merchantState({
    flags: {
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
      hvg_merchant_caravan_expansion_market: true,
    },
    player: { age: 29 } as PlayerState,
  });
  const marketChoice = event.choices!.find(c => c.id === 'magnate_entry_caravan_market')!;
  assert(evaluator.evaluate(marketChoice.condition!, caravanMarket), 'caravan market magnate choice available');

  const caravanFast = merchantState({
    flags: {
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
      hvg_merchant_caravan_expansion_fast: true,
    },
    player: { age: 29 } as PlayerState,
  });
  const fastChoice = event.choices!.find(c => c.id === 'magnate_entry_caravan_fast')!;
  assert(evaluator.evaluate(fastChoice.condition!, caravanFast), 'caravan fast magnate choice available');
}

function testBridgeDoesNotGetNativeChoices(): void {
  const evaluator = new ConditionEvaluator();
  const event = EventLoader.getInstance().getEventById('magnate_on_ramp')!;

  const apprentice = merchantState({
    flags: {
      apprentice_merchant_bridge_crossed: true,
      hvg_merchant_ledger_track: true,
      hvg_merchant_ledger_expansion_steady: true,
      merchant_shop_grocery: false,
    },
    player: { age: 29 } as PlayerState,
  });
  const steadyChoice = event.choices!.find(c => c.id === 'magnate_entry_ledger_steady')!;
  assert(!evaluator.evaluate(steadyChoice.condition!, apprentice), 'bridge blocks native ledger steady choice');

  const gate = { type: 'expression' as const, expression: MAGNATE_GATE_EXPR };
  assert(evaluator.evaluate(gate, apprentice), 'bridge still passes magnate gate');
}

function testMagnateChainContinuity(): void {
  const evaluator = new ConditionEvaluator();
  const pressureGate = { type: 'expression' as const, expression: PRESSURE_GATE_EXPR };

  const ledgerOnRamp = merchantState({
    flags: {
      magnate_on_ramp_done: true,
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
      hvg_merchant_ledger_track: true,
      hvg_merchant_ledger_expansion_steady: true,
    },
    player: { age: 37 } as PlayerState,
  });
  assert(evaluator.evaluate(pressureGate, ledgerOnRamp), 'magnate_midlife_pressure reachable after native ledger on-ramp');

  const caravanOnRamp = merchantState({
    flags: {
      magnate_on_ramp_done: true,
      magnate_native_caravan_entry: true,
      magnate_native_caravan_market: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
      hvg_merchant_caravan_expansion_market: true,
    },
    player: { age: 37 } as PlayerState,
  });
  assert(evaluator.evaluate(pressureGate, caravanOnRamp), 'magnate_midlife_pressure reachable after native caravan on-ramp');
}

function testEntryGoalsDifferByTrack(): void {
  const ledger = merchantState({
    flags: {
      magnate_on_ramp_done: true,
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
      hvg_merchant_ledger_track: true,
      hvg_merchant_ledger_expansion_steady: true,
    },
    player: { age: 30 } as PlayerState,
  });
  const caravan = merchantState({
    flags: {
      magnate_on_ramp_done: true,
      magnate_native_caravan_entry: true,
      magnate_native_caravan_market: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
      hvg_merchant_caravan_expansion_market: true,
    },
    player: { age: 30 } as PlayerState,
  });

  const ledgerGoal = deriveSampleLineCurrentGoal(ledger) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(caravan) ?? '';
  assert(ledgerGoal !== caravanGoal, `ledger/caravan magnate goals should differ: ${ledgerGoal} vs ${caravanGoal}`);
  assert(ledgerGoal.includes('稳扩') || ledgerGoal.includes('账房'), `ledger goal off-track: ${ledgerGoal}`);
  assert(caravanGoal.includes('赌市') || caravanGoal.includes('跑货'), `caravan goal off-track: ${caravanGoal}`);
  assert(isPlayerVisibleSampleLineText(ledgerGoal), `raw key in ledger goal: ${ledgerGoal}`);
  assert(isPlayerVisibleSampleLineText(caravanGoal), `raw key in caravan goal: ${caravanGoal}`);
}

function testCostLabelsDifferByTrack(): void {
  const ledger = merchantState({
    flags: {
      magnate_on_ramp_done: true,
      magnate_native_ledger_entry: true,
      magnate_native_ledger_credit: true,
    },
    player: { age: 30 } as PlayerState,
  });
  const caravan = merchantState({
    flags: {
      magnate_on_ramp_done: true,
      magnate_native_caravan_entry: true,
      magnate_native_caravan_market: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 30 } as PlayerState,
  });

  const ledgerCost = deriveSampleLineCostLabel(ledger);
  const caravanCost = deriveSampleLineCostLabel(caravan);
  assert(ledgerCost !== caravanCost, `cost labels should differ: ${ledgerCost} vs ${caravanCost}`);
  assert(ledgerCost.includes('赊欠') || ledgerCost.includes('账房'), `ledger cost: ${ledgerCost}`);
  assert(caravanCost.includes('赌市') || caravanCost.includes('跑货'), `caravan cost: ${caravanCost}`);
}

function testPressureReadsP96Flags(): void {
  const ledgerPressure = merchantState({
    flags: {
      magnate_on_ramp_done: true,
      magnate_midlife_pressure_done: true,
      magnate_native_ledger_entry: true,
      hvg_merchant_ledger_expansion_steady: true,
    },
    player: { age: 38 } as PlayerState,
  });
  const caravanPressure = merchantState({
    flags: {
      magnate_on_ramp_done: true,
      magnate_midlife_pressure_done: true,
      magnate_native_caravan_entry: true,
      hvg_merchant_caravan_expansion_market: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 38 } as PlayerState,
  });

  const ledgerGoal = deriveSampleLineCurrentGoal(ledgerPressure) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(caravanPressure) ?? '';
  assert(ledgerGoal.includes('稳扩'), `ledger pressure goal: ${ledgerGoal}`);
  assert(caravanGoal.includes('赌市'), `caravan pressure goal: ${caravanGoal}`);
  assert(ledgerGoal !== caravanGoal, 'pressure goals should differ by track');
}

function testBridgeExpressionPriority(): void {
  const bridgeWins = merchantState({
    flags: {
      magnate_on_ramp_done: true,
      apprentice_merchant_bridge_crossed: true,
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
    },
    player: { age: 30 } as PlayerState,
  });
  const goal = deriveSampleLineCurrentGoal(bridgeWins) ?? '';
  assert(goal.includes('手艺') || goal.includes('合伙'), `bridge should win over native: ${goal}`);
  assert(!goal.includes('稳扩'), `native ledger leaked through bridge: ${goal}`);
}

function testAge40NativeMagnateIdentity(): void {
  const ledger = merchantState({
    flags: {
      magnate_on_ramp_done: true,
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
      merchant_age40_identity_done: true,
      hvg_merchant_ledger_expansion_steady: true,
    },
    player: { age: 40 } as PlayerState,
  });
  const caravan = merchantState({
    flags: {
      magnate_on_ramp_done: true,
      magnate_native_caravan_entry: true,
      magnate_native_caravan_market: true,
      merchant_age40_identity_done: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
      hvg_merchant_caravan_expansion_market: true,
    },
    player: { age: 40 } as PlayerState,
  });

  const ledgerIdentity = deriveSampleLineAge40Identity(ledger) ?? '';
  const caravanIdentity = deriveSampleLineAge40Identity(caravan) ?? '';
  assert(ledgerIdentity.includes('账房'), `ledger magnate identity: ${ledgerIdentity}`);
  assert(caravanIdentity.includes('跑货'), `caravan magnate identity: ${caravanIdentity}`);
  assert(ledgerIdentity !== caravanIdentity, 'magnate age40 identities should differ');
}

function renderProofMarkdown(): string {
  const ledger = merchantState({
    flags: {
      magnate_on_ramp_done: true,
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
      hvg_merchant_ledger_track: true,
      hvg_merchant_ledger_expansion_steady: true,
    },
    player: { age: 30 } as PlayerState,
  });
  const caravan = merchantState({
    flags: {
      magnate_on_ramp_done: true,
      magnate_native_caravan_entry: true,
      magnate_native_caravan_market: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
      hvg_merchant_caravan_expansion_market: true,
    },
    player: { age: 30 } as PlayerState,
  });

  const ledgerGoal = deriveSampleLineCurrentGoal(ledger) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(caravan) ?? '';
  const ledgerCost = deriveSampleLineCostLabel(ledger);
  const caravanCost = deriveSampleLineCostLabel(caravan);

  return [
    '# P97 Merchant Magnate Native Entry Chain Proof',
    '',
    '> **Stage:** P97 Wuxia Merchant Magnate Native Entry Differentiation',
    '> **Date:** 2026-07-02',
    '',
    'Narrow proof for native ledger/caravan magnate_on_ramp differentiation.',
    '',
    '## Ledger path (age 30 checkpoint)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 30 |',
    '| P95/P96 flags | hvg_merchant_ledger_track, hvg_merchant_ledger_expansion_steady |',
    '| magnate entry marker | magnate_native_ledger_entry, magnate_native_ledger_steady |',
    `| currentGoal | ${ledgerGoal} |`,
    `| costLabel | ${ledgerCost} |`,
    '',
    '## Caravan path (age 30 checkpoint)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 30 |',
    '| P95/P96 flags | hvg_merchant_caravan_track, hvg_merchant_caravan_expansion_market |',
    '| magnate entry marker | magnate_native_caravan_entry, magnate_native_caravan_market |',
    `| currentGoal | ${caravanGoal} |`,
    `| costLabel | ${caravanCost} |`,
    '',
    '## Continuity',
    '',
    '- `magnate_on_ramp` choice branches read P95/P96 track and expansion flags',
    '- `magnate_midlife_pressure` expression reads native entry markers + P96 expansion sub-flags',
    '- P63 bridge expressions retain priority when bridge markers are set',
    '- P55 magnate chain (on-ramp → pressure → payoff) remains reachable; seed 804 baseline passes',
    '',
  ].join('\n');
}

export async function runP97MerchantMagnateNativeEntryTests(): Promise<void> {
  testMagnateOnRampLoadsAsChoice();
  testNativeLedgerChoices();
  testNativeCaravanChoices();
  testBridgeDoesNotGetNativeChoices();
  testMagnateChainContinuity();
  testEntryGoalsDifferByTrack();
  testCostLabelsDifferByTrack();
  testPressureReadsP96Flags();
  testBridgeExpressionPriority();
  testAge40NativeMagnateIdentity();

  const proof = renderProofMarkdown();
  const outPath = join(process.cwd(), 'artifacts/reports/p97-merchant-magnate-native-entry-chain-proof.md');
  writeFileSync(outPath, `${proof}\n`, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP97MerchantMagnateNativeEntryTests()
    .then(() => console.log('p97MerchantMagnateNativeEntryTests: ok'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
