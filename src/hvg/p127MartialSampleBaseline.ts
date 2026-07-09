/**
 * P127 locked sample: martial_family ages 5–16 visible-growth verification chain.
 * ponytail: single-route constants only — extend via new PRD, not here.
 */
import type { GameState } from '../types/eventTypes';
import { resolvePrimaryOriginFamilyFlag } from '../p16/primaryOriginFlag';

export const P127_SAMPLE_ORIGIN_ID = 'martial_family' as const;
export const P127_PRIMARY_AGE_MIN = 5;
export const P127_PRIMARY_AGE_MAX = 8;
export const P127_CONTINUATION_AGE_MAX = 16;

export const P127_PRIMARY_ACTION = 'action_childhood_training' as const;
export const P127_PRELUDE_ACTION = 'action_childhood_yard_play' as const;

/** Existing habit wiring threshold — shapingSummary shows axis at ≥2 (see habitShapingSummary). */
export const P127_TRAINING_HABIT_SHAPING_THRESHOLD = 2;

/** P127-002: expected main-screen shapingSummary at threshold on sample path. */
export const P127_EXPECTED_SHAPING_SUMMARY_AT_THRESHOLD = '习武 · 渐成' as const;

/** P127-004: period settlement shaping axis keyword on sample path. */
export const P127_PERIOD_SHAPING_AXIS_LABEL = '习武' as const;

export const P127_SAMPLE_ACTIONS = [P127_PRIMARY_ACTION] as const;

export const P127_SAMPLE_ECHO_FLAGS = [
  'p9_echo_training_hook',
  'p9_early_training_focus',
] as const;

export const P127_CONTINUATION_TARGETS = [
  'p9_echo_training_hook',
  'p9_early_training_focus',
  'p22_early_martial_route_fork',
  'p42_training_habit_youth_sparring',
] as const;

export function isP127MartialSampleScope(state: GameState): boolean {
  const age = state.player?.age ?? 0;
  if (age < P127_PRIMARY_AGE_MIN || age > P127_CONTINUATION_AGE_MAX) {
    return false;
  }
  const originId = state.flags?.origin_id ?? state.player?.traitProfile?.origin;
  const martialFamily = resolvePrimaryOriginFamilyFlag(state) === 'origin_wuxia_family';
  return martialFamily && (originId === P127_SAMPLE_ORIGIN_ID || originId === undefined);
}
