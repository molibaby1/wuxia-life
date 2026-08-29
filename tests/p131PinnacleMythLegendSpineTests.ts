/**
 * P131 jianghu_myth_legend pinnacle playable spine — isolated regression.
 * Runs independently: npm exec tsx tests/p131PinnacleMythLegendSpineTests.ts
 */
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { evaluateCompositeDestinyOutcome } from '../src/p16/compositeDestiny';
import { getWorldProfile } from '../src/narrative/worldProfile';
import { runP35PinnacleMythLegendLifetimeSlice } from '../src/p25/p35MixedPinnacleLifetimeSlices';
import { P25_PINNACLE_LIFE_PATHS } from '../src/p25/pinnacleSimulationBaselines';
import {
  deriveSampleLineCostLabel,
  deriveSampleLineCurrentGoal,
  isPlayerVisibleSampleLineText,
} from '../src/p50/sampleLineExpression';
import sampleLinesSpine from '../src/data/lines/sample-lines-spine.json';
import type { GameState, PlayerState, SampleLineEvent } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function mythBaseState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...overrides,
    player: {
      age: 18,
      martialPower: 60,
      reputation: 45,
      connections: 30,
      traits: [],
      ...(overrides.player ?? {}),
    } as PlayerState,
    flags: {
      p16_guardian_oath: true,
      route_orthodox: true,
      orthodox_trial_completed: true,
      p9_early_training_focus: true,
      ...(overrides.flags ?? {}),
    },
  } as GameState;
}

const allEvents = sampleLinesSpine as SampleLineEvent[];
const onRampEvent = allEvents.find(e => e.id === 'jianghu_myth_legend_on_ramp_entry');
const luckEchoEvent = allEvents.find(e => e.id === 'jianghu_myth_legend_luck_window_echo');

function testSpineEventsExist(): void {
  assert(Boolean(onRampEvent), 'jianghu_myth_legend_on_ramp_entry should exist');
  assert(Boolean(luckEchoEvent), 'jianghu_myth_legend_luck_window_echo should exist');
}

function testOnRampEventShape(): void {
  assert(onRampEvent?.eventType === 'choice', 'on-ramp should be choice type');
  assert(onRampEvent?.ageRange?.min === 17, 'on-ramp min age should be 17');
  assert(onRampEvent?.ageRange?.max === 22, 'on-ramp max age should be 22');
  assert((onRampEvent?.choices?.length ?? 0) >= 1, 'on-ramp should have at least 1 choice');
}

function testOnRampGateReadsGuardianOath(): void {
  const evaluator = new ConditionEvaluator();
  const eligible = mythBaseState();
  assert(evaluator.evaluate(onRampEvent!.conditions![0]!, eligible), 'guardian oath + orthodox should pass');

  const noOath = mythBaseState({ flags: { route_orthodox: true } });
  delete (noOath.flags as Record<string, unknown>).p16_guardian_oath;
  assert(!evaluator.evaluate(onRampEvent!.conditions![0]!, noOath), 'missing guardian oath should fail');

  const alreadyCrossed = mythBaseState({ flags: { jianghu_myth_legend_bridge_crossed: true } });
  assert(!evaluator.evaluate(onRampEvent!.conditions![0]!, alreadyCrossed), 'already crossed should fail');

  const patriarchConflict = mythBaseState({ flags: { founding_patriarch_bridge_crossed: true } });
  assert(!evaluator.evaluate(onRampEvent!.conditions![0]!, patriarchConflict), 'active founding patriarch bridge should fail');
}

function testOnRampChoiceSetsCheckpointFlags(): void {
  const choice = onRampEvent!.choices!.find(c => c.id === 'myth_embrace_guardian_pinnacle');
  assert(Boolean(choice), 'myth embrace guardian choice should exist');
  const effects = choice!.effects ?? [];
  for (const flag of [
    'jianghu_myth_legend_bridge_crossed',
    'jianghu_myth_legend_on_ramp_done',
    'jianghu_myth_legend_on_ramp_guardian',
  ]) {
    assert(
      effects.some(e => e.type === 'flag_set' && e.target === flag),
      `${choice!.id} sets ${flag}`,
    );
  }
}

function testLuckEchoShapeAndBranches(): void {
  assert(luckEchoEvent?.eventType === 'choice', 'luck echo should be choice type');
  assert(luckEchoEvent?.ageRange?.min === 20, 'luck echo min age should be 20');

  const hitChoice = luckEchoEvent!.choices!.find(c => c.id === 'myth_luck_window_hit');
  const missChoice = luckEchoEvent!.choices!.find(c => c.id === 'myth_luck_window_miss');
  assert(Boolean(hitChoice), 'luck hit choice should exist');
  assert(Boolean(missChoice), 'luck miss choice should exist');

  assert(
    (hitChoice!.effects ?? []).some(e => e.type === 'flag_set' && e.target === 'jianghu_myth_legend_luck_hit'),
    'hit choice sets jianghu_myth_legend_luck_hit',
  );
  assert(
    (missChoice!.effects ?? []).some(e => e.type === 'flag_set' && e.target === 'jianghu_myth_legend_luck_miss'),
    'miss choice sets jianghu_myth_legend_luck_miss',
  );

  const evaluator = new ConditionEvaluator();
  const hitEligible = mythBaseState({
    player: { age: 21 } as PlayerState,
    flags: {
      jianghu_myth_legend_on_ramp_done: true,
      p16_rare_master_encounter: true,
    },
  });
  assert(evaluator.evaluate(luckEchoEvent!.conditions![0]!, hitEligible), 'on-ramp + luck flag should pass echo gate');
  assert(evaluator.evaluate(hitChoice!.condition!, hitEligible), 'hit branch available when luck flag set');

  const missEligible = mythBaseState({
    player: { age: 25 } as PlayerState,
    flags: { jianghu_myth_legend_on_ramp_done: true },
  });
  delete (missEligible.flags as Record<string, unknown>).p16_rare_master_encounter;
  assert(evaluator.evaluate(luckEchoEvent!.conditions![0]!, missEligible), 'age 25 without luck should pass echo gate');
  assert(evaluator.evaluate(missChoice!.condition!, missEligible), 'miss branch available at 25 without luck');
}

function testExpressionDiffersFromGenericOrthodox(): void {
  const mythOnRamp = mythBaseState({
    player: { age: 22 } as PlayerState,
    flags: { jianghu_myth_legend_on_ramp_done: true },
  });
  const mythLuckHit = mythBaseState({
    player: { age: 24 } as PlayerState,
    flags: {
      jianghu_myth_legend_on_ramp_done: true,
      jianghu_myth_legend_luck_window_done: true,
      jianghu_myth_legend_luck_hit: true,
    },
  });
  const genericOrthodox = mythBaseState({
    flags: { orthodox_formal_disciple: true },
  });
  delete (genericOrthodox.flags as Record<string, unknown>).jianghu_myth_legend_on_ramp_done;

  const onRampGoal = deriveSampleLineCurrentGoal(mythOnRamp);
  const luckGoal = deriveSampleLineCurrentGoal(mythLuckHit);
  const genericGoal = deriveSampleLineCurrentGoal(genericOrthodox);

  assert(onRampGoal?.includes('武林神话'), 'on-ramp goal should mention 武林神话');
  assert(luckGoal?.includes('隐世奇遇'), 'luck hit goal should mention 隐世奇遇');
  assert(!genericGoal?.includes('武林神话'), 'generic orthodox should not mention myth legend');

  const luckCost = deriveSampleLineCostLabel(mythLuckHit);
  const genericCost = deriveSampleLineCostLabel(genericOrthodox);
  assert(luckCost.includes('神话'), 'luck cost label should mention 神话');
  assert(genericCost === '守正代价', 'generic orthodox cost remains 守正代价');

  for (const text of [onRampGoal, luckGoal, luckCost]) {
    assert(isPlayerVisibleSampleLineText(text!), `expression should be player-visible: ${text}`);
  }
}

function testGrindOnlyPathStaysLocked(): void {
  const grindPath = P25_PINNACLE_LIFE_PATHS.find(p => p.id === 'pinnacle_myth_grind_no_luck')!;
  const outcome = getWorldProfile('wuxia').pinnacleDestinyOutcomes!.find(o => o.id === 'jianghu_myth_legend')!;
  const player = {
    name: 'grind-test',
    age: grindPath.player.age ?? 40,
    traits: [],
    ...grindPath.player,
  } as PlayerState;
  const report = evaluateCompositeDestinyOutcome(outcome, player, { ...grindPath.flags });
  assert(!report.unlocked, 'grind-only myth path should stay locked without luck gate');
  assert(Boolean(report.unmetGates?.luck), 'luck gate should be unmet on grind-only path');
}

function testDualGateSuccessUnlocks(): void {
  const dualPath = P25_PINNACLE_LIFE_PATHS.find(p => p.id === 'pinnacle_dual_complete_myth')!;
  const outcome = getWorldProfile('wuxia').pinnacleDestinyOutcomes!.find(o => o.id === 'jianghu_myth_legend')!;
  const player = {
    name: 'dual-test',
    age: dualPath.player.age ?? 39,
    traits: [],
    ...dualPath.player,
  } as PlayerState;
  const report = evaluateCompositeDestinyOutcome(outcome, player, { ...dualPath.flags });
  assert(report.unlocked, 'dual-gate complete myth path should unlock');
}

function testP35LifetimeSliceParityUnchanged(): void {
  const slice = runP35PinnacleMythLegendLifetimeSlice();
  assert(slice.terminalCheckpoint.unlocked, 'P35 pinnacle slice should still unlock');
  assert(slice.failureAttribution.grindOnlyLocked, 'P35 grind-only control stays locked');
  assert(slice.resolvedBridgeFlags.includes('p16_guardian_oath'), 'P35 choice gate unchanged');
  assert(slice.luckWindow.triggered, 'P35 luck window unchanged');
}

function main(): void {
  testSpineEventsExist();
  testOnRampEventShape();
  testOnRampGateReadsGuardianOath();
  testOnRampChoiceSetsCheckpointFlags();
  testLuckEchoShapeAndBranches();
  testExpressionDiffersFromGenericOrthodox();
  testGrindOnlyPathStaysLocked();
  testDualGateSuccessUnlocks();
  testP35LifetimeSliceParityUnchanged();
  console.log('p131PinnacleMythLegendSpineTests: all passed');
}

main();
