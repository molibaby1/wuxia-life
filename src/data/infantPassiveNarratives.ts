import type { GameState } from '../types/eventTypes';
import type { PassiveNarrativeEntry } from './passiveNarrativeTypes';
import {
  ORIGIN_FLAG_TO_PASSIVE_TAG,
  selectOrderedOriginInfantPassive,
} from './originInfantPassiveChain';

export type { PassiveNarrativeEntry } from './passiveNarrativeTypes';

const ORIGIN_FLAG_TO_TAG = ORIGIN_FLAG_TO_PASSIVE_TAG;

/** 3～7 岁幼童期随机被动叙事（0～2 岁由 origin-infant-passives.json 有序链承接） */
export const infantPassiveNarrativeCatalog: PassiveNarrativeEntry[] = [
  {
    id: 'toddler_scholar_char',
    title: '识文断字',
    text: '先生拿来蒙学字卡，你指着「人」「口」咿呀跟读，虽不成句，已让长辈眉开眼笑。',
    originTags: ['scholar'],
    ageMin: 3,
    ageMax: 4,
    statDeltas: { comprehension: 1 },
  },
  {
    id: 'toddler_martial_watch',
    title: '耳濡目染',
    text: '你趴在廊下看兄长练桩，有样学样地挥动小拳头，被长辈笑着扶住，生怕你摔着。',
    originTags: ['martial'],
    ageMin: 3,
    ageMax: 4,
    statDeltas: { constitution: 1 },
  },
  {
    id: 'toddler_merchant_abacus',
    title: '市井烟火',
    text: '你跟着母亲娘家门走了一趟，在集市听人讨价还价，回来竟学着比划「一两」「半两」。',
    originTags: ['merchant'],
    ageMin: 3,
    ageMax: 4,
  },
  {
    id: 'toddler_frontier_wind',
    title: '边关风声',
    text: '父亲换防前抱你看了眼城外的黄沙，你并不懂战事，只记得风很大，把他的披风吹得猎猎作响。',
    originTags: ['frontier'],
    ageMin: 3,
    ageMax: 4,
  },
  {
    id: 'toddler_neutral_season',
    title: '家中一季',
    text: '这一季你在庭院里看花开叶落，听仆妇们闲话家常，日子平静得像一池春水。',
    originTags: ['neutral'],
    ageMin: 3,
    ageMax: 4,
  },
  {
    id: 'child_scholar_copybook',
    title: '描红练字',
    text: '你握着毛笔照着字帖描红，写得歪扭，却被先生夸有静气，让你明日再来。',
    originTags: ['scholar'],
    ageMin: 3,
    ageMax: 7,
    statDeltas: { comprehension: 1 },
  },
  {
    id: 'child_martial_wooden_dummy',
    title: '木人桩影',
    text: '你在练武场边模仿长辈出拳，木人桩被撞得咚咚响，师兄们笑称你是「小桩头」。',
    originTags: ['martial'],
    ageMin: 3,
    ageMax: 7,
    statDeltas: { constitution: 1 },
  },
  {
    id: 'child_merchant_stall',
    title: '看摊学艺',
    text: '你在自家铺面边帮长辈递货，记住了几种常客的称呼，也学会了笑脸迎人。',
    originTags: ['merchant'],
    ageMin: 3,
    ageMax: 7,
  },
  {
    id: 'child_frontier_drill',
    title: '营中操练',
    text: '你坐在校场边，看士兵列队操练，号子喊得整齐，你把小木棍也举得笔直。',
    originTags: ['frontier'],
    ageMin: 3,
    ageMax: 7,
    statDeltas: { constitution: 1 },
  },
];

function resolvePlayerOriginTags(state: GameState): Set<string> {
  const tags = new Set<string>(['neutral']);
  const flags = state.flags ?? {};
  const playerFlags = state.player?.flags ?? {};
  for (const [flag, tag] of Object.entries(ORIGIN_FLAG_TO_TAG)) {
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
  const placeholder = resolvePlanningPlaceholderText(age);
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
  return selectLegacyPassiveNarrative(state, random);
}

export function shouldRecordPassiveNarrativeInHistory(entryId: string): boolean {
  return entryId !== 'infant_passive_gap';
}

export function resolvePlanningPlaceholderText(age: number): { title: string; text: string } {
  if (age <= 2) {
    return { title: '岁月静流', text: '这一季你在家人怀抱与啼哭声中度过，尚不知江湖为何物。' };
  }
  if (age <= 4) {
    return { title: '家中一季', text: '这一季你在庭院与亲人身边度过，听故事、学走路，日子平淡而安稳。' };
  }
  if (age <= 7) {
    return { title: '童年时光', text: '家中又过了一季，你可稍作安排，或静待家中变故。' };
  }
  return {
    title: '规划本期人生',
    text: '本期暂无强求的江湖变故，你可安排日常行动。',
  };
}
