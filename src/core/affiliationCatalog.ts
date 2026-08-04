import type { AffiliationId } from '../types/eventTypes';

export interface AffiliationDefinition {
  id: AffiliationId;
  displayName: string;
  organizationClass: 'orthodox' | 'unconventional' | 'neutral';
}

const AFFILIATIONS: Record<AffiliationId, AffiliationDefinition> = {
  shaolin: { id: 'shaolin', displayName: '少林寺', organizationClass: 'orthodox' },
  wudang: { id: 'wudang', displayName: '武当派', organizationClass: 'orthodox' },
  beggars: { id: 'beggars', displayName: '丐帮', organizationClass: 'neutral' },
  border: { id: 'border', displayName: '边关守军', organizationClass: 'neutral' },
  shadow_sect: { id: 'shadow_sect', displayName: '幽影门', organizationClass: 'unconventional' },
};

export function getAffiliationDefinition(id: AffiliationId): AffiliationDefinition {
  const definition = AFFILIATIONS[id];
  if (!definition) {
    throw new Error(`Unknown affiliation: ${String(id)}`);
  }
  return definition;
}

export function isAffiliationId(value: unknown): value is AffiliationId {
  return typeof value === 'string' && value in AFFILIATIONS;
}

