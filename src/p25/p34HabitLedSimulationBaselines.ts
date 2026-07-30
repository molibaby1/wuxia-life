import { runP31HabitLedSimulationBaseline } from './p31HabitLedSimulationBaselines';
import { runP33MedicalShortChainSlice } from './p32HabitLedShortChainSlice';
import {
  runP34MedicalLifetimeBirthToDeathSlice,
  type P34LifetimeBirthToDeathResult,
} from './p34LifetimeBirthToDeathSlice';

export interface P34LifetimeSimBaselineMetrics {
  generatedAt: string;
  command: string;
  p31StaticBaseline: {
    jianghu_renown_sage_unlockRate: number;
    medical_sage_healer_unlockRate: number;
  };
  p33MedicalShortChain: {
    medicalUnlockRate: number;
  };
  p34LifetimeBirthToDeath: {
    lifetime: P34LifetimeBirthToDeathResult;
    medicalUnlockRate: number;
  };
  deltaSummary: string;
  parityNotes: string[];
}

export const P34_LIFETIME_BASELINE_COMMAND = 'npm exec tsx scripts/runP34HabitLedSimulationBaseline.ts';

export function runP34LifetimeSimBaseline(): P34LifetimeSimBaselineMetrics {
  const p31 = runP31HabitLedSimulationBaseline();
  const p33ShortChain = runP33MedicalShortChainSlice();
  const lifetime = runP34MedicalLifetimeBirthToDeathSlice();

  const p31MedicalRate = p31.p31HabitLedUnlock.medical_sage_healer.unlockRate;
  const p33ShortChainRate = p33ShortChain.unlocked ? 1 : 0;
  const p34LifetimeRate = lifetime.terminalCheckpoint.unlocked ? 1 : 0;

  const parityNotes = [
    'P34 lifetime uses explicit action habitEffects for its habit-zero on-ramp, then the same JSON flag_set bridge path as P33 short-chain.',
    'P31 static baseline uses resolveP31HabitLedKeyChoiceBridges; P34 lifetime avoids static resolver.',
    'Lifetime unlock rate compared against P33 short-chain (midlife seed) and P31 static (resolver fixtures).',
  ];

  const alignedWithP31 = p34LifetimeRate === p31MedicalRate;
  const alignedWithP33 = p34LifetimeRate === p33ShortChainRate;
  const deltaSummary = alignedWithP31 && alignedWithP33
    ? `P34 lifetime unlock (${(p34LifetimeRate * 100).toFixed(0)}%) aligns with P33 short-chain and P31 static baselines.`
    : `P34 lifetime ${(p34LifetimeRate * 100).toFixed(0)}% vs P33 short-chain ${(p33ShortChainRate * 100).toFixed(0)}% vs P31 static ${(p31MedicalRate * 100).toFixed(0)}%.`;

  return {
    generatedAt: new Date().toISOString(),
    command: P34_LIFETIME_BASELINE_COMMAND,
    p31StaticBaseline: {
      jianghu_renown_sage_unlockRate: p31.p31HabitLedUnlock.jianghu_renown_sage.unlockRate,
      medical_sage_healer_unlockRate: p31MedicalRate,
    },
    p33MedicalShortChain: {
      medicalUnlockRate: p33ShortChainRate,
    },
    p34LifetimeBirthToDeath: {
      lifetime,
      medicalUnlockRate: p34LifetimeRate,
    },
    deltaSummary,
    parityNotes,
  };
}

export function formatP34LifetimeBaselineMarkdown(metrics: P34LifetimeSimBaselineMetrics): string {
  const lt = metrics.p34LifetimeBirthToDeath.lifetime;
  return [
    '# P34 Lifetime Sim Baseline Delta',
    '',
    `Generated: ${metrics.generatedAt}`,
    '',
    '## Command',
    '',
    '```bash',
    metrics.command,
    '```',
    '',
    '## Delta vs P33 Short-Chain and P31 Static',
    '',
    '| Outcome | P31 static (resolver) | P33 medical short-chain | P34 lifetime birth→death | Delta |',
    '| --- | --- | --- | --- | --- |',
    `| \`medical_sage_healer\` | ${(metrics.p31StaticBaseline.medical_sage_healer_unlockRate * 100).toFixed(0)}% | ${(metrics.p33MedicalShortChain.medicalUnlockRate * 100).toFixed(0)}% | ${(metrics.p34LifetimeBirthToDeath.medicalUnlockRate * 100).toFixed(0)}% | ${metrics.p31StaticBaseline.medical_sage_healer_unlockRate === metrics.p34LifetimeBirthToDeath.medicalUnlockRate ? 'aligned' : 'drift'} |`,
    '',
    '## Interpretation',
    '',
    metrics.deltaSummary,
    '',
    '## Parity notes',
    '',
    ...metrics.parityNotes.map(n => `- ${n}`),
    '',
    '## Lifetime slice snapshot',
    '',
    `- Path: \`${lt.pathId}\``,
    `- Terminal age: ${lt.terminalCheckpoint.age}`,
    `- Unlocked: ${lt.terminalCheckpoint.unlocked}`,
    `- Event sequence: ${lt.eventSequence.map(s => s.eventId).join(' → ')}`,
    `- Static resolver used: ${lt.usedStaticResolver}`,
    '',
  ].join('\n');
}
