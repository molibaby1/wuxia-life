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
  "flags.has('route_wealth_committed') && (flags.has('apprentice_merchant_bridge_crossed') || flags.has('tavern_merchant_bridge_crossed'))";

const NATIVE_GATE_ARM =
  "(flags.has('route_wealth_committed') || flags.has('p22_wealth_route_forked')) && (flags.has('merchant_invest_good') || flags.has('merchant_invest_evil') || flags.has('merchant_invest_both'))";

function bridgePatronState(
  bridgeFlag: 'apprentice' | 'tavern',
  overrides: Partial<GameState> = {},
): GameState {
  const bridgeFlags: Record<string, boolean> = {
    apprentice_merchant_bridge_crossed: bridgeFlag === 'apprentice',
    tavern_merchant_bridge_crossed: bridgeFlag === 'tavern',
  };
  return {
    ...overrides,
    player: {
      age: 36,
      charisma: 10,
      money: 120,
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

function testBridgeOriginGateAcceptsWithoutInvest(): void {
  const evaluator = new ConditionEvaluator();
  const gate = entryEvent!.conditions![0]!;
  const apprentice = bridgePatronState('apprentice');
  const tavern = bridgePatronState('tavern');

  assert(evaluator.evaluate(gate, apprentice), 'apprentice bridge should pass entry gate without invest');
  assert(evaluator.evaluate(gate, tavern), 'tavern bridge should pass entry gate without invest');

  const noWealth = bridgePatronState('apprentice');
  delete (noWealth.flags as Record<string, unknown>).route_wealth_committed;
  assert(!evaluator.evaluate(gate, noWealth), 'bridge without route_wealth_committed should fail');

  const noBridge = bridgePatronState('apprentice');
  delete (noBridge.flags as Record<string, unknown>).apprentice_merchant_bridge_crossed;
  assert(!evaluator.evaluate(gate, noBridge), 'missing bridge marker should fail without invest');
}

function testNativeGateUnchanged(): void {
  const evaluator = new ConditionEvaluator();
  const gate = entryEvent!.conditions![0]!;
  const native = nativePatronState();
  assert(evaluator.evaluate(gate, native), 'native wealth+invest should still pass entry gate');

  const noInvest = nativePatronState();
  delete (noInvest.flags as Record<string, unknown>).merchant_invest_good;
  assert(!evaluator.evaluate(gate, noInvest), 'native without invest and without bridge should fail');
}

function testBridgeChoicesSetOriginCheckpointFlags(): void {
  const apprenticeChoice = entryEvent!.choices!.find(c => c.id === 'patron_bridge_apprentice_craft_alliance');
  const tavernChoice = entryEvent!.choices!.find(c => c.id === 'patron_bridge_tavern_network_alliance');
  assert(Boolean(apprenticeChoice), 'apprentice bridge choice should exist');
  assert(Boolean(tavernChoice), 'tavern bridge choice should exist');

  const apprenticeEffects = apprenticeChoice!.effects ?? [];
  assert(
    apprenticeEffects.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_bridge_apprentice_craft'),
    'apprentice choice sets merchant_patron_bridge_apprentice_craft',
  );
  assert(
    apprenticeEffects.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_on_ramp_done'),
    'apprentice choice sets merchant_patron_on_ramp_done',
  );

  const tavernEffects = tavernChoice!.effects ?? [];
  assert(
    tavernEffects.some(e => e.type === 'flag_set' && e.target === 'merchant_patron_bridge_tavern_network'),
    'tavern choice sets merchant_patron_bridge_tavern_network',
  );
}

function testBridgeOriginPathsReachPayoffCheckpoint(): void {
  const evaluator = new ConditionEvaluator();
  const payoffGate = payoffEvent!.conditions![0]!;

  const apprenticePayoff = bridgePatronState('apprentice', {
    player: { age: 50 } as PlayerState,
    flags: {
      merchant_patron_bridge_crossed: true,
      merchant_patron_on_ramp_done: true,
      merchant_patron_bridge_apprentice_craft: true,
      merchant_patron_midlife_pressure_done: true,
    },
  });
  const tavernPayoff = bridgePatronState('tavern', {
    player: { age: 50 } as PlayerState,
    flags: {
      merchant_patron_bridge_crossed: true,
      merchant_patron_on_ramp_done: true,
      merchant_patron_bridge_tavern_network: true,
      merchant_patron_midlife_pressure_done: true,
    },
  });

  assert(evaluator.evaluate(payoffGate, apprenticePayoff), 'apprentice bridge should reach payoff gate');
  assert(evaluator.evaluate(payoffGate, tavernPayoff), 'tavern bridge should reach payoff gate');
}

function testBridgeOriginExpressionDiffersByOrigin(): void {
  const apprentice = bridgePatronState('apprentice', {
    player: { age: 40 } as PlayerState,
    flags: {
      merchant_patron_on_ramp_done: true,
      merchant_patron_bridge_apprentice_craft: true,
    },
  });
  const tavern = bridgePatronState('tavern', {
    player: { age: 40 } as PlayerState,
    flags: {
      merchant_patron_on_ramp_done: true,
      merchant_patron_bridge_tavern_network: true,
    },
  });
  const native = nativePatronState({
    player: { age: 40 } as PlayerState,
    flags: {
      merchant_patron_on_ramp_done: true,
      merchant_patron_on_ramp_orthodox: true,
    },
  });

  const apprenticeGoal = deriveSampleLineCurrentGoal(apprentice);
  const tavernGoal = deriveSampleLineCurrentGoal(tavern);
  const nativeGoal = deriveSampleLineCurrentGoal(native);

  assert(apprenticeGoal.includes('手艺'), `apprentice goal: ${apprenticeGoal}`);
  assert(tavernGoal.includes('酒肆') || tavernGoal.includes('人脉'), `tavern goal: ${tavernGoal}`);
  assert(nativeGoal.includes('侠义盟约'), `native goal should retain orthodox: ${nativeGoal}`);
  assert(apprenticeGoal !== tavernGoal, 'apprentice and tavern goals should differ');

  const apprenticeCost = deriveSampleLineCostLabel(apprentice);
  const tavernCost = deriveSampleLineCostLabel(tavern);
  assert(apprenticeCost.includes('手艺'), `apprentice cost: ${apprenticeCost}`);
  assert(tavernCost.includes('人脉'), `tavern cost: ${tavernCost}`);

  const apprenticeIdentity = deriveSampleLineAge40Identity(apprentice);
  const tavernIdentity = deriveSampleLineAge40Identity(tavern);
  assert(apprenticeIdentity?.includes('手艺'), `apprentice identity: ${apprenticeIdentity}`);
  assert(tavernIdentity?.includes('人脉') || tavernIdentity?.includes('酒肆'), `tavern identity: ${tavernIdentity}`);
  assert(isPlayerVisibleSampleLineText(apprenticeGoal), 'apprentice goal should be player-visible');
}

function testNativeExpressionPriorityOverBridgeMarkers(): void {
  const dualMarker = bridgePatronState('apprentice', {
    player: { age: 40 } as PlayerState,
    flags: {
      merchant_patron_on_ramp_done: true,
      merchant_patron_on_ramp_orthodox: true,
      merchant_patron_bridge_apprentice_craft: true,
    },
  });
  const goal = deriveSampleLineCurrentGoal(dualMarker);
  assert(goal.includes('侠义盟约'), 'native orthodox expression should win over bridge marker');
}

function testMagnateExpressionPriorityOverPatron(): void {
  const magnate = bridgePatronState('apprentice', {
    player: { age: 40 } as PlayerState,
    flags: {
      magnate_on_ramp_done: true,
      merchant_patron_on_ramp_done: true,
      merchant_patron_bridge_apprentice_craft: true,
    },
  });
  const goal = deriveSampleLineCurrentGoal(magnate);
  assert(goal.includes('手艺学透') || goal.includes('巨贾') || goal.includes('产业'), `magnate tier should win: ${goal}`);
  assert(!goal.includes('刨花与剑鞘'), 'patron bridge goal should not show when magnate markers set');
}

function writeChainProof(): void {
  const lines = [
    '# P103 Merchant Martial Patron Bridge-Origin Chain Proof',
    '',
    '> **Stage:** P103 Wuxia Merchant Martial Patron Bridge-Origin (Narrow Playable)',
    '> **Date:** 2026-07-02',
    '',
    '## Chain nodes',
    '',
    '| Step | Age | Event | Flags in | Flags out |',
    '| ---- | --- | ----- | -------- | --------- |',
    '| 1 | 18–28 | P58/P59 bridge entry | origin markers | `*_merchant_bridge_crossed`, `route_wealth_committed` |',
    '| 2 | 34–38 | `merchant_patron_bridge_entry` (bridge arm) | `route_wealth_committed` + bridge marker | `merchant_patron_bridge_crossed`, `merchant_patron_on_ramp_done`, origin checkpoint |',
    '| 3 | 48–52 | `merchant_patron_payoff_echo` | `merchant_patron_on_ramp_done` | `merchant_patron_payoff_done`, `merchant_patron_identity_done` |',
    '',
    '## Gate arms',
    '',
    '| Arm | Expression fragment |',
    '| --- | ------------------- |',
    '| Native (P102) | `' + NATIVE_GATE_ARM + '` |',
    '| Bridge (P103) | `' + BRIDGE_GATE_ARM + '` |',
    '',
    '## Bridge-origin checkpoint flags',
    '',
    '| Origin | Choice ID | Checkpoint flag |',
    '| ------ | --------- | --------------- |',
    '| Apprentice | `patron_bridge_apprentice_craft_alliance` | `merchant_patron_bridge_apprentice_craft` |',
    '| Tavern | `patron_bridge_tavern_network_alliance` | `merchant_patron_bridge_tavern_network` |',
    '',
    '## Expression differentiation',
    '',
    '| Surface | Apprentice bridge | Tavern bridge | Native priority |',
    '| ------- | ----------------- | ------------- | --------------- |',
    '| `merchantCurrentGoal` | 手艺眼光换门派护商 | 酒肆人脉换门派借道 | orthodox/martial when invest markers set |',
    '| `deriveSampleLineCostLabel` | 手艺护商之累 | 人脉护商之累 | 侠义盟约/护商武力 when native variants set |',
    '| `merchantAge40Identity` | 手艺金主 | 人脉金主 | magnate tiers win when magnate markers set |',
    '',
    '## Regression scope',
    '',
    '- P102 native patron bridge tests: unchanged native path',
    '- P97–P101 magnate tests: no spine regression',
    '- `guard:sample-lines-baseline`: spine additive extension only',
    '',
    '## Deferred',
    '',
    '- Peasant bridge-origin patron entry',
    '- Full patron pressure/mid/late chain',
    '- Full Wave 3 mixed-achievement graph',
  ];
  const outPath = join(
    process.cwd(),
    'artifacts/reports/p103-merchant-martial-patron-bridge-origin-chain-proof.md',
  );
  writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
  console.log(`Wrote proof artifact: ${outPath}`);
}

const tests: Array<[string, () => void]> = [
  ['bridge-origin gate accepts without invest', testBridgeOriginGateAcceptsWithoutInvest],
  ['native gate unchanged', testNativeGateUnchanged],
  ['bridge choices set origin checkpoint flags', testBridgeChoicesSetOriginCheckpointFlags],
  ['bridge-origin paths reach payoff checkpoint', testBridgeOriginPathsReachPayoffCheckpoint],
  ['bridge-origin expression differs by origin', testBridgeOriginExpressionDiffersByOrigin],
  ['native expression priority over bridge markers', testNativeExpressionPriorityOverBridgeMarkers],
  ['magnate expression priority over patron', testMagnateExpressionPriorityOverPatron],
];

for (const [name, fn] of tests) {
  try {
    fn();
  } catch (error) {
    throw new Error(`${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

writeChainProof();
console.log('p103MerchantMartialPatronBridgeOriginTests: all passed');
