import { runP31HabitLedSimulationBaseline, type P31HabitLedSimulationBaselineMetrics } from './p31HabitLedSimulationBaselines';
import { runP32RenownShortChainSlice, type P32ShortChainSliceResult } from './p32HabitLedShortChainSlice';

export interface P32RuntimeSimBaselineMetrics {
  generatedAt: string;
  command: string;
  p31StaticBaseline: {
    jianghu_renown_sage_unlockRate: number;
    medical_sage_healer_unlockRate: number;
  };
  p32RuntimeShortChain: {
    renown: P32ShortChainSliceResult;
    renownUnlockRate: number;
  };
  deltaSummary: string;
  parityNotes: string[];
}

export const P32_RUNTIME_BASELINE_COMMAND = 'npm exec tsx scripts/runP32HabitLedSimulationBaseline.ts';

export function runP32RuntimeSimBaseline(): P32RuntimeSimBaselineMetrics {
  const p31 = runP31HabitLedSimulationBaseline();
  const renownSlice = runP32RenownShortChainSlice();

  const parityNotes = [
    'Renown runtime short-chain uses JSON flag_set from p28 event; P31 static path uses resolveP31HabitLedKeyChoiceBridges on fixtures.',
    'Medical runtime short-chain deferred to P32-006 skip-first; P31 static resolver + parity tests cover medical bridges.',
    'Poison mutex (P32-RISK-003): resolved in P33 — applyEventChoiceFlagSets mirrors resolver when medical_poison_path is set.',
  ];

  const renownRuntimeRate = renownSlice.unlocked ? 1 : 0;
  const p31RenownRate = p31.p31HabitLedUnlock.jianghu_renown_sage.unlockRate;

  return {
    generatedAt: new Date().toISOString(),
    command: P32_RUNTIME_BASELINE_COMMAND,
    p31StaticBaseline: {
      jianghu_renown_sage_unlockRate: p31RenownRate,
      medical_sage_healer_unlockRate: p31.p31HabitLedUnlock.medical_sage_healer.unlockRate,
    },
    p32RuntimeShortChain: {
      renown: renownSlice,
      renownUnlockRate: renownRuntimeRate,
    },
    deltaSummary:
      renownRuntimeRate === p31RenownRate
        ? 'P32 renown runtime short-chain unlock aligns with P31 static bridge-resolved baseline (100%).'
        : `P32 renown runtime unlock ${(renownRuntimeRate * 100).toFixed(0)}% vs P31 static ${(p31RenownRate * 100).toFixed(0)}%.`,
    parityNotes,
  };
}

export function formatP32RuntimeBaselineMarkdown(metrics: P32RuntimeSimBaselineMetrics): string {
  const r = metrics.p32RuntimeShortChain.renown;
  return [
    '# P32 Runtime Sim Baseline Delta',
    '',
    `Generated: ${metrics.generatedAt}`,
    '',
    '## Command',
    '',
    '```bash',
    metrics.command,
    '```',
    '',
    '## Delta vs P31 Static Baseline',
    '',
    '| Outcome | P31 static (resolver) unlock | P32 runtime short-chain unlock | Delta |',
    '| --- | --- | --- | --- |',
    `| \`jianghu_renown_sage\` | ${(metrics.p31StaticBaseline.jianghu_renown_sage_unlockRate * 100).toFixed(0)}% | ${(metrics.p32RuntimeShortChain.renownUnlockRate * 100).toFixed(0)}% | ${metrics.p31StaticBaseline.jianghu_renown_sage_unlockRate === metrics.p32RuntimeShortChain.renownUnlockRate ? 'aligned' : 'drift'} |`,
    `| \`medical_sage_healer\` | ${(metrics.p31StaticBaseline.medical_sage_healer_unlockRate * 100).toFixed(0)}% | — (parity tests only) | monitor |`,
    '',
    '## Interpretation',
    '',
    metrics.deltaSummary,
    '',
    '## Parity notes',
    '',
    ...metrics.parityNotes.map(n => `- ${n}`),
    '',
    '## Renown short-chain snapshot',
    '',
    `- Path: \`${r.pathId}\``,
    `- Unlocked: ${r.unlocked}`,
    `- Key choices met: ${r.keyChoicesMet}`,
    `- Event sequence: ${r.eventSequence.map(s => s.eventId).join(' → ')}`,
    `- Static resolver used: ${r.usedStaticResolver}`,
    '',
  ].join('\n');
}
