import type { ActionHistoryEntry, ProgressionSourceKind } from '../../types/activeActionTypes';
import type { GameState } from '../../types/eventTypes';

export interface P7ReportCausalFields {
  sourceKind: ProgressionSourceKind | 'story_event';
  actionSummary?: string;
  attributeThresholdHit?: string[];
  attributeThresholdMiss?: string[];
  lockReasonSummary?: string;
  annualJumpDiagnostic?: string;
}

export interface P7ActionDistributionReport {
  actionCountsByCategory: Record<string, number>;
  storyEventCount: number;
  randomDisturbanceCount: number;
  activeActionCount: number;
}

export interface P7TimeGranularityReport {
  sameYearCounts: Record<number, number>;
  annualJumps: Array<{ age: number; sourceId: string; sourceKind: string; explicitMilestone: boolean }>;
}

export interface P7ThresholdOutcomeReport {
  hits: Array<{ attribute: string; eventOrActionId: string; kind: string }>;
  misses: Array<{ attribute: string; eventOrActionId: string; kind: string }>;
}

export function buildActionDistributionReport(state: GameState): P7ActionDistributionReport {
  const history = state.actionHistory ?? [];
  const actionCountsByCategory: Record<string, number> = {};
  let randomDisturbanceCount = 0;
  let activeActionCount = 0;

  for (const entry of history) {
    if (entry.sourceKind === 'active_action') {
      activeActionCount += 1;
      actionCountsByCategory[entry.category] = (actionCountsByCategory[entry.category] ?? 0) + 1;
    } else if (entry.sourceKind === 'random_disturbance') {
      randomDisturbanceCount += 1;
    }
  }

  const storyEventCount = (state.eventHistory ?? []).length;

  return {
    actionCountsByCategory,
    storyEventCount,
    randomDisturbanceCount,
    activeActionCount,
  };
}

export function buildTimeGranularityReport(
  history: ActionHistoryEntry[],
  jumps: P7TimeGranularityReport['annualJumps'],
): P7TimeGranularityReport {
  const sameYearCounts: Record<number, number> = {};
  for (const entry of history) {
    const year = entry.timestamp.year;
    sameYearCounts[year] = (sameYearCounts[year] ?? 0) + 1;
  }
  return { sameYearCounts, annualJumps: jumps };
}

export function buildThresholdOutcomeReport(
  entries: Array<{ attribute: string; id: string; kind: string; met: boolean }>,
): P7ThresholdOutcomeReport {
  return {
    hits: entries.filter(e => e.met).map(e => ({ attribute: e.attribute, eventOrActionId: e.id, kind: e.kind })),
    misses: entries.filter(e => !e.met).map(e => ({ attribute: e.attribute, eventOrActionId: e.id, kind: e.kind })),
  };
}

export function buildP7ClosureReport(state: GameState): {
  distribution: P7ActionDistributionReport;
  timeGranularity: P7TimeGranularityReport;
  residualRisks: string[];
  recommendations: string[];
} {
  const distribution = buildActionDistributionReport(state);
  const timeGranularity = buildTimeGranularityReport(state.actionHistory ?? [], []);
  return {
    distribution,
    timeGranularity,
    residualRisks: [
      'Deferred event files still contain unreachable attribute branches',
      'Travel/business/romance action categories not yet implemented',
    ],
    recommendations: [
      'Wire disturbance pool to lightweight daily-event snippets',
      'Expand self-awareness gain from study actions',
    ],
  };
}
