import type {
  ChildhoodShapingRule,
  CompositeDestinyOutcome,
  RareEventLineConfig,
  WorldProfileOriginSurface,
} from './types';

export const WUXIA_ORIGIN_SURFACES: WorldProfileOriginSurface[] = [
  {
    originId: 'martial_family',
    label: '武林世家',
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
