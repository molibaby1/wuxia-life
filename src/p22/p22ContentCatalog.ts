import { EventLoader } from '../core/EventLoader';
import type { EventDefinition } from '../types/eventTypes';

export function getP22ExpansionEvents(): EventDefinition[] {
  return EventLoader.getInstance()
    .getAllEvents()
    .filter(event => event.id.startsWith('p22_'));
}

export function getP22ExpansionEventById(eventId: string): EventDefinition | undefined {
  return EventLoader.getInstance().getEventById(eventId);
}
