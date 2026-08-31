import type { EventDefinition } from '../src/types/eventTypes';
import type { GameProcessReport } from '../src/types/simulationRecordTypes';
import { detectEventClasses, type EventClass } from './eventRepetitionClassDetection';

export type CalibrationDomain =
  | 'relationship'
  | 'family'
  | 'commerce'
  | 'martial'
  | 'official'
  | 'health'
  | 'identity'
  | 'unknown';

export type CalibrationNarrativeRole =
  | 'setup'
  | 'development'
  | 'conflict'
  | 'choice'
  | 'payoff_echo'
  | 'unknown';

export interface CalibrationAnnotation {
  domain: CalibrationDomain;
  narrativeRole: CalibrationNarrativeRole;
}

export interface FormalEventTimelineItem {
  age: number;
  eventId: string;
  title: string;
  eventType: string | null;
  progressionKind: string | null;
  legacyClasses: EventClass[];
  annotation: CalibrationAnnotation;
}

export interface CalibrationTrace {
  sampleId: string;
  seed: number;
  routeTrack?: string;
  timeline: FormalEventTimelineItem[];
}

export interface CalibrationCatalogAnchor {
  eventId: string;
  title: string;
  annotation: CalibrationAnnotation;
}

const UNKNOWN_ANNOTATION: CalibrationAnnotation = Object.freeze({
  domain: 'unknown',
  narrativeRole: 'unknown',
});

const CALIBRATION_ANNOTATIONS: Readonly<Record<string, CalibrationAnnotation>> = Object.freeze({
  mingyue_market_meet: { domain: 'relationship', narrativeRole: 'setup' },
  mingyue_second_encounter: { domain: 'relationship', narrativeRole: 'development' },
  mingyue_value_conflict: { domain: 'relationship', narrativeRole: 'conflict' },
  mingyue_echo_romantic: { domain: 'relationship', narrativeRole: 'payoff_echo' },
  mingyue_early_parenting: { domain: 'family', narrativeRole: 'development' },
  merchant_year_trade: { domain: 'commerce', narrativeRole: 'development' },
  merchant_year_crisis: { domain: 'commerce', narrativeRole: 'conflict' },
  setback_injury: { domain: 'health', narrativeRole: 'conflict' },
  setback_illness: { domain: 'health', narrativeRole: 'conflict' },
  martial_arts_enlightenment: { domain: 'martial', narrativeRole: 'choice' },
  official_entry: { domain: 'official', narrativeRole: 'choice' },
});

export function getCalibrationAnnotation(eventId: string): CalibrationAnnotation {
  return CALIBRATION_ANNOTATIONS[eventId] ?? UNKNOWN_ANNOTATION;
}

function isTechnicalRecord(eventId: string, progressionKind?: string): boolean {
  return (
    !eventId ||
    eventId === 'no_event' ||
    eventId.startsWith('daily_') ||
    progressionKind === 'active_action' ||
    eventId.startsWith('active_action:') ||
    eventId.startsWith('active_action_')
  );
}

export function buildFormalEventTimeline(
  report: GameProcessReport,
  getEventById: (eventId: string) => EventDefinition | undefined,
): FormalEventTimelineItem[] {
  const unresolvedEventIds = new Set<string>();
  const timeline: FormalEventTimelineItem[] = [];

  for (const record of report.records) {
    if (isTechnicalRecord(record.eventId, record.progressionKind)) {
      continue;
    }

    const definition = getEventById(record.eventId);
    if (!definition) {
      unresolvedEventIds.add(record.eventId);
      continue;
    }

    timeline.push({
      age: record.age,
      eventId: record.eventId,
      title: record.eventTitle || definition.content.title || record.eventId,
      eventType: record.eventType || null,
      progressionKind: record.progressionKind || null,
      legacyClasses: detectEventClasses(definition),
      annotation: getCalibrationAnnotation(record.eventId),
    });
  }

  if (unresolvedEventIds.size > 0) {
    throw new Error(
      `Experience measurement calibration could not resolve formal event definitions: ${[
        ...unresolvedEventIds,
      ].sort().join(', ')}`,
    );
  }

  return timeline.sort((a, b) => a.age - b.age || a.eventId.localeCompare(b.eventId));
}

const CALIBRATION_DOMAIN_ORDER: CalibrationDomain[] = [
  'relationship',
  'family',
  'commerce',
  'martial',
  'official',
  'health',
  'identity',
];

function formatTimelineItem(item: FormalEventTimelineItem, includeLegacyClasses: boolean): string {
  const legacyClasses = item.legacyClasses.length > 0 ? item.legacyClasses.join(',') : 'none';
  const prefix = `${item.age} | ${item.eventId} | ${item.title}`;
  if (!includeLegacyClasses) {
    return `${prefix} | ${item.annotation.domain} | ${item.annotation.narrativeRole}`;
  }
  return `${prefix} | ${legacyClasses} | ${item.annotation.domain} | ${item.annotation.narrativeRole}`;
}

function formatDomains(domains: Set<CalibrationDomain>): string {
  const ordered = CALIBRATION_DOMAIN_ORDER.filter(domain => domains.has(domain));
  return ordered.length > 0 ? ordered.join(', ') : 'none';
}

function traceObservedDomains(traces: readonly CalibrationTrace[]): Set<CalibrationDomain> {
  return new Set(
    traces.flatMap(trace => trace.timeline)
      .map(item => item.annotation.domain)
      .filter((domain): domain is Exclude<CalibrationDomain, 'unknown'> => domain !== 'unknown'),
  );
}

function formatSampleSummary(trace: CalibrationTrace): string {
  const legacyCount = trace.timeline.filter(item => item.legacyClasses.length > 0).length;
  const annotatedCount = trace.timeline.filter(item => item.annotation.domain !== 'unknown').length;
  const unknownCount = trace.timeline.length - annotatedCount;
  return `| ${trace.sampleId} | ${trace.seed} | ${trace.routeTrack ?? 'none'} | ${trace.timeline.length} | ${legacyCount} | ${annotatedCount} | ${unknownCount} |`;
}

function formatRepresentativeSequence(
  traces: readonly CalibrationTrace[],
  label: string,
  predicate: (item: FormalEventTimelineItem) => boolean,
): string {
  for (const trace of traces) {
    const items = trace.timeline.filter(predicate);
    if (items.length > 0) {
      return `- ${label}: sample=${trace.sampleId}, seed=${trace.seed}, events=${items.map(item => `${item.eventId}@${item.age}`).join(' -> ')}`;
    }
  }
  return `- ${label}: NOT_OBSERVED_IN_CURRENT_6_BASELINES`;
}

export function formatCalibrationReport(
  traces: readonly CalibrationTrace[],
  catalogAnchors: readonly CalibrationCatalogAnchor[] = [],
): string {
  const observedDomains = traceObservedDomains(traces);
  const catalogOnlyDomains = new Set<CalibrationDomain>(
    catalogAnchors
      .map(anchor => anchor.annotation.domain)
      .filter(domain => domain !== 'unknown' && !observedDomains.has(domain)),
  );
  const notObservedDomains = new Set<CalibrationDomain>(
    CALIBRATION_DOMAIN_ORDER.filter(
      domain => !observedDomains.has(domain) && !catalogOnlyDomains.has(domain),
    ),
  );
  const officialObserved = observedDomains.has('official');
  const lines = [
    '=== PD-105 Measurement Calibration Sample ===',
    'Scope: REPORT_ONLY semantic calibration; no experience improvement claim.',
    `Trace count: ${traces.length} (existing deterministic baselines only)`,
    '',
    `TRACE_OBSERVED_DOMAINS: ${formatDomains(observedDomains)}`,
    `CATALOG_ONLY_CALIBRATION_DOMAINS: ${formatDomains(catalogOnlyDomains)}`,
    `NOT_OBSERVED_DOMAINS: ${formatDomains(notObservedDomains)}`,
    `official trace coverage: ${officialObserved ? 'OBSERVED_IN_CURRENT_6_BASELINES' : 'NOT_OBSERVED_IN_CURRENT_6_BASELINES'}${officialObserved ? '' : ' (KNOWN_SAMPLING_LIMITATION; NOT_FAIL)'}`,
    '',
    'CATALOG_SEMANTIC_SAMPLE_INVENTORY',
    ...(
      catalogAnchors.length > 0
        ? catalogAnchors.map(anchor => `${anchor.eventId} | ${anchor.title} | ${anchor.annotation.domain} | ${anchor.annotation.narrativeRole}`)
        : ['none']
    ),
    '',
    'SAMPLE_SUMMARY',
    '| sample | seed | route | raw formal event count | legacy class-positive count | annotated semantic count | unknown semantic count |',
    '|---|---:|---|---:|---:|---:|---:|',
    ...traces.map(formatSampleSummary),
    '',
    'FULL_FORMAL_TIMELINE',
    'sample | age | eventId | title | legacyClasses | domain | narrativeRole',
    ...traces.flatMap(trace => trace.timeline.map(item => `${trace.sampleId} | ${formatTimelineItem(item, true)}`)),
    '',
    'LEGACY_CLASS_POSITIVE_TIMELINE',
    'sample | age | eventId | title | legacyClasses | domain | narrativeRole',
    ...traces.flatMap(trace => trace.timeline
      .filter(item => item.legacyClasses.length > 0)
      .map(item => `${trace.sampleId} | ${formatTimelineItem(item, true)}`)),
    '',
    'SEMANTIC_CALIBRATION_VIEW',
    'sample | age | eventId | title | domain | narrativeRole',
    ...traces.flatMap(trace => trace.timeline.map(item => `${trace.sampleId} | ${formatTimelineItem(item, false)}`)),
    '',
    'REPRESENTATIVE_TRACE_SEQUENCES',
    formatRepresentativeSequence(traces, 'relationship', item => item.annotation.domain === 'relationship'),
    formatRepresentativeSequence(
      traces,
      'family / parenthood',
      item => item.annotation.domain === 'family',
    ),
    formatRepresentativeSequence(traces, 'commerce', item => item.annotation.domain === 'commerce'),
    formatRepresentativeSequence(traces, 'martial', item => item.annotation.domain === 'martial'),
    formatRepresentativeSequence(traces, 'health / setback', item => item.annotation.domain === 'health'),
    `- official: catalog anchor only; trace status=${officialObserved ? 'OBSERVED_IN_CURRENT_6_BASELINES' : 'NOT_OBSERVED_IN_CURRENT_6_BASELINES'}`,
    '',
    'TYPICAL_SEMANTIC_DIFFERENCES',
    ...traces.flatMap(trace => trace.timeline
      .filter(item => item.legacyClasses.includes('economy') && item.annotation.domain !== 'unknown' && item.annotation.domain !== 'commerce')
      .map(item => `- ${trace.sampleId} age=${item.age}: legacy ${item.legacyClasses.join(',')} -> semantic ${item.annotation.domain}/${item.annotation.narrativeRole} (${item.eventId})`)),
    '',
    'CALIBRATION_LIMITATION',
    'The current phase validates whether measurement semantics are more credible than the legacy heuristic.',
    'It does not validate real route/seed experience coverage for every domain.',
    'official_entry is a catalog semantic anchor, not an observed event in the six trace baselines.',
    'No new repetition metric threshold is introduced; legacy repetition values remain diagnostics only.',
  ];

  return lines.join('\n') + '\n';
}
