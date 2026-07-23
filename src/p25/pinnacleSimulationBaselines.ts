import { evaluateCompositeDestinyOutcome, evaluatePinnacleDestinies } from '../p16/compositeDestiny';
import { getWorldProfile } from '../narrative/worldProfile';
import type { PlayerState } from '../types/eventTypes';
import { evaluateMainstreamAchievementProgress } from './achievementTraceability';
import type { LifePathFixture } from './validationSlices';

export interface P25PinnacleBaselineConfig {
  sampleCount: number;
  seedStart: number;
  seedEnd: number;
  command: string;
}

export const P25_PINNACLE_BASELINE_CONFIG: P25PinnacleBaselineConfig = {
  sampleCount: 32,
  seedStart: 2001,
  seedEnd: 2032,
  command: 'npm exec tsx scripts/runP25PinnacleBaseline.ts',
};

export type PinnacleFailureAttribution =
  | 'missing_rare_line'
  | 'missing_key_choice'
  | 'missed_window'
  | 'stat_shortfall'
  | 'unlocked';

export interface P25PinnacleBaselineMetrics {
  generatedAt: string;
  config: P25PinnacleBaselineConfig;
  pinnacleUnlockRates: Record<string, number>;
  mainstreamMedianUnlockRate: number;
  pinnacleMaxUnlockRate: number;
  pinnacleRateBelowMainstreamMedian: boolean;
  failureAttribution: Record<PinnacleFailureAttribution, number>;
  failureAttributionRate: number;
  failureAttributionMeetsThreshold: boolean;
  gatePlayability: 'PASS' | 'SKIP' | 'FAIL';
  gateP20: 'PASS' | 'SKIP' | 'FAIL';
}

/** Representative pinnacle pursuit paths for baseline + window-waste slice. */
export const P25_PINNACLE_LIFE_PATHS: LifePathFixture[] = [
  {
    id: 'pinnacle_myth_grind_no_luck',
    label: '武林神话·满属性缺机缘',
    originId: 'martial_family',
    player: { age: 40, martialPower: 98, reputation: 80, connections: 30, money: 40 },
    flags: { p16_guardian_oath: true },
  },
  {
    id: 'pinnacle_myth_luck_no_choice',
    label: '武林神话·有机缘缺护道誓',
    originId: 'martial_family',
    player: { age: 38, martialPower: 96, reputation: 78, connections: 25, money: 35 },
    flags: { p16_rare_master_encounter: true },
  },
  {
    id: 'pinnacle_patriarch_grind_no_luck',
    label: '开派祖师·满资源缺名士线',
    originId: 'scholar_house',
    player: { age: 42, martialPower: 75, reputation: 60, connections: 75, money: 60 },
    flags: { p16_alliance_brokered: true },
  },
  {
    id: 'pinnacle_patriarch_luck_no_choice',
    label: '开派祖师·有名士线缺盟会',
    originId: 'merchant_house',
    player: { age: 41, martialPower: 72, reputation: 55, connections: 72, money: 58 },
    flags: { p16_scholar_mentor: true },
  },
  {
    id: 'pinnacle_dual_complete_myth',
    label: '武林神话·双门槛齐',
    originId: 'martial_family',
    player: { age: 39, martialPower: 97, reputation: 78, connections: 20, money: 30 },
    flags: { p16_guardian_oath: true, p16_rare_master_encounter: true },
  },
  {
    id: 'pinnacle_dual_complete_patriarch',
    label: '开派祖师·双门槛齐',
    originId: 'scholar_house',
    player: { age: 43, martialPower: 74, reputation: 58, connections: 72, money: 56 },
    flags: { p16_alliance_brokered: true, p16_scholar_mentor: true },
  },
];

function seededFixture(seed: number): LifePathFixture {
  const base = P25_PINNACLE_LIFE_PATHS[seed % P25_PINNACLE_LIFE_PATHS.length]!;
  const variance = seed % 5;
  return {
    ...base,
    flags: { ...base.flags, sim_seed: seed },
    player: {
      ...base.player,
      martialPower: (base.player.martialPower ?? 50) + variance - 2,
      reputation: (base.player.reputation ?? 50) + variance - 2,
    },
  };
}

function attributePinnacleFailure(
  outcomeId: string,
  player: PlayerState,
  flags: Record<string, unknown>,
  worldId: string,
): PinnacleFailureAttribution {
  const outcome = getWorldProfile(worldId).pinnacleDestinyOutcomes?.find(o => o.id === outcomeId);
  if (!outcome) return 'stat_shortfall';
  const report = evaluateCompositeDestinyOutcome(outcome, player, flags);
  if (report.unlocked) return 'unlocked';
  if (report.unmetGates?.luck) {
    const detail = report.unmetGates.luck;
    if (detail.includes('missing flags')) return 'missing_rare_line';
    return 'missed_window';
  }
  if (report.unmetGates?.choice) return 'missing_key_choice';
  const luckDim = report.dimensions.find(d => d.dimension === 'special_event' && d.status !== 'satisfied');
  if (luckDim) return 'missing_rare_line';
  const choiceDim = report.dimensions.find(d => d.dimension === 'key_choices' && d.status !== 'satisfied');
  if (choiceDim) return 'missing_key_choice';
  return 'stat_shortfall';
}

export function runP25PinnacleBaseline(
  config: P25PinnacleBaselineConfig = P25_PINNACLE_BASELINE_CONFIG,
  worldId = 'wuxia',
): P25PinnacleBaselineMetrics {
  const pinnacleIds = (getWorldProfile(worldId).pinnacleDestinyOutcomes ?? []).map(o => o.id);
  const unlockCounts: Record<string, number> = Object.fromEntries(pinnacleIds.map(id => [id, 0]));
  const mainstreamUnlockCounts: Record<string, number> = {};
  const attributionCounts: Record<PinnacleFailureAttribution, number> = {
    missing_rare_line: 0,
    missing_key_choice: 0,
    missed_window: 0,
    stat_shortfall: 0,
    unlocked: 0,
  };

  const sampleCount = config.seedEnd - config.seedStart + 1;
  for (let seed = config.seedStart; seed <= config.seedEnd; seed++) {
    const path = seededFixture(seed);
    const player = {
      name: `pinnacle-sim-${seed}`,
      age: path.player.age ?? 40,
      traits: ['keen_mind', 'lazy', 'competitive'],
      ...path.player,
    } as PlayerState;
    const flags = { ...path.flags };

    const pinnacleReports = evaluatePinnacleDestinies(player, flags, worldId);
    for (const report of pinnacleReports) {
      if (report.unlocked) {
        unlockCounts[report.outcomeId] = (unlockCounts[report.outcomeId] ?? 0) + 1;
        attributionCounts.unlocked += 1;
      } else {
        const attr = attributePinnacleFailure(report.outcomeId, player, flags, worldId);
        attributionCounts[attr] += 1;
      }
    }

    for (const report of evaluateMainstreamAchievementProgress(player, flags, worldId)) {
      if (report.unlocked) {
        mainstreamUnlockCounts[report.outcomeId] = (mainstreamUnlockCounts[report.outcomeId] ?? 0) + 1;
      }
    }
  }

  const pinnacleUnlockRates: Record<string, number> = {};
  for (const id of pinnacleIds) {
    pinnacleUnlockRates[id] = (unlockCounts[id] ?? 0) / sampleCount;
  }
  const mainstreamRates = Object.values(mainstreamUnlockCounts).map(c => c / sampleCount);
  const mainstreamMedian =
    mainstreamRates.length === 0
      ? 0
      : [...mainstreamRates].sort((a, b) => a - b)[Math.floor(mainstreamRates.length / 2)]!;
  const pinnacleMax = Math.max(0, ...Object.values(pinnacleUnlockRates));

  const failureTotal =
    attributionCounts.missing_rare_line +
    attributionCounts.missing_key_choice +
    attributionCounts.missed_window +
    attributionCounts.stat_shortfall;
  const attributable =
    attributionCounts.missing_rare_line +
    attributionCounts.missing_key_choice +
    attributionCounts.missed_window;
  const failureAttributionRate = failureTotal > 0 ? attributable / failureTotal : 1;

  return {
    generatedAt: new Date().toISOString(),
    config,
    pinnacleUnlockRates,
    mainstreamMedianUnlockRate: mainstreamMedian,
    pinnacleMaxUnlockRate: pinnacleMax,
    pinnacleRateBelowMainstreamMedian: pinnacleMax < mainstreamMedian,
    failureAttribution: attributionCounts,
    failureAttributionRate,
    failureAttributionMeetsThreshold: failureAttributionRate >= 0.8,
    gatePlayability: 'SKIP',
    gateP20: 'SKIP',
  };
}

export function formatPinnacleBaselineMarkdown(metrics: P25PinnacleBaselineMetrics): string {
  return [
    '# P25 Pinnacle Simulation Acceptance Baseline (US-011)',
    '',
    `Generated: ${metrics.generatedAt}`,
    '',
    '## Command',
    '',
    '```bash',
    metrics.config.command,
    '```',
    '',
    `Samples: ${metrics.config.sampleCount} (seeds ${metrics.config.seedStart}–${metrics.config.seedEnd})`,
    '',
    '## Pinnacle unlock rates',
    '',
    ...Object.entries(metrics.pinnacleUnlockRates).map(
      ([id, rate]) => `- \`${id}\`: ${(rate * 100).toFixed(1)}%`,
    ),
    '',
    `- mainstreamMedianUnlockRate: ${(metrics.mainstreamMedianUnlockRate * 100).toFixed(1)}%`,
    `- pinnacleMaxUnlockRate: ${(metrics.pinnacleMaxUnlockRate * 100).toFixed(1)}%`,
    `- pinnacle below mainstream median: **${metrics.pinnacleRateBelowMainstreamMedian ? 'YES' : 'NO'}**`,
    '',
    '## Failure attribution',
    '',
    ...Object.entries(metrics.failureAttribution).map(
      ([k, v]) => `- ${k}: ${v}`,
    ),
    '',
    `- attributable rate (rare line / choice / window): ${(metrics.failureAttributionRate * 100).toFixed(1)}%`,
    `- meets ≥80% threshold: **${metrics.failureAttributionMeetsThreshold ? 'YES' : 'NO'}**`,
    '',
    '## Gates',
    '',
    `- gate:playability: ${metrics.gatePlayability}`,
    `- gate:p20: ${metrics.gateP20}`,
    '',
  ].join('\n');
}
