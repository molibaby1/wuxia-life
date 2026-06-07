import type { P8MetricDefinition, P8MetricKey } from './types';

export const P8_METRIC_DEFINITIONS: P8MetricDefinition[] = [
  {
    key: 'agency',
    label: '能动性',
    intent: '玩家主动规划而非固定回放',
    scoringSurface: 'active_action_count, diversity, repeated_streak',
    severity: 'blocker',
    measurementSurface: 'simulation',
    thresholdMax: 4,
  },
  {
    key: 'causality',
    label: '因果回响',
    intent: '早期选择影响后续可见结果',
    scoringSurface: 'direct_echo_count, strongest_examples',
    severity: 'warning',
    measurementSurface: 'simulation',
    thresholdMin: 3,
  },
  {
    key: 'achievement',
    label: '目标达成',
    intent: 'persona 短期目标有 payoff',
    scoringSurface: 'goal achieved/missed/unavailable',
    severity: 'warning',
    measurementSurface: 'simulation',
    thresholdMax: 0.6,
  },
  {
    key: 'frustration',
    label: '挫折公平',
    intent: 'opaque 挫折不过多',
    scoringSurface: 'opaque_negative_ratio',
    severity: 'blocker',
    measurementSurface: 'simulation',
    thresholdMax: 0.35,
  },
  {
    key: 'replayability',
    label: '重玩差异',
    intent: '不同 persona 人生可区分',
    scoringSurface: 'pairwise_similarity, clusters',
    severity: 'warning',
    measurementSurface: 'simulation',
    thresholdMax: 0.82,
  },
  {
    key: 'pacing',
    label: '节奏',
    intent: '避免长空窗无变化',
    scoringSurface: 'longest_low_impact_span_years',
    severity: 'blocker',
    measurementSurface: 'simulation',
    thresholdMax: 8,
  },
  {
    key: 'narrative_memory',
    label: '叙事记忆',
    intent: '可读三段人生摘要',
    scoringSurface: 'early/turning/identity + citations',
    severity: 'warning',
    measurementSurface: 'simulation',
    thresholdMin: 3,
  },
];

export const P8_HUMAN_ONLY_METRICS: P8MetricDefinition[] = [
  {
    key: 'agency',
    label: 'UI 理解度',
    intent: '真人是否理解属性与行动',
    scoringSurface: 'observer checklist',
    severity: 'info',
    measurementSurface: 'human_only',
    nonBlocking: true,
  },
];

export function getP8MetricDefinition(key: P8MetricKey): P8MetricDefinition {
  const def = P8_METRIC_DEFINITIONS.find(d => d.key === key);
  if (!def) {
    throw new Error(`Unknown P8 metric: ${key}`);
  }
  return def;
}

/** Gate end age for P8 small sample */
export const P8_GATE_END_AGE = 40;
