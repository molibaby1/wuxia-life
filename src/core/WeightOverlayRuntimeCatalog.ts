import type { RuntimeEventCatalog } from './RuntimeEventCatalog';
import type { EventDefinition } from '../types/eventTypes';
import { captureCatalogSnapshot, deepClone, deepFreeze } from '../../scripts/b1/catalogSnapshot';
import { validateWeightOverlay } from '../../scripts/b1/scopeValidator';
import type { WeightOverlay } from '../../scripts/b1/types';

class WeightOverlayRuntimeCatalog implements RuntimeEventCatalog {
  private readonly events: readonly EventDefinition[];
  private readonly eventsById: ReadonlyMap<string, EventDefinition>;
  private readonly weightRatiosById: ReadonlyMap<string, number>;

  constructor(base: RuntimeEventCatalog, overlay: WeightOverlay) {
    const validation = validateWeightOverlay(base, overlay);
    if (validation.status === 'blocked') throw new Error(`Weight overlay blocked: ${validation.code}`);
    const snapshot = captureCatalogSnapshot(base);
    const weights = new Map(overlay.patches.map(patch => [patch.eventId, patch.candidateWeight]));
    this.weightRatiosById = new Map(overlay.patches.map(patch => [
      patch.eventId,
      patch.candidateWeight / patch.baselineWeight,
    ]));
    // Hash snapshots are ID-sorted for reproducibility, but runtime scheduling
    // must retain the formal catalog's original order. Otherwise a weight-only
    // overlay can change tie-breaking for unrelated ages/events.
    const orderedBaseEvents = base.getAllEvents().map(event => deepClone(event));
    this.events = deepFreeze(orderedBaseEvents.map(event => deepFreeze({
      ...event,
      weight: weights.get(event.id) ?? event.weight,
    })));
    this.eventsById = new Map(this.events.map(event => [event.id, event]));
  }

  getAllEvents(): readonly EventDefinition[] {
    return [...this.events];
  }

  getEventsByAge(age: number): readonly EventDefinition[] {
    return this.events.filter(event => this.getWeightForAge(event, age) > 0);
  }

  getEventById(id: string): EventDefinition | undefined {
    return this.eventsById.get(id);
  }

  getWeightForAge(event: EventDefinition, age: number): number {
    if (event.ageWeights && event.ageWeights.length > 0) {
      const baseAgeWeight = event.ageWeights.reduce((weight, rule) => {
        const maximumAge = rule.max ?? rule.min;
        return age >= rule.min && age <= maximumAge ? Math.max(weight, rule.weight) : weight;
      }, 0);
      return baseAgeWeight * (this.weightRatiosById.get(event.id) ?? 1);
    }
    const maximumAge = event.ageRange.max ?? event.ageRange.min;
    return age >= event.ageRange.min && age <= maximumAge ? event.weight : 0;
  }
}

/** Creates an isolated immutable catalog after the supplied B1 overlay passes every scope check. */
export function createWeightOverlayRuntimeCatalog(base: RuntimeEventCatalog, overlay: WeightOverlay): RuntimeEventCatalog {
  return new WeightOverlayRuntimeCatalog(base, overlay);
}
