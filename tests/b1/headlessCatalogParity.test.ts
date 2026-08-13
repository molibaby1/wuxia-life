import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog';
import { InMemoryEventCatalogAdapter } from '../../src/headless/catalog/InMemoryEventCatalogAdapter';
import { runHeadlessPersona } from '../../src/headless/playability/headlessPersonaRunner';
import type { P8Persona } from '../../src/p8/types';
import { EventCategory, EventPriority, type EventDefinition } from '../../src/types/eventTypes';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const catalogEvent: EventDefinition = {
  id: 'b1_runtime_catalog_only_event',
  version: '1.0.0',
  category: EventCategory.MAIN_STORY,
  priority: EventPriority.CRITICAL,
  weight: 1,
  ageRange: { min: 0, max: 0 },
  triggers: [],
  maxTriggers: 1,
  eventType: 'auto',
  content: { title: 'Runtime catalog event', text: 'Only the injected runtime catalog contains this event.' },
  metadata: { createdAt: 0, updatedAt: 0, enabled: true, tags: ['mandatory', '主线'] },
};

const runtimeCatalog: RuntimeEventCatalog = {
  getAllEvents: () => [catalogEvent],
  getEventsByAge: age => age === 0 ? [catalogEvent] : [],
  getEventById: id => id === catalogEvent.id ? catalogEvent : undefined,
  getWeightForAge: () => 1,
};

const persona: P8Persona = {
  id: 'b1-runtime-catalog-persona',
  name: 'Catalog Tester',
  gender: 'male',
  seed: 7,
  strategy: 'balanced',
  strategySummary: 'test',
  routePreference: 'none',
  riskPreference: 'medium',
  relationshipPreference: 'medium',
  choiceTendency: 'balanced',
  shortTermGoals: [],
};

export async function runHeadlessCatalogParityTests(): Promise<void> {
  const apiCatalog = new InMemoryEventCatalogAdapter(runtimeCatalog);
  const session = HeadlessEngineSessionImpl.create(
    { playerName: persona.name, gender: persona.gender, catalogVersion: '1.0.0', randomSeed: persona.seed },
    {
      catalog: apiCatalog,
      runtimeCatalog,
    } as Partial<HeadlessSessionDependencies>,
  );

  const next = await session.getNextEvent();
  assert(next?.eventId === catalogEvent.id, 'session engine selects the injected runtime catalog event');
  assert(
    session.dependencies.runtimeCatalog === runtimeCatalog,
    'session exposes the injected runtime catalog dependency',
  );
  assert(
    session.dependencies.catalog.getEventById(catalogEvent.id).id === catalogEvent.id,
    'session API reads share the injected runtime catalog source',
  );

  const replaySession = HeadlessEngineSessionImpl.createForReplay(
    { catalogVersion: '1.0.0', randomSeed: persona.seed },
    { catalog: apiCatalog, runtimeCatalog },
  );
  const replayNext = await replaySession.getNextEvent();
  assert(replayNext?.eventId === catalogEvent.id, 'replay session engine selects the injected runtime catalog event');

  const result = await runHeadlessPersona({
    persona,
    endAge: 1,
    catalogVersion: '1.0.0',
    maxSteps: 64,
    runtimeCatalog,
  });
  assert(
    result.records.some(record => record.eventId === catalogEvent.id),
    'persona runner records events defined only in the injected runtime catalog',
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runHeadlessCatalogParityTests()
    .then(() => console.log('headlessCatalogParity.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
}
