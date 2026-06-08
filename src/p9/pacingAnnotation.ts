import type { GameProcessRecord } from '../types/simulationRecordTypes';
import { isPacingImpactRecord } from '../p8/collectPersonaMetrics';
import type {
  AnnotatedPacingSpan,
  P9PacingAnnotationReport,
  PacingSpanActivity,
  PacingSpanClassification,
  PersonaSimulationBundle,
} from './types';

function findLongestLowImpactSpan(records: GameProcessRecord[]): { start: number; end: number; years: number } {
  if (records.length === 0) {
    return { start: 0, end: 0, years: 0 };
  }
  let lastImpactAge = records[0].age;
  let maxSpan = 0;
  let maxStart = records[0].age;
  let maxEnd = records[0].age;

  for (const record of records) {
    if (isPacingImpactRecord(record)) {
      const span = record.age - lastImpactAge;
      if (span > maxSpan) {
        maxSpan = span;
        maxStart = lastImpactAge;
        maxEnd = record.age;
      }
      lastImpactAge = record.age;
    }
  }
  const tailSpan = records[records.length - 1].age - lastImpactAge;
  if (tailSpan > maxSpan) {
    maxSpan = tailSpan;
    maxStart = lastImpactAge;
    maxEnd = records[records.length - 1].age;
  }
  return { start: maxStart, end: maxEnd, years: maxSpan };
}

function collectSpanActivity(records: GameProcessRecord[], startAge: number, endAge: number): PacingSpanActivity {
  const inSpan = records.filter(r => r.age > startAge && r.age < endAge);
  const activity: PacingSpanActivity = {
    events: [],
    actions: [],
    routeChanges: [],
    summaryChanges: [],
  };

  for (const r of inSpan) {
    if (r.progressionKind === 'active_action' && r.activeActionId) {
      activity.actions.push({ age: r.age, actionId: r.activeActionId });
    } else if (r.eventType === 'auto' || r.eventType === 'choice') {
      activity.events.push({
        age: r.age,
        title: r.eventTitle,
        kind: r.progressionKind ?? r.eventType,
      });
    }
    const text = `${r.eventTitle} ${r.outcomeText ?? ''}`;
    if (/路线|身份|门派|倾向/.test(text)) {
      activity.routeChanges.push({ age: r.age, signal: text.slice(0, 80) });
    }
    if (r.outcomeText && /摘要|人生|转折/.test(r.outcomeText)) {
      activity.summaryChanges.push({ age: r.age, text: r.outcomeText.slice(0, 80) });
    }
  }
  return activity;
}

function classifySpan(activity: PacingSpanActivity, spanYears: number): PacingSpanClassification {
  const totalItems =
    activity.events.length + activity.actions.length + activity.routeChanges.length + activity.summaryChanges.length;
  if (totalItems === 0) {
    return 'no-content';
  }
  if (activity.actions.length > 0 && activity.routeChanges.length === 0 && activity.events.length <= 1) {
    return 'weak-feedback';
  }
  if (spanYears >= 6 && activity.routeChanges.length === 0) {
    return 'weak-differentiation';
  }
  if (totalItems <= 2) {
    return 'weak-feedback';
  }
  return 'weak-differentiation';
}

export function annotatePacingSpan(bundle: PersonaSimulationBundle): AnnotatedPacingSpan | null {
  const spanYears = bundle.metrics.pacing.longestLowImpactSpanYears;
  if (spanYears <= 5) {
    return null;
  }
  const startAge = bundle.metrics.pacing.lowImpactSpanStartAge ?? 0;
  const endAge = bundle.metrics.pacing.lowImpactSpanEndAge ?? startAge + spanYears;
  const activity = collectSpanActivity(bundle.records, startAge, endAge);
  return {
    personaId: bundle.personaId,
    personaName: bundle.metrics.personaName,
    startAge,
    endAge,
    spanYears,
    classification: classifySpan(activity, spanYears),
    activity,
  };
}

export function buildPacingAnnotationReport(bundles: PersonaSimulationBundle[]): P9PacingAnnotationReport {
  const spans = bundles.map(annotatePacingSpan).filter((s): s is AnnotatedPacingSpan => s !== null);
  return {
    schemaVersion: 'p9-pacing-v1',
    generatedAt: new Date().toISOString(),
    spans,
  };
}

export function renderPacingAnnotationMarkdown(report: P9PacingAnnotationReport): string {
  const lines = [
    '# P9 Pacing Window Annotation',
    '',
    `Generated: ${report.generatedAt}`,
    `Annotated spans: ${report.spans.length}`,
    '',
  ];
  for (const span of report.spans) {
    lines.push(`## ${span.personaName} (\`${span.personaId}\`)`);
    lines.push('');
    lines.push(`- Window: age ${span.startAge}–${span.endAge} (${span.spanYears} years)`);
    lines.push(`- Classification: **${span.classification}**`);
    lines.push(`- Events in span: ${span.activity.events.length}`);
    for (const e of span.activity.events.slice(0, 5)) {
      lines.push(`  - ${e.age}y: ${e.title} (${e.kind})`);
    }
    lines.push(`- Actions in span: ${span.activity.actions.length}`);
    for (const a of span.activity.actions.slice(0, 5)) {
      lines.push(`  - ${a.age}y: ${a.actionId}`);
    }
    lines.push(`- Route changes: ${span.activity.routeChanges.length}`);
    for (const r of span.activity.routeChanges) {
      lines.push(`  - ${r.age}y: ${r.signal}`);
    }
    lines.push(`- Summary changes: ${span.activity.summaryChanges.length}`);
    lines.push('');
  }
  return lines.join('\n');
}
