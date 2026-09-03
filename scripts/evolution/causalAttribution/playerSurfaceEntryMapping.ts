import type { HeadlessApiPlayerSurfaceStep, HeadlessApiPlayerSurfaceTrace } from '../../../src/headless/playability/playerSurfaceCapture';

export interface PlayerSurfaceEntryRange {
  entryIds: string[];
  step: HeadlessApiPlayerSurfaceStep;
}

export function playerSurfaceEntryRef(index: number): string {
  return `entry-${String(index).padStart(6, '0')}`;
}

/**
 * Preserve current player-projection emission counts:
 * - story_event → 1 + max(0, presentationCards.length - 1)
 * - other kinds → presentationCards.length
 */
export function emittedPlayerSurfaceEntryCount(step: HeadlessApiPlayerSurfaceStep): number {
  const cards = step.presentationCards ?? [];
  if (step.kind === 'story_event') {
    return 1 + Math.max(0, cards.length - 1);
  }
  return cards.length;
}

export function mapObservableEntriesToPlayerSurfaceSteps(
  source: HeadlessApiPlayerSurfaceTrace,
): Map<string, PlayerSurfaceEntryRange> {
  const map = new Map<string, PlayerSurfaceEntryRange>();
  let cursor = 0;
  for (const step of source.steps) {
    const count = emittedPlayerSurfaceEntryCount(step);
    if (count <= 0) continue;
    const entryIds: string[] = [];
    for (let offset = 0; offset < count; offset += 1) {
      entryIds.push(playerSurfaceEntryRef(cursor + offset + 1));
    }
    for (const entryId of entryIds) {
      map.set(entryId, { entryIds, step });
    }
    cursor += count;
  }
  return map;
}

export function mapPlayerSurfaceStepsToObservableEntries(
  source: HeadlessApiPlayerSurfaceTrace,
): Map<HeadlessApiPlayerSurfaceStep, string[]> {
  const map = new Map<HeadlessApiPlayerSurfaceStep, string[]>();
  let cursor = 0;
  for (const step of source.steps) {
    const count = emittedPlayerSurfaceEntryCount(step);
    const entryIds = Array.from({ length: count }, (_, offset) =>
      playerSurfaceEntryRef(cursor + offset + 1));
    map.set(step, entryIds);
    cursor += count;
  }
  return map;
}
