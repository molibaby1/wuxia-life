import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { IdentitySystem } from '../src/core/IdentitySystem';

async function run(): Promise<void> {
  const loader = EventLoader.getInstance();
  const talent = loader.getEventById('merchant_talent_discovery');
  const shop = loader.getEventById('merchant_first_shop');
  const studyBusiness = talent?.choices?.find(choice => choice.id === 'study_business');
  const openGrocery = shop?.choices?.find(choice => choice.id === 'open_grocery_shop');
  if (!talent || !shop || !studyBusiness || !openGrocery) throw new Error('merchant choices missing');

  const engine = new GameEngineIntegration();
  engine.startNewGame('经世测试', 'male');
  const initial = engine.getGameState();
  initial.player.age = 16;
  initial.player.money = 100;
  await engine.executeChoiceEffects(studyBusiness.effects ?? [], talent.id, studyBusiness.id);
  const afterTalent = engine.getGameState();
  if (afterTalent.player.flags?.merchant_talent !== true || afterTalent.player.money !== 20) {
    throw new Error('merchant talent must write its explicit flag and money effect');
  }

  await engine.executeChoiceEffects(openGrocery.effects ?? [], shop.id, openGrocery.id);
  const afterShop = engine.getGameState();
  if (afterShop.player.flags?.merchant_shop_grocery !== true || afterShop.player.money !== 0 || afterShop.player.reputation !== 5) {
    throw new Error('merchant shop must apply explicit flag, money, and reputation effects');
  }
  if (Object.keys(afterShop).some(key => ['route' + 'States', 'route' + 'History', 'road' + 'Commitments'].includes(key))) {
    throw new Error('merchant effects must not create removed lifecycle fields');
  }

  const identityState = IdentitySystem.recordIdentity({
    ...afterShop,
    player: { ...afterShop.player, money: 5000, flags: { ...afterShop.player.flags, business_empire: true } },
  }, 'merchant');
  if (!identityState.identity?.identities.includes('merchant')) throw new Error('merchant identity should remain recordable');
  if (identityState.player.money !== 5000 || identityState.player.reputation !== afterShop.player.reputation) {
    throw new Error('identity recording must not conflate money and reputation');
  }
  console.log('merchant explicit-effects vertical slice passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
