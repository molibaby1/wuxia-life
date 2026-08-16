#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'node:child_process';
import {
  assembleP24ClosurePayload,
  formatP24ClosureMarkdown,
  formatP24GateMarkdown,
} from '../src/p24/reportBuilder';
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
  const { gate, matrix, rcWave, fullClosure, indicators } = assembleP24ClosurePayload();

  const playability = runGateCommand('npm', ['run', 'gate:playability']);
  const p12 = runGateCommand('npm', ['run', 'gate:p12-profile']);
  const p23 = runGateCommand('npm', ['run', 'gate:p23']);

  const closure = {
    phase: 'P24',
    title: 'Playtest Calibration And Release Candidate Closure',
    generatedAt: new Date().toISOString(),
    beforeAfter: {
      playtestGap:
        'P8–P23 gates proved internal health but lacked structured playtest feedback and RC evaluation surfaces.',
      alignmentGap:
        'Internal acceptance could pass while first-run readability or ending aftertaste failed in human review.',
      rcGap:
        'Release decisions depended on maintainer knowledge without false-positive RC samples.',
      calibrationGap:
        'No unified playtest dimension baselines wired through profile-first reporting.',
    },
    implemented: {
      playtestDimensions: gate.calibrationSurfaces.dimensionCount,
      calibrationBaselines: gate.calibrationSurfaces.baselineCount,
      comparisonSamples: gate.calibrationSurfaces.comparisonSampleCount,
      alignmentIndicators: gate.calibrationSurfaces.alignmentIndicatorCount,
      rcComparisonSamples: gate.calibrationSurfaces.rcComparisonSampleCount,
      runtimeModules: [
        'sliceFixtures',
        'calibrationBaselines',
        'comparisonReporting',
        'alignmentIndicators',
        'rcEvaluation',
        'rcSamples',
        'validationMatrix',
        'validationSlices',
      ],
    },
    validation: {
      baselinesPass: gate.validation.baselinesPass,
      comparisonsPass: gate.validation.comparisonsPass,
      indicatorsHealthy: gate.validation.indicatorsHealthy,
      matrixPass: gate.validation.matrixPass,
      rcWavePass: gate.validation.rcWavePass,
      falsePositiveDetectionPass: gate.validation.falsePositiveDetectionPass,
      redirectionPass: gate.validation.redirectionPass,
      targetedFixPass: gate.validation.targetedFixPass,
      fullClosurePass: gate.validation.fullClosurePass,
      gateDecision: gate.decision,
      matrixDecision: matrix.decision,
      rcWaveDecision: rcWave.waveDecision,
      fullClosureDecision: fullClosure.closureDecision,
      alignedDecisionShare: fullClosure.alignedDecisionShare,
      indicatorHealth: indicators.map(i => ({
        id: i.indicatorId,
        gap: i.alignmentGap,
        bias: i.biasDirection,
        healthy: i.inHealthyRange,
      })),
    },
    upstreamGates: {
      playability,
      p12Profile: p12,
      p23,
    },
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p24-closure-report.json'),
    JSON.stringify(closure, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p24-closure-report.md'),
    [
      '# P24 Closure Report',
      '',
      '## Before / After',
      `- Playtest: ${closure.beforeAfter.playtestGap}`,
      `- Alignment: ${closure.beforeAfter.alignmentGap}`,
      `- RC: ${closure.beforeAfter.rcGap}`,
      `- Calibration: ${closure.beforeAfter.calibrationGap}`,
      '',
      formatP24GateMarkdown(gate),
      '',
      formatP24ClosureMarkdown(gate, matrix, rcWave),
      '',
      '## Full RC Closure',
      `- Decision: **${fullClosure.closureDecision}**`,
      `- Aligned decision share: ${(fullClosure.alignedDecisionShare * 100).toFixed(0)}%`,
      `- False-positive cases reduced: ${fullClosure.falsePositiveCasesReduced}`,
      `- Strong dimensions preserved: ${fullClosure.strongDimensionsPreserved}`,
      '',
      '## Upstream Gates',
      `- Playability: ${playability.ok ? 'PASS' : 'FAIL'} — ${playability.detail}`,
      `- P12 profile: ${p12.ok ? 'PASS' : 'FAIL'} — ${p12.detail}`,
      `- P23: ${p23.ok ? 'PASS' : 'FAIL'} — ${p23.detail}`,
    ].join('\n'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p24-before-after-findings.md'),
    [
      '# P24 Before/After Findings',
      '',
      '## Targeted issues',
      '1. No structured playtest feedback capture alongside internal gates.',
      '2. RC release judgment implicit — false-positive internal health invisible.',
      '3. Internal-external alignment gaps not machine-readable.',
      '4. First-run, onboarding, and ending aftertaste lacked calibration baselines.',
      '',
      '## After P24',
      `- ${gate.calibrationSurfaces.dimensionCount} playtest dimensions with explicit baselines.`,
      `- ${matrix.summary.baselinesPassing}/${matrix.baselineScores.length} baselines distinguish stronger/weaker slices.`,
      `- ${matrix.summary.falsePositiveDetected} false-positive RC sample(s); ${matrix.summary.redirectionsValidated} redirection(s); ${matrix.summary.targetedFixesValidated} targeted fix(es).`,
      `- RC wave: ${rcWave.waveDecision} (${rcWave.cases.filter(c => c.passed).length}/${rcWave.cases.length} cases).`,
      `- Full closure: ${fullClosure.closureDecision} (aligned share ${(fullClosure.alignedDecisionShare * 100).toFixed(0)}%).`,
      '',
      '## Regression check',
      `- gate:playability: ${playability.ok ? 'PASS' : 'FAIL'}`,
      `- gate:p12-profile: ${p12.ok ? 'PASS' : 'FAIL'}`,
      `- gate:p23: ${p23.ok ? 'PASS' : 'FAIL'}`,
    ].join('\n'),
    'utf8',
  );

  console.log(`P24 closure gate decision: ${gate.decision}`);
  if (gate.decision === 'fail') process.exit(1);
}

main();
