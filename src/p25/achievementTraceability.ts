import type { CompositeDestinyOutcome, CompositeDestinyProgressReport } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import {
  evaluateAllCompositeDestinies,
  evaluateCompositeDestinyOutcome,
  evaluateMixedDestinies,
  evaluatePinnacleDestinies,
  formatCompositeDestinyReport,
} from '../p16/compositeDestiny';
import type { PlayerState } from '../types/eventTypes';

export interface AchievementTraceLink {
  choiceFlags: string[];
  midLifeConsequenceSurfaces: string[];
  /** P30: P27–P29 habit/semi-personality on-ramp events for sim trace observability. */
  habitLedOnRampEvents?: string[];
}

/** P25 Wave 1: inspectable links from composite outcomes to choice flags and mid-life events. */
export const P25_MAINSTREAM_ACHIEVEMENT_TRACEABILITY: Record<string, AchievementTraceLink> = {
  grandmaster_guardian: {
    choiceFlags: ['p16_guardian_oath'],
    midLifeConsequenceSurfaces: ['sect_midlife_ledger', 'orthodox_trial_completion'],
  },
  sect_leader_statesman: {
    choiceFlags: ['p16_alliance_brokered'],
    midLifeConsequenceSurfaces: ['p22_faction_sect_continuation', 'reputation_alliance_meeting'],
  },
  lone_sword_legend: {
    choiceFlags: ['p16_rare_master_encounter'],
    midLifeConsequenceSurfaces: ['hidden_master_line'],
  },
  jianghu_renown_sage: {
    choiceFlags: ['ally_network'],
    midLifeConsequenceSurfaces: ['jianghu_year_patrol'],
    habitLedOnRampEvents: [
      'p28_social_momentum_network_fork',
      'p28_social_reputation_reinforcement',
      'p29_social_momentum_patron_obligation',
    ],
  },
  medical_sage_healer: {
    choiceFlags: ['medical_divine_doctor_fame', 'medical_imperial', 'medical_plague_hero', 'medical_pure'],
    midLifeConsequenceSurfaces: ['medical_divine_doctor_fame', 'medical_imperial_doctor', 'medical_palace_intrigue'],
    habitLedOnRampEvents: [
      'p27_study_habit_healer_reinforcement',
      'p29_study_habit_case_record_duty',
      'p29_social_momentum_healer_network',
    ],
  },
};

/** P25 Wave 2: pinnacle dual-gate traceability links. */
export const P25_PINNACLE_ACHIEVEMENT_TRACEABILITY: Record<string, AchievementTraceLink> = {
  jianghu_myth_legend: {
    choiceFlags: ['p16_guardian_oath'],
    midLifeConsequenceSurfaces: ['orthodox_trial_completion', 'sect_midlife_ledger'],
  },
  founding_patriarch: {
    choiceFlags: ['p16_alliance_brokered'],
    midLifeConsequenceSurfaces: ['p22_faction_sect_continuation', 'scholar_mentor_line'],
  },
};

/** P25 Wave 3: mixed cross-track traceability links. */
export const P25_MIXED_ACHIEVEMENT_TRACEABILITY: Record<string, AchievementTraceLink> = {
  merchant_magnate: {
    choiceFlags: ['route_merchant', 'route_wealth_committed', 'p22_wealth_route_forked', 'merchant_empire', 'merchant_wealthy'],
    midLifeConsequenceSurfaces: ['p22_early_wealth_route_fork', 'merchant_empire', 'merchant_business_empire'],
  },
  healer_swordsman: {
    choiceFlags: ['medical_divine_doctor_fame', 'medical_imperial', 'p9_early_training_focus', 'orthodox_trial_completed'],
    midLifeConsequenceSurfaces: ['medical_divine_doctor_fame', 'orthodox_trial_completion'],
  },
  merchant_martial_patron: {
    choiceFlags: ['route_merchant', 'route_wealth_committed', 'p22_wealth_route_forked', 'merchant_invest_good', 'merchant_invest_both', 'merchant_invest_evil'],
    midLifeConsequenceSurfaces: ['p22_early_wealth_route_fork', 'merchant_sect_investment'],
  },
};

export function getMainstreamAchievementOutcomes(
  worldId = 'wuxia',
): CompositeDestinyOutcome[] {
  return getWorldProfile(worldId).compositeDestinyOutcomes ?? [];
}

export function getPinnacleAchievementOutcomes(worldId = 'wuxia'): CompositeDestinyOutcome[] {
  return getWorldProfile(worldId).pinnacleDestinyOutcomes ?? [];
}

export function getMixedAchievementOutcomes(worldId = 'wuxia'): CompositeDestinyOutcome[] {
  return getWorldProfile(worldId).mixedDestinyOutcomes ?? [];
}

export function evaluateMainstreamAchievementProgress(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): CompositeDestinyProgressReport[] {
  const outcomes = getMainstreamAchievementOutcomes(worldId);
  return outcomes.map(outcome => evaluateCompositeDestinyOutcome(outcome, player, flags));
}

export function evaluatePinnacleAchievementProgress(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): CompositeDestinyProgressReport[] {
  return evaluatePinnacleDestinies(player, flags, worldId);
}

export function evaluateMixedAchievementProgress(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): CompositeDestinyProgressReport[] {
  return evaluateMixedDestinies(player, flags, worldId);
}

export function formatMainstreamAchievementSimOutput(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): string[] {
  return evaluateMainstreamAchievementProgress(player, flags, worldId).map(formatCompositeDestinyReport);
}

export function formatPinnacleAchievementSimOutput(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): string[] {
  return evaluatePinnacleAchievementProgress(player, flags, worldId).map(formatCompositeDestinyReport);
}

export function formatMixedAchievementSimOutput(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): string[] {
  return evaluateMixedAchievementProgress(player, flags, worldId).map(formatCompositeDestinyReport);
}

export function formatAllAchievementSimOutput(
  player: PlayerState | undefined,
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): string[] {
  return evaluateAllCompositeDestinies(player, flags, worldId).map(formatCompositeDestinyReport);
}

export function assertMainstreamAchievementCount(minCount = 5, worldId = 'wuxia'): number {
  const count = getMainstreamAchievementOutcomes(worldId).length;
  if (count < minCount) {
    throw new Error(`Expected >= ${minCount} mainstream achievements, got ${count}`);
  }
  return count;
}

export function assertMixedAchievementCount(minCount = 3, worldId = 'wuxia'): number {
  const count = getMixedAchievementOutcomes(worldId).length;
  if (count < minCount) {
    throw new Error(`Expected >= ${minCount} mixed achievements, got ${count}`);
  }
  return count;
}
