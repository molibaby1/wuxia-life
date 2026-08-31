import assert from 'node:assert/strict';
import type { EventDefinition } from '../src/types/eventTypes';
import type { GameProcessReport, GameProcessRecord } from '../src/types/simulationRecordTypes';
import { eventLoader } from '../src/core/EventLoader';
import {
  buildFormalEventTimeline,
  formatCalibrationReport,
  getCalibrationAnnotation,
  type FormalEventTimelineItem,
} from '../scripts/experienceMeasurementCalibration';
import { detectEventClasses } from '../scripts/eventRepetitionClassDetection';

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
    record('daily_unresolved', 21),
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

function testExplicitSemanticCalibrationSample(): void {
  assert.deepEqual(getCalibrationAnnotation('mingyue_market_meet'), {
    domain: 'relationship',
    narrativeRole: 'setup',
  });
  assert.deepEqual(getCalibrationAnnotation('mingyue_second_encounter'), {
    domain: 'relationship',
    narrativeRole: 'development',
  });
  assert.deepEqual(getCalibrationAnnotation('mingyue_value_conflict'), {
    domain: 'relationship',
    narrativeRole: 'conflict',
  });
  assert.deepEqual(getCalibrationAnnotation('mingyue_echo_romantic'), {
    domain: 'relationship',
    narrativeRole: 'payoff_echo',
  });
  assert.deepEqual(getCalibrationAnnotation('mingyue_early_parenting'), {
    domain: 'family',
    narrativeRole: 'development',
  });
  assert.deepEqual(getCalibrationAnnotation('merchant_year_trade'), {
    domain: 'commerce',
    narrativeRole: 'development',
  });
  assert.deepEqual(getCalibrationAnnotation('merchant_year_crisis'), {
    domain: 'commerce',
    narrativeRole: 'conflict',
  });
  assert.deepEqual(getCalibrationAnnotation('setback_injury'), {
    domain: 'health',
    narrativeRole: 'conflict',
  });
  assert.deepEqual(getCalibrationAnnotation('setback_illness'), {
    domain: 'health',
    narrativeRole: 'conflict',
  });
  assert.deepEqual(getCalibrationAnnotation('martial_arts_enlightenment'), {
    domain: 'martial',
    narrativeRole: 'choice',
  });
  assert.deepEqual(getCalibrationAnnotation('official_entry'), {
    domain: 'official',
    narrativeRole: 'choice',
  });
  assert.deepEqual(getCalibrationAnnotation('not_in_calibration_sample'), {
    domain: 'unknown',
    narrativeRole: 'unknown',
  });

  const mingyue = eventLoader.getEventById('mingyue_market_meet');
  assert.ok(mingyue);
  assert.ok(detectEventClasses(mingyue).includes('economy'));
  assert.equal(getCalibrationAnnotation('mingyue_market_meet').domain, 'relationship');

  const parenting = eventLoader.getEventById('mingyue_early_parenting');
  assert.ok(parenting);
  assert.equal(getCalibrationAnnotation('mingyue_early_parenting').domain, 'family');

  const martial = eventLoader.getEventById('martial_arts_enlightenment');
  assert.equal(martial?.content.title, '武学启蒙');
  assert.equal(martial?.eventType, 'choice');

  const official = eventLoader.getEventById('official_entry');
  assert.equal(official?.content.title, '入仕机会');
  assert.equal(official?.eventType, 'choice');
  assert.deepEqual(
    official?.choices?.map(choice => choice.text),
    ['应试入仕', '婉拒仕途'],
  );
}

testExplicitSemanticCalibrationSample();

function testCalibrationReportSeparatesCoverageViews(): void {
  const timeline: FormalEventTimelineItem[] = [
    {
      age: 6,
      eventId: 'martial_arts_enlightenment',
      title: '武学启蒙',
      eventType: 'choice',
      progressionKind: null,
      legacyClasses: [],
      annotation: { domain: 'martial', narrativeRole: 'choice' },
    },
    {
      age: 15,
      eventId: 'mingyue_market_meet',
      title: '市集上的账簿',
      eventType: 'choice',
      progressionKind: null,
      legacyClasses: ['economy'],
      annotation: { domain: 'relationship', narrativeRole: 'setup' },
    },
    {
      age: 28,
      eventId: 'merchant_year_trade',
      title: '远行贸易',
      eventType: 'auto',
      progressionKind: null,
      legacyClasses: ['economy'],
      annotation: { domain: 'commerce', narrativeRole: 'development' },
    },
    {
      age: 30,
      eventId: 'mingyue_early_parenting',
      title: '重新安排孩子出生后的日常',
      eventType: 'choice',
      progressionKind: null,
      legacyClasses: ['economy'],
      annotation: { domain: 'family', narrativeRole: 'development' },
    },
    {
      age: 62,
      eventId: 'setback_illness',
      title: '大病一场',
      eventType: 'auto',
      progressionKind: null,
      legacyClasses: ['illness'],
      annotation: { domain: 'health', narrativeRole: 'conflict' },
    },
    {
      age: 40,
      eventId: 'formal_unannotated',
      title: '未标注正式事件',
      eventType: 'auto',
      progressionKind: null,
      legacyClasses: [],
      annotation: { domain: 'unknown', narrativeRole: 'unknown' },
    },
  ];

  const output = formatCalibrationReport(
    [{ sampleId: 'sample-a', seed: 11, routeTrack: undefined, timeline }],
    [{
      eventId: 'official_entry',
      title: '入仕机会',
      annotation: { domain: 'official', narrativeRole: 'choice' },
    }],
  );

  assert.match(output, /TRACE_OBSERVED_DOMAINS: relationship, family, commerce, martial, health/);
  assert.match(output, /CATALOG_ONLY_CALIBRATION_DOMAINS: official/);
  assert.match(output, /NOT_OBSERVED_DOMAINS: identity/);
  assert.match(output, /official trace coverage: NOT_OBSERVED_IN_CURRENT_6_BASELINES/);
  assert.match(output, /FULL_FORMAL_TIMELINE/);
  assert.match(output, /LEGACY_CLASS_POSITIVE_TIMELINE/);
  assert.match(output, /SEMANTIC_CALIBRATION_VIEW/);
  assert.match(output, /unknown/);
  assert.match(output, /official_entry \| 入仕机会 \| official \| choice/);
}

testCalibrationReportSeparatesCoverageViews();
console.log('experienceMeasurementCalibration: PASS');
