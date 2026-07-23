/**
 * P129 locked sample: tavern_hand ages 5–13 visible-growth verification chain.
 * ponytail: single-route constants only — extend via new PRD, not here.
 */
import type { GameState } from '../types/eventTypes';

export const P129_SAMPLE_ORIGIN_ID = 'tavern_hand' as const;
export const P129_PRIMARY_AGE_MIN = 5;
export const P129_PRIMARY_AGE_MAX = 8;
export const P129_CONTINUATION_AGE_MAX = 13;

export const P129_PRIMARY_ACTION = 'action_socializing_lite' as const;

/** Existing habit wiring threshold — shapingSummary shows axis at ≥2 (see habitShapingSummary). */
export const P129_SOCIAL_MOMENTUM_SHAPING_THRESHOLD = 2;

/** P129-002: expected main-screen shapingSummary at threshold on sample path. */
export const P129_EXPECTED_SHAPING_SUMMARY_AT_THRESHOLD = '人情 · 渐成' as const;

/** P129-004: period settlement shaping axis keyword on sample path. */
export const P129_PERIOD_SHAPING_AXIS_LABEL = '人情' as const;

export const P129_SAMPLE_ACTIONS = [P129_PRIMARY_ACTION] as const;

export const P129_SAMPLE_ECHO_FLAGS = [
  'p9_echo_social_hook',
  'p9_early_social_focus',
] as const;

export const P129_CONTINUATION_TARGETS = [
  'p9_echo_social_hook',
  'p9_early_social_focus',
  'ordinary_tavern_network_fork',
  'p28_social_momentum_network_fork',
] as const;

export function isP129TavernSampleScope(state: GameState): boolean {
  const age = state.player?.age ?? 0;
  if (age < P129_PRIMARY_AGE_MIN || age > P129_CONTINUATION_AGE_MAX) {
    return false;
  }
  const originId = state.flags?.origin_id;
  const tavernHand = Boolean(state.flags?.origin_tavern_hand);
  return tavernHand && (originId === P129_SAMPLE_ORIGIN_ID || originId === undefined);
}
