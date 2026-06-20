/**
 * Preschool passive/spine loader (ages 3–7).
 * Schema: { id, title, text, originTags[], ageMin, ageMax, statDeltas?, flags? }
 */
import preschoolPassiveSpineJson from './lines/preschool-passive-spine.json';
import {
  infantPassiveNarrativeCatalog,
  type PassiveNarrativeEntry,
} from './infantPassiveNarratives';
import type { GameState } from '../types/eventTypes';
import { getOriginChildhoodEventMultiplier } from '../p16/originSurfaces';
import { ORIGIN_FLAG_TO_PASSIVE_TAG } from './originInfantPassiveChain';

export type PreschoolPassiveEntry = PassiveNarrativeEntry;

const preschoolConfigEntries = (preschoolPassiveSpineJson as { entries: PreschoolPassiveEntry[] }).entries;

/** Merged catalog: legacy infantPassiveNarrativeCatalog (3–7) + preschool-passive-spine.json */
export const preschoolPassiveSpineCatalog: PreschoolPassiveEntry[] = [
  ...infantPassiveNarrativeCatalog.filter(e => e.ageMin >= 3 && e.ageMax <= 7),
  ...preschoolConfigEntries,
];

function resolveOriginTags(state: GameState): Set<string> {
  const tags = new Set<string>(['neutral']);
  const flags = state.flags ?? {};
  const playerFlags = state.player?.flags ?? {};
  for (const [flag, tag] of Object.entries(ORIGIN_FLAG_TO_PASSIVE_TAG)) {
    if (flags[flag] || playerFlags[flag]) {
      tags.add(tag);
    }
  }
  const traitOrigin = state.player?.traitProfile?.origin;
  if (traitOrigin === 'scholar_house') tags.add('scholar');
  if (traitOrigin === 'merchant_house') tags.add('merchant');
  if (traitOrigin === 'frontier_military') tags.add('frontier');
  if (traitOrigin === 'streetborn' || traitOrigin === 'poor_family') tags.add('neutral');
  if (traitOrigin && traitOrigin.includes('martial')) tags.add('martial');
  return tags;
}

function scoreEntry(entry: PreschoolPassiveEntry, originTags: Set<string>, state: GameState): number {
  let score = 1;
  for (const tag of entry.originTags) {
    if (tag === 'neutral') continue;
    if (originTags.has(tag)) score += 2.5;
  }
  if (entry.originTags.includes('neutral') && score === 1) score += 0.5;
  const biasTags = new Set(entry.originTags.filter(t => t !== 'neutral'));
  score *= getOriginChildhoodEventMultiplier(state.player, biasTags);
  return score;
}

export function getPreschoolPassiveEntries(
  age: number,
  originFlags?: Record<string, unknown>,
): PreschoolPassiveEntry[] {
  void originFlags;
  return preschoolPassiveSpineCatalog.filter(
    entry => age >= entry.ageMin && age <= entry.ageMax,
  );
}

export function selectPreschoolPassiveEntry(
  state: GameState,
  random: () => number = Math.random,
): PreschoolPassiveEntry {
  const age = state.player?.age ?? 0;
  const originTags = resolveOriginTags(state);
  const history = new Set((state.eventHistory ?? []).map(record => record.eventId));
  const candidates = getPreschoolPassiveEntries(age).filter(entry => !history.has(entry.id));
  const pool =
    candidates.length > 0
      ? candidates
      : getPreschoolPassiveEntries(age);
  const weighted = pool.map(entry => ({
    entry,
    weight: scoreEntry(entry, originTags, state),
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0 || pool.length === 0) {
    return {
      id: 'preschool_passive_gap',
      title: '家中一季',
      text: '这一季你在庭院与亲人身边度过，听故事、学走路，日子平淡而安稳。',
      originTags: ['neutral'],
      ageMin: 3,
      ageMax: 7,
    };
  }
  let roll = random() * total;
  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.entry;
  }
  return weighted[weighted.length - 1].entry;
}
