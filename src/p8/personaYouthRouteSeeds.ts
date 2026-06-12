import type { P8Persona } from './types';

const STRATEGY_YOUTH_SEEDS: Record<P8Persona['strategy'], Record<string, boolean>> = {
  training: {
    p9_early_training_focus: true,
    p9_echo_training_hook: true,
  },
  study: {
    p9_echo_study_hook: true,
    p16_deferred_study_upbringing: true,
  },
  socializing: {
    p9_early_social_focus: true,
    p9_echo_social_hook: true,
    p16_deferred_social_upbringing: true,
  },
  business: {
    p9_early_business_focus: true,
    p9_echo_business_hook: true,
    p16_deferred_business_upbringing: true,
  },
  travel: {
    p9_early_travel_focus: true,
    p16_deferred_travel_upbringing: true,
  },
  balanced: {
    p9_echo_study_hook: true,
    p9_echo_social_hook: true,
    p9_early_social_focus: true,
    p16_deferred_study_upbringing: true,
  },
};

/**
 * Age-13 route intent flags for P8 persona simulations.
 * Demonic personas diverge from pure-martial training seeds to unlock deviant route content.
 */
export function resolvePersonaYouthRouteSeeds(persona: P8Persona): Record<string, boolean> {
  if (persona.routePreference === 'demonic') {
    return {
      p8_route_demonic: true,
      p9_echo_training_hook: true,
      p9_echo_study_hook: true,
      p16_deferred_study_upbringing: true,
      p9_childhood_dark_spark: true,
    };
  }
  return { ...STRATEGY_YOUTH_SEEDS[persona.strategy] };
}
