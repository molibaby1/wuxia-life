import { P2_SIMULATION_METRIC_DEFINITIONS } from './gameplaySimulationMetricDefinitions';

export type ExperienceHealthMetricSeverity = 'blocker' | 'warning' | 'info';

export type ExperienceHealthMetricKey =
  | 'choice_rate'
  | 'auto_event_rate'
  | 'route_completion_rate'
  | 'route_breakage_rate'
  | 'death_rate'
  | 'ending_distribution'
  | 'romance_family_achievement_rate'
  | 'save_count'
  | 'adjacent_same_event_rate'
  | 'adjacent_same_class_rate'
  | 'short_window_same_class_rate'
  | 'formal_event_ratio'
  | 'daily_event_ratio'
  | 'top_event_concentration'
  | 'family_event_share'
  | 'route_load_parity'
  | 'route_stuck_active_rate';

export interface ExperienceHealthMetricDefinition {
  key: ExperienceHealthMetricKey;
  label: string;
  description: string;
  severity: ExperienceHealthMetricSeverity;
  baseline: {
    min?: number;
    max?: number;
    note: string;
  };
  /** 不允许 waiver（Phase 2 复读 blocker 等） */
  nonWaivable?: boolean;
}

export const P0_REPETITION_THRESHOLDS = {
  adjacentSameEventRateMax: 0.08,
  adjacentSameClassRateMax: 0.35,
  shortWindowSameClassRateMax: 0.45,
} as const;

export const P1_RHYTHM_THRESHOLDS = {
  formalEventRatio: { min: 0.5, max: 0.9 },
  dailyEventRatio: { min: 0.1, max: 0.5 },
} as const;

const EXPERIENCE_ONLY_METRIC_DEFINITIONS: ReadonlyArray<ExperienceHealthMetricDefinition> = [
  {
    key: 'adjacent_same_event_rate',
    label: 'Adjacent Same Event Rate',
    description: '相邻两年触发同一 eventId 的比例（按样本取最差值，对齐 US-010 P0）。',
    severity: 'blocker',
    nonWaivable: true,
    baseline: {
      max: P0_REPETITION_THRESHOLDS.adjacentSameEventRateMax,
      note: '任一样本超标即阻断 validate。',
    },
  },
  {
    key: 'adjacent_same_class_rate',
    label: 'Adjacent Same Class Rate',
    description: '相邻两年 injury/illness/economy/family 同类重复比例（按样本取最差值）。',
    severity: 'blocker',
    nonWaivable: true,
    baseline: {
      max: P0_REPETITION_THRESHOLDS.adjacentSameClassRateMax,
      note: '任一样本超标即阻断 validate。',
    },
  },
  {
    key: 'short_window_same_class_rate',
    label: 'Short Window Same Class Rate',
    description: '过去 5 个游戏年内出现同类重复的事件占比（按样本取最差值）。',
    severity: 'blocker',
    nonWaivable: true,
    baseline: {
      max: P0_REPETITION_THRESHOLDS.shortWindowSameClassRateMax,
      note: '任一样本超标即阻断 validate。',
    },
  },
  {
    key: 'formal_event_ratio',
    label: 'Formal Event Ratio',
    description: '正式事件占模拟时间线比例（非 daily_event）。',
    severity: 'warning',
    baseline: {
      min: P1_RHYTHM_THRESHOLDS.formalEventRatio.min,
      max: P1_RHYTHM_THRESHOLDS.formalEventRatio.max,
      note: '对齐 P1 rhythm baseline 观察区间。',
    },
  },
  {
    key: 'daily_event_ratio',
    label: 'Daily Event Ratio',
    description: '日常事件占模拟时间线比例。',
    severity: 'warning',
    baseline: {
      min: P1_RHYTHM_THRESHOLDS.dailyEventRatio.min,
      max: P1_RHYTHM_THRESHOLDS.dailyEventRatio.max,
      note: '对齐 P1 rhythm baseline 观察区间。',
    },
  },
  {
    key: 'top_event_concentration',
    label: 'Top Event Concentration',
    description: '全样本中出现次数最高的事件 ID 占比。',
    severity: 'warning',
    baseline: {
      max: 0.35,
      note: '单事件过度垄断时间线时告警。',
    },
  },
  {
    key: 'family_event_share',
    label: 'Family Event Share',
    description: '家庭类事件在总事件中的占比。',
    severity: 'info',
    baseline: {
      max: 0.45,
      note: '过高可能表示家庭线刷屏，仅观察。',
    },
  },
  {
    key: 'route_load_parity',
    label: 'Route Load Parity',
    description: 'events.json 声明的 import 是否均已进入 EventLoader（1=通过，0=失败）。',
    severity: 'blocker',
    nonWaivable: true,
    baseline: {
      min: 1,
      max: 1,
      note: '必须为 1；包 C 加载一致性门禁。',
    },
  },
  {
    key: 'route_stuck_active_rate',
    label: 'Route Stuck Active Rate',
    description: '已启动路线中终局仍为 active 的比例。',
    severity: 'info',
    baseline: {
      max: 0.7,
      note: '观察路线只启动不完成的问题。',
    },
  },
];

function mapP2ToExperienceDefinition(
  def: (typeof P2_SIMULATION_METRIC_DEFINITIONS)[number],
): ExperienceHealthMetricDefinition {
  return {
    key: def.key as ExperienceHealthMetricKey,
    label: def.label,
    description: def.description,
    severity: def.severity,
    baseline: {
      min: def.baseline.min,
      max: def.baseline.max,
      note: def.baseline.note,
    },
    nonWaivable: def.key === 'route_breakage_rate',
  };
}

export const EXPERIENCE_HEALTH_METRIC_DEFINITIONS: ReadonlyArray<ExperienceHealthMetricDefinition> = [
  ...P2_SIMULATION_METRIC_DEFINITIONS.map(mapP2ToExperienceDefinition),
  ...EXPERIENCE_ONLY_METRIC_DEFINITIONS,
];
