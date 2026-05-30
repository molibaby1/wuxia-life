import { ConditionEvaluator } from './ConditionEvaluator';
import type {
  EffectDefinition,
  EventChoice,
  EventCondition,
  EventDefinition,
  GameState,
} from '../types/eventTypes';

export interface ResolvedChoiceEffects {
  effects: EffectDefinition[];
  choiceId: string;
  outcomeId?: string;
  outcomeText?: string;
}

export type ChoiceConditionPredicate = (condition: unknown) => boolean;

function isConditionSatisfied(
  condition: unknown,
  isConditionMet: ChoiceConditionPredicate
): boolean {
  if (!condition) {
    return true;
  }
  return isConditionMet(condition);
}

function createStateConditionPredicate(state: GameState): ChoiceConditionPredicate {
  const evaluator = new ConditionEvaluator();
  return (condition: unknown) => {
    if (!condition) {
      return true;
    }
    if (typeof condition === 'function') {
      return false;
    }
    return evaluator.evaluate(condition as EventCondition, state);
  };
}

function pickFirstChoice(
  choices: EventChoice[],
  isConditionMet: ChoiceConditionPredicate
): EventChoice | null {
  const available = choices.filter(choice =>
    isConditionSatisfied(choice.condition, isConditionMet)
  );
  if (available.length > 0) {
    return available[0];
  }
  return choices[0] ?? null;
}

function resolveOutcomeEffects(
  choice: EventChoice,
  isConditionMet: ChoiceConditionPredicate
): Pick<ResolvedChoiceEffects, 'effects' | 'outcomeId' | 'outcomeText'> {
  let effects = choice.effects || [];

  if (!choice.outcomes || choice.outcomes.length === 0) {
    return { effects };
  }

  for (const outcome of choice.outcomes) {
    if (!isConditionSatisfied(outcome.condition, isConditionMet)) {
      continue;
    }
    return {
      effects: outcome.effects || [],
      outcomeId: outcome.id,
      outcomeText: outcome.text,
    };
  }

  return { effects };
}

export function resolveChoiceEffects(
  state: GameState,
  event: EventDefinition,
  choice?: EventChoice,
  isConditionMet?: ChoiceConditionPredicate
): ResolvedChoiceEffects | null {
  if (!event.choices || event.choices.length === 0) {
    return null;
  }

  const predicate = isConditionMet ?? createStateConditionPredicate(state);
  const selectedChoice = choice ?? pickFirstChoice(event.choices, predicate);
  if (!selectedChoice) {
    return null;
  }

  if (!isConditionSatisfied(selectedChoice.condition, predicate)) {
    return null;
  }

  const { effects, outcomeId, outcomeText } = resolveOutcomeEffects(
    selectedChoice,
    predicate
  );

  return {
    effects,
    choiceId: selectedChoice.id,
    outcomeId,
    outcomeText,
  };
}

export function resolveFirstChoiceEffects(
  gameEngine: { isChoiceAvailable(condition: unknown): boolean },
  state: GameState,
  event: EventDefinition
): ResolvedChoiceEffects | null {
  return resolveChoiceEffects(state, event, undefined, condition =>
    gameEngine.isChoiceAvailable(condition as EventCondition | undefined)
  );
}
