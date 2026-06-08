#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { runAllPersonaSimulations } from '../src/p9/simulationRunner';
import {
  assembleP11SchedulingGateReport,
  buildStageBaseline,
  buildRouteBaseline,
} from '../src/p11/reportBuilder';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');

function readJsonIfExists<T>(filename: string): T | null {
  const fullPath = path.join(REPORTS_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

async function main(): Promise<void> {
  console.log('Running gate:playability...');
  execSync('npm run gate:playability', { stdio: 'inherit' });

  console.log('Running P11 scheduling gate...');
  execSync('tsx scripts/runP11SchedulingGate.ts', { stdio: 'inherit' });

  const preBaseline = readJsonIfExists<{ stageCoverage: ReturnType<typeof buildStageBaseline> }>(
    'p11-pre-closure-baseline.json',
  );

  const bundles = await runAllPersonaSimulations();
  const personaBundles = bundles.map(bundle => ({
    personaId: bundle.personaId,
    records: bundle.records,
  }));
  const postStage = buildStageBaseline(personaBundles);
  const postRoute = buildRouteBaseline(personaBundles);
  const postGate = assembleP11SchedulingGateReport(personaBundles);

  const lines: string[] = [
    '# P11 Closure Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Gates',
    '- gate:playability: executed (see p8-playability-gate-latest.md)',
    `- P11 scheduling gate: **${postGate.decision}**`,
    '',
    '## Stage signal coverage (post-P11)',
    '',
  ];

  for (const entry of postStage) {
    lines.push(`### ${entry.ageBand}`);
    lines.push(`- Expected: ${entry.expectedSignals.join(', ')}`);
    lines.push(`- Detected: ${entry.detectedSignals.map(item => item.key).join(', ') || '(none)'}`);
    lines.push(`- Missing: ${entry.missingSignals.join(', ') || '(none)'}`);
    lines.push('');
  }

  if (preBaseline?.stageCoverage) {
    lines.push('## Stage coverage delta (pre vs post)');
    lines.push('');
    for (const post of postStage) {
      const pre = preBaseline.stageCoverage.find(item => item.stageId === post.stageId);
      const preMissing = pre?.missingSignals.length ?? '?';
      const postMissing = post.missingSignals.length;
      lines.push(
        `- ${post.ageBand}: missing signals ${preMissing} → ${postMissing}`,
      );
    }
    lines.push('');
  }

  lines.push('## Route coverage (post-P11)');
  lines.push('');
  for (const route of postRoute) {
    lines.push(`### ${route.routeLabel}`);
    lines.push(`- Never scheduled points: ${route.neverScheduledPoints.length}`);
    for (const point of route.neverScheduledPoints.slice(0, 3)) {
      lines.push(`  - ${point.point.kind} @ ${point.point.ageBand}: ${point.point.description}`);
    }
    lines.push('');
  }

  lines.push('## Residual gaps');
  lines.push('');
  lines.push('- Persona-specific strategy tuning may still be needed for scholar/social reinforcement empty config points.');
  lines.push('- Second-theme world packs remain out of scope for P11.');
  lines.push('- Some stage gaps may reflect weak-detection rather than missing runtime behavior.');
  lines.push('');

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORTS_DIR, 'p11-closure-report.md'), lines.join('\n'), 'utf8');
  console.log('Wrote docs/test-reports/p11-closure-report.md');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
