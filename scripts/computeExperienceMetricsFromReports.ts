import type { GameProcessReport } from '../src/types/simulationRecordTypes';

export interface TimelineEvent {
  age: number;
  eventId: string;
  title: string;
  isDaily: boolean;
  isFamily: boolean;
}

export interface ExperienceDerivedMetrics {
  adjacent_same_event_rate: number | null;
  formal_event_ratio: number | null;
  daily_event_ratio: number | null;
  top_event_concentration: number | null;
  family_event_share: number | null;
}

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
      const isFamily = record.eventId.startsWith('family_');
      timeline.push({
        age: record.age,
        eventId: record.eventId,
        title,
        isDaily: isDailyRecord(record.eventId),
        isFamily,
      });
  }

  timeline.sort((a, b) => a.age - b.age || a.eventId.localeCompare(b.eventId));
  return timeline;
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

function computeAdjacentSameEventRate(
  timeline: TimelineEvent[],
): Pick<ExperienceDerivedMetrics, 'adjacent_same_event_rate'> {
  if (timeline.length === 0) {
    return { adjacent_same_event_rate: 0 };
  }

  const adjacentPairs = countCalendarAdjacentPairs(timeline);
  let sameEventCount = 0;

  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i - 1];
    const current = timeline[i];
    if (current.age - prev.age > 1) {
      continue;
    }
    if (prev.eventId === current.eventId) {
      sameEventCount += 1;
    }
  }

  return { adjacent_same_event_rate: adjacentPairs > 0 ? sameEventCount / adjacentPairs : 0 };
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

export function computeExperienceDerivedMetrics(
  reports: GameProcessReport[],
): ExperienceDerivedMetrics {
  const adjacentSameEventBySample = reports.map(report => computeAdjacentSameEventRate(buildTimeline(report)));
  const rhythmBySample = reports.map(report => computeRhythmRates(buildTimeline(report)));

  return {
    adjacent_same_event_rate: maxSampleRate(
      adjacentSameEventBySample.map(sample => sample.adjacent_same_event_rate),
    ),
    formal_event_ratio: averageSampleRate(rhythmBySample.map(sample => sample.formal_event_ratio)),
    daily_event_ratio: averageSampleRate(rhythmBySample.map(sample => sample.daily_event_ratio)),
    top_event_concentration: maxSampleRate(rhythmBySample.map(sample => sample.top_event_concentration)),
    family_event_share: averageSampleRate(rhythmBySample.map(sample => sample.family_event_share)),
  };
}
