import type {
  LifeMemoryAchievementEntry,
  LifeMemoryMilestoneEntry,
  LifeMemorySummary,
} from '../types/lifeMemory';
import type { MilestoneKind, MilestoneTier } from '../types/milestone';
import type { ProgressionOverlayCard } from '../types/progressionOverlay';

export type AchievementFeedbackItem = {
  id: string;
  kind: 'achievement';
  label: string;
  description?: string;
  evidenceLabels: string[];
};

export type MilestoneFeedbackItem = {
  id: string;
  kind: 'milestone';
  milestoneKind: MilestoneKind;
  milestoneTier?: MilestoneTier;
  label: string;
  description?: string;
  evidenceLabels: string[];
};

export type LifeMemoryFeedbackItem = AchievementFeedbackItem | MilestoneFeedbackItem;

export type LifeMemoryFeedbackKind = LifeMemoryFeedbackItem['kind'];

function visibleAchievements(summary: LifeMemorySummary | null | undefined): LifeMemoryAchievementEntry[] {
  return (summary?.achievements ?? []).filter(entry => entry.visibility === 'player');
}

function visibleMilestones(summary: LifeMemorySummary | null | undefined): LifeMemoryMilestoneEntry[] {
  return (summary?.achievedMilestones ?? []).filter(entry => entry.visibility === 'player');
}

export function collectNewLifeMemoryFeedback(
  previous: LifeMemorySummary | null | undefined,
  current: LifeMemorySummary | null | undefined,
): LifeMemoryFeedbackItem[] {
  const previousAchievementIds = new Set(visibleAchievements(previous).map(entry => entry.id));
  const previousMilestoneIds = new Set(visibleMilestones(previous).map(entry => entry.id));

  const newAchievements: AchievementFeedbackItem[] = visibleAchievements(current)
    .filter(entry => !previousAchievementIds.has(entry.id))
    .map(entry => ({
      id: entry.id,
      kind: 'achievement' as const,
      label: entry.label,
      evidenceLabels: [],
    }));

  const newMilestones: MilestoneFeedbackItem[] = visibleMilestones(current)
    .filter(entry => !previousMilestoneIds.has(entry.id))
    .map(entry => ({
      id: entry.id,
      kind: 'milestone' as const,
      milestoneKind: entry.kind,
      ...(entry.tier === undefined ? {} : { milestoneTier: entry.tier }),
      label: entry.label,
      description: entry.description,
      evidenceLabels: [...entry.evidenceLabels],
    }));

  return [...newAchievements, ...newMilestones];
}

export function buildLifeMemoryFeedbackOverlayCard(
  items: LifeMemoryFeedbackItem[],
): ProgressionOverlayCard | null {
  if (items.length === 0) return null;

  const hasAchievement = items.some(item => item.kind === 'achievement');
  const hasMilestone = items.some(item => item.kind === 'milestone');
  const title = hasAchievement && hasMilestone
    ? '新的成就与里程碑'
    : hasAchievement
      ? '新的成就'
      : '新的里程碑';
  const body = items
    .map(item => item.description ? `${item.label}：${item.description}` : item.label)
    .join('；');
  const metaLines = items.flatMap(item => item.evidenceLabels.map(label => `依据：${label}`));

  return {
    id: `life-memory-${items.map(item => item.id).join('-')}`,
    sourceLabel: '新的成长',
    title,
    body,
    metaLines,
  };
}
