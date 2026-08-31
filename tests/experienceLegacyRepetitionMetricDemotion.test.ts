import assert from 'node:assert/strict';
import type { GameProcessReport, GameProcessRecord } from '../src/types/simulationRecordTypes';
import {
  evaluateExperienceHealthGate,
  type ExperienceHealthMetricEvaluation,
} from '../scripts/experienceHealthGate';
import { EXPERIENCE_HEALTH_METRIC_DEFINITIONS } from '../scripts/experienceHealthMetricDefinitions';

function record(eventId: string, age: number): GameProcessRecord {
  return {
    age,
    eventId,
    eventTitle: eventId,
    eventType: age === 20 ? 'choice' : 'auto',
    gameState: {} as GameProcessRecord['gameState'],
    timestamp: `2026-01-${String(age).padStart(2, '0')}T00:00:00.000Z`,
  };
}

function report(id: string, endingSummary: string): GameProcessReport {
  return {
    id,
    timestamp: '2026-01-01T00:00:00.000Z',
    config: {} as GameProcessReport['config'],
    randomSeed: Number(id.slice(-1)),
    runMode: 'complete_life',
    ageRange: null,
    totalYears: 2,
    finalAge: 21,
    isAlive: true,
    deathReason: null,
    totalEvents: 2,
    totalChoices: 1,
    totalSaves: 0,
    totalLoads: 0,
    persistenceConsistency: {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      results: [],
    },
    records: [record('merchant_year_trade', 20), record('merchant_year_crisis', 21)],
    statistics: {
      childhoodEvents: 0,
      youthEvents: 0,
      adultEvents: 2,
      elderlyEvents: 0,
      autoEvents: 1,
      choiceEvents: 1,
      martialPowerGrowth: 0,
      sectJoined: null,
      endingSummary,
    },
  };
}

function findMetric(
  gate: ReturnType<typeof evaluateExperienceHealthGate>,
  key: 'adjacent_same_class_rate' | 'short_window_same_class_rate',
): ExperienceHealthMetricEvaluation {
  const metric = [...gate.blockingMetrics, ...gate.warningMetrics, ...gate.infoMetrics]
    .find(item => item.key === key);
  assert.ok(metric, `${key} must remain visible in the gate diagnostics`);
  return metric;
}

function testLegacyRepetitionMetricsAreDiagnosticOnly(): void {
  const gate = evaluateExperienceHealthGate([
    report('sample-1', 'ending-a'),
    report('sample-2', 'ending-b'),
  ]);

  assert.equal(gate.derivedMetrics.adjacent_same_class_rate, 1);
  assert.equal(gate.derivedMetrics.short_window_same_class_rate, 0.5);
  assert.equal(gate.decision, 'pass');

  for (const key of ['adjacent_same_class_rate', 'short_window_same_class_rate'] as const) {
    const metric = findMetric(gate, key);
    assert.equal(metric.severity, 'info');
    assert.equal(metric.status, 'pass');
    assert.equal(metric.nonWaivable, false);
  }

  const definitions = new Map(EXPERIENCE_HEALTH_METRIC_DEFINITIONS.map(definition => [definition.key, definition]));
  for (const key of ['adjacent_same_class_rate', 'short_window_same_class_rate'] as const) {
    const definition = definitions.get(key);
    assert.ok(definition);
    assert.match(definition.description, /deprecated/i);
    assert.match(definition.description, /legacy diagnostic/i);
    assert.match(definition.description, /class-positive/i);
    assert.match(definition.description, /产品证据/);
  }
}

testLegacyRepetitionMetricsAreDiagnosticOnly();
console.log('experienceLegacyRepetitionMetricDemotion: PASS');
