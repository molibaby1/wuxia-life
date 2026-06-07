import type {
  PersonaActionStrategyInput,
  PersonaActionStrategyOutput,
  PersonaActionStrategy,
} from './types';

const STRATEGY_CATEGORY_PRIORITY: Record<PersonaActionStrategy, string[]> = {
  training: ['training', 'study', 'socializing', 'business', 'travel'],
  study: ['study', 'training', 'socializing', 'business', 'travel'],
  socializing: ['socializing', 'study', 'training', 'business', 'travel'],
  business: ['business', 'training', 'study', 'socializing', 'travel'],
  travel: ['travel', 'socializing', 'study', 'training', 'business'],
  balanced: ['training', 'study', 'socializing', 'business', 'travel'],
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
export function selectPersonaActiveAction(
  input: PersonaActionStrategyInput,
): PersonaActionStrategyOutput {
  const priorities = STRATEGY_CATEGORY_PRIORITY[input.persona.strategy] ?? STRATEGY_CATEGORY_PRIORITY.balanced;

  for (const category of priorities) {
    const picked = pickByCategory(input, category);
    if (picked) {
      if (
        input.focusStreakCategory === category &&
        input.focusStreakCount >= 4 &&
        input.persona.riskPreference !== 'low'
      ) {
        const altCategory = priorities.find(c => c !== category);
        if (altCategory) {
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
