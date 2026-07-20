import type { PeriodSummaryDisplay } from '../../types/activeActionTypes';
import { buildShapingPeriodGrowthLine } from '../../utils/habitShapingSummary';
import type { PlayerLifeStates } from '../../types/eventTypes';

const STAT_LABELS: Record<string, string> = {
  martialPower: '功力',
  externalSkill: '外功',
  internalSkill: '内功',
  qinggong: '轻功',
  chivalry: '侠义',
  charisma: '魅力',
  constitution: '体魄',
  comprehension: '悟性',
  reputation: '名望',
  influence: '影响力',
  connections: '人脉',
  knowledge: '学识',
  businessAcumen: '经营',
  money: '银两',
  health: '健康',
  energy: '精力',
};

export function formatStatDeltaSummary(deltas: Record<string, number>): string {
  const parts = Object.entries(deltas)
    .filter(([, value]) => value !== 0)
    .map(([stat, value]) => {
      const label = STAT_LABELS[stat] ?? stat;
      return value > 0 ? `${label}+${value}` : `${label}${value}`;
    });
  return parts.length > 0 ? parts.join('，') : '本期未见明显数值变化';
}

export function buildPeriodSummary(params: {
  sourceLabel: string;
  headline: string;
  body: string;
  deltas?: Record<string, number>;
  deltaCause?: string;
  lifeStates?: Partial<PlayerLifeStates>;
}): PeriodSummaryDisplay {
  const deltas = params.deltas ?? {};
  const statDeltaSummary = formatStatDeltaSummary(deltas);
  const hasDelta = statDeltaSummary !== '本期未见明显数值变化';
  const cause = params.deltaCause ?? params.headline;
  const shapingLine = buildShapingPeriodGrowthLine(params.lifeStates);
  const body = shapingLine ? `${params.body}\n\n${shapingLine}` : params.body;
  const narrativeText = hasDelta
    ? `${body}（因「${cause}」，${statDeltaSummary}）`
    : body;
  return {
    sourceLabel: params.sourceLabel,
    headline: params.headline,
    body,
    statDeltaSummary: hasDelta ? `因「${cause}」：${statDeltaSummary}` : statDeltaSummary,
    narrativeText,
  };
}
