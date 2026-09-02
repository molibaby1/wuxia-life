import type {
  LifeMemoryAchievementEntry,
  LifeMemoryMilestoneEntry,
  LifeMemorySummary,
} from '../types/lifeMemory';
import type { MilestoneKind, MilestoneTier } from '../types/milestone';
import type { ProgressionOverlayCard } from '../types/progressionOverlay';
import {
  formatAchievedProgressLabel,
  milestoneKindSurfaceLabel,
} from './milestonePresentation';

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

function buildAchievementOverlayCard(items: AchievementFeedbackItem[]): ProgressionOverlayCard {
  return {
    id: `life-memory-${items.map(item => item.id).join('-')}`,
    sourceLabel: '新的成长',
    title: '新的成就',
    body: items.map(item => item.label).join('；'),
  };
}

function buildMilestoneOverlayCard(item: MilestoneFeedbackItem): ProgressionOverlayCard {
  const evidenceMeta = item.evidenceLabels.map(label => `依据：${label}`);
  const sourceLabel = milestoneKindSurfaceLabel(item.milestoneKind, item.milestoneTier);
  const title = item.milestoneKind === 'progress_stage' && item.milestoneTier !== undefined
    ? formatAchievedProgressLabel(item.label, item.milestoneTier)
    : item.label;

  return {
    id: `life-memory-${item.id}`,
    sourceLabel,
    title,
    body: item.description,
    metaLines: evidenceMeta,
  };
}

/** One semantic card per acquired Milestone; Achievements stay a single non-modal card. */
export function buildLifeMemoryFeedbackOverlayCards(
  items: LifeMemoryFeedbackItem[],
): ProgressionOverlayCard[] {
  const achievements = items.filter((item): item is AchievementFeedbackItem => item.kind === 'achievement');
  const milestones = items.filter((item): item is MilestoneFeedbackItem => item.kind === 'milestone');
  const cards: ProgressionOverlayCard[] = [];

  if (achievements.length > 0) {
    cards.push(buildAchievementOverlayCard(achievements));
  }
  for (const milestone of milestones) {
    cards.push(buildMilestoneOverlayCard(milestone));
  }
  return cards;
}
