#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'node:child_process';
import { assembleP20ClosurePayload, formatP20GateMarkdown } from '../src/p20/reportBuilder';
import { gateChildEnv } from '../tests/qualityGatePolicy';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function runGateCommand(command: string, args: string[]): { ok: boolean; detail: string } {
  const result = spawnSync(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: gateChildEnv(),
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  return {
    ok: result.status === 0,
    detail: output.split('\n').slice(-3).join(' ') || `exit ${result.status}`,
  };
}

function main(): void {
  const { gate, comparison, regression } = assembleP20ClosurePayload();

  const playability = runGateCommand('npm', ['run', 'gate:playability']);
  const p12 = runGateCommand('npm', ['run', 'gate:p12-profile']);
  const p19 = runGateCommand('npm', ['run', 'gate:p19']);

  const closure = {
    phase: 'P20',
    title: 'Replayability And Archetype Coverage Optimization',
    generatedAt: new Date().toISOString(),
    beforeAfter: {
      archetypeGap:
        'Archetypes collapsed into martial/balanced dominance; 5 lifecycle-scored families now differentiate origin through endgame memory.',
      repetitionGap:
        'Exact-repeat suppression limited to setback classes; profile repetition pressure reduces overlap while preserving thematic floor.',
      pacingGap:
        'Uniform 6–7y low-impact spans; per-archetype stage density and payoff spacing produce inspectable pacing comparison output.',
      replaySliceGap:
        'P9 pairs showed 0.85–0.91 similarity; replay slices cover origin, midlife consequence, and legacy/endgame divergence.',
    },
    implemented: {
      archetypeFamilyConfigs: gate.archetypeCoverage.familyCount,
      repetitionPressureConfigs: gate.repetitionPressure.configCount,
      archetypePacingProfiles: gate.wholeLifePacing.profileCount,
      replaySliceConfigs: gate.archetypeCoverage.replaySliceCount,
      runtimeWiring: ['archetypeScheduling', 'profileRepetitionPressure', 'wholeLifePacing'],
    },
    validation: {
      archetypeDifferentiation: comparison.archetype.atLeastThreeDistinct,
      repetitionReduced: comparison.repetition.overlapMateriallyReduced,
      pacingDiffers: comparison.pacing.pacingMeaningfullyDiffers,
      weakArchetypeImproved: comparison.weakArchetypeImproved,
      regressionMatrixPass: regression.allRepresentativeEmerge,
      gateDecision: gate.decision,
    },
    upstreamGates: {
      playability: playability,
      p12Profile: p12,
      p19: p19,
    },
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p20-closure-report.json'),
    JSON.stringify(closure, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p20-closure-report.md'),
    [
      '# P20 Closure Report',
      '',
      formatP20GateMarkdown(gate),
      '',
      '## Before / After',
      `- **Archetype:** ${closure.beforeAfter.archetypeGap}`,
      `- **Repetition:** ${closure.beforeAfter.repetitionGap}`,
      `- **Pacing:** ${closure.beforeAfter.pacingGap}`,
      `- **Replay slices:** ${closure.beforeAfter.replaySliceGap}`,
      '',
      '## Upstream Gates',
      `- playability: ${playability.ok ? 'pass' : 'fail'} — ${playability.detail}`,
      `- p12-profile: ${p12.ok ? 'pass' : 'fail'} — ${p12.detail}`,
      `- p19: ${p19.ok ? 'pass' : 'fail'} — ${p19.detail}`,
    ].join('\n'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p20-before-after-findings.md'),
    [
      '# P20 Before/After Findings',
      '',
      '## Archetype coverage',
      '- Before: martial/balanced over-dominant; scholar/wealth/hermit weak or missing.',
      '- After: 5 representative families with ≥3 lifecycle dimensions and regression matrix tracking.',
      '',
      '## Repetition pressure',
      '- Before: P9 reported 8 near-duplicate persona pairs; summary identity template collapse.',
      '- After: profile repetition configs with exact-repeat decay, novelty preference, thematic floor.',
      '',
      '## Whole-life pacing',
      '- Before: uniform low-impact spans; shared age-25 consequence gate timing.',
      '- After: per-archetype stage density, route offset, payoff spacing, closure rhythm.',
    ].join('\n'),
    'utf8',
  );

  console.log(`P20 closure gate decision: ${gate.decision}`);
  console.log('Wrote artifacts/reports/p20-closure-report.{json,md}');
}

main();
