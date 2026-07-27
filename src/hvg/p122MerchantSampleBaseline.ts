/**
 * P122 locked sample: merchant_house ages 5–12 visible-growth verification chain.
 * ponytail: single-route constants only — extend via new PRD, not here.
 */
import type { GameState } from '../types/eventTypes';

export const P122_SAMPLE_ORIGIN_ID = 'merchant_house' as const;
export const P122_PRIMARY_AGE_MIN = 5;
export const P122_PRIMARY_AGE_MAX = 8;
export const P122_CONTINUATION_AGE_MAX = 12;

export const P122_SAMPLE_ACTION_ERRAND = 'action_household_errand' as const;
export const P122_SAMPLE_ACTION_APPRENTICE = 'action_household_apprentice' as const;

/** Existing habit wiring threshold for visible practice feedback. */
export const P122_BUSINESS_HABIT_SHAPING_THRESHOLD = 2;

export const P122_SAMPLE_ACTIONS = [
  P122_SAMPLE_ACTION_ERRAND,
  P122_SAMPLE_ACTION_APPRENTICE,
] as const;

export const P122_SAMPLE_ECHO_FLAGS = [
  'p9_echo_business_hook',
  'p9_early_business_focus',
] as const;

export const P122_SAMPLE_ROUTE_FLAGS = [
  'route_merchant',
  'merchant_childhood_seed_done',
  'merchant_talent_discovery',
] as const;

export function isP122MerchantSampleScope(state: GameState): boolean {
  const age = state.player?.age ?? 0;
  if (age < P122_PRIMARY_AGE_MIN || age > P122_CONTINUATION_AGE_MAX) {
    return false;
  }
  const originId = state.flags?.origin_id;
  const merchantFamily = Boolean(state.flags?.origin_merchant_family);
  return merchantFamily && (originId === P122_SAMPLE_ORIGIN_ID || originId === undefined);
}
