/**
 * P123 scope lock — first-screen stat surfaces (display emphasis only).
 *
 * In scope:
 * - `coreStats`: first-screen core attribute grid (MainScreenStatsPanel)
 * - `topResources`: header resource row (GameScreen status bar)
 *
 * Baseline composition (pre-P123):
 * - coreStats: martialPower, externalSkill, internalSkill, qinggong, constitution, money
 * - topResources: money, constitution, reputation
 *
 * Out of scope for P123 (do not modify):
 * - `fullStatGroups` structure and descriptions (owned by P125)
 * - `tendencySummary` algorithm (owned by P124)
 * - event conditions, reward logic, underlying stat calculations
 *
 * ---
 * P124 scope lock — tendencySummary rebalancing (summary ranking only).
 *
 * In scope:
 * - `buildTendencySummary`: single-line growth tendency in MainScreenLifeSummary
 *
 * Allowed inputs (existing wiring only):
 * - player stats on MainScreenPlayer (martial, mind, jianghu, livelihood fields)
 * - `lifeMemory.routeStatus` (routeId, name, phase — route context, not routeSummary text)
 * - `player.lifeStates` (habit axes for shaping-aligned boosts; not shapingSummary text)
 *
 * Verification samples (locked for P124 narrow tests):
 * - Non-martial: routeId `merchant`, businessHabit >= 2, modest martial stats
 * - Martial-dominant: martialPower >= 30 with clustered martial sub-stats
 *
 * Out of scope for P124 (do not modify):
 * - `buildRouteSummary`, `buildShapingSummary`, `buildFullStatGroups`, `CORE_STATS`
 * - attribute definitions, event conditions, reward logic, underlying stat calculations
 */
import type { PlayerSummaryDto } from '../contracts/sessionProgression';
import type { PlayerLifeStates, PlayerState } from '../types/eventTypes';
import type { LifeMemoryRiskSeverity, LifeMemorySummary } from '../types/lifeMemory';
import { buildCurrentShapingSummary } from '../utils/habitShapingSummary';

export interface MainScreenStatItem {
  key: string;
  label: string;
  value: number;
  description?: string;
}

export interface MainScreenStatGroup {
  id: string;
  label: string;
  items: MainScreenStatItem[];
}

export interface MainScreenModel {
  stageTags: string[];
  topResources: MainScreenStatItem[];
  routeSummary: string;
  riskSummary: string;
  tendencySummary: string;
  shapingSummary: string;
  coreStats: MainScreenStatItem[];
  fullStatGroups: MainScreenStatGroup[];
}

export type MainScreenPlayer = Pick<
  PlayerState,
  | 'martialPower'
  | 'externalSkill'
  | 'internalSkill'
  | 'qinggong'
  | 'constitution'
  | 'chivalry'
  | 'comprehension'
  | 'reputation'
  | 'money'
  | 'knowledge'
  | 'charisma'
  | 'connections'
  | 'influence'
  | 'sect'
> &
  Partial<Pick<PlayerState, 'businessAcumen' | 'lifeStates'>>;

export type MainScreenLifeStates = Pick<
  PlayerLifeStates,
  'trainingHabit' | 'studyHabit' | 'businessHabit' | 'socialMomentum' | 'familyBond'
>;

/** P124 locked non-martial verification sample — merchant route with shaping context. */
export const P124_NON_MARTIAL_SAMPLE = {
  routeId: 'merchant',
  routeName: '商路',
  routePhase: '路线进行中',
  businessHabit: 2,
} as const;

/** P124 locked martial-dominant verification sample — clustered martial sub-stats. */
export const P124_MARTIAL_DOMINANT_SAMPLE = {
  martialPower: 35,
  internalSkill: 34,
  externalSkill: 33,
  martialSpreadMax: 5,
} as const;

const RISK_LEVEL_LABELS: Record<LifeMemoryRiskSeverity, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

/** P123 first-screen core grid — martial overall readout + life essentials only. */
const CORE_STATS: Array<{ key: keyof MainScreenPlayer; label: string; description?: string }> = [
  { key: 'martialPower', label: '功力', description: '武学总读数' },
  { key: 'money', label: '银两' },
];

const TENDENCY_CANDIDATES: Array<{
  key: keyof MainScreenPlayer;
  label: string;
  bucket: string;
  weight: number;
}> = [
  { key: 'comprehension', label: '悟性', bucket: 'mind', weight: 1.25 },
  { key: 'constitution', label: '体魄', bucket: 'body', weight: 1.15 },
  { key: 'chivalry', label: '侠义', bucket: 'virtue', weight: 1.05 },
  { key: 'knowledge', label: '学识', bucket: 'mind', weight: 1.0 },
  { key: 'reputation', label: '声望', bucket: 'jianghu', weight: 0.9 },
  { key: 'connections', label: '人脉', bucket: 'jianghu', weight: 0.9 },
  { key: 'martialPower', label: '功力', bucket: 'martial', weight: 1.0 },
  { key: 'internalSkill', label: '内功', bucket: 'martial', weight: 0.95 },
  { key: 'externalSkill', label: '外功', bucket: 'martial', weight: 0.92 },
  { key: 'qinggong', label: '轻功', bucket: 'martial', weight: 0.9 },
];

function valueOf(player: MainScreenPlayer, key: keyof MainScreenPlayer): number {
  const value = player[key];
  return typeof value === 'number' ? value : 0;
}

function buildRouteSummary(summary: LifeMemorySummary): string {
  const primary = summary.routeStatus?.primary;
  if (!primary) {
    return '未定 · 未入门';
  }
  const goal = summary.routeStatus?.currentGoalLabel;
  const base = `${primary.name} · ${primary.phase}`;
  return goal ? `${base} · ${goal}` : base;
}

function buildRiskSummary(summary: LifeMemorySummary): string {
  const visibleRisks = (summary.risks ?? []).filter((item) => item.visibility === 'player');
  if (visibleRisks.length === 0) {
    return '稳 · 暂无明显隐患';
  }
  const risk = [...visibleRisks].sort((a, b) => b.sortKey - a.sortKey)[0];
  return `${RISK_LEVEL_LABELS[risk.severity]} · ${risk.label}`;
}

function buildTendencySummary(player: MainScreenPlayer, lifeMemory: LifeMemorySummary): string {
  const phase = lifeMemory.routeStatus?.primary.phase ?? '';
  const prioritizeGrowth = phase.includes('未入门');
  const martialValues = [
    valueOf(player, 'martialPower'),
    valueOf(player, 'internalSkill'),
    valueOf(player, 'externalSkill'),
  ].sort((a, b) => b - a);

  if (
    !prioritizeGrowth
    && (
      martialValues[0] >= 30
      && martialValues[2] >= 0
      && martialValues[0] - martialValues[2] <= 5
    )
  ) {
    return `功力 ${valueOf(player, 'martialPower')}`;
  }

  const ranked = TENDENCY_CANDIDATES.map((candidate) => ({
    ...candidate,
    value: valueOf(player, candidate.key),
    score: valueOf(player, candidate.key) * candidate.weight,
  }))
    .filter((candidate) => candidate.value > 0)
    .filter((candidate) => !(prioritizeGrowth && candidate.bucket === 'martial'))
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0 || ranked[0].value < 20) {
    if (
      martialValues[0] >= 30
      && martialValues[2] >= 0
      && martialValues[0] - martialValues[2] <= 5
    ) {
      return `功力 ${valueOf(player, 'martialPower')}`;
    }
    return '尚未成势';
  }

  const picks = [ranked[0]];
  for (const candidate of ranked.slice(1)) {
    if (candidate.bucket === picks[0].bucket) {
      continue;
    }
    if (candidate.value < 15) {
      continue;
    }
    picks.push(candidate);
    break;
  }

  return picks.map((item) => `${item.label} ${item.value}`).join(' / ');
}

function createStat(key: string, label: string, value: number, description?: string): MainScreenStatItem {
  return { key, label, value, description };
}

function buildFullStatGroups(player: MainScreenPlayer): MainScreenStatGroup[] {
  return [
    {
      id: 'combat',
      label: '战斗',
      items: [
        createStat('martialPower', '功力', valueOf(player, 'martialPower'), '决定武学根基与整体战力。'),
        createStat('externalSkill', '外功', valueOf(player, 'externalSkill'), '偏向招式爆发与外门硬功。'),
        createStat('internalSkill', '内功', valueOf(player, 'internalSkill'), '偏向气息、续航与心法修为。'),
        createStat('qinggong', '轻功', valueOf(player, 'qinggong'), '影响身法、追击与脱身能力。'),
        createStat('constitution', '体魄', valueOf(player, 'constitution'), '影响承伤、恢复与生存底子。'),
      ],
    },
    {
      id: 'jianghu',
      label: '江湖',
      items: [
        createStat('chivalry', '侠义', valueOf(player, 'chivalry'), '决定你在江湖中的取向与名节。'),
        createStat('reputation', '声望', valueOf(player, 'reputation'), '影响旁人对你的评价与机会。'),
        createStat('connections', '人脉', valueOf(player, 'connections'), '决定可调动的关系与支援。'),
        createStat('charisma', '魅力', valueOf(player, 'charisma'), '影响结交、说服与情感互动。'),
      ],
    },
    {
      id: 'growth',
      label: '成长',
      items: [
        createStat('comprehension', '悟性', valueOf(player, 'comprehension'), '影响领悟速度与高阶突破。'),
        createStat('knowledge', '学识', valueOf(player, 'knowledge'), '影响读书、谋划与见识深度。'),
        createStat('influence', '影响力', valueOf(player, 'influence'), '决定你能撬动多大的局面。'),
      ],
    },
    {
      id: 'resource',
      label: '资源',
      items: [
        createStat('money', '银两', valueOf(player, 'money'), '影响置办、出行与周转空间。'),
      ],
    },
  ];
}

function buildShapingSummary(player: MainScreenPlayer): string {
  return buildCurrentShapingSummary(player.lifeStates);
}

export function buildMainScreenModel(
  playerLike: MainScreenPlayer | PlayerSummaryDto,
  lifeMemory: LifeMemorySummary,
): MainScreenModel {
  const player = playerLike as MainScreenPlayer;
  const routeSummary = buildRouteSummary(lifeMemory);
  // 顶部状态条第三行只展示“门派标签 + 阶段标签”（不展示路线名称）
  const stageTags = [player.sect, lifeMemory.routeStatus?.primary.phase]
    .filter((value): value is string => Boolean(value))
    .slice(0, 2);

  return {
    stageTags,
    // P123 first-screen header row — money / survival base / social standing
    topResources: [
      createStat('money', '银两', valueOf(player, 'money')),
      createStat('constitution', '体魄', valueOf(player, 'constitution'), '生存底子'),
      createStat('reputation', '声望', valueOf(player, 'reputation')),
    ],
    routeSummary,
    riskSummary: buildRiskSummary(lifeMemory),
    tendencySummary: buildTendencySummary(player, lifeMemory),
    shapingSummary: buildShapingSummary(player),
    coreStats: CORE_STATS.map((item) =>
      createStat(String(item.key), item.label, valueOf(player, item.key), item.description),
    ),
    fullStatGroups: buildFullStatGroups(player),
  };
}
