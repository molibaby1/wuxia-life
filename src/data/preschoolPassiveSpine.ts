/**
 * Preschool passive/spine loader (ages 3–7).
 * Schema: { id, title, text, originTags[], ageMin, ageMax, statDeltas?, flags? }
 */
import preschoolPassiveSpineJson from './lines/preschool-passive-spine.json';
import type { PassiveNarrativeEntry } from './passiveNarrativeTypes';
import { infantPassiveNarrativeCatalog } from './infantPassiveNarrativeCatalog';
import {
  resolvePassiveGapPlaceholderText,
  resolvePlanningPlaceholderText,
} from './passivePlanningPlaceholder';
import type { GameState } from '../types/eventTypes';
import { getOriginChildhoodEventMultiplier } from '../p16/originSurfaces';
import { ORIGIN_FLAG_TO_PASSIVE_TAG } from './originInfantPassiveChain';
import { resolvePrimaryOriginFamilyFlag } from '../p16/primaryOriginFlag';

export type PreschoolPassiveEntry = PassiveNarrativeEntry;

export const PRESCHOOL_EXCLUSIVE_ORIGIN_TAGS = ['scholar', 'martial', 'merchant', 'frontier'] as const;
export type PreschoolExclusiveOriginTag = (typeof PRESCHOOL_EXCLUSIVE_ORIGIN_TAGS)[number];

/** Recent passive title suppression window (PRD Q3, Stage-7 US-007). */
export const NEUTRAL_PASSIVE_TITLE_DEDUP_WINDOW = 7;

const preschoolConfigEntries = (preschoolPassiveSpineJson as { entries: PreschoolPassiveEntry[] }).entries;

function mergedPreschoolCatalog(): PreschoolPassiveEntry[] {
  return [
    ...infantPassiveNarrativeCatalog.filter(e => e.ageMin >= 3 && e.ageMax <= 7),
    ...preschoolConfigEntries,
  ];
}

/** Single primary origin tag — reuses resolvePrimaryOriginFamilyFlag (Stage-5 / Stage-6 FR-4). */
function resolveOriginTags(state: GameState): Set<string> {
  const tags = new Set<string>(['neutral']);
  const primary = resolvePrimaryOriginFamilyFlag(state);
  if (primary) {
    const tag = ORIGIN_FLAG_TO_PASSIVE_TAG[primary];
    if (tag) tags.add(tag);
    return tags;
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

function buildPreschoolPassiveGapEntry(age: number, recentTitles: string[] = []): PreschoolPassiveEntry {
  const placeholder = resolvePassiveGapPlaceholderText(age);
  const rotatedTitles =
    age <= 4
      ? [placeholder.title, '檐下晚晴', '童稚年月', '静听风言', '庭院时光']
      : age <= 7
        ? [placeholder.title, '邻里童谣', '季节更迭', '庭院嬉戏', '童年印象']
        : [placeholder.title, '少年初长', '书剑两忘', '寒暑往来', '窗下光阴'];
  const lastTitle = recentTitles[0];
  const consecutiveBlocked =
    recentTitles.length >= 2 && recentTitles[0] === recentTitles[1] ? recentTitles[0] : undefined;
  const title =
    rotatedTitles.find(
      candidate =>
        candidate !== consecutiveBlocked &&
        !recentTitles.includes(candidate) &&
        candidate !== lastTitle,
    ) ??
    rotatedTitles.find(candidate => candidate !== consecutiveBlocked && candidate !== lastTitle) ??
    rotatedTitles.find(candidate => candidate !== consecutiveBlocked) ??
    placeholder.title;
  return {
    id:
      title === placeholder.title
        ? 'preschool_passive_gap'
        : `preschool_passive_gap::${encodeURIComponent(title)}`,
    title,
    text: placeholder.text,
    originTags: ['neutral'],
    ageMin: 3,
    ageMax: 12,
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
  const fromMerged = mergedPreschoolCatalog().find(item => item.id === id);
  if (fromMerged) return fromMerged;
  return infantPassiveNarrativeCatalog.find(item => item.id === id);
}

/** Append displayed passive title for dedup (covers ensurePassivePresentation before tick). */
export function appendPassiveTitleToHistory(state: GameState, title: string): void {
  if (!title.trim()) return;
  if (!state.flags) {
    state.flags = {};
  }
  const key = 'p16_passive_title_history';
  const prev = Array.isArray(state.flags[key]) ? (state.flags[key] as string[]) : [];
  state.flags[key] = [title, ...prev.filter(t => t !== title)].slice(0, NEUTRAL_PASSIVE_TITLE_DEDUP_WINDOW);
}

export function getRecentPassiveNarrativeTitles(
  state: GameState,
  window: number = NEUTRAL_PASSIVE_TITLE_DEDUP_WINDOW,
): string[] {
  const fromFlags = Array.isArray(state.flags?.p16_passive_title_history)
    ? (state.flags.p16_passive_title_history as string[])
    : [];
  const titles: string[] = [...fromFlags];
  const history = state.eventHistory ?? [];
  for (let i = history.length - 1; i >= 0 && titles.length < window; i -= 1) {
    const record = history[i]!;
    const entry = findPreschoolPassiveEntryById(record.eventId);
    if (entry) {
      if (!titles.includes(entry.title)) {
        titles.push(entry.title);
      }
      continue;
    }
    if (record.eventId === 'preschool_passive_gap' || record.eventId.startsWith('preschool_passive_gap::')) {
      const encodedTitle = record.eventId.includes('::')
        ? decodeURIComponent(record.eventId.split('::')[1] ?? '')
        : resolvePlanningPlaceholderText(record.age ?? state.player?.age ?? 0).title;
      if (!titles.includes(encodedTitle)) {
        titles.push(encodedTitle);
      }
      continue;
    }
    if (record.eventId.startsWith('infant_passive_gap::')) {
      const encodedTitle = decodeURIComponent(record.eventId.split('::')[1] ?? '');
      if (encodedTitle && !titles.includes(encodedTitle)) {
        titles.push(encodedTitle);
      }
    }
  }
  return titles.slice(0, window);
}

function suppressRecentTitleRepeats(
  pool: PreschoolPassiveEntry[],
  recentTitles: string[],
): PreschoolPassiveEntry[] {
  if (recentTitles.length === 0) {
    return pool;
  }
  const blocked = new Set(recentTitles);
  let filtered = pool.filter(entry => !blocked.has(entry.title));
  const lastTitle = recentTitles[0];
  if (lastTitle && filtered.length > 1) {
    const withoutImmediateRepeat = filtered.filter(entry => entry.title !== lastTitle);
    if (withoutImmediateRepeat.length > 0) {
      filtered = withoutImmediateRepeat;
    }
  }
  return filtered;
}

function enforceMaxConsecutiveTitleCap(
  pool: PreschoolPassiveEntry[],
  recentTitles: string[],
  maxConsecutive = 2,
): PreschoolPassiveEntry[] {
  if (recentTitles.length === 0 || pool.length === 0) {
    return pool;
  }
  let consecutiveSame = 1;
  for (let i = 1; i < recentTitles.length; i += 1) {
    if (recentTitles[i] === recentTitles[0]) {
      consecutiveSame += 1;
    } else {
      break;
    }
  }
  if (consecutiveSame < maxConsecutive) {
    return pool;
  }
  const blockedTitle = recentTitles[0];
  const filtered = pool.filter(entry => entry.title !== blockedTitle);
  return filtered.length > 0 ? filtered : pool;
}

export function selectPreschoolPassiveEntry(
  state: GameState,
  random: () => number = Math.random,
): PreschoolPassiveEntry {
  const age = state.player?.age ?? 0;
  const originTags = resolveOriginTags(state);
  const history = new Set((state.eventHistory ?? []).map(record => record.eventId));
  const recentTitles = getRecentPassiveNarrativeTitles(state);
  const ageEntries = getPreschoolPassiveEntries(age);

  let pool = ageEntries.filter(
    entry =>
      isPreschoolPassiveEligible(entry, originTags) &&
      !isNeutralOnlyPreschoolEntry(entry) &&
      !history.has(entry.id),
  );
  pool = suppressRecentTitleRepeats(pool, recentTitles);
  pool = enforceMaxConsecutiveTitleCap(pool, recentTitles, 2);
  if (recentTitles.length >= 2 && recentTitles[0] === recentTitles[1]) {
    const blocked = recentTitles[0];
    const withoutPair = pool.filter(entry => entry.title !== blocked);
    if (withoutPair.length > 0) {
      pool = withoutPair;
    }
  }
  if (pool.length === 0) {
    pool = suppressRecentTitleRepeats(
      ageEntries.filter(
        entry => isNeutralOnlyPreschoolEntry(entry) && !history.has(entry.id),
      ),
      recentTitles,
    );
    pool = enforceMaxConsecutiveTitleCap(pool, recentTitles);
  }
  if (pool.length === 0) {
    return buildPreschoolPassiveGapEntry(age, recentTitles);
  }

  const weighted = pool.map(entry => ({
    entry,
    weight: scoreEntry(entry, originTags, state),
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) {
    return buildPreschoolPassiveGapEntry(age, recentTitles);
  }
  let roll = random() * total;
  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.entry;
  }
  return weighted[weighted.length - 1].entry;
}
