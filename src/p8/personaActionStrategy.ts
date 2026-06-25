import type {
  PersonaActionStrategyInput,
  PersonaActionStrategyOutput,
  PersonaActionStrategy,
} from './types';

const STRATEGY_CATEGORY_PRIORITY: Record<PersonaActionStrategy, string[]> = {
  training: ['training', 'study', 'socializing', 'business', 'travel'],
  study: ['study', 'socializing', 'training', 'business', 'travel'],
  socializing: ['socializing', 'study', 'training', 'business', 'travel'],
  business: ['business', 'socializing', 'study', 'training', 'travel'],
  travel: ['travel', 'socializing', 'study', 'training', 'business'],
  balanced: ['study', 'socializing', 'business', 'training', 'travel'],
};

const CATEGORY_TO_DEFAULT_ACTION: Record<string, string> = {
  training: 'action_training_basic',
  study: 'action_study_basic',
  socializing: 'action_socializing_basic',
  business: 'action_business_basic',
  travel: 'action_travel_basic',
};

function pickByCategory(
  input: PersonaActionStrategyInput,
  category: string,
): PersonaActionStrategyOutput | null {
  const match = input.availableActions.find(a => a.category === category);
  if (!match) {
    return null;
  }
  return {
    actionId: match.actionId,
    reason: `persona_strategy:${input.persona.strategy} prefers ${category}`,
  };
}

/**
 * Select active action when no story event is available.
 * Degrades to first available candidate if preferred categories missing.
 */
function rotatedPriorities(
  priorities: string[],
  startIndex: number,
): string[] {
  if (priorities.length === 0) {
    return priorities;
  }
  const offset = ((startIndex % priorities.length) + priorities.length) % priorities.length;
  return [...priorities.slice(offset), ...priorities.slice(0, offset)];
}

export function selectPersonaActiveAction(
  input: PersonaActionStrategyInput,
): PersonaActionStrategyOutput {
  let priorities = STRATEGY_CATEGORY_PRIORITY[input.persona.strategy] ?? STRATEGY_CATEGORY_PRIORITY.balanced;

  if (input.persona.strategy === 'balanced') {
    priorities = rotatedPriorities(priorities, Math.floor(input.age / 3));
  } else if (input.persona.routePreference === 'demonic') {
    priorities = ['training', 'study', 'travel', 'socializing', 'business'];
    if (input.age < 13) {
      if (input.age === 5 || input.age === 11) {
        const study = pickByCategory(input, 'study');
        if (study) {
          return { ...study, reason: `${study.reason}; demonic_childhood_study_spike` };
        }
      }
      if (input.age === 9) {
        const business = pickByCategory(input, 'business');
        if (business) {
          return { ...business, reason: `${business.reason}; demonic_childhood_shadow_trade` };
        }
      }
    }
    if (input.age % 3 === 1 && input.age >= 13) {
      const study = pickByCategory(input, 'study');
      if (study) {
        return { ...study, reason: `${study.reason}; demonic_study_mix` };
      }
    }
  } else if (input.persona.routePreference === 'conservative') {
    priorities = ['training', 'study', 'socializing', 'business', 'travel'];
    if (input.age < 13) {
      if (input.age === 12) {
        const study = pickByCategory(input, 'study');
        if (study) {
          return { ...study, reason: `${study.reason}; cautious_childhood_study_once` };
        }
      }
      const steady = pickByCategory(input, 'training');
      if (steady) {
        return { ...steady, reason: `${steady.reason}; cautious_childhood_steady` };
      }
    }
  }

  for (const category of priorities) {
    const picked = pickByCategory(input, category);
    if (picked) {
      if (input.focusStreakCategory === category && input.focusStreakCount >= 4) {
        for (const altCategory of priorities.filter(c => c !== category)) {
          const alt = pickByCategory(input, altCategory);
          if (alt) {
            return {
              ...alt,
              reason: `${alt.reason}; broke_focus_streak:${input.focusStreakCount}`,
            };
          }
        }
      }
      return picked;
    }
  }

  const fallback = input.availableActions[0];
  if (fallback) {
    return {
      actionId: fallback.actionId,
      reason: `degraded_to_available:${fallback.category}`,
    };
  }

  return {
    actionId: CATEGORY_TO_DEFAULT_ACTION.training,
    reason: 'degraded_to_catalog_default:training',
  };
}

export type { PersonaActionStrategyInput, PersonaActionStrategyOutput };
