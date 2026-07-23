import { getWorldProfile } from '../narrative/worldProfile';
import type { OriginWorldviewShaping } from '../narrative/profile/types';
import type { EventDefinition, GameState } from '../types/eventTypes';
import { getOriginSurfaceForState } from './originSurfaces';

export type TendencyAccumulator = OriginWorldviewShaping;

export function createEmptyTendencyAccumulator(): TendencyAccumulator {
  return {
    discipline: 0,
    endurance: 0,
    caution: 0,
    empathy: 0,
    ambition: 0,
    socialEase: 0,
  };
}

function getEventTags(event: EventDefinition): Set<string> {
  const tags = new Set<string>();
  const metadata = event.metadata as Record<string, unknown> | undefined;
  if (metadata?.tags && Array.isArray(metadata.tags)) {
    for (const tag of metadata.tags) {
      if (typeof tag === 'string') tags.add(tag);
    }
  }
  if (event.category) tags.add(event.category);
  return tags;
}

export function applyChildhoodShapingFromEvent(
  accumulator: TendencyAccumulator,
  event: EventDefinition,
  state: GameState,
  worldId = 'wuxia',
): TendencyAccumulator {
  const age = state.player?.age ?? 0;
  if (age > 18) return accumulator;

  const rules = getWorldProfile(worldId).childhoodShapingRules ?? [];
  const tags = getEventTags(event);
  const next = { ...accumulator };
  const surface = getOriginSurfaceForState(state, worldId);

  for (const rule of rules) {
    if (!tags.has(rule.sourceTag)) continue;
    const base = next[rule.tendency];
    const originBoost = surface?.shapingTendencies[rule.tendency] ?? 0;
    next[rule.tendency] = base + rule.increment + originBoost * 0.25;
  }
  return next;
}

export function buildTendencySurfaceSummary(
  accumulator: TendencyAccumulator,
  worldId = 'wuxia',
): string[] {
  const rules = getWorldProfile(worldId).childhoodShapingRules ?? [];
  const surfaced: string[] = [];
  for (const rule of rules) {
    const value = accumulator[rule.tendency];
    if (value >= rule.thresholdForSurfacing) {
      surfaced.push(`${rule.tendency}:${value.toFixed(2)}`);
    }
  }
  return surfaced;
}

export function formatTendencySuffix(accumulator: TendencyAccumulator): string {
  const parts = buildTendencySurfaceSummary(accumulator);
  if (parts.length === 0) return '';
  return `，幼年塑形：${parts.join('、')}`;
}
