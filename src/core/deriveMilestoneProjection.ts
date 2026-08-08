import milestoneCatalog from '../data/life-milestones.json';
import type { GameState } from '../types/eventTypes';
import type { MilestoneCondition, MilestoneDefinition } from '../types/milestone';

export interface MilestoneConditionResult {
  met: boolean;
  expired: boolean;
  current: number;
  target: number;
  ratio: number;
  label: string;
  occurredAtAge?: number;
}

export interface MilestoneEvaluation {
  definition: MilestoneDefinition;
  achieved: boolean;
  expired: boolean;
  progressRatio: number;
  progressLabels: string[];
  evidenceLabels: string[];
  occurredAtAge?: number;
}

export interface MilestoneProjection {
  achieved: MilestoneEvaluation[];
  prospects: MilestoneEvaluation[];
}

function conditionProgressLabel(result: MilestoneConditionResult): string {
  return `${result.label} ${result.current}/${result.target}`;
}

export function evaluateMilestoneCondition(
  state: GameState,
  condition: MilestoneCondition,
): MilestoneConditionResult {
  switch (condition.type) {
    case 'habit_at_least': {
      const current = state.player.lifeStates?.[condition.habit] ?? 0;
      return {
        met: current >= condition.min,
        expired: false,
        current,
        target: condition.min,
        ratio: Math.min(current / condition.min, 1),
        label: condition.label,
      };
    }
    case 'action_count': {
      const matching = (state.actionHistory ?? []).filter((entry) =>
        entry.sourceKind === 'active_action'
        && entry.category === condition.category
        && (condition.maxAge === undefined || entry.age <= condition.maxAge),
      );
      const current = matching.length;
      const met = current >= condition.min;
      return {
        met,
        expired: !met && condition.maxAge !== undefined && state.player.age > condition.maxAge,
        current,
        target: condition.min,
        ratio: Math.min(current / condition.min, 1),
        label: condition.label,
        ...(met ? { occurredAtAge: matching[condition.min - 1].age } : {}),
      };
    }
    case 'event_occurred': {
      const record = (state.eventHistory ?? []).find((entry) => entry.eventId === condition.eventId);
      return {
        met: record !== undefined,
        expired: false,
        current: record ? 1 : 0,
        target: 1,
        ratio: record ? 1 : 0,
        label: condition.label,
        ...(record?.age === undefined ? {} : { occurredAtAge: record.age }),
      };
    }
  }
}

export function evaluateMilestone(
  state: GameState,
  definition: MilestoneDefinition,
): MilestoneEvaluation {
  const results = definition.conditions.map((condition) => evaluateMilestoneCondition(state, condition));
  const achieved = results.every((result) => result.met);
  const expired = !achieved && results.some((result) => result.expired);
  const occurredAtAges = results.map((result) => result.occurredAtAge);
  const occurredAtAge = achieved && occurredAtAges.every((age) => age !== undefined)
    ? Math.max(...occurredAtAges as number[])
    : undefined;

  return {
    definition,
    achieved,
    expired,
    progressRatio: results.length > 0 ? Math.min(...results.map((result) => result.ratio)) : 0,
    progressLabels: results.filter((result) => !result.met).map(conditionProgressLabel),
    evidenceLabels: results.filter((result) => result.met).map((result) => result.label),
    ...(occurredAtAge === undefined ? {} : { occurredAtAge }),
  };
}

export function deriveMilestoneProjection(
  state: GameState,
  definitions: readonly MilestoneDefinition[] = milestoneCatalog as MilestoneDefinition[],
): MilestoneProjection {
  const evaluations = definitions.map((definition) => evaluateMilestone(state, definition));
  const byPriority = (left: MilestoneEvaluation, right: MilestoneEvaluation): number =>
    right.definition.priority - left.definition.priority
    || left.definition.id.localeCompare(right.definition.id);
  const achieved = evaluations.filter((evaluation) => evaluation.achieved).sort(byPriority);
  const prospects = evaluations
    .filter((evaluation) => !evaluation.achieved && !evaluation.expired && evaluation.progressRatio > 0 && evaluation.progressRatio < 1)
    .sort((left, right) => right.progressRatio - left.progressRatio || byPriority(left, right))
    .slice(0, 3);

  return { achieved, prospects };
}
