import type { RuntimeEventCatalog } from '../../src/core/RuntimeEventCatalog';
import { captureCatalogSnapshot } from './catalogSnapshot';
import { validateWeightOverlay, type WeightOverlayValidation } from './scopeValidator';

export type WeightOverlay = {
  schemaVersion: 'b1-weight-overlay-v1';
  baseCatalogHash: string;
  patches: Array<{
    eventId: string;
    baselineWeight: number;
    candidateWeight: number;
  }>;
};

export type WeightPatchIntent = {
  eventId: string;
  direction: 'increase' | 'decrease';
  deltaRatio: number;
  rationale: string;
  expectedMetricEffects: string[];
};

export type WeightOverlayCreation = WeightOverlayValidation & {
  overlay?: WeightOverlay;
};

function blocked(code: string, eventId?: string): WeightOverlayCreation {
  return { status: 'blocked', code, eventId };
}

/** Converts proposal-only intents into a deterministic, independently validated overlay. */
export function createWeightOverlayFromIntents(
  catalog: RuntimeEventCatalog,
  intents: readonly WeightPatchIntent[],
): WeightOverlayCreation {
  const eventIds = new Set<string>();
  const patches: WeightOverlay['patches'] = [];

  for (const intent of intents) {
    if (!intent || typeof intent !== 'object') return blocked('INVALID_INTENT');
    if (typeof intent.eventId !== 'string' || intent.eventId.length === 0) return blocked('INVALID_INTENT_EVENT_ID');
    if (eventIds.has(intent.eventId)) return blocked('DUPLICATE_EVENT_ID', intent.eventId);
    eventIds.add(intent.eventId);
    if (intent.direction !== 'increase' && intent.direction !== 'decrease') {
      return blocked('INVALID_INTENT_DIRECTION', intent.eventId);
    }
    if (!Number.isFinite(intent.deltaRatio) || intent.deltaRatio <= 0) {
      return blocked('INVALID_INTENT_DELTA', intent.eventId);
    }
    if (typeof intent.rationale !== 'string' || intent.rationale.trim().length === 0) {
      return blocked('EMPTY_INTENT_RATIONALE', intent.eventId);
    }
    if (!Array.isArray(intent.expectedMetricEffects) || intent.expectedMetricEffects.length === 0 ||
      intent.expectedMetricEffects.some(effect => typeof effect !== 'string' || effect.trim().length === 0)) {
      return blocked('MISSING_EXPECTED_METRICS', intent.eventId);
    }

    const event = catalog.getEventById(intent.eventId);
    if (!event) return blocked('UNKNOWN_EVENT_ID', intent.eventId);
    const multiplier = intent.direction === 'increase' ? 1 + intent.deltaRatio : 1 - intent.deltaRatio;
    patches.push({
      eventId: intent.eventId,
      baselineWeight: event.weight,
      candidateWeight: event.weight * multiplier,
    });
  }

  const overlay: WeightOverlay = {
    schemaVersion: 'b1-weight-overlay-v1',
    baseCatalogHash: captureCatalogSnapshot(catalog).baseCatalogHash,
    patches: patches.sort((left, right) => left.eventId.localeCompare(right.eventId)),
  };
  const validation = validateWeightOverlay(catalog, overlay);
  return validation.status === 'valid' ? { ...validation, overlay } : validation;
}
