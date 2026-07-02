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

const LATE_LIFE_GATE_EXPR =
  "flags.has('magnate_payoff_done') && !flags.has('magnate_late_life_done') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')";

function merchantState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 50,
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
      magnate_midlife_pressure_done: true,
      magnate_payoff_done: true,
      merchant_age40_identity_done: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

function testLateLifeLoadsAsChoice(): void {
  const event = EventLoader.getInstance().getEventById('magnate_late_life');
  assert(Boolean(event), 'magnate_late_life should load');
  assert(event!.eventType === 'choice', 'magnate_late_life should be choice event');
  assert((event!.choices?.length ?? 0) >= 4, 'late-life should expose native + generic choices');
  assert(event!.ageRange?.min === 48, 'late-life min age should be 48');
  assert(event!.ageRange?.max === 56, 'late-life max age should be 56');
}

function testNativeLateLifeChoices(): void {
  const evaluator = new ConditionEvaluator();
  const event = EventLoader.getInstance().getEventById('magnate_late_life')!;

  const ledgerSteady = merchantState({
    flags: {
      magnate_native_payoff_ledger_steady: true,
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
    },
    player: { age: 50 } as PlayerState,
  });
  const steadyChoice = event.choices!.find(c => c.id === 'magnate_late_life_ledger_steady')!;
  assert(evaluator.evaluate(steadyChoice.condition!, ledgerSteady), 'ledger steady late-life choice available');

  const caravanMarket = merchantState({
    flags: {
      magnate_native_payoff_caravan_market: true,
      magnate_native_caravan_entry: true,
      magnate_native_caravan_market: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 50 } as PlayerState,
  });
  const marketChoice = event.choices!.find(c => c.id === 'magnate_late_life_caravan_market')!;
  assert(evaluator.evaluate(marketChoice.condition!, caravanMarket), 'caravan market late-life choice available');
}

function testBridgeLateLifeDoesNotGetNativeChoices(): void {
  const evaluator = new ConditionEvaluator();
  const event = EventLoader.getInstance().getEventById('magnate_late_life')!;

  const apprentice = merchantState({
    flags: {
      apprentice_merchant_bridge_crossed: true,
      magnate_native_ledger_entry: true,
      magnate_native_payoff_ledger_steady: true,
      merchant_shop_grocery: false,
    },
    player: { age: 50 } as PlayerState,
  });
  const steadyChoice = event.choices!.find(c => c.id === 'magnate_late_life_ledger_steady')!;
  assert(!evaluator.evaluate(steadyChoice.condition!, apprentice), 'bridge blocks native late-life choice');

  const genericChoice = event.choices!.find(c => c.id === 'magnate_late_life_generic')!;
  assert(Boolean(genericChoice), 'generic late-life fallback should exist');

  const lateLifeGate = { type: 'expression' as const, expression: LATE_LIFE_GATE_EXPR };
  assert(evaluator.evaluate(lateLifeGate, apprentice), 'bridge still passes late-life gate');
}

function testLateLifeGoalsDifferByTrack(): void {
  const ledger = merchantState({
    flags: {
      magnate_late_life_done: true,
      magnate_native_late_ledger_steady: true,
      magnate_native_payoff_ledger_steady: true,
      magnate_native_ledger_entry: true,
    },
    player: { age: 52 } as PlayerState,
  });
  const caravan = merchantState({
    flags: {
      magnate_late_life_done: true,
      magnate_native_late_caravan_market: true,
      magnate_native_payoff_caravan_market: true,
      magnate_native_caravan_entry: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 52 } as PlayerState,
  });

  const ledgerGoal = deriveSampleLineCurrentGoal(ledger) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(caravan) ?? '';
  assert(ledgerGoal !== caravanGoal, `late-life goals should differ: ${ledgerGoal} vs ${caravanGoal}`);
  assert(ledgerGoal.includes('稳态') || ledgerGoal.includes('守成'), `ledger late-life goal: ${ledgerGoal}`);
  assert(caravanGoal.includes('行市') || caravanGoal.includes('收势'), `caravan late-life goal: ${caravanGoal}`);
  assert(isPlayerVisibleSampleLineText(ledgerGoal), `raw key in ledger goal: ${ledgerGoal}`);
  assert(isPlayerVisibleSampleLineText(caravanGoal), `raw key in caravan goal: ${caravanGoal}`);
}

function testLateLifeCostLabelsDifferByTrack(): void {
  const ledger = merchantState({
    flags: {
      magnate_late_life_done: true,
      magnate_native_late_ledger_credit: true,
    },
    player: { age: 52 } as PlayerState,
  });
  const caravan = merchantState({
    flags: {
      magnate_late_life_done: true,
      magnate_native_late_caravan_fast: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 52 } as PlayerState,
  });

  const ledgerCost = deriveSampleLineCostLabel(ledger);
  const caravanCost = deriveSampleLineCostLabel(caravan);
  assert(ledgerCost !== caravanCost, `late-life cost labels should differ: ${ledgerCost} vs ${caravanCost}`);
  assert(ledgerCost.includes('信誉') || ledgerCost.includes('稳态'), `ledger cost: ${ledgerCost}`);
  assert(caravanCost.includes('货路') || caravanCost.includes('行市'), `caravan cost: ${caravanCost}`);
}

function testBridgeExpressionPriorityAtLateLife(): void {
  const apprentice = merchantState({
    flags: {
      magnate_late_life_done: true,
      magnate_late_life_identity_done: true,
      apprentice_merchant_bridge_crossed: true,
      magnate_native_late_ledger_steady: true,
      merchant_shop_grocery: false,
    },
    player: { age: 52 } as PlayerState,
  });

  const goal = deriveSampleLineCurrentGoal(apprentice) ?? '';
  const cost = deriveSampleLineCostLabel(apprentice);
  const identity = deriveSampleLineAge40Identity(apprentice) ?? '';
  assert(goal.includes('手艺'), `bridge late-life goal should win: ${goal}`);
  assert(cost.includes('合伙'), `bridge late-life cost should win: ${cost}`);
  assert(identity.includes('手艺'), `bridge late-life identity should win: ${identity}`);
}

function testAge40IdentityAtLateLife(): void {
  const ledgerLate = merchantState({
    flags: {
      magnate_late_life_done: true,
      magnate_late_life_identity_done: true,
      magnate_native_late_ledger_steady: true,
      magnate_native_payoff_ledger_steady: true,
      magnate_native_ledger_entry: true,
    },
    player: { age: 52 } as PlayerState,
  });
  const caravanLate = merchantState({
    flags: {
      magnate_late_life_done: true,
      magnate_late_life_identity_done: true,
      magnate_native_late_caravan_market: true,
      magnate_native_payoff_caravan_market: true,
      magnate_native_caravan_entry: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 52 } as PlayerState,
  });

  const ledgerIdentity = deriveSampleLineAge40Identity(ledgerLate) ?? '';
  const caravanIdentity = deriveSampleLineAge40Identity(caravanLate) ?? '';
  assert(ledgerIdentity.includes('稳态') || ledgerIdentity.includes('守成'), `ledger late-life identity: ${ledgerIdentity}`);
  assert(caravanIdentity.includes('行市') || caravanIdentity.includes('收势'), `caravan late-life identity: ${caravanIdentity}`);
  assert(ledgerIdentity !== caravanIdentity, 'late-life identities should differ');
}

function testMagnateChainReachableThroughLateLife(): void {
  const evaluator = new ConditionEvaluator();
  const lateLifeGate = { type: 'expression' as const, expression: LATE_LIFE_GATE_EXPR };

  const ledgerPath = merchantState({
    flags: {
      magnate_native_payoff_ledger_steady: true,
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
    },
    player: { age: 50 } as PlayerState,
  });
  assert(evaluator.evaluate(lateLifeGate, ledgerPath), 'native ledger reaches late-life after payoff');

  const caravanPath = merchantState({
    flags: {
      magnate_native_payoff_caravan_market: true,
      magnate_native_caravan_entry: true,
      magnate_native_caravan_market: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 50 } as PlayerState,
  });
  assert(evaluator.evaluate(lateLifeGate, caravanPath), 'native caravan reaches late-life after payoff');
}

function renderProofMarkdown(): string {
  const ledgerLate = merchantState({
    flags: {
      magnate_late_life_done: true,
      magnate_late_life_identity_done: true,
      magnate_native_late_ledger_steady: true,
      magnate_native_payoff_ledger_steady: true,
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
      magnate_native_pressure_ledger_steady: true,
    },
    player: { age: 52 } as PlayerState,
  });
  const caravanLate = merchantState({
    flags: {
      magnate_late_life_done: true,
      magnate_late_life_identity_done: true,
      magnate_native_late_caravan_market: true,
      magnate_native_payoff_caravan_market: true,
      magnate_native_caravan_entry: true,
      magnate_native_caravan_market: true,
      magnate_native_pressure_caravan_market: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 52 } as PlayerState,
  });

  const ledgerGoal = deriveSampleLineCurrentGoal(ledgerLate) ?? '';
  const ledgerCost = deriveSampleLineCostLabel(ledgerLate);
  const ledgerIdentity = deriveSampleLineAge40Identity(ledgerLate) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(caravanLate) ?? '';
  const caravanCost = deriveSampleLineCostLabel(caravanLate);
  const caravanIdentity = deriveSampleLineAge40Identity(caravanLate) ?? '';

  return [
    '# P99 Merchant Magnate Native Late-Life Chain Proof',
    '',
    '> **Stage:** P99 Wuxia Merchant Magnate Native Late-Life Sample',
    '> **Date:** 2026-07-02',
    '',
    'Narrow proof for native ledger/caravan magnate_late_life differentiation after magnate_payoff_done.',
    '',
    '## Ledger path (age 52 late-life checkpoint)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 52 |',
    '| P97 flags | magnate_native_ledger_entry, magnate_native_ledger_steady |',
    '| P98 flags | magnate_native_payoff_ledger_steady, magnate_native_pressure_ledger_steady |',
    '| P99 flags | magnate_late_life_done, magnate_native_late_ledger_steady |',
    `| currentGoal | ${ledgerGoal} |`,
    `| costLabel | ${ledgerCost} |`,
    `| age40Identity | ${ledgerIdentity} |`,
    '',
    '## Caravan path (age 52 late-life checkpoint)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 52 |',
    '| P97 flags | magnate_native_caravan_entry, magnate_native_caravan_market |',
    '| P98 flags | magnate_native_payoff_caravan_market, magnate_native_pressure_caravan_market |',
    '| P99 flags | magnate_late_life_done, magnate_native_late_caravan_market |',
    `| currentGoal | ${caravanGoal} |`,
    `| costLabel | ${caravanCost} |`,
    `| age40Identity | ${caravanIdentity} |`,
    '',
    '## Continuity',
    '',
    '- `magnate_late_life` choice branches read P98 payoff markers or P97 entry lineage',
    '- Ledger vs caravan produce distinguishable goals, cost labels, and age40 identity at late-life',
    '- P63/P64 bridge expressions retain priority when bridge markers are set',
    '- P55 magnate chain (on-ramp → pressure → payoff → late-life) remains reachable',
    '',
  ].join('\n');
}

export async function runP99MerchantMagnateNativeLateLifeTests(): Promise<void> {
  testLateLifeLoadsAsChoice();
  testNativeLateLifeChoices();
  testBridgeLateLifeDoesNotGetNativeChoices();
  testLateLifeGoalsDifferByTrack();
  testLateLifeCostLabelsDifferByTrack();
  testBridgeExpressionPriorityAtLateLife();
  testAge40IdentityAtLateLife();
  testMagnateChainReachableThroughLateLife();

  const proof = renderProofMarkdown();
  const outPath = join(process.cwd(), 'docs/test-reports/p99-merchant-magnate-native-late-life-chain-proof.md');
  writeFileSync(outPath, `${proof}\n`, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP99MerchantMagnateNativeLateLifeTests()
    .then(() => console.log('p99MerchantMagnateNativeLateLifeTests: ok'))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
