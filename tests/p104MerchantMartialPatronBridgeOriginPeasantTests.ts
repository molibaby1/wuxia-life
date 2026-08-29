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

const BRIDGE_GATE_ARM =
  "flags.has('route_wealth_committed') && (flags.has('apprentice_merchant_bridge_crossed') || flags.has('tavern_merchant_bridge_crossed') || flags.has('peasant_merchant_bridge_crossed'))";

const NATIVE_GATE_ARM =
  "(flags.has('route_wealth_committed') || flags.has('p22_wealth_route_forked')) && (flags.has('merchant_invest_good') || flags.has('merchant_invest_evil') || flags.has('merchant_invest_both'))";

function bridgePatronState(
  bridgeFlag: 'apprentice' | 'tavern' | 'peasant',
  overrides: Partial<GameState> = {},
): GameState {
  const bridgeFlags: Record<string, boolean> = {
    apprentice_merchant_bridge_crossed: bridgeFlag === 'apprentice',
    tavern_merchant_bridge_crossed: bridgeFlag === 'tavern',
    peasant_merchant_bridge_crossed: bridgeFlag === 'peasant',
  };
  return {
    ...overrides,
    player: {
      age: 36,
      charisma: 10,
      martialPower: 30,
      reputation: 20,
      businessAcumen: 8,
      connections: 8,
      ...(overrides.player ?? {}),
    } as PlayerState,
    flags: {
      route_wealth_committed: true,
      merchant_age40_identity_done: true,
      ...bridgeFlags,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

function nativePatronState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 36,
      charisma: 10,
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

function testPeasantBridgeGateAcceptsWithoutInvest(): void {
  const evaluator = new ConditionEvaluator();
  const gate = entryEvent!.conditions![0]!;
  const peasant = bridgePatronState('peasant');

  assert(evaluator.evaluate(gate, peasant), 'peasant bridge should pass entry gate without invest');

  const noWealth = bridgePatronState('peasant');
  delete (noWealth.flags as Record<string, unknown>).route_wealth_committed;
  assert(!evaluator.evaluate(gate, noWealth), 'peasant without route_wealth_committed should fail');

  const noBridge = bridgePatronState('peasant');
  delete (noBridge.flags as Record<string, unknown>).peasant_merchant_bridge_crossed;
  assert(!evaluator.evaluate(gate, noBridge), 'missing peasant bridge marker should fail without invest');
}

function testP103BridgeOriginsStillPassGate(): void {
  const evaluator = new ConditionEvaluator();
  const gate = entryEvent!.conditions![0]!;
  assert(evaluator.evaluate(gate, bridgePatronState('apprentice')), 'apprentice bridge should still pass');
  assert(evaluator.evaluate(gate, bridgePatronState('tavern')), 'tavern bridge should still pass');
}

function testNativeGateUnchanged(): void {
  const evaluator = new ConditionEvaluator();
  const gate = entryEvent!.conditions![0]!;
  assert(evaluator.evaluate(gate, nativePatronState()), 'native wealth+invest should still pass entry gate');
}

function testPeasantChoiceSetsCheckpointFlag(): void {
  const peasantChoice = entryEvent!.choices!.find(c => c.id === 'patron_bridge_peasant_grain_alliance');
  assert(Boolean(peasantChoice), 'peasant bridge choice should exist');

  const effects = peasantChoice!.effects ?? [];
  assert(
    effects.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_bridge_peasant_grain'),
    'peasant choice sets merchant_patron_bridge_peasant_grain',
  );
  assert(
    effects.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_on_ramp_done'),
    'peasant choice sets merchant_patron_on_ramp_done',
  );
}

function testPeasantPathReachesPayoffCheckpoint(): void {
  const evaluator = new ConditionEvaluator();
  const payoffGate = payoffEvent!.conditions![0]!;
  const peasantPayoff = bridgePatronState('peasant', {
    player: { age: 50 } as PlayerState,
    flags: {
      merchant_patron_bridge_crossed: true,
      merchant_patron_on_ramp_done: true,
      merchant_patron_bridge_peasant_grain: true,
      merchant_patron_midlife_pressure_done: true,
    },
  });
  assert(evaluator.evaluate(payoffGate, peasantPayoff), 'peasant bridge should reach payoff gate');
}

function testPeasantExpressionDiffersFromOtherOrigins(): void {
  const peasant = bridgePatronState('peasant', {
    player: { age: 40 } as PlayerState,
    flags: {
      merchant_patron_on_ramp_done: true,
      merchant_patron_bridge_peasant_grain: true,
    },
  });
  const apprentice = bridgePatronState('apprentice', {
    player: { age: 40 } as PlayerState,
    flags: {
      merchant_patron_on_ramp_done: true,
      merchant_patron_bridge_apprentice_craft: true,
    },
  });

  const peasantGoal = deriveSampleLineCurrentGoal(peasant);
  const apprenticeGoal = deriveSampleLineCurrentGoal(apprentice);
  const peasantCost = deriveSampleLineCostLabel(peasant);
  const peasantIdentity = deriveSampleLineAge40Identity(peasant);

  assert(peasantGoal.includes('粮路') || peasantGoal.includes('囤粮'), `peasant goal: ${peasantGoal}`);
  assert(peasantCost.includes('粮路'), `peasant cost: ${peasantCost}`);
  assert(peasantIdentity?.includes('粮路'), `peasant identity: ${peasantIdentity}`);
  assert(peasantGoal !== apprenticeGoal, 'peasant and apprentice goals should differ');
  assert(isPlayerVisibleSampleLineText(peasantGoal), 'peasant goal should be player-visible');
}

function testNativeExpressionPriorityOverPeasantMarker(): void {
  const dualMarker = bridgePatronState('peasant', {
    player: { age: 40 } as PlayerState,
    flags: {
      merchant_patron_on_ramp_done: true,
      merchant_patron_on_ramp_orthodox: true,
      merchant_patron_bridge_peasant_grain: true,
    },
  });
  const goal = deriveSampleLineCurrentGoal(dualMarker);
  assert(goal.includes('侠义盟约'), 'native orthodox expression should win over peasant bridge marker');
}

function testMagnateExpressionPriorityOverPeasantPatron(): void {
  const magnate = bridgePatronState('peasant', {
    player: { age: 40 } as PlayerState,
    flags: {
      magnate_on_ramp_done: true,
      merchant_patron_on_ramp_done: true,
      merchant_patron_bridge_peasant_grain: true,
    },
  });
  const goal = deriveSampleLineCurrentGoal(magnate);
  assert(goal.includes('巨贾') || goal.includes('产业') || goal.includes('粮路'), `magnate tier should win: ${goal}`);
  assert(!goal.includes('囤粮与护镖'), 'patron peasant goal should not show when magnate markers set');
}

function writeChainProof(): void {
  const lines = [
    '# P104 Merchant Martial Patron Bridge-Origin Peasant Chain Proof',
    '',
    '> **Stage:** P104 Wuxia Merchant Martial Patron Bridge-Origin Peasant (Narrow Playable)',
    '> **Date:** 2026-07-02',
    '',
    '## Chain nodes',
    '',
    '| Step | Age | Event | Flags in | Flags out |',
    '| ---- | --- | ----- | -------- | --------- |',
    '| 1 | 18–28 | P60 bridge entry | origin markers | `peasant_merchant_bridge_crossed`, `route_wealth_committed` |',
    '| 2 | 34–38 | `merchant_patron_bridge_entry` (peasant bridge arm) | `route_wealth_committed` + `peasant_merchant_bridge_crossed` | `merchant_patron_bridge_crossed`, `merchant_patron_on_ramp_done`, `merchant_patron_bridge_peasant_grain` |',
    '| 3 | 48–52 | `merchant_patron_payoff_echo` | `merchant_patron_on_ramp_done` | `merchant_patron_payoff_done`, `merchant_patron_identity_done` |',
    '',
    '## Gate arms',
    '',
    '| Arm | Expression fragment |',
    '| --- | ------------------- |',
    '| Native (P102) | `' + NATIVE_GATE_ARM + '` |',
    '| Bridge (P103 + P104) | `' + BRIDGE_GATE_ARM + '` |',
    '',
    '## Peasant bridge-origin checkpoint',
    '',
    '| Origin | Choice ID | Checkpoint flag |',
    '| ------ | --------- | --------------- |',
    '| Peasant | `patron_bridge_peasant_grain_alliance` | `merchant_patron_bridge_peasant_grain` |',
    '',
    '## Expression differentiation',
    '',
    '| Surface | Peasant bridge | Priority |',
    '| ------- | -------------- | -------- |',
    '| `merchantCurrentGoal` | 粮路脚力换门派护商 | orthodox/martial when invest markers set |',
    '| `deriveSampleLineCostLabel` | 粮路护商之累 | 侠义盟约/护商武力 when native variants set |',
    '| `merchantAge40Identity` | 粮路金主 | magnate tiers win when magnate markers set |',
    '',
    '## Regression scope',
    '',
    '- P102 native patron bridge tests: unchanged native path',
    '- P103 apprentice/tavern patron bridge tests: unchanged bridge paths',
    '- P97–P101 magnate tests: no spine regression',
    '- `guard:sample-lines-baseline`: spine additive extension only',
    '',
    '## Deferred',
    '',
    '- Full patron pressure/mid/late chain',
    '- Full Wave 3 mixed-achievement graph',
  ];
  const outPath = join(
    process.cwd(),
    'artifacts/reports/p104-merchant-martial-patron-bridge-origin-peasant-chain-proof.md',
  );
  writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  console.log(`Wrote proof artifact: ${outPath}`);
}

const tests: Array<[string, () => void]> = [
  ['peasant bridge gate accepts without invest', testPeasantBridgeGateAcceptsWithoutInvest],
  ['P103 apprentice/tavern bridge gates unchanged', testP103BridgeOriginsStillPassGate],
  ['native gate unchanged', testNativeGateUnchanged],
  ['peasant choice sets checkpoint flag', testPeasantChoiceSetsCheckpointFlag],
  ['peasant path reaches payoff checkpoint', testPeasantPathReachesPayoffCheckpoint],
  ['peasant expression differs from other origins', testPeasantExpressionDiffersFromOtherOrigins],
  ['native expression priority over peasant marker', testNativeExpressionPriorityOverPeasantMarker],
  ['magnate expression priority over peasant patron', testMagnateExpressionPriorityOverPeasantPatron],
];

for (const [name, fn] of tests) {
  try {
    fn();
  } catch (error) {
    throw new Error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

writeChainProof();
console.log('p104MerchantMartialPatronBridgeOriginPeasantTests: all passed');
