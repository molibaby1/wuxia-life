export type SimulationMetricSeverity = 'blocker' | 'warning' | 'info';

export type MetricBaselineMode = 'target_range' | 'observation_baseline';

export interface SimulationMetricDefinition {
  key:
    | 'choice_rate'
    | 'auto_event_rate'
    | 'death_rate'
    | 'ending_distribution'
    | 'romance_family_achievement_rate'
    | 'save_count';
  label: string;
  description: string;
  severity: SimulationMetricSeverity;
  baseline: {
    mode: MetricBaselineMode;
    note: string;
    min?: number;
    max?: number;
  };
}

export const P2_SIMULATION_METRIC_DEFINITIONS: ReadonlyArray<SimulationMetricDefinition> = [
  {
    key: 'choice_rate',
    label: 'Choice Rate',
    description: '选择事件占总事件比例，用于判断玩家决策参与度是否充足。',
    severity: 'blocker',
    baseline: {
      mode: 'target_range',
      min: 0.2,
      max: 0.75,
      note: '低于 20% 说明可交互决策不足；高于 75% 可能导致叙事推进不稳定。',
    },
  },
  {
    key: 'auto_event_rate',
    label: 'Auto Event Rate',
    description: '自动事件占比，用于监控系统自动推进与玩家决策之间的平衡。',
    severity: 'warning',
    baseline: {
      mode: 'target_range',
      min: 0.25,
      max: 0.8,
      note: '建议与 choice_rate 联合观察，避免全自动或全手动偏态。',
    },
  },
  {
    key: 'death_rate',
    label: 'Death Rate',
    description: '模拟生命周期内死亡结局比例，用于平衡生存压力与可玩性。',
    severity: 'warning',
    baseline: {
      mode: 'observation_baseline',
      min: 0.15,
      max: 0.9,
      note: '当前为观测区间；需结合年龄分布与死因细分判断。',
    },
  },
  {
    key: 'ending_distribution',
    label: 'Ending Distribution',
    description: '结局类型分布（胜利/平凡/失败等）是否单极化，用于判断内容多样性。',
    severity: 'info',
    baseline: {
      mode: 'observation_baseline',
      note: '任一单结局占比超过 70% 记为 warning 观察信号；超过 85% 可升级为 blocker。',
    },
  },
  {
    key: 'romance_family_achievement_rate',
    label: 'Romance/Family Achievement Rate',
    description: '达成恋爱或家庭相关里程碑的比例，用于评估非战斗人生线可达性。',
    severity: 'info',
    baseline: {
      mode: 'observation_baseline',
      min: 0.05,
      max: 0.7,
      note: '过低可能表示支线无法触达；过高可能表示单一路径过强。',
    },
  },
  {
    key: 'save_count',
    label: 'Save Count',
    description: '单次模拟过程的存档次数，用于后续保存链路可靠性验证准备。',
    severity: 'info',
    baseline: {
      mode: 'target_range',
      min: 0,
      max: 12,
      note: 'US-013 阶段先定义范围，US-022 再引入 save/load 一致性强校验。',
    },
  },
];

export function formatMetricDefinitionSummary(definition: SimulationMetricDefinition): string {
  const baselinePieces: string[] = [`mode=${definition.baseline.mode}`];
  if (typeof definition.baseline.min === 'number') {
    baselinePieces.push(`min=${definition.baseline.min}`);
  }
  if (typeof definition.baseline.max === 'number') {
    baselinePieces.push(`max=${definition.baseline.max}`);
  }

  return [
    `${definition.key} [${definition.severity}]`,
    `- ${definition.description}`,
    `- baseline: ${baselinePieces.join(', ')}`,
    `- note: ${definition.baseline.note}`,
  ].join('\n');
}
