import assert from 'node:assert/strict';
import { EventExecutor } from '../src/core/EventExecutor';
import { eventLoader } from '../src/core/EventLoader';
import { applySetbackEffects } from '../src/core/SetbackEventSystem';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import { collectFrustrationMetrics } from '../src/p8/collectPersonaMetrics';
import type { GameProcessRecord } from '../src/types/simulationRecordTypes';
import type { GameState, PlayerState } from '../src/types/eventTypes';

const EARLY_DEATH_REASON = '英年早逝';

function createState(): GameState {
  const player: PlayerState = {
    name: '英年早逝测试',
    gender: 'male',
    age: 28,
    martialPower: 0,
    chivalry: 0,
    charisma: 0,
    constitution: 50,
    knowledge: 0,
    money: 100,
    wealthCapacity: 'no_surplus',
    reputation: 0,
    connections: 0,
    healthStatus: 'healthy',
    statuses: [],
    alive: true,
    items: [],
    flags: {},
    events: [],
    relationships: [],
    businessAcumen: 0,
    influence: 0,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
    affiliation: null,
    title: null,
    spouse: null,
    children: 0,
    traits: [],
    lifeStates: {
      trainingHabit: 0,
      studyHabit: 0,
      businessHabit: 0,
    },
  };

  return {
    player,
    flags: {},
    relations: {},
    eventHistory: [],
    achievements: [],
    karma: { good_karma: 0, evil_karma: 0, history: [] },
  } as GameState;
}

function getCatalogEarlyDeath() {
  const event = eventLoader.getEventById('setback_early_death');
  assert.ok(event, 'catalog must contain setback_early_death');
  return event;
}

async function testCatalogEarlyDeathUsesCanonicalTerminalState(): Promise<void> {
  const event = getCatalogEarlyDeath();
  const before = createState();
  const after = await new EventExecutor().executeEffects(event.autoEffects ?? [], before);

  assert.equal(after.player.alive, false, 'catalog early death must mark player dead');
  assert.equal(after.player.deathReason, EARLY_DEATH_REASON, 'catalog early death must preserve its reason');
  assert.equal(after.flags.gameEnded, true, 'catalog early death must set gameEnded');
  assert.equal(after.flags.player_died, undefined, 'catalog early death must not write ghost player_died flag');
  assert.equal(after.flags.death_reason, undefined, 'catalog early death must not write ghost death_reason flag');
}

async function testEndLifeFailsClosedWithoutReason(): Promise<void> {
  await assert.rejects(
    () => new EventExecutor().executeEffects([{ type: 'special', target: 'end_life' }], createState()),
    /death reason/i,
  );
  await assert.rejects(
    () => new EventExecutor().executeEffects(
      [{ type: 'special', target: 'end_life', value: '   ' }],
      createState(),
    ),
    /death reason/i,
  );
}

async function testCatalogAndDifficultyEarlyDeathParity(): Promise<void> {
  const catalogEvent = getCatalogEarlyDeath();
  const catalogState = await new EventExecutor().executeEffects(
    catalogEvent.autoEffects ?? [],
    createState(),
  );
  const difficultyState = applySetbackEffects(createState(), 'early_death');

  assert.deepEqual(
    {
      alive: catalogState.player.alive,
      deathReason: catalogState.player.deathReason,
      gameEnded: catalogState.flags.gameEnded,
    },
    {
      alive: difficultyState.player.alive,
      deathReason: difficultyState.player.deathReason,
      gameEnded: difficultyState.flags.gameEnded,
    },
    'catalog and difficulty early death must share terminal lifecycle state',
  );
}

async function testHeadlessStopsAfterCatalogEarlyDeath(): Promise<void> {
  const session = HeadlessEngineSessionImpl.create({
    playerName: 'Headless英年早逝测试',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 801,
  });
  const state = session.getRuntimeState();
  state.player.age = 28;
  state.player.constitution = 50;
  state.currentTime = { year: 28, month: 1, day: 1 };
  state.pendingStoryEventId = 'setback_early_death';

  await session.hydrate(session.serialize());
  const progress = await session.progressAutomatic({ maxSteps: 2 });

  assert.equal(progress.stepsExecuted, 1, 'headless must execute catalog early death once');
  assert.equal(progress.stoppedReason, 'terminal', 'headless must stop at catalog early death');
  assert.equal(session.getSessionPhase(), 'terminal', 'catalog early death must not enter active progression');
  assert.deepEqual(session.getPlanningOptions(), [], 'terminal session must expose no active actions');
  assert.deepEqual(session.getTerminalState(), {
    isTerminal: true,
    isAlive: false,
    deathReason: EARLY_DEATH_REASON,
    age: 28,
  });
}

function testLifeDomainMetricsRecognizeEndLife(): void {
  const before = createState();
  const after = createState();
  after.player.alive = false;
  after.player.deathReason = EARLY_DEATH_REASON;
  after.flags.gameEnded = true;
  const record: GameProcessRecord = {
    age: 28,
    eventId: 'setback_early_death',
    eventTitle: EARLY_DEATH_REASON,
    eventText: '你的生命在这一刻画上了句号。',
    eventType: 'auto',
    progressionKind: 'story_event',
    gameState: after,
    timestamp: '2026-08-18T00:00:00.000Z',
    outcomeEvidence: {
      stateBefore: before,
      stateAfter: after,
      executedEffects: [{ type: 'special', target: 'end_life', value: EARLY_DEATH_REASON }],
    },
  };

  const metrics = collectFrustrationMetrics([record]);
  assert.equal(metrics.setbacks.length, 1, 'end_life must remain a life-domain setback');
}

await testCatalogEarlyDeathUsesCanonicalTerminalState();
await testEndLifeFailsClosedWithoutReason();
await testCatalogAndDifficultyEarlyDeathParity();
await testHeadlessStopsAfterCatalogEarlyDeath();
testLifeDomainMetricsRecognizeEndLife();
console.log('earlyDeathTerminalConsistency.test.ts: ok');
