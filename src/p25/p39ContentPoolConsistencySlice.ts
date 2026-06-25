/**
 * P39 extended content pool consequence consistency audit —
 * P36 8-path baseline + P37 lifetime traces + representative pool samples.
 */
import {
  runP36ExtendedConsequenceConsistencySlice,
  type P36ConsistencySliceResult,
} from './p36ConsequenceConsistencySlice';
import {
  runP37MixedMerchantPatronLifetimeSlice,
  runP37PinnacleFoundingPatriarchLifetimeSlice,
} from './p37AdditionalMixedPinnacleLifetimeSlices';
import { createDefaultPlayerLifeStates } from '../data/life/lifeStates';
import {
  findLifePathContradictions,
  type ContradictionFinding,
  type LifePathFixture,
} from './validationSlices';

function flagsFromNames(names: string[]): Record<string, unknown> {
  const unique = [...new Set(names)];
  return Object.fromEntries(unique.map(name => [name, true]));
}

/** Representative content-pool paths — setback, love, medical themes. */
export const P39_CONTENT_POOL_SAMPLE_PATHS: LifePathFixture[] = [
  {
    id: 'p39_setback_pool_injury_property_path',
    label: 'Setback pool — injury + property loss recovery',
    originId: 'martial_family',
    player: { age: 32, martialPower: 48, reputation: 30, connections: 18, money: 40 },
    flags: {
      setback_injury_active: true,
      setback_property_loss_active: true,
    },
    summarySignals: ['意外受伤', '财产损失'],
  },
  {
    id: 'p39_love_pool_secret_help_chain_path',
    label: 'Love pool — misunderstood → secret help chain',
    originId: 'scholar_house',
    player: { age: 24, martialPower: 35, reputation: 28, connections: 22, money: 25 },
    flags: {
      love_misunderstood: true,
      love_secret_help: true,
    },
    summarySignals: ['暗中相助', '情深不言'],
  },
  {
    id: 'p39_medical_pool_healer_study_path',
    label: 'Medical pool — study-led healer reinforcement',
    originId: 'poor_family',
    player: {
      age: 36,
      martialPower: 28,
      reputation: 55,
      connections: 20,
      money: 35,
      lifeStates: createDefaultPlayerLifeStates({
        studyHabit: 3,
      }),
    },
    flags: {
      medical_talent: true,
      p27_study_healer_path: true,
      medical_pure: true,
      p29_study_healer_case_duty: true,
    },
    summarySignals: ['医德', '研学习惯'],
  },
];

/** P37 additional lifetime trace fixtures for consistency harness. */
export function buildP37LifetimeTraceFixtures(): LifePathFixture[] {
  const merchant = runP37MixedMerchantPatronLifetimeSlice();
  const merchantLast = merchant.eventSequence[merchant.eventSequence.length - 1]!;
  const merchantTerminal = merchant.ageProgression[merchant.ageProgression.length - 1]!;
  const merchantFlags = flagsFromNames([
    ...merchantLast.flagsAfter,
    ...merchant.resolvedBridgeFlags,
  ]);

  const patriarch = runP37PinnacleFoundingPatriarchLifetimeSlice();
  const patriarchLast = patriarch.eventSequence[patriarch.eventSequence.length - 1]!;
  const patriarchTerminal = patriarch.ageProgression[patriarch.ageProgression.length - 1]!;
  const patriarchFlags = flagsFromNames([
    ...patriarchLast.flagsAfter,
    ...patriarch.resolvedBridgeFlags,
  ]);

  return [
    {
      id: merchant.pathId,
      label: 'P37 混合 merchant_martial_patron lifetime',
      originId: merchant.seed.originId,
      player: {
        age: merchant.terminalCheckpoint.age,
        martialPower: merchantTerminal.martialPower,
        reputation: merchantTerminal.reputation,
        connections: 28,
        money: 65,
        lifeStates: createDefaultPlayerLifeStates({
          trainingHabit: merchantTerminal.trainingHabit,
          studyHabit: merchantTerminal.studyHabit ?? 0,
          businessHabit: 3,
        }),
      },
      flags: merchantFlags,
      summarySignals: ['商武双修', '侠义投资'],
    },
    {
      id: patriarch.pathId,
      label: 'P37 巅峰 founding_patriarch lifetime',
      originId: patriarch.seed.originId,
      player: {
        age: patriarch.terminalCheckpoint.age,
        martialPower: patriarchTerminal.martialPower,
        reputation: patriarchTerminal.reputation,
        connections: 72,
        money: 56,
        lifeStates: createDefaultPlayerLifeStates({
          trainingHabit: patriarchTerminal.trainingHabit,
          socialMomentum: 2,
        }),
      },
      flags: patriarchFlags,
      summarySignals: ['开派祖师', '盟会'],
    },
  ];
}

export interface P39ConsistencySliceResult {
  slice: 'p39_extended_content_pool_consistency';
  p25PathCount: number;
  p34P35LifetimeTracePathCount: number;
  p37LifetimeTracePathCount: number;
  contentPoolSamplePathCount: number;
  pathCount: number;
  p36BaselinePathCount: number;
  lifetimeTracePaths: LifePathFixture[];
  contentPoolSamplePaths: LifePathFixture[];
  findings: ContradictionFinding[];
  perPathFindings: Array<{ pathId: string; findings: ContradictionFinding[] }>;
  criticalCount: number;
  highSeverityContradictionCount: number;
  mediumLowFindingCount: number;
  passed: boolean;
  section8Item3Status: 'Met' | 'Partial';
  /** P36-equivalent slice for carry-forward comparison */
  p36Baseline: P36ConsistencySliceResult;
}

function countHighSeverity(findings: ContradictionFinding[]): number {
  return findings.filter(f => f.severity === 'high' || f.severity === 'critical').length;
}

/** Extends P36 harness with P37 traces + content pool representative paths (≥12 total). */
export function runP39ExtendedContentPoolConsistencySlice(): P39ConsistencySliceResult {
  const p36Baseline = runP36ExtendedConsequenceConsistencySlice();

  const p37Paths = buildP37LifetimeTraceFixtures();
  const poolPaths = P39_CONTENT_POOL_SAMPLE_PATHS;
  const extensionPaths = [...p37Paths, ...poolPaths];

  const perPathFindings = extensionPaths.map(path => ({
    pathId: path.id,
    findings: findLifePathContradictions(path),
  }));
  const extensionFindings = perPathFindings.flatMap(p => p.findings);

  const findings = [...p36Baseline.findings, ...extensionFindings];
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highSeverityContradictionCount = countHighSeverity(findings);
  const mediumLowFindingCount = findings.filter(f => f.severity === 'medium').length;

  const p34p35Count = p36Baseline.lifetimeTracePathCount;

  return {
    slice: 'p39_extended_content_pool_consistency',
    p25PathCount: p36Baseline.p25PathCount,
    p34P35LifetimeTracePathCount: p34p35Count,
    p37LifetimeTracePathCount: p37Paths.length,
    contentPoolSamplePathCount: poolPaths.length,
    pathCount: p36Baseline.pathCount + extensionPaths.length,
    p36BaselinePathCount: p36Baseline.pathCount,
    lifetimeTracePaths: [...p36Baseline.lifetimeTracePaths, ...p37Paths],
    contentPoolSamplePaths: poolPaths,
    findings,
    perPathFindings,
    criticalCount,
    highSeverityContradictionCount,
    mediumLowFindingCount,
    passed: highSeverityContradictionCount === 0,
    section8Item3Status: highSeverityContradictionCount === 0 ? 'Met' : 'Partial',
    p36Baseline,
  };
}

export function formatP39ConsistencySliceMarkdown(result: P39ConsistencySliceResult): string {
  const lines = [
    '# P39 Extended Content Pool Consequence Consistency Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Paths covered: **${result.pathCount}**`,
    `  - P25 representative: ${result.p25PathCount}`,
    `  - P34/P35 lifetime traces: ${result.p34P35LifetimeTracePathCount}`,
    `  - P37 lifetime traces: ${result.p37LifetimeTracePathCount}`,
    `  - Content pool samples: ${result.contentPoolSamplePathCount}`,
    '',
    `highSeverityContradictionCount: **${result.highSeverityContradictionCount}**`,
    `mediumLowFindingCount: **${result.mediumLowFindingCount}** (defer queue, non-blocker)`,
    `North Star §8 item 3: **${result.section8Item3Status}**`,
    `Decision: **${result.passed ? 'PASS' : 'FAIL'}** (${result.findings.length} finding(s), ${result.criticalCount} critical)`,
    '',
    '## Audit command',
    '',
    '```bash',
    'npm exec tsx scripts/runP39ContentPoolConsistencySlice.ts',
    '```',
    '',
    '## Per-path findings',
    '',
  ];

  for (const trace of result.perPathFindings) {
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

  lines.push('## P36 baseline paths (unchanged)', '');
  lines.push(`P36 baseline pathCount: ${result.p36BaselinePathCount} (highSeverity=${result.p36Baseline.highSeverityContradictionCount})`);
  lines.push('');
  lines.push('## Content pool sample paths', '');
  for (const p of result.contentPoolSamplePaths) {
    lines.push(`- \`${p.id}\` — ${p.label}`);
  }
  lines.push('');
  lines.push('## All findings', '');

  if (result.findings.length === 0) {
    lines.push('No contradictions detected.');
  } else {
    for (const f of result.findings) {
      lines.push(
        `- **[${f.severity}]** \`${f.pathId}\` / ${f.defectType}: ${f.detail} → \`${f.pointer}\``,
      );
    }
  }

  lines.push('', '## Defer queue (non-blocker)', '');
  if (result.mediumLowFindingCount === 0) {
    lines.push('No medium/low audit findings in this run.');
  } else {
    for (const f of result.findings.filter(x => x.severity === 'medium')) {
      lines.push(`- **[medium]** \`${f.pathId}\` / ${f.defectType}: ${f.detail}`);
    }
  }
  lines.push(
    '- Wave 3 `merchant_magnate` and Wave 4 ordinary-origin expansion — out of P39 scope',
    '- Medical pool full habit-led migration (3/18) — unchanged defer',
    '- game-engine JSON poison mutex non-sim path — monitor only',
    '- Combinatorial full event pool exhaust — bounded representative audit sufficient',
  );

  return lines.join('\n');
}
