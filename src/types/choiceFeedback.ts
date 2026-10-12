import type { EffectDefinition, PlayerState } from './eventTypes';
import type { ItemId } from './item';

export interface ChoiceFeedbackItemChange {
  itemId: ItemId;
  displayName: string;
  change: 'acquired' | 'lost';
}

/** `player` = default UI; `hidden` = tracked but not shown in player flow; `diagnostic` = dev/debug only */
export type ChoiceFeedbackVisibility = 'player' | 'hidden' | 'diagnostic';

export interface ChoiceFeedbackStatImpact {
  stat: keyof PlayerState | string;
  delta: number;
  visibility: ChoiceFeedbackVisibility;
  label?: string;
}

export interface ChoiceFeedbackRelationshipImpact {
  relationId: string;
  relationName?: string;
  delta: number;
  visibility: ChoiceFeedbackVisibility;
}

export interface ChoiceFeedbackRouteImpact {
  routeKey: string;
  from?: string | null;
  to?: string | null;
  reason?: string;
  visibility: ChoiceFeedbackVisibility;
}

export interface ChoiceFeedbackLongTermFlag {
  flag: string;
  value: boolean;
  reason?: string;
  visibility: ChoiceFeedbackVisibility;
}

export interface ChoiceFeedbackRiskHint {
  code: string;
  hint: string;
  severity: 'low' | 'medium' | 'high';
  visibility: ChoiceFeedbackVisibility;
}

export interface ChoiceFeedbackPlayerView {
  narrativeResult: string | null;
  statImpacts: ChoiceFeedbackStatImpact[];
  relationshipImpacts: ChoiceFeedbackRelationshipImpact[];
  routeImpact: ChoiceFeedbackRouteImpact | null;
  longTermFlags: ChoiceFeedbackLongTermFlag[];
  riskHints: ChoiceFeedbackRiskHint[];
  itemChanges?: ChoiceFeedbackItemChange[];
}

export interface ChoiceFeedbackDiagnosticView {
  sourceEventId?: string;
  sourceChoiceId?: string;
  sourceOutcomeId?: string;
  rawEffects: EffectDefinition[];
}

export interface ChoiceFeedbackModel {
  player: ChoiceFeedbackPlayerView;
  diagnostic: ChoiceFeedbackDiagnosticView;
}

export interface ChoiceFeedbackInput {
  narrativeResult?: string | null;
  sourceEventId?: string;
  sourceChoiceId?: string;
  sourceOutcomeId?: string;
  rawEffects?: EffectDefinition[];
  itemChanges?: ChoiceFeedbackItemChange[];
}

export function createChoiceFeedback(
  input: ChoiceFeedbackInput = {},
): ChoiceFeedbackModel {
  const narrativeResult =
    typeof input.narrativeResult === 'string' && input.narrativeResult.trim().length > 0
      ? input.narrativeResult.trim()
      : null;

  return {
    player: {
      narrativeResult,
      statImpacts: [],
      relationshipImpacts: [],
      routeImpact: null,
      longTermFlags: [],
      riskHints: [],
      ...(input.itemChanges?.length ? { itemChanges: input.itemChanges } : {}),
    },
    diagnostic: {
      sourceEventId: input.sourceEventId,
      sourceChoiceId: input.sourceChoiceId,
      sourceOutcomeId: input.sourceOutcomeId,
      rawEffects: input.rawEffects ?? [],
    },
  };
}
