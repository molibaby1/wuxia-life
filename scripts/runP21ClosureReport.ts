#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'node:child_process';
import {
  assembleP21ClosurePayload,
  formatP21ClosureMarkdown,
  formatP21GateMarkdown,
} from '../src/p21/reportBuilder';
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
  const { gate, matrix, constraintReport, tuningSlice, wave } = assembleP21ClosurePayload();

  const playability = runGateCommand('npm', ['run', 'gate:playability']);
  const p12 = runGateCommand('npm', ['run', 'gate:p12-profile']);
  const p20 = runGateCommand('npm', ['run', 'gate:p20']);

  const closure = {
    phase: 'P21',
    title: 'Content Production And Tuning Closure',
    generatedAt: new Date().toISOString(),
    beforeAfter: {
      authoringGap:
        'Echo/callback required four-file coupling with implicit semantics; P21 authoringSchema + authoringSemantics + contracts make fields explicit.',
      validationGap:
        'Event quality and profile gates ran separately; P21 production matrix unifies style/fit/duplicate findings.',
      tuningGap:
        'Distribution tuning required runtime knowledge; P21 tuning samples + comparison slice prove config-only scholar rebalance.',
      llmGap:
        'No bounded LLM I/O; P21 content/tuning contracts + validation paths catch low-quality drafts and off-target tuning.',
    },
    implemented: {
      contentStyleConstraints: gate.productionSurfaces.styleConstraintCount,
      contentDuplicateConstraints: gate.productionSurfaces.duplicateConstraintCount,
      tuningSampleConfigs: gate.productionSurfaces.tuningSampleCount,
      p21ContentSamples: gate.productionSurfaces.p21EventCount,
      runtimeModules: ['constraintEvaluation', 'productionMatrix', 'llmContracts', 'validationSlices'],
    },
    validation: {
      contentSamplesPass: gate.validation.contentSamplesPass,
      tuningComparisonPass: gate.validation.tuningComparisonPass,
      optimizationWavePass: gate.validation.optimizationWavePass,
      gateDecision: gate.decision,
      tuningAllThree: tuningSlice.allThreeCovered,
    },
    upstreamGates: {
      playability,
      p12Profile: p12,
      p20,
    },
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p21-closure-report.json'),
    JSON.stringify(closure, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p21-closure-report.md'),
    [
      '# P21 Closure Report',
      '',
      formatP21GateMarkdown(gate),
      '',
      '## Before / After',
      `- **Authoring:** ${closure.beforeAfter.authoringGap}`,
      `- **Validation:** ${closure.beforeAfter.validationGap}`,
      `- **Tuning:** ${closure.beforeAfter.tuningGap}`,
      `- **LLM safety:** ${closure.beforeAfter.llmGap}`,
      '',
      '## Upstream Gates',
      `- playability: ${playability.ok ? 'PASS' : 'FAIL'} — ${playability.detail}`,
      `- p12-profile: ${p12.ok ? 'PASS' : 'FAIL'} — ${p12.detail}`,
      `- p20: ${p20.ok ? 'PASS' : 'FAIL'} — ${p20.detail}`,
      '',
      formatP21ClosureMarkdown(gate, matrix, wave, constraintReport),
    ].join('\n'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p21-before-after-findings.md'),
    [
      '# P21 Before-After Findings',
      '',
      '## Authoring surfaces',
      '- Before: implicit echo wiring, sparse narrativeScheduling.',
      '- After: authoringSchema, authoringSemantics on samples, echo authoringContract.',
      '',
      '## Validation',
      '- Before: fragmented event-quality vs profile gates.',
      '- After: production matrix + constraint report + gate:p21.',
      '',
      '## Tuning',
      '- Before: scholar archetype weakly supported, ad hoc weight edits.',
      '- After: three tuning samples with measurable comparison slice evidence.',
      '',
      '## LLM loop safety',
      '- Before: no bounded contract.',
      '- After: content/tuning contracts with detectLowQualityContent and detectOffTargetTuning.',
    ].join('\n'),
    'utf8',
  );

  console.log(`P21 closure gate decision: ${gate.decision}`);
}

main();
