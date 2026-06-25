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
  /** P25 Wave 4: vivid =鲜明出身; ordinary =平凡出身 (distinct opportunity structure). */
  originTier?: 'vivid' | 'ordinary';
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
  maxValue?: number;
  requiredFlags?: string[];
  anyOfFlags?: string[];
  blockedByFlags?: string[];
  /** P25 pinnacle: classify flag gates for choice vs luck attribution. */
  gateKind?: 'choice' | 'luck';
}

/** P25 mixed: cross-track requirement group for partial-progress reporting. */
export interface MixedCrossTrackGroup {
  trackId: string;
  trackLabel: string;
  /** Indices into `requirements`; group satisfied when all listed requirements are met. */
  requirementIndices: number[];
}

export interface CompositeDestinyOutcome {
  id: string;
  label: string;
  requirements: CompositeDestinyRequirement[];
  requireAll?: boolean;
  tier?: 'mainstream' | 'pinnacle' | 'mixed';
  /** P25 pinnacle: stat grind cannot substitute a missed rare-line window. */
  grindCannotSubstituteLuck?: boolean;
  /** P25 mixed: cross-track groups (≥2) per North Star §3.3. */
  crossTrackGroups?: MixedCrossTrackGroup[];
  /** P25 mixed: may unlock alongside these outcome ids in the same life. */
  coexistWith?: string[];
  /** P25 mixed: cannot unlock if any listed outcome id is also unlocked. */
  mutexWith?: string[];
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
  /** P25 pinnacle: which dual gate (choice / luck) blocks unlock. */
  unmetGates?: { choice?: string; luck?: string };
  /** P25 mixed: per-track unmet dimension detail for sim output. */
  unmetCrossTracks?: Record<string, string>;
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
  /** P25: pinnacle-tier outcomes (choice + luck dual gate), separate from mainstream. */
  pinnacleDestinyOutcomes?: CompositeDestinyOutcome[];
  /** P25 Wave 3: mixed-tier cross-track outcomes, separate from mainstream/pinnacle. */
  mixedDestinyOutcomes?: CompositeDestinyOutcome[];
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
  /** P18: successor role definitions (disciple, heir, offspring, etc.). */
  successorRoleConfigs?: SuccessorRoleConfig[];
  /** P18: inheritable asset and burden channels. */
  inheritanceChannelPatterns?: InheritanceChannelPattern[];
  /** P18: successor cultivation cost and underinvestment pressure. */
  successorCultivationCostPatterns?: SuccessorCultivationCostPattern[];
  /** P18: representative legacy outcome patterns (transmission, rupture, etc.). */
  legacyOutcomePatterns?: LegacyOutcomePattern[];
  /** P19: representative endgame category configs. */
  endgameCategoryConfigs?: EndgameCategoryConfig[];
  /** P19: pre-endgame closure recovery patterns. */
  preEndgameRecoveryPatterns?: PreEndgameRecoveryPattern[];
  /** P19: posthumous historical-memory evaluation patterns. */
  historicalMemoryPatterns?: HistoricalMemoryPattern[];
  /** P20: representative archetype family coverage configs. */
  archetypeFamilyConfigs?: ArchetypeFamilyConfig[];
  /** P20: repetition pressure and novelty distribution configs. */
  repetitionPressureConfigs?: RepetitionPressureConfig[];
  /** P20: per-archetype whole-life pacing profiles. */
  archetypePacingProfiles?: ArchetypePacingProfile[];
  /** P20: representative replay slice definitions. */
  replaySliceConfigs?: ReplaySliceConfig[];
  /** P21: style and fit constraint rules for content production. */
  contentStyleConstraints?: ContentStyleConstraint[];
  /** P21: duplicate-risk and recurrence boundary rules. */
  contentDuplicateConstraints?: ContentDuplicateConstraint[];
  /** P21: bounded LLM content addition contract. */
  llmContentContract?: LlmContentContractConfig;
  /** P21: bounded LLM tuning contract. */
  llmTuningContract?: LlmTuningContractConfig;
  /** P21: representative tuning sample configs. */
  tuningSampleConfigs?: TuningSampleConfig[];
  /** P22: baseline content pools for live-ops comparison. */
  baselinePoolConfigs?: BaselinePoolConfig[];
  /** P22: minimum coverage expectations per pool band. */
  libraryCoverageExpectations?: LibraryCoverageExpectation[];
  /** P22: representative live-ops content wave manifests. */
  liveOpsWaveConfigs?: LiveOpsContentWaveConfig[];
  /** P22: tuning samples tied to expansion waves. */
  liveOpsTuningSampleConfigs?: TuningSampleConfig[];
  /** P23: representative experience dimensions for acceptance review. */
  experienceDimensionConfigs?: ExperienceDimensionConfig[];
  /** P23: stronger/weaker slice acceptance baselines per dimension. */
  experienceAcceptanceBaselineConfigs?: ExperienceAcceptanceBaselineConfig[];
  /** P23: wave-to-wave experience comparison samples. */
  experienceComparisonSampleConfigs?: ExperienceComparisonSampleConfig[];
  /** P23: long-term balance indicators for sustained tuning. */
  longTermBalanceIndicatorConfigs?: LongTermBalanceIndicatorConfig[];
  /** P23: live-balance wave samples (high-value, low-value, redirection). */
  liveBalanceWaveSampleConfigs?: LiveBalanceWaveSampleConfig[];
  /** P24: playtest dimension configs for outward calibration. */
  playtestDimensionConfigs?: PlaytestDimensionConfig[];
  /** P24: playtest feedback capture schema fields. */
  playtestFeedbackSchema?: PlaytestFeedbackSchemaConfig;
  /** P24: RC evaluation input/output field definitions. */
  rcEvaluationSchema?: RcEvaluationSchemaConfig;
  /** P24: internal-to-external alignment comparison configs. */
  alignmentComparisonConfigs?: AlignmentComparisonConfig[];
  /** P24: stronger/weaker playtest calibration baselines. */
  playtestCalibrationBaselineConfigs?: PlaytestCalibrationBaselineConfig[];
  /** P24: representative playtest comparison samples. */
  playtestComparisonSampleConfigs?: PlaytestComparisonSampleConfig[];
  /** P24: internal-external alignment indicators. */
  alignmentIndicatorConfigs?: AlignmentIndicatorConfig[];
  /** P24: RC comparison samples (weak outward, redirection, targeted fix). */
  rcComparisonSampleConfigs?: RcComparisonSampleConfig[];
}

export type CoverageHealthClass = 'strong' | 'weak' | 'sparse' | 'repetitive';

export type BaselinePoolLifePhase =
  | 'origin'
  | 'childhood'
  | 'early_route'
  | 'midlife_consequence'
  | 'legacy_endgame';

export interface BaselinePoolConfig {
  id: string;
  label: string;
  lifePhase: BaselinePoolLifePhase;
  sourcePaths: string[];
  eventTagPrefixes: string[];
  minimumEventCount: number;
  knownThinAreas: string[];
  comparisonNotes: string;
}

export interface LibraryCoverageExpectation {
  poolId: string;
  minimumEventCount: number;
  minimumDistinctRouteSignals: number;
  minimumArchetypeTags: number;
  thinCoverageThreshold: number;
  repetitiveOverlapThreshold: number;
  authoringNotes: string;
}

export interface LiveOpsContentWaveConfig {
  id: string;
  label: string;
  lifePhase: 'early_life' | 'mid_life' | 'late_life';
  targetPoolId: string;
  targetWeakness: string;
  eventIds: string[];
  workflowSteps: string[];
}

export interface LibraryCoveragePoolSnapshot {
  poolId: string;
  label: string;
  eventCount: number;
  distinctRouteSignals: number;
  archetypeTagCount: number;
  healthClass: CoverageHealthClass;
  thinCoverage: boolean;
  repetitiveRisk: boolean;
  detail: string;
}

export interface WeakSpotFinding {
  poolId: string;
  findingKind: 'thin_coverage' | 'over_concentration' | 'duplicate_risk';
  severity: 'low' | 'medium' | 'high';
  metric: string;
  value: number;
  threshold: number;
  detail: string;
}

export interface LibraryCoverageMatrixRow {
  poolId: string;
  lifePhase: BaselinePoolLifePhase;
  healthClass: CoverageHealthClass;
  eventCount: number;
  meetsMinimum: boolean;
  archetypeSupportScore: number;
  duplicationRiskScore: number;
  weakArchetypeTargets: string[];
}

export interface LibraryCoverageValidationMatrix {
  generatedAt: string;
  rows: LibraryCoverageMatrixRow[];
  weakSpots: WeakSpotFinding[];
  summary: {
    poolCount: number;
    strongCount: number;
    weakOrSparseCount: number;
    repetitiveCount: number;
    expansionEventCount: number;
  };
  decision: 'pass' | 'warning' | 'fail';
}

export type ContentConstraintDimension =
  | 'route_fit'
  | 'stage_fit'
  | 'tone_consistency'
  | 'theme_fit';

export interface ContentStyleConstraint {
  id: string;
  label: string;
  dimension: ContentConstraintDimension;
  requiredSignals: string[];
  blockedPatterns: string[];
  minimumScore: number;
  toneMarkers?: string[];
  authoringNotes: string;
}

export interface ContentDuplicateConstraint {
  id: string;
  label: string;
  riskClass: string;
  maxSameClassInLookback: number;
  lookbackYears: number;
  acceptableRecurrence: string;
  harmfulOverlapThreshold: number;
  authoringNotes: string;
}

export interface LlmContentContractConfig {
  id: string;
  label: string;
  allowedContentRoles: string[];
  requiredInputs: string[];
  allowedOutputs: string[];
  requiredOutputFields: string[];
  validationSteps: string[];
  disallowedOutputs: string[];
}

export interface LlmTuningContractConfig {
  id: string;
  label: string;
  allowedTuningClasses: string[];
  requiredInputs: string[];
  allowedOutputFields: string[];
  validationSteps: string[];
  disallowedOutputs: string[];
}

export type TuningSampleClass =
  | 'route_distribution'
  | 'stage_pacing'
  | 'archetype_coverage'
  | 'repetition_pressure'
  | 'endgame_distribution';

export interface TuningSampleConfig {
  id: string;
  label: string;
  tuningClass: TuningSampleClass;
  targetFieldPath: string;
  baselineValue: number;
  tunedValue: number;
  validationMetric: string;
  expectedDelta: string;
  authoringNotes: string;
}

export interface ContentConstraintFinding {
  constraintId: string;
  dimension: ContentConstraintDimension | 'duplicate_risk';
  eventId?: string;
  score: number;
  passed: boolean;
  detail: string;
}

export interface ContentConstraintReport {
  generatedAt: string;
  eventCount: number;
  findings: ContentConstraintFinding[];
  stylePassRate: number;
  duplicateRiskPassRate: number;
  decision: 'pass' | 'warning' | 'fail';
}

export interface LlmContentValidationResult {
  valid: boolean;
  missingFields: string[];
  blockedOutputs: string[];
  constraintFindings: ContentConstraintFinding[];
  decision: 'pass' | 'warning' | 'fail';
}

export interface LlmTuningValidationResult {
  valid: boolean;
  tuningClass: string;
  fieldPath: string;
  withinBounds: boolean;
  measurableDelta: boolean;
  detail: string;
  decision: 'pass' | 'warning' | 'fail';
}

export interface ProductionMatrixRow {
  eventId: string;
  contentRole: string;
  routeFitScore: number;
  stageFitScore: number;
  archetypeFitScore: number;
  toneScore: number;
  duplicateRiskScore: number;
  llmAssisted: boolean;
  configOnly: boolean;
  coherent: boolean;
}

export interface ProductionValidationMatrix {
  generatedAt: string;
  rows: ProductionMatrixRow[];
  summary: {
    totalSamples: number;
    coherentCount: number;
    configOnlyCount: number;
    avgRouteFit: number;
    avgDuplicateRisk: number;
  };
  decision: 'pass' | 'warning' | 'fail';
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

export type SuccessorRoleKind =
  | 'disciple'
  | 'heir'
  | 'offspring'
  | 'adopted_successor'
  | 'inheriting_student';

export interface SuccessorRoleConfig {
  id: string;
  label: string;
  roleKind: SuccessorRoleKind;
  triggerFlags?: string[];
  lifePathSignals?: string[];
  /** Weight applied to inferred successor quality for this role. */
  cultivationCapacityWeight: number;
  /** Inheritance channel ids this role may overlap in the first P18 pass. */
  inheritanceChannelOverlap: string[];
  qualitySignals: string[];
}

export type InheritanceChannelKind =
  | 'martial_teaching'
  | 'technical_skill'
  | 'social_capital'
  | 'wealth_industry'
  | 'reputation'
  | 'vendetta'
  | 'responsibility';

export type InheritancePolarity = 'asset' | 'burden' | 'mixed';

export interface InheritanceChannelPattern {
  id: string;
  label: string;
  channelKind: InheritanceChannelKind;
  polarity: InheritancePolarity;
  triggerFlags?: string[];
  lifePathSignals?: string[];
  baseIntensity: number;
  opportunityTags?: ConsequenceTagWeight[];
  riskTags?: ConsequenceTagWeight[];
  /** Minimum successor quality to avoid burden collapse (burden/mixed channels). */
  requiredQualityForStability?: number;
  summarySignal?: string;
}

export type CultivationCostDimension =
  | 'time'
  | 'attention'
  | 'resources'
  | 'political_exposure'
  | 'emotional_burden'
  | 'deferred_progress';

export interface CultivationCostRequirement {
  dimension: CultivationCostDimension;
  requiredLevel: number;
  underinvestmentRiskMultiplier: number;
  satisfactionSignals: string[];
}

export interface SuccessorCultivationCostPattern {
  id: string;
  label: string;
  successorRoleFlags: string[];
  costDimensions: CultivationCostRequirement[];
  opportunityTags?: ConsequenceTagWeight[];
  neglectRiskTags?: ConsequenceTagWeight[];
  summarySignal?: string;
}

export type LegacyOutcomeKind =
  | 'transmission_success'
  | 'network_obligation'
  | 'inherited_burden'
  | 'underinvestment'
  | 'burden_without_capability'
  | 'rupture_betrayal';

export interface LegacyOutcomePattern {
  id: string;
  label: string;
  outcomeKind: LegacyOutcomeKind;
  triggerFlags?: string[];
  lifePathSignals?: string[];
  baseIntensity: number;
  opportunityTags?: ConsequenceTagWeight[];
  riskTags?: ConsequenceTagWeight[];
  successionQualityDelta: number;
  summarySignal?: string;
}

export interface UnmetCultivationPressure {
  patternId: string;
  dimension: CultivationCostDimension;
  requiredLevel: number;
  currentLevel: number;
  pressure: number;
}

export interface LaterLifeLegacyReport {
  age: number;
  activeSuccessorRoles: string[];
  activeInheritanceChannels: ResolvedConsequencePattern[];
  activeCultivationCostPatterns: string[];
  activeLegacyOutcomes: string[];
  unmetCultivationPressure: UnmetCultivationPressure[];
  aggregateUnmetPressure: number;
  successionQualityScore: number;
  opportunityMultiplier: number;
  riskMultiplier: number;
  combinedMultiplier: number;
}

export type EndgameCategoryKind =
  | 'legendary_echo'
  | 'bittersweet_closure'
  | 'isolated_fade'
  | 'infamous_echo'
  | 'quiet_continuity';

export interface EndgameCategoryTrajectoryWeights {
  relationshipScore?: number;
  factionScore?: number;
  legacyScore?: number;
  achievementScore?: number;
  burdenScore?: number;
}

export interface EndgameCategoryConfig {
  id: string;
  label: string;
  categoryKind: EndgameCategoryKind;
  triggerFlags?: string[];
  lifePathSignals?: string[];
  trajectoryWeights: EndgameCategoryTrajectoryWeights;
  baseWeight: number;
  summarySignal?: string;
}

export type PreEndgameRecoveryKind = 'reconciliation' | 'reward' | 'collapse' | 'retribution';

export type PreEndgameRecoveryDimension =
  | 'relationship'
  | 'vendetta'
  | 'faction'
  | 'inheritance'
  | 'obligation';

export interface PreEndgameRecoveryPattern {
  id: string;
  label: string;
  dimension: PreEndgameRecoveryDimension;
  recoveryKind: PreEndgameRecoveryKind;
  triggerFlags?: string[];
  lifePathSignals?: string[];
  baseIntensity: number;
  opportunityTags?: ConsequenceTagWeight[];
  riskTags?: ConsequenceTagWeight[];
  summaryLine?: string;
  explicitInSummary: boolean;
}

export type HistoricalMemoryDimension =
  | 'local_remembrance'
  | 'jianghu_reputation'
  | 'faction_memory'
  | 'legacy_testimony'
  | 'moral_ambiguity'
  | 'distorted_legacy';

export type HistoricalMemoryTone =
  | 'admired'
  | 'respected'
  | 'feared'
  | 'disputed'
  | 'forgotten'
  | 'mixed';

export interface HistoricalMemoryPattern {
  id: string;
  label: string;
  dimension: HistoricalMemoryDimension;
  memoryTone: HistoricalMemoryTone;
  triggerFlags?: string[];
  lifePathSignals?: string[];
  baseIntensity: number;
  livedRealityDelta?: number;
  summaryLine?: string;
  classificationReason?: string;
  /** When true, every triggerFlag must be active (default: any match). */
  requireAllTriggerFlags?: boolean;
}

export interface ResolvedEndgameCategory {
  categoryId: string;
  label: string;
  kind: EndgameCategoryKind;
  weight: number;
  source: string;
}

export interface EndgameCategoryReport {
  age: number;
  selectedCategory: ResolvedEndgameCategory;
  candidates: ResolvedEndgameCategory[];
  trajectoryInputs: Record<string, number>;
}

export interface ResolvedPreEndgameRecovery {
  patternId: string;
  label: string;
  dimension: PreEndgameRecoveryDimension;
  recoveryKind: PreEndgameRecoveryKind;
  intensity: number;
  summaryLine?: string;
}

export interface PreEndgameRecoveryReport {
  age: number;
  activeRecoveries: ResolvedPreEndgameRecovery[];
  reconciliatoryCount: number;
  destructiveCount: number;
  explicitSummaryLines: string[];
  opportunityMultiplier: number;
  riskMultiplier: number;
  combinedMultiplier: number;
}

export interface ResolvedHistoricalMemory {
  patternId: string;
  label: string;
  dimension: HistoricalMemoryDimension;
  memoryTone: HistoricalMemoryTone;
  intensity: number;
  livedRealityDelta: number;
}

export interface HistoricalMemoryReport {
  selectedTone: HistoricalMemoryTone;
  dominantDimension: HistoricalMemoryDimension;
  activePatterns: ResolvedHistoricalMemory[];
  livedSelfUnderstanding: string;
  posthumousReputation: string;
  divergenceScore: number;
  classificationLines: string[];
}

export interface P19FinalSummaryComposition {
  endgameCategory: ResolvedEndgameCategory;
  personalFateLine: string;
  recoveryLines: string[];
  legacyContinuationLine: string;
  historicalMemoryLines: string[];
  composedSummary: string;
}

export type ArchetypeFamilyKind =
  | 'martial_ascendant'
  | 'scholar_statesman'
  | 'wealth_merchant'
  | 'hermit_withdrawal'
  | 'demonic_outlaw';

export interface ArchetypeLifecycleSignals {
  originIds?: string[];
  originTags?: string[];
  growthPatternFlags?: string[];
  routeIdentityKeys?: string[];
  socialRoleFlags?: string[];
  legacyShapeFlags?: string[];
  endgameCategoryKinds?: EndgameCategoryKind[];
  historicalMemoryTones?: HistoricalMemoryTone[];
}

export interface ArchetypeFamilyConfig {
  id: string;
  label: string;
  familyKind: ArchetypeFamilyKind;
  lifecycleSignals: ArchetypeLifecycleSignals;
  baseWeight: number;
  opportunityTags?: ConsequenceTagWeight[];
  riskTags?: ConsequenceTagWeight[];
  summarySignal?: string;
}

export interface RepetitionPressureConfig {
  id: string;
  label: string;
  /** Per exact repeat within lookback window (0–1 decay factor). */
  exactRepeatSuppression: number;
  /** Boost for event ids not seen in lookback window. */
  noveltyPreference: number;
  /** Minimum weight retained for same-theme tagged events. */
  thematicContinuityFloor: number;
  /** Extra variance for non-dominant route events. */
  routeVarianceBoost: number;
  /** Target diversity 0–1 for event-pool spread. */
  poolDiversityTarget: number;
  /** Minimum years between same payoff-class events. */
  crossStagePayoffMinSpacing: number;
  lookbackYears?: number;
  eventClassTags?: string[];
}

export interface StagePacingProfile {
  stageId: string;
  densityMultiplier: number;
  routePressureOffsetYears: number;
  payoffSpacingMultiplier: number;
  callbackCadenceYears: number;
}

export type EndgameClosureRhythm = 'early' | 'standard' | 'delayed' | 'fragmented';

export interface ArchetypePacingProfile {
  archetypeFamilyId: string;
  stageProfiles: StagePacingProfile[];
  endgameClosureRhythm: EndgameClosureRhythm;
}

export type ReplaySliceEmphasis =
  | 'origin_early_growth'
  | 'midlife_consequence'
  | 'legacy_endgame_memory';

export interface ReplaySliceConfig {
  id: string;
  label: string;
  emphasis: ReplaySliceEmphasis;
  archetypeFamilyId: string;
  seedFlags: string[];
  validationSignals: string[];
}

export interface ResolvedArchetypeFamily {
  familyId: string;
  label: string;
  kind: ArchetypeFamilyKind;
  score: number;
  matchedSignals: string[];
}

export interface ArchetypeCoverageReport {
  age: number;
  selectedFamily: ResolvedArchetypeFamily;
  candidates: ResolvedArchetypeFamily[];
  lifecycleCoverage: Record<string, number>;
  distinctiveBeyondRouteLabel: boolean;
}

export interface RepetitionPressureReport {
  age: number;
  exactRepeatDecay: number;
  noveltyBoost: number;
  thematicFloor: number;
  recentExactRepeats: number;
  unseenEventRatio: number;
  combinedMultiplier: number;
}

export interface StagePacingSnapshot {
  stageId: string;
  densityMultiplier: number;
  routePressureOffsetYears: number;
  payoffSpacingMultiplier: number;
  callbackCadenceYears: number;
  effectiveDensity: number;
}

export interface WholeLifePacingReport {
  age: number;
  archetypeFamilyId: string;
  currentStageId: string;
  stageSnapshots: StagePacingSnapshot[];
  endgameClosureRhythm: EndgameClosureRhythm;
  pacingMultiplier: number;
  comparisonLines: string[];
}

export type ExperienceDimension =
  | 'archetype_strength'
  | 'replay_distinctiveness'
  | 'route_differentiation'
  | 'stage_pacing_health'
  | 'mid_late_payoff'
  | 'legacy_resonance'
  | 'endgame_aftertaste';

export type ExperienceMeasurabilityClass = 'explicit' | 'partial' | 'inferred';

export interface ExperienceDimensionConfig {
  id: ExperienceDimension;
  label: string;
  lifePhases: string[];
  measurabilityClass: ExperienceMeasurabilityClass;
  interpretationGuide: string;
  evidenceSources: string[];
}

export interface ExperienceAcceptanceBaselineConfig {
  id: string;
  label: string;
  dimension: ExperienceDimension;
  strongerSliceId: string;
  weakerSliceId: string;
  minimumScoreDelta: number;
  scoringFields: string[];
  authoringNotes: string;
}

export interface ExperienceComparisonSampleConfig {
  id: string;
  label: string;
  dimension: ExperienceDimension;
  strongerSliceId: string;
  weakerSliceId: string;
  comparisonMetric: string;
  wholeLife: boolean;
  sliceLevel: boolean;
  authoringNotes: string;
}

export interface LongTermBalanceIndicatorConfig {
  id: string;
  label: string;
  dimension: ExperienceDimension;
  interpretation: string;
  healthyRange: { min: number; max: number };
  baselineValue: number;
  comparisonNotes: string;
}

export type LiveBalanceWaveClass =
  | 'high_value_tuning'
  | 'low_value_detection'
  | 'tuning_redirection'
  | 'full_life_operation';

export interface LiveBalanceWaveSampleConfig {
  id: string;
  label: string;
  waveClass: LiveBalanceWaveClass;
  targetDimension: ExperienceDimension;
  contentVolumeDelta: number;
  experienceDeltaExpected: number;
  redirectedFromWaveId?: string;
  authoringNotes: string;
}

export interface ExperienceBaselineScore {
  baselineId: string;
  dimension: ExperienceDimension;
  strongerSliceId: string;
  weakerSliceId: string;
  strongerScore: number;
  weakerScore: number;
  scoreDelta: number;
  orderingCorrect: boolean;
  passed: boolean;
}

export interface ExperienceComparisonOutcome {
  sampleId: string;
  dimension: ExperienceDimension;
  strongerScore: number;
  weakerScore: number;
  delta: number;
  wholeLifeScore?: number;
  sliceLevelScore?: number;
  distinguishesStrongerWeaker: boolean;
  passed: boolean;
}

export interface LongTermBalanceIndicatorSnapshot {
  indicatorId: string;
  label: string;
  dimension: ExperienceDimension;
  currentValue: number;
  baselineValue: number;
  healthyRange: { min: number; max: number };
  inHealthyRange: boolean;
  deltaFromBaseline: number;
}

export interface ExperienceAcceptanceMatrixRow {
  dimension: ExperienceDimension;
  baselinePassed: boolean;
  comparisonPassed: boolean;
  indicatorHealthy: boolean;
  weakAreaImproved: boolean;
  strongAreaProtected: boolean;
  detail: string;
}

export interface ExperienceAcceptanceValidationMatrix {
  generatedAt: string;
  rows: ExperienceAcceptanceMatrixRow[];
  baselineScores: ExperienceBaselineScore[];
  comparisonOutcomes: ExperienceComparisonOutcome[];
  balanceIndicators: LongTermBalanceIndicatorSnapshot[];
  liveBalanceSamples: Array<{
    sampleId: string;
    waveClass: string;
    passed: boolean;
    detail: string;
    redirected?: boolean;
  }>;
  summary: {
    dimensionCount: number;
    baselinesPassing: number;
    comparisonsPassing: number;
    indicatorsHealthy: number;
    lowValueWavesDetected: number;
    tuningRedirections: number;
  };
  decision: 'pass' | 'warning' | 'fail';
}

export type PlaytestDimension =
  | 'first_run_readability'
  | 'onboarding_motivation'
  | 'replay_distinctiveness'
  | 'route_differentiation'
  | 'late_game_payoff'
  | 'ending_aftertaste';

export type PlaytestMeasurabilityClass = 'human_testable' | 'partial_proxy' | 'uncalibrated';

export interface PlaytestDimensionConfig {
  id: PlaytestDimension;
  label: string;
  lifePhases: string[];
  measurabilityClass: PlaytestMeasurabilityClass;
  interpretationGuide: string;
  evidenceSources: string[];
}

export interface PlaytestFeedbackFieldConfig {
  fieldId: string;
  label: string;
  fieldType: 'string' | 'number' | 'enum' | 'text';
  required: boolean;
  semantics: string;
  enumValues?: string[];
}

export interface PlaytestFeedbackSchemaConfig {
  schemaVersion: string;
  capturePurpose: string;
  fields: PlaytestFeedbackFieldConfig[];
  triageHints: string[];
}

export interface RcEvaluationFieldConfig {
  fieldId: string;
  label: string;
  direction: 'input' | 'output';
  fieldType: 'string' | 'number' | 'enum' | 'boolean' | 'text';
  semantics: string;
  enumValues?: string[];
}

export const RC_RELEASE_READINESS_STATES = ['ship', 'hold', 'redirect'] as const;
export type RcReleaseReadiness = (typeof RC_RELEASE_READINESS_STATES)[number];

export const RC_BIAS_DIRECTIONS = ['overestimate', 'underestimate', 'aligned'] as const;
export type RcBiasDirection = (typeof RC_BIAS_DIRECTIONS)[number];

export interface RcEvaluationSchemaConfig {
  schemaVersion: string;
  evaluationPurpose: string;
  fields: RcEvaluationFieldConfig[];
  releaseReadinessThresholds: {
    minInternalHealth: number;
    minExternalAppeal: number;
    maxAlignmentGap: number;
  };
}

export interface AlignmentComparisonConfig {
  id: string;
  label: string;
  dimension: PlaytestDimension;
  internalEvidenceSource: string;
  externalEvidenceSource: string;
  overestimateThreshold: number;
  underestimateThreshold: number;
  authoringNotes: string;
}

export interface PlaytestCalibrationBaselineConfig {
  id: string;
  label: string;
  dimension: PlaytestDimension;
  strongerSliceId: string;
  weakerSliceId: string;
  minimumScoreDelta: number;
  scoringFields: string[];
  authoringNotes: string;
}

export interface PlaytestComparisonSampleConfig {
  id: string;
  label: string;
  dimension: PlaytestDimension;
  strongerSliceId: string;
  weakerSliceId: string;
  comparisonMetric: string;
  lifePhaseBand: 'early' | 'mid' | 'late_end';
  authoringNotes: string;
}

export interface AlignmentIndicatorConfig {
  id: string;
  label: string;
  dimension: PlaytestDimension;
  interpretation: string;
  healthyRange: { min: number; max: number };
  baselineValue: number;
  comparisonNotes: string;
}

export type RcComparisonSampleClass =
  | 'weak_outward_experience'
  | 'feedback_redirection'
  | 'targeted_fix_validation';

export interface RcComparisonSampleConfig {
  id: string;
  label: string;
  sampleClass: RcComparisonSampleClass;
  targetDimension: PlaytestDimension;
  internalHealthScore: number;
  externalAppealScore: number;
  expectedAlignmentBias: 'overestimate' | 'underestimate' | 'aligned';
  fixDescription?: string;
  redirectedFromSampleId?: string;
  authoringNotes: string;
}

export interface PlaytestBaselineScore {
  baselineId: string;
  dimension: PlaytestDimension;
  strongerSliceId: string;
  weakerSliceId: string;
  strongerScore: number;
  weakerScore: number;
  scoreDelta: number;
  orderingCorrect: boolean;
  passed: boolean;
}

export interface PlaytestComparisonOutcome {
  sampleId: string;
  dimension: PlaytestDimension;
  strongerScore: number;
  weakerScore: number;
  delta: number;
  lifePhaseBand: string;
  distinguishesStrongerWeaker: boolean;
  passed: boolean;
}

export interface AlignmentIndicatorSnapshot {
  indicatorId: string;
  label: string;
  dimension: PlaytestDimension;
  internalScore: number;
  externalProxyScore: number;
  alignmentGap: number;
  biasDirection: 'overestimate' | 'underestimate' | 'aligned';
  currentValue: number;
  baselineValue: number;
  healthyRange: { min: number; max: number };
  inHealthyRange: boolean;
}

export interface RcComparisonSampleResult {
  sampleId: string;
  sampleClass: RcComparisonSampleClass;
  targetDimension: PlaytestDimension;
  internalHealthScore: number;
  externalAppealScore: number;
  alignmentGap: number;
  biasDirection: string;
  passed: boolean;
  detail: string;
  redirected?: boolean;
  fixValidated?: boolean;
}

export interface PlaytestCalibrationMatrixRow {
  dimension: PlaytestDimension;
  baselinePassed: boolean;
  comparisonCovered: boolean;
  comparisonPassed: boolean;
  indicatorAligned: boolean;
  rcSamplePassed: boolean;
  detail: string;
}

export interface PlaytestCalibrationValidationMatrix {
  generatedAt: string;
  rows: PlaytestCalibrationMatrixRow[];
  baselineScores: PlaytestBaselineScore[];
  comparisonOutcomes: PlaytestComparisonOutcome[];
  alignmentIndicators: AlignmentIndicatorSnapshot[];
  rcComparisonResults: RcComparisonSampleResult[];
  summary: {
    dimensionCount: number;
    baselinesPassing: number;
    comparisonsPassing: number;
    comparisonsRequired: number;
    comparisonsCovered: number;
    comparisonCoverageComplete: boolean;
    comparisonsDimensionPassing: number;
    indicatorsAligned: number;
    rcSamplesPassing: number;
    falsePositiveDetected: number;
    redirectionsValidated: number;
    targetedFixesValidated: number;
  };
  decision: 'pass' | 'warning' | 'fail';
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
