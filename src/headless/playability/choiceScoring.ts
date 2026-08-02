/**
 * Persona-biased choice selection for headless playability runs.
 */

import { GameEngineIntegration } from '../../core/GameEngineIntegration';
import type { EventChoice, EventDefinition } from '../../types/eventTypes';
import type { P8Persona } from '../../p8/types';
import type { ChoiceScoreDiagnostic } from '../../p8/types';
import { applyPersonaChoiceBias, rankChoiceScores } from '../../p8/personaChoiceBias';
import type { HeadlessEngineSession } from '../session/HeadlessEngineSession';

function collectChoiceEffects(choice: EventChoice): Array<{ type?: string; target?: string; value?: unknown; operator?: string }> {
  const effects: Array<{ type?: string; target?: string; value?: unknown; operator?: string }> = [];
  for (const effect of choice.effects ?? []) {
    effects.push(effect);
  }
  for (const outcome of choice.outcomes ?? []) {
    for (const effect of outcome.effects ?? []) {
      effects.push(effect);
    }
  }
  return effects;
}

function scoreByTendency(
  effects: Array<{ type?: string; target?: string; value?: unknown; operator?: string }>,
  tendency: P8Persona['choiceTendency'],
): number {
  let score = 0;
  for (const effect of effects) {
    if (effect.type !== 'stat_modify' || !effect.target) continue;
    const rawValue = typeof effect.value === 'number' ? effect.value : 0;
    const normalizedValue = effect.operator === 'subtract' ? -Math.abs(rawValue) : rawValue;
    const stat = effect.target;
    if (tendency === 'martial') {
      if (['martialPower', 'comprehension', 'constitution'].includes(stat)) {
        score += normalizedValue * 3;
      } else {
        score += normalizedValue;
      }
    } else if (tendency === 'wealth') {
      if (['money', 'businessAcumen', 'reputation', 'connections'].includes(stat)) {
        score += normalizedValue * 3;
      } else {
        score += normalizedValue * 0.7;
      }
    } else {
      score += normalizedValue;
    }
  }
  return score;
}

function getAvailableChoices(session: HeadlessEngineSession, event: EventDefinition): EventChoice[] {
  const engine = new GameEngineIntegration();
  engine.loadGameState(session.getRuntimeState());
  return (event.choices ?? []).filter(choice => {
    if (!choice.condition) return true;
    return engine.isChoiceAvailable(choice.condition);
  });
}

export interface PersonaChoiceSelection {
  choice: EventChoice;
  diagnostic: ChoiceScoreDiagnostic | null;
}

export function selectPersonaChoice(
  session: HeadlessEngineSession,
  event: EventDefinition,
  persona: P8Persona,
): PersonaChoiceSelection | null {
  const filtered = getAvailableChoices(session, event);
  if (filtered.length === 0) return null;

  const scoreBoard: Array<{ choiceId: string; score: number }> = [];
  let bestChoice = filtered[0];
  let bestScore = -Infinity;

  for (const choice of filtered) {
    const effects = collectChoiceEffects(choice);
    let score = scoreByTendency(effects, persona.choiceTendency);
    score = applyPersonaChoiceBias({
      persona,
      baseScore: score,
      choiceId: choice.id ?? '',
      eventId: event.id,
      effects,
    });
    scoreBoard.push({ choiceId: choice.id ?? '', score });
    if (score > bestScore) {
      bestScore = score;
      bestChoice = choice;
    }
  }

  let diagnostic: ChoiceScoreDiagnostic | null = null;
  if (bestScore > -Infinity) {
    const ranked = rankChoiceScores(scoreBoard);
    diagnostic = {
      eventId: event.id,
      selectedChoiceId: ranked.selectedChoiceId,
      selectedScore: ranked.selectedScore,
      runnerUpChoiceId: ranked.runnerUpChoiceId,
      runnerUpScore: ranked.runnerUpScore,
      personaId: persona.id,
    };
  }

  return { choice: bestChoice, diagnostic };
}
