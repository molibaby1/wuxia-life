import type { OriginId } from '../types/eventTypes';
import type { PrimaryOriginFamilyFlag } from './primaryOriginFlag';

/**
 * Childhood / sample-line / merchant HVG origin boundaries:
 * - Player-facing compatibility projection: `resolvePrimaryOriginFamilyFlag()` on origin_*_family flags
 * - Latent trait flavor after new game: coreTalent / weakness / temperament only (no origin yet)
 * - `origin_id` maps a canonical background to its legacy id when projection is required
 * - Origin-dependent behavior reads the canonical background, not trait state
 */
export const PRIMARY_ORIGIN_TO_ORIGIN_ID: Record<PrimaryOriginFamilyFlag, OriginId> = {
  origin_merchant_family: 'merchant_house',
  origin_scholar_family: 'scholar_house',
  origin_wuxia_family: 'martial_family',
  origin_frontier: 'frontier_military',
};
