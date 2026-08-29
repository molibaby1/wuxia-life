import { resolveActiveAction } from '../src/core/activePlanning/ActionResultResolver';
import { executeActiveActionOnState, detectUnintendedAnnualJump } from '../src/core/activePlanning/ActivePlanningService';
import { resolveDisturbanceAfterAction } from '../src/core/activePlanning/DisturbanceResolver';
import { buildActionDistributionReport, buildP7ClosureReport } from '../src/core/activePlanning/p7ReportFields';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { GameTestFramework } from './GameTestFramework';
import { durationToMonths } from '../src/types/activeActionTypes';
import type { GameState } from '../src/types/eventTypes';

const framework = new GameTestFramework();

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function createP7State(): GameState {
  return (framework as unknown as { createTestState(): GameState }).createTestState();
}

export async function runP7ActionResolverTests(): Promise<void> {
  const state = createP7State();
  const training = resolveActiveAction({ state, actionId: 'action_training_basic', random: () => 0.5 });
  assert(training !== null, 'training action should resolve');
  assert((training!.deltas.martialPower ?? 0) > 0, 'training should boost martialPower');

  const study = resolveActiveAction({ state, actionId: 'action_study_basic', random: () => 0.5 });
  assert(study !== null, 'study action should resolve');
  assert((study!.deltas.knowledge ?? 0) > 0, 'study should boost knowledge');

  const social = resolveActiveAction({ state, actionId: 'action_socializing_basic', random: () => 0.5 });
  assert(social !== null, 'socializing action should resolve');
  assert((social!.deltas.connections ?? 0) > 0, 'socializing should boost connections');

  for (const id of ['action_training_basic', 'action_study_basic', 'action_socializing_basic']) {
    const result = resolveActiveAction({ state, actionId: id, random: () => 0.5 });
    assert(result !== null, `${id} should resolve`);
    const months = durationToMonths(result!.duration);
    assert(months < 12, `${id} duration should be below one year`);
  }
}

export async function runP7ConditionCacheDriftTests(): Promise<void> {
  const evaluator = new ConditionEvaluator();
  const base = createP7State();
  base.player.charisma = 40;
  const charismaCond = { type: 'expression' as const, expression: 'charisma >= 50' };
  assertEqual(evaluator.evaluate(charismaCond, base), false, 'charisma 40 should fail');
  base.player.charisma = 60;
  assertEqual(evaluator.evaluate(charismaCond, base), true, 'charisma 60 should pass after drift');

  const reputationState = createP7State();
  const reputationCond = { type: 'expression' as const, expression: 'reputation >= 100' };
  assertEqual(evaluator.evaluate(reputationCond, reputationState), false, 'reputation baseline should fail');
  reputationState.player.reputation = 120;
  assertEqual(evaluator.evaluate(reputationCond, reputationState), true, 'reputation 120 should pass after drift');

  const knowledgeState = createP7State();
  knowledgeState.player.knowledge = 30;
  const knowledgeCond = { type: 'expression' as const, expression: 'knowledge >= 40' };
  assertEqual(evaluator.evaluate(knowledgeCond, knowledgeState), false, 'knowledge 30 should fail');
  knowledgeState.player.knowledge = 45;
  assertEqual(evaluator.evaluate(knowledgeCond, knowledgeState), true, 'knowledge 45 should pass');
}

export async function runP7AnnualJumpRegressionCheck(): Promise<void> {
  const unintended = detectUnintendedAnnualJump({
    ageBefore: 10,
    ageAfter: 11,
    sourceId: 'fallback',
    sourceKind: 'automatic_progression',
    allowAnnual: false,
  });
  assert(unintended.unintended, 'should detect unintended annual jump');
  assert(Boolean(unintended.message?.includes('fallback')), 'message should include source');

  const allowed = detectUnintendedAnnualJump({
    ageBefore: 10,
    ageAfter: 11,
    sourceId: 'milestone_birthday',
    sourceKind: 'story_event',
    allowAnnual: true,
  });
  assert(!allowed.unintended, 'explicit milestone should be allowed');
}

export async function runP7DisturbanceResolverTests(): Promise<void> {
  const state = createP7State();
  const action = resolveActiveAction({ state, actionId: 'action_socializing_basic', random: () => 0.5 });
  assert(action !== null, 'need action result');
  const none = resolveDisturbanceAfterAction({ state, actionResult: action!, random: () => 1 });
  assert(none.disturbance === null, 'high random should skip disturbance');
  const some = resolveDisturbanceAfterAction({ state, actionResult: action!, random: () => 0, triggerChance: 1 });
  assert(some.disturbance !== null, 'deterministic trigger should yield disturbance');
}

export async function runP7ReportChecks(): Promise<void> {
  const state = createP7State();
  executeActiveActionOnState(state, 'action_training_basic', { random: () => 0.5, includeDisturbance: false });
  executeActiveActionOnState(state, 'action_study_basic', { random: () => 0.5, includeDisturbance: false });
  const dist = buildActionDistributionReport(state);
  assert(dist.activeActionCount >= 2, 'should count active actions');
  assert((dist.actionCountsByCategory.training ?? 0) >= 1, 'should count training');
  const closure = buildP7ClosureReport(state);
  assert(closure.residualRisks.length > 0, 'closure should list residual risks');
}

export async function runP7ClosureValidationCase(): Promise<void> {
  const state = createP7State();
  state.player.age = 0;
  state.currentTime = { year: 1, month: 1, day: 1 };
  const actionIds = ['action_training_basic', 'action_study_basic', 'action_socializing_basic'];
  let i = 0;
  while (state.player.age < 25 && i < 200) {
    executeActiveActionOnState(state, actionIds[i % actionIds.length], {
      random: () => 0.42,
      includeDisturbance: i % 4 === 0,
    });
    i += 1;
  }
  assert(state.player.age >= 5, 'should advance age through active planning');
  assert((state.actionHistory?.length ?? 0) >= 10, 'should record action history');
  const sameYear = new Set((state.actionHistory ?? []).map(e => e.timestamp.year));
  assert(sameYear.size >= 1, 'should have time granularity records');
}

export async function runAllP7Tests(): Promise<void> {
  await runP7ActionResolverTests();
  await runP7ConditionCacheDriftTests();
  await runP7AnnualJumpRegressionCheck();
  await runP7DisturbanceResolverTests();
  await runP7ReportChecks();
  await runP7ClosureValidationCase();
}
