import type { GameState } from '../types/eventTypes';
import type { RouteLifecycleState } from '../core/RouteStateManager';

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
  renown: '江湖名宿',
  medical: '医者之路',
  martial: '武道',
  statecraft: '经世',
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
  route_renown_committed: '江湖名宿之路',
  route_medical_committed: '医者之路',
};

const SECT_FACTION_LABELS: Record<string, string> = {
  orthodox: '传统门派',
  unconventional: '非传统门派',
  neutral: '中立门派',
};

const LONG_TERM_FLAG_LABELS: Record<string, string> = {
  route_orthodox: '踏上正道',
  route_demonic: '堕入魔道',
  route_wanderer: '选择游侠',
  route_border: '边城立名',
  route_merchant: '踏上商路',
  p9_echo_business_hook: '营生方向已被记住，后续机会会由此打开',
  p9_early_business_focus: '早期营生重心已确立，人生会沿此方向展开',
  p9_echo_training_hook: '习武方向已被记住，后续机会会由此打开',
  p9_early_training_focus: '早期习武重心已确立，人生会沿此方向展开',
  p9_echo_social_hook: '童年交游经历已被记录',
  p9_early_social_focus: '早期交游重心已确立，人生会沿此方向展开',
  hvg_merchant_ledger_track: '走上账房见习之路',
  hvg_merchant_caravan_track: '走上认货跑商之路',
  hvg_merchant_shaping_watching: '营生塑形初现，仍在观望',
  hvg_merchant_ledger_confirmed: '账房路已确认，守账识风险',
  hvg_merchant_caravan_confirmed: '货路已确认，认货见世面',
  hvg_merchant_ledger_challenge_steady: '逐户收账练出了稳手',
  hvg_merchant_ledger_challenge_rushed: '赶账收了第一笔，也尝到疏漏风险',
  hvg_merchant_caravan_challenge_steady: '跟老伙计押货练稳了脚',
  hvg_merchant_caravan_challenge_bold: '赌行市赢了第一回，也见识涨跌',
  hvg_merchant_ledger_rhythm_steady: '守赊欠控库存，稳周转起家',
  hvg_merchant_ledger_rhythm_expand: '小步扩货试探新门路',
  hvg_merchant_caravan_rhythm_fast: '快周转压货把货路跑通',
  hvg_merchant_caravan_rhythm_market: '盯行市小赌涨跌吃波动',
  hvg_merchant_ledger_pressure_credit: '头一回催收赊欠，账收回来了',
  hvg_merchant_ledger_pressure_stockout: '断货险些砸了招牌',
  hvg_merchant_caravan_pressure_swing_win: '行市大跌时咬牙扛住',
  hvg_merchant_caravan_pressure_swing_loss: '低价囤货吃了亏',
  sect_faction: '门派倾向确立',
  origin_scholar_family: '书香门第出身',
  origin_merchant_family: '商贾之家出身',
  origin_wuxia_family: '武林世家出身',
  tavern_renown_bridge_crossed: '踏上江湖名宿之路',
  tavern_medical_bridge_crossed: '踏上医者之路',
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
  const label = LONG_TERM_FLAG_LABELS[flag];
  if (label) {
    return value ? label : `失去：${label}`;
  }
  return value ? '命运出现新变化' : '某段因缘告一段落';
}

export function isPlayerVisibleFlag(flag: string): boolean {
  return Boolean(
    LONG_TERM_FLAG_LABELS[flag]
    || ROUTE_FLAG_LABELS[flag]
    || flag === 'sect_faction'
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
  if (flags.tavern_renown_bridge_crossed || flags.route_renown_committed) {
    return { name: '江湖名宿', phase: '路线进行中' };
  }
  if (flags.tavern_medical_bridge_crossed || flags.route_medical_committed) {
    if (flags.tavern_embrace_compassionate_healer) {
      return { name: '仁心医者', phase: '路线进行中' };
    }
    if (flags.tavern_embrace_pragmatic_healer) {
      return { name: '世故人医', phase: '路线进行中' };
    }
    return { name: '医者之路', phase: '路线进行中' };
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

  if (flags.tavern_renown_bridge_crossed || flags.route_renown_committed) {
    return 'renown';
  }

  if (flags.tavern_medical_bridge_crossed || flags.route_medical_committed) {
    return 'medical';
  }

  return null;
}
