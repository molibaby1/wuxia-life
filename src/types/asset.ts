export const ASSET_VALUES = ['merchant_shop'] as const;
export type AssetId = (typeof ASSET_VALUES)[number];

export const ASSET_LABELS: Record<AssetId, string> = {
  merchant_shop: '自营商铺',
};

const ASSET_ID_SET = new Set<string>(ASSET_VALUES);

export function isAssetId(value: unknown): value is AssetId {
  return typeof value === 'string' && ASSET_ID_SET.has(value);
}
