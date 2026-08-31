import type {
  ChoiceOutcome,
  EventChoice,
  EventDefinition,
  GameState,
} from '../types/eventTypes';
import type {
  PersonArchetypeId,
  PersonEventBinding,
  PersonVariantDefinition,
} from '../types/personArchetype';
import {
  getPersonArchetype,
  getPersonVariant,
  isPersonSex,
} from '../data/personArchetypeCatalog';

export interface PersonBoundEventMaterialization {
  event: EventDefinition | null;
  state: GameState;
}

export function personVariantFactKey(archetypeId: PersonArchetypeId): string {
  return `person_variant:${archetypeId}`;
}

export function readBoundPersonVariant(
  state: GameState,
  archetypeId: PersonArchetypeId,
): PersonVariantDefinition | undefined {
  const fact = state.facts[personVariantFactKey(archetypeId)];
  return typeof fact === 'string' ? getPersonVariant(archetypeId, fact) : undefined;
}

export function canSatisfyPersonBinding(
  state: GameState,
  binding: PersonEventBinding,
): boolean {
  const archetype = getPersonArchetype(binding.archetypeId);
  if (!archetype) {
    return false;
  }

  const factKey = personVariantFactKey(binding.archetypeId);
  if (Object.prototype.hasOwnProperty.call(state.facts, factKey)) {
    return readBoundPersonVariant(state, binding.archetypeId) !== undefined;
  }

  if (binding.mode === 'require' || !isPersonSex(state.player.gender)) {
    return false;
  }

  return archetype.variantByPlayerGender[state.player.gender] !== undefined;
}

export function materializePersonBoundEvent(
  state: GameState,
  event: EventDefinition,
  options: { allowCreate: boolean },
): PersonBoundEventMaterialization {
  const binding = event.personBinding;
  if (!binding) {
    return { event, state };
  }

  const factKey = personVariantFactKey(binding.archetypeId);
  const hasPersistedFact = Object.prototype.hasOwnProperty.call(state.facts, factKey);
  let variant = hasPersistedFact
    ? readBoundPersonVariant(state, binding.archetypeId)
    : undefined;

  if (hasPersistedFact && !variant) {
    return { event: null, state };
  }

  if (!variant) {
    if (binding.mode !== 'create' || !options.allowCreate) {
      return { event: null, state };
    }

    const archetype = getPersonArchetype(binding.archetypeId);
    if (!archetype || !isPersonSex(state.player.gender)) {
      return { event: null, state };
    }

    const variantId = archetype.variantByPlayerGender[state.player.gender];
    variant = getPersonVariant(binding.archetypeId, variantId);
    if (!variant) {
      return { event: null, state };
    }

    state = {
      ...state,
      facts: {
        ...state.facts,
        [factKey]: variant.id,
      },
    };
  }

  return {
    event: renderPersonPresentation(event, variant),
    state,
  };
}

export function getBoundPersonDisplayName(
  state: GameState,
  archetypeId: PersonArchetypeId,
): string | undefined {
  return readBoundPersonVariant(state, archetypeId)?.displayName;
}

function renderPersonPresentation(
  event: EventDefinition,
  variant: PersonVariantDefinition,
): EventDefinition {
  const choices = event.choices?.map(renderChoice(variant));

  return {
    ...event,
    content: {
      ...event.content,
      title: renderText(event.content.title, variant),
      text: renderText(event.content.text, variant),
      description: renderText(event.content.description, variant),
    },
    choices,
  };
}

function renderChoice(variant: PersonVariantDefinition) {
  return (choice: EventChoice): EventChoice => ({
    ...choice,
    text: renderText(choice.text, variant),
    description: renderText(choice.description, variant),
    outcomes: choice.outcomes?.map(renderOutcome(variant)),
  });
}

function renderOutcome(variant: PersonVariantDefinition) {
  return (outcome: ChoiceOutcome): ChoiceOutcome => ({
    ...outcome,
    text: renderText(outcome.text, variant),
  });
}

function renderText(text: string | undefined, variant: PersonVariantDefinition): string | undefined {
  if (text === undefined) {
    return undefined;
  }

  return text
    .replaceAll('{{person.name}}', variant.displayName)
    .replaceAll('{{person.pronoun}}', variant.pronoun)
    .replaceAll('{{person.address}}', variant.address);
}
