import {
  getPreschoolPassiveEntries,
  isNeutralOnlyPreschoolEntry,
  selectNeutralOnlyPreschoolEntry,
  selectPreschoolPassiveEntry,
  selectPreschoolOriginExclusiveEntry,
  validatePreschoolPassiveOriginTags,
} from '../src/data/preschoolPassiveSpine';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function martialPreschoolState(
  eventHistory: GameState['eventHistory'],
  passiveTitleHistory?: string[],
): GameState {
  return {
    player: { age: 5, flags: { origin_wuxia_family: true } },
    flags: {
      origin_wuxia_family: true,
      origin_id: 'martial_family',
      ...(passiveTitleHistory ? { p16_passive_title_history: passiveTitleHistory } : {}),
    },
    eventHistory,
  } as GameState;
}

function historyForEntries(entries: Array<{ id: string }>): GameState['eventHistory'] {
  return entries.map(entry => ({ eventId: entry.id, age: 5 }));
}

function testOriginHistoryExhaustionFallsBackToGap(): void {
  const age5Entries = getPreschoolPassiveEntries(5);
  const martialOrigins = age5Entries.filter(
    entry => entry.originTags.includes('martial') && !isNeutralOnlyPreschoolEntry(entry),
  );
  const neutralEntries = age5Entries.filter(isNeutralOnlyPreschoolEntry);
  assert(martialOrigins.length > 0, 'age 5 has martial origin-exclusive entries');
  assert(neutralEntries.length >= 7, 'age 5 has at least 7 neutral entries for title-window control');

  const state = martialPreschoolState([
    ...historyForEntries(martialOrigins),
    ...historyForEntries(neutralEntries.slice(0, 7)),
  ]);
  const consumedMartialIds = new Set(martialOrigins.map(entry => entry.id));
  const picked = selectPreschoolOriginExclusiveEntry(state, () => 0);

  assert(
    picked.id === 'preschool_passive_gap' || picked.id.startsWith('preschool_passive_gap::'),
    `exhausted martial origin pool must use gap fallback, got ${picked.id}`,
  );
  assert(!consumedMartialIds.has(picked.id), 'exhausted origin selection must not reuse a consumed martial origin');
}

function testOriginSelectionPreservesUnconsumedEntry(): void {
  const age5Entries = getPreschoolPassiveEntries(5);
  const martialOrigins = age5Entries.filter(
    entry => entry.originTags.includes('martial') && !isNeutralOnlyPreschoolEntry(entry),
  );
  const neutralEntries = age5Entries.filter(isNeutralOnlyPreschoolEntry);
  assert(martialOrigins.length > 1, 'age 5 has multiple martial origin-exclusive entries');
  assert(neutralEntries.length >= 7, 'age 5 has at least 7 neutral entries for title-window control');

  const unconsumed = martialOrigins[martialOrigins.length - 1]!;
  const consumed = martialOrigins.slice(0, -1);
  const state = martialPreschoolState([
    ...historyForEntries(consumed),
    ...historyForEntries(neutralEntries.slice(0, 7)),
  ]);
  const picked = selectPreschoolOriginExclusiveEntry(state, () => 0);

  assert(picked.id === unconsumed.id, `selector must preserve the unconsumed martial origin, got ${picked.id}`);
}

function testNeutralSelectorKeepsExhaustionReuseSemantics(): void {
  const neutralEntries = getPreschoolPassiveEntries(5).filter(isNeutralOnlyPreschoolEntry);
  assert(neutralEntries.length > 0, 'age 5 has neutral entries');
  const state = martialPreschoolState(historyForEntries(neutralEntries), [
    'unrelated-title-1',
    'unrelated-title-2',
    'unrelated-title-3',
    'unrelated-title-4',
    'unrelated-title-5',
    'unrelated-title-6',
    'unrelated-title-7',
  ]);
  const neutralIds = new Set(neutralEntries.map(entry => entry.id));
  const picked = selectNeutralOnlyPreschoolEntry(state, () => 0);

  assert(neutralIds.has(picked.id), `neutral exhaustion must retain existing reuse behavior, got ${picked.id}`);
}

function testApprovedPreschoolCapacityAuthoringSet(): void {
  const approved = [
    {
      id: 'preschool_neutral_peer_repair',
      title: '闹别扭',
      text: '你和玩伴为一件小事争得脸红，谁也不肯先开口。过了半日，你把手里的小玩意递回去，对方也悄悄挪近了些，先前那点气便慢慢散了。',
      ageMin: 5,
      ageMax: 7,
    },
    {
      id: 'preschool_neutral_peer_cooperation',
      title: '一起做完',
      text: '你和几个孩子合力收拾一件麻烦事，有人做到一半想溜，你们只好重新分工。等事情终于做完，你才明白答应一起做的事，不能只顾自己先走。',
      ageMin: 6,
      ageMax: 7,
    },
    {
      id: 'preschool_neutral_entrusted_task',
      title: '交给你的事',
      text: '大人临时把一件要紧的小事托给你照看。中途外头很热闹，你几次想跑去看，最后还是守在原处，第一次觉得「交给我」三个字有些分量。',
      ageMin: 5,
      ageMax: 7,
    },
    {
      id: 'preschool_neutral_care_younger',
      title: '牵住小手',
      text: '大人腾不开手，让你暂时照看一个更小的孩子。对方一会儿要哭、一会儿乱跑，你手忙脚乱地把人哄住，才知道照顾别人远没有看起来轻松。',
      ageMin: 6,
      ageMax: 7,
    },
    {
      id: 'preschool_neutral_find_way_back',
      title: '自己认路',
      text: '一次随家人出门，你转眼没看见熟悉的身影。慌了一阵后，你认出先前经过的地方，又向可信的大人问了路，终于自己找回了该去的方向。',
      ageMin: 5,
      ageMax: 7,
    },
    {
      id: 'preschool_neutral_speak_for_self',
      title: '自己开口',
      text: '有陌生的大人问起你的来意，身边的人没有替你回答。你起初声音很小，还是把事情一字一句说清楚了，对方也认真听完，没有把你只当小孩子敷衍过去。',
      ageMin: 6,
      ageMax: 7,
    },
    {
      id: 'preschool_neutral_care_sick_family',
      title: '递水守静',
      text: '家里一个平日照顾你的人病得没什么精神。你学着放轻脚步，递水拿布，还拦住旁人别太吵，第一次发现大人也会有需要别人照顾的时候。',
      ageMin: 5,
      ageMax: 7,
    },
    {
      id: 'preschool_neutral_household_disruption',
      title: '急雨忙家',
      text: '一阵急雨来得突然，家里顿时忙着收东西、挪开怕湿的物件。你也抱着能搬动的东西来回跑，雨停以后才发现，原来一个家也要大家一起照应。',
      ageMin: 6,
      ageMax: 7,
    },
  ] as const;
  const entriesById = new Map(
    [4, 5, 6, 7]
      .flatMap(age => getPreschoolPassiveEntries(age))
      .map(entry => [entry.id, entry] as const),
  );

  for (const spec of approved) {
    const entry = entriesById.get(spec.id);
    assert(entry !== undefined, `approved id exists: ${spec.id}`);
    assert(entry.title === spec.title, `approved title: ${spec.id}`);
    assert(entry.text === spec.text, `approved text: ${spec.id}`);
    assert(entry.ageMin === spec.ageMin, `approved ageMin: ${spec.id}`);
    assert(entry.ageMax === spec.ageMax, `approved ageMax: ${spec.id}`);
    assert(
      entry.originTags.length === 1 && entry.originTags[0] === 'neutral',
      `approved entry is exactly neutral-only: ${spec.id}`,
    );
    assert(entry.statDeltas === undefined, `approved entry has no statDeltas: ${spec.id}`);
    assert(entry.flags === undefined, `approved entry has no flags: ${spec.id}`);
  }

  const idsAtAge = (age: number): Set<string> =>
    new Set(getPreschoolPassiveEntries(age).map(entry => entry.id));
  const approvedIds = new Set(approved.map(spec => spec.id));
  const age5Ids = new Set(approved.filter(spec => spec.ageMin === 5).map(spec => spec.id));

  assert(
    [...approvedIds].every(id => !idsAtAge(4).has(id)),
    'none of the approved entries is available at age 4',
  );
  assert(
    [...age5Ids].every(id => idsAtAge(5).has(id)) &&
      [...approvedIds].filter(id => idsAtAge(5).has(id)).length === 4,
    'age 5 exposes exactly the four ageMin=5 approved entries',
  );
  assert(
    [...approvedIds].every(id => idsAtAge(6).has(id)),
    'age 6 exposes all approved entries',
  );
  assert(
    [...approvedIds].every(id => idsAtAge(7).has(id)),
    'age 7 exposes all approved entries',
  );
}

function testApprovedResidualPreschoolCapacityAuthoringSet(): void {
  const approved = [
    {
      id: 'preschool_neutral_fair_play',
      title: '说好算数',
      text: '你和几个孩子用石子定先后，这回偏偏轮到你输。你嘟囔着想重来，见大家都照着同一规矩等着，最后还是退回队尾，第一次明白说好的规矩不能只在自己赢时才算。',
      ageMin: 5,
      ageMax: 7,
    },
    {
      id: 'preschool_neutral_self_made_project',
      title: '自己做成',
      text: '你找来几片木片和细绳，照自己的主意扎一个会转的小玩意。散了两回你都重新绑好，等它终于转起来，旁人没催你，你却比得了夸奖还高兴。',
      ageMin: 5,
      ageMax: 7,
    },
    {
      id: 'preschool_neutral_stand_for_peer',
      title: '替他说话',
      text: '几个孩子把一件错事都怪在一个沉默的孩子头上，你明明可以装没看见，还是说出自己见到的经过。众人一时都看向你，你脸上发热，却没有把话收回去。',
      ageMin: 6,
      ageMax: 7,
    },
    {
      id: 'preschool_neutral_first_farewell',
      title: '送到路口',
      text: '常与你一起玩的孩子要随家人离开这里。你一路送到路口，原先还说以后再玩，直到那道身影越走越远，才第一次明白有些人离开后，日子真的会换个样子。',
      ageMin: 6,
      ageMax: 7,
    },
    {
      id: 'preschool_neutral_neighborhood_help',
      title: '邻里搭手',
      text: '住处附近一片大家常走的空地堆了不少杂物，周围的人一起动手收拾。你也提着小筐来回跑了几趟，忙完以后才觉得，门外这片地方也有自己的一份。',
      ageMin: 6,
      ageMax: 7,
    },
  ] as const;
  const entriesById = new Map(
    [4, 5, 6, 7]
      .flatMap(age => getPreschoolPassiveEntries(age))
      .map(entry => [entry.id, entry] as const),
  );

  for (const spec of approved) {
    const entry = entriesById.get(spec.id);
    assert(entry !== undefined, `residual approved id exists: ${spec.id}`);
    assert(entry.title === spec.title, `residual approved title: ${spec.id}`);
    assert(entry.text === spec.text, `residual approved text: ${spec.id}`);
    assert(entry.ageMin === spec.ageMin, `residual approved ageMin: ${spec.id}`);
    assert(entry.ageMax === spec.ageMax, `residual approved ageMax: ${spec.id}`);
    assert(
      entry.originTags.length === 1 && entry.originTags[0] === 'neutral',
      `residual approved entry is exactly neutral-only: ${spec.id}`,
    );
    assert(entry.statDeltas === undefined, `residual approved entry has no statDeltas: ${spec.id}`);
    assert(entry.flags === undefined, `residual approved entry has no flags: ${spec.id}`);
  }

  const idsAtAge = (age: number): Set<string> =>
    new Set(getPreschoolPassiveEntries(age).map(entry => entry.id));
  const approvedIds = new Set(approved.map(spec => spec.id));
  const expectedAge5Ids = new Set([
    'preschool_neutral_fair_play',
    'preschool_neutral_self_made_project',
  ]);
  const age5Ids = new Set([...approvedIds].filter(id => idsAtAge(5).has(id)));

  assert(
    [...approvedIds].every(id => !idsAtAge(4).has(id)),
    'none of the residual approved entries is available at age 4',
  );
  assert(
    age5Ids.size === 2 && [...expectedAge5Ids].every(id => age5Ids.has(id)),
    'age 5 exposes exactly the two ageMin=5 residual approved entries',
  );
  assert(
    [...approvedIds].every(id => idsAtAge(6).has(id)),
    'age 6 exposes all residual approved entries',
  );
  assert(
    [...approvedIds].every(id => idsAtAge(7).has(id)),
    'age 7 exposes all residual approved entries',
  );
}

export function runPreschoolPassiveSpineTests(): void {
  const preschoolPassiveSpineCatalog = getPreschoolPassiveEntries(3).concat(
    getPreschoolPassiveEntries(4),
    getPreschoolPassiveEntries(5),
    getPreschoolPassiveEntries(6),
    getPreschoolPassiveEntries(7),
  );
  const uniqueIds = new Set(preschoolPassiveSpineCatalog.map(e => e.id));
  assert(uniqueIds.size >= 8, 'merged preschool catalog has density');

  for (const id of uniqueIds) {
    const entry = preschoolPassiveSpineCatalog.find(e => e.id === id)!;
    assert(Boolean(entry.id && entry.title && entry.text), `entry ${entry.id} has id/title/text`);
    assert(entry.ageMin >= 3 && entry.ageMax <= 7, `entry ${entry.id} in 3–7 band`);
    assert(entry.originTags.length >= 1, `entry ${entry.id} has originTags`);
    const originError = validatePreschoolPassiveOriginTags(entry);
    assert(originError === undefined, originError ?? `entry ${entry.id} originTags invalid`);
  }

  const scholarAge3 = getPreschoolPassiveEntries(3, { origin_scholar_family: true }).filter(e =>
    e.originTags.includes('scholar'),
  );
  assert(scholarAge3.length >= 1, 'scholar age 3 has spine entry');

  const clever = getPreschoolPassiveEntries(3).find(e => e.id === 'preschool_scholar_clever_speech');
  assert(clever !== undefined, 'clever_speech equivalent in config');

  const textureIds = [
    'preschool_neutral_new_year_watch',
    'preschool_neutral_childhood_fever',
    'preschool_neutral_night_fear',
    'preschool_neutral_peer_hide_and_seek',
    'preschool_neutral_broken_bowl',
    'preschool_neutral_first_lie',
    'preschool_neutral_kin_visit',
    'preschool_neutral_waiting_threshold',
  ];
  const age5Neutrals = getPreschoolPassiveEntries(5).filter(isNeutralOnlyPreschoolEntry);
  for (const id of textureIds) {
    const entry = age5Neutrals.find(item => item.id === id);
    assert(entry !== undefined, `everyday texture ${id} covers age 5`);
    assert(entry.originTags.length === 1 && entry.originTags[0] === 'neutral', `${id} is neutral-only`);
    assert(entry.ageMin === 4 && entry.ageMax === 7, `${id} spans 4–7`);
    assert(!entry.statDeltas, `${id} does not grant stats`);
  }
  assert(age5Neutrals.length >= 8, 'age 5 has at least 8 everyday texture entries');

  const picked = selectPreschoolPassiveEntry({
    player: { age: 5 },
    eventHistory: [],
  } as GameState);
  assert(picked.title.length > 0, 'selectPreschoolPassiveEntry returns narrative');

  for (const origin of ['scholar', 'martial', 'merchant', 'frontier'] as const) {
    const band = getPreschoolPassiveEntries(5).filter(e => e.originTags.includes(origin));
    assert(band.length >= 2, `origin ${origin} has ≥2 entries in 3–7 config`);
  }

  const scholarIds = new Set(
    [...getPreschoolPassiveEntries(3), ...getPreschoolPassiveEntries(5), ...getPreschoolPassiveEntries(7)]
      .filter(e => e.originTags.includes('scholar'))
      .map(e => e.id),
  );
  const martialIds = new Set(
    [...getPreschoolPassiveEntries(3), ...getPreschoolPassiveEntries(5), ...getPreschoolPassiveEntries(7)]
      .filter(e => e.originTags.includes('martial'))
      .map(e => e.id),
  );
  const merchantIds = new Set(
    [...getPreschoolPassiveEntries(3), ...getPreschoolPassiveEntries(5), ...getPreschoolPassiveEntries(7)]
      .filter(e => e.originTags.includes('merchant'))
      .map(e => e.id),
  );
  const frontierIds = new Set(
    [...getPreschoolPassiveEntries(3), ...getPreschoolPassiveEntries(5), ...getPreschoolPassiveEntries(7)]
      .filter(e => e.originTags.includes('frontier'))
      .map(e => e.id),
  );
  for (const id of merchantIds) {
    assert(!scholarIds.has(id) && !martialIds.has(id), `merchant id ${id} must not reuse scholar/martial`);
  }
  for (const id of frontierIds) {
    assert(!scholarIds.has(id) && !martialIds.has(id), `frontier id ${id} must not reuse scholar/martial`);
  }

  assert(
    validatePreschoolPassiveOriginTags({
      id: 'bad_multi_exclusive',
      title: 'x',
      text: 'x',
      originTags: ['scholar', 'martial'],
      ageMin: 3,
      ageMax: 7,
    }) !== undefined,
    'multi-exclusive originTags must fail validation',
  );

  testOriginHistoryExhaustionFallsBackToGap();
  testOriginSelectionPreservesUnconsumedEntry();
  testNeutralSelectorKeepsExhaustionReuseSemantics();
  testApprovedPreschoolCapacityAuthoringSet();
  testApprovedResidualPreschoolCapacityAuthoringSet();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPreschoolPassiveSpineTests();
  console.log('preschoolPassiveSpineTests: ok');
}
