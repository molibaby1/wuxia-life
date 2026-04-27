#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { GameProcessSimulator, type GameProcessReport } from '../tests/GameProcessSimulator';

type CliArgs = {
  seed?: number;
  name?: string;
  gender?: 'male' | 'female';
  years?: number;
  startAge?: number;
  endAge?: number;
  choiceTendency?: 'balanced' | 'martial' | 'wealth' | 'relationship' | 'risk_averse';
  samples: boolean;
  quiet: boolean;
};

type SimulationSample = {
  id: string;
  personaName: string;
  gender: 'male' | 'female';
  seed: number;
  choiceTendency: 'balanced' | 'martial' | 'wealth' | 'relationship' | 'risk_averse';
  years: number;
};

type SampleSummary = {
  sampleId: string;
  personaName: string;
  seed: number;
  choiceTendency: string;
  origin: string;
  routeSummary: string[];
  endingSummary: string;
  choiceSummary: {
    totalChoices: number;
    totalEvents: number;
    choiceRate: string;
  };
  deathSummary: string;
  relationshipSummary: {
    spouse?: string;
    children: number;
    notableRelations: string[];
  };
  reportId: string;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { quiet: false, samples: false };
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
    } else if (raw === '--samples') {
      args.samples = true;
    } else if (raw === '--quiet') {
      args.quiet = true;
    }
  }

  return args;
}

const DEFAULT_SAMPLES: SimulationSample[] = [
  { id: 'martial-riser', personaName: '凌霄', gender: 'male', seed: 11, choiceTendency: 'martial', years: 85 },
  { id: 'merchant-weaver', personaName: '沈绫', gender: 'female', seed: 37, choiceTendency: 'wealth', years: 85 },
  { id: 'bond-keeper', personaName: '顾晚', gender: 'female', seed: 73, choiceTendency: 'relationship', years: 85 },
];

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
    totalEvents: report.totalEvents,
    totalChoices: report.totalChoices,
    totalSaves: report.totalSaves,
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
    origin: report.statistics.origin || 'unknown',
    routeSummary: routeSummary.length > 0 ? routeSummary : ['none'],
    endingSummary: report.statistics.endingSummary || report.deathReason || '未触发结局',
    choiceSummary: {
      totalChoices: report.totalChoices,
      totalEvents: report.totalEvents,
      choiceRate,
    },
    deathSummary: report.deathReason || (report.isAlive ? '仍在世' : '结局结束'),
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
  console.log(`Route summary: ${sampleSummary.routeSummary.join(', ')}`);
  console.log(`Ending summary: ${sampleSummary.endingSummary}`);
  console.log(`Choice summary: ${sampleSummary.choiceSummary.totalChoices}/${sampleSummary.choiceSummary.totalEvents} (${sampleSummary.choiceSummary.choiceRate})`);
  console.log(`Death summary: ${sampleSummary.deathSummary}`);
  console.log(`Relationship summary: spouse=${sampleSummary.relationshipSummary.spouse || 'none'}, children=${sampleSummary.relationshipSummary.children}, notable=[${sampleSummary.relationshipSummary.notableRelations.join(', ') || 'none'}]`);
}

function writeSampleSetOutput(sampleSummaries: SampleSummary[]): string {
  const outputDir = path.join(process.cwd(), 'public/reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `gameplay-simulation-samples-${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    sampleCount: sampleSummaries.length,
    samples: sampleSummaries,
  }, null, 2), 'utf-8');
  return outputPath;
}

async function runSampleSet(args: CliArgs): Promise<void> {
  const summaries: SampleSummary[] = [];
  for (const sample of DEFAULT_SAMPLES) {
    const simulator = new GameProcessSimulator({
      playerName: sample.personaName,
      gender: sample.gender,
      simulateYears: sample.years,
      runUntilDeath: true,
      seed: sample.seed,
      choiceTendency: sample.choiceTendency,
      verbose: !args.quiet,
    });

    const report = await simulator.simulate();
    writeMachineReadableOutput(report);
    const summary = buildSampleSummary(sample, report);
    summaries.push(summary);
    printSampleSummary(summary);
  }

  const outputPath = writeSampleSetOutput(summaries);
  console.log(`\nSample set JSON: ${path.relative(process.cwd(), outputPath)}`);
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
    verbose: !args.quiet,
  });

  const report = await simulator.simulate();
  const machineOutputPath = writeMachineReadableOutput(report);
  printSummary(report);
  console.log(`Machine summary JSON: ${path.relative(process.cwd(), machineOutputPath)}`);
}

main().catch(error => {
  console.error('❌ Gameplay simulation failed:', error);
  process.exit(1);
});
