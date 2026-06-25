/**
 * P3 US-005: Death risk telemetry for simulation reports.
 * Maps US-004 §8 fields; does not alter gameplay or death design.
 */
import { EndingSystem } from '../src/core/EndingSystem';
import { SETBACK_EVENTS } from '../src/data/setbackEvents';
import goldenLineSpine from '../src/data/golden-line-spine.json';
import type { GameProcessReport, GameProcessRecord } from '../src/types/simulationRecordTypes';
import type { GameState } from '../src/types/eventTypes';

export type {
  DeathCauseCategory,
  DeathLifePhase,
  WarningLevel,
  SimulationCohort,
  RecentKeyChoice,
  RouteStateSnapshot,
  DeathRiskTelemetry,
  DeathCauseCount,
} from '../src/types/deathRiskTelemetryTypes';
import type { DeathCauseCount, SimulationCohort } from '../src/types/deathRiskTelemetryTypes';

export type DeathCauseSummary = {
  totalDeaths: number;
  byCause: DeathCauseCount[];
  byCohort: Record<SimulationCohort, DeathCauseCount[]>;
};

const KEY_CHOICE_EVENT_IDS = new Set<string>(goldenLineSpine.keyChoiceEventIds);
const RECENT_KEY_CHOICE_LIMIT = 5;

const EARLY_DEATH_LABEL = SETBACK_EVENTS.find(event => event.id === 'early_death')?.name ?? '英年早逝';

type DeathSourceMeta = {
  category: DeathCauseCategory;
  warningLevelMax: WarningLevel;
  warningSatisfied: boolean;
  mitigationAvailable: boolean;
};

const DEATH_SOURCE_REGISTRY: Record<string, DeathSourceMeta> = {
  'engine:early_death': {
    category: 'engine_setback',
    warningLevelMax: 'L1',
    warningSatisfied: false,
    mitigationAvailable: true,
  },
  early_death: {
    category: 'engine_setback',
    warningLevelMax: 'L1',
    warningSatisfied: false,
    mitigationAvailable: true,
  },
  setback_early_death: {
    category: 'engine_setback',
    warningLevelMax: 'L1',
    warningSatisfied: false,
    mitigationAvailable: true,
  },
  'engine:forced_late_life_ending': {
    category: 'forced_ending',
    warningLevelMax: 'L1',
    warningSatisfied: true,
    mitigationAvailable: false,
  },
  demonic_ending_purge: {
    category: 'event_choice',
    warningLevelMax: 'L3',
    warningSatisfied: true,
    mitigationAvailable: true,
  },
};

const RISK_KEYWORDS = /危|死|伤|覆灭|清算|命尽|性命|丧命|殒命|重伤|险/i;

export function resolveDeathLifePhase(age: number): DeathLifePhase {
  if (age <= 17) return 'early';
  if (age <= 30) return 'young_adult';
  if (age <= 50) return 'midlife';
  return 'late_life';
}

export function inferSimulationCohort(
  report: GameProcessReport,
  sampleId?: string,
): SimulationCohort {
  if (sampleId?.startsWith('golden-')) {
    return 'p3_eval';
  }
  if (
    report.ageRange &&
    report.ageRange.endAge <= 50 &&
    !report.config.runUntilDeath
  ) {
    return 'p3_eval';
  }
  if (report.config.runUntilDeath && report.config.simulateYears >= 70) {
    return 'p2_legacy';
  }
  return 'other';
}

function extractRouteStateSnapshot(state: GameState | undefined): RouteStateSnapshot {
  const snapshot: RouteStateSnapshot = {};
  if (!state?.routeStates) {
    return snapshot;
  }
  for (const [routeId, routeState] of Object.entries(state.routeStates)) {
    if (!routeState || routeState.lifecycle === 'inactive') {
      continue;
    }
    snapshot[routeId] = {
      lifecycle: routeState.lifecycle,
      lockedIn: routeState.lockedIn,
    };
  }
  return snapshot;
}

function extractRecentKeyChoices(records: GameProcessRecord[]): RecentKeyChoice[] {
  const choices: RecentKeyChoice[] = [];
  for (const record of records) {
    if (!KEY_CHOICE_EVENT_IDS.has(record.eventId) || record.eventType !== 'choice') {
      continue;
    }
    choices.push({
      eventId: record.eventId,
      choiceId: record.selectedChoice?.id,
      age: record.age,
    });
  }
  return choices.slice(-RECENT_KEY_CHOICE_LIMIT);
}

function findDeathRecord(report: GameProcessReport): GameProcessRecord | null {
  for (let index = report.records.length - 1; index >= 0; index -= 1) {
    const record = report.records[index];
    if (record.gameState.player?.alive === false) {
      return record;
    }
  }
  return report.records.length > 0 ? report.records[report.records.length - 1] : null;
}

function hasSetbackInHistory(state: GameState | undefined, setbackId: string): boolean {
  return Boolean(
    state?.eventHistory?.some(entry => entry.eventId === setbackId),
  );
}

function resolveDeathCauseId(
  report: GameProcessReport,
  deathRecord: GameProcessRecord | null,
  finalState: GameState | undefined,
): { deathCauseId: string; deathEventId: string; category: DeathCauseCategory } {
  const forcedLateLifeEnding = finalState
    ? EndingSystem.getForcedLateLifeEnding(finalState)
    : null;
  const playerDead = finalState?.player?.alive === false;

  if (
    !playerDead &&
    forcedLateLifeEnding &&
    report.finalAge >= 70
  ) {
    return {
      deathCauseId: 'engine:forced_late_life_ending',
      deathEventId: 'engine:forced_late_life_ending',
      category: 'forced_ending',
    };
  }

  if (
    playerDead &&
    (report.deathReason === EARLY_DEATH_LABEL ||
      hasSetbackInHistory(finalState, 'early_death'))
  ) {
    return {
      deathCauseId: 'engine:early_death',
      deathEventId: deathRecord?.eventId ?? 'engine:early_death',
      category: 'engine_setback',
    };
  }

  const deathEventId = deathRecord?.eventId ?? 'unknown';
  const registryMeta = DEATH_SOURCE_REGISTRY[deathEventId];
  if (registryMeta) {
    return {
      deathCauseId: deathEventId === 'early_death' ? 'engine:early_death' : deathEventId,
      deathEventId,
      category: registryMeta.category,
    };
  }

  const category: DeathCauseCategory =
    deathRecord?.eventType === 'choice'
      ? 'event_choice'
      : deathRecord?.eventType === 'auto'
        ? 'event_auto'
        : 'forced_ending';

  return {
    deathCauseId: deathEventId,
    deathEventId,
    category,
  };
}

function readTextWarningLevel(record: GameProcessRecord | null): WarningLevel {
  if (!record) {
    return 'none';
  }

  const texts = [
    record.eventTitle,
    record.eventText,
    record.outcomeText,
    record.selectedChoice?.text,
    record.selectedChoice?.description,
  ]
    .filter(Boolean)
    .join(' ');

  if (/性命不保|难以生还|可能丧命|命数已尽|英年早逝/.test(texts)) {
    return 'L3';
  }
  if (RISK_KEYWORDS.test(texts)) {
    return 'L2';
  }
  if (record.eventTitle || record.eventText) {
    return 'L1';
  }
  return 'none';
}

function assessMitigationAvailable(record: GameProcessRecord | null): boolean {
  if (!record) {
    return false;
  }

  const registry = DEATH_SOURCE_REGISTRY[record.eventId];
  if (registry?.mitigationAvailable) {
    return true;
  }

  if (record.eventType === 'choice' && record.availableChoices && record.availableChoices.length > 1) {
    return true;
  }

  const constitution = record.gameState.player?.constitution ?? 0;
  if (constitution >= 80) {
    return true;
  }

  return false;
}

function assessMitigationTaken(record: GameProcessRecord | null): boolean {
  if (!record || record.eventType !== 'choice') {
    return false;
  }
  if (!record.availableChoices || record.availableChoices.length <= 1) {
    return false;
  }

  const selectedId = record.selectedChoice?.id;
  const saferChoice = record.availableChoices.find(choice => {
    if (choice.id === selectedId) {
      return false;
    }
    const label = `${choice.text ?? ''} ${choice.description ?? ''}`;
    return !RISK_KEYWORDS.test(label);
  });

  return Boolean(saferChoice && selectedId !== saferChoice.id);
}

function resolveWarningMeta(
  deathCauseId: string,
  category: DeathCauseCategory,
  record: GameProcessRecord | null,
): Pick<DeathRiskTelemetry, 'warningLevelMax' | 'warningSatisfied'> {
  const registry = DEATH_SOURCE_REGISTRY[deathCauseId];
  if (registry) {
    return {
      warningLevelMax: registry.warningLevelMax,
      warningSatisfied: registry.warningSatisfied,
    };
  }

  if (category === 'forced_ending') {
    return { warningLevelMax: 'L1', warningSatisfied: true };
  }

  const textLevel = readTextWarningLevel(record);
  const warningSatisfied = textLevel >= 'L2';
  return {
    warningLevelMax: textLevel === 'none' ? 'L1' : textLevel,
    warningSatisfied,
  };
}

export function buildDeathRiskTelemetry(
  report: GameProcessReport,
  sampleId?: string,
): DeathRiskTelemetry | null {
  if (report.isAlive) {
    return null;
  }

  const deathRecord = findDeathRecord(report);
  const lastRecord = report.records[report.records.length - 1];
  const finalState = deathRecord?.gameState ?? lastRecord?.gameState;
  const deathAge = deathRecord?.age ?? report.finalAge;
  const { deathCauseId, deathEventId, category } = resolveDeathCauseId(
    report,
    deathRecord,
    finalState,
  );
  const warningMeta = resolveWarningMeta(deathCauseId, category, deathRecord);
  const mitigationAvailable =
    DEATH_SOURCE_REGISTRY[deathCauseId]?.mitigationAvailable ??
    assessMitigationAvailable(deathRecord);
  const mitigationTaken = assessMitigationTaken(deathRecord);
  const deathWithoutWarning =
    category !== 'forced_ending' && !warningMeta.warningSatisfied;

  return {
    deathCauseId,
    deathCauseCategory: category,
    deathAge,
    deathLifePhase: resolveDeathLifePhase(deathAge),
    deathEventId,
    routeStateAtDeath: extractRouteStateSnapshot(finalState),
    recentKeyChoices: extractRecentKeyChoices(report.records),
    warningLevelMax: warningMeta.warningLevelMax,
    warningSatisfied: warningMeta.warningSatisfied,
    mitigationAvailable,
    mitigationTaken,
    deathWithoutWarning,
    healthAtDeath: finalState?.player?.health ?? null,
    constitutionAtDeath: finalState?.player?.constitution ?? null,
    cohort: inferSimulationCohort(report, sampleId),
  };
}

function incrementCause(
  bucket: Map<string, DeathCauseCount>,
  telemetry: DeathRiskTelemetry,
): void {
  const existing = bucket.get(telemetry.deathCauseId);
  if (existing) {
    existing.count += 1;
    if (telemetry.deathWithoutWarning) {
      existing.deathWithoutWarningCount += 1;
    }
    return;
  }

  bucket.set(telemetry.deathCauseId, {
    deathCauseId: telemetry.deathCauseId,
    deathCauseCategory: telemetry.deathCauseCategory,
    count: 1,
    deathWithoutWarningCount: telemetry.deathWithoutWarning ? 1 : 0,
  });
}

function sortCauseCounts(counts: DeathCauseCount[]): DeathCauseCount[] {
  return [...counts].sort((a, b) => b.count - a.count || a.deathCauseId.localeCompare(b.deathCauseId));
}

export function summarizeTopDeathCauses(
  entries: Array<{ report: GameProcessReport; sampleId?: string }>,
  topN = 10,
): DeathCauseSummary {
  const overall = new Map<string, DeathCauseCount>();
  const byCohort: Record<SimulationCohort, Map<string, DeathCauseCount>> = {
    p3_eval: new Map(),
    p2_legacy: new Map(),
    other: new Map(),
  };

  for (const entry of entries) {
    const telemetry = buildDeathRiskTelemetry(entry.report, entry.sampleId);
    if (!telemetry) {
      continue;
    }
    incrementCause(overall, telemetry);
    incrementCause(byCohort[telemetry.cohort], telemetry);
  }

  const trimTop = (map: Map<string, DeathCauseCount>) =>
    sortCauseCounts([...map.values()]).slice(0, topN);

  return {
    totalDeaths: [...overall.values()].reduce((sum, row) => sum + row.count, 0),
    byCause: trimTop(overall),
    byCohort: {
      p3_eval: trimTop(byCohort.p3_eval),
      p2_legacy: trimTop(byCohort.p2_legacy),
      other: trimTop(byCohort.other),
    },
  };
}

export function formatDeathCauseSummary(summary: DeathCauseSummary): string[] {
  const lines: string[] = [
    `Total deaths: ${summary.totalDeaths}`,
  ];

  if (summary.byCause.length === 0) {
    lines.push('Top death causes: (none)');
    return lines;
  }

  lines.push('Top death causes (overall):');
  for (const row of summary.byCause) {
    lines.push(
      `- ${row.deathCauseId} (${row.deathCauseCategory}): ${row.count}` +
        (row.deathWithoutWarningCount > 0
          ? `, without_warning=${row.deathWithoutWarningCount}`
          : ''),
    );
  }

  for (const cohort of ['p3_eval', 'p2_legacy'] as const) {
    const rows = summary.byCohort[cohort];
    if (rows.length === 0) {
      continue;
    }
    lines.push(`Top death causes (${cohort}):`);
    for (const row of rows) {
      lines.push(`- ${row.deathCauseId}: ${row.count}`);
    }
  }

  return lines;
}
