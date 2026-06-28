import { runP31HabitLedSimulationBaseline } from './p31HabitLedSimulationBaselines';
import { runP32RuntimeSimBaseline } from './p32HabitLedSimulationBaselines';
import { runP33MedicalShortChainSlice, type P32ShortChainSliceResult } from './p32HabitLedShortChainSlice';

export interface P33RuntimeSimBaselineMetrics {
  generatedAt: string;
  command: string;
  p31StaticBaseline: {
    jianghu_renown_sage_unlockRate: number;
    medical_sage_healer_unlockRate: number;
  };
  p32RenownRuntimeBaseline: {
    unlockRate: number;
  };
  p33MedicalRuntimeShortChain: {
    medical: P32ShortChainSliceResult;
    medicalUnlockRate: number;
  };
  deltaSummary: string;
  parityNotes: string[];
}

export const P33_RUNTIME_BASELINE_COMMAND = 'npm exec tsx scripts/runP33HabitLedSimulationBaseline.ts';

export function runP33RuntimeSimBaseline(): P33RuntimeSimBaselineMetrics {
  const p31 = runP31HabitLedSimulationBaseline();
  const p32 = runP32RuntimeSimBaseline();
  const medicalSlice = runP33MedicalShortChainSlice();

  const medicalRuntimeRate = medicalSlice.unlocked ? 1 : 0;
  const p31MedicalRate = p31.p31HabitLedUnlock.medical_sage_healer.unlockRate;
  const p32RenownRate = p32.p32RuntimeShortChain.renownUnlockRate;

  const parityNotes = [
    'P33 medical runtime short-chain uses JSON flag_set from p27→p29 events; P31 static uses resolveP31HabitLedKeyChoiceBridges.',
    'P32 renown runtime baseline retained for cross-path comparison.',
    'Poison mutex aligned in P33-002 via applyEventChoiceFlagSets.',
  ];

  const medicalAligned = medicalRuntimeRate === p31MedicalRate;
  const deltaSummary = medicalAligned
    ? `P33 medical runtime short-chain unlock (${(medicalRuntimeRate * 100).toFixed(0)}%) aligns with P31 static baseline. P32 renown runtime remains ${(p32RenownRate * 100).toFixed(0)}%.`
    : `P33 medical runtime unlock ${(medicalRuntimeRate * 100).toFixed(0)}% vs P31 static ${(p31MedicalRate * 100).toFixed(0)}%.`;

  return {
    generatedAt: new Date().toISOString(),
    command: P33_RUNTIME_BASELINE_COMMAND,
    p31StaticBaseline: {
      jianghu_renown_sage_unlockRate: p31.p31HabitLedUnlock.jianghu_renown_sage.unlockRate,
      medical_sage_healer_unlockRate: p31MedicalRate,
    },
    p32RenownRuntimeBaseline: {
      unlockRate: p32RenownRate,
    },
    p33MedicalRuntimeShortChain: {
      medical: medicalSlice,
      medicalUnlockRate: medicalRuntimeRate,
    },
    deltaSummary,
    parityNotes,
  };
}

export function formatP33RuntimeBaselineMarkdown(metrics: P33RuntimeSimBaselineMetrics): string {
  const m = metrics.p33MedicalRuntimeShortChain.medical;
  return [
    '# P33 Medical Runtime Sim Baseline Delta',
    '',
    `Generated: ${metrics.generatedAt}`,
    '',
    '## Command',
    '',
    '```bash',
    metrics.command,
    '```',
    '',
    '## Delta vs P31 Static and P32 Renown Runtime',
    '',
    '| Outcome | P31 static (resolver) | P32 renown runtime | P33 medical runtime | Delta |',
    '| --- | --- | --- | --- | --- |',
    `| \`jianghu_renown_sage\` | ${(metrics.p31StaticBaseline.jianghu_renown_sage_unlockRate * 100).toFixed(0)}% | ${(metrics.p32RenownRuntimeBaseline.unlockRate * 100).toFixed(0)}% | — | renown via P32 |`,
    `| \`medical_sage_healer\` | ${(metrics.p31StaticBaseline.medical_sage_healer_unlockRate * 100).toFixed(0)}% | — (parity only) | ${(metrics.p33MedicalRuntimeShortChain.medicalUnlockRate * 100).toFixed(0)}% | ${metrics.p31StaticBaseline.medical_sage_healer_unlockRate === metrics.p33MedicalRuntimeShortChain.medicalUnlockRate ? 'aligned' : 'drift'} |`,
    '',
    '## Interpretation',
    '',
    metrics.deltaSummary,
    '',
    '## Parity notes',
    '',
    ...metrics.parityNotes.map(n => `- ${n}`),
    '',
    '## Medical short-chain snapshot',
    '',
    `- Path: \`${m.pathId}\``,
    `- Unlocked: ${m.unlocked}`,
    `- Key choices met: ${m.keyChoicesMet}`,
    `- Event sequence: ${m.eventSequence.map(s => s.eventId).join(' → ')}`,
    `- Static resolver used: ${m.usedStaticResolver}`,
    '',
  ].join('\n');
}
