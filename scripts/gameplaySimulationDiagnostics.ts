/**
 * P2 收尾：从模拟报告中抽取可定位的体验诊断（复读、路线、婚恋/家庭），供报告与 CLI 复用。
 */
import type { GameProcessReport } from '../src/types/simulationRecordTypes';

export type EventFrequencyRow = { eventId: string; count: number };

export type RouteLifecycleSummary = {
  byLifecycle: Record<string, number>;
  routeIdsSample: string[];
};

export type RomanceFamilySummary = {
  livesWithSpouse: number;
  livesWithChildren: number;
  avgNotableRelations: number;
};

function countEventFrequencies(report: GameProcessReport): Map<string, number> {
  const map = new Map<string, number>();
  for (const rec of report.records) {
    if (!rec.eventId) continue;
    map.set(rec.eventId, (map.get(rec.eventId) || 0) + 1);
  }
  return map;
}

export function topRepeatedEvents(report: GameProcessReport, limit = 12): EventFrequencyRow[] {
  const map = countEventFrequencies(report);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([eventId, count]) => ({ eventId, count }));
}

export function summarizeRouteLifecycle(report: GameProcessReport): RouteLifecycleSummary {
  const final = report.records.length > 0 ? report.records[report.records.length - 1].gameState : null;
  const routeStates = final?.routeStates || {};
  const byLifecycle: Record<string, number> = {};
  const routeIdsSample: string[] = [];

  for (const [routeId, state] of Object.entries(routeStates)) {
    if (!state || typeof state !== 'object') continue;
    const lifecycle = (state as { lifecycle?: string }).lifecycle || 'unknown';
    byLifecycle[lifecycle] = (byLifecycle[lifecycle] || 0) + 1;
    if (routeIdsSample.length < 8) {
      routeIdsSample.push(`${routeId}:${lifecycle}`);
    }
  }

  return { byLifecycle, routeIdsSample };
}

export function summarizeRomanceFamilyAcrossReports(reports: GameProcessReport[]): RomanceFamilySummary {
  let livesWithSpouse = 0;
  let livesWithChildren = 0;
  let relationSum = 0;

  for (const report of reports) {
    if (report.statistics.spouse) livesWithSpouse += 1;
    if ((report.statistics.children || 0) > 0) livesWithChildren += 1;
    const final = report.records.length > 0 ? report.records[report.records.length - 1].gameState : null;
    const rel = final?.relations ? Object.keys(final.relations).length : 0;
    relationSum += rel;
  }

  return {
    livesWithSpouse,
    livesWithChildren,
    avgNotableRelations: reports.length > 0 ? relationSum / reports.length : 0,
  };
}

export function aggregateTopEventsAcrossReports(reports: GameProcessReport[], limit = 15): EventFrequencyRow[] {
  const merged = new Map<string, number>();
  for (const report of reports) {
    const map = countEventFrequencies(report);
    for (const [id, c] of map) {
      merged.set(id, (merged.get(id) || 0) + c);
    }
  }
  return [...merged.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([eventId, count]) => ({ eventId, count }));
}

export function formatDiagnosticsMarkdownSection(reports: GameProcessReport[]): string {
  const agg = aggregateTopEventsAcrossReports(reports);
  const rows = agg.map(r => `| ${r.eventId} | ${r.count} |`).join('\n');
  const rf = summarizeRomanceFamilyAcrossReports(reports);

  const perSample = reports
    .map((report, i) => {
      const top = topRepeatedEvents(report, 5);
      const route = summarizeRouteLifecycle(report);
      const ending = report.statistics.endingSummary || report.deathReason || 'unknown';
      const topStr = top.map(t => `${t.eventId}×${t.count}`).join(', ');
      const routeStr = Object.entries(route.byLifecycle).map(([k, v]) => `${k}:${v}`).join(', ') || 'none';
      return `| ${i + 1} | ${report.config.playerName} | ${ending} | ${topStr} | ${routeStr} |`;
    })
    .join('\n');

  return [
    '## Experience Diagnostics (P2 closure)',
    '',
    'Aggregated across all sample runs: top event IDs by occurrence count (may indicate repetition pressure).',
    '',
    '| eventId | totalCount |',
    '|---|---:|',
    rows || '| (none) | 0 |',
    '',
    'Romance / family snapshot (per-report aggregates):',
    '',
    `- lives with spouse (count / ${reports.length}): ${rf.livesWithSpouse}`,
    `- lives with children > 0 (count / ${reports.length}): ${rf.livesWithChildren}`,
    `- avg relation keys in final state: ${rf.avgNotableRelations.toFixed(2)}`,
    '',
    'Per-sample: top 5 event IDs by count; routeStates lifecycle histogram.',
    '',
    '| sample | persona | ending | top5 events | routeStates lifecycle counts |',
    '|---:|---|---|---|---|',
    perSample || '| 1 | — | — | — | — |',
    '',
  ].join('\n');
}

export function printDiagnosticsToConsole(reports: GameProcessReport[]): void {
  console.log('\n=== P2 Experience Diagnostics ===');
  const agg = aggregateTopEventsAcrossReports(reports, 10);
  for (const row of agg) {
    console.log(`  ${row.eventId}: ${row.count}`);
  }
  const rf = summarizeRomanceFamilyAcrossReports(reports);
  console.log(`Spouse present in ${rf.livesWithSpouse}/${reports.length} samples`);
  console.log(`Children>0 in ${rf.livesWithChildren}/${reports.length} samples`);
}
