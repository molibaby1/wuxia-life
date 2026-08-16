#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { assembleP16GateReport, formatP16GateMarkdown } from '../src/p16/reportBuilder';
import { runOriginChoiceLuckSlice, runOriginVarianceSlice } from './validation/p16/validationSlices';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  const gate = assembleP16GateReport();
  const originSlice = runOriginVarianceSlice();
  const luckSlice = runOriginChoiceLuckSlice();

  const closure = {
    phase: 'P16',
    title: 'Origin-Driven Growth And Composite Destiny Closure',
    generatedAt: new Date().toISOString(),
    implemented: {
      originSurfaces: gate.originVariance.surfaceCount,
      childhoodAgencySuppression: gate.childhoodAgency.suppressedAtAge5,
      compositeDestinyOutcomes: gate.compositeDestiny.outcomeCount,
      rareEventLines: gate.rareEventLines.lineCount,
    },
    validation: {
      originChangesEarlyArc: originSlice.originChangesEarlyArc,
      compositeRareDependency: luckSlice.compositeUnlockCase,
      rareLineDivergence: luckSlice.rareLineDivergence.diverged,
      gateDecision: gate.decision,
    },
    nonGoals: [
      'No descendant training or intergenerational gameplay',
      'No UI theme switching',
      'No large-scale scheduler rewrite',
      'Dual origin_background vs TraitSystem track consolidation deferred',
    ],
    followUp: [
      'Wire backgroundWeights metadata into formal event selection',
      'Consume dailyEvents longTermHooks.addTendency at runtime',
      'Content pass on origin.json age-1 choice vs TraitSystem flags',
    ],
  };

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p16-closure-report.json'),
    JSON.stringify(closure, null, 2),
    'utf8',
  );

  const md = [
    '# P16 Closure Report',
    '',
    `Generated: ${closure.generatedAt}`,
    '',
    '## Implemented',
    `- Origin surfaces: ${closure.implemented.originSurfaces}`,
    `- Childhood suppressed actions (age 5): ${closure.implemented.childhoodAgencySuppression.join(', ')}`,
    `- Composite destiny outcomes: ${closure.implemented.compositeDestinyOutcomes}`,
    `- Rare event lines: ${closure.implemented.rareEventLines}`,
    '',
    '## Validation',
    `- Origin changes early arc: ${closure.validation.originChangesEarlyArc}`,
    `- Composite unlock depends on rare line: ${closure.validation.compositeRareDependency?.lockedWithoutRare ?? false}`,
    `- Rare line divergence possible: ${closure.validation.rareLineDivergence}`,
    `- Gate decision: ${closure.validation.gateDecision}`,
    '',
    '## Gate excerpt',
    '',
    formatP16GateMarkdown(gate),
    '',
    '## Non-goals',
    ...closure.nonGoals.map(item => `- ${item}`),
    '',
    '## Follow-up',
    ...closure.followUp.map(item => `- ${item}`),
  ].join('\n');

  fs.writeFileSync(path.join(REPORTS_DIR, 'p16-closure-report.md'), md, 'utf8');
  console.log('Wrote artifacts/reports/p16-closure-report.{json,md}');
}

main();
