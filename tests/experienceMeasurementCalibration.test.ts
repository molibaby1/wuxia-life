import assert from 'node:assert/strict';
import type { EventDefinition } from '../src/types/eventTypes';
import type { GameProcessReport, GameProcessRecord } from '../src/types/simulationRecordTypes';
import { buildFormalEventTimeline } from '../scripts/experienceMeasurementCalibration';

function event(id: string, overrides: Partial<EventDefinition> = {}): EventDefinition {
  return {
    id,
    category: 'test',
    type: 'auto',
    eventType: 'auto',
    content: {
      title: id,
      description: '',
    },
    ...overrides,
  } as EventDefinition;
}

function record(eventId: string, age: number, overrides: Partial<GameProcessRecord> = {}): GameProcessRecord {
  return {
    age,
    eventId,
    eventTitle: eventId,
    eventType: 'auto',
    gameState: {} as GameProcessRecord['gameState'],
    timestamp: `2026-01-${String(age).padStart(2, '0')}T00:00:00.000Z`,
    ...overrides,
  };
}

function report(records: GameProcessRecord[]): GameProcessReport {
  return { records } as GameProcessReport;
}

function testFullTimelineKeepsUnannotatedFormalEvents(): void {
  const definitions = new Map([
    ['formal_classified', event('formal_classified', { category: 'economy' })],
    ['formal_unannotated', event('formal_unannotated', { category: 'relationship' })],
  ]);

  const timeline = buildFormalEventTimeline(report([
    record('formal_classified', 20),
    record('no_event', 21),
    record('planned_training', 22, { progressionKind: 'active_action' }),
    record('active_action:planned_training', 23),
    record('formal_unannotated', 24),
  ]), eventId => definitions.get(eventId));

  assert.deepEqual(
    timeline.map(item => item.eventId),
    ['formal_classified', 'formal_unannotated'],
  );
  assert.equal(
    timeline.find(item => item.eventId === 'formal_unannotated')?.annotation.domain,
    'unknown',
  );

  const legacyClassPositiveTimeline = timeline.filter(item => item.legacyClasses.length > 0);
  assert.ok(
    timeline.length > legacyClassPositiveTimeline.length,
    'full formal timeline must include events omitted by the legacy class-positive view',
  );
  assert.equal(
    legacyClassPositiveTimeline.some(item => item.eventId === 'formal_unannotated'),
    false,
  );
}

testFullTimelineKeepsUnannotatedFormalEvents();
console.log('experienceMeasurementCalibration: PASS');
