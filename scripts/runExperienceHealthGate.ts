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
import {
  evaluateGoldenLineGates,
  type GoldenLineGateResult,
} from './goldenLineGate';
import { evaluateMidlifeGate } from './midlifeGate';
import { runAllP3EvalSimulations } from './goldenLineSimulation';
import type { P3EvalReportEntry } from './experienceHealthGate';
import { P3_EVAL_COHORT_LABEL } from './p3TrustTargets';

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

function printP3TrustMetrics(gate: ExperienceHealthGateResult): void {
  const p3Keys = new Set([
    'death_rate',
    'death_without_warning_count',
  ]);
  const p3Metrics = [
    ...gate.blockingMetrics,
    ...gate.warningMetrics,
    ...gate.infoMetrics,
  ].filter(metric => p3Keys.has(metric.key));

  console.log(`\n=== P3 Trust Gate (${P3_EVAL_COHORT_LABEL}, US-029) ===`);
  if (gate.p3EvalSampleCount) {
    console.log(`Samples: ${gate.p3EvalSampleCount} deterministic 0–50`);
  }
  for (const metric of p3Metrics) {
    console.log(`- ${metric.key} => ${metric.status.toUpperCase()}: ${metric.detail}`);
  }
}

function writeJsonOutput(
  gate: ExperienceHealthGateResult,
  samples: SimulationSample[],
  reportIds: string[],
  goldenLineGate: GoldenLineGateResult,
  midlifePass: boolean,
): string {
  const outputDir = path.join(process.cwd(), 'public/reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `experience-health-${Date.now()}.json`);
  const payload = {
    generatedAt: new Date().toISOString(),
    sampleCount: samples.length,
    p3EvalSampleCount: gate.p3EvalSampleCount ?? 0,
    p3TrustEnforced: gate.p3TrustEnforced ?? false,
    samples: samples.map(sample => ({
      id: sample.id,
      seed: sample.seed,
      routeTrack: sample.routeTrack ?? null,
    })),
    reportIds,
    decision: gate.decision,
    warningsFailed: gate.warningsFailed,
    goldenLinePass: goldenLineGate.pass,
    midlifePass,
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
    console.log(`\n[experience-gate] Running ${samples.length} P2-LEGACY gameplay samples...\n`);
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

async function runP3EvalSamples(quiet: boolean): Promise<{
  entries: P3EvalReportEntry[];
  runs: Awaited<ReturnType<typeof runAllP3EvalSimulations>>;
}> {
  if (!quiet) {
    console.log(`\n[experience-gate] Running ${P3_EVAL_COHORT_LABEL} deterministic 0–50 samples...\n`);
  }

  const runs = await runAllP3EvalSimulations();
  const entries: P3EvalReportEntry[] = runs.map(run => ({
    report: run.report,
    sampleId: run.sample.id,
  }));

  if (!quiet) {
    for (const run of runs) {
      console.log(
        `  ✓ ${run.sample.id} age=${run.report.finalAge} alive=${run.report.isAlive}`,
      );
    }
  }

  return { entries, runs };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.quiet) {
    process.env.WUXIA_ENGINE_QUIET = '1';
  }

  if (args.skipSimulation) {
    console.error('--skip-simulation is not supported yet; run full sample simulation.');
    process.exitCode = 1;
    return;
  }

  const { reports, samples } = await runSamples(args.quiet);
  const { entries: p3EvalEntries, runs: p3EvalRuns } = await runP3EvalSamples(args.quiet);
  const gate = evaluateExperienceHealthGate(reports, args.waivers, p3EvalEntries);
  const goldenLineGate = evaluateGoldenLineGates(p3EvalRuns);
  const midlifeGate = evaluateMidlifeGate(p3EvalRuns);
  const jsonPath = writeJsonOutput(gate, samples, reports.map(report => report.id), goldenLineGate, midlifeGate.pass);

  console.log('\n=== Experience Health Gate ===');
  printSection('Blocking Metrics', gate.blockingMetrics);
  printSection('Warning Metrics', gate.warningMetrics);
  printSection('Info Metrics', gate.infoMetrics);
  printP3TrustMetrics(gate);
  console.log(`\nDecision: ${gate.decision.toUpperCase()}`);
  console.log(`Warnings failed (non-blocking): ${gate.warningsFailed}`);
  console.log(`JSON: ${path.relative(process.cwd(), jsonPath)}`);

  console.log('\n=== Golden Line Sub-Gate (P3-EVAL 0–50) ===');
  console.log(`Decision: ${goldenLineGate.pass ? 'PASS' : 'FAIL'}`);
  console.log(`Active-scope blockers: ${goldenLineGate.activeScope.activeBlockerCount}`);
  console.log(`Feedback issues: ${goldenLineGate.feedbackIssueCount}`);
  const payoff = goldenLineGate.payoffEvaluation.summary;
  console.log(
    `Payoff: static=${(payoff.staticPayoffRate * 100).toFixed(1)}% simulated gaps=${payoff.missedOpportunityCount}`,
  );

  console.log('\n=== P3 Midlife Sub-Gate (US-024) ===');
  console.log(`Decision: ${midlifeGate.pass ? 'PASS' : 'FAIL'}`);
  console.log(`Priority routes checked: ${midlifeGate.simulations.length}`);

  const experienceFail = gate.decision === 'fail';
  const goldenFail = !goldenLineGate.pass;
  const midlifeFail = !midlifeGate.pass;

  if (experienceFail || goldenFail || midlifeFail) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error('[experience-gate] failed:', error);
  process.exitCode = 1;
});
