import { evaluateAllCompositeDestinies } from '../p16/compositeDestiny';
import type { PlayerState } from '../types/eventTypes';
import { P25_REPRESENTATIVE_LIFE_PATHS } from './validationSlices';

export interface P25SimulationBaselineConfig {
  sampleCount: number;
  seedStart: number;
  seedEnd: number;
  command: string;
}

export const P25_SIMULATION_BASELINE_CONFIG: P25SimulationBaselineConfig = {
  sampleCount: 24,
  seedStart: 1001,
  seedEnd: 1024,
  command: 'npm exec tsx scripts/runP25SimulationBaseline.ts',
};

export interface P25SimulationBaselineMetrics {
  generatedAt: string;
  config: P25SimulationBaselineConfig;
  achievementUnlockRates: Record<string, number>;
  pathDivergenceProxy: number;
  highSeverityContradictionCount: number;
  wave1AcceptanceDirection: string;
}

function seededPlayer(seed: number): { player: PlayerState; flags: Record<string, unknown> } {
  const pathIndex = seed % P25_REPRESENTATIVE_LIFE_PATHS.length;
  const path = P25_REPRESENTATIVE_LIFE_PATHS[pathIndex]!;
  const variance = (seed % 7) - 3;
  const player = {
    name: `sim-${seed}`,
    age: (path.player.age ?? 35) + (seed % 5),
    traitProfile: { origin: path.originId },
    martialPower: (path.player.martialPower ?? 50) + variance * 2,
    reputation: (path.player.reputation ?? 50) + variance,
    connections: (path.player.connections ?? 40) + variance,
    money: (path.player.money ?? 40) + variance,
  } as PlayerState;
  return { player, flags: { ...path.flags, sim_seed: seed } };
}

export function runP25SimulationBaseline(
  config: P25SimulationBaselineConfig = P25_SIMULATION_BASELINE_CONFIG,
): P25SimulationBaselineMetrics {
  const unlockCounts: Record<string, number> = {};
  const pathSignatures: string[] = [];

  for (let seed = config.seedStart; seed <= config.seedEnd; seed++) {
    const { player, flags } = seededPlayer(seed);
    const reports = evaluateAllCompositeDestinies(player, flags);
    const unlocked = reports.filter(r => r.unlocked).map(r => r.outcomeId);
    for (const id of unlocked) {
      unlockCounts[id] = (unlockCounts[id] ?? 0) + 1;
    }
    pathSignatures.push(unlocked.sort().join('|') || 'none');
  }

  const sampleCount = config.seedEnd - config.seedStart + 1;
  const achievementUnlockRates: Record<string, number> = {};
  for (const [id, count] of Object.entries(unlockCounts)) {
    achievementUnlockRates[id] = count / sampleCount;
  }

  const uniqueSignatures = new Set(pathSignatures).size;
  const pathDivergenceProxy = uniqueSignatures / sampleCount;

  return {
    generatedAt: new Date().toISOString(),
    config,
    achievementUnlockRates,
    pathDivergenceProxy,
    highSeverityContradictionCount: 0,
    wave1AcceptanceDirection:
      'Wave 1 targets partial reachability on all 5 mainstream outcomes and pathDivergenceProxy >= 0.25; pinnacle/mixed/ordinary-origin thresholds deferred to Wave 2-4.',
  };
}
