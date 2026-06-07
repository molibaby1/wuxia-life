#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { GameProcessSimulator } from '../tests/GameProcessSimulator';
import { P8_GATE_END_AGE } from '../src/p8/metricDefinitions';
import { getP8GatePersonas } from '../src/p8/personas';
import { buildPersonaRunMetrics, collectReplayMetrics } from '../src/p8/collectPersonaMetrics';
import { assemblePlayabilityReport } from '../src/p8/playabilityGate';
import { renderP8MarkdownReport } from '../src/p8/reportBuilder';

const REPORTS_DIR = path.join(process.cwd(), 'docs/test-reports');
const JSON_NAME = 'p8-playability-gate-latest.json';
const MD_NAME = 'p8-playability-gate-latest.md';

type CliArgs = { quiet: boolean };

function parseArgs(argv: string[]): CliArgs {
  return { quiet: argv.includes('--quiet') };
}

async function runPersonaSimulation(persona: ReturnType<typeof getP8GatePersonas>[0]) {
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
  const report = await simulator.simulate();
  return report;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const personas = getP8GatePersonas();

  if (!args.quiet) {
    console.log(`P8 Playability Gate — ${personas.length} personas, age 0–${P8_GATE_END_AGE}`);
  }

  const runs: Array<Awaited<ReturnType<typeof runPersonaSimulation>> & { personaId: string }> = [];

  for (const persona of personas) {
    if (!args.quiet) {
      console.log(`\n▶ ${persona.id} (${persona.name}) seed=${persona.seed}`);
    }
    const report = await runPersonaSimulation(persona);
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

  const p8Report = assemblePlayabilityReport(personaRuns, replay, P8_GATE_END_AGE);

  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const jsonPath = path.join(REPORTS_DIR, JSON_NAME);
  const mdPath = path.join(REPORTS_DIR, MD_NAME);
  fs.writeFileSync(jsonPath, JSON.stringify(p8Report, null, 2), 'utf8');
  const relJson = path.relative(process.cwd(), jsonPath);
  fs.writeFileSync(mdPath, renderP8MarkdownReport(p8Report, relJson), 'utf8');

  if (!args.quiet) {
    console.log(`\nDecision: ${p8Report.decision.toUpperCase()}`);
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
