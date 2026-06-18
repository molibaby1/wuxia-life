import {
  childhoodActionCatalog,
  getChildhoodActionById,
} from '../data/childhoodActionCatalog';
import type { ActiveActionDefinition } from '../types/activeActionTypes';
import type { ActionCategory } from '../types/activeActionTypes';
import { getMinimumActions } from '../data/activeActionCatalog';
import { getP8PersonaById } from '../p8/personas';
import type { PersonaActionStrategy } from '../p8/types';
import type { GameState, PlayerState } from '../types/eventTypes';
import { getOriginSurfaceForPlayer } from './originSurfaces';

export const INFANT_MAX_AGE = 2;
export const DAILY_PLANNING_MIN_AGE = 5;
export const EARLY_CHILDHOOD_MAX_AGE = 7;
export const CHILDHOOD_MAX_AGE = 12;
export const YOUTH_MIN_AGE = 13;

export function shouldOfferDailyPlanning(age: number): boolean {
  if (age > CHILDHOOD_MAX_AGE) return true;
  return age >= DAILY_PLANNING_MIN_AGE;
}

export function isPassiveChildhoodBand(age: number): boolean {
  return age <= EARLY_CHILDHOOD_MAX_AGE && !shouldOfferDailyPlanning(age);
}

export function isInfantBand(age: number): boolean {
  return age <= INFANT_MAX_AGE;
}

/** Full P7 minimum actions — adult framing, blocked during childhood. */
export const ADULT_CHILDHOOD_BLOCKED_ACTIONS = new Set([
  'action_business_basic',
  'action_travel_basic',
  'action_socializing_basic',
  'action_study_basic',
  'action_training_basic',
]);

const LITE_ACTION_BY_CATEGORY: Record<ActionCategory, string> = {
  training: 'action_childhood_training',
  study: 'action_study_lite',
  socializing: 'action_socializing_lite',
  business: 'action_household_apprentice',
  travel: 'action_errand_nearby',
  health: 'action_childhood_training',
  romance: 'action_socializing_lite',
  jianghu: 'action_childhood_training',
};

const BIAS_TAG_TO_CATEGORY: Record<string, ActionCategory> = {
  training: 'training',
  comprehension: 'study',
  discipline: 'study',
  social: 'socializing',
  family: 'socializing',
  business: 'business',
  survival: 'travel',
  risk: 'travel',
  reputation: 'socializing',
};

export interface ChildhoodPaletteContext {
  age: number;
  player?: PlayerState;
  flags?: Record<string, unknown>;
}

function resolvePersonaStrategy(flags?: Record<string, unknown>): PersonaActionStrategy | undefined {
  const personaId = flags?.p8_persona_id;
  if (typeof personaId !== 'string') {
    return undefined;
  }
  return getP8PersonaById(personaId)?.strategy;
}

function scoreChildhoodCategories(
  player: PlayerState | undefined,
  flags: Record<string, unknown> | undefined,
): Map<ActionCategory, number> {
  const scores = new Map<ActionCategory, number>();
  const bump = (category: ActionCategory, amount: number) => {
    scores.set(category, (scores.get(category) ?? 0) + amount);
  };

  bump('training', 1);

  const surface = getOriginSurfaceForPlayer(player);
  if (surface) {
    const { guidanceQuality, socialCapital, familyResources, hardshipExposure } =
      surface.immediateConditions;
    for (const bias of surface.eventBiasTags) {
      const category = BIAS_TAG_TO_CATEGORY[bias.tag];
      if (category) {
        bump(category, Math.max(0.35, bias.multiplier - 0.75));
      }
    }
    if (guidanceQuality >= 0.45) bump('study', 1.2);
    if (socialCapital >= 0.35) bump('socializing', 1);
    if (familyResources >= 0.4) bump('business', 1);
    if (hardshipExposure >= 0.45) bump('travel', 0.9);
    if (hardshipExposure >= 0.55 && familyResources < 0.4) bump('travel', 0.6);
  }

  const strategy = resolvePersonaStrategy(flags);
  if (strategy === 'balanced') {
    bump('training', 0.6);
    bump('study', 0.6);
    bump('socializing', 0.5);
  } else if (strategy) {
    bump(strategy, 2.25);
  }

  return scores;
}

function childhoodLiteForCategory(category: ActionCategory): ActiveActionDefinition | undefined {
  const actionId = LITE_ACTION_BY_CATEGORY[category];
  return getChildhoodActionById(actionId);
}

/**
 * Build a limited childhood palette from origin + persona/upbringing signals.
 * Never includes adult-framed minimum actions.
 */
export function resolveChildhoodActionPalette(
  context: ChildhoodPaletteContext,
): ActiveActionDefinition[] {
  const { age, player, flags } = context;
  if (age > CHILDHOOD_MAX_AGE) {
    return getMinimumActions();
  }
  if (!shouldOfferDailyPlanning(age)) {
    return [];
  }

  const maxCategories = age <= EARLY_CHILDHOOD_MAX_AGE ? 2 : 4;
  const ranked = [...scoreChildhoodCategories(player, flags).entries()].sort(
    (a, b) => b[1] - a[1],
  );

  const palette: ActiveActionDefinition[] = [];
  const seen = new Set<string>();
  for (const [category] of ranked) {
    if (palette.length >= maxCategories) break;
    const action = childhoodLiteForCategory(category);
    if (!action || seen.has(action.id)) continue;
    seen.add(action.id);
    palette.push(action);
  }

  if (palette.length === 0) {
    const fallback = getChildhoodActionById('action_childhood_training');
    return fallback ? [fallback] : childhoodActionCatalog.slice(0, 1);
  }

  if (flags?.p8_route_demonic === true && age >= 5 && age <= 9) {
    const travelAction = childhoodLiteForCategory('travel');
    if (travelAction && !seen.has(travelAction.id)) {
      palette.push(travelAction);
    }
  }

  return palette;
}

/** @deprecated use resolveChildhoodActionPalette */
export function filterActionsForChildhoodAgency(
  actions: ActiveActionDefinition[],
  age: number,
  player?: PlayerState,
  flags?: Record<string, unknown>,
): ActiveActionDefinition[] {
  if (age > CHILDHOOD_MAX_AGE) {
    return actions;
  }
  return resolveChildhoodActionPalette({ age, player, flags });
}

export function isActionSuppressedForAge(actionId: string, age: number): boolean {
  if (age > CHILDHOOD_MAX_AGE) return false;
  return ADULT_CHILDHOOD_BLOCKED_ACTIONS.has(actionId);
}

export function getChildhoodAgencyPaletteIds(context: ChildhoodPaletteContext): string[] {
  return resolveChildhoodActionPalette(context).map(action => action.id);
}

export function childhoodPalettesDifferByArchetype(): boolean {
  const scholar = resolveChildhoodActionPalette({
    age: 6,
    player: { traitProfile: { origin: 'scholar_house' } } as PlayerState,
    flags: { p8_persona_id: 'p8-scholar-su' },
  }).map(a => a.id);
  const business = resolveChildhoodActionPalette({
    age: 6,
    player: { traitProfile: { origin: 'merchant_house' } } as PlayerState,
    flags: { p8_persona_id: 'p8-wealth-shen' },
  }).map(a => a.id);
  const social = resolveChildhoodActionPalette({
    age: 6,
    player: { traitProfile: { origin: 'streetborn' } } as PlayerState,
    flags: { p8_persona_id: 'p8-social-gu' },
  }).map(a => a.id);
  const travel = resolveChildhoodActionPalette({
    age: 6,
    player: { traitProfile: { origin: 'frontier_military' } } as PlayerState,
    flags: { p8_persona_id: 'p8-explorer-lu' },
  }).map(a => a.id);

  const sets = [scholar, business, social, travel];
  const allOnlyTraining = sets.every(ids => ids.every(id => id === 'action_childhood_training'));
  const pairwiseDistinct = scholar.join() !== business.join() || scholar.join() !== social.join();
  return !allOnlyTraining && pairwiseDistinct;
}

function hasTruthyFlag(flags: Record<string, unknown>, key: string): boolean {
  const value = flags[key];
  return value !== undefined && value !== false && value !== null && value !== '';
}

function childhoodRouteLocked(flags: Record<string, unknown>): {
  business: boolean;
  travel: boolean;
  social: boolean;
} {
  return {
    business:
      hasTruthyFlag(flags, 'p9_early_business_focus') || hasTruthyFlag(flags, 'p9_echo_business_hook'),
    travel:
      hasTruthyFlag(flags, 'p9_early_travel_focus') || hasTruthyFlag(flags, 'p9_echo_travel_hook'),
    social:
      hasTruthyFlag(flags, 'p9_early_social_focus') || hasTruthyFlag(flags, 'p9_echo_social_hook'),
  };
}

/**
 * Lock childhood lite echoes into P9 route entry at the youth boundary (age 13+).
 * Childhood-established route entry wins over deferred upbringing from origin only.
 */
export function promoteYouthRouteEntryFromUpbringing(state: GameState): void {
  const flags = state.flags;
  const locked = childhoodRouteLocked(flags);
  const demonicRoute = hasTruthyFlag(flags, 'p8_route_demonic');

  if (locked.business) {
    flags.p9_early_business_focus = true;
  }
  if (locked.travel) {
    if (demonicRoute) {
      if (hasTruthyFlag(flags, 'p9_echo_travel_hook')) {
        flags.p9_demonic_restless_journey = true;
      }
    } else {
      flags.p9_early_travel_focus = true;
    }
  }
  if (locked.social) {
    flags.p9_early_social_focus = true;
  }

  if (
    hasTruthyFlag(flags, 'p16_deferred_business_upbringing') &&
    !locked.business &&
    !locked.travel
  ) {
    flags.p9_echo_business_hook = true;
    flags.p9_early_business_focus = true;
  }
  if (
    !demonicRoute &&
    hasTruthyFlag(flags, 'p16_deferred_travel_upbringing') &&
    !locked.travel &&
    !locked.business
  ) {
    flags.p9_echo_travel_hook = true;
    flags.p9_early_travel_focus = true;
  }
  if (
    hasTruthyFlag(flags, 'p16_deferred_social_upbringing') &&
    !locked.social &&
    !locked.business
  ) {
    flags.p9_echo_social_hook = true;
    flags.p9_early_social_focus = true;
  }
}

/**
 * At youth transition, seed route-adjacent flags from upbringing (not infant commerce/travel).
 */
export function applyYouthTransitionSeeds(
  state: GameState,
  previousAge: number,
  newAge: number,
): void {
  if (previousAge >= YOUTH_MIN_AGE || newAge < YOUTH_MIN_AGE) {
    return;
  }
  const surface = getOriginSurfaceForPlayer(state.player);
  if (!surface) {
    return;
  }
  const { familyResources, socialCapital, hardshipExposure } = surface.immediateConditions;
  const locked = childhoodRouteLocked(state.flags);
  if (familyResources >= 0.45 && !locked.travel) {
    state.flags.p16_deferred_business_upbringing = true;
  }
  if (socialCapital >= 0.4 && !locked.business && !locked.travel) {
    state.flags.p16_deferred_social_upbringing = true;
  }
  if (hardshipExposure >= 0.5 && familyResources < 0.35 && !locked.business) {
    state.flags.p16_deferred_travel_upbringing = true;
  }

  promoteYouthRouteEntryFromUpbringing(state);
}
