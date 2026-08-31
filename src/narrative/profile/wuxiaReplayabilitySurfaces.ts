import type {
  ArchetypeFamilyConfig,
  ArchetypePacingProfile,
  ReplaySliceConfig,
  RepetitionPressureConfig,
} from './types';

export const P20_MARTIAL_ASCENDANT: ArchetypeFamilyConfig = {
  id: 'p20_martial_ascendant',
  label: '武道登峰',
  familyKind: 'martial_ascendant',
  baseWeight: 1,
  lifecycleSignals: {
    originIds: ['martial_family', 'poor_family', 'frontier_military'],
    originTags: ['training', 'martial'],
    growthPatternFlags: ['martial_talent_acknowledged', 'joined_sect'],
    routeIdentityKeys: ['martial', 'orthodox'],
    socialRoleFlags: ['has_disciples', 'hero_rep_mantle'],
    legacyShapeFlags: ['martial_transmission', 'inheritance_legacy_complete'],
    endgameCategoryKinds: ['legendary_echo', 'quiet_continuity'],
    historicalMemoryTones: ['admired', 'respected'],
  },
  opportunityTags: [
    { tag: 'training', multiplier: 1.25 },
    { tag: 'martial', multiplier: 1.2 },
    { tag: 'reputation', multiplier: 1.1 },
  ],
  riskTags: [{ tag: 'injury', multiplier: 1.15 }],
  summarySignal: '武道轨迹：练功—门派—传功',
};

export const P20_SCHOLAR_STATESMAN: ArchetypeFamilyConfig = {
  id: 'p20_scholar_statesman',
  label: '文士仕林',
  familyKind: 'scholar_statesman',
  baseWeight: 1.15,
  lifecycleSignals: {
    originIds: ['scholar_house', 'poor_family'],
    originTags: ['study', 'scholarly'],
    growthPatternFlags: ['scholar_path_started'],
    routeIdentityKeys: ['scholarly', 'academic'],
    socialRoleFlags: ['ally_network'],
    legacyShapeFlags: ['scholarly_heritage_high', 'teaching_legacy'],
    endgameCategoryKinds: ['quiet_continuity', 'bittersweet_closure'],
    historicalMemoryTones: ['respected', 'mixed'],
  },
  opportunityTags: [
    { tag: 'study', multiplier: 1.3 },
    { tag: 'scholarly', multiplier: 1.25 },
    { tag: 'mentor', multiplier: 1.15 },
  ],
  summarySignal: '文士轨迹：读书—师门—仕林余韵',
};

export const P20_WEALTH_MERCHANT: ArchetypeFamilyConfig = {
  id: 'p20_wealth_merchant',
  label: '商贾识途',
  familyKind: 'wealth_merchant',
  baseWeight: 1,
  lifecycleSignals: {
    originIds: ['merchant_house', 'streetborn'],
    originTags: ['business', 'trade'],
    growthPatternFlags: ['merchant_network_growing', 'wealth_milestone'],
    routeIdentityKeys: ['wealth', 'merchant'],
    socialRoleFlags: ['merchant_network', 'trade_alliance'],
    legacyShapeFlags: ['family_heir', 'merchant_dynasty'],
    endgameCategoryKinds: ['quiet_continuity'],
    historicalMemoryTones: ['respected', 'forgotten'],
  },
  opportunityTags: [
    { tag: 'business', multiplier: 1.3 },
    { tag: 'trade', multiplier: 1.2 },
    { tag: 'economy', multiplier: 1.15 },
  ],
  summarySignal: '商贾轨迹：营商—人脉—产业延续',
};

export const P20_HERMIT_WITHDRAWAL: ArchetypeFamilyConfig = {
  id: 'p20_hermit_withdrawal',
  label: '隐逸归舟',
  familyKind: 'hermit_withdrawal',
  baseWeight: 1,
  lifecycleSignals: {
    originIds: ['poor_family', 'frontier_military'],
    originTags: ['withdrawal', 'hardship'],
    growthPatternFlags: ['hermit_withdrawal', 'lonely_elder', 'low_engagement'],
    routeIdentityKeys: ['conservative', 'hermit'],
    socialRoleFlags: ['hermit_withdrawal', 'lonely_elder'],
    legacyShapeFlags: ['fade_legacy', 'no_successor'],
    endgameCategoryKinds: ['isolated_fade'],
    historicalMemoryTones: ['forgotten', 'mixed'],
  },
  opportunityTags: [
    { tag: 'withdrawal', multiplier: 1.2 },
    { tag: 'continuity', multiplier: 0.85 },
  ],
  riskTags: [{ tag: 'isolation', multiplier: 1.1 }],
  summarySignal: '隐逸轨迹：疏阔—归隐—淡出',
};

export const P20_DEMONIC_OUTLAW: ArchetypeFamilyConfig = {
  id: 'p20_demonic_outlaw',
  label: '邪路孤狼',
  familyKind: 'demonic_outlaw',
  baseWeight: 1,
  lifecycleSignals: {
    originIds: ['martial_family', 'streetborn', 'frontier_military'],
    originTags: ['demonic', 'feud'],
    growthPatternFlags: ['demonic_reputation', 'blood_feud_active', 'deviant_path'],
    routeIdentityKeys: ['demonic', 'evil'],
    socialRoleFlags: ['blood_feud_active', 'sect_exposure', 'sworn_enemy'],
    legacyShapeFlags: ['inherited_burden', 'rupture_betrayal'],
    endgameCategoryKinds: ['infamous_echo', 'bittersweet_closure'],
    historicalMemoryTones: ['feared', 'disputed'],
  },
  opportunityTags: [
    { tag: 'feud', multiplier: 1.25 },
    { tag: 'demonic', multiplier: 1.2 },
    { tag: 'risk', multiplier: 1.15 },
  ],
  riskTags: [
    { tag: 'exposure', multiplier: 1.2 },
    { tag: 'betrayal', multiplier: 1.15 },
  ],
  summarySignal: '邪路轨迹：孤狼—仇怨—争议余响',
};

export const WUXIA_ARCHETYPE_FAMILY_CONFIGS: ArchetypeFamilyConfig[] = [
  P20_MARTIAL_ASCENDANT,
  P20_SCHOLAR_STATESMAN,
  P20_WEALTH_MERCHANT,
  P20_HERMIT_WITHDRAWAL,
  P20_DEMONIC_OUTLAW,
];

export const P20_REPETITION_DEFAULT: RepetitionPressureConfig = {
  id: 'p20_repetition_default',
  label: '默认重复压控',
  exactRepeatSuppression: 0.45,
  noveltyPreference: 0.22,
  thematicContinuityFloor: 0.4,
  routeVarianceBoost: 0.18,
  poolDiversityTarget: 0.55,
  crossStagePayoffMinSpacing: 3,
  lookbackYears: 4,
  eventClassTags: ['economy', 'injury', 'training', 'study', 'legacy', 'feud'],
};

export const P20_REPETITION_EARLY_GROWTH: RepetitionPressureConfig = {
  id: 'p20_repetition_early_growth',
  label: '童年青年重复压控',
  exactRepeatSuppression: 0.5,
  noveltyPreference: 0.28,
  thematicContinuityFloor: 0.45,
  routeVarianceBoost: 0.22,
  poolDiversityTarget: 0.6,
  crossStagePayoffMinSpacing: 2,
  lookbackYears: 3,
  eventClassTags: ['training', 'study', 'business', 'socializing', 'origin'],
};

export const P20_REPETITION_LATE_LIFE: RepetitionPressureConfig = {
  id: 'p20_repetition_late_life',
  label: '晚年重复压控',
  exactRepeatSuppression: 0.4,
  noveltyPreference: 0.18,
  thematicContinuityFloor: 0.5,
  routeVarianceBoost: 0.15,
  poolDiversityTarget: 0.5,
  crossStagePayoffMinSpacing: 4,
  lookbackYears: 5,
  eventClassTags: ['legacy', 'continuity', 'recovery', 'feud', 'elderly'],
};

export const WUXIA_REPETITION_PRESSURE_CONFIGS: RepetitionPressureConfig[] = [
  P20_REPETITION_DEFAULT,
  P20_REPETITION_EARLY_GROWTH,
  P20_REPETITION_LATE_LIFE,
];

const STAGE_IDS = ['stage_0_10', 'stage_10_20', 'stage_20_30', 'stage_30_40'] as const;

function buildStageProfiles(
  density: number[],
  routeOffset: number[],
  payoff: number[],
  callback: number[],
): ArchetypePacingProfile['stageProfiles'] {
  return STAGE_IDS.map((stageId, index) => ({
    stageId,
    densityMultiplier: density[index] ?? 1,
    routePressureOffsetYears: routeOffset[index] ?? 0,
    payoffSpacingMultiplier: payoff[index] ?? 1,
    callbackCadenceYears: callback[index] ?? 4,
  }));
}

export const WUXIA_ARCHETYPE_PACING_PROFILES: ArchetypePacingProfile[] = [
  {
    archetypeFamilyId: P20_MARTIAL_ASCENDANT.id,
    endgameClosureRhythm: 'standard',
    stageProfiles: buildStageProfiles([1.15, 1.1, 1.05, 1.0], [0, 0, 0, 0], [0.85, 0.9, 0.95, 1.0], [3, 3, 4, 4]),
  },
  {
    archetypeFamilyId: P20_SCHOLAR_STATESMAN.id,
    endgameClosureRhythm: 'delayed',
    stageProfiles: buildStageProfiles([1.0, 1.05, 0.95, 0.9], [0, 1, 2, 2], [1.1, 1.2, 1.06, 1.3], [4, 4, 5, 5]),
  },
  {
    archetypeFamilyId: P20_WEALTH_MERCHANT.id,
    endgameClosureRhythm: 'standard',
    stageProfiles: buildStageProfiles([0.95, 1.0, 1.0, 1.05], [0, 1, 1, 2], [1.05, 1.15, 1.2, 1.25], [4, 5, 5, 6]),
  },
  {
    archetypeFamilyId: P20_HERMIT_WITHDRAWAL.id,
    endgameClosureRhythm: 'early',
    stageProfiles: buildStageProfiles([0.8, 0.85, 0.8, 0.75], [1, 2, 3, 3], [1.2, 1.3, 1.35, 1.4], [5, 5, 6, 6]),
  },
  {
    archetypeFamilyId: P20_DEMONIC_OUTLAW.id,
    endgameClosureRhythm: 'fragmented',
    stageProfiles: buildStageProfiles([1.1, 1.15, 1.1, 1.05], [-1, 0, 0, 1], [0.9, 0.95, 1.0, 1.05], [3, 3, 4, 4]),
  },
];

export const P20_SLICE_ORIGIN_EARLY: ReplaySliceConfig = {
  id: 'p20_slice_origin_early',
  label: '出身与早期成长分歧切片',
  emphasis: 'origin_early_growth',
  archetypeFamilyId: P20_MARTIAL_ASCENDANT.id,
  seedFlags: ['martial_talent_acknowledged', 'joined_sect'],
  validationSignals: ['origin_divergence', 'early_action_histogram', 'route_entry_timing'],
};

export const P20_SLICE_MIDLIFE: ReplaySliceConfig = {
  id: 'p20_slice_midlife_consequence',
  label: '中年后果与身份分歧切片',
  emphasis: 'midlife_consequence',
  archetypeFamilyId: P20_DEMONIC_OUTLAW.id,
  seedFlags: ['blood_feud_active', 'demonic_reputation', 'sect_exposure'],
  validationSignals: ['consequence_pressure', 'faction_exposure', 'payoff_spacing'],
};

export const P20_SLICE_LEGACY_ENDGAME: ReplaySliceConfig = {
  id: 'p20_slice_legacy_endgame',
  label: '传承与终局记忆分歧切片',
  emphasis: 'legacy_endgame_memory',
  archetypeFamilyId: P20_SCHOLAR_STATESMAN.id,
  seedFlags: ['scholar_path_started', 'teaching_legacy'],
  validationSignals: ['legacy_shape', 'endgame_category', 'historical_memory_tone'],
};

export const P20_SLICE_WEALTH_PACING: ReplaySliceConfig = {
  id: 'p20_slice_wealth_pacing',
  label: '商贾节奏分歧切片',
  emphasis: 'midlife_consequence',
  archetypeFamilyId: P20_WEALTH_MERCHANT.id,
  seedFlags: ['merchant_network_growing', 'p9_early_business_focus'],
  validationSignals: ['payoff_spacing', 'route_pressure_timing'],
};

export const P20_SLICE_HERMIT_CLOSURE: ReplaySliceConfig = {
  id: 'p20_slice_hermit_closure',
  label: '隐逸终局分歧切片',
  emphasis: 'legacy_endgame_memory',
  archetypeFamilyId: P20_HERMIT_WITHDRAWAL.id,
  seedFlags: ['hermit_withdrawal', 'lonely_elder', 'fade_legacy'],
  validationSignals: ['endgame_closure_rhythm', 'isolated_fade'],
};

export const WUXIA_REPLAY_SLICE_CONFIGS: ReplaySliceConfig[] = [
  P20_SLICE_ORIGIN_EARLY,
  P20_SLICE_MIDLIFE,
  P20_SLICE_LEGACY_ENDGAME,
  P20_SLICE_WEALTH_PACING,
  P20_SLICE_HERMIT_CLOSURE,
];
