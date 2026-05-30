#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import {
  evaluateExperienceHealthGate,
  parseWaiverArg,
  type ExperienceHealthGateResult,
  type ExperienceHealthMetricEvaluation,
} from './experienceHealthGate';
import {
  getGameplaySimulationSamples,
  type SimulationSample,
} from './runGameplaySimulation';
import { GameProcessSimulator } from '../tests/GameProcessSimulator';

type CliArgs = {
  quiet: boolean;
  skipSimulation: boolean;
  waivers: ReturnType<typeof parseWaiverArg>[];
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { quiet: false, skipSimulation: false, waivers: [] };
  for (const raw of argv) {
    if (raw === '--quiet') {
      args.quiet = true;
    } else if (raw === '--skip-simulation') {
      args.skipSimulation = true;
    } else if (raw.startsWith('--waive=')) {
      args.waivers.push(parseWaiverArg(raw.slice('--waive='.length)));
    }
  }
  return args;
}

function printSection(title: string, rows: ExperienceHealthMetricEvaluation[]): void {
  console.log(`\n${title}`);
  for (const row of rows) {
    const status = row.status.toUpperCase();
    const waiverSuffix = row.waived ? ` [WAIVED: ${row.waiverReason}]` : '';
    console.log(`- ${row.key} (${row.severity}) => ${status}${waiverSuffix}`);
    console.log(`  ${row.detail}`);
  }
}

function writeJsonOutput(
  gate: ExperienceHealthGateResult,
  samples: SimulationSample[],
  reportIds: string[],
): string {
  const outputDir = path.join(process.cwd(), 'public/reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `experience-health-${Date.now()}.json`);
  const payload = {
    generatedAt: new Date().toISOString(),
    sampleCount: samples.length,
    samples: samples.map(sample => ({
      id: sample.id,
      seed: sample.seed,
      routeTrack: sample.routeTrack ?? null,
    })),
    reportIds,
    decision: gate.decision,
    warningsFailed: gate.warningsFailed,
    derivedMetrics: gate.derivedMetrics,
    metrics: [
      ...gate.blockingMetrics,
      ...gate.warningMetrics,
      ...gate.infoMetrics,
    ].map(metric => ({
      key: metric.key,
      severity: metric.severity,
      status: metric.status,
      actualValue: metric.actualValue,
      detail: metric.detail,
      waived: metric.waived,
    })),
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  return outputPath;
}

async function runSamples(quiet: boolean): Promise<{ reports: Awaited<ReturnType<GameProcessSimulator['simulate']>>[]; samples: SimulationSample[] }> {
  const samples = getGameplaySimulationSamples(true);
  const reports = [];

  if (!quiet) {
    console.log(`\n[experience-gate] Running ${samples.length} gameplay samples...\n`);
  }

  for (const sample of samples) {
    const simulator = new GameProcessSimulator({
      playerName: sample.personaName,
      gender: sample.gender,
      simulateYears: sample.years,
      runUntilDeath: true,
      seed: sample.seed,
      choiceTendency: sample.choiceTendency,
      routeTrack: sample.routeTrack,
      verbose: false,
      enableAutoSave: false,
      enableManualSave: false,
      enableSaveRestore: false,
    });
    const report = await simulator.simulate();
    reports.push(report);
    if (!quiet) {
      console.log(`  ✓ ${sample.id} (seed=${sample.seed}) events=${report.totalEvents}`);
    }
  }

  return { reports, samples };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.skipSimulation) {
    console.error('--skip-simulation is not supported yet; run full sample simulation.');
    process.exitCode = 1;
    return;
  }

  const { reports, samples } = await runSamples(args.quiet);
  const gate = evaluateExperienceHealthGate(reports, args.waivers);
  const jsonPath = writeJsonOutput(
    gate,
    samples,
    reports.map(report => report.id),
  );

  console.log('\n=== Experience Health Gate ===');
  printSection('Blocking Metrics', gate.blockingMetrics);
  printSection('Warning Metrics', gate.warningMetrics);
  printSection('Info Metrics', gate.infoMetrics);
  console.log(`\nDecision: ${gate.decision.toUpperCase()}`);
  console.log(`Warnings failed (non-blocking): ${gate.warningsFailed}`);
  console.log(`JSON: ${path.relative(process.cwd(), jsonPath)}`);

  if (gate.decision === 'fail') {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error('[experience-gate] failed:', error);
  process.exitCode = 1;
});
