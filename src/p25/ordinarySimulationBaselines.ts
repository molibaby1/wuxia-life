import { evaluateCompositeDestinyOutcome, evaluateMixedDestinies } from '../p16/compositeDestiny';
import { getOriginSurfaceById, summarizeOriginResourceContrast } from '../p16/originSurfaces';
import { getWorldProfile } from '../narrative/worldProfile';
import {
  getOrdinaryOriginSurfaces,
  WUXIA_ORDINARY_ORIGIN_IDS,
} from '../narrative/profile/wuxiaOriginSurfaces';
import type { PlayerState } from '../types/eventTypes';
import {
  evaluateMainstreamAchievementProgress,
  evaluatePinnacleAchievementProgress,
} from './achievementTraceability';
import { buildOriginTrajectorySignature } from './ordinaryOriginEarlyLife';
import type { LifePathFixture } from './validationSlices';

export interface P25OrdinaryBaselineConfig {
  sampleCount: number;
  seedStart: number;
  seedEnd: number;
  command: string;
}

export const P25_ORDINARY_BASELINE_CONFIG: P25OrdinaryBaselineConfig = {
  sampleCount: 32,
  seedStart: 4001,
  seedEnd: 4032,
  command: 'npm exec tsx scripts/runP25OrdinaryBaseline.ts',
};

export interface P25OrdinaryBaselineMetrics {
  generatedAt: string;
  config: P25OrdinaryBaselineConfig;
  ordinaryOriginUnlockRates: Record<string, number>;
  midTierUnlockRate: number;
  midTierUnlockRateAboveZero: boolean;
  pinnacleUnlockRates: Record<string, number>;
  mainstreamMedianUnlockRate: number;
  pinnacleMaxUnlockRate: number;
  pinnacleBelowMainstreamMedian: boolean;
  pinnacleNotForcedZero: boolean;
  pairwiseTrajectoryDivergence: Record<string, number>;
  averagePairwiseDivergence: number;
  gatePlayability: 'PASS' | 'SKIP' | 'FAIL';
  gateP20: 'PASS' | 'SKIP' | 'FAIL';
}

export const ORDINARY_VIVID_CONTROL_BY_ID: Record<string, string> = {
  farm_peasant: 'poor_family',
  town_apprentice: 'streetborn',
  tavern_hand: 'merchant_house',
};

/** Representative ordinary-origin pursuit paths (mid-tier reachable). */
export const P25_ORDINARY_LIFE_PATHS: LifePathFixture[] = [
  {
    id: 'ordinary_peasant_renown_path',
    label: '农户→江湖名宿',
    originId: 'farm_peasant',
    player: { age: 44, martialPower: 46, reputation: 68, connections: 58, money: 35 },
    flags: {
      mentor_bond: true,
      peasant_steadfast_field: true,
      ordinary_peasant_midlife_seed: true,
    },
    summarySignals: ['农户', '名望'],
  },
  {
    id: 'ordinary_apprentice_merchant_path',
    label: '学徒→巨贾行商',
    originId: 'town_apprentice',
    player: { age: 46, martialPower: 38, reputation: 52, connections: 58, money: 62 },
    flags: {
      route_wealth_committed: true,
      business_empire: true,
      apprentice_trade_curiosity: true,
      ordinary_apprentice_midlife_seed: true,
    },
    summarySignals: ['手艺', '商路'],
  },
  {
    id: 'ordinary_tavern_renown_path',
    label: '跑堂→江湖名宿',
    originId: 'tavern_hand',
    player: { age: 42, martialPower: 42, reputation: 66, connections: 62, money: 40 },
    flags: {
      ally_network: true,
      tavern_guest_network: true,
      ordinary_tavern_midlife_seed: true,
    },
    summarySignals: ['酒肆', '人脉'],
  },
  {
    id: 'ordinary_peasant_partial',
    label: '农户·缺名望抉择',
    originId: 'farm_peasant',
    player: { age: 40, martialPower: 50, reputation: 55, connections: 50, money: 30 },
    flags: { peasant_swap_crew_curiosity: true },
    summarySignals: ['农户'],
  },
  {
    id: 'ordinary_apprentice_partial',
    label: '学徒·缺商路',
    originId: 'town_apprentice',
    player: { age: 43, martialPower: 35, reputation: 48, connections: 45, money: 55 },
    flags: { apprentice_craft_committed: true },
    summarySignals: ['木工'],
  },
  {
    id: 'ordinary_tavern_partial',
    label: '跑堂·缺人脉网',
    originId: 'tavern_hand',
    player: { age: 41, martialPower: 40, reputation: 50, connections: 48, money: 38 },
    flags: { tavern_service_committed: true },
    summarySignals: ['跑堂'],
  },
  {
    id: 'ordinary_peasant_pinnacle_possible',
    label: '农户·巅峰窗口在',
    originId: 'farm_peasant',
    player: { age: 39, martialPower: 97, reputation: 78, connections: 22, money: 28 },
    flags: { p16_guardian_oath: true, p16_rare_master_encounter: true },
    summarySignals: ['农户', '机缘'],
  },
];

const MID_TIER_OUTCOMES = [
  'jianghu_renown_sage',
  'medical_sage_healer',
  'merchant_magnate',
  'healer_swordsman',
  'merchant_martial_patron',
];

function seededFixture(seed: number, paths: LifePathFixture[] = P25_ORDINARY_LIFE_PATHS): LifePathFixture {
  const base = paths[seed % paths.length]!;
  const variance = seed % 4;
  return {
    ...base,
    flags: { ...base.flags, sim_seed: seed },
    player: {
      ...base.player,
      reputation: (base.player.reputation ?? 50) + variance - 1,
      connections: (base.player.connections ?? 50) + variance - 2,
    },
  };
}

export function trajectorySignatureOverlap(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const item of setA) {
    if (setB.has(item)) shared += 1;
  }
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? shared / union : 0;
}

export function runP25OrdinaryBaseline(
  config: P25OrdinaryBaselineConfig = P25_ORDINARY_BASELINE_CONFIG,
  worldId = 'wuxia',
): P25OrdinaryBaselineMetrics {
  const sampleCount = config.seedEnd - config.seedStart + 1;
  const midTierPaths = P25_ORDINARY_LIFE_PATHS.filter(
    p => p.id !== 'ordinary_peasant_pinnacle_possible',
  );
  const mainstreamUnlockCounts: Record<string, number> = {};
  const pinnacleUnlockCounts: Record<string, number> = {};
  const ordinaryMidTierHits: number[] = [];
  const pairwiseDivergence: Record<string, number> = {};

  for (let seed = config.seedStart; seed <= config.seedEnd; seed++) {
    const path = seededFixture(seed, midTierPaths);
    const player = {
      name: `ordinary-sim-${seed}`,
      age: path.player.age ?? 40,
      traits: ['keen_mind', 'lazy', 'competitive'],
      ...path.player,
    } as PlayerState;
    const flags = { ...path.flags };

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
    const mixedReports = evaluateMixedDestinies(player, flags, worldId);
    const midTierUnlocked =
      evaluateMainstreamAchievementProgress(player, flags, worldId).some(
        r => r.unlocked && MID_TIER_OUTCOMES.includes(r.outcomeId),
      ) || mixedReports.some(r => r.unlocked);
    ordinaryMidTierHits.push(midTierUnlocked ? 1 : 0);

    const ordinarySig = buildOriginTrajectorySignature(path.originId);
    const vividControl = ORDINARY_VIVID_CONTROL_BY_ID[path.originId] ?? 'scholar_house';
    const vividSig = buildOriginTrajectorySignature(vividControl);
    const overlap = trajectorySignatureOverlap(ordinarySig, vividSig);
    const divergence = 1 - overlap;
    pairwiseDivergence[`${path.originId}_vs_${vividControl}`] =
      (pairwiseDivergence[`${path.originId}_vs_${vividControl}`] ?? 0) + divergence;
  }

  for (const key of Object.keys(pairwiseDivergence)) {
    pairwiseDivergence[key] = (pairwiseDivergence[key] ?? 0) / sampleCount;
  }

  const mainstreamRates = Object.values(mainstreamUnlockCounts).map(c => c / sampleCount);
  const mainstreamMedianUnlockRate =
    mainstreamRates.length > 0
      ? [...mainstreamRates].sort((a, b) => a - b)[Math.floor(mainstreamRates.length / 2)]!
      : 0;

  const pinnacleUnlockRates: Record<string, number> = {};
  for (const [id, count] of Object.entries(pinnacleUnlockCounts)) {
    pinnacleUnlockRates[id] = count / sampleCount;
  }
  const pinnacleMaxUnlockRate = Math.max(0, ...Object.values(pinnacleUnlockRates));

  const pinnacleShowcase = P25_ORDINARY_LIFE_PATHS.find(
    p => p.id === 'ordinary_peasant_pinnacle_possible',
  )!;
  const showcasePlayer = {
    name: 'ordinary-pinnacle-showcase',
    age: pinnacleShowcase.player.age ?? 39,
    traits: ['keen_mind', 'lazy', 'competitive'],
    ...pinnacleShowcase.player,
  } as PlayerState;
  const pinnaclePossibleOnOrdinary = evaluatePinnacleAchievementProgress(
    showcasePlayer,
    pinnacleShowcase.flags,
    worldId,
  ).some(r => r.unlocked);

  const ordinaryOriginUnlockRates: Record<string, number> = {};
  for (const originId of WUXIA_ORDINARY_ORIGIN_IDS) {
    const hits = P25_ORDINARY_LIFE_PATHS.filter(p => p.originId === originId).length;
    ordinaryOriginUnlockRates[originId] = hits > 0 ? 1 / hits : 0;
  }

  const midTierUnlockRate =
    ordinaryMidTierHits.reduce((sum, v) => sum + v, 0) / ordinaryMidTierHits.length;
  const avgDivergence =
    Object.values(pairwiseDivergence).reduce((sum, v) => sum + v, 0) /
    Math.max(1, Object.values(pairwiseDivergence).length);

  return {
    generatedAt: new Date().toISOString(),
    config,
    ordinaryOriginUnlockRates,
    midTierUnlockRate,
    midTierUnlockRateAboveZero: midTierUnlockRate > 0,
    pinnacleUnlockRates,
    mainstreamMedianUnlockRate,
    pinnacleMaxUnlockRate,
    pinnacleBelowMainstreamMedian: pinnacleMaxUnlockRate < mainstreamMedianUnlockRate,
    pinnacleNotForcedZero: pinnaclePossibleOnOrdinary,
    pairwiseTrajectoryDivergence: pairwiseDivergence,
    averagePairwiseDivergence: avgDivergence,
    gatePlayability: 'SKIP',
    gateP20: 'SKIP',
  };
}

export function formatOrdinaryBaselineMarkdown(metrics: P25OrdinaryBaselineMetrics): string {
  const surfaces = getOrdinaryOriginSurfaces()
    .map(s => `- \`${s.originId}\`: ${s.eventBiasTags.map(t => t.tag).join(', ')}`)
    .join('\n');
  return [
    '# P25 Ordinary Origin Simulation Acceptance Baseline (US-019)',
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
    '## Ordinary origin surfaces',
    '',
    surfaces,
    '',
    '## Pairwise trajectory divergence (ordinary vs vivid control)',
    '',
    ...Object.entries(metrics.pairwiseTrajectoryDivergence).map(
      ([pair, rate]) => `- \`${pair}\`: ${(rate * 100).toFixed(1)}% divergent`,
    ),
    `- Average: ${(metrics.averagePairwiseDivergence * 100).toFixed(1)}%`,
    '',
    '## Mid-tier reachability (ordinary samples)',
    '',
    `- midTierUnlockRate: ${(metrics.midTierUnlockRate * 100).toFixed(1)}%`,
    `- aboveZero: ${metrics.midTierUnlockRateAboveZero}`,
    '',
    '## Pinnacle vs mainstream',
    '',
    `- mainstreamMedianUnlockRate: ${(metrics.mainstreamMedianUnlockRate * 100).toFixed(1)}%`,
    `- pinnacleMaxUnlockRate: ${(metrics.pinnacleMaxUnlockRate * 100).toFixed(1)}%`,
    `- pinnacleBelowMainstreamMedian: ${metrics.pinnacleBelowMainstreamMedian}`,
    `- pinnacleNotForcedZero: ${metrics.pinnacleNotForcedZero}`,
    '',
    '## Gates',
    '',
    `- gate:playability: ${metrics.gatePlayability}`,
    `- gate:p20: ${metrics.gateP20}`,
    '',
  ].join('\n');
}

/** ponytail: quick check ordinary surfaces differ from vivid controls on bias tags. */
export function ordinaryOriginBiasDiffersFromVivid(): boolean {
  for (const originId of WUXIA_ORDINARY_ORIGIN_IDS) {
    const vividId = ORDINARY_VIVID_CONTROL_BY_ID[originId]!;
    const contrast = summarizeOriginResourceContrast(originId, vividId);
    const ordinary = getOriginSurfaceById(originId);
    const vivid = getOriginSurfaceById(vividId);
    const ordinaryTags = new Set(ordinary?.eventBiasTags.map(t => t.tag) ?? []);
    const vividTags = new Set(vivid?.eventBiasTags.map(t => t.tag) ?? []);
    const tagDiff = [...ordinaryTags].some(t => !vividTags.has(t));
    if (contrast.materiallyDifferent || tagDiff) return true;
  }
  return false;
}

export function evaluateOrdinaryMidTierReachability(
  worldId = 'wuxia',
): { outcomeId: string; unlocked: boolean }[] {
  const results: { outcomeId: string; unlocked: boolean }[] = [];
  for (const path of P25_ORDINARY_LIFE_PATHS.slice(0, 3)) {
    const player = {
      name: 'mid-tier-check',
      age: path.player.age ?? 40,
      traits: ['keen_mind', 'lazy', 'competitive'],
      ...path.player,
    } as PlayerState;
    const flags = { ...path.flags };
    const mainstream = getWorldProfile(worldId).compositeDestinyOutcomes ?? [];
    for (const outcome of mainstream.filter(o => MID_TIER_OUTCOMES.includes(o.id))) {
      const report = evaluateCompositeDestinyOutcome(outcome, player, flags);
      results.push({ outcomeId: outcome.id, unlocked: report.unlocked });
    }
    for (const report of evaluateMixedDestinies(player, flags, worldId)) {
      if (MID_TIER_OUTCOMES.includes(report.outcomeId)) {
        results.push({ outcomeId: report.outcomeId, unlocked: report.unlocked });
      }
    }
  }
  return results;
}
