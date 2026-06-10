import type {
  BaselinePoolConfig,
  CoverageHealthClass,
  LibraryCoverageExpectation,
  LibraryCoveragePoolSnapshot,
} from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import {
  collectPoolEvents,
  countArchetypeTags,
  countDistinctRouteSignals,
  getBaselinePools,
} from './poolInventory';

function classifyHealth(
  eventCount: number,
  expectation: LibraryCoverageExpectation | undefined,
  routeSignals: number,
  archetypeTags: number,
  titleOverlapRatio: number,
): CoverageHealthClass {
  const minEvents = expectation?.minimumEventCount ?? 5;
  if (eventCount < minEvents * 0.5) return 'sparse';
  if (titleOverlapRatio >= (expectation?.repetitiveOverlapThreshold ?? 0.7)) return 'repetitive';
  if (
    eventCount < minEvents ||
    routeSignals < (expectation?.minimumDistinctRouteSignals ?? 2) ||
    archetypeTags < (expectation?.minimumArchetypeTags ?? 2)
  ) {
    return 'weak';
  }
  return 'strong';
}

function titleOverlapRatio(events: ReturnType<typeof collectPoolEvents>): number {
  if (events.length < 2) return 0;
  const titles = events.map(e => (e.content?.title ?? e.content?.text ?? e.id).slice(0, 12));
  const unique = new Set(titles).size;
  return 1 - unique / titles.length;
}

export function evaluatePoolCoverage(pool: BaselinePoolConfig): LibraryCoveragePoolSnapshot {
  const profile = getWorldProfile();
  const expectation = profile.libraryCoverageExpectations?.find(e => e.poolId === pool.id);
  const events = collectPoolEvents(pool);
  const routeSignals = countDistinctRouteSignals(events);
  const archetypeTags = countArchetypeTags(events);
  const overlap = titleOverlapRatio(events);
  const healthClass = classifyHealth(events.length, expectation, routeSignals, archetypeTags, overlap);
  const thinCoverage =
    events.length < (expectation?.minimumEventCount ?? pool.minimumEventCount) ||
    routeSignals < (expectation?.minimumDistinctRouteSignals ?? 2);
  const repetitiveRisk = overlap >= (expectation?.repetitiveOverlapThreshold ?? 0.7);

  return {
    poolId: pool.id,
    label: pool.label,
    eventCount: events.length,
    distinctRouteSignals: routeSignals,
    archetypeTagCount: archetypeTags,
    healthClass,
    thinCoverage,
    repetitiveRisk,
    detail: `${events.length} events, ${routeSignals} route signals, overlap ${overlap.toFixed(2)}`,
  };
}

export function evaluateAllPoolCoverage(): LibraryCoveragePoolSnapshot[] {
  return getBaselinePools().map(evaluatePoolCoverage);
}
