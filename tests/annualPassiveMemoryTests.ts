import {
  ANNUAL_PASSIVE_MEMORY_ENTRY_COUNT,
  commitAnnualPassiveMemory,
  isAnnualPassiveMemoryAge,
  isPreschoolSeasonMemoryAge,
  PRESCHOOL_SEASON_MEMORY_ENTRY_COUNT,
  prepareAnnualPassiveMemory,
  preparePreschoolSeasonMemory,
} from '../src/core/activePlanning/annualPassiveMemory';
import {
  getPreschoolPassiveEntries,
  isForeignExclusivePreschoolEntry,
  isNeutralOnlyPreschoolEntry,
} from '../src/data/preschoolPassiveSpine';
import { reactive } from 'vue';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import { buildPeriodSummary } from '../src/core/activePlanning/periodSummaryBuilder';
import type { GameState, PlayerState } from '../src/types/eventTypes';
import type { PassiveNarrativeEntry } from '../src/data/passiveNarrativeTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function isPreschoolGap(entry: PassiveNarrativeEntry): boolean {
  return entry.id === 'preschool_passive_gap' || entry.id.startsWith('preschool_passive_gap::');
}

function merchantInfantState(age = 0): GameState {
  const base = new GameEngineIntegration().getGameState();
  return {
    ...base,
    player: {
      ...base.player,
      age,
      constitution: 10,
      healthStatus: 'healthy',
      statuses: [],
      businessAcumen: 4,
      connections: 2,
      flags: {},
      traits: [],
    } as PlayerState,
    flags: { ...base.flags, origin_merchant_family: true, origin_id: 'merchant_house' },
    currentTime: { year: 1, month: 2, day: 3 },
    eventHistory: [],
  };
}

function testPrepareAnnualPassiveMemoryWithReactiveState(): void {
  const plan = prepareAnnualPassiveMemory(reactive(merchantInfantState(1)), () => 0);

  assert(
    plan.entries.length === ANNUAL_PASSIVE_MEMORY_ENTRY_COUNT,
    'annual memory prepares entries from Vue reactive game state',
  );
}

function testPassiveCharismaSummaryUsesAppliedGrowth(): void {
  const entry: PassiveNarrativeEntry = {
    id: 'test_passive_charisma_growth',
    title: '人情往来',
    text: '你在往来中渐渐学会与人相处。',
    originTags: [],
    ageMin: 0,
    ageMax: 100,
    statDeltas: { charisma: 3 },
  };

  for (const scenario of [
    { before: 90, after: 93, delta: 3 },
    { before: 99, after: 100, delta: 1 },
    { before: 100, after: 100, delta: 0 },
  ]) {
    const state = merchantInfantState(8);
    state.player.charisma = scenario.before;
    const result = commitAnnualPassiveMemory(state, {
      headline: '人情往来',
      body: entry.text,
      entries: [entry],
    });
    const summary = buildPeriodSummary({
      sourceLabel: '童年岁月',
      headline: result.headline,
      body: result.body,
      deltas: result.deltas,
      deltaCause: result.headline,
    });

    assert(state.player.charisma === scenario.after, `passive charisma ${scenario.before} settles to ${scenario.after}`);
    assert(
      (result.deltas.charisma ?? 0) === scenario.delta,
      `passive result records actual charisma delta ${scenario.delta}`,
    );
    if (scenario.delta === 0) {
      assert(
        summary.statDeltaSummary === '本期未见明显数值变化',
        'passive summary must not claim growth after the cap removes it',
      );
    } else {
      assert(
        summary.statDeltaSummary.includes(`魅力+${scenario.delta}`),
        'passive summary shows only actual charisma growth',
      );
      if (scenario.delta < 3) {
        assert(!summary.statDeltaSummary.includes('魅力+3'), 'passive summary omits the capped theoretical amount');
      }
    }
  }
}

async function testHeadlessAnnualAdvance(): Promise<void> {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '年度记忆',
    gender: 'female',
    catalogVersion: '1.0.0',
    randomSeed: 17,
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 1;
  snapshot.state.flags = { ...(snapshot.state.flags ?? {}), origin_merchant_family: true };
  snapshot.state.player.flags = { ...(snapshot.state.player.flags ?? {}), origin_merchant_family: true };
  const session = HeadlessEngineSessionImpl.create({ snapshot });

  session.ensurePassivePresentation();
  const before = session.getProgressionVolatileState();
  assert(before.passiveNarrative?.title === '1岁这一年', 'the visible node is the combined annual card');
  assert(before.annualPassiveMemory?.entries.length === 2, 'volatile state keeps the exact displayed entries');
  const restored = HeadlessEngineSessionImpl.create({ snapshot: session.serialize() });
  restored.applyProgressionVolatileState(before);
  assert(
    restored.getProgressionVolatileState().annualPassiveMemory?.entries.map(entry => entry.id).join(',') ===
      before.annualPassiveMemory?.entries.map(entry => entry.id).join(','),
    'request-boundary restoration preserves the displayed entries',
  );
  await restored.acknowledgeProgression('passive_continue');

  assert(restored.getRuntimeState().player.age === 2, 'one passive acknowledgement advances one year');
  const after = restored.getProgressionVolatileState();
  assert(after.pendingPeriodSummary === null, 'annual card does not add a second summary acknowledgement');
  assert(after.passiveNarrative?.title === '2岁这一年', 'the same acknowledgement reaches the next annual card');
}

async function testHeadlessPassiveSummaryUsesAppliedCharismaGrowth(): Promise<void> {
  const entry: PassiveNarrativeEntry = {
    id: 'test_passive_charisma_growth',
    title: '人情往来',
    text: '你在往来中渐渐学会与人相处。',
    originTags: [],
    ageMin: 0,
    ageMax: 100,
    statDeltas: { charisma: 3 },
  };

  for (const scenario of [
    { before: 99, after: 100, delta: 1 },
    { before: 100, after: 100, delta: 0 },
  ]) {
    const bootstrap = HeadlessEngineSessionImpl.create({
      playerName: '被动魅力边界',
      gender: 'female',
      catalogVersion: '1.0.0',
      randomSeed: 23,
    });
    const snapshot = bootstrap.serialize();
    snapshot.state.player.age = 4;
    snapshot.state.player.charisma = scenario.before;
    snapshot.state.player.events = [];
    snapshot.state.eventHistory = [];
    const session = HeadlessEngineSessionImpl.create({ snapshot });

    assert(session.getSessionPhase() === 'passive_progression', 'age-four passive session keeps its phase');
    session.ensurePassivePresentation();
    const current = session.getProgressionVolatileState();
    assert(current.annualPassiveMemory !== null, 'preschool seasonal passive plan is prepared');
    const plan = { headline: entry.title, body: entry.text, entries: [entry] };
    session.applyProgressionVolatileState({
      ...current,
      passiveNarrative: { title: plan.headline, text: plan.body },
      annualPassiveMemory: plan,
    });

    await session.acknowledgeProgression('passive_continue');

    const after = session.serialize().state;
    const summary = session.getProgressionVolatileState().pendingPeriodSummary;
    assert(after.player.charisma === scenario.after, `Headless passive charisma ${scenario.before} settles to ${scenario.after}`);
    assert(summary !== null, 'preschool passive acknowledgement produces its existing summary');
    if (scenario.delta === 0) {
      assert(
        summary!.statDeltaSummary === '本期未见明显数值变化',
        'Headless passive summary must not claim charisma growth after the cap removes it',
      );
    } else {
      assert(
        summary!.statDeltaSummary.includes(`魅力+${scenario.delta}`),
        'Headless passive summary shows only applied charisma growth',
      );
      assert(!summary!.statDeltaSummary.includes('魅力+3'), 'Headless passive summary omits capped theoretical growth');
    }
  }
}

async function testAnnualPlanClearsAcrossProgressionResets(): Promise<void> {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '清理年度记忆',
    gender: 'female',
    catalogVersion: '1.0.0',
    randomSeed: 18,
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 1;
  snapshot.state.flags = { ...(snapshot.state.flags ?? {}), origin_merchant_family: true };
  const session = HeadlessEngineSessionImpl.create({ snapshot });

  session.ensurePassivePresentation();
  assert(session.getProgressionVolatileState().annualPassiveMemory !== null, 'headless setup has annual plan');
  await session.hydrate(snapshot);
  assert(session.getProgressionVolatileState().annualPassiveMemory === null, 'hydrate clears annual plan');

  session.ensurePassivePresentation();
  await session.restart({
    playerName: '重开年度记忆',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 19,
  });
  assert(session.getProgressionVolatileState().annualPassiveMemory === null, 'restart clears annual plan');

}

export async function runAnnualPassiveMemoryTests(): Promise<void> {
  assert(isAnnualPassiveMemoryAge(0), 'age 0 is annual-memory band');
  assert(isAnnualPassiveMemoryAge(3), 'age 3 is annual-memory band');
  assert(!isAnnualPassiveMemoryAge(4), 'age 4 leaves annual-memory band');
  assert(isPreschoolSeasonMemoryAge(4), 'age 4 is season-memory band');
  assert(isPreschoolSeasonMemoryAge(7), 'age 7 is season-memory band');
  assert(!isPreschoolSeasonMemoryAge(3), 'age 3 stays on annual memory');
  assert(!isPreschoolSeasonMemoryAge(8), 'age 8 leaves season-memory band');
  testPrepareAnnualPassiveMemoryWithReactiveState();
  testPassiveCharismaSummaryUsesAppliedGrowth();
  testPreparePreschoolSeasonMemory();
  testApprovedCapacityEntriesAreConsumedBeforeGap();
  testApprovedResidualCapacityEntriesAreConsumedBeforeGap();
  testPreparePreschoolSeasonMemoryConsumesNeutralBeforeGap();
  testPreparePreschoolSeasonMemoryNeutralFirstClassWithOriginPresent();
  testPreparePreschoolSeasonMemoryTitlePreferenceDoesNotForceGap();

  await testHeadlessPassiveSummaryUsesAppliedCharismaGrowth();

  const state = merchantInfantState(0);
  const plan = prepareAnnualPassiveMemory(state, () => 0);

  assert(plan.entries.length === ANNUAL_PASSIVE_MEMORY_ENTRY_COUNT, 'one annual card prepares two entries');
  assert(plan.headline === '0岁这一年', `unexpected headline: ${plan.headline}`);
  assert(plan.body.includes('【') && plan.body.includes('】'), 'body preserves entry titles');
  assert(plan.body.split('\n\n').length === 2, 'body contains two narrative beats');
  assert((state.eventHistory ?? []).length === 0, 'preparing the visible card does not mutate gameplay state');

  const result = commitAnnualPassiveMemory(state, plan);
  assert((state.eventHistory ?? []).length === 2, 'both source events remain traceable');
  assert(Boolean(state.flags?.merchant_infant_shop_birth), 'first source flag applied');
  assert(Boolean(state.flags?.merchant_infant_swaddle_abacus), 'second source flag applied');
  const timestamp = state.eventHistory?.[0]?.timestamp;
  assert(
    typeof timestamp === 'object' &&
      timestamp.year === 1 &&
      timestamp.month === 2 &&
      timestamp.day === 3,
    'source event carries a copy of current time',
  );
  assert(result.entryIds.join(',') === plan.entries.map(entry => entry.id).join(','), 'commit uses the displayed entries');
  await testHeadlessAnnualAdvance();
  await testAnnualPlanClearsAcrossProgressionResets();
  await testHeadlessSeasonAdvance();
}

function martialPreschoolState(age = 5): GameState {
  const base = new GameEngineIntegration().getGameState();
  return {
    ...base,
    player: {
      ...base.player,
      age,
      constitution: 10,
      healthStatus: 'healthy',
      statuses: [],
      flags: { origin_wuxia_family: true },
      traits: [],
    } as PlayerState,
    flags: { ...base.flags, origin_wuxia_family: true, origin_id: 'martial_family' },
    currentTime: { year: 5, month: 1, day: 1 },
    eventHistory: [],
  };
}

function testPreparePreschoolSeasonMemory(): void {
  const state = martialPreschoolState(5);
  const plan = preparePreschoolSeasonMemory(state, () => 0);
  assert(plan.entries.length === PRESCHOOL_SEASON_MEMORY_ENTRY_COUNT, 'season card packs three beats');
  assert(plan.headline === '5岁这一季', `unexpected season headline: ${plan.headline}`);
  assert(plan.body.split('\n\n').length === 3, 'season body contains three narrative beats');
  assert(plan.entries.every(entry => !isPreschoolGap(entry)), 'season with enough authored pool must not use generic gap');
  const authoredIds = plan.entries.map(entry => entry.id);
  assert(new Set(authoredIds).size === 3, 'season authored entry IDs must be distinct');
  assert(
    plan.entries.every(entry => !isForeignExclusivePreschoolEntry(entry, 'martial')),
    'season must not surface foreign exclusive origin content',
  );
  assert((state.eventHistory ?? []).length === 0, 'preparing the season card does not mutate gameplay state');
  const result = commitAnnualPassiveMemory(state, plan);
  assert((state.eventHistory ?? []).length === 3, 'all three season beats remain traceable');
  assert(result.entryIds.length === 3, 'commit records three entry ids');
}

function testApprovedCapacityEntriesAreConsumedBeforeGap(): void {
  const age5ApprovedIds = new Set([
    'preschool_neutral_peer_repair',
    'preschool_neutral_entrusted_task',
    'preschool_neutral_find_way_back',
    'preschool_neutral_care_sick_family',
  ]);
  const state = martialPreschoolState(5);
  const age5Entries = getPreschoolPassiveEntries(5);
  const legalEntries = age5Entries.filter(
    entry =>
      isNeutralOnlyPreschoolEntry(entry) ||
      (entry.originTags.includes('martial') && !isNeutralOnlyPreschoolEntry(entry)),
  );
  state.eventHistory = legalEntries
    .filter(entry => !age5ApprovedIds.has(entry.id))
    .map(entry => ({ eventId: entry.id, age: 5 }));
  const historyBeforePrepare = JSON.stringify(state.eventHistory);

  const plan = preparePreschoolSeasonMemory(state, () => 0);
  const ids = plan.entries.map(entry => entry.id);

  assert(plan.entries.length === 3, 'season remains three beats');
  assert(plan.entries.every(entry => !isPreschoolGap(entry)), 'authored entries precede gap');
  assert(ids.every(id => age5ApprovedIds.has(id)), 'all beats use age-5 approved capacity');
  assert(new Set(ids).size === 3, 'new authored IDs are distinct within the season');
  assert(
    plan.entries.every(entry => !isForeignExclusivePreschoolEntry(entry, 'martial')),
    'new season does not surface foreign canonical-origin content',
  );
  assert(
    JSON.stringify(state.eventHistory) === historyBeforePrepare,
    'preparing the season does not mutate input history',
  );
}

function testApprovedResidualCapacityEntriesAreConsumedBeforeGap(): void {
  const residualIds = new Set([
    'preschool_neutral_fair_play',
    'preschool_neutral_self_made_project',
    'preschool_neutral_stand_for_peer',
    'preschool_neutral_first_farewell',
    'preschool_neutral_neighborhood_help',
  ]);
  const state = martialPreschoolState(6);
  const legalEntries = getPreschoolPassiveEntries(6).filter(
    entry =>
      isNeutralOnlyPreschoolEntry(entry) ||
      (entry.originTags.includes('martial') && !isNeutralOnlyPreschoolEntry(entry)),
  );
  state.eventHistory = legalEntries
    .filter(entry => !residualIds.has(entry.id))
    .map(entry => ({ eventId: entry.id, age: 6 }));
  const historyBeforePrepare = JSON.stringify(state.eventHistory);

  const plan = preparePreschoolSeasonMemory(state, () => 0);
  const ids = plan.entries.map(entry => entry.id);

  assert(plan.entries.length === 3, 'residual capacity season remains three beats');
  assert(plan.entries.every(entry => !isPreschoolGap(entry)), 'residual authored entries precede gap');
  assert(ids.every(id => residualIds.has(id)), 'all beats use residual approved capacity');
  assert(new Set(ids).size === 3, 'residual authored IDs are distinct within the season');
  assert(
    plan.entries.every(entry => !isForeignExclusivePreschoolEntry(entry, 'martial')),
    'residual season does not surface foreign canonical-origin content',
  );
  assert(
    JSON.stringify(state.eventHistory) === historyBeforePrepare,
    'preparing residual season does not mutate input history',
  );
}

/** Case A: exhausted origin pool must still consume remaining authored neutrals before any gap. */
function testPreparePreschoolSeasonMemoryConsumesNeutralBeforeGap(): void {
  const state = martialPreschoolState(5);
  const age5Entries = getPreschoolPassiveEntries(5);
  const martialOrigins = age5Entries.filter(
    entry => entry.originTags.includes('martial') && !isNeutralOnlyPreschoolEntry(entry),
  );
  const neutralEntries = age5Entries.filter(isNeutralOnlyPreschoolEntry);
  assert(martialOrigins.length > 0, 'season exhaustion fixture has martial origin entries');
  assert(neutralEntries.length >= 3, 'season exhaustion fixture keeps at least three authored neutrals');
  state.eventHistory = [
    ...martialOrigins.map(entry => ({ eventId: entry.id, age: 5 })),
    ...neutralEntries.slice(0, Math.max(0, neutralEntries.length - 3)).map(entry => ({
      eventId: entry.id,
      age: 5,
    })),
  ];
  const remainingNeutralIds = new Set(
    neutralEntries
      .filter(entry => !(state.eventHistory ?? []).some(record => record.eventId === entry.id))
      .map(entry => entry.id),
  );
  assert(remainingNeutralIds.size >= 3, 'fixture leaves at least three unconsumed neutrals');
  const historyBeforePrepare = JSON.stringify(state.eventHistory);

  const plan = preparePreschoolSeasonMemory(state, () => 0);

  assert(plan.entries.length === 3, 'season still packs three beats after origin exhaustion');
  assert(
    plan.entries.every(entry => !isPreschoolGap(entry)),
    'season must consume remaining authored neutral entries before any generic gap',
  );
  assert(
    plan.entries.every(entry => remainingNeutralIds.has(entry.id)),
    'all three beats must come from the remaining authored neutral pool',
  );
  assert(new Set(plan.entries.map(entry => entry.id)).size === 3, 'remaining neutrals must stay distinct');
  assert(JSON.stringify(state.eventHistory) === historyBeforePrepare, 'preparing season memory does not mutate input history');
}

/**
 * Case B: soft origin affinity must not become hard origin-first quota.
 * With only one matching-origin and one neutral left, deterministic random can still pick neutral first.
 */
function testPreparePreschoolSeasonMemoryNeutralFirstClassWithOriginPresent(): void {
  const state = martialPreschoolState(5);
  const age5Entries = getPreschoolPassiveEntries(5);
  const martialOrigins = age5Entries.filter(
    entry => entry.originTags.includes('martial') && !isNeutralOnlyPreschoolEntry(entry),
  );
  const neutralEntries = age5Entries.filter(isNeutralOnlyPreschoolEntry);
  assert(martialOrigins.length > 0, 'neutral-first-class fixture has martial origin entries');
  assert(neutralEntries.length > 0, 'neutral-first-class fixture has neutral entries');

  const remainingOrigin = martialOrigins[martialOrigins.length - 1]!;
  const remainingNeutral = neutralEntries[neutralEntries.length - 1]!;
  state.eventHistory = [
    ...martialOrigins.filter(entry => entry.id !== remainingOrigin.id).map(entry => ({ eventId: entry.id, age: 5 })),
    ...neutralEntries.filter(entry => entry.id !== remainingNeutral.id).map(entry => ({ eventId: entry.id, age: 5 })),
  ];

  const orderedPair = age5Entries.filter(
    entry => entry.id === remainingOrigin.id || entry.id === remainingNeutral.id,
  );
  assert(orderedPair.length === 2, 'remaining authored pair must both remain in age catalog order');
  const random =
    orderedPair[0]!.id === remainingNeutral.id
      ? () => 0
      : () => 0.999999;

  const plan = preparePreschoolSeasonMemory(state, random);

  assert(plan.entries[0]!.id === remainingNeutral.id, `first beat must remain able to select remaining neutral, got ${plan.entries[0]!.id}`);
  assert(plan.entries[1]!.id === remainingOrigin.id, `second beat must consume remaining matching-origin, got ${plan.entries[1]!.id}`);
  assert(isPreschoolGap(plan.entries[2]!), `third beat may gap only after whole-pool exhaustion, got ${plan.entries[2]!.id}`);
}

/**
 * Case C: recent-title preference may empty preferred pool, but must fall back to the sole remaining authored entry.
 */
function testPreparePreschoolSeasonMemoryTitlePreferenceDoesNotForceGap(): void {
  const state = martialPreschoolState(5);
  const age5Entries = getPreschoolPassiveEntries(5);
  const martialOrigins = age5Entries.filter(
    entry => entry.originTags.includes('martial') && !isNeutralOnlyPreschoolEntry(entry),
  );
  const neutralEntries = age5Entries.filter(isNeutralOnlyPreschoolEntry);
  const remaining = neutralEntries[0]!;
  assert(Boolean(remaining), 'title-preference fixture needs one remaining authored neutral');

  state.eventHistory = [
    ...martialOrigins.map(entry => ({ eventId: entry.id, age: 5 })),
    ...neutralEntries.filter(entry => entry.id !== remaining.id).map(entry => ({ eventId: entry.id, age: 5 })),
  ];
  state.flags = {
    ...(state.flags ?? {}),
    p16_passive_title_history: [remaining.title],
  };
  const historyIds = new Set((state.eventHistory ?? []).map(record => record.eventId));

  const plan = preparePreschoolSeasonMemory(state, () => 0);

  assert(plan.entries[0]!.id === remaining.id, `sole remaining authored entry must win over title preference, got ${plan.entries[0]!.id}`);
  assert(isPreschoolGap(plan.entries[1]!), `second beat gaps only after whole-pool exhaustion, got ${plan.entries[1]!.id}`);
  assert(isPreschoolGap(plan.entries[2]!), `third beat gaps only after whole-pool exhaustion, got ${plan.entries[2]!.id}`);
  assert(
    plan.entries.every(entry => isPreschoolGap(entry) || !historyIds.has(entry.id)),
    'season must not reuse any authored id already present in eventHistory',
  );
}

async function testHeadlessSeasonAdvance(): Promise<void> {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '一季三笔',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 21,
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = 5;
  snapshot.state.flags = { ...(snapshot.state.flags ?? {}), origin_wuxia_family: true };
  snapshot.state.player.flags = { ...(snapshot.state.player.flags ?? {}), origin_wuxia_family: true };
  snapshot.state.currentTime = { year: 6, month: 1, day: 1 };
  const session = HeadlessEngineSessionImpl.create({ snapshot });

  session.ensurePassivePresentation();
  const before = session.getProgressionVolatileState();
  assert(before.passiveNarrative?.title === '5岁这一季', 'the visible node is the packed season card');
  assert(before.annualPassiveMemory?.entries.length === 3, 'volatile state keeps three displayed entries');
  await session.acknowledgeProgression('passive_continue');
  const after = session.getProgressionVolatileState();
  assert(after.pendingPeriodSummary?.headline === '5岁这一季', 'ack surfaces the packed season as period summary');
  assert(session.getRuntimeState().currentTime?.month === 4, 'season ack advances three months on the calendar');
  assert(session.getRuntimeState().player.age === 5, 'one season acknowledgement does not consume a whole year');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAnnualPassiveMemoryTests()
    .then(() => console.log('annualPassiveMemoryTests: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
