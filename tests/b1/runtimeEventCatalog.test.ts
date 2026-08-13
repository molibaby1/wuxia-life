import { eventLoader } from '../../src/core/EventLoader';
import { createDefaultRuntimeEventCatalog } from '../../src/core/EventLoaderRuntimeCatalog';
import { GameEngineIntegration } from '../../src/core/GameEngineIntegration';
import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog';
import { createDefaultInMemoryCatalogAdapter } from '../../src/headless/catalog/InMemoryEventCatalogAdapter';
import { EventCategory, EventPriority, type EventDefinition } from '../../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertSameIds(actual: readonly { id: string }[], expected: readonly { id: string }[], message: string): void {
  assert(actual.length === expected.length, `${message}: count`);
  assert(actual.map(event => event.id).join(',') === expected.map(event => event.id).join(','), `${message}: IDs`);
}

function createCatalogEvent(
  id: string,
  triggers: EventDefinition['triggers'] = [],
): EventDefinition {
  return {
    id,
    version: '1.0.0',
    category: EventCategory.SIDE_QUEST,
    priority: EventPriority.NORMAL,
    weight: 1,
    ageRange: { min: 18, max: 18 },
    triggers,
    maxTriggers: 2,
    eventType: 'auto',
    content: { text: id, title: id },
    metadata: {
      createdAt: 0,
      updatedAt: 0,
      enabled: true,
      tags: ['injury'],
    },
  };
}

function verifyInjectedCatalogDrivesEveryEngineRead(): void {
  const regularEvent = createCatalogEvent('catalog_regular_event');
  const feedbackEvent = createCatalogEvent('catalog_feedback_event', [
    { type: 'flag_set', flagName: 'catalog_feedback' },
  ]);
  const events = [regularEvent, feedbackEvent];
  const calls = {
    getAllEvents: 0,
    getEventsByAge: 0,
    getEventById: 0,
    getWeightForAge: 0,
  };
  const catalog: RuntimeEventCatalog = {
    getAllEvents: () => {
      calls.getAllEvents += 1;
      return events;
    },
    getEventsByAge: age => {
      calls.getEventsByAge += 1;
      return age === 18 ? events : [];
    },
    getEventById: id => {
      calls.getEventById += 1;
      return events.find(event => event.id === id);
    },
    getWeightForAge: event => {
      calls.getWeightForAge += 1;
      return event.id === feedbackEvent.id ? 10 : 1;
    },
  };

  const engine = new GameEngineIntegration(catalog);
  const state = engine.getGameState();
  state.player.age = 18;
  state.eventHistory = [{ eventId: regularEvent.id, age: 15 }];

  assertSameIds(engine.getAvailableEvents(18), events, 'injected catalog supplies available events');
  assert(calls.getEventsByAge > 0, 'available event lookup reads injected catalog');

  const selected = engine.selectEvent(18);
  assert(selected?.id === regularEvent.id || selected?.id === feedbackEvent.id, 'weighted selection returns an injected event');
  assert(calls.getWeightForAge > 0, 'weighted selection reads injected catalog weights');
  assert(calls.getEventById > 0, 'history repetition suppression reads injected catalog definitions');

  const immediateFeedbackEvents = (engine as unknown as {
    getImmediateFeedbackEvents(): EventDefinition[];
  }).getImmediateFeedbackEvents();
  assertSameIds(immediateFeedbackEvents, [feedbackEvent], 'immediate feedback scans injected catalog events');
  assert(calls.getAllEvents > 0, 'immediate feedback reads injected catalog events');
}

export function runRuntimeEventCatalogTests(): void {
  const catalog = createDefaultRuntimeEventCatalog();
  const loaderEvents = eventLoader.getAllEvents();

  const catalogEvents = catalog.getAllEvents();
  assertSameIds(catalogEvents, loaderEvents, 'all events mirror EventLoader');
  assert(catalogEvents !== loaderEvents, 'all events returns a new array');

  const age = 18;
  const catalogAgeEvents = catalog.getEventsByAge(age);
  const loaderAgeEvents = eventLoader.getEventsByAge(age);
  assertSameIds(catalogAgeEvents, loaderAgeEvents, 'age events mirror EventLoader');
  assert(catalogAgeEvents !== loaderAgeEvents, 'age events returns a new array');

  for (const event of loaderEvents) {
    assert(catalog.getEventById(event.id) === event, `lookup mirrors EventLoader for ${event.id}`);
    assert(
      catalog.getWeightForAge(event, age) === eventLoader.getWeightForAge(event, age),
      `weight mirrors EventLoader for ${event.id}`,
    );
  }
  assert(catalog.getEventById('__missing_runtime_event__') === undefined, 'unknown event returns undefined');

  const prototypeMethodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(catalog));
  assert(
    !prototypeMethodNames.some(name => /^(set|add|update|remove|delete|replace|write)/i.test(name)),
    'runtime catalog exposes no write API',
  );

  const apiCatalog = createDefaultInMemoryCatalogAdapter();
  const metadata = apiCatalog.getMetadata();
  assert(metadata.eventCount === loaderEvents.length, 'API adapter reads default runtime catalog');
  assertSameIds(
    apiCatalog.getEventBundle({ minAge: age, maxAge: age }).events.map(event => ({ id: event.eventId })),
    loaderAgeEvents,
    'API adapter age bundle mirrors default runtime catalog',
  );

  verifyInjectedCatalogDrivesEveryEngineRead();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRuntimeEventCatalogTests();
  console.log('runtimeEventCatalog.test.ts: ok');
}
