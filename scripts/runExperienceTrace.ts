#!/usr/bin/env tsx

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getP8GatePersonas, getP8PersonaById } from '../src/p8/personas';
import { runHeadlessPersona } from '../src/headless/playability/headlessPersonaRunner';
import type { ExperienceTrace } from '../src/headless/playability/experienceTraceTypes';
import type { P8Persona } from '../src/p8/types';
import type { SessionPhase } from '../src/headless/session/sessionTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), 'docs/test-reports/experience-traces');
const PHASES: SessionPhase[] = [
  'story_event',
  'active_planning',
  'passive_progression',
  'period_summary',
  'action_summary',
  'disturbance_narrative',
  'terminal',
];

interface CliArgs {
  personaId?: string;
  allPersonas: boolean;
  seed?: number;
  seedsPerPersona: number;
  endAge: number;
  outputDir: string;
  findPhase?: SessionPhase;
  quiet: boolean;
}

interface IndexEntry {
  persona: string;
  seed: number;
  finalAge: number;
  stoppedReason: string;
  choiceCount: number;
  activeActionCount: number;
  disturbanceCount: number;
  periodSummaryCount: number;
  outputPath: string;
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
  return value;
}

function parseInteger(value: string, flag: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`${flag} must be an integer`);
  return parsed;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    allPersonas: false,
    seedsPerPersona: 1,
    endAge: 40,
    outputDir: DEFAULT_OUTPUT_DIR,
    quiet: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    switch (flag) {
      case '--persona':
        args.personaId = requireValue(argv, index, flag);
        index += 1;
        break;
      case '--all-personas':
        args.allPersonas = true;
        break;
      case '--seed':
        args.seed = parseInteger(requireValue(argv, index, flag), flag);
        index += 1;
        break;
      case '--seeds-per-persona':
        args.seedsPerPersona = parseInteger(requireValue(argv, index, flag), flag);
        index += 1;
        break;
      case '--end-age':
        args.endAge = parseInteger(requireValue(argv, index, flag), flag);
        index += 1;
        break;
      case '--output-dir':
        args.outputDir = path.resolve(requireValue(argv, index, flag));
        index += 1;
        break;
      case '--find-phase': {
        const phase = requireValue(argv, index, flag) as SessionPhase;
        if (!PHASES.includes(phase)) throw new Error(`Unknown --find-phase ${phase}`);
        args.findPhase = phase;
        index += 1;
        break;
      }
      case '--quiet':
        args.quiet = true;
        break;
      default:
        throw new Error(`Unknown argument ${flag}`);
    }
  }

  if (args.personaId && args.allPersonas) {
    throw new Error('Use either --persona or --all-personas');
  }
  if (!args.personaId && !args.allPersonas) {
    throw new Error('Specify --persona <id> or --all-personas');
  }
  if (args.seedsPerPersona < 1) throw new Error('--seeds-per-persona must be at least 1');
  if (args.endAge < 1) throw new Error('--end-age must be at least 1');
  return args;
}

function relativeOutputPath(filePath: string): string {
  return path.relative(process.cwd(), filePath).split(path.sep).join('/');
}

function buildSeedList(persona: P8Persona, args: CliArgs): number[] {
  const firstSeed = args.seed ?? persona.seed;
  return Array.from({ length: args.seedsPerPersona }, (_, index) => firstSeed + index);
}

function indexEntry(trace: ExperienceTrace, outputPath: string): IndexEntry {
  return {
    persona: trace.persona.id,
    seed: trace.seed,
    finalAge: trace.finalState.player?.age ?? 0,
    stoppedReason: trace.stoppedReason,
    choiceCount: trace.steps.filter(step => step.choiceDecision).length,
    activeActionCount: trace.steps.filter(step => step.activeAction).length,
    disturbanceCount: trace.steps.filter(step => step.phaseBefore === 'disturbance_narrative').length,
    periodSummaryCount: trace.steps.filter(step => step.phaseBefore === 'period_summary').length,
    outputPath,
  };
}

async function runOne(persona: P8Persona, seed: number, args: CliArgs): Promise<IndexEntry> {
  const result = await runHeadlessPersona({
    persona,
    seed,
    endAge: args.endAge,
    catalogVersion: '1.0.0',
    experienceTrace: true,
  });
  if (!result.experienceTrace) throw new Error(`Trace was not returned for ${persona.id} seed ${seed}`);

  const fileName = `${persona.id}-seed-${seed}-age-${args.endAge}.json`;
  const filePath = path.join(args.outputDir, fileName);
  const outputPath = relativeOutputPath(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(result.experienceTrace, null, 2)}\n`, 'utf8');

  if (!args.quiet) {
    console.log(`${outputPath} age=${result.finalAge} stopped=${result.stoppedReason}`);
  }
  if (args.findPhase) {
    const matching = result.experienceTrace.steps.filter(
      step => step.phaseBefore === args.findPhase || step.phaseAfter === args.findPhase,
    );
    if (!args.quiet && matching.length > 0) {
      console.log(`  phase=${args.findPhase} steps=${matching.map(step => step.sequence).join(',')}`);
    }
  }
  return indexEntry(result.experienceTrace, outputPath);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const personas = args.allPersonas
    ? getP8GatePersonas()
    : [getP8PersonaById(args.personaId!)].filter((persona): persona is P8Persona => Boolean(persona));
  if (personas.length === 0) throw new Error(`Unknown persona ${args.personaId}`);

  fs.mkdirSync(args.outputDir, { recursive: true });
  const entries: IndexEntry[] = [];
  for (const persona of personas) {
    for (const seed of buildSeedList(persona, args)) {
      entries.push(await runOne(persona, seed, args));
    }
  }

  const isBatch = args.allPersonas || args.seedsPerPersona > 1;
  if (isBatch) {
    const indexPath = path.join(args.outputDir, 'experience-trace-index.json');
    fs.writeFileSync(indexPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
    if (!args.quiet) console.log(`${relativeOutputPath(indexPath)} entries=${entries.length}`);
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
