/**
 * Versioned event catalog read interface (P5 US-007).
 *
 * Final trigger eligibility remains engine-side; this service supplies bundles only.
 */

import type { EventDefinition } from '../../types/eventTypes';
import type {
  EventBundleRequest,
  EventBundleResponse,
  EventCatalogMetadata,
} from '../../contracts/eventCatalog';

export type CatalogReadErrorCode = 'EVENT_NOT_FOUND';

export class CatalogReadError extends Error {
  constructor(
    readonly code: CatalogReadErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'CatalogReadError';
  }
}

export interface EventCatalogReadService {
  getMetadata(catalogVersion?: string): EventCatalogMetadata;
  getEventBundle(request?: EventBundleRequest): EventBundleResponse;
  getEventById(eventId: string, catalogVersion?: string): EventDefinition;
}
