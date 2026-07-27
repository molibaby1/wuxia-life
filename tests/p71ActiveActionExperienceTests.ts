import {
  buildActiveActionChoices,
  executeActiveActionOnState,
} from '../src/core/activePlanning/ActivePlanningService';
import { buildActiveActionSummaryDisplay } from '../src/core/activePlanning/activeActionSummaryBuilder';
import { markDisturbanceNarrativeShown } from '../src/core/activePlanning/disturbanceNarrativeBuilder';
import { getDisturbanceNarrativeCopy } from '../src/core/activePlanning/disturbanceNarrativeCatalog';
import {
  buildDisturbanceVisibilityReport,
  buildP71ClosureReport,
} from '../src/core/activePlanning/p7ReportFields';
import { resolveActiveAction } from '../src/core/activePlanning/ActionResultResolver';
import { durationToMonths } from '../src/types/activeActionTypes';
import { GameTestFramework } from './GameTestFramework';
import type { GameState } from '../src/types/eventTypes';

const framework = new GameTestFramework();

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function createState(): GameState {
  return (framework as unknown as { createTestState(): GameState }).createTestState();
}

export async function runP71ActiveActionSummaryTests(): Promise<void> {
  const businessChoice = buildActiveActionChoices().find(choice => choice.actionId === 'action_business_basic');
  assert(businessChoice?.description.includes('名望') === true, 'business action should expose 名望');
  assert(businessChoice?.description.includes('声望') === false, 'business action must not expose 声望 as an attribute name');

  const state = createState();
  const result = executeActiveActionOnState(state, 'action_training_basic', {
    random: () => 0.5,
    includeDisturbance: false,
  });
  assert(result !== null, 'active action should execute');
  const summary = result!.activeActionSummary;
  assert(summary.actionName.length > 0, 'action name required');
  assert(summary.durationLabel.includes('季度') || summary.durationLabel.includes('月'), 'duration label');
  assert(summary.rewardSummary.length > 0, 'reward summary');
  assert(summary.costSummary.length > 0, 'cost summary');
  assert(summary.riskSummary.length > 0, 'risk summary');
  assert(summary.nextStepHint.length > 0, 'next step hint');
  assert(summary.sourceLabel === '主动行动', 'source label');

  const months = durationToMonths(result!.actionResult.duration);
  assert(months < 12, 'short-period progression');
}

export async function runP71DisturbanceNarrativeTests(): Promise<void> {
  assert(getDisturbanceNarrativeCopy('disturbance_sparring_invite') !== null, 'sparring copy');
  assert(getDisturbanceNarrativeCopy('disturbance_market_rumor') !== null, 'rumor copy');
  assert(getDisturbanceNarrativeCopy('disturbance_minor_injury') !== null, 'injury copy');

  const state = createState();
  const action = resolveActiveAction({ state, actionId: 'action_socializing_basic', random: () => 0.5 });
  assert(action !== null, 'need action');
  const withDisturbance = executeActiveActionOnState(state, 'action_socializing_basic', {
    random: () => 0,
    includeDisturbance: true,
  });
  assert(withDisturbance?.disturbanceNarrative !== null, 'deterministic disturbance narrative');

  const noDisturbance = executeActiveActionOnState(createState(), 'action_study_basic', {
    random: () => 1,
    includeDisturbance: true,
  });
  assert(noDisturbance?.disturbanceNarrative === null, 'no disturbance path');

  const history = state.actionHistory ?? [];
  const disturbances = history.filter(e => e.sourceKind === 'random_disturbance');
  const actions = history.filter(e => e.sourceKind === 'active_action');
  assert(disturbances.length >= 1 && actions.length >= 1, 'history separates kinds');
  assert(
    disturbances.every(d => !actions.some(a => a.actionId === d.actionId && a.sourceKind === 'active_action')),
    'disturbance ids distinct from action rows',
  );

  markDisturbanceNarrativeShown(state, withDisturbance!.disturbanceNarrative!.disturbanceId);
  const visibility = buildDisturbanceVisibilityReport(state);
  assert(visibility.resolvedDisturbanceCount >= 1, 'resolved count');
  assert(visibility.playerVisibleDisturbanceCount >= 1, 'visible count');
  assert(!visibility.disturbanceVisibilityMismatch, 'shown disturbance should match visible count');
}

export async function runP71ReportChecks(): Promise<void> {
  const state = createState();
  executeActiveActionOnState(state, 'action_training_basic', { random: () => 0.5, includeDisturbance: false });
  const report = buildP71ClosureReport(state);
  assert(report.disturbanceVisibility !== undefined, 'P7.1 closure includes visibility');
}

export async function runP71LongTermShapingTests(): Promise<void> {
  const trainingState = createState();
  executeActiveActionOnState(trainingState, 'action_training_basic', { random: () => 0.5, includeDisturbance: false });
  assert(trainingState.player.lifeStates.trainingHabit === 1, 'training action adds explicit training practice');
  assert(trainingState.flags.training_habit === undefined, 'training action must not project legacy habit flag');

  const businessState = createState();
  executeActiveActionOnState(businessState, 'action_household_apprentice', { random: () => 0.5, includeDisturbance: false });
  assert(businessState.player.lifeStates.businessHabit === 1, 'quarterly apprenticeship adds explicit business practice');
  assert(businessState.flags.business_habit === undefined, 'business action must not project legacy habit flag');

  const studyState = createState();
  executeActiveActionOnState(studyState, 'action_study_basic', { random: () => 0.5, includeDisturbance: false });
  assert(studyState.player.lifeStates.studyHabit === 1, 'study action adds explicit study practice');
  assert(studyState.flags.study_habit === undefined, 'study action must not project legacy habit flag');
}

export async function runP71SummaryBuilderTests(): Promise<void> {
  const state = createState();
  const resolved = resolveActiveAction({ state, actionId: 'action_study_basic', random: () => 0.5 });
  assert(resolved !== null, 'resolved');
  const display = buildActiveActionSummaryDisplay(resolved!);
  assert(display.actionName.length > 0 && display.durationLabel.length > 0, 'builder fields');
}

export async function runAllP71Tests(): Promise<void> {
  await runP71SummaryBuilderTests();
  await runP71ActiveActionSummaryTests();
  await runP71DisturbanceNarrativeTests();
  await runP71ReportChecks();
  await runP71LongTermShapingTests();
}
