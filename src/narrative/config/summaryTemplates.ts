/**
 * P9 summary template skeleton — three-part life summary shape.
 */

export interface SummaryTemplatePart {
  id: string;
  slot: 'early_life' | 'turning_point' | 'age40_identity';
  template: string;
  worldId: string;
}

export const WUXIA_SUMMARY_TEMPLATES: SummaryTemplatePart[] = [
  {
    id: 'wuxia_early_default',
    slot: 'early_life',
    worldId: 'wuxia',
    template: '{age_entries}',
  },
  {
    id: 'wuxia_turning_default',
    slot: 'turning_point',
    worldId: 'wuxia',
    template: '{turning_age}岁 {turning_title}{outcome_suffix}',
  },
  {
    id: 'wuxia_identity_merchant',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：商路之主（{route_identity}）{echo_suffix}',
  },
  {
    id: 'wuxia_identity_wanderer',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：江湖游侠（{route_identity}）{echo_suffix}',
  },
  {
    id: 'wuxia_identity_martial',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：武道（{route_identity}）{echo_suffix}',
  },
  {
    id: 'wuxia_identity_scholar',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：治学名士（{route_identity}）{echo_suffix}',
  },
  {
    id: 'wuxia_identity_social',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：交游枢纽（{route_identity}）{echo_suffix}',
  },
  {
    id: 'wuxia_identity_cautious',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：守拙持重（{route_identity}）{echo_suffix}',
  },
  {
    id: 'wuxia_identity_deviant',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：邪路偏锋（{route_identity}）{echo_suffix}',
  },
  {
    id: 'wuxia_identity_balanced',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：文武兼修（{route_identity}）{echo_suffix}',
  },
  {
    id: 'wuxia_identity_default',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，倾向：{route_preference}{echo_suffix}',
  },
];

export function getSummaryTemplateForIdentity(
  routeIdentity: string | null,
  routePreference: string,
): SummaryTemplatePart {
  if (routeIdentity?.includes('merchant')) {
    return WUXIA_SUMMARY_TEMPLATES.find(t => t.id === 'wuxia_identity_merchant')!;
  }
  if (routeIdentity?.includes('wanderer')) {
    return WUXIA_SUMMARY_TEMPLATES.find(t => t.id === 'wuxia_identity_wanderer')!;
  }
  if (routeIdentity?.includes('demonic') || routeIdentity?.includes('deviant') || routePreference === 'demonic') {
    return WUXIA_SUMMARY_TEMPLATES.find(t => t.id === 'wuxia_identity_deviant')!;
  }
  if (routeIdentity?.includes('martial') || routePreference === 'martial') {
    return WUXIA_SUMMARY_TEMPLATES.find(t => t.id === 'wuxia_identity_martial')!;
  }
  if (routeIdentity?.includes('cautious') || routePreference === 'conservative') {
    return WUXIA_SUMMARY_TEMPLATES.find(t => t.id === 'wuxia_identity_cautious')!;
  }
  if (routeIdentity?.includes('scholar') || routePreference === 'scholar' || routePreference === 'scholarly') {
    return WUXIA_SUMMARY_TEMPLATES.find(t => t.id === 'wuxia_identity_scholar')!;
  }
  if (routeIdentity?.includes('social') || routePreference === 'social') {
    return WUXIA_SUMMARY_TEMPLATES.find(t => t.id === 'wuxia_identity_social')!;
  }
  if (routeIdentity?.includes('balanced') || routePreference === 'balanced') {
    return WUXIA_SUMMARY_TEMPLATES.find(t => t.id === 'wuxia_identity_balanced')!;
  }
  return WUXIA_SUMMARY_TEMPLATES.find(t => t.id === 'wuxia_identity_default')!;
}

export function applySummaryTemplate(
  template: SummaryTemplatePart,
  vars: Record<string, string>,
): string {
  let result = template.template;
  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
  }
  return result.replace(/\{[^}]+\}/g, '').replace(/，+$/, '').trim();
}

export function getAllSummaryTemplates(): SummaryTemplatePart[] {
  return WUXIA_SUMMARY_TEMPLATES;
}
