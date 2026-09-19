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
import { useNewGameEngine } from '../src/composables/useNewGameEngine';
import { GameEngineIntegration, gameEngine } from '../src/core/GameEngineIntegration';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
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

  const browser = useNewGameEngine();
  browser.engineState.annualPassiveMemory = prepareAnnualPassiveMemory(merchantInfantState(1), () => 0);
  browser.restartGame();
  assert(browser.engineState.annualPassiveMemory === null, 'browser reset clears annual plan');
}

async function testBrowserAnnualMemoryPreemptsLegacyInfantEvents(): Promise<void> {
  const previousAnimationFrame = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = callback =>
    setTimeout(() => callback(Date.now()), 0) as unknown as number;
  const browser = useNewGameEngine();
  try {
    gameEngine.applyGameState(merchantInfantState(1));
    browser.engineState.currentEvent = null;
    browser.engineState.availableChoices = [];
    browser.engineState.annualPassiveMemory = null;
    browser.engineState.passiveNarrative = null;

    browser.getNextEvent();

    assert(browser.engineState.isPassiveProgressionMode, 'merchant age 1 enters annual passive progression');
    assert(browser.engineState.currentEvent === null, 'merchant age 1 does not select a legacy childhood event');
    assert(browser.engineState.passiveNarrative?.title === '1岁这一年', 'merchant age 1 shows its annual memory');

    browser.continueProgressionFlow();
    assert(browser.getGameState().player.age === 2, 'one annual acknowledgement reaches age 2');
    assert(browser.engineState.passiveNarrative?.title === '2岁这一年', 'the next visible node is age 2 annual memory');
  } finally {
    globalThis.requestAnimationFrame = previousAnimationFrame;
  }
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
  testPreparePreschoolSeasonMemory();
  testPreparePreschoolSeasonMemoryConsumesNeutralBeforeGap();
  testPreparePreschoolSeasonMemoryNeutralFirstClassWithOriginPresent();
  testPreparePreschoolSeasonMemoryTitlePreferenceDoesNotForceGap();

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
  await testBrowserAnnualMemoryPreemptsLegacyInfantEvents();
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
