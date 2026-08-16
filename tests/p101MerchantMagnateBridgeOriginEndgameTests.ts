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

const ENDGAME_GATE_EXPR =
  "flags.has('magnate_late_life_done') && !flags.has('magnate_endgame_echo_done') && !flags.has('orthodox_childhood_seed_done') && !flags.has('demonic_childhood_seed_done')";

function bridgeMerchantState(
  bridgeFlag: 'apprentice' | 'tavern' | 'peasant',
  overrides: Partial<GameState> = {},
): GameState {
  const bridgeFlags: Record<string, boolean> = {
    origin_merchant_family: false,
    merchant_shop_grocery: false,
    apprentice_merchant_bridge_crossed: bridgeFlag === 'apprentice',
    tavern_merchant_bridge_crossed: bridgeFlag === 'tavern',
    peasant_merchant_bridge_crossed: bridgeFlag === 'peasant',
  };
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
      route_merchant: true,
      magnate_on_ramp_done: true,
      magnate_midlife_pressure_done: true,
      magnate_payoff_done: true,
      magnate_late_life_done: true,
      magnate_late_life_identity_done: true,
      merchant_age40_identity_done: true,
      ...bridgeFlags,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

const allEvents = sampleLinesSpine as SampleLineEvent[];
const apprenticeEndgameEvent = allEvents.find(e => e.id === 'magnate_endgame_echo_apprentice_craft');
const tavernEndgameEvent = allEvents.find(e => e.id === 'magnate_endgame_echo_tavern_network');
const peasantEndgameEvent = allEvents.find(e => e.id === 'magnate_endgame_echo_peasant_grain');
const genericEndgameEvent = allEvents.find(e => e.id === 'magnate_endgame_echo_generic');
const ledgerEndgameEvent = allEvents.find(e => e.id === 'magnate_endgame_echo_ledger_legacy');

function testBridgeEndgameEventsExist(): void {
  assert(Boolean(apprenticeEndgameEvent), 'magnate_endgame_echo_apprentice_craft should exist');
  assert(Boolean(tavernEndgameEvent), 'magnate_endgame_echo_tavern_network should exist');
  assert(Boolean(peasantEndgameEvent), 'magnate_endgame_echo_peasant_grain should exist');
}

function testBridgeEndgameEventsAreAutoWithAgeBand(): void {
  for (const event of [apprenticeEndgameEvent, tavernEndgameEvent, peasantEndgameEvent]) {
    assert(event?.eventType === 'auto', `${event?.id} should be auto type`);
    assert(event?.ageRange?.min === 58, `${event?.id} min age should be 58`);
    assert(event?.ageRange?.max === 65, `${event?.id} max age should be 65`);
  }
}

function testBridgeEndgameEventsSetCheckpointFlags(): void {
  const expectedMarkers: Record<string, string> = {
    magnate_endgame_echo_apprentice_craft: 'magnate_bridge_endgame_apprentice_craft',
    magnate_endgame_echo_tavern_network: 'magnate_bridge_endgame_tavern_network',
    magnate_endgame_echo_peasant_grain: 'magnate_bridge_endgame_peasant_grain',
  };
  for (const event of [apprenticeEndgameEvent, tavernEndgameEvent, peasantEndgameEvent]) {
    const effects = event?.autoEffects || [];
    const branchMarker = expectedMarkers[event!.id];
    assert(
      effects.some(e => e.type === 'flag_set' && e.target === 'magnate_endgame_echo_done'),
      `${event?.id} sets magnate_endgame_echo_done`,
    );
    assert(
      effects.some(e => e.type === 'flag_set' && e.target === 'magnate_endgame_identity_done'),
      `${event?.id} sets magnate_endgame_identity_done`,
    );
    assert(
      effects.some(e => e.type === 'flag_set' && e.target === branchMarker),
      `${event?.id} sets ${branchMarker}`,
    );
    assert(
      effects.some(e => e.type === 'event_record' && e.target === 'magnate_endgame_echo'),
      `${event?.id} records magnate_endgame_echo`,
    );
    const statEffects = effects.filter(e => e.type === 'stat_modify');
    assert(statEffects.length === 0, `${event?.id} should have no stat_modify (lightweight)`);
  }
}

function testBridgeOriginConditionsMutuallyExclusive(): void {
  const evaluator = new ConditionEvaluator();
  const apprentice = bridgeMerchantState('apprentice');
  const tavern = bridgeMerchantState('tavern');
  const peasant = bridgeMerchantState('peasant');

  assert(
    evaluator.evaluate(apprenticeEndgameEvent!.conditions![0]!, apprentice),
    'apprentice endgame should fire for apprentice bridge',
  );
  assert(
    evaluator.evaluate(tavernEndgameEvent!.conditions![0]!, tavern),
    'tavern endgame should fire for tavern bridge',
  );
  assert(
    evaluator.evaluate(peasantEndgameEvent!.conditions![0]!, peasant),
    'peasant endgame should fire for peasant bridge',
  );

  const genericCond = genericEndgameEvent!.conditions![0]!;
  assert(!evaluator.evaluate(genericCond, apprentice), 'apprentice should not get generic endgame');
  assert(!evaluator.evaluate(genericCond, tavern), 'tavern should not get generic endgame');
  assert(!evaluator.evaluate(genericCond, peasant), 'peasant should not get generic endgame');

  const ledgerCond = ledgerEndgameEvent!.conditions![0]!;
  assert(!evaluator.evaluate(ledgerCond, apprentice), 'bridge blocks native ledger endgame');
}

function testBridgeEndgameGoalsDifferByOrigin(): void {
  const apprentice = bridgeMerchantState('apprentice', {
    flags: {
      magnate_endgame_echo_done: true,
      magnate_endgame_identity_done: true,
      magnate_bridge_endgame_apprentice_craft: true,
    },
    player: { age: 62 } as PlayerState,
  });
  const tavern = bridgeMerchantState('tavern', {
    flags: {
      magnate_endgame_echo_done: true,
      magnate_endgame_identity_done: true,
      magnate_bridge_endgame_tavern_network: true,
    },
    player: { age: 62 } as PlayerState,
  });

  const apprenticeGoal = deriveSampleLineCurrentGoal(apprentice) ?? '';
  const tavernGoal = deriveSampleLineCurrentGoal(tavern) ?? '';
  assert(apprenticeGoal !== tavernGoal, `endgame goals should differ: ${apprenticeGoal} vs ${tavernGoal}`);
  assert(apprenticeGoal.includes('手艺'), `apprentice endgame goal: ${apprenticeGoal}`);
  assert(tavernGoal.includes('人情'), `tavern endgame goal: ${tavernGoal}`);
  assert(isPlayerVisibleSampleLineText(apprenticeGoal), `raw key in apprentice goal: ${apprenticeGoal}`);
  assert(isPlayerVisibleSampleLineText(tavernGoal), `raw key in tavern goal: ${tavernGoal}`);
}

function testBridgeEndgameCostLabelsDifferByOrigin(): void {
  const apprentice = bridgeMerchantState('apprentice', {
    flags: {
      magnate_endgame_echo_done: true,
      magnate_bridge_endgame_apprentice_craft: true,
    },
    player: { age: 62 } as PlayerState,
  });
  const tavern = bridgeMerchantState('tavern', {
    flags: {
      magnate_endgame_echo_done: true,
      magnate_bridge_endgame_tavern_network: true,
    },
    player: { age: 62 } as PlayerState,
  });

  const apprenticeCost = deriveSampleLineCostLabel(apprentice);
  const tavernCost = deriveSampleLineCostLabel(tavern);
  assert(apprenticeCost !== tavernCost, `endgame cost labels should differ: ${apprenticeCost} vs ${tavernCost}`);
  assert(apprenticeCost.includes('手艺'), `apprentice cost: ${apprenticeCost}`);
  assert(tavernCost.includes('人情'), `tavern cost: ${tavernCost}`);
}

function testBridgeEndgameIdentityAtCheckpoint(): void {
  const apprentice = bridgeMerchantState('apprentice', {
    flags: {
      magnate_endgame_echo_done: true,
      magnate_endgame_identity_done: true,
      magnate_bridge_endgame_apprentice_craft: true,
    },
    player: { age: 62 } as PlayerState,
  });
  const tavern = bridgeMerchantState('tavern', {
    flags: {
      magnate_endgame_echo_done: true,
      magnate_endgame_identity_done: true,
      magnate_bridge_endgame_tavern_network: true,
    },
    player: { age: 62 } as PlayerState,
  });

  const apprenticeIdentity = deriveSampleLineAge40Identity(apprentice) ?? '';
  const tavernIdentity = deriveSampleLineAge40Identity(tavern) ?? '';
  assert(apprenticeIdentity.includes('手艺'), `apprentice endgame identity: ${apprenticeIdentity}`);
  assert(tavernIdentity.includes('人情'), `tavern endgame identity: ${tavernIdentity}`);
  assert(apprenticeIdentity !== tavernIdentity, 'endgame identities should differ');
}

function testBridgeChainReachableThroughEndgame(): void {
  const evaluator = new ConditionEvaluator();
  const endgameGate = { type: 'expression' as const, expression: ENDGAME_GATE_EXPR };

  const apprenticePath = bridgeMerchantState('apprentice');
  const tavernPath = bridgeMerchantState('tavern');
  assert(evaluator.evaluate(endgameGate, apprenticePath), 'apprentice bridge reaches endgame after late-life');
  assert(evaluator.evaluate(endgameGate, tavernPath), 'tavern bridge reaches endgame after late-life');
}

function renderProofMarkdown(): string {
  const apprentice = bridgeMerchantState('apprentice', {
    flags: {
      magnate_endgame_echo_done: true,
      magnate_endgame_identity_done: true,
      magnate_bridge_endgame_apprentice_craft: true,
    },
    player: { age: 62 } as PlayerState,
  });
  const tavern = bridgeMerchantState('tavern', {
    flags: {
      magnate_endgame_echo_done: true,
      magnate_endgame_identity_done: true,
      magnate_bridge_endgame_tavern_network: true,
    },
    player: { age: 62 } as PlayerState,
  });

  const apprenticeGoal = deriveSampleLineCurrentGoal(apprentice) ?? '';
  const apprenticeCost = deriveSampleLineCostLabel(apprentice);
  const apprenticeIdentity = deriveSampleLineAge40Identity(apprentice) ?? '';
  const tavernGoal = deriveSampleLineCurrentGoal(tavern) ?? '';
  const tavernCost = deriveSampleLineCostLabel(tavern);
  const tavernIdentity = deriveSampleLineAge40Identity(tavern) ?? '';

  return [
    '# P101 Merchant Magnate Bridge-Origin Endgame Chain Proof',
    '',
    '> **Stage:** P101 Wuxia Merchant Magnate Bridge-Origin Endgame Differentiation',
    '> **Date:** 2026-07-02',
    '',
    'Narrow proof for apprentice/tavern/peasant bridge magnate_endgame_echo differentiation after magnate_late_life_done.',
    '',
    '## Apprentice bridge path (age 62 endgame checkpoint)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 62 |',
    '| P63 flags | apprentice_merchant_bridge_crossed |',
    '| P101 flags | magnate_endgame_echo_done, magnate_bridge_endgame_apprentice_craft |',
    `| currentGoal | ${apprenticeGoal} |`,
    `| costLabel | ${apprenticeCost} |`,
    `| age40Identity | ${apprenticeIdentity} |`,
    '',
    '## Tavern bridge path (age 62 endgame checkpoint)',
    '',
    '| Field | Value |',
    '| --- | --- |',
    '| age | 62 |',
    '| P63 flags | tavern_merchant_bridge_crossed |',
    '| P101 flags | magnate_endgame_echo_done, magnate_bridge_endgame_tavern_network |',
    `| currentGoal | ${tavernGoal} |`,
    `| costLabel | ${tavernCost} |`,
    `| age40Identity | ${tavernIdentity} |`,
    '',
    '## Continuity',
    '',
    '- `magnate_endgame_echo_*` bridge events read P63 `*_merchant_bridge_crossed` markers',
    '- Apprentice vs tavern produce distinguishable goals, cost labels, and age40 identity at endgame',
    '- Native P100 ledger/caravan endgame remains blocked for bridge players',
    '- P55 magnate chain (on-ramp → pressure → payoff → late-life → endgame) remains reachable for bridge origins',
    '',
  ].join('\n');
}

export async function runP101MerchantMagnateBridgeOriginEndgameTests(): Promise<void> {
  testBridgeEndgameEventsExist();
  testBridgeEndgameEventsAreAutoWithAgeBand();
  testBridgeEndgameEventsSetCheckpointFlags();
  testBridgeOriginConditionsMutuallyExclusive();
  testBridgeEndgameGoalsDifferByOrigin();
  testBridgeEndgameCostLabelsDifferByOrigin();
  testBridgeEndgameIdentityAtCheckpoint();
  testBridgeChainReachableThroughEndgame();

  const proof = renderProofMarkdown();
  const outPath = join(process.cwd(), 'artifacts/reports/p101-merchant-magnate-bridge-origin-endgame-chain-proof.md');
  writeFileSync(outPath, proof, 'utf8');
  console.log(`Wrote proof artifact: ${outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP101MerchantMagnateBridgeOriginEndgameTests()
    .then(() => console.log('p101MerchantMagnateBridgeOriginEndgameTests: all passed'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
