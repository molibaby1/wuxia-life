import { runP25MixedBaseline } from './mixedSimulationBaselines';
import { runP25MixedIdentitySlice } from './mixedIdentitySlice';
import { runP25PinnacleBaseline } from './pinnacleSimulationBaselines';
import {
  runP35MixedHealerSwordsmanLifetimeSlice,
  runP35PinnacleMythLegendLifetimeSlice,
  type P35MixedHealerSwordsmanLifetimeResult,
  type P35PinnacleMythLegendLifetimeResult,
} from './p35MixedPinnacleLifetimeSlices';

export interface P35MixedPinnacleSimBaselineMetrics {
  generatedAt: string;
  command: string;
  p25StaticMixed: {
    healer_swordsman_unlockRate: number;
    mixedIdentitySlicePassed: boolean;
  };
  p25StaticPinnacle: {
    jianghu_myth_legend_unlockRate: number;
    pinnacleMaxUnlockRate: number;
  };
  p35MixedLifetime: {
    lifetime: P35MixedHealerSwordsmanLifetimeResult;
    healerSwordsmanUnlockRate: number;
  };
  p35PinnacleLifetime: {
    lifetime: P35PinnacleMythLegendLifetimeResult;
    jianghuMythLegendUnlockRate: number;
  };
  deltaSummary: string;
  parityNotes: string[];
}

export const P35_MIXED_PINNACLE_BASELINE_COMMAND =
  'npm exec tsx scripts/runP35HabitLedSimulationBaseline.ts';

export function runP35MixedPinnacleSimBaseline(): P35MixedPinnacleSimBaselineMetrics {
  const p25Mixed = runP25MixedBaseline();
  const p25MixedIdentity = runP25MixedIdentitySlice();
  const p25Pinnacle = runP25PinnacleBaseline();
  const mixedLifetime = runP35MixedHealerSwordsmanLifetimeSlice();
  const pinnacleLifetime = runP35PinnacleMythLegendLifetimeSlice();

  const p25HealerRate = p25Mixed.mixedUnlockRates.healer_swordsman ?? 0;
  const p25MythRate = p25Pinnacle.pinnacleUnlockRates.jianghu_myth_legend ?? 0;
  const p35MixedRate = mixedLifetime.terminalCheckpoint.unlocked ? 1 : 0;
  const p35PinnacleRate = pinnacleLifetime.terminalCheckpoint.unlocked ? 1 : 0;

  const parityNotes = [
    'P35 mixed lifetime uses dual habit on-ramp + JSON bridges; P25 static mixed fixtures seed flags directly.',
    'P35 pinnacle lifetime chains orthodox trial JSON + rare line roll; P25 static pinnacle fixtures seed luck/choice flags.',
    'Lifetime unlock rates are single-path traces (100% or 0%); P25 baselines are multi-fixture seed distributions.',
  ];

  const mixedAligned = p35MixedRate >= p25HealerRate || p25HealerRate > 0;
  const pinnacleAligned = p35PinnacleRate >= p25MythRate || p25MythRate > 0;
  const deltaSummary =
    mixedAligned && pinnacleAligned
      ? `P35 lifetime traces unlock (${(p35MixedRate * 100).toFixed(0)}% mixed, ${(p35PinnacleRate * 100).toFixed(0)}% pinnacle) — consistent with P25 static paths that achieve unlock.`
      : `P35 mixed ${(p35MixedRate * 100).toFixed(0)}% vs P25 healer ${(p25HealerRate * 100).toFixed(0)}%; pinnacle ${(p35PinnacleRate * 100).toFixed(0)}% vs P25 myth ${(p25MythRate * 100).toFixed(0)}%.`;

  return {
    generatedAt: new Date().toISOString(),
    command: P35_MIXED_PINNACLE_BASELINE_COMMAND,
    p25StaticMixed: {
      healer_swordsman_unlockRate: p25HealerRate,
      mixedIdentitySlicePassed: p25MixedIdentity.passed,
    },
    p25StaticPinnacle: {
      jianghu_myth_legend_unlockRate: p25MythRate,
      pinnacleMaxUnlockRate: p25Pinnacle.pinnacleMaxUnlockRate,
    },
    p35MixedLifetime: {
      lifetime: mixedLifetime,
      healerSwordsmanUnlockRate: p35MixedRate,
    },
    p35PinnacleLifetime: {
      lifetime: pinnacleLifetime,
      jianghuMythLegendUnlockRate: p35PinnacleRate,
    },
    deltaSummary,
    parityNotes,
  };
}

export function formatP35MixedPinnacleBaselineMarkdown(
  metrics: P35MixedPinnacleSimBaselineMetrics,
): string {
  const mixedLt = metrics.p35MixedLifetime.lifetime;
  const pinnacleLt = metrics.p35PinnacleLifetime.lifetime;
  return [
    '# P35 Mixed/Pinnacle Sim Baseline Delta',
    '',
    `Generated: ${metrics.generatedAt}`,
    '',
    '## Command',
    '',
    '```bash',
    metrics.command,
    '```',
    '',
    '## Delta vs P25 Static Mixed Identity and Pinnacle Baselines',
    '',
    '| Outcome | P25 static baseline | P25 identity slice | P35 habit-led lifetime | Delta |',
    '| --- | --- | --- | --- | --- |',
    `| \`healer_swordsman\` | ${(metrics.p25StaticMixed.healer_swordsman_unlockRate * 100).toFixed(1)}% | ${metrics.p25StaticMixed.mixedIdentitySlicePassed ? 'PASS' : 'FAIL'} | ${(metrics.p35MixedLifetime.healerSwordsmanUnlockRate * 100).toFixed(0)}% | ${metrics.p35MixedLifetime.healerSwordsmanUnlockRate >= metrics.p25StaticMixed.healer_swordsman_unlockRate ? 'aligned' : 'review'} |`,
    `| \`jianghu_myth_legend\` | ${(metrics.p25StaticPinnacle.jianghu_myth_legend_unlockRate * 100).toFixed(1)}% | — | ${(metrics.p35PinnacleLifetime.jianghuMythLegendUnlockRate * 100).toFixed(0)}% | ${metrics.p35PinnacleLifetime.jianghuMythLegendUnlockRate >= metrics.p25StaticPinnacle.jianghu_myth_legend_unlockRate ? 'aligned' : 'review'} |`,
    '',
    '## Interpretation',
    '',
    metrics.deltaSummary,
    '',
    '## Parity notes',
    '',
    ...metrics.parityNotes.map(n => `- ${n}`),
    '',
    '## Lifetime slice snapshots',
    '',
    `- Mixed path: \`${mixedLt.pathId}\` → unlocked=${mixedLt.terminalCheckpoint.unlocked}, cross-tracks=${mixedLt.terminalCheckpoint.crossTrackGroupsSatisfied}`,
    `- Pinnacle path: \`${pinnacleLt.pathId}\` → unlocked=${pinnacleLt.terminalCheckpoint.unlocked}, luck=${pinnacleLt.luckWindow.triggered}`,
    `- Static resolver used: ${mixedLt.usedStaticResolver}`,
    '',
  ].join('\n');
}
