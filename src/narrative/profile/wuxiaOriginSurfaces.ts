import type {
  ChildhoodShapingRule,
  CompositeDestinyOutcome,
  RareEventLineConfig,
  WorldProfileOriginSurface,
} from './types';

/** P25 Wave 4: ordinary-tier origin ids (North Star §3.4). */
export const WUXIA_ORDINARY_ORIGIN_IDS = [
  'farm_peasant',
  'town_apprentice',
  'tavern_hand',
] as const;

export type WuxiaOrdinaryOriginId = (typeof WUXIA_ORDINARY_ORIGIN_IDS)[number];

export function isOrdinaryOriginId(originId: string): originId is WuxiaOrdinaryOriginId {
  return (WUXIA_ORDINARY_ORIGIN_IDS as readonly string[]).includes(originId);
}

export function getOrdinaryOriginSurfaces(): WorldProfileOriginSurface[] {
  return WUXIA_ORIGIN_SURFACES.filter(s => s.originTier === 'ordinary');
}

export const WUXIA_ORIGIN_SURFACES: WorldProfileOriginSurface[] = [
  {
    originId: 'martial_family',
    label: '武林世家',
    originTier: 'vivid',
    resources: {
      familyResources: 0.75,
      guidanceQuality: 0.8,
      socialCapital: 0.55,
      hardshipExposure: 0.35,
      regionalBackground: 'urban',
    },
    immediateConditions: {
      familyResources: 0.75,
      guidanceQuality: 0.8,
      socialCapital: 0.55,
      hardshipExposure: 0.35,
      regionalBackground: 'urban',
    },
    shapingTendencies: {
      discipline: 0.15,
      endurance: 0.1,
      caution: 0.05,
      empathy: 0,
      ambition: 0.1,
      socialEase: 0,
    },
    eventBiasTags: [
      { tag: 'training', multiplier: 1.35 },
      { tag: 'reputation', multiplier: 1.15 },
    ],
  },
  {
    originId: 'merchant_house',
    label: '商户之家',
    originTier: 'vivid',
    resources: {
      familyResources: 0.9,
      guidanceQuality: 0.55,
      socialCapital: 0.7,
      hardshipExposure: 0.2,
      regionalBackground: 'urban',
    },
    immediateConditions: {
      familyResources: 0.9,
      guidanceQuality: 0.55,
      socialCapital: 0.7,
      hardshipExposure: 0.2,
      regionalBackground: 'urban',
    },
    shapingTendencies: {
      discipline: 0.05,
      endurance: 0,
      caution: 0.1,
      empathy: 0.05,
      ambition: 0.15,
      socialEase: 0.1,
    },
    eventBiasTags: [
      { tag: 'business', multiplier: 1.4 },
      { tag: 'social', multiplier: 1.1 },
    ],
  },
  {
    originId: 'scholar_house',
    label: '书香门第',
    originTier: 'vivid',
    resources: {
      familyResources: 0.65,
      guidanceQuality: 0.9,
      socialCapital: 0.5,
      hardshipExposure: 0.15,
      regionalBackground: 'urban',
    },
    immediateConditions: {
      familyResources: 0.65,
      guidanceQuality: 0.9,
      socialCapital: 0.5,
      hardshipExposure: 0.15,
      regionalBackground: 'urban',
    },
    shapingTendencies: {
      discipline: 0.2,
      endurance: 0,
      caution: 0.1,
      empathy: 0.05,
      ambition: 0.05,
      socialEase: 0,
    },
    eventBiasTags: [
      { tag: 'comprehension', multiplier: 1.35 },
      { tag: 'discipline', multiplier: 1.15 },
    ],
  },
  {
    originId: 'frontier_military',
    label: '边地军户',
    originTier: 'vivid',
    resources: {
      familyResources: 0.35,
      guidanceQuality: 0.4,
      socialCapital: 0.25,
      hardshipExposure: 0.85,
      regionalBackground: 'frontier',
    },
    immediateConditions: {
      familyResources: 0.35,
      guidanceQuality: 0.4,
      socialCapital: 0.25,
      hardshipExposure: 0.85,
      regionalBackground: 'frontier',
    },
    shapingTendencies: {
      discipline: 0.1,
      endurance: 0.2,
      caution: 0.05,
      empathy: 0,
      ambition: 0.05,
      socialEase: -0.05,
    },
    eventBiasTags: [
      { tag: 'survival', multiplier: 1.45 },
      { tag: 'risk', multiplier: 1.2 },
    ],
  },
  {
    originId: 'poor_family',
    label: '寒门',
    originTier: 'vivid',
    resources: {
      familyResources: 0.15,
      guidanceQuality: 0.35,
      socialCapital: 0.2,
      hardshipExposure: 0.75,
      regionalBackground: 'rural',
    },
    immediateConditions: {
      familyResources: 0.15,
      guidanceQuality: 0.35,
      socialCapital: 0.2,
      hardshipExposure: 0.75,
      regionalBackground: 'rural',
    },
    shapingTendencies: {
      discipline: 0.1,
      endurance: 0.15,
      caution: 0.1,
      empathy: 0.05,
      ambition: 0.15,
      socialEase: 0,
    },
    eventBiasTags: [
      { tag: 'survival', multiplier: 1.3 },
      { tag: 'business', multiplier: 1.1 },
    ],
  },
  {
    originId: 'streetborn',
    label: '市井草根',
    originTier: 'vivid',
    resources: {
      familyResources: 0.25,
      guidanceQuality: 0.3,
      socialCapital: 0.45,
      hardshipExposure: 0.6,
      regionalBackground: 'urban',
    },
    immediateConditions: {
      familyResources: 0.25,
      guidanceQuality: 0.3,
      socialCapital: 0.45,
      hardshipExposure: 0.6,
      regionalBackground: 'urban',
    },
    shapingTendencies: {
      discipline: 0,
      endurance: 0.1,
      caution: 0.15,
      empathy: 0.1,
      ambition: 0.1,
      socialEase: 0.15,
    },
    eventBiasTags: [
      { tag: 'social', multiplier: 1.25 },
      { tag: 'family', multiplier: 1.1 },
    ],
  },
  {
    originId: 'farm_peasant',
    label: '普通农户',
    originTier: 'ordinary',
    resources: {
      familyResources: 0.32,
      guidanceQuality: 0.28,
      socialCapital: 0.18,
      hardshipExposure: 0.52,
      regionalBackground: 'rural',
    },
    immediateConditions: {
      familyResources: 0.32,
      guidanceQuality: 0.28,
      socialCapital: 0.18,
      hardshipExposure: 0.52,
      regionalBackground: 'rural',
    },
    shapingTendencies: {
      discipline: 0.08,
      endurance: 0.16,
      caution: 0.1,
      empathy: 0.06,
      ambition: 0.05,
      socialEase: -0.02,
    },
    eventBiasTags: [
      { tag: 'labor', multiplier: 1.45 },
      { tag: 'seasonal', multiplier: 1.35 },
      { tag: 'family', multiplier: 1.12 },
    ],
  },
  {
    originId: 'town_apprentice',
    label: '小镇学徒',
    originTier: 'ordinary',
    resources: {
      familyResources: 0.42,
      guidanceQuality: 0.52,
      socialCapital: 0.38,
      hardshipExposure: 0.38,
      regionalBackground: 'urban',
    },
    immediateConditions: {
      familyResources: 0.42,
      guidanceQuality: 0.52,
      socialCapital: 0.38,
      hardshipExposure: 0.38,
      regionalBackground: 'urban',
    },
    shapingTendencies: {
      discipline: 0.16,
      endurance: 0.06,
      caution: 0.08,
      empathy: 0.04,
      ambition: 0.1,
      socialEase: 0.02,
    },
    eventBiasTags: [
      { tag: 'craft', multiplier: 1.4 },
      { tag: 'apprenticeship', multiplier: 1.35 },
      { tag: 'discipline', multiplier: 1.08 },
    ],
  },
  {
    originId: 'tavern_hand',
    label: '跑堂伙计',
    originTier: 'ordinary',
    resources: {
      familyResources: 0.36,
      guidanceQuality: 0.22,
      socialCapital: 0.58,
      hardshipExposure: 0.44,
      regionalBackground: 'urban',
    },
    immediateConditions: {
      familyResources: 0.36,
      guidanceQuality: 0.22,
      socialCapital: 0.58,
      hardshipExposure: 0.44,
      regionalBackground: 'urban',
    },
    shapingTendencies: {
      discipline: 0.04,
      endurance: 0.1,
      caution: 0.12,
      empathy: 0.12,
      ambition: 0.08,
      socialEase: 0.16,
    },
    eventBiasTags: [
      { tag: 'service', multiplier: 1.45 },
      { tag: 'rumor', multiplier: 1.3 },
      { tag: 'social', multiplier: 1.15 },
    ],
  },
];

export const WUXIA_CHILDHOOD_SHAPING_RULES: ChildhoodShapingRule[] = [
  {
    id: 'hardship_endurance',
    sourceTag: 'survival',
    tendency: 'endurance',
    increment: 0.08,
    thresholdForSurfacing: 0.25,
  },
  {
    id: 'guidance_discipline',
    sourceTag: 'discipline',
    tendency: 'discipline',
    increment: 0.1,
    thresholdForSurfacing: 0.3,
  },
  {
    id: 'social_empathy',
    sourceTag: 'social',
    tendency: 'empathy',
    increment: 0.07,
    thresholdForSurfacing: 0.25,
  },
  {
    id: 'business_ambition',
    sourceTag: 'business',
    tendency: 'ambition',
    increment: 0.06,
    thresholdForSurfacing: 0.2,
  },
];

export const WUXIA_COMPOSITE_DESTINY_OUTCOMES: CompositeDestinyOutcome[] = [
  {
    id: 'grandmaster_guardian',
    label: '一代宗师兼护道者',
    requireAll: true,
    requirements: [
      { dimension: 'skill_growth', minValue: 80 },
      { dimension: 'reputation', minValue: 50 },
      { dimension: 'key_choices', requiredFlags: ['p16_guardian_oath'] },
    ],
  },
  {
    id: 'sect_leader_statesman',
    label: '门派掌门兼盟会领袖',
    requireAll: true,
    requirements: [
      { dimension: 'skill_growth', minValue: 55 },
      { dimension: 'social_capital', minValue: 60 },
      { dimension: 'resources', minValue: 40 },
      { dimension: 'key_choices', requiredFlags: ['p16_alliance_brokered'] },
    ],
  },
  {
    id: 'lone_sword_legend',
    label: '独行剑侠传奇',
    requireAll: true,
    requirements: [
      { dimension: 'skill_growth', minValue: 90 },
      { dimension: 'social_capital', minValue: 15, blockedByFlags: ['p16_alliance_brokered'] },
      { dimension: 'special_event', requiredFlags: ['p16_rare_master_encounter'] },
    ],
  },
  {
    id: 'jianghu_renown_sage',
    label: '江湖名宿',
    requireAll: true,
    requirements: [
      { dimension: 'skill_growth', minValue: 45 },
      { dimension: 'reputation', minValue: 65 },
      { dimension: 'social_capital', minValue: 55 },
      { dimension: 'key_choices', anyOfFlags: ['mentor_bond', 'ally_network'] },
    ],
  },
  {
    id: 'medical_sage_healer',
    label: '一代名医',
    requireAll: true,
    requirements: [
      { dimension: 'reputation', minValue: 55 },
      { dimension: 'resources', minValue: 30 },
      { dimension: 'key_choices', anyOfFlags: ['medical_divine_doctor_fame', 'medical_imperial'] },
      {
        dimension: 'key_choices',
        anyOfFlags: ['medical_plague_hero', 'medical_pure'],
        blockedByFlags: ['medical_poison_path'],
      },
    ],
  },
];

/** P25 Wave 2: pinnacle tier — choice + rare-line luck dual gate; not grind-substitutable. */
export const WUXIA_PINNACLE_DESTINY_OUTCOMES: CompositeDestinyOutcome[] = [
  {
    id: 'jianghu_myth_legend',
    label: '武林神话',
    tier: 'pinnacle',
    grindCannotSubstituteLuck: true,
    requireAll: true,
    requirements: [
      { dimension: 'skill_growth', minValue: 95 },
      { dimension: 'reputation', minValue: 75 },
      { dimension: 'key_choices', requiredFlags: ['p16_guardian_oath'], gateKind: 'choice' },
      {
        dimension: 'special_event',
        requiredFlags: ['p16_rare_master_encounter'],
        gateKind: 'luck',
      },
    ],
  },
  {
    id: 'founding_patriarch',
    label: '开派祖师',
    tier: 'pinnacle',
    grindCannotSubstituteLuck: true,
    requireAll: true,
    requirements: [
      { dimension: 'skill_growth', minValue: 70 },
      { dimension: 'social_capital', minValue: 70 },
      { dimension: 'resources', minValue: 55 },
      { dimension: 'key_choices', requiredFlags: ['p16_alliance_brokered'], gateKind: 'choice' },
      {
        dimension: 'special_event',
        requiredFlags: ['p16_scholar_mentor'],
        gateKind: 'luck',
      },
    ],
  },
];

/** P25 Wave 3: mixed tier — cross-track composite outcomes (Goal 4). */
export const WUXIA_MIXED_DESTINY_OUTCOMES: CompositeDestinyOutcome[] = [
  {
    id: 'merchant_magnate',
    label: '巨贾行商',
    tier: 'mixed',
    coexistWith: ['jianghu_renown_sage', 'sect_leader_statesman'],
    mutexWith: ['lone_sword_legend'],
    requireAll: true,
    requirements: [
      { dimension: 'resources', minValue: 55 },
      { dimension: 'social_capital', minValue: 55 },
      { dimension: 'key_choices', anyOfFlags: ['route_wealth_committed', 'p22_wealth_route_forked'] },
      {
        dimension: 'key_choices',
        anyOfFlags: ['business_empire', 'merchant_empire', 'merchant_wealthy'],
      },
    ],
    crossTrackGroups: [
      { trackId: 'merchant_route', trackLabel: '商路轨道', requirementIndices: [2, 3] },
      { trackId: 'wealth_capital', trackLabel: '资财人脉', requirementIndices: [0, 1] },
    ],
  },
  {
    id: 'healer_swordsman',
    label: '医武双绝',
    tier: 'mixed',
    coexistWith: ['grandmaster_guardian', 'medical_sage_healer'],
    requireAll: true,
    requirements: [
      { dimension: 'skill_growth', minValue: 55 },
      { dimension: 'reputation', minValue: 50 },
      { dimension: 'key_choices', anyOfFlags: ['medical_divine_doctor_fame', 'medical_imperial'] },
      {
        dimension: 'key_choices',
        anyOfFlags: ['p9_early_training_focus', 'orthodox_trial_completed'],
      },
    ],
    crossTrackGroups: [
      { trackId: 'martial_track', trackLabel: '武学轨道', requirementIndices: [0, 3] },
      { trackId: 'medical_track', trackLabel: '医术轨道', requirementIndices: [1, 2] },
    ],
  },
  {
    id: 'merchant_martial_patron',
    label: '商武一体',
    tier: 'mixed',
    coexistWith: ['merchant_magnate', 'grandmaster_guardian'],
    requireAll: true,
    requirements: [
      { dimension: 'skill_growth', minValue: 50 },
      { dimension: 'resources', minValue: 50 },
      {
        dimension: 'key_choices',
        anyOfFlags: ['merchant_invest_good', 'merchant_invest_both', 'merchant_invest_evil'],
      },
      { dimension: 'key_choices', anyOfFlags: ['route_wealth_committed', 'p22_wealth_route_forked'] },
    ],
    crossTrackGroups: [
      { trackId: 'merchant_track', trackLabel: '商贾投资', requirementIndices: [2, 3] },
      { trackId: 'martial_track', trackLabel: '武学根基', requirementIndices: [0] },
    ],
  },
];

export const WUXIA_RARE_EVENT_LINES: RareEventLineConfig[] = [
  {
    id: 'hidden_master_line',
    label: '隐世高人指点线',
    baseProbability: 0.12,
    originConditions: ['martial_family', 'poor_family', 'frontier_military'],
    stageConditions: { minAge: 10, maxAge: 25 },
    priorChoiceFlags: ['p9_early_training_focus'],
    unlocksFlags: ['p16_rare_master_encounter'],
    altersOpportunityTags: ['training', 'special_event'],
  },
  {
    id: 'merchant_patron_line',
    label: '商路贵人提携线',
    baseProbability: 0.1,
    originConditions: ['merchant_house', 'streetborn'],
    stageConditions: { minAge: 14, maxAge: 30 },
    unlocksFlags: ['p16_merchant_patron'],
    altersOpportunityTags: ['business', 'resources'],
  },
  {
    id: 'scholar_mentor_line',
    label: '名士收徒线',
    baseProbability: 0.09,
    originConditions: ['scholar_house', 'poor_family'],
    stageConditions: { minAge: 8, maxAge: 22 },
    priorChoiceFlags: ['focus_on_study'],
    unlocksFlags: ['p16_scholar_mentor'],
    altersOpportunityTags: ['comprehension', 'discipline'],
  },
];
