import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { addAsset } from '../src/core/assetOwnership';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { mapSessionProgression } from '../server/src/services/sessionProgressionMapper';
import { ITEM_DEFINITIONS } from '../src/types/item';
import type { GameState } from '../src/types/eventTypes';

function createLifeMemory(): never {
  return {} as never;
}

function makeSession(state: GameState) {
  return {
    getSessionPhase: () => 'active_planning',
    getPlanningOptions: () => [],
    getProgressionVolatileState: () => ({
      pendingActionSummary: null,
      pendingDisturbanceNarrative: null,
      pendingPeriodSummary: null,
      passiveNarrative: null,
      annualPassiveMemory: null,
      pendingStoryEventId: null,
      pendingEphemeralStoryEvent: null,
    }),
    getRuntimeState: () => state,
  };
}

function newState(): GameState {
  const engine = new GameEngineIntegration();
  engine.startNewGame('Asset Presentation', 'male');
  return engine.getGameState();
}

const lifeMemory = createLifeMemory();
const localPlayer = newState().player;

assert.equal(
  buildMainScreenModel({ ...localPlayer, ownedAssets: ['merchant_shop'] } as never, lifeMemory).assetSummary,
  '自营商铺',
);
assert.equal(
  buildMainScreenModel({ ...localPlayer, ownedAssets: [] } as never, lifeMemory).assetSummary,
  '暂无资产',
);

const legacyOnly = newState();
legacyOnly.player.flags = { merchant_shop_grocery: true };
const legacyPayload = mapSessionProgression(
  makeSession(legacyOnly) as never,
  1,
  'asset-presentation-legacy',
  null,
  lifeMemory,
);
assert.deepEqual(legacyPayload.player.ownedAssets, []);
assert.deepEqual(legacyPayload.player.ownedItems, []);

const canonicalOnly = newState();
canonicalOnly.facts = addAsset(canonicalOnly.facts, 'merchant_shop');
canonicalOnly.player.flags = {};
const canonicalPayload = mapSessionProgression(
  makeSession(canonicalOnly) as never,
  1,
  'asset-presentation-canonical',
  null,
  lifeMemory,
);
assert.deepEqual(canonicalPayload.player.ownedAssets, ['merchant_shop']);

const itemState = newState();
itemState.inventory = [
  { id: 'item_jade_pendant', name: '家传玉佩', quantity: 1 },
  { id: ITEM_DEFINITIONS[0]!.id, name: ITEM_DEFINITIONS[0]!.displayName, quantity: 1 },
];
const itemPayload = mapSessionProgression(
  makeSession(itemState) as never,
  1,
  'item-presentation',
  null,
  lifeMemory,
);
assert.deepEqual(itemPayload.player.ownedItems, [{
  id: ITEM_DEFINITIONS[0]!.id,
  displayName: ITEM_DEFINITIONS[0]!.displayName,
}]);
assert.deepEqual(itemPayload.player.ownedAssets, []);
assert.equal(
  buildMainScreenModel(itemPayload.player, lifeMemory).itemSummary,
  ITEM_DEFINITIONS[0]!.displayName,
  'API named Item summary should match the player summary display',
);
assert.equal(
  buildMainScreenModel({ ...itemPayload.player, ownedItems: [] }, lifeMemory).itemSummary,
  '暂无具名物品',
);

console.log('assetPresentation.test.ts: ok');
