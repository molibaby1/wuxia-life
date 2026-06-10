#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { assembleP23GateReport, formatP23GateMarkdown } from '../src/p23/reportBuilder';
import { buildExperienceAcceptanceMatrix, formatAcceptanceMatrixMarkdown } from '../src/p23/validationMatrix';
import { runBoundedFullLifeOperation } from '../src/p23/validationSlices';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function main(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const gate = assembleP23GateReport(WUXIA_WORLD_PROFILE);
  const matrix = buildExperienceAcceptanceMatrix();
  const fullLife = runBoundedFullLifeOperation();

  const payload = { gate, matrix, fullLife };

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p23-gate-latest.json'),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p23-gate-latest.md'),
    [formatP23GateMarkdown(gate), '', formatAcceptanceMatrixMarkdown(matrix)].join('\n'),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p23-acceptance-matrix-latest.json'),
    JSON.stringify(matrix, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p23-full-life-operation.json'),
    JSON.stringify(fullLife, null, 2),
    'utf8',
  );

  console.log(`P23 gate decision: ${gate.decision}`);
  if (gate.decision === 'fail') process.exit(1);
}

main();
