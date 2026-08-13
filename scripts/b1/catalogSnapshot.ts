import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog';
import type { EventDefinition } from '../../src/types/eventTypes';
import { stableJsonHash } from './hash';

export type CatalogSnapshot = {
  events: readonly EventDefinition[];
  baseCatalogHash: string;
};

export function deepClone<T>(value: T): T {
  return structuredClone(value);
}

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested);
  }
  return value;
}

/** Captures an immutable, ID-sorted full-event snapshot for B1 artifact validation. */
export function captureCatalogSnapshot(catalog: RuntimeEventCatalog): CatalogSnapshot {
  const events = catalog.getAllEvents()
    .map(event => deepClone(event))
    .sort((left, right) => left.id.localeCompare(right.id));
  return deepFreeze({
    events,
    baseCatalogHash: stableJsonHash(events),
  });
}
