import { runHeadlessPersona } from '../../src/headless/playability/headlessPersonaRunner';
import { getP8GatePersonas, getP8PersonaById } from '../../src/p8/personas';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export async function runP81HeadlessPersonaToAge20Test(): Promise<void> {
  const persona = getP8PersonaById('p8-martial-lin')!;
  const result = await runHeadlessPersona({
    persona,
    endAge: 20,
    catalogVersion: '1.0.0',
    maxSteps: 400,
  });

  assert(result.finalAge >= 20, `expected finalAge >= 20, got ${result.finalAge}`);
  assert(result.totalActiveActions >= 1, 'expected at least one active action');
  assert(result.totalChoices >= 1, 'expected at least one choice');
  assert(result.stoppedReason !== 'max_steps', 'runner should not hit max_steps guard');

  const summaryAckStreak = result.stepsExecuted;
  assert(summaryAckStreak > 0, 'steps executed');
}

export async function runP81HeadlessGatePersonasSmokeTest(): Promise<void> {
  const personas = getP8GatePersonas();
  for (const persona of personas) {
    const result = await runHeadlessPersona({
      persona,
      endAge: 40,
      catalogVersion: '1.0.0',
      maxSteps: 1200,
    });
    if (result.stoppedReason === 'max_steps') {
      throw new Error(`${persona.id} hit max_steps at age ${result.finalAge}`);
    }
    assert(result.finalAge >= 10, `${persona.id} stalled too early at age ${result.finalAge}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP81HeadlessPersonaToAge20Test()
    .then(() => runP81HeadlessGatePersonasSmokeTest())
    .then(() => console.log('p81HeadlessPersonaRunner.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
