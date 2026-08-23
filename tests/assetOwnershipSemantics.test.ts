import assert from 'node:assert/strict';
import {
  addAsset,
  getOwnedAssets,
  hasAsset,
  removeAsset,
} from '../src/core/assetOwnership';
import { ASSET_LABELS, isAssetId } from '../src/types/asset';
import type { Facts } from '../src/types/eventTypes';

const baseFacts: Facts = { unrelated_fact: 'kept' };

assert.equal(isAssetId('merchant_shop'), true);
assert.equal(isAssetId('merchant_caravan'), false);
assert.equal(ASSET_LABELS.merchant_shop, '自营商铺');

assert.equal(hasAsset(baseFacts, 'merchant_shop'), false);

const acquired = addAsset(baseFacts, 'merchant_shop');
assert.equal(hasAsset(acquired, 'merchant_shop'), true);
assert.equal(acquired.unrelated_fact, 'kept');
assert.notEqual(acquired, baseFacts);
assert.deepEqual(getOwnedAssets(acquired), ['merchant_shop']);

const repeated = addAsset(acquired, 'merchant_shop');
assert.deepEqual(getOwnedAssets(repeated), ['merchant_shop']);

const removed = removeAsset(acquired, 'merchant_shop');
assert.equal(hasAsset(removed, 'merchant_shop'), false);
assert.equal(removed.unrelated_fact, 'kept');

// Exact boolean semantics: truthy legacy-like values must not become ownership.
const suspiciousFacts = { ...acquired } as Record<string, boolean | string | number>;
for (const key of Object.keys(suspiciousFacts)) {
  if (key !== 'unrelated_fact') suspiciousFacts[key] = 'yes';
}
assert.equal(hasAsset(suspiciousFacts, 'merchant_shop'), false);

console.log('assetOwnershipSemantics.test.ts: ok');
