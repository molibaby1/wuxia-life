import type { P8Persona } from './types';

export interface PersonaChoiceBiasContext {
  persona: P8Persona;
  baseScore: number;
  choiceId: string;
  eventId?: string;
  effects?: Array<{ type?: string; target?: string; value?: unknown; operator?: string }>;
}

const RISK_PENALTY_WEIGHT = 4;
const RELATIONSHIP_BONUS_STATS = new Set(['connections', 'charisma', 'reputation']);

/**
 * Extends base choiceTendency score with P8 persona dimensions.
 * Route-track hooks remain in GameProcessSimulator; this adds persona bias only.
 */
export function applyPersonaChoiceBias(ctx: PersonaChoiceBiasContext): number {
  let bonus = 0;
  const { persona, effects = [] } = ctx;

  for (const effect of effects) {
    if (effect.type !== 'stat_modify' || !effect.target) {
      continue;
    }
    const raw = typeof effect.value === 'number' ? effect.value : 0;
    const delta = effect.operator === 'subtract' ? -Math.abs(raw) : raw;

    if (persona.relationshipPreference === 'high' && RELATIONSHIP_BONUS_STATS.has(effect.target)) {
      bonus += delta * 1.5;
    } else if (persona.relationshipPreference === 'low' && RELATIONSHIP_BONUS_STATS.has(effect.target)) {
      bonus += delta * 0.6;
    }

    if (persona.riskPreference === 'low' && delta < 0) {
      bonus += delta * RISK_PENALTY_WEIGHT;
    } else if (persona.riskPreference === 'high' && delta < 0) {
      bonus += delta * 0.5;
    }

    if (persona.routePreference === 'demonic' && effect.target === 'chivalry' && delta < 0) {
      bonus += Math.abs(delta) * 0.8;
    }
    if (persona.routePreference === 'wealth' && effect.target === 'money') {
      bonus += delta * 1.2;
    }
    if (persona.routePreference === 'martial' && ['martialPower', 'externalSkill', 'internalSkill'].includes(effect.target)) {
      bonus += delta * 1.2;
    }
  }

  if (persona.routePreference !== 'balanced' && ctx.eventId?.includes(persona.routePreference)) {
    bonus += 50;
  }

  for (const goal of persona.shortTermGoals) {
    const spec = goal.evidenceSpec;
    if (spec.eventId && ctx.eventId === spec.eventId) {
      bonus += 120;
    }
    if (spec.flag && ctx.choiceId?.includes(spec.flag.replace(/_/g, ''))) {
      bonus += 40;
    }
  }

  return ctx.baseScore + bonus;
}

export interface ChoiceCompetitionResult {
  selectedChoiceId: string;
  selectedScore: number;
  runnerUpChoiceId: string | null;
  runnerUpScore: number | null;
}

export function rankChoiceScores(
  scores: Array<{ choiceId: string; score: number }>,
): ChoiceCompetitionResult {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const runner = sorted[1];
  return {
    selectedChoiceId: top?.choiceId ?? '',
    selectedScore: top?.score ?? 0,
    runnerUpChoiceId: runner?.choiceId ?? null,
    runnerUpScore: runner?.score ?? null,
  };
}
