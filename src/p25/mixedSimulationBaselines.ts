import { evaluateMixedDestinies } from '../p16/compositeDestiny';
import { getWorldProfile } from '../narrative/worldProfile';
import type { PlayerState } from '../types/eventTypes';
import { evaluateMainstreamAchievementProgress, evaluatePinnacleAchievementProgress } from './achievementTraceability';
import type { LifePathFixture } from './validationSlices';

export interface P25MixedBaselineConfig {
  sampleCount: number;
  seedStart: number;
  seedEnd: number;
  command: string;
}

export const P25_MIXED_BASELINE_CONFIG: P25MixedBaselineConfig = {
  sampleCount: 32,
  seedStart: 3001,
  seedEnd: 3032,
  command: 'npm exec tsx scripts/runP25MixedBaseline.ts',
};

export interface P25MixedBaselineMetrics {
  generatedAt: string;
  config: P25MixedBaselineConfig;
  mixedUnlockRates: Record<string, number>;
  crossTrackCoverage: Record<string, { satisfied: number; total: number; rate: number }>;
  mainstreamRegression: Record<string, number>;
  pinnacleRegression: Record<string, number>;
  gatePlayability: 'PASS' | 'SKIP' | 'FAIL';
  gateP20: 'PASS' | 'SKIP' | 'FAIL';
}

/** Representative mixed pursuit paths for baseline + identity slice. */
export const P25_MIXED_LIFE_PATHS: LifePathFixture[] = [
  {
    id: 'mixed_merchant_magnate_path',
    label: '巨贾行商·商路齐',
    originId: 'merchant_house',
    player: { age: 48, martialPower: 40, reputation: 55, connections: 65, money: 70 },
    flags: { route_merchant: true, route_wealth_committed: true, merchant_empire: true },
    summarySignals: ['商路', '富甲'],
  },
  {
    id: 'mixed_healer_swordsman_path',
    label: '医武双绝·文武齐',
    originId: 'martial_family',
    player: { age: 42, martialPower: 62, reputation: 55, connections: 35, money: 40 },
    flags: { medical_divine_doctor_fame: true, orthodox_trial_completed: true },
    summarySignals: ['医术', '武学'],
  },
  {
    id: 'mixed_merchant_patron_path',
    label: '商武一体·投资齐',
    originId: 'merchant_house',
    player: { age: 44, martialPower: 55, reputation: 50, connections: 50, money: 60 },
    flags: { route_merchant: true, route_wealth_committed: true, merchant_invest_good: true },
    summarySignals: ['商贾', '武学'],
  },
  {
    id: 'mixed_merchant_partial',
    label: '巨贾行商·缺商路',
    originId: 'merchant_house',
    player: { age: 46, martialPower: 35, reputation: 50, connections: 60, money: 65 },
    flags: { merchant_wealthy: true },
    summarySignals: ['富商'],
  },
  {
    id: 'mixed_healer_partial',
    label: '医武双绝·缺医术',
    originId: 'scholar_house',
    player: { age: 40, martialPower: 58, reputation: 52, connections: 30, money: 35 },
    flags: { orthodox_trial_completed: true },
    summarySignals: ['武学'],
  },
  {
    id: 'mixed_patron_partial',
    label: '商武一体·缺投资',
    originId: 'streetborn',
    player: { age: 43, martialPower: 52, reputation: 45, connections: 40, money: 55 },
    flags: { route_wealth_committed: true },
    summarySignals: ['商路'],
  },
];

function seededFixture(seed: number): LifePathFixture {
  const base = P25_MIXED_LIFE_PATHS[seed % P25_MIXED_LIFE_PATHS.length]!;
  const variance = seed % 4;
  return {
    ...base,
    flags: { ...base.flags, sim_seed: seed },
    player: {
      ...base.player,
      money: (base.player.money ?? 50) + variance * 3,
      martialPower: (base.player.martialPower ?? 50) + variance - 1,
    },
  };
}

export function runP25MixedBaseline(
  config: P25MixedBaselineConfig = P25_MIXED_BASELINE_CONFIG,
  worldId = 'wuxia',
): P25MixedBaselineMetrics {
  const mixedIds = (getWorldProfile(worldId).mixedDestinyOutcomes ?? []).map(o => o.id);
  const unlockCounts: Record<string, number> = Object.fromEntries(mixedIds.map(id => [id, 0]));
  const trackSatisfied: Record<string, number> = {};
  const trackTotal: Record<string, number> = {};
  const mainstreamUnlockCounts: Record<string, number> = {};
  const pinnacleUnlockCounts: Record<string, number> = {};

  const sampleCount = config.seedEnd - config.seedStart + 1;
  for (let seed = config.seedStart; seed <= config.seedEnd; seed++) {
    const path = seededFixture(seed);
    const player = {
      name: `mixed-sim-${seed}`,
      age: path.player.age ?? 40,
      traits: ['keen_mind', 'lazy', 'competitive'],
      ...path.player,
    } as PlayerState;
    const flags = { ...path.flags };

    const mixedReports = evaluateMixedDestinies(player, flags, worldId);
    for (const report of mixedReports) {
      if (report.unlocked) {
        unlockCounts[report.outcomeId] = (unlockCounts[report.outcomeId] ?? 0) + 1;
      }
      const outcome = getWorldProfile(worldId).mixedDestinyOutcomes?.find(o => o.id === report.outcomeId);
      for (const group of outcome?.crossTrackGroups ?? []) {
        trackTotal[group.trackId] = (trackTotal[group.trackId] ?? 0) + 1;
        const satisfied = group.requirementIndices.every(
          idx => report.dimensions[idx]?.status === 'satisfied',
        );
        if (satisfied) {
          trackSatisfied[group.trackId] = (trackSatisfied[group.trackId] ?? 0) + 1;
        }
      }
    }

    for (const report of evaluateMainstreamAchievementProgress(player, flags, worldId)) {
      if (report.unlocked) {
        mainstreamUnlockCounts[report.outcomeId] = (mainstreamUnlockCounts[report.outcomeId] ?? 0) + 1;
      }
    }
    for (const report of evaluatePinnacleAchievementProgress(player, flags, worldId)) {
      if (report.unlocked) {
        pinnacleUnlockCounts[report.outcomeId] = (pinnacleUnlockCounts[report.outcomeId] ?? 0) + 1;
      }
    }
  }

  const mixedUnlockRates: Record<string, number> = {};
  for (const id of mixedIds) {
    mixedUnlockRates[id] = (unlockCounts[id] ?? 0) / sampleCount;
  }

  const crossTrackCoverage: Record<string, { satisfied: number; total: number; rate: number }> = {};
  for (const trackId of Object.keys(trackTotal)) {
    const total = trackTotal[trackId] ?? 0;
    const satisfied = trackSatisfied[trackId] ?? 0;
    crossTrackCoverage[trackId] = {
      satisfied,
      total,
      rate: total > 0 ? satisfied / total : 0,
    };
  }

  const mainstreamRegression: Record<string, number> = {};
  for (const [id, count] of Object.entries(mainstreamUnlockCounts)) {
    mainstreamRegression[id] = count / sampleCount;
  }
  const pinnacleRegression: Record<string, number> = {};
  for (const [id, count] of Object.entries(pinnacleUnlockCounts)) {
    pinnacleRegression[id] = count / sampleCount;
  }

  return {
    generatedAt: new Date().toISOString(),
    config,
    mixedUnlockRates,
    crossTrackCoverage,
    mainstreamRegression,
    pinnacleRegression,
    gatePlayability: 'SKIP',
    gateP20: 'SKIP',
  };
}

export function formatMixedBaselineMarkdown(metrics: P25MixedBaselineMetrics): string {
  return [
    '# P25 Mixed Simulation Acceptance Baseline (US-015)',
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
    '## Mixed unlock rates',
    '',
    ...Object.entries(metrics.mixedUnlockRates).map(
      ([id, rate]) => `- \`${id}\`: ${(rate * 100).toFixed(1)}%`,
    ),
    '',
    '## Cross-track dimension coverage',
    '',
    ...Object.entries(metrics.crossTrackCoverage).map(
      ([trackId, cov]) =>
        `- \`${trackId}\`: ${cov.satisfied}/${cov.total} (${(cov.rate * 100).toFixed(1)}%)`,
    ),
    '',
    '## Regression (mainstream / pinnacle unlock rates on same fixtures)',
    '',
    '### Mainstream',
    ...Object.entries(metrics.mainstreamRegression).map(
      ([id, rate]) => `- \`${id}\`: ${(rate * 100).toFixed(1)}%`,
    ),
    '',
    '### Pinnacle',
    ...Object.entries(metrics.pinnacleRegression).map(
      ([id, rate]) => `- \`${id}\`: ${(rate * 100).toFixed(1)}%`,
    ),
    '',
    '## Gates',
    '',
    `- gate:playability: ${metrics.gatePlayability}`,
    `- gate:p20: ${metrics.gateP20}`,
    '',
  ].join('\n');
}
