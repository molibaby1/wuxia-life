/**
 * P36 extended consequence consistency audit — P25 representative paths + P34/P35 lifetime trace flag sequences.
 */
import { runP34MedicalLifetimeBirthToDeathSlice } from './p34LifetimeBirthToDeathSlice';
import { createDefaultPlayerLifeStates } from '../data/life/lifeStates';
import {
  runP35MixedHealerSwordsmanLifetimeSlice,
  runP35PinnacleMythLegendLifetimeSlice,
} from './p35MixedPinnacleLifetimeSlices';
import {
  P25_REPRESENTATIVE_LIFE_PATHS,
  findLifePathContradictions,
  runP25ConsequenceConsistencySlice,
  type ContradictionFinding,
  type LifePathFixture,
} from './validationSlices';

function flagsFromNames(names: string[]): Record<string, unknown> {
  const unique = [...new Set(names)];
  return Object.fromEntries(unique.map(name => [name, true]));
}

/** ponytail: terminal flags = last event flagsAfter ∪ resolvedBridgeFlags (luck flags may be absent from event seq). */
export function buildP34P35LifetimeTraceFixtures(): LifePathFixture[] {
  const p34 = runP34MedicalLifetimeBirthToDeathSlice();
  const p34Last = p34.eventSequence[p34.eventSequence.length - 1]!;
  const p34Terminal = p34.ageProgression[p34.ageProgression.length - 1]!;
  const p34Flags = flagsFromNames([...p34Last.flagsAfter, ...p34.resolvedBridgeFlags]);

  const mixed = runP35MixedHealerSwordsmanLifetimeSlice();
  const mixedLast = mixed.eventSequence[mixed.eventSequence.length - 1]!;
  const mixedTerminal = mixed.ageProgression[mixed.ageProgression.length - 1]!;
  const mixedFlags = flagsFromNames([...mixedLast.flagsAfter, ...mixed.resolvedBridgeFlags]);

  const pinnacle = runP35PinnacleMythLegendLifetimeSlice();
  const pinLast = pinnacle.eventSequence[pinnacle.eventSequence.length - 1]!;
  const pinTerminal = pinnacle.ageProgression[pinnacle.ageProgression.length - 1]!;
  const pinFlags = flagsFromNames([...pinLast.flagsAfter, ...pinnacle.resolvedBridgeFlags]);

  return [
    {
      id: p34.pathId,
      label: 'P34 医术 habit-led birth→death lifetime',
      originId: p34.seed.originId,
      player: {
        age: p34.terminalCheckpoint.age,
        // ponytail: P34 age steps omit martialPower/connections; slice uses fixed terminal constants.
        martialPower: 30,
        reputation: p34Terminal.reputation,
        connections: 25,
        money: p34Terminal.money,
        lifeStates: createDefaultPlayerLifeStates({
          studyHabit: p34Terminal.studyHabit,
        }),
      },
      flags: p34Flags,
      summarySignals: ['医德', '医术'],
    },
    {
      id: mixed.pathId,
      label: 'P35 混合 healer_swordsman lifetime',
      originId: mixed.seed.originId,
      player: {
        age: mixed.terminalCheckpoint.age,
        martialPower: mixedTerminal.martialPower,
        reputation: mixedTerminal.reputation,
        connections: 30,
        money: 42,
        lifeStates: createDefaultPlayerLifeStates({
          trainingHabit: mixedTerminal.trainingHabit,
          studyHabit: mixedTerminal.studyHabit,
        }),
      },
      flags: mixedFlags,
      summarySignals: ['医武双修'],
    },
    {
      id: pinnacle.pathId,
      label: 'P35 巅峰 jianghu_myth_legend lifetime',
      originId: pinnacle.seed.originId,
      player: {
        age: pinnacle.terminalCheckpoint.age,
        martialPower: pinTerminal.martialPower,
        reputation: pinTerminal.reputation,
        connections: 28,
        money: 35,
        lifeStates: createDefaultPlayerLifeStates({
          trainingHabit: pinTerminal.trainingHabit,
          studyHabit: pinTerminal.studyHabit,
        }),
      },
      flags: pinFlags,
      summarySignals: ['护道', '稀有机缘'],
    },
  ];
}

export interface P36ConsistencySliceResult {
  slice: 'p36_extended_consequence_consistency';
  p25PathCount: number;
  lifetimeTracePathCount: number;
  pathCount: number;
  lifetimeTracePaths: LifePathFixture[];
  findings: ContradictionFinding[];
  perTraceFindings: Array<{ pathId: string; findings: ContradictionFinding[] }>;
  criticalCount: number;
  highSeverityContradictionCount: number;
  passed: boolean;
  section8Item3Status: 'Met' | 'Partial';
}

function countHighSeverity(findings: ContradictionFinding[]): number {
  return findings.filter(f => f.severity === 'high' || f.severity === 'critical').length;
}

/** Extends P25 consistency slice with P34 medical + P35 mixed/pinnacle lifetime trace fixtures. */
export function runP36ExtendedConsequenceConsistencySlice(): P36ConsistencySliceResult {
  const p25 = runP25ConsequenceConsistencySlice();
  const lifetimePaths = buildP34P35LifetimeTraceFixtures();
  const perTraceFindings = lifetimePaths.map(path => ({
    pathId: path.id,
    findings: findLifePathContradictions(path),
  }));
  const lifetimeFindings = perTraceFindings.flatMap(trace => trace.findings);

  const findings = [...p25.findings, ...lifetimeFindings];
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highSeverityContradictionCount = countHighSeverity(findings);

  return {
    slice: 'p36_extended_consequence_consistency',
    p25PathCount: p25.pathCount,
    lifetimeTracePathCount: lifetimePaths.length,
    pathCount: p25.pathCount + lifetimePaths.length,
    lifetimeTracePaths: lifetimePaths,
    findings,
    perTraceFindings,
    criticalCount,
    highSeverityContradictionCount,
    passed: highSeverityContradictionCount === 0,
    section8Item3Status: highSeverityContradictionCount === 0 ? 'Met' : 'Partial',
  };
}

export function formatP36ConsistencySliceMarkdown(result: P36ConsistencySliceResult): string {
  const lines = [
    '# P36 Extended Consequence Consistency Audit (P34/P35 Lifetime Traces)',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Paths covered: **${result.pathCount}** (P25 representative: ${result.p25PathCount}, P34/P35 lifetime traces: ${result.lifetimeTracePathCount})`,
    `highSeverityContradictionCount: **${result.highSeverityContradictionCount}**`,
    `North Star §8 item 3: **${result.section8Item3Status}** (zero high/critical in audit slice)`,
    `Decision: **${result.passed ? 'PASS' : 'FAIL'}** (${result.findings.length} finding(s), ${result.criticalCount} critical)`,
    '',
    '## Audit command',
    '',
    '```bash',
    'npm exec tsx scripts/runP36ConsistencySlice.ts',
    '```',
    '',
    '## P34/P35 lifetime trace paths',
    '',
    ...result.lifetimeTracePaths.map(p => `- \`${p.id}\` — ${p.label} (${p.originId})`),
    '',
    '## Per-trace findings',
    '',
  ];

  for (const trace of result.perTraceFindings) {
    lines.push(`### \`${trace.pathId}\``);
    if (trace.findings.length === 0) {
      lines.push('- No contradictions detected.');
    } else {
      for (const f of trace.findings) {
        lines.push(`- **[${f.severity}]** ${f.defectType}: ${f.detail} → \`${f.pointer}\``);
      }
    }
    lines.push('');
  }

  lines.push('## P25 base paths (unchanged harness)', '');
  lines.push(...P25_REPRESENTATIVE_LIFE_PATHS.map(p => `- \`${p.id}\` — ${p.label}`));
  lines.push('', '## All findings', '');

  if (result.findings.length === 0) {
    lines.push('No contradictions detected.');
  } else {
    for (const f of result.findings) {
      lines.push(
        `- **[${f.severity}]** \`${f.pathId}\` / ${f.defectType}: ${f.detail} → \`${f.pointer}\``,
      );
    }
  }

  return lines.join('\n');
}
