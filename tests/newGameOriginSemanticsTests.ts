/** New-game birth background semantics: production and debug share one resolver. */
import { EventExecutor } from '../src/core/EventExecutor';
import { eventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import {
  getCanonicalBirthBackground,
  resolveBirthBackground,
} from '../src/p16/canonicalBirthBackground';
import { resolveChildhoodActionPalette } from '../src/p16/childhoodAgency';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertNoBirthBackground(state: GameState, label: string): void {
  assert(state.facts?.birth_background === undefined, `${label}: new game must not resolve birth background early`);
}

async function testProductionOriginEventResolvesCanonicalBackground(): Promise<void> {
  const event = eventLoader.getEventById('origin_background');
  assert(event?.eventType === 'auto', 'origin_background must be automatic in production');
  assert(!event?.choices?.length, 'origin_background must not expose independent birth fact choices');

  const engine = new GameEngineIntegration();
  engine.startNewGame('出生背景', 'male');
  assertNoBirthBackground(engine.getGameState(), 'before origin event');
  const state = await new EventExecutor().executeEffects(event?.autoEffects ?? [], engine.getGameState());
  assert(getCanonicalBirthBackground(state) !== null, 'production path must resolve a legal background');
  assert(state.facts.birth_background !== undefined, 'production path must persist canonical background');
  assert(state.player.events?.filter(record => record.eventId.startsWith('origin_')).length === 1, 'production path must write one origin compatibility record');
}

function testDebugOverrideUsesSameResolver(): void {
  const engine = new GameEngineIntegration();
  engine.startNewGame('调试背景', 'male');
  const state = resolveBirthBackground(engine.getGameState(), { override: 'merchant_house', random: () => 0 });
  assert(state.facts.birth_background === 'merchant_house', 'debug override must select the requested background');
  assert(state.player.wealthCapacity === 'comfortable_means', 'merchant background effect must be applied by the shared resolver');
  assert(!state.flags.origin_wuxia_family, 'debug override must not create a second martial origin');
  const palette = resolveChildhoodActionPalette({ age: 6, player: state.player, flags: state.flags });
  assert(palette.some(action => action.id === 'action_household_errand'), 'merchant childhood gate must read canonical background');
}

async function testHeadlessProductionPathDoesNotCreateDualOriginFacts(): Promise<void> {
  const session = HeadlessEngineSessionImpl.create({
    playerName: '链路探针',
    gender: 'male',
    randomSeed: 70003,
  });
  assertNoBirthBackground(session.getRuntimeState(), 'headless before progression');
  await session.progressAutomatic({ maxSteps: 8 });
  const state = session.getRuntimeState();
  assert(getCanonicalBirthBackground(state) !== null, 'headless production progression must resolve background');
  assert(state.player.events?.filter(record => record.eventId.startsWith('origin_')).length === 1, 'headless progression must not create a second origin fact');
}

export async function runNewGameOriginSemanticsTests(): Promise<void> {
  await testProductionOriginEventResolvesCanonicalBackground();
  testDebugOverrideUsesSameResolver();
  await testHeadlessProductionPathDoesNotCreateDualOriginFacts();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runNewGameOriginSemanticsTests()
    .then(() => console.log('newGameOriginSemanticsTests: ok'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
