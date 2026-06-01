/**
 * Event catalog contract types (P4 US-015).
 *
 * Future service payload shapes — does not modify EventLoader runtime.
 *
 * @see docs/contracts/event-catalog-service-boundary.md
 */

export const EVENT_CATALOG_CONTRACT_VERSION = '1.0.0' as const;

export type EventCatalogStatus =
  | 'active'
  | 'candidate'
  | 'deferred'
  | 'broken'
  | 'dead';

export type EventValidationState = 'valid' | 'warning' | 'broken' | 'unreviewed';

export interface EventCatalogMetadata {
  catalogVersion: string;
  contractVersion: typeof EVENT_CATALOG_CONTRACT_VERSION;
  engineMinVersion?: string;
  publishedAt: number;
  eventCount: number;
  activeCount: number;
  deferredCount: number;
}

export interface EventBundleRequest {
  catalogVersion?: string;
  routeTrack?: string;
  minAge?: number;
  maxAge?: number;
  statusScope?: EventCatalogStatus[];
  includeDiagnostic?: boolean;
}

export interface EventCatalogEntrySummary {
  eventId: string;
  routeTrack?: string;
  minAge?: number;
  maxAge?: number;
  status: EventCatalogStatus;
  validationState: EventValidationState;
}

export interface EventBundleResponse {
  metadata: EventCatalogMetadata;
  events: EventCatalogEntrySummary[];
}

export interface EventCatalogValidationSummary {
  catalogVersion: string;
  counts: Record<EventCatalogStatus, number>;
  misfitEventIds: string[];
  serverOnlyFields: string[];
  diagnosticOnlyFields: string[];
}
