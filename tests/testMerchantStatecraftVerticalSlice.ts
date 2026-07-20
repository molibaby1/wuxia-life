import { EndingSystem } from '../src/core/EndingSystem';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { IdentitySystem } from '../src/core/IdentitySystem';
import { RouteStateManager } from '../src/core/RouteStateManager';

function merchantEngine() {
  const engine = new GameEngineIntegration();
  engine.startNewGame('经世测试', 'male');
  const state = engine.getGameState();
  state.player.age = 16;
  state.player.money = 100;
  state.player.flags = { ...(state.player.flags || {}) };
  state.flags = { ...(state.flags || {}) };
  return engine;
}

async function run(): Promise<void> {
  const loader = EventLoader.getInstance();
  const talent = loader.getEventById('merchant_talent_discovery');
  const shop = loader.getEventById('merchant_first_shop');
  const studyBusiness = talent?.choices?.find(choice => choice.id === 'study_business');
  const openGrocery = shop?.choices?.find(choice => choice.id === 'open_grocery_shop');

  if (!studyBusiness || !openGrocery) {
    throw new Error('merchant commitment/proof choices missing');
  }

  const engine = merchantEngine();
  let state = engine.getGameState();
  await engine.executeChoiceEffects(studyBusiness.effects ?? [], talent.id, studyBusiness.id);
  state = engine.getGameState();
  if (RouteStateManager.readRoadStage(state, 'statecraft') !== 'active') {
    throw new Error('study_business should commit the statecraft road');
  }

  await engine.executeChoiceEffects(openGrocery.effects ?? [], shop.id, openGrocery.id);
  state = engine.getGameState();
  if (RouteStateManager.readRoadStage(state, 'statecraft') !== 'locked_in') {
    throw new Error('opening a merchant shop should prove and lock statecraft');
  }

  const restoredEngine = new GameEngineIntegration();
  restoredEngine.loadGameState(JSON.parse(JSON.stringify(state)));
  if (RouteStateManager.readRoadStage(restoredEngine.getGameState(), 'statecraft') !== 'locked_in') {
    throw new Error('loadGameState must preserve the canonical road commitment');
  }

  const autoEngine = merchantEngine();
  await autoEngine.executeChoiceEffects(studyBusiness.effects ?? [], talent.id, studyBusiness.id);
  await autoEngine.executeAutoEvent({
    ...shop,
    id: 'merchant_auto_proof_regression',
    eventType: 'auto',
    autoEffects: [{
      type: 'road_lifecycle',
      roadId: 'statecraft',
      roadAction: 'proof',
      event: 'merchant_auto_proof',
    }],
  });
  if (RouteStateManager.readRoadStage(autoEngine.getGameState(), 'statecraft') !== 'locked_in') {
    throw new Error('automatic events must preserve and advance the canonical road commitment');
  }

  const identityState = IdentitySystem.recordIdentity({
    ...state,
    player: {
      ...state.player,
      money: 5000,
      flags: { ...(state.player.flags || {}), business_empire: true },
    },
  }, 'merchant');
  if (!identityState.identity?.identities.includes('merchant')) {
    throw new Error('merchant identity should remain independently recordable');
  }
  if (RouteStateManager.readRoadStage(identityState, 'statecraft') !== 'locked_in') {
    throw new Error('recording merchant identity must not replace statecraft');
  }

  engine.reset();
  if (RouteStateManager.readRoadStage(engine.getGameState(), 'statecraft') !== 'inactive') {
    throw new Error('reset must clear the canonical road commitment');
  }

  const reputationEngine = new GameEngineIntegration();
  reputationEngine.startNewGame('声望测试', 'male');
  const reputationState = (await reputationEngine.executeChoiceEffects([
    { type: 'stat_modify', stat: 'reputation', value: 20 },
  ])).gameState;
  if (RouteStateManager.readRoadStage(reputationState, 'statecraft') !== 'inactive') {
    throw new Error('reputation alone must not advance statecraft');
  }

  const moneyOnly = merchantEngine().getGameState();
  moneyOnly.player.age = 70;
  moneyOnly.player.money = 10000;
  moneyOnly.player.businessAcumen = 100;
  moneyOnly.player.flags = { business_empire: true };
  if (EndingSystem.canUnlockEnding(moneyOnly, 'richest_man')) {
    throw new Error('money and merchant flags alone must not unlock richest_man');
  }

  console.log('US-006 merchant statecraft vertical slice passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
