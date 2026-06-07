import type { P8PlayabilityReport } from '../p8/types';
import type { P9WarningTriageReport, WarningBucket, WarningTriageEntry } from './types';
import { getP8PersonaById } from '../p8/personas';

function bucketForMetric(key: string): WarningBucket {
  if (key === 'replayability') return 'replayability';
  if (key === 'pacing') return 'pacing';
  if (key === 'causality') return 'causality';
  return 'other';
}

function extractPersonaId(detail: string): string {
  const match = detail.match(/^(p8-[a-z-]+):/);
  return match?.[1] ?? 'unknown';
}

export function buildWarningTriageReport(
  p8Report: P8PlayabilityReport,
  sourcePath: string,
): P9WarningTriageReport {
  const allWarnings: WarningTriageEntry[] = p8Report.warnings.map(w => {
    const personaId = extractPersonaId(w.detail);
    const persona = getP8PersonaById(personaId);
    return {
      metric: w.key,
      personaId,
      personaName: persona?.name ?? personaId,
      detail: w.detail,
      bucket: bucketForMetric(w.key),
      evidence: w.evidence ?? [],
    };
  });

  const byBucket: P9WarningTriageReport['byBucket'] = {
    replayability: [],
    pacing: [],
    causality: [],
    other: [],
  };
  for (const entry of allWarnings) {
    byBucket[entry.bucket].push(entry);
  }

  return {
    schemaVersion: 'p9-triage-v1',
    generatedAt: new Date().toISOString(),
    sourceReport: sourcePath,
    baselineDecision: p8Report.decision,
    totalWarnings: allWarnings.length,
    byBucket,
    allWarnings,
  };
}

export function renderWarningTriageMarkdown(report: P9WarningTriageReport): string {
  const lines: string[] = [
    '# P9 Warning Triage Baseline',
    '',
    `Generated: ${report.generatedAt}`,
    `Source: ${report.sourceReport}`,
    `P8 decision: **${report.baselineDecision.toUpperCase()}**`,
    `Total warnings: ${report.totalWarnings}`,
    '',
  ];

  for (const bucket of ['replayability', 'pacing', 'causality', 'other'] as const) {
    const entries = report.byBucket[bucket];
    lines.push(`## ${bucket} (${entries.length})`);
    lines.push('');
    if (entries.length === 0) {
      lines.push('_None_');
      lines.push('');
      continue;
    }
    for (const e of entries) {
      lines.push(`- **${e.metric}** | ${e.personaName} (\`${e.personaId}\`) — ${e.detail}`);
    }
    lines.push('');
  }

  lines.push('## Full Warning List');
  lines.push('');
  for (const e of report.allWarnings) {
    lines.push(`| ${e.bucket} | ${e.metric} | ${e.personaId} | ${e.detail} |`);
  }
  return lines.join('\n');
}
