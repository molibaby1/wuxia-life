/**
 * Schema: origin-infant-passives.json → chains[] (questId, originFlag, completeFlag, nodes[])
 * with nodes (id, order, ageMin, ageMax, title, text, flags?, statDeltas?, legacyCatalogId?)
 * plus sharedFillers[] for neutral post-chain filler. See childhood-origin-infant-passive-index.md §1.
 */
import type { GameState } from '../types/eventTypes';
import originInfantPassivesJson from './lines/origin-infant-passives.json';
import type { PassiveNarrativeEntry } from './passiveNarrativeTypes';
import { getRecentPassiveNarrativeTitles } from './preschoolPassiveSpine';
import { resolvePlanningPlaceholderText } from './passivePlanningPlaceholder';

export interface OriginInfantPassiveNode {
  id: string;
  order: number;
  title: string;
  text: string;
  ageMin: number;
  ageMax: number;
  flags?: string[];
  legacyCatalogId?: string;
  statDeltas?: Record<string, number>;
}

export interface OriginInfantPassiveChain {
  questId: string;
  originFlag: string;
  completeFlag: string;
  nodes: OriginInfantPassiveNode[];
}

export interface OriginInfantSharedFiller {
  id: string;
  title: string;
  text: string;
  ageMin: number;
  ageMax: number;
  statDeltas?: Record<string, number>;
}

const ORIGIN_INFANT_PASSIVES = originInfantPassivesJson as {
  chains: OriginInfantPassiveChain[];
  sharedFillers: OriginInfantSharedFiller[];
};

const ORIGIN_FLAG_TO_TAG: Record<string, string> = {
  origin_scholar_family: 'scholar',
  origin_wuxia_family: 'martial',
  origin_merchant_family: 'merchant',
  origin_frontier: 'frontier',
};

export const ORIGIN_FLAG_TO_PASSIVE_TAG = ORIGIN_FLAG_TO_TAG;

const CHAIN_ORDER = [...ORIGIN_INFANT_PASSIVES.chains];

export function getOriginInfantPassiveChains(): readonly OriginInfantPassiveChain[] {
  return CHAIN_ORDER;
}

export function getOriginInfantSharedFillers(): readonly OriginInfantSharedFiller[] {
  return ORIGIN_INFANT_PASSIVES.sharedFillers;
}

function hasFlag(state: GameState, flag: string): boolean {
  return !!(state.flags?.[flag] || state.player?.flags?.[flag]);
}

function eventHistoryIds(state: GameState): Set<string> {
  return new Set((state.eventHistory ?? []).map(record => record.eventId));
}

export function resolveOriginInfantChain(state: GameState): OriginInfantPassiveChain | null {
  for (const chain of CHAIN_ORDER) {
    if (hasFlag(state, chain.originFlag)) {
      return chain;
    }
  }
  return null;
}

export function isOriginInfantChainComplete(
  state: GameState,
  chain: OriginInfantPassiveChain,
): boolean {
  if (hasFlag(state, chain.completeFlag)) {
    return true;
  }
  return chain.nodes.every(node => isOriginInfantNodeCompleted(state, node));
}

function isOriginInfantNodeCompleted(state: GameState, node: OriginInfantPassiveNode): boolean {
  const history = eventHistoryIds(state);
  if (history.has(node.id)) {
    return true;
  }
  if (node.legacyCatalogId && history.has(node.legacyCatalogId)) {
    return true;
  }
  const primaryFlag = node.flags?.[0];
  return primaryFlag ? hasFlag(state, primaryFlag) : false;
}

export function findNextOriginInfantNode(
  state: GameState,
  chain: OriginInfantPassiveChain,
): OriginInfantPassiveNode | null {
  const age = state.player?.age ?? 0;
  for (const node of [...chain.nodes].sort((a, b) => a.order - b.order)) {
    if (isOriginInfantNodeCompleted(state, node)) {
      continue;
    }
    if (age < node.ageMin) {
      return null;
    }
    return node;
  }
  return null;
}

function toPassiveEntry(
  node: OriginInfantPassiveNode | OriginInfantSharedFiller,
  originTag?: string,
): PassiveNarrativeEntry {
  const originTags = originTag ? [originTag, 'neutral'] : ['neutral'];
  return {
    id: node.id,
    title: node.title,
    text: node.text,
    originTags,
    ageMin: node.ageMin,
    ageMax: node.ageMax,
    statDeltas: node.statDeltas,
    flags: 'flags' in node ? node.flags : undefined,
  };
}

export function selectOriginInfantSharedFiller(
  state: GameState,
  random: () => number = Math.random,
): PassiveNarrativeEntry | null {
  const age = state.player?.age ?? 0;
  const history = eventHistoryIds(state);
  const recentTitles = getRecentPassiveNarrativeTitles(state);
  const candidates = ORIGIN_INFANT_PASSIVES.sharedFillers.filter(
    filler => age >= filler.ageMin && age <= filler.ageMax && !history.has(filler.id),
  );
  let pool =
    candidates.length > 0
      ? candidates
      : ORIGIN_INFANT_PASSIVES.sharedFillers.filter(
          filler => age >= filler.ageMin && age <= filler.ageMax,
        );
  if (pool.length === 0) {
    return null;
  }
  const lastTitle = recentTitles[0];
  const withoutRecent = pool.filter(filler => !recentTitles.includes(filler.title));
  if (withoutRecent.length > 0) {
    pool = withoutRecent;
  }
  if (lastTitle && pool.length > 1) {
    const withoutImmediate = pool.filter(filler => filler.title !== lastTitle);
    if (withoutImmediate.length > 0) {
      pool = withoutImmediate;
    }
  }
  if (
    pool.length === 1 &&
    lastTitle &&
    pool[0]!.title === lastTitle &&
    recentTitles.filter(title => title === lastTitle).length >= 1
  ) {
    const placeholder = resolvePlanningPlaceholderText(age);
    const rotated =
      age <= 1
        ? ['褓中微光', '榻上咿声', '童声初闻', placeholder.title]
        : ['学步跬步', '童声呀呀', '庭院咿呀', placeholder.title];
    const title =
      rotated.find(candidate => candidate !== lastTitle && !recentTitles.includes(candidate)) ??
      rotated.find(candidate => candidate !== lastTitle) ??
      placeholder.title;
    return {
      id: `infant_passive_gap::${encodeURIComponent(title)}`,
      title,
      text: placeholder.text,
      originTags: ['neutral'],
      ageMin: age,
      ageMax: age,
    };
  }
  const index = Math.floor(random() * pool.length);
  return toPassiveEntry(pool[index] ?? pool[0]);
}

export function selectOrderedOriginInfantPassive(
  state: GameState,
  random: () => number = Math.random,
): PassiveNarrativeEntry | null {
  const age = state.player?.age ?? 0;
  if (age > 2) {
    return null;
  }

  const chain = resolveOriginInfantChain(state);
  if (!chain) {
    return null;
  }

  const originTag = ORIGIN_FLAG_TO_TAG[chain.originFlag];
  if (!isOriginInfantChainComplete(state, chain)) {
    const nextNode = findNextOriginInfantNode(state, chain);
    if (nextNode) {
      return toPassiveEntry(nextNode, originTag);
    }
    const fillerWhileWaiting = selectOriginInfantSharedFiller(state, random);
    if (fillerWhileWaiting) {
      return fillerWhileWaiting;
    }
    return null;
  }

  return selectOriginInfantSharedFiller(state, random);
}

export function applyPassiveNarrativeFlags(state: GameState, flags?: string[]): void {
  if (!flags?.length) {
    return;
  }
  if (!state.flags) {
    state.flags = {};
  }
  if (state.player && !state.player.flags) {
    state.player.flags = {};
  }
  for (const flag of flags) {
    state.flags[flag] = true;
    if (state.player) {
      state.player.flags[flag] = true;
    }
  }
}
