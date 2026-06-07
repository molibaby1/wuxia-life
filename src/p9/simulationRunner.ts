import { GameProcessSimulator } from '../../tests/GameProcessSimulator';
import { P8_GATE_END_AGE } from '../p8/metricDefinitions';
import { getP8GatePersonas, getP8PersonaById } from '../p8/personas';
import { buildPersonaRunMetrics } from '../p8/collectPersonaMetrics';
import type { PersonaSimulationBundle } from './types';

export async function runPersonaSimulation(personaId: string) {
  const persona = getP8PersonaById(personaId);
  if (!persona) {
    throw new Error(`Unknown persona: ${personaId}`);
  }
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
  const metrics = buildPersonaRunMetrics(
    persona,
    report,
    report.p8ChoiceDiagnostics ?? [],
    report.p8ActiveActionReasons ?? [],
  );
  return { personaId: persona.id, report, records: report.records, metrics };
}

export async function runAllPersonaSimulations(): Promise<PersonaSimulationBundle[]> {
  const personas = getP8GatePersonas();
  const bundles: PersonaSimulationBundle[] = [];
  for (const persona of personas) {
    bundles.push(await runPersonaSimulation(persona.id));
  }
  return bundles;
}

export async function runPersonaSimulations(ids: string[]): Promise<PersonaSimulationBundle[]> {
  const bundles: PersonaSimulationBundle[] = [];
  for (const id of ids) {
    bundles.push(await runPersonaSimulation(id));
  }
  return bundles;
}
