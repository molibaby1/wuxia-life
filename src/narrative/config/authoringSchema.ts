/**
 * P21 explicit authoring semantics for events, callbacks, summaries, and tuning metadata.
 * Profile-first; optional on content — no save-schema migration required.
 */

export type EventContentRole =
  | 'general'
  | 'route_sensitive'
  | 'stage_sensitive'
  | 'callback_sensitive'
  | 'endgame_sensitive'
  | 'archetype_sensitive';

export interface EventAuthoringSemantics {
  /** Lifecycle role for production workflow classification. */
  contentRole: EventContentRole;
  /** Route ids or identity keys this event reinforces. */
  routeFit?: string[];
  /** Stage signal keys from P11 vocabulary. */
  stageFit?: string[];
  /** Wuxia tone markers expected in title/text. */
  toneMarkers?: string[];
  /** Duplicate-risk class for recurrence checking. */
  duplicateRiskClass?: string;
  /** Human/LLM field guide. */
  authoringNotes?: string;
  /** Fields safe for LLM edit without runtime knowledge. */
  llmEditableFields?: Array<'content.text' | 'content.title' | 'choices' | 'weight' | 'metadata.tags'>;
}

export interface EchoHookAuthoringContract {
  /** Files that must be updated together with this hook. */
  requiredCompanionFiles: string[];
  /** How the hook flag is set (e.g. activeAction onCompleteFlags). */
  triggerSemantics: string;
  /** Condition pattern on callback event. */
  callbackConditionPattern: string;
  /** Fields an LLM may edit on the callback event. */
  llmEditableFields: string[];
}

export interface SummaryAuthoringGuide {
  /** Variables available in template string. */
  templateVariables: string[];
  /** Route match semantics for this template. */
  matchSemantics: string;
  llmEditableFields: Array<'template'>;
}

export type TuningClass =
  | 'route_distribution'
  | 'stage_pacing'
  | 'archetype_coverage'
  | 'repetition_pressure'
  | 'endgame_distribution';

export interface TuningMetadataSemantics {
  tuningClass: TuningClass;
  /** Profile or event field path for this tuning lever. */
  targetFieldPath: string;
  /** Allowed numeric range for weight/multiplier edits. */
  valueRange?: { min: number; max: number };
  /** How to validate before/after. */
  validationReport: string;
  authoringNotes: string;
}

export const EVENT_AUTHORING_FIELD_GUIDE: Record<string, string> = {
  'content.text': 'Main narrative body shown to player; must keep wuxia tone.',
  'content.title': 'Short headline; should reference period-appropriate frame.',
  'ageRange': 'Inclusive min/max ages; must align with stageFit signals.',
  'conditions': 'Flag/stat expressions; callback events use flags.has("<hookFlag>").',
  'metadata.pathAffinity': 'Route weight map 0–1; keys match routeDefinitions ids.',
  'metadata.narrativeScheduling': 'stageSignals + routePoints for P11 verification.',
  'metadata.authoringSemantics': 'P21 production classification and constraint input.',
  weight: 'Selection weight; higher = more frequent when conditions match.',
};

export const ECHO_AUTHORING_FIELD_GUIDE: Record<string, string> = {
  hookFlag: 'Set by source action onCompleteFlags; referenced in callback conditions.',
  callbackEventId: 'Event id in lines JSON; must exist and include hookFlag condition.',
  callbackAgeMin: 'Earliest age for callback selection.',
  callbackAgeMax: 'Latest age for callback selection.',
  summaryContribution: 'Optional age40_identity variable injection.',
};
