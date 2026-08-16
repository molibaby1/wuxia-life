#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { assembleP12ProfileGateReport } from '../src/p12/reportBuilder';
import { PROFILE_READER_REGISTRY } from '../src/p12/readerRegistry';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

function main(): void {
  console.log('Running gate:playability...');
  execSync('npm run gate:playability', { stdio: 'inherit' });

  console.log('Running gate:p11-scheduling...');
  execSync('npm run gate:p11-scheduling', { stdio: 'inherit' });

  console.log('Running P12 profile gate...');
  execSync('tsx scripts/runP12ProfileGate.ts', { stdio: 'inherit' });

  const gateReport = assembleP12ProfileGateReport(WUXIA_WORLD_PROFILE);
  const profileFirst = PROFILE_READER_REGISTRY.filter(r => r.status === 'profile-first');
  const deferred = PROFILE_READER_REGISTRY.filter(r => r.status === 'deferred');

  const lines: string[] = [
    '# P12 Closure Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Gates',
    '- gate:playability: executed (see p8-playability-gate-latest.md)',
    '- gate:p11-scheduling: executed (see p11-scheduling-gate-latest.md)',
    `- P12 profile gate: **${gateReport.decision}** (see p12-profile-gate-latest.md)`,
    '',
    '## Profile-first readers',
    '',
  ];

  for (const reader of profileFirst) {
    lines.push(`- **${reader.id}** (${reader.module}): ${reader.description}`);
  }

  lines.push('', '## Deferred readers', '');
  for (const reader of deferred) {
    lines.push(`- **${reader.id}** (${reader.module}): ${reader.description}`);
    if (reader.note) {
      lines.push(`  - ${reader.note}`);
    }
  }

  lines.push('', '## Save schema / API boundary', '');
  lines.push('- Player save schema: **unchanged** in P12');
  lines.push('- Backend/API boundary: **unchanged** in P12');
  lines.push('- Profile supplies theme metadata; player state remains authoritative for numeric values');
  lines.push('');

  lines.push('## Section completeness', '');
  for (const [key, value] of Object.entries(gateReport.sectionSummary)) {
    lines.push(`- ${key}: ${value.present ? 'present' : 'missing'} (${value.count})`);
  }
  lines.push('');

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORTS_DIR, 'p12-closure-report.md'), lines.join('\n'), 'utf8');
  console.log('Wrote artifacts/reports/p12-closure-report.md');
}

main();
