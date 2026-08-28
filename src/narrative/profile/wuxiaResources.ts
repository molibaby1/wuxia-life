import type { WorldProfileResourceEntry } from './types';

/**
 * Wuxia spendable/accumulable profile resources.
 * Wallet `money` retired from live profile authority (PD-095 / post-run closure);
 * strategic economy remains `wealthCapacity`, not a spendable resource entry.
 */
export const WUXIA_PROFILE_RESOURCES: WorldProfileResourceEntry[] = [];
