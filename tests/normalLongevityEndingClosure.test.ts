import { EndingSystem } from '../src/core/EndingSystem';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { eventLoader } from '../src/core/EventLoader';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function getOrdinaryLifeEvent() {
  const event = eventLoader.getEventById('ordinary_life');
  assert(Boolean(event), 'formal EventLoader must load ordinary_life');
  return event!;
}

async function testFormalOrdinaryLifeEffect(): Promise<void> {
  const event = getOrdinaryLifeEvent();
  assert(event.eventType === 'ending', 'ordinary_life remains an ending event');
  assert(event.ageRange.min === 80 && event.ageRange.max === 80, 'ordinary_life age gate remains 80');
  assert(
    event.autoEffects?.some(effect => effect.type === 'special' && effect.target === 'end_game'),
    'ordinary_life must use the canonical end_game effect',
  );

  const engine = new GameEngineIntegration();
  engine.startNewGame('寿终测试', 'male');
  engine.setPlayerAttributes({ age: 80 });
  await engine.executeAutoEvent(event);

  const state = engine.getGameState();
  assert(state.player?.alive === false, 'ordinary_life must mark the player dead');
  assert(Boolean(state.ending), 'ordinary_life must produce canonical ending');
  assert(state.flags?.gameEnded === true, 'ordinary_life must set gameEnded');
  assert(state.flags?.ending_triggered === true, 'ordinary_life must set ending_triggered');
  assert(
    state.ending?.id === EndingSystem.determineEnding(state).id,
    'ordinary_life must reuse EndingSystem result',
  );
  assert(
    state.eventHistory?.filter(record => record.eventId === 'ordinary_life').length === 1,
    'ordinary_life must be recorded once',
  );
}

async function testHeadlessTerminalAndSnapshotClosure(): Promise<void> {
  const session = HeadlessEngineSessionImpl.create({
    playerName: 'Headless寿终测试',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 801,
  });
  const state = session.getRuntimeState();
  state.player!.age = 80;
  state.currentTime = { year: 80, month: 1, day: 1 };
  state.pendingStoryEventId = 'ordinary_life';

  await session.hydrate(session.serialize());
  const progress = await session.progressAutomatic();
  assert(progress.stoppedReason === 'terminal', 'headless must stop ordinary_life at terminal');
  assert(progress.stepsExecuted === 1, 'ordinary_life must execute once in headless session');
  assert(session.getSessionPhase() === 'terminal', 'headless session phase must be terminal');
  assert(session.getRuntimeState().ending !== undefined, 'headless runtime must retain ending');
  assert(
    session.getRuntimeState().eventHistory?.filter(record => record.eventId === 'ordinary_life').length === 1,
    'headless ordinary_life history must contain one record',
  );

  const terminalSnapshot = session.serialize();
  const restored = HeadlessEngineSessionImpl.create({ snapshot: terminalSnapshot });
  assert(restored.getSessionPhase() === 'terminal', 'restored terminal snapshot must remain terminal');
  assert(restored.getTerminalState()?.endingId, 'restored terminal snapshot must retain ending');
  const repeated = await restored.progressAutomatic();
  assert(repeated.stoppedReason === 'terminal' && repeated.stepsExecuted === 0, 'terminal ack must be idempotent');
}

async function main(): Promise<void> {
  process.env.WUXIA_ENGINE_QUIET = '1';
  await testFormalOrdinaryLifeEffect();
  await testHeadlessTerminalAndSnapshotClosure();
  console.log('normalLongevityEndingClosure.test.ts: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
