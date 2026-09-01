/**
 * P2 收尾：从模拟报告中抽取可定位的体验诊断（复读、路线、婚恋/家庭），供报告与 CLI 复用。
 */
import type { GameProcessReport } from '../src/types/simulationRecordTypes';

export type EventFrequencyRow = { eventId: string; count: number };

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

  const perSample = reports
    .map((report, i) => {
      const top = topRepeatedEvents(report, 5);
      const ending = report.statistics.endingSummary || report.deathReason || 'unknown';
      const topStr = top.map(t => `${t.eventId}×${t.count}`).join(', ');
      return `| ${i + 1} | ${report.config.playerName} | ${ending} | ${topStr} |`;
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
    'Per-sample: top 5 event IDs by count.',
    '',
    '| sample | persona | ending | top5 events |',
    '|---:|---|---|---|',
    perSample || '| 1 | — | — | — |',
    '',
  ].join('\n');
}

export function printDiagnosticsToConsole(reports: GameProcessReport[]): void {
  console.log('\n=== P2 Experience Diagnostics ===');
  const agg = aggregateTopEventsAcrossReports(reports, 10);
  for (const row of agg) {
    console.log(`  ${row.eventId}: ${row.count}`);
  }
}
