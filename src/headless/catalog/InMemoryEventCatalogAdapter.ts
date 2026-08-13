/**
 * In-memory catalog adapter backed by current bundled event data (P5 US-008).
 * Does not modify EventLoader runtime behavior.
 */

import {
  createDefaultRuntimeEventCatalog,
} from '../../core/EventLoaderRuntimeCatalog';
import type { RuntimeEventCatalog } from '../../core/RuntimeEventCatalog';
import type { EventDefinition } from '../../types/eventTypes';
import {
  EVENT_CATALOG_CONTRACT_VERSION,
  type EventBundleRequest,
  type EventBundleResponse,
  type EventCatalogEntrySummary,
  type EventCatalogMetadata,
  type EventCatalogStatus,
} from '../../contracts/eventCatalog';
import { CatalogReadError, type EventCatalogReadService } from './EventCatalogReadService';

const DEFAULT_CATALOG_VERSION = '1.0.0';

function inferStatus(_event: EventDefinition): EventCatalogStatus {
  return 'active';
}

function eventMinAge(event: EventDefinition): number {
  return event.ageRange?.min ?? 0;
}

function eventMaxAge(event: EventDefinition): number | undefined {
  return event.ageRange?.max;
}

function matchesQuery(event: EventDefinition, request: EventBundleRequest): boolean {
  const minAge = eventMinAge(event);
  const maxAge = eventMaxAge(event);
  if (request.minAge !== undefined && (maxAge ?? 999) < request.minAge) return false;
  if (request.maxAge !== undefined && minAge > request.maxAge) return false;
  if (request.routeTrack) {
    const storyLine = event.storyLine ?? '';
    if (!storyLine.includes(request.routeTrack)) return false;
  }
  if (request.statusScope && request.statusScope.length > 0) {
    const status = inferStatus(event);
    if (!request.statusScope.includes(status)) return false;
  }
  return true;
}

function toSummary(event: EventDefinition): EventCatalogEntrySummary {
  return {
    eventId: event.id,
    routeTrack: event.storyLine,
    minAge: eventMinAge(event),
    maxAge: eventMaxAge(event),
    status: inferStatus(event),
    validationState: 'valid',
  };
}

export class InMemoryEventCatalogAdapter implements EventCatalogReadService {
  constructor(private readonly runtimeCatalog: RuntimeEventCatalog = createDefaultRuntimeEventCatalog()) {}

  resolveVersion(catalogVersion?: string): string {
    return catalogVersion ?? DEFAULT_CATALOG_VERSION;
  }

  getMetadata(catalogVersion?: string): EventCatalogMetadata {
    const version = this.resolveVersion(catalogVersion);
    const all = this.runtimeCatalog.getAllEvents();
    const activeCount = all.filter(e => inferStatus(e) === 'active').length;
    const deferredCount = all.filter(e => inferStatus(e) === 'deferred').length;
    return {
      catalogVersion: version,
      contractVersion: EVENT_CATALOG_CONTRACT_VERSION,
      publishedAt: 0,
      eventCount: all.length,
      activeCount,
      deferredCount,
    };
  }

  getEventBundle(request: EventBundleRequest = {}): EventBundleResponse {
    const version = this.resolveVersion(request.catalogVersion);
    const filtered = this.runtimeCatalog.getAllEvents().filter(e => matchesQuery(e, request));
    return {
      metadata: this.getMetadata(version),
      events: filtered.map(toSummary),
    };
  }

  getEventById(eventId: string, catalogVersion?: string): EventDefinition {
    this.resolveVersion(catalogVersion);
    const event = this.runtimeCatalog.getEventById(eventId);
    if (!event) {
      throw new CatalogReadError('EVENT_NOT_FOUND', `Event not found: ${eventId}`, { eventId });
    }
    return event;
  }
}

export function createDefaultInMemoryCatalogAdapter(
  runtimeCatalog: RuntimeEventCatalog = createDefaultRuntimeEventCatalog(),
): InMemoryEventCatalogAdapter {
  return new InMemoryEventCatalogAdapter(runtimeCatalog);
}
