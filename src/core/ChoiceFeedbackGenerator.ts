import type { ChoiceFeedbackModel } from '../types';
import type { EffectDefinition, PlayerState } from '../types/eventTypes';
import { createChoiceFeedbackFallback } from '../types';

interface GenerateChoiceFeedbackInput {
  narrativeResult?: string | null;
  effects: EffectDefinition[];
  sourceEventId?: string;
  sourceChoiceId?: string;
  sourceOutcomeId?: string;
  beforePlayer?: PlayerState;
  afterPlayer?: PlayerState;
  beforeFlags?: Record<string, unknown>;
  afterFlags?: Record<string, unknown>;
}

const ROUTE_FLAGS = new Set(['route_orthodox', 'route_demonic', 'route_wanderer', 'sect_faction']);

export function generateChoiceFeedback(input: GenerateChoiceFeedbackInput): ChoiceFeedbackModel {
  const baseFeedback = createChoiceFeedbackFallback({
    narrativeResult: input.narrativeResult,
    sourceEventId: input.sourceEventId,
    sourceChoiceId: input.sourceChoiceId,
    sourceOutcomeId: input.sourceOutcomeId,
    rawEffects: input.effects,
  });

  for (const effect of input.effects) {
    if (effect.type === 'stat_modify') {
      const target = effect.stat || effect.target;
      if (!target) {
        continue;
      }
      const rawValue = typeof effect.value === 'number' ? effect.value : 0;
      const operator = effect.operator ?? 'add';
      const delta = operator === 'subtract' ? -Math.abs(rawValue) : rawValue;
      if (delta === 0) {
        continue;
      }
      baseFeedback.player.statImpacts.push({
        stat: target,
        delta,
        visibility: 'player',
      });
      continue;
    }

    if (effect.type === 'relation_change') {
      const relationId = effect.target || 'unknown_relation';
      const delta = typeof effect.value === 'number' ? effect.value : 0;
      baseFeedback.player.relationshipImpacts.push({
        relationId,
        delta,
        visibility: 'player',
      });
      continue;
    }

    if (effect.type === 'flag_set') {
      const flag = effect.flag || effect.target;
      if (!flag) {
        continue;
      }
      baseFeedback.player.longTermFlags.push({
        flag,
        value: Boolean(effect.value ?? true),
        visibility: 'player',
      });
    }
  }

  const routeImpact = resolveRouteImpact(input.beforeFlags, input.afterFlags);
  if (routeImpact) {
    baseFeedback.player.routeImpact = routeImpact;
  }

  return baseFeedback;
}

function resolveRouteImpact(
  beforeFlags: Record<string, unknown> | undefined,
  afterFlags: Record<string, unknown> | undefined,
) {
  const beforeRoute = readRouteLabel(beforeFlags);
  const afterRoute = readRouteLabel(afterFlags);
  if (beforeRoute === afterRoute) {
    return null;
  }

  return {
    routeKey: 'main_route',
    from: beforeRoute,
    to: afterRoute,
    reason: 'flag_transition',
    visibility: 'player' as const,
  };
}

function readRouteLabel(flags: Record<string, unknown> | undefined): string | null {
  if (!flags) {
    return null;
  }

  const sectFaction = flags.sect_faction;
  if (typeof sectFaction === 'string' && sectFaction.length > 0) {
    return sectFaction;
  }

  for (const routeFlag of ROUTE_FLAGS) {
    if (routeFlag === 'sect_faction') {
      continue;
    }
    if (flags[routeFlag]) {
      return routeFlag;
    }
  }
  return null;
}
