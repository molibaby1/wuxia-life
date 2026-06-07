/**
 * P9 route definition skeleton — entry, reinforcement, divergence, identity signals.
 */

export type RouteSignalKind = 'entry' | 'reinforcement' | 'divergence' | 'identity';

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
}

export const WUXIA_ROUTE_DEFINITIONS: RouteDefinition[] = [
  {
    id: 'route_wealth',
    label: '营商致富',
    entrySignals: [
      { kind: 'entry', ageBand: '0-10', flagKey: 'p9_early_business_focus', description: '幼年营商行动' },
    ],
    reinforcementPoints: [
      { kind: 'reinforcement', ageBand: '20-30', eventId: 'merchant_first_trade', description: '初次经商' },
    ],
    divergencePoints: [
      { kind: 'divergence', ageBand: '28-32', eventId: 'p9_merchant_midlife_caravan', flagKey: 'p9_merchant_midlife_path', description: '商路中段分化' },
    ],
    identitySignals: [
      { kind: 'identity', ageBand: '30-40', flagKey: 'p9_route_identity_merchant_master', description: '商路之主或投资者' },
    ],
  },
  {
    id: 'route_wanderer',
    label: '游历江湖',
    entrySignals: [
      { kind: 'entry', ageBand: '0-10', flagKey: 'p9_early_travel_focus', description: '幼年游历行动' },
    ],
    reinforcementPoints: [
      { kind: 'reinforcement', ageBand: '20-30', description: '路上结识人脉' },
    ],
    divergencePoints: [
      { kind: 'divergence', ageBand: '28-32', eventId: 'p9_wanderer_midlife_discovery', flagKey: 'p9_wanderer_midlife_path', description: '远游记名' },
    ],
    identitySignals: [
      { kind: 'identity', ageBand: '30-40', flagKey: 'p9_route_identity_wanderer', description: '活地图或游侠护卫' },
    ],
  },
  {
    id: 'route_martial',
    label: '习武成名',
    entrySignals: [
      { kind: 'entry', ageBand: '0-10', flagKey: 'p9_echo_training_hook', description: '幼年练功' },
    ],
    reinforcementPoints: [
      { kind: 'reinforcement', ageBand: '10-20', eventId: 'p9_childhood_sword_trial', flagKey: 'p9_childhood_sword_trial', description: '童子试剑' },
    ],
    divergencePoints: [
      { kind: 'divergence', ageBand: '26-28', eventId: 'p9_training_echo_midlife', description: '功底显现' },
    ],
    identitySignals: [
      { kind: 'identity', ageBand: '30-40', flagKey: 'p9_milestone_route_signal', description: '武道天资确认' },
    ],
  },
  {
    id: 'route_deviant',
    label: '邪路偏锋',
    entrySignals: [
      { kind: 'entry', ageBand: '0-10', flagKey: 'p9_echo_training_hook', description: '幼年练功' },
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
  },
  {
    id: 'route_scholar',
    label: '治学成名',
    entrySignals: [
      { kind: 'entry', ageBand: '0-10', flagKey: 'p9_echo_study_hook', description: '幼年读书行动' },
    ],
    reinforcementPoints: [],
    divergencePoints: [
      { kind: 'divergence', ageBand: '24-28', eventId: 'p9_study_echo_midlife', description: '学识回响' },
    ],
    identitySignals: [
      { kind: 'identity', ageBand: '30-40', flagKey: 'p9_route_identity_scholar', description: '讲学名士' },
    ],
  },
  {
    id: 'route_social',
    label: '交游成名',
    entrySignals: [
      { kind: 'entry', ageBand: '0-10', flagKey: 'p9_early_social_focus', description: '幼年交游行动' },
    ],
    reinforcementPoints: [],
    divergencePoints: [
      { kind: 'divergence', ageBand: '26-30', eventId: 'p9_social_echo_midlife', description: '人脉回响' },
    ],
    identitySignals: [
      { kind: 'identity', ageBand: '30-40', flagKey: 'p9_route_identity_social', description: '人脉枢纽' },
    ],
  },
];

export function getRouteDefinition(routeId: string): RouteDefinition | undefined {
  return WUXIA_ROUTE_DEFINITIONS.find(r => r.id === routeId);
}

export function getRouteIdentityFromFlags(flags: Record<string, unknown>): string | null {
  if (flags.p9_route_identity_merchant_master) {
    return String(flags.p9_route_identity_merchant_master);
  }
  if (flags.p9_route_identity_wanderer) {
    return String(flags.p9_route_identity_wanderer);
  }
  if (flags.p9_route_identity_deviant) {
    return String(flags.p9_route_identity_deviant);
  }
  if (flags.p9_route_identity_cautious) {
    return String(flags.p9_route_identity_cautious);
  }
  if (flags.p9_route_identity_scholar) {
    return String(flags.p9_route_identity_scholar);
  }
  if (flags.p9_route_identity_social) {
    return String(flags.p9_route_identity_social);
  }
  if (flags.p9_milestone_route_signal) {
    return String(flags.p9_milestone_route_signal);
  }
  return null;
}
