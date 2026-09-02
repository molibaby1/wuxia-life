import type { ActionCategory } from './activeActionTypes';
import type { LifeStateKey } from './eventTypes';

export type MilestoneCategory = 'study' | 'training' | 'business' | 'mixed';

export type MilestoneKind =
  | 'progress_stage'
  | 'turning_point'
  | 'payoff_echo'
  | 'synthesis';

export type MilestoneTier = 1 | 2 | 3;

export interface HabitAtLeastCondition {
  type: 'habit_at_least';
  habit: LifeStateKey;
  min: number;
  label: string;
}

export interface ActionCountCondition {
  type: 'action_count';
  category: ActionCategory;
  min: number;
  maxAge?: number;
  label: string;
}

export interface EventOccurredCondition {
  type: 'event_occurred';
  eventId: string;
  label: string;
}

export type MilestoneCondition = HabitAtLeastCondition | ActionCountCondition | EventOccurredCondition;

interface BaseMilestoneDefinition {
  id: string;
  label: string;
  description: string;
  category: MilestoneCategory;
  priority: number;
  visibility: 'full';
  conditions: MilestoneCondition[];
}

export type MilestoneDefinition =
  | (BaseMilestoneDefinition & {
      kind: 'progress_stage';
      tier: MilestoneTier;
    })
  | (BaseMilestoneDefinition & {
      kind: 'turning_point' | 'payoff_echo' | 'synthesis';
      tier?: never;
    });
