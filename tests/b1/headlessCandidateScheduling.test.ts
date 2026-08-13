import { strict as assert } from 'node:assert';
import { createWeightOverlayRuntimeCatalog } from '../../src/core/WeightOverlayRuntimeCatalog';
import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog';
import { EventCategory, EventPriority, type EventDefinition } from '../../src/types/eventTypes';
import { captureCatalogSnapshot } from '../../scripts/b1/catalogSnapshot';
import { runB10 } from '../../scripts/b1/runB10';
import type { WeightOverlay } from '../../scripts/b1/types';

const persona = {
  id: 'b1-scheduling-persona',
  name: 'Scheduling Tester',
  gender: 'male' as const,
  seed: 7,
  strategy: 'balanced' as const,
  strategySummary: 'B1 scheduling probe',
  routePreference: 'none' as const,
  riskPreference: 'medium' as const,
  relationshipPreference: 'medium' as const,
  choiceTendency: 'balanced' as const,
  shortTermGoals: [],
};

function event(id: string, weight: number): EventDefinition {
  return {
    id,
    version: '1.0.0',
    category: EventCategory.SIDE_QUEST,
    priority: EventPriority.NORMAL,
    weight,
    ageRange: { min: 0, max: 0 },
    triggers: [],
    maxTriggers: 999,
    eventType: 'auto',
    content: { title: id, text: id },
    metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags: [] },
  };
}

function catalog(events: EventDefinition[]): RuntimeEventCatalog {
  return {
    getAllEvents: () => events,
    getEventsByAge: age => age === 0 ? events : [],
    getEventById: id => events.find(candidate => candidate.id === id),
    getWeightForAge: candidate => candidate.weight,
  };
}

export async function runHeadlessCandidateSchedulingTests(): Promise<void> {
  const testRunId = `headless-candidate-scheduling-${Date.now()}`;
  const baseCatalog = catalog([
    event('b1_weight_control', 10),
    event('b1_weight_target', 10),
  ]);
  const overlay: WeightOverlay = {
    schemaVersion: 'b1-weight-overlay-v1',
    baseCatalogHash: captureCatalogSnapshot(baseCatalog).baseCatalogHash,
    patches: [{ eventId: 'b1_weight_target', baselineWeight: 10, candidateWeight: 12 }],
  };
  const expectedCandidateCatalog = createWeightOverlayRuntimeCatalog(baseCatalog, overlay);

  const first = await runB10({
    runId: `${testRunId}-first`,
    outRoot: '.tmp/b1-tests',
    persona,
    endAge: 1,
    seed: persona.seed,
    baseCatalog,
    overlay,
    maxSteps: 96,
  });
  const second = await runB10({
    runId: `${testRunId}-second`,
    outRoot: '.tmp/b1-tests',
    persona,
    endAge: 1,
    seed: persona.seed,
    baseCatalog,
    overlay,
    maxSteps: 96,
  });

  assert.equal(first.terminalVerdict, 'awaiting_human');
  assert.notEqual(first.baseline.catalogHash, first.candidate.catalogHash, 'candidate catalog must differ from baseline');
  assert.notEqual(first.baseline.runtimeCatalog, first.candidate.runtimeCatalog, 'arms must use independent catalog objects');
  assert.equal(first.candidate.runtimeCatalog.getEventById('b1_weight_target')?.weight, 12);
  assert.equal(first.baseline.runtimeCatalog.getEventById('b1_weight_target')?.weight, 10);
  assert.equal(expectedCandidateCatalog.getEventById('b1_weight_target')?.weight, 12);

  assert.notDeepEqual(
    first.baseline.scheduling.eventCounts,
    first.candidate.scheduling.eventCounts,
    'changing only a permitted weight must change the real Headless selection distribution',
  );
  assert.equal(
    first.candidate.scheduling.totalSelections,
    first.candidate.metrics.agency.storyEventCount,
    'runner records and metrics must classify the same selected candidate events',
  );
  assert.equal(
    first.candidate.scheduling.eventCounts.b1_weight_target,
    first.candidate.rawTrace.records.filter(record => record.eventId === 'b1_weight_target').length,
    'engine-selected candidate events must be preserved in runner history',
  );
  assert.equal(first.baseline.rawTraceHash, second.baseline.rawTraceHash, 'baseline raw trace must reproduce');
  assert.equal(first.baseline.visibleTraceHash, second.baseline.visibleTraceHash, 'baseline visible trace must reproduce');
  assert.equal(first.baseline.metricHash, second.baseline.metricHash, 'baseline metrics must reproduce');
  assert.equal(first.baseline.finalStateHash, second.baseline.finalStateHash, 'baseline final state must reproduce');
  assert.equal(first.candidate.rawTraceHash, second.candidate.rawTraceHash, 'candidate raw trace must reproduce');
  assert.equal(first.candidate.visibleTraceHash, second.candidate.visibleTraceHash, 'candidate visible trace must reproduce');
  assert.equal(first.candidate.metricHash, second.candidate.metricHash, 'candidate metrics must reproduce');
  assert.equal(first.candidate.finalStateHash, second.candidate.finalStateHash, 'candidate final state must reproduce');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHeadlessCandidateSchedulingTests()
    .then(() => console.log('headlessCandidateScheduling.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}
