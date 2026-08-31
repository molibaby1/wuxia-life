import type {
  AchievementMaintenancePattern,
  FactionIdentityConsequencePattern,
  RelationshipConsequencePattern,
} from './types';

/** Supportive / shielding — concrete ally backing. */
export const P17_RELATIONSHIP_SWORN_SHIELDING: RelationshipConsequencePattern = {
  id: 'p17_ally_shielding',
  label: '同道庇护',
  consequenceKind: 'social_shielding',
  lifePathSignals: ['ally'],
  baseIntensity: 0.75,
  opportunityTags: [
    { tag: 'relationship', multiplier: 1.35 },
    { tag: 'rescue', multiplier: 1.4 },
    { tag: 'backing', multiplier: 1.25 },
  ],
  riskTags: [{ tag: 'conflict', multiplier: 0.85 }],
  summarySignal: 'sworn_shielding_active',
};

/** Obligation / entanglement — mentor debt and guidance burden. */
export const P17_RELATIONSHIP_MENTOR_OBLIGATION: RelationshipConsequencePattern = {
  id: 'p17_mentor_obligation',
  label: '师门恩情',
  consequenceKind: 'obligation',
  lifePathSignals: ['mentor'],
  baseIntensity: 0.7,
  opportunityTags: [
    { tag: 'training', multiplier: 1.2 },
    { tag: 'learning', multiplier: 1.15 },
  ],
  riskTags: [
    { tag: 'duty', multiplier: 1.45 },
    { tag: 'mentor_debt', multiplier: 1.35 },
    { tag: 'obligation', multiplier: 1.3 },
  ],
  summarySignal: 'mentor_obligation_active',
};

/** Feud / betrayal risk — sworn enemies and active enemy list. */
export const P17_RELATIONSHIP_FEUD_PRESSURE: RelationshipConsequencePattern = {
  id: 'p17_feud_pressure',
  label: '宿怨纠缠',
  consequenceKind: 'feud',
  lifePathSignals: ['enemy', 'sworn_enemy'],
  baseIntensity: 0.8,
  opportunityTags: [{ tag: 'revenge', multiplier: 1.3 }],
  riskTags: [
    { tag: 'conflict', multiplier: 1.55 },
    { tag: 'feud', multiplier: 1.5 },
    { tag: 'betrayal', multiplier: 1.35 },
  ],
  summarySignal: 'feud_pressure_active',
};

/** Kinship protection obligation — must-protect commitments. */
export const P17_RELATIONSHIP_KINSHIP_DUTY: RelationshipConsequencePattern = {
  id: 'p17_kinship_duty',
  label: '亲族牵挂',
  consequenceKind: 'obligation',
  lifePathSignals: ['must_protect'],
  triggerFlags: ['married'],
  baseIntensity: 0.6,
  opportunityTags: [{ tag: 'family', multiplier: 1.25 }],
  riskTags: [
    { tag: 'family', multiplier: 1.3 },
    { tag: 'duty', multiplier: 1.4 },
  ],
  summarySignal: 'kinship_duty_active',
};

/** Route-preference martial focus — persona / route differentiation (profile-tuned). */
export const P17_ROUTE_MARTIAL_FOCUS: FactionIdentityConsequencePattern = {
  id: 'p17_route_martial_focus',
  label: '武路精进',
  layer: 'social_status',
  consequenceKind: 'access',
  triggerFlags: ['p8_route_martial', 'route_martial'],
  baseIntensity: 0.65,
  opportunityTags: [
    { tag: 'training', multiplier: 1.4 },
    { tag: 'martial', multiplier: 1.35 },
    { tag: 'sect', multiplier: 1.2 },
  ],
  summarySignal: 'martial_route_focus_active',
};

/** Route-preference demonic risk — separates deviant mid/late-life pressure. */
export const P17_ROUTE_DEMONIC_RISK: FactionIdentityConsequencePattern = {
  id: 'p17_route_demonic_risk',
  label: '邪路风险',
  layer: 'social_status',
  consequenceKind: 'rivalry',
  triggerFlags: ['p8_route_demonic', 'route_demonic', 'demonic_path_touched'],
  baseIntensity: 0.7,
  riskTags: [
    { tag: 'conflict', multiplier: 1.45 },
    { tag: 'feud', multiplier: 1.35 },
    { tag: 'rivalry', multiplier: 1.3 },
  ],
  opportunityTags: [{ tag: 'resource', multiplier: 1.1 }],
  summarySignal: 'demonic_route_risk_active',
};

export const WUXIA_RELATIONSHIP_CONSEQUENCE_PATTERNS: RelationshipConsequencePattern[] = [
  P17_RELATIONSHIP_SWORN_SHIELDING,
  P17_RELATIONSHIP_MENTOR_OBLIGATION,
  P17_RELATIONSHIP_FEUD_PRESSURE,
  P17_RELATIONSHIP_LIFE_DEBT,
  P17_RELATIONSHIP_KINSHIP_DUTY,
];

/** Orthodox sect protection and access. */
export const P17_FACTION_ORTHODOX_PROTECTION: FactionIdentityConsequencePattern = {
  id: 'p17_orthodox_protection',
  label: '正道庇护',
  layer: 'organization',
  consequenceKind: 'protection',
  triggerFlags: ['orthodox_member', 'route_orthodox'],
  baseIntensity: 0.7,
  opportunityTags: [
    { tag: 'sect', multiplier: 1.35 },
    { tag: 'faction', multiplier: 1.3 },
    { tag: 'backing', multiplier: 1.2 },
  ],
  riskTags: [{ tag: 'conflict', multiplier: 0.9 }],
  summarySignal: 'orthodox_protection_active',
};

/** Sect duty and political exposure for leadership roles. */
export const P17_FACTION_SECT_DUTY: FactionIdentityConsequencePattern = {
  id: 'p17_sect_duty_exposure',
  label: '门派重任',
  layer: 'organization',
  consequenceKind: 'duty',
  triggerFlags: ['sect_master', 'sect_elder'],
  baseIntensity: 0.75,
  opportunityTags: [{ tag: 'sect', multiplier: 1.25 }],
  riskTags: [
    { tag: 'duty', multiplier: 1.5 },
    { tag: 'exposure', multiplier: 1.4 },
    { tag: 'political', multiplier: 1.3 },
  ],
  summarySignal: 'sect_duty_active',
};

/** Unconventional rivalry pressure. */
export const P17_FACTION_RIVALRY: FactionIdentityConsequencePattern = {
  id: 'p17_faction_rivalry',
  label: '正邪相争',
  layer: 'organization',
  consequenceKind: 'rivalry',
  triggerFlags: ['unconventional_member', 'route_demonic'],
  baseIntensity: 0.8,
  riskTags: [
    { tag: 'conflict', multiplier: 1.45 },
    { tag: 'rivalry', multiplier: 1.4 },
    { tag: 'feud', multiplier: 1.25 },
  ],
  opportunityTags: [{ tag: 'resource', multiplier: 1.15 }],
  summarySignal: 'faction_rivalry_active',
};

/** Hero mantle — social status with reputation upkeep. */
export const P17_IDENTITY_HERO_MANTLE: FactionIdentityConsequencePattern = {
  id: 'p17_hero_mantle_status',
  label: '侠名在外',
  layer: 'social_status',
  consequenceKind: 'exposure',
  triggerFlags: ['hero_rep_mantle', 'route_hero'],
  baseIntensity: 0.72,
  opportunityTags: [
    { tag: 'prestige', multiplier: 1.35 },
    { tag: 'reputation', multiplier: 1.25 },
  ],
  riskTags: [
    { tag: 'backlash', multiplier: 1.4 },
    { tag: 'exposure', multiplier: 1.35 },
    { tag: 'gray_judgment', multiplier: 1.2 },
  ],
  summarySignal: 'hero_mantle_active',
};

/** Official role — access with political cost. */
export const P17_IDENTITY_OFFICIAL_ROLE: FactionIdentityConsequencePattern = {
  id: 'p17_official_role',
  label: '仕途在身',
  layer: 'social_status',
  consequenceKind: 'political_cost',
  triggerFlags: ['route_official', 'official_promoted'],
  baseIntensity: 0.68,
  opportunityTags: [
    { tag: 'official', multiplier: 1.3 },
    { tag: 'resource', multiplier: 1.15 },
  ],
  riskTags: [
    { tag: 'political', multiplier: 1.45 },
    { tag: 'duty', multiplier: 1.35 },
  ],
  summarySignal: 'official_role_active',
};

export const WUXIA_FACTION_IDENTITY_CONSEQUENCE_PATTERNS: FactionIdentityConsequencePattern[] = [
  P17_FACTION_ORTHODOX_PROTECTION,
  P17_FACTION_SECT_DUTY,
  P17_FACTION_RIVALRY,
  P17_IDENTITY_HERO_MANTLE,
  P17_IDENTITY_OFFICIAL_ROLE,
  P17_ROUTE_MARTIAL_FOCUS,
  P17_ROUTE_DEMONIC_RISK,
];

/** Sect leadership stability upkeep. */
export const P17_MAINTENANCE_SECT_LEADERSHIP: AchievementMaintenancePattern = {
  id: 'p17_sect_leadership_upkeep',
  label: '掌门之位',
  achievementFlags: ['sect_master', 'sect_elder'],
  dimensions: [
    {
      dimension: 'internal_stability',
      requiredLevel: 0.5,
      neglectRiskMultiplier: 1.45,
      satisfactionSignals: ['player.influence', 'player.connections'],
    },
  ],
  opportunityTags: [{ tag: 'sect', multiplier: 1.2 }],
  neglectRiskTags: [
    { tag: 'instability', multiplier: 1.5 },
    { tag: 'decline', multiplier: 1.4 },
  ],
  summarySignal: 'sect_leadership_maintenance',
};

/** Hero reputation mantle — external threat and reputation. */
export const P17_MAINTENANCE_HERO_REPUTATION: AchievementMaintenancePattern = {
  id: 'p17_hero_reputation_upkeep',
  label: '侠名维系',
  achievementFlags: ['hero_rep_mantle'],
  dimensions: [
    {
      dimension: 'reputation',
      requiredLevel: 0.6,
      neglectRiskMultiplier: 1.55,
      satisfactionSignals: ['player.reputation'],
    },
    {
      dimension: 'external_threat',
      requiredLevel: 0.45,
      neglectRiskMultiplier: 1.4,
      satisfactionSignals: ['player.martialPower', 'player.influence'],
    },
  ],
  opportunityTags: [{ tag: 'prestige', multiplier: 1.15 }],
  neglectRiskTags: [
    { tag: 'backlash', multiplier: 1.55 },
    { tag: 'decline', multiplier: 1.35 },
  ],
  summarySignal: 'hero_reputation_maintenance',
};

/** Family legacy — alliances and social responsibility. */
export const P17_MAINTENANCE_FAMILY_LEGACY: AchievementMaintenancePattern = {
  id: 'p17_family_legacy_upkeep',
  label: '家业与人脉',
  achievementFlags: ['married', 'family_legacy'],
  dimensions: [
    {
      dimension: 'alliances',
      requiredLevel: 0.5,
      neglectRiskMultiplier: 1.4,
      satisfactionSignals: ['player.connections', 'player.children'],
    },
    {
      dimension: 'followers',
      requiredLevel: 0.4,
      neglectRiskMultiplier: 1.35,
      satisfactionSignals: ['player.connections', 'lifePath.relationships.disciples'],
    },
  ],
  opportunityTags: [{ tag: 'family', multiplier: 1.2 }],
  neglectRiskTags: [
    { tag: 'family', multiplier: 1.4 },
    { tag: 'obligation', multiplier: 1.3 },
  ],
  summarySignal: 'family_legacy_maintenance',
};

export const WUXIA_ACHIEVEMENT_MAINTENANCE_PATTERNS: AchievementMaintenancePattern[] = [
  P17_MAINTENANCE_SECT_LEADERSHIP,
  P17_MAINTENANCE_HERO_REPUTATION,
  P17_MAINTENANCE_FAMILY_LEGACY,
];
