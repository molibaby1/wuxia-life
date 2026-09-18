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
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPreschoolPassiveSpineTests();
  console.log('preschoolPassiveSpineTests: ok');
}
