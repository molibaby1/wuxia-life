#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'node:child_process';
import { assembleP18GateReport, formatP18GateMarkdown } from '../src/p18/reportBuilder';
import {
  runContinuityComparisonSlice,
  runInheritedBurdenComparisonSlice,
  runUnderinvestmentComparisonSlice,
} from '../src/p18/validationSlices';
import { gateChildEnv } from '../tests/qualityGatePolicy';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

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
  const gate = assembleP18GateReport();
  const continuity = runContinuityComparisonSlice();
  const burden = runInheritedBurdenComparisonSlice();
  const underinvest = runUnderinvestmentComparisonSlice();

  const playability = runGateCommand('npm', ['run', 'gate:playability']);
  const p12 = runGateCommand('npm', ['run', 'gate:p12-profile']);
  const p17 = runGateCommand('npm', ['run', 'gate:p17']);

  const closure = {
    phase: 'P18',
    title: 'Legacy, Disciples, And Heirs Closure',
    generatedAt: new Date().toISOString(),
    beforeAfter: {
      cultivationGap:
        'Disciple/heir surfaces were summary-only; successor roles and cultivation cost now weight late-life scheduling.',
      inheritanceGap:
        'Heritage stats and legacy flags did not shape successor outcomes; inheritance channels carry asset and burden polarity.',
      divergenceGap:
        'Major achievements ended without transmission consequence; legacy outcome patterns differentiate triumph, burden, and rupture.',
    },
    implemented: {
      successorRoleConfigs: gate.successorRoles.configCount,
      inheritanceChannels: gate.inheritanceChannels.patternCount,
      cultivationCostPatterns: gate.cultivationCost.patternCount,
      legacyOutcomePatterns: gate.legacyOutcomes.patternCount,
      laterLifeMinAge: 25,
    },
    validation: {
      cultivationChangesStability: continuity.cultivationChangesStability,
      burdenAltersOutcomeSpace: burden.burdenAltersOutcomeSpace,
      underinvestmentWeakerThanAchievement: underinvest.underinvestmentWeakerThanAchievementSuggests,
      gateDecision: gate.decision,
      gatePlayability: playability,
      gateP12Profile: p12,
      gateP17: p17,
    },
    readability: gate.readability,
    nonGoals: [
      'No per-NPC successor simulation',
      'No multi-generation playable descendants',
      'No UI expansion for legacy ledger',
      'No scheduler rewrite — composes with P17 multiplier',
    ],
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p18-closure-report.json'),
    JSON.stringify(closure, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p18-gate-latest.md'),
    formatP18GateMarkdown(gate),
    'utf8',
  );

  const md = [
    '# P18 Closure Report',
    '',
    `Generated: ${closure.generatedAt}`,
    '',
    '## Before / After',
    `- Cultivation: ${closure.beforeAfter.cultivationGap}`,
    `- Inheritance: ${closure.beforeAfter.inheritanceGap}`,
    `- Divergence: ${closure.beforeAfter.divergenceGap}`,
    '',
    '## Implemented',
    `- Successor roles: ${closure.implemented.successorRoleConfigs}`,
    `- Inheritance channels: ${closure.implemented.inheritanceChannels}`,
    `- Cultivation cost patterns: ${closure.implemented.cultivationCostPatterns}`,
    `- Legacy outcome patterns: ${closure.implemented.legacyOutcomePatterns}`,
    '',
    '## Validation',
    `- Cultivation changes stability: ${closure.validation.cultivationChangesStability}`,
    `- Burden alters outcome space: ${closure.validation.burdenAltersOutcomeSpace}`,
    `- Underinvestment vs achievement: ${closure.validation.underinvestmentWeakerThanAchievement}`,
    `- P18 gate: ${closure.validation.gateDecision}`,
    `- gate:playability: ${closure.validation.gatePlayability.ok ? 'pass' : 'fail'} (${closure.validation.gatePlayability.detail})`,
    `- gate:p12-profile: ${closure.validation.gateP12Profile.ok ? 'pass' : 'fail'}`,
    `- gate:p17: ${closure.validation.gateP17.ok ? 'pass' : 'fail'}`,
    '',
    '## Readability',
    ...closure.readability.summaryCoherenceNotes.map(n => `- ${n}`),
    '',
  ].join('\n');

  fs.writeFileSync(path.join(REPORTS_DIR, 'p18-closure-report.md'), md, 'utf8');

  console.log('Wrote docs/test-reports/p18-closure-report.{json,md}');
  console.log(`P18 gate decision: ${gate.decision}`);

  if (gate.decision === 'fail' || !playability.ok || !p12.ok || !p17.ok) {
    process.exit(1);
  }
}

main();
