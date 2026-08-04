/**
 * P123 scope lock — first-screen stat surfaces (display emphasis only).
 *
 * In scope:
 * - `coreStats`: first-screen core attribute grid (MainScreenStatsPanel)
 * - `topResources`: header resource row (GameScreen status bar)
 *
 * Baseline composition (pre-P123):
 * - coreStats: martialPower, constitution, money
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
 *
 * Verification samples (locked for P124 narrow tests):
 * - Non-martial: routeId `merchant`, modest martial stats
 * - Martial-dominant: martialPower >= 30
 *
 * Out of scope for P124 (do not modify):
 * - `buildRouteSummary`, `buildShapingSummary`, `buildFullStatGroups`, `CORE_STATS`
 * - attribute definitions, event conditions, reward logic, underlying stat calculations
 *
 * ---
 * P125 scope lock — full stats panel explanation layer (wording/grouping only).
 *
 * Surfaces:
 * - `buildFullStatGroups`: group labels, item order, per-stat descriptions (MainScreenStatsPanel expanded view)
 * - `MainScreenStatsPanel.vue`: renders `groups` prop — tab row + detail list; no stat semantics here
 *
 * Baseline combat group (pre-P125):
 * - group id `combat`, label `战斗`
 * - items: martialPower, constitution
 *
 * Post-P125 combat/survival layout (locked for narrow tests):
 * - `combat` (武学): martialPower
 * - `survival` (生存底子): constitution only
 *
 * In scope for P125:
 * - combat-group label, item ordering, description copy for martial/survival role clarification
 * - optional regrouping of constitution away from pure martial-specialization framing
 *
 * Out of scope for P125 (do not modify):
 * - `CORE_STATS`, `topResources`, `buildTendencySummary`, event logic, attribute calculations
 * - field removal, value formulas, tendencySummary algorithm (P123/P124)
 */
import type { PlayerSummaryDto } from '../contracts/sessionProgression';
import type { PlayerState } from '../types/eventTypes';
import type { LifeMemoryRiskSeverity, LifeMemorySummary } from '../types/lifeMemory';
import { getAffiliationDefinition } from '../core/affiliationCatalog';

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
  currentGoalSummary: string;
  affiliationSummary: string;
  titleSummary: string;
  experienceSummary: string;
  practiceSummary: string;
  riskSummary: string;
  tendencySummary: string;
  coreStats: MainScreenStatItem[];
  fullStatGroups: MainScreenStatGroup[];
}

export type MainScreenPlayer = Pick<
  PlayerState,
  | 'martialPower'
  | 'constitution'
  | 'chivalry'
  | 'comprehension'
  | 'reputation'
  | 'money'
  | 'knowledge'
  | 'charisma'
  | 'connections'
  | 'influence'
  | 'affiliation'
  | 'title'
> &
  Partial<Pick<PlayerState, 'businessAcumen' | 'lifeStates'>>;

const MARTIAL_DOMINANT_MIN_TOP = 30;
/** P124 locked martial-dominant verification sample. */
export const P124_MARTIAL_DOMINANT_SAMPLE = {
  martialPower: 35,
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
  { key: 'reputation', label: '名望', bucket: 'jianghu', weight: 0.9 },
  { key: 'connections', label: '人脉', bucket: 'jianghu', weight: 0.9 },
  { key: 'charisma', label: '魅力', bucket: 'jianghu', weight: 0.88 },
  { key: 'businessAcumen', label: '经营', bucket: 'livelihood', weight: 1.05 },
  { key: 'martialPower', label: '功力', bucket: 'martial', weight: 1.0 },
];

function isMartialDominant(player: MainScreenPlayer): boolean {
  return valueOf(player, 'martialPower') >= MARTIAL_DOMINANT_MIN_TOP;
}

function valueOf(player: MainScreenPlayer, key: keyof MainScreenPlayer): number {
  const value = player[key];
  return typeof value === 'number' ? value : 0;
}

function buildRiskSummary(summary: LifeMemorySummary): string {
  const visibleRisks = (summary.risks ?? []).filter((item) => item.visibility === 'player');
  if (visibleRisks.length === 0) {
    return '稳 · 暂无明显隐患';
  }
  const risk = [...visibleRisks].sort((a, b) => b.sortKey - a.sortKey)[0];
  return `${RISK_LEVEL_LABELS[risk.severity]} · ${risk.label}`;
}

function buildAffiliationSummary(player: MainScreenPlayer): string {
  return player.affiliation
    ? getAffiliationDefinition(player.affiliation).displayName
    : '无固定所属';
}

function buildExperienceSummary(summary: LifeMemorySummary): string {
  const achievements = summary.achievements ?? [];
  return achievements.length > 0
    ? achievements.slice(0, 3).map((item) => item.label).join(' / ')
    : '暂无经历';
}

function buildPracticeSummary(summary: LifeMemorySummary): string {
  const visiblePractice = (summary.habitTrajectory ?? [])
    .filter((entry) => entry.visibility === 'player')
    .slice(0, 2);

  return visiblePractice.length > 0
    ? visiblePractice.map((entry) => `${entry.label} · ${entry.tierLabel}`).join(' / ')
    : '尚未形成持续实践';
}

function buildTendencySummary(player: MainScreenPlayer): string {
  if (isMartialDominant(player)) {
    return `功力 ${valueOf(player, 'martialPower')}`;
  }

  const ranked = TENDENCY_CANDIDATES.map((candidate) => {
    const value = valueOf(player, candidate.key);
    return {
      ...candidate,
      value,
      score: value * candidate.weight,
    };
  })
    .filter((candidate) => candidate.value > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0 || ranked[0].value < 20) {
    if (isMartialDominant(player)) {
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
      label: '武学',
      items: [
        createStat(
          'martialPower',
          '功力·总读数',
          valueOf(player, 'martialPower'),
          '综合武学总读数，概括你当前整体战力。',
        ),
      ],
    },
    {
      id: 'survival',
      label: '生存底子',
      items: [
        createStat(
          'constitution',
          '体魄',
          valueOf(player, 'constitution'),
          '承伤耐受、恢复续航与身体底子的综合读数。',
        ),
      ],
    },
    {
      id: 'jianghu',
      label: '江湖',
      items: [
        createStat('chivalry', '侠义', valueOf(player, 'chivalry'), '决定你在江湖中的取向与名节。'),
        createStat('reputation', '名望', valueOf(player, 'reputation'), '影响旁人对你的评价与机会。'),
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

export function buildMainScreenModel(
  playerLike: MainScreenPlayer | PlayerSummaryDto,
  lifeMemory: LifeMemorySummary,
): MainScreenModel {
  const player = playerLike as MainScreenPlayer;
  const stageTags = [
    player.affiliation ? getAffiliationDefinition(player.affiliation).displayName : null,
    player.title,
  ]
    .filter((value): value is string => Boolean(value))
    .slice(0, 2);

  return {
    stageTags,
    // P123 first-screen header row — money / survival base / social standing
    topResources: [
      createStat('money', '银两', valueOf(player, 'money')),
      createStat('constitution', '体魄', valueOf(player, 'constitution'), '生存底子'),
      createStat('reputation', '名望', valueOf(player, 'reputation'), '影响规模、压力与机会，不直接代表人生投入'),
    ],
    currentGoalSummary: lifeMemory.currentGoalLabel ?? '暂无明确目标',
    affiliationSummary: buildAffiliationSummary(player),
    titleSummary: player.title ?? '暂无正式称号',
    experienceSummary: buildExperienceSummary(lifeMemory),
    practiceSummary: buildPracticeSummary(lifeMemory),
    riskSummary: buildRiskSummary(lifeMemory),
    tendencySummary: buildTendencySummary(player),
    coreStats: CORE_STATS.map((item) =>
      createStat(String(item.key), item.label, valueOf(player, item.key), item.description),
    ),
    fullStatGroups: buildFullStatGroups(player),
  };
}
