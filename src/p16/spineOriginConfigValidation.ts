import type { EventDefinition } from '../types/eventTypes';
import { eventLoader } from '../core/EventLoader';
import { inferEventExclusivePrimaryFlag } from './spineOriginIsolation';
import { PRIMARY_ORIGIN_FAMILY_FLAGS } from './primaryOriginFlag';

/** Flags granted by origin.json four-choice + trait startingFlags allowlist. */
export const CANONICAL_ORIGIN_FLAG_ALLOWLIST = new Set([
  ...PRIMARY_ORIGIN_FAMILY_FLAGS,
  'origin_poor_family',
  'origin_streetborn',
]);

/** Deprecated / non-canonical names that must not appear in spine conditions. */
export const DEPRECATED_ORIGIN_FLAGS = new Set(['origin_frontier_family']);

const FOUR_MAIN_EXCLUSIVE = new Set([
  'origin_scholar_family',
  'origin_wuxia_family',
  'origin_merchant_family',
  'origin_frontier',
]);

export interface SpineOriginConfigFinding {
  eventId: string;
  kind:
    | 'deprecated_flag'
    | 'unknown_flag'
    | 'stagefit_mismatch'
    | 'poor_or_cross_origin'
    | 'street_or_cross_origin'
    | 'trait_line_ambiguous';
  detail: string;
}

function extractOriginFlagsFromExpression(expression: string): string[] {
  const matches = expression.match(/origin_[a-z_]+/g) ?? [];
  return [...new Set(matches)];
}

function scanEventConditions(event: EventDefinition): SpineOriginConfigFinding[] {
  const findings: SpineOriginConfigFinding[] = [];
  const exprParts: string[] = [];

  for (const condition of event.conditions ?? []) {
    if (condition.type === 'expression' && condition.expression) {
      exprParts.push(condition.expression);
      for (const flag of extractOriginFlagsFromExpression(condition.expression)) {
        if (DEPRECATED_ORIGIN_FLAGS.has(flag)) {
          findings.push({
            eventId: event.id,
            kind: 'deprecated_flag',
            detail: `deprecated flag ${flag} in conditions`,
          });
        } else if (!CANONICAL_ORIGIN_FLAG_ALLOWLIST.has(flag)) {
          findings.push({
            eventId: event.id,
            kind: 'unknown_flag',
            detail: `unknown origin flag ${flag}`,
          });
        }
      }
    }
  }

  const combined = exprParts.join(' || ');
  if (combined.includes('origin_poor_family') && /origin_(scholar|wuxia|merchant|frontier)/.test(combined)) {
    const hasMainExclusive = [...FOUR_MAIN_EXCLUSIVE].some(
      flag => combined.includes(flag) || combined.includes(flag.replace('_family', '')),
    );
    if (hasMainExclusive || combined.includes('origin_frontier_family')) {
      findings.push({
        eventId: event.id,
        kind: 'poor_or_cross_origin',
        detail: 'origin_poor_family OR branch with four-main origin flags',
      });
    }
  }

  if (combined.includes('origin_streetborn') && /origin_(scholar|wuxia|merchant|frontier)/.test(combined)) {
    const hasMainExclusive = [...FOUR_MAIN_EXCLUSIVE].some(
      flag => combined.includes(flag) || combined.includes(flag.replace('_family', '')),
    );
    if (hasMainExclusive || combined.includes('origin_frontier_family')) {
      findings.push({
        eventId: event.id,
        kind: 'street_or_cross_origin',
        detail: 'origin_streetborn OR branch with four-main origin flags',
      });
    }
  }

  if (combined.includes('origin_poor_family') && combined.includes('origin_streetborn')) {
    findings.push({
      eventId: event.id,
      kind: 'trait_line_ambiguous',
      detail: 'origin_poor_family and origin_streetborn in same condition branch',
    });
  }

  return findings;
}

function scanStageFit(event: EventDefinition): SpineOriginConfigFinding[] {
  const findings: SpineOriginConfigFinding[] = [];
  const stageFit = event.metadata?.authoringSemantics?.stageFit ?? [];
  const originFits = stageFit.filter(fit => fit.startsWith('origin_') || fit.endsWith('_identity'));

  for (const fit of originFits) {
    const inferred = inferEventExclusivePrimaryFlag({
      ...event,
      metadata: {
        ...event.metadata,
        authoringSemantics: {
          ...event.metadata?.authoringSemantics,
          stageFit: [fit],
        },
      },
    });
    if (!inferred && fit.startsWith('origin_')) {
      findings.push({
        eventId: event.id,
        kind: 'stagefit_mismatch',
        detail: `stageFit "${fit}" does not map to canonical primary flag`,
      });
    }
  }
  return findings;
}

export function validateSpineOriginConfig(): SpineOriginConfigFinding[] {
  const findings: SpineOriginConfigFinding[] = [];
  for (const event of eventLoader.getAllEvents()) {
    const maxAge = event.ageRange?.max ?? 99;
    if (maxAge > 12) continue;
    findings.push(...scanEventConditions(event));
    findings.push(...scanStageFit(event));
  }
  return findings;
}
