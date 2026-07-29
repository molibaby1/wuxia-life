/**
 * Life memory summary types (P3 US-025 / US-026).
 * Serializable, derived-only — not persisted as redundant game state.
 */

export const LIFE_MEMORY_SCHEMA_VERSION = '2.0.0' as const;

export type LifeMemoryVisibility = 'player' | 'hidden' | 'diagnostic';

export type LifeMemoryPayoffStatus = 'pending' | 'echoed' | 'resolved';

export type LifeMemoryDebtUrgency = 'low' | 'medium' | 'high';

export type LifeMemoryRiskSeverity = 'low' | 'medium' | 'high';

export type LifeMemoryWarningLevel = 'L0' | 'L1';

export type LifeMemoryAchievementCategory =
  | 'route'
  | 'martial'
  | 'social'
  | 'family'
  | 'moral';

export type LifeMemoryAffinityBand = 'close' | 'neutral' | 'strained' | 'hostile';

export interface LifeMemoryEntryBase {
  id: string;
  visibility: LifeMemoryVisibility;
  occurredAtAge?: number;
  sortKey: number;
}

export interface LifeMemoryKeyChoiceEntry extends LifeMemoryEntryBase {
  label: string;
  consequence?: string;
  payoffStatus?: LifeMemoryPayoffStatus;
  diagnostic: { eventId: string; choiceId?: string; durableWrites: string[] };
}

export interface LifeMemoryRelationshipEntry extends LifeMemoryEntryBase {
  name: string;
  roleLabel: string;
  statusLabel: string;
  affinityBand?: LifeMemoryAffinityBand;
  diagnostic: { relationId: string; affinity?: number };
}

export interface LifeMemoryDebtEntry extends LifeMemoryEntryBase {
  label: string;
  urgency?: LifeMemoryDebtUrgency;
  diagnostic: { sourceFlags: string[]; sourceFields: string[] };
}

export interface LifeMemoryRiskEntry extends LifeMemoryEntryBase {
  label: string;
  severity: LifeMemoryRiskSeverity;
  warningLevel: LifeMemoryWarningLevel;
  diagnostic: { sourceFlags: string[]; statSignals: string[] };
}

export interface LifeMemoryAchievementEntry extends LifeMemoryEntryBase {
  label: string;
  category?: LifeMemoryAchievementCategory;
  diagnostic: { achievementId?: string; sourceFlags: string[] };
}

export interface LifeMemoryHabitTrajectoryEntry extends LifeMemoryEntryBase {
  label: string;
  tierLabel: string;
}

export interface LifeMemorySummary {
  schemaVersion: typeof LIFE_MEMORY_SCHEMA_VERSION;
  derivedAtAge: number;
  currentGoalLabel?: string;
  identity?: { primary: string; all: string[] };
  habitTrajectory?: LifeMemoryHabitTrajectoryEntry[];
  keyChoices?: LifeMemoryKeyChoiceEntry[];
  relationships?: LifeMemoryRelationshipEntry[];
  unresolvedDebts?: LifeMemoryDebtEntry[];
  risks?: LifeMemoryRiskEntry[];
  achievements?: LifeMemoryAchievementEntry[];
  ordinaryOriginLifeMemory?: string;
  ordinaryOriginSummary?: string;
}
