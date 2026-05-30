#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { GameProcessSimulator, type GameProcessReport } from '../tests/GameProcessSimulator';
import { evaluateSimulationGate, parseWaiverArg, type SimulationWaiver } from './gameplaySimulationGate';
import { printDiagnosticsToConsole } from './gameplaySimulationDiagnostics';
import {
  formatDeathCauseSummary,
  summarizeTopDeathCauses,
  type DeathRiskTelemetry,
} from './deathRiskTelemetry';

type CliArgs = {
  seed?: number;
  name?: string;
  gender?: 'male' | 'female';
  years?: number;
  startAge?: number;
  endAge?: number;
  choiceTendency?: 'balanced' | 'martial' | 'wealth' | 'relationship' | 'risk_averse';
  autoSaveMode?: 'age' | 'event';
  saveAgeInterval?: number;
  saveEventInterval?: number;
  disableSaveRestore: boolean;
  samples: boolean;
  quiet: boolean;
  gate: boolean;
  diagnostics: boolean;
  waivers: SimulationWaiver[];
};

type SimulationSample = {
  id: string;
  personaName: string;
  gender: 'male' | 'female';
  seed: number;
  choiceTendency: 'balanced' | 'martial' | 'wealth' | 'relationship' | 'risk_averse';
  years: number;
  routeTrack?: 'official' | 'beggars' | 'demonic';
};

export type { SimulationSample };

type SampleSummary = {
  sampleId: string;
  personaName: string;
  seed: number;
  choiceTendency: string;
  routeTrack?: string;
  origin: string;
  routeSummary: string[];
  routeLifecycleSummary: string[];
  endingSummary: string;
  choiceSummary: {
    totalChoices: number;
    totalEvents: number;
    choiceRate: string;
  };
  deathSummary: string;
  deathRiskTelemetry?: DeathRiskTelemetry | null;
  relationshipSummary: {
    spouse?: string;
    children: number;
    notableRelations: string[];
  };
  reportId: string;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { quiet: false, samples: false, gate: false, diagnostics: false, waivers: [], disableSaveRestore: false };
  for (const raw of argv) {
    if (raw.startsWith('--seed=')) {
      const seed = Number(raw.slice('--seed='.length));
      if (!Number.isNaN(seed)) {
        args.seed = Math.floor(seed);
      }
    } else if (raw.startsWith('--years=')) {
      const years = Number(raw.slice('--years='.length));
      if (!Number.isNaN(years)) {
        args.years = Math.floor(years);
      }
    } else if (raw.startsWith('--start-age=')) {
      const startAge = Number(raw.slice('--start-age='.length));
      if (!Number.isNaN(startAge)) {
        args.startAge = Math.floor(startAge);
      }
    } else if (raw.startsWith('--end-age=')) {
      const endAge = Number(raw.slice('--end-age='.length));
      if (!Number.isNaN(endAge)) {
        args.endAge = Math.floor(endAge);
      }
    } else if (raw.startsWith('--name=')) {
      args.name = raw.slice('--name='.length) || undefined;
    } else if (raw.startsWith('--gender=')) {
      const gender = raw.slice('--gender='.length);
      if (gender === 'male' || gender === 'female') {
        args.gender = gender;
      }
    } else if (raw.startsWith('--choice-tendency=')) {
      const tendency = raw.slice('--choice-tendency='.length);
      if (tendency === 'balanced' || tendency === 'martial' || tendency === 'wealth' || tendency === 'relationship' || tendency === 'risk_averse') {
        args.choiceTendency = tendency;
      }
    } else if (raw.startsWith('--auto-save-mode=')) {
      const mode = raw.slice('--auto-save-mode='.length);
      if (mode === 'age' || mode === 'event') {
        args.autoSaveMode = mode;
      }
    } else if (raw.startsWith('--save-age-interval=')) {
      const interval = Number(raw.slice('--save-age-interval='.length));
      if (!Number.isNaN(interval)) {
        args.saveAgeInterval = Math.floor(interval);
      }
    } else if (raw.startsWith('--save-event-interval=')) {
      const interval = Number(raw.slice('--save-event-interval='.length));
      if (!Number.isNaN(interval)) {
        args.saveEventInterval = Math.floor(interval);
      }
    } else if (raw === '--samples') {
      args.samples = true;
    } else if (raw === '--quiet') {
      args.quiet = true;
    } else if (raw === '--no-save-restore') {
      args.disableSaveRestore = true;
    } else if (raw === '--gate') {
      args.gate = true;
    } else if (raw === '--diagnostics') {
      args.diagnostics = true;
    } else if (raw.startsWith('--waive=')) {
      const waiverRaw = raw.slice('--waive='.length);
      args.waivers.push(parseWaiverArg(waiverRaw));
    }
  }

  return args;
}

const DEFAULT_SAMPLES: SimulationSample[] = [
  { id: 'martial-riser', personaName: '凌霄', gender: 'male', seed: 11, choiceTendency: 'martial', years: 85 },
  { id: 'merchant-weaver', personaName: '沈绫', gender: 'female', seed: 37, choiceTendency: 'wealth', years: 85 },
  { id: 'bond-keeper', personaName: '顾晚', gender: 'female', seed: 73, choiceTendency: 'relationship', years: 85 },
];

/** 路线专项样本：用于验证 route completion / 路线链推进（包 C） */
export const ROUTE_TRACK_SAMPLES: SimulationSample[] = [
  {
    id: 'official-track',
    personaName: '韩砚',
    gender: 'male',
    seed: 201,
    choiceTendency: 'balanced',
    years: 85,
    routeTrack: 'official',
  },
  {
    id: 'beggars-track',
    personaName: '步尘',
    gender: 'male',
    seed: 202,
    choiceTendency: 'martial',
    years: 85,
    routeTrack: 'beggars',
  },
  {
    id: 'demonic-track',
    personaName: '沈夜',
    gender: 'male',
    seed: 203,
    choiceTendency: 'risk_averse',
    years: 85,
    routeTrack: 'demonic',
  },
];

export function getGameplaySimulationSamples(includeRouteTracks = true): SimulationSample[] {
  if (!includeRouteTracks) {
    return [...DEFAULT_SAMPLES];
  }
  return [...DEFAULT_SAMPLES, ...ROUTE_TRACK_SAMPLES];
}

function resolveAgeRange(args: CliArgs): { startAge: number; endAge: number } | undefined {
  if (typeof args.startAge !== 'number' && typeof args.endAge !== 'number') {
    return undefined;
  }

  const startAge = Math.max(0, args.startAge ?? 0);
  const endAge = Math.min(120, args.endAge ?? 120);
  if (startAge > endAge) {
    throw new Error(`Invalid age range: start-age (${startAge}) > end-age (${endAge})`);
  }

  return { startAge, endAge };
}

function printSummary(report: GameProcessReport): void {
  const modeLabel = report.runMode === 'age_range'
    ? `Age range ${report.ageRange?.startAge}-${report.ageRange?.endAge}`
    : 'Complete life';
  const seedLabel = report.randomSeed === null ? 'random' : String(report.randomSeed);
  const choiceRate = report.totalEvents > 0
    ? ((report.totalChoices / report.totalEvents) * 100).toFixed(2)
    : '0.00';

  console.log('\n=== Gameplay Simulation Summary ===');
  console.log(`Mode: ${modeLabel}`);
  console.log(`Seed: ${seedLabel}`);
  console.log(`Final age: ${report.finalAge}`);
  console.log(`Outcome: ${report.isAlive ? 'alive' : (report.deathReason || 'ended')}`);
  console.log(`Total events: ${report.totalEvents}`);
  console.log(`Choice events: ${report.totalChoices} (${choiceRate}%)`);
  console.log(`Auto saves: ${report.totalSaves}`);
  console.log(`Auto loads: ${report.totalLoads}`);
  console.log(`Consistency checks: ${report.persistenceConsistency.passedChecks}/${report.persistenceConsistency.totalChecks}`);
  console.log(`Report JSON: public/reports/game-process-${report.id}.json`);
  console.log(`Report HTML: public/reports/game-process-${report.id}.html`);
}

function writeMachineReadableOutput(report: GameProcessReport): string {
  const outputDir = path.join(process.cwd(), 'public/reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `gameplay-simulation-summary-${report.id}.json`);
  const payload = {
    reportId: report.id,
    timestamp: report.timestamp,
    mode: report.runMode,
    ageRange: report.ageRange,
    randomSeed: report.randomSeed,
    finalAge: report.finalAge,
    isAlive: report.isAlive,
    deathReason: report.deathReason,
    deathRiskTelemetry: report.deathRiskTelemetry ?? null,
    totalEvents: report.totalEvents,
    totalChoices: report.totalChoices,
    totalSaves: report.totalSaves,
    totalLoads: report.totalLoads,
    persistenceConsistency: report.persistenceConsistency,
    statistics: report.statistics,
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  return outputPath;
}

function buildSampleSummary(sample: SimulationSample, report: GameProcessReport): SampleSummary {
  const finalState = report.records.length > 0 ? report.records[report.records.length - 1].gameState : undefined;
  const flags = report.statistics.flags || {};
  const routeSummary = Object.keys(flags)
    .filter(key => key.startsWith('route_'))
    .sort();
  const routeLifecycleSummary = finalState?.routeStates
    ? Object.entries(finalState.routeStates)
      .filter(([, state]) => state.lifecycle && state.lifecycle !== 'inactive')
      .map(([routeId, state]) => `${routeId}:${state.lifecycle}`)
      .sort()
    : [];
  const notableRelations = finalState?.relations
    ? Object.entries(finalState.relations)
      .filter(([_, value]) => typeof value === 'number' && value >= 40)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([name, value]) => `${name}:${value}`)
    : [];
  const choiceRate = report.totalEvents > 0
    ? `${((report.totalChoices / report.totalEvents) * 100).toFixed(2)}%`
    : '0.00%';

  return {
    sampleId: sample.id,
    personaName: sample.personaName,
    seed: sample.seed,
    choiceTendency: sample.choiceTendency,
    routeTrack: sample.routeTrack,
    origin: report.statistics.origin || 'unknown',
    routeSummary: routeSummary.length > 0 ? routeSummary : ['none'],
    routeLifecycleSummary: routeLifecycleSummary.length > 0 ? routeLifecycleSummary : ['none'],
    endingSummary: report.statistics.endingSummary || report.deathReason || '未触发结局',
    choiceSummary: {
      totalChoices: report.totalChoices,
      totalEvents: report.totalEvents,
      choiceRate,
    },
    deathSummary: report.deathReason || (report.isAlive ? '仍在世' : '结局结束'),
    deathRiskTelemetry: report.deathRiskTelemetry ?? null,
    relationshipSummary: {
      spouse: report.statistics.spouse,
      children: report.statistics.children || 0,
      notableRelations,
    },
    reportId: report.id,
  };
}

function printSampleSummary(sampleSummary: SampleSummary): void {
  console.log(`\n--- Sample ${sampleSummary.sampleId} (${sampleSummary.personaName}) ---`);
  console.log(`Origin: ${sampleSummary.origin}`);
  console.log(`Choice tendency: ${sampleSummary.choiceTendency}`);
  if (sampleSummary.routeTrack) {
    console.log(`Route track: ${sampleSummary.routeTrack}`);
  }
  console.log(`Route summary: ${sampleSummary.routeSummary.join(', ')}`);
  console.log(`Route lifecycle: ${sampleSummary.routeLifecycleSummary.join(', ')}`);
  console.log(`Ending summary: ${sampleSummary.endingSummary}`);
  console.log(`Choice summary: ${sampleSummary.choiceSummary.totalChoices}/${sampleSummary.choiceSummary.totalEvents} (${sampleSummary.choiceSummary.choiceRate})`);
  console.log(`Death summary: ${sampleSummary.deathSummary}`);
  if (sampleSummary.deathRiskTelemetry) {
    const telemetry = sampleSummary.deathRiskTelemetry;
    console.log(
      `Death telemetry: cause=${telemetry.deathCauseId} age=${telemetry.deathAge} ` +
        `warning=${telemetry.warningSatisfied} mitigation=${telemetry.mitigationAvailable}`,
    );
  }
  console.log(`Relationship summary: spouse=${sampleSummary.relationshipSummary.spouse || 'none'}, children=${sampleSummary.relationshipSummary.children}, notable=[${sampleSummary.relationshipSummary.notableRelations.join(', ') || 'none'}]`);
}

function writeSampleSetOutput(
  sampleSummaries: SampleSummary[],
  deathCauseSummary: ReturnType<typeof summarizeTopDeathCauses>,
): string {
  const outputDir = path.join(process.cwd(), 'public/reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `gameplay-simulation-samples-${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    sampleCount: sampleSummaries.length,
    deathCauseSummary,
    samples: sampleSummaries,
  }, null, 2), 'utf-8');
  return outputPath;
}

async function runSampleSet(args: CliArgs): Promise<void> {
  const reports: GameProcessReport[] = [];
  const summaries: SampleSummary[] = [];
  const samples = getGameplaySimulationSamples(true);
  console.log(`\nRunning ${samples.length} gameplay samples (${ROUTE_TRACK_SAMPLES.length} route-track)...\n`);
  for (const sample of samples) {
    const simulator = new GameProcessSimulator({
      playerName: sample.personaName,
      gender: sample.gender,
      simulateYears: sample.years,
      runUntilDeath: true,
      seed: sample.seed,
      choiceTendency: sample.choiceTendency,
      routeTrack: sample.routeTrack,
      autoSaveMode: args.autoSaveMode || 'age',
      saveAgeInterval: args.saveAgeInterval ?? 5,
      saveEventInterval: args.saveEventInterval ?? 10,
      enableSaveRestore: !args.disableSaveRestore,
      verbose: !args.quiet,
    });

    const report = await simulator.simulate();
    reports.push(report);
    writeMachineReadableOutput(report);
    const summary = buildSampleSummary(sample, report);
    summaries.push(summary);
    printSampleSummary(summary);
  }

  const deathSummary = summarizeTopDeathCauses(
    reports.map((report, index) => ({
      report,
      sampleId: summaries[index]?.sampleId,
    })),
  );
  const outputPath = writeSampleSetOutput(summaries, deathSummary);
  console.log(`\nSample set JSON: ${path.relative(process.cwd(), outputPath)}`);
  console.log('\n=== Death Cause Summary ===');
  for (const line of formatDeathCauseSummary(deathSummary)) {
    console.log(line);
  }
  if (args.diagnostics) {
    printDiagnosticsToConsole(reports);
  }
  if (args.gate) {
    const gate = evaluateSimulationGate(reports, args.waivers);
    printGateSummary(gate);
    if (gate.decision === 'fail') {
      process.exitCode = 1;
    }
  }
}

function printGateSummary(gate: ReturnType<typeof evaluateSimulationGate>): void {
  const printSection = (title: string, rows: ReturnType<typeof evaluateSimulationGate>['blockingMetrics']) => {
    console.log(`\n${title}`);
    for (const row of rows) {
      const status = row.status.toUpperCase();
      const waiverSuffix = row.waived ? ` [WAIVED: ${row.waiverReason}]` : '';
      console.log(`- ${row.key} (${row.severity}) => ${status}${waiverSuffix}`);
      console.log(`  ${row.detail}`);
    }
  };

  console.log('\n=== Simulation Gate ===');
  printSection('Blocking Metrics', gate.blockingMetrics);
  printSection('Warning Metrics', gate.warningMetrics);
  printSection('Info Metrics', gate.infoMetrics);
  console.log(`\nSimulation gate decision: ${gate.decision.toUpperCase()}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.samples) {
    await runSampleSet(args);
    return;
  }
  const ageRange = resolveAgeRange(args);

  const simulator = new GameProcessSimulator({
    playerName: args.name || '测试玩家',
    gender: args.gender || 'male',
    simulateYears: args.years ?? 80,
    runUntilDeath: !ageRange,
    ageRange,
    seed: args.seed,
    choiceTendency: args.choiceTendency || 'balanced',
    autoSaveMode: args.autoSaveMode || 'age',
    saveAgeInterval: args.saveAgeInterval ?? 5,
    saveEventInterval: args.saveEventInterval ?? 10,
    enableSaveRestore: !args.disableSaveRestore,
    verbose: !args.quiet,
  });

  const report = await simulator.simulate();
  const machineOutputPath = writeMachineReadableOutput(report);
  printSummary(report);
  if (args.diagnostics) {
    printDiagnosticsToConsole([report]);
  }
  if (args.gate) {
    const gate = evaluateSimulationGate([report], args.waivers);
    printGateSummary(gate);
    if (gate.decision === 'fail') {
      process.exitCode = 1;
    }
  }
  console.log(`Machine summary JSON: ${path.relative(process.cwd(), machineOutputPath)}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Gameplay simulation failed:', error);
    process.exit(1);
  });
}
