import type {
  ContentDuplicateConstraint,
  ContentStyleConstraint,
  LlmContentContractConfig,
  LlmTuningContractConfig,
  TuningSampleConfig,
} from './types';

export const WUXIA_CONTENT_STYLE_CONSTRAINTS: ContentStyleConstraint[] = [
  {
    id: 'p21_route_identity_fit',
    label: '路线身份契合',
    dimension: 'route_fit',
    requiredSignals: ['pathAffinity', 'authoringSemantics.routeFit'],
    blockedPatterns: ['cross_route_homogenization'],
    minimumScore: 0.6,
    authoringNotes: 'Route-sensitive events must declare pathAffinity matching routeFit.',
  },
  {
    id: 'p21_stage_lifecycle_fit',
    label: '阶段生命周期契合',
    dimension: 'stage_fit',
    requiredSignals: ['ageRange', 'narrativeScheduling.stageSignals'],
    blockedPatterns: ['stage_signal_vacuum'],
    minimumScore: 0.55,
    authoringNotes: 'Stage-sensitive events must declare stageSignals in age band.',
  },
  {
    id: 'p21_wuxia_tone_consistency',
    label: '武侠语气一致',
    dimension: 'tone_consistency',
    requiredSignals: ['toneMarkers'],
    blockedPatterns: ['modern_anachronism', 'slop_cluster'],
    minimumScore: 0.5,
    toneMarkers: ['江湖', '武功', '门派', '侠', '修炼', '恩怨', '师徒', '行走'],
    authoringNotes: 'Title or text should contain at least one wuxia tone marker.',
  },
  {
    id: 'p21_theme_recurrence_floor',
    label: '主题回响下限',
    dimension: 'theme_fit',
    requiredSignals: ['thematicContinuityFloor'],
    blockedPatterns: ['exact_repeat_congestion'],
    minimumScore: 0.45,
    authoringNotes: 'Acceptable recurrence within P20 thematicContinuityFloor; harmful above duplicate threshold.',
  },
];

export const WUXIA_CONTENT_DUPLICATE_CONSTRAINTS: ContentDuplicateConstraint[] = [
  {
    id: 'p21_exact_repeat_guard',
    label: '精确重复压控',
    riskClass: 'exact_repeat',
    maxSameClassInLookback: 1,
    lookbackYears: 8,
    acceptableRecurrence: 'setback_class_or_echo_callback',
    harmfulOverlapThreshold: 0.85,
    authoringNotes: 'Same event id or near-duplicate title within lookback is harmful unless setback/echo.',
  },
  {
    id: 'p21_route_homogenization_guard',
    label: '路线同质化风险',
    riskClass: 'route_homogenization',
    maxSameClassInLookback: 3,
    lookbackYears: 12,
    acceptableRecurrence: 'route_reinforcement_with_distinct_stage_signal',
    harmfulOverlapThreshold: 0.75,
    authoringNotes: 'Identical text/effects across unlike routes is harmful repetition.',
  },
  {
    id: 'p21_slop_cluster_guard',
    label: 'Slop 簇集风险',
    riskClass: 'slop_cluster',
    maxSameClassInLookback: 2,
    lookbackYears: 6,
    acceptableRecurrence: 'archetype_family_motif',
    harmfulOverlapThreshold: 0.7,
    authoringNotes: '>2 events same duplicateRiskClass overlapping age without stage advance is slop.',
  },
];

export const WUXIA_LLM_CONTENT_CONTRACT: LlmContentContractConfig = {
  id: 'p21_llm_content_addition',
  label: 'LLM 内容增补契约',
  allowedContentRoles: ['general', 'route_sensitive', 'stage_sensitive', 'callback_sensitive'],
  requiredInputs: [
    'contentRole',
    'targetRouteOrStage',
    'toneMarkers',
    'duplicateRiskClass',
    'referenceEventId',
  ],
  allowedOutputs: [
    'event_json_draft',
    'echo_hook_draft',
    'summary_template_draft',
  ],
  requiredOutputFields: ['id', 'content.text', 'ageRange', 'metadata.authoringSemantics'],
  validationSteps: [
    'validate:event-quality',
    'gate:p21',
    'evaluateLlmContentDraft',
  ],
  disallowedOutputs: ['runtime_code_edit', 'save_schema_change', 'new_route_family'],
};

export const WUXIA_LLM_TUNING_CONTRACT: LlmTuningContractConfig = {
  id: 'p21_llm_tuning',
  label: 'LLM 分布调优契约',
  allowedTuningClasses: [
    'route_distribution',
    'stage_pacing',
    'archetype_coverage',
    'repetition_pressure',
  ],
  requiredInputs: [
    'tuningClass',
    'targetFieldPath',
    'baselineReportId',
    'desiredMetricDelta',
  ],
  allowedOutputFields: [
    'pathAffinity',
    'weight',
    'baseWeight',
    'densityMultiplier',
    'payoffSpacingMultiplier',
    'exactRepeatSuppression',
  ],
  validationSteps: [
    'gate:p21',
    'gate:p20',
    'gate:playability',
    'validateTuningOutput',
  ],
  disallowedOutputs: ['GameEngineIntegration_edit', 'new_scheduling_policy_constant'],
};

/** Representative tuning samples — config-only workflow proof (US-020–US-022). */
export const WUXIA_TUNING_SAMPLE_CONFIGS: TuningSampleConfig[] = [
  {
    id: 'p21_tune_route_scholar_distribution',
    label: '文士路线事件分布调优',
    tuningClass: 'route_distribution',
    targetFieldPath: 'events.p21_scholar_route_reinforcement.metadata.pathAffinity.scholarly',
    baselineValue: 0.85,
    tunedValue: 1.0,
    validationMetric: 'scholar_route_event_share',
    expectedDelta: 'increase',
    authoringNotes: 'Boost scholarly pathAffinity on P21 route-sensitive sample event.',
  },
  {
    id: 'p21_tune_stage_payoff_spacing',
    label: '阶段回报间距调优',
    tuningClass: 'stage_pacing',
    targetFieldPath: 'archetypePacingProfiles.p20_scholar_statesman.stageProfiles.stage_20_30.payoffSpacingMultiplier',
    baselineValue: 1.25,
    tunedValue: 1.06,
    validationMetric: 'midlife_payoff_density',
    expectedDelta: 'tighten_spacing',
    authoringNotes: 'Tighten scholar midlife payoff spacing via profile pacing profile.',
  },
  {
    id: 'p21_tune_archetype_scholar_coverage',
    label: '文士谱系覆盖调优',
    tuningClass: 'archetype_coverage',
    targetFieldPath: 'archetypeFamilyConfigs.p20_scholar_statesman.baseWeight',
    baselineValue: 1.0,
    tunedValue: 1.15,
    validationMetric: 'scholar_archetype_emergence_score',
    expectedDelta: 'increase',
    authoringNotes: 'Raise scholar archetype baseWeight for replayability coverage.',
  },
];
