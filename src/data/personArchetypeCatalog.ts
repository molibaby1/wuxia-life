import type {
  PersonArchetypeDefinition,
  PersonArchetypeId,
  PersonSex,
  PersonVariantDefinition,
  PersonVariantId,
} from '../types/personArchetype';

export const personArchetypeCatalog: Readonly<Record<PersonArchetypeId, PersonArchetypeDefinition>> = {
  merchant_introduced_partner_v1: {
    id: 'merchant_introduced_partner_v1',
    variantByPlayerGender: {
      male: 'female_qinghe',
      female: 'male_zhiheng',
    },
    variants: {
      female_qinghe: {
        id: 'female_qinghe',
        sex: 'female',
        displayName: '沈清禾',
        pronoun: '她',
        address: '姑娘',
      },
      male_zhiheng: {
        id: 'male_zhiheng',
        sex: 'male',
        displayName: '沈知衡',
        pronoun: '他',
        address: '公子',
      },
    },
  },
};

export function isPersonArchetypeId(value: string): value is PersonArchetypeId {
  return value === 'merchant_introduced_partner_v1';
}

export function isPersonVariantId(value: string): value is PersonVariantId {
  return value === 'female_qinghe' || value === 'male_zhiheng';
}

export function isPersonSex(value: string): value is PersonSex {
  return value === 'male' || value === 'female';
}

export function getPersonArchetype(id: string): PersonArchetypeDefinition | undefined {
  return isPersonArchetypeId(id) ? personArchetypeCatalog[id] : undefined;
}

export function getPersonVariant(
  archetypeId: string,
  variantId: string,
): PersonVariantDefinition | undefined {
  if (!isPersonArchetypeId(archetypeId) || !isPersonVariantId(variantId)) {
    return undefined;
  }
  return personArchetypeCatalog[archetypeId].variants[variantId];
}
