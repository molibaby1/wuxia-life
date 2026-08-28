/**
 * P9 route definition skeleton — entry, reinforcement, divergence, identity signals.
 */

export type RouteSignalKind = 'entry' | 'reinforcement' | 'divergence' | 'identity';

export interface RouteIdentityCandidate {
  flagKey: string;
  priority: number;
}

export interface RouteIdentityResolution {
  candidates: RouteIdentityCandidate[];
  defaultIdentity: string;
  routePreferenceFallbacks: string[];
}

export interface RouteSignalPoint {
  kind: RouteSignalKind;
  ageBand: string;
  eventId?: string;
  flagKey?: string;
  description: string;
}

export interface RouteDefinition {
  id: string;
  label: string;
  entrySignals: RouteSignalPoint[];
  reinforcementPoints: RouteSignalPoint[];
  divergencePoints: RouteSignalPoint[];
  identitySignals: RouteSignalPoint[];
  identityResolution: RouteIdentityResolution;
}

export const WUXIA_ROUTE_DEFINITIONS: RouteDefinition[] = [
  {
    // ponytail: D10/PD-087 — narrative & P11 validation alias only; strategic Merchant identity owner is route_merchant.
    id: 'route_wealth',
    label: '营商致富',
    entrySignals: [
      { kind: 'entry', ageBand: '13-20', flagKey: 'p9_early_business_focus', description: '少年营商行动' },
    ],
    reinforcementPoints: [
      {
        kind: 'reinforcement',
        ageBand: '20-30',
        eventId: 'p11_wealth_reinforcement_first_deal',
        flagKey: 'p11_wealth_reinforcement_seen',
        description: '初次经商',
      },
    ],
    divergencePoints: [
      { kind: 'divergence', ageBand: '28-32', eventId: 'p9_merchant_midlife_caravan', flagKey: 'p9_merchant_midlife_path', description: '商路中段分化' },
    ],
    identitySignals: [
      { kind: 'identity', ageBand: '30-40', flagKey: 'p9_route_identity_merchant_master', description: '商路之主或投资者' },
    ],
    identityResolution: {
      candidates: [{ flagKey: 'p9_route_identity_merchant_master', priority: 100 }],
      defaultIdentity: 'merchant_path',
      routePreferenceFallbacks: ['wealth', 'merchant'],
    },
  },
  {
    id: 'route_wanderer',
    label: '游历江湖',
    entrySignals: [
      { kind: 'entry', ageBand: '13-20', flagKey: 'p9_early_travel_focus', description: '少年游历行动' },
    ],
    reinforcementPoints: [
      {
        kind: 'reinforcement',
        ageBand: '20-30',
        eventId: 'p11_wanderer_reinforcement_connections',
        flagKey: 'p11_wanderer_reinforcement_seen',
        description: '路上结识人脉',
      },
    ],
    divergencePoints: [
      { kind: 'divergence', ageBand: '28-32', eventId: 'p9_wanderer_midlife_discovery', flagKey: 'p9_wanderer_midlife_path', description: '远游记名' },
    ],
    identitySignals: [
      { kind: 'identity', ageBand: '30-40', flagKey: 'p9_route_identity_wanderer', description: '活地图或游侠护卫' },
    ],
    identityResolution: {
      candidates: [{ flagKey: 'p9_route_identity_wanderer', priority: 95 }],
      defaultIdentity: 'wanderer_path',
      routePreferenceFallbacks: ['wanderer', 'explorer', 'travel'],
    },
  },
  {
    id: 'route_martial',
    label: '习武成名',
    entrySignals: [
      { kind: 'entry', ageBand: '13-20', flagKey: 'p9_echo_training_hook', description: '少年练功' },
    ],
    reinforcementPoints: [
      { kind: 'reinforcement', ageBand: '10-20', eventId: 'p9_childhood_sword_trial', flagKey: 'p9_childhood_sword_trial', description: '童子试剑' },
    ],
    divergencePoints: [
      { kind: 'divergence', ageBand: '26-28', eventId: 'p9_training_echo_midlife', description: '功底显现' },
      { kind: 'divergence', ageBand: '26-32', eventId: 'p9_martial_midlife_proving', flagKey: 'p9_route_identity_martial', description: '武道立名' },
    ],
    identitySignals: [
      { kind: 'identity', ageBand: '30-40', flagKey: 'p9_milestone_route_signal', description: '武道天资确认' },
    ],
    identityResolution: {
      candidates: [{ flagKey: 'p9_milestone_route_signal', priority: 50 }],
      defaultIdentity: 'martial_path',
      routePreferenceFallbacks: ['martial'],
    },
  },
  {
    id: 'route_deviant',
    label: '邪路偏锋',
    entrySignals: [
      { kind: 'entry', ageBand: '13-20', flagKey: 'p9_echo_training_hook', description: '少年练功' },
    ],
    reinforcementPoints: [
      { kind: 'reinforcement', ageBand: '10-20', eventId: 'p9_childhood_dark_spark', description: '暗劲初萌' },
    ],
    divergencePoints: [
      { kind: 'divergence', ageBand: '23-29', eventId: 'p9_deviant_fork_temptation', flagKey: 'p9_route_identity_deviant', description: '邪路初染与邪影成形' },
    ],
    identitySignals: [
      { kind: 'identity', ageBand: '30-40', flagKey: 'p9_route_identity_deviant', description: '邪影之主' },
    ],
    identityResolution: {
      candidates: [{ flagKey: 'p9_route_identity_deviant', priority: 90 }],
      defaultIdentity: 'deviant_path',
      routePreferenceFallbacks: ['demonic', 'deviant'],
    },
  },
  {
    id: 'route_scholar',
    label: '治学成名',
    entrySignals: [
      { kind: 'entry', ageBand: '13-20', flagKey: 'p9_echo_study_hook', description: '少年读书行动' },
    ],
    reinforcementPoints: [],
    divergencePoints: [
      { kind: 'divergence', ageBand: '24-28', eventId: 'p9_study_echo_midlife', description: '学识回响' },
    ],
    identitySignals: [
      { kind: 'identity', ageBand: '30-40', flagKey: 'p9_route_identity_scholar', description: '讲学名士' },
    ],
    identityResolution: {
      candidates: [{ flagKey: 'p9_route_identity_scholar', priority: 80 }],
      defaultIdentity: 'scholar_path',
      routePreferenceFallbacks: ['scholar', 'scholarly'],
    },
  },
  {
    id: 'route_social',
    label: '交游成名',
    entrySignals: [
      { kind: 'entry', ageBand: '13-20', flagKey: 'p9_early_social_focus', description: '少年交游行动' },
    ],
    reinforcementPoints: [
      {
        kind: 'reinforcement',
        ageBand: '20-30',
        eventId: 'p11_social_reinforcement_gathering',
        flagKey: 'p11_social_reinforcement_seen',
        description: '雅集论交强化',
      },
    ],
    divergencePoints: [
      { kind: 'divergence', ageBand: '26-30', eventId: 'p9_social_echo_midlife', description: '人脉回响' },
    ],
    identitySignals: [
      { kind: 'identity', ageBand: '30-40', flagKey: 'p9_route_identity_social', description: '人脉枢纽' },
    ],
    identityResolution: {
      candidates: [{ flagKey: 'p9_route_identity_social', priority: 75 }],
      defaultIdentity: 'social_path',
      routePreferenceFallbacks: ['social'],
    },
  },
  {
    id: 'route_cautious',
    label: '守拙持重',
    entrySignals: [],
    reinforcementPoints: [],
    divergencePoints: [],
    identitySignals: [
      { kind: 'identity', ageBand: '30-40', flagKey: 'p9_route_identity_cautious', description: '守拙持重' },
    ],
    identityResolution: {
      candidates: [{ flagKey: 'p9_route_identity_cautious', priority: 70 }],
      defaultIdentity: 'cautious_path',
      routePreferenceFallbacks: ['conservative', 'cautious'],
    },
  },
  {
    id: 'route_balanced',
    label: '文武兼修',
    entrySignals: [],
    reinforcementPoints: [],
    divergencePoints: [],
    identitySignals: [],
    identityResolution: {
      candidates: [],
      defaultIdentity: 'balanced_path',
      routePreferenceFallbacks: ['balanced'],
    },
  },
];

export function getRouteDefinition(routeId: string): RouteDefinition | undefined {
  return WUXIA_ROUTE_DEFINITIONS.find(r => r.id === routeId);
}

export function getRouteIdentityFromFlags(
  flags: Record<string, unknown>,
  routePreference?: string | null,
  routes: RouteDefinition[] = WUXIA_ROUTE_DEFINITIONS,
): string | null {
  const matches = routes.flatMap(route =>
    route.identityResolution.candidates
      .filter(candidate => flags[candidate.flagKey] !== undefined && flags[candidate.flagKey] !== false)
      .map(candidate => ({
        priority: candidate.priority,
        value: String(flags[candidate.flagKey]),
      })),
  ).sort((a, b) => b.priority - a.priority);

  if (matches.length > 0) {
    return matches[0].value;
  }

  if (routePreference) {
    const fallback = routes.find(route =>
      route.identityResolution.routePreferenceFallbacks.includes(routePreference),
    );
    if (fallback) {
      return fallback.identityResolution.defaultIdentity;
    }
  }

  return null;
}
