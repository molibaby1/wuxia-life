import type { PeriodSummaryDisplay } from '../../types/activeActionTypes';
import { buildPracticePeriodGrowthLine } from '../../utils/practiceTrajectorySummary';
import { readPlayerNumeric } from '../../utils/playerStatAccess';
import type { PlayerLifeStates, PlayerState } from '../../types/eventTypes';

const PUBLIC_NUMERIC_STATS = [
  'martialPower',
  'chivalry',
  'constitution',
  'comprehension',
  'money',
  'reputation',
  'connections',
  'knowledge',
  'businessAcumen',
  'influence',
  'charisma',
] as const;

export function calculatePublicStatDeltas(
  beforePlayer: PlayerState,
  afterPlayer: PlayerState,
): Record<string, number> {
  const deltas: Record<string, number> = {};
  for (const stat of PUBLIC_NUMERIC_STATS) {
    const delta = readPlayerNumeric(afterPlayer, stat) - readPlayerNumeric(beforePlayer, stat);
    if (delta !== 0) {
      deltas[stat] = delta;
    }
  }
  return deltas;
}

const STAT_LABELS: Record<string, string> = {
  martialPower: '功力',
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
  const shapingLine = buildPracticePeriodGrowthLine(params.lifeStates);
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
