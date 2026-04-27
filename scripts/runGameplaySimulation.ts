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
  quiet: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { quiet: false };
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
    } else if (raw === '--quiet') {
      args.quiet = true;
    }
  }

  return args;
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

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const ageRange = resolveAgeRange(args);

  const simulator = new GameProcessSimulator({
    playerName: args.name || '测试玩家',
    gender: args.gender || 'male',
    simulateYears: args.years ?? 80,
    runUntilDeath: !ageRange,
    ageRange,
    seed: args.seed,
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
