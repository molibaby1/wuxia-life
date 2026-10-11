import { ConditionEvaluator } from './ConditionEvaluator';
import { calculateFailureProbability } from './ChallengeSystem';
import { getChallengeScene } from '../data/challengeScenes';
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
  state: GameState,
  choice: EventChoice,
  isConditionMet: ChoiceConditionPredicate
): Pick<ResolvedChoiceEffects, 'effects' | 'outcomeId' | 'outcomeText'> {
  if (choice.challenge !== undefined) {
    const challenge = choice.challenge;
    if (!challenge || typeof challenge !== 'object') {
      throw new Error('Choice challenge configuration is invalid');
    }
    if (typeof challenge.sceneId !== 'string' || challenge.sceneId.length === 0) {
      throw new Error('Choice challenge scene is missing or invalid');
    }
    const scene = getChallengeScene(challenge.sceneId);
    if (!scene || scene.id !== challenge.sceneId) {
      throw new Error(`Choice challenge scene not found: ${challenge.sceneId}`);
    }

    const result = calculateFailureProbability(scene, state.player).isFailed
      ? challenge.failure
      : challenge.success;
    if (
      !result ||
      typeof result.id !== 'string' ||
      result.id.length === 0 ||
      typeof result.text !== 'string' ||
      result.text.length === 0 ||
      !Array.isArray(result.effects)
    ) {
      throw new Error(`Choice challenge result is invalid for scene: ${challenge.sceneId}`);
    }
    return {
      effects: result.effects,
      outcomeId: result.id,
      outcomeText: result.text,
    };
  }

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
    state,
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
