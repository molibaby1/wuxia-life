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
import sampleLinesSpine from '../src/data/lines/sample-lines-spine.json';
import type { GameState, PlayerState, SampleLineEvent } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const ENDGAME_GATE_EXPR =
  "flags.has('magnate_late_life_done') && !flags.has('magnate_endgame_echo_done') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')";

function merchantState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 60,
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
      magnate_late_life_done: true,
      magnate_late_life_identity_done: true,
      merchant_age40_identity_done: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

const allEvents = sampleLinesSpine as SampleLineEvent[];
const ledgerEndgameEvent = allEvents.find(e => e.id === 'magnate_endgame_echo_ledger_legacy');
const caravanEndgameEvent = allEvents.find(e => e.id === 'magnate_endgame_echo_caravan_legacy');
const genericEndgameEvent = allEvents.find(e => e.id === 'magnate_endgame_echo_generic');

function testEndgameEventsExist(): void {
  assert(Boolean(ledgerEndgameEvent), 'magnate_endgame_echo_ledger_legacy should exist');
  assert(Boolean(caravanEndgameEvent), 'magnate_endgame_echo_caravan_legacy should exist');
  assert(Boolean(genericEndgameEvent), 'magnate_endgame_echo_generic should exist');
}

function testEndgameEventsAreAutoWithAgeBand(): void {
  for (const event of [ledgerEndgameEvent, caravanEndgameEvent, genericEndgameEvent]) {
    assert(event?.eventType === 'auto', `${event?.id} should be auto type`);
    assert(event?.ageRange?.min === 58, `${event?.id} min age should be 58`);
    assert(event?.ageRange?.max === 65, `${event?.id} max age should be 65`);
  }
}

function testEndgameEventsSetCheckpointFlags(): void {
  for (const event of [ledgerEndgameEvent, caravanEndgameEvent, genericEndgameEvent]) {
    const effects = event?.autoEffects || [];
    assert(
      effects.some(e => e.type === 'flag_set' && e.target === 'magnate_endgame_echo_done'),
      `${event?.id} sets magnate_endgame_echo_done`,
    );
    assert(
      effects.some(e => e.type === 'flag_set' && e.target === 'magnate_endgame_identity_done'),
      `${event?.id} sets magnate_endgame_identity_done`,
    );
    assert(
      effects.some(e => e.type === 'event_record' && e.target === 'magnate_endgame_echo'),
      `${event?.id} records magnate_endgame_echo`,
    );
    const statEffects = effects.filter(e => e.type === 'stat_modify');
    assert(statEffects.length === 0, `${event?.id} should have no stat_modify (lightweight)`);
  }
}

function testNativeLedgerEndgameCondition(): void {
  const evaluator = new ConditionEvaluator();
  const ledgerState = merchantState({
    flags: {
      magnate_native_late_ledger_steady: true,
      magnate_native_payoff_ledger_steady: true,
      magnate_native_ledger_entry: true,
    },
    player: { age: 60 } as PlayerState,
  });
  const cond = ledgerEndgameEvent!.conditions![0]!;
  assert(evaluator.evaluate(cond, ledgerState), 'ledger endgame should fire for native ledger late-life');

  const caravanState = merchantState({
    flags: {
      magnate_native_late_caravan_market: true,
      magnate_native_payoff_caravan_market: true,
      magnate_native_caravan_entry: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 60 } as PlayerState,
  });
  const caravanCond = caravanEndgameEvent!.conditions![0]!;
  assert(evaluator.evaluate(caravanCond, caravanState), 'caravan endgame should fire for native caravan late-life');
}

function testBridgeBlocksNativeEndgameGetsOriginEcho(): void {
  const evaluator = new ConditionEvaluator();
  const apprenticeEvent = allEvents.find(e => e.id === 'magnate_endgame_echo_apprentice_craft');
  const tavernEvent = allEvents.find(e => e.id === 'magnate_endgame_echo_tavern_network');
  assert(Boolean(apprenticeEvent), 'magnate_endgame_echo_apprentice_craft should exist');
  assert(Boolean(tavernEvent), 'magnate_endgame_echo_tavern_network should exist');

  const apprentice = merchantState({
    flags: {
      apprentice_merchant_bridge_crossed: true,
      magnate_native_late_ledger_steady: true,
      merchant_shop_grocery: false,
    },
    player: { age: 60 } as PlayerState,
  });
  const ledgerCond = ledgerEndgameEvent!.conditions![0]!;
  const apprenticeCond = apprenticeEvent!.conditions![0]!;
  const genericCond = genericEndgameEvent!.conditions![0]!;
  assert(!evaluator.evaluate(ledgerCond, apprentice), 'bridge blocks native ledger endgame');
  assert(evaluator.evaluate(apprenticeCond, apprentice), 'apprentice bridge gets origin-specific endgame');
  assert(!evaluator.evaluate(genericCond, apprentice), 'bridge no longer routes to generic endgame');

  const tavern = merchantState({
    flags: {
      tavern_merchant_bridge_crossed: true,
      merchant_shop_grocery: false,
    },
    player: { age: 60 } as PlayerState,
  });
  const tavernCond = tavernEvent!.conditions![0]!;
  assert(evaluator.evaluate(tavernCond, tavern), 'tavern bridge gets origin-specific endgame');
  assert(!evaluator.evaluate(genericCond, tavern), 'tavern bridge does not get generic endgame');
}

function testEndgameGoalsDifferByTrack(): void {
  const ledger = merchantState({
    flags: {
      magnate_endgame_echo_done: true,
      magnate_endgame_identity_done: true,
      magnate_native_endgame_ledger_legacy: true,
      magnate_native_late_ledger_steady: true,
    },
    player: { age: 62 } as PlayerState,
  });
  const caravan = merchantState({
    flags: {
      magnate_endgame_echo_done: true,
      magnate_endgame_identity_done: true,
      magnate_native_endgame_caravan_legacy: true,
      magnate_native_late_caravan_market: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 62 } as PlayerState,
  });

  const ledgerGoal = deriveSampleLineCurrentGoal(ledger) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(caravan) ?? '';
  assert(ledgerGoal !== caravanGoal, `endgame goals should differ: ${ledgerGoal} vs ${caravanGoal}`);
  assert(ledgerGoal.includes('稳态') || ledgerGoal.includes('招牌'), `ledger endgame goal: ${ledgerGoal}`);
  assert(caravanGoal.includes('行市') || caravanGoal.includes('货路'), `caravan endgame goal: ${caravanGoal}`);
  assert(isPlayerVisibleSampleLineText(ledgerGoal), `raw key in ledger goal: ${ledgerGoal}`);
  assert(isPlayerVisibleSampleLineText(caravanGoal), `raw key in caravan goal: ${caravanGoal}`);
}

function testEndgameCostLabelsDifferByTrack(): void {
  const ledger = merchantState({
    flags: {
      magnate_endgame_echo_done: true,
      magnate_native_endgame_ledger_legacy: true,
      magnate_native_late_ledger_credit: true,
    },
    player: { age: 62 } as PlayerState,
  });
  const caravan = merchantState({
    flags: {
      magnate_endgame_echo_done: true,
      magnate_native_endgame_caravan_legacy: true,
      magnate_native_late_caravan_fast: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 62 } as PlayerState,
  });

  const ledgerCost = deriveSampleLineCostLabel(ledger);
  const caravanCost = deriveSampleLineCostLabel(caravan);
  assert(ledgerCost !== caravanCost, `endgame cost labels should differ: ${ledgerCost} vs ${caravanCost}`);
  assert(ledgerCost.includes('稳态') || ledgerCost.includes('身后'), `ledger cost: ${ledgerCost}`);
  assert(caravanCost.includes('行市') || caravanCost.includes('身后'), `caravan cost: ${caravanCost}`);
}

function testBridgeExpressionPriorityAtEndgame(): void {
  const apprentice = merchantState({
    flags: {
      magnate_endgame_echo_done: true,
      magnate_endgame_identity_done: true,
      magnate_bridge_endgame_apprentice_craft: true,
      apprentice_merchant_bridge_crossed: true,
      magnate_native_endgame_ledger_legacy: true,
      merchant_shop_grocery: false,
    },
    player: { age: 62 } as PlayerState,
  });

  const goal = deriveSampleLineCurrentGoal(apprentice) ?? '';
  const cost = deriveSampleLineCostLabel(apprentice);
  const identity = deriveSampleLineAge40Identity(apprentice) ?? '';
  assert(goal.includes('手艺'), `bridge endgame goal should win: ${goal}`);
  assert(cost.includes('手艺'), `bridge endgame cost should win: ${cost}`);
  assert(identity.includes('手艺'), `bridge endgame identity should win: ${identity}`);
}

function testEndgameIdentityAtCheckpoint(): void {
  const ledgerEnd = merchantState({
    flags: {
      magnate_endgame_echo_done: true,
      magnate_endgame_identity_done: true,
      magnate_native_endgame_ledger_legacy: true,
      magnate_native_late_ledger_steady: true,
      magnate_native_payoff_ledger_steady: true,
      magnate_native_ledger_entry: true,
    },
    player: { age: 62 } as PlayerState,
  });
  const caravanEnd = merchantState({
    flags: {
      magnate_endgame_echo_done: true,
      magnate_endgame_identity_done: true,
      magnate_native_endgame_caravan_legacy: true,
      magnate_native_late_caravan_market: true,
      magnate_native_payoff_caravan_market: true,
      magnate_native_caravan_entry: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 62 } as PlayerState,
  });

  const ledgerIdentity = deriveSampleLineAge40Identity(ledgerEnd) ?? '';
  const caravanIdentity = deriveSampleLineAge40Identity(caravanEnd) ?? '';
  assert(ledgerIdentity.includes('稳态') || ledgerIdentity.includes('招牌'), `ledger endgame identity: ${ledgerIdentity}`);
  assert(caravanIdentity.includes('行市') || caravanIdentity.includes('货路'), `caravan endgame identity: ${caravanIdentity}`);
  assert(ledgerIdentity !== caravanIdentity, 'endgame identities should differ');
}

function testMagnateChainReachableThroughEndgame(): void {
  const evaluator = new ConditionEvaluator();
  const endgameGate = { type: 'expression' as const, expression: ENDGAME_GATE_EXPR };

  const ledgerPath = merchantState({
    flags: {
      magnate_native_late_ledger_steady: true,
      magnate_native_payoff_ledger_steady: true,
      magnate_native_ledger_entry: true,
    },
    player: { age: 60 } as PlayerState,
  });
  assert(evaluator.evaluate(endgameGate, ledgerPath), 'native ledger reaches endgame after late-life');

  const caravanPath = merchantState({
    flags: {
      magnate_native_late_caravan_market: true,
      magnate_native_payoff_caravan_market: true,
      magnate_native_caravan_entry: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 60 } as PlayerState,
  });
  assert(evaluator.evaluate(endgameGate, caravanPath), 'native caravan reaches endgame after late-life');
}

function renderProofMarkdown(): string {
  const ledgerEnd = merchantState({
    flags: {
      magnate_endgame_echo_done: true,
      magnate_endgame_identity_done: true,
      magnate_native_endgame_ledger_legacy: true,
      magnate_native_late_ledger_steady: true,
      magnate_native_payoff_ledger_steady: true,
      magnate_native_ledger_entry: true,
      magnate_native_ledger_steady: true,
    },
    player: { age: 62 } as PlayerState,
  });
  const caravanEnd = merchantState({
    flags: {
      magnate_endgame_echo_done: true,
      magnate_endgame_identity_done: true,
      magnate_native_endgame_caravan_legacy: true,
      magnate_native_late_caravan_market: true,
      magnate_native_payoff_caravan_market: true,
      magnate_native_caravan_entry: true,
      magnate_native_caravan_market: true,
      hvg_merchant_ledger_track: false,
      hvg_merchant_caravan_track: true,
    },
    player: { age: 62 } as PlayerState,
  });

  const ledgerGoal = deriveSampleLineCurrentGoal(ledgerEnd) ?? '';
  const ledgerCost = deriveSampleLineCostLabel(ledgerEnd);
  const ledgerIdentity = deriveSampleLineAge40Identity(ledgerEnd) ?? '';
  const caravanGoal = deriveSampleLineCurrentGoal(caravanEnd) ?? '';
  const caravanCost = deriveSampleLineCostLabel(caravanEnd);
  const caravanIdentity = deriveSampleLineAge40Identity(caravanEnd) ?? '';

  return [
    '# P100 Merchant Magnate Native Endgame Chain Proof',
    '',
    '> **Stage:** P100 Wuxia Merchant Magnate Native Endgame Echo Sample',
    '> **Date:** 2026-07-02',
    '',
    'Narrow proof for native ledger/caravan magnate_endgame_echo differentiation after magnate_late_life_done.',
    '',
    '## Ledger path (age 62 endgame checkpoint)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 62 |',
    '| P97 flags | magnate_native_ledger_entry, magnate_native_ledger_steady |',
    '| P98 flags | magnate_native_payoff_ledger_steady |',
    '| P99 flags | magnate_late_life_done, magnate_native_late_ledger_steady |',
    '| P100 flags | magnate_endgame_echo_done, magnate_native_endgame_ledger_legacy |',
    `| currentGoal | ${ledgerGoal} |`,
    `| costLabel | ${ledgerCost} |`,
    `| age40Identity | ${ledgerIdentity} |`,
    '',
    '## Caravan path (age 62 endgame checkpoint)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 62 |',
    '| P97 flags | magnate_native_caravan_entry, magnate_native_caravan_market |',
    '| P98 flags | magnate_native_payoff_caravan_market |',
    '| P99 flags | magnate_late_life_done, magnate_native_late_caravan_market |',
    '| P100 flags | magnate_endgame_echo_done, magnate_native_endgame_caravan_legacy |',
    `| currentGoal | ${caravanGoal} |`,
    `| costLabel | ${caravanCost} |`,
    `| age40Identity | ${caravanIdentity} |`,
    '',
    '## Continuity',
    '',
    '- `magnate_endgame_echo_*` auto events read P99 late-life markers or P98/P97 fallback',
    '- Ledger vs caravan produce distinguishable goals, cost labels, and age40 identity at endgame',
    '- P63/P64 bridge expressions retain priority when bridge markers are set',
    '- P55 magnate chain (on-ramp → pressure → payoff → late-life → endgame) remains reachable',
    '',
  ].join('\n');
}

export async function runP100MerchantMagnateNativeEndgameTests(): Promise<void> {
  testEndgameEventsExist();
  testEndgameEventsAreAutoWithAgeBand();
  testEndgameEventsSetCheckpointFlags();
  testNativeLedgerEndgameCondition();
  testBridgeBlocksNativeEndgameGetsOriginEcho();
  testEndgameGoalsDifferByTrack();
  testEndgameCostLabelsDifferByTrack();
  testBridgeExpressionPriorityAtEndgame();
  testEndgameIdentityAtCheckpoint();
  testMagnateChainReachableThroughEndgame();

  const proof = renderProofMarkdown();
  const outPath = join(process.cwd(), 'artifacts/reports/p100-merchant-magnate-native-endgame-chain-proof.md');
  writeFileSync(outPath, proof, 'utf8');
  console.log(`Wrote proof artifact: ${outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP100MerchantMagnateNativeEndgameTests()
    .then(() => console.log('p100MerchantMagnateNativeEndgameTests: all passed'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
