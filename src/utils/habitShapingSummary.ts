import type { PlayerLifeStates } from '../types/eventTypes';

/** P41 player-facing habit / semi-personality axis labels (no raw keys in UI). */
export const SHAPING_AXES = [
  { key: 'socialMomentum' as const, label: '人情', shortLabel: '人情往来' },
  { key: 'familyBond' as const, label: '亲族', shortLabel: '亲族牵绊' },
];

const TIER_LABELS: Record<number, string> = {
  1: '初现',
  2: '渐成',
  3: '成形',
  4: '定势',
  5: '入骨',
};

export type ShapingAxisKey = (typeof SHAPING_AXES)[number]['key'];

export function shapingTierLabel(value: number): string {
  return TIER_LABELS[value] ?? '渐成';
}

export function readShapingAxisValue(
  lifeStates: Partial<PlayerLifeStates> | undefined,
  key: ShapingAxisKey,
): number {
  return lifeStates?.[key] ?? 0;
}

/** Main-screen one-liner: top 1–2 axes at threshold ≥2, else degrade copy. */
export function buildCurrentShapingSummary(
  lifeStates: Partial<PlayerLifeStates> | undefined,
): string {
  const ranked = SHAPING_AXES.map((axis) => ({
    ...axis,
    value: readShapingAxisValue(lifeStates, axis.key),
  }))
    .filter((axis) => axis.value >= 2)
    .sort((a, b) => b.value - a.value);

  if (ranked.length === 0) {
    return '塑形未成';
  }

  return ranked
    .slice(0, 2)
    .map((axis) => `${axis.label} · ${shapingTierLabel(axis.value)}`)
    .join(' / ');
}

export interface DominantShapingLine {
  label: string;
  tierLabel: string;
  sortKey: number;
  axisKey: ShapingAxisKey;
}

/** Life-memory recap: up to `limit` dominant shaping directions. */
export function deriveDominantShapingLines(
  lifeStates: Partial<PlayerLifeStates> | undefined,
  limit = 3,
): DominantShapingLine[] {
  return SHAPING_AXES.map((axis) => ({
    axis,
    value: readShapingAxisValue(lifeStates, axis.key),
  }))
    .filter((entry) => entry.value >= 2)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((entry) => ({
      label: entry.axis.shortLabel,
      tierLabel: shapingTierLabel(entry.value),
      sortKey: entry.value,
      axisKey: entry.axis.key,
    }));
}

const SHAPING_IDENTITY_CONSEQUENCE: Record<ShapingAxisKey, string> = {
  socialMomentum: '人情往来替你铺开了许多单靠武力打不开的门',
  familyBond: '亲族牵绊锚定了你许多重大抉择与归宿',
};

/** Late-life / ending recap: dominant shaping in player-facing narrative. */
export function buildLateLifeShapingRecapLine(
  lifeStates: Partial<PlayerLifeStates> | undefined,
): string {
  const dominant = deriveDominantShapingLines(lifeStates, 2);
  if (dominant.length === 0) {
    return '长期塑形尚未凝成清晰主轴，这一生更多被际遇推着走。';
  }

  const axisSummary = dominant
    .map((line) => `${line.label} · ${line.tierLabel}`)
    .join('、');
  const consequence = SHAPING_IDENTITY_CONSEQUENCE[dominant[0].axisKey];
  return `回首这一生，${axisSummary}最为醒目；${consequence}。`;
}

/** Post-choice hints when an axis materially increases (delta ≥ 1). */
export function buildShapingFeedbackHints(
  before: Partial<PlayerLifeStates> | undefined,
  after: Partial<PlayerLifeStates> | undefined,
): string[] {
  const hints: string[] = [];
  for (const axis of SHAPING_AXES) {
    const delta = readShapingAxisValue(after, axis.key) - readShapingAxisValue(before, axis.key);
    if (delta >= 1) {
      hints.push(`${axis.shortLabel}加深`);
    }
  }
  return hints;
}

/** Synthetic long-term flag keys for choice feedback (mapped in playerFacingLabels). */
export function shapingFeedbackFlagKey(axisKey: ShapingAxisKey): string {
  return `shaping_${axisKey}_up`;
}

export function shapingAxisKeyFromFeedbackFlag(flag: string): ShapingAxisKey | null {
  const match = /^shaping_(socialMomentum|familyBond)_up$/.exec(flag);
  return match ? (match[1] as ShapingAxisKey) : null;
}

/** Period settlement: summarize shaping growth when habit threshold is met (P122 Signal B). */
export function buildShapingPeriodGrowthLine(
  lifeStates: Partial<PlayerLifeStates> | undefined,
): string | null {
  const summary = buildCurrentShapingSummary(lifeStates);
  if (summary === '塑形未成') {
    return null;
  }
  return `回看这一期，你的成长主轴是：${summary}。这是你反复做事积累出来的，不是年岁自然带来的。`;
}

export function collectShapingLongTermImpactLines(
  before: Partial<PlayerLifeStates> | undefined,
  after: Partial<PlayerLifeStates> | undefined,
): string[] {
  const lines: string[] = [];
  for (const axis of SHAPING_AXES) {
    const delta = readShapingAxisValue(after, axis.key) - readShapingAxisValue(before, axis.key);
    if (delta >= 1) {
      lines.push(`${axis.shortLabel}加深`);
    }
  }
  return lines;
}
