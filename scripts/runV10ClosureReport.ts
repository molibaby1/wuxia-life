#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'node:child_process';
import {
  assembleV10ClosurePayload,
  formatV10ClosureMarkdown,
  formatV10GateMarkdown,
} from '../src/v10/reportBuilder';
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
  const { gate, matrix, rcWave, fullClosure, indicators } = assembleV10ClosurePayload();

  const playability = runGateCommand('npm', ['run', 'gate:playability']);
  const p12 = runGateCommand('npm', ['run', 'gate:p12-profile']);
  const p20 = runGateCommand('npm', ['run', 'gate:p20']);
  const p23 = runGateCommand('npm', ['run', 'gate:p23']);

  const closure = {
    phase: 'v1.0',
    title: 'Release Candidate And Launch Readiness Closure',
    generatedAt: new Date().toISOString(),
    beforeAfter: {
      launchSurfaceGap:
        'P8–P23 gates proved internal health but lacked v1.0 launch classification and freeze boundary.',
      alignmentGap:
        'Internal acceptance could pass while first-run readability or ending aftertaste failed in human review.',
      rcGap:
        'Release decisions depended on maintainer knowledge without false-positive RC samples.',
      cadenceGap:
        'No documented hotfix / patch / content-wave rhythm after v1.0.',
    },
    implemented: {
      launchDimensions: gate.playtestCalibration.calibrationSurfaces.dimensionCount,
      calibrationBaselines: gate.playtestCalibration.calibrationSurfaces.baselineCount,
      comparisonSamples: gate.playtestCalibration.calibrationSurfaces.comparisonSampleCount,
      alignmentIndicators: gate.playtestCalibration.calibrationSurfaces.alignmentIndicatorCount,
      rcComparisonSamples: gate.playtestCalibration.calibrationSurfaces.rcComparisonSampleCount,
      launchRulesPass: gate.launchRules.ok,
      launchRulesContract: gate.launchRules.contractVersion,
      designDocs: [
        'v1-0-launch-dimension-rules',
        'v1-0-blocker-and-deferral-rules',
        'v1-0-launch-freeze-boundary',
        'v1-0-post-launch-cadence',
      ],
    },
    validation: {
      ...gate.launchReadiness,
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
      p20Replayability: p20,
      p23,
    },
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'v1-0-closure-report.json'),
    JSON.stringify(closure, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'v1-0-closure-report.md'),
    [
      '# v1.0 Closure Report',
      '',
      '## Before / After',
      `- Launch surfaces: ${closure.beforeAfter.launchSurfaceGap}`,
      `- Alignment: ${closure.beforeAfter.alignmentGap}`,
      `- RC: ${closure.beforeAfter.rcGap}`,
      `- Cadence: ${closure.beforeAfter.cadenceGap}`,
      '',
      formatV10GateMarkdown(gate),
      '',
      formatV10ClosureMarkdown(gate, matrix, rcWave),
      '',
      '## Full RC Closure',
      `- Decision: **${fullClosure.closureDecision}**`,
      `- Aligned decision share: ${(fullClosure.alignedDecisionShare * 100).toFixed(0)}%`,
      `- False-positive cases reduced: ${fullClosure.falsePositiveCasesReduced}`,
      `- Strong dimensions preserved: ${fullClosure.strongDimensionsPreserved}`,
      '',
      '## Upstream Gates (regression check)',
      `- Playability: ${playability.ok ? 'PASS' : 'FAIL'} — ${playability.detail}`,
      `- P12 profile: ${p12.ok ? 'PASS' : 'FAIL'} — ${p12.detail}`,
      `- P20 replayability: ${p20.ok ? 'PASS' : 'FAIL'} — ${p20.detail}`,
      `- P23: ${p23.ok ? 'PASS' : 'FAIL'} — ${p23.detail}`,
    ].join('\n'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'v1-0-before-after-findings.md'),
    [
      '# v1.0 Before/After Findings',
      '',
      '## Targeted launch-readiness issues',
      '1. No unified launch surface audit with ship / borderline / blocker classification.',
      '2. RC release judgment implicit — false-positive internal health invisible.',
      '3. Internal-external alignment gaps not machine-readable for ship decisions.',
      '4. No post-launch hotfix / patch / content-wave cadence.',
      '',
      '## After v1.0 RC workflow',
      `- ${gate.playtestCalibration.calibrationSurfaces.dimensionCount} launch dimensions with calibration baselines.`,
      `- ${matrix.summary.baselinesPassing}/${matrix.baselineScores.length} baselines distinguish stronger/weaker slices.`,
      `- ${matrix.summary.falsePositiveDetected} false-positive RC sample(s); ${matrix.summary.redirectionsValidated} redirection(s); ${matrix.summary.targetedFixesValidated} targeted fix(es).`,
      `- RC wave: ${rcWave.waveDecision} (${rcWave.cases.filter(c => c.passed).length}/${rcWave.cases.length} cases).`,
      `- Full closure: ${fullClosure.closureDecision} (aligned share ${(fullClosure.alignedDecisionShare * 100).toFixed(0)}%).`,
      `- Post-launch cadence documented in docs/designs/v1-0-post-launch-cadence.md.`,
      '',
      '## Regression check',
      `- gate:playability: ${playability.ok ? 'PASS' : 'FAIL'}`,
      `- gate:p12-profile: ${p12.ok ? 'PASS' : 'FAIL'}`,
      `- gate:p20: ${p20.ok ? 'PASS' : 'FAIL'}`,
      `- gate:p23: ${p23.ok ? 'PASS' : 'FAIL'}`,
    ].join('\n'),
    'utf8',
  );

  console.log(`v1.0 closure gate decision: ${gate.decision}`);
  if (gate.decision === 'fail') process.exit(1);
}

main();
