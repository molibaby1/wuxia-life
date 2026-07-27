import type { PlayerLifeStates } from '../types/eventTypes';

export const PRACTICE_TRAJECTORIES = [
  { key: 'trainingHabit' as const, label: '练功实践' },
  { key: 'studyHabit' as const, label: '读书实践' },
  { key: 'businessHabit' as const, label: '营生实践' },
];

export type PracticeTrajectoryKey = (typeof PRACTICE_TRAJECTORIES)[number]['key'];

const PRACTICE_TIER_LABELS: Record<number, string> = {
  1: '有过实质实践',
  2: '开始重复',
  3: '较为稳定',
  4: '长期深入',
  5: '贯穿多个阶段',
};

export interface PracticeTrajectoryLine {
  key: PracticeTrajectoryKey;
  label: string;
  tierLabel: string;
  value: number;
  sortKey: number;
}

export function practiceTierLabel(value: number): string {
  return PRACTICE_TIER_LABELS[value] ?? '尚无长期积累';
}

export function derivePracticeTrajectoryLines(lifeStates: Partial<PlayerLifeStates> | undefined, limit = 3): PracticeTrajectoryLine[] {
  return PRACTICE_TRAJECTORIES
    .map(item => ({ ...item, value: lifeStates?.[item.key] ?? 0 }))
    .filter(item => item.value >= 1)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, 'zh-CN'))
    .slice(0, limit)
    .map(item => ({ ...item, tierLabel: practiceTierLabel(item.value), sortKey: item.value }));
}

export function collectPracticeImpactLines(before: Partial<PlayerLifeStates> | undefined, after: Partial<PlayerLifeStates> | undefined): string[] {
  return PRACTICE_TRAJECTORIES
    .filter(item => (after?.[item.key] ?? 0) - (before?.[item.key] ?? 0) >= 1)
    .map(item => `${item.label}有所积累`);
}

export function buildPracticePeriodGrowthLine(lifeStates: Partial<PlayerLifeStates> | undefined): string | null {
  const lines = derivePracticeTrajectoryLines(lifeStates, 2);
  return lines.length === 0 ? null : `这一阶段持续积累的实践是：${lines.map(line => `${line.label} · ${line.tierLabel}`).join(' / ')}。`;
}

export function buildLateLifePracticeRecapLine(lifeStates: Partial<PlayerLifeStates> | undefined): string {
  const lines = derivePracticeTrajectoryLines(lifeStates, 2);
  return lines.length === 0
    ? '回顾一生，练功、读书与营生都未形成持续的长期实践。'
    : `回顾一生，${lines.map(line => `${line.label}${line.tierLabel}`).join('，')}。`;
}
