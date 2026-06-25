/**
 * Frozen player-facing labels for life memory (P3 US-025 §4).
 */

export const KEY_CHOICE_EVENT_LABELS: Record<string, string> = {
  childhood_preference: '儿时志向',
  martial_arts_enlightenment: '武学取向',
  sect_path_choice: '人生路线抉择',
  orthodox_trial_entry: '入门试炼',
  orthodox_trial_service: '试炼中',
  demonic_encounter: '魔道诱惑',
  demonic_power_struggle: '魔道权争',
  sect_trial_final: '门派终试',
  hero_first_case: '侠路首案',
  sect_midlife_faction_pressure: '中年门派派系抉择',
  sect_midlife_gray_mission: '中年门派灰任务',
  hero_old_case_returns: '旧案重审',
  hero_reputation_backlash: '名声反噬',
  hero_ally_pays_price: '盟友代价',
  hero_gray_judgment: '灰色审判',
  demonic_midlife_expansion: '魔道扩张',
  demonic_midlife_betrayal: '魔道背叛之局',
  demonic_midlife_fork: '魔道岔路',
  demonic_midlife_consequence: '魔道中年收束',
};

export const KEY_CHOICE_LABELS: Record<string, Record<string, string>> = {
  childhood_preference: {
    focus_on_study: '儿时专心向学',
    play_outside: '儿时偏爱游玩',
    balance_both: '儿时文武兼修',
  },
  martial_arts_enlightenment: {
    external_focus: '武学取向：外功',
    internal_focus: '武学取向：内功',
    agile_path: '武学取向：轻功',
    balanced_start: '武学取向：均衡',
    generic_path: '武学取向：均衡',
  },
  sect_path_choice: {
    join_orthodox: '拜入正道门派',
    stay_wanderer: '选择行走江湖',
  },
  demonic_encounter: {
    accept_demonic: '接受魔道诱惑',
    reject_demonic: '拒绝魔道诱惑',
  },
  demonic_power_struggle: {
    demonic_usurp: '魔道权争：夺位',
    demonic_renounce: '魔道权争：退让',
  },
  hero_first_case: {
    fight_bandits: '侠路首案：正面出手',
    help_secretly: '侠路首案：暗中相助',
  },
};

export const KEY_CHOICE_OUTCOME_CONSEQUENCES: Record<string, string> = {
  hero_old_case_truth: '你选择说出旧案真相',
  hero_old_case_silence: '你选择缄口不提旧案',
  diligentStudent: '你以勤学为志',
  freeSpirit: '你以自在为志',
  balancedApproach: '你文武兼修',
  sect_midlife_gray_executed: '你接了灰色任务，师门记功，心下难安',
  sect_midlife_gray_refused: '你守住了底线，师门关系承压',
  sect_midlife_gray_leaked: '你把内幕捅出，江湖侧目',
  demonic_midlife_isolation_done: '扩张之后，旧友渐远',
  demonic_midlife_betrayal_done: '门内清洗，信任碎裂',
};

export const RELATIONSHIP_ROLE_LABELS: Record<string, string> = {
  master: '师长',
  lover: '情缘',
  sworn: '义兄弟',
  rival: '对手',
  friend: '友人',
  family: '家人',
  enemy: '宿敌',
  patron: '恩人',
  spouse: '配偶',
  children: '子嗣',
};

export const ACHIEVEMENT_ID_LABELS: Record<string, string> = {
  save_village: '拯救村庄',
  defeat_bandits: '击退匪患',
  sect_trial_completed: '通过门派试炼',
  orthodox_trial_completed: '完成正道试炼',
};

export const MIDLIFE_OUTCOME_LABELS: Record<string, string> = {
  upright_guardian: '中年守正，清誉如山',
  sect_enforcer: '中年掌刑，门规铁面',
  hidden_mercy: '中年暗施慈悲',
  weary_steward: '中年倦守山门',
  steadfast_elder: '中年长老，定海神针',
  hero_midlife_reclusive: '退隐江湖',
  hero_midlife_legend_seed: '侠名渐起',
  hero_midlife_burdened: '负侠名而行',
  hero_midlife_family_tether: '以家为锚',
  hero_midlife_ongoing: '侠路未绝',
  demonic_midlife_legacy_rule: '魔道立规',
  demonic_midlife_legacy_withdraw: '金盆洗手',
  demonic_midlife_legacy_exile: '远遁割席',
};

export const DEBT_FLAG_LABELS: Record<string, string> = {
  has_life_debt: '尚欠救命之恩',
  hero_gray_debtor: '灰色案中的庇护之债',
  demonic_usurp_failed: '夺位失败后清算阴影',
  merchant_shop_failed: '初次经营失利，本钱受损',
  merchant_midlife_debt: '人情债未清，周转吃紧',
};

export const RISK_SIGNAL_LABELS = {
  lowHealth: '身子正虚，宜静养',
  lowConstitutionYoung: '命途多舛，需养精蓄锐',
  demonicUsurpFailed: '夺位失败后余波未平',
  demonicPurge: '门内清算风险未解',
  sectJudgmentPending: '师门公审将至',
  badReputation: '声名狼藉，行事多阻',
  demonicChivalry: '魔念渐深，正道难容',
  demonicIsolation: '扩张之后，旧友渐远',
  merchantCrisis: '财富与义气难以两全',
  highAnxiety: '心事重重',
  highFatigue: '身心俱疲',
} as const;

export const ROUTE_TRANSITION_LABELS: Record<string, string> = {
  turned: '人生路线已转向',
  locked_in: '人生路线已承诺',
  completed: '一段路线已告完成',
  failed: '一段路线已中断',
};

/**
 * Player-facing key choice label; never returns raw eventId.
 */
export function formatKeyChoiceLabel(eventId: string, choiceId?: string): string {
  if (choiceId) {
    const byEvent = KEY_CHOICE_LABELS[eventId];
    if (byEvent?.[choiceId]) {
      return byEvent[choiceId];
    }
    if (choiceId.includes('accept')) {
      return `${KEY_CHOICE_EVENT_LABELS[eventId] ?? '关键抉择'}：接受`;
    }
    if (choiceId.includes('reject') || choiceId.includes('renounce')) {
      return `${KEY_CHOICE_EVENT_LABELS[eventId] ?? '关键抉择'}：拒绝`;
    }
  }

  const prefix = KEY_CHOICE_EVENT_LABELS[eventId];
  if (prefix) {
    return prefix;
  }

  return '命运转折';
}

export function affinityToStatusLabel(affinity: number): string {
  if (affinity >= 60) return '亲近';
  if (affinity >= 20) return '和睦';
  if (affinity >= -19) return '平淡';
  if (affinity >= -59) return '疏远';
  return '敌对';
}

export function affinityToBand(affinity: number): 'close' | 'neutral' | 'strained' | 'hostile' {
  if (affinity >= 60) return 'close';
  if (affinity <= -60) return 'hostile';
  if (affinity <= -20 || affinity >= 20) return 'strained';
  return 'neutral';
}
