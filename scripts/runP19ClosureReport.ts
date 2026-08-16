#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'node:child_process';
import { assembleP19GateReport, formatP19GateMarkdown } from '../src/p19/reportBuilder';
import {
  runEndgameCategoryComparisonSlice,
  runHistoricalMemoryComparisonSlice,
  runPreEndgameClosureComparisonSlice,
} from '../src/p19/validationSlices';
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
  const gate = assembleP19GateReport();
  const categorySlice = runEndgameCategoryComparisonSlice();
  const memorySlice = runHistoricalMemoryComparisonSlice();
  const closureSlice = runPreEndgameClosureComparisonSlice();

  const playability = runGateCommand('npm', ['run', 'gate:playability']);
  const p12 = runGateCommand('npm', ['run', 'gate:p12-profile']);
  const p18 = runGateCommand('npm', ['run', 'gate:p18']);

  const closure = {
    phase: 'P19',
    title: 'Endgame Echo And Historical Memory Closure',
    generatedAt: new Date().toISOString(),
    beforeAfter: {
      endgameGap:
        'Endings collapsed into stat thresholds; endgame categories now differentiate by relationship, faction, legacy, and burden trajectories.',
      recoveryGap:
        'P17/P18 multipliers lacked explicit pre-endgame recovery lines; recovery patterns produce inspectable closure output in final summary.',
      memoryGap:
        'Epilogue mirrored autobiographical stats; historical memory evaluation separates lived self-understanding from posthumous reputation.',
    },
    implemented: {
      endgameCategoryConfigs: gate.endgameCategories.configCount,
      preEndgameRecoveryPatterns: gate.preEndgameRecovery.patternCount,
      historicalMemoryPatterns: gate.historicalMemory.patternCount,
      finalSummaryUpgraded: true,
    },
    validation: {
      categoryChangesBeyondAge: categorySlice.categoryChangesBeyondAge,
      memoryDiffersFromSelfUnderstanding: memorySlice.memoryDiffersFromSelfUnderstanding,
      closureMateriallyChangesSummary: closureSlice.closureMateriallyChangesSummary,
      gateDecision: gate.decision,
      gatePlayability: playability,
      gateP12Profile: p12,
      gateP18: p18,
    },
    readability: gate.readability,
    nonGoals: [
      'No UI epilogue screen expansion',
      'No multi-generation historiography simulator',
      'No scheduler rewrite — composes with P17/P18 multipliers',
    ],
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p19-closure-report.json'),
    JSON.stringify(closure, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p19-gate-latest.md'),
    formatP19GateMarkdown(gate),
    'utf8',
  );

  const md = [
    '# P19 Closure Report',
    '',
    `Generated: ${closure.generatedAt}`,
    '',
    '## Before / After',
    `- Endgame: ${closure.beforeAfter.endgameGap}`,
    `- Recovery: ${closure.beforeAfter.recoveryGap}`,
    `- Memory: ${closure.beforeAfter.memoryGap}`,
    '',
    '## Implemented',
    `- Endgame categories: ${closure.implemented.endgameCategoryConfigs}`,
    `- Pre-endgame recovery patterns: ${closure.implemented.preEndgameRecoveryPatterns}`,
    `- Historical memory patterns: ${closure.implemented.historicalMemoryPatterns}`,
    '',
    '## Validation',
    `- Category beyond age: ${closure.validation.categoryChangesBeyondAge}`,
    `- Memory divergence: ${closure.validation.memoryDiffersFromSelfUnderstanding}`,
    `- Closure changes summary: ${closure.validation.closureMateriallyChangesSummary}`,
    `- Gate decision: ${closure.validation.gateDecision}`,
    `- gate:playability: ${closure.validation.gatePlayability.ok ? 'pass' : 'fail'}`,
    `- gate:p12-profile: ${closure.validation.gateP12Profile.ok ? 'pass' : 'fail'}`,
    `- gate:p18: ${closure.validation.gateP18.ok ? 'pass' : 'fail'}`,
  ].join('\n');

  fs.writeFileSync(path.join(REPORTS_DIR, 'p19-closure-report.md'), md, 'utf8');
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p19-before-after-findings.md'),
    [
      '# P19 Before / After Findings',
      '',
      '## Endgame differentiation',
      '- Before: `EndingSystem` stat buckets; age 70 forced re-run of same logic.',
      '- After: five profile-first endgame categories weighted by relationship, faction, legacy, achievement, burden.',
      '',
      '## Pre-endgame recovery',
      '- Before: P17/P18 scheduling only; no explicit reconciliation/collapse lines.',
      '- After: seven recovery patterns with inspectable summary lines and late-life multiplier.',
      '',
      '## Historical memory',
      '- Before: `getEndingSummary` personal tone only.',
      '- After: posthumous evaluation with divergence score and classification output.',
    ].join('\n'),
    'utf8',
  );

  console.log('Wrote artifacts/reports/p19-closure-report.{json,md}');
  console.log('Wrote artifacts/reports/p19-before-after-findings.md');
}

main();
