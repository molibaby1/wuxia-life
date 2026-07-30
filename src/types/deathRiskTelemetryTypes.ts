/** P3 US-005 death-risk telemetry shapes (shared by simulation reports and gate scripts). */

export type DeathCauseCategory =
  | 'engine_setback'
  | 'event_choice'
  | 'event_auto'
  | 'forced_ending';

export type DeathLifePhase = 'early' | 'young_adult' | 'midlife' | 'late_life';

export type WarningLevel = 'none' | 'L0' | 'L1' | 'L2' | 'L3';

export type SimulationCohort = 'p3_eval' | 'p2_legacy' | 'other';

export type RecentKeyChoice = {
  eventId: string;
  choiceId?: string;
  age: number;
};

export type DeathRiskTelemetry = {
  deathCauseId: string;
  deathCauseCategory: DeathCauseCategory;
  deathAge: number;
  deathLifePhase: DeathLifePhase;
  deathEventId: string;
  recentKeyChoices: RecentKeyChoice[];
  warningLevelMax: WarningLevel;
  warningSatisfied: boolean;
  mitigationAvailable: boolean;
  mitigationTaken: boolean;
  deathWithoutWarning: boolean;
  constitutionAtDeath: number | null;
  cohort: SimulationCohort;
};

export type DeathCauseCount = {
  deathCauseId: string;
  deathCauseCategory: DeathCauseCategory;
  count: number;
  deathWithoutWarningCount: number;
};
