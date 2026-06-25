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
  trainingHabit: '名望与战意多由此立，旁人记得的是你的刀锋与担当',
  studyHabit: '文字与思辨成为你识世立身的主轴',
  businessHabit: '门路与买卖织成了你行走江湖的底气',
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

export type ShapingRouteFamily = 'martial_route' | 'livelihood_route';

const SHAPING_PATTERN_TONE: Record<
  ShapingRouteFamily,
  Partial<Record<ShapingAxisKey, string>>
> = {
  martial_route: {
    trainingHabit: '与同路侠客相比，你是苦修成锋、以武立名之人。',
    studyHabit: '与同路侠客相比，你以文佐武、守礼而不蛮干。',
  },
  livelihood_route: {
    businessHabit: '在同一条营生路上，你把算账与门路练成了绝活。',
    socialMomentum: '在同一条营生路上，你的人脉比货单更值钱。',
  },
};

export function detectShapingRouteFamily(
  flags: Record<string, unknown> | undefined,
): ShapingRouteFamily | null {
  const f = flags ?? {};
  if (f.route_orthodox || f.route_wanderer || f.route_demonic || f.sectMember) {
    return 'martial_route';
  }
  if (f.route_merchant || f.merchant_path || f.wealth_caravan_gate) {
    return 'livelihood_route';
  }
  return null;
}

/** Same-route-family ending tone keyed by dominant shaping axis. */
export function buildShapingPatternEndingTone(
  lifeStates: Partial<PlayerLifeStates> | undefined,
  flags: Record<string, unknown> | undefined,
): string {
  const family = detectShapingRouteFamily(flags);
  if (!family) return '';

  const dominant = deriveDominantShapingLines(lifeStates, 1)[0];
  if (!dominant) return '';

  return SHAPING_PATTERN_TONE[family][dominant.axisKey] ?? '';
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
