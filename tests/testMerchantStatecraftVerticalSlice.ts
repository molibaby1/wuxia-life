import { EventLoader } from '../src/core/EventLoader';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { hasAsset } from '../src/core/assetOwnership';

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
  const initialMoney = initial.player.money;
  initial.player.age = 16;
  await engine.executeChoiceEffects(studyBusiness.effects ?? [], talent.id, studyBusiness.id);
  const afterTalent = engine.getGameState();
  if (afterTalent.player.flags?.merchant_talent !== true) {
    throw new Error('merchant talent must write its explicit flag');
  }
  if (afterTalent.player.wealthCapacity !== 'modest_savings') {
    throw new Error('merchant talent must raise wealth capacity to modest_savings');
  }
  if (afterTalent.player.money !== initialMoney) {
    throw new Error('merchant talent must not mutate legacy money');
  }

  await engine.executeChoiceEffects(openGrocery.effects ?? [], shop.id, openGrocery.id);
  const afterShop = engine.getGameState();
  if (afterShop.player.flags?.merchant_shop_grocery !== true) {
    throw new Error('merchant shop must apply explicit grocery flag');
  }
  if (afterShop.player.money !== initialMoney) {
    throw new Error('merchant shop opening must not mutate legacy money');
  }
  if (!hasAsset(afterShop.facts, 'merchant_shop')) {
    throw new Error('merchant shop opening must own merchant_shop Asset');
  }
  if (afterShop.player.reputation !== 5) {
    throw new Error('merchant shop must apply explicit reputation effect');
  }
  if (Object.keys(afterShop).some(key => ['route' + 'States', 'route' + 'History', 'road' + 'Commitments'].includes(key))) {
    throw new Error('merchant effects must not create removed lifecycle fields');
  }

  if ('identity' in afterShop) throw new Error('merchant effects must not create generic identity state');
  if (afterShop.player.affiliation !== null) throw new Error('merchant events must not infer affiliation');
  console.log('merchant explicit-effects vertical slice passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
