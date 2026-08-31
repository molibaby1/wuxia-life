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

export interface SemanticAnnotationCoverage {
  annotatedEventCount: number;
  formalEventCount: number;
  rate: number | null;
}

export interface CalibrationDirectContinuity {
  fromEventId: string;
  toEventId: string;
  evidence: string;
}

export interface SemanticAdjacentPairEvidence {
  previous: FormalEventTimelineItem;
  current: FormalEventTimelineItem;
  scorable: boolean;
  knownDirectCausalContinuity: boolean;
  semanticRepetition: boolean;
  unscorableReason?: 'unknown_domain' | 'unknown_narrative_role' | 'unknown_domain_and_role';
}

export interface SemanticDomainConcentrationWindowEvidence {
  startIndex: number;
  events: readonly FormalEventTimelineItem[];
  dominantDomain: CalibrationDomain;
  dominantKnownDomainCount: number;
  knownAnnotationCount: number;
  concentration: number;
}

export interface SemanticNarrativeRoleWindowEvidence {
  startIndex: number;
  events: readonly FormalEventTimelineItem[];
  dominantRole: CalibrationNarrativeRole;
  dominantKnownRoleCount: number;
  stagnant: boolean;
}

export interface SemanticMeasurementPrototype {
  annotatedEventCoverage: SemanticAnnotationCoverage;
  adjacentSemanticRepetitionRate: number | null;
  adjacentScorablePairCount: number;
  adjacentSemanticRepetitionCount: number;
  adjacentUnscorablePairCount: number;
  adjacentPairEvidence: readonly SemanticAdjacentPairEvidence[];
  shortWindowDomainConcentration: number | null;
  shortWindowDomainConcentrationWindow: SemanticDomainConcentrationWindowEvidence | null;
  shortWindowDomainConcentrationWindows: readonly SemanticDomainConcentrationWindowEvidence[];
  narrativeRoleStagnationRate: number | null;
  narrativeRoleStagnantWindowCount: number;
  narrativeRoleWindowCount: number;
  narrativeRoleStagnantWindows: readonly SemanticNarrativeRoleWindowEvidence[];
  narrativeRoleWindows: readonly SemanticNarrativeRoleWindowEvidence[];
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

export const CALIBRATION_DIRECT_CONTINUITY: readonly CalibrationDirectContinuity[] = Object.freeze([
  {
    fromEventId: 'mingyue_market_meet',
    toEventId: 'mingyue_second_encounter',
    evidence: 'mingyue_market_meet choice mingyue_participate sets flag mingyue_met; mingyue_second_encounter condition requires flags.has("mingyue_met")',
  },
  {
    fromEventId: 'mingyue_second_encounter',
    toEventId: 'mingyue_shared_experience',
    evidence: 'mingyue_shared_experience condition requires events.has("mingyue_second_encounter")',
  },
  {
    fromEventId: 'mingyue_shared_experience',
    toEventId: 'mingyue_value_conflict',
    evidence: 'mingyue_value_conflict condition requires events.has("mingyue_shared_experience")',
  },
  {
    fromEventId: 'mingyue_value_conflict',
    toEventId: 'mingyue_relationship_choice',
    evidence: 'mingyue_relationship_choice condition requires events.has("mingyue_shared_experience") and events.has("mingyue_value_conflict")',
  },
  {
    fromEventId: 'mingyue_relationship_choice',
    toEventId: 'mingyue_echo_romantic',
    evidence: 'mingyue_echo_romantic condition requires events.has("mingyue_relationship_choice") and flag mingyue_romance_confirmed set by the relationship choice',
  },
  {
    fromEventId: 'mingyue_child_arrival',
    toEventId: 'mingyue_early_parenting',
    evidence: 'mingyue_early_parenting condition requires events.has("mingyue_child_arrival"), married, has_child, and player.children > 0',
  },
]);

const DIRECT_CONTINUITY_BY_PAIR = new Map(
  CALIBRATION_DIRECT_CONTINUITY.map(entry => [`${entry.fromEventId}\u0000${entry.toEventId}`, entry]),
);

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

const SEMANTIC_DOMAIN_WINDOW_SIZE = 5;
const SEMANTIC_ROLE_WINDOW_SIZE = 4;

function hasKnownSemanticAnnotation(item: FormalEventTimelineItem): boolean {
  return item.annotation.domain !== 'unknown' && item.annotation.narrativeRole !== 'unknown';
}

function getUnscorableReason(
  previous: FormalEventTimelineItem,
  current: FormalEventTimelineItem,
): SemanticAdjacentPairEvidence['unscorableReason'] {
  const domainUnknown =
    previous.annotation.domain === 'unknown' || current.annotation.domain === 'unknown';
  const roleUnknown =
    previous.annotation.narrativeRole === 'unknown' || current.annotation.narrativeRole === 'unknown';
  if (domainUnknown && roleUnknown) return 'unknown_domain_and_role';
  if (domainUnknown) return 'unknown_domain';
  return 'unknown_narrative_role';
}

function directContinuityKey(fromEventId: string, toEventId: string): string {
  return `${fromEventId}\u0000${toEventId}`;
}

export function isSemanticRepetitionPair(
  previous: FormalEventTimelineItem,
  current: FormalEventTimelineItem,
  knownDirectCausalContinuity: boolean,
): boolean {
  return (
    hasKnownSemanticAnnotation(previous) &&
    hasKnownSemanticAnnotation(current) &&
    previous.annotation.domain === current.annotation.domain &&
    previous.annotation.narrativeRole === current.annotation.narrativeRole &&
    !knownDirectCausalContinuity
  );
}

function buildDomainConcentrationWindow(
  timeline: readonly FormalEventTimelineItem[],
  startIndex: number,
): SemanticDomainConcentrationWindowEvidence {
  const events = timeline.slice(startIndex, startIndex + SEMANTIC_DOMAIN_WINDOW_SIZE);
  const domainCounts = new Map<CalibrationDomain, number>();
  for (const item of events) {
    if (item.annotation.domain !== 'unknown') {
      domainCounts.set(item.annotation.domain, (domainCounts.get(item.annotation.domain) ?? 0) + 1);
    }
  }

  let dominantDomain: CalibrationDomain = 'unknown';
  let dominantKnownDomainCount = 0;
  for (const domain of CALIBRATION_DOMAIN_ORDER) {
    const count = domainCounts.get(domain) ?? 0;
    if (count > dominantKnownDomainCount) {
      dominantDomain = domain;
      dominantKnownDomainCount = count;
    }
  }

  return {
    startIndex,
    events,
    dominantDomain,
    dominantKnownDomainCount,
    knownAnnotationCount: events.filter(item => item.annotation.domain !== 'unknown').length,
    concentration: dominantKnownDomainCount / SEMANTIC_DOMAIN_WINDOW_SIZE,
  };
}

function buildRoleWindow(
  timeline: readonly FormalEventTimelineItem[],
  startIndex: number,
): SemanticNarrativeRoleWindowEvidence {
  const events = timeline.slice(startIndex, startIndex + SEMANTIC_ROLE_WINDOW_SIZE);
  const roleCounts = new Map<CalibrationNarrativeRole, number>();
  for (const item of events) {
    if (item.annotation.narrativeRole !== 'unknown') {
      roleCounts.set(
        item.annotation.narrativeRole,
        (roleCounts.get(item.annotation.narrativeRole) ?? 0) + 1,
      );
    }
  }

  let dominantRole: CalibrationNarrativeRole = 'unknown';
  let dominantKnownRoleCount = 0;
  const roleOrder: CalibrationNarrativeRole[] = [
    'setup',
    'development',
    'conflict',
    'choice',
    'payoff_echo',
  ];
  for (const role of roleOrder) {
    const count = roleCounts.get(role) ?? 0;
    if (count > dominantKnownRoleCount) {
      dominantRole = role;
      dominantKnownRoleCount = count;
    }
  }

  return {
    startIndex,
    events,
    dominantRole,
    dominantKnownRoleCount,
    stagnant: dominantKnownRoleCount >= 3,
  };
}

export function computeSemanticMeasurementPrototype(
  timeline: readonly FormalEventTimelineItem[],
): SemanticMeasurementPrototype {
  const annotatedEventCount = timeline.filter(hasKnownSemanticAnnotation).length;
  const formalEventCount = timeline.length;
  const adjacentPairEvidence: SemanticAdjacentPairEvidence[] = [];
  let adjacentScorablePairCount = 0;
  let adjacentSemanticRepetitionCount = 0;
  let adjacentUnscorablePairCount = 0;

  for (let index = 1; index < timeline.length; index += 1) {
    const previous = timeline[index - 1];
    const current = timeline[index];
    const scorable = hasKnownSemanticAnnotation(previous) && hasKnownSemanticAnnotation(current);
    const knownDirectCausalContinuity = scorable && DIRECT_CONTINUITY_BY_PAIR.has(
      directContinuityKey(previous.eventId, current.eventId),
    );
    const semanticRepetition = isSemanticRepetitionPair(
      previous,
      current,
      knownDirectCausalContinuity,
    );
    if (scorable) {
      adjacentScorablePairCount += 1;
      if (semanticRepetition) adjacentSemanticRepetitionCount += 1;
    } else {
      adjacentUnscorablePairCount += 1;
    }
    adjacentPairEvidence.push({
      previous,
      current,
      scorable,
      knownDirectCausalContinuity,
      semanticRepetition,
      ...(scorable ? {} : { unscorableReason: getUnscorableReason(previous, current) }),
    });
  }

  const domainConcentrationWindows: SemanticDomainConcentrationWindowEvidence[] = [];
  for (let startIndex = 0; startIndex <= timeline.length - SEMANTIC_DOMAIN_WINDOW_SIZE; startIndex += 1) {
    domainConcentrationWindows.push(buildDomainConcentrationWindow(timeline, startIndex));
  }
  const shortWindowDomainConcentrationWindow = domainConcentrationWindows.reduce<
    SemanticDomainConcentrationWindowEvidence | null
  >((best, candidate) => {
    if (!best || candidate.concentration > best.concentration) return candidate;
    return best;
  }, null);

  const roleWindows: SemanticNarrativeRoleWindowEvidence[] = [];
  for (let startIndex = 0; startIndex <= timeline.length - SEMANTIC_ROLE_WINDOW_SIZE; startIndex += 1) {
    roleWindows.push(buildRoleWindow(timeline, startIndex));
  }
  const narrativeRoleStagnantWindows = roleWindows.filter(window => window.stagnant);

  return {
    annotatedEventCoverage: {
      annotatedEventCount,
      formalEventCount,
      rate: formalEventCount > 0 ? annotatedEventCount / formalEventCount : null,
    },
    adjacentSemanticRepetitionRate: adjacentScorablePairCount > 0
      ? adjacentSemanticRepetitionCount / adjacentScorablePairCount
      : null,
    adjacentScorablePairCount,
    adjacentSemanticRepetitionCount,
    adjacentUnscorablePairCount,
    adjacentPairEvidence,
    shortWindowDomainConcentration: shortWindowDomainConcentrationWindow?.concentration ?? null,
    shortWindowDomainConcentrationWindow,
    shortWindowDomainConcentrationWindows: domainConcentrationWindows,
    narrativeRoleStagnationRate: roleWindows.length > 0
      ? narrativeRoleStagnantWindows.length / roleWindows.length
      : null,
    narrativeRoleStagnantWindowCount: narrativeRoleStagnantWindows.length,
    narrativeRoleWindowCount: roleWindows.length,
    narrativeRoleStagnantWindows,
    narrativeRoleWindows: roleWindows,
  };
}

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

function formatRate(value: number | null): string {
  return value === null ? 'n/a' : value.toFixed(4);
}

function formatEventSequence(events: readonly FormalEventTimelineItem[]): string {
  return events.length > 0
    ? events.map(item => `${item.eventId}@${item.age}(${item.annotation.domain}/${item.annotation.narrativeRole})`).join(' -> ')
    : 'none';
}

function formatSemanticPrototype(trace: CalibrationTrace): string[] {
  const prototype = computeSemanticMeasurementPrototype(trace.timeline);
  const coverage = prototype.annotatedEventCoverage;
  const maxDomainWindow = prototype.shortWindowDomainConcentrationWindow;
  const lines = [
    `sample=${trace.sampleId} | seed=${trace.seed} | route=${trace.routeTrack ?? 'none'} | formal_events=${coverage.formalEventCount}`,
    `annotation coverage: ${coverage.annotatedEventCount}/${coverage.formalEventCount} (${formatRate(coverage.rate)})`,
    `adjacent semantic repetition: rate=${formatRate(prototype.adjacentSemanticRepetitionRate)} | repetition_count=${prototype.adjacentSemanticRepetitionCount} | scorable_pairs=${prototype.adjacentScorablePairCount} | unscorable_pairs=${prototype.adjacentUnscorablePairCount}`,
    `short-window domain concentration: max_rate=${formatRate(prototype.shortWindowDomainConcentration)} | dominant_domain=${maxDomainWindow?.dominantDomain ?? 'none'} | dominant_known_count=${maxDomainWindow?.dominantKnownDomainCount ?? 0} | known_annotation_count=${maxDomainWindow?.knownAnnotationCount ?? 0}`,
    `  exact_5_event_window: ${maxDomainWindow ? formatEventSequence(maxDomainWindow.events) : 'none'}`,
    `narrative role stagnation: rate=${formatRate(prototype.narrativeRoleStagnationRate)} | stagnant_windows=${prototype.narrativeRoleStagnantWindowCount} | total_4_event_windows=${prototype.narrativeRoleWindowCount}`,
  ];

  lines.push('  EXACT_ADJACENT_PAIR_EVIDENCE');
  for (const pair of prototype.adjacentPairEvidence) {
    lines.push(
      `  ${pair.previous.eventId}@${pair.previous.age} -> ${pair.current.eventId}@${pair.current.age} | scorable=${pair.scorable} | direct_continuity=${pair.knownDirectCausalContinuity} | repetition=${pair.semanticRepetition}${pair.unscorableReason ? ` | reason=${pair.unscorableReason}` : ''}`,
    );
  }

  lines.push('  REPRESENTATIVE_STAGNANT_4_EVENT_WINDOWS');
  if (prototype.narrativeRoleStagnantWindows.length === 0) {
    lines.push('  none');
  } else {
    for (const window of prototype.narrativeRoleStagnantWindows) {
      lines.push(
        `  dominant_role=${window.dominantRole} | known_role_count=${window.dominantKnownRoleCount} | ${formatEventSequence(window.events)}`,
      );
    }
  }
  return lines;
}

function findTraceWithEvent(
  traces: readonly CalibrationTrace[],
  eventId: string,
): CalibrationTrace | undefined {
  return traces.find(trace => trace.timeline.some(item => item.eventId === eventId));
}

function findWindowWithEvent(
  windows: readonly SemanticDomainConcentrationWindowEvidence[] | readonly SemanticNarrativeRoleWindowEvidence[],
  eventId: string,
): SemanticDomainConcentrationWindowEvidence | SemanticNarrativeRoleWindowEvidence | undefined {
  return windows.find(window => window.events.some(item => item.eventId === eventId));
}

function formatHumanCalibrationEvidence(traces: readonly CalibrationTrace[]): string[] {
  const lines: string[] = [];
  const mingyueIds = [
    'mingyue_market_meet',
    'mingyue_second_encounter',
    'mingyue_value_conflict',
  ];
  const mingyueTrace = traces.find(trace => {
    const prototype = computeSemanticMeasurementPrototype(trace.timeline);
    return mingyueIds.every(eventId => trace.timeline.some(item => item.eventId === eventId)) &&
      prototype.adjacentPairEvidence.some(
        pair => pair.previous.eventId === 'mingyue_market_meet' &&
          pair.current.eventId === 'mingyue_second_encounter',
      );
  }) ?? traces.find(trace => mingyueIds.every(eventId => trace.timeline.some(item => item.eventId === eventId)));

  if (mingyueTrace) {
    const prototype = computeSemanticMeasurementPrototype(mingyueTrace.timeline);
    const items = mingyueIds.map(eventId => mingyueTrace.timeline.find(item => item.eventId === eventId)!);
    const chainPair = prototype.adjacentPairEvidence.find(
      pair => pair.previous.eventId === 'mingyue_market_meet' && pair.current.eventId === 'mingyue_second_encounter',
    );
    lines.push(`A. 明月关系推进（sample=${mingyueTrace.sampleId}, seed=${mingyueTrace.seed}）`);
    lines.push(`事件序列：${formatEventSequence(items)}`);
    lines.push(`domain / role：${items.map(item => `${item.annotation.domain}/${item.annotation.narrativeRole}`).join(' → ')}`);
    lines.push(
      `prototype 判断：${chainPair
        ? `market → second 为真实相邻 pair，direct_continuity=${chainPair.knownDirectCausalContinuity}，repetition=${chainPair.semanticRepetition}；后续经过未标注正式事件，不跨事件重连。`
        : '三项语义事件在完整 timeline 中不是全部相邻；prototype 不跨中间正式事件重连，因此不把合理推进判为 adjacent repetition。'}`,
    );
    lines.push('Human 应理解：setup → development → conflict 是关系推进的不同角色；这段结果说明应看语义角色和真实前史，不能用同一 legacy class 判定重复。');
  } else {
    lines.push('A. 明月关系推进：NOT_OBSERVED_IN_CURRENT_6_BASELINES');
  }

  const commercePairTrace = traces.find(trace =>
    computeSemanticMeasurementPrototype(trace.timeline).adjacentPairEvidence.some(pair =>
      pair.scorable && pair.semanticRepetition &&
      pair.previous.annotation.domain === 'commerce' &&
      pair.previous.annotation.narrativeRole === 'development' &&
      pair.current.annotation.domain === 'commerce' &&
      pair.current.annotation.narrativeRole === 'development',
    ),
  );
  const commerceTrace = findTraceWithEvent(traces, 'merchant_year_trade');
  if (commercePairTrace) {
    const prototype = computeSemanticMeasurementPrototype(commercePairTrace.timeline);
    const pair = prototype.adjacentPairEvidence.find(item => item.semanticRepetition && item.previous.annotation.domain === 'commerce');
    lines.push(`B. commerce development cluster（sample=${commercePairTrace.sampleId}, seed=${commercePairTrace.seed}）`);
    lines.push(`事件序列：${pair ? formatEventSequence([pair.previous, pair.current]) : 'none'}`);
    lines.push('domain / role：commerce/development → commerce/development');
    lines.push('prototype 判断：same domain + same role 且无 direct continuity，因此计为 semantic repetition；同时按完整 5-event window 计算 concentration。');
    lines.push('Human 应理解：这是需要继续人工审阅的候选 cluster，不是自动的产品 FAIL。');
  } else if (commerceTrace) {
    const prototype = computeSemanticMeasurementPrototype(commerceTrace.timeline);
    const window = findWindowWithEvent(prototype.shortWindowDomainConcentrationWindows, 'merchant_year_trade');
    const item = commerceTrace.timeline.find(candidate => candidate.eventId === 'merchant_year_trade')!;
    lines.push(`B. commerce 片段（sample=${commerceTrace.sampleId}, seed=${commerceTrace.seed}）`);
    lines.push(`事件序列：${window ? formatEventSequence(window.events) : formatEventSequence([item])}`);
    lines.push(`domain / role：${item.annotation.domain}/${item.annotation.narrativeRole}`);
    lines.push('prototype 判断：当前六条 baseline 未观察到两个连续 commerce/development 的可计分 pair；该窗口仍以完整 5 个正式事件为分母，不能把稀疏标注误读为“没有 commerce cluster”。');
    lines.push('Human 应理解：commerce coverage 目前只能支持局部 calibration，不能推出全产品 commerce 节奏结论。');
  } else {
    lines.push('B. commerce development cluster：NOT_OBSERVED_IN_CURRENT_6_BASELINES');
  }

  const familyTrace = findTraceWithEvent(traces, 'mingyue_early_parenting');
  if (familyTrace) {
    const prototype = computeSemanticMeasurementPrototype(familyTrace.timeline);
    const item = familyTrace.timeline.find(candidate => candidate.eventId === 'mingyue_early_parenting')!;
    const window = findWindowWithEvent(prototype.narrativeRoleWindows, item.eventId);
    lines.push(`C. family / parenthood（sample=${familyTrace.sampleId}, seed=${familyTrace.seed}）`);
    lines.push(`事件序列：${window ? formatEventSequence(window.events) : formatEventSequence([item])}`);
    lines.push(`domain / role：${item.annotation.domain}/${item.annotation.narrativeRole}`);
    lines.push(`prototype 判断：4-event role window stagnant=${window && 'stagnant' in window ? window.stagnant : false}；unknown event 保留在窗口内，没有按 annotated-only window 计算。`);
    lines.push('Human 应理解：family 事件的 development 语义已可见，但单个标注不足以证明家庭路线整体节奏。');
  } else {
    lines.push('C. family / parenthood：NOT_OBSERVED_IN_CURRENT_6_BASELINES');
  }

  const healthTrace = findTraceWithEvent(traces, 'setback_injury');
  if (healthTrace) {
    const prototype = computeSemanticMeasurementPrototype(healthTrace.timeline);
    const item = healthTrace.timeline.find(candidate => candidate.eventId === 'setback_injury')!;
    const window = findWindowWithEvent(prototype.shortWindowDomainConcentrationWindows, item.eventId);
    lines.push(`D. health / setback（sample=${healthTrace.sampleId}, seed=${healthTrace.seed}）`);
    lines.push(`事件序列：${window ? formatEventSequence(window.events) : formatEventSequence([item])}`);
    lines.push(`domain / role：${item.annotation.domain}/${item.annotation.narrativeRole}`);
    lines.push('prototype 判断：health setback 只在显式标注处进入 domain concentration；unknown 仍占 5-event denominator，不能被删掉后抬高 concentration。');
    lines.push('Human 应理解：这是 setback 语义的可追踪证据，不等于 health route 的全量 coverage。');
  } else {
    lines.push('D. health / setback：NOT_OBSERVED_IN_CURRENT_6_BASELINES');
  }

  const martialTrace = findTraceWithEvent(traces, 'martial_arts_enlightenment');
  if (martialTrace) {
    const prototype = computeSemanticMeasurementPrototype(martialTrace.timeline);
    const item = martialTrace.timeline.find(candidate => candidate.eventId === 'martial_arts_enlightenment')!;
    const window = findWindowWithEvent(prototype.narrativeRoleWindows, item.eventId);
    lines.push(`E. martial（sample=${martialTrace.sampleId}, seed=${martialTrace.seed}）`);
    lines.push(`事件序列：${window ? formatEventSequence(window.events) : formatEventSequence([item])}`);
    lines.push(`domain / role：${item.annotation.domain}/${item.annotation.narrativeRole}`);
    lines.push('prototype 判断：武学启蒙是 martial/choice；周围 unknown 保留在 4-event window，因此没有足够 role evidence 时 rate 只表达 partial lower bound。');
    lines.push('Human 应理解：martial 选择语义已被校准，但不能从一条 choice 推出完整武道路节奏。');
  } else {
    lines.push('E. martial：NOT_OBSERVED_IN_CURRENT_6_BASELINES');
  }

  return lines;
}

export function formatCalibrationReport(
  traces: readonly CalibrationTrace[],
  catalogAnchors: readonly CalibrationCatalogAnchor[] = [],
): string {
  const semanticPrototypes = traces.map(trace => formatSemanticPrototype(trace));
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
    'SEMANTIC_MEASUREMENT_PROTOTYPE',
    'Per-trace prototype evidence; no product gate or global score.',
    ...semanticPrototypes.flatMap(lines => ['', ...lines]),
    '',
    'PROTOTYPE_INTERPRETATION_BOUNDARY',
    'REPORT_ONLY',
    'NO_HARD_THRESHOLD',
    'PARTIAL_ANNOTATION',
    'LOWER_BOUND_WHILE_ANNOTATION_IS_PARTIAL',
    'DO_NOT_INTERPRET_AS_GLOBAL_EXPERIENCE_SCORE',
    '',
    'CALIBRATION_DIRECT_CONTINUITY_EVIDENCE',
    ...CALIBRATION_DIRECT_CONTINUITY.map(
      entry => `${entry.fromEventId} -> ${entry.toEventId} | ${entry.evidence}`,
    ),
    '',
    'HUMAN_CALIBRATION_EVIDENCE',
    ...formatHumanCalibrationEvidence(traces),
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
    'Adjacent semantic repetition uses formal timeline adjacency; unknown events remain in pair evidence and are not skipped.',
  ];

  return lines.join('\n') + '\n';
}
