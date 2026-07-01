import type { ChoiceFeedbackModel } from '../types';
import type { EffectDefinition, PlayerState } from '../types/eventTypes';
import { createChoiceFeedbackFallback } from '../types';
import {
  isPlayerVisibleFlag,
  readRawRouteKeyFromFlags,
} from '../utils/playerFacingLabels';
import {
  SHAPING_AXES,
  readShapingAxisValue,
  shapingFeedbackFlagKey,
} from '../utils/habitShapingSummary';

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

    if (effect.type === 'special' && effect.target === 'set_spouse' && typeof effect.value === 'string') {
      baseFeedback.player.statImpacts.push({
        stat: 'spouse',
        delta: 1,
        visibility: 'player',
      });
      continue;
    }
  }

  const routeImpact = resolveRouteImpact(input.beforeFlags, input.afterFlags);
  if (routeImpact) {
    baseFeedback.player.routeImpact = routeImpact;
  }

  appendShapingFeedbackHints(baseFeedback, input.beforePlayer, input.afterPlayer);

  return baseFeedback;
}

function appendShapingFeedbackHints(
  feedback: ChoiceFeedbackModel,
  beforePlayer?: PlayerState,
  afterPlayer?: PlayerState,
): void {
  if (!beforePlayer && !afterPlayer) {
    return;
  }

  for (const axis of SHAPING_AXES) {
    const delta = readShapingAxisValue(afterPlayer?.lifeStates, axis.key)
      - readShapingAxisValue(beforePlayer?.lifeStates, axis.key);
    if (delta < 1) {
      continue;
    }
    const flag = shapingFeedbackFlagKey(axis.key);
    feedback.player.longTermFlags.push({
      flag,
      value: true,
      visibility: isPlayerVisibleFlag(flag) ? 'player' : 'hidden',
    });
  }
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
