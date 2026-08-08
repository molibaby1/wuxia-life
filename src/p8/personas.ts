import type { P8Persona } from './types';

function goal(
  id: string,
  label: string,
  ageBand: P8Persona['shortTermGoals'][0]['ageBand'],
  evidenceTypes: P8Persona['shortTermGoals'][0]['evidenceTypes'],
  evidenceSpec: P8Persona['shortTermGoals'][0]['evidenceSpec'],
): P8Persona['shortTermGoals'][0] {
  return { id, label, ageBand, evidenceTypes, evidenceSpec };
}

export const P8_PERSONA_ROSTER: P8Persona[] = [
  {
    id: 'p8-martial-lin',
    name: '林破竹',
    gender: 'male',
    seed: 801,
    strategy: 'training',
    strategySummary: '优先练功，追求武力成长与江湖身份',
    routePreference: 'martial',
    riskPreference: 'medium',
    relationshipPreference: 'low',
    choiceTendency: 'martial',
    shortTermGoals: [
      goal('lin-martial-base', '打下武功根基', '0-20', ['stat_threshold'], { stat: 'martialPower', statMin: 25 }),
      goal('lin-training-habit', '坚持练功规划', '0-20', ['action_category_count'], { actionCategory: 'training', actionCategoryMinCount: 3 }),
      goal('lin-sect-signal', '获得门派或江湖身份信号', '20-30', ['flag', 'route_state'], { flag: 'joined_sect' }),
      goal('lin-power-30', '三十岁前功力达标', '30-40', ['stat_threshold'], { stat: 'martialPower', statMin: 45 }),
    ],
  },
  {
    id: 'p8-scholar-su',
    name: '苏文澜',
    gender: 'female',
    seed: 802,
    strategy: 'study',
    strategySummary: '优先读书，提升学识',
    routePreference: 'scholarly',
    riskPreference: 'low',
    relationshipPreference: 'medium',
    choiceTendency: 'balanced',
    shortTermGoals: [
      goal('su-knowledge', '积累学识', '0-20', ['stat_threshold'], { stat: 'knowledge', statMin: 20 }),
      goal('su-study-habit', '坚持读书规划', '0-20', ['action_category_count'], { actionCategory: 'study', actionCategoryMinCount: 3 }),
      goal('su-scholar-identity', '文路身份显现', '30-40', ['flag'], { flag: 'scholar_path_started' }),
    ],
  },
  {
    id: 'p8-social-gu',
    name: '顾清仪',
    gender: 'female',
    seed: 803,
    strategy: 'socializing',
    strategySummary: '优先交游，拓展人脉与情感',
    routePreference: 'social',
    riskPreference: 'medium',
    relationshipPreference: 'high',
    choiceTendency: 'relationship',
    shortTermGoals: [
      goal('gu-connections', '拓展人脉', '0-20', ['stat_threshold'], { stat: 'connections', statMin: 15 }),
      goal('gu-social-habit', '坚持交游规划', '0-20', ['action_category_count'], { actionCategory: 'socializing', actionCategoryMinCount: 2 }),
      goal('gu-relationship', '建立重要关系', '20-30', ['relationship'], { relationshipKey: 'spouse' }),
      goal('gu-charisma', '魅力成长', '30-40', ['stat_threshold'], { stat: 'charisma', statMin: 35 }),
    ],
  },
  {
    id: 'p8-wealth-shen',
    name: '沈聚财',
    gender: 'male',
    seed: 804,
    strategy: 'business',
    strategySummary: '优先营商敛财，财富与声望并重',
    routePreference: 'wealth',
    riskPreference: 'medium',
    relationshipPreference: 'low',
    choiceTendency: 'wealth',
    shortTermGoals: [
      goal('shen-money', '积累财富', '0-20', ['stat_threshold'], { stat: 'money', statMin: 200 }),
      goal('shen-business-habit', '坚持营商规划', '0-20', ['action_category_count'], { actionCategory: 'business', actionCategoryMinCount: 2 }),
      goal('shen-reputation', '声望起步', '20-30', ['stat_threshold'], { stat: 'reputation', statMin: 10 }),
      goal('shen-wealth-40', '四十岁前的经济基础', '30-40', ['stat_threshold'], { stat: 'money', statMin: 500 }),
    ],
  },
  {
    id: 'p8-cautious-han',
    name: '韩守拙',
    gender: 'male',
    seed: 805,
    strategy: 'training',
    strategySummary: '保守练功，规避高代价选择',
    routePreference: 'conservative',
    riskPreference: 'low',
    relationshipPreference: 'medium',
    choiceTendency: 'risk_averse',
    shortTermGoals: [
      goal('han-health', '保持身体稳定', '0-20', ['health_status'], { healthStatuses: ['healthy', 'unwell'] }),
      goal('han-safe-training', '稳健练功', '0-20', ['action_category_count'], { actionCategory: 'training', actionCategoryMinCount: 2 }),
      goal('han-avoid-setback', '少遭重创', '20-30', ['flag'], { flag: 'major_injury' }),
      goal('han-stable-40', '四十岁身体稳定', '30-40', ['health_status'], { healthStatuses: ['healthy', 'unwell'] }),
    ],
  },
  {
    id: 'p8-deviant-ye',
    name: '叶走邪',
    gender: 'male',
    seed: 806,
    strategy: 'training',
    strategySummary: '偏邪路高风险，练功之余兼修诡术与游历',
    routePreference: 'demonic',
    riskPreference: 'high',
    relationshipPreference: 'low',
    choiceTendency: 'martial',
    shortTermGoals: [
      goal('ye-demonic-flag', '邪路信号出现', '0-20', ['flag'], { flag: 'demonic_path_touched' }),
      goal('ye-risk-choice', '做出高风险选择', '20-30', ['event_id'], { eventId: 'demonic_midlife_fork' }),
      goal('ye-power-dark', '邪路功力成长', '30-40', ['stat_threshold'], { stat: 'martialPower', statMin: 40 }),
    ],
  },
  {
    id: 'p8-explorer-lu',
    name: '陆行远',
    gender: 'male',
    seed: 807,
    strategy: 'travel',
    strategySummary: '探索游历，换见闻与机会',
    routePreference: 'wanderer',
    riskPreference: 'high',
    relationshipPreference: 'medium',
    choiceTendency: 'balanced',
    shortTermGoals: [
      goal('lu-travel-habit', '坚持游历规划', '0-20', ['action_category_count'], { actionCategory: 'travel', actionCategoryMinCount: 2 }),
      goal('lu-connections', '路上结识人脉', '20-30', ['stat_threshold'], { stat: 'connections', statMin: 20 }),
      goal('lu-knowledge', '见闻积累', '30-40', ['stat_threshold'], { stat: 'knowledge', statMin: 25 }),
    ],
  },
  {
    id: 'p8-balanced-wei',
    name: '卫中和',
    gender: 'female',
    seed: 808,
    strategy: 'balanced',
    strategySummary: '均衡成长，不偏极端',
    routePreference: 'balanced',
    riskPreference: 'medium',
    relationshipPreference: 'medium',
    choiceTendency: 'balanced',
    shortTermGoals: [
      goal('wei-balanced-stats', '文武均衡', '0-20', ['stat_threshold'], { stat: 'martialPower', statMin: 15 }),
      goal('wei-mixed-actions', '多种主动行动并用', '20-30', ['action_category_count'], { actionCategory: 'study', actionCategoryMinCount: 1 }),
      goal('wei-identity', '形成稳定身份标签', '30-40', ['route_state'], { routeKey: 'primary_identity' }),
    ],
  },
];

export function getP8PersonaById(id: string): P8Persona | undefined {
  return P8_PERSONA_ROSTER.find(p => p.id === id);
}

export function getP8GatePersonas(): P8Persona[] {
  return [...P8_PERSONA_ROSTER];
}
