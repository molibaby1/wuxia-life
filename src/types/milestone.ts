import type { ActionCategory } from './activeActionTypes';
import type { LifeStateKey } from './eventTypes';

export type MilestoneCategory = 'study' | 'training' | 'business' | 'mixed';

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

export interface MilestoneDefinition {
  id: string;
  label: string;
  description: string;
  category: MilestoneCategory;
  priority: number;
  visibility: 'full';
  conditions: MilestoneCondition[];
}
