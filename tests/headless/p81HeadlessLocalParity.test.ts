import { GameProcessSimulator } from '../GameProcessSimulator';
import { runHeadlessPersona } from '../../src/headless/playability/headlessPersonaRunner';
import { adaptHeadlessRunToGameProcessReport } from '../../src/headless/playability/adaptToGameProcessReport';
import { getP8PersonaById } from '../../src/p8/personas';

/** Parity tolerance per docs/designs/p8-1-headless-playability-gate.md */
const AGE_TOLERANCE = 2;
/** Headless phase loop yields more micro-steps per calendar year than local_direct annual model. */
const COUNT_RATIO_MAX = 8;

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function countRatioWithin(a: number, b: number, maxRatio: number): boolean {
  const hi = Math.max(a, b, 1);
  const lo = Math.max(Math.min(a, b), 1);
  return hi / lo <= maxRatio;
}

export async function runP81HeadlessLocalParityTest(): Promise<void> {
  const persona = getP8PersonaById('p8-martial-lin')!;
  const endAge = 20;

  const simulator = new GameProcessSimulator({
    playerName: persona.name,
    gender: persona.gender,
    seed: persona.seed,
    choiceTendency: persona.choiceTendency,
    p8PersonaId: persona.id,
    simulateYears: endAge,
    runUntilDeath: false,
    ageRange: { startAge: 0, endAge },
    maxEvents: 200,
    enableAutoSave: false,
    enableManualSave: false,
    enableSaveRestore: false,
    verbose: false,
    sampleId: persona.id,
  });
  const localReport = await simulator.simulate();

  const headlessResult = await runHeadlessPersona({
    persona,
    endAge,
    catalogVersion: '1.0.0',
    maxSteps: 600,
  });
  const headlessReport = adaptHeadlessRunToGameProcessReport(
    { persona, endAge, catalogVersion: '1.0.0' },
    headlessResult,
  );

  assert(
    Math.abs(localReport.finalAge - headlessReport.finalAge) <= AGE_TOLERANCE,
    `finalAge parity: local=${localReport.finalAge} headless=${headlessReport.finalAge} (tol ${AGE_TOLERANCE})`,
  );

  const localActions = localReport.records.filter(r => r.progressionKind === 'active_action').length;
  const headlessActions = headlessReport.records.filter(r => r.progressionKind === 'active_action').length;
  assert(
    countRatioWithin(localActions, headlessActions, COUNT_RATIO_MAX),
    `active action ratio: local=${localActions} headless=${headlessActions} (max ratio ${COUNT_RATIO_MAX})`,
  );

  assert(
    countRatioWithin(localReport.totalChoices, headlessReport.totalChoices, COUNT_RATIO_MAX),
    `choice ratio: local=${localReport.totalChoices} headless=${headlessReport.totalChoices}`,
  );

  assert(headlessResult.stoppedReason !== 'max_steps', 'headless path should not stall');
  assert(localActions >= 1 && headlessActions >= 1, 'both paths record active actions');
  assert(localReport.totalChoices >= 1 && headlessReport.totalChoices >= 1, 'both paths record choices');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP81HeadlessLocalParityTest()
    .then(() => console.log('p81HeadlessLocalParity.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
