import type { EventDefinition } from '../types/eventTypes';
import {
  PRIMARY_ORIGIN_FAMILY_FLAGS,
  type PrimaryOriginFamilyFlag,
} from './primaryOriginFlag';

/** P0 audit band; gate applies through this age (PRD Q1). */
export const SPINE_ORIGIN_EXCLUSIVE_AGE_MAX = 7;

const STAGEFIT_TO_PRIMARY: Record<string, PrimaryOriginFamilyFlag> = {
  origin_scholar: 'origin_scholar_family',
  scholarly_identity: 'origin_scholar_family',
  origin_martial: 'origin_wuxia_family',
  martial_identity: 'origin_wuxia_family',
  origin_merchant: 'origin_merchant_family',
  wealth_identity: 'origin_merchant_family',
  origin_frontier: 'origin_frontier',
  frontier_military: 'origin_frontier',
};

const TAG_TO_PRIMARY: Record<string, PrimaryOriginFamilyFlag> = {
  scholar: 'origin_scholar_family',
  martial: 'origin_wuxia_family',
  merchant: 'origin_merchant_family',
  frontier: 'origin_frontier',
};

/** General childhood spine ids — never origin-gated (US-001 neutral whitelist). */
export const NEUTRAL_SPINE_EVENT_IDS = new Set([
  'origin_background',
  'clever_speech',
  'childhood_preference',
  'birth_with_phenomenon',
  'birth_wuxia_family',
  'toddler_exploration',
  'prologue_divine_birth',
  'prologue_family_trial',
  'prologue_strict_master',
  'talent_birth_awakening',
  'martial_arts_enlightenment',
]);

function collectConditionExpressions(event: EventDefinition): string {
  const parts: string[] = [];
  for (const condition of event.conditions ?? []) {
    if (condition.type === 'expression' && condition.expression) {
      parts.push(condition.expression);
    }
  }
  const required = event.thresholds?.required ?? [];
  for (const flag of required) {
    parts.push(flag);
  }
  return parts.join(' ');
}

function primaryFromConditions(event: EventDefinition): PrimaryOriginFamilyFlag | null {
  const text = collectConditionExpressions(event);
  const matched = PRIMARY_ORIGIN_FAMILY_FLAGS.filter(flag => text.includes(flag));
  if (matched.length === 1) {
    return matched[0];
  }
  return null;
}

/** Infer which primary origin flag this event is exclusive to, if any. */
export function inferEventExclusivePrimaryFlag(event: EventDefinition): PrimaryOriginFamilyFlag | null {
  if (NEUTRAL_SPINE_EVENT_IDS.has(event.id)) {
    return null;
  }

  const stagePrimaries = new Set<PrimaryOriginFamilyFlag>();
  for (const fit of event.metadata?.authoringSemantics?.stageFit ?? []) {
    const mapped = STAGEFIT_TO_PRIMARY[fit];
    if (mapped) stagePrimaries.add(mapped);
  }
  if (stagePrimaries.size === 1) {
    return stagePrimaries.values().next().value as PrimaryOriginFamilyFlag;
  }
  if (stagePrimaries.size > 1) {
    return null;
  }

  const tags = event.metadata?.tags ?? [];
  if (tags.includes('origin')) {
    const originTags = tags.filter(tag => TAG_TO_PRIMARY[tag]);
    if (originTags.length === 1) {
      return TAG_TO_PRIMARY[originTags[0]!];
    }
  }

  return primaryFromConditions(event);
}

export function isOriginExclusiveSpineEvent(event: EventDefinition): boolean {
  return inferEventExclusivePrimaryFlag(event) !== null;
}

export function isSpineOriginEligible(
  event: EventDefinition,
  primaryOriginFlag: string | null,
  age: number,
): boolean {
  if (age > SPINE_ORIGIN_EXCLUSIVE_AGE_MAX) {
    return true;
  }
  const exclusive = inferEventExclusivePrimaryFlag(event);
  if (!exclusive) {
    return true;
  }
  if (!primaryOriginFlag) {
    return false;
  }
  return exclusive === primaryOriginFlag;
}

export function isForeignExclusiveSpineEvent(
  event: EventDefinition,
  playerPrimary: PrimaryOriginFamilyFlag,
): boolean {
  const exclusive = inferEventExclusivePrimaryFlag(event);
  return exclusive !== null && exclusive !== playerPrimary;
}
