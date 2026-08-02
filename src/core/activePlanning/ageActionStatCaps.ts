import { EARLY_CHILDHOOD_MAX_AGE, INFANT_MAX_AGE } from '../../p16/childhoodAgency';

const INFANT_ALLOWED_STATS = new Set(['constitution', 'comprehension']);
const EARLY_FORBIDDEN_STATS = new Set(['chivalry', 'martialPower']);

export function clampActionDeltasForAge(
  age: number,
  deltas: Record<string, number>,
): Record<string, number> {
  if (age > EARLY_CHILDHOOD_MAX_AGE) {
    return deltas;
  }

  const result: Record<string, number> = {};

  if (age <= INFANT_MAX_AGE) {
    for (const [stat, value] of Object.entries(deltas)) {
      if (!INFANT_ALLOWED_STATS.has(stat) || value === 0) continue;
      const capped = Math.sign(value) * Math.min(Math.abs(value), 1);
      if (capped !== 0) result[stat] = capped;
    }
    return result;
  }

  for (const [stat, value] of Object.entries(deltas)) {
    if (EARLY_FORBIDDEN_STATS.has(stat)) continue;
    if (stat === 'money' && Math.abs(value) > 5) {
      result[stat] = Math.sign(value) * Math.min(Math.abs(value), 5);
      continue;
    }
    if (value !== 0) result[stat] = value;
  }
  return result;
}

export function clampPassiveStatDeltasForAge(
  age: number,
  deltas: Record<string, number> | undefined,
): Record<string, number> {
  if (!deltas) return {};
  return clampActionDeltasForAge(age, deltas);
}
