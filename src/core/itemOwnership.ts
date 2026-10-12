import type { InventoryItem } from '../types/eventTypes';
import {
  getItemDefinition,
  ITEM_DEFINITIONS,
  type ItemId,
  type OwnedItemSummary,
} from '../types/item';

export type ItemOwnershipState = 'owned' | 'not_owned' | 'invalid';

export function getItemOwnershipState(
  inventory: readonly InventoryItem[] | undefined,
  itemId: ItemId,
): ItemOwnershipState {
  const matching = (inventory ?? []).filter(entry => entry?.id === itemId);
  if (matching.length === 0) return 'not_owned';
  if (matching.length !== 1) return 'invalid';

  const definition = getItemDefinition(itemId);
  const entry = matching[0]!;
  return entry.name === definition.displayName && entry.quantity === 1
    ? 'owned'
    : 'invalid';
}

function cloneInventory(inventory: readonly InventoryItem[] | undefined): InventoryItem[] {
  return (inventory ?? []).map(item => ({ ...item }));
}

export function addItem(
  inventory: readonly InventoryItem[] | undefined,
  itemId: ItemId,
): InventoryItem[] {
  const ownership = getItemOwnershipState(inventory, itemId);
  if (ownership !== 'not_owned') {
    throw new Error(`Cannot add Item ${itemId}: ${ownership}`);
  }

  const definition = getItemDefinition(itemId);
  return [...cloneInventory(inventory), {
    id: definition.id,
    name: definition.displayName,
    quantity: 1,
  }];
}

export function removeItem(
  inventory: readonly InventoryItem[] | undefined,
  itemId: ItemId,
): InventoryItem[] {
  const ownership = getItemOwnershipState(inventory, itemId);
  if (ownership !== 'owned') {
    throw new Error(`Cannot remove Item ${itemId}: ${ownership}`);
  }
  return cloneInventory(inventory).filter(item => item.id !== itemId);
}

export function getOwnedItems(
  inventory: readonly InventoryItem[] | undefined,
): OwnedItemSummary[] {
  return ITEM_DEFINITIONS.flatMap(definition =>
    getItemOwnershipState(inventory, definition.id) === 'owned'
      ? [{ id: definition.id, displayName: definition.displayName }]
      : [],
  );
}
