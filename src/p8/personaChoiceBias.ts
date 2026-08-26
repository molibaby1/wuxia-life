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

  const choiceLower = ctx.choiceId.toLowerCase();

  if (persona.routePreference === 'demonic') {
    if (choiceLower.includes('orthodox') || choiceLower.includes('righteous')) {
      bonus -= 140;
    }
    if (
      choiceLower.includes('dark')
      || choiceLower.includes('demonic')
      || choiceLower.includes('unconventional')
      || choiceLower.includes('shadow')
    ) {
      bonus += 90;
    }
  }

  if (persona.routePreference === 'martial') {
    if (
      choiceLower.includes('orthodox')
      || choiceLower.includes('righteous')
      || choiceLower.includes('challenge')
      || choiceLower.includes('duel')
      || choiceLower.includes('join_sect')
      || choiceLower.includes('accept_duel')
    ) {
      bonus += 55;
    }
    if (choiceLower.includes('decline') || choiceLower.includes('observe_only') || choiceLower.includes('dark')) {
      bonus -= 45;
    }
  }

  if (persona.routePreference === 'conservative') {
    if (
      choiceLower.includes('decline')
      || choiceLower.includes('refuse')
      || choiceLower.includes('observe')
      || choiceLower.includes('steady')
      || choiceLower.includes('simple')
    ) {
      bonus += 35;
    }
    if (choiceLower.includes('challenge') || choiceLower.includes('dark') || choiceLower.includes('risk')) {
      bonus -= 45;
    }
  }

  if (persona.routePreference === 'balanced') {
    if (choiceLower.includes('balance') || choiceLower.includes('balanced')) {
      bonus += 45;
    } else if (
      choiceLower.includes('study')
      || choiceLower.includes('mediate')
      || choiceLower.includes('peace')
    ) {
      bonus += 30;
    }
  }

  for (const effect of effects) {
    if (effect.type === 'flag_set') {
      const flagName = String(effect.target ?? (effect as { flag?: string }).flag ?? '').toLowerCase();
      if (persona.routePreference === 'demonic' && (flagName.includes('orthodox') || flagName === 'joined_sect')) {
        bonus -= 120;
      }
      if (persona.routePreference === 'martial' && (flagName.includes('martial') || flagName.includes('orthodox'))) {
        bonus += 35;
      }
      if (persona.routePreference === 'conservative' && flagName.includes('injury')) {
        bonus -= 80;
      }
      continue;
    }

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
    if (persona.routePreference === 'martial' && effect.target === 'martialPower') {
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
