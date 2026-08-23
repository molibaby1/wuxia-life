export const WEALTH_CAPACITY_VALUES = [
  'no_surplus',
  'modest_savings',
  'comfortable_means',
  'wealthy',
  'regional_magnate',
] as const;

export type WealthCapacity = (typeof WEALTH_CAPACITY_VALUES)[number];

export const WEALTH_CAPACITY_LABELS: Record<WealthCapacity, string> = {
  no_surplus: '无余财',
  modest_savings: '略有积蓄',
  comfortable_means: '家资殷实',
  wealthy: '豪富',
  regional_magnate: '富甲一方',
};

const rank = new Map<WealthCapacity, number>(
  WEALTH_CAPACITY_VALUES.map((value, index) => [value, index]),
);

export function isWealthCapacity(value: unknown): value is WealthCapacity {
  return typeof value === 'string' && rank.has(value as WealthCapacity);
}

export function meetsWealthCapacity(current: WealthCapacity, minimum: WealthCapacity): boolean {
  return (rank.get(current) ?? -1) >= (rank.get(minimum) ?? Number.POSITIVE_INFINITY);
}

export function raiseWealthCapacityTo(
  current: WealthCapacity,
  minimum: WealthCapacity,
): WealthCapacity {
  return meetsWealthCapacity(current, minimum) ? current : minimum;
}
