import { EventLoader } from '../core/EventLoader';
import type { EventDefinition } from '../types/eventTypes';
import type { BaselinePoolConfig } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
export function eventMatchesPool(event: EventDefinition, pool: BaselinePoolConfig): boolean {
  const tags = event.metadata?.tags ?? [];
  const tagMatch = pool.eventTagPrefixes.some(prefix =>
    tags.some(tag => tag.startsWith(prefix) || tag.includes(prefix)),
  );
  const idMatch =
    event.id.startsWith('p22_') && pool.eventTagPrefixes.some(prefix => prefix === 'p22');
  const ageMatch = matchAgeBand(event, pool.lifePhase);
  const pathMatch = pool.sourcePaths.some(path => {
    if (path.includes('origin') && (tags.includes('origin') || event.id.includes('origin'))) return true;
    if (path.includes('general') && (event.ageRange?.min ?? 99) <= 12) return true;
    if (path.includes('elderly-legacy') && (event.ageRange?.min ?? 0) >= 50) return true;
    if (path.includes('p22-content-expansions') && event.id.startsWith('p22_')) return true;
    if (path.includes('p9-remediation') && event.id.startsWith('p9_')) return true;
    if (path.includes('p21-content-samples') && event.id.startsWith('p21_')) return true;
    if (path.includes('love') && tags.some(t => ['love', 'relationship', 'mentor'].includes(t))) return true;
    if (path.includes('faction') && tags.some(t => ['faction', 'sect'].includes(t))) return true;
    if (path.includes('middle-age-career') && (event.ageRange?.min ?? 0) >= 25 && (event.ageRange?.max ?? 0) <= 45) return true;
    return false;
  });
  return tagMatch || idMatch || (pathMatch && ageMatch);
}

function matchAgeBand(event: EventDefinition, phase: BaselinePoolConfig['lifePhase']): boolean {
  const min = event.ageRange?.min ?? 0;
  const max = event.ageRange?.max ?? 100;
  switch (phase) {
    case 'origin':
      return min <= 3;
    case 'childhood':
      return min <= 12 && max >= 4;
    case 'early_route':
      return min >= 13 && max <= 30;
    case 'midlife_consequence':
      return min >= 22 && max <= 55;
    case 'legacy_endgame':
      return min >= 45;
    default:
      return true;
  }
}

export function collectPoolEvents(pool: BaselinePoolConfig): EventDefinition[] {
  return EventLoader.getInstance().getAllEvents().filter(event => eventMatchesPool(event, pool));
}

export function getBaselinePools(): BaselinePoolConfig[] {
  return getWorldProfile().baselinePoolConfigs ?? [];
}

export function countDistinctRouteSignals(events: EventDefinition[]): number {
  const signals = new Set<string>();
  for (const event of events) {
    const routePoints = event.metadata?.narrativeScheduling?.routePoints ?? [];
    for (const point of routePoints) {
      signals.add(`${point.routeId}:${point.kind}`);
    }
    const pathAffinity = event.metadata?.pathAffinity ?? {};
    for (const routeId of Object.keys(pathAffinity)) {
      signals.add(`affinity:${routeId}`);
    }
    const routeFit = event.metadata?.authoringSemantics?.routeFit ?? [];
    for (const route of routeFit) {
      signals.add(`fit:${route}`);
    }
  }
  return signals.size;
}

export function countArchetypeTags(events: EventDefinition[]): number {
  const tags = new Set<string>();
  for (const event of events) {
    for (const tag of event.metadata?.tags ?? []) {
      if (['training', 'study', 'business', 'legacy', 'feud', 'withdrawal', 'origin', 'p22'].includes(tag)) {
        tags.add(tag);
      }
    }
    const role = event.metadata?.authoringSemantics?.contentRole;
    if (role) tags.add(role);
  }
  return tags.size;
}
