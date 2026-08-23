import type { Facts } from '../types/eventTypes';
import { ASSET_VALUES, type AssetId } from '../types/asset';

function assetFactKey(assetId: AssetId): string {
  return `asset_owned_${assetId}`;
}

export function hasAsset(facts: Facts, assetId: AssetId): boolean {
  return facts[assetFactKey(assetId)] === true;
}

export function addAsset(facts: Facts, assetId: AssetId): Facts {
  return { ...facts, [assetFactKey(assetId)]: true };
}

export function removeAsset(facts: Facts, assetId: AssetId): Facts {
  const next = { ...facts };
  delete next[assetFactKey(assetId)];
  return next;
}

export function getOwnedAssets(facts: Facts): AssetId[] {
  return ASSET_VALUES.filter((assetId) => hasAsset(facts, assetId));
}
