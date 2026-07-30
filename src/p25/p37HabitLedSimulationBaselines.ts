import { runP25MixedBaseline } from './mixedSimulationBaselines';
import { runP25MixedIdentitySlice } from './mixedIdentitySlice';
import { runP25PinnacleBaseline } from './pinnacleSimulationBaselines';
import {
  runP35MixedHealerSwordsmanLifetimeSlice,
  runP35PinnacleMythLegendLifetimeSlice,
} from './p35MixedPinnacleLifetimeSlices';
import {
  runP37MixedMerchantPatronLifetimeSlice,
  runP37PinnacleFoundingPatriarchLifetimeSlice,
  type P37MixedMerchantPatronLifetimeResult,
  type P37PinnacleFoundingPatriarchLifetimeResult,
} from './p37AdditionalMixedPinnacleLifetimeSlices';

export interface P37AdditionalMixedPinnacleSimBaselineMetrics {
  generatedAt: string;
  command: string;
  p25StaticMixed: {
    merchant_martial_patron_unlockRate: number;
    healer_swordsman_unlockRate: number;
    mixedIdentitySlicePassed: boolean;
  };
  p25StaticPinnacle: {
    founding_patriarch_unlockRate: number;
    jianghu_myth_legend_unlockRate: number;
    pinnacleMaxUnlockRate: number;
  };
  p35HabitLedLifetime: {
    healerSwordsmanUnlockRate: number;
    jianghuMythLegendUnlockRate: number;
  };
  p37MixedLifetime: {
    lifetime: P37MixedMerchantPatronLifetimeResult;
    merchantMartialPatronUnlockRate: number;
  };
  p37PinnacleLifetime: {
    lifetime: P37PinnacleFoundingPatriarchLifetimeResult;
    foundingPatriarchUnlockRate: number;
  };
  deltaSummary: string;
  parityNotes: string[];
}

export const P37_ADDITIONAL_MIXED_PINNACLE_BASELINE_COMMAND =
  'npm exec tsx scripts/runP37HabitLedSimulationBaseline.ts';

export function runP37AdditionalMixedPinnacleSimBaseline(): P37AdditionalMixedPinnacleSimBaselineMetrics {
  const p25Mixed = runP25MixedBaseline();
  const p25MixedIdentity = runP25MixedIdentitySlice();
  const p25Pinnacle = runP25PinnacleBaseline();
  const p35Mixed = runP35MixedHealerSwordsmanLifetimeSlice();
  const p35Pinnacle = runP35PinnacleMythLegendLifetimeSlice();
  const mixedLifetime = runP37MixedMerchantPatronLifetimeSlice();
  const pinnacleLifetime = runP37PinnacleFoundingPatriarchLifetimeSlice();

  const p25PatronRate = p25Mixed.mixedUnlockRates.merchant_martial_patron ?? 0;
  const p25HealerRate = p25Mixed.mixedUnlockRates.healer_swordsman ?? 0;
  const p25PatriarchRate = p25Pinnacle.pinnacleUnlockRates.founding_patriarch ?? 0;
  const p25MythRate = p25Pinnacle.pinnacleUnlockRates.jianghu_myth_legend ?? 0;
  const p35HealerRate = p35Mixed.terminalCheckpoint.unlocked ? 1 : 0;
  const p35MythRate = p35Pinnacle.terminalCheckpoint.unlocked ? 1 : 0;
  const p37MixedRate = mixedLifetime.terminalCheckpoint.unlocked ? 1 : 0;
  const p37PinnacleRate = pinnacleLifetime.terminalCheckpoint.unlocked ? 1 : 0;

  const parityNotes = [
    'P37 mixed lifetime uses explicit declared business+training action effects + wealth/sect JSON bridges; P25 static seeds flags directly.',
    'P37 pinnacle lifetime chains faction continuation + scholar_mentor_line; P25 static pinnacle fixtures seed luck/choice flags.',
    'Lifetime unlock rates are single-path traces (100% or 0%); P25 baselines are multi-fixture seed distributions.',
    'P35 category traces (healer_swordsman, jianghu_myth_legend) unchanged; P37 closes additional outcomes only.',
  ];

  const mixedAligned = p37MixedRate >= p25PatronRate;
  const pinnacleAligned = p37PinnacleRate >= p25PatriarchRate;
  const deltaSummary =
    mixedAligned && pinnacleAligned
      ? `P37 additional lifetime traces unlock (${(p37MixedRate * 100).toFixed(0)}% mixed patron, ${(p37PinnacleRate * 100).toFixed(0)}% founding patriarch) — consistent with P25 static paths that achieve unlock.`
      : `P37 mixed ${(p37MixedRate * 100).toFixed(0)}% vs P25 patron ${(p25PatronRate * 100).toFixed(0)}%; pinnacle ${(p37PinnacleRate * 100).toFixed(0)}% vs P25 patriarch ${(p25PatriarchRate * 100).toFixed(0)}%.`;

  return {
    generatedAt: new Date().toISOString(),
    command: P37_ADDITIONAL_MIXED_PINNACLE_BASELINE_COMMAND,
    p25StaticMixed: {
      merchant_martial_patron_unlockRate: p25PatronRate,
      healer_swordsman_unlockRate: p25HealerRate,
      mixedIdentitySlicePassed: p25MixedIdentity.passed,
    },
    p25StaticPinnacle: {
      founding_patriarch_unlockRate: p25PatriarchRate,
      jianghu_myth_legend_unlockRate: p25MythRate,
      pinnacleMaxUnlockRate: p25Pinnacle.pinnacleMaxUnlockRate,
    },
    p35HabitLedLifetime: {
      healerSwordsmanUnlockRate: p35HealerRate,
      jianghuMythLegendUnlockRate: p35MythRate,
    },
    p37MixedLifetime: {
      lifetime: mixedLifetime,
      merchantMartialPatronUnlockRate: p37MixedRate,
    },
    p37PinnacleLifetime: {
      lifetime: pinnacleLifetime,
      foundingPatriarchUnlockRate: p37PinnacleRate,
    },
    deltaSummary,
    parityNotes,
  };
}

export function formatP37AdditionalMixedPinnacleBaselineMarkdown(
  metrics: P37AdditionalMixedPinnacleSimBaselineMetrics,
): string {
  const mixedLt = metrics.p37MixedLifetime.lifetime;
  const pinnacleLt = metrics.p37PinnacleLifetime.lifetime;
  return [
    '# P37 Additional Mixed/Pinnacle Sim Baseline Delta',
    '',
    `Generated: ${metrics.generatedAt}`,
    '',
    '## Command',
    '',
    '```bash',
    metrics.command,
    '```',
    '',
    '## Delta vs P25 Static and P35 Habit-Led Baselines',
    '',
    '| Outcome | P25 static | P35 habit-led | P37 additional lifetime | Delta |',
    '| --- | --- | --- | --- | --- |',
    `| \`merchant_martial_patron\` | ${(metrics.p25StaticMixed.merchant_martial_patron_unlockRate * 100).toFixed(1)}% | — | ${(metrics.p37MixedLifetime.merchantMartialPatronUnlockRate * 100).toFixed(0)}% | ${metrics.p37MixedLifetime.merchantMartialPatronUnlockRate >= metrics.p25StaticMixed.merchant_martial_patron_unlockRate ? 'aligned' : 'review'} |`,
    `| \`healer_swordsman\` (P35 ref) | ${(metrics.p25StaticMixed.healer_swordsman_unlockRate * 100).toFixed(1)}% | ${(metrics.p35HabitLedLifetime.healerSwordsmanUnlockRate * 100).toFixed(0)}% | — | carry-forward |`,
    `| \`founding_patriarch\` | ${(metrics.p25StaticPinnacle.founding_patriarch_unlockRate * 100).toFixed(1)}% | — | ${(metrics.p37PinnacleLifetime.foundingPatriarchUnlockRate * 100).toFixed(0)}% | ${metrics.p37PinnacleLifetime.foundingPatriarchUnlockRate >= metrics.p25StaticPinnacle.founding_patriarch_unlockRate ? 'aligned' : 'review'} |`,
    `| \`jianghu_myth_legend\` (P35 ref) | ${(metrics.p25StaticPinnacle.jianghu_myth_legend_unlockRate * 100).toFixed(1)}% | ${(metrics.p35HabitLedLifetime.jianghuMythLegendUnlockRate * 100).toFixed(0)}% | — | carry-forward |`,
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
