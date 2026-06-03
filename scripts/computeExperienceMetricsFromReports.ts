import { eventLoader } from '../src/core/EventLoader';
import type { GameProcessReport } from '../tests/GameProcessSimulator';
import { detectEventClasses, type EventClass } from './eventRepetitionClassDetection';

export interface TimelineEvent {
  age: number;
  eventId: string;
  title: string;
  classes: EventClass[];
  isDaily: boolean;
  isFamily: boolean;
}

export interface ExperienceDerivedMetrics {
  adjacent_same_event_rate: number | null;
  adjacent_same_class_rate: number | null;
  short_window_same_class_rate: number | null;
  formal_event_ratio: number | null;
  daily_event_ratio: number | null;
  top_event_concentration: number | null;
  family_event_share: number | null;
  route_load_parity: number | null;
  route_stuck_active_rate: number | null;
}

const SHORT_WINDOW_SIZE = 5;

function isDailyRecord(eventId: string): boolean {
  return eventId.startsWith('daily_');
}

function buildTimeline(report: GameProcessReport): TimelineEvent[] {
  const timeline: TimelineEvent[] = [];

  for (const record of report.records) {
      if (
        !record.eventId ||
        record.eventId === 'no_event' ||
        record.progressionKind === 'active_action' ||
        record.eventId.startsWith('active_action:') ||
        record.eventId.startsWith('active_action_')
      ) {
        continue;
      }
      const title = record.eventTitle || record.eventId;
      const definition = eventLoader.getEventById(record.eventId);
      const classes = definition ? detectEventClasses(definition) : [];
      const isFamily = record.eventId.startsWith('family_');
      timeline.push({
        age: record.age,
        eventId: record.eventId,
        title,
        classes,
        isDaily: isDailyRecord(record.eventId),
        isFamily,
      });
  }

  timeline.sort((a, b) => a.age - b.age || a.eventId.localeCompare(b.eventId));
  return timeline;
}

/** 与 repro:event-repetition 一致：仅跟踪 injury/illness/economy 类事件 */
function buildRepetitionTimeline(report: GameProcessReport): TimelineEvent[] {
  return buildTimeline(report).filter(event => event.classes.length > 0);
}

function countCalendarAdjacentPairs(timeline: TimelineEvent[]): number {
  let count = 0;
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].age - timeline[i - 1].age <= 1) {
      count += 1;
    }
  }
  return count;
}

function maxSampleRate(values: Array<number | null>): number | null {
  const numbers = values.filter((value): value is number => value !== null);
  if (numbers.length === 0) {
    return null;
  }
  return Math.max(...numbers);
}

function averageSampleRate(values: Array<number | null>): number | null {
  const numbers = values.filter((value): value is number => value !== null);
  if (numbers.length === 0) {
    return null;
  }
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function computeRepetitionRates(timeline: TimelineEvent[]): Pick<
  ExperienceDerivedMetrics,
  'adjacent_same_event_rate' | 'adjacent_same_class_rate' | 'short_window_same_class_rate'
> {
  if (timeline.length === 0) {
    return {
      adjacent_same_event_rate: 0,
      adjacent_same_class_rate: 0,
      short_window_same_class_rate: 0,
    };
  }

  const adjacentPairs = countCalendarAdjacentPairs(timeline);
  let sameEventCount = 0;
  let sameClassCount = 0;

  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i - 1];
    const current = timeline[i];
    if (current.age - prev.age > 1) {
      continue;
    }
    if (prev.eventId === current.eventId) {
      sameEventCount += 1;
      continue;
    }
    const shared = current.classes.filter(cls => prev.classes.includes(cls));
    if (shared.length > 0) {
      sameClassCount += 1;
    }
  }

  let shortWindowRepeated = 0;
  for (let i = 0; i < timeline.length; i++) {
    const current = timeline[i];
    const windowMinAge = current.age - SHORT_WINDOW_SIZE;
    const recent = timeline.filter(
      event => event.age < current.age && event.age > windowMinAge
    );
    const repeatedInWindow = current.classes.filter(cls =>
      recent.some(event => event.classes.includes(cls))
    );
    if (repeatedInWindow.length > 0) {
      shortWindowRepeated += 1;
    }
  }

  return {
    adjacent_same_event_rate: adjacentPairs > 0 ? sameEventCount / adjacentPairs : 0,
    adjacent_same_class_rate: adjacentPairs > 0 ? sameClassCount / adjacentPairs : 0,
    short_window_same_class_rate: timeline.length > 0 ? shortWindowRepeated / timeline.length : 0,
  };
}

function computeRhythmRates(timeline: TimelineEvent[]): Pick<
  ExperienceDerivedMetrics,
  'formal_event_ratio' | 'daily_event_ratio' | 'family_event_share' | 'top_event_concentration'
> {
  if (timeline.length === 0) {
    return {
      formal_event_ratio: null,
      daily_event_ratio: null,
      family_event_share: null,
      top_event_concentration: null,
    };
  }

  const dailyCount = timeline.filter(event => event.isDaily).length;
  const formalCount = timeline.length - dailyCount;
  const familyCount = timeline.filter(event => event.isFamily).length;

  const frequency = new Map<string, number>();
  for (const event of timeline) {
    frequency.set(event.eventId, (frequency.get(event.eventId) || 0) + 1);
  }
  const topCount = Math.max(...frequency.values());

  return {
    formal_event_ratio: formalCount / timeline.length,
    daily_event_ratio: dailyCount / timeline.length,
    family_event_share: familyCount / timeline.length,
    top_event_concentration: topCount / timeline.length,
  };
}

function computeRouteDerivedMetrics(reports: GameProcessReport[]): Pick<
  ExperienceDerivedMetrics,
  'route_load_parity' | 'route_stuck_active_rate'
> {
  const missingImports = eventLoader.getUndeclaredImportPaths();
  const routeLoadParity = missingImports.length === 0 ? 1 : 0;

  let started = 0;
  let stuckActive = 0;
  for (const report of reports) {
    const finalState = report.records.length > 0 ? report.records[report.records.length - 1].gameState : null;
    const routeStates = finalState?.routeStates || {};
    for (const routeState of Object.values(routeStates)) {
      if (!routeState || routeState.lifecycle === 'inactive') {
        continue;
      }
      started += 1;
      if (routeState.lifecycle === 'active') {
        stuckActive += 1;
      }
    }
  }

  return {
    route_load_parity: routeLoadParity,
    route_stuck_active_rate: started > 0 ? stuckActive / started : null,
  };
}

export function computeExperienceDerivedMetrics(
  reports: GameProcessReport[],
): ExperienceDerivedMetrics {
  const repetitionBySample = reports.map(report => computeRepetitionRates(buildRepetitionTimeline(report)));
  const rhythmBySample = reports.map(report => computeRhythmRates(buildTimeline(report)));

  return {
    adjacent_same_event_rate: maxSampleRate(repetitionBySample.map(sample => sample.adjacent_same_event_rate)),
    adjacent_same_class_rate: maxSampleRate(repetitionBySample.map(sample => sample.adjacent_same_class_rate)),
    short_window_same_class_rate: maxSampleRate(
      repetitionBySample.map(sample => sample.short_window_same_class_rate)
    ),
    formal_event_ratio: averageSampleRate(rhythmBySample.map(sample => sample.formal_event_ratio)),
    daily_event_ratio: averageSampleRate(rhythmBySample.map(sample => sample.daily_event_ratio)),
    top_event_concentration: maxSampleRate(rhythmBySample.map(sample => sample.top_event_concentration)),
    family_event_share: averageSampleRate(rhythmBySample.map(sample => sample.family_event_share)),
    ...computeRouteDerivedMetrics(reports),
  };
}
