import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';
import { executeActiveActionOnState } from '../../src/core/activePlanning/ActivePlanningService';
import { SeededRandomSource } from '../../src/headless/adapters/randomSource';
import type { GameStateSnapshot } from '../../src/contracts/gameStateSnapshot';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function baseSnapshot(age: number): GameStateSnapshot {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: 'parity',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 1,
  });
  const snap = bootstrap.serialize();
  snap.state.player.age = age;
  return snap;
}

export async function runP72ActivePlanningParityTests(): Promise<void> {
  const actionIds = ['action_training_basic', 'action_study_basic', 'action_socializing_basic'];

  for (const actionId of actionIds) {
    const seed = 1000 + actionId.length;
    const snap = baseSnapshot(16);
    const rng = new SeededRandomSource(seed);
    const random = () => rng.next();

    const coreState = JSON.parse(JSON.stringify(snap.state));
    executeActiveActionOnState(coreState, actionId, { random, includeDisturbance: false });

    const headless = HeadlessEngineSessionImpl.create(
      { snapshot: JSON.parse(JSON.stringify(snap)) },
      { random: new SeededRandomSource(seed) },
    );
    await headless.executeActiveAction(actionId);
    const headlessState = headless.getRuntimeState();

    assert(
      coreState.player.externalSkill === headlessState.player.externalSkill,
      `externalSkill parity for ${actionId}`,
    );
    assert(
      coreState.player.comprehension === headlessState.player.comprehension,
      `comprehension parity for ${actionId}`,
    );
    assert(
      (coreState.actionHistory?.length ?? 0) === (headlessState.actionHistory?.length ?? 0),
      `history length parity for ${actionId}`,
    );
    assert(
      coreState.currentTime?.month === headlessState.currentTime?.month &&
        coreState.currentTime?.year === headlessState.currentTime?.year,
      `time parity for ${actionId}`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runP72ActivePlanningParityTests()
    .then(() => console.log('p72ActivePlanningParity.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
