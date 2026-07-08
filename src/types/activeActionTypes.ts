/**
 * P7 active life planning — shared action model (types only until wired by engine).
 */

export type ActionCategory =
  | 'training'
  | 'study'
  | 'socializing'
  | 'travel'
  | 'business'
  | 'health'
  | 'romance'
  | 'jianghu';

export type DurationUnit = 'month' | 'quarter' | 'short_stage' | 'year' | 'milestone';

export type RiskLevel = 'low' | 'medium' | 'high';

export type ProgressionSourceKind =
  | 'active_action'
  | 'story_event'
  | 'random_disturbance'
  | 'automatic_progression';

export interface ActionDuration {
  value: number;
  unit: DurationUnit;
}

export interface ActionRewardChannel {
  stat: string;
  min: number;
  max: number;
}

export interface ActionCostChannel {
  stat?: string;
  amount: number;
}

export interface ActiveActionDefinition {
  id: string;
  category: ActionCategory;
  name: string;
  playerIntent: string;
  duration: ActionDuration;
  rewards: ActionRewardChannel[];
  costs: ActionCostChannel[];
  risk: RiskLevel;
  metadata?: Record<string, unknown>;
  /** P9: flags set on action completion for echo/route hooks */
  onCompleteFlags?: string[];
}

export interface ActionResultMetadata {
  actionId: string;
  category: ActionCategory;
  duration: ActionDuration;
  risk: RiskLevel;
  sourceKind: 'active_action';
  rewardSummary: string;
  costSummary: string;
  riskSummary: string;
}

export interface ActionResult {
  actionId: string;
  deltas: Record<string, number>;
  duration: ActionDuration;
  metadata: ActionResultMetadata;
}

export interface ActionHistoryEntry {
  actionId: string;
  category: ActionCategory;
  duration: ActionDuration;
  deltas: Record<string, number>;
  sourceKind: ProgressionSourceKind;
  age: number;
  timestamp: { year: number; month: number; day: number };
  /** P7.1: whether a random_disturbance entry was shown as player-visible narrative */
  narrativeShownToPlayer?: boolean;
}

/** P7.1: structured active-action result for Web UI */
export interface ActiveActionSummaryDisplay {
  sourceLabel: string;
  actionName: string;
  durationLabel: string;
  rewardSummary: string;
  costSummary: string;
  riskSummary: string;
  nextStepHint: string;
  /** Applied stat deltas this period (player-visible) */
  appliedDeltaSummary?: string;
  /** P122: player-visible long-term shaping / echo confirmations after action */
  longTermImpactLines?: string[];
}

/** Period-end narrative for passive childhood / choice / auto story */
export interface PeriodSummaryDisplay {
  sourceLabel: string;
  headline: string;
  body: string;
  statDeltaSummary: string;
  narrativeText: string;
}

export interface PassiveNarrativeDisplay {
  title: string;
  text: string;
}

/** P7.1: lightweight disturbance narrative for Web UI */
export interface DisturbanceNarrativeDisplay {
  sourceLabel: string;
  disturbanceId: string;
  title: string;
  bodyText: string;
  sourceActionName: string;
  impactSummary: string;
  returnToPlanHint: string;
}

export interface ActionFocusStreak {
  category: ActionCategory | null;
  count: number;
}

export interface DisturbanceCandidate {
  id: string;
  title: string;
  weight: number;
  sourceKind: 'random_disturbance';
}

export interface DisturbanceResolution {
  disturbance: DisturbanceCandidate | null;
}

/** Months equivalent for duration comparison (regression checks). */
export function durationToMonths(duration: ActionDuration): number {
  switch (duration.unit) {
    case 'month':
      return duration.value;
    case 'quarter':
      return duration.value * 3;
    case 'short_stage':
      return duration.value * 6;
    case 'year':
    case 'milestone':
      return duration.value * 12;
    default:
      return duration.value * 3;
  }
}
