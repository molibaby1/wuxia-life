import { getMinimumActions } from '../../data/activeActionCatalog';
import type {
  ActionDuration,
  ActionFocusStreak,
  ActionHistoryEntry,
  ActionResult,
  ActiveActionDefinition,
  ActionCategory,
  ProgressionSourceKind,
} from '../../types/activeActionTypes';
import { durationToMonths } from '../../types/activeActionTypes';
import type { GameState, PlayerState } from '../../types/eventTypes';
import { readPlayerNumeric, writePlayerNumeric } from '../../utils/playerStatAccess';
import { EventPriority } from '../../types/eventTypes';
import type { EventDefinition } from '../../types/eventTypes';
import { resolveActiveAction } from './ActionResultResolver';
import { resolveDisturbanceAfterAction } from './DisturbanceResolver';
import { buildActiveActionSummaryDisplay } from './activeActionSummaryBuilder';
import { buildDisturbanceNarrativeDisplay } from './disturbanceNarrativeBuilder';
import type {
  ActiveActionSummaryDisplay,
  DisturbanceNarrativeDisplay,
} from '../../types/activeActionTypes';

export interface ActiveActionExecutionResult {
  actionResult: ActionResult;
  disturbanceId: string | null;
  disturbanceTitle: string | null;
  feedbackText: string;
  activeActionSummary: ActiveActionSummaryDisplay;
  disturbanceNarrative: DisturbanceNarrativeDisplay | null;
}

function durationToAdvanceUnit(duration: ActionDuration): { value: number; unit: 'month' | 'year' } {
  if (duration.unit === 'year' || duration.unit === 'milestone') {
    return { value: duration.value, unit: 'year' };
  }
  const months = durationToMonths(duration);
  return { value: months, unit: 'month' };
}

export function applyStatDeltas(player: PlayerState, deltas: Record<string, number>): void {
  for (const [key, delta] of Object.entries(deltas)) {
    writePlayerNumeric(player, key, readPlayerNumeric(player, key) + delta);
  }
}

export function appendActionHistory(
  state: GameState,
  entry: Omit<ActionHistoryEntry, 'age' | 'timestamp'> & {
    age?: number;
    timestamp?: ActionHistoryEntry['timestamp'];
  },
): void {
  if (!state.actionHistory) {
    state.actionHistory = [];
  }
  const time = state.currentTime ?? { year: 1, month: 1, day: 1 };
  state.actionHistory.push({
    ...entry,
    age: entry.age ?? state.player.age,
    timestamp: entry.timestamp ?? { ...time },
  });
}

export function updateFocusStreak(state: GameState, category: ActionCategory): ActionFocusStreak {
  const prev = state.actionFocusStreak ?? { category: null, count: 0 };
  if (prev.category === category) {
    state.actionFocusStreak = { category, count: prev.count + 1 };
  } else {
    state.actionFocusStreak = { category, count: 1 };
  }
  return state.actionFocusStreak;
}

export function buildActiveActionChoices(
  actions: ActiveActionDefinition[] = getMinimumActions(),
): Array<{
  id: string;
  text: string;
  description: string;
  actionId: string;
  rewardSummary: string;
  costSummary: string;
  riskLevel: string;
}> {
  return actions.map(action => ({
    id: `active_${action.id}`,
    text: action.name,
    description: action.playerIntent,
    actionId: action.id,
    rewardSummary: action.rewards.map(r => `${r.stat}+${r.min}~${r.max}`).join('，'),
    costSummary: action.costs.map(c => `${c.stat ?? 'resource'}-${c.amount}`).join('，'),
    riskLevel: action.risk,
  }));
}

export function executeActiveActionOnState(
  state: GameState,
  actionId: string,
  options?: { random?: () => number; includeDisturbance?: boolean },
): ActiveActionExecutionResult | null {
  const resolved = resolveActiveAction({
    state,
    actionId,
    focusStreak: state.actionFocusStreak,
    random: options?.random,
  });
  if (!resolved) return null;

  applyStatDeltas(state.player, resolved.deltas);
  updateFocusStreak(state, resolved.metadata.category);

  const advance = durationToAdvanceUnit(resolved.duration);
  advanceTimeOnState(state, advance.value, advance.unit);

  appendActionHistory(state, {
    actionId: resolved.actionId,
    category: resolved.metadata.category,
    duration: resolved.duration,
    deltas: resolved.deltas,
    sourceKind: 'active_action',
  });

  let disturbanceId: string | null = null;
  let disturbanceTitle: string | null = null;
  let disturbanceNarrative: DisturbanceNarrativeDisplay | null = null;
  if (options?.includeDisturbance !== false) {
    const disturbance = resolveDisturbanceAfterAction({
      state,
      actionResult: resolved,
      random: options?.random,
    }).disturbance;
    if (disturbance) {
      disturbanceId = disturbance.id;
      disturbanceTitle = disturbance.title;
      appendActionHistory(state, {
        actionId: disturbance.id,
        category: resolved.metadata.category,
        duration: { value: 0, unit: 'month' },
        deltas: {},
        sourceKind: 'random_disturbance',
        narrativeShownToPlayer: false,
      });
      disturbanceNarrative = buildDisturbanceNarrativeDisplay(
        disturbance.id,
        disturbance.title,
        resolved,
      );
    }
  }

  const activeActionSummary = buildActiveActionSummaryDisplay(resolved, {
    hasPendingDisturbance: disturbanceNarrative !== null,
  });
  const categoryLabel =
    resolved.metadata.category === 'training'
      ? '练功'
      : resolved.metadata.category === 'study'
        ? '读书'
        : '交游';
  const feedbackText = `${categoryLabel}告一段落。${resolved.metadata.rewardSummary}`;

  return {
    actionResult: resolved,
    disturbanceId,
    disturbanceTitle,
    feedbackText,
    activeActionSummary,
    disturbanceNarrative,
  };
}

export function advanceTimeOnState(
  state: GameState,
  value: number,
  unit: 'year' | 'month' | 'day',
): void {
  const currentTime = state.currentTime || { year: 1, month: 1, day: 1 };
  let { year, month, day } = currentTime;
  let age = state.player.age;

  if (unit === 'year') {
    year += value;
    age += value;
  } else if (unit === 'month') {
    month += value;
    while (month > 12) {
      month -= 12;
      year += 1;
      age += 1;
    }
  } else {
    day += value;
    while (day > 30) {
      day -= 30;
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
        age += 1;
      }
    }
  }

  state.player.age = age;
  state.currentTime = { year, month, day };
}

export function hasPendingForcedEvent(
  getAvailableEvents: (age: number) => EventDefinition[],
  age: number,
): boolean {
  const available = getAvailableEvents(age);
  return available.some(event => {
    const tags = (event.metadata?.tags || []).map(tag => tag.toLowerCase());
    return (
      event.priority === EventPriority.CRITICAL ||
      tags.includes('critical') ||
      tags.includes('mandatory') ||
      tags.includes('mainline')
    );
  });
}

export function detectUnintendedAnnualJump(params: {
  ageBefore: number;
  ageAfter: number;
  sourceId: string;
  sourceKind: ProgressionSourceKind;
  allowAnnual: boolean;
}): { unintended: boolean; message?: string } {
  const delta = params.ageAfter - params.ageBefore;
  if (delta >= 1 && !params.allowAnnual) {
    return {
      unintended: true,
      message: `Unintended annual jump +${delta} from ${params.sourceKind}:${params.sourceId}`,
    };
  }
  return { unintended: false };
}

export type { ProgressionSourceKind };
