import assert from 'node:assert/strict';
import { GameEngineIntegration } from '../../src/core/GameEngineIntegration';
import { EventExecutor } from '../../src/core/EventExecutor';
import { getOwnedItems } from '../../src/core/itemOwnership';
import { defaultSnapshotConverter } from '../../src/headless/snapshot/SnapshotConverter';
import { createDefaultTimeSource } from '../../src/headless/adapters/timeSource';
import { EffectType, type EffectDefinition } from '../../src/types/eventTypes';
import { ITEM_DEFINITIONS } from '../../src/types/item';
import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot';

async function main(): Promise<void> {
  const engine = new GameEngineIntegration();
  engine.startNewGame('物品存档测试', 'female');
  const originalRows = [
    { id: 'item_jade_pendant', name: '家传玉佩', quantity: 1 },
    { id: 'item_healing_pill', name: '疗伤丹', quantity: 3 },
    { id: 'item_silver', name: '银两', quantity: 3200 },
  ];
  const state = { ...engine.getGameState(), inventory: originalRows };
  const effects = ITEM_DEFINITIONS.map(item => ({
    type: EffectType.ITEM_ADD,
    item: item.id,
  }) as unknown as EffectDefinition);
  const withItems = await new EventExecutor().executeEffects(effects, state);

  const snapshot = defaultSnapshotConverter.toSnapshot(withItems, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: createDefaultTimeSource(),
  });
  assert.equal(snapshot.metadata.schemaVersion, '3.16.0');
  const jsonRoundTrip = JSON.parse(JSON.stringify(snapshot)) as GameStateSnapshot;
  const restored = defaultSnapshotConverter.fromSnapshot(jsonRoundTrip);

  assert.deepEqual(restored.inventory, [
    ...originalRows,
    ...ITEM_DEFINITIONS.map(item => ({
      id: item.id,
      name: item.displayName,
      quantity: 1,
    })),
  ]);
  assert.deepEqual(getOwnedItems(restored.inventory), ITEM_DEFINITIONS.map(item => ({
    id: item.id,
    displayName: item.displayName,
  })));
  assert.deepEqual(restored.inventory?.slice(0, originalRows.length), originalRows);
  assert.deepEqual(
    getOwnedItems(originalRows),
    [],
    'legacy fixture rows must remain unregistered after Snapshot restore',
  );

  const restoredEngine = new GameEngineIntegration();
  restoredEngine.loadGameState(restored);
  const loaded = restoredEngine.getGameState();
  assert.deepEqual(getOwnedItems(loaded.inventory), getOwnedItems(restored.inventory));
  loaded.inventory![originalRows.length]!.quantity = 7;
  assert.equal(restored.inventory![originalRows.length]!.quantity, 1);
  assert.equal(withItems.inventory![originalRows.length]!.quantity, 1);
  assert.equal(snapshot.state.inventory![originalRows.length]!.quantity, 1);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
