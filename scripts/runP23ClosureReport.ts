#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'node:child_process';
import {
  assembleP23ClosurePayload,
  formatP23ClosureMarkdown,
  formatP23GateMarkdown,
} from '../src/p23/reportBuilder';
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
  const { gate, matrix, fullLife, indicators } = assembleP23ClosurePayload();

  const playability = runGateCommand('npm', ['run', 'gate:playability']);
  const p12 = runGateCommand('npm', ['run', 'gate:p12-profile']);
  const p22 = runGateCommand('npm', ['run', 'gate:p22']);

  const closure = {
    phase: 'P23',
    title: 'Experience Acceptance And Live Balance Closure',
    generatedAt: new Date().toISOString(),
    beforeAfter: {
      acceptanceGap:
        'P16–P22 gates proved system health and content volume but lacked unified experience acceptance baselines.',
      comparisonGap:
        'Tuning waves could pass without demonstrating player-experience improvement over volume growth.',
      balanceGap:
        'Long-term balance relied on scattered P20/P22 metrics without wave-to-wave indicator set.',
      decisionGap:
        'Low-value content waves were not systematically detectable or redirectable.',
    },
    implemented: {
      experienceDimensions: gate.acceptanceSurfaces.dimensionCount,
      acceptanceBaselines: gate.acceptanceSurfaces.baselineCount,
      comparisonSamples: gate.acceptanceSurfaces.comparisonSampleCount,
      balanceIndicators: gate.acceptanceSurfaces.balanceIndicatorCount,
      liveBalanceSamples: gate.acceptanceSurfaces.liveBalanceSampleCount,
      runtimeModules: [
        'experienceBaselines',
        'comparisonReporting',
        'balanceIndicators',
        'liveBalanceSamples',
        'validationMatrix',
        'validationSlices',
      ],
    },
    validation: {
      baselinesPass: gate.validation.baselinesPass,
      comparisonsPass: gate.validation.comparisonsPass,
      indicatorsHealthy: gate.validation.indicatorsHealthy,
      matrixPass: gate.validation.matrixPass,
      fullLifeOperationPass: gate.validation.fullLifeOperationPass,
      lowValueDetectionPass: gate.validation.lowValueDetectionPass,
      tuningRedirectionPass: gate.validation.tuningRedirectionPass,
      gateDecision: gate.decision,
      matrixDecision: matrix.decision,
      fullLifeDecision: fullLife.waveDecision,
      indicatorHealth: indicators.map(i => ({
        id: i.indicatorId,
        value: i.currentValue,
        healthy: i.inHealthyRange,
      })),
    },
    upstreamGates: {
      playability,
      p12Profile: p12,
      p22,
    },
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p23-closure-report.json'),
    JSON.stringify(closure, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p23-closure-report.md'),
    [
      '# P23 Closure Report',
      '',
      '## Before / After',
      `- Acceptance: ${closure.beforeAfter.acceptanceGap}`,
      `- Comparison: ${closure.beforeAfter.comparisonGap}`,
      `- Balance: ${closure.beforeAfter.balanceGap}`,
      `- Decision: ${closure.beforeAfter.decisionGap}`,
      '',
      formatP23GateMarkdown(gate),
      '',
      formatP23ClosureMarkdown(gate, matrix, fullLife),
      '',
      '## Upstream Gates',
      `- Playability: ${playability.ok ? 'PASS' : 'FAIL'} — ${playability.detail}`,
      `- P12 profile: ${p12.ok ? 'PASS' : 'FAIL'} — ${p12.detail}`,
      `- P22: ${p22.ok ? 'PASS' : 'FAIL'} — ${p22.detail}`,
    ].join('\n'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p23-before-after-findings.md'),
    [
      '# P23 Before/After Findings',
      '',
      '## Targeted issues',
      '1. Experience acceptance scattered across P8/P20/P21/P22 without unified dimensions.',
      '2. Content waves could expand pools without measurably improving weak experience slices.',
      '3. No stable long-term balance indicator set for wave-to-wave comparison.',
      '4. Low-value tuning waves not detectable through reporting chain.',
      '',
      '## After P23',
      `- ${gate.acceptanceSurfaces.dimensionCount} experience dimensions with explicit baselines and comparisons.`,
      `- ${matrix.summary.baselinesPassing}/${matrix.baselineScores.length} baselines distinguish stronger/weaker slices.`,
      `- ${matrix.summary.lowValueWavesDetected} low-value wave(s) detected; ${matrix.summary.tuningRedirections} redirection(s).`,
      `- Full-life operation: ${fullLife.waveDecision} (${fullLife.cases.filter(c => c.passed).length}/${fullLife.cases.length} cases).`,
      '',
      '## Regression check',
      `- gate:playability: ${playability.ok ? 'PASS' : 'FAIL'}`,
      `- gate:p12-profile: ${p12.ok ? 'PASS' : 'FAIL'}`,
      `- gate:p22: ${p22.ok ? 'PASS' : 'FAIL'}`,
    ].join('\n'),
    'utf8',
  );

  console.log(`P23 closure gate decision: ${gate.decision}`);
  if (gate.decision === 'fail') process.exit(1);
}

main();
