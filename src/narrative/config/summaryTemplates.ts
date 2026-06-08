/**
 * P9 summary template skeleton — three-part life summary shape.
 */

export interface SummaryTemplateMatch {
  worldId?: string;
  routeIdentityIncludes?: string[];
  routeIdentityPrefixes?: string[];
  routePreferences?: string[];
  isDefault?: boolean;
  priority: number;
}

export interface SummaryTemplatePart {
  id: string;
  slot: 'early_life' | 'turning_point' | 'age40_identity';
  template: string;
  worldId: string;
  match: SummaryTemplateMatch;
}

export const WUXIA_SUMMARY_TEMPLATES: SummaryTemplatePart[] = [
  {
    id: 'wuxia_early_default',
    slot: 'early_life',
    worldId: 'wuxia',
    template: '{age_entries}',
    match: { worldId: 'wuxia', isDefault: true, priority: 0 },
  },
  {
    id: 'wuxia_turning_default',
    slot: 'turning_point',
    worldId: 'wuxia',
    template: '{turning_age}岁 {turning_title}{outcome_suffix}',
    match: { worldId: 'wuxia', isDefault: true, priority: 0 },
  },
  {
    id: 'wuxia_identity_merchant',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：商路之主（{route_identity}）{echo_suffix}',
    match: { worldId: 'wuxia', routeIdentityIncludes: ['merchant'], routePreferences: ['wealth', 'merchant'], priority: 100 },
  },
  {
    id: 'wuxia_identity_wanderer',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：江湖游侠（{route_identity}）{echo_suffix}',
    match: { worldId: 'wuxia', routeIdentityIncludes: ['wanderer'], routePreferences: ['wanderer', 'explorer', 'travel'], priority: 95 },
  },
  {
    id: 'wuxia_identity_martial',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：武道（{route_identity}）{echo_suffix}',
    match: { worldId: 'wuxia', routeIdentityIncludes: ['martial'], routePreferences: ['martial'], priority: 80 },
  },
  {
    id: 'wuxia_identity_scholar',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：治学名士（{route_identity}）{echo_suffix}',
    match: { worldId: 'wuxia', routeIdentityIncludes: ['scholar'], routePreferences: ['scholar', 'scholarly'], priority: 70 },
  },
  {
    id: 'wuxia_identity_social',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：交游枢纽（{route_identity}）{echo_suffix}',
    match: { worldId: 'wuxia', routeIdentityIncludes: ['social'], routePreferences: ['social'], priority: 60 },
  },
  {
    id: 'wuxia_identity_cautious',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：守拙持重（{route_identity}）{echo_suffix}',
    match: { worldId: 'wuxia', routeIdentityIncludes: ['cautious'], routePreferences: ['conservative', 'cautious'], priority: 50 },
  },
  {
    id: 'wuxia_identity_deviant',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：邪路偏锋（{route_identity}）{echo_suffix}',
    match: { worldId: 'wuxia', routeIdentityIncludes: ['demonic', 'deviant'], routePreferences: ['demonic', 'deviant'], priority: 90 },
  },
  {
    id: 'wuxia_identity_balanced',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，路线：文武兼修（{route_identity}）{echo_suffix}',
    match: { worldId: 'wuxia', routeIdentityIncludes: ['balanced'], routePreferences: ['balanced'], priority: 40 },
  },
  {
    id: 'wuxia_identity_default',
    slot: 'age40_identity',
    worldId: 'wuxia',
    template: '出身：{origin}，倾向：{route_preference}{echo_suffix}',
    match: { worldId: 'wuxia', isDefault: true, priority: 1 },
  },
];

export function getSummaryTemplateForIdentity(
  routeIdentity: string | null,
  routePreference: string,
  worldId = 'wuxia',
): SummaryTemplatePart {
  const candidates = WUXIA_SUMMARY_TEMPLATES
    .filter(t => t.slot === 'age40_identity')
    .filter(t => !t.match.worldId || t.match.worldId === worldId)
    .filter(t => {
      if (t.match.isDefault) {
        return true;
      }
      const includesMatch = t.match.routeIdentityIncludes?.some(token => routeIdentity?.includes(token)) ?? false;
      const prefixMatch = t.match.routeIdentityPrefixes?.some(token => routeIdentity?.startsWith(token)) ?? false;
      const preferenceMatch = t.match.routePreferences?.includes(routePreference) ?? false;
      const hasIdentityRules = Boolean(t.match.routeIdentityIncludes?.length || t.match.routeIdentityPrefixes?.length);
      const hasPreferenceRules = Boolean(t.match.routePreferences?.length);
      if (hasIdentityRules && hasPreferenceRules) {
        return includesMatch || prefixMatch || preferenceMatch;
      }
      if (hasIdentityRules) {
        return includesMatch || prefixMatch;
      }
      if (hasPreferenceRules) {
        return preferenceMatch;
      }
      return false;
    })
    .sort((a, b) => b.match.priority - a.match.priority);

  return candidates[0] ?? WUXIA_SUMMARY_TEMPLATES.find(t => t.id === 'wuxia_identity_default')!;
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
