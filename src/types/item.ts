/**
 * Stable identities used by the shared Item ownership capability.
 * These two entries are controlled test definitions; no natural event uses them.
 */
export const ITEM_DEFINITIONS = [
  { id: 'test_martial_manual', displayName: '测试用武学文献' },
  { id: 'test_family_keepsake', displayName: '测试用生活信物' },
] as const;

export type ItemId = (typeof ITEM_DEFINITIONS)[number]['id'];
export type ItemDefinition = (typeof ITEM_DEFINITIONS)[number];

export interface OwnedItemSummary {
  id: ItemId;
  displayName: string;
}

const itemDefinitionsById = new Map<string, ItemDefinition>();
for (const definition of ITEM_DEFINITIONS) {
  if (!/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(definition.id)) {
    throw new Error(`Invalid Item ID: ${definition.id}`);
  }
  if (!definition.displayName.trim()) {
    throw new Error(`Invalid Item display name: ${definition.id}`);
  }
  if (itemDefinitionsById.has(definition.id)) {
    throw new Error(`Duplicate Item ID: ${definition.id}`);
  }
  itemDefinitionsById.set(definition.id, definition);
}

export function isItemId(value: unknown): value is ItemId {
  return typeof value === 'string' && itemDefinitionsById.has(value);
}

export function getItemDefinition(itemId: ItemId): ItemDefinition {
  const definition = itemDefinitionsById.get(itemId);
  if (!definition) throw new Error(`Missing Item definition: ${itemId}`);
  return definition;
}
