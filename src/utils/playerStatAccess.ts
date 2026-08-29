import type { PlayerState } from '../types/eventTypes';

/**
 * Current canonical numeric player stats for generic read/write.
 * Excludes retired exact balances (`money`, numeric `wealth`) and categorical
 * `wealthCapacity` (not a numeric mutation target).
 */
export const CANONICAL_PLAYER_NUMERIC_STATS = [
  'age',
  'children',
  'martialPower',
  'chivalry',
  'charisma',
  'constitution',
  'reputation',
  'knowledge',
  'connections',
  'businessAcumen',
  'influence',
  'martialHeritage',
  'scholarlyHeritage',
  'merchantNetwork',
  'monthProgress',
  'dayProgress',
] as const;

export type CanonicalPlayerNumericStat = (typeof CANONICAL_PLAYER_NUMERIC_STATS)[number];

const CANONICAL_PLAYER_NUMERIC_STAT_SET: ReadonlySet<string> = new Set(CANONICAL_PLAYER_NUMERIC_STATS);

export function isCanonicalPlayerNumericStat(key: string): key is CanonicalPlayerNumericStat {
  return CANONICAL_PLAYER_NUMERIC_STAT_SET.has(key);
}

export function readPlayerNumeric(player: PlayerState, key: string): number {
  if (!isCanonicalPlayerNumericStat(key)) {
    return 0;
  }
  const record = player as unknown as Record<string, number | undefined>;
  return Number(record[key] ?? 0);
}

export function writePlayerNumeric(player: PlayerState, key: string, value: number): void {
  if (!isCanonicalPlayerNumericStat(key)) {
    return;
  }
  const record = player as unknown as Record<string, number>;
  record[key] = value;
}
