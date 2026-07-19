import { EndingSystem } from '../src/core/EndingSystem';
import { EventExecutor } from '../src/core/EventExecutor';
import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { IdentitySystem } from '../src/core/IdentitySystem';
import { RouteStateManager } from '../src/core/RouteStateManager';

function merchantState() {
  const engine = new GameEngineIntegration();
  engine.startNewGame('经世测试', 'male');
  const state = engine.getGameState();
  state.player.age = 16;
  state.player.money = 100;
  state.player.flags = { ...(state.player.flags || {}) };
  state.flags = { ...(state.flags || {}) };
  return state;
}

async function run(): Promise<void> {
  const loader = EventLoader.getInstance();
  const executor = new EventExecutor();
  const talent = loader.getEventById('merchant_talent_discovery');
  const shop = loader.getEventById('merchant_first_shop');
  const studyBusiness = talent?.choices?.find(choice => choice.id === 'study_business');
  const openGrocery = shop?.choices?.find(choice => choice.id === 'open_grocery_shop');

  if (!studyBusiness || !openGrocery) {
    throw new Error('merchant commitment/proof choices missing');
  }

  let state = merchantState();
  state = await executor.executeEffects(studyBusiness.effects ?? [], state);
  if (RouteStateManager.readRoadStage(state, 'statecraft') !== 'active') {
    throw new Error('study_business should commit the statecraft road');
  }

  state = await executor.executeEffects(openGrocery.effects ?? [], state);
  if (RouteStateManager.readRoadStage(state, 'statecraft') !== 'locked_in') {
    throw new Error('opening a merchant shop should prove and lock statecraft');
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

  const reputationOnly = merchantState();
  const reputationState = await executor.executeEffects([
    { type: 'stat_modify', stat: 'reputation', value: 20 },
  ], reputationOnly);
  if (RouteStateManager.readRoadStage(reputationState, 'statecraft') !== 'inactive') {
    throw new Error('reputation alone must not advance statecraft');
  }

  const moneyOnly = merchantState();
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
