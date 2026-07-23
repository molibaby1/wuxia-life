import type { GameState } from '../types/eventTypes';
import type { PassiveNarrativeEntry } from './passiveNarrativeTypes';
import { infantPassiveNarrativeCatalog } from './infantPassiveNarrativeCatalog';
import {
  ORIGIN_FLAG_TO_PASSIVE_TAG,
  selectOrderedOriginInfantPassive,
} from './originInfantPassiveChain';
import { resolvePassiveGapPlaceholderText, resolvePlanningPlaceholderText } from './passivePlanningPlaceholder';
import { selectPreschoolPassiveEntry } from './preschoolPassiveSpine';

export type { PassiveNarrativeEntry } from './passiveNarrativeTypes';
export { infantPassiveNarrativeCatalog } from './infantPassiveNarrativeCatalog';
export { resolvePlanningPlaceholderText } from './passivePlanningPlaceholder';

const ORIGIN_FLAG_TO_TAG = ORIGIN_FLAG_TO_PASSIVE_TAG;

function resolvePlayerOriginTags(state: GameState): Set<string> {
  const tags = new Set<string>(['neutral']);
  const flags = state.flags ?? {};
  const playerFlags = state.player?.flags ?? {};
  for (const [flag, tag] of Object.entries(ORIGIN_FLAG_TO_TAG)) {
    if (flags[flag] || playerFlags[flag]) {
      tags.add(tag);
    }
  }
  return tags;
}

function scoreNarrative(entry: PassiveNarrativeEntry, originTags: Set<string>): number {
  let score = 1;
  for (const tag of entry.originTags) {
    if (tag === 'neutral') continue;
    if (originTags.has(tag)) score += 2.5;
  }
  if (entry.originTags.includes('neutral') && score === 1) score += 0.5;
  return score;
}

function buildInfantPassiveGapEntry(age: number): PassiveNarrativeEntry {
  const placeholder = resolvePassiveGapPlaceholderText(age);
  return {
    id: 'infant_passive_gap',
    title: placeholder.title,
    text: placeholder.text,
    originTags: ['neutral'],
    ageMin: 0,
    ageMax: 2,
  };
}

function selectLegacyPassiveNarrative(
  state: GameState,
  random: () => number = Math.random,
): PassiveNarrativeEntry {
  const age = state.player?.age ?? 0;
  const originTags = resolvePlayerOriginTags(state);
  const history = new Set((state.eventHistory ?? []).map(record => record.eventId));
  const candidates = infantPassiveNarrativeCatalog.filter(
    entry => age >= entry.ageMin && age <= entry.ageMax && !history.has(entry.id),
  );
  const pool =
    candidates.length > 0
      ? candidates
      : infantPassiveNarrativeCatalog.filter(entry => age >= entry.ageMin && age <= entry.ageMax);
  const weighted = pool.map(entry => ({
    entry,
    weight: scoreNarrative(entry, originTags),
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) {
    return pool[0] ?? infantPassiveNarrativeCatalog[0];
  }
  const ordered = [...weighted].sort((a, b) => b.weight - a.weight);
  const roll = random() * total;
  let cursor = 0;
  for (const item of ordered) {
    cursor += item.weight;
    if (roll < cursor) {
      return item.entry;
    }
  }
  return ordered[ordered.length - 1]?.entry ?? pool[0] ?? infantPassiveNarrativeCatalog[0];
}

export function selectPassiveNarrative(
  state: GameState,
  random: () => number = Math.random,
): PassiveNarrativeEntry {
  const age = state.player?.age ?? 0;
  if (age <= 2) {
    const ordered = selectOrderedOriginInfantPassive(state, random);
    if (ordered) {
      return ordered;
    }
    return buildInfantPassiveGapEntry(age);
  }
  if (age <= 12) {
    return selectPreschoolPassiveEntry(state, random);
  }
  return selectLegacyPassiveNarrative(state, random);
}

export function shouldRecordPassiveNarrativeInHistory(entryId: string): boolean {
  return entryId !== 'infant_passive_gap';
}
