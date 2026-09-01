import type {
  EndgameCategoryConfig,
  HistoricalMemoryPattern,
  PreEndgameRecoveryPattern,
} from './types';

export const P19_CATEGORY_LEGENDARY_ECHO: EndgameCategoryConfig = {
  id: 'p19_category_legendary_echo',
  label: '传奇余响',
  categoryKind: 'legendary_echo',
  triggerFlags: ['hero_rep_mantle', 'martial_transmission', 'inheritance_legacy_complete'],
  trajectoryWeights: {
    achievementScore: 1.2,
    legacyScore: 1.1,
    relationshipScore: 0.6,
    factionScore: 0.5,
    burdenScore: -0.4,
  },
  baseWeight: 0.28,
  summarySignal: 'legendary_echo',
};

export const P19_CATEGORY_BITTERSWEET: EndgameCategoryConfig = {
  id: 'p19_category_bittersweet_closure',
  label: '有成有憾',
  categoryKind: 'bittersweet_closure',
  triggerFlags: ['hero_maintenance_neglect', 'unresolved_feud'],
  trajectoryWeights: {
    achievementScore: 0.9,
    burdenScore: 0.8,
    relationshipScore: 0.4,
    legacyScore: 0.3,
  },
  baseWeight: 0.3,
  summarySignal: 'bittersweet_closure',
};

export const P19_CATEGORY_QUIET_CONTINUITY: EndgameCategoryConfig = {
  id: 'p19_category_quiet_continuity',
  label: '烟火延续',
  categoryKind: 'quiet_continuity',
  triggerFlags: ['family_legacy', 'quiet_retirement'],
  lifePathSignals: ['ally'],
  trajectoryWeights: {
    relationshipScore: 1,
    legacyScore: 0.5,
    achievementScore: -0.2,
    factionScore: -0.3,
  },
  baseWeight: 0.25,
  summarySignal: 'quiet_continuity',
};

export const P19_CATEGORY_ISOLATED_FADE: EndgameCategoryConfig = {
  id: 'p19_category_isolated_fade',
  label: '孤影渐隐',
  categoryKind: 'isolated_fade',
  triggerFlags: ['hermit_withdrawal', 'lonely_elder'],
  trajectoryWeights: {
    relationshipScore: -0.8,
    factionScore: -0.5,
    achievementScore: 0.2,
    burdenScore: 0.3,
  },
  baseWeight: 0.42,
  summarySignal: 'isolated_fade',
};

export const P19_CATEGORY_INFAMOUS_ECHO: EndgameCategoryConfig = {
  id: 'p19_category_infamous_echo',
  label: '争议回响',
  categoryKind: 'infamous_echo',
  triggerFlags: ['demonic_reputation', 'blood_feud_active', 'sect_exposure'],
  lifePathSignals: ['enemy'],
  trajectoryWeights: {
    burdenScore: 1.2,
    factionScore: 0.6,
    achievementScore: 0.4,
    relationshipScore: -0.5,
  },
  baseWeight: 0.25,
  summarySignal: 'infamous_echo',
};

export const WUXIA_ENDGAME_CATEGORY_CONFIGS: EndgameCategoryConfig[] = [
  P19_CATEGORY_LEGENDARY_ECHO,
  P19_CATEGORY_BITTERSWEET,
  P19_CATEGORY_QUIET_CONTINUITY,
  P19_CATEGORY_ISOLATED_FADE,
  P19_CATEGORY_INFAMOUS_ECHO,
];

/** US-013: relationship reconciliation sample */
export const P19_RECOVERY_RELATIONSHIP_RECONCILIATION: PreEndgameRecoveryPattern = {
  id: 'p19_recovery_relationship_reconciliation',
  label: '旧怨得释',
  dimension: 'relationship',
  recoveryKind: 'reconciliation',
  triggerFlags: ['feud_reconciled', 'ally_reunion'],
  lifePathSignals: ['ally'],
  baseIntensity: 0.85,
  opportunityTags: [{ tag: 'relationship', multiplier: 1.3 }],
  summaryLine: '晚年与旧识言和，未竟之情终得收束。',
  explicitInSummary: true,
};

/** US-013: vendetta retribution sample */
export const P19_RECOVERY_VENDETTA_RETRIBUTION: PreEndgameRecoveryPattern = {
  id: 'p19_recovery_vendetta_retribution',
  label: '血债血偿',
  dimension: 'vendetta',
  recoveryKind: 'retribution',
  triggerFlags: ['blood_feud_settled', 'sworn_enemy_defeated'],
  lifePathSignals: ['enemy'],
  baseIntensity: 0.9,
  riskTags: [{ tag: 'conflict', multiplier: 1.4 }],
  summaryLine: '宿怨以刀兵了结，江湖记住了这笔血债。',
  explicitInSummary: true,
};

/** US-014: faction protection reward sample */
export const P19_RECOVERY_FACTION_PROTECTION: PreEndgameRecoveryPattern = {
  id: 'p19_recovery_faction_protection',
  label: '门派荫庇',
  dimension: 'faction',
  recoveryKind: 'reward',
  triggerFlags: ['sect_protection', 'sect_elder_honored', 'sectLeader'],
  baseIntensity: 0.8,
  opportunityTags: [{ tag: 'faction', multiplier: 1.25 }, { tag: 'sect', multiplier: 1.2 }],
  summaryLine: '门派为你挡下最后一波风雨，组织身份成为晚年庇护。',
  explicitInSummary: true,
};

/** US-014: faction exposure collapse sample */
export const P19_RECOVERY_FACTION_COLLAPSE: PreEndgameRecoveryPattern = {
  id: 'p19_recovery_faction_exposure',
  label: '门户倾覆',
  dimension: 'faction',
  recoveryKind: 'collapse',
  triggerFlags: ['sect_exposure', 'sect_betrayal', 'political_fallout'],
  baseIntensity: 0.85,
  riskTags: [{ tag: 'faction', multiplier: 1.35 }, { tag: 'decline', multiplier: 1.3 }],
  summaryLine: '势力牵连终至曝光，江湖地位随组织一并崩塌。',
  explicitInSummary: true,
};

/** US-015: legacy succession continuity sample */
export const P19_RECOVERY_LEGACY_CONTINUITY: PreEndgameRecoveryPattern = {
  id: 'p19_recovery_legacy_continuity',
  label: '薪火相传',
  dimension: 'inheritance',
  recoveryKind: 'reward',
  triggerFlags: ['martial_transmission', 'inheritance_legacy_complete', 'disciple_training_active'],
  baseIntensity: 0.9,
  opportunityTags: [{ tag: 'legacy', multiplier: 1.4 }, { tag: 'continuity', multiplier: 1.3 }],
  summaryLine: '所传之道有人接续，身后仍留一脉未断的传承。',
  explicitInSummary: true,
};

/** US-015: inherited burden without capability */
export const P19_RECOVERY_LEGACY_BURDEN: PreEndgameRecoveryPattern = {
  id: 'p19_recovery_inherited_burden',
  label: '重负难承',
  dimension: 'inheritance',
  recoveryKind: 'collapse',
  triggerFlags: ['inherited_burden_active', 'successor_underprepared'],
  baseIntensity: 0.8,
  riskTags: [{ tag: 'legacy', multiplier: 1.3 }, { tag: 'instability', multiplier: 1.25 }],
  summaryLine: '所留重担超出后继者所能，传承线收窄而危机暗生。',
  explicitInSummary: true,
};

/** US-013: obligation reconciliation */
export const P19_RECOVERY_OBLIGATION_FULFILLED: PreEndgameRecoveryPattern = {
  id: 'p19_recovery_obligation_fulfilled',
  label: '诺言得践',
  dimension: 'obligation',
  recoveryKind: 'reconciliation',
  triggerFlags: ['must_protect_fulfilled', 'duty_completed'],
  lifePathSignals: ['must_protect'],
  baseIntensity: 0.75,
  summaryLine: '毕生所守之人与诺，终在暮年得以兑现。',
  explicitInSummary: true,
};

export const WUXIA_PRE_ENDGAME_RECOVERY_PATTERNS: PreEndgameRecoveryPattern[] = [
  P19_RECOVERY_RELATIONSHIP_RECONCILIATION,
  P19_RECOVERY_VENDETTA_RETRIBUTION,
  P19_RECOVERY_FACTION_PROTECTION,
  P19_RECOVERY_FACTION_COLLAPSE,
  P19_RECOVERY_LEGACY_CONTINUITY,
  P19_RECOVERY_LEGACY_BURDEN,
  P19_RECOVERY_OBLIGATION_FULFILLED,
];

/** US-016: admired remembrance */
export const P19_MEMORY_ADMIRED_HERO: HistoricalMemoryPattern = {
  id: 'p19_memory_admired_hero',
  label: '侠名远播',
  dimension: 'jianghu_reputation',
  memoryTone: 'admired',
  triggerFlags: ['hero_rep_mantle', 'legendary_deed'],
  baseIntensity: 0.9,
  livedRealityDelta: 0.1,
  summaryLine: '后世江湖仍传颂你的侠行，名望超越寻常武者。',
  classificationReason: 'High reputation + hero mantle → admired Jianghu memory',
};

/** US-017: feared/disputed remembrance */
export const P19_MEMORY_FEARED_ENEMY: HistoricalMemoryPattern = {
  id: 'p19_memory_feared_enemy',
  label: '令人忌惮',
  dimension: 'moral_ambiguity',
  memoryTone: 'feared',
  triggerFlags: ['demonic_reputation', 'blood_feud_active'],
  lifePathSignals: ['enemy'],
  baseIntensity: 0.85,
  livedRealityDelta: 0.3,
  summaryLine: '后人提及你时多带忌惮，功过交织成争议之名。',
  classificationReason: 'Demonic reputation + active feud → feared mixed memory',
};

export const P19_MEMORY_DISPUTED_HERO: HistoricalMemoryPattern = {
  id: 'p19_memory_disputed_hero',
  label: '褒贬不一',
  dimension: 'distorted_legacy',
  memoryTone: 'disputed',
  triggerFlags: ['sect_exposure', 'gray_choice_history'],
  requireAllTriggerFlags: true,
  baseIntensity: 0.8,
  livedRealityDelta: 0.45,
  summaryLine: '有人称颂你的壮举，也有人记得你手段中的阴影。',
  classificationReason: 'Exposure + gray choices → disputed distortion (hero mantle optional)',
};

/** US-018: lived reality vs memory divergence */
export const P19_MEMORY_QUIET_LOCAL: HistoricalMemoryPattern = {
  id: 'p19_memory_quiet_local',
  label: '乡里温情',
  dimension: 'local_remembrance',
  memoryTone: 'respected',
  triggerFlags: ['family_legacy', 'quiet_retirement'],
  baseIntensity: 0.85,
  livedRealityDelta: 0.55,
  summaryLine: '江湖未必记得你的名字，但身边人仍把你当作值得依靠的长者。',
  classificationReason: 'Modest Jianghu footprint + strong local ties → local memory exceeds self-image',
};

export const P19_MEMORY_FACTION_TESTIMONY: HistoricalMemoryPattern = {
  id: 'p19_memory_faction_testimony',
  label: '门派证言',
  dimension: 'legacy_testimony',
  memoryTone: 'respected',
  triggerFlags: ['martial_transmission', 'sect_elder_honored'],
  baseIntensity: 0.75,
  summaryLine: '弟子与门派档案记载了你的传功与守责。',
  classificationReason: 'Transmission + sect honor → legacy testimony',
};

export const P19_MEMORY_FORGOTTEN_WANDERER: HistoricalMemoryPattern = {
  id: 'p19_memory_forgotten_wanderer',
  label: '江湖过客',
  dimension: 'jianghu_reputation',
  memoryTone: 'forgotten',
  triggerFlags: ['hermit_withdrawal', 'lonely_elder'],
  baseIntensity: 0.7,
  livedRealityDelta: -0.2,
  summaryLine: '你的名字很快从茶馆谈资中淡去，像多数过客一样。',
  classificationReason: 'Withdrawal + low social momentum → forgotten Jianghu memory',
};

export const WUXIA_HISTORICAL_MEMORY_PATTERNS: HistoricalMemoryPattern[] = [
  P19_MEMORY_ADMIRED_HERO,
  P19_MEMORY_FEARED_ENEMY,
  P19_MEMORY_DISPUTED_HERO,
  P19_MEMORY_QUIET_LOCAL,
  P19_MEMORY_FACTION_TESTIMONY,
  P19_MEMORY_FORGOTTEN_WANDERER,
];
