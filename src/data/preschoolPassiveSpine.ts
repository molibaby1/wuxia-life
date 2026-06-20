/**
 * Preschool passive/spine loader (ages 3–7).
 * Schema: { id, title, text, originTags[], ageMin, ageMax, statDeltas?, flags? }
 */
import preschoolPassiveSpineJson from './lines/preschool-passive-spine.json';
import type { PassiveNarrativeEntry } from './passiveNarrativeTypes';
import { infantPassiveNarrativeCatalog } from './infantPassiveNarrativeCatalog';
import { resolvePlanningPlaceholderText } from './passivePlanningPlaceholder';
import type { GameState } from '../types/eventTypes';
import { getOriginChildhoodEventMultiplier } from '../p16/originSurfaces';
import { getOriginInfantPassiveChains, ORIGIN_FLAG_TO_PASSIVE_TAG } from './originInfantPassiveChain';

export type PreschoolPassiveEntry = PassiveNarrativeEntry;

export const PRESCHOOL_EXCLUSIVE_ORIGIN_TAGS = ['scholar', 'martial', 'merchant', 'frontier'] as const;
export type PreschoolExclusiveOriginTag = (typeof PRESCHOOL_EXCLUSIVE_ORIGIN_TAGS)[number];

const preschoolConfigEntries = (preschoolPassiveSpineJson as { entries: PreschoolPassiveEntry[] }).entries;

function mergedPreschoolCatalog(): PreschoolPassiveEntry[] {
  return [
    ...infantPassiveNarrativeCatalog.filter(e => e.ageMin >= 3 && e.ageMax <= 7),
    ...preschoolConfigEntries,
  ];
}

function hasOriginFlag(state: GameState, flag: string): boolean {
  return !!(state.flags?.[flag] || state.player?.flags?.[flag]);
}

/** Single primary origin tag — same flag priority as 0–2 ordered infant chain. */
function resolveOriginTags(state: GameState): Set<string> {
  const tags = new Set<string>(['neutral']);
  for (const chain of getOriginInfantPassiveChains()) {
    if (hasOriginFlag(state, chain.originFlag)) {
      const tag = ORIGIN_FLAG_TO_PASSIVE_TAG[chain.originFlag];
      if (tag) tags.add(tag);
      return tags;
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

export function isNeutralOnlyPreschoolEntry(entry: PreschoolPassiveEntry): boolean {
  return entry.originTags.length === 1 && entry.originTags[0] === 'neutral';
}

function exclusiveOriginTags(entry: PreschoolPassiveEntry): string[] {
  return entry.originTags.filter(tag => tag !== 'neutral');
}

/** Stage-5 / US-004: reject empty or multi-exclusive originTags in catalog rows. */
export function validatePreschoolPassiveOriginTags(entry: PreschoolPassiveEntry): string | undefined {
  if (!entry.originTags?.length) {
    return `${entry.id}: originTags must be non-empty`;
  }
  const exclusive = exclusiveOriginTags(entry);
  if (exclusive.length > 1) {
    return `${entry.id}: multiple exclusive origin tags (${exclusive.join(', ')})`;
  }
  return undefined;
}

/** Stage-5: entry may enter 3–7 passive pool for this player origin. */
export function isPreschoolPassiveEligible(
  entry: PreschoolPassiveEntry,
  playerOriginTags: Set<string>,
): boolean {
  const tags = entry.originTags;
  if (tags.length === 0) return false;
  if (isNeutralOnlyPreschoolEntry(entry)) return true;
  const exclusive = exclusiveOriginTags(entry);
  if (exclusive.length > 1) return false;
  return exclusive.some(tag => playerOriginTags.has(tag));
}

export function isForeignExclusivePreschoolEntry(
  entry: PreschoolPassiveEntry,
  playerOriginTag: PreschoolExclusiveOriginTag,
): boolean {
  for (const tag of entry.originTags) {
    if (tag === 'neutral') continue;
    if (tag !== playerOriginTag) return true;
  }
  return false;
}

function buildPreschoolPassiveGapEntry(age: number): PreschoolPassiveEntry {
  const placeholder = resolvePlanningPlaceholderText(age);
  return {
    id: 'preschool_passive_gap',
    title: placeholder.title,
    text: placeholder.text,
    originTags: ['neutral'],
    ageMin: 3,
    ageMax: 7,
  };
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
  return mergedPreschoolCatalog().filter(
    entry => age >= entry.ageMin && age <= entry.ageMax,
  );
}

export function resolvePreschoolPassiveEntryByTitle(
  title: string,
  age: number,
): PreschoolPassiveEntry | undefined {
  return getPreschoolPassiveEntries(age).find(entry => entry.title === title);
}

export function findPreschoolPassiveEntryById(id: string): PreschoolPassiveEntry | undefined {
  for (const age of [3, 4, 5, 6, 7]) {
    const entry = getPreschoolPassiveEntries(age).find(item => item.id === id);
    if (entry) return entry;
  }
  return undefined;
}

export function selectPreschoolPassiveEntry(
  state: GameState,
  random: () => number = Math.random,
): PreschoolPassiveEntry {
  const age = state.player?.age ?? 0;
  const originTags = resolveOriginTags(state);
  const history = new Set((state.eventHistory ?? []).map(record => record.eventId));
  const ageEntries = getPreschoolPassiveEntries(age);

  let pool = ageEntries.filter(
    entry =>
      isPreschoolPassiveEligible(entry, originTags) &&
      !isNeutralOnlyPreschoolEntry(entry) &&
      !history.has(entry.id),
  );
  if (pool.length === 0) {
    pool = ageEntries.filter(
      entry => isNeutralOnlyPreschoolEntry(entry) && !history.has(entry.id),
    );
  }
  if (pool.length === 0) {
    return buildPreschoolPassiveGapEntry(age);
  }

  const weighted = pool.map(entry => ({
    entry,
    weight: scoreEntry(entry, originTags, state),
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) {
    return buildPreschoolPassiveGapEntry(age);
  }
  let roll = random() * total;
  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.entry;
  }
  return weighted[weighted.length - 1].entry;
}
