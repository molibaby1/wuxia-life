import type { PlayerState } from '../types/eventTypes';

export function readPlayerNumeric(player: PlayerState, key: string): number {
  const record = player as unknown as Record<string, number | undefined>;
  return Number(record[key] ?? 0);
}

export function writePlayerNumeric(player: PlayerState, key: string, value: number): void {
  const record = player as unknown as Record<string, number>;
  record[key] = value;
}
