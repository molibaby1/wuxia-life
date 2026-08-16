#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { runAllPersonaSimulations } from '../src/p9/simulationRunner';
import {
  assembleP11SchedulingGateReport,
  formatP11GateMarkdown,
} from '../src/p11/reportBuilder';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/gates');

async function main(): Promise<void> {
  const bundles = await runAllPersonaSimulations();
  const personaBundles = bundles.map(bundle => ({
    personaId: bundle.personaId,
    records: bundle.records,
  }));

  const report = assembleP11SchedulingGateReport(personaBundles);

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p11-scheduling-gate-latest.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p11-scheduling-gate-latest.md'),
    formatP11GateMarkdown(report),
    'utf8',
  );

  console.log(`P11 scheduling gate decision: ${report.decision}`);
  console.log('Wrote artifacts/gates/p11-scheduling-gate-latest.{json,md}');

  if (report.decision === 'fail') {
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
