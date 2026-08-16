#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  formatArchetypeDifferentiationMarkdown,
  formatCoverageAuditMarkdown,
  formatLegacyDriftMarkdown,
  formatP44AuditSummaryMarkdown,
  runP44HabitOperatorAudit,
} from '../src/p44/habitOperatorAudit';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  const writeArtifacts = process.argv.includes('--write');
  const result = runP44HabitOperatorAudit();

  console.log(`P44 habit operator audit (${result.auditVersion})`);
  console.log(`Coverage readers: ${result.coverage.readers.length}`);
  console.log(`Coverage gaps: ${result.coverage.gaps.length}`);
  console.log(`Coverage low-density: ${result.coverage.lowDensity.length}`);
  console.log(`Legacy suspicious: ${result.legacyDrift.suspiciousCount}`);
  console.log(`Archetype convergence warnings: ${result.archetypeDifferentiation.convergenceWarnings.length}`);
  console.log(`Recap engine wired: ${result.recapAbsorption.allRequiredEngineSurfacesWired ? 'yes' : 'no'}`);

  if (!writeArtifacts) return;

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p44-habit-operator-audit.json'),
    JSON.stringify(result, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p44-habit-coverage-audit.md'),
    formatCoverageAuditMarkdown(result.coverage),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p44-legacy-flag-drift-audit.md'),
    formatLegacyDriftMarkdown(result.legacyDrift),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p44-archetype-differentiation-audit.md'),
    formatArchetypeDifferentiationMarkdown(result.archetypeDifferentiation),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p44-habit-operator-audit-summary.md'),
    formatP44AuditSummaryMarkdown(result),
    'utf8',
  );

  console.log(`Wrote artifacts under ${REPORTS_DIR}`);
}

main();
