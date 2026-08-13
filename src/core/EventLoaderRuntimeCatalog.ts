import { eventLoader } from './EventLoader';
import type { RuntimeEventCatalog } from './RuntimeEventCatalog';
import type { EventDefinition } from '../types/eventTypes';

class EventLoaderRuntimeCatalog implements RuntimeEventCatalog {
  getAllEvents(): readonly EventDefinition[] {
    return [...eventLoader.getAllEvents()];
  }

  getEventsByAge(age: number): readonly EventDefinition[] {
    return [...eventLoader.getEventsByAge(age)];
  }

  getEventById(id: string): EventDefinition | undefined {
    return eventLoader.getEventById(id);
  }

  getWeightForAge(event: EventDefinition, age: number): number {
    return eventLoader.getWeightForAge(event, age);
  }
}

/** Creates an isolated read-only facade over the formal EventLoader singleton. */
export function createDefaultRuntimeEventCatalog(): RuntimeEventCatalog {
  return new EventLoaderRuntimeCatalog();
}
