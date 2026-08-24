import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';

function startState(name: string) {
  const engine = new GameEngineIntegration();
  engine.startNewGame(name, 'male');
  const state = engine.getGameState();
  state.player.traits = [];
  return { engine, state };
}

function availableIds(engine: GameEngineIntegration, age: number): Set<string> {
  return new Set(engine.getAvailableEvents(age).map(event => event.id));
}

function testBankruptEventRetiredFromCatalog(): void {
  assert.equal(
    EventLoader.getInstance().getEventById('merchant_ending_bankrupt'),
    undefined,
    'retired bankruptcy ending must not exist in the active EventLoader catalog',
  );

  for (const id of [
    'merchant_ending_tycoon',
    'merchant_ending_royal',
    'merchant_ending_chamber',
    'merchant_ending_hidden_wealth',
  ]) {
    assert(EventLoader.getInstance().getEventById(id), `${id} must remain active`);
  }
}

function testBankruptEventRemovedFromManifest(): void {
  const manifest = JSON.parse(
    fs.readFileSync(path.resolve('src/data/event-asset-manifest.json'), 'utf8'),
  ) as {
    events: Array<{ eventId: string; sourceFile: string; runtimeLoaded: boolean }>;
  };

  assert.equal(
    manifest.events.some(event => event.eventId === 'merchant_ending_bankrupt'),
    false,
    'retired bankruptcy ending must leave the event-asset manifest',
  );
}

function testLowWalletAloneCannotProduceBankruptcyEnding(): void {
  const { engine, state } = startState('Merchant Bankruptcy Retirement Low Wallet');
  state.player.age = 65;
  state.player.money = 0;
  state.flags.merchant_talent = true;
  state.player.flags.merchant_talent = true;

  const ids = availableIds(engine, 65);
  assert.equal(ids.has('merchant_ending_bankrupt'), false);
}

function testTycoonRemainsEligibleWithoutBankruptCompetition(): void {
  const { engine, state } = startState('Merchant Bankruptcy Retirement Tycoon');
  state.player.age = 70;
  state.player.money = 0;
  state.player.wealthCapacity = 'regional_magnate';
  state.flags.merchant_talent = true;
  state.player.flags.merchant_talent = true;
  state.flags.merchant_empire = true;
  state.player.flags.merchant_empire = true;

  const ids = availableIds(engine, 70);
  assert.equal(ids.has('merchant_ending_tycoon'), true);
  assert.equal(ids.has('merchant_ending_bankrupt'), false);
}

function testNoReplacementBankruptcyStateIntroduced(): void {
  const merchantSource = fs.readFileSync(path.resolve('src/data/lines/merchant.json'), 'utf8');
  assert.equal(merchantSource.includes('merchant_ending_bankrupt'), false);
  assert.equal(merchantSource.includes('ending_merchant_bankrupt'), false);
  assert.equal(merchantSource.includes('merchant_business_collapsed'), false);
  assert.equal(merchantSource.includes('merchant_bankrupt'), false);
}

function run(): void {
  testBankruptEventRetiredFromCatalog();
  testBankruptEventRemovedFromManifest();
  testLowWalletAloneCannotProduceBankruptcyEnding();
  testTycoonRemainsEligibleWithoutBankruptCompetition();
  testNoReplacementBankruptcyStateIntroduced();
  console.log('merchantBankruptEndingTemporaryRetirement.test.ts: ok');
}

run();
