export type PersonArchetypeId = 'merchant_introduced_partner_v1';

export type PersonVariantId = 'female_qinghe' | 'male_zhiheng';

export type PersonSex = 'male' | 'female';

export interface PersonEventBinding {
  archetypeId: PersonArchetypeId;
  mode: 'create' | 'require';
}

export interface PersonVariantDefinition {
  id: PersonVariantId;
  sex: PersonSex;
  displayName: string;
  pronoun: string;
  address: string;
}

export interface PersonArchetypeDefinition {
  id: PersonArchetypeId;
  variantByPlayerGender: Readonly<Record<PersonSex, PersonVariantId>>;
  variants: Readonly<Record<PersonVariantId, PersonVariantDefinition>>;
}
