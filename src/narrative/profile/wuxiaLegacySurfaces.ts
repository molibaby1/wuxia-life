import type {
  InheritanceChannelPattern,
  LegacyOutcomePattern,
  SuccessorCultivationCostPattern,
  SuccessorRoleConfig,
} from './types';

/** Martial disciple — primary teaching successor. */
export const P18_ROLE_DISCIPLE: SuccessorRoleConfig = {
  id: 'p18_role_disciple',
  label: '弟子',
  roleKind: 'disciple',
  lifePathSignals: ['disciple'],
  triggerFlags: ['has_disciples', 'disciple_training_active'],
  cultivationCapacityWeight: 1,
  inheritanceChannelOverlap: ['p18_channel_martial_teaching', 'p18_channel_social_capital'],
  qualitySignals: ['martialHeritage', 'lifePath.relationships.disciples'],
};

/** Family heir — wealth and responsibility continuity. */
export const P18_ROLE_HEIR: SuccessorRoleConfig = {
  id: 'p18_role_heir',
  label: '继承人',
  roleKind: 'heir',
  triggerFlags: ['family_heir', 'sect_heir', 'heir_designated'],
  cultivationCapacityWeight: 0.85,
  inheritanceChannelOverlap: [
    'p18_channel_wealth_industry',
    'p18_channel_responsibility',
    'p18_channel_reputation',
  ],
  qualitySignals: ['merchantNetwork', 'player.children'],
};

/** Biological offspring — education-path biased. */
export const P18_ROLE_OFFSPRING: SuccessorRoleConfig = {
  id: 'p18_role_offspring',
  label: '子女',
  roleKind: 'offspring',
  triggerFlags: ['has_child', 'child_martial_artist', 'child_scholar', 'child_merchant'],
  cultivationCapacityWeight: 0.75,
  inheritanceChannelOverlap: [
    'p18_channel_martial_teaching',
    'p18_channel_technical_skill',
    'p18_channel_wealth_industry',
  ],
  qualitySignals: ['child_martial_artist', 'child_scholar', 'child_merchant', 'player.children'],
};

/** Adopted successor — shares disciple channels, distinct loyalty baseline. */
export const P18_ROLE_ADOPTED: SuccessorRoleConfig = {
  id: 'p18_role_adopted_successor',
  label: '养嗣',
  roleKind: 'adopted_successor',
  triggerFlags: ['adopted_successor'],
  cultivationCapacityWeight: 0.8,
  inheritanceChannelOverlap: ['p18_channel_martial_teaching', 'p18_channel_responsibility'],
  qualitySignals: ['martialHeritage', 'adopted_successor'],
};

/** Formal inheriting student — late-life transmission target. */
export const P18_ROLE_INHERITING_STUDENT: SuccessorRoleConfig = {
  id: 'p18_role_inheriting_student',
  label: '传功弟子',
  roleKind: 'inheriting_student',
  triggerFlags: ['master_legacy', 'martial_transmission', 'inheritance_legacy_complete'],
  cultivationCapacityWeight: 1.1,
  inheritanceChannelOverlap: ['p18_channel_martial_teaching', 'p18_channel_reputation'],
  qualitySignals: ['martialHeritage', 'master_legacy', 'martial_transmission'],
};

export const WUXIA_SUCCESSOR_ROLE_CONFIGS: SuccessorRoleConfig[] = [
  P18_ROLE_DISCIPLE,
  P18_ROLE_HEIR,
  P18_ROLE_OFFSPRING,
  P18_ROLE_ADOPTED,
  P18_ROLE_INHERITING_STUDENT,
];

/** Martial ability transmission — asset channel. */
export const P18_CHANNEL_MARTIAL_TEACHING: InheritanceChannelPattern = {
  id: 'p18_channel_martial_teaching',
  label: '武学传承',
  channelKind: 'martial_teaching',
  polarity: 'asset',
  triggerFlags: ['master_legacy', 'martial_transmission', 'child_martial_artist'],
  lifePathSignals: ['disciple'],
  baseIntensity: 0.75,
  opportunityTags: [
    { tag: 'legacy', multiplier: 1.45 },
    { tag: 'training', multiplier: 1.35 },
    { tag: 'martial', multiplier: 1.25 },
  ],
  requiredQualityForStability: 0.35,
  summarySignal: 'martial_transmission_active',
};

/** Scholarly / technical skill carryover. */
export const P18_CHANNEL_TECHNICAL_SKILL: InheritanceChannelPattern = {
  id: 'p18_channel_technical_skill',
  label: '技艺传承',
  channelKind: 'technical_skill',
  polarity: 'asset',
  triggerFlags: ['child_scholar', 'doctor_legacy', 'scholar_legacy'],
  baseIntensity: 0.65,
  opportunityTags: [
    { tag: 'legacy', multiplier: 1.3 },
    { tag: 'learning', multiplier: 1.2 },
  ],
  requiredQualityForStability: 0.3,
  summarySignal: 'technical_inheritance_active',
};

/** Network and social capital — mixed protection and obligation. */
export const P18_CHANNEL_SOCIAL_CAPITAL: InheritanceChannelPattern = {
  id: 'p18_channel_social_capital',
  label: '人脉传承',
  channelKind: 'social_capital',
  polarity: 'mixed',
  triggerFlags: ['family_legacy', 'follower_legacy'],
  baseIntensity: 0.7,
  opportunityTags: [
    { tag: 'backing', multiplier: 1.35 },
    { tag: 'family', multiplier: 1.25 },
  ],
  riskTags: [
    { tag: 'duty', multiplier: 1.3 },
    { tag: 'exposure', multiplier: 1.2 },
  ],
  requiredQualityForStability: 0.4,
  summarySignal: 'network_inheritance_active',
};

/** Wealth and industry continuity. */
export const P18_CHANNEL_WEALTH_INDUSTRY: InheritanceChannelPattern = {
  id: 'p18_channel_wealth_industry',
  label: '家业传承',
  channelKind: 'wealth_industry',
  polarity: 'mixed',
  triggerFlags: ['child_merchant', 'family_heir', 'merchant_legacy'],
  baseIntensity: 0.68,
  opportunityTags: [{ tag: 'resource', multiplier: 1.3 }],
  riskTags: [{ tag: 'duty', multiplier: 1.35 }],
  requiredQualityForStability: 0.45,
  summarySignal: 'wealth_inheritance_active',
};

/** Reputation mantle passed to successor context. */
export const P18_CHANNEL_REPUTATION: InheritanceChannelPattern = {
  id: 'p18_channel_reputation',
  label: '名望传承',
  channelKind: 'reputation',
  polarity: 'asset',
  triggerFlags: ['reputation_legacy', 'hero_rep_mantle', 'inheritance_legacy_complete'],
  baseIntensity: 0.72,
  opportunityTags: [
    { tag: 'prestige', multiplier: 1.4 },
    { tag: 'reputation', multiplier: 1.3 },
  ],
  riskTags: [{ tag: 'backlash', multiplier: 1.25 }],
  requiredQualityForStability: 0.5,
  summarySignal: 'reputation_inheritance_active',
};

/** Inherited vendetta — pure burden. */
export const P18_CHANNEL_VENDETTA: InheritanceChannelPattern = {
  id: 'p18_channel_vendetta',
  label: '宿怨继承',
  channelKind: 'vendetta',
  polarity: 'burden',
  triggerFlags: ['inherited_vendetta'],
  lifePathSignals: ['sworn_enemy'],
  baseIntensity: 0.8,
  riskTags: [
    { tag: 'feud', multiplier: 1.55 },
    { tag: 'conflict', multiplier: 1.45 },
    { tag: 'betrayal', multiplier: 1.3 },
  ],
  requiredQualityForStability: 0.55,
  summarySignal: 'inherited_vendetta_active',
};

/** Responsibility without full capability — duty burden. */
export const P18_CHANNEL_RESPONSIBILITY: InheritanceChannelPattern = {
  id: 'p18_channel_responsibility',
  label: '责任继承',
  channelKind: 'responsibility',
  polarity: 'burden',
  triggerFlags: ['sect_heir', 'family_heir', 'heir_designated'],
  lifePathSignals: ['must_protect'],
  baseIntensity: 0.75,
  riskTags: [
    { tag: 'obligation', multiplier: 1.5 },
    { tag: 'duty', multiplier: 1.4 },
    { tag: 'instability', multiplier: 1.25 },
  ],
  opportunityTags: [{ tag: 'sect', multiplier: 1.15 }],
  requiredQualityForStability: 0.5,
  summarySignal: 'responsibility_inheritance_active',
};

export const WUXIA_INHERITANCE_CHANNEL_PATTERNS: InheritanceChannelPattern[] = [
  P18_CHANNEL_MARTIAL_TEACHING,
  P18_CHANNEL_TECHNICAL_SKILL,
  P18_CHANNEL_SOCIAL_CAPITAL,
  P18_CHANNEL_WEALTH_INDUSTRY,
  P18_CHANNEL_REPUTATION,
  P18_CHANNEL_VENDETTA,
  P18_CHANNEL_RESPONSIBILITY,
];

/** Disciple cultivation cost — time and attention. */
export const P18_COST_DISCIPLE_CULTIVATION: SuccessorCultivationCostPattern = {
  id: 'p18_cost_disciple_cultivation',
  label: '弟子培养',
  successorRoleFlags: ['has_disciples', 'disciple_training_active', 'master_legacy'],
  costDimensions: [
    {
      dimension: 'time',
      requiredLevel: 0.45,
      underinvestmentRiskMultiplier: 1.45,
      satisfactionSignals: ['disciple_training_active', 'martial_transmission'],
    },
    {
      dimension: 'attention',
      requiredLevel: 0.4,
      underinvestmentRiskMultiplier: 1.4,
      satisfactionSignals: ['has_disciples', 'player.connections'],
    },
  ],
  neglectRiskTags: [
    { tag: 'decline', multiplier: 1.45 },
    { tag: 'instability', multiplier: 1.35 },
  ],
  summarySignal: 'disciple_cultivation_cost_active',
};

/** Heir / offspring cultivation cost — emotional and political exposure. */
export const P18_COST_HEIR_OFFSPRING: SuccessorCultivationCostPattern = {
  id: 'p18_cost_heir_offspring',
  label: '嗣子培养',
  successorRoleFlags: ['has_child', 'family_heir', 'sect_heir', 'heir_designated'],
  costDimensions: [
    {
      dimension: 'emotional_burden',
      requiredLevel: 0.4,
      underinvestmentRiskMultiplier: 1.4,
      satisfactionSignals: ['has_child', 'child_martial_artist', 'child_scholar'],
    },
    {
      dimension: 'political_exposure',
      requiredLevel: 0.35,
      underinvestmentRiskMultiplier: 1.35,
      satisfactionSignals: ['sect_heir', 'family_heir', 'player.influence'],
    },
    {
      dimension: 'deferred_progress',
      requiredLevel: 0.3,
      underinvestmentRiskMultiplier: 1.3,
      satisfactionSignals: ['martialHeritage', 'player.martialPower'],
    },
  ],
  neglectRiskTags: [
    { tag: 'family', multiplier: 1.4 },
    { tag: 'betrayal', multiplier: 1.25 },
  ],
  summarySignal: 'heir_cultivation_cost_active',
};

export const WUXIA_SUCCESSOR_CULTIVATION_COST_PATTERNS: SuccessorCultivationCostPattern[] = [
  P18_COST_DISCIPLE_CULTIVATION,
  P18_COST_HEIR_OFFSPRING,
];

/** US-013: Successful ability transmission. */
export const P18_OUTCOME_TRANSMISSION_SUCCESS: LegacyOutcomePattern = {
  id: 'p18_outcome_transmission_success',
  label: '薪火相传',
  outcomeKind: 'transmission_success',
  triggerFlags: ['martial_transmission', 'inheritance_legacy_complete'],
  lifePathSignals: ['disciple'],
  baseIntensity: 0.85,
  opportunityTags: [
    { tag: 'legacy', multiplier: 1.5 },
    { tag: 'continuity', multiplier: 1.4 },
  ],
  successionQualityDelta: 0.25,
  summarySignal: 'legacy_transmission_success',
};

/** US-014: Network and obligation inheritance. */
export const P18_OUTCOME_NETWORK_OBLIGATION: LegacyOutcomePattern = {
  id: 'p18_outcome_network_obligation',
  label: '人脉与牵累',
  outcomeKind: 'network_obligation',
  triggerFlags: ['family_legacy', 'follower_legacy'],
  baseIntensity: 0.7,
  opportunityTags: [{ tag: 'backing', multiplier: 1.35 }],
  riskTags: [
    { tag: 'duty', multiplier: 1.45 },
    { tag: 'obligation', multiplier: 1.35 },
  ],
  successionQualityDelta: 0.05,
  summarySignal: 'network_obligation_legacy',
};

/** US-015: Inherited vendetta burden. */
export const P18_OUTCOME_INHERITED_BURDEN: LegacyOutcomePattern = {
  id: 'p18_outcome_inherited_burden',
  label: '遗恨未消',
  outcomeKind: 'inherited_burden',
  triggerFlags: ['inherited_vendetta'],
  lifePathSignals: ['sworn_enemy'],
  baseIntensity: 0.8,
  riskTags: [
    { tag: 'feud', multiplier: 1.5 },
    { tag: 'conflict', multiplier: 1.4 },
  ],
  successionQualityDelta: -0.15,
  summarySignal: 'inherited_burden_legacy',
};

/** US-016: Underinvestment weakens legacy. */
export const P18_OUTCOME_UNDERINVESTMENT: LegacyOutcomePattern = {
  id: 'p18_outcome_underinvestment',
  label: '疏于栽培',
  outcomeKind: 'underinvestment',
  triggerFlags: ['has_disciples', 'has_child'],
  baseIntensity: 0.65,
  riskTags: [
    { tag: 'decline', multiplier: 1.4 },
    { tag: 'instability', multiplier: 1.3 },
  ],
  successionQualityDelta: -0.2,
  summarySignal: 'underinvestment_legacy',
};

/** US-017: Burden without capability. */
export const P18_OUTCOME_BURDEN_WITHOUT_CAPABILITY: LegacyOutcomePattern = {
  id: 'p18_outcome_burden_without_capability',
  label: '德不配位',
  outcomeKind: 'burden_without_capability',
  triggerFlags: ['sect_heir', 'inherited_vendetta', 'heir_designated'],
  baseIntensity: 0.75,
  riskTags: [
    { tag: 'instability', multiplier: 1.55 },
    { tag: 'obligation', multiplier: 1.45 },
  ],
  successionQualityDelta: -0.25,
  summarySignal: 'burden_without_capability_legacy',
};

/** US-018: Rupture / betrayal succession. */
export const P18_OUTCOME_RUPTURE_BETRAYAL: LegacyOutcomePattern = {
  id: 'p18_outcome_rupture_betrayal',
  label: '传承崩裂',
  outcomeKind: 'rupture_betrayal',
  triggerFlags: ['disciple_betrayal', 'legacy_collapse'],
  baseIntensity: 0.85,
  riskTags: [
    { tag: 'betrayal', multiplier: 1.6 },
    { tag: 'collapse', multiplier: 1.5 },
    { tag: 'conflict', multiplier: 1.35 },
  ],
  successionQualityDelta: -0.35,
  summarySignal: 'rupture_betrayal_legacy',
};

export const WUXIA_LEGACY_OUTCOME_PATTERNS: LegacyOutcomePattern[] = [
  P18_OUTCOME_TRANSMISSION_SUCCESS,
  P18_OUTCOME_NETWORK_OBLIGATION,
  P18_OUTCOME_INHERITED_BURDEN,
  P18_OUTCOME_BURDEN_WITHOUT_CAPABILITY,
  P18_OUTCOME_UNDERINVESTMENT,
  P18_OUTCOME_RUPTURE_BETRAYAL,
];
