#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { runAllPersonaSimulations } from '../src/p9/simulationRunner';
import {
  buildStageBaseline,
  buildStageGapReport,
  buildRouteBaseline,
  formatStageBaselineMarkdown,
  formatRouteBaselineMarkdown,
} from '../src/p11/reportBuilder';

const REPORTS_DIR = path.join(process.cwd(), 'artifacts/reports');

async function main(): Promise<void> {
  const bundles = await runAllPersonaSimulations();
  const personaBundles = bundles.map(bundle => ({
    personaId: bundle.personaId,
    records: bundle.records,
  }));

  const stageBaseline = buildStageBaseline(personaBundles);
  const stageGaps = buildStageGapReport(stageBaseline, personaBundles);
  const routeBaseline = buildRouteBaseline(personaBundles);

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p11-stage-baseline-latest.md'),
    formatStageBaselineMarkdown(stageBaseline, stageGaps),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p11-route-baseline-latest.md'),
    formatRouteBaselineMarkdown(routeBaseline),
    'utf8',
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, 'p11-stage-baseline-latest.json'),
    JSON.stringify({ stageBaseline, stageGaps, routeBaseline, generatedAt: new Date().toISOString() }, null, 2),
    'utf8',
  );

  console.log('Wrote artifacts/reports/p11-stage-baseline-latest.md');
  console.log('Wrote artifacts/reports/p11-route-baseline-latest.md');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
