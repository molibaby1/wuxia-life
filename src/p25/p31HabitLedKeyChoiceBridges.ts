import type { PlayerState } from '../types/eventTypes';

/** P31: resolve achievement key_choice flags from habit-led bridge flags (mirrors P27–P29 event wiring). */
export function resolveP31HabitLedKeyChoiceBridges(
  player: Partial<PlayerState> | undefined,
  flags: Record<string, unknown>,
): Record<string, unknown> {
  const resolved = { ...flags };
  const lifeStates = player?.lifeStates ?? {};
  const socialMomentum = lifeStates.socialMomentum ?? 0;
  const studyHabit = lifeStates.studyHabit ?? 0;

  if (
    socialMomentum >= 2 &&
    resolved.p28_social_reputation_reinforced === true &&
    resolved.medical_poison_path !== true
  ) {
    resolved.ally_network = true;
  }

  if (
    studyHabit >= 2 &&
    resolved.p27_study_healer_path === true &&
    resolved.medical_poison_path !== true
  ) {
    resolved.medical_pure = true;
  }

  if (
    studyHabit >= 3 &&
    resolved.p27_study_healer_path === true &&
    resolved.p29_study_healer_case_duty === true &&
    resolved.medical_poison_path !== true
  ) {
    resolved.medical_divine_doctor_fame = true;
  }

  return resolved;
}
