#!/usr/bin/env tsx

import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildAllP3EvalSegmentReports } from './goldenLineSegmentMetrics';
import {
  GOLDEN_LINE_END_AGE,
  GOLDEN_LINE_SAMPLES,
  runAllGoldenLineSimulations,
} from './goldenLineSimulation';
import { summarizeTopDeathCauses } from './deathRiskTelemetry';

async function main(): Promise<void> {
  const runs = await runAllGoldenLineSimulations();
  const outputDir = path.join(process.cwd(), 'public/reports');
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `golden-line-simulation-${Date.now()}.json`);
  const segmentReports = buildAllP3EvalSegmentReports(runs);
  const payload = {
    generatedAt: new Date().toISOString(),
    endAge: GOLDEN_LINE_END_AGE,
    sampleCount: GOLDEN_LINE_SAMPLES.length,
    deathCauseSummary: summarizeTopDeathCauses(
      runs.map(run => ({ report: run.report, sampleId: run.sample.id })),
    ),
    samples: segmentReports.map(segment => ({
      ...segment,
      deathRiskTelemetry:
        runs.find(run => run.sample.id === segment.sampleId)?.report.deathRiskTelemetry ?? null,
      reportId: runs.find(run => run.sample.id === segment.sampleId)?.report.id,
      replay: runs.find(run => run.sample.id === segment.sampleId)?.replay,
    })),
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`\n=== Golden Line Simulation (0–${GOLDEN_LINE_END_AGE}) ===\n`);
  for (const segment of segmentReports) {
    console.log(
      `${segment.sampleId}: age=${segment.finalAge} youth=${segment.youth.eventCount}ev midlife=${segment.midlife.eventCount}ev/${segment.midlife.choiceCount}ch alive=${segment.isAlive}`,
    );
  }
  console.log(`\nJSON: ${path.relative(process.cwd(), outputPath)}`);
}

main().catch(error => {
  console.error('[golden-line-simulation] failed:', error);
  process.exit(1);
});
