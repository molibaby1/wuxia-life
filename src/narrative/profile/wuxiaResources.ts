import type { WorldProfileResourceEntry } from './types';

/** Wuxia spendable/accumulable resources — maps to existing player fields. */
export const WUXIA_PROFILE_RESOURCES: WorldProfileResourceEntry[] = [
  { id: 'money', label: '银两', role: 'both' },
  { id: 'energy', label: '精力', role: 'spendable' },
  { id: 'connections', label: '人脉', role: 'accumulable' },
];
