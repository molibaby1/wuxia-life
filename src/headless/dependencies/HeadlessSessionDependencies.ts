/**
 * Headless dependency injection boundary (P5 US-004).
 *
 * Vue, DOM APIs, and browser storage are forbidden in headless modules.
 */

import type { EventCatalogReadService } from '../catalog/EventCatalogReadService';
import type { SnapshotConverter } from '../snapshot/SnapshotConverter';
import { createDefaultRandomSource, type RandomSource } from '../adapters/randomSource';
import { createDefaultTimeSource, type TimeSource } from '../adapters/timeSource';

export interface HeadlessLogger {
  debug(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export const noopLogger: HeadlessLogger = {
  debug: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

export interface HeadlessSessionDependencies {
  /** Required: versioned event catalog reads. */
  catalog: EventCatalogReadService;
  /** Required: deterministic or runtime randomness. */
  random: RandomSource;
  /** Required: snapshot timestamps and metadata. */
  time: TimeSource;
  /** Required: runtime state ↔ snapshot conversion. */
  snapshot: SnapshotConverter;
  /** Optional: structured logging (defaults to noop). */
  logger?: HeadlessLogger;
}

export function resolveHeadlessDependencies(
  partial: Partial<HeadlessSessionDependencies> & Pick<HeadlessSessionDependencies, 'catalog' | 'snapshot'>,
): HeadlessSessionDependencies {
  return {
    catalog: partial.catalog,
    snapshot: partial.snapshot,
    random: partial.random ?? createDefaultRandomSource(),
    time: partial.time ?? createDefaultTimeSource(),
    logger: partial.logger ?? noopLogger,
  };
}
