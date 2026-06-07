/**
 * P9 stage configuration — 0-40 age slice divided into explicit stages.
 */

export interface StageFeedbackExpectation {
  minImpactEvents: number;
  expectedSignals: string[];
}

export interface LifeStageConfig {
  id: string;
  ageMin: number;
  ageMax: number;
  purpose: string;
  feedbackExpectation: StageFeedbackExpectation;
}

export const WUXIA_STAGE_CONFIG: LifeStageConfig[] = [
  {
    id: 'stage_0_10',
    ageMin: 0,
    ageMax: 10,
    purpose: '出身与童年选择，建立早期行动习惯与路线种子',
    feedbackExpectation: {
      minImpactEvents: 3,
      expectedSignals: ['origin', 'childhood_choice', 'early_active_action'],
    },
  },
  {
    id: 'stage_10_20',
    ageMin: 10,
    ageMax: 20,
    purpose: '武学/学识/营商/游历入门，路线倾向初显',
    feedbackExpectation: {
      minImpactEvents: 4,
      expectedSignals: ['route_entry', 'training_milestone', 'first_turning_point'],
    },
  },
  {
    id: 'stage_20_30',
    ageMin: 20,
    ageMax: 30,
    purpose: '路线强化与分化，身份信号与关系转折',
    feedbackExpectation: {
      minImpactEvents: 3,
      expectedSignals: ['route_reinforcement', 'identity_signal', 'relationship_shift'],
    },
  },
  {
    id: 'stage_30_40',
    ageMin: 30,
    ageMax: 41,
    purpose: '中年身份确认，路线分歧落地与阶段成果',
    feedbackExpectation: {
      minImpactEvents: 2,
      expectedSignals: ['route_divergence', 'achievement', 'age40_identity'],
    },
  },
];

export function getStageForAge(age: number): LifeStageConfig | undefined {
  return WUXIA_STAGE_CONFIG.find(s => age >= s.ageMin && age < s.ageMax);
}

export function getAllStageConfigs(): LifeStageConfig[] {
  return WUXIA_STAGE_CONFIG;
}
