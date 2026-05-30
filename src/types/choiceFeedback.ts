import type { EffectDefinition, PlayerState } from './eventTypes';

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
  narrativeResult: string;
  statImpacts: ChoiceFeedbackStatImpact[];
  relationshipImpacts: ChoiceFeedbackRelationshipImpact[];
  routeImpact: ChoiceFeedbackRouteImpact | null;
  longTermFlags: ChoiceFeedbackLongTermFlag[];
  riskHints: ChoiceFeedbackRiskHint[];
}

export interface ChoiceFeedbackDiagnosticView {
  fallbackUsed: boolean;
  fallbackReason?: string;
  sourceEventId?: string;
  sourceChoiceId?: string;
  sourceOutcomeId?: string;
  rawEffects: EffectDefinition[];
}

export interface ChoiceFeedbackModel {
  player: ChoiceFeedbackPlayerView;
  diagnostic: ChoiceFeedbackDiagnosticView;
}

export interface ChoiceFeedbackFallbackInput {
  narrativeResult?: string | null;
  sourceEventId?: string;
  sourceChoiceId?: string;
  sourceOutcomeId?: string;
  rawEffects?: EffectDefinition[];
}

const DEFAULT_NARRATIVE_FALLBACK = '你的选择激起了涟漪，后续影响仍在发酵。';

/**
 * 当上游未提供反馈内容时，生成可渲染、可追踪的最小反馈结构。
 */
export function createChoiceFeedbackFallback(
  input: ChoiceFeedbackFallbackInput = {},
): ChoiceFeedbackModel {
  const hasNarrative = typeof input.narrativeResult === 'string' && input.narrativeResult.trim().length > 0;

  return {
    player: {
      narrativeResult: hasNarrative ? input.narrativeResult!.trim() : DEFAULT_NARRATIVE_FALLBACK,
      statImpacts: [],
      relationshipImpacts: [],
      routeImpact: null,
      longTermFlags: [],
      riskHints: [],
    },
    diagnostic: {
      fallbackUsed: !hasNarrative,
      fallbackReason: hasNarrative ? undefined : 'missing_narrative_result',
      sourceEventId: input.sourceEventId,
      sourceChoiceId: input.sourceChoiceId,
      sourceOutcomeId: input.sourceOutcomeId,
      rawEffects: input.rawEffects ?? [],
    },
  };
}
