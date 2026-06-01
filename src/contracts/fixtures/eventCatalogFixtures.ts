/**
 * Event catalog contract fixtures (P4 contract validation closure).
 */

import {
  EVENT_CATALOG_CONTRACT_VERSION,
  type EventBundleResponse,
  type EventCatalogValidationSummary,
} from '../eventCatalog';

export const eventCatalogBundleFixture: EventBundleResponse = {
  metadata: {
    catalogVersion: '1.0.0',
    contractVersion: EVENT_CATALOG_CONTRACT_VERSION,
    publishedAt: 1717200000000,
    eventCount: 3,
    activeCount: 1,
    deferredCount: 1,
  },
  events: [
    {
      eventId: 'origin_martial_family_01',
      routeTrack: 'hero',
      minAge: 0,
      maxAge: 1,
      status: 'active',
      validationState: 'valid',
    },
    {
      eventId: 'merchant_backlog_01',
      routeTrack: 'merchant',
      minAge: 20,
      maxAge: 40,
      status: 'deferred',
      validationState: 'warning',
    },
    {
      eventId: 'dead_event_sample_01',
      routeTrack: 'scholar',
      minAge: 10,
      maxAge: 12,
      status: 'dead',
      validationState: 'unreviewed',
    },
  ],
};

export const eventCatalogSummaryFixture: EventCatalogValidationSummary = {
  catalogVersion: '1.0.0',
  counts: {
    active: 36,
    candidate: 73,
    deferred: 84,
    broken: 41,
    dead: 0,
  },
  misfitEventIds: ['legacy_unknown_schema_01'],
  serverOnlyFields: ['sourceFilePath', 'brokenReasonCode'],
  diagnosticOnlyFields: ['validationState', 'overlapsGoldenLine'],
};

export function serializeEventCatalogFixtures(): { bundle: string; summary: string } {
  return {
    bundle: JSON.stringify(eventCatalogBundleFixture),
    summary: JSON.stringify(eventCatalogSummaryFixture),
  };
}
