import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { useNewGameEngine } from '../src/composables/useNewGameEngine';
import { gameEngine } from '../src/core/GameEngineIntegration';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import {
  assertCanonicalGameState,
  CanonicalValidationError,
} from '../src/contracts/validation/canonicalGameStateValidation';

function snapshotOptions(sourcePlatform: 'web-browser' | 'node-headless') {
  return {
    eventCatalogVersion: '1.0.0',
    sourcePlatform,
    time: { now: () => 1717200000000 },
  } as const;
}

function assertCanonicalPass(state: Parameters<typeof assertCanonicalGameState>[0], label: string): void {
  assert.doesNotThrow(() => assertCanonicalGameState(state), label);
}

function assertCanonicalRejects(state: Parameters<typeof assertCanonicalGameState>[0], label: string): void {
  assert.throws(
    () => assertCanonicalGameState(state),
    error => error instanceof CanonicalValidationError && /undefined is not valid JSON/.test(error.message),
    label,
  );
}

function runBrowserPassiveTick(currentTime: { year: number; month: number; day: number } | undefined) {
  const ui = useNewGameEngine();
  ui.restartGame();
  const state = ui.getGameState();
  state.player.age = 4;
  if (currentTime) state.currentTime = { ...currentTime };
  else delete state.currentTime;

  const originalAdvanceTime = gameEngine.advanceTime;
  gameEngine.advanceTime = (() => undefined) as typeof gameEngine.advanceTime;
  try {
    ui.engineState.isPassiveProgressionMode = true;
    ui.engineState.passiveNarrative = { title: '测试', text: '测试' };
    ui.continueProgressionFlow();
  } finally {
    gameEngine.advanceTime = originalAdvanceTime;
  }

  const record = state.eventHistory[state.eventHistory.length - 1];
  assert(record, 'browser passive path should append an EventRecord');
  return { state, record };
}

async function runHeadlessPassiveTick(currentTime: { year: number; month: number; day: number } | undefined) {
  const session = HeadlessEngineSessionImpl.create({
    playerName: 'A4.1',
    gender: 'male',
    randomSeed: 101,
    catalogVersion: '1.0.0',
  });
  const state = session.getRuntimeState();
  state.player.age = 4;
  if (currentTime) state.currentTime = { ...currentTime };
  else delete state.currentTime;

  const engine = (session as unknown as { engine: GameEngineIntegration }).engine;
  const originalAdvanceTime = engine.advanceTime;
  engine.advanceTime = (() => undefined) as typeof engine.advanceTime;
  try {
    session.ensurePassivePresentation();
    assert.equal(session.getSessionPhase(), 'passive_progression');
    await session.acknowledgeProgression('passive_continue');
  } finally {
    engine.advanceTime = originalAdvanceTime;
  }

  const record = state.eventHistory[state.eventHistory.length - 1];
  assert(record, 'headless passive path should append an EventRecord');
  return { state, record };
}

{
  const engine = new GameEngineIntegration();
  engine.setPlayerFeedbackMessage('hello');
  const state = engine.getGameState();
  assert.equal(Object.prototype.hasOwnProperty.call(state, 'playerFeedbackMessage'), true);
  assert.equal(state.playerFeedbackMessage, 'hello');
  assertCanonicalPass(state, 'feedback message string must remain canonical');

  assert.equal(engine.consumePlayerFeedbackMessage(), 'hello');
  assert.equal(Object.prototype.hasOwnProperty.call(state, 'playerFeedbackMessage'), false);
  assertCanonicalPass(state, 'consumed feedback message must be omitted');
  assert.doesNotThrow(() => defaultSnapshotConverter.toSnapshot(state, snapshotOptions('web-browser')));

  engine.setPlayerFeedbackMessage('hello');
  engine.setPlayerFeedbackMessage(null);
  assert.equal(Object.prototype.hasOwnProperty.call(state, 'playerFeedbackMessage'), false);
  assertCanonicalPass(state, 'null feedback message must be omitted');
  assert.doesNotThrow(() => defaultSnapshotConverter.toSnapshot(state, snapshotOptions('web-browser')));

  assert.equal(engine.consumePlayerFeedbackMessage(), null);
  assert.equal(Object.prototype.hasOwnProperty.call(state, 'playerFeedbackMessage'), false);
  assertCanonicalPass(state, 'consuming absent feedback message must remain canonical');
}

{
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  state.playerFeedbackMessage = undefined;
  assertCanonicalRejects(state, 'validator must continue rejecting feedback own undefined');
  state.playerFeedbackMessage = 'valid';
  state.eventHistory.push({ eventId: 'invalid-timestamp', timestamp: undefined });
  assertCanonicalRejects(state, 'validator must continue rejecting EventRecord own undefined');
}

const noTimeHeadless = await runHeadlessPassiveTick(undefined);
assert.equal(Object.prototype.hasOwnProperty.call(noTimeHeadless.record, 'timestamp'), false);
assertCanonicalPass(noTimeHeadless.state, 'headless EventRecord without currentTime must remain canonical');
assert.doesNotThrow(() => defaultSnapshotConverter.toSnapshot(noTimeHeadless.state, snapshotOptions('node-headless')));

const timedHeadless = await runHeadlessPassiveTick({ year: 3, month: 4, day: 5 });
assert.equal(Object.prototype.hasOwnProperty.call(timedHeadless.record, 'timestamp'), true);
assert.deepEqual(timedHeadless.record.timestamp, { year: 3, month: 4, day: 5 });
assert.notEqual(timedHeadless.record.timestamp, timedHeadless.state.currentTime);
assertCanonicalPass(timedHeadless.state, 'headless EventRecord with currentTime must remain canonical');

const noTimeBrowser = runBrowserPassiveTick(undefined);
assert.equal(Object.prototype.hasOwnProperty.call(noTimeBrowser.record, 'timestamp'), false);
assertCanonicalPass(noTimeBrowser.state, 'browser EventRecord without currentTime must remain canonical');
assert.doesNotThrow(() => defaultSnapshotConverter.toSnapshot(noTimeBrowser.state, snapshotOptions('web-browser')));

const timedBrowser = runBrowserPassiveTick({ year: 6, month: 7, day: 8 });
assert.equal(Object.prototype.hasOwnProperty.call(timedBrowser.record, 'timestamp'), true);
assert.deepEqual(timedBrowser.record.timestamp, { year: 6, month: 7, day: 8 });
assert.notEqual(timedBrowser.record.timestamp, timedBrowser.state.currentTime);
assertCanonicalPass(timedBrowser.state, 'browser EventRecord with currentTime must remain canonical');

console.log('✅ Canonical undefined property elimination tests passed');
