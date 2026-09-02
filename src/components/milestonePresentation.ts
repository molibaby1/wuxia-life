import type { MilestoneKind, MilestoneTier } from '../types/milestone';

const PROGRESS_TIER_DEPTH: Record<MilestoneTier, string> = {
  1: '起步',
  2: '成形',
  3: '深化',
};

export function progressStageDepthLabel(tier: MilestoneTier): string {
  return PROGRESS_TIER_DEPTH[tier];
}

export function progressStageStars(tier: MilestoneTier): string {
  return '★'.repeat(tier);
}

/** Achieved progress_stage only — never for prospects or non-progress kinds. */
export function formatAchievedProgressLabel(label: string, tier: MilestoneTier): string {
  return `${progressStageStars(tier)} ${label}`;
}

export function milestoneKindSurfaceLabel(
  kind: MilestoneKind,
  tier?: MilestoneTier,
): string {
  switch (kind) {
    case 'progress_stage':
      return tier === undefined
        ? '里程碑'
        : `里程碑 · ${progressStageDepthLabel(tier)}`;
    case 'turning_point':
      return '人生转折';
    case 'payoff_echo':
      return '往事回响';
    case 'synthesis':
      return '人生印记';
  }
}

/** Compact MainScreen label: name first, then this Milestone's depth. */
export function formatAchievedMilestoneCompactLabel(entry: {
  kind: MilestoneKind;
  tier?: MilestoneTier;
  label: string;
}): string {
  if (entry.kind === 'progress_stage' && entry.tier !== undefined) {
    return `${entry.label} · ${progressStageStars(entry.tier)}`;
  }
  return entry.label;
}

/** Life Memory history headline for an already-achieved milestone. */
export function formatAchievedMilestoneHistoryTitle(entry: {
  kind: MilestoneKind;
  tier?: MilestoneTier;
  label: string;
}): string {
  if (entry.kind === 'progress_stage' && entry.tier !== undefined) {
    return formatAchievedProgressLabel(entry.label, entry.tier);
  }
  return `${milestoneKindSurfaceLabel(entry.kind)} · ${entry.label}`;
}
