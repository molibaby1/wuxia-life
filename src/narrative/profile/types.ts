import type { EchoHook } from '../config/echoHooks';
import type { RouteDefinition } from '../config/routeDefinitions';
import type { LifeStageConfig } from '../config/stageConfig';
import type { SummaryTemplatePart } from '../config/summaryTemplates';

/** How a stat is consumed at runtime — not save-schema metadata. */
export type WorldProfileStatRole =
  | 'player_facing'
  | 'scheduling_relevant'
  | 'implicit'
  | 'action_reward';

/** Spendable or accumulable theme resource — maps to player fields, not save schema. */
export type WorldProfileResourceRole = 'spendable' | 'accumulable' | 'both';

export interface WorldProfileStatEntry {
  id: string;
  label: string;
  role: WorldProfileStatRole;
}

export interface WorldProfileResourceEntry {
  id: string;
  label: string;
  role: WorldProfileResourceRole;
}

export interface WorldProfileIdentityTrack {
  id: string;
  label: string;
  routeIds: string[];
  identitySignalFlags?: string[];
}

export interface WorldProfileActionFamily {
  id: string;
  label: string;
  category: string;
  actionIds: string[];
}

export interface WorldProfileSummarySignal {
  slot: 'early_life' | 'turning_point' | 'age40_identity';
  variableName: string;
  description: string;
  sourceRole: 'origin' | 'route_identity' | 'route_preference' | 'echo' | 'template';
}

/** Theme-neutral 0–1 scale for origin-linked material and social conditions. */
export interface OriginResourceExposure {
  familyResources: number;
  guidanceQuality: number;
  socialCapital: number;
  hardshipExposure: number;
  regionalBackground: string;
}

/** Shaping deltas applied over childhood; distinct from immediate resource snapshot. */
export interface OriginWorldviewShaping {
  discipline: number;
  endurance: number;
  caution: number;
  empathy: number;
  ambition: number;
  socialEase: number;
}

export interface WorldProfileOriginSurface {
  originId: string;
  label: string;
  resources: OriginResourceExposure;
  /** Snapshot applied when resolving childhood material/guidance weighting. */
  immediateConditions: OriginResourceExposure;
  shapingTendencies: OriginWorldviewShaping;
  eventBiasTags: Array<{ tag: string; multiplier: number }>;
}

export type DestinyDimension =
  | 'skill_growth'
  | 'social_capital'
  | 'resources'
  | 'reputation'
  | 'key_choices'
  | 'special_event';

export interface CompositeDestinyRequirement {
  dimension: DestinyDimension;
  minValue?: number;
  requiredFlags?: string[];
  blockedByFlags?: string[];
}

export interface CompositeDestinyOutcome {
  id: string;
  label: string;
  requirements: CompositeDestinyRequirement[];
  requireAll?: boolean;
}

export interface CompositeDestinyDimensionProgress {
  dimension: DestinyDimension;
  status: 'satisfied' | 'missing' | 'blocked';
  currentValue?: number;
  requiredValue?: number;
  detail: string;
}

export interface CompositeDestinyProgressReport {
  outcomeId: string;
  outcomeLabel: string;
  unlocked: boolean;
  dimensions: CompositeDestinyDimensionProgress[];
}

export interface ChildhoodShapingRule {
  id: string;
  sourceTag: string;
  tendency: keyof OriginWorldviewShaping;
  increment: number;
  thresholdForSurfacing: number;
}

export interface RareEventLineConfig {
  id: string;
  label: string;
  baseProbability: number;
  originConditions?: string[];
  stageConditions?: { minAge?: number; maxAge?: number };
  priorChoiceFlags?: string[];
  unlocksFlags?: string[];
  altersOpportunityTags?: string[];
}

/**
 * Executable world pack contract for a single theme.
 *
 * Playable profile requirements (all required for gate pass):
 * - stats, resources, identityTracks, actionFamilies, summarySignals (non-empty)
 * - stageConfig, routeDefinitions, echoHooks, summaryTemplates (non-empty narrative sections)
 *
 * Optional descriptive metadata: label only at top level.
 */
export interface WorldProfile {
  id: string;
  label: string;
  stats: WorldProfileStatEntry[];
  resources: WorldProfileResourceEntry[];
  identityTracks: WorldProfileIdentityTrack[];
  actionFamilies: WorldProfileActionFamily[];
  summarySignals: WorldProfileSummarySignal[];
  stageConfig: LifeStageConfig[];
  routeDefinitions: RouteDefinition[];
  echoHooks: EchoHook[];
  summaryTemplates: SummaryTemplatePart[];
  /** P16: profile-first origin resource, exposure, and shaping surfaces. */
  originSurfaces?: WorldProfileOriginSurface[];
  /** P16: multi-factor high-level outcome requirements. */
  compositeDestinyOutcomes?: CompositeDestinyOutcome[];
  /** P16: childhood experience → tendency mapping. */
  childhoodShapingRules?: ChildhoodShapingRule[];
  /** P16: luck-weighted opportunity lines. */
  rareEventLines?: RareEventLineConfig[];
  /** P17: sustained relationship consequence patterns. */
  relationshipConsequencePatterns?: RelationshipConsequencePattern[];
  /** P17: faction and social-identity consequence patterns. */
  factionIdentityConsequencePatterns?: FactionIdentityConsequencePattern[];
  /** P17: post-achievement maintenance requirements. */
  achievementMaintenancePatterns?: AchievementMaintenancePattern[];
}

export type RelationshipConsequenceKind =
  | 'support'
  | 'obligation'
  | 'entanglement'
  | 'feud'
  | 'betrayal_risk'
  | 'social_shielding';

export type RelationshipLifePathSignal =
  | 'ally'
  | 'enemy'
  | 'mentor'
  | 'disciple'
  | 'must_protect'
  | 'sworn_enemy';

export interface ConsequenceTagWeight {
  tag: string;
  multiplier: number;
}

export interface RelationshipConsequencePattern {
  id: string;
  label: string;
  consequenceKind: RelationshipConsequenceKind;
  /** Flags that activate this pattern (any match). */
  triggerFlags?: string[];
  /** lifePath bucket signals (any non-empty bucket). */
  lifePathSignals?: RelationshipLifePathSignal[];
  baseIntensity: number;
  opportunityTags?: ConsequenceTagWeight[];
  riskTags?: ConsequenceTagWeight[];
  summarySignal?: string;
}

export type FactionConsequenceKind =
  | 'protection'
  | 'access'
  | 'duty'
  | 'exposure'
  | 'rivalry'
  | 'political_cost';

export interface FactionIdentityConsequencePattern {
  id: string;
  label: string;
  layer: 'organization' | 'social_status';
  consequenceKind: FactionConsequenceKind;
  triggerFlags?: string[];
  baseIntensity: number;
  opportunityTags?: ConsequenceTagWeight[];
  riskTags?: ConsequenceTagWeight[];
  summarySignal?: string;
}

export type MaintenanceDimension =
  | 'reputation'
  | 'followers'
  | 'resources'
  | 'alliances'
  | 'internal_stability'
  | 'external_threat';

export interface MaintenanceDimensionRequirement {
  dimension: MaintenanceDimension;
  /** Target level 0–1 inferred from stats/flags. */
  requiredLevel: number;
  /** Risk-tag boost per unit of unmet pressure. */
  neglectRiskMultiplier: number;
  /** Stat or flag keys used to infer satisfaction (documentation + resolver). */
  satisfactionSignals: string[];
}

export interface AchievementMaintenancePattern {
  id: string;
  label: string;
  achievementFlags: string[];
  dimensions: MaintenanceDimensionRequirement[];
  opportunityTags?: ConsequenceTagWeight[];
  neglectRiskTags?: ConsequenceTagWeight[];
  summarySignal?: string;
}

export interface ResolvedConsequencePattern {
  patternId: string;
  label: string;
  kind: string;
  intensity: number;
  source: string;
}

export interface UnmetMaintenancePressure {
  patternId: string;
  dimension: MaintenanceDimension;
  requiredLevel: number;
  currentLevel: number;
  pressure: number;
}

export interface LaterLifeConsequenceReport {
  age: number;
  activeRelationshipPatterns: ResolvedConsequencePattern[];
  activeFactionPatterns: ResolvedConsequencePattern[];
  activeMaintenancePatterns: string[];
  unmetMaintenance: UnmetMaintenancePressure[];
  aggregateUnmetPressure: number;
  opportunityMultiplier: number;
  riskMultiplier: number;
  combinedMultiplier: number;
}

/** Sections required for a playable world profile — used by P12 verification. */
export const PLAYABLE_PROFILE_SECTION_KEYS = [
  'stats',
  'resources',
  'identityTracks',
  'actionFamilies',
  'summarySignals',
  'stageConfig',
  'routeDefinitions',
  'echoHooks',
  'summaryTemplates',
] as const;

export type PlayableProfileSectionKey = (typeof PLAYABLE_PROFILE_SECTION_KEYS)[number];

export interface ProfileSectionValidation {
  key: PlayableProfileSectionKey;
  present: boolean;
  count: number;
  required: boolean;
}

export interface ProfileValidationResult {
  worldId: string;
  sections: ProfileSectionValidation[];
  missingRequired: PlayableProfileSectionKey[];
  decision: 'pass' | 'warning' | 'fail';
  messages: string[];
  warnings: string[];
}
