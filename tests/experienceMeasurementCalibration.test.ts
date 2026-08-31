import assert from 'node:assert/strict';
import type { EventDefinition } from '../src/types/eventTypes';
import type { GameProcessReport, GameProcessRecord } from '../src/types/simulationRecordTypes';
import { eventLoader } from '../src/core/EventLoader';
import {
  buildFormalEventTimeline,
  CALIBRATION_DIRECT_CONTINUITY,
  computeSemanticMeasurementPrototype,
  formatCalibrationReport,
  getCalibrationAnnotation,
  isSemanticRepetitionPair,
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

function semanticItem(
  eventId: string,
  age: number,
  domain: FormalEventTimelineItem['annotation']['domain'],
  narrativeRole: FormalEventTimelineItem['annotation']['narrativeRole'],
): FormalEventTimelineItem {
  return {
    age,
    eventId,
    title: eventId,
    eventType: 'auto',
    progressionKind: null,
    legacyClasses: [],
    annotation: { domain, narrativeRole },
  };
}

function testSemanticPrototypeUsesFormalAdjacencyAndScorableDenominators(): void {
  const prototype = computeSemanticMeasurementPrototype([
    semanticItem('commerce_a', 20, 'commerce', 'development'),
    semanticItem('commerce_b', 25, 'commerce', 'conflict'),
  ]);

  assert.equal(prototype.adjacentScorablePairCount, 1);
  assert.equal(prototype.adjacentUnscorablePairCount, 0);
  assert.equal(prototype.adjacentSemanticRepetitionCount, 0);
  assert.equal(prototype.adjacentSemanticRepetitionRate, 0);
  assert.deepEqual(prototype.annotatedEventCoverage, {
    annotatedEventCount: 2,
    formalEventCount: 2,
    rate: 1,
  });
  assert.deepEqual(
    prototype.adjacentPairEvidence.map(pair => [pair.previous.eventId, pair.current.eventId]),
    [['commerce_a', 'commerce_b']],
  );
}

testSemanticPrototypeUsesFormalAdjacencyAndScorableDenominators();

function testSemanticPrototypeDistinguishesRoleAndContinuity(): void {
  const differentRole = computeSemanticMeasurementPrototype([
    semanticItem('relationship_setup', 20, 'relationship', 'setup'),
    semanticItem('relationship_development', 21, 'relationship', 'development'),
  ]);
  assert.equal(differentRole.adjacentSemanticRepetitionCount, 0);

  const sameRole = computeSemanticMeasurementPrototype([
    semanticItem('commerce_development_a', 20, 'commerce', 'development'),
    semanticItem('commerce_development_b', 21, 'commerce', 'development'),
  ]);
  assert.equal(sameRole.adjacentSemanticRepetitionCount, 1);
  assert.equal(sameRole.adjacentSemanticRepetitionRate, 1);

  assert.equal(
    isSemanticRepetitionPair(
      semanticItem('continuity_a', 20, 'relationship', 'development'),
      semanticItem('continuity_b', 21, 'relationship', 'development'),
      true,
    ),
    false,
  );
  assert.ok(CALIBRATION_DIRECT_CONTINUITY.length > 0);
  assert.match(CALIBRATION_DIRECT_CONTINUITY[0].evidence, /condition|sets|requires/);

  const liveContinuity = computeSemanticMeasurementPrototype([
    semanticItem('mingyue_market_meet', 20, 'relationship', 'setup'),
    semanticItem('mingyue_second_encounter', 21, 'relationship', 'development'),
  ]);
  assert.equal(liveContinuity.adjacentPairEvidence[0].knownDirectCausalContinuity, true);
  assert.equal(liveContinuity.adjacentPairEvidence[0].semanticRepetition, false);
}

testSemanticPrototypeDistinguishesRoleAndContinuity();

function testSemanticPrototypeDoesNotSkipUnknownEvents(): void {
  const prototype = computeSemanticMeasurementPrototype([
    semanticItem('commerce_before_unknown', 20, 'commerce', 'development'),
    semanticItem('unknown_formal_event', 21, 'unknown', 'unknown'),
    semanticItem('commerce_after_unknown', 22, 'commerce', 'development'),
  ]);

  assert.equal(prototype.adjacentScorablePairCount, 0);
  assert.equal(prototype.adjacentUnscorablePairCount, 2);
  assert.equal(prototype.adjacentSemanticRepetitionCount, 0);
  assert.deepEqual(
    prototype.adjacentPairEvidence.map(pair => [pair.previous.eventId, pair.current.eventId]),
    [
      ['commerce_before_unknown', 'unknown_formal_event'],
      ['unknown_formal_event', 'commerce_after_unknown'],
    ],
  );
}

testSemanticPrototypeDoesNotSkipUnknownEvents();

function testDomainConcentrationKeepsFiveFormalEventsInDenominator(): void {
  const prototype = computeSemanticMeasurementPrototype([
    semanticItem('relationship_1', 20, 'relationship', 'setup'),
    semanticItem('relationship_2', 21, 'relationship', 'development'),
    semanticItem('unknown_3', 22, 'unknown', 'unknown'),
    semanticItem('commerce_4', 23, 'commerce', 'development'),
    semanticItem('relationship_5', 24, 'relationship', 'conflict'),
  ]);

  assert.equal(prototype.shortWindowDomainConcentration, 0.6);
  assert.equal(prototype.shortWindowDomainConcentrationWindow?.concentration, 0.6);
  assert.equal(prototype.shortWindowDomainConcentrationWindow?.dominantDomain, 'relationship');
  assert.equal(prototype.shortWindowDomainConcentrationWindow?.knownAnnotationCount, 4);
  assert.equal(prototype.shortWindowDomainConcentrationWindow?.events.length, 5);
}

testDomainConcentrationKeepsFiveFormalEventsInDenominator();

function testRoleStagnationKeepsUnknownEventsInFourEventWindows(): void {
  const stagnant = computeSemanticMeasurementPrototype([
    semanticItem('development_1', 20, 'commerce', 'development'),
    semanticItem('development_2', 21, 'commerce', 'development'),
    semanticItem('unknown_3', 22, 'unknown', 'unknown'),
    semanticItem('development_4', 23, 'commerce', 'development'),
  ]);
  assert.equal(stagnant.narrativeRoleStagnantWindowCount, 1);
  assert.equal(stagnant.narrativeRoleWindowCount, 1);
  assert.equal(stagnant.narrativeRoleStagnationRate, 1);

  const varied = computeSemanticMeasurementPrototype([
    semanticItem('development_1', 20, 'commerce', 'development'),
    semanticItem('unknown_2', 21, 'unknown', 'unknown'),
    semanticItem('conflict_3', 22, 'commerce', 'conflict'),
    semanticItem('development_4', 23, 'commerce', 'development'),
  ]);
  assert.equal(varied.narrativeRoleStagnantWindowCount, 0);
  assert.equal(varied.narrativeRoleWindowCount, 1);
  assert.equal(varied.narrativeRoleStagnationRate, 0);
}

testRoleStagnationKeepsUnknownEventsInFourEventWindows();

function testSemanticPrototypeReportIsReportOnly(): void {
  const timeline = [
    semanticItem('commerce_a', 20, 'commerce', 'development'),
    semanticItem('commerce_b', 21, 'commerce', 'development'),
    semanticItem('unknown_c', 22, 'unknown', 'unknown'),
    semanticItem('commerce_d', 23, 'commerce', 'conflict'),
    semanticItem('commerce_e', 24, 'commerce', 'development'),
  ];
  const prototype = computeSemanticMeasurementPrototype(timeline);
  const output = formatCalibrationReport([
    { sampleId: 'prototype-sample', seed: 1, timeline },
  ]);

  assert.equal('threshold' in prototype, false);
  assert.equal('severity' in prototype, false);
  assert.match(output, /SEMANTIC_MEASUREMENT_PROTOTYPE/);
  assert.match(output, /annotation coverage: 4\/5/);
  assert.match(output, /scorable_pairs=2 \| unscorable_pairs=2/);
  assert.match(output, /REPORT_ONLY/);
  assert.match(output, /NO_HARD_THRESHOLD/);
  assert.match(output, /PARTIAL_ANNOTATION/);
  assert.match(output, /DO_NOT_INTERPRET_AS_GLOBAL_EXPERIENCE_SCORE/);
  assert.match(output, /CALIBRATION_DIRECT_CONTINUITY_EVIDENCE/);
  assert.match(output, /mingyue_market_meet -> mingyue_second_encounter/);
  assert.match(output, /HUMAN_CALIBRATION_EVIDENCE/);
}

testSemanticPrototypeReportIsReportOnly();
console.log('experienceMeasurementCalibration: PASS');
