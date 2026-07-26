import {
  ANNUAL_PASSIVE_MEMORY_ENTRY_COUNT,
  commitAnnualPassiveMemory,
  isAnnualPassiveMemoryAge,
  prepareAnnualPassiveMemory,
} from '../src/core/activePlanning/annualPassiveMemory';
import { reactive } from 'vue';
import { useNewGameEngine } from '../src/composables/useNewGameEngine';
import { gameEngine } from '../src/core/GameEngineIntegration';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import type { GameState, PlayerState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function merchantInfantState(age = 0): GameState {
  return {
    player: {
      age,
      comprehension: 10,
      constitution: 10,
      healthStatus: 'healthy',
      statuses: [],
      businessAcumen: 4,
      connections: 2,
      flags: {},
      traits: [],
    } as PlayerState,
    flags: { origin_merchant_family: true, origin_id: 'merchant_house' },
    currentTime: { year: 1, month: 2, day: 3 },
    eventHistory: [],
  } as GameState;
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
  testPrepareAnnualPassiveMemoryWithReactiveState();

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
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAnnualPassiveMemoryTests()
    .then(() => console.log('annualPassiveMemoryTests: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
