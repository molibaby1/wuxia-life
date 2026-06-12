#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { GameProcessSimulator } from '../tests/GameProcessSimulator';
import { P8_GATE_END_AGE } from '../src/p8/metricDefinitions';
import { getP8GatePersonas } from '../src/p8/personas';
import { buildPersonaRunMetrics, collectReplayMetrics } from '../src/p8/collectPersonaMetrics';
import { assemblePlayabilityReport } from '../src/p8/playabilityGate';
import { renderP8MarkdownReport } from '../src/p8/reportBuilder';
import { runHeadlessPersona } from '../src/headless/playability/headlessPersonaRunner';
import { adaptHeadlessRunToGameProcessReport } from '../src/headless/playability/adaptToGameProcessReport';
import type { P8PlayabilityRuntimePath } from '../src/p8/types';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');
const JSON_NAME = 'p8-playability-gate-latest.json';
const MD_NAME = 'p8-playability-gate-latest.md';
const DEFAULT_CATALOG_VERSION = '1.0.0';
const ENGINE_VERSION = 'p8-headless-gate';

type CliArgs = {
  quiet: boolean;
  mode: P8PlayabilityRuntimePath;
};

function parseArgs(argv: string[]): CliArgs {
  let mode: P8PlayabilityRuntimePath = 'headless_server';
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--mode' && argv[i + 1]) {
      const raw = argv[i + 1];
      if (raw === 'headless_server' || raw === 'local_direct') {
        mode = raw;
      } else {
        throw new Error(`Unknown --mode ${raw}; use headless_server or local_direct`);
      }
      i += 1;
    }
  }
  return { quiet: argv.includes('--quiet'), mode };
}

async function runLocalPersonaSimulation(persona: ReturnType<typeof getP8GatePersonas>[0]) {
  const simulator = new GameProcessSimulator({
    playerName: persona.name,
    gender: persona.gender,
    seed: persona.seed,
    choiceTendency: persona.choiceTendency,
    p8PersonaId: persona.id,
    simulateYears: P8_GATE_END_AGE,
    runUntilDeath: false,
    ageRange: { startAge: 0, endAge: P8_GATE_END_AGE },
    maxEvents: 200,
    enableAutoSave: false,
    enableManualSave: false,
    enableSaveRestore: false,
    verbose: false,
    sampleId: persona.id,
  });
  return simulator.simulate();
}

async function runHeadlessPersonaSimulation(persona: ReturnType<typeof getP8GatePersonas>[0]) {
  const result = await runHeadlessPersona({
    persona,
    endAge: P8_GATE_END_AGE,
    catalogVersion: DEFAULT_CATALOG_VERSION,
  });
  return adaptHeadlessRunToGameProcessReport(
    { persona, endAge: P8_GATE_END_AGE, catalogVersion: DEFAULT_CATALOG_VERSION },
    result,
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const personas = getP8GatePersonas();

  if (!args.quiet) {
    console.log(
      `P8 Playability Gate — ${personas.length} personas, age 0–${P8_GATE_END_AGE}, mode=${args.mode}`,
    );
  }

  const runs: Array<Awaited<ReturnType<typeof runLocalPersonaSimulation>> & { personaId: string }> = [];

  for (const persona of personas) {
    if (!args.quiet) {
      console.log(`\n▶ ${persona.id} (${persona.name}) seed=${persona.seed}`);
    }
    const report =
      args.mode === 'local_direct'
        ? await runLocalPersonaSimulation(persona)
        : await runHeadlessPersonaSimulation(persona);
    runs.push(Object.assign(report, { personaId: persona.id }));
    if (!args.quiet) {
      console.log(`  events=${report.totalEvents} choices=${report.totalChoices} age=${report.finalAge}`);
    }
  }

  const personaRuns = personas.map(persona => {
    const report = runs.find(r => r.personaId === persona.id)!;
    return buildPersonaRunMetrics(
      persona,
      report,
      report.p8ChoiceDiagnostics ?? [],
      report.p8ActiveActionReasons ?? [],
    );
  });

  const replay = collectReplayMetrics(
    runs.map(r => ({ personaId: r.personaId, report: r })),
  );

  const p8Report = assemblePlayabilityReport(personaRuns, replay, P8_GATE_END_AGE, {
    runtimePath: args.mode,
    catalogVersion: DEFAULT_CATALOG_VERSION,
    engineVersion: ENGINE_VERSION,
  });

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const jsonPath = path.join(REPORTS_DIR, JSON_NAME);
  const mdPath = path.join(REPORTS_DIR, MD_NAME);
  fs.writeFileSync(jsonPath, JSON.stringify(p8Report, null, 2), 'utf8');
  const relJson = path.relative(process.cwd(), jsonPath);
  fs.writeFileSync(mdPath, renderP8MarkdownReport(p8Report, relJson), 'utf8');

  if (!args.quiet) {
    console.log(`\nDecision: ${p8Report.decision.toUpperCase()}`);
    console.log(`Runtime: ${p8Report.runtimePath}`);
    console.log(`Blockers: ${p8Report.blockingFailures.length}`);
    console.log(`Warnings: ${p8Report.warnings.length}`);
    console.log(`JSON: ${jsonPath}`);
    console.log(`Markdown: ${mdPath}`);
  }

  process.exit(p8Report.decision === 'fail' ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
