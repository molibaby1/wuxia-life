#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'node:child_process';
import { assembleP17GateReport, formatP17GateMarkdown } from '../src/p17/reportBuilder';
import { runMidLateLifeValidationSlice } from '../src/p17/validationSlices';
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
  const gate = assembleP17GateReport();
  const slice = runMidLateLifeValidationSlice();

  const playability = runGateCommand('npm', ['run', 'gate:playability']);
  const p12 = runGateCommand('npm', ['run', 'gate:p12-profile']);

  const closure = {
    phase: 'P17',
    title: 'Mid-Late-Life Consequence And Faction-Relationship Closure',
    generatedAt: new Date().toISOString(),
    beforeAfter: {
      relationshipGap: 'Relationship flags and lifePath lists were summary-only; now profile patterns weight later-life opportunity/risk tags.',
      factionGap: 'Faction membership unlocked events but lacked duty/exposure loops; organization and status patterns add sustained pressure.',
      achievementGap: 'High-tier achievements ended at prestige flags; maintenance patterns expose unmet pressure and decline risk.',
    },
    implemented: {
      relationshipPatterns: gate.relationship.patternCount,
      factionPatterns: gate.factionIdentity.patternCount,
      maintenancePatterns: gate.achievementMaintenance.patternCount,
      laterLifeMinAge: 25,
    },
    validation: {
      allyChangesOpportunity: slice.allyChangesOpportunity,
      factionAddsDuty: slice.factionAddsDuty,
      achievementFragileWhenNeglected: slice.achievementFragileWhenNeglected,
      gateDecision: gate.decision,
      gatePlayability: playability,
      gateP12Profile: p12,
    },
    nonGoals: [
      'No descendant or intergenerational gameplay',
      'No UI expansion for maintenance meters',
      'No second-theme feature pack',
      'No scheduler rewrite — extends getRouteSchedulingMultiplier only',
    ],
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p17-closure-report.json'),
    JSON.stringify(closure, null, 2),
    'utf8',
  );

  const md = [
    '# P17 Closure Report',
    '',
    `Generated: ${closure.generatedAt}`,
    '',
    '## Before / After',
    `- Relationship: ${closure.beforeAfter.relationshipGap}`,
    `- Faction/identity: ${closure.beforeAfter.factionGap}`,
    `- Achievement: ${closure.beforeAfter.achievementGap}`,
    '',
    '## Implemented',
    `- Relationship patterns: ${closure.implemented.relationshipPatterns}`,
    `- Faction/identity patterns: ${closure.implemented.factionPatterns}`,
    `- Maintenance patterns: ${closure.implemented.maintenancePatterns}`,
    `- Later-life wiring from age: ${closure.implemented.laterLifeMinAge}`,
    '',
    '## Validation',
    `- Ally changes opportunity: ${closure.validation.allyChangesOpportunity}`,
    `- Faction adds duty: ${closure.validation.factionAddsDuty}`,
    `- Achievement fragile when neglected: ${closure.validation.achievementFragileWhenNeglected}`,
    `- P17 gate: ${closure.validation.gateDecision}`,
    `- gate:playability: ${closure.validation.gatePlayability.ok ? 'pass' : 'fail'} (${closure.validation.gatePlayability.detail})`,
    `- gate:p12-profile: ${closure.validation.gateP12Profile.ok ? 'pass' : 'fail'} (${closure.validation.gateP12Profile.detail})`,
    '',
    '## Non-goals',
    ...closure.nonGoals.map(item => `- ${item}`),
    '',
    formatP17GateMarkdown(gate),
  ].join('\n');

  fs.writeFileSync(path.join(REPORTS_DIR, 'p17-closure-report.md'), md, 'utf8');
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p17-before-after-findings.md'),
    [
      '# P17 Before-After Findings',
      '',
      '## Relationship closure',
      '- **Before**: `has_sworn_siblings`, `has_mentor`, `swornEnemies` appeared in summaries without scheduling weight.',
      '- **After**: Profile `relationshipConsequencePatterns` drive opportunity/risk tag multipliers from age 25+.',
      '',
      '## Faction / identity closure',
      '- **Before**: `sect_faction` and route flags gated content but rarely imposed duty or rivalry pressure.',
      '- **After**: Organization and social-status patterns add protection/access upside and duty/exposure/rivalry downside.',
      '',
      '## Achievement maintenance',
      '- **Before**: Hero mantle and sect leadership were prestige flags with hardcoded one-off boosts.',
      '- **After**: `achievementMaintenancePatterns` report unmet pressure and amplify decline/backlash risk when neglected.',
      '',
      '## Regression',
      `- gate:playability: ${playability.ok ? 'no regression' : 'CHECK FAILED'}`,
      `- gate:p12-profile: ${p12.ok ? 'no regression' : 'CHECK FAILED'}`,
    ].join('\n'),
    'utf8',
  );

  console.log('Wrote docs/test-reports/p17-closure-report.{json,md}');
  console.log('Wrote docs/test-reports/p17-before-after-findings.md');
}

main();
