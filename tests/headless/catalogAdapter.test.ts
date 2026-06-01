import { createDefaultInMemoryCatalogAdapter } from '../../src/headless/catalog/InMemoryEventCatalogAdapter';
import { CatalogReadError } from '../../src/headless/catalog/EventCatalogReadService';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runCatalogAdapterTests(): void {
  const catalog = createDefaultInMemoryCatalogAdapter();
  const meta = catalog.getMetadata();
  assert(meta.catalogVersion === '1.0.0', 'metadata version');
  assert(meta.eventCount > 0, 'event count');

  const bundle = catalog.getEventBundle({ minAge: 0, maxAge: 10 });
  assert(bundle.events.length > 0, 'age filter should return events');
  assert(bundle.events.every(e => (e.minAge ?? 0) <= 10), 'age filter max bound');

  const first = bundle.events[0]!;
  const event = catalog.getEventById(first.eventId);
  assert(event.id === first.eventId, 'lookup by id');

  let unknownVersion = false;
  try {
    catalog.getMetadata('99.99.99');
  } catch (error) {
    unknownVersion = error instanceof CatalogReadError && error.code === 'CATALOG_VERSION_UNKNOWN';
  }
  assert(unknownVersion, 'unknown catalog version');

  let missing = false;
  try {
    catalog.getEventById('__missing_event_id__');
  } catch (error) {
    missing = error instanceof CatalogReadError && error.code === 'EVENT_NOT_FOUND';
  }
  assert(missing, 'missing event id');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCatalogAdapterTests();
  console.log('catalogAdapter.test.ts: ok');
}
