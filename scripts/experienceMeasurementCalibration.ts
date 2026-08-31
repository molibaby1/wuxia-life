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

const UNKNOWN_ANNOTATION: CalibrationAnnotation = Object.freeze({
  domain: 'unknown',
  narrativeRole: 'unknown',
});

const CALIBRATION_ANNOTATIONS: Readonly<Record<string, CalibrationAnnotation>> = Object.freeze({});

export function getCalibrationAnnotation(eventId: string): CalibrationAnnotation {
  return CALIBRATION_ANNOTATIONS[eventId] ?? UNKNOWN_ANNOTATION;
}

function isTechnicalRecord(eventId: string, progressionKind?: string): boolean {
  return (
    !eventId ||
    eventId === 'no_event' ||
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
