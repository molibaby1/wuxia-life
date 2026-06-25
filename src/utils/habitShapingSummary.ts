import type { PlayerLifeStates } from '../types/eventTypes';

/** P41 player-facing habit / semi-personality axis labels (no raw keys in UI). */
export const SHAPING_AXES = [
  { key: 'trainingHabit' as const, label: '习武', shortLabel: '习武塑形' },
  { key: 'studyHabit' as const, label: '饱学', shortLabel: '饱学塑形' },
  { key: 'businessHabit' as const, label: '营生', shortLabel: '营生塑形' },
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
    }));
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
  const match = /^shaping_(trainingHabit|studyHabit|businessHabit|socialMomentum|familyBond)_up$/.exec(flag);
  return match ? (match[1] as ShapingAxisKey) : null;
}
