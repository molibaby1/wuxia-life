export {
  flagIsActive,
  inferMaintenanceDimensionLevel,
  lifePathSignalActive,
  readMergedFlags,
} from '../p17/stateAccess';

import type { GameState } from '../types/eventTypes';
import { flagIsActive, lifePathSignalActive, readMergedFlags } from '../p17/stateAccess';
import { computeSuccessionQualityScore } from '../p18/legacyOutcomes';
import { collectUnmetMaintenancePressure } from '../p17/achievementMaintenance';
import { deriveDominantShapingLines } from '../utils/habitShapingSummary';

export function inferRelationshipScore(state: GameState): number {
  const player = state.player;
  if (!player) return 0;
  const flags = readMergedFlags(state);
  let score = 0;
  score += Math.min(1, (player.connections ?? 0) / 80) * 0.25;
  score += player.spouse ? 0.15 : 0;
  score += Math.min(1, (player.children ?? 0) / 3) * 0.15;
  const allies = state.lifePath?.relationships?.allies?.length ?? 0;
  const disciples = state.lifePath?.relationships?.disciples?.length ?? 0;
  score += Math.min(1, allies / 5) * 0.15;
  score += Math.min(1, disciples / 5) * 0.15;
  if (flagIsActive(flags, 'feud_reconciled') || flagIsActive(flags, 'ally_reunion')) {
    score += 0.15;
  }
  const enemies = state.lifePath?.relationships?.enemies?.length ?? 0;
  const sworn = state.lifePath?.commitments?.swornEnemies?.length ?? 0;
  score -= Math.min(0.3, (enemies + sworn) * 0.05);
  return Math.max(-1, Math.min(1, score));
}

export function inferFactionScore(state: GameState): number {
  const flags = readMergedFlags(state);
  let score = 0;
  if (flagIsActive(flags, 'sectLeader') || flagIsActive(flags, 'sect_elder_honored')) score += 0.35;
  if (flagIsActive(flags, 'sect_protection')) score += 0.25;
  if (playerSect(state)) score += 0.15;
  if (flagIsActive(flags, 'sect_exposure') || flagIsActive(flags, 'sect_betrayal')) score -= 0.4;
  if (flagIsActive(flags, 'political_fallout')) score -= 0.25;
  return Math.max(-1, Math.min(1, score));
}

function playerSect(state: GameState): boolean {
  const flags = readMergedFlags(state);
  return Boolean(
    state.player?.sect ||
      flagIsActive(flags, 'sectMember') ||
      flagIsActive(flags, 'shaolinDisciple') ||
      flagIsActive(flags, 'wudangDisciple'),
  );
}

export function inferLegacyScore(state: GameState, worldId = 'wuxia'): number {
  return computeSuccessionQualityScore(state, worldId);
}

export function inferAchievementScore(state: GameState): number {
  const player = state.player;
  if (!player) return 0;
  const flags = readMergedFlags(state);
  let score = 0;
  score += Math.min(1, (player.reputation ?? 0) / 100) * 0.3;
  score += Math.min(1, (player.martialPower ?? 0) / 100) * 0.25;
  score += Math.min(1, (player.chivalry ?? 0) / 100) * 0.2;
  if (flagIsActive(flags, 'hero_rep_mantle')) score += 0.15;
  const unmet = collectUnmetMaintenancePressure(state);
  if (unmet.length > 0) {
    score -= Math.min(0.3, unmet.reduce((s, u) => s + u.pressure, 0) / unmet.length);
  }
  return Math.max(-1, Math.min(1, score));
}

export function inferBurdenScore(state: GameState): number {
  const flags = readMergedFlags(state);
  let score = 0;
  const sworn = state.lifePath?.commitments?.swornEnemies?.length ?? 0;
  score += Math.min(0.4, sworn * 0.1);
  if (flagIsActive(flags, 'blood_feud_active') || flagIsActive(flags, 'unresolved_feud')) score += 0.25;
  if (flagIsActive(flags, 'inherited_burden_active')) score += 0.2;
  if (flagIsActive(flags, 'demonic_reputation')) score += 0.2;
  const evil = state.karma?.evil_karma ?? 0;
  score += Math.min(0.3, evil / 200);
  return Math.max(-1, Math.min(1, score));
}

export function inferLivedSelfUnderstanding(state: GameState): string {
  const player = state.player;
  if (!player) return '一生经历难以概括。';

  const dominant = deriveDominantShapingLines(player.lifeStates, 1)[0];
  if (dominant?.axisKey === 'trainingHabit') {
    return '你自觉一生苦修不辍，以武立身。';
  }
  if (dominant?.axisKey === 'studyHabit') {
    return '你自觉以书卷与思辨识世，文气入骨。';
  }
  if (dominant?.axisKey === 'businessHabit') {
    return '你自觉把营生与门路练成了行走江湖的底气。';
  }
  if (dominant?.axisKey === 'socialMomentum') {
    return '你自觉人情往来织就了你的江湖版图。';
  }
  if (dominant?.axisKey === 'familyBond') {
    return '你自觉亲族牵绊锚定了许多归宿与抉择。';
  }

  const chivalry = player.chivalry ?? 0;
  const reputation = player.reputation ?? 0;
  if (chivalry >= 60 && reputation >= 70) {
    return '你自觉行侠仗义，问心无愧。';
  }
  if (chivalry <= -20 || (state.karma?.evil_karma ?? 0) > 80) {
    return '你清楚自己走过不少险路，并不指望人人理解。';
  }
  if ((player.connections ?? 0) < 20 && !player.spouse) {
    return '你更记得独行的日子，而非江湖对你的评价。';
  }
  return '你以日常选择与身边人关系来理解自己的一生。';
}

export function patternTriggersActive(
  state: GameState,
  triggerFlags?: string[],
  lifePathSignals?: string[],
  requireAllFlags = false,
): boolean {
  if (!triggerFlags?.length && !lifePathSignals?.length) {
    return false;
  }
  const flags = readMergedFlags(state);
  const flagMatch = requireAllFlags
    ? (triggerFlags?.every(f => flagIsActive(flags, f)) ?? false)
    : (triggerFlags?.some(f => flagIsActive(flags, f)) ?? false);
  const pathMatch = lifePathSignals?.some(s => lifePathSignalActive(state, s)) ?? false;
  if (triggerFlags?.length && lifePathSignals?.length) {
    return flagMatch || pathMatch;
  }
  return flagMatch || pathMatch;
}
