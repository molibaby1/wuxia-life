import type { EventDefinition, GameState } from '../types/eventTypes';
import { resolvePrimaryOriginFamilyFlag } from './primaryOriginFlag';

export type TraitLineExclusiveFlag = 'origin_poor_family' | 'origin_streetborn';

function collectConditionExpressions(event: EventDefinition): string {
  const parts: string[] = [];
  for (const condition of event.conditions ?? []) {
    if (condition.type === 'expression' && condition.expression) {
      parts.push(condition.expression);
    }
  }
  for (const flag of event.thresholds?.background?.required ?? []) {
    parts.push(flag);
  }
  return parts.join(' ');
}

function hasPlayerFlag(state: GameState, flag: string): boolean {
  return !!(state.flags?.[flag] || state.player?.flags?.[flag]);
}

/** Classify trait-line spine events keyed on poor/street trait flags. */
export function inferTraitLineExclusiveFlag(event: EventDefinition): TraitLineExclusiveFlag | null {
  const text = collectConditionExpressions(event);
  const hasPoor = text.includes('origin_poor_family');
  const hasStreet = text.includes('origin_streetborn');
  if (hasPoor && hasStreet) {
    return null;
  }
  if (hasPoor) {
    return 'origin_poor_family';
  }
  if (hasStreet) {
    return 'origin_streetborn';
  }
  return null;
}

/**
 * Trait-line gate applied after primary-origin spine gate.
 * Poor-line requires origin_poor_family; street-line requires origin_streetborn
 * (frontier orphan shaping successor allowed for frontier primary only).
 */
export function isTraitLineSpineEligible(event: EventDefinition, state: GameState): boolean {
  const traitLine = inferTraitLineExclusiveFlag(event);
  if (!traitLine) {
    return true;
  }

  const hasPoor = hasPlayerFlag(state, 'origin_poor_family');
  const hasStreet = hasPlayerFlag(state, 'origin_streetborn');

  if (traitLine === 'origin_poor_family') {
    return hasPoor;
  }

  if (hasStreet) {
    return true;
  }

  const text = collectConditionExpressions(event);
  if (
    text.includes('p22_frontier_orphan_shaped') &&
    hasPlayerFlag(state, 'p22_frontier_orphan_shaped') &&
    resolvePrimaryOriginFamilyFlag(state) === 'origin_frontier'
  ) {
    return true;
  }

  return false;
}
