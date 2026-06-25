import type { GameState } from '../types/eventTypes';
import type { RouteLifecycleState } from '../core/RouteStateManager';
import {
  SHAPING_AXES,
  shapingAxisKeyFromFeedbackFlag,
} from './habitShapingSummary';

const PRIORITY_ROUTE_IDS = ['sect', 'wanderer', 'demonic'] as const;

export const ROUTE_DISPLAY_NAMES: Record<string, string> = {
  sect: '正道门派',
  wanderer: '流浪侠客',
  demonic: '魔道',
  hero: '侠义之路',
  official: '仕途',
  beggars: '丐帮',
  merchant: '商路',
  hermit: '隐逸',
  orthodox: '正道门派',
  demonic_path: '魔道',
};

const ROUTE_FLAG_LABELS: Record<string, string> = {
  route_orthodox: '正道门派',
  route_demonic: '魔道',
  route_wanderer: '流浪侠客',
  route_border: '边城侠踪',
  route_beggars: '丐帮',
  route_official: '仕途',
  route_merchant: '商路',
  route_wealth_committed: '商路',
};

const SECT_FACTION_LABELS: Record<string, string> = {
  orthodox: '传统门派',
  unconventional: '非传统门派',
  neutral: '中立门派',
};

const SHAPING_FEEDBACK_LABELS = Object.fromEntries(
  SHAPING_AXES.map((axis) => [
    `shaping_${axis.key}_up`,
    `${axis.shortLabel}加深`,
  ]),
) as Record<string, string>;

const LONG_TERM_FLAG_LABELS: Record<string, string> = {
  route_orthodox: '踏上正道',
  route_demonic: '堕入魔道',
  route_wanderer: '选择游侠',
  route_border: '边城立名',
  sect_faction: '门派倾向确立',
  origin_scholar_family: '书香门第出身',
  origin_merchant_family: '商贾之家出身',
  origin_wuxia_family: '武林世家出身',
};

export function formatRouteLabel(raw: string | null | undefined): string {
  if (!raw) {
    return '未定';
  }
  return (
    ROUTE_FLAG_LABELS[raw]
    || SECT_FACTION_LABELS[raw]
    || ROUTE_DISPLAY_NAMES[raw]
    || '路线变化'
  );
}

export function lifecyclePhaseLabel(
  lifecycle: RouteLifecycleState,
  lockedIn: boolean,
): string {
  if (lifecycle === 'inactive') {
    return '未入门';
  }
  if (lifecycle === 'completed') {
    return '已完成';
  }
  if (lifecycle === 'failed') {
    return '已失败';
  }
  if (lifecycle === 'turned') {
    return '已转向';
  }
  if (lockedIn || lifecycle === 'locked_in') {
    return '已承诺';
  }
  if (lifecycle === 'temporary' || lifecycle === 'active') {
    return '路线进行中';
  }
  return '路线进行中';
}

export function formatLongTermFlag(flag: string, value: boolean): string {
  const label = LONG_TERM_FLAG_LABELS[flag] || SHAPING_FEEDBACK_LABELS[flag];
  if (label) {
    return value ? label : `失去：${label}`;
  }
  return value ? '命运出现新变化' : '某段因缘告一段落';
}

export function isPlayerVisibleFlag(flag: string): boolean {
  return Boolean(
    LONG_TERM_FLAG_LABELS[flag]
    || ROUTE_FLAG_LABELS[flag]
    || SHAPING_FEEDBACK_LABELS[flag]
    || flag === 'sect_faction'
    || shapingAxisKeyFromFeedbackFlag(flag),
  );
}

export function getPlayerRouteSummary(state: GameState): { name: string; phase: string } {
  const routeStates = state.routeStates || {};
  for (const routeId of PRIORITY_ROUTE_IDS) {
    const routeState = routeStates[routeId];
    if (!routeState || routeState.lifecycle === 'inactive') {
      continue;
    }
    return {
      name: ROUTE_DISPLAY_NAMES[routeId] || routeId,
      phase: lifecyclePhaseLabel(routeState.lifecycle, routeState.lockedIn),
    };
  }

  const flags = state.flags || {};
  if (flags.route_orthodox) {
    return { name: '正道门派', phase: '路线进行中' };
  }
  if (flags.route_demonic) {
    return { name: '魔道', phase: '路线进行中' };
  }
  if (flags.route_wanderer || flags.route_border) {
    return { name: '流浪侠客', phase: '路线进行中' };
  }
  if (
    flags.route_merchant
    || flags.route_wealth_committed
    || flags.p22_wealth_route_forked
    || flags.p9_merchant_midlife_path
    || flags.p9_wealth_caravan_gate_done
    || (
      flags.p8_route_wealth
      && (flags.p9_early_business_focus || flags.p16_deferred_business_upbringing || flags.p9_echo_business_hook)
    )
  ) {
    return { name: '商路', phase: '路线进行中' };
  }

  const faction = flags.sect_faction;
  if (typeof faction === 'string' && SECT_FACTION_LABELS[faction]) {
    return { name: SECT_FACTION_LABELS[faction], phase: '未入门' };
  }

  return { name: '未定', phase: '未入门' };
}

export function readRouteLabelFromFlags(flags: Record<string, unknown> | undefined): string | null {
  const raw = readRawRouteKeyFromFlags(flags);
  if (!raw) {
    return null;
  }
  return formatRouteLabel(raw);
}

/** Canonical route key for feedback / diagnostics (not player-facing copy). */
export function readRawRouteKeyFromFlags(flags: Record<string, unknown> | undefined): string | null {
  if (!flags) {
    return null;
  }

  const sectFaction = flags.sect_faction;
  if (typeof sectFaction === 'string' && sectFaction.length > 0) {
    return sectFaction;
  }

  if (flags.route_orthodox) {
    return 'orthodox';
  }
  if (flags.route_demonic) {
    return 'demonic';
  }
  if (flags.route_wanderer || flags.route_border) {
    return 'wanderer';
  }
  if (flags.route_beggars) {
    return 'beggars';
  }
  if (flags.route_official) {
    return 'official';
  }
  if (
    flags.route_merchant
    || flags.route_wealth_committed
    || flags.p22_wealth_route_forked
    || flags.p9_merchant_midlife_path
    || flags.p9_wealth_caravan_gate_done
    || (
      flags.p8_route_wealth
      && (flags.p9_early_business_focus || flags.p16_deferred_business_upbringing || flags.p9_echo_business_hook)
    )
  ) {
    return 'merchant';
  }

  return null;
}
