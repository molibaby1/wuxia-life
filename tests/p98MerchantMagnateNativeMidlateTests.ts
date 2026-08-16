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

const PRESSURE_GATE_EXPR =
  "flags.has('magnate_on_ramp_done') && !flags.has('magnate_midlife_pressure_done') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')";

const PAYOFF_GATE_EXPR =
  "flags.has('magnate_on_ramp_done') && flags.has('magnate_midlife_pressure_done') && !flags.has('magnate_payoff_done') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')";

function merchantState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 38,
      charisma: 10,
      money: 200,
      businessAcumen: 12,
      connections: 10,
      reputation: 10,
      ...(overrides.player ?? {}),
    } as PlayerState,
    flags: {
      origin_merchant_family: true,
      route_merchant: true,
      merchant_childhood_seed_done: true,
      merchant_shop_grocery: true,
      magnate_on_ramp_done: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

function testPressureLoadsAsChoice(): void {
  const event = EventLoader.getInstance().getEventById('magnate_midlife_pressure');
  assert(Boolean(event), 'magnate_midlife_pressure should load');
  assert(event!.eventType === 'choice', 'magnate_midlife_pressure should be choice event');
  assert((event!.choices?.length ?? 0) >= 4, 'pressure should expose native + generic choices');
}

function testPayoffLoadsAsChoice(): void {
  const event = EventLoader.getInstance().getEventById('magnate_payoff');
  assert(Boolean(event), 'magnate_payoff should load');
  assert(event!.eventType === 'choice', 'magnate_payoff should be choice event');
  assert((event!.choices?.length ?? 0) >= 4, 'payoff should expose native + generic choices');
}

function testNativePressureChoices(): void {
  const evaluator = new ConditionEvaluator();
  const event = EventLoader.getInstance().getEventById('magnate_midlife_pressure')!;

  const ledgerSteady = merchantState({
    flags: {
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
      hvg_merchant_ledger_track: true,
      hvg_merchant_ledger_expansion_steady: true,
    },
    player: { age: 37 } as PlayerState,
  });
  const steadyChoice = event.choices!.find(c => c.id === 'magnate_pressure_ledger_steady')!;
  assert(evaluator.evaluate(steadyChoice.condition!, ledgerSteady), 'ledger steady pressure choice available');

  const caravanMarket = merchantState({
    flags: {
      magnate_native_caravan_entry: true,
      magnate_native_caravan_market: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
      hvg_merchant_caravan_expansion_market: true,
    },
    player: { age: 37 } as PlayerState,
  });
  const marketChoice = event.choices!.find(c => c.id === 'magnate_pressure_caravan_market')!;
  assert(evaluator.evaluate(marketChoice.condition!, caravanMarket), 'caravan market pressure choice available');
}

function testNativePayoffChoices(): void {
  const evaluator = new ConditionEvaluator();
  const event = EventLoader.getInstance().getEventById('magnate_payoff')!;

  const ledgerPayoff = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_native_pressure_ledger_steady: true,
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
    },
    player: { age: 43 } as PlayerState,
  });
  const ledgerChoice = event.choices!.find(c => c.id === 'magnate_payoff_ledger_steady')!;
  assert(evaluator.evaluate(ledgerChoice.condition!, ledgerPayoff), 'ledger steady payoff choice available');

  const caravanPayoff = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_native_pressure_caravan_market: true,
      magnate_native_caravan_entry: true,
      magnate_native_caravan_market: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 43 } as PlayerState,
  });
  const caravanChoice = event.choices!.find(c => c.id === 'magnate_payoff_caravan_market')!;
  assert(evaluator.evaluate(caravanChoice.condition!, caravanPayoff), 'caravan market payoff choice available');
}

function testBridgePressureDoesNotGetNativeChoices(): void {
  const evaluator = new ConditionEvaluator();
  const event = EventLoader.getInstance().getEventById('magnate_midlife_pressure')!;

  const apprentice = merchantState({
    flags: {
      apprentice_merchant_bridge_crossed: true,
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
      merchant_shop_grocery: false,
    },
    player: { age: 37 } as PlayerState,
  });
  const steadyChoice = event.choices!.find(c => c.id === 'magnate_pressure_ledger_steady')!;
  assert(!evaluator.evaluate(steadyChoice.condition!, apprentice), 'bridge blocks native pressure choice');

  const genericChoice = event.choices!.find(c => c.id === 'magnate_pressure_generic')!;
  assert(Boolean(genericChoice), 'generic pressure fallback should exist');

  const pressureGate = { type: 'expression' as const, expression: PRESSURE_GATE_EXPR };
  assert(evaluator.evaluate(pressureGate, apprentice), 'bridge still passes pressure gate');
}

function testPressureGoalsDifferByTrack(): void {
  const ledger = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_native_pressure_ledger_steady: true,
      magnate_native_ledger_entry: true,
    },
    player: { age: 38 } as PlayerState,
  });
  const caravan = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_native_pressure_caravan_market: true,
      magnate_native_caravan_entry: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 38 } as PlayerState,
  });

  const ledgerGoal = deriveSampleLineCurrentGoal(ledger) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(caravan) ?? '';
  assert(ledgerGoal !== caravanGoal, `pressure goals should differ: ${ledgerGoal} vs ${caravanGoal}`);
  assert(ledgerGoal.includes('稳扩') || ledgerGoal.includes('信誉'), `ledger pressure goal: ${ledgerGoal}`);
  assert(caravanGoal.includes('赌市') || caravanGoal.includes('行市'), `caravan pressure goal: ${caravanGoal}`);
  assert(isPlayerVisibleSampleLineText(ledgerGoal), `raw key in ledger goal: ${ledgerGoal}`);
  assert(isPlayerVisibleSampleLineText(caravanGoal), `raw key in caravan goal: ${caravanGoal}`);
}

function testPayoffGoalsDifferByTrack(): void {
  const ledger = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_payoff_done: true,
      magnate_native_payoff_ledger_steady: true,
      magnate_native_ledger_entry: true,
    },
    player: { age: 44 } as PlayerState,
  });
  const caravan = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_payoff_done: true,
      magnate_native_payoff_caravan_market: true,
      magnate_native_caravan_entry: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 44 } as PlayerState,
  });

  const ledgerGoal = deriveSampleLineCurrentGoal(ledger) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(caravan) ?? '';
  assert(ledgerGoal !== caravanGoal, `payoff goals should differ: ${ledgerGoal} vs ${caravanGoal}`);
  assert(ledgerGoal.includes('稳态') || ledgerGoal.includes('账房'), `ledger payoff goal: ${ledgerGoal}`);
  assert(caravanGoal.includes('行市') || caravanGoal.includes('跑货'), `caravan payoff goal: ${caravanGoal}`);
}

function testPressureCostLabelsDifferByTrack(): void {
  const ledger = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_native_pressure_ledger_credit: true,
    },
    player: { age: 38 } as PlayerState,
  });
  const caravan = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_native_pressure_caravan_fast: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 38 } as PlayerState,
  });

  const ledgerCost = deriveSampleLineCostLabel(ledger);
  const caravanCost = deriveSampleLineCostLabel(caravan);
  assert(ledgerCost !== caravanCost, `pressure cost labels should differ: ${ledgerCost} vs ${caravanCost}`);
  assert(ledgerCost.includes('赊欠') || ledgerCost.includes('稳扩'), `ledger cost: ${ledgerCost}`);
  assert(caravanCost.includes('压货') || caravanCost.includes('赌市'), `caravan cost: ${caravanCost}`);
}

function testPayoffCostLabelsDifferByTrack(): void {
  const ledger = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_payoff_done: true,
      magnate_native_payoff_ledger_credit: true,
    },
    player: { age: 44 } as PlayerState,
  });
  const caravan = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_payoff_done: true,
      magnate_native_payoff_caravan_fast: true,
    },
    player: { age: 44 } as PlayerState,
  });

  const ledgerCost = deriveSampleLineCostLabel(ledger);
  const caravanCost = deriveSampleLineCostLabel(caravan);
  assert(ledgerCost !== caravanCost, `payoff cost labels should differ: ${ledgerCost} vs ${caravanCost}`);
  assert(ledgerCost.includes('信誉'), `ledger payoff cost: ${ledgerCost}`);
  assert(caravanCost.includes('货路'), `caravan payoff cost: ${caravanCost}`);
}

function testBridgeExpressionPriorityAtPayoff(): void {
  const bridgeWins = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_payoff_done: true,
      apprentice_merchant_bridge_crossed: true,
      magnate_native_payoff_ledger_steady: true,
      magnate_native_ledger_entry: true,
    },
    player: { age: 44 } as PlayerState,
  });
  const goal = deriveSampleLineCurrentGoal(bridgeWins) ?? '';
  assert(goal.includes('手艺') || goal.includes('刨子'), `bridge should win at payoff: ${goal}`);
  assert(!goal.includes('稳态巨贾'), `native payoff leaked through bridge: ${goal}`);
}

function testAge40IdentityAtPressureAndPayoff(): void {
  const ledgerPressure = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_native_pressure_ledger_steady: true,
      magnate_native_ledger_entry: true,
      merchant_age40_identity_done: true,
    },
    player: { age: 40 } as PlayerState,
  });
  const caravanPayoff = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_payoff_done: true,
      magnate_native_payoff_caravan_market: true,
      magnate_native_caravan_entry: true,
      merchant_age40_identity_done: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 44 } as PlayerState,
  });

  const ledgerIdentity = deriveSampleLineAge40Identity(ledgerPressure) ?? '';
  const caravanIdentity = deriveSampleLineAge40Identity(caravanPayoff) ?? '';
  assert(ledgerIdentity.includes('账房'), `ledger pressure identity: ${ledgerIdentity}`);
  assert(caravanIdentity.includes('行市') || caravanIdentity.includes('跑货'), `caravan payoff identity: ${caravanIdentity}`);
  assert(ledgerIdentity !== caravanIdentity, 'mid/late identities should differ');
}

function testMagnateChainReachable(): void {
  const evaluator = new ConditionEvaluator();
  const pressureGate = { type: 'expression' as const, expression: PRESSURE_GATE_EXPR };
  const payoffGate = { type: 'expression' as const, expression: PAYOFF_GATE_EXPR };

  const ledgerPath = merchantState({
    flags: {
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
    },
    player: { age: 37 } as PlayerState,
  });
  assert(evaluator.evaluate(pressureGate, ledgerPath), 'native ledger reaches pressure');

  const afterPressure = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_native_pressure_ledger_steady: true,
      magnate_native_ledger_entry: true,
    },
    player: { age: 43 } as PlayerState,
  });
  assert(evaluator.evaluate(payoffGate, afterPressure), 'native ledger reaches payoff after pressure');
}

function renderProofMarkdown(): string {
  const ledgerPressure = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_native_pressure_ledger_steady: true,
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
    },
    player: { age: 38 } as PlayerState,
  });
  const caravanPayoff = merchantState({
    flags: {
      magnate_midlife_pressure_done: true,
      magnate_payoff_done: true,
      magnate_native_payoff_caravan_market: true,
      magnate_native_caravan_entry: true,
      magnate_native_caravan_market: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 44 } as PlayerState,
  });

  const ledgerPressureGoal = deriveSampleLineCurrentGoal(ledgerPressure) ?? '';
  const ledgerPressureCost = deriveSampleLineCostLabel(ledgerPressure);
  const caravanPayoffGoal = deriveSampleLineCurrentGoal(caravanPayoff) ?? '';
  const caravanPayoffCost = deriveSampleLineCostLabel(caravanPayoff);

  return [
    '# P98 Merchant Magnate Native Mid/Late Chain Proof',
    '',
    '> **Stage:** P98 Wuxia Merchant Magnate Native Mid/Late Differentiation',
    '> **Date:** 2026-07-02',
    '',
    'Narrow proof for native ledger/caravan magnate_midlife_pressure and magnate_payoff differentiation.',
    '',
    '## Ledger path (age 38 pressure checkpoint)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 38 |',
    '| P97 flags | magnate_native_ledger_entry, magnate_native_ledger_steady |',
    '| P98 flags | magnate_native_pressure_ledger_steady |',
    `| currentGoal | ${ledgerPressureGoal} |`,
    `| costLabel | ${ledgerPressureCost} |`,
    '',
    '## Caravan path (age 44 payoff checkpoint)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 44 |',
    '| P97 flags | magnate_native_caravan_entry, magnate_native_caravan_market |',
    '| P98 flags | magnate_native_payoff_caravan_market |',
    `| currentGoal | ${caravanPayoffGoal} |`,
    `| costLabel | ${caravanPayoffCost} |`,
    '',
    '## Continuity',
    '',
    '- `magnate_midlife_pressure` choice branches read P97 entry markers and set P98 pressure-phase markers',
    '- `magnate_payoff` choice branches read P98 pressure markers or P97 entry lineage',
    '- Ledger vs caravan produce distinguishable goals, cost labels, and age40 identity at pressure/payoff',
    '- P63/P64 bridge expressions retain priority when bridge markers are set',
    '- P55 magnate chain (on-ramp → pressure → payoff) remains reachable',
    '',
  ].join('\n');
}

export async function runP98MerchantMagnateNativeMidlateTests(): Promise<void> {
  testPressureLoadsAsChoice();
  testPayoffLoadsAsChoice();
  testNativePressureChoices();
  testNativePayoffChoices();
  testBridgePressureDoesNotGetNativeChoices();
  testPressureGoalsDifferByTrack();
  testPayoffGoalsDifferByTrack();
  testPressureCostLabelsDifferByTrack();
  testPayoffCostLabelsDifferByTrack();
  testBridgeExpressionPriorityAtPayoff();
  testAge40IdentityAtPressureAndPayoff();
  testMagnateChainReachable();

  const proof = renderProofMarkdown();
  const outPath = join(process.cwd(), 'artifacts/reports/p98-merchant-magnate-native-midlate-chain-proof.md');
  writeFileSync(outPath, `${proof}\n`, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP98MerchantMagnateNativeMidlateTests()
    .then(() => console.log('p98MerchantMagnateNativeMidlateTests: ok'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
