import type { ChoiceFeedbackModel } from '../types';
import type { EffectDefinition, PlayerState } from '../types/eventTypes';
import { createChoiceFeedbackFallback } from '../types';
import {
  isPlayerVisibleFlag,
  readRawRouteKeyFromFlags,
} from '../utils/playerFacingLabels';
import { calculatePublicStatDeltas } from './activePlanning/periodSummaryBuilder';

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

export function generateChoiceFeedback(input: GenerateChoiceFeedbackInput): ChoiceFeedbackModel {
  const baseFeedback = createChoiceFeedbackFallback({
    narrativeResult: input.narrativeResult,
    sourceEventId: input.sourceEventId,
    sourceChoiceId: input.sourceChoiceId,
    sourceOutcomeId: input.sourceOutcomeId,
    rawEffects: input.effects,
  });

  const useActualPublicDelta = input.beforePlayer != null && input.afterPlayer != null;

  for (const effect of input.effects) {
    if (effect.type === 'stat_modify') {
      if (useActualPublicDelta) {
        // Actual-delta mode: player-visible public stats come from after-before only.
        continue;
      }
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
      const relationId = effect.target || '';
      const delta = typeof effect.value === 'number' ? effect.value : 0;
      if (!relationId || delta === 0) {
        continue;
      }
      const relationName = input.afterPlayer?.relationships?.find(
        relationship => relationship.id === relationId,
      )?.name;
      baseFeedback.player.relationshipImpacts.push({
        relationId,
        relationName,
        delta,
        visibility: relationName ? 'player' : 'hidden',
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
        visibility: isPlayerVisibleFlag(flag) ? 'player' : 'hidden',
      });
      continue;
    }

    if (
      effect.type === 'special'
      && (effect.target === 'set_spouse' || effect.target === 'set_spouse_from_person')
      && typeof effect.value === 'string'
    ) {
      baseFeedback.player.statImpacts.push({
        stat: 'spouse',
        delta: 1,
        visibility: 'player',
      });
      continue;
    }
  }

  if (useActualPublicDelta) {
    const deltas = calculatePublicStatDeltas(input.beforePlayer!, input.afterPlayer!);
    for (const [stat, delta] of Object.entries(deltas)) {
      baseFeedback.player.statImpacts.push({
        stat,
        delta,
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
  const beforeRoute = readRawRouteKeyFromFlags(beforeFlags);
  const afterRoute = readRawRouteKeyFromFlags(afterFlags);
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
