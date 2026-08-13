import type { EventDefinition } from '../types/eventTypes';

/**
 * Read-only event source for an individual runtime instance.
 *
 * Implementations may be the formal EventLoader adapter or an isolated
 * Headless-only catalog, but they never write to the formal event registry.
 */
export interface RuntimeEventCatalog {
  getAllEvents(): readonly EventDefinition[];
  getEventsByAge(age: number): readonly EventDefinition[];
  getEventById(id: string): EventDefinition | undefined;
  getWeightForAge(event: EventDefinition, age: number): number;
}
