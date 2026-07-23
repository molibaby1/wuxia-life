/**
 * New-game origin semantics: headless must match browser (no preset four-main origin).
 */
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../src/contracts/choiceExecution';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { EventExecutor } from '../src/core/EventExecutor';
import { eventLoader } from '../src/core/EventLoader';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import {
  PRIMARY_ORIGIN_FAMILY_FLAGS,
  resolvePrimaryOriginFamilyFlag,
} from '../src/p16/primaryOriginFlag';
import { PRIMARY_ORIGIN_TO_ORIGIN_ID } from '../src/p16/primaryOriginTraitBridge';
import { resolveChildhoodActionPalette } from '../src/p16/childhoodAgency';
import type { GameState } from '../src/types/eventTypes';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertNoPrimaryOrigin(state: GameState, label: string): void {
  for (const flag of PRIMARY_ORIGIN_FAMILY_FLAGS) {
    assert(!state.flags?.[flag], `${label}: top-level ${flag} must be absent`);
    assert(!state.player?.flags?.[flag], `${label}: player.${flag} must be absent`);
  }
  assert(!state.flags?.origin_id, `${label}: origin_id must be unset`);
  assert(!('traitProfile' in (state.player ?? {})), `${label}: traitProfile must be absent`);
}

function testFreshEngineGameHasNoPresetPrimaryOrigin(): void {
  const engine = new GameEngineIntegration();
  engine.startNewGame('语义探针', 'male');
  assertNoPrimaryOrigin(engine.getGameState(), 'GameEngineIntegration.startNewGame');
  assert(
    engine.getGameState().player?.traits.length === 3,
    'new game should assign three canonical traits',
  );
}

function testHeadlessCreateMatchesBrowserSemantics(): void {
  const session = HeadlessEngineSessionImpl.create({
    playerName: '语义探针',
    gender: 'female',
    randomSeed: 4242,
  });
  assertNoPrimaryOrigin(session.getRuntimeState(), 'HeadlessEngineSessionImpl.create');
}

async function testOriginBackgroundMerchantSyncsTraitAndOpensGate(): Promise<void> {
  const event = eventLoader.getEventById('origin_background');
  assert(Boolean(event), 'origin_background must exist');
  const choice = event!.choices?.find(c => c.id === 'origin_merchant_family');
  assert(Boolean(choice), 'origin_merchant_family choice must exist');

  const executor = new EventExecutor();
  const engine = new GameEngineIntegration();
  engine.startNewGame('商贾', 'male');
  const before = engine.getGameState();
  assertNoPrimaryOrigin(before, 'pre-choice');

  const after = await executor.executeEffects(choice!.effects ?? [], before);
  engine.applyGameState(after);

  const state = engine.getGameState();
  assert(
    resolvePrimaryOriginFamilyFlag(state) === 'origin_merchant_family',
    'primary origin must be merchant flag after choice',
  );
  assert(
    state.flags?.origin_id === PRIMARY_ORIGIN_TO_ORIGIN_ID.origin_merchant_family,
    'origin_id must sync from origin_background choice',
  );
  assert(state.flags?.origin_id === 'merchant_house', 'origin_id must mirror trait origin');

  const palette = resolveChildhoodActionPalette({
    age: 6,
    player: state.player,
    flags: state.flags,
  });
  assert(
    palette.some(action => action.id === 'action_household_errand'),
    'merchant childhood gate must open from flag-only canonical path after origin_background',
  );
}

function testTraitOnlyMerchantDoesNotOpenChildhoodGate(): void {
  const palette = resolveChildhoodActionPalette({
    age: 6,
    player: { traits: [] } as never,
    flags: {},
  });
  assert(
    !palette.some(action => action.id === 'action_household_errand'),
    'trait-only merchant_house without primary flag must not open merchant childhood gate',
  );
}

async function testHeadlessExecuteOriginBackgroundSyncsTrait(): Promise<void> {
  const session = HeadlessEngineSessionImpl.create({
    playerName: '链路探针',
    gender: 'male',
    randomSeed: 70003,
  });
  assertNoPrimaryOrigin(session.getRuntimeState(), 'headless pre-origin');

  await session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: session.serialize() },
    action: { eventId: 'origin_background', choiceId: 'origin_merchant_family' },
  });

  const state = session.getRuntimeState();
  assert(
    resolvePrimaryOriginFamilyFlag(state) === 'origin_merchant_family',
    'headless executeChoice must set merchant primary flag',
  );
  assert(
    state.flags?.origin_id === 'merchant_house',
    'headless executeChoice must sync origin_id after origin_background',
  );
}

export async function runNewGameOriginSemanticsTests(): Promise<void> {
  testFreshEngineGameHasNoPresetPrimaryOrigin();
  testHeadlessCreateMatchesBrowserSemantics();
  await testOriginBackgroundMerchantSyncsTraitAndOpensGate();
  testTraitOnlyMerchantDoesNotOpenChildhoodGate();
  await testHeadlessExecuteOriginBackgroundSyncsTrait();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runNewGameOriginSemanticsTests()
    .then(() => console.log('newGameOriginSemanticsTests: ok'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
